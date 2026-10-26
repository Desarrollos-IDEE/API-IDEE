/** Local transaction journal for one bounded DataIDEE edit session. */
export default class DataIDEEEditingSession {
  constructor(layer, {
    features, capabilities, format, projection, limits, layerImpl, schema,
  }) {
    this.layer_ = layer;
    this.layerImpl_ = layerImpl;
    this.schema_ = schema;
    this.source_ = layerImpl.olLayer.getSource();
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
    this.listeners_ = new Set();
    this.onAdd_ = (event) => {
      try {
        this.record(event.feature, true);
      } catch (error) {
        this.replaying_ = true;
        this.source_.removeFeature(event.feature);
        this.replaying_ = false;
        this.notify_(error);
      }
    };
    this.onChange_ = (event) => {
      try {
        this.record(event.feature);
      } catch (error) {
        this.notify_(error);
      }
    };
    this.onRemove_ = (event) => this.remove(event.feature);
    this.onClear_ = (event) => (event.features || []).forEach((feature) => this.remove(feature));
    this.source_.on('addfeature', this.onAdd_);
    this.source_.on('changefeature', this.onChange_);
    this.source_.on('removefeature', this.onRemove_);
    this.source_.on('clear', this.onClear_);
  }

  serialize_(feature) {
    return this.format_.getImpl().writeFeatureObject(feature, {
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
        const restored = this.format_.getImpl().readFeature(JSON.stringify(previousDraft), {
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
    return this.source_.getFeatureById(key);
  }

  getFeatureKey_(feature) {
    const localKey = this.localIds_.get(feature);
    if (localKey) return localKey;
    const id = feature.getId();
    return id === undefined || id === null ? null : String(id);
  }

  record(feature) {
    if (this.replaying_) return this.pending_.size;
    let key = this.getFeatureKey_(feature);
    if (!key) {
      key = `new:${this.nextLocalId_}`;
      this.nextLocalId_ += 1;
      this.localIds_.set(feature, key);
    }
    if (this.saving_) {
      const fallback = this.pending_.get(key)?.current || this.original_.get(key);
      if (fallback) {
        const restored = this.format_.getImpl().readFeature(JSON.stringify(fallback), {
          featureProjection: this.projection_, dataProjection: 'EPSG:4326',
        });
        feature.setGeometry(restored.getGeometry());
      } else {
        this.replaying_ = true;
        this.source_.removeFeature(feature);
        this.replaying_ = false;
      }
      return this.pending_.size;
    }
    const original = this.original_.get(key);
    const current = this.serialize_(feature);
    this.validateCost_(key, current);
    if (original && this.equivalent_(original, current)) this.pending_.delete(key);
    else this.pending_.set(key, { type: original ? 'update' : 'create', feature, current });
    this.notify_();
    return this.pending_.size;
  }

  remove(feature) {
    if (this.replaying_) return this.pending_.size;
    if (this.saving_) {
      this.replaying_ = true;
      this.source_.addFeature(feature);
      this.replaying_ = false;
      return this.pending_.size;
    }
    const key = this.getFeatureKey_(feature);
    if (!key) return this.pending_.size;
    if (this.pending_.get(key)?.type === 'create') this.pending_.delete(key);
    else if (this.original_.has(key)) this.pending_.set(key, { type: 'delete', feature });
    this.currentCosts_.delete(key);
    this.notify_();
    return this.pending_.size;
  }

  get count() { return this.pending_.size; }

  get saving() { return this.saving_; }

  get requiresReview() { return this.uncertain_; }

  get state() {
    return { count: this.count, saving: this.saving_, requiresReview: this.uncertain_ };
  }

  subscribe(listener) {
    this.listeners_.add(listener);
    return () => this.listeners_.delete(listener);
  }

  notify_(error = null) {
    const state = { ...this.state, error };
    this.listeners_.forEach((listener) => listener(state));
  }

  prepareFeature(feature, values = {}) {
    const nativeFeature = feature?.getImpl?.().getFeature?.();
    if (!nativeFeature) throw new TypeError('A valid vector feature is required.');
    const required = this.schema_?.required || [];
    const properties = { ...feature.getAttributes?.(), ...values };
    delete properties.id;
    Object.entries(this.schema_?.properties || {}).forEach(([name, property]) => {
      if (name === 'id' || property.readOnly || property['x-ogc-role'] === 'primary-geometry') return;
      if (Object.hasOwn(properties, name) && properties[name] !== '') return;
      if (required.includes(name)) throw new Error(`'${name}' is required.`);
      delete properties[name];
    });
    const geometry = nativeFeature.getGeometry()?.getType()?.toLowerCase();
    if (this.capabilities_.geometryTypes?.length
      && !this.capabilities_.geometryTypes.includes(geometry)) {
      throw new Error(`Geometry type '${geometry}' is not supported by this collection.`);
    }
    if (this.capabilities_.clientAssignedId) {
      const idValue = values.id;
      if (idValue === undefined || idValue === '') throw new Error('An identifier is required.');
      if (this.capabilities_.idType === 'integer' && !/^-?\d+$/.test(String(idValue))) {
        throw new Error('A valid integer identifier is required.');
      }
      if (this.original_.has(String(idValue)) || [...this.pending_.values()].some((item) => (
        String(item.feature.getId()) === String(idValue)
      ))) throw new Error('That identifier is already in the editing area.');
      nativeFeature.setId(this.capabilities_.idType === 'integer' ? Number(idValue) : idValue);
    } else nativeFeature.setId(undefined);
    feature.setAttributes(properties);
    return feature;
  }

  discard() {
    this.replaying_ = true;
    try {
      this.pending_.forEach((change, key) => {
        const source = this.source_;
        if (change.type === 'create') source.removeFeature(change.feature);
        else if (change.type === 'delete') source.addFeature(change.feature);
        else {
          const serialized = JSON.stringify(this.original_.get(key));
          const originalFeature = this.format_.getImpl().readFeature(serialized, {
            featureProjection: this.projection_, dataProjection: 'EPSG:4326',
          });
          const target = change.feature || this.findFeature_(key);
          if (target) {
            const properties = originalFeature.getProperties();
            delete properties[originalFeature.getGeometryName()];
            target.setProperties(properties);
            target.setGeometry(originalFeature.getGeometry());
          }
        }
      });
      this.pending_.clear();
      this.currentCosts_.clear();
      this.original_.forEach((feature, key) => this.currentCosts_.set(key, this.cost_(feature)));
      return 0;
    } finally {
      this.replaying_ = false;
      this.notify_();
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
            this.replaying_ = true;
            change.feature.setId(serverId);
            if (saved.properties) change.feature.setProperties(saved.properties);
            this.replaying_ = false;
            committedKey = String(serverId);
            this.localIds_.set(change.feature, committedKey);
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
      this.notify_();
    }
  }

  destroy() {
    this.source_.un('addfeature', this.onAdd_);
    this.source_.un('changefeature', this.onChange_);
    this.source_.un('removefeature', this.onRemove_);
    this.source_.un('clear', this.onClear_);
    this.listeners_.clear();
  }
}
