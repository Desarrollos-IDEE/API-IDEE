/**
 * @module M/impl/control/TransparentInteraction

 */
export default class TransparentInteraction extends ol.interaction.Pointer {
  /**
   * @classdesc
   * Main constructor of the TransparentInteraction.
   *
   * @constructor
   * @extends {ol.interaction.Pointer}
   * @api stable
   */
  constructor(options) {
    super(options);
    this.layers_ = [];

    ol.interaction.Pointer.call(this, {
      handleDownEvent: this.setPosition,
      handleMoveEvent: this.setPosition,
    });

    // Default options
    const optionsE = options || {};

    this.pos = false;
    this.radius = (optionsE.radius || 100);

    if (optionsE.layers) {
      optionsE.layers = [optionsE.layers];
      const layer = optionsE.layers.map((l) => l.getImpl().getOL3Layer())
        .filter((la) => la != null);
      this.addLayer(layer);
    }
  }

  /** Set the map > start postcompose
   */
  setMap(map) {
    let i;
    if (this.getMap()) {
      for (i = 0; i < this.layers_.length; i += 1) {
        this.layers_[i].un(['precompose', 'prerender'], this.precompose_.bind(this));
        this.layers_[i].un(['postcompose', 'postrender'], this.postcompose_.bind(this));
      }
      this.getMap().renderSync();
    }

    ol.interaction.Pointer.prototype.setMap.call(this, map);

    if (map) {
      for (i = 0; i < this.layers_.length; i += 1) {
        this.layers_[i].precompose = this.layers_[i].on(['precompose', 'prerender'], this.precompose_.bind(this));
        this.layers_[i].postcompose = this.layers_[i].on(['postcompose', 'postrender'], this.postcompose_.bind(this));
      }
      map.renderSync();
    }
  }

  /** Set clip radius
   * @param {integer} radius
   */
  setRadius(radius) {
    this.radius = radius;
    if (this.getMap()) this.getMap().renderSync();
  }

  /** Add a layer to clip
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayer(layers) {
    let layersArr = layers;
    if (!(layersArr instanceof Array)) layersArr = [layersArr];
    for (let i = 0; i < layersArr.length; i += 1) {
      const l = { layer: layersArr[i] };
      if (this.getMap()) {
        l.precompose = layersArr[i].on(['precompose', 'prerender'], this.precompose_.bind(this));
        l.postcompose = layersArr[i].on(['postcompose', 'postrender'], this.postcompose_.bind(this));
        this.getMap().renderSync();
      }

      this.layers_.push(layersArr[i]);
    }
  }

  /** Remove a layer to clip
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  removeLayer(layers) {
    let layersArr = layers;
    if (!(layersArr instanceof Array)) layersArr = [layersArr];
    for (let i = 0; i < layersArr.length; i += 1) {
      let k;
      for (k = 0; k < this.layers_.length; k += 1) {
        if (this.layers_[k] === layersArr[i]) {
          break;
        }
      }
      if (k !== this.layers_.length && this.getMap()) {
        this.layers_[k].un(['precompose', 'prerender'], this.precompose_.bind(this));
        this.layers_[k].un(['postcompose', 'postrender'], this.postcompose_.bind(this));
        this.layers_.splice(k, 1);
        this.getMap().renderSync();
      }
    }
  }

  /** Set position of the clip
   * @param {ol.Pixel|ol.MapBrowserEvent}
   */
  setPosition(e) {
    if (e.pixel) {
      this.pos = e.pixel;
    }

    if (this.getMap()) this.getMap().renderSync();
  }

  /* @private
   */
  precompose_(e) {
    const ctx = e.context;
    const ratio = e.frameState.pixelRatio;

    ctx.save();
    ctx.beginPath();
    let pt = [this.pos[0], this.pos[1]];
    let radius = this.radius;
    const tr = e.inversePixelTransform;
    if (tr) {
      pt = [
        (pt[0] * tr[0] - pt[1] * tr[1] + tr[4]),
        (-pt[0] * tr[2] + pt[1] * tr[3] + tr[5]),
      ];
    } else {
      pt[0] *= ratio;
      pt[1] *= ratio;
      radius *= ratio;
    }

    ctx.arc(pt[0], pt[1], radius, 0, 2 * Math.PI);
    ctx.clip();
  }

  /* @private
   */
  postcompose_(e) {
    e.context.restore();
  }

  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
   */
  setActive(b) {
    super.setActive(b);
  }
}
