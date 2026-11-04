/**
 * Crea una copia independiente de un objeto geográfico.
 *
 * @param {IDEE.Feature} feature Objeto geográfico.
 * @return {IDEE.Feature} Copia.
 */
export const cloneFeature = (feature) => {
  // eslint-disable-next-line no-underscore-dangle
  const implFeatureClone = feature.getImpl().olFeature_.clone();
  return IDEE.impl.Feature.feature2Facade(implFeatureClone);
};

/**
 * Crea un polígono con la extensión de un objeto geográfico.
 *
 * @param {IDEE.Feature} feature Objeto geográfico.
 * @return {IDEE.Feature} Polígono de la extensión.
 */
export const extentFeature = (feature) => {
  const extent = feature.getImpl().getFeature().getGeometry().getExtent();
  return IDEE.impl.Feature.feature2Facade(new ol.Feature({
    geometry: ol.geom.Polygon.fromExtent(extent),
  }));
};

/**
 * Devuelve, en el mismo orden, los objetos geográficos de una capa que
 * corresponden a unos objetos de OpenLayers.
 *
 * @param {IDEE.layer.Vector} layer Capa.
 * @param {Array<ol.Feature>} olFeatures Objetos de OpenLayers.
 * @return {Array<IDEE.Feature|undefined>} Objetos geográficos de la capa.
 */
export const toFacadeFeatures = (layer, olFeatures) => {
  const features = layer.getFeatures();
  return olFeatures
    .map((olFeature) => features.find((f) => f.getImpl().getFeature() === olFeature));
};
