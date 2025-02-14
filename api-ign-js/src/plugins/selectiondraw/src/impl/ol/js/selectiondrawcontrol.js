/**
 * @private
 * @const
 */
const POINT_STYLE = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255,255,255,0.4)',
  }),
  stroke: new ol.style.Stroke({
    color: '#3399CC',
    width: 2,
  }),
  image: new ol.style.Circle({
    fill: new ol.style.Fill({
      color: 'rgba(255,255,255,0.4)',
    }),
    stroke: new ol.style.Stroke({
      color: '#3399CC',
      width: 2,
    }),
    radius: 6,
  }),
});

/**
 * @private
 * @const
 */
const DRAW_END_EVENT = 'drawend';

/**
 * @private
 * @const
 */
const GEOJSON_FORMAT = new M.impl.format.GeoJSON();

/**
 * @module M/impl/control/SelectionDrawControl
 */
export default class SelectionDrawControl extends M.impl.Control {
  constructor(destProj) {
    super();
    this.facadeControl = null;
    this.destProj = destProj;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);
    this.map = map;
    this.olMap = map.getMapImpl();
  }

  /**
   * @public
   * @function
   * @api
   */
  activate(type, btn) {
    btn.classList.add('activated');
    const src = this.map.getProjection().code;
    const drawLayer = this.map.getLayers().find((l) => l.name === '__draw__');
    if (drawLayer != null) {
      const ol3Layer = drawLayer.getImpl().getOL3Layer();
      ol3Layer.setStyle(POINT_STYLE);
      if (ol3Layer != null) {
        const source = ol3Layer.getSource();
        this.interaction_ = new ol.interaction.Draw({
          source,
          type,
        });
        this.interaction_.on(DRAW_END_EVENT, (evt) => {
          const feature = evt.feature.clone();
          const area = ol.sphere.getArea(feature.getGeometry());
          feature.getGeometry().transform(src, this.destProj);
          const featureJSON = GEOJSON_FORMAT.writeFeatureObject(feature);
          featureJSON.properties = {
            area: {
              km: area / (10 ** 6),
              m: area,
            },
          };
          this.facadeControl.fire('finished:draw', [featureJSON]);
        });
        this.olMap.addInteraction(this.interaction_);
      }
    }
  }

  /**
   * @public
   * @function
   * @api
   */
  deactivate(listBtn) {
    listBtn.forEach((btn) => btn.classList.remove('activated'));
    this.olMap.removeInteraction(this.interaction_);
  }
}
