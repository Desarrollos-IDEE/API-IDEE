export default class TemplateCustomizer extends IDEE.impl.Control {
  /**
   * @classdesc
   * Main constructor of the measure conrol.
   *
   * @constructor
   * @api stable
   */
  constructor(map) {
    super();
    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = map;

    this.errors = [];
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {function} template template of this control
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;
    map.getMapImpl().addControl(this);
  }

  /**
   * Función auxiliar para obtener la resolución de un punto
   * @param {string} projection Código de la proyección
   * @param {number} dpi DPI
   * @param {Array<number>} point Punto [x, y]
   * @return {number} Resolución
   */
  getPointResolution(projection, dpi, point) {
    return ol.proj.getPointResolution(projection, dpi / 25.4, point);
  }

  /**
   * Función auxiliar para transformar coordenadas entre proyecciones
   * @param {Array<number>} coordinates Coordenadas [x, y]
   * @param {string} sourceProjection Proyección origen
   * @param {string} targetProjection Proyección destino
   * @return {Array<number>} Coordenadas transformadas
   */
  transformCoordinates(coordinates, sourceProjection, targetProjection) {
    return ol.proj.transform(coordinates, sourceProjection, targetProjection);
  }

  /**
   * Función auxiliar para transformar un extent entre proyecciones
   * @param {ol.View.Extent} extent
   * @param {String} sourceProjection
   * @param {String} targetProjection
   * @returns {ol.View.Extent} Extent transformado
   */
  transformExtent(extent, sourceProjection, targetProjection) {
    return ol.proj.transformExtent(extent, sourceProjection, targetProjection);
  }

  getMetersPerUnit(units) {
    return ol.proj.Units.METERS_PER_UNIT[units];
  }

  /**
   * Función auxiliar para crear una nueva vista
   * @param {Object} options Opciones de la vista
   * @return {ol.View} Nueva vista
   */
  createView(options) {
    return new ol.View(options);
  }
}
