/**
 * @module M/impl/control/Location
 */

import { isNullOrEmpty, extend } from 'M/util/Utils';
// import * as Dialog from 'M/dialog';
// import { getValue } from 'M/i18n/language';
import { get as getProj } from 'ol/proj';
import OLFeature from 'ol/Feature';
import OLGeolocation from 'ol/Geolocation';
import OLGeomPoint from 'ol/geom/Point';
import OLStyle from 'ol/style/Style';
import OLStyleCircle from 'ol/style/Circle';
import OLStyleFill from 'ol/style/Fill';
import OLStyleStroke from 'ol/style/Stroke';
import Control from './Control';
import Feature from '../feature/Feature';

/**
 *  @classdesc
 *  Localiza la posición del usuario en el mapa.
 *  @api
 */
class Location extends Control {
  /**
   * Constructor principal de la clase. Crea una ubicación
   * que permite al usuario localizar y dibujar su
   * posición en el mapa.
   *
   * @constructor
   * @param {Boolean} tracking Seguimiento de la localización, por defecto verdadero.
   * @param {Boolean} highAccuracy Alta precisión del seguimiento, por defecto falso.
   * @param {Number} maximumAge Indica la antigüedad máxima en milisegundos de una posible
   * posición almacenada en caché.
   * Valor por defecto 60000.
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base,
   * por defecto objeto vacío. Estos valores no son configurables.
   * @extends {M.impl.Control}
   * @api stable
   */

  constructor(tracking, highAccuracy, maximumAge, vendorOptions) {
    super(vendorOptions);

    /**
     * Opciones para la biblioteca base.
     * @private
     * @type {Object}
     */
    this.vendorOptions_ = vendorOptions;

    /**
     * Proporcionar Geolocalización HTML5.
     * @private
     * @type {OLGeolocation}
     */
    this.geolocation_ = null;

    /**
     * Objeto geográfico de la posición actual.
     * @private
     * @type {OLFeature}
     */
    this.accuracyFeature_ = Feature.olFeature2Facade(new OLFeature());

    /**
     * Seguimiento de localización, por defecto verdadero.
     * @private
     * @type {Boolean}
     */
    this.tracking_ = tracking;

    /**
     * Alta precisión del seguimiento, por defecto falso.
     * @private
     * @type {Boolean}
     */
    this.highAccuracy_ = highAccuracy;

    /**
     * Valor por defecto 60000.
     * @private
     * @type {Number}
     */
    this.maximumAge_ = maximumAge;

    /**
     * Activa el control.
     * @private
     * @type {Boolean}
     */
    this.activated_ = false;

    /**
     * Objeto geográfico de la posición.
     * @private
     * @type {OLFeature}
     */
    this.positionFeature_ = Feature.olFeature2Facade(new OLFeature({
      style: Location.POSITION_STYLE,
    }));
  }

  /**
   * Este método pinta un punto en el mapa con tu ubicación.
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    this.element.classList.add('m-locating');

    if (isNullOrEmpty(this.geolocation_)) {
      const proj = getProj(this.facadeMap_.getProjection().code);
      this.geolocation_ = new OLGeolocation(extend({
        projection: proj,
        tracking: this.tracking_,
        trackingOptions: {
          enableHighAccuracy: this.highAccuracy_,
          maximumAge: this.maximumAge_,
        },
      }, this.vendorOptions_, true));
      this.geolocation_.on('change:accuracyGeometry', (evt) => {
        const accuracyGeom = evt.target.get(evt.key);
        this.accuracyFeature_.getImpl().getOLFeature().setGeometry(accuracyGeom);
      });
      this.geolocation_.once('change:position', (evt) => {
        const newCoord = evt.target.get(evt.key);
        const newPosition = isNullOrEmpty(newCoord)
          ? null
          : new OLGeomPoint(newCoord);
        this.positionFeature_.getImpl().getOLFeature().setGeometry(newPosition);
        this.facadeMap_.setCenter(newCoord);
        if (this.element.classList.contains('m-locating')) {
          this.facadeMap_.setZoom(Location.ZOOM); // solo 1a vez
        }
        this.element.classList.remove('m-locating');
        this.element.classList.add('m-located');

        this.geolocation_.setTracking(this.tracking_);
      });
      // this.geolocation_.on('error', (evt) => {
      //   this.element.classList.remove('m-locating');
      //   Dialog.error(getValue('location').error);
      // });
    }

    this.geolocation_.setTracking(true);
    this.facadeMap_.drawFeatures([this.accuracyFeature_]);
    // this.facadeMap_.drawFeatures([this.accuracyFeature_, this.positionFeature_]);
  }

  /**
   * Este método elimina la ubicación dibujada.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  removePositions_() {
    if (!isNullOrEmpty(this.accuracyFeature_)) {
      this.facadeMap_.removeFeatures([this.accuracyFeature_]);
    }
    if (!isNullOrEmpty(this.positionFeature_)) {
      this.facadeMap_.removeFeatures([this.positionFeature_]);
    }
    this.geolocation_.setTracking(false);
  }

  /**
   * Este método elimina la ubicación dibujada y restaura el botón de estilo.
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.removePositions_();
    this.element.classList.remove('m-located');
    this.element.classList.remove('m-locating');
    this.geolocation_ = null;
  }

  /**
   * Este método sobrescribe la ubicación.
   * @public
   * @function
   * @param {Object} tracking Rastreo de localización.
   * @api stable
   */
  setTracking(tracking) {
    this.tracking_ = tracking;
    this.geolocation_.setTracking(tracking);
  }

  /**
   * Esta función destruye este control y limpia el HTML.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.removePositions_();
    super.destroy();
  }
}

/**
 * Estilo de la localización.
 * @const
 * @type {ol.style.Style}
 * @public
 * @api stable
 * @memberof module:M/impl/control/Location~
 */
Location.POSITION_STYLE = new OLStyle({
  image: new OLStyleCircle({
    radius: 6,
    fill: new OLStyleFill({
      color: '#3399CC',
    }),
    stroke: new OLStyleStroke({
      color: '#fff',
      width: 2,
    }),
  }),
});

/**
 * Zoom de la localización.
 * @const
 * @type {number}
 * @public
 * @api stable
 */
Location.ZOOM = 16; // 12;

export default Location;
