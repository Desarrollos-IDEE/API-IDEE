/* eslint-disable no-underscore-dangle */
/**
 * @module IDEE/impl/layer/Tiles3D
 */
import {
  isNullOrEmpty,
  extend,
  isFunction,
  includes,
} from 'IDEE/util/Utils';
import { getValue } from 'IDEE/i18n/language';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import Popup from 'IDEE/Popup';
import {
  Cesium3DTileStyle,
  Cesium3DTileset,
  Rectangle,
  Math as CesiumMath,
  // Expression,
} from 'cesium';
import geojsonPopupTemplate from 'templates/geojson_popup';
import Layer from './Layer';

/**
 * @classdesc
 * Las capas Tiles3D son un estándar OGC que se refieren a un conjunto de teselas que
 * se organizan en una estructura de datos espaciales jerárquica.
 *
 * https://URL/tileset.json
 *
 * @property {String} url Url del servicio Tiles3D.
 * @property {Boolean} visibility Define si la capa es visible o no.
 * @property {Boolean} displayInLayerSwitcher Mostrar en el selector de capas.
 *
 * @api
 * @extends {IDEE.impl.Layer}
 */
class Tiles3D extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa Tiles3D
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Mx.parameters.Tiles3D} userParameters Parámetros para la construcción de la capa.
   * - url: Url del servicio de la capa.
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - type: Tipo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - style: Define el estilo de la capa.
   * - extract: Activa la consulta por click en el objeto geográfico, por defecto, falso.
   * - maximumScreenSpaceError: Error máximo de espacio en pantalla.
   * - clippingPlanes: Planos de recorte.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    /**
      * Tiles3D url.
      * La URL de origen de la capa Tiles3D.
      */
    this.url = userParameters.url;

    /**
     * Tiles3D visibility.
     * Define si la capa es visible o no.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    /**
     * Tiles3D displayInLayerSwitcher:
     * Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher = userParameters.displayInLayerSwitcher !== false;

    /**
     * Tiles3D opacity_.
     * Opacidad de la capa.
     */
    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    /**
     * Tiles3D style.
     * Estilo de la capa.
     */
    this.style = !isNullOrEmpty(options.style) ? options.style : undefined;
  }

  /**
   * Este método añade la capa al mapa de la implementación.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api
   */
  addTo(map) {
    this.map = map;
    const optCesiumLayer = extend({
      show: this.visibility,
      enablePick: true,
    }, this.vendorOptions_, true);

    const { maximumScreenSpaceError, clippingPlanes } = this.options;

    const promise = Cesium3DTileset.fromUrl(this.url, {
      maximumScreenSpaceError,
      clippingPlanes,
      ...optCesiumLayer,
    });
    promise.then((tile3d) => {
      this.cesiumLayer = tile3d;
      this.map.getMapImpl().scene.primitives.add(tile3d);
      this.setStyle(this.style);
      this.setOpacity(this.opacity_);

      // this.map.getMapImpl().zoomTo(this.cesiumLayer);
    });
  }

  /**
   * Pasa los objetos geográficos a la plantilla.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Cesium.EntityCollection} feature Objetos geográficos de Cesium.
   * @returns {Object} "FeaturesTemplate.features".
   * @api stable
   */
  parseFeaturesForTemplate_(features) {
    const featuresTemplate = {
      features: [],
    };

    features.forEach((feature) => {
      const featureTemplate = {
        id: feature.getId(),
        attributes: this.recursiveExtract_(feature.getAttributes()),
      };
      featuresTemplate.features.push(featureTemplate);
    });
    return featuresTemplate;
  }

  recursiveExtract_(properties, parentKey = '') {
    const attributes = [];

    const propertyKeys = Object.keys(properties);

    propertyKeys.forEach((key) => {
      let addAttribute = true;
      // adds the attribute just if it is not in
      // hiddenAttributes_ or it is in showAttributes_
      if (!isNullOrEmpty(this.showAttributes_)) {
        addAttribute = includes(this.showAttributes_, key);
      } else if (!isNullOrEmpty(this.hiddenAttributes_)) {
        addAttribute = !includes(this.hiddenAttributes_, key);
      }

      if ((typeof properties[key] === 'object' && properties[key]) && !Array.isArray(properties[key])) {
        const values = this.recursiveExtract_(properties[key], (parentKey) ? `${parentKey} | ${key}` : key);
        attributes.push(...values);
      } else if (addAttribute) { // No se añade si es null o undefined
        const fullKey = parentKey ? `${parentKey} | ${key}` : key;
        const filter = fullKey.split(' | ');
        attributes.push({
          key: (parentKey) ? `${filter[filter.length - 2]} | ${filter[filter.length - 1]}` : key,
          value: properties[key],
        });
      }
    });

    return attributes;
  }

  /**
   * Este método devuelve el zoom mínimo de esta capa.
   *
   * @function
   * @returns {Number} Devuelve el zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  getMinZoom() {}

  /**
   * Este método establece el zoom mínimo de esta capa.
   *
   * @function
   * @param {Number} zoom Zoom mínimo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMinZoom(zoom) {}

  /**
   * Este método devuelve el zoom máximo de esta capa.
   *
   * @function
   * @returns {Number} Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  getMaxZoom() {}

  /**
   * Este método establece el zoom máximo de esta capa.
   *
   *
   * @function
   * @param {Number} zoom Zoom máximo aplicable a la capa.
   * @api stable
   * @expose
   */
  setMaxZoom(zoom) {}

  /**
   * Este método devuelve el índice z de esta capa.
   *
   * @function
   * @return {Number} Índice de la capa.
   * @api stable
   * @expose
   */
  getZIndex() {
    if (!isNullOrEmpty(this.getLayer())) {
      this.zIndex_ = this.map.getMapImpl().scene.primitives._primitives
        .findIndex((l) => this.getLayer() === l);
    }
    return this.zIndex_;
  }

  /**
   * Este método establece el índice z de esta capa.
   *
   * @function
   * @param {Number} zIndex Índice de la capa.
   * @api stable
   * @expose
   */
  setZIndex(zIndex) {
    this.zIndex_ = zIndex;
    if (!isNullOrEmpty(this.getLayer())) {
      const cesiumMap = this.map.getMapImpl();
      /* eslint-disable no-underscore-dangle */
      if ((cesiumMap.scene.primitives._primitives.length - 1) >= zIndex) {
        cesiumMap.scene.primitives.destroyPrimitives = false;
        cesiumMap.scene.primitives.remove(this.cesiumLayer);
        cesiumMap.scene.primitives.add(this.cesiumLayer, zIndex);
      } else {
        // eslint-disable-next-line no-console
        console.error(getValue('exception').index_error);
      }
      this.map.getLayers().forEach((layer) => {
        const layerImpl = layer.getImpl().getLayer();
        if (layerImpl instanceof Cesium3DTileset) {
          /* eslint-disable no-param-reassign */
          layer.zindex_ = cesiumMap.scene.primitives._primitives.findIndex((l) => layerImpl === l);
          layer.isBase = false;
        }
      });
    }
  }

  /**
    * Este método devuelve la opacidad de esta capa.
    *
    * @function
    * @returns {Number} Opacidad (0, 1). Predeterminado 1.
    * @api stable
    * @expose
    */
  getOpacity() {
    return 1;
  }

  /**
   * Este método establece la opacidad de esta capa.
   *
   * @function
   * @param {Number} opacity Opacidad (0, 1). Predeterminado 1.
   * @api stable
   * @expose
   */
  setOpacity(opacity) {}

  /**
   * Este método establece la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  setMaxExtent(maxExtent) {}

  /**
   * Este método devuelve la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  getMaxExtent() {
    if (!isNullOrEmpty(this.cesiumLayer)) {
      const boundingSphere = this.cesiumLayer.boundingSphere;
      const rectangle = Rectangle.fromBoundingSphere(boundingSphere);

      return [
        CesiumMath.toDegrees(rectangle.west),
        CesiumMath.toDegrees(rectangle.south),
        CesiumMath.toDegrees(rectangle.east),
        CesiumMath.toDegrees(rectangle.north),
      ];
    }
    return [-180, -90, 180, 90];
  }

  /**
   * Este método ejecuta un objeto geográfico seleccionado.
   *
   * @function
   * @param {Cesium.Entity} features Objeto geográfico de Cesium.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    if (this.extract === true) {
      const feature = features[0];
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
   * Este método establece la capa Cesium.
   *
   * @function
   * @param {Cesium3DTileset} layer Capa de Cesium.
   * @api stable
   * @expose
   */
  setLayer(layer) {
    const cesiumMap = this.map.getMapImpl();
    if (this.cesiumLayer !== layer) {
      let zIndex = cesiumMap.scene.primitives._primitives
        .findIndex((l) => this.cesiumLayer === l);
      zIndex = zIndex !== -1 ? zIndex : 0;

      cesiumMap.scene.primitives.remove(this.cesiumLayer);
      this.cesiumLayer = layer;
      cesiumMap.scene.primitives.add(layer, zIndex);
    }
    return this;
  }

  /**
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {Object} Estilo de la capa.
   * @api
   */
  getStyle() {
    return this.cesiumLayer.style._style;
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {Object} style Estilo que se aplicará a la capa.
   * @api
   */
  setStyle(style) {
    if (!isNullOrEmpty(this.cesiumLayer)) {
      this.cesiumLayer.style = new Cesium3DTileStyle(style);
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
    const cesiumMap = this.map.getMapImpl();
    if (!isNullOrEmpty(this.cesiumLayer)) {
      cesiumMap.scene.primitives.destroyPrimitives = true;
      cesiumMap.scene.primitives.remove(this.cesiumLayer);
      this.cesiumLayer = null;
    }
    this.map = null;
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

    if (obj instanceof Tiles3D) {
      equals = (this.url === obj.url);
      equals = equals && (this.name === obj.name);
    }

    return equals;
  }
}

export default Tiles3D;
