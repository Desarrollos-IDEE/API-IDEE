/**
 * @module IDEE/impl/control/LyrcompareInteraction

 */
import { clipRect, restoreClip, resetClip } from './layerClipper';

export default class LyrcompareInteraction extends ol.interaction.Pointer {
  /**
   * @classdesc
   * Main constructor of the LyrcompareInteraction.
   *
   * @constructor
   * @extends {ol.interaction.Pointer}
   * @api stable
   */
  constructor(options) {
    super(options);
    this.layers_ = [];
    this.swipeClicked = false;
    this.handleDownEvent = this.setPosition;
    this.handleUpEvent = () => { this.swipeClicked = false; };
    this.handleMoveEvent = this.setPosition;

    // Default options
    const optionsE = options || {};

    this.pos = false;
    this.opacityVal = (optionsE.opacityVal || 100);
    this.OLVersion = 'OL6';

    const layerA = [optionsE.lyrA]
      .map((layer) => layer.getImpl().getLayer()).filter((layer) => layer != null);
    this.addLayerA(layerA);

    const layerB = [optionsE.lyrB]
      .map((layer) => layer.getImpl().getLayer()).filter((layer) => layer != null);
    this.addLayerB(layerB);

    if (optionsE.lyrC) {
      const layerC = [optionsE.lyrC]
        .map((layer) => layer.getImpl().getLayer()).filter((layer) => layer != null);
      this.addLayerC(layerC);
    }

    if (optionsE.lyrD) {
      const layerD = [optionsE.lyrD]
        .map((layer) => layer.getImpl().getLayer()).filter((layer) => layer != null);
      this.addLayerD(layerD);
    }
  }

  /** Set the map > start postcompose
   */
  setMap(map) {
    if (this.getMap()) {
      // e2m: Por aquí pasamos al desactivar el control
      for (let i = 0; i < this.layers_.length; i += 1) {
        if (this.OLVersion === 'OL6') {
          if (this.layers_[i]) {
            if (this.layers_[i].prerender) ol.Observable.unByKey(this.layers_[i].prerender);
            if (this.layers_[i].postrender) ol.Observable.unByKey(this.layers_[i].postrender);

            // eslint-disable-next-line no-multi-assign
            this.layers_[i].prerender = this.layers_[i].postrender = null;
            resetClip(this.layers_[i]);
          }
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
      this.createSwipeControl();
      if (this.OLVersion === 'OL6') {
        if (this.layers_[0] !== undefined) {
          this.layers_[0].prerender = this.layers_[0].on('prerender', this.precomposeA_.bind(this));
          this.layers_[0].postrender = this.layers_[0].on('postrender', this.postcomposeA_.bind(this));
        }
        if (this.layers_[1] !== undefined) {
          this.layers_[1].prerender = this.layers_[1].on('prerender', this.precomposeB_.bind(this));
          this.layers_[1].postrender = this.layers_[1].on('postrender', this.postcomposeB_.bind(this));
        }
        if (this.layers_[2] !== undefined) {
          this.layers_[2].prerender = this.layers_[2].on('prerender', this.precomposeC_.bind(this));
          this.layers_[2].postrender = this.layers_[2].on('postrender', this.postcomposeC_.bind(this));
        }
        if (this.layers_[3] !== undefined) {
          this.layers_[3].prerender = this.layers_[3].on('prerender', this.precomposeD_.bind(this));
          this.layers_[3].postrender = this.layers_[3].on('postrender', this.postcomposeD_.bind(this));
        }
      } else {
        this.layers_[0].precompose = this.layers_[0].on('precompose', this.precomposeA_.bind(this));
        this.layers_[0].postcompose = this.layers_[0].on('postcompose', this.postcomposeA_.bind(this));
        this.layers_[1].precompose = this.layers_[1].on('precompose', this.precomposeB_.bind(this));
        this.layers_[1].postcompose = this.layers_[1].on('postcompose', this.postcomposeB_.bind(this));
        if (this.layers_[2] !== undefined && this.layers_[3] !== undefined) {
          this.layers_[2].precompose = this.layers_[2].on('precompose', this.precomposeC_.bind(this));
          this.layers_[2].postcompose = this.layers_[2].on('postcompose', this.postcomposeC_.bind(this));
          this.layers_[3].precompose = this.layers_[3].on('precompose', this.precomposeD_.bind(this));
          this.layers_[3].postcompose = this.layers_[3].on('postcompose', this.postcomposeD_.bind(this));
        }
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
        if (this.layers_[i] !== undefined) {
          this.layers_[i].setOpacity(this.opacityVal / 100);
        }
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
    // eslint-disable-next-line no-param-reassign
    if (!(layers instanceof Array)) layers = [layers];
    const l = { layer: layers[0] };
    if (this.getMap()) {
      l.prerender = layers[0].on('prerender', this.precomposeA_.bind(this));
      l.postrender = layers[0].on('postrender', this.postcomposeA_.bind(this));
      this.getMap().renderSync();
    }

    this.layers_.push(layers[0]);
  }

  /**
   * Add Layer B to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerB(layers) {
    // eslint-disable-next-line no-param-reassign
    if (!(layers instanceof Array)) layers = [layers];
    const l = { layer: layers[0] };
    if (this.getMap()) {
      l.prerender = layers[0].on('prerender', this.precomposeB_.bind(this));
      l.postrender = layers[0].on('postrender', this.postcomposeB_.bind(this));
      this.getMap().renderSync();
    }
    this.layers_.push(layers[0]);
  }

  /**
   * Add Layer C to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerC(layers) {
    // eslint-disable-next-line no-param-reassign
    if (!(layers instanceof Array)) layers = [layers];
    const l = { layer: layers[0] };
    if (this.getMap()) {
      l.prerender = layers[0].on('prerender', this.precomposeC_.bind(this));
      l.postrender = layers[0].on('postrender', this.postcomposeC_.bind(this));
      this.getMap().renderSync();
    }
    this.layers_.push(layers[0]);
  }

  /**
   * Add Layer D to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  addLayerD(layers) {
    // eslint-disable-next-line no-param-reassign
    if (!(layers instanceof Array)) layers = [layers];
    const l = { layer: layers[0] };
    if (this.getMap()) {
      l.prerender = layers[0].on('prerender', this.precomposeD_.bind(this));
      l.postrender = layers[0].on('postrender', this.postcomposeD_.bind(this));
      this.getMap().renderSync();
    }

    this.layers_.push(layers[0]);
  }

  /**
   *  Remove a layer to clip
   *
   * @param {ol.layer|Array<ol.layer>} layer to clip
   */
  removeLayer(layers) {
    if (!(layers instanceof Array)) {
      // eslint-disable-next-line no-param-reassign
      layers = [layers];
    }

    for (let i = 0; i < layers.length; i += 1) {
      let k;
      for (k = 0; k < this.layers_.length; k += 1) {
        if (this.layers_[k] === layers[i]) {
          break;
        }
      }

      if (k !== this.layers_.length && this.getMap()) {
        if (this.layers_[k].prerender) ol.Observable.unByKey(this.layers_[k].prerender);
        if (this.layers_[k].postrender) ol.Observable.unByKey(this.layers_[k].postrender);
        resetClip(this.layers_[k]);
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

      if (this.staticDivision === 2 && e.originalEvent.buttons !== 1) {
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

  /**
   * Rectángulo [x0, y0, x1, y1], en píxeles del mapa, visible de la capa
   * indicada según el modo de comparación y la división (estática o dinámica).
   * @private
   * @param {string} slot Capa: 'A', 'B', 'C' o 'D'.
   * @returns {Array<number>|null} Rectángulo visible.
   */
  getClipRect_(slot) {
    const [width, height] = this.map_.getSize();
    const cx = this.staticDivision === 1 ? width / 2 : this.pos[0];
    const cy = this.staticDivision === 1 ? height / 2 : this.pos[1];
    const rects = {
      1: { A: [0, 0, cx, height], B: [cx, 0, width, height] },
      2: { A: [0, 0, width, cy], B: [0, cy, width, height] },
      3: {
        A: [0, 0, cx, cy],
        B: [cx, 0, width, cy],
        C: [0, cy, cx, height],
        D: [cx, cy, width, height],
      },
    };
    return (rects[this.comparisonMode] || {})[slot] || null;
  }

  /* @private
   */
  precomposeA_(e) {
    clipRect(e, this.getClipRect_('A'));
  }

  /* @private
   */
  postcomposeA_(e) {
    restoreClip(e);
  }

  /* @private
   */
  precomposeB_(e) {
    clipRect(e, this.getClipRect_('B'));
  }

  /* @private
   */
  postcomposeB_(e) {
    restoreClip(e);
  }

  /* @private
   */
  precomposeC_(e) {
    clipRect(e, this.getClipRect_('C'));
  }

  /* @private
   */
  postcomposeC_(e) {
    restoreClip(e);
  }

  /* @private
   */
  precomposeD_(e) {
    clipRect(e, this.getClipRect_('D'));
  }

  /* @private
   */
  postcomposeD_(e) {
    restoreClip(e);
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

    // eslint-disable-next-line no-return-assign
    swipeControl.addEventListener('mousedown', () => this.swipeClicked = true);
    // eslint-disable-next-line no-return-assign
    swipeControl.addEventListener('mouseup', () => this.swipeClicked = false);
    // eslint-disable-next-line no-return-assign
    swipeControl.addEventListener('touchstart', () => this.swipeClicked = true);
    // eslint-disable-next-line no-return-assign
    swipeControl.addEventListener('touchend', () => this.swipeClicked = false);
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
