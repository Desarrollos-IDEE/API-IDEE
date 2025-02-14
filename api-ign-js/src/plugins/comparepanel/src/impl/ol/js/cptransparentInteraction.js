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

    this.freeze = optionsE.freeze;
    this.pos = optionsE.freezeInPosition;
    this.radius = (optionsE.radius || 100);
    this.OLVersion = 'OL6';

    const layer = [optionsE.layers].map((layer2) => layer2.getImpl().getOL3Layer())
      .filter((layer3) => layer3 != null);
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
          this.layers_[i].prerender = null;
          this.layers_[i].postcompose = null;
        } else {
          if (this.layers_[i].precompose) ol.Observable.unByKey(this.layers_[i].precompose);
          if (this.layers_[i].postcompose) ol.Observable.unByKey(this.layers_[i].postcompose);
          this.layers_[i].precompose = null;
          this.layers_[i].postcompose = null;
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
    const ctx = e.context;
    // const ratio = e.frameState.pixelRatio;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], this.radius, 0, 2 * Math.PI);

    ctx.lineWidth = 3;
    if (this.freeze) {
      ctx.strokeStyle = 'rgba(255,0,0,0.7)';
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    }
    ctx.stroke();
    ctx.clip();

    // ctx.save();
    // ctx.beginPath();
    // only show a circle around the mouse
    // const pointerPos = ol.render.getRenderPixel(e, [this.pos[0]],this.pos[1]);
    /* const offset = getRenderPixel(e, [
      mousePosition[0] + this.radius,
      mousePosition[1],
    ]);
    const canvasRadius = Math.sqrt(
      Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2)
    ); */
    // ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
    // ctx.lineWidth = (5 * canvasRadius) / radius;
    // ctx.strokeStyle = 'rgba(0,0,0,0.5)';

    // ctx.clip();
    // console.log(pointerPos);

    // Rectangle
    // var ctx = event.context;
    // var pixelRatio = event.frameState.pixelRatio;
    // ctx.save();
    // ctx.beginPath();
    // var x = ctx.canvas.width / 2 - 100;
    // var y = ctx.canvas.height / 2 - 100;
    // ctx.rect(x, y, 100, 100);
    // ctx.clip();

    // Heart

    // const ctx = event.context;
    // // calculate the pixel ratio and rotation of the canvas
    // const matrix = event.inversePixelTransform;
    // const canvasPixelRatio = Math.sqrt(
    //   matrix[0] * matrix[0] + matrix[1] * matrix[1]
    // );
    // const canvasRotation = -Math.atan2(matrix[1], matrix[0]);
    // ctx.save();
    // // center the canvas and remove rotation to position clipping
    // ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    // ctx.rotate(-canvasRotation);

    // ctx.scale(3 * canvasPixelRatio, 3 * canvasPixelRatio);
    // ctx.translate(-75, -80);
    // ctx.beginPath();
    // ctx.moveTo(75, 40);
    // ctx.bezierCurveTo(75, 37, 70, 25, 50, 25);
    // ctx.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
    // ctx.bezierCurveTo(20, 80, 40, 102, 75, 120);
    // ctx.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
    // ctx.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
    // ctx.bezierCurveTo(85, 25, 75, 37, 75, 40);
    // ctx.clip();
    // ctx.translate(75, 80);
    // ctx.scale(1 / 3 / canvasPixelRatio, 1 / 3 / canvasPixelRatio);

    // // reapply canvas rotation and position
    // ctx.rotate(canvasRotation);
    // ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
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
