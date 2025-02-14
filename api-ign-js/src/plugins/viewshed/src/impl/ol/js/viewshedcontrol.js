/**
 * @module M/impl/control/ViewShedControl
 */
export default class ViewShedControl extends M.impl.Control {
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
    this.facadeMap_ = map;
    super.addTo(map, html);
  }

  /**
   * Transform coordinates
   * @public
   * @function
   * @param {*} coords, srsTarget, srsOrigin
   */
  transformCoordinates(coords, srsTarget) {
    return ol.proj.transform(coords, this.facadeMap_.getProjection().code, srsTarget);
  }

  /**
   * Loads GeoJSON layer
   * @public
   * @function
   * @param {*} source, layerName
   */
  loadGeoJSONLayer(source, point) {
    let features = new ol.format.GeoJSON()
      .readFeatures(source, { featureProjection: this.facadeMap_.getProjection().code });

    features = this.featuresToFacade(features);
    const pointFeature = new M.Feature('clickedPoint', {
      type: 'Feature',
      id: 'clickedPoint',
      geometry: {
        type: 'Point',
        coordinates: point,
      },
    });

    const layer = new M.layer.Vector({ name: 'viewresult', legend: 'viewresult', extract: false });
    layer.addFeatures(features);
    layer.addFeatures([pointFeature]);
    this.facadeMap_.addLayers(layer);
    pointFeature.setStyle(new M.style.Point({
      radius: 7,
      fill: {
        color: 'red',
      },
      stroke: {
        color: 'white',
        width: 2,
      },
    }));

    features.forEach((f) => {
      f.setStyle(new M.style.Polygon({
        fill: {
          color: '#71a7d3',
          opacity: 0.5,
        },
        stroke: {
          color: '#71a7d3',
          width: 2,
        },
      }));
    });

    return features;
  }

  /**
   * Converts Openlayers features to Mapea features.
   * @public
   * @function
   * @api
   * @param {Array<OL.Feature>} implFeatures
   * @returns {Array<M.Feature>}
   */
  featuresToFacade(implFeatures) {
    return implFeatures.map((feature) => {
      return M.impl.Feature.olFeature2Facade(feature);
    });
  }

  /**
   * Centers on features
   * @public
   * @function
   * @api
   * @param {*} features -
   */
  centerFeatures(features) {
    if (!M.utils.isNullOrEmpty(features)) {
      if ((features.length === 1) && (features[0].getGeometry().type === 'Point')) {
        const pointView = new ol.View({
          center: features[0].getGeometry().coordinates,
          zoom: 15,
        });
        this.facadeMap_.getMapImpl().setView(pointView);
      } else {
        const extent = M.impl.utils.getFeaturesExtent(features);
        this.facadeMap_.getMapImpl().getView().fit(extent, {
          duration: 500,
          minResolution: 1,
        });
      }
    }
  }
}
