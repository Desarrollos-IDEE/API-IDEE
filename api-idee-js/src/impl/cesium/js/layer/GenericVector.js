/**
 * @module M/impl/layer/GenericVector
 */
import * as EventType from 'M/event/eventtype';
import { compileSync as compileTemplate } from 'M/util/Template';
import Popup from 'M/Popup';
import {
  isNullOrEmpty,
} from 'M/util/Utils';
import { getValue } from 'M/i18n/language';
import geojsonPopupTemplate from 'templates/geojson_popup';
import Vector from './Vector';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * GenericVector permite añadir cualquier tipo de capa vectorial definida con la librería base.
 *
 * @api
 * @extends {M.impl.layer.Vector}
 */
class GenericVector extends Vector {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a
   * la implementación de la capa.
   * - visibility: Indica la visibilidad de la capa.
   * - format: Formato de la capa, por defecto image/png.
   * - styles: Estilos de la capa.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - queryable: Indica si la capa es consultable.
   * - minScale: Escala mínima.
   * - maxScale: Escala máxima.
   * - minResolution: Resolución mínima.
   * - maxResolution: Resolución máxima.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * - height: Define la altura del objeto geográfico. Puede ser un número o una propiedad.
   *   Si se define la altura será constante para todos los puntos del objeto geográfico.
   *   Solo disponible para Cesium.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import { CustomDataSource } from 'cesium';
   * {
   *  new CustomDataSource()
   * }
   * </code></pre>
   * @api
   */
  constructor(options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);
    this.options = options;

    /**
     * Layer map. La instancia del mapa.
     */
    this.map = null;

    this.style = this.options.style || null;

    /**
     * WFS cql: Opcional: instrucción CQL para filtrar.
     * El método setCQL(cadena_cql) refresca la capa aplicando el
     * nuevo predicado CQL que recibe.
     */
    this.cql = this.options.cql;

    this.fnAddFeatures_ = null;

    this.cesiumLayer = vendorOptions;
    this.maxExtent = [];
    this.ids = options.ids;
    this.version = options.version;
    this.legend = options.legend;
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.facadeLayer_.userMaxExtent = null;
    this.facadeVector_ = this.facadeLayer_;

    this.once(EventType.LOAD_GENERIC_VECTOR, () => {
      if (!isNullOrEmpty(this.visibility)) {
        this.cesiumLayer.show = this.visibility;
      }

      this.cesiumLayer.show = this.visibility;

      this.map.getMapImpl().dataSources.add(this.cesiumLayer);

      // ? Capas con features ya cargados
      if (this.cesiumLayer) {
        if (this.cesiumLayer.entities && this.cesiumLayer.entities.values.length > 0
          && !this.cesiumLayer.isLoading) {
          const features = this.cesiumLayer.entities.values.map((f) => {
            return Feature.feature2Facade(f);
          });
          this.cesiumLayer.entities.removeAll();
          this.loaded_ = true;
          this.facadeLayer_.addFeatures(features);
          this.fire(EventType.LOAD, [this.features_]);
        } else {
          // ? Features todavía no han sido cargados
          this.fnAddFeatures_ = this.addFeaturesToFacade.bind(this);
          this.cesiumLayer.loadingEvent.addEventListener(this.fnAddFeatures_);
        }
      }
    });

    if (this.cesiumLayer instanceof Promise) {
      this.cesiumLayer.then((layer) => {
        this.cesiumLayer = layer;
        this.fire(EventType.LOAD_GENERIC_VECTOR);
      });
    } else {
      this.fire(EventType.LOAD_GENERIC_VECTOR);
    }
  }

  /**
   * Añade entities a la fachada de GenericVector
   *
   * @function
   * @public
   * @api stable
   */
  addFeaturesToFacade() {
    if (this.cesiumLayer && !this.loaded_) {
      if (this.cesiumLayer.entities.values.length > 0) {
        const features = this.cesiumLayer.entities.values.map((f) => {
          return Feature.feature2Facade(f);
        });
        this.cesiumLayer.entities.removeAll();
        if (features.length > 0) {
          this.loaded_ = true;
          this.facadeLayer_.addFeatures(features);
          this.deactivate();
          this.fire(EventType.LOAD, [this.features_]);
        }
      } else if (this.cesiumLayer && this.loaded_) {
        this.deactivate();
      }
    }
  }

  /**
   * Este método vuelve a dibujar la capa.
   *
   * @function
   * @public
   * @api stable
   */
  redraw() {
    const cesiumLayer = this.getLayer();
    if (!isNullOrEmpty(cesiumLayer)) {
      const cesiumFeatures = cesiumLayer.entities;
      // remove all entities from dataSource
      cesiumFeatures.removeAll();

      const features = this.facadeLayer_.getFeatures();
      const entities = features.map(Feature.facade2Feature);
      entities.forEach((entity) => {
        cesiumLayer.entities.add(entity);
      });
    }
  }

  /**
   * Este método desactiva el evento change de la capa.
   * @function
   * @api stable
   */
  deactivate() {
    this.cesiumLayer.changedEvent.removeEventListener(this.fnAddFeatures_);
    this.fnAddFeatures_ = null;
  }

  /**
   * Este método selecciona un objeto geográfico.
   * @public
   * @function
   * @param {cesium.Entity} feature Objeto geográfico de Cesium.
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    const feature = features[0];
    if (this.extract === true) {
      this.unselectFeatures();
      if (!isNullOrEmpty(feature)) {
        const htmlAsText = compileTemplate(geojsonPopupTemplate, {
          vars: this.parseFeaturesForTemplate_(features),
          parseToHtml: false,
        });

        const featureTabOpts = {
          icon: 'g-cartografia-pin',
          title: this.name,
          content: htmlAsText,
        };

        let popup = this.map.getPopup();
        if (isNullOrEmpty(popup)) {
          popup = new Popup();
          popup.addTab(featureTabOpts);
          this.map.addPopup(popup, coord);
        } else {
          popup.addTab(featureTabOpts);
        }
      }
    }
  }

  /**
   * Este método modifica la URL del servicio.
   * No disponible para Cesium.
   *
   * @function
   * @param {String} URL del servicio.
   * @api
   */
  setURLService(url) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').seturlservice_method);
  }

  /**
   * Este método obtiene la URL del servicio.
   * No disponible para Cesium.
   *
   * @function
   * @returns {String} URL del servicio
   * @api
   */
  getURLService() {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').geturlservice_method);
    return '';
  }

  /**
   * Este método establece la clase de la fachada
   * de MBTiles.
   *
   * @function
   * @param {Object} obj Objeto a establecer como fachada.
   * @public
   * @api
   */
  setFacadeObj(obj) {
    this.facadeLayer_ = obj;
  }

  /**
   * Este método obtiene la resolución máxima para
   * este WMS.
   *
   *
   * @public
   * @function
   * @return {Number} Resolución Máxima.
   * @api stable
   */
  getMaxResolution() {
    return undefined;
  }

  /**
   * Este método obtiene la resolución mínima.
   *
   * @public
   * @function
   * @return {Number} Resolución mínima.
   * @api stable
   */
  getMinResolution() {
    return undefined;
  }

  /**
   * Este método actualiza la capa.
   * @function
   * @api stable
   */
  refresh() {
    const cesiumMap = this.map.getMapImpl();
    const oldzIndex = cesiumMap.dataSources.indexOf(this.getLayer());
    cesiumMap.dataSources.remove(this.getLayer(), false);
    const promise = cesiumMap.dataSources.add(this.getLayer());
    promise.then((l) => {
      const newzIndex = cesiumMap.dataSources.indexOf(l);
      const difIndex = oldzIndex - newzIndex;
      for (let i = 0; i < Math.abs(difIndex); i += 1) {
        if (difIndex < 0) {
          cesiumMap.dataSources.lower(l);
        } else {
          cesiumMap.dataSources.raise(l);
        }
      }
    });
  }

  /**
   * Devuelve la URL de la leyenda.
   *
   * @public
   * @function
   * @returns {String} URL de la leyenda.
   * @api stable
   */
  getLegendURL() {
    return this.legendUrl_;
  }

  /**
   * Establece la URL de la leyenda.
   * @function
   * @param {String} newLegend URL de la leyenda.
   * @api stable
   */
  setLegendURL(newLegend) {
    if (!isNullOrEmpty(newLegend)) {
      this.legendUrl_ = newLegend;
    }
  }

  /**
   * Este método establece la versión de la capa.
   * No disponible para Cesium.
   *
   * @function
   * @param {String} newVersion Nueva versión de la capa.
   * @api stable
   */
  setVersion(newVersion) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').setversion_method);
  }

  /**
   * Este método devuelve la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  getMaxExtent() {
    return this.facadeVector_.getFeaturesExtent();
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.dataSources.remove(this.cesiumLayer, true);
      this.cesiumLayer = null;
    }
    this.map = null;
  }

  /**
   * Este método comprueba si son iguales dos capas.
   * @function
   * @param {M.layer.GenericVector} obj - Objeto a comparar.
   * @returns {boolean} Son iguales o no.
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GenericVector) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.version === obj.version);
    }

    return equals;
  }
}

export default GenericVector;
