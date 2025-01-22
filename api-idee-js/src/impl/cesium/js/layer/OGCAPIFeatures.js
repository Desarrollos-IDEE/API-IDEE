/**
 * @module IDEE/impl/layer/OGCAPIFeatures
 */
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import geojsonPopupTemplate from 'templates/geojson_popup';
import * as EventType from 'IDEE/event/eventtype';
import { isNullOrEmpty, isFunction } from 'IDEE/util/Utils';
import Popup from 'IDEE/Popup';
import { GeoJsonDataSource } from 'cesium';
import ServiceOGCAPIFeatures from '../service/OGCAPIFeatures';
import FormatImplGeoJSON from '../format/GeoJSON';
import JSONPLoader from '../loader/JSONP';
import Vector from './Vector';

/**
 * @classdesc
 * OGCAPIFeatures(OGC API - Features) es un estándar que ofrece la
 * capacidad de crear, modificar y consultar datos
 * espaciales en la Web y especifica requisitos y recomendaciones para las API que desean seguir una
 * forma estándar de compartir datos de entidades.
 * @extends {IDEE.impl.layer.Vector}
 * @api
 */
class OGCAPIFeatures extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa OGCAPIFeatures
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {IDEE.impl.layer.Vector}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - bbox: Filtro para mostrar los resultados en un bbox específico.
   * - opacity: Opacidad de capa, por defecto 1.
   * - height: Define la altura del objeto geográfico. Puede ser un número o una propiedad.
   *   Disponible para gemetrías poligonales.
   *   Si se define la altura será constante para todos los puntos del objeto geográfico.
   * - clampToGround: Define si el objeto geográfico se debe ajustar al suelo. Si las coordenadas
   *   son 3D, por defecto es falso, en caso contrario es verdadero.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * -cql: Declaración CQL para filtrar las características
   * (Sólo disponible para servicios en PostgreSQL).
   * Ejemplo vendorOptions:
   * <pre><code>
   * {}
   * </code></pre>
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * OGCAPIFeatures describeFeatureType_. Describe el tipo de objeto geográfico.
     */
    this.describeFeatureType_ = null;

    /**
     * OGCAPIFeatures formater_.Define el formato.
     */
    this.formater_ = null;

    /**
     * OGCAPIFeatures loader_. Valor por defecto "null".
     */
    this.loader_ = null;

    /**
     * OGCAPIFeatures service_. Servicio OGCAPIFeatures.
     */
    this.service_ = null;

    /**
     * OGCAPIFeatures loader_.Si es cargado o no.
     */
    this.loaded_ = false;

    /**
     * OGCAPIFeatures bbox. Bbox aplicado.
     */
    this.bbox = options.bbox;

    /**
     * OGCAPIFeatures options.getFeatureOutputFormat. Por defecto, devolverá
     * application/json. Si es GML también devolverá application/json.
     */
    this.options.getFeatureOutputFormat = (!isNullOrEmpty(this.options.getFeatureOutputFormat)
      && !this.options.getFeatureOutputFormat.toUpperCase().includes('GML'))
      ? this.options.getFeatureOutputFormat : 'application/json';
    /**
     * WFS options.describeFeatureTypeOutputFormat. Por defecto, devolverá
     * application/json. Si es GML también devolverá application/json.
     */
    this.options.describeFeatureTypeOutputFormat = (
      !isNullOrEmpty(this.options.describeFeatureTypeOutputFormat)
      && !this.options.describeFeatureTypeOutputFormat.toUpperCase().includes('GML'))
      ? this.options.describeFeatureTypeOutputFormat : 'application/json';
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Implementación del mapa.
   * @api stable
   */
  addTo(map) {
    this.facadeVector_.userMaxExtent = null;
    this.map = map;
    this.fire(EventType.ADDED_TO_MAP);
    map.on(EventType.CHANGE_PROJ, this.setProjection_.bind(this), this);
    this.cesiumLayer = new GeoJsonDataSource(this.name);
    this.updateSource_();
    this.setVisible(this.visibility);
    const cesiumMap = this.map.getMapImpl();
    cesiumMap.dataSources.add(this.cesiumLayer);
    map.getImpl().on(EventType.CHANGE, () => this.refresh());
  }

  /**
   * Este método refresca la capa.
   *
   * @public
   * @function
   * @param {Boolean} forceNewSource Si es verdadero fuerza una nueva fuente.
   * @api stable
   */
  refresh(forceNewSource) {
    if (forceNewSource) {
      this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
    }
    this.loadFeaturesPromise_ = null;
    this.updateSource_(forceNewSource);
  }

  /**
   * Este método cambia el CQL y llama al método "refresh".
   *
   * @public
   * @function
   * @param {String} newCQL Nuevo CQL para aplicar.
   * @api stable
   */
  setCQL(newCQL) {
    this.vendorOptions_.cql = newCQL;
    this.refresh(true);
  }

  /**
   * Este método actualiza la capa de origen.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Boolean} forceNewSource Si es verdadero fuerza una nueva fuente.
   * @api stable
   */
  updateSource_(forceNewSource) {
    this.service_ = new ServiceOGCAPIFeatures({
      url: this.url,
      namespace: this.namespace,
      name: this.name,
      limit: this.limit,
      offset: this.offset,
      format: this.format || 'json',
      id: this.id,
      bbox: this.bbox,
      conditional: this.conditional,
      projection: this.map.getProjection(),
      getFeatureOutputFormat: this.options.getFeatureOutputFormat,
      describeFeatureTypeOutputFormat: this.options.describeFeatureTypeOutputFormat,
    }, this.vendorOptions_);

    this.formater_ = new FormatGeoJSON({
      defaultDataProjection: this.map.getProjection(),
      clampToGround: this.clampToGround,
    });
    this.loader_ = new JSONPLoader(this.map, this.service_.getFeatureUrl(), this.formater_);

    this.requestFeatures_().then((features) => {
      if (forceNewSource === true || isNullOrEmpty(this.cesiumLayer)) {
        this.facadeVector_.addFeatures(features);
        this.loaded_ = true;
      } else {
        this.facadeVector_.clear();
        this.facadeVector_.addFeatures(features);
        this.loaded_ = true;
        this.fire(EventType.LOAD, [features]);
      }
    });
  }

  /**
   * Este método ejecuta un objeto geográfico seleccionado.
   *
   * @function
   * @param {Cesium.Entity} features Objetos geográficos de Cesium.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    const feature = features[0];
    if (this.extract === true) {
      // unselects previous features
      this.unselectFeatures();

      if (!isNullOrEmpty(feature)) {
        const clickFn = feature.getAttribute('vendor.api_idee.click');
        if (isFunction(clickFn)) {
          clickFn(evt, feature);
        } else {
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
  }

  /**
   * Devuelve el tipo de los objetos geográficos.
   *
   * @public
   * @function
   * @returns {describeFeatureType_} Respuesta del servicio describiendo
   * el tipo de los objetos geográficos.
   * @api stable
   */
  getDescribeFeatureType() {
    if (isNullOrEmpty(this.describeFeatureType_)) {
      this.describeFeatureType_ = this.service_.getDescribeFeatureType()
        .then((describeFeatureType) => {
          if (!isNullOrEmpty(describeFeatureType)) {
            this.formater_ = new FormatImplGeoJSON({
              geometryName: describeFeatureType.geometryName,
              defaultDataProjection: this.map.getProjection(),
            });
          }
          return describeFeatureType;
        });
    }

    return this.describeFeatureType_;
  }

  /**
   * Devuelve valores por defecto.
   *
   * @public
   * @function
   * @param {String} type "DateTime", "date", "time", "duration", "hexBinary", ...
   * @returns {String} Devuelve el valor por defecto.
   * @api stable
   */
  getDefaultValue(type) {
    let defaultValue;
    if (type === 'dateTime') {
      defaultValue = '0000-00-00T00:00:00';
    } else if (type === 'date') {
      defaultValue = '0000-00-00';
    } else if (type === 'time') {
      defaultValue = '00:00:00';
    } else if (type === 'duration') {
      defaultValue = 'P0Y';
    } else if (type === 'int' || type === 'number' || type === 'float' || type === 'double' || type === 'decimal' || type === 'short' || type === 'byte' || type === 'integer' || type === 'long' || type === 'negativeInteger' || type === 'nonNegativeInteger' || type === 'nonPositiveInteger' || type === 'positiveInteger' || type === 'unsignedLong' || type === 'unsignedInt' || type === 'unsignedShort' || type === 'unsignedByte') {
      defaultValue = 0;
    } else if (type === 'hexBinary') {
      defaultValue = null;
    } else {
      defaultValue = '-';
    }
    return defaultValue;
  }

  /**
   * Devuelve si la capa esta cargada.
   *
   * @function
   * @returns {Boolean} Verdadero se carga, falso si no.
   * @api stable
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Devuelve los objetos geográficos, asincrono.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {features} Objetos geográficos, promesa.
   * @api stable
   */
  requestFeatures_() {
    return new Promise((resolve) => {
      this.loader_.getLoaderFn((features) => {
        resolve(features);
      })(null, null, this.map.getProjection());
    });
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof OGCAPIFeatures) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.limit === obj.limit);
      equals = equals && (this.offset === obj.offset);
      equals = equals && (this.format === obj.format);
      equals = equals && (this.extract === obj.extract);
      equals = equals && (this.bbox === obj.bbox);
      equals = equals && (this.id === obj.id);
      equals = equals && (this.getFeatureOutputFormat
        === obj.getFeatureOutputFormat);
      equals = equals && (this.describeFeatureTypeOutputFormat
        === obj.describeFeatureTypeOutputFormat);
    }

    return equals;
  }
}

export default OGCAPIFeatures;
