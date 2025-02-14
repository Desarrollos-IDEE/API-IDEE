/**
 * @module M/impl/layer/OGCAPIFeatures
 */
import FormatGeoJSON from 'M/format/GeoJSON';
import { compileSync as compileTemplate } from 'M/util/Template';
import geojsonPopupTemplate from 'templates/geojson_popup';
import { isNullOrEmpty, isFunction } from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import Popup from 'M/Popup';
import OLSourceVector from 'ol/source/Vector';
import { get as getProj } from 'ol/proj';
import { all } from 'ol/loadingstrategy';
import ServiceOGCAPIFeatures from '../service/OGCAPIFeatures';
import FormatImplGeoJSON from '../format/GeoJSON';
import FormatGML from '../format/GML';
import LoaderWFS from '../loader/WFS';
import Vector from './Vector';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * OGCAPIFeatures(OGC API - Features) es un estándar que ofrece la
 * capacidad de crear, modificar y consultar datos
 * espaciales en la Web y especifica requisitos y recomendaciones para las API que desean seguir una
 * forma estándar de compartir datos de entidades.
 * @extends {M.impl.layer.Vector}
 * @api
 */
class OGCAPIFeatures extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa OGCAPIFeatures
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - predefinedStyles: Estilos predefinidos para la capa.
   * - visibility: Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - minZoom: Zoom mínimo aplicable a la capa.
   * - maxZoom: Zoom máximo aplicable a la capa.
   * - bbox: Filtro para mostrar los resultados en un bbox específico.
   * - opacity: Opacidad de capa, por defecto 1.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * -cql: Declaración CQL para filtrar las características
   * (Sólo disponible para servicios en PostgreSQL).
   * Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *   cql: 'id IN (3,5)',
   * }
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
     * OGCAPIFeatures options.getFeatureOutputFormat.Formato de retorno de los objetos geográficos,
     * por defecto default application/json.
     */
    if (isNullOrEmpty(this.options.getFeatureOutputFormat)) {
      this.options.getFeatureOutputFormat = 'application/json'; // by default
    }
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @public
   * @function
   * @param {M.Map} map Implementación del mapa.
   * @api stable
   */
  addTo(map, addLayer = true) {
    super.addTo(map, addLayer);
    // this.updateSource_();
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
    if (isNullOrEmpty(this.vendorOptions_.source)) {
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
      if (/json/gi.test(this.options.getFeatureOutputFormat)) {
        this.formater_ = new FormatGeoJSON({
          defaultDataProjection: getProj(this.map.getProjection().code),
        });
      } else {
        this.formater_ = new FormatGML(this.name, this.version, this.map.getProjection());
      }
      this.loader_ = new LoaderWFS(this.map, this.service_, this.formater_);

      // const isCluster = (this.facadeVector_.getStyle() instanceof StyleCluster);
      const ol3LayerSource = this.ol3Layer.getSource();
      this.requestFeatures_().then((features) => {
        if (forceNewSource === true || isNullOrEmpty(ol3LayerSource)) {
          const newSource = new OLSourceVector({
            loader: () => {
              this.loaded_ = true;
              this.facadeVector_.addFeatures(features);
              this.fire(EventType.LOAD, [features]);
              this.facadeVector_.redraw();
            },
          });

          // if (isCluster) {
          //   const distance = this.facadeVector_.getStyle().getOptions().distance;
          //   const clusterSource = new OLSourceCluster({
          //     distance,
          //     source: newSource,
          //   });
          //   this.ol3Layer.setStyle(this.facadeVector_.getStyle().getImpl().olStyleFn);
          //   this.ol3Layer.setSource(clusterSource);
          // } else if (this.ol3Layer) {
          this.ol3Layer.setSource(newSource);
          // }
        } else {
          // if (isCluster) {
          //   ol3LayerSource = ol3LayerSource.getSource();
          // }
          ol3LayerSource.set('format', this.formater_);
          ol3LayerSource.set('loader', this.loader_.getLoaderFn((features2) => {
            this.loaded_ = true;
            this.facadeVector_.addFeatures(features2);
            this.fire(EventType.LOAD, [features2]);
            this.facadeVector_.redraw();
          }));
          ol3LayerSource.set('strategy', all);
          ol3LayerSource.changed();
        }
      });
    }
  }

  /**
   * Este método ejecuta un objeto geográfico seleccionado.
   *
   * @function
   * @param {ol.features} features Objetos geográficos de Openlayers.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
      // unselects previous features
      this.unselectFeatures();

      if (!isNullOrEmpty(feature)) {
        const clickFn = feature.getAttribute('vendor.mapea.click');
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
   * Este método devuelve la extensión de todas los objetos geográficos
   * o discrimina por el filtro, asíncrono.
   *
   * @function
   * @param {boolean} skipFilter Indica si se salta el filtro.
   * @param {M.Filter} filter Filtro para ejecutar.
   * @return {Array<number>} Alcance de los objetos geográficos.
   * @api stable
   */
  getFeaturesExtentPromise(skipFilter, filter) {
    return new Promise((resolve) => {
      const codeProj = this.map.getProjection().code;
      if (this.isLoaded() === true) {
        const features = this.getFeatures(skipFilter, filter);
        const extent = ImplUtils.getFeaturesExtent(features, codeProj);
        resolve(extent);
      } else {
        this.requestFeatures_().then((features) => {
          const extent = ImplUtils.getFeaturesExtent(features, codeProj);
          resolve(extent);
        });
      }
    });
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
      this.describeFeatureType_ = this.service_
        .getDescribeFeatureType().then((describeFeatureType) => {
          if (!isNullOrEmpty(describeFeatureType)) {
            this.formater_ = new FormatImplGeoJSON({
              geometryName: describeFeatureType.geometryName,
              defaultDataProjection: getProj(this.map.getProjection().code),
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

  // /**
  //  * This function destroys this layer, cleaning the HTML
  //  * and unregistering all events
  //  *
  //  * @public
  //  * @function
  //  * @api stable
  //  */
  // destroy() {
  //   let olMap = this.map.getMapImpl();
  //   if (!isNullOrEmpty(this.ol3Layer)) {
  //     olMap.removeLayer(this.ol3Layer);
  //     this.ol3Layer = null;
  //   }
  //   this.map = null;
  // };

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
      })(null, null, getProj(this.map.getProjection().code));
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
