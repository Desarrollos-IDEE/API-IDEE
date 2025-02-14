/**
 * @module M/control/AnalysisControl
 */
import buffer from '@turf/buffer';
import AnalysisImplControl from '../../impl/ol/js/analysiscontrol';
import template from '../../templates/analysis';
import infoanalysis from '../../templates/infoanalysis';
import pointProfileTemplate from '../../templates/pointprofile';
import { getValue } from './i18n/language';
import { changeStyleDialog } from './util';

export default class AnalysisControl extends M.Control {
  /**
  * @classdesc
  * Main constructor of the class. Creates a PluginControl
  * control
  *
  * @constructor
  * @extends {M.Control}
  * @api stable
  */
  constructor(map, managementControl) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(AnalysisImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new AnalysisImplControl(map);
    super(impl, 'Analysis');

    impl.facadeControl = this;

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

    this.destroyLayerBufferFN = this.destroyLayerBuffer.bind(this);

    this.map_.on(M.evt.REMOVED_LAYER, this.destroyLayerBufferFN);
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
    if (!M.utils.isArray(layers)) {
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
    this.template = M.template.compileSync(template, {
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

    // eslint-disable-next-line no-underscore-dangle
    const feature = this.managementControl_.selectionControl.selectedFeatures_[0];
    if (feature) {
      this.showFeatureInfo(feature);
    }
  }

  /**
   * This function adds selection and buffer layers to map.
   * @public
   * @function
   * @api
   */
  initializeLayers() {
    if (!this.bufferLayer) {
      this.bufferLayer = new M.layer.Vector({
        extract: false,
        name: 'bufferLayer',
      }, { displayInLayerSwitcher: true });
      this.bufferLayer.setStyle(new M.style.Polygon({
        stroke: { color: '#71a7d3' },
        fill: { color: '#71a7d3', opacity: 0.6 },
      }));
      this.map_.addLayers(this.bufferLayer);
    }
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
        document.querySelector('.m-vectorsmanagement-analysis-featureInfo').style.display = 'block';
        document.querySelector('#vectorsmanagement-analysis-btn').style.display = 'none';
      }
    });
    this.template.querySelector('#vectorsmanagement-analysis-btn').addEventListener('click', this.calculateAnalysis.bind(this));
    this.template.querySelector('#vectorsmanagement-btnToGeojson').addEventListener('click', () => {
      const controlSelected = this.managementControl_.selectionControl;
      // eslint-disable-next-line no-underscore-dangle
      const selectFeatures = controlSelected.selection_ === 'layer' ? this.layer_.getFeatures() : controlSelected.getSelectedFeatures();
      const featuresArea = this.impl_.getAreaGeoJSON(selectFeatures);
      const pre = JSON.stringify(featuresArea.length === 1
        ? featuresArea[0] : featuresArea, null, 2);
      M.dialog.info(`<pre class="vectorsmanagement-dialogCode"><code>${pre}</code></pre>`, 'GeoJSON');

      changeStyleDialog();
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
    this.template.querySelector('#vectorsmanagement-analysis-btn').style.display = 'block';

    document.querySelector('.m-vectorsmanagement-analysis-featureInfo').style.display = 'none';
  }

  /**
   * This function returns node button of active control.
   * @public
   * @function
   * @api stable
   */
  getControlActive() {
    if (this.template.querySelectorAll('.m-vectorsmanagement-analysis>#analysisBtns .activated').length === 0) {
      return false;
    }
    return this.template.querySelectorAll('.m-vectorsmanagement-analysis>#analysisBtns .activated')[0];
  }

  /**
   * This function the layer selected in the layer selector.
   * @public
   * @function
   * @param {M.layer.Vector} layer
   * @api
   */
  setLayer(layer) {
    this.layer_ = layer;
    this.getImpl().setOLLayer(this.layer_.getImpl().getOL3Layer());
  }

  /**
   * This function set the selected feature after selection interaction
   * @public
   * @function
   * @param {Event} e
   * @api
   */
  onSelect(e) {
    const MFeatures = this.layer_.getFeatures();
    const olFeature = e.target.getFeatures().getArray()[0];

    this.feature = MFeatures.filter((f) => f.getImpl().getOLFeature() === olFeature)[0]
      || undefined;

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
        M.dialog.info(getValue('exception.topographic_one_element'));
      } else {
        this.feature = selectedFeatures[0];
        if (this.feature.getGeometry().type !== 'Point') {
          this.getImpl().calculateProfile(this.feature);
        } else {
          this.getImpl().calculatePoint(this.feature);
        }
      }
    } else {
      M.dialog.info(getValue('exception.featuresel'));
    }
  }

  /**
   * This function show modal to ask for buffer distance
   * @public
   * @function
   * @api
   */
  drawBuffer() {
    const selection = this.managementControl_.getSelection();
    if (selection === 'feature' && this.managementControl_.getSelectedFeatures().length === 0) { // buffer de los features seleccionados
      M.dialog.info(getValue('exception.featuresel'));
    } else if (selection === 'layer' && this.layer_.getFeatures().length === 0) { // buffer de toda la capa
      M.dialog.info(getValue('exception.emptylayer'));
    } else {
      M.dialog.info(
        `<div id="chooseBuffer">
          <input type="number" id="metreBuffer" value="50" style="width: 10rem;">
          <div style="padding-top: 0.5rem;text-align: center;">
            <input type="radio" name="unit" id="metro" value="m" checked="checked"/>
            <label for="metro">${getValue('unit_m')}</label>
            <input type="radio" name="unit" id="kilometro" value="km"/>
            <label for="kilometro">${getValue('unit_km')}</label>
          </div>
        </div>`,
        getValue('title_popup_buffer'),
      );
      const color = '#71a7d3';
      const dialog = document.querySelector('.m-dialog > div.m-modal > div.m-content');
      dialog.style.minWidth = 'auto';
      const title = document.querySelector('.m-modal .m-title');
      title.style.backgroundColor = color;
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
        this.initializeLayers();
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
    const layerID = this.managementControl_.selectionControl
      .getLayer().getImpl().getOL3Layer().ol_uid;
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
   * @param {M.Feature} feature
   * @param {Integer} distance
   * @api
   */
  createFeatureBuffer(feature, distance, layerID) {
    const olFeature = this.getImpl().getMapeaFeatureClone(feature).getImpl().getOLFeature();
    this.getImpl().setStyle('rgba(113, 167, 211)', olFeature);
    const format = new ol.format.GeoJSON();
    olFeature.getGeometry().transform(this.map_.getProjection().code, 'EPSG:4326');
    const turfGeom = format.writeFeatureObject(olFeature);
    const buffered = buffer(turfGeom, parseInt(distance, 10), { units: 'meters' });
    olFeature.setGeometry(format.readFeature(buffered).getGeometry().transform('EPSG:4326', this.map_.getProjection().code));
    olFeature.set('parentID', layerID);
    const MFeature = M.impl.Feature.olFeature2Facade(olFeature);
    return MFeature;
  }

  /**
   * This function show modal with point data profile.
   * @public
   * @function
   * @param {Array} pointXYZ array con coordenadas y altura de un punto
   * @api
   */
  showPointProfile(pointXYZ) {
    if (this.pointTemplate) {
      document.body.removeChild(this.pointTemplate);
    }
    const mapProj = M.impl.ol.js.projections.getSupportedProjs()
      .filter((p) => p.codes.includes(pointXYZ.map.projection))[0];
    const mapUnit = mapProj.units === 'm' ? 'm' : '°';
    const mapLabels = mapProj.units === 'm' ? ['X', 'Y'] : [getValue('creationLongitude'), getValue('creationLatitude')];
    const geographicProj = M.impl.ol.js.projections.getSupportedProjs()
      .filter((p) => p.codes.includes(pointXYZ.geographic.projection))[0];
    const dist = mapProj.codes[0] !== geographicProj.codes[0];
    this.pointTemplate = M.template.compileSync(pointProfileTemplate, {
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

    this.pointTemplate.querySelector('.m-panel-btn').addEventListener('click', () => {
      this.removeModalEvents();
      document.body.removeChild(this.pointTemplate);
      this.pointTemplate = null;
    });
    // this.addModalEvents();
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

    // M.utils.draggabillyPlugin(this.pointTemplate, '#point-profile-title');
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
        let lineLength = this.getImpl().getFeatureLength(feature);
        let units = 'km';
        if (lineLength > 100) {
          lineLength = Math.round((lineLength / 1000) * 100) / 100;
        } else {
          lineLength = Math.round(lineLength * 100) / 100;
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

    this.infoanalysisTemplate = M.template.compileSync(infoanalysis, {
      vars: {
        point,
        line,
        polygon,
      },
    });

    this.template.querySelector('#analysisBtns #featureInfo').appendChild(this.infoanalysisTemplate);
    this.managementControl_.accessibilityTab(this.infoanalysisTemplate);

    const infoLine3D = document.querySelector('#infoAnalisis3DLine');
    if (infoLine3D) {
      infoLine3D.addEventListener('click', () => {
        this.getImpl().get3DLength('#infoAnalisis3DLine', feature);
      });
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
    this.map_.un(M.evt.REMOVED_LAYER, this.destroyLayerBufferFN);
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
    const layerID = selectLayer.getImpl().getOL3Layer().ol_uid;
    const features = this.bufferLayer.getFeatures().filter((f) => f.getImpl().getOLFeature().get('parentID') === layerID);
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
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    // eslint-disable-next-line no-undef
    return control instanceof AnalysisControl;
  }
}
