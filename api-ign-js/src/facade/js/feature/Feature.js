/**
 * @module M/Feature
 */
import FeatureImpl from 'impl/feature/Feature';
import Base from '../Base';
import { isNullOrEmpty } from '../util/Utils';
import GeoJSON from '../format/GeoJSON';
import * as dialog from '../dialog';
import StyleFeature from '../style/Feature';
import StylePoint from '../style/Point';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Crea un objeto geográfico.
 * @extends {M.facade.Base}
 * @api
 */
class Feature extends Base {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} id Identificador del objeto geográfico.
   * @param {Object} geojson Geojson con objetos geográficos.
   * @param {Object} style Estilo para el objeto geográfico.
   * @api
   */
  constructor(id, geojson, style) {
    /**
     * Implementación de objetos geográficos.
     * @public
     * @type {M.impl.Feature}
     */
    const impl = new FeatureImpl(id, geojson, style);

    super(impl);

    /**
     * Estilo de los objetos geográficos.
     * @private
     * @type {M.style.Feature}
     */
    this.style_ = null;

    /**
     * Formato del GeoJSON.
     * @private
     * @type {M.format.GeoJSON}
     */
    this.formatGeoJSON_ = new GeoJSON();

    /**
     * Añade estilo al objeto geográfico.
     * @private
     */
    this.setStyle(style);
  }

  /**
   * Sobrescribe el identificador del objeto geográfico.
   *
   * @public
   * @function
   * @param {String} id Identificador del objeto geográfico.
   * @api
   */
  setId(id) {
    this.getImpl().setId(id);
  }

  /**
   * Este método retorna el identificador del objeto geográfico.
   *
   * @public
   * @function
   * @return {string} Identificador del objeto geográfico.
   * @api
   */
  getId() {
    return this.getImpl().getId();
  }

  /**
   * Este método devuelve la geometría de un objeto geográfico.
   *
   * @public
   * @function
   * @return {object} Geometría.
   * @api
   */
  getGeometry() {
    return this.getGeoJSON().geometry;
  }

  /**
   * Este método sobrescribe la geometría del objeto geográfico.
   *
   * @public
   * @function
   * @param {object} Geometry Geometría.
   * @api
   */
  setGeometry(geometry) {
    this.getImpl().setGeometry(geometry);
  }

  /**
   * Este método retorna un geojson con el
   * objeto geográfico.
   *
   * @public
   * @function
   * @return {Object} Geojson con el objeto geográfico.
   * @api
   */
  getGeoJSON() {
    return this.formatGeoJSON_.write(this)[0];
  }

  /**
   * Este método retorna los atributos del objeto geográfico.
   *
   * @public
   * @function
   * @return {Object} Atributos.
   * @api
   */
  getAttributes() {
    return this.getImpl().getAttributes();
  }

  /**
   * Sobrescribe los atributos del objeto geográfico.
   *
   * @public
   * @function
   * @param {Object} attributes Atributos del objeto geográfico.
   * @api
   */
  setAttributes(attributes) {
    if (typeof attributes === 'object') {
      this.getImpl().setAttributes(attributes);
    } else {
      dialog.info(getValue('feature').incorrect_attributes);
    }
  }

  /**
   * Este método retorna el atributo del objeto geográfico.
   *
   * @public
   * @function
   * @param {String} attribute Nombre del atributo.
   * @return  {string|number|object} Retorna el valor del atributo.
   * @api
   */
  getAttribute(attribute) {
    let attrValue;

    attrValue = this.getImpl().getAttribute(attribute);
    if (isNullOrEmpty(attrValue)) {
      // we look up the attribute by its path. Example: getAttribute('foo.bar.attr')
      // --> return feature.properties.foo.bar.attr value
      const attrPath = attribute.split('.');
      if (attrPath.length > 1) {
        attrValue = attrPath.reduce((obj, attr) => {
          let attrParam;
          if (!isNullOrEmpty(obj)) {
            if (obj instanceof Feature) {
              attrParam = obj.getAttribute(attr);
            } else {
              attrParam = obj[attr];
            }
          }
          return attrParam;
        }, this);
      }
    }
    return attrValue;
  }

  /**
   * Este método modifica un atributo del objeto geográfico.
   *
   * @public
   * @function
   * @param {String} attribute Nombre del atributo.
   * @param {string|number|object} value Nuevo valor.
   * @return  {string|number|object} Devuelve el valor del atributo indicado.
   * @api
   */
  setAttribute(attribute, value) {
    return this.getImpl().setAttribute(attribute, value);
  }

  /**
   * Este método sobrescribe el estilo del objeto geográfico.
   *
   * @public
   * @function
   * @param {M.style.Feature} style Nuevo estilo.
   * @api
   */
  setStyle(style) {
    if (isNullOrEmpty(style)) {
      this.style_ = null;
      this.getImpl().clearStyle();
    } else if (style instanceof StyleFeature) {
      this.style_ = style;
      this.style_.applyToFeature(this);
    }
    this.fire(EventType.CHANGE_STYLE, [style, this]);
  }

  /**
   * Este método retorna si dos objetos geográficos son iguales.
   * @public
   * @function
   * @param {M.Feature} feature Objeto geográfico.
   * @return {bool} Retorna el resultado de comparar los dos objetos geográficos.
   * @api
   */
  equals(feature) {
    return this.getId() === feature.getId();
  }

  /**
   * Este método retorna el estilo del objeto geográfico.
   *
   * @public
   * @function
   * @return {M.style.Feature} Retorna el estilo del objeto geográfico.
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Elimina el estilo del objeto geográfico.
   *
   * @public
   * @function
   * @return {M.style.Feature} Retorna el estilo del objeto geográfico.
   * @api
   */
  clearStyle() {
    this.setStyle(null);
  }

  /**
   * Este método retorna el centroide de un objeto geográfico.
   *
   * @public
   * @function
   * @return {M.Feature} Centroide del objeto geográfico.
   * @api
   */
  getCentroid() {
    const id = this.getId();
    const attributes = this.getAttributes();
    const style = new StylePoint({
      stroke: {
        color: '#67af13',
        width: 2,
      },
      radius: 8,
      fill: {
        color: '#67af13',
        opacity: 0.2,
      },
    });
    const centroid = this.getImpl().getCentroid();
    if (!isNullOrEmpty(centroid)) {
      centroid.id(`${id} centroid}`);
      centroid.attributes(attributes);
      centroid.style = style;
    }
    return centroid;
  }
}

export default Feature;
