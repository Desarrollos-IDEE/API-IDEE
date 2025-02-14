/**
 * @module M/impl/layer/GeoJSON
 */
import { isNullOrEmpty, isFunction, isObject } from 'M/util/Utils';
import * as EventType from 'M/event/eventtype';
import Popup from 'M/Popup';
import { compileSync as compileTemplate } from 'M/util/Template';
import geojsonPopupTemplate from 'templates/geojson_popup';
import GeoJSONFormat from 'M/format/GeoJSON';
import OLSourceVector from 'ol/source/Vector';
import { get as getProj } from 'ol/proj';
import Vector from './Vector';
import JSONPLoader from '../loader/JSONP';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * GeoJSON, a pesar de no ser un estándar OGC (está en camino de convertirse en uno),
 * es un formato de intercambio de información geográfica muy extendido que, al igual que WFS,
 * permite que todos los elementos estén en el cliente.
 *
 * @api
 * @extends {M.impl.layer.Vector}
 */
class GeoJSON extends Vector {
  /**
   * Constructor principal de la clase. Crea una capa GeoJSON
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @implements {M.impl.layer.Vector}
   * @param {Object} parameters Parámetros de la fachada, la fachada se refiere a un patrón
   * estructural como una capa de abstracción con un patrón de diseño.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - hide. Atributos ocultos.
   * - show. Mostrar atributos.
   * - minZoom. Zoom mínimo aplicable a la capa.
   * - maxZoom. Zoom máximo aplicable a la capa.
   * - visibility. Define si la capa es visible o no. Verdadero por defecto.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - opacity. Opacidad de capa, por defecto 1.
   * - displayInLayerSwitcher. Indica si la capa se muestra en el selector de capas.
   * - style. Define el estilo de la capa.
   * - maxExtent: La medida en que restringe la visualización a una región específica.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * <pre><code>
   * import OLSourceVector from 'ol/source/Vector';
   * {
   *  opacity: 0.1,
   *  source: new OLSourceVector({
   *    attributions: 'geojson',
   *    ...
   *  })
   * }
   * </code></pre>
   * @api stable
   */
  constructor(parameters, options, vendorOptions) {
    // calls the super constructor
    super(options, vendorOptions);

    /**
     * GeoJSON popup_. Instancia del popup.
     */
    this.popup_ = null;

    /**
     * GeoJSON formater_. Determina el formato, "GeoJSONFormat".
     */
    this.formater_ = null;

    /**
     * GeoJSON loader_. Determina si la capa esta cargada, "JSONPLoader".
     */
    this.loader_ = null;

    /**
     * GeoJSON loadFeaturesPromise_. Carga los objetos geográficos, asincrono.
     */
    this.loadFeaturesPromise_ = null;

    /**
     * GeoJSON loaded_. Define si la capa esta cargada.
     */
    this.loaded_ = false;

    /**
     * GeoJSON hiddenAttributes_. Atributos de la capa ocultos.
     */
    this.hiddenAttributes_ = [];
    if (!isNullOrEmpty(options.hide)) {
      this.hiddenAttributes_ = options.hide;
    }

    /**
     * GeoJSON showAttributes_. Atributos de la capa que serán representados.
     */
    this.showAttributes_ = [];
    if (!isNullOrEmpty(options.show)) {
      this.showAttributes_ = options.show;
    }
  }

  /**
   * Este método añade a la capa al mapa.
   *
   * @public
   * @function
   * @param {M.impl.Map} map Mapa de la implementación.
   * @api stable
   */
  addTo(map, addLayer = true) {
    this.formater_ = new GeoJSONFormat({
      defaultDataProjection: getProj(map.getProjection().code),
    });
    if (!isNullOrEmpty(this.url)) {
      this.loader_ = new JSONPLoader(map, this.url, this.formater_);
    }
    super.addTo(map, addLayer);
  }

  /**
   * Este método refresca la capa.
   *
   * @public
   * @function
   * @param {String} source Nueva fuente, por defecto nulo.
   * @api stable
   */
  refresh(source = null) {
    const features = this.formater_.write(this.facadeVector_.getFeatures());
    const codeProjection = this.map.getProjection().code.split(':')[1];
    let newSource = {
      type: 'FeatureCollection',
      features,
      crs: {
        properties: {
          code: codeProjection,
        },
        type: 'EPSG',
      },
    };
    if (isObject(source)) {
      newSource = source;
    }
    this.source = newSource;
    this.updateSource_();
  }

  /**
   * Este método devuelve la fuente de la capa.
   *
   * @public
   * @function
   * @param {String} source Nueva fuente.
   * @api stable
   */
  setSource(source) {
    this.source = source;
    if (!isNullOrEmpty(this.map)) {
      this.updateSource_();
    }
  }

  /**
   * Este método devuelve los objetos geográficos de manera asincrona.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {M.layer.GeoJSON.impl.loadFeaturesPromise_} Objetos geográficos, asíncrono.
   * @api
   */
  requestFeatures_() {
    if (isNullOrEmpty(this.loadFeaturesPromise_)) {
      this.loadFeaturesPromise_ = new Promise((resolve) => {
        if (this.source) {
          const features = this.formater_.read(this.source, this.map.getProjection());
          resolve(features);
        } else {
          this.loader_.getLoaderFn((features) => {
            resolve(features);
          })(null, null, getProj(this.map.getProjection().code));
        }
      });
    }
    return this.loadFeaturesPromise_;
  }

  /**
   * Este método actualiza la fuente de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  updateSource_() {
    if (isNullOrEmpty(this.vendorOptions_.source)) {
      this.requestFeatures_().then((features) => {
        if (this.ol3Layer) {
          this.ol3Layer.setSource(new OLSourceVector({
            loader: (extent, resolution, projection) => {
              this.loaded_ = true;
              // removes previous features
              this.facadeVector_.clear();
              this.facadeVector_.addFeatures(features);
              this.fire(EventType.LOAD, [features]);
            },
          }));
        }
        this.facadeVector_.addFeatures(features);
      });
    }
  }

  /**
   * Este método devuelve la extensión de todos los objetos geográficos, se
   * le puede pasar un filtro. Asíncrono.
   *
   * @function
   * @param {boolean} skipFilter Indica si se filtra por el filtro "skip".
   * @param {M.Filter} filter Filtro.
   * @return {Array<number>} Extensión de los objetos geográficos.
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
   * Evento que se ejecuta cuando se hace clic sobre un objeto geográfico.
   *
   * @public
   * @function
   * @param {ol.Feature} feature Objetos geográficos de Openlayers.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
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

  // /**
  //  * This function destroys this layer, cleaning the HTML
  //  * and unregistering all events
  //  *
  //  * @public
  //  * @function
  //  * @api stable
  //  */
  // destroy () {
  //   let olMap = this.map.getMapImpl();
  //
  //   if (!isNullOrEmpty(this.ol3Layer)) {
  //     olMap.removeLayer(this.ol3Layer);
  //     this.ol3Layer = null;
  //   }
  //   this.options = null;
  //   this.map = null;
  // };

  /**
   * Devuelve si la capa esta cargada o no.
   *
   * @function
   * @returns {Boolean} Verdadero se cargo falso si no.
   * @api stable
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof GeoJSON) {
      equals = equals && (this.name === obj.name);
      equals = equals && (this.extract === obj.extract);
    }
    return equals;
  }
}

export default GeoJSON;
