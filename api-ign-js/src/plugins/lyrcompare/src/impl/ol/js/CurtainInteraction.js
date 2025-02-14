/**
 * @module M/impl/control/CurtainInteraction

 */
export default class CurtainInteraction extends ol.interaction.Pointer {
  /**
   * @classdesc
   * Main constructor of the CurtainInteraction.
   *
   * @constructor
   * @extends {ol.interaction.Pointer}
   * @api stable
   */
  constructor(options) {
    super(options);
    this.layers_ = [];

    this.swipeClicked = false;

    ol.interaction.Pointer.call(this, {
      handleDownEvent: this.setPosition,
      handleUpEvent: () => { this.swipeClicked = false; },
      handleMoveEvent: this.setPosition,
    });

    // Default options
    const optionsE = options || {};

    this.pos = false;
    this.opacityVal = (optionsE.opacityVal || 100);

    const layerA = [optionsE.lyrA].map((layer) => layer.getImpl().getOL3Layer())
      .filter((layer) => layer != null);
    this.addLayerA(layerA);

    const layerB = [optionsE.lyrB].map((layer) => layer.getImpl().getOL3Layer())
      .filter((layer) => layer != null);
    this.addLayerB(layerB);

    if (optionsE.lyrC !== undefined && optionsE.lyrD !== undefined) {
      const layerC = [optionsE.lyrC].map((layer) => layer.getImpl().getOL3Layer())
        .filter((layer) => layer != null);
      this.addLayerC(layerC);

      const layerD = [optionsE.lyrD].map((layer) => layer.getImpl().getOL3Layer())
        .filter((layer) => layer != null);
      this.addLayerD(layerD);
    }
  }

  /** Set the map > start postrender
   */

  setMap(map) {
    if (this.getMap()) {
      for (let i = 0; i < this.layers_.length; i += 1) {
        if (this.layers_[i].prerender) ol.Observable.unByKey(this.layers_[i].prerender);
        if (this.layers_[i].postrender) ol.Observable.unByKey(this.layers_[i].postrender);
        this.layers_[i].postrender = null;
        this.layers_[i].prerender = null;
      }
      this.getMap().renderSync();
    }
    ol.interaction.Pointer.prototype.setMap.call(this, map);
    if (map) {
      this.createSwipeControl();
      this.layers_[0].prerender = this.layers_[0].on('prerender', this.prerenderA_.bind(this));
      this.layers_[0].postrender = this.layers_[0].on('postrender', this.postrenderA_.bind(this));
      this.layers_[1].prerender = this.layers_[1].on('prerender', this.prerenderB_.bind(this));
      this.layers_[1].postrender = this.layers_[1].on('postrender', this.postrenderB_.bind(this));
      if (this.layers_[2] !== undefined && this.layers_[3] !== undefined) {
        this.layers_[2].prerender = this.layers_[2].on('prerender', this.prerenderC_.bind(this));
        this.layers_[2].postrender = this.layers_[2].on('postrender', this.postrenderC_.bind(this));
        this.layers_[3].prerender = this.layers_[3].on('prerender', this.prerenderD_.bind(this));
        this.layers_[3].postrender = this.layers_[3].on('postrender', this.postrenderD_.bind(this));
      }
      map.renderSync();
    }
  }

  /**
   * Set opacity level
   *
   * @param {integer} opacityVal
   */
  setOpacity(opacityVal) {
    this.opacityVal = opacityVal;
    if (this.getMap()) {
      for (let i = 0; i < this.layers_.length; i += 1) {
        this.layers_[i].setOpacity(this.opacityVal / 100);
      }
    }
  }

  /**
   * Set param staticDivision
   *
   * @param {integer} staticDivision
   */
  setStaticDivision(staticDivision) {
    this.staticDivision = staticDivision;
    this.updatePosition();
  }

  /**
   * Set param comparisonMode
   *
   * @param {integer} comparisonMode
   */
  setComparisonMode(comparisonMode) {
    this.comparisonMode = comparisonMode;
    this.updatePosition();
  }

  /**
   * Set Visibility on layers C & D
   *
   * @public
   * @function
   * @api stable
   */
  setVisibilityLayersCD() {
    if ((this.layers_[2] !== undefined && this.layers_[3] !== undefined)
      && (this.comparisonMode === 1 || this.comparisonMode === 2)) {
      this.layers_[2].setVisible(false);
      this.layers_[3].setVisible(false);
    } else if (this.layers_[2] !== undefined && this.layers_[3] !== undefined) {
      this.layers_[2].setVisible(true);
      this.layers_[3].setVisible(true);
    }
  }

  /**
   * Add Layer A to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerA(layers) {
    let layersCopy = layers;
    if (!(layersCopy instanceof Array)) layersCopy = [layersCopy];
    const l = {
      layer: layersCopy[0],
    };
    if (this.getMap()) {
      l.prerender = layersCopy[0].on('prerender', this.prerenderA_.bind(this));
      l.postrender = layersCopy[0].on('postrender', this.postrenderA_.bind(this));
      this.getMap().renderSync();
    }
    this.layers_.push(layersCopy[0]);
  }

  /**
   * Add Layer B to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerB(layers) {
    let layersCopy = layers;
    if (!(layersCopy instanceof Array)) layersCopy = [layersCopy];
    const l = {
      layer: layersCopy[0],
    };
    if (this.getMap()) {
      l.prerender = layersCopy[0].on('prerender', this.prerenderB_.bind(this));
      l.postrender = layersCopy[0].on('postrender', this.postrenderB_.bind(this));
      this.getMap().renderSync();
    }
    this.layers_.push(layersCopy[0]);
  }

  /**
   * Add Layer C to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerC(layers) {
    let layersCopy = layers;
    if (!(layersCopy instanceof Array)) layersCopy = [layersCopy];
    const l = {
      layer: layersCopy[0],
    };
    if (this.getMap()) {
      l.prerender = layersCopy[0].on('prerender', this.prerenderC_.bind(this));
      l.postrender = layersCopy[0].on('postrender', this.postrenderC_.bind(this));
      this.getMap().renderSync();
    }
    this.layers_.push(layersCopy[0]);
  }

  /**
   * Add Layer C to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerD(layers) {
    let layersCopy = layers;
    if (!(layersCopy instanceof Array)) layersCopy = [layersCopy];
    const l = {
      layer: layersCopy[0],
    };
    if (this.getMap()) {
      l.prerender = layersCopy[0].on('prerender', this.prerenderD_.bind(this));
      l.postrender = layersCopy[0].on('postrender', this.postrenderD_.bind(this));
      this.getMap().renderSync();
    }
    this.layers_.push(layersCopy[0]);
  }

  /**
   *  Remove a layer to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  removeLayer(layers) {
    let layersCopy = layers;
    if (!(layersCopy instanceof Array)) {
      layersCopy = [layersCopy];
    }
    for (let i = 0; i < layersCopy.length; i += 1) {
      let k;
      for (k = 0; k < this.layers_.length; k += 1) {
        if (this.layers_[k] === layersCopy[i]) {
          break;
        }
      }
      if (k !== this.layers_.length && this.getMap()) {
        if (this.layers_[k].prerender) ol.Observable.unByKey(this.layers_[k].prerender);
        if (this.layers_[k].postrender) ol.Observable.unByKey(this.layers_[k].postrender);
        this.layers_.splice(k, 1);
        this.getMap().renderSync();
      }
    }
  }

  /**
   *  Set position of the clip
   *
   * @param {ol.Pixel|ol.MapBrowserEvent}
   */
  setPosition(e) {
    if ((this.staticDivision === 2 && this.swipeClicked) || this.staticDivision !== 2) {
      if (e.pixel) {
        this.pos = e.pixel;
      } else if (e && e instanceof Array) {
        this.pos = e;
      } else {
        // eslint-disable-next-line no-param-reassign
        e = [-10000000, -10000000];
      }
      if (this.staticDivision === 2 && e.pointerEvent.buttons !== 1) {
        const lienzoMapa = this.map_.getSize();
        this.pos = [lienzoMapa[0] / 2, lienzoMapa[1] / 2];
        this.swipeClicked = false;
      }
      if (this.getMap()) this.getMap().renderSync();
      this.moveSwipeControl();
    }
  }

  /**
   *  Update position of the clip
   *
   */
  updatePosition() {
    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl) {
      if (this.comparisonMode === 1) {
        swipeControl.classList = `lyrcompare-swipe-control vertical${this.staticDivision === 1 ? ' static' : ' dynamic'}`;
      } else if (this.comparisonMode === 2) {
        swipeControl.classList = `lyrcompare-swipe-control horizontal${this.staticDivision === 1 ? ' static' : ' dynamic'}`;
      } else if (this.comparisonMode === 3) {
        swipeControl.classList = `lyrcompare-swipe-control vertical horizontal${this.staticDivision === 1 ? ' static' : ' dynamic'}`;
      }
    }
    if (this.getMap()) {
      const lienzoMapa = this.map_.getSize();
      swipeControl.style.left = `${(lienzoMapa[0] / 2) - (swipeControl.offsetWidth / 2)}px`;
      swipeControl.style.top = `${(lienzoMapa[1] / 2) - (swipeControl.offsetHeight / 2)}px`;
      this.pos = [lienzoMapa[0] / 2, lienzoMapa[1] / 2];
      this.swipeClicked = false;
      this.getMap().renderSync();
    }
  }

  /* @private
     */
  prerenderA_(e) {
    const ctx = e.context;
    const ratio = e.frameState.pixelRatio;
    const lienzoMapa = this.map_.getSize();
    const margenClip = 0; // Stroke size in pixels.
    // e2m: Canvas size --> lienzoMapa
    // e2m: Mouse coordinates --> this.pos
    ctx.save();
    ctx.beginPath();
    if (this.staticDivision === 1) {
      if (this.comparisonMode === 1) {
        ctx.rect(
          0,
          0,
          (lienzoMapa[0] / 2) * ratio - margenClip * ratio,
          lienzoMapa[1],
        ); // e2m: left fixed
      } else if (this.comparisonMode === 2) {
        ctx.rect(
          0,
          0,
          lienzoMapa[0],
          (lienzoMapa[1] * ratio) / 2 - margenClip * ratio,
        );// e2m: up fixed
      } else if (this.comparisonMode === 3) {
        ctx.rect(
          0,
          0,
          (lienzoMapa[0] / 2) * ratio - margenClip * ratio,
          lienzoMapa[1] / 2,
        );// e2m: up&left fixed
      }
    } else if (this.comparisonMode === 1) {
      ctx.rect(0, 0, this.pos[0] - margenClip * ratio, lienzoMapa[1]); // e2m: left dynamic
    } else if (this.comparisonMode === 2) {
      ctx.rect(0, 0, ctx.canvas.width, this.pos[1] * ratio - margenClip * ratio); // e2m: up dynamic
    } else if (this.comparisonMode === 3) {
      ctx.rect(
        0,
        0,
        this.pos[0] - margenClip * ratio,
        this.pos[1] - margenClip * ratio,
      ); // e2m: up&left dynamic
    }

    /**
     *
     * e2m: con esto podemos pintar una línea de color para contornear la capa. Pero no queda bien
     *
     */
    if (margenClip > 0) {
      ctx.lineWidth = 2 * margenClip * ratio;
      ctx.strokeStyle = 'rgba(0, 102, 204, 0.9)';
      ctx.stroke();
    }
    ctx.clip();
  }

  /* @private
   */
  postrenderA_(e) {
    e.context.restore();
  }

  /* @private
   */
  prerenderB_(e) {
    const ctx = e.context;
    const ratio = e.frameState.pixelRatio;
    const lienzoMapa = this.map_.getSize();
    const margenClip = 0; // Stroke size in pixels.
    // e2m: Canvas size --> lienzoMapa
    // e2m: Mouse coordinates --> this.pos
    ctx.save();
    ctx.beginPath();
    if (this.staticDivision === 1) {
      if (this.comparisonMode === 1) {
        ctx.rect(
          (lienzoMapa[0] * ratio) / 2 + margenClip * ratio,
          0,
          ctx.canvas.width - (lienzoMapa[0] * ratio) / 2,
          lienzoMapa[1],
        ); // e2m: Right fixed
      } else if (this.comparisonMode === 2) {
        ctx.rect(
          0,
          (lienzoMapa[1] * ratio) / 2 + margenClip * ratio,
          ctx.canvas.width,
          ctx.canvas.height - (lienzoMapa[1] * ratio) / 2,
        ); // e2m: Down fixed
      } else if (this.comparisonMode === 3) {
        ctx.rect(
          (lienzoMapa[0] * ratio) / 2,
          0,
          ctx.canvas.width - (lienzoMapa[0] * ratio) / 2,
          lienzoMapa[1] / 2,
        ); // e2m: up&right fixed
      }
    } else if (this.comparisonMode === 1) {
      ctx.rect(this.pos[0], 0, lienzoMapa[0] - this.pos[0], lienzoMapa[1]); // e2m: Right dynamic
    } else if (this.comparisonMode === 2) {
      ctx.rect(
        0,
        this.pos[1],
        ctx.canvas.width,
        ctx.canvas.height - this.pos[1],
      ); // e2m: Down dynamic
    } else if (this.comparisonMode === 3) {
      // ctx.rect(this.pos[0], 0,
      // lienzoMapa[0] - this.pos[0], lienzoMapa[1]); //e2m: split screen three. maybe
      ctx.rect(this.pos[0], 0, lienzoMapa[0] - this.pos[0], this.pos[1]); // e2m: up&right dynamic
    }
    if (margenClip > 0) {
      ctx.lineWidth = 2 * margenClip * ratio;
      ctx.strokeStyle = 'rgba(0, 102, 204, 0.9)';
      ctx.stroke();
    }
    ctx.clip();
  }

  /* @private
   */
  postrenderB_(e) {
    e.context.restore();
  }

  prerenderC_(e) {
    const ctx = e.context;
    const ratio = e.frameState.pixelRatio;
    const lienzoMapa = this.map_.getSize();
    const margenClip = 0; // Stroke size in pixels.
    // e2m: Canvas size --> lienzoMapa
    // e2m: Mouse coordinates --> this.pos

    ctx.save();
    ctx.beginPath();
    if (this.staticDivision === 1) {
      if (this.comparisonMode === 3) {
        ctx.rect(
          0,
          (lienzoMapa[1] * ratio) / 2,
          (lienzoMapa[0] / 2) * ratio - margenClip * ratio,
          lienzoMapa[1],
        ); // e2m: down&left fixed
      }
    } else if (this.comparisonMode === 3) {
      ctx.rect(
        0,
        this.pos[1] * ratio,
        this.pos[0] * ratio - margenClip * ratio,
        (lienzoMapa[1] - this.pos[1]) * ratio - margenClip * ratio,
      ); // e2m: down&left dynamic
    }
    if (margenClip > 0) {
      ctx.lineWidth = 2 * margenClip * ratio;
      ctx.strokeStyle = 'rgba(0, 102, 204, 0.9)';
      ctx.stroke();
    }
    ctx.clip();
  }

  /* @private
   */
  postrenderC_(e) {
    e.context.restore();
  }

  prerenderD_(e) {
    const ctx = e.context;
    const ratio = e.frameState.pixelRatio;
    const lienzoMapa = this.map_.getSize();
    const margenClip = 0; // Stroke size in pixels.
    // e2m: Canvas size --> lienzoMapa
    // e2m: Mouse coordinates --> this.pos

    ctx.save();
    ctx.beginPath();
    if (this.staticDivision === 1) {
      if (this.comparisonMode === 3) {
        ctx.rect(
          (lienzoMapa[0] * ratio) / 2,
          (lienzoMapa[1] * ratio) / 2,
          (ctx.canvas.width * ratio) / 2 - margenClip * ratio,
          (ctx.canvas.height * ratio) / 2 - margenClip * ratio,
        ); // e2m: down&right fixed
      }
    } else if (this.comparisonMode === 3) {
      ctx.rect(
        this.pos[0] * ratio,
        this.pos[1] * ratio,
        (ctx.canvas.width - this.pos[0]) * ratio - margenClip * ratio,
        (ctx.canvas.height - this.pos[1]) * ratio - margenClip * ratio,
      ); // e2m: down&right dynamic
    }
    if (margenClip > 0) {
      ctx.lineWidth = 2 * margenClip * ratio;
      ctx.strokeStyle = 'rgba(0, 102, 204, 0.9)';
      ctx.stroke();
    }
    ctx.clip();
  }

  /* @private
   */
  postrenderD_(e) {
    e.context.restore();
  }

  /**
   * Create the swipe indicator
   *
   */
  createSwipeControl() {
    let swipeControl;
    let swipeIcon;
    if (document.querySelector('.lyrcompare-swipe-control') === null) {
      swipeControl = document.createElement('div');
      swipeControl.classList.add('lyrcompare-swipe-control');
      swipeIcon = document.createElement('div');
      swipeIcon.classList.add('control-icon');
      swipeControl.append(swipeIcon);
      document.querySelector('.ol-overlaycontainer-stopevent').append(swipeControl);
    } else {
      swipeControl = document.querySelector('.lyrcompare-swipe-control');
      swipeIcon = document.querySelector('.lyrcompare-swipe-control .control-icon');
    }
    swipeControl.addEventListener('mousedown', () => { this.swipeClicked = true; });
    swipeControl.addEventListener('mouseup', () => { this.swipeClicked = false; });
    swipeControl.addEventListener('touchstart', () => { this.swipeClicked = true; });
    swipeControl.addEventListener('touchend', () => { this.swipeClicked = false; });
    this.updatePosition();
  }

  /**
  * Move the swipe indicator
  *
  */
  moveSwipeControl() {
    const lienzoMapa = this.map_.getSize();
    const swipeControl = document.querySelector('.lyrcompare-swipe-control');
    if (swipeControl && this.getMap()) {
      if (this.staticDivision === 0 || this.staticDivision === 2) {
        if (this.comparisonMode === 1) {
          swipeControl.style.top = `${(lienzoMapa[1] / 2) - (swipeControl.offsetHeight / 2)}px`;
          swipeControl.style.left = `${(this.pos[0]) - (swipeControl.offsetWidth / 2)}px`;
        } else if (this.comparisonMode === 2) {
          swipeControl.style.left = `${(lienzoMapa[0] / 2) - (swipeControl.offsetWidth / 2)}px`;
          swipeControl.style.top = `${(this.pos[1]) - (swipeControl.offsetHeight / 2)}px`;
        } else if (this.comparisonMode === 3) {
          swipeControl.style.left = `${(this.pos[0]) - (swipeControl.offsetWidth / 2)}px`;
          swipeControl.style.top = `${(this.pos[1]) - (swipeControl.offsetHeight / 2)}px`;
        }
      } else {
        swipeControl.style.left = `${(lienzoMapa[0] / 2) - (swipeControl.offsetWidth / 2)}px`;
        swipeControl.style.top = `${(lienzoMapa[1] / 2) - (swipeControl.offsetHeight / 2)}px`;
      }
    }
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
