/**
 * @module IDEE/control/DownloadControl
 */
import shpWrite from 'shp-write';
import tokml from 'tokml';
import togpx from 'togpx';
import template from '../../templates/download';
import { getValue } from './i18n/language';

export default class DownloadControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(map, managementControl) {
    const impl = new IDEE.impl.Control();
    super('Download', impl);

    this.map_ = map;

    /**
     * vectorsmanagementcontrol to comunicate with others controls
     */
    this.managementControl_ = managementControl;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    /**
     * Selected layer
     */
    this.layer_ = null;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.template = IDEE.template.compileSync(template, {
      vars: {
        translations: {
          download: getValue('download'),
        },
      },
    });

    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);
    const downloadBtn = this.template.querySelector('#m-vectorsmanagement-download-btn');
    this.managementControl_.accessibilityTab(this.template);
    downloadBtn.addEventListener('click', this.downloadBtnEvent.bind(this));
  }

  /**
   * Downloads vector layer or selected features as GeoJSON, kml or gml.
   * @public
   * @function
   * @api
   */
  downloadBtnEvent() {
    const selection = this.managementControl_.getSelection();
    if (selection === 'layer') {
      this.downloadLayer();
    } else {
      this.downloadFeature();
    }
  }

  /**
   * Downloads vector layer as GeoJSON, kml or gml.
   * @public
   * @function
   * @api
   */
  downloadLayer() {
    const featuresGeoJson = [];
    const textFeatures = [];
    this.layer_.getFeatures().forEach((feature) => {
      const style = feature.getStyle();
      if (!style || style.get('label') === undefined) {
        featuresGeoJson.push(feature.getGeoJSON());
      } else {
        textFeatures.push(feature);
      }
    });

    if (featuresGeoJson.length > 0 || textFeatures.length > 0) {
      const nonTextConverted = IDEE.impl.utils.geojsonTo4326(
        featuresGeoJson,
        this.map_.getProjection().code,
      );
      const textConverted = this.getTextFeaturesGeoJSON(textFeatures);
      const geojsonLayer = { type: 'FeatureCollection', features: [...nonTextConverted, ...textConverted] };
      this.download(geojsonLayer);
    } else {
      IDEE.dialog.info(getValue('exception.emptylayer'));
    }
  }

  /**
   * Downloads selected features as GeoJSON, kml or gml.
   * @public
   * @function
   * @api
   */
  downloadFeature() {
    const features = this.managementControl_.getSelectedFeatures();
    if (features.length > 0) {
      const featuresGeoJson = [];
      const textFeatures = [];
      features.forEach((f) => {
        const style = f.getStyle();
        if (!style || style.get('label') === undefined) {
          featuresGeoJson.push(f.getGeoJSON());
        } else {
          textFeatures.push(f);
        }
      });
      const nonTextConverted = IDEE.impl.utils.geojsonTo4326(
        featuresGeoJson,
        this.map_.getProjection().code,
      );
      const textConverted = this.getTextFeaturesGeoJSON(textFeatures);
      const geojsonLayer = { type: 'FeatureCollection', features: [...nonTextConverted, ...textConverted] };
      this.download(geojsonLayer);
    } else {
      IDEE.dialog.info(getValue('exception.featuresel'));
    }
  }

  /**
   * Converts text features to GeoJSON Point features with label properties.
   * @public
   * @function
   * @api
   * @param {Array<IDEE.Feature>} features
   * @returns {Array}
   */
  getTextFeaturesGeoJSON(features) {
    const textFeaturesGeoJson = features.map((feature) => {
      const featureGeoJson = feature.getGeoJSON();
      const style = feature.getStyle();
      featureGeoJson.properties = featureGeoJson.properties || {};
      featureGeoJson.properties.lbl_txt = style.get('label.text') || '';
      featureGeoJson.properties.lbl_font = style.get('label.font') || '';
      featureGeoJson.properties.lbl_clr = style.get('label.color') || '';
      return featureGeoJson;
    });
    return IDEE.impl.utils.geojsonTo4326(textFeaturesGeoJson, this.map_.getProjection().code);
  }

  /**
   * Create geojson, kml or shp file download link
   * @public
   * @function
   * @api
   * @param {*} geojsonLayer
   */
  download(geojsonLayer) {
    const fileName = this.getLayer().name || 'misgeometrias';
    const downloadFormat = this.template.querySelector('#m-vectorsmanagement-download-format').value;
    let arrayContent;
    let mimeType;
    let extensionFormat;

    switch (downloadFormat) {
      case 'geojson':
        arrayContent = JSON.stringify(geojsonLayer);
        mimeType = 'geo+json';
        extensionFormat = 'geojson';
        break;
      case 'kml':
        arrayContent = tokml(geojsonLayer);
        mimeType = 'vnd.google-earth.kml+xml';
        extensionFormat = 'kml';
        break;
      case 'gpx':
        arrayContent = togpx(geojsonLayer);
        mimeType = 'gpx+xml';
        extensionFormat = 'gpx';
        break;
      case 'shp':
        const json = this.parseGeojsonForShp(geojsonLayer);
        const options = {
          folder: fileName,
          types: {
            point: 'puntos',
            polygon: 'poligonos',
            polyline: 'lineas',
          },
        };
        shpWrite.download(json, options);
        break;
      default:
        IDEE.dialog.error(getValue('exception.ficherosel'));
        break;
    }

    if (downloadFormat !== 'shp') {
      const url = window.URL.createObjectURL(new window.Blob([arrayContent], {
        type: `application/${mimeType}`,
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}.${extensionFormat}`);
      document.body.appendChild(link);
      link.click();
    }

    this.managementControl_.deactive(document, 'm-vectorsmanagement-download');
  }

  /**
   * Parses geojson before shp download.
   * Changes geometry type to simple when necessary and removes one pair of brackets.
   * @public
   * @function
   * @api
   * @param {*} geojsonLayer - geojson layer with drawn and uploaded features
   */
  parseGeojsonForShp(geojsonLayer) {
    const newGeoJson = geojsonLayer;
    const newFeatures = [];

    geojsonLayer.features.forEach((originalFeature) => {
      const featureType = originalFeature.geometry.type;

      if (featureType.match(/^Multi/)) {
        const features = originalFeature.geometry.coordinates
          .map((simpleFeatureCoordinates, idx) => {
            const newFeature = {
              type: 'Feature',
              id: `${originalFeature.id}${idx}`,
              geometry: {
                type: '',
                coordinates: simpleFeatureCoordinates,
              },
              properties: {},
            };
            switch (featureType) {
              case 'MultiPoint':
                newFeature.geometry.type = 'Point';
                break;
              case 'MultiLineString':
                newFeature.geometry.type = 'LineString';
                break;
              case 'MultiPolygon':
                newFeature.geometry.type = 'Polygon';
                break;
              default:
            }
            return newFeature;
          });
        newFeatures.push(...features);
      } else {
        newFeatures.push(originalFeature);
      }
    });

    newGeoJson.features = newFeatures;
    for (let i = 0; i < newGeoJson.features.length; i += 1) {
      delete newGeoJson.features[i].id;
    }
    return newGeoJson;
  }

  /**
   * Sets the layer selected for management
   * @public
   * @function
   * @api
   * @param {IDEE.layer} layer
   */
  setLayer(layer) {
    this.layer_ = layer;
  }

  /**
   * This function returns the layer selected for management
   *
   * @public
   * @function
   * @api stable
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {}

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.template.remove();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof DownloadControl;
  }
}
