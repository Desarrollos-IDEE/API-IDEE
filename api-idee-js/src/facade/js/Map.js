/**
 * @module IDEE/Map
 */

import MapImpl from 'impl/Map';
import Base from './Base';
import { getQuickLayers } from './api-idee';
import {
  isUndefined,
  isNull,
  isArray,
  isNullOrEmpty,
  isFunction,
  isPositiveNumber,
  isObject,
  isString,
  escapeJSCode,
  getEnvolvedExtent,
  getResolutionFromScale,
  getImageMap,
  generateResolutionsFromExtent,
} from './util/Utils';
import { addFileToMap } from './util/LoadFiles';
import { getValue } from './i18n/language';
import Exception from './exception/exception';
import Label from './Label';
import Parameters from './parameter/Parameters';
import * as parameter from './parameter/parameter';
import * as EventType from './event/eventtype';
import FeaturesHandler from './handler/Feature';
import Feature from './feature/Feature';
import * as Dialog from './dialog';
import Control from './control/Control';
import WMCSelector from './control/WMCSelector';
import Layer from './layer/Layer';
import * as LayerType from './layer/Type';
import Vector from './layer/Vector';
import KML from './layer/KML';
import KMZ from './layer/KMZ';
import WFS from './layer/WFS';
import WMS from './layer/WMS';
import WMTS from './layer/WMTS';
import MVT from './layer/MVT';
import OGCAPIFeatures from './layer/OGCAPIFeatures';
import GenericRaster from './layer/GenericRaster';
import GenericVector from './layer/GenericVector';
import OverviewMapButton from './ui/buttons/OverviewMapButton';
import Panel from './ui/panels/Panel';
import CollapsiblePanel from './ui/panels/CollapsiblePanel';
import * as Position from './ui/position';
import GeoJSON from './layer/GeoJSON';
import GeoPackage from './layer/GeoPackage';
import GeoTIFF from './layer/GeoTIFF';
import MapLibre from './layer/MapLibre';
import StyleGeneric from './style/Generic';
import MBTiles from './layer/MBTiles';
import MBTilesVector from './layer/MBTilesVector';
import XYZ from './layer/XYZ';
import TMS from './layer/TMS';
import OSM from './layer/OSM';
import LayerGroup from './layer/LayerGroup';
import Tiles3D from './layer/Tiles3D';
import Terrain from './layer/Terrain';
import WMC from './layer/WMC';
import Attributions from './control/Attributions';
import { buildControl, buildLayer, getPanelForControl } from './builder/builder';
import applyDesignTokenCssVariables from './theme/tokens';
// eslint-disable-next-line no-unused-vars
import Plugin from './Plugin';

/**
 * @classdesc
 * Crea un mapa
 * con parámetros especificados por el usuario.
 *
 * @property {Boolean} _defaultProj Indica si la proyección utilizada
 * es por defecto.
 * @property {object} panel Objeto del panel.
 * @property {Array<Number>} userMaxExtent Extensión máxima proporcionada por el usuario.
 * @extends {IDEE.facade.Base}
 * @api
 */
class Map extends Base {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends { IDEE.facade.Base }
   * @param { string | Mx.parameters.Map } userParameters Parámetros.
   * - bbox: Extensión del mapa.
   * - center: Centro del mapa.
   * - container: Contenedor del mapa.
   * - controls: Controles del mapa.
   * - label: Etiqueta del mapa.
   * - layers: Capas del mapa.
   * - maxExtent: Extensión máxima del mapa.
   * - maxZoom: Zoom máximo del mapa.
   * - minZoom: Zoom mínimo del mapa.
   * - projection: Proyección del mapa.
   * - resolutions: Resoluciones del mapa.
   * - refreshInterval: Intervalo en milisegundos que prevalece en todas sus capas.
   * - viewExtent: Extensión de la vista.
   * - zoom: Zoom del mapa.
   * - zoomConstrains: Restricciones de zoom.
   * - rotation: Rotación del mapa.
   * - ticket: Ticket de autenticación.
   * @param { Mx.parameters.MapOptions } options Opciones personalizadas para la implementación
   * proporcionado por el usuario.
   * - verticalExaggeration: Exageración vertical de la escena. Si se establece a 1 no se aplica
   * exageración. Por defecto, 1. Sólo disponible para Cesium.
   * - LOD: Nivel de precisión para la resolución de renderizado. Si no se indica se utiliza la
   * resolución recomendada del navegador. Sólo disponible para Cesium.
   * @property {object} viewVendorOptions Parámetros para la vista del mapa de la librería base.
   * @api
   */
  constructor(userParameters, options = {}, viewVendorOptions = {}) {
    // parses parameters to build the new map
    const params = new Parameters(userParameters);

    const dpi = IDEE.config.DPI;

    const opts = { viewExtent: params.viewExtent, ...options };

    // Ensure CSS variables reflect current active token
    applyDesignTokenCssVariables();

    // calls the super constructor
    super();

    this.createPanels(params.container);

    let mapContainerElement = this.mapPanel;
    /* global HTMLElement */
    if (userParameters.containerTemplate instanceof HTMLElement) {
      mapContainerElement = userParameters.containerTemplate;
    }

    const impl = new MapImpl(mapContainerElement, this, dpi, opts, viewVendorOptions);
    this.setImpl(impl);

    const interval = params.refreshInterval;
    this.refreshInterval_ = isPositiveNumber(interval) && interval % 1 === 0
      && interval <= 2147483647 ? interval : undefined;

    // checks if the param is null or empty
    if (isNullOrEmpty(userParameters)) {
      Exception(getValue('exception').no_param);
    }

    // checks if the implementation can create maps
    if (isUndefined(MapImpl)) {
      Exception(getValue('exception').constructor_impl);
    }

    /**
     * Map: JSON para mapear los niveles de zoom a metros.
     */
    this.zoom_meters = {
      0: 251229000,
      1: 125614900,
      2: 62807900,
      3: 31404300,
      4: 15702500,
      5: 9470100,
      6: 5029700,
      7: 2573100,
      8: 1299200,
      9: 652600,
      10: 327150,
      11: 164400,
      12: 82450,
      13: 41350,
      14: 20750,
      15: 10400,
      16: 5200,
      17: 2600,
      18: 1300,
      19: 650,
      20: 325,
      21: 160,
      22: 80,
      23: 40,
      24: 20,
      25: 10,
      26: 5,
      27: 2,
      28: 1,
    };

    /**
     * Map: Botones del mapa.
     */
    this.buttons = [];

    /**
     * Map: Paneles del mapa.
     */
    this.panels = [];

    /**
     * Map: Plugins incorporados al mapa.
     */
    this.plugins = [];

    /**
     * Map: Ticket de autenticación.
     */
    this.ticket_ = null;

    /**
     * Map: "Popup".
     */
    this.popup_ = [];

    /**
     * Map: Indica si la proyección utilizada
     * es por defecto.
     */
    this._defaultProj = true;

    /**
     * Map: Panel del mapa.
     */
    this.panel = {
      LEFT: null,
      RIGHT: 'null',
    };

    /**
     * Map: Zoom del usuario.
     */
    this._userZoom = null;

    /**
     * Map: Centro del usuario.
     */
    this.userCenter_ = null;

    /**
     * Map: Centro inicial terminado.
     */
    this._finishedInitCenter = true;

    /**
     * Map: Extensión máxima terminada.
     */
    this._finishedMaxExtent = true;

    /**
     * Map: Mapa terminado implementación.
     */
    this._finishedMapImpl = false;

    /**
     * Map: Mapa terminado.
     */
    this._finishedMap = false;

    /**
     * Map: Centro de los objetos geográficos.
     */
    this.centerFeature_ = null;

    /**
     * Map: Capa "Draw".
     */
    this.drawLayer_ = null;

    /**
     * Map: Extensión máxima proporcionada por el usuario.
     */
    this.userMaxExtent = null;

    /**
     * Map: Restricciones de extensión proporcionadas por el usuario
     */
    this.userExtentConstrains = params.extentConstrains || null;

    /**
     * Map: Colección de "capabilities".
     */
    this.collectionCapabilities = [];

    /**
     * Map: Capas "GeoPackage"
     */
    this.geopackages = [];

    // Attribution Map
    // + El evento se añade aquí antes de llamar a addLayers
    this.evtSetAttributions_();
    this.evtRemoveAttributions_();
    this.controlAttributions = null; // Contiene el control de atribuciones
    this._attributionsMap = [];

    impl.on(EventType.COMPLETED, () => {
      this._finishedMapImpl = true;
      this._checkCompleted();
    });

    /**
     * Manejador de objetos geográficos.
     */
    this.featuresHandler_ = new FeaturesHandler();
    this.featuresHandler_.addTo(this);
    this.featuresHandler_.activate();

    this.drawLayer_ = new Vector({
      name: '__draw__',
    }, { displayInLayerSwitcher: false });

    this.drawLayer_.setStyle(new StyleGeneric(Map.DRAWLAYER_STYLE));

    if (!isNullOrEmpty(MapImpl.Z_INDEX)) {
      this.drawLayer_.setZIndex(MapImpl.Z_INDEX[LayerType.WFS] + 999);
    }
    this.addLayers(this.drawLayer_);

    // projection
    if (!isNullOrEmpty(params.projection)) {
      this.setProjection(params.projection);
    } else { // default projection
      this.setProjection(IDEE.config.DEFAULT_PROJ, true);
    }

    // bbox
    if (!isNullOrEmpty(params.bbox)) {
      this.setBbox(params.bbox);
    }

    // resolutions
    if (!isNullOrEmpty(params.resolutions)) {
      this.setResolutions(params.resolutions);
    }

    // maxExtent
    if (!isNullOrEmpty(params.maxExtent)) {
      const zoomToMaxExtent = isNullOrEmpty(params.zoom) && isNullOrEmpty(params.bbox);
      this.setMaxExtent(params.maxExtent, zoomToMaxExtent);
    }

    // wmc
    if (!isNullOrEmpty(params.wmc)) {
      this.addWMC(params.wmc);
    }

    this.addQuickLayers(IDEE.config.terrain.default);

    // layers
    if (!isNullOrEmpty(params.layers)) {
      this.addLayers(params.layers);
    }

    // wms
    if (!isNullOrEmpty(params.wms)) {
      this.addWMS(params.wms);
    }

    // wmts
    if (!isNullOrEmpty(params.wmts)) {
      this.addWMTS(params.wmts);
    }

    // kml
    if (!isNullOrEmpty(params.kml)) {
      this.addKML(params.kml);
    }

    if (!isNullOrEmpty(params.kmz)) {
      this.addKMZ(params.kmz);
    }

    // controls
    if (!isNullOrEmpty(params.controls)) {
      this.addControls(params.controls);
    }

    // default TMS
    if (isNullOrEmpty(params.layers) && !isArray(params.layers) && isNullOrEmpty(params.wmc)) {
      this.addLayers(IDEE.config.baseLayer);
    }

    // center
    if (!isNullOrEmpty(params.center)) {
      this.setCenter(params.center);
    }

    // zoom
    if (!isNullOrEmpty(params.zoom)) {
      let zoom = params.zoom;
      let inmeters = false;
      if (isString(params.zoom)) {
        zoom = params.zoom.split('*');
        if (zoom.length > 1) { inmeters = true; }
        zoom = zoom[0];
      }
      this.setZoom(zoom, inmeters, true);
    } else if (isNullOrEmpty(params.bbox)) {
      this.setZoom(IDEE.config.DEFAULT_ZOOM, false, false);
    }

    // zoomConstrains
    if (!isNullOrEmpty(params.zoomConstrains)) {
      this.setZoomConstrains(params.zoomConstrains);
    } else if (IDEE.config.MAP_VIEWER_ZOOM_CONSTRAINS !== '' && IDEE.config.MAP_VIEWER_ZOOM_CONSTRAINS !== undefined) {
      this.setZoomConstrains(IDEE.config.MAP_VIEWER_ZOOM_CONSTRAINS);
    } else {
      this.setZoomConstrains(false);
    }

    // extentConstrains
    if (!isNullOrEmpty(params.extentConstrains)) {
      this.setExtentConstrains(params.extentConstrains);
    } else if (IDEE.config.MAP_VIEWER_EXTENT_CONSTRAINS !== '' && IDEE.config.MAP_VIEWER_EXTENT_CONSTRAINS !== undefined) {
      this.setExtentConstrains(IDEE.config.MAP_VIEWER_EXTENT_CONSTRAINS);
    } else {
      this.setExtentConstrains(false);
    }

    // minZoom
    if (!isNullOrEmpty(params.minZoom)) {
      this.setMinZoom(params.minZoom);
    } else if (IDEE.config.MIN_ZOOM !== '') {
      const minZoom = Number(IDEE.config.MIN_ZOOM);
      this.setMinZoom(minZoom);
    }

    // maxZoom
    if (!isNullOrEmpty(params.maxZoom)) {
      this.setMaxZoom(params.maxZoom);
    } else if (IDEE.config.MAX_ZOOM !== '') {
      const maxZoom = Number(IDEE.config.MAX_ZOOM);
      this.setMaxZoom(maxZoom);
    }

    // rotation
    if (!isNullOrEmpty(params.rotation)) {
      this.once(EventType.COMPLETED, () => {
        this.setRotation(params.rotation);
      });
    }

    // label
    if (!isNullOrEmpty(params.label)) {
      this.addLabel(params.label);
    }

    // ticket
    if (!isNullOrEmpty(params.ticket)) {
      this.setTicket(params.ticket);
    }

    // bgColorContainer
    if (!isNullOrEmpty(params.bgColorContainer)) {
      this.setBGColorContainer(params.bgColorContainer);
    }

    // initial zoom
    if (isNullOrEmpty(params.bbox) && isNullOrEmpty(params.zoom) && isNullOrEmpty(params.center)) {
      this.zoomToMaxExtent(true);
    }

    // initial center
    if (isNullOrEmpty(params.center) && isNullOrEmpty(params.bbox)) {
      this._finishedInitCenter = false;
      this.getInitCenter_().then((initCenter) => {
        if (isNullOrEmpty(this.userCenter_)) {
          this.setCenter(initCenter);
        }
        this._finishedInitCenter = true;
        this._checkCompleted();
      });
    }

    const dropFile = !isUndefined(userParameters.dropFile) ? userParameters.dropFile : true;
    if (dropFile) {
      this.addDropFileEvent();
    }
  }

  /**
   * Función que añade manejador del evento drop sobre el mapa
   * para la carga de ficheros.
   *
   * @function
   */
  addDropFileEvent() {
    const container = this.mapPanel;
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
    }, false);

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
    }, false);

    container.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files;
      addFileToMap(this, files[0]);
    }, false);
  }

  /**
   *  Método que crea el control de atribuciones.
   *
   * @function
   * @param {Object} options Parámetros del control.
   * @api
   */
  createAttribution(options = {}, control = null) {
    // Comprobar si existe el control
    if (this.getControls().some(({ name }) => name === Attributions.NAME)) {
      return;
    }
    const {
      tooltip,
      position,
      scale,
      collectionsAttributions = [],
      order,
    } = options;
    try {
      const atribucionControl = !isNullOrEmpty(control) ? control : new Attributions({
        map: this,
        scale,
        collectionsAttributions: collectionsAttributions.map((l) => {
          if (typeof l !== 'string') {
            const attr = l;
            attr.id = l.idLayer;
            return attr;
          }
          return l;
        }),
        order,
      });
      const panelClassName = [
        'm-attributions',
        atribucionControl.inlineText ? 'm-attributions-inline' : '',
      ].filter(Boolean).join(' ');
      const panel = new CollapsiblePanel(Attributions.NAME, {
        collapsible: true,
        position: Position[position] || Position.LEFT,
        className: panelClassName,
        collapsedButtonClass: 'g-cartografia-comentarios',
        tooltip: tooltip || getValue(Attributions.NAME).title,
        order,
      });
      this.addPanels(panel);
      panel.addControls(atribucionControl);
      this.getImpl().addControls([atribucionControl]);
      this.controlAttributions = atribucionControl;

      if (collectionsAttributions) {
        this._attributionsMap = [...this._attributionsMap, ...collectionsAttributions];
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  }

  /**
   *  Método para añadir atribuciones al control de atribuciones.
   *
   * @function
   * @param {attribuccion} attribuccion Atribución.
   * @api
   */
  addAttribution(attribuccion, _addMapAttribution = true, idLayer = null) {
    try {
      if (Object.keys(attribuccion).length === 0) {
        return;
      }
    } catch (error) {
      // eslint-disable-next-line
      console.error('El tipo tiene que ser object');
      return;
    }

    const controlAttributions = this.getControls().find(({ name }) => name === Attributions.NAME);
    if (!controlAttributions) { return; }
    let addAttribution = null;

    if (typeof attribuccion === 'string') {
      addAttribution = {};
      addAttribution.attribuccion = attribuccion;
    } else if (attribuccion && controlAttributions) {
      addAttribution = attribuccion;
    }

    if (!idLayer) {
      addAttribution.id = window.crypto.randomUUID
        ? window.crypto.randomUUID() : new Date().getTime();
    } else {
      addAttribution.id = idLayer;
    }

    controlAttributions.addAttributions(addAttribution);

    if (_addMapAttribution) {
      this._attributionsMap.push(addAttribution);
    }
  }

  /**
   *  Método para eliminar atribuciones al control de atribuciones.
   *
   * @function
   * @param {String} id Nombre de la capa o id de la atribución.
   * @api
   */
  removeAttribution(id) {
    if (id && this.controlAttributions) {
      const attributions = this.controlAttributions.getAttributions();
      let filterAttributions = attributions.filter((attribution) => attribution.id !== id);
      filterAttributions = filterAttributions.filter((attribution) => attribution.name !== id);

      this.controlAttributions.setAttributions(filterAttributions);
    }
  }

  /**
   * Método que devuelve las attribuciones del Mapa.
   * @function
   * @returns {Boolean} Verdadero devuelve todas las attribuciones.
   * @api
   */
  getAttributions(allAttributions) {
    if (allAttributions) {
      return this.controlAttributions.getAttributions();
    }
    return this._attributionsMap;
  }

  /**
   * Este método obtiene las capas agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de nombres de capas.
   * @returns {Array<Layer>} Devuelve una matriz de capas.
   * @api
   */
  getLayers(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getLayers)) {
      Exception(getValue('exception').getlayers_method);
    }
    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map(parameter.layer);
    }

    // gets the layers
    const layers = this.getImpl().getLayers(filters);

    return layers;
  }

  /**
   * Este método obtiene las capas que no están en ningún grupo de capas o sección.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de nombres de capas.
   * @returns {Array<Layer>} Devuelve una matriz de capas.
   * @api
   */
  getRootLayers(layersParamVar) {
    const layers = this.getLayers(layersParamVar)
      .filter((l) => isNullOrEmpty(l.group) && isNullOrEmpty(l.getSection()));

    return layers;
  }

  /**
   * Este método devuelve las capas base del mapa.
   *
   * @function
   * @returns {Array<Layer>} Matriz con las capas base.
   * @api
   */
  getBaseLayers() {
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getBaseLayers)) {
      Exception(getValue('exception').getbaselayers_method);
    }

    return this.getImpl().getBaseLayers();
  }

  /**
   * Este método devuelve los manejadores de objetos geográficos.
   *
   * @function
   * @returns {IDEE.handler.Feature} Devuelve los manejadores de objetos geográficos
   * @public
   * @api
   */
  getFeatureHandler() {
    return this.featuresHandler_;
  }

  /**
   * Obtiene el intervalo válido configurado en el mapa.
   * Las capas lo consultan al incorporarse, incluidas las añadidas posteriormente.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @returns {Number|undefined} Intervalo en milisegundos o ausencia de autorefresco global.
   * @public
   * @function
   */
  getAutoRefreshInterval() {
    return this.refreshInterval_;
  }

  /**
   * Actualiza el intervalo del mapa para las capas actuales y las incorporaciones futuras.
   * El valor del mapa sobrescribe el de sus capas, incluidas las de los grupos.
   * @param {Number|undefined} interval Intervalo; cero o undefined desactiva todas las capas.
   * @returns {IDEE.Map} Mapa.
   * @public
   * @api
   */
  updateLayersRefreshInterval(interval) {
    this.refreshInterval_ = isPositiveNumber(interval) && interval % 1 === 0
      && interval <= 2147483647 ? interval : undefined;
    const visited = new Set();
    const update = (layer) => {
      if (visited.has(layer) || layer.name === '__draw__') return;
      visited.add(layer);
      if (isFunction(layer.updateRefreshInterval)) {
        layer.updateRefreshInterval(this.getAutoRefreshInterval());
      }
      if (layer.getImpl().isAutoRefreshContainer?.()) {
        layer.getImpl().getLayers().forEach(update);
      }
    };
    this.getLayers().forEach(update);
    return this;
  }

  /**
   * Este método agrega capas especificadas por el usuario.
   *
   * @function
   * @param {string|Object|Array<String>|Array<Object>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addLayers(layersParameter) {
    let layersParam = layersParameter;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addLayers)) {
        Exception(getValue('exception').addlayers_method);
      }
      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as Layer objects to add
      const layers = layersParam.map((layerParam) => {
        let layer;

        if (isString(layerParam)) {
          // Named-param format: 'WMTS*url=http://...;name=MTN;matrixSet=GM'
          if (isString(layerParam)) {
            // eslint-disable-next-line
            layerParam = buildLayer(layerParam);
          }
          if (isString(layerParam)) {
            const splt = layerParam.split('*');
            if (splt.length === 2 && splt[0] === 'QUICK') {
              const ly = getQuickLayers(splt[1]);
              if (!isUndefined(ly)) {
                // eslint-disable-next-line
                layerParam = ly;
              } else {
                // eslint-disable-next-line
                console.error(`No se encuentra definida ${splt[1]} como capa rápida`);
                return null;
              }
            }
          }
        }
        try {
          if (layerParam instanceof Layer || layerParam instanceof GeoPackage) {
            layer = layerParam;
          } else {
            // try {
            layer = this.getLayerByString(layerParam);
            // }
            // catch (err) {
            //   Dialog.error('El formato de la capa (' + layerParam + ') no se reconoce');
            //   throw err;
            // }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(err);
        }

        if (!isNullOrEmpty(layer) && !(layer instanceof GeoPackage)) {
          // gets the capabilities of the layers
          this.collectorCapabilities_(layer);

          // KML and WFS layers handler its features
          if ((layer instanceof Vector)
            /* && !(layer instanceof KML) */
            && !(layer instanceof WFS)
            && !(layer instanceof OGCAPIFeatures)) {
            this.featuresHandler_.addLayer(layer);
          }

          layer.setMap(this);
        }

        return layer;
      });

      // adds the layers. Container layers (such as GeoPackage) are dispatched
      // to their own addTo implementation by the map implementation.
      const mapLayers = layers.filter((layer) => !isNullOrEmpty(layer));
      this.getImpl().addLayers(mapLayers);
    }
    return this;
  }

  getLayerByString(layerParam) {
    let layer = null;
    const parameterVariable = parameter.layer(layerParam);
    if (!isNullOrEmpty(parameterVariable.type)) {
      switch (parameterVariable.type) {
        case 'WFS':
          layer = new WFS(layerParam, { style: parameterVariable.style });
          break;
        case 'WMC':
          layer = new WMC(layerParam);
          break;
        case 'WMS':
          layer = new WMS(layerParam);
          break;
        case 'GeoJSON':
          layer = new GeoJSON(parameterVariable, { style: parameterVariable.style });
          break;
        case 'GeoPackage': {
          const {
            type, source, url, name, legend, metadata, properties, options = {}, ...layerOptions
          } = parameterVariable;
          layer = new GeoPackage({
            type, source, url, name, legend, metadata, properties,
          }, {
            ...layerOptions,
            ...options,
          });
          break;
        }
        case 'GeoTIFF':
          layer = new GeoTIFF(layerParam);
          break;
        case 'KMZ':
          layer = new KMZ(layerParam);
          break;
        case 'KML':
          layer = new KML(layerParam);
          break;
        case 'Vector':
          layer = new Vector(layerParam);
          break;
        case 'WMTS':
          layer = new WMTS(layerParam);
          break;
        case 'MVT':
          layer = new MVT(layerParam);
          break;
        case 'MBTiles':
          layer = new MBTiles(parameterVariable);
          break;
        case 'MBTilesVector':
          layer = new MBTilesVector(parameterVariable, { style: parameterVariable.style });
          break;
        case 'XYZ':
          layer = new XYZ(parameterVariable);
          break;
        case 'TMS':
          layer = new TMS(parameterVariable, { crossOrigin: parameterVariable.crossOrigin });
          break;
        case 'OSM':
          layer = new OSM(layerParam);
          break;
        case 'OGCAPIFeatures':
          layer = new OGCAPIFeatures(layerParam, { style: parameterVariable.style });
          break;
        case 'GenericRaster':
          layer = new GenericRaster(layerParam);
          break;
        case 'GenericVector':
          layer = new GenericVector(layerParam);
          break;
        case 'MapLibre':
          layer = new MapLibre(layerParam);
          break;
        case 'LayerGroup':
          layer = new LayerGroup(layerParam);
          break;
        case 'Tiles3D':
          layer = new Tiles3D(parameterVariable);
          break;
        case 'Terrain':
          layer = new Terrain(parameterVariable);
          break;
        default:
          Dialog.error(getValue('dialog').invalid_type_layer);
      }
    } else {
      Dialog.error(getValue('dialog').invalid_type_layer);
    }

    return layer;
  }

  /**
   * Este método almacena en this.collectionCapabilities
   * las "capabilities" de las capas. Esto se usará para
   * evitar llamadas innecesarias al servidor.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {string|Object|Array<String>|Array<Object>} layers Colección u objeto de capa.
   * @api
   */
  collectorCapabilities_(layers) {
    let layersParam = layers;
    if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }
    if (layersParam[0].name === '__draw__') return;
    const urlCapabilities = [];

    layersParam.forEach((l) => {
      let type = '';
      let url = '';
      let useCapabilities = true;
      if (typeof l === 'string') {
        const [typeSplit] = l.split('*');
        const parameters = parameter.layer(l, LayerType[typeSplit]);
        type = parameters.type;
        url = parameters.url;
        useCapabilities = parameters.useCapabilities;
      } else if (typeof l === 'object') {
        type = l.type;
        url = l.url;
        useCapabilities = l.useCapabilities;
      }

      if (this.collectionCapabilities.some((u) => u.url === url)) return;

      if ((type === 'WMS' || type === 'WMTS') && useCapabilities) {
        if (!urlCapabilities.some((u) => u.url === url)) {
          this.collectionCapabilities.push({
            type,
            url,
            capabilities: false,
          });
        }
      }
    });
  }

  /**
   * Este método elimina las capas especificadas del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeLayers(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeLayers)) {
        Exception(getValue('exception').removelayers_method);
      }

      // gets the layers to remove
      const layers = this.getLayers(layersParam);

      layers.forEach((layer) => {
        // KML and WFS layers handler its features
        if (layer instanceof Vector) {
          this.featuresHandler_.removeLayer(layer);
        }
      });

      // removes the layers
      this.getImpl().removeLayers(layers);
    }

    return this;
  }

  /**
   * Este método devuelve las secciones que tenga el mapa.
   *
   * @function
   * @public
   * @returns {Array<IDEE.layer.Section>} Secciones del mapa.
   * @api
   */
  getSections() {
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getSections)) {
      Exception(getValue('exception').getsections_method);
    }
    return this.getImpl().getSections().sort(Map.LAYER_SORT);
  }

  /**
   * Añade una sección al mapa.
   *
   * @public
   * @function
   * @param {Array<IDEE.layer.Section>} sections Secciones a añadir.
   * @returns {IDEE.Map}
   * @api
   */
  addSections(sections) {
    let sect = sections;
    // checks if the parameter is null or empty
    if (isNull(sect)) {
      Exception('No ha especificado ninguna sección');
    }
    // checks if the implementation can manage groups
    if (isUndefined(MapImpl.prototype.addSections)) {
      Exception(getValue('exception').addsections_method);
    }
    // parses parameters to Array
    if (!isArray(sect)) {
      sect = [sect];
    }
    // adds the groups
    this.getImpl().addSections(sect);
    return this;
  }

  /**
   * Elimina una sección del mapa.
   *
   * @function
   * @public
   * @param {Array<IDEE.layer.Section>} sections Secciones a eliminar.
   * @returns {IDEE.Map}
   * @api
   */
  removeSections(sections) {
    // checks if the parameter is null or empty
    if (isNull(sections)) {
      Exception('No ha especificado ninguna sección a eliminar');
    }
    // checks if the implementation can manage groups
    if (isUndefined(this.getImpl().removeSections)) {
      Exception(getValue('exception').removesections_method);
    }
    // removes the layers
    this.getImpl().removeSections(sections);
    return this;
  }

  /**
   * Este método devuelve los grupos que tenga el mapa.
   *
   * @function
   * @returns {Array<IDEE.layer.Group>}
   * @api stable
   */
  getLayerGroup() {
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getLayerGroups)) {
      Exception('La implementación usada no posee el método getLayerGroups');
    }
    return this.getImpl().getGroupedLayers().sort(Map.LAYER_SORT);
  }

  /**
   * Añade un grupo de capa al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.Group>} layerGroups
   * @returns {IDEE.Map}
   * @api stable
   */
  addLayerGroups(layerGroups) {
    let layersParam = layerGroups;

    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.addLayerGroups)) {
        Exception(getValue('exception').addLayerGroup_method);
      }

      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const collectionLayerGroups = [];
      layersParam.forEach((layerParam) => {
        if (isObject(layerParam) && (layerParam instanceof LayerGroup)) {
          layerParam.setMap(this);
          collectionLayerGroups.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          const groupLayer = new LayerGroup(layerParam, layerParam.options);
          groupLayer.setMap(this);
          collectionLayerGroups.push(groupLayer);
        }
      });

      this.getImpl().addLayerGroups(collectionLayerGroups);
      collectionLayerGroups.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });

      // Add this.featuresHandler_.addLayer(layer);
      collectionLayerGroups.forEach((group) => {
        this.featureHandlerLayerGroup(group);
      });

      this.fire(EventType.ADDED_LAYER, [collectionLayerGroups]);
      this.fire(EventType.ADDED_LAYERGROUP, [collectionLayerGroups]);
    }
    return this;
  }

  /**
   * Manejador de objetos geográficos para los grupos de capas.
   *
   * @function
   * @param {IDEE.layer.Group} layerGroup Grupo de capas.
   * @api
   */
  featureHandlerLayerGroup(layerGroup) {
    const layers = layerGroup.getLayers();
    layers.forEach((l) => {
      if ((l instanceof Vector) || (l instanceof MapLibre) || (l instanceof Tiles3D)) {
        this.featuresHandler_.addLayer(l);
      } else if (l instanceof LayerGroup) {
        this.featureHandlerLayerGroup(l);
      }
    });
  }

  /**
   * Elimina un grupo de capa al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.Group>} layerGroups
   * specified by the user
   * @returns {IDEE.Map}
   * @api stable
   */
  removeLayerGroup(layerGroups) {
    // checks if the parameter is null or empty
    if (isNull(layerGroups)) {
      Exception('No ha especificado ningun grupo a eliminar');
    }
    // checks if the implementation can manage groups
    if (isUndefined(this.getImpl().removeLayerGroups)) {
      Exception('La implementación usada no posee el método removeGroups');
    }
    // removes the layers
    this.getImpl().removeLayerGroups(layerGroups);
    return this;
  }

  /**
   * Este método obtiene las capas WMC añadidas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo WMC.
   * @returns {Array<WMC>} Matriz de capas, tipo WMC.
   * @api
   */
  getWMC(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getWMC)) {
      Exception(getValue('exception').getwmc_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.WMC);
      });
    }

    // gets the layers
    const layers = this.getImpl().getWMC(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método añade capas WMC al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMC>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addWMC(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addWMC)) {
        Exception(getValue('exception').addwmc_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as WMC objects to add
      const wmcLayers = [];
      layersParam.forEach((layerParam) => {
        if (isObject(layerParam) && (layerParam instanceof WMC)) {
          layerParam.setMap(this);
          wmcLayers.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          try {
            const wmcLayer = new WMC(layerParam, layerParam.options);
            wmcLayer.setMap(this);
            wmcLayers.push(wmcLayer);
          } catch (err) {
            Dialog.error(err.toString());
            throw err;
          }
        }
      });

      // adds the layers
      this.getImpl().addWMC(wmcLayers);
      wmcLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [wmcLayers]);
      this.fire(EventType.ADDED_WMC, [wmcLayers]);

      /* checks if it should create the WMC control to select WMC */
      const addedWmcLayers = this.getWMC();
      const wmcSelected = addedWmcLayers.filter((wmc) => wmc.selected === true)[0];
      if (wmcSelected == null) {
        addedWmcLayers[0].select();
      }
      if (addedWmcLayers.length > 1) {
        this.removeControls('wmcselector');
        this.addControls('wmcselector');
      }
    }
    return this;
  }

  /**
   * Este método actualiza el control para seleccionar una capa WMC.
   *
   * @function
   * @public
   * @api
   */
  refreshWMCSelectorControl() {
    this.removeControls('wmcselector');
    if (this.getWMC().length === 1) {
      this.getWMC()[0].select();
    } else if (this.getWMC().length > 1) {
      this.addControls(new WMCSelector());
      const wmcSelected = this.getWMC().filter((wmc) => wmc.selected === true)[0];
      if (wmcSelected == null) {
        this.getWMC()[0].select();
      }
    }
  }

  /**
   * Este método elimina las capas WMC del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMC>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeWMC(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeWMC)) {
        Exception(getValue('exception').removewmc_method);
      }

      // gets the layers
      const wmcLayers = this.getWMC(layersParam);
      if (wmcLayers.length > 0) {
        // removes the layers
        this.getImpl().removeWMC(wmcLayers);
      }
    }
    return this;
  }

  /**
   * Esta función agrega las capas KML al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo KML.
   * @returns {Array<KML>} Matriz de capas, tipo KML.
   * @api
   */
  getKML(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getKML)) {
      Exception(getValue('exception').getkml_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.KML);
      });
    }

    // gets the layers
    const layers = this.getImpl().getKML(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas KML al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.KML>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addKML(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addKML)) {
        Exception(getValue('exception').addkml_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as KML objects to add
      const kmlLayers = [];
      layersParam.forEach((layerParam) => {
        let kmlLayer;
        if (layerParam instanceof KML) {
          kmlLayer = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          kmlLayer = new KML(layerParam, layerParam.options);
        }
        if (kmlLayer.extract === true) {
          this.featuresHandler_.addLayer(kmlLayer);
        }
        kmlLayers.push(kmlLayer);
      });

      // adds the layers
      this.getImpl().addKML(kmlLayers);
      kmlLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [kmlLayers]);
      this.fire(EventType.ADDED_KML, [kmlLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas KML del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.KML>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeKML(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeKML)) {
        Exception(getValue('exception').removekml_method);
      }

      // gets the layers
      const kmlLayers = this.getKML(layersParam);
      if (kmlLayers.length > 0) {
        kmlLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        // removes the layers
        this.getImpl().removeKML(kmlLayers);
      }
    }
    return this;
  }

  /** Gestión de capas KMZ. @api */
  getKMZ(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getKMZ)) {
      Exception(getValue('exception').getkmz_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.KMZ);
      });
    }

    // gets the layers
    const layers = this.getImpl().getKMZ(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas KMZ al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.KMZ>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addKMZ(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addKMZ)) {
        Exception(getValue('exception').addkmz_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as KMZ objects to add
      const kmzLayers = [];
      layersParam.forEach((layerParam) => {
        let kmzLayer;
        if (layerParam instanceof KMZ) {
          kmzLayer = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          kmzLayer = new KMZ(layerParam, layerParam.options);
        }
        if (kmzLayer.extract === true) {
          this.featuresHandler_.addLayer(kmzLayer);
        }
        kmzLayers.push(kmzLayer);
      });

      // adds the layers
      this.getImpl().addKMZ(kmzLayers);
      kmzLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [kmzLayers]);
      this.fire(EventType.ADDED_KMZ, [kmzLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas KMZ del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.KMZ>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeKMZ(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeKMZ)) {
        Exception(getValue('exception').removekmz_method);
      }

      // gets the layers
      const kmzLayers = this.getKMZ(layersParam);
      if (kmzLayers.length > 0) {
        kmzLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        // removes the layers
        this.getImpl().removeKMZ(kmzLayers);
      }
    }
    return this;
  }

  /**
   * Este método obtiene las capas WMS agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMC>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo WMS.
   * @returns {Array<WMS>} Matriz de capas, tipo WMS.
   * @api
   */
  getWMS(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getWMS)) {
      Exception(getValue('exception').getwms_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.WMS);
      });
    }

    // gets the layers
    const layers = this.getImpl().getWMS(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas WMS al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMS>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addWMS(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addWMS)) {
        Exception(getValue('exception').addwms_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      this.collectorCapabilities_(layersParam);

      // gets the parameters as WMS objects to add
      const wmsLayers = [];
      layersParam.forEach((layerParam) => {
        let wmsLayer = layerParam;
        if (!(layerParam instanceof WMS)) {
          wmsLayer = new WMS(layerParam, layerParam.options);
        }
        wmsLayer.setMap(this);
        wmsLayers.push(wmsLayer);
      });
      // adds the layers
      this.getImpl().addWMS(wmsLayers);
      wmsLayers.forEach((wmsLayer) => {
        if (isFunction(wmsLayer.startAutoRefresh)) {
          wmsLayer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [wmsLayers]);
      this.fire(EventType.ADDED_WMS, [wmsLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas WMS del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMS>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeWMS(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeWMS)) {
        Exception(getValue('exception').removewms_method);
      }

      // gets the layers
      const wmsLayers = this.getWMS(layersParam);
      if (wmsLayers.length > 0) {
        // removes the layers
        this.getImpl().removeWMS(wmsLayers);
      }
    }
    return this;
  }

  /**
   * Este método agrega las capas WFS al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo WFS.
   * @returns {Array<WFS>} Capas del mapa.
   * @api
   */
  getWFS(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getWFS)) {
      Exception(getValue('exception').getwfs_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.WFS);
      });
    }

    // gets the layers
    const layers = this.getImpl().getWFS(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas de GeoJSON al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional
   * - Matriz de capas de nombres, escriba GeoJSON.
   * @returns {Array<WFS>} Capas del mapa.
   * @api
   */
  getGeoJSON(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getGeoJSON)) {
      Exception(getValue('exception').getgeojson_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the layers
    const layers = this.getImpl().getGeoJSON(layersParam).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas WFS al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WFS>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addWFS(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addWFS)) {
        Exception(getValue('exception').addwfs_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as WFS objects to add
      const wfsLayers = [];
      layersParam.forEach((layerParam) => {
        let wfsLayer;
        if (layerParam instanceof WFS) {
          wfsLayer = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          try {
            wfsLayer = new WFS(layerParam, layerParam.options);
          } catch (err) {
            Dialog.error(err.toString());
            throw err;
          }
        }
        this.featuresHandler_.addLayer(wfsLayer);
        wfsLayers.push(wfsLayer);
      });

      // adds the layers
      this.getImpl().addWFS(wfsLayers);
      wfsLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [wfsLayers]);
      this.fire(EventType.ADDED_WFS, [wfsLayers]);
    }
    return this;
  }

  /**
   * Este método agrega las capas de tipo desconocido al mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParamVar Colección u objeto de capa.
   * @api
   */
  addUnknowLayers_(layersParamVar) {
    let layersParam = layersParamVar;

    // parses parameters to Array
    if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    const unknowLayers = [];

    layersParam.forEach((layerParam) => {
      if (isObject(layerParam) && layerParam.name !== '__draw__') {
        unknowLayers.push(layerParam);
      }
    });

    unknowLayers.forEach((layer) => {
      if (isFunction(layer.startAutoRefresh)) {
        layer.startAutoRefresh(this.getAutoRefreshInterval());
      }
    });
    this.fire(EventType.ADDED_LAYER, [unknowLayers]);
  }

  /**
   * Este método elimina las capas WFS del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WFS>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeWFS(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeWFS)) {
        Exception(getValue('exception').removewfs_method);
      }

      // gets the layers
      const wfsLayers = this.getWFS(layersParam);
      if (wfsLayers.length > 0) {
        wfsLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        // removes the layers
        this.getImpl().removeWFS(wfsLayers);
      }
    }
    return this;
  }

  /**
   * Este método obtiene las capas GeoTIFF agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMC>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo GeoTIFF.
   * @returns {Array<GeoTIFF>} Matriz de capas, tipo GeoTIFF.
   * @api
   */
  getGeoTIFF(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getGeoTIFF)) {
      Exception(getValue('exception').getgeotiff_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.GeoTIFF);
      });
    }

    // gets the layers
    const layers = this.getImpl().getGeoTIFF(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
 * Este método agrega las capas GeoTIFF al mapa.
 *
 * @function
 * @param {Array<string>|Array<Mx.parameters.GeoTIFF>} layersParam Colección u objeto de capa.
 * @returns {Map} Devuelve el estado del mapa.
 * @api
 */
  addGeoTIFF(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addGeoTIFF)) {
        Exception(getValue('exception').addgeotiff_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as GeoTIFF objects to add
      const geotiffLayers = [];
      layersParam.forEach((layerParam) => {
        let geotiffLayer;
        if (layerParam instanceof GeoTIFF) {
          geotiffLayer = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          try {
            geotiffLayer = new GeoTIFF(layerParam, layerParam.options);
          } catch (err) {
            Dialog.error(err.toString());
            throw err;
          }
        }
        geotiffLayers.push(geotiffLayer);
      });

      // adds the layers
      this.getImpl().addGeoTIFF(geotiffLayers);
      geotiffLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [geotiffLayers]);
      this.fire(EventType.ADDED_GEOTIFF, [geotiffLayers]);
    }
    return this;
  }

  /**
 * Este método elimina las capas GeoTIFF del mapa.
 *
 * @function
 * @param {Array<string>|Array<Mx.parameters.GeoTIFF>} layersParam Matriz de capas de nombres que
 * desea eliminar.
 * @returns {Map} Devuelve el estado del mapa.
 * @api
 */
  removeGeoTIFF(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeGeoTIFF)) {
        Exception(getValue('exception').removegeotiff_method);
      }

      // gets the layers
      const geotiffLayers = this.getGeoTIFF(layersParam);
      if (geotiffLayers.length > 0) {
        geotiffLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        // removes the layers
        this.getImpl().removeGeoTIFF(geotiffLayers);
      }
    }
    return this;
  }

  /**
   * Este método obtiene las capas MapLibre agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMC>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo MapLibre.
   * @returns {Array<MapLibre>} Matriz de capas, tipo MapLibre.
   * @api
   */
  getMapLibre(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getMapLibre)) {
      Exception(getValue('exception').mapLibre_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.MapLibre);
      });
    }

    // gets the layers
    const layers = this.getImpl().getMapLibre(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
     * Este método agrega las capas MapLibre al mapa.
     *
     * @function
     * @param {Array<string>|Array<Mx.parameters.MapLibre>} layersParam Colección u objeto de capa.
     * @returns {Map} Devuelve el estado del mapa.
     * @api
     */
  addMapLibre(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addMapLibre)) {
        Exception(getValue('exception').addto_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as addMapLibre objects to add
      const mapLibreLayers = [];
      layersParam.forEach((layerParam) => {
        let mapLibreLayer;
        if (layerParam instanceof MapLibre) {
          mapLibreLayer = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          try {
            mapLibreLayer = new MapLibre(layerParam, layerParam.options);
          } catch (err) {
            Dialog.error(err.toString());
            throw err;
          }
        }
        this.featuresHandler_.addLayer(mapLibreLayer);
        mapLibreLayers.push(mapLibreLayer);
      });

      // adds the layers
      this.getImpl().addMapLibre(mapLibreLayers);
      mapLibreLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [mapLibreLayers]);
      this.fire(EventType.ADDED_MAPLIBRE, [mapLibreLayers]);
    }
    return this;
  }

  /**
     * Este método elimina las capas MapLibre del mapa.
     *
     * @function
     * @param {Array<string>|Array<Mx.parameters.MapLibre>} layersParam Matriz de capas de nombres
     * que desea eliminar.
     * @returns {Map} Devuelve el estado del mapa.
     * @api
     */
  removeMapLibre(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeMapLibre)) {
        Exception(getValue('exception').removelayers_method);
      }

      // gets the layers
      const mapLibreLayers = this.getMapLibre(layersParam);
      if (mapLibreLayers.length > 0) {
        mapLibreLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        // removes the layers
        this.getImpl().removeMapLibre(mapLibreLayers);
      }
    }
    return this;
  }

  /**
   * Este método agrega las capas de OGCAPIFeatures al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional
   * - Matriz de capas de nombres, escriba OGCAPIFeatures.
   * @returns {Array<OGCAPIFeatures>} Capas del mapa.
   * @api
   */
  getOGCAPIFeatures(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getOGCAPIFeatures)) {
      Exception(getValue('exception').getogcapif_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.OGCAPIFeatures);
      });
    }

    // gets the layers
    const layers = this.getImpl().getOGCAPIFeatures(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas OGCAPIFeatures al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.OGCAPIFeatures>} layersParam Colección u objeto
   * de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addOGCAPIFeatures(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addOGCAPIFeatures)) {
        Exception(getValue('exception').addogcapif_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as OGCAPIFeatures objects to add
      const ogcapifLayers = [];
      layersParam.forEach((layerParam) => {
        let ogcapifLayer;
        if (layerParam instanceof OGCAPIFeatures) {
          ogcapifLayer = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          try {
            ogcapifLayer = new OGCAPIFeatures(layerParam, layerParam.options);
          } catch (err) {
            Dialog.error(err.toString());
            throw err;
          }
        }
        this.featuresHandler_.addLayer(ogcapifLayer);
        ogcapifLayers.push(ogcapifLayer);
      });

      // adds the layers
      this.getImpl().addOGCAPIFeatures(ogcapifLayers);
      ogcapifLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [ogcapifLayers]);
      this.fire(EventType.ADDED_OGCAPIFEATURES, [ogcapifLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas OGCAPIFeatures del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.OGCAPIFeatures>} layersParam Matriz de capas de
   * nombres que desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeOGCAPIFeatures(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeOGCAPIFeatures)) {
        Exception(getValue('exception').removeogcapif_method);
      }

      // gets the layers
      const ogcapifLayers = this.getOGCAPIFeatures(layersParam);
      if (ogcapifLayers.length > 0) {
        ogcapifLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        // removes the layers
        this.getImpl().removeOGCAPIFeatures(ogcapifLayers);
      }
    }
    return this;
  }

  /**
   * Este método obtiene las capas WMTS agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMTS>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo WMTS.
   * @returns {Array<WMTS>} Capas del mapa.
   * @api
   */
  getWMTS(layersParamVar) {
    let layersParam = layersParamVar;
    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getWMTS)) {
      Exception(getValue('exception').getwmts_method);
    }

    // parses parameters to Array
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.WMTS);
      });
    }

    // gets the layers
    const layers = this.getImpl().getWMTS(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas WMTS al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMTS>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addWMTS(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addWMTS)) {
        Exception(getValue('exception').addwmts_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      this.collectorCapabilities_(layersParam);

      // gets the parameters as WMS objects to add
      const wmtsLayers = [];
      layersParam.forEach((layerParam) => {
        if (layerParam instanceof WMTS) {
          layerParam.setMap(this);
          wmtsLayers.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          const wmtsLayer = new WMTS(layerParam, layerParam.options);
          wmtsLayer.setMap(this);
          wmtsLayers.push(wmtsLayer);
        }
      });

      // adds the layers
      this.getImpl().addWMTS(wmtsLayers);
      wmtsLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [wmtsLayers]);
      this.fire(EventType.ADDED_WMTS, [wmtsLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas WMTS del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMTS>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeWMTS(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.removeWMTS)) {
        Exception(getValue('exception').removewmts_method);
      }

      // gets the layers
      const wmtsLayers = this.getWMTS(layersParam);
      if (wmtsLayers.length > 0) {
        // removes the layers
        this.getImpl().removeWMTS(wmtsLayers);
      }
    }
    return this;
  }

  /**
   * Este método obtiene las capas MVT.
   *
   * @function
   * @public
   * @param {Array<string>|Array<Mx.parameters.WMTS>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo MVT.
   * @returns {Array<WMTS>} Capas del mapa.
   * @api
   */
  getMVT(layersParamVar) {
    let layersParam = layersParamVar;
    if (isUndefined(MapImpl.prototype.getMVT)) {
      Exception('La implementación usada no posee el método getMVT');
    }

    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.MVT);
      });
    }

    const layers = this.getImpl().getMVT(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método elimina las capas MVT del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.WMTS>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @public
   * @api
   */
  removeMVT(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeMVT)) {
        Exception('La implementación usada no posee el método removeMVT');
      }
      const mvtLayers = this.getMVT(layersParam);
      if (mvtLayers.length > 0) {
        mvtLayers.forEach((layer) => {
          this.featuresHandler_.removeLayer(layer);
        });
        this.getImpl().removeMVT(mvtLayers);
      }
    }
    return this;
  }

  /**
   * Este método agrega capas MVT.
   *
   * @function
   * @public
   * @param {Array<string>|Array<Mx.parameters.WMTS>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addMVT(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.addMVT)) {
        Exception('La implementación usada no posee el método addMVT');
      }

      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const mvtLayers = [];
      layersParam.forEach((layerParam) => {
        let vectorTile;
        if (layerParam instanceof MVT) {
          vectorTile = layerParam;
        } else if (!(layerParam instanceof Layer)) {
          try {
            vectorTile = new MVT(layerParam, layerParam.options);
          } catch (err) {
            Dialog.error(err.toString());
            throw err;
          }
        }
        // FIXME: Hay problemas majenando las features de los vector tiles
        // en openlayers
        // this.featuresHandler_.addLayer(vectorTile);
        mvtLayers.push(vectorTile);
      });

      this.getImpl().addMVT(mvtLayers);
      mvtLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [mvtLayers]);
      this.fire(EventType.ADDED_VECTOR_TILE, [mvtLayers]);
    }
    return this;
  }

  /**
   * Este método obtiene las capas MBTiles agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBTiles>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo MBTiles.
   * @returns {Array<IDEE.layer.MBTiles>} Capas del mapa.
   * @api
   */
  getMBTiles(layersParamVar) {
    let layersParam = layersParamVar;

    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.MBTiles);
      });
    }
    const layers = this.getImpl().getMBTiles(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas de MBTiles al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBTiles>} layersParamVar Colección u
   * objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addMBTiles(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const mbtilesLayers = [];
      layersParam.forEach((layerParam) => {
        let mbtileslayer = layerParam;
        if (!(layerParam instanceof MBTiles)) {
          mbtileslayer = new MBTiles(layerParam, layerParam.options);
        }
        mbtileslayer.setMap(this);
        mbtilesLayers.push(mbtileslayer);
      });

      this.getImpl().addMBTiles(mbtilesLayers);
      mbtilesLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [mbtilesLayers]);
      this.fire(EventType.ADDED_MBTILES, [mbtilesLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas de MBTiles del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBTiles>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeMBTiles(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      const mbtilesLayers = this.getMBTiles(layersParam);
      if (mbtilesLayers.length > 0) {
        this.getImpl().removeMBTiles(mbtilesLayers);
      }
    }
    return this;
  }

  /**
   * Este método obtiene las capas MBTilesVector agregadas al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBTilesVector>} layersParamVar Opcional.
   * - Matriz de capas de nombres, tipo MBTilesVector.
   * @returns {Array<IDEE.layer.MBTilesVector>} Capas del mapa.
   * @api
   */
  getMBTilesVector(layersParamVar) {
    let layersParam = layersParamVar;
    if (isUndefined(MapImpl.prototype.getMBTilesVector)) {
      Exception(getValue('exception').getmbtiles_method);
    }
    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    // gets the parameters as Layer objects to filter
    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.MBTilesVector);
      });
    }
    const layers = this.getImpl().getMBTilesVector(filters).sort(Map.LAYER_SORT);
    return layers;
  }

  /**
   * Este método agrega las capas de MBTilesVector al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBTilesVector>} layersParamVar
   * Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addMBTilesVector(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.addMBTilesVector)) {
        Exception(getValue('exception').addmbtiles_method);
      }
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }
      const mbtilesLayers = [];
      layersParam.forEach((layerParam) => {
        if (isObject(layerParam)
          && (layerParam instanceof MBTilesVector)) {
          layerParam.setMap(this);
          mbtilesLayers.push(layerParam);
        }
      });
      this.getImpl().addMBTilesVector(mbtilesLayers);
      mbtilesLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [mbtilesLayers]);
      this.fire(EventType.ADDED_MBTILES_VECTOR, [mbtilesLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas de MBTilesVector del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.MBTilesVector>} layersParam Matriz de capas
   * de nombres que desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeMBTilesVector(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeMBTilesVector)) {
        Exception(getValue('exception').removembtiles_method);
      }
      const mbtilesLayers = this.getMBTilesVector(layersParam);
      if (mbtilesLayers.length > 0) {
        this.getImpl().removeMBTilesVector(mbtilesLayers);
      }
    }
    return this;
  }

  /**
   * Este método devuelve las capas XYZ al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo XYZ.
   * @returns {Array<IDEE.layer.XYZ>} Capas del mapa.
   * @api
   */
  getXYZs(layersParamVar) {
    let layersParam = layersParamVar;
    if (isUndefined(MapImpl.prototype.getXYZs)) {
      Exception(getValue('exception').getxyzs_method);
    }

    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map(parameter.layer);
    }

    const layers = this.getImpl().getXYZs(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas XYZ al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addXYZ(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.addXYZ)) {
        Exception(getValue('exception').addxyz_method);
      }

      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const xyzLayers = [];
      layersParam.forEach((layerParam) => {
        if (layerParam instanceof XYZ) {
          layerParam.setMap(this);
          xyzLayers.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          const xyzLayer = new XYZ(layerParam, layerParam.options);
          xyzLayer.setMap(this);
          xyzLayers.push(xyzLayer);
        }
      });

      this.getImpl().addXYZ(xyzLayers);
      xyzLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [xyzLayers]);
      this.fire(EventType.ADDED_XYZ, [xyzLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas XYZ del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeXYZ(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeXYZ)) {
        Exception(getValue('exception').removexyz_method);
      }

      const xyzLayers = this.getXYZs(layersParam);
      if (xyzLayers.length > 0) {
        this.getImpl().removeXYZ(xyzLayers);
      }
    }
    return this;
  }

  /**
   * Este método devuelve las capas TMS al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Opcional.
   * - Matriz de capas de nombres, tipo TMS.
   * @returns {Array<IDEE.layer.TMS>} Capas del mapa.
   * @api
   */
  getTMS(layersParamVar) {
    let layersParam = layersParamVar;
    if (isUndefined(MapImpl.prototype.getTMS)) {
      Exception(getValue('exception').gettms_method);
    }

    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map(parameter.layer);
    }

    const layers = this.getImpl().getTMS(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas TMS al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Colección u objeto de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addTMS(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.addTMS)) {
        Exception(getValue('exception').addtms_method);
      }

      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const tmsLayers = [];
      layersParam.forEach((layerParam) => {
        if (layerParam instanceof TMS) {
          layerParam.setMap(this);
          tmsLayers.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          const tmsLayer = new TMS(layerParam, layerParam.options);
          tmsLayer.setMap(this);
          tmsLayers.push(tmsLayer);
        }
      });

      this.getImpl().addTMS(tmsLayers);
      tmsLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [tmsLayers]);
      this.fire(EventType.ADDED_TMS, [tmsLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas TMS del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeTMS(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeTMS)) {
        Exception(getValue('exception').removetms_method);
      }

      const tmsLayers = this.getTMS(layersParam);
      if (tmsLayers.length > 0) {
        this.getImpl().removeTMS(tmsLayers);
      }
    }
    return this;
  }

  /**
   * Este método devuelve las capas Tiles3D del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParamVar Opcional.
   * - Matriz de capas de nombres, tipo Tiles3D.
   * @returns {Array<IDEE.layer.Tiles3D>} Capas del mapa.
   * @api
   */
  getTiles3D(layersParamVar) {
    let layersParam = layersParamVar;
    if (isUndefined(MapImpl.prototype.getTiles3D)) {
      Exception(getValue('exception').gettiles3d_method);
    }

    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.Tiles3D);
      });
    }

    const layers = this.getImpl().getTiles3D(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
     * Este método agrega las capas Tiles3D al mapa.
     *
     * @function
     * @param {Array<string>|Array<Mx.parameters.Tiles3D>} layersParam Colección u objeto
     * de capa.
     * @returns {Map} Devuelve el estado del mapa.
     * @api
     */
  addTiles3D(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addTiles3D)) {
        Exception(getValue('exception').addtiles3d_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as Tiles3D objects to add
      const tiles3DLayers = [];
      layersParam.forEach((layerParam) => {
        let tiles3DLayer;
        if (layerParam instanceof Tiles3D) {
          tiles3DLayer = layerParam;
          layerParam.setMap(this);
          tiles3DLayers.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          tiles3DLayer = new Tiles3D(layerParam, layerParam.options);
          tiles3DLayer.setMap(this);
          tiles3DLayers.push(tiles3DLayer);
        }
        this.featuresHandler_.addLayer(tiles3DLayer);
      });

      // adds the layers
      this.getImpl().addTiles3D(tiles3DLayers);
      tiles3DLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [tiles3DLayers]);
      this.fire(EventType.ADDED_TILES3D, [tiles3DLayers]);
    }
    return this;
  }

  /**
     * Este método elimina las capas Tiles3D del mapa.
     *
     * @function
     * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de capas de nombres que
     * desea eliminar.
     * @returns {Map} Devuelve el estado del mapa.
     * @api
     */
  removeTiles3D(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeTiles3D)) {
        Exception(getValue('exception').removetiles3d_method);
      }

      const tiles3DLayers = this.getTiles3D(layersParam);
      if (tiles3DLayers.length > 0) {
        this.getImpl().removeTiles3D(tiles3DLayers);
      }
    }
    return this;
  }

  /**
     * Este método devuelve las capas Terrain del mapa.
     *
     * @function
     * @param {Array<string>|Array<Mx.parameters.Layer>} layersParamVar Opcional.
     * - Matriz de capas de nombres, tipo Terrain.
     * @returns {Array<IDEE.layer.Terrain>} Capas del mapa.
     * @api
     */
  getTerrain(layersParamVar) {
    let layersParam = layersParamVar;
    if (isUndefined(MapImpl.prototype.getTerrain)) {
      Exception(getValue('exception').getterrain_method);
    }

    if (isNull(layersParam)) {
      layersParam = [];
    } else if (!isArray(layersParam)) {
      layersParam = [layersParam];
    }

    let filters = [];
    if (layersParam.length > 0) {
      filters = layersParam.map((layerParam) => {
        return parameter.layer(layerParam, LayerType.Terrain);
      });
    }

    const layers = this.getImpl().getTerrain(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
     * Este método agrega las capas Terrain al mapa.
     *
     * @function
     * @param {Array<string>|Array<Mx.parameters.Terrain>} layersParam Colección u objeto
     * de capa.
     * @returns {Map} Devuelve el estado del mapa.
     * @api
     */
  addTerrain(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addTerrain)) {
        Exception(getValue('exception').addterrain_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      // gets the parameters as Terrain objects to add
      const terrainLayers = [];
      layersParam.forEach((layerParam) => {
        if (layerParam instanceof Terrain) {
          layerParam.setMap(this);
          terrainLayers.push(layerParam);
        } else if (!(layerParam instanceof Layer)) {
          const terrainLayer = new Terrain(layerParam, layerParam.options);
          terrainLayer.setMap(this);
          terrainLayers.push(terrainLayer);
        }
      });

      // adds the layers
      this.getImpl().addTerrain(terrainLayers);
      terrainLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [terrainLayers]);
      this.fire(EventType.ADDED_TERRAIN, [terrainLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas Terrain del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeTerrain(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeTerrain)) {
        Exception(getValue('exception').removeterrain_method);
      }

      const terrainLayers = this.getTerrain(layersParam);
      if (terrainLayers.length > 0) {
        this.getImpl().removeTerrain(terrainLayers);
      }
    }
    return this;
  }

  /**
   * Este método devuelve las capas GeoPackageTile del mapa.
   *
   * @function
   * @param {Object} filters Opcional.
   * @returns {Array<IDEE.layer.GeoPackageTile>} Capas del mapa.
   * @api
   */
  getGeoPackageTile(filters) {
    const layers = this.getImpl().getGeoPackageTile(filters).sort(Map.LAYER_SORT);

    return layers;
  }

  /**
   * Este método agrega las capas GeoPackageTile al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.GeoPackageTile>} layersParam Colección u objeto
   * de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addGeoPackageTile(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addGeoPackageTile)) {
        Exception(getValue('exception').addgeopackagetile_method);
      }

      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const geopackagetileLayers = [];
      layersParam.forEach((layerParam) => {
        let geoPackageTile;
        if (isObject(layerParam) && layerParam.type === LayerType.GeoPackageTile) {
          geoPackageTile = layerParam;
        }
        geopackagetileLayers.push(geoPackageTile);
      });

      // adds the layers
      this.getImpl().addGeoPackageTile(geopackagetileLayers);
      geopackagetileLayers.forEach((layer) => {
        if (isFunction(layer.startAutoRefresh)) {
          layer.startAutoRefresh(this.getAutoRefreshInterval());
        }
      });
      this.fire(EventType.ADDED_LAYER, [geopackagetileLayers]);
      this.fire(EventType.ADDED_GEOPACKAGE_TILE, [geopackagetileLayers]);
    }
    return this;
  }

  /**
   * Este método elimina las capas GeoPackageTile del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParam Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeGeoPackageTile(layersParam) {
    if (!isNullOrEmpty(layersParam)) {
      if (isUndefined(MapImpl.prototype.removeGeoPackageTile)) {
        Exception(getValue('exception').removegeopackagetile_method);
      }

      const geopackagetileLayers = this.getGeoPackageTile(layersParam);
      if (geopackagetileLayers.length > 0) {
        geopackagetileLayers.forEach((layer) => {
          this.getFeatureHandler().removeLayer(layer);
        });
        this.getImpl().removeGeoPackageTile(geopackagetileLayers);
      }
    }
    return this;
  }

  /**
   * Este método agrega las capas GeoPackage al mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.GeoPackage>} layersParam Colección u objeto
   * de capa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addGeoPackage(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      // parses parameters to Array
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      layersParam.forEach((layerParam) => {
        if (layerParam && layerParam.type === LayerType.GeoPackage) {
          layerParam.addTo(this);
          this.geopackages.push(layerParam);
        }
      });

      this.fire(EventType.ADDED_LAYER, [this.geopackages]);
      this.fire(EventType.ADDED_GEOPACKAGE, [this.geopackages]);
    }
    return this;
  }

  /**
   * Este método elimina las capas GeoPackage del mapa.
   *
   * @function
   * @param {Array<string>|Array<Mx.parameters.Layer>} layersParamVar Matriz de capas de nombres que
   * desea eliminar.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeGeoPackage(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const geopackageLayers = layersParam.filter((layerParam) => layerParam
        && layerParam.type === LayerType.GeoPackage);
      geopackageLayers.forEach((layer) => {
        layer.removeLayers();
        this.geopackages = this.geopackages
          .filter((geopackage) => !geopackage.equals(layer));
      });
    }
    return this;
  }

  /**
   * Este método agrega las capas rápidas al mapa.
   *
   * @function
   * @param {Array<string>|String} layersParam Colección de nombres de capas.
   * rápidas o nombre de una capa rápida.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addQuickLayers(layersParamVar) {
    let layersParam = layersParamVar;
    if (!isNullOrEmpty(layersParam)) {
      if (!isArray(layersParam)) {
        layersParam = [layersParam];
      }

      const quickLayers = [];
      layersParam.forEach((layerParam) => {
        if (isString(layerParam)) {
          let value = layerParam;
          if (layerParam.indexOf('QUICK*') === -1) {
            value = `QUICK*${layerParam}`;
          }
          quickLayers.push(value);
        } else {
          quickLayers.push(layerParam);
        }
      });

      this.addLayers(quickLayers);

      this.fire(EventType.ADDED_QUICK_LAYERS, [quickLayers]);
    }
    return this;
  }

  /**
   * Este método devuelve los controles especificados por el usuario.
   *
   * @public
   * @function
   * @param {string|Array<String>} controlsParam Controles de nombre de colección.
   * @returns {Array<ControlPanel> | Array<Control> | Array<Plugin>} Matriz de retorno de controles.
   * @api
   */
  getControls(controlsParamVar) {
    let controlsParam = controlsParamVar;

    // checks if the implementation can manage layers
    if (isUndefined(MapImpl.prototype.getControls)) {
      Exception(getValue('exception').getcontrols_method);
    }

    // parses parameters to Array
    if (isNull(controlsParam)) {
      controlsParam = [];
    } else if (!isArray(controlsParam)) {
      controlsParam = [controlsParam];
    }

    // gets the controls
    const controls = this.getImpl().getControls(controlsParam);

    return controls;
  }

  /**
   * Este método añade un estilo al control scaleline para que
   * no choque con los controles scale y wmcselector cuando la pantalla
   * no es lo suficientemente ancha y los tres controles han sido añadidos.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @private
   * @function
   * @param {Object} panel panel del control.
   * @api
   */
  addUpClass_(panel) {
    panel.on(EventType.ADDED_TO_MAP, (html) => {
      if (this.getControls(['wmcselector', 'scale', 'scaleline']).length === 3) {
        this.getControls(['scaleline'])[0].getImpl().getElement().classList.add('ol-scale-line-up');
      }
    });
  }

  /**
   * Este método agrega controles especificados por el usuario.
   *
   * @public
   * @function
   * @param {string|Object|Array<String>|Array<Object>} controlsParamVar
   * Colección o nombre de los controles.
   * @param {Boolean} skipCheckDuplicate Indica si se debe omitir la
   * comprobación de controles duplicados.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addControls(controlsParamVar, skipCheckDuplicate = false) {
    let controlsParam = controlsParamVar;
    if (!isNullOrEmpty(controlsParam)) {
      // checks if the implementation can manage layers
      if (isUndefined(MapImpl.prototype.addControls)) Exception(getValue('exception').addcontrols_method);

      // parses parameters to Array
      if (!isArray(controlsParam)) controlsParam = [controlsParam];

      // gets the parameters as Control to add them
      const controls = [];
      controlsParam.forEach((controlParamVar) => {
        const controlParam = controlParamVar;
        let control;
        if (isString(controlParam)) {
          control = buildControl(controlParam, this);
          // Skip if control is null (like Attributions which is handled separately)
          if (isNullOrEmpty(control)) {
            // TODO: crear alerta que indique que no se ha creado un control compatible,
            // se debe indicar al usuario/desarrollador como hacerlo
            return;
          }
        } else if (isObject(controlParam) && controlParam instanceof Control) {
          control = controlParam;
          control.builderParams = control.options;
        }
        const panel = getPanelForControl(control, this, control.builderParams ?? {});
        const isControlWithoutAdding = !this.hasControl(control);
        if (isControlWithoutAdding || skipCheckDuplicate) {
          if (!isNullOrEmpty(panel) && isControlWithoutAdding) {
            panel.addControls(control);
            this.addControlPanels(panel);
          } else if (!isNullOrEmpty(control)) {
            control.addTo(this);
            controls.push(control);
          }
        } else {
          const message = `( "${control.name}" ): ${getValue('exception').control_already_added}`;
          Dialog.error(message);
        }
      });

      this.getImpl().addControls(controls);
    }
    return this;
  }

  /**
  * Este método consigue un contenedor habilitado para el uso de herramientas
  *
  * @public
  * @function
  * @param { Position } position implementación del control
  * @api stable
  * @return {HTML} el contenedor previamente declarado
  */
  getToolsContainer(position) {
    let toolContainer = null;

    try {
      switch (position) {
        case Position.LEFT:
          toolContainer = this.leftButtons;
          break;

        case Position.RIGHT:
          toolContainer = this.rightButtons;
          break;

        case Position.DOWN:
          toolContainer = this.downPanel;
          break;

        case Position.CTL:
          toolContainer = this.centerPanelTopLeft;
          break;

        case Position.CTR:
          toolContainer = this.centerPanelTopRight;
          break;

        case Position.CBL:
          toolContainer = this.centerPanelBottomLeft;
          break;

        case Position.CBR:
          toolContainer = this.centerPanelBottomRight;
          break;

        default:
          throw new Error(`${getValue('exception').no_tool_position}, '${position}'`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      Exception(err.message);
    }
    return toolContainer;
  }

  /**
  * Este método recibe una herramienta le asigna un contenedor padre y coloca su vista
  * de forma ordenada en su interior
  *
  * @public
  * @function
  * @param { HTMLElement } container contenedor de mapa asignado
  * @param { Control | Plugin } toolImpl implementación del control o plugin que contiene la vista
  * @api stable
  */
  addToolToContainer(container, toolImpl) {
    container.appendChild(toolImpl.getView());
  }

  /**
   * Este método comprueba si el mapa tiene un control añadido o no.
   *
   * @function
   * @param {String} control nombre del control a buscar.
   * @returns {Boolean} Devuelve si el mapa tiene o no el control.
   * @api
   */
  hasControl(control) {
    let controlName = control;
    if (control instanceof Control) {
      controlName = control.name;
    }
    const controls = this.getControls();
    let hasControl = false;
    if (controls.some((ctrl) => ctrl.name === controlName)) {
      hasControl = true;
    }
    return hasControl;
  }

  /**
   * Este método elimina los controles especificados del mapa.
   *
   * @function
   * @param {string|Array<string>} controlsParam Colección o nombre de los controles
   * especificado por el usuario.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  removeControls(controlsParam) {
    // checks if the parameter is null or empty
    if (isNullOrEmpty(controlsParam)) {
      Exception(getValue('exception').remove_control);
    }

    // checks if the implementation can manage controls
    if (isUndefined(MapImpl.prototype.removeControls)) {
      Exception(getValue('exception').removecontrol_method);
    }

    // gets controls to remove
    let controls = this.getControls(controlsParam);
    controls = [].concat(controls);
    if (controls.length > 0) {
      controls.forEach((control) => {
        const panel = control.getPanel();
        // check if this control has panels and remove it if
        if (panel instanceof Panel) {
          const panelControls = panel.getControls();
          if (isArray(panelControls) && panelControls.legth === 1) {
            this.removePanel(panel);
          } else {
            panel.removeControls(control);
          }
        }
      });

      // Finally remove this control from de map and destroy
      this.getImpl().removeControls(controls);
    }

    return this;
  }

  /**
   * Este método proporciona la extensión máxima para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Mx.Extent} Devuelve la extensión máxima.
   * @api
   */
  getMaxExtent() {
    let maxExtent = this.userMaxExtent;
    if (isNullOrEmpty(maxExtent)) {
      const selectedWmc = this.getWMC().find((wmc) => wmc.selected);
      if (!isNullOrEmpty(selectedWmc)) {
        maxExtent = selectedWmc.getMaxExtent();
      }
      if (isNullOrEmpty(maxExtent)) {
        maxExtent = this.getProjection().getExtent();
      }
    }
    return maxExtent;
  }

  /**
   * Este método proporciona la extensión máxima para esta
   * instancia de mapa.
   * Versión asíncrona de "getMaxExtent".
   *
   * @public
   * @function
   * @returns {Promise} Devuelve la extensión máxima.
   * @api
   */
  calculateMaxExtent() {
    return new Promise((resolve) => {
      let maxExtent = this.userMaxExtent;
      if (isNullOrEmpty(maxExtent)) {
        const selectedWmc = !isUndefined(MapImpl.prototype.getWMC)
          ? this.getWMC().find((wmc) => wmc.selected) : null;
        if (isNullOrEmpty(selectedWmc)) {
          const calculateExtents = this.getLayers().filter((layer) => layer.name !== '__draw__' && layer.isVisible()).map((l) => l.calculateMaxExtent());
          Promise.all(calculateExtents).then((extents) => {
            maxExtent = getEnvolvedExtent(extents);
            if (isNullOrEmpty(maxExtent)) {
              maxExtent = this.getProjection().getExtent();
            }
            // if the maxExtent is modified while are calculating maxExtent
            if (!isNullOrEmpty(this.userMaxExtent)) {
              maxExtent = this.userMaxExtent;
            }
            resolve(maxExtent);
          });
        } else {
          selectedWmc.calculateMaxExtent().then(resolve);
        }
      } else {
        resolve(maxExtent);
      }
    });
  }

  /**
   * Este método establece la extensión máxima para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Array<String>|Array<Number>|Mx.Extent} maxExtentParam La extensión máxima.
   * @param {Boolean} zoomToExtent Establecer "bbox".
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setMaxExtent(maxExtentParam, zoomToExtent = true) {
    // checks if the param is null or empty
    if (isNullOrEmpty(maxExtentParam)) {
      this.resetMaxExtent();
    }

    // checks if the implementation can set the maxExtent
    if (isUndefined(MapImpl.prototype.setMaxExtent)) {
      Exception(getValue('exception').setmaxextent_method);
    }

    // parses the parameter
    try {
      let maxExtent = parameter.maxExtent(maxExtentParam);
      if (!isArray(maxExtent) && isObject(maxExtent)) {
        maxExtent = [
          maxExtent.x.min,
          maxExtent.y.min,
          maxExtent.x.max,
          maxExtent.y.max,
        ];
      }
      this.userMaxExtent = maxExtent;
      this.getImpl().setMaxExtent(maxExtent, zoomToExtent);
    } catch (err) {
      Dialog.error(err.toString());
      throw err;
    }
    return this;
  }

  /**
   * Este método restablece la extensión máxima del Mapa.
   *
   * @public
   * @function
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  resetMaxExtent() {
    this.userMaxExtent = null;
    this.calculateMaxExtent().then((maxExtentParam) => {
      let maxExtent = parameter.maxExtent(maxExtentParam);
      if (isObject(maxExtent)) {
        maxExtent = [maxExtent.x.min, maxExtent.y.min, maxExtent.x.max, maxExtent.y.max];
      }
      this.getImpl().setMaxExtent(maxExtent, true);
    });
    return this;
  }

  /**
   * Este método proporciona la extensión actual ("bbox") de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Mx.Extent} Regresa el "Bbox".
   * @api
   */
  getBbox() {
    // checks if the implementation can set the maxExtent
    if (isUndefined(MapImpl.prototype.getBbox)) {
      Exception(getValue('exception').getbbox_method);
    }

    const bbox = this.getImpl().getBbox();

    return bbox;
  }

  /**
   * Este método establece el "bbox" para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Array<String>|Array<Number>|Mx.Extent} bboxParam El "bbox".
   * @param {Object} vendorOpts Opciones de proveedores.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setBbox(bboxParam, vendorOpts) {
    // checks if the param is null or empty
    if (isNullOrEmpty(bboxParam)) {
      Exception(getValue('exception').no_bbox);
    }

    // checks if the implementation can set the maxExtent
    if (isUndefined(MapImpl.prototype.setBbox)) {
      Exception(getValue('exception').setbbox_method);
    }

    try {
      // parses the parameter
      const bbox = parameter.maxExtent(bboxParam);
      this.getImpl().setBbox(bbox, vendorOpts);
    } catch (err) {
      Dialog.error(getValue('exception').incorrect_format_bbox);
      throw err;
    }
    return this;
  }

  /**
  * Hace un vuelo a una extensión dada con opciones de animación.
  *
  * @public
  * @function
  * @param {String|Array<String>|Array<Number>|Mx.Extent} extent Extensión [minX, minY, maxX, maxY].
  * @param {Object} vendorOpts Opciones de proveedores.
  * @returns {Map}
  * @api
  */
  flyTo(extent, vendorOpts = {}) {
    if (isUndefined(MapImpl.prototype.flyTo)) {
      Exception(getValue('exception').flyTo_method);
    }

    try {
      // parses the parameter
      const maxExtent = parameter.maxExtent(extent);
      this.getImpl().flyTo(maxExtent, vendorOpts);
    } catch (err) {
      Dialog.error(getValue('exception').flyTo_method);
      throw err;
    }
    return this;
  }

  /**
     * Este método proporciona el zoom actual de esta
     * instancia del mapa.
     *
     * @public
     * @function
     * @param {Boolean} exact Permite devolver el zoom exacto del mapa en caso de que se permita
     * niveles de zoom intermedios, Por defecto es true.
     * @param {Boolean} inmeters Si es verdadero el zoom obtenido está en metros, en caso contrario
     * como nivel de zoom. Por defecto, es falso.
     * @returns {Number} Devuelve el zoom actual.
     * @api
     */
  getZoom(exact = true, inmeters = false) {
    // checks if the implementation can get the zoom
    if (isUndefined(MapImpl.prototype.getZoom)) {
      Exception(getValue('exception').getzoom_method);
    }

    let zoom = this.getImpl().getZoom(inmeters);
    if (!exact) {
      zoom = Math.round(zoom);
    }

    return zoom;
  }

  /**
   * Este método proporciona el zoom mínimo de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {Boolean} inmeters Si es verdadero el zoom obtenido está en metros,
   * en caso contrario como nivel de zoom. Por defecto, es falso.
   * @returns {Number} Devuelve el zoom mínimo actual.
   * @api
   */
  getMinZoom(inmeters = false) {
    // checks if the implementation can get the zoom
    if (isUndefined(MapImpl.prototype.getMinZoom)) {
      Exception(getValue('exception').getzoom_method);
    }

    const zoom = this.getImpl().getMinZoom(inmeters);

    return zoom;
  }

  /**
   * Este método proporciona el zoom máximo de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {Boolean} inmeters Si es verdadero el zoom obtenido está en metros,
   * en caso contrario como nivel de zoom. Por defecto, es falso.
   * @returns {Number} Devuelve el zoom máximo actual.
   * @api
   */
  getMaxZoom(inmeters = false) {
    // checks if the implementation can get the zoom
    if (isUndefined(MapImpl.prototype.getMaxZoom)) {
      Exception(getValue('exception').getzoom_method);
    }

    const zoom = this.getImpl().getMaxZoom(inmeters);

    return zoom;
  }

  /**
   * Este método establece el zoom para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Number} zoomParam El zoom.
   * @param {Boolean} inmeters Si es verdadero se indica que el zoom dado por parámetro
   * está en metros, en caso contrario como nivel de zoom. En el caso de
   * ser metros a mayor cantidad menor nivel de zoom. Por defecto, es falso.
   * @param {Boolean} isUserZoom Indica si el zoom es establecido por el usuario.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setZoom(zoomParam, inmeters = false, isUserZoom = true) {
    // checks if the param is null or empty
    if (isNullOrEmpty(zoomParam)) {
      Exception(getValue('exception').no_zoom);
    }

    // checks if the implementation can set the zoom
    if (isUndefined(MapImpl.prototype.setZoom)) {
      Exception(getValue('exception').setzoom_method);
    }

    try {
      // parses the parameter
      const zoom = parameter.zoom(zoomParam);
      if (isUserZoom) this._userZoom = zoom;
      this.getImpl().setZoom(zoom, inmeters);
    } catch (err) {
      Dialog.error(err.toString());
      throw err;
    }

    return this;
  }

  /**
   * Este método establece el zoom mínimo para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Number} zoomParam El zoom.
   * @param {Boolean} inmeters Si es verdadero se indica que el zoom dado por parámetro
   * está en metros, en caso contrario como nivel de zoom. En el caso de
   * ser metros a mayor cantidad menor nivel de zoom. Por defecto, es falso.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setMinZoom(zoomParam, inmeters = false) {
    if (isNullOrEmpty(zoomParam)) {
      Exception(getValue('exception').no_zoom);
    }

    if (isUndefined(MapImpl.prototype.setMinZoom)) {
      Exception(getValue('exception').setzoom_method);
    }

    const minZoom = parameter.minZoom(zoomParam);
    this.minZoom = minZoom;
    this.getImpl().setMinZoom(minZoom, inmeters);
    return this;
  }

  /**
   * Este método establece el zoom máximo para esta
   * instancia del de mapa.
   *
   * @public
   * @function
   * @param {String|Number} zoomParam El zoom.
   * @param {Boolean} inmeters Si es verdadero se indica que el zoom dado por parámetro
   * está en metros, en caso contrario como nivel de zoom. En el caso de
   * ser metros a mayor cantidad menor nivel de zoom. Por defecto, es falso.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setMaxZoom(zoomParam, inmeters = false) {
    if (isNullOrEmpty(zoomParam)) {
      Exception(getValue('exception').no_zoom);
    }

    if (isUndefined(MapImpl.prototype.setMaxZoom)) {
      Exception(getValue('exception').setzoom_method);
    }

    const maxZoom = parameter.maxZoom(zoomParam);
    this.userMaxZoom_ = maxZoom;
    this.getImpl().setMaxZoom(maxZoom, inmeters);
    return this;
  }

  /**
   * Este método proporciona el centro actual de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Array<Number>} Las coordenadas del centro del mapa.
   * @api
   */
  getCenter() {
    // checks if the implementation can get the center
    if (isUndefined(MapImpl.prototype.getCenter)) {
      Exception(getValue('exception').getcenter_method);
    }

    const center = this.getImpl().getCenter();

    return center;
  }

  /**
   * Este método establece el estado de zoomConstrains
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {Boolean} zoomConstrains Nuevo valor.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setZoomConstrains(zoomConstrains) {
    // checks if the param is null or empty
    if (isNullOrEmpty(zoomConstrains)) {
      Exception(getValue('exception').no_zoomConstrains);
    }

    if (isUndefined(MapImpl.prototype.setZoomConstrains)) {
      Exception(getValue('exception').setZoomConstrains_method);
    }

    try {
      const zoomCons = parameter.zoomConstrains(zoomConstrains);
      this.getImpl().setZoomConstrains(zoomCons);
    } catch (err) {
      Dialog.error(err.toString());
      throw err;
    }

    return this;
  }

  /**
   * Este método obtiene el estado actual de
   * zoomConstrains de la instancia del mapa.
   *
   * @public
   * @function
   * @returns {Boolean} Valor actual.
   * @api
   */
  getZoomConstrains() {
    if (isUndefined(MapImpl.prototype.getZoomConstrains)) {
      Exception(getValue('exception').getZoomConstrains_method);
    }

    const zoomConstrains = this.getImpl().getZoomConstrains();

    return zoomConstrains;
  }

  /**
   * Este método establece el estado de multiWorld
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {Boolean} multiWorld Nuevo valor.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setMultiWorld(multiWorld) {
    // checks if the param is null or empty
    if (isNullOrEmpty(multiWorld)) {
      Exception(getValue('exception').no_multiWorld);
    }

    if (isUndefined(MapImpl.prototype.setMultiWorld)) {
      Exception(getValue('exception').setMultiWorld_method);
    }

    try {
      const multiWorldParam = parameter.multiWorld(multiWorld);
      this.getImpl().setMultiWorld(multiWorldParam);
    } catch (err) {
      Dialog.error(err.toString());
      throw err;
    }

    return this;
  }

  /**
   * Este método obtiene el estado actual de
   * multiWorld de la instancia del mapa.
   *
   * @public
   * @function
   * @returns {Boolean} Valor actual.
   * @api
   */
  getMultiWorld() {
    if (isUndefined(MapImpl.prototype.getMultiWorld)) {
      Exception(getValue('exception').getMultiWorld_method);
    }

    const multiWorld = this.getImpl().getMultiWorld();

    return multiWorld;
  }

  /**
   * Este método establece el centro para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Array<String>|Array<Number>|Mx.Center} centerParam El nuevo centro.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setCenter(centerParam) {
    // checks if the param is null or empty
    if (isNullOrEmpty(centerParam)) {
      Exception(getValue('exception').no_center);
    }

    // checks if the implementation can set the center
    if (isUndefined(MapImpl.prototype.setCenter)) {
      Exception(getValue('exception').setcenter_method);
    }

    // parses the parameter
    // try {
    const center = parameter.center(centerParam);
    this.getImpl().setCenter(center);
    this.userCenter_ = center;
    if (center.draw === true) {
      this.drawLayer_.clear();

      this.centerFeature_ = new Feature('__apiideecenter__', {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [center.x, center.y],
        },
        properties: {
          vendor: {
            api_idee: { // TODO mig
              click: (evt) => {
                const label = this.getLabel();
                if (!isNullOrEmpty(label)) {
                  label.show(this);
                }
              },
            },
          },
        },
      });
      this.drawFeatures([this.centerFeature_]);
    }
    // }
    // catch (err) {
    //   Dialog.error(err.toString());
    //   throw err;
    // }

    return this;
  }

  /**
   * Este método devuelve el centro de un elemento geográfico.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @returns {Array<Number>} Centro de un elemento geográfico.
   * @function
   * @api
   */
  getFeatureCenter() {
    return this.centerFeature_;
  }

  /**
   * Este método elimina el centro del mapa.
   *
   * @public
   * @function
   * @api
   */
  removeCenter() {
    this.removeFeatures(this.centerFeature_);
    this.centerFeature_ = null;
    this.zoomToMaxExtent();
  }

  /**
   * Este método proporciona las resoluciones de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Array<Number>} Resoluciones de esta
   * instancia del mapa.
   * @api
   */
  getResolutions() {
    // checks if the implementation can set the maxExtent
    if (isUndefined(MapImpl.prototype.getResolutions)) {
      Exception(getValue('exception').getresolutions_method);
    }

    const resolutions = this.getImpl().getResolutions();

    return resolutions;
  }

  /**
   * Este obtiene el factor de escala para la resolución de
   * renderizado de esta instancia del mapa. Por defecto, 1.
   *
   * @public
   * @function
   * @returns {Number} LOD
   * @api
   */
  getLOD() {
    if (isUndefined(MapImpl.prototype.getLOD)) {
      Exception(getValue('exception').getlod_method);
    }

    const lod = this.getImpl().getLOD();

    return lod;
  }

  /**
   * Este método establece el factor de escala para la resolución
   * de renderizado para esta instancia del mapa. El valor debe
   * encontrarse entre 0 y 2. Si es menor o igual a 0 se establecerá
   * en 0.1 y si es mayor a 2 en 2. En caso de no indicarle
   * ningún valor se esablecerá a 1.
   *
   * @public
   * @function
   * @param {Number} lod LOD.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setLOD(lod) {
    // checks if the implementation can set the setLOD
    if (isUndefined(MapImpl.prototype.setLOD)) {
      Exception(getValue('exception').setlod_method);
    }

    this.getImpl().setLOD(lod);

    return this;
  }

  /**
   * Este método establece las resoluciones para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Array<String>|Array<Number>} resolutionsParam Las resoluciones.
   * @param {Boolean} optional Indica si las resoluciones son opcionales.
   * @param {Boolean} propagateToWMS Indica si las resoluciones se deben propagar a las capas WMS.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setResolutions(resolutionsParam, optional, propagateToWMS = true) {
    // checks if the param is null or empty
    // if (isNullOrEmpty(resolutionsParam)) {
    //   Exception(getValue('exception').no_resolutions);
    // }

    // checks if the implementation can set the setResolutions
    if (isUndefined(MapImpl.prototype.setResolutions)) {
      Exception(getValue('exception').setresolutions_method);
    }

    // parses the parameter
    const resolutions = parameter.resolutions(resolutionsParam);

    this.getImpl().setResolutions(resolutions, optional, propagateToWMS);

    return this;
  }

  /**
   * Este método proporciona la escala actual de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Mx.Projection} Escala de devolución.
   * @api
   */
  getScale() {
    // checks if the implementation has the method
    if (isUndefined(MapImpl.prototype.getScale)) {
      Exception(getValue('exception').getscale_method);
    }

    const scale = this.getImpl().getScale();

    return scale;
  }

  /**
   * Este método proporciona la escala actual de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Mx.Projection} Devuelve la escala.
   * @api
   */
  getExactScale() {
    // checks if the implementation has the method
    if (isUndefined(MapImpl.prototype.getExactScale)) {
      Exception('La implementación usada no posee el método getScale');
    }

    const scale = this.getImpl().getExactScale();

    return scale;
  }

  /**
   * Este método proporciona la proyección actual de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Mx.Projection} Devuelve la proyección.
   * @api
   */
  getProjection() {
    // checks if the implementation has the method
    if (isUndefined(MapImpl.prototype.getProjection)) {
      Exception(getValue('exception').getprojection_method);
    }

    const projection = this.getImpl().getProjection();

    return projection;
  }

  /**
   * Obtiene la proyección nativa de OpenLayers activa en el mapa.
   *
   * @public
   * @function
   * @returns {OLProjection} Instancia nativa de ol/proj/Projection.
   * @api
   */
  getNativeProjection() {
    if (isUndefined(MapImpl.prototype.getNativeProjection)) {
      Exception(getValue('exception').getprojection_method);
    }
    return this.getImpl().getNativeProjection();
  }

  /**
   * Este método establece la proyección para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Mx.Projection} projectionParam Proyección a aplicar al mapa.
   * @param {Boolean} asDefault Utiliza la proyección por defecto.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setProjection(projectionParam, asDefault) {
    let projection = projectionParam;
    // checks if the param is null or empty
    if (isNullOrEmpty(projection)) {
      Exception(getValue('exception').no_projection);
    }

    // checks if the implementation can set the projection
    if (isUndefined(MapImpl.prototype.setProjection)) {
      Exception(getValue('exception').setprojection_method);
    }

    // parses the parameter
    try {
      const oldProj = this.getProjection();
      projection = parameter.projection(projection);

      if (oldProj.code !== projection.code || asDefault === true) {
        if (oldProj.code !== projection.code) {
          this.userCenter_ = null;
        }
        this.getImpl().setProjection(projection);
        this._defaultProj = (this._defaultProj && (asDefault === true));
        this.fire(EventType.CHANGE_PROJ, [oldProj, projection]);
      }
    } catch (err) {
      Dialog.error(err.toString());
      if (String(err).indexOf('El formato del parámetro projection no es correcto') >= 0) {
        this.setProjection(IDEE.config.DEFAULT_PROJ, true);
      }
    }

    return this;
  }

  /**
   * Este método establece las restricciones de extensión para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {String|Object} extentConstrains Restricciones de extensión.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  setExtentConstrains(extentConstrains) {
    if (isNullOrEmpty(extentConstrains)) {
      Exception(getValue('exception').no_extentConstrains);
    }

    try {
      const extentCons = parameter.extentConstrains(extentConstrains);
      this.userExtentConstrains = extentCons;
    } catch (err) {
      Dialog.error(err.toString());
      throw err;
    }
    return this;
  }

  /**
   * Este método obtiene las restricciones de extensión para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {String|Object} Devuelve las restricciones de extensión.
   * @api
   */
  getExtentConstrains() {
    return this.userExtentConstrains;
  }

  /**
   * Este método devuelve todos los complementos agregados al mapa.
   *
   * @public
   * @function
   * @param {Mx.Plugin} namesParam Nombre del plugin.
   * @returns {Array<IDEE.Plugin>} Devuelve la colección de plugins.
   * @api
   */
  getPlugins(namesParam) {
    let names = namesParam;
    // parses parameters to Array
    if (isNull(names)) {
      names = [];
    } else if (!isArray(names)) {
      names = [names];
    }

    let plugins = [];

    // parse to Array
    if (names.length === 0) {
      plugins = this.plugins;
    } else {
      names.forEach((name) => {
        plugins = plugins.concat(this.plugins.filter((plugin) => {
          return (name === plugin.name);
        }));
      });
    }
    return plugins;
  }

  /**
   * Este método agrega una instancia de un especificado
   * complemento desarrollado.
   *
   * @public
   * @function
   * @param {Mx.Plugin} plugin Agrega los plugins al mapa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addPlugin(plugin) {
    // checks if the param is null or empty
    if (isNullOrEmpty(plugin)) {
      Exception(getValue('exception').no_plugins);
    }

    // checks if the plugin can be added to the map
    if (isUndefined(plugin.addTo)) {
      Exception(getValue('exception').no_add_plugin_to_map);
    }

    // checks if the plugin is already added to the map
    if (this.plugins.some((p) => p.name === plugin.name)) {
      Exception(getValue('exception').plugin_already_added);
    }

    try {
      plugin.addTo(this);
      this.plugins.push(plugin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }

    return this;
  }

  /**
   * @param {IDEE.Pugin | string} plugin a plugin or one plugin name
   * @returns {IDEE.Map}
   */
  removePlugin(plugin) {
    // checks if the param is null or empty
    if (isNullOrEmpty(plugin)) {
      Exception(getValue('exception').no_plugins);
    }

    // checks if the plugin can be removed from the map
    if (isUndefined(plugin.destroy)) {
      Exception(getValue('exception').no_remove_plugin_from_map);
    }

    try {
      plugin.destroy();
      this.plugins = this.plugins.filter((plugin2) => plugin2.name !== plugin.name);

      const positionPlugins = this.plugins
        .filter((plugin2) => plugin2.position === plugin.position);
      if (positionPlugins.length === 0) {
        this.closeSidePanels(plugin.position);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }

    return this;
  }

  /**
   * Este método agrega plugins.
   *
   * @public
   * @function
   * @param {Array<Plugin>} plugins  Plugins para añadir al mapa.
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  addPlugins(plugins) {
    // checks if the param is null or empty
    if (isNullOrEmpty(plugins)) {
      Exception(getValue('exception').no_plugins);
    }
    let allPlugins = plugins;
    if (!isArray(plugins)) {
      allPlugins = [plugins];
    }

    allPlugins.forEach((plugin) => {
      this.addPlugin(plugin);
    });

    return this;
  }

  /**
   * Este método elimina los complementos especificados del mapa.
   *
   * @function
   * @param {Array<Plugin>} plugins Especificado por el usuario.
   * @returns {Map} Devolver estado del mapa.
   * @api
   */
  removePlugins(pluginsParam) {
    let plugins = pluginsParam;
    if (!isArray(plugins)) {
      plugins = [plugins];
    }

    plugins = [].concat(plugins);
    plugins.forEach((plugin) => {
      this.removePlugin(plugin);
    });

    return this;
  }

  /**
   * Este método proporciona la promesa de un alcance envolvido de esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @returns {Promise} Devuelve la extensión máxima, asíncrono.
   * @api
   */
  getEnvolvedExtent() {
    return new Promise((resolve) => {
      const wmcLayer = this.getWMC().find((wmc) => wmc.selected);
      if (!isNullOrEmpty(wmcLayer)) {
        wmcLayer.getMaxExtent(resolve);
      } else {
        // 1 check the WMC extent
        const visibleBaseLayer = this.getBaseLayers().find((layer) => layer.isVisible());
        if (!isNullOrEmpty(visibleBaseLayer)) {
          resolve(visibleBaseLayer.getMaxExtent(resolve));
        } else {
          const layers = this.getLayers().filter((layer) => layer.name !== '__draw__');
          Promise.all(layers.map((layer) => layer.calculateMaxExtent()))
            .then((extents) => {
              const extentsToCalculate = isNullOrEmpty(extents)
                ? [this.getProjection().getExtent()]
                : extents;
              const envolvedMaxExtent = getEnvolvedExtent(extentsToCalculate);
              resolve(envolvedMaxExtent);
            });
        }
      }
    });
  }

  /**
   * Este método obtiene y amplía el mapa en el
   * extensión calculada.
   *
   * @public
   * @function
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  zoomToMaxExtent(keepUserZoom) {
    this.calculateMaxExtent().then((maxExtent) => {
      this.setBbox(maxExtent);
      if (keepUserZoom === true) {
        this.once(EventType.COMPLETED, () => {
          if (!isNullOrEmpty(this._userZoom)) {
            this.setZoom(this._userZoom);
          } else {
            this.setZoom(IDEE.config.DEFAULT_ZOOM);
          }
        });
      }
      this._finishedMaxExtent = true;
      this._checkCompleted();
    });
    return this;
  }

  /**
   * Este método agrega un ticket para controlar capas seguras.
   *
   * @public
   * @function
   * @param {String} ticket Ticket del usuario.
   * @api
   */
  setTicket(ticket) {
    this.ticket_ = ticket;
    IDEE.config.TICKET = ticket;

    // if (!isNullOrEmpty(ticket)) {
    //   if (IDEE.config.PROXY_POST_URL.indexOf('ticket=') === -1) {
    //     IDEE.config('PROXY_POST_URL', addParameters(IDEE.config.PROXY_POST_URL, { ticket }));
    //   }
    //   if (IDEE.config.PROXY_URL.indexOf('ticket=') === -1) {
    //     IDEE.config('PROXY_URL', addParameters(IDEE.config.PROXY_URL, { ticket }));
    //   }
    // }

    return this;
  }

  /**
   * Este método devuelve el ticket, si se ha establecido, para controlar capas seguras.
   *
   * @public
   * @function
   * @returns {String} Devuelve el ticket.
   * @api
   */
  getTicket() {
    if (!isNullOrEmpty(this.ticket_)) {
      return this.ticket_;
    }
    return IDEE.config.TICKET;
  }

  /**
   * Este método devuelve el centro inicial del mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @returns {Array<Number>} Devuelve el centro, asíncrono.
   * @api
   */
  getInitCenter_() {
    return new Promise((success, fail) => {
      this.calculateMaxExtent().then((extent) => {
        let center;
        if (isArray(extent)) {
          center = {
            x: ((extent[0] + extent[2]) / 2),
            y: ((extent[1] + extent[3]) / 2),
          };
        } else {
          center = {
            x: ((extent.x.max + extent.x.min) / 2),
            y: ((extent.y.max + extent.y.min) / 2),
          };
        }
        success(center);
      });
    });
  }

  /**
   * Este método elimina todas las capas del mapa.
   *
   * @public
   * @function
    * @api
   */
  removeAllLayers() {
    this.removeLayers(this.getLayers());
  }

  /**
   * Este método destruye el mapa, limpiando el HTML
   * y anular el registro de todos los eventos.
   *
   * @public
   * @function
   * @returns {Map} Devuelve el estado del mapa.
   * @api
   */
  destroy() {
    // checks if the implementation can provide the implementation map
    if (isUndefined(MapImpl.prototype.destroy)) {
      Exception(getValue('exception').destroy_method);
    }
    this.removeAllLayers();
    this.getImpl().destroy();

    const mapFrameContainer = this.getFrameContainer();
    if (mapFrameContainer.children.length > 0) {
      Array.from(mapFrameContainer.children).forEach((child) => child.remove());
    }

    return this;
  }

  /**
   * Añade la etiqueta. Es posible añadir multiples etiquetas a la vez.
   *
   * @function
   * @param {Label|Array<Label>} labelParam Estquetas o colecciones de etiquetas a añadir.
   * @param {Array} coordParam Array con las coordenadas de las etiquetas,
   * o conjunto de Arrays de coordenadas.
   * @param {boolean} removePrevious Opcional, indica si se eliminan o no las etiquetas anteriores.
   * Si se añaden multiples etiquetas y el valor no es false, solo añade la última etiqueta.
   * @api
   */
  addLabel(labelParam, coordParam, removePrevious = true) {
    // checks if the param is null or empty
    if (isNullOrEmpty(labelParam)) {
      Exception(getValue('exception').no_projection);
    }

    // checks if the implementation can add labels
    if (isUndefined(MapImpl.prototype.addLabel)) {
      Exception(getValue('exception').addlabel_method);
    }

    let text = null;
    let coord = null;

    let arrayLabel = labelParam;
    let arrayCoordinate = coordParam;

    if (!isArray(labelParam)) {
      arrayLabel = [labelParam];
    }

    if (!isUndefined(coordParam) && !isArray(coordParam[0])) {
      arrayCoordinate = [coordParam];
    } else if (isUndefined(coordParam)) {
      arrayCoordinate = [];
    }

    arrayLabel.forEach((element, index) => {
      const panMapIfOutOfView = element.panMapIfOutOfView === undefined
        ? true
        : labelParam.panMapIfOutOfView;

      // object
      if (isObject(element)) {
        text = escapeJSCode(element.text);
        coord = element.coord;
      } else {
        // string
        text = escapeJSCode(element);
        coord = arrayCoordinate[index];
      }

      if (isNullOrEmpty(coord)) {
        coord = this.getCenter();
      } else {
        if (isString(coord) && coord.indexOf('[' === -1)) {
          coord = coord.split(',');
        } else if (isString(coord[0])) {
          coord = coord[0].split(',');
        } else if (isObject(coord[0])) {
          coord = coord[0];
        }
        coord = parameter.center(coord);
      }

      if (isNullOrEmpty(coord)) {
        this.getInitCenter_().then((initCenter) => {
          const label = new Label(text, initCenter, panMapIfOutOfView);
          this.getImpl().addLabel(label, removePrevious);
        });
      } else {
        const label = new Label(text, coord, panMapIfOutOfView);
        this.getImpl().addLabel(label, removePrevious);
      }
    });

    return this;
  }

  /**
   * Devuelve la etiqueta.
   *
   * @function
   * @returns {Array<Label>} Devuelve las etiquetas.
   * @api
   */
  getLabel() {
    return this.getImpl().getLabel();
  }

  /**
   * Devuelve las etiquetas.
   *
   * @function
   * @returns {Array<Label>} Devuelve las etiquetas.
   * @api
   */
  getLabels() {
    return this.getImpl().getLabels();
  }

  /**
   * Elimina las etiquetas.
   *
   * @function
   * @param {label|Array<Label>} label Etiqueta o array de etiquetas a eliminar.
   * @returns {Array<object>} Devuelve las etiquetas.
   * @api
   */
  removeLabel(label) {
    return this.getImpl().removeLabel(label);
  }

  /**
   * Dibujar puntos.
   *
   * @function
   * @param {Array<Mx.Point>|Mx.Point} points Colección de puntos.
   * @api
   */
  drawPoints(pointsVar) {
    let points = pointsVar;
    // checks if the param is null or empty
    if (isNullOrEmpty(points)) {
      Exception(getValue('exception').no_point);
    }

    if (!isArray(points)) {
      points = [points];
    }

    const features = points.map((point) => {
      const gj = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.x, point.y],
        },
        properties: {},
      };
      if (isFunction(point.click)) {
        gj.properties.vendor = {
          api_idee: {
            click: point.click,
          },
        };
      }
      return new Feature(null, gj);
    });
    this.drawLayer_.addFeatures(features);
  }

  /**
   * Dibuja objetos geográficos.
   *
   * @function
   * @param {Array<Feature>|Feature} features Colección de objetos geográficos.
   * @api
   */
  drawFeatures(features) {
    this.drawLayer_.addFeatures(features);
    return this;
  }

  /**
   * Elimina los objetos geográficos.
   *
   * @function
   * @param {Array<Feature>|Feature} features Colección de objetos geográficos.
   * @api
   */
  removeFeatures(features) {
    this.drawLayer_.removeFeatures(features);
    return this;
  }

  addButtons(buttonsVar) {
    let buttons = buttonsVar;
    if (!isNullOrEmpty(buttons)) {
      if (!isArray(buttons)) {
        buttons = [buttons];
      }
      buttons.forEach((button) => {
        if (button instanceof OverviewMapButton && !this.buttons.includes(button)) {
          this.buttons.push(button);
          button.addTo(this);
        }
      });
    }
    return this;
  }

  /**
   * Elimina un botón del mapa.
   *
   * @function
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  removeButton(button) {
    if (button instanceof OverviewMapButton) {
      button.destroy();
      this.buttons = this.buttons.filter((buttonSaved) => !buttonSaved.equals(button));
    }

    return this;
  }

  /**
   * Añade los paneles.
   *
   * @function
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  addPanels(panelsVar) {
    let panels = panelsVar;
    if (!isNullOrEmpty(panels)) {
      if (!isArray(panels)) {
        panels = [panels];
      }
      panels.forEach((panel) => {
        const isIncluded = this.panels.some((panel2) => panel2.equals(panel));
        if ((panel instanceof Panel) && !isIncluded) {
          this.panels.push(panel);
          panel.addTo(this);
        }
      });
    }
    return this;
  }

  /**
   * Añade un panel que alberga un control en su interior
   *
   * @function
   * @param {ControlPanel | ControlPanel[]} controlPanelsVar
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  addControlPanels(controlPanelsVar) {
    if (!isNullOrEmpty(controlPanelsVar)) {
      (isArray(controlPanelsVar) ? controlPanelsVar : [controlPanelsVar])
        .filter((panel) => !this.panels.some((panel2) => panel2.equals(panel))
          && panel instanceof CollapsiblePanel)
        .forEach((panel) => {
          this.panels.push(panel);
          panel.addTo(this);
        });
    }
    return this;
  }

  /**
   * Elimina un panel del mapa.
   *
   * @function
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  removePanel(panel) {
    if (panel instanceof Panel) {
      panel.destroy();
      this.panels = this.panels.filter((panel2) => !panel2.equals(panel));
    }

    return this;
  }

  /**
   * Devuelve los paneles.
   *
   * @function
   * @api
   * @returns {array<Panel>} Colección de paneles.
   */
  getPanels(namesVar) {
    let names = namesVar;
    let panels = [];

    // parses parameters to Array
    if (isNullOrEmpty(names)) {
      panels = this.panels;
    } else {
      if (!isArray(names)) {
        names = [names];
      }
      names.forEach((name) => {
        const filteredPanels = this.panels.filter((panel) => panel.name === name);
        filteredPanels.forEach((panel) => {
          if (!isNullOrEmpty(panel)) {
            panels.push(panel);
          }
        });
      });
    }

    return panels;
  }

  /**
   * Crea paneles.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  createPanels(container) {
    this.minPanelWidth = 256;
    this.maxPanelWidth = 360;

    container.classList.add('m-api-idee-container');

    this.toolPanelsContainer = document.createElement('tool-panels-container');
    this.toolPanelsContainer.classList.add('m-api-idee-tool-panels-container');
    container.appendChild(this.toolPanelsContainer);

    /** THIS PANEL IS USED ONLY IN MOBILE VERSION */
    this.upPanel = document.createElement('m-api-idee-up-panel');
    this.upPanel.classList.add('m-api-idee-up-panel');
    this.toolPanelsContainer.appendChild(this.upPanel);

    this.upHandle = document.createElement('up-handle');
    this.upHandle.classList.add('m-api-idee-up-handle');
    this.upHandle.style.visibility = 'hidden';
    this.upPanel.appendChild(this.upHandle);

    this.leftPanel = document.createElement('left-panel');
    this.leftPanel.classList.add('m-api-idee-left-panel');
    this.toolPanelsContainer.appendChild(this.leftPanel);

    this.leftHandle = document.createElement('left-handle');
    this.leftHandle.classList.add('m-api-idee-left-handle');
    this.leftHandle.style.visibility = 'hidden';
    this.leftPanel.appendChild(this.leftHandle);

    this.leftButtons = document.createElement('left-buttons');
    this.leftButtons.classList.add('m-api-idee-left-buttons');
    this.toolPanelsContainer.appendChild(this.leftButtons);

    this.centerPanel = document.createElement('center-panel');
    this.centerPanel.classList.add('m-api-idee-center-panel');

    this.centerPanelTopLeft = document.createElement('center-panel-top-left');
    this.centerPanelTopLeft.classList.add('m-api-idee-center-panel-top-left');
    this.centerPanel.appendChild(this.centerPanelTopLeft);

    this.centerPanelTopRight = document.createElement('center-panel-top-right');
    this.centerPanelTopRight.classList.add('m-api-idee-center-panel-top-right');
    this.centerPanel.appendChild(this.centerPanelTopRight);

    this.centerPanelBottomLeft = document.createElement('center-panel-bottom-left');
    this.centerPanelBottomLeft.classList.add('m-api-idee-center-panel-bottom-left');
    this.centerPanel.appendChild(this.centerPanelBottomLeft);

    this.centerPanelBottomRight = document.createElement('center-panel-bottom-right');
    this.centerPanelBottomRight.classList.add('m-api-idee-center-panel-bottom-right');
    this.centerPanel.appendChild(this.centerPanelBottomRight);

    this.toolPanelsContainer.appendChild(this.centerPanel);

    this.mapPanel = document.createElement('map-panel');
    this.mapPanel.id = 'mapPanel';
    this.mapPanel.classList.add('m-api-idee-map-panel');
    container.appendChild(this.mapPanel);

    this.rightButtons = document.createElement('right-buttons');
    this.rightButtons.classList.add('m-api-idee-right-buttons');
    this.toolPanelsContainer.appendChild(this.rightButtons);

    this.rightPanel = document.createElement('right-panel');
    this.rightPanel.classList.add('m-api-idee-right-panel');
    this.toolPanelsContainer.appendChild(this.rightPanel);

    this.rightHandle = document.createElement('right-handle');
    this.rightHandle.classList.add('m-api-idee-right-handle');
    this.rightHandle.style.visibility = 'hidden';
    this.rightPanel.appendChild(this.rightHandle);

    this.downPanel = document.createElement('down-panel');
    this.downPanel.classList.add('m-api-idee-down-panel');
    this.toolPanelsContainer.appendChild(this.downPanel);

    this.isResizingUp = false;
    this.isResizingLeft = false;
    this.isResizingRight = false;

    this.leftHandle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.toolPanelsContainer.classList.add('is-resizing');
      this.isResizingLeft = true;
      document.body.style.userSelect = 'none';
    });

    this.rightHandle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.toolPanelsContainer.classList.add('is-resizing');
      this.isResizingRight = true;
      document.body.style.userSelect = 'none';
    });

    this.upHandle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.toolPanelsContainer.classList.add('is-resizing');
      this.isResizingUp = true;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mouseup', () => {
      this.toolPanelsContainer.classList.remove('is-resizing');
      this.isResizingLeft = false;
      this.isResizingRight = false;
      this.isResizingUp = false;

      document.body.style.userSelect = 'auto';
    });

    document.addEventListener('mousemove', (event) => {
      const containerRect = container.getBoundingClientRect();

      if (this.isResizingLeft) {
        let newWidth = event.clientX - containerRect.left;
        newWidth = Math.min(Math.max(newWidth, this.minPanelWidth), this.maxPanelWidth);
        this.toolPanelsContainer.style.setProperty('--left-width', `${newWidth}px`);
      } else if (this.isResizingRight) {
        let newWidth = containerRect.right - event.clientX;
        newWidth = Math.min(Math.max(newWidth, this.minPanelWidth), this.maxPanelWidth);
        this.toolPanelsContainer.style.setProperty('--right-width', `${newWidth}px`);
      } else if (this.isResizingUp) {
        let newHeight = event.clientY - containerRect.top;
        newHeight = Math.min(
          Math.max(newHeight, this.minUpPanelHeight),
          this.maxUpPanelHeight,
        );
        this.toolPanelsContainer.style.setProperty('--up-height', `${newHeight}px`);
      }
    });

    this.mapFrameContainer_ = container;
  }

  /**
   * @param {HTMLElement} mapPanel represents one avaliable tool panel to add content
   * @param {Panel} panel
   */
  addPanelToPanelContainer(mapPanel, panel) {
    mapPanel.appendChild(panel.element);
  }

  /**
   * This method open one lateral panel, if is possible depending on the map view.
   * In compact mode, it will open a top panel.
   *
   * @param {Panel} panel a panel used by plugins
   */
  openSidePanel(panel) {
    if (this.isCompactMode()) {
      [
        [this.leftPanel, this.leftHandle, '--left-width'],
        [this.rightPanel, this.rightHandle, '--right-width'],
      ].forEach(([lateralPanel, handle, cssVar]) => {
        this.closeLateralPanel_(lateralPanel, handle, cssVar);
      });
      this.openPanelCompactMode(panel);
    } else {
      const { minWidth, maxWidth, position } = panel;
      let sidePanel; let handle;
      let panelWidth;
      if (position === Position.LEFT) {
        sidePanel = this.leftPanel;
        handle = this.leftHandle;
        panelWidth = '--left-width';
      } else if (position === Position.RIGHT) {
        sidePanel = this.rightPanel;
        handle = this.rightHandle;
        panelWidth = '--right-width';
      }

      this.minPanelWidth = 256;
      this.maxPanelWidth = 608;

      if (minWidth >= this.minPanelWidth && minWidth <= this.maxPanelWidth) {
        this.minPanelWidth = minWidth;
      }

      if (maxWidth >= this.minPanelWidth && maxWidth <= this.maxPanelWidth) {
        this.maxPanelWidth = maxWidth;
      }

      this.openPanelWidth = sidePanel.offsetWidth;
      if (this.openPanelWidth < this.minPanelWidth) {
        this.openPanelWidth = this.minPanelWidth;
      }
      if (this.openPanelWidth > this.maxPanelWidth) {
        this.openPanelWidth = this.maxPanelWidth;
      }

      this.addPanelToPanelContainer(sidePanel, panel);
      handle.style.visibility = 'visible';
      this.toolPanelsContainer.style.setProperty(panelWidth, `${this.openPanelWidth}px`);
    }
  }

  /**
   * Closes a side panel if it is open, hiding its handle and clearing its content.
   * - ⚠️ Warning: This method should not be called by the user.
   * @private
   * @function
   * @param {HTMLElement} panel Side panel element.
   * @param {HTMLElement} handle Associated handle element.
   * @param {string} cssVar CSS variable that controls the panel's width.
   */
  closeLateralPanel_(panel, handle, cssVar) {
    const currentWidth = this.toolPanelsContainer.style.getPropertyValue(cssVar);
    if (currentWidth && currentWidth !== '0px') {
      this.toolPanelsContainer.style.setProperty(cssVar, '0px');
      handle.style.visibility = 'hidden'; // eslint-disable-line no-param-reassign
      Array.from(panel.children).forEach((child) => {
        if (child !== handle) panel.removeChild(child);
      });
    }
  }

  /**
   * Closes all side active panels.
   *
   * @param {string} position Map position (Position.LEFT/RIGHT/DOWN/etc.)
   */
  closeSidePanels(position) {
    const panelElementsList = [];
    const isCompact = this.isCompactMode();
    const upPanelElements = [this.upPanel, this.upHandle, '--up-height'];
    const leftPanelElements = [this.leftPanel, this.leftHandle, '--left-width'];
    const rightPanelElements = [this.rightPanel, this.rightHandle, '--right-width'];
    panelElementsList.push(upPanelElements);
    if (isCompact) {
      panelElementsList.push(leftPanelElements);
      panelElementsList.push(rightPanelElements);
    } else if (position === Position.LEFT) {
      panelElementsList.push(leftPanelElements);
    } else if (position === Position.RIGHT) {
      panelElementsList.push(rightPanelElements);
    }
    panelElementsList.forEach(([panel, handle, gridSizeVar]) => {
      this.closeLateralPanel_(panel, handle, gridSizeVar);
    });
  }

  /**
   * This method deactivate all side active panel buttons except the one that is going to be open,
   * if is possible depending on the map view.
   *
   * @param {OverviewMapButton} button represents one avaliable button to open a side panel
   */
  deactivateSidePanelButtons(button) {
    const isCompact = this.isCompactMode();
    /** @type {OverviewMapButton[]} */
    let buttons = this.buttons ?? [];

    // Cuando el mapa cambia de tamaño teniendo todavía el panel superior abierto, debemos apagarlo
    const isUpPanelOpened = (() => {
      const v = this.toolPanelsContainer.style.getPropertyValue('--up-height');
      return v !== '' && v !== '0px';
    })();

    if (isCompact || isUpPanelOpened) {
      buttons = buttons.filter((mapButton) => !mapButton.equals(button));
    } else {
      buttons = buttons.filter(
        (mapButton) => !mapButton.equals(button) && mapButton.position === button.position,
      );
    }

    buttons.forEach((mapButton) => {
      mapButton.deactivate();
    });
  }

  /**
   * @param {HTMLElement} container
   * @returns {Boolean} indicates whether the parent map container
   * has a movable view size, ("compact")
   */
  isCompactMode() {
    return this.toolPanelsContainer.clientWidth <= 600;
  }

  /**
   * Opens one Panel in compact "mobile view"
   *
   * @param {Panel} panel a panel used by plugins
   */
  openPanelCompactMode(panel) {
    const {
      minHeightCompact = 250,
      maxHeightCompact = this.toolPanelsContainer.clientHeight * 0.6 < 450
        ? 550 : this.toolPanelsContainer.clientHeight * 0.6,
    } = panel;

    this.minUpPanelHeight = this.toolPanelsContainer.clientHeight * 0.25;
    this.maxUpPanelHeight = this.toolPanelsContainer.clientHeight * 0.6;

    if (minHeightCompact >= this.minUpPanelHeight && minHeightCompact <= this.maxUpPanelHeight) {
      this.minUpPanelHeight = minHeightCompact;
    }

    if (maxHeightCompact >= this.minUpPanelHeight && maxHeightCompact <= this.maxUpPanelHeight) {
      this.maxUpPanelHeight = maxHeightCompact;
    }

    this.openUpPanelHeight = this.upPanel.offsetWidth;
    if (this.openUpPanelHeight < this.minUpPanelHeight) {
      this.openUpPanelHeight = this.minUpPanelHeight;
    }
    if (this.openUpPanelHeight > this.maxUpPanelHeight) {
      this.openUpPanelHeight = this.maxUpPanelHeight;
    }

    this.addPanelToPanelContainer(this.upPanel, panel);
    this.upHandle.style.visibility = 'visible';
    this.toolPanelsContainer.style.setProperty('--up-height', `${this.openUpPanelHeight}px`);
  }

  /**
   * Este método devuelve el contenedor del marco del mapa.
   *
   * @function
   * @api
   * @returns {Object} Devuelve el contenedor.
   */
  getFrameContainer() {
    return this.mapFrameContainer_;
  }

  /**
   * Este método proporciona el contenedor.
   *
   * @function
   * @api
   * @returns {Object} Devuelve el contenedor.
   */
  getContainer() { // checks if the implementation can provides the container
    if (isUndefined(MapImpl.prototype.getContainer)) {
      Exception(getValue('exception').getcontainer_method);
    }
    return this.getImpl().getContainer();
  }

  /**
   * Este método proporciona la implementación el mapa.
   *
   * @function
   * @api
   * @returns {Object} Implementación el mapa.
   */
  getMapImpl() {
    // checks if the implementation can add points
    if (isUndefined(MapImpl.prototype.getMapImpl)) {
      Exception(getValue('exception').getmapimpl_method);
    }
    return this.getImpl().getMapImpl();
  }

  /**
   * Devuelve "Popup", en caso de existir más de un popup en el mapa devolverá el primero añadido.
   *
   * @function
   * @api
   * @returns {Popup} Devuelve "Popup". Si hay más de uno,devolverá el primero añadido en el mapa.
   */
  getPopup() {
    let value = null;
    if (this.popup_.length === 0) {
      value = null;
    } else {
      value = this.popup_[0];
    }
    return value;
  }

  /**
   * Devuelve todos los "popup" añadidos al mapa.
   *
   * @function
   * @api
   * @returns {Array<Popup>} Devuelve todos los "popup".
   */
  getPopups() {
    let value = null;
    if (this.popup_.length === 0) {
      value = null;
    } else if (this.popup_.length >= 1) {
      value = this.popup_;
    }
    return value;
  }

  /**
   * Elimina "Popup". Es posible eliminar multiples a la vez.
   *
   * @function
   * @param {popup|Array<Popup>} popup "Popup" o array de "popup" a eliminar.
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  removePopup(popup) {
    // checks if the implementation can add popups
    if (isUndefined(MapImpl.prototype.removePopup)) {
      Exception(getValue('exception').removepopup_method);
    }

    if (isNullOrEmpty(popup)) {
      this.popup_.forEach((elm) => {
        this.getImpl().removePopup(elm);
        elm.destroy();
      });
      this.popup_ = [];
    } else if (isArray(popup)) {
      for (let i = popup.length - 1; i >= 0; i -= 1) {
        const elm = popup[i];
        const find = this.popup_.findIndex((element) => element.getId() === elm.getId());
        this.getImpl().removePopup(this.popup_[find]);
        this.popup_[find].destroy();
        this.popup_.splice(find, 1);
      }
    } else {
      this.getImpl().removePopup(popup);
      popup.destroy();
      this.popup_.forEach((elm, index) => {
        if (elm.getId() === popup.getId()) {
          this.popup_.splice(index, 1);
        }
      });
    }
    return this;
  }

  /**
   * Añade el "Popup". Es posible añadir multiples "Popup" a la vez.
   *
   * @function
   * @param {popup|Array<Popup>} popup "Popup" o array de "Popup" a añadir.
   * @param {Array} coordinate Array con las coordenadas del popup,
   * o conjunto de Arrays de coordenadas.
   * @param {boolean} removePrevious Opcional, indica si se eliminan o no los popups anteriores.
   * Si se añaden multiples popups y el valor no es false, solo añade el último popup.
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  addPopup(popup, coordinate, removePrevious = true) {
    // checks if the param is null or empty
    if (isNullOrEmpty(popup)) {
      Exception(getValue('exception').no_popup);
    }

    let arrayPopup = popup;
    let arrayCoordinate = coordinate;

    if (!isArray(popup)) {
      arrayPopup = [popup];
    }

    if (!isArray(coordinate[0])) {
      arrayCoordinate = [coordinate];
    }

    arrayPopup.forEach((popupAux, index) => {
      if (removePrevious) {
        this.removePopup(this.popup_);
        this.popup_ = [];
      }
      this.popup_.push(popupAux);
      popupAux.addTo(this, arrayCoordinate[index]);
    });

    return this;
  }

  /**
   * Evento, compruebe que el mapa está cargado.
   *
   * @public
   * @function
   */
  _checkCompleted() {
    if (this._finishedInitCenter && this._finishedMaxExtent && this._finishedMapImpl) {
      this._finishedMap = true;
      this.fire(EventType.COMPLETED);
    }
  }

  /**
   * Establece la devolución de llamada cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {IDEE.evt} eventType Tipo de evento.
   * @param {Function} listener "Callback".
   * @param {Object} optThis Opciones de la instancia del mapa.
   * @api
   */
  on(eventType, listener, optThis) {
    const idEvent = super.on(eventType, listener, optThis);
    if ((eventType === EventType.COMPLETED) && (this._finishedMap === true)) {
      this.fire(EventType.COMPLETED);
    }
    return idEvent;
  }

  /**
   * Establece la devolución de llamada cuando se carga la instancia.
   *
   * @public
   * @function
   * @param {IDEE.evt} eventType Tipo de evento.
   * @param {Function} listener "Callback".
   * @param {Object} optThis Opciones de la instancia del mapa.
   * @api
   */
  once(eventType, listener, optThis) {
    super.once(eventType, listener, optThis);
    if ((eventType === EventType.COMPLETED) && (this._finishedMap === true)) {
      this.fire(EventType.COMPLETED);
    }
  }

  /**
   * Método para añadir las atribuciones de las capas.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api
   */
  evtSetAttributions_() {
    // getAttributions
    this.on(EventType.ADDED_LAYER, (layersEvt) => {
      const control = this.getControls().some((c) => c.name === 'attributions');
      if (!control) { return; }

      let layers = layersEvt;
      if (!Array.isArray(layers)) {
        layers = [layers];
      }
      layers.forEach((layer) => {
        if (layer.attribution && layers.name !== '__draw__') {
          const attribuccion = layer.attribution;

          if (typeof attribuccion !== 'string' && !attribuccion.name) {
            attribuccion.name = layer.name;
          }

          this.addAttribution(attribuccion, false, layer.idLayer);
        }
      });
    });
  }

  /**
   * Método para eliminar las atribuciones de las capas.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @api
   */
  evtRemoveAttributions_() {
    this.on(EventType.REMOVED_LAYER, (layersEvt) => {
      const controlAttributions = this.getControls().find(({ name }) => name === Attributions.NAME);

      if (!layersEvt || !controlAttributions) {
        return;
      }

      let layers = layersEvt;

      if (!Array.isArray(layersEvt)) {
        layers = [layersEvt];
      }

      layers.forEach(({ attribution, name }) => {
        if (name === '__draw__') {
          return;
        }
        if (/<[a-z][\s\S]*>/i.test(attribution)) {
          // eslint-disable-next-line no-underscore-dangle
          const removeAttr = controlAttributions
            .collectionsAttributions_.filter((attr) => attr.attribuccion === attribution);
          if (removeAttr.length > 0) {
            this.removeAttribution(removeAttr[0].id);
          }
        } else if (attribution) {
          this.removeAttribution(attribution.id);
        }
      });
    });
  }

  /**
   * Esta función actualiza el estado de la instancia del mapa.
   *
   * @function
   * @api
   * @returns {Map} Devuelve el estado del mapa.
   */
  refresh() {
    // checks if the implementation has refresh method
    if (!isUndefined(this.getImpl().refresh) && isFunction(this.getImpl().refresh)) {
      this.getImpl().refresh();
    }
    this.getLayers().forEach((layer) => layer.refresh());
    return this;
  }

  /**
   * Devuelve la proyección por defecto.
   * @public
   * @function
   * @returns {Mx.Projection} Proyección por defecto.
   * @api
   */
  get defaultProj() {
    return this._defaultProj;
  }

  /**
   * Ordenar capas por zindex.
   * @public
   * @function
   * @param {IDEE.layer} layer1 Capa.
   * @param {IDEE.layer} layer2 Otra Capa.
   * @api
   */
  static LAYER_SORT(layer1, layer2, thisClass) {
    if (!isNullOrEmpty(layer1) && !isNullOrEmpty(layer2)) {
      const z1 = layer1.getZIndex();
      const z2 = layer2.getZIndex();
      const zIndex = (z1 - z2);
      if (zIndex === 0 && !isUndefined(thisClass)) {
        // eslint-disable-next-line no-underscore-dangle
        const i1 = thisClass.getImpl().layers_
          .findIndex((element) => element.idLayer === layer1.idLayer);
        // eslint-disable-next-line no-underscore-dangle
        const i2 = thisClass.getImpl().layers_
          .findIndex((element) => element.idLayer === layer2.idLayer);
        return i1 - i2;
      }
      return zIndex;
    }

    // equals
    return 0;
  }

  /**
   * Este método devuelve verdadero si el mapa y su implementación están completos.
   * @public
   * @returns {bool} Verdadero si termino.
   */
  isFinished() {
    return this._finishedMap;
  }

  /**
   * Establece los niveles de zoom del mapa aplicando las resoluciones correspondientes.
   *
   * @function
   * @public
   * @api
   * @param {Number} zoomLevels Niveles de zoom.
   */
  setZoomLevels(zoomLevels) {
    if (!isUndefined(zoomLevels) && !isNullOrEmpty(zoomLevels)) {
      this.calculateMaxExtent().then((extent) => {
        const zoom = this.getZoom();
        const size = this.getMapImpl().getSize();
        const units = this.getProjection().units;
        const resolutions = generateResolutionsFromExtent(extent, size, zoomLevels, units);
        this.setResolutions(resolutions, true);
        IDEE.config.ZOOM_LEVELS = zoomLevels;
        if (zoom < zoomLevels) {
          this.setZoom(zoom);
        }
      }).catch((error) => {
        throw error;
      });
    }
  }

  /**
   * Este método aplica un color al fondo del mapa
   *
   * @function
   * @public
   * @param {String} color Color para aplicar en el fondo del mapa
   */
  setBGColorContainer(color) {
    if (!isNullOrEmpty(color)) {
      const containerStyle = this.mapPanel.style;
      containerStyle.backgroundColor = color;
      containerStyle.backgroundImage = 'unset';
    }
  }

  /**
   * Este método devuelve el color del fondo del mapa
   *
   * @public
   * @returns {String} Devuelve el color del fondo del mapa
   */
  getBGColorContainer() {
    return this.mapPanel.style.backgroundColor;
  }

  /**
   * Devuelve las areas del contenedor.
   * @public
   * @returns {IDEE.map.areaContainer} Devuelve las areas del contenedor.
   */
  get areasContainer() {
    return this._areasContainer;
  }

  /**
   * Función que devuelve la rotación del mapa.
   *
   * @function
   * @public
   * @api
   * @return {number} Devuelve la rotación del mapa.
   */
  getRotation() {
    if (isUndefined(MapImpl.prototype.getRotation)) {
      Exception(getValue('exception').no_get_rotation_method);
    }
    return (this.getImpl().getRotation()) * (180 / Math.PI);
  }

  /**
   * Función que modifica la rotación del mapa.
   *
   * @function
   * @public
   * @api
   * @param {number} rotation Valor que indica cuanto va a rotar el mapa.
   */
  setRotation(rotation) {
    if (isUndefined(MapImpl.prototype.setRotation)) {
      Exception(getValue('exception').no_set_rotation_method);
    }
    this.getImpl().setRotation(rotation * (Math.PI / 180));
  }

  /**
   * Este método establece la escala más cercana para esta
   * instancia del mapa.
   *
   * @public
   * @function
   * @param {Number} scale Escala.
   * @api
   */
  setToClosestScale(scale) {
    const resolution = getResolutionFromScale(scale, this.getProjection().units);
    this.getImpl().setToClosestScale(resolution);
  }

  /**
   * Función que obtiene el nombre de la implementación del mapa.
   *
   * @function
   * @public
   * @api
   * @return {string} Devuelve el nombre de la implementación.
   */
  getImplementation() {
    return this.getImpl().getImplementation();
  }

  /**
   * Este método devuelve una captura de pantalla del mapa.
   *
   * @function
   * @public
   * @param {IDEE.Map} map Mapa del que se obtiene el canvas.
   * @param {String} type Formato de la imagen resultante.
   * @param {HTMLCanvasElement} canva Elemento canvas.
   * @param {Boolean} isPromise Si tiene que devolver una promesa (MapLibre).
   * @api
   * @returns {String} Imagen en base64
   */
  getImageMap(type = 'image/jpeg', canva = undefined, isPromise = false) {
    return getImageMap(this, type, canva, isPromise);
  }

  /**
   * Este método controla si la interacción de zoom con la rueda del ratón está activa o no.
   * El valor por defecto es true
   *
   * @function
   * @public
   * @api
   * @param {Boolean} active determina si se activa o desactiva el zoom.
   */
  enableMouseWheel(active) {
    this.getImpl().enableMouseWheel(active);
  }

  /**
   * Método que devuelve las capas superpuestas añadidas al mapa.
   *
   * @function
   * @public
   * @returns {Array<IDEE.Layers>} capas superpuestas.
   * @api
   */
  getOverlayLayers() {
    const layers = this.getLayers().filter((layer) => layer.name !== '__draw__' && layer.isBase === false);
    return layers;
  }

  /**
   * Método que elimina todas las capas superpuestas añadidas al mapa.
   *
   * @function
   * @public
   * @returns {IDEE.Map} mapa
   * @api
   */
  removeOverlayLayers() {
    const layers = this.getOverlayLayers();
    this.removeLayers(layers);
    return this;
  }

  /**
   * Este método añade una interacción de OpenLayers al mapa.
   *
   * @function
   * @param {ol.interaction.Interaction} interaction Interacción a añadir.
   * @returns {IDEE.Map} Mapa.
   * @public
   * @api
  */
  addInteraction(interaction) {
    if (isUndefined(MapImpl.prototype.addInteraction)) {
      Exception(getValue('exception').addinteraction_method);
    }
    this.getImpl().addInteraction(interaction);
    return this;
  }

  /**
   * Este método elimina una interacción de OpenLayers del mapa.
   *
   * @function
   * @param {ol.interaction.Interaction} interaction Interacción a eliminar.
   * @returns {IDEE.Map} Mapa.
   * @public
   * @api
  */
  removeInteraction(interaction) {
    if (isUndefined(MapImpl.prototype.removeInteraction)) {
      Exception(getValue('exception').removeinteraction_method);
    }
    this.getImpl().removeInteraction(interaction);
    return this;
  }

  /**
   * Este método permite activar o desactivar la interacción de panneo.
   * El valor por defecto es true.
   *
   * @function
   * @param {Boolean} active determina si se activa o desactiva el panneo.
   * @public
   * @api
   */
  enablePan(active) {
    this.getImpl().enablePan(active);
  }

  /**
   * Este método permite activar o desactivar la interacción de panneo.
   * El valor por defecto es true.
   *
   * @function
   * @param {Boolean} active determina si se activa o desactiva el panneo.
   * @public
   * @api
   * @deprecated
   */
  enableDrag(active) {
    // eslint-disable-next-line no-console
    console.warn(getValue('exception').enableDrag_deprecated);
    this.enablePan(active);
  }
}

/**
 * Opciones de estilo de capa.
 *
 * @const
 * @type {object}
 * @public
 * @api
 */
Map.DRAWLAYER_STYLE = {
  point: {
    fill: {
      color: '#009e00',
    },
    stroke: {
      color: '#fcfcfc',
      width: 2,
    },
    radius: 7,
  },
};

export default Map;
