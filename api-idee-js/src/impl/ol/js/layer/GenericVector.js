/**
 * @module IDEE/impl/layer/GenericVector
 */
import * as LayerType from 'IDEE/layer/Type';
import * as EventType from 'IDEE/event/eventtype';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import Popup from 'IDEE/Popup';
import { getValue } from 'IDEE/i18n/language';
import {
  isUndefined, isNull, isNullOrEmpty, getResolutionFromScale,
} from 'IDEE/util/Utils';
import geojsonPopupTemplate from 'templates/geojson_popup';
import Vector from './Vector';
import ImplMap from '../Map';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * GenericVector permite añadir cualquier tipo de capa vectorial definida con la librería base.
 *
 * @api
 * @extends {IDEE.impl.layer.Vector}
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
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import Vector from 'ol/source/Vector';
   * {
   *  source: new Vector({
   *    ...
   *  })
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

    /**
     * WMS zIndex_. Índice de la capa, (+40).
     */
    this.zIndex_ = ImplMap.Z_INDEX[LayerType.GenericVector];

    this.sldBody = options.sldBody;

    this.style = this.options.style || null;

    /**
     * WFS cql: Opcional: instrucción CQL para filtrar.
     * El método setCQL(cadena_cql) refresca la capa aplicando el
     * nuevo predicado CQL que recibe.
     */
    this.cql = this.options.cql;

    this.fnAddFeatures_ = null;

    this.olLayer = vendorOptions;
    this.maxExtent = options.userMaxExtent || [];
    this.ids = options.ids;
    this.version = options.version;
    this.legend = options.legend;
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.map = map;

    this.facadeVector_ = this.facadeLayer_;

    if (!this.style) {
      if (this.olLayer.getStyle) {
        this.styleOl = typeof this.olLayer.getStyle() === 'function'
          ? this.olLayer.getStyle()()
          : this.olLayer.getStyle();
        // eslint-disable-next-line no-underscore-dangle
        this.facadeVector_.style_ = this.styleOl;
        this.olLayer.setStyle(this.styleOl);
      }
    }

    if (!isNullOrEmpty(this.visibility)) {
      this.olLayer.setVisible(this.visibility);
    }

    if (!isNullOrEmpty(this.maxZoom)) {
      this.olLayer.setMaxZoom(this.maxZoom);
    }

    if (!isNullOrEmpty(this.minZoom)) {
      this.olLayer.setMinZoom(this.minZoom);
    }

    if (!isNullOrEmpty(this.zIndex_)) {
      this.olLayer.setZIndex(this.zIndex_);
    }

    if (!isNullOrEmpty(this.maxExtent)) {
      this.olLayer.setExtent(this.maxExtent);
    }

    if (!isUndefined(this.olLayer.getSource().getLegendUrl)) {
      this.legendUrl_ = this.olLayer.getSource().getLegendUrl();
    }
    this.olLayer.setOpacity(this.opacity_);
    this.olLayer.setVisible(this.visibility);

    if (!isNullOrEmpty(this.ids)) {
      const featureId = this.ids.split(',').map((id) => {
        return this.name.concat('.').concat(id);
      });
      this.olLayer.getSource().setUrl(`${this.olLayer.getSource().getUrl()}&featureId=${featureId}`);
    }

    if (!isNullOrEmpty(this.cql)) {
      this.olLayer.getSource().setUrl(`${this.olLayer.getSource().getUrl()}&CQL_FILTER=${window.encodeURIComponent(this.cql)}`);
    }

    // calculates the resolutions from scales
    if (!isNull(this.options)
      && !isNull(this.options.minScale) && !isNull(this.options.maxScale)) {
      const units = this.map.getProjection().units;
      this.options.minResolution = getResolutionFromScale(this.options.minScale, units);
      this.options.maxResolution = getResolutionFromScale(this.options.maxScale, units);
      this.olLayer.setMaxResolution(this.options.maxResolution);
      this.olLayer.setMinResolution(this.options.minResolution);
    } else if (!isNull(this.options)
      && !isNull(this.options.minResolution) && !isNull(this.options.maxResolution)) {
      this.olLayer.setMaxResolution(this.options.maxResolution);
      this.olLayer.setMinResolution(this.options.minResolution);
    }

    if (!isNullOrEmpty(this.options.minScale)) this.setMinScale(this.options.minScale);
    if (!isNullOrEmpty(this.options.maxScale)) this.setMaxScale(this.options.maxScale);

    if (addLayer) {
      map.getMapImpl().addLayer(this.olLayer);
    }

    const source = this.olLayer.getSource();

    // ? Capas con features ya cargados
    if (source.getFeatures().length > 0 && source.getState() === 'ready') {
      const features = source.getFeatures().map((f) => {
        return Feature.feature2Facade(f);
      });
      this.loaded_ = true;
      this.facadeLayer_.addFeatures(features);
      this.fire(EventType.LOAD, [this.features_]);
    } else if (source.loading && source.getState() === 'ready') {
      // ? Capas sin features cargados
      this.loaded_ = true;
    } else {
      // ? Features todavía no han sido cargados
      this.fnAddFeatures_ = this.addFeaturesToFacade.bind(this);
      source.on('featuresloadend', this.fnAddFeatures_);
    }
  }

  addFeaturesToFacade() {
    const source = this.olLayer.getSource();
    if (source.getState() === 'ready' && !this.loaded_) {
      if (source.getFeatures) {
        const features = [];
        source.getFeatures().forEach((f, i) => {
          features.push(Feature.feature2Facade(f));
        });
        if (features.length > 0) {
          this.loaded_ = true;
          this.facadeLayer_.addFeatures(features);
          this.deactivate();
          this.fire(EventType.LOAD, [this.features_]);
        }
      } else if (source.getState() === 'error') {
        this.deactivate();
      } else if (source.getState() === 'ready' && this.loaded_) {
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
    const olLayer = this.getLayer();
    if (!isNullOrEmpty(olLayer)) {
      const olSource = olLayer.getSource();
      /**  if (olSource instanceof OLSourceCluster) {
         olSource = olSource.getSource();
       } */
      // remove all features from ol vector
      const olFeatures = [...olSource.getFeatures()];
      olFeatures.forEach(olSource.removeFeature, olSource);

      const features = this.facadeLayer_.getFeatures();
      olSource.addFeatures(features.map(Feature.facade2Feature));
    }
  }

  /**
   * Este método desactiva el evento change de la capa.
   * @function
   * @api stable
   */
  deactivate() {
    this.olLayer.getSource().un('change', this.fnAddFeatures_);
    this.fnAddFeatures_ = null;
  }

  /**
   * Este método selecciona un objeto geográfico.
   * @public
   * @function
   * @param {ol.Feature} feature Objeto geográfico de Openlayers.
   * @api stable
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
      this.unselectFeatures();
      if (!isNullOrEmpty(feature)) {
        const popupTemplate = !isNullOrEmpty(this.template)
          ? this.template : geojsonPopupTemplate;
        let htmlAsText = compileTemplate(popupTemplate, {
          vars: this.parseFeaturesForTemplate_(features),
          parseToHtml: false,
        });
        if (this.legend) {
          const layerLegendHTML = `<div class="m-legend">${this.legend}</div>`;
          htmlAsText = layerLegendHTML + htmlAsText;
        }

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
   *
   * @function
   * @param {String} URL del servicio.
   * @api
   */
  setURLService(url) {
    if (!isNullOrEmpty(this.olLayer) && !isNullOrEmpty(this.olLayer.getSource)
      && !isNullOrEmpty(this.olLayer.getSource()) && !isNullOrEmpty(url)) {
      this.olLayer.getSource().setUrl(url);
    }
  }

  /**
   * Este método obtiene la URL del servicio.
   *
   * @function
   * @returns {String} URL del servicio
   * @api
   */
  getURLService() {
    let url = '';
    if (!isNullOrEmpty(this.olLayer) && !isNullOrEmpty(this.olLayer.getSource)
      && !isNullOrEmpty(this.olLayer.getSource())) {
      const source = this.olLayer.getSource();
      if (!isNullOrEmpty(source.getUrl)) {
        url = this.olLayer.getSource().getUrl();
      } else if (!isNullOrEmpty(source.getUrls)) {
        url = this.olLayer.getSource().getUrls();
      }
    }
    return url;
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
    return this.olLayer.getMaxResolution();
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
    return this.olLayer.getMinResolution();
  }

  /**
   * Este método actualiza la capa.
   * @function
   * @api stable
   */
  refresh() {
    this.olLayer.getSource().refresh();
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
   * Devuelve la extensión máxima de la capa.
   * @function
   * @returns {Array<Number>} Extensión máxima.
   * @api stable
   */
  getMaxExtent() {
    if (this.maxExtent.length !== 0) {
      return this.maxExtent;
    }
    return this.olLayer.getSource().getExtent();
  }

  /**
   * Establece la extensión máxima de la capa.
   * @function
   * @param {Array<Number>} extent Extensión máxima.
   * @api stable
   */
  setMaxExtent(extent) {
    this.maxExtent = extent;
    return this.olLayer.setExtent(extent);
  }

  /**
   * Este método establece la versión de la capa.
   * @function
   * @param {String} newVersion Nueva versión de la capa.
   * @api stable
   */
  setVersion(newVersion) {
    this.version = newVersion;
    try {
      this.olLayer.getSource().updateParams({ VERSION: newVersion });
    } catch (error) {
      const err = getValue('exception').versionError
        .replace('[replace1]', this.name)
        .replace('[replace2]', this.olLayer.constructor.name);

      // eslint-disable-next-line no-console
      console.warn(err);
    }
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
    const olMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.olLayer)) {
      olMap.removeLayer(this.olLayer);
    }
    this.map = null;
  }

  /**
   * Este método comprueba si son iguales dos capas.
   * @function
   * @param {IDEE.layer.WFS} obj - Objeto a comparar.
   * @returns {boolean} Son iguales o no.
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof GenericVector) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.version === obj.version);
      equals = equals && (this.template === obj.template);
    }

    return equals;
  }
}

export default GenericVector;
