/** Local transaction journal for one bounded DataIDEE edit session. */
export default class DataIDEEEditingSession {
  constructor(layer, {
    features, capabilities, format, projection, limits,
  }) {
    this.layer_ = layer;
    this.capabilities_ = capabilities;
    this.format_ = format;
    this.projection_ = projection;
    this.limits_ = limits;
    this.original_ = new Map();
    this.pending_ = new Map();
    this.currentCosts_ = new Map();
    this.saving_ = false;
    this.uncertain_ = false;
    this.localIds_ = new WeakMap();
    this.nextLocalId_ = 1;
    this.replaying_ = false;
    features.forEach((feature) => {
      const id = feature.getId();
      if (id === undefined || id === null) throw new Error('A DataIDEE feature has no server identifier.');
      this.original_.set(String(id), this.serialize_(feature));
      this.currentCosts_.set(String(id), this.cost_(this.original_.get(String(id))));
    });
  }

  serialize_(feature) {
    return this.format_.writeFeatureObject(feature, {
      featureProjection: this.projection_, defaultDataProjection: 'EPSG:4326',
    });
  }

  stable_(value) {
    if (Array.isArray(value)) return value.map((item) => this.stable_(item));
    if (value && typeof value === 'object') {
      const sorted = {};
      Object.keys(value).sort().forEach((key) => {
        sorted[key] = this.stable_(value[key]);
      });
      return sorted;
    }
    return value;
  }

  equivalent_(left, right) {
    const data = (feature) => ({
      geometry: feature.geometry,
      properties: feature.properties || {},
    });
    return JSON.stringify(this.stable_(data(left))) === JSON.stringify(this.stable_(data(right)));
  }

  cost_(feature) {
    const coordinates = (value) => {
      if (!Array.isArray(value)) return 0;
      if (typeof value[0] === 'number') return 1;
      return value.reduce((sum, part) => sum + coordinates(part), 0);
    };
    const text = JSON.stringify(feature);
    return {
      coordinates: coordinates(feature.geometry?.coordinates),
      bytes: new Blob([text]).size,
    };
  }

  validateCost_(key, feature) {
    const nextCost = this.cost_(feature);
    const previous = this.currentCosts_.get(key) || { coordinates: 0, bytes: 0 };
    let coordinates = nextCost.coordinates;
    let bytes = nextCost.bytes;
    this.currentCosts_.forEach((cost, currentKey) => {
      if (currentKey !== key) {
        coordinates += cost.coordinates;
        bytes += cost.bytes;
      }
    });
    const featureCount = this.currentCosts_.size + (previous.bytes === 0 ? 1 : 0);
    if (featureCount > this.limits_.maxFeatures
      || coordinates > this.limits_.maxCoordinates || bytes > this.limits_.maxBytes) {
      const previousDraft = this.pending_.get(key)?.current || this.original_.get(key);
      if (previousDraft) {
        const restored = this.format_.readFeature(JSON.stringify(previousDraft), {
          featureProjection: this.projection_, dataProjection: 'EPSG:4326',
        });
        const featureRef = this.pending_.get(key)?.feature;
        (featureRef || this.findFeature_(key))?.setGeometry(restored.getGeometry());
      }
      throw new Error('La sesión supera sus límites. Deshaz este cambio o inicia otra zona de menor tamaño.');
    }
    this.currentCosts_.set(key, nextCost);
  }

  findFeature_(key) {
    return this.layer_.getImpl().getLayer().getSource().getFeatureById(key);
  }

  record(feature) {
    if (this.replaying_) return this.pending_.size;
    const id = feature.getId();
    let key = id === undefined || id === null ? this.localIds_.get(feature) : String(id);
    if (!key) {
      key = `new:${this.nextLocalId_}`;
      this.nextLocalId_ += 1;
      this.localIds_.set(feature, key);
    }
    if (this.saving_) {
      const fallback = this.pending_.get(key)?.current || this.original_.get(key);
      if (fallback) {
        const restored = this.format_.readFeature(JSON.stringify(fallback), {
          featureProjection: this.projection_, dataProjection: 'EPSG:4326',
        });
        feature.setGeometry(restored.getGeometry());
      } else {
        this.replaying_ = true;
        this.layer_.getImpl().getLayer().getSource().removeFeature(feature);
        this.replaying_ = false;
      }
      return this.pending_.size;
    }
    const original = this.original_.get(key);
    const current = this.serialize_(feature);
    this.validateCost_(key, current);
    if (original && this.equivalent_(original, current)) this.pending_.delete(key);
    else this.pending_.set(key, { type: original ? 'update' : 'create', feature, current });
    return this.pending_.size;
  }

  remove(feature) {
    if (this.replaying_) return this.pending_.size;
    if (this.saving_) {
      this.replaying_ = true;
      this.layer_.getImpl().getLayer().getSource().addFeature(feature);
      this.replaying_ = false;
      return this.pending_.size;
    }
    const id = feature.getId();
    const key = id === undefined || id === null ? this.localIds_.get(feature) : String(id);
    if (!key) return this.pending_.size;
    if (this.pending_.get(key)?.type === 'create') this.pending_.delete(key);
    else if (this.original_.has(key)) this.pending_.set(key, { type: 'delete', feature });
    this.currentCosts_.delete(key);
    return this.pending_.size;
  }

  get count() { return this.pending_.size; }

  get requiresReview() { return this.uncertain_; }

  discard() {
    this.replaying_ = true;
    try {
      this.pending_.forEach((change, key) => {
        const source = this.layer_.getImpl().getLayer().getSource();
        if (change.type === 'create') source.removeFeature(change.feature);
        else if (change.type === 'delete') source.addFeature(change.feature);
        else {
          const serialized = JSON.stringify(this.original_.get(key));
          const originalFeature = this.format_.readFeature(serialized, {
            featureProjection: this.projection_, dataProjection: 'EPSG:4326',
          });
          originalFeature.setId(change.feature.getId());
          source.removeFeature(change.feature);
          source.addFeature(originalFeature);
        }
      });
      this.pending_.clear();
      this.currentCosts_.clear();
      this.original_.forEach((feature, key) => this.currentCosts_.set(key, this.cost_(feature)));
      return 0;
    } finally {
      this.replaying_ = false;
    }
  }

  async save() {
    if (this.uncertain_) {
      throw new Error('Una escritura tiene resultado incierto. Recarga y revisa el servidor antes de continuar.');
    }
    if (this.saving_) throw new Error('DataIDEE save already in progress.');
    this.saving_ = true;
    const completed = [];
    try {
      // Sequential writes preserve a clear partial-success boundary on the first failure.
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, change] of this.pending_) {
        let committedKey = key;
        let committedFeature = change.current;
        if (change.type === 'create') {
          let result;
          try {
            // eslint-disable-next-line no-await-in-loop
            result = await this.layer_.createFeature(change.current);
          } catch (error) {
            if (!Number.isInteger(error.status) || error.status >= 500) this.uncertain_ = true;
            throw error;
          }
          this.layer_.clearCache();
          const saved = result.feature;
          const serverId = saved?.id ?? (saved?.properties?.id);
          if (serverId !== undefined && serverId !== null) {
            change.feature.setId(serverId);
            if (saved.properties) change.feature.setProperties(saved.properties);
            committedKey = String(serverId);
            committedFeature = saved;
            const cost = this.currentCosts_.get(key);
            this.currentCosts_.delete(key);
            if (cost) this.currentCosts_.set(committedKey, cost);
          } else {
            this.uncertain_ = true;
            throw new Error('The server accepted the create without returning a feature ID; '
              + 'review it before retrying.');
          }
        } else {
          const id = change.feature.getId();
          // eslint-disable-next-line no-await-in-loop
          const { feature: remote, etag } = await this.layer_.getEditingFeature(id);
          const original = this.original_.get(key);
          if (!this.equivalent_(remote, original)) {
            const error = new Error(`DataIDEE feature ${id} changed on the server.`);
            error.code = 'CONFLICT';
            throw error;
          }
          if (change.type === 'delete') {
            try {
              // eslint-disable-next-line no-await-in-loop
              await this.layer_.deleteFeature(id, etag);
            } catch (error) {
              if (!Number.isInteger(error.status) || error.status >= 500) this.uncertain_ = true;
              throw error;
            }
            this.layer_.clearCache();
          } else {
            // eslint-disable-next-line no-await-in-loop
            const update = this.layer_.updateFeature;
            const method = this.capabilities_.updateMethod;
            try {
              // eslint-disable-next-line no-await-in-loop
              await update.call(this.layer_, id, change.current, method, etag);
            } catch (error) {
              if (!Number.isInteger(error.status) || error.status >= 500) this.uncertain_ = true;
              throw error;
            }
            this.layer_.clearCache();
          }
        }
        completed.push(key);
        this.pending_.delete(key);
        if (change.type === 'delete') this.original_.delete(key);
        else this.original_.set(committedKey, committedFeature);
      }
      return { completed, pending: this.pending_.size };
    } finally {
      this.saving_ = false;
    }
  }
}
