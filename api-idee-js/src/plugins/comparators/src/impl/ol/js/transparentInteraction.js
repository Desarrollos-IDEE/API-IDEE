/**
 * @module IDEE/impl/control/TransparentInteraction

 */
import { clipCircle, restoreClip, resetClip } from './layerClipper';

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
    this.handleDownEvent = this.setPosition;
    this.handleMoveEvent = this.setPosition;

    // Default options
    const optionsE = options || {};

    this.freeze = optionsE.freeze;
    this.pos = optionsE.freezeInPosition;
    this.radius = (optionsE.radius || 100);
    this.OLVersion = 'OL6';

    const layer = [optionsE.layers]
    // eslint-disable-next-line no-shadow
      .map((layer) => layer.getImpl().getLayer()).filter((layer) => layer != null);
    this.addLayer(layer);
  }

  /** Set the map > start postcompose
   */
  setMap(map) {
    let i;

    if (this.getMap()) {
      // e2m: Por aquí pasamos al desactivar el control
      for (i = 0; i < this.layers_.length; i += 1) {
        if (this.OLVersion === 'OL6') {
          if (this.layers_[i].prerender) ol.Observable.unByKey(this.layers_[i].prerender);
          if (this.layers_[i].postrender) ol.Observable.unByKey(this.layers_[i].postrender);
          // eslint-disable-next-line no-multi-assign
          this.layers_[i].prerender = this.layers_[i].postcompose = null;
          resetClip(this.layers_[i]);
        } else {
          if (this.layers_[i].precompose) ol.Observable.unByKey(this.layers_[i].precompose);
          if (this.layers_[i].postcompose) ol.Observable.unByKey(this.layers_[i].postcompose);
          // eslint-disable-next-line no-multi-assign
          this.layers_[i].precompose = this.layers_[i].postcompose = null;
        }
      }
      this.getMap().renderSync();
    }

    ol.interaction.Pointer.prototype.setMap.call(this, map);
    if (map) {
      for (i = 0; i < this.layers_.length; i += 1) {
        if (this.OLVersion === 'OL6') {
          this.layers_[i].prerender = this.layers_[i].on('prerender', this.precompose_.bind(this));
          this.layers_[i].postrender = this.layers_[i].on('postrender', this.postcompose_.bind(this));
        } else {
          this.layers_[i].precompose = this.layers_[i].on('precompose', this.precompose_.bind(this));
          this.layers_[i].postcompose = this.layers_[i].on('postcompose', this.postcompose_.bind(this));
        }
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

  /** Set clip radius
  * @param {integer} radius
  */
  setFreeze(value) {
    this.freeze = value;
    if (this.getMap()) this.getMap().renderSync();
  }

  /** Set Freeze
   * @param {boolean} state
   */
  toogleFreeze() {
    this.freeze = !this.freeze;
    if (this.getMap()) this.getMap().renderSync();
  }

  /** Add a layer to clip
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayer(layers) {
    /* eslint-disable */
    if (!(layers instanceof Array)) layers = [layers];
    /* eslint-enable */
    for (let i = 0; i < layers.length; i += 1) {
      // e2m: deprecated. Esto no se usa ¿?
      const l = { layer: layers[i] };
      if (this.getMap()) {
        l.prerender = layers[i].on('prerender', this.precompose_.bind(this));
        l.postrender = layers[i].on('postrender', this.postcompose_.bind(this));
        this.getMap().renderSync();
      }

      this.layers_.push(layers[i]);
    }
  }

  /** Remove a layer to clip
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  removeLayer(layers) {
    /* eslint-disable */
    if (!(layers instanceof Array)) layers = [layers];
    /* eslint-enable */
    for (let i = 0; i < layers.length; i += 1) {
      let k;
      for (k = 0; k < this.layers_.length; k += 1) {
        if (this.layers_[k] === layers[i]) {
          break;
        }
      }

      if (k !== this.layers_.length && this.getMap()) {
        if (this.layers_[k].precompose) ol.Observable.unByKey(this.layers_[k].precompose);
        if (this.layers_[k].postcompose) ol.Observable.unByKey(this.layers_[k].postcompose);
        resetClip(this.layers_[k]);
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
      if (this.freeze === false) {
        this.pos = e.pixel;
      }
    } else if (e && e instanceof Array) {
      this.pos = e;
    } else {
      /* eslint-disable */
      e = [-10000000, -10000000];
      /* eslint-enable */
    }
    if (this.getMap()) this.getMap().renderSync();
  }

  /* @private
   */
  precompose_(e) {
    clipCircle(e, this.pos, this.radius, this.freeze ? 'rgba(255,0,0,0.7)' : 'rgba(0,0,0,0.5)');
  }

  /* @private
   */
  postcompose_(e) {
    restoreClip(e);
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
