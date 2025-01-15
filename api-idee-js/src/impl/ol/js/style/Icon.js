/**
 * @module M/impl/style/Icon
 */
import OLStyleIcon from 'ol/style/Icon';
/**
 * @classdesc
 * Esta clase hereda de la clase "ol/style/Icon" de OpenLayers.
 * @api
 */
class Icon extends OLStyleIcon {
  /**
   * Tamaño de imagen real utilizado.
   * @public
   * @return {ol.Size} Tamaño.
   * @api stable
   * @expose
   */
  getImageSize() {
    return this.iconImage_.getSize();
  }
}

export default Icon;
