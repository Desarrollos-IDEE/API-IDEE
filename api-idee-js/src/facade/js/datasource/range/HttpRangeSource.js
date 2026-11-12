/**
 * Lectura de un fichero remoto por rangos HTTP.
 *
 * @module IDEE/datasource/range/HttpRangeSource
 */
import { ByteSource } from '../contracts';
import Exception from '../../exception/exception';
import { getValue } from '../../i18n/language';

/**
 * Tamaño de bloque predeterminado (4 KiB): la página SQLite más habitual. Las lecturas
 * simultáneas de bloques contiguos ya se agrupan en una petición, así que bloques mayores
 * solo traerían bytes que no se usan cuando las filas están dispersas.
 * @const
 * @type {Number}
 */
export const DEFAULT_BLOCK_SIZE = 4096;

/**
 * Límites del tamaño de bloque.
 * @const
 * @type {Array<Number>}
 */
const BLOCK_SIZE_LIMITS = [4096, 4194304];

/**
 * Lee un fichero remoto por bloques alineados con peticiones `Range: bytes=a-b`.
 *
 * - Los bloques que faltan se reúnen durante el ciclo de eventos en curso y se piden juntos:
 *   los contiguos, o separados por pocos bloques, en una sola petición.
 * - Las lecturas simultáneas comparten los bloques en vuelo.
 * - La primera petición comprueba si el servidor admite rangos; si responde 200 con el
 *   fichero completo, ese cuerpo se conserva y no se vuelve a pedir nada.
 * - Se cuentan las peticiones y los bytes recibidos y se aplica un tamaño máximo.
 */
class HttpRangeSource extends ByteSource {
  /**
   * @param {String} url URL http(s) del fichero.
   * @param {Object} [options] Opciones.
   * @param {Number} [options.blockSize=4096] Tamaño de bloque en bytes (4 KiB - 4 MiB).
   * @param {Number} [options.maxCachedBlocks=1024] Bloques que se conservan en memoria.
   * @param {Number} [options.mergeGap=1] Bloques de separación que se piden en la misma
   * petición en lugar de en dos.
   * @param {Number} [options.maxBytes=Infinity] Bytes que se pueden recibir en total.
   * @param {function(String, Object): Promise<Response>} [options.fetch] Descarga.
   */
  constructor(url, {
    blockSize = DEFAULT_BLOCK_SIZE,
    maxCachedBlocks = 1024,
    mergeGap = 1,
    maxBytes = Number.POSITIVE_INFINITY,
    fetch = (resource, init) => window.fetch(resource, init),
  } = {}) {
    super();
    const size = Number(blockSize);
    this.url_ = url;
    this.blockSize_ = Number.isInteger(size)
      ? Math.min(Math.max(size, BLOCK_SIZE_LIMITS[0]), BLOCK_SIZE_LIMITS[1]) : DEFAULT_BLOCK_SIZE;
    this.maxCachedBlocks_ = Math.max(1, maxCachedBlocks);
    this.mergeGap_ = Math.max(0, mergeGap);
    this.pending_ = new Map();
    this.flushTimer_ = null;
    this.maxBytes_ = maxBytes;
    this.fetch_ = fetch;
    this.blocks_ = new Map();
    this.full_ = null;
    this.probe_ = null;
    this.stats_ = { requests: 0, bytes: 0 };
  }

  /**
   * Indica si el servidor ha respondido con rangos. Solo es fiable tras la primera lectura.
   * @returns {Boolean} Verdadero si se lee por rangos.
   */
  isRangeSupported() {
    return this.full_ === null;
  }

  /**
   * Devuelve el fichero completo si el servidor lo ha enviado en lugar de un rango.
   * @returns {Uint8Array|null} Contenido completo o null.
   */
  getFullBody() {
    return this.full_;
  }

  /**
   * Devuelve las peticiones realizadas y los bytes recibidos.
   * @returns {{requests: Number, bytes: Number}} Estadísticas.
   */
  getStats() {
    return { ...this.stats_ };
  }

  /** Descarta los bloques guardados; las lecturas siguientes vuelven a pedirlos. */
  invalidate() {
    this.blocks_.clear();
  }

  dispose() {
    this.blocks_.clear();
    this.full_ = null;
  }

  /**
   * Lee un intervalo de bytes. Si el fichero termina antes, devuelve los disponibles.
   * @param {Number} offset Posición inicial.
   * @param {Number} length Número de bytes.
   * @returns {Promise<Uint8Array>} Bytes leídos.
   */
  async read(offset, length) {
    if (length <= 0) return new Uint8Array(0);
    await this.ensureProbe_();
    if (this.full_) return this.full_.subarray(offset, offset + length);
    const size = this.blockSize_;
    const first = Math.floor(offset / size);
    const last = Math.floor((offset + length - 1) / size);
    this.requestMissing_(first, last);
    const blocks = await Promise.all(Array.from(
      { length: last - first + 1 },
      (_, index) => this.getBlock_(first + index),
    ));
    if (this.full_) return this.full_.subarray(offset, offset + length);
    const result = new Uint8Array(length);
    let copied = 0;
    blocks.every((block, index) => {
      const blockStart = (first + index) * size;
      const from = Math.max(offset - blockStart, 0);
      const to = Math.min(offset + length - blockStart, block.length);
      if (to <= from) return false;
      result.set(block.subarray(from, to), blockStart + from - offset);
      copied = blockStart + to - offset;
      return block.length === size;
    });
    return copied === length ? result : result.subarray(0, copied);
  }

  /**
   * Realiza la primera petición (primer bloque) antes que ninguna otra.
   * @private
   * @returns {Promise<void>} Finalización de la comprobación.
   */
  ensureProbe_() {
    if (!this.probe_) {
      const request = this.fetchRange_(0, this.blockSize_ - 1);
      this.store_(0, request);
      this.probe_ = request.then(() => undefined, (error) => {
        this.probe_ = null;
        throw error;
      });
    }
    return this.probe_;
  }

  /**
   * Anota los bloques que no están guardados ni pendientes y programa su petición.
   * @private
   * @param {Number} first Primer bloque.
   * @param {Number} last Último bloque.
   */
  requestMissing_(first, last) {
    for (let index = first; index <= last; index += 1) {
      if (!this.blocks_.has(index) && !this.pending_.has(index)) {
        const deferred = {};
        const promise = new Promise((resolve, reject) => {
          deferred.resolve = resolve;
          deferred.reject = reject;
        });
        this.pending_.set(index, deferred);
        this.store_(index, promise);
      }
    }
    if (this.pending_.size > 0 && this.flushTimer_ === null) {
      this.flushTimer_ = setTimeout(() => this.flush_(), 0);
    }
  }

  /**
   * Pide los bloques pendientes agrupados en tramos.
   * @private
   */
  flush_() {
    this.flushTimer_ = null;
    const pending = this.pending_;
    this.pending_ = new Map();
    const runs = [];
    [...pending.keys()].sort((a, b) => a - b).forEach((index) => {
      const run = runs[runs.length - 1];
      if (run && index - run.end <= this.mergeGap_ + 1) {
        run.end = index;
      } else {
        runs.push({ start: index, end: index });
      }
    });
    const size = this.blockSize_;
    runs.forEach(({ start, end }) => {
      this.fetchRange_(start * size, ((end + 1) * size) - 1).then((bytes) => {
        for (let index = start; index <= end; index += 1) {
          const block = bytes.subarray((index - start) * size, (index - start + 1) * size);
          if (pending.has(index)) {
            pending.get(index).resolve(block);
          } else if (!this.blocks_.has(index) && block.length > 0) {
            this.store_(index, Promise.resolve(block));
          }
        }
      }, (error) => {
        for (let index = start; index <= end; index += 1) {
          pending.get(index)?.reject(error);
        }
      });
    });
  }

  /**
   * Guarda un bloque y descarta los menos usados.
   * @private
   * @param {Number} index Bloque.
   * @param {Promise<Uint8Array>} promise Contenido del bloque.
   */
  store_(index, promise) {
    promise.catch(() => {
      if (this.blocks_.get(index) === promise) this.blocks_.delete(index);
    });
    this.blocks_.set(index, promise);
    while (this.blocks_.size > this.maxCachedBlocks_) {
      this.blocks_.delete(this.blocks_.keys().next().value);
    }
  }

  /**
   * Devuelve un bloque guardado y lo marca como usado recientemente.
   * @private
   * @param {Number} index Bloque.
   * @returns {Promise<Uint8Array>} Contenido del bloque.
   */
  getBlock_(index) {
    let block = this.blocks_.get(index);
    if (!block) {
      this.requestMissing_(index, index);
      block = this.blocks_.get(index);
    } else {
      this.blocks_.delete(index);
      this.blocks_.set(index, block);
    }
    return block;
  }

  /**
   * Suma bytes recibidos y aplica el tamaño máximo.
   * @private
   * @param {Number} bytes Bytes recibidos.
   */
  account_(bytes) {
    this.stats_.bytes += bytes;
    if (this.stats_.bytes > this.maxBytes_) {
      Exception(getValue('exception').geopackage_size);
    }
  }

  /**
   * Pide un rango. Si el servidor envía el fichero completo, lo conserva.
   * @private
   * @param {Number} start Primer byte.
   * @param {Number} end Último byte (incluido).
   * @returns {Promise<Uint8Array>} Bytes del rango.
   */
  async fetchRange_(start, end) {
    if (this.full_) return this.full_.subarray(start, end + 1);
    this.stats_.requests += 1;
    let response;
    try {
      response = await this.fetch_(this.url_, { headers: { Range: `bytes=${start}-${end}` } });
    } catch (error) {
      Exception(getValue('exception').geopackage_range_network);
    }
    const declared = Number(response.headers?.get?.('Content-Length'));
    if (Number.isFinite(declared) && this.stats_.bytes + declared > this.maxBytes_) {
      Exception(getValue('exception').geopackage_size);
    }
    if (response.status === 206) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      this.account_(bytes.length);
      if (bytes.length > end - start + 1) {
        Exception(getValue('exception').geopackage_range_response);
      }
      return bytes;
    }
    if (response.status === 200) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      this.account_(bytes.length);
      this.full_ = bytes;
      this.blocks_.clear();
      return bytes.subarray(start, end + 1);
    }
    if (response.status === 416) {
      return new Uint8Array(0);
    }
    return Exception(`${getValue('exception').geopackage_response} (${response.status})`);
  }
}

export default HttpRangeSource;
