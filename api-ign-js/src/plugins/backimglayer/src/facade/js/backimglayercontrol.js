/**
 * @module M/control/BackImgLayerControl
 */

import template from '../../templates/backimglayer';
import { getValue } from './i18n/language';

/**
 * This parameter indicates the maximum base layers of plugin
 *
 * @type {number}
 * @const
 * @private
 */
// const MAXIMUM_LAYERS = 5;

/**
 * @classdesc
 * Background layers selector Mapea control.
 * This control puts a set of layers in the background of the map.
 */
export default class BackImgLayerControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor({
    map,
    visible,
    layerOpts,
    layerId: idLayer,
    ids,
    titles,
    previews,
    layers,
    numColumns,
    empty,
    order,
  }) {
    const impl = new M.impl.Control();
    let numColumnsV;
    super(impl, 'BackImgLayer');
    map.getBaseLayers().forEach((layer) => {
      layer.on(M.evt.LOAD, map.removeLayers(layer));
    });
    this.layers = [];

    map._plugins.filter((element) => {
      /* eslint no-underscore-dangle: 0 */
      return (map._plugins[map._plugins.indexOf(element)].name === 'backimglayer');
    }).map((element) => {
      numColumnsV = numColumns;
      return numColumnsV;
    });

    if (layerOpts !== undefined) {
      const layerOptsModified = layerOpts;

      layerOpts.filter((element) => {
        /* eslint no-underscore-dangle: 0 */
        return (((layerOpts.indexOf(element)) !== 0)
          && (layerOpts.indexOf(element) % (numColumnsV) === 0));
      }).map((element) => {
        const elementIndex = layerOpts.indexOf(element);

        const temp = { ...element };
        temp.firstElement = true;
        layerOptsModified[elementIndex] = temp;
        return temp;
      });
      // Array<Object> => Object: { id, title, preview, Array<MapeaLayer>}
      this.layers = layerOptsModified.slice(0);
    } else {
      const idsArray = ids.split(',');
      const titlesArray = titles.split(',');
      const previewArray = previews.split(',');
      const layersArray = layers.split(',');
      layersArray.forEach((baseLayer, idx) => {
        let backgroundLayers = baseLayer.split('sumar');

        backgroundLayers = backgroundLayers.map((urlLayer) => {
          let aux = null;
          if (/QUICK.*/.test(urlLayer)) {
            aux = M.getQuickLayers(urlLayer.replace('QUICK*', ''));
          }
          let mapeaLayer;
          if (!M.utils.isNullOrEmpty(aux)) {
            mapeaLayer = aux;
            if (typeof mapeaLayer === 'string') {
              mapeaLayer = new M.layer.WMTS(mapeaLayer);
            }
          } else {
            mapeaLayer = new M.layer.WMTS(urlLayer);
          }
          return mapeaLayer;
        });

        const mapeaLyrsObject = {
          id: idsArray[idx],
          title: titlesArray[idx],
          preview: previewArray[idx],
          layers: backgroundLayers,
        };
        this.layers.push(mapeaLyrsObject);
      });
    }

    if (numColumns > this.layers.length) {
      this.numeroColumnas = this.layers.length * 110;
    } else {
      this.numeroColumnas = numColumns * 110;
    }

    this.numeroColumnas += 'px';

    this.flattedLayers = this.layers.reduce((current, next) => current.concat(next.layers), []);
    this.activeLayer = -1;
    /* this.idLayer saves active layer position on layers array */
    this.idLayer = idLayer === null ? 0 : idLayer;
    this.visible = visible;
    this.empty = empty;

    this.order = order;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          layers: this.layers,
          empty: this.empty,
          translations: {
            headertitle: getValue('tooltip'),
            none: getValue('none'),
          },
        },
      });
      this.accessibilityTab(html);
      this.html = html;
      this.listen(html);
      this.on(M.evt.ADDED_TO_MAP, () => {
        const visible = this.visible;
        if (this.idLayer > -1) {
          this.activeLayer = this.idLayer;
          this.showBaseLayer({
            currentTarget: {
              parentElement: html,
            },
          }, this.layers[this.activeLayer], this.activeLayer);
        }

        if (visible === false) {
          this.map.removeLayers(this.map.getBaseLayers());
          this.html.querySelector('.activeBackimglayerDiv').classList.remove('activeBackimglayerDiv');
        }
      });

      success(html);
    });
  }

  showEmptyLayer(html) {
    const elem = html.querySelector('#m-backimglayer-previews div.activeBackimglayerDiv');
    if (elem !== null) {
      elem.click();
    }
  }

  /**
   * This function adds layer bound to the button clicked
   *
   * @function
   * @public
   * @api
   * @param {Event} e
   * @param {} layersInfo
   * @param {} i
   */
  showBaseLayer(e, layersInfo, i) {
    this.removeLayers();
    this.visible = false;
    const { layers } = layersInfo;
    const isActivated = e.currentTarget.parentElement
      .querySelector(`#m-backimglayer-lyr-${layersInfo.id}`)
      .classList.contains('activeBackimglayerDiv');

    layers.forEach((layer, index, array) => {
      let sumIndex = index;
      if (index !== 0) {
        sumIndex += 16;
      }

      if (layer.zindex_) {
        layer.setZIndex(sumIndex);
      }
    });

    e.currentTarget.parentElement.querySelectorAll('div[id^="m-backimglayer-lyr-"]').forEach((imgContainer) => {
      if (imgContainer.classList.contains('activeBackimglayerDiv')) {
        imgContainer.classList.remove('activeBackimglayerDiv');
      }
    });
    if (!isActivated) {
      this.visible = true;
      this.activeLayer = i;
      e.currentTarget.parentElement
        .querySelector(`#m-backimglayer-lyr-${layersInfo.id}`).classList.add('activeBackimglayerDiv');
      // M.proxy(false);
      this.map.addLayers(layers);
      // setTimeout(() => {
      // M.proxy(true);
      /*
        layers.forEach((l) => {
          l.setVisible(true);
        });
        */
      // }, 1000);
    } else if (this.empty) {
      e.currentTarget.parentElement.querySelector('#m-backimglayer-lyr-empty').classList.add('activeBackimglayerDiv');
    }
    this.fire('backimglayer:activeChanges', [{ activeLayerId: this.activeLayer }]);
  }

  /**
   * This function removes this.layers from Map.
   * @function
   * @public
   * @api
   */
  removeLayers() {
    try {
      this.map.removeLayers(this.flattedLayers);
    } catch (err) { /* Continue */ }

    try {
      this.map.removeLayers(this.map.getBaseLayers());
    } catch (err) { /* Continue */ }
  }

  /**
   * This function add the events listener to each button of the html
   * @param {HTMLElement} html
   * @function
   * @public
   * @api
   */
  listen(html) {
    // eslint-disable-next-line no-param-reassign
    html.querySelector('#m-backimglayer-previews').style.width = this.numeroColumnas;
    html.querySelectorAll('div[id^="m-backimglayer-lyr-"]').forEach((b, i) => {
      if (b.id === 'm-backimglayer-lyr-empty') {
        b.addEventListener('click', this.showEmptyLayer.bind(this, html));
        b.addEventListener('keydown', ({ key }) => {
          if (key === 'Enter') this.showEmptyLayer(html);
        });
      } else {
        b.addEventListener('click', (e) => this.showBaseLayer(e, this.layers[i], i));
        b.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.showBaseLayer(e, this.layers[i], i);
        });
      }
    });
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof BackImgLayerControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
