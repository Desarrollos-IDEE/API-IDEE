/**
 * @module M/impl/View
 */
import { isNullOrEmpty } from 'M/util/Utils';
import OLView from 'ol/View';

/**
 * @classdesc
 * Implementación de la clase "View". Representa una vista simple en 2D
 * del mapa.
 * @property {number} userZoom_ Nivel de zoom especificado por el usuario.
 *
 * @api
 * @extends {ol.View}
 */
class View extends OLView {
  /**
   * Constructor principal de la clase "View".
   *
   * @constructor
   * @param {olx.ViewOptions} options Opciones de la vista.
   * - center: Centro inicial de la vista.
   * - constrainRotation: Restricción de rotación.
   * - enableRotation: Habilitar rotación.
   * - extent: La extensión que restringe la vista, en otras palabras,
   * nada fuera de esta extensión puede ser visible en el mapa.
   * - constrainOnlyCenter: Si es verdadero, la restricción de extensión
   * solo se aplicará al centro de la vista y no a toda la extensión. Por defecto falso.
   * - smoothExtentConstraint: Si es verdadero, la restricción de extensión se aplicará
   * sin problemas, es decir, permitirá que la vista se salga ligeramente de la extensión dada.
   * Por defecto verdadero.
   * - maxResolution: La resolución máxima utilizada para determinar la restricción de resolución.
   * - minResolution: La resolución mínima utilizada para determinar la restricción de resolución.
   * - maxZoom: El nivel de zoom máximo utilizado para determinar la restricción de resolución.
   * Por defecto 28.
   * - minZoom: El nivel de zoom mínimo utilizado para determinar la restricción de resolución.
   * Por defecto 0.
   * - multiWorld: Indica si la vista puede mostrar varios mundos. Por defecto falso.
   * - constrainResolution: Indica si se permiten niveles de zoom intermedios. Por defecto falso.
   * - smoothResolutionConstraint: Indica si los valores mínimos/máximos
   * de resolución se aplicarán sin
   * problemas. Por defecto verdadero.
   * - showFullExtent: Permite que la vista se aleje para mostrar la extensión configurada completa.
   * Por defecto falso.
   * - projection: Proyección. Por defecto 'EPSG:3857'.
   * - resolution: Resolución inicial de la vista.
   * - resolutions: Resoluciones que determinan los niveles de zoom.
   * - rotation: Rotación inicial de la vista en radianes. Por defecto 0.
   * - zoom: Nivel de zoom utilizado para calcular la resolución inicial de la vista.
   * Solo se usa si la resolución no está definida.
   * - zoomFactor: El factor de zoom utilizado para calcular la resolución correspondiente.
   * Por defecto 2.
   * - padding: Relleno (en píxeles). Por defecto [0, 0, 0, 0]
   * @api
   */
  constructor(options) {
    super(options);
    /**
     * "View" userZoom: Nivel del zoom especificado por el usuario.
     */
    this.userZoom_ = null;
  }

  /**
   * Este método establece un nuevo nivel de zoom especificado por el usuario.
   *
   * @function
   * @param {number} zoom Nuevo nivel de zoom.
   * @public
   * @api
   */
  setUserZoom(zoom) {
    this.userZoom_ = zoom;
    if (!isNullOrEmpty(zoom)) {
      this.setZoom(zoom);
    }
  }

  /**
   * Este método obtiene el nivel de zoom especificado por el usuario.
   *
   * @function
   * @returns {number} Nivel de zoom especificado por el usuario.
   * @public
   * @api
   */
  getUserZoom() {
    return this.userZoom_;
  }

  /**
   * Este método establece una nueva proyección especificada por el usuario.
   *
   * @function
   * @param {ol.proj.Projection} projection Proyección a aplicar al mapa.
   * @public
   * @api
   */
  setProjection(projection) {
    this.projection_ = projection;
  }

  /**
   * Este método obtiene las resoluciones de la vista.
   *
   * @function
   * @returns {Array<Number>} Resoluciones de la vista.
   * @public
   * @api
   */
  getResolutions() {
    return this.get('resolutions');
  }

  /**
   * Este método establece nuevas resoluciones especificadas por el usuario.
   *
   * @function
   * @param {Array<Number>} resolutions Resoluciones a aplicar al mapa.
   * @public
   * @api
   */
  setResolutions(resolutions) {
    this.set('resolutions', resolutions);
    this.maxResolution_ = resolutions[0];
    this.minResolution_ = resolutions[resolutions.length - 1];
    // this.constraints_.resolution = View.createSnapToResolutions(resolutions);
    // updates zoom
    // updates center
    // this.setCenter(this.getCenter());
    this.applyOptions_({
      minZoom: this.minZoom_,
      resolutions,
      zoomFactor: this.zoomFactor_,
      minResolution: this.minResolution_,
      maxResolution: this.maxResolution_,
      projection: this.projection_,
      center: this.getCenter(),
    });
    if (!isNullOrEmpty(this.userZoom_)) {
      this.setZoom(this.userZoom_);
    }
  }
}

export default View;
