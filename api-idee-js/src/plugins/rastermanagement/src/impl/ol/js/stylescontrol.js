/**
 * @module IDEE/impl/control/StylesControl
 */

/**
 * Implementación OpenLayers del control de estilos.
 */
export default class StylesControl extends IDEE.impl.Control {
  /**
   * @param {IDEE.Map} map Mapa asociado
   */
  constructor(map) {
    super();
    /**
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = map;
  }

  /**
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @param {HTMLElement} element Elemento del control
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
    map.getMapImpl().addControl(this);
  }

  /**
   * @public
   * @function
   */
  destroy() {
    if (this.facadeMap_) {
      this.facadeMap_.getMapImpl().removeControl(this);
      this.facadeMap_ = null;
    }
  }

  /**
   * Devuelve el mapa OpenLayers asociado.
   *
   * @private
   * @function
   * @returns {ol.Map|null}
   */
  getOLMap_() {
    if (!this.facadeMap_ || typeof this.facadeMap_.getMapImpl !== 'function') {
      return null;
    }
    return this.facadeMap_.getMapImpl();
  }

  /**
   * Tamaño actual del viewport del mapa [width, height].
   *
   * @public
   * @function
   * @returns {Array<number>|null}
   * @api
   */
  getViewportSize() {
    const olMap = this.getOLMap_();
    if (!olMap || typeof olMap.getSize !== 'function') {
      return null;
    }
    const size = olMap.getSize();
    if (!size || size.length < 2 || size[0] <= 0 || size[1] <= 0) {
      return null;
    }
    return size;
  }

  /**
   * Indica si hay dato ráster en el centro del viewport.
   *
   * @public
   * @function
   * @param {IDEE.layer.GeoTIFF} layer Capa.
   * @returns {boolean}
   * @api
   */
  hasLayerDataAtCenter(layer) {
    if (!layer || typeof layer.getData !== 'function') {
      return false;
    }
    const size = this.getViewportSize();
    if (!size) {
      return false;
    }
    const data = layer.getData([
      Math.floor(size[0] / 2),
      Math.floor(size[1] / 2),
    ]);
    if (!data || data.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Espera a que el ráster esté renderizado en la vista.
   *
   * @public
   * @function
   * @param {IDEE.layer.GeoTIFF} layer Capa.
   * @returns {Promise<void>}
   * @api
   */
  waitForViewportRasterReady(layer) {
    return new Promise((resolve) => {
      const olMap = this.getOLMap_();
      if (!olMap) {
        resolve();
        return;
      }

      let settled = false;
      let pollId = null;
      let timeoutId = null;

      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        if (pollId !== null) {
          clearInterval(pollId);
        }
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        resolve();
      };

      const tryReady = () => {
        if (this.hasLayerDataAtCenter(layer)) {
          finish();
          return true;
        }
        return false;
      };

      if (tryReady()) {
        return;
      }

      const startPolling = () => {
        if (settled) {
          return;
        }
        let attempts = 0;
        pollId = setInterval(() => {
          attempts += 1;
          if (tryReady() || attempts >= 40) {
            finish();
          }
        }, 100);
      };

      if (typeof olMap.once === 'function') {
        olMap.once('rendercomplete', () => {
          if (tryReady()) {
            return;
          }
          startPolling();
        });
      } else {
        startPolling();
      }

      if (typeof olMap.render === 'function') {
        olMap.render();
      }

      timeoutId = setTimeout(finish, 10000);
    });
  }
}
