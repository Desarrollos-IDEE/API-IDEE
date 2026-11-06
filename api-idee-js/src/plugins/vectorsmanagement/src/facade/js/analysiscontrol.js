/**
 * @module IDEE/control/AnalysisControl
 */
import template from '../../templates/analysis';
import infoanalysis from '../../templates/infoanalysis';
import pointProfileTemplate from '../../templates/pointprofile';
import { getValue } from './i18n/language';
import {
  BUFFER,
  ELEVATION,
  MEASUREMENT,
  PROJECTION_INFO,
  requireImplementation,
} from './contracts';

const warnElevationError = () => {
  console.warn('Error reading elevation profile'); // eslint-disable-line no-console
};

export default class AnalysisControl extends IDEE.Control {
  /**
  * @classdesc
  * Main constructor of the class. Creates a PluginControl
  * control
  *
  * @constructor
  * @extends {IDEE.Control}
  * @param {IDEE.Map} map
  * @param {VectorsManagementControl} managementControl
  * @param {Object} impl platform implementation (MEASUREMENT, ELEVATION, BUFFER,
  * PROJECTION_INFO)
  * @api stable
  */
  constructor(map, managementControl, impl) {
    // 1. checks if the implementation fulfils the contracts of this control
    requireImplementation(impl, [MEASUREMENT, ELEVATION, BUFFER, PROJECTION_INFO], 'exception.impl_analysiscontrol');

    // 2. implementation of this control
    super('Analysis', impl);

    this.getImpl().facadeControl = this;

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

    /**
     * Layer for buffers
     */
    this.bufferLayer = null;

    /**
     * Style for buffer layer
     */
    this.bufferLayerStyle = new IDEE.style.Polygon({
      stroke: { color: '#71a7d3' },
      fill: { color: '#71a7d3', opacity: 0.6 },
    });

    this.destroyLayerBufferFN = this.destroyLayerBuffer.bind(this);

    this.map_.on(IDEE.evt.REMOVED_LAYER, this.destroyLayerBufferFN);
  }

  /**
   * Esta función destruye la capa buffer
   *
   * @public
   * @function
   * @api
   */
  destroyLayerBuffer(layers) {
    let layersParam = layers;
    if (!IDEE.utils.isArray(layers)) {
      layersParam = [layers];
    }
    const bufferLayer = layersParam.filter((l) => { return l.name === 'bufferLayer'; });
    if (bufferLayer.length > 0) {
      this.bufferLayer = null;
    }
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
          analysisProfile: getValue('analysisProfile'),
          analysisBuffer: getValue('analysisBuffer'),
          calculate: getValue('calculate'),
          getGeoJSON: getValue('getGeoJSON'),
          extension: getValue('extension'),
        },
      },
    });

    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);
    this.addEvents();
    this.managementControl_.accessibilityTab(this.template);

    const feature = this.managementControl_.getSelectedFeatures()[0];
    if (feature) {
      this.showFeatureInfo(feature);
    }
  }

  /**
   * This function creates a new layer for each analysis operation which returns a geometry.
   * @public
   * @function
   * @param {String} operationName - name of the analysis operation
   * @param {Boolean} displayInLayerSwitcher - whether the layer is shown in the layer switcher
   * @param {IDEE.source.Vector} source - source of the layer
   * @param {IDEE.style.Style} style - style of the layer
   * @returns {IDEE.layer.Vector} - created analysis layer
   * @api stable
   */
  createAnalysisLayer(operationName, displayInLayerSwitcher, source, style) {
    const layerNameCode = IDEE.utils.generateRandom(operationName.concat('_'));
    return new IDEE.layer.Vector({
      source,
      extract: false,
      name: layerNameCode,
      style,
    }, { displayInLayerSwitcher });
  }

  /**
   * Add event listener to analysis buttons
   * @public
   * @function
   * @api
   */
  addEvents() {
    this.template.querySelector('#topographic-profile-btn').addEventListener('click', (evt) => this.analysisBtnClick(evt.target.id));
    this.template.querySelector('#buffer-btn').addEventListener('click', (evt) => this.analysisBtnClick(evt.target.id));
    this.template.querySelector('#vectorsmanagement-btnCoord').addEventListener('click', (evt) => {
      this.analysisBtnClick(evt.target.id);
      if (evt.target.classList.contains('activated')) {
        document.querySelector('#vectorsmanagement-analysis-btn-container').classList.add('closed');
        document.querySelector('.m-vectorsmanagement-analysis-featureInfo').style.display = 'block';
      }
    });
    this.template.querySelector('#vectorsmanagement-analysis-btn').addEventListener('click', this.calculateAnalysis.bind(this));
    this.template.querySelector('#vectorsmanagement-btnToGeojson').addEventListener('click', () => {
      const controlSelected = this.managementControl_.selectionControl;
      // eslint-disable-next-line no-underscore-dangle
      const selectFeatures = controlSelected.selection_ === 'layer' ? this.layer_.getFeatures() : controlSelected.getSelectedFeatures();
      const featuresArea = this.getImpl().getAreaGeoJSON(selectFeatures);
      const pre = JSON.stringify(featuresArea.length === 1
        ? featuresArea[0] : featuresArea, null, 2);
      IDEE.dialog.info(`<pre class="vectorsmanagement-dialogCode"><code>${pre}</code></pre>`, 'GeoJSON');
    });
  }

  /**
   * De/activates analysis option.
   * @public
   * @function
   * @api
   * @param {String} btnClick - tool button id
   */
  analysisBtnClick(btnClick) {
    const active = this.getControlActive();
    if (active && active.id !== btnClick) {
      this.template.querySelector(`#${active.id}`).classList.remove('activated');
    }
    this.template.querySelector(`#${btnClick}`).classList.add('activated');
    this.template.querySelector('#vectorsmanagement-analysis-btn-container').classList.remove('closed');

    document.querySelector('.m-vectorsmanagement-analysis-featureInfo').style.display = 'none';
  }

  /**
   * This function returns node button of active control.
   * @public
   * @function
   * @api stable
   */
  getControlActive() {
    return this.template.querySelectorAll('.m-vectorsmanagement-analysis>#analysisBtns .activated').length === 0 ? false : this.template
      .querySelectorAll('.m-vectorsmanagement-analysis>#analysisBtns .activated')[0];
  }

  /**
   * This function the layer selected in the layer selector.
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer
   * @api
   */
  setLayer(layer) {
    this.layer_ = layer;
  }

  /**
   * This function set the selected feature after selection interaction
   * @public
   * @function
   * @param {{features: Array<IDEE.Feature|undefined>}} e selection event of the implementation
   * @api
   */
  onSelect(e) {
    this.feature = e.features[0];
    this.calculateAnalysis();
  }

  /**
   * This function calls profile or buffer creation.
   * @public
   * @function
   * @api
   */
  calculateAnalysis() {
    const active = this.getControlActive();
    document.querySelector('#vectorsmanagement-analysis-btn-container').classList.add('closed');
    document.querySelector('#vectorsmanagement-analysis-div').innerHTML = getValue('readingAltitude');
    document.querySelector('#vectorsmanagement-analysis-div').style.height = '51px';
    if (active.id === 'topographic-profile-btn') {
      this.getProfile();
    } else if (active.id === 'buffer-btn') {
      this.drawBuffer();
    }
  }

  /**
   * This function calculate topographic profile of feature.
   * @public
   * @function
   * @api
   */
  getProfile() {
    const selectedFeatures = this.managementControl_.getSelectedFeatures();
    if (selectedFeatures.length > 0) {
      if (selectedFeatures.length > 1) {
        IDEE.dialog.info(getValue('exception.topographic_one_element'));
      } else {
        this.feature = selectedFeatures[0];
        if (this.feature.getGeometry().type === 'Point') {
          this.getImpl().calculatePoint(this.feature).then((pointXYZ) => {
            document.querySelector('#vectorsmanagement-analysis-btn-container').classList.remove('closed');
            this.clearAnalysisResult_();
            if (pointXYZ) {
              this.showPointProfile({
                ...pointXYZ,
                altitude: pointXYZ.altitude.toFixed(2).replace('.', ','),
              });
            }
          }).catch(warnElevationError);
        } else {
          this.requestProfile_(this.feature).then((profile) => {
            if (profile) {
              this.getImpl().showProfile(profile, this.managementControl_.profileGraphs);
            }
          }).catch(warnElevationError);
        }
      }
    } else {
      IDEE.dialog.info(getValue('exception.featuresel'));
    }
  }

  /**
   * Requests the topographic profile of a feature
   * and clears the analysis result area.
   * @private
   * @function
   * @param {IDEE.Feature} feature
   * @returns {Promise<Array|undefined>} profile coordinates [x, y, altitude]
   */
  requestProfile_(feature) {
    return this.getImpl().calculateProfile(feature).then((profile) => {
      document.querySelector('#vectorsmanagement-analysis-btn-container').classList.add('closed');
      this.clearAnalysisResult_();
      return profile;
    });
  }

  /**
   * Clears the analysis result area.
   * @private
   * @function
   */
  clearAnalysisResult_() {
    document.querySelector('#vectorsmanagement-analysis-div').innerHTML = '';
    document.querySelector('#vectorsmanagement-analysis-div').style.height = '0';
  }

  /**
   * This function show modal to ask for buffer distance
   * @public
   * @function
   * @api
   */
  drawBuffer() {
    const selection = this.managementControl_.getSelection();
    if (typeof turf === 'undefined') {
      IDEE.dialog.error(getValue('turf.exception.notLoaded'));
    } else if (selection === 'feature' && this.managementControl_.getSelectedFeatures().length === 0) { // buffer de los features seleccionados
      IDEE.dialog.info(getValue('exception.featuresel'));
    } else if (selection === 'layer' && this.layer_.getFeatures().length === 0) { // buffer de toda la capa
      IDEE.dialog.info(getValue('exception.emptylayer'));
    } else {
      IDEE.dialog.info(
        `<div id="chooseBuffer">
          <input type="number" id="metreBuffer" value="50" style="width: 10rem; margin:0;">
          <div style="padding: 1rem 0 .5rem 0; display:flex; flex-direction:column; justify-content:space-between; row-gap:.5rem;">
            <div style="display:flex; flex-direction:row; align-items:flex-end; column-gap:.25rem;">
              <input type="radio" name="unit" id="metro" value="m" checked="checked"/>
              <label for="metro">${getValue('unit_m')}</label>
            </div>
            <div style="display:flex; flex-direction:row; align-items:flex-end; column-gap:.25rem;">
              <input type="radio" name="unit" id="kilometro" value="km"/>
              <label for="kilometro">${getValue('unit_km')}</label>
            </div>
          </div>
        </div>`,
        getValue('title_popup_buffer'),
      );
      const color = '#71a7d3';
      const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
      dialog.style.minWidth = 'auto';
      const btn = document.querySelector('.m-button button');
      const inputBuffer = document.querySelector('div.m-modal input#metreBuffer');
      let distance = 50;
      inputBuffer.addEventListener('keyup', () => {
        distance = inputBuffer.value;
        btn.style.pointerEvents = document.querySelector('div.m-modal input#metreBuffer:invalid') === null ? 'initial' : 'none';
      });
      inputBuffer.addEventListener('keydown', () => {
        btn.style.pointerEvents = document.querySelector('div.m-modal input#metreBuffer:invalid') === null ? 'initial' : 'none';
      });
      let unit = 1;
      const unitBufferM = document.querySelector('div.m-modal input#metro');
      const unitBufferKm = document.querySelector('div.m-modal input#kilometro');
      unitBufferM.addEventListener('change', () => { unit = 1; });
      unitBufferKm.addEventListener('change', () => { unit = 1000; });
      btn.style.backgroundColor = color;
      const btn2 = document.createElement('button');
      btn2.innerHTML = getValue('accept');
      btn.innerHTML = getValue('close');
      btn2.style.width = '75px';
      btn2.style.marginRight = '8px';
      btn2.style.backgroundColor = color;
      btn.parentElement.insertBefore(btn2, btn);
      // btn es cerrar btn2 es aceptar
      btn2.addEventListener('click', (ev) => {
        this.bufferLayer = this.createAnalysisLayer('analysisBufferLayer', true, null, this.bufferLayerStyle);
        this.map_.addLayers(this.bufferLayer);
        this.addBuffer_((distance * unit));
        btn.click();
      });
    }
  }

  /**
   * Get feature and create buffer
   * @public
   * @function
   * @param {Integer} distance
   * @api stable
   */
  addBuffer_(distance) {
    const selection = this.managementControl_.getSelection();
    const bufferFeatures = [];
    let features = [];
    const layerID = this.getImpl().getLayerId(this.managementControl_.selectionControl.getLayer());
    if (selection === 'feature') { // buffer de los features seleccionados
      features = this.managementControl_.getSelectedFeatures();
    } else { // buffer de toda la capa
      features = this.layer_.getFeatures();
    }
    features.forEach((f) => {
      const MFeature = this.createFeatureBuffer(f, distance, layerID);
      bufferFeatures.push(MFeature);
    });
    this.bufferLayer.addFeatures(bufferFeatures);
  }

  /**
   * This function create a buffer feature from feature and distance.
   * @public
   * @function
   * @param {IDEE.Feature} feature
   * @param {Integer} distance
   * @param {*} layerID identifier of the layer of the feature
   * @api
   */
  createFeatureBuffer(feature, distance, layerID) {
    return this.getImpl().createBufferFeature(feature, distance, layerID);
  }

  /**
   * This function show modal with point data profile.
   * @public
   * @function
   * @param {Array} pointXYZ array con coordenadas y altura de un punto
   * @api
   */
  showPointProfile(pointXYZ) {
    this.closePointProfile();
    const mapProj = this.getImpl().getProjectionInfo(pointXYZ.map.projection);
    const mapUnit = mapProj.units === 'm' ? 'm' : '°';
    const mapLabels = mapProj.units === 'm' ? ['X', 'Y'] : [getValue('creationLongitude'), getValue('creationLatitude')];
    const geographicProj = this.getImpl().getProjectionInfo(pointXYZ.geographic.projection);
    const dist = mapProj.codes[0] !== geographicProj.codes[0];
    this.pointTemplate = IDEE.template.compileSync(pointProfileTemplate, {
      vars: {
        translations: {
          longitude: getValue('creationLongitude'),
          latitude: getValue('creationLatitude'),
          altitude: getValue('altitude'),
          title_point_profile: getValue('title_point_profile'),
          point_profile_map_coordinates: getValue('point_profile_map_coordinates'),
          point_profile_geographic_coordinates: getValue('point_profile_geographic_coordinates'),
        },
        mapCoordX: `${mapLabels[0]}: ${pointXYZ.map.coordinates[0]}${mapUnit}`,
        mapCoordY: `${mapLabels[1]}: ${pointXYZ.map.coordinates[1]}${mapUnit}`,
        mapProj: `${mapProj.datum} - ${mapProj.proj.toUpperCase()} (${mapProj.codes[0]})`,
        geographicCoordX: `${pointXYZ.geographic.coordinates[0]}°`,
        geographicCoordY: `${pointXYZ.geographic.coordinates[1]}°`,
        geographicProj: `${geographicProj.datum} - ${geographicProj.proj.toUpperCase()} (${geographicProj.codes[0]})`,
        altitude: pointXYZ.altitude,
        dist,
      },
    });
    document.body.appendChild(this.pointTemplate);
    this.managementControl_.accessibilityTab(this.pointTemplate);

    this.pointTemplate.querySelector('.m-panel-btn').addEventListener('click', () => this.closePointProfile());
    // this.addModalEvents();
  }

  /**
   * This function closes the modal with point data profile.
   * @public
   * @function
   * @api
   */
  closePointProfile() {
    if (this.pointTemplate) {
      this.removeModalEvents();
      this.pointTemplate.remove();
      this.pointTemplate = null;
    }
  }

  /**
   * Mouseup event function
   * @public
   * @function
   * @api
   */
  mouseupFunction() {
    this.isDragging = false;
  }

  /**
   * mousemove event function for move modal window
   * @public
   * @function
   * @param {Event} evt
   * @api
   */
  mousemoveFunction(evt) {
    if (this.isDragging) {
      this.pointTemplate.style.top = `${(evt.clientY - this.offsetY) + (this.pointTemplate.clientHeight / 2)}px`;
      this.pointTemplate.style.left = `${(evt.clientX - this.offsetX) + (this.pointTemplate.clientWidth / 2)}px`;
    }
  }

  /**
   * This function adds events to modal to move the window.
   * @public
   * @function
   * @api
   */
  addModalEvents() {
    this.pointTemplate.addEventListener('mousedown', (evt) => {
      this.isDragging = true;
      this.offsetX = evt.offsetX;
      this.offsetY = evt.offsetY;
    });

    this.mouseupFunctionEvent = this.mouseupFunction.bind(this);
    this.mousemoveFunctionEvent = this.mousemoveFunction.bind(this);
    document.addEventListener('mouseup', this.mouseupFunctionEvent);
    document.addEventListener('mousemove', this.mousemoveFunctionEvent);

    // IDEE.utils.draggabillyPlugin(this.pointTemplate, '#point-profile-title');
  }

  /**
   * This function removes modal events.
   * @public
   * @function
   * @api
   */
  removeModalEvents() {
    document.removeEventListener('mouseup', this.mouseupFunctionEvent);
    document.removeEventListener('mousemove', this.mousemoveFunctionEvent);
  }

  /**
   * On select, shows feature info.
   * @public
   * @function
   * @api
   */
  showFeatureInfo(feature) {
    const infoContainer = document.querySelector('#analysisBtns #featureInfo');

    if (infoContainer !== null) {
      infoContainer.classList.remove('closed');
      infoContainer.innerHTML = '';
    }

    let point = false;
    let line = false;
    let polygon = false;

    switch (feature.getGeometry().type) {
      case 'Point':
      case 'MultiPoint':
        const [x, y] = this.getImpl().getFeatureCoordinates(feature);
        if (infoContainer !== null) {
          point = {};
          point.x = Math.round(x * 1000) / 1000;
          point.y = Math.round(y * 1000) / 1000;
        }
        break;
      case 'LineString':
      case 'MultiLineString':
        let lineLength = this.getImpl().calculateFeatureLengthEllipsoidal(feature);
        let units = 'km';
        if (lineLength > 1000) {
          lineLength = ((lineLength / 1000).toFixed(2)).replace('.', ',');
        } else {
          lineLength = (lineLength.toFixed(2)).replace('.', ',');
          units = 'm';
        }
        if (infoContainer !== null) {
          line = {};
          line.length = lineLength;
          line.units = units;
        }
        break;
      case 'Polygon':
      case 'MultiPolygon':
        let area = this.getImpl().getFeatureArea(feature);
        let areaUnits = 'km';
        if (area > 10000) {
          area = Math.round((area / 1000000) * 100) / 100;
        } else {
          area = Math.round(area * 100) / 100;
          areaUnits = 'm';
        }
        if (infoContainer !== null) {
          polygon = {};
          polygon.area = area;
          polygon.areaUnits = areaUnits;
        }
        break;
      default:
        if (document.querySelector('#edition-container #featureInfo') !== null) {
          document.querySelector('#edition-container #featureInfo').classList.add('closed');
        }
        break;
    }

    this.infoanalysisTemplate = IDEE.template.compileSync(infoanalysis, {
      vars: {
        point,
        line,
        polygon,
      },
    });

    this.template.querySelector('#analysisBtns #featureInfo').appendChild(this.infoanalysisTemplate);
    this.managementControl_.accessibilityTab(this.infoanalysisTemplate);

    const infoLine3D = document.querySelector('#ellipsoidal3DLength');
    if (infoLine3D) {
      this.requestProfile_(feature).then((profile) => {
        if (profile) {
          const length3D = this.getImpl().get3DLength(profile);
          infoLine3D.innerHTML = length3D < 1000
            ? `${((length3D).toFixed(2)).replace('.', ',')} m`
            : `${((length3D / 1000).toFixed(2)).replace('.', ',')} km`;
        }
      }).catch(warnElevationError);
    }
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map_.un(IDEE.evt.REMOVED_LAYER, this.destroyLayerBufferFN);
    this.closePointProfile();
    this.getImpl().closeProfile();
  }

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

  removeBufferFeatures() {
    if (this.bufferLayer === null) {
      return;
    }

    const selectLayer = this.managementControl_.selectionControl.getLayer();
    const layerID = this.getImpl().getLayerId(selectLayer);
    const features = this.bufferLayer.getFeatures()
      .filter((f) => this.getImpl().getParentId(f) === layerID);
    this.bufferLayer.removeFeatures(features);
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
    this.removeModalEvents();
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
    return control instanceof AnalysisControl;
  }
}
