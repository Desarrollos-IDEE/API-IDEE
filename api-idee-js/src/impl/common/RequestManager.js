const MAX_TIMEOUT_MS = 2147483647;
const DEFAULT_CACHE = Object.freeze({
  ttlMs: 60000,
  maxEntries: 32,
  maxBytes: 16777216,
});

/** Controlled cancellation, distinct from an execution or validation failure. */
export class RequestCancelledError extends Error {
  constructor(reason = 'superseded') {
    super(`Request cancelled: ${reason}.`);
    this.name = 'RequestCancelledError';
    this.reason = reason;
  }
}

/**
 * Internal cache, deduplicator and start-rate limiter, independent of transport and payload.
 * Values are shared without copying: consumers must treat them as immutable and perform
 * their own conversions outside the manager. Keys must identify equivalent executions,
 * including their validation and transport context.
 */
class RequestManager {
  constructor(options = {}) {
    this.options = RequestManager.normalizeOptions(options);
    this.cache = new Map();
    this.cacheBytes = 0;
    this.pending = new Map();
    this.inFlight = new Map();
    // Includes detached generations and unmanaged executions, so dispose settles all callers.
    this.active = new Set();
    this.timer = null;
    this.lastStartedAt = null;
    this.generation = 0;
    this.disposed = false;
  }

  static normalizeOptions(options = {}) {
    const cache = options.cache;
    let normalizedCache = null;
    if (cache === true || (cache && typeof cache === 'object' && !Array.isArray(cache))) {
      normalizedCache = {
        ttlMs: cache === true || cache.ttlMs === undefined ? DEFAULT_CACHE.ttlMs : cache.ttlMs,
        maxEntries: cache === true || cache.maxEntries === undefined
          ? DEFAULT_CACHE.maxEntries : cache.maxEntries,
        maxBytes: cache === true || cache.maxBytes === undefined
          ? DEFAULT_CACHE.maxBytes : cache.maxBytes,
      };
      Object.entries(normalizedCache).forEach(([name, value]) => {
        const maximum = name === 'ttlMs' ? MAX_TIMEOUT_MS : Number.MAX_SAFE_INTEGER;
        if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
          throw new TypeError(`RequestManager cache ${name} must be a positive safe integer no greater than ${maximum}.`);
        }
      });
    } else if (cache !== undefined && cache !== false) {
      throw new TypeError('RequestManager cache must be false, true, or a configuration object.');
    }

    const throttleMs = options.throttleMs === undefined ? 0 : options.throttleMs;
    if (!Number.isSafeInteger(throttleMs) || throttleMs < 0 || throttleMs > MAX_TIMEOUT_MS) {
      throw new TypeError(`RequestManager throttleMs must be a non-negative safe integer no greater than ${MAX_TIMEOUT_MS}.`);
    }
    const pendingPolicy = options.pendingPolicy === undefined ? 'all' : options.pendingPolicy;
    if (pendingPolicy !== 'all' && pendingPolicy !== 'latest') {
      throw new TypeError('RequestManager pendingPolicy must be all or latest.');
    }
    return { cache: normalizedCache, throttleMs, pendingPolicy };
  }

  /**
   * @template T
   * @param {Object} request Operation descriptor.
   * @param {string} request.key Exact identity supplied by the consumer.
   * @param {function({force: boolean}): Promise<{value: T, cacheable: boolean, bytes: number}>}
   * request.execute Executes and validates the result before resolving; bytes is its retained size.
   * @param {boolean} [request.force=false] Bypass stored values and share a fresh execution.
   * @returns {Promise<T>} A shared value, or a rejection on failure/cancellation.
   */
  request({ key, execute, force = false }) {
    if (this.disposed) return Promise.reject(new RequestCancelledError('disposed'));
    if (!this.options.cache && this.options.throttleMs === 0) {
      const operation = this.createOperation_(key, execute, force);
      this.start_(operation, false);
      return operation.promise;
    }

    if (this.options.pendingPolicy === 'latest') {
      this.pending.forEach((operation, pendingKey) => {
        if (pendingKey !== key) {
          this.cancel_(operation, 'superseded');
          this.pending.delete(pendingKey);
        }
      });
      if (this.pending.size === 0) this.clearTimer_();
    }

    const pending = this.pending.get(key);
    const active = this.inFlight.get(key);
    if (pending && (force || pending.force)) {
      if (force && !pending.force) {
        pending.force = true;
        pending.execute = execute;
      }
      return pending.promise;
    }
    if (active?.force) return active.promise;
    if (!force) {
      const cached = this.getCached_(key);
      if (cached) return Promise.resolve(cached.value);
      if (pending) return pending.promise;
      if (active) return active.promise;
    }

    const operation = this.createOperation_(key, execute, force);
    this.pending.set(key, operation);
    this.schedule_();
    return operation.promise;
  }

  createOperation_(key, execute, force) {
    const operation = {
      key, execute, force, generation: this.generation, settled: false,
    };
    operation.promise = new Promise((resolve, reject) => {
      operation.resolve = (value) => {
        operation.settled = true;
        resolve(value);
      };
      operation.reject = (error) => {
        operation.settled = true;
        reject(error);
      };
    });
    return operation;
  }

  schedule_() {
    if (this.timer !== null || this.disposed) return;
    // Preserve arrival order among runnable operations. A fresh execution waits only
    // for its own key; unrelated operations can start while that request is in flight.
    this.pending.forEach((operation) => {
      if (this.timer === null && !this.inFlight.has(operation.key)) {
        const cached = !operation.force && this.getCached_(operation.key);
        if (cached) {
          this.pending.delete(operation.key);
          operation.resolve(cached.value);
        } else {
          const remaining = this.lastStartedAt === null ? 0
            : this.options.throttleMs - (performance.now() - this.lastStartedAt);
          if (remaining > 0) {
            this.timer = setTimeout(() => {
              this.timer = null;
              this.schedule_();
            }, remaining);
            return;
          }
          this.pending.delete(operation.key);
          this.start_(operation, true);
        }
      }
    });
  }

  start_(operation, managed) {
    this.active.add(operation);
    if (managed) {
      this.inFlight.set(operation.key, operation);
      this.lastStartedAt = performance.now();
    }
    Promise.resolve().then(() => {
      if (operation.settled) throw new RequestCancelledError('disposed');
      return operation.execute({ force: operation.force });
    }).then((result) => {
      if (!operation.settled) {
        if (!result || typeof result.cacheable !== 'boolean'
          || !Number.isSafeInteger(result.bytes) || result.bytes < 0) {
          throw new TypeError('RequestManager requires a result with cacheable and non-negative integer bytes.');
        }
        if (managed && operation.generation === this.generation && !this.disposed) {
          this.putCached_(operation.key, result);
        }
      }
      return result;
    }).then(
      (result) => this.finish_(operation, result?.value),
      (error) => this.finish_(operation, error, true),
    );
  }

  finish_(operation, value, failed = false) {
    this.active.delete(operation);
    if (this.inFlight.get(operation.key) === operation) this.inFlight.delete(operation.key);
    if (!operation.settled) {
      if (failed) operation.reject(value);
      else operation.resolve(value);
    }
    this.schedule_();
  }

  getCached_(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= performance.now()) {
      this.deleteCached_(key);
      return null;
    }
    // Map insertion order represents recency without sorting or scanning on each hit.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  putCached_(key, { value, cacheable, bytes }) {
    if (!this.options.cache) return;
    this.deleteCached_(key);
    const { maxBytes, maxEntries, ttlMs } = this.options.cache;
    if (!cacheable || bytes > maxBytes) return;
    const now = performance.now();
    this.cache.forEach((entry, entryKey) => {
      if (entry.expiresAt <= now) this.deleteCached_(entryKey);
    });
    while (this.cache.size >= maxEntries || this.cacheBytes + bytes > maxBytes) {
      this.deleteCached_(this.cache.keys().next().value);
    }
    this.cache.set(key, { value, bytes, expiresAt: now + ttlMs });
    this.cacheBytes += bytes;
  }

  deleteCached_(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.cacheBytes -= entry.bytes;
      this.cache.delete(key);
    }
  }

  cancel_(operation, reason) {
    if (!operation.settled) {
      operation.reject(new RequestCancelledError(reason));
    }
  }

  clearTimer_() {
    clearTimeout(this.timer);
    this.timer = null;
  }

  /** Invalidate reuse without interrupting consumers of already dispatched operations. */
  clearCache() {
    this.cache.clear();
    this.cacheBytes = 0;
    this.generation += 1;
    this.clearTimer_();
    this.pending.forEach((operation) => this.cancel_(operation, 'invalidated'));
    this.pending.clear();
    this.inFlight.clear();
  }

  /** Logical cancellation only; the injected transport owns any physical abort mechanism. */
  dispose() {
    this.disposed = true;
    this.clearCache();
    this.active.forEach((operation) => this.cancel_(operation, 'disposed'));
    this.active.clear();
  }
}

export default RequestManager;
