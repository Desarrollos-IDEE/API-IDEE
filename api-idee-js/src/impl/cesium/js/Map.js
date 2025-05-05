/**
 * @module IDEE/impl/Map
 */
/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */
import MObject from 'IDEE/Object';
import { get as getRemote } from 'IDEE/util/Remote';
import {
  isNullOrEmpty,
  includes,
  isArray,
  isObject,
  isString,
  isUndefined,
  getWMSGetCapabilitiesUrl,
  getWMTSGetCapabilitiesUrl,
} from 'IDEE/util/Utils';
import { FOCAL } from 'IDEE/units';
import * as LayerType from 'IDEE/layer/Type';
import Control from 'IDEE/control/Control';
import FacadeWMS from 'IDEE/layer/WMS';
import Exception from 'IDEE/exception/exception';
import * as EventType from 'IDEE/event/eventtype';
import FacadeMap from 'IDEE/Map';
import LayerBase from 'IDEE/layer/Layer';
import {
  getValue,
} from 'IDEE/i18n/language';
import 'impl-assets/css/custom';
import 'impl-assets/css/widgets';
import {
  Rectangle,
  Viewer,
  Math as CesiumMath,
  Cartographic,
  Cartesian3,
  GeographicProjection,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  buildModuleUrl,
  CameraEventType,
  ImageryLayer,
  CustomDataSource,
  GeoJsonDataSource,
  Cesium3DTileset,
  KmlDataSource,
  Ion,
} from 'cesium';
import GetCapabilities from './util/WMSCapabilities';
import FormatWMS from './format/WMS';
import CesiumFormatWMTSCapabilities from './format/CesiumWMTSCapabilities';

/**
 * @classdesc
 * Esta clase crea un mapa con un contenedor "div" específico
 *
 * @property {IDEE.Map} facadeMap_ Fachada del mapa a implementar.
 * @property {IDEE.Layer} layers_ Capas añadidas al mapa.
 * @property {Array<IDEE.Control>} controls_ Controles añadidos al mapa.
 * @property {Boolean} initZoom_ Indica si el zoom inicial fue calculado. Por defecto verdadero.
 * @property {Array<Number>} userResolutions_ Resoluciones asociadas a cada nivel
 * de zoom especificadas por el usuario.
 * @property {Mx.Extent} userBbox_ Encuadre de visualización del mapa especificado por el usuario.
 * @property {Mx.Extent} maxExtentForResolutions_ Máxima extensión permitida
 * especificada por el usuario.
 * @property {Mx.Extent} envolvedMaxExtent_ Extensión máxima envolvente calculada.
 * @property {Boolean} _calculatedResolutions Indica si las resoluciones fueron calculadas.
 * Por defecto falso.
 * @property {Boolean} _resolutionsEnvolvedExtent Indica si las resoluciones de las
 * extensión máxima envolvente
 * fueron calculadas. Por defecto falso.
 * @property {Boolean} _resolutionsBaseLayer Indica si las resoluciones fueron
 * calculadas para las capas base.
 * Por defecto falso.
 * @property {Viewer} map_ Implementación del mapa.
 * @property {Number} currentZoom Almacena el zoom del mapa.
 * @property {Object} objectView Almacena las propiedades indicadas por el usuario para la vista.
 * @property {Number} verticalExaggeration Almacena el valor del parámetro verticalExaggeration
 * indicado por el usuario.
 *
 * @api
 * @extends {IDEE.Object}
 */
class Map extends MObject {
  /**
   * Constructor principal de la clase. Crea un mapa con un
   * contenedor "div" específico.
   *
   * @constructor
   * @param {Object} div Elemento "div" proporcionado por el usuario.
   * @param {IDEE.Map} facadeMap Fachada del mapa a implementar.
   * @param {Mx.parameters.MapOptions} options Opciones del mapa.
   * - zoom: Nivel de zoom inicial del mapa.
   * - bbox: Encuadre de visualización del mapa.
   * - maxExtent: Máxima extensión permitida; a diferencia del bbox,
   * no se dibujará el mapa fuera de los límites
   * establecidos.
   * - center: Punto central del mapa.
   * - label: "Popup" con el texto indicado en una coordenada especificada o,
   * en su defecto, en el centro (center)
   * establecido del mapa.
   * - verticalExaggeration: Exageración vertical de la escena. Si se establece a 1 no se aplica
   * exageración. Por defecto, 1.
   * - LOD: Nivel de precisión para la resolución de renderizado. Si no se indica se utiliza la
   * resolución recomendada del navegador.
   * @param {object} viewVendorOptions Parámetros para la vista del mapa de la librería base.
   * @api
   */
  constructor(div, facadeMap, options = {}, viewVendorOptions = {}) {
    buildModuleUrl.setBaseUrl(`${IDEE.config.API_IDEE_URL}/cesium/`);
    Ion.defaultAccessToken = '';

    super();
    /**
     * Fachada del mapa a implementar.
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = facadeMap;

    /**
     * Capas añadidas al mapa.
     * @private
     * @type {Array<IDEE.Layer>}
     */
    this.layers_ = [];

    /**
     * Grupos añadidos al mapa.
     * @private
     * @type {Array<IDEE.layer.Group>}
     */
    this.layerGroups_ = [];

    /**
     * Controles añadidos al mapa.
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Indica si el zoom inicial fue calculado. Por defecto verdadero.
     * @private
     * @type {Boolean}
     */
    this.initZoom_ = true;

    /**
     * Resoluciones asociadas a cada nivel de zoom especificadas por el usuario.
     * @private
     * @type {Array<Number>}
     */
    this.userResolutions_ = null;

    /**
     * Encuadre de visualización del mapa especificado por el usuario.
     * @private
     * @type {Mx.Extent}
     */
    this.userBbox_ = null;

    /**
     * Máxima extensión permitida especificada por el usuario.
     * @private
     * @type {Mx.Extent}
     */
    this.maxExtentForResolutions_ = null;

    /**
     * Extensión máxima envolvente calculada.
     * @private
     * @type {Mx.Extent}
     */
    this.envolvedMaxExtent_ = null;

    /**
     * Indica si las resoluciones fueron calculadas.
     * Por defecto falso.
     * @private
     * @type {Boolean}
     */
    this._calculatedResolutions = false;

    /**
     * Indica si las resoluciones fueron calculadas para la extensión máxima envolvente.
     * Por defecto falso.
     * @private
     * @type {Boolean}
     */
    this._resolutionsEnvolvedExtent = false;

    /**
     * Indica si las resoluciones fueron calculadas para las capas base.
     * Por defecto falso.
     * @private
     * @type {Boolean}
     */
    this._resolutionsBaseLayer = false;

    /**
     * Almacena el zoom del mapa.
     * @api
     * @type {Number}
     */
    this.currentZoom = null;

    /**
     * Extent restringido de navegación para el mapa.
     * @api
     * @type {Mx.Extent}
     */
    this.viewExtent = options.viewExtent;

    /**
     * Exageración vertical de la escena. Si se establece
     * en 1.0, no se aplica ninguna exageración.
     * @api
     * @type {Number}
     */
    this.verticalExaggeration = options.verticalExaggeration || 1;

    /**
     * Opciones del mapa
     * @private
     * @type {Mx.parameters.MapOptions}
     */
    this.options_ = options;

    /**
     * Nivel de precisión para la resolución de
     * renderizado.
     * @api
     * @type {Number}
     */
    this.LOD = options.LOD || null;

    /**
     * Tipo de capas vectoriales (desconocidas).
     * @private
     * @type {Array<String>}
     */
    this.vectorialLayers_ = [
      LayerType.Vector,
      LayerType.GeoJSON,
      LayerType.GenericVector,
    ];

    const mapProjection = new GeographicProjection();

    /**
     * Implementación del mapa.
     * @private
     * @type {cesium.Map}
     */
    this.map_ = new Viewer(div, {
      animation: false,
      fullscreenButton: false,
      vrButton: false,
      homeButton: false,
      selectionIndicator: false,
      skyBox: false,
      ...viewVendorOptions,
      baseLayerPicker: false,
      geocoder: false,
      infoBox: false,
      sceneModePicker: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      scene3DOnly: false,
      shouldAnimate: false,
      baseLayer: false,
      mapProjection,
    });

    this.map_.scene.verticalExaggeration = this.verticalExaggeration;

    if (!isNullOrEmpty(this.LOD)) {
      this.setLOD(this.LOD);
    }

    this.registerEvents_();

    this.facadeMap_.on(EventType.COMPLETED, () => {
      if (this.viewExtent !== undefined && this.viewExtent.length === 4) {
        this.setMaxExtent(this.viewExtent, true);
      }
      this.map_.resize();
    });

    // singleclick
    const handlerClick = new ScreenSpaceEventHandler(this.map_.scene.canvas);
    handlerClick.setInputAction(this.onMapClick_.bind(this), ScreenSpaceEventType.LEFT_CLICK);

    // pointermove
    const handlerMouseMove = new ScreenSpaceEventHandler(this.map_.scene.canvas);
    handlerMouseMove.setInputAction(
      this.onMapMoveMouse_.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    // movemap
    const handlerDrag = new ScreenSpaceEventHandler(this.map_.scene.canvas);
    handlerDrag.setInputAction(
      this.onMapMove_.bind(this),
      CameraEventType.LEFT_DRAG,
    );

    // evento capas añadidas a Cesium
    this.map_.imageryLayers.layerAdded.addEventListener(this.refreshIndexAndBaseStatus_.bind(this));
    this.map_.dataSources.dataSourceAdded.addEventListener(
      this.refreshIndexAndBaseStatus_.bind(this),
    );
  }

  /**
   * Este método obtiene las capas del mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.Layer>} Capas del mapa.
   * @public
   * @api
   */
  getLayers(filters) {
    const kmlLayers = this.getKML(filters);
    const wmsLayers = this.getWMS(filters);
    const wfsLayers = this.getWFS(filters);
    const ogcapifLayers = this.getOGCAPIFeatures(filters);
    const wmtsLayers = this.getWMTS(filters);
    const xyzLayers = this.getXYZs(filters);
    const tmsLayers = this.getTMS(filters);
    const mbtilesLayers = this.getMBTiles(filters);
    const unknowLayers = this.getUnknowLayers_(filters)
      .filter((layer) => !this.vectorialLayers_.includes(layer.type));
    const vector = this.getUnknowLayers_(filters)
      .filter((layer) => this.vectorialLayers_.includes(layer.type));
    const tiles3dLayers = this.getTiles3D(filters);
    const terrainLayers = this.getTerrain(filters);

    let imageryLayers = wmsLayers.concat(xyzLayers)
      .concat(wmtsLayers)
      .concat(tmsLayers)
      .concat(mbtilesLayers)
      .concat(unknowLayers);
    imageryLayers = imageryLayers
      .sort((layer1, layer2) => FacadeMap.LAYER_SORT(layer1, layer2, this.facadeMap_));

    let datasources = kmlLayers.concat(wfsLayers)
      .concat(ogcapifLayers)
      .concat(vector);
    datasources = datasources
      .sort((layer1, layer2) => FacadeMap.LAYER_SORT(layer1, layer2, this.facadeMap_));

    let primitives = tiles3dLayers;
    primitives = primitives
      .sort((layer1, layer2) => FacadeMap.LAYER_SORT(layer1, layer2, this.facadeMap_));

    return terrainLayers
      .concat(imageryLayers)
      .concat(datasources)
      .concat(primitives);
  }

  /**
   * Este método obtiene las capas base del mapa.
   *
   * @function
   * @returns {Array<IDEE.Layer>} Capas base del mapa.
   * @public
   * @api
   */
  getBaseLayers() {
    return this.getLayers().filter((layer) => layer.isBase === true);
  }

  /**
   * Este método añade las capas especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} layers Capas a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addLayers(layers) {
    let layersRec = layers;

    if (isNullOrEmpty(layersRec)) {
      layersRec = [];
    }

    if (!isArray(layersRec)) {
      layersRec = [layersRec];
    }

    if (layersRec.length === 0) {
      return this;
    }

    layersRec.forEach((layer) => {
      if (layer.type === LayerType.WMS) {
        this.facadeMap_.addWMS(layer);
      } else if (layer.type === LayerType.WMTS) {
        this.facadeMap_.addWMTS(layer);
      } else if (layer.type === LayerType.KML) {
        this.facadeMap_.addKML(layer);
      } else if (layer.type === LayerType.WFS) {
        this.facadeMap_.addWFS(layer);
      } else if (layer.type === LayerType.OGCAPIFeatures) {
        this.facadeMap_.addOGCAPIFeatures(layer);
      } else if (layer.type === LayerType.MBTiles) {
        this.facadeMap_.addMBTiles(layer);
      } else if (layer.type === LayerType.XYZ) {
        this.facadeMap_.addXYZ(layer);
      } else if (layer.type === LayerType.TMS) {
        this.facadeMap_.addTMS(layer);
      } else if (layer.type === LayerType.Tiles3D) {
        this.facadeMap_.addTiles3D(layer);
      } else if (layer.type === LayerType.Terrain) {
        this.facadeMap_.addTerrain(layer);
      } else if (!LayerType.know(layer.type)) {
        this.addUnknowLayers_([layer]);
        // eslint-disable-next-line no-underscore-dangle
        this.facadeMap_.addUnknowLayers_(layer);
      }
    });

    return this;
  }

  /**
   * Este método elimina las capas del mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} layers Capas a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeLayers(layers) {
    // gets the layers with type defined and undefined
    const unknowLayers = layers.filter((layer) => {
      return !LayerType.know(layer.type);
    });
    const knowLayers = layers.filter((layer) => {
      return LayerType.know(layer.type);
    });

    if (knowLayers.length > 0) {
      this.removeKML(knowLayers);
      this.removeWMS(knowLayers);
      this.removeWFS(knowLayers);
      this.removeOGCAPIFeatures(knowLayers);
      this.removeWMTS(knowLayers);
      this.removeMBTiles(knowLayers);
      this.removeXYZ(knowLayers);
      this.removeTMS(knowLayers);
      this.removeTiles3D(knowLayers);
      this.removeTerrain(knowLayers);
    }

    if (unknowLayers.length > 0) {
      this.removeUnknowLayers_(unknowLayers);
    }

    this.facadeMap_.fire(EventType.REMOVED_LAYER, [layers]);

    this.refreshIndexAndBaseStatus_();

    return this;
  }

  /**
   * Este método obtiene las capas KML añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.KML>} Capas KML del mapa.
   * @public
   * @api
   */
  getKML(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all kmlLayers
    const kmlLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.KML);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = kmlLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredKMLLayers = kmlLayers.filter((kmlLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(kmlLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === kmlLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === kmlLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === kmlLayer.name));
            }
            // extract
            if (!isNullOrEmpty(filterLayer.extract)) {
              layerMatched = (layerMatched && (filterLayer.extract === kmlLayer.extract));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredKMLLayers);
      }, this);
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas KML especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.KML>} layers Capas KML a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addKML(layers) {
    layers.forEach((layer) => {
      // checks if layer is WMC and was added to the map
      if (layer.type === LayerType.KML) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    }, this);

    return this;
  }

  /**
   * Este método elimina las capas KML del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.KML>} layers Capas KML a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeKML(layers) {
    const kmlMapLayers = this.getKML(layers);
    kmlMapLayers.forEach((kmlLayer) => {
      this.layers_ = this.layers_.filter((layer) => !kmlLayer.equals(layer));
      kmlLayer.getImpl().destroy();
      kmlLayer.fire(EventType.REMOVED_FROM_MAP, [kmlLayer]);
    }, this);

    return this;
  }

  /**
   * Este método obtiene las capas WMS añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<FacadeWMS>} Capas WMS del mapa.
   * @public
   * @api
   */
  getWMS(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all wmsLayers
    const wmsLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.WMS);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = wmsLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredWMSLayers = wmsLayers.filter((wmsLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(wmsLayer)) {
            // if instanceof FacadeWMS check if it is the same
            if (filterLayer instanceof FacadeWMS) {
              layerMatched = (filterLayer === wmsLayer);
            } else {
              // type
              if (!isNullOrEmpty(filterLayer.type)) {
                layerMatched = (layerMatched && (filterLayer.type === wmsLayer.type));
              }
              // URL
              if (!isNullOrEmpty(filterLayer.url)) {
                layerMatched = (layerMatched && (filterLayer.url === wmsLayer.url));
              }
              // name
              if (!isNullOrEmpty(filterLayer.name)) {
                layerMatched = (layerMatched && (filterLayer.name === wmsLayer.name));
              }
              // legend
              if (!isNullOrEmpty(filterLayer.legend)) {
                layerMatched = (layerMatched && (filterLayer.legend === wmsLayer.legend));
              }
              // isBase
              if (!isNullOrEmpty(filterLayer.isBase)) {
                layerMatched = (layerMatched && (filterLayer.isBase === wmsLayer.isBase));
              }
              // transparent
              if (!isNullOrEmpty(filterLayer.transparent)) {
                layerMatched = (layerMatched && (filterLayer.transparent === wmsLayer.transparent));
              }
              // tiled
              if (!isNullOrEmpty(filterLayer.tiled)) {
                layerMatched = (layerMatched && (filterLayer.tiled === wmsLayer.tiled));
              }
              // cql
              if (!isNullOrEmpty(filterLayer.cql)) {
                layerMatched = (layerMatched && (filterLayer.cql === wmsLayer.cql));
              }
              // version
              if (!isNullOrEmpty(filterLayer.version)) {
                layerMatched = (layerMatched && (filterLayer.version === wmsLayer.version));
              }
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredWMSLayers);
      }, this);
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas WMS especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<FacadeWMS>} layers Capas WMS a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addWMS(layers) {
    const addedLayers = [];
    layers.forEach((layer) => {
      // checks if layer is WMC and was added to the map
      if (layer.type === LayerType.WMS) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
          addedLayers.push(layer);
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas WMS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<FacadeWMS>} layers Capas WMS a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeWMS(layers) {
    const wmsMapLayers = this.getWMS(layers);
    wmsMapLayers.forEach((wmsLayer) => {
      wmsLayer.getImpl().destroy();
      this.layers_ = this.layers_.filter((layer) => !wmsLayer.equals(layer));
      wmsLayer.fire(EventType.REMOVED_FROM_MAP, [wmsLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas GeoJSON añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.GeoJSON>} Capas GeoJSON del mapa.
   * @public
   * @api
   */
  getGeoJSON(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all geojsonLayers
    const geojsonLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.GeoJSON);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = geojsonLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredWFSLayers = geojsonLayers.filter((geojsonLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(geojsonLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === geojsonLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === geojsonLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === geojsonLayer.name));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === geojsonLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredWFSLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método obtiene las capas WFS añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.WFS>} Capas WFS del mapa.
   * @public
   * @api
   */
  getWFS(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all wfsLayers
    const wfsLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.WFS);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = wfsLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredWFSLayers = wfsLayers.filter((wfsLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(wfsLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === wfsLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === wfsLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === wfsLayer.name));
            }
            // namespace
            if (!isNullOrEmpty(filterLayer.namespace)) {
              layerMatched = (layerMatched && (filterLayer.namespace === wfsLayer.namespace));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === wfsLayer.legend));
            }
            // cql
            if (!isNullOrEmpty(filterLayer.cql)) {
              layerMatched = (layerMatched && (filterLayer.cql === wfsLayer.cql));
            }
            // geometry
            if (!isNullOrEmpty(filterLayer.geometry)) {
              layerMatched = (layerMatched && (filterLayer.geometry === wfsLayer.geometry));
            }
            // ids
            if (!isNullOrEmpty(filterLayer.ids)) {
              layerMatched = (layerMatched && (filterLayer.ids === wfsLayer.ids));
            }
            // version
            if (!isNullOrEmpty(filterLayer.version)) {
              layerMatched = (layerMatched && (filterLayer.version === wfsLayer.version));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredWFSLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas WFS especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.WFS>} layers Capas WFS a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addWFS(layers) {
    layers.forEach((layer) => {
      // checks if layer is WFS and was added to the map
      if (layer.type === LayerType.WFS) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    }, this);

    return this;
  }

  /**
   * Este método elimina las capas WFS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.WFS>} layers Capas WFS a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeWFS(layers) {
    const wfsMapLayers = this.getWFS(layers);
    wfsMapLayers.forEach((wfsLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(wfsLayer));
      wfsLayer.getImpl().destroy();
      wfsLayer.fire(EventType.REMOVED_FROM_MAP, [wfsLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas OGCAPIFeatures añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.OGCAPIFeatures>} Capas OGCAPIFeatures del mapa.
   * @public
   * @api
   */
  getOGCAPIFeatures(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all ogcapifLayers
    const ogcapifLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.OGCAPIFeatures);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = ogcapifLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredOGCAPIFeaturesLayers = ogcapifLayers.filter((ogcapifLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(ogcapifLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === ogcapifLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === ogcapifLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === ogcapifLayer.name));
            }

            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === ogcapifLayer.legend));
            }
            // cql
            if (!isNullOrEmpty(filterLayer.cql)) {
              layerMatched = (layerMatched && (filterLayer.cql === ogcapifLayer.cql));
            }
            // geometry
            if (!isNullOrEmpty(filterLayer.geometry)) {
              layerMatched = (layerMatched && (filterLayer.geometry === ogcapifLayer.geometry));
            }
            // ids
            if (!isNullOrEmpty(filterLayer.id)) {
              layerMatched = (layerMatched && (filterLayer.id === ogcapifLayer.id));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredOGCAPIFeaturesLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas OGCAPIFeatures especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.OGCAPIFeatures>} layers Capas OGCAPIFeatures a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addOGCAPIFeatures(layers) {
    layers.forEach((layer) => {
      // checks if layer is OGCAPIFeatures and was added to the map
      if (layer.type === LayerType.OGCAPIFeatures) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    });

    return this;
  }

  /**
   * Este método elimina las capas OGCAPIFeatures del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.OGCAPIFeatures>} layers Capas OGCAPIFeatures a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeOGCAPIFeatures(layers) {
    const ogcapifMapLayers = this.getOGCAPIFeatures(layers);
    ogcapifMapLayers.forEach((ogcapifLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(ogcapifLayer));
      ogcapifLayer.getImpl().destroy();
      ogcapifLayer.fire(EventType.REMOVED_FROM_MAP, [ogcapifLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas WMTS añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.WMTS>} Capas WMTS del mapa.
   * @public
   * @api
   */
  getWMTS(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all wmtsLayers
    const wmtsLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.WMTS);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = wmtsLayers;
    } else {
      filters.forEach((filterLayer) => {
        // TODO ERROR DE RECURSIVIDAD: let l = map.getLayers(); map.getWMS(l);
        const filteredWMTSLayers = wmtsLayers.filter((wmtsLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(wmtsLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === wmtsLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === wmtsLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === wmtsLayer.name));
            }
            // matrixSet
            if (!isNullOrEmpty(filterLayer.matrixSet)) {
              layerMatched = (layerMatched && (filterLayer.matrixSet === wmtsLayer.matrixSet));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === wmtsLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredWMTSLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas WMTS especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.WMTS>} layers Capas WMTS a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addWMTS(layers) {
    layers.forEach((layer) => {
      // checks if layer is WMTS and was added to the map
      if (layer.type === LayerType.WMTS) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(
            this.facadeMap_,
          );
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas WMTS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.WMTS>} layers Capas WMTS a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeWMTS(layers) {
    const wmtsMapLayers = this.getWMTS(layers);
    wmtsMapLayers.forEach((wmtsLayer) => {
      wmtsLayer.fire(EventType.REMOVED_FROM_MAP, [wmtsLayer]);
      this.layers_ = this.layers_.filter((layer) => !layer.equals(wmtsLayer));
      wmtsLayer.getImpl().destroy();
    });

    return this;
  }

  /**
   * Este método obtiene las capas MBTiles añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filtersParam Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.MBTiles>} Capas MBTiles del mapa.
   * @public
   * @api
   */
  getMBTiles(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;
    const mbtilesLayers = this.layers_.filter((layer) => layer.type === 'MBTiles');

    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = mbtilesLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredMBTilesLayers = mbtilesLayers.filter((mbtileLayer) => {
          let layerMatched = true;
          if (!foundLayers.includes(mbtileLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === mbtileLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === mbtileLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === mbtileLayer.name));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === mbtileLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredMBTilesLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas MBTiles especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.MBTiles>} layers Capas MBTiles a añadir al mapa.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addMBTiles(layers) {
    layers.forEach((layer) => {
      // checks if layer is MBTiles and was added to the map
      if (layer.type === LayerType.MBTiles) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas MBTiles del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.MBTiles>} layers Capas MBTiles a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeMBTiles(layers) {
    const mbtilesMapLayers = this.getMBTiles(layers);
    mbtilesMapLayers.forEach((mbtilesLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(mbtilesLayer));
      mbtilesLayer.getImpl().destroy();
      mbtilesLayer.fire(EventType.REMOVED_FROM_MAP, [mbtilesLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas añadidas al mapa.
   *- ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar en la búsqueda.
   * @returns {Array<FacadeWMS>} Capas del mapa.
   * @api
   */
  getUnknowLayers_(filters) {
    let foundLayers = [];
    let filtersVar = filters;

    // get all wmsLayers
    const unknowLayers = this.layers_.filter((layer) => {
      return !LayerType.know(layer.type);
    });

    // parse to Array
    if (isNullOrEmpty(filtersVar)) {
      filtersVar = [];
    }
    if (!isArray(filtersVar)) {
      filtersVar = [filtersVar];
    }

    if (filtersVar.length === 0) {
      foundLayers = unknowLayers;
    } else {
      filtersVar.forEach((filterLayer) => {
        const filteredUnknowLayers = unknowLayers.filter((unknowLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(unknowLayer)) {
            // if instanceof FacadeWMS check if it is the same
            if (filterLayer instanceof LayerBase) {
              layerMatched = filterLayer.equals(unknowLayer);
            } else {
              // type
              if (!isNullOrEmpty(filterLayer.type)) {
                layerMatched = (layerMatched && (filterLayer.type === unknowLayer.type));
              }
              // name
              if (!isNullOrEmpty(filterLayer.name)) {
                layerMatched = (layerMatched && (filterLayer.name === unknowLayer.name));
              }
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredUnknowLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas especificadas por el usuario.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Array<Object>} layers Capas a añadir.
   * @returns {Map} Mapa.
   * @api
   */
  addUnknowLayers_(layers) {
    // adds layers
    layers.forEach((layer) => {
      if (!includes(this.layers_, layer)) {
        this.layers_.push(layer);
        layer.getImpl().addTo(this.facadeMap_);
      }
    });

    return this;
  }

  /**
   * Este método elimina las capas del mapa especificadas por el usuario.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Array<Object>} layers Capas a eliminar.
   * @returns {Map} Mapa.
   * @api
   */
  removeUnknowLayers_(layers) {
    // removes unknow layers
    layers.forEach((layer) => {
      if (includes(this.layers_, layer)) {
        this.layers_ = this.layers_.filter((layer2) => !layer2.equals(layer));
        layer.getImpl().destroy();
      }
    });
  }

  /**
   * Este método obtiene las capas XYZ añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.XYZ>} Capas XYZ del mapa.
   * @public
   * @api
   */
  getXYZs(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;
    const xyzLayers = this.layers_.filter((layer) => layer.type === LayerType.XYZ);

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = xyzLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredXYZLayers = xyzLayers.filter((xyzLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(xyzLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === xyzLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === xyzLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === xyzLayer.name));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredXYZLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas XYZ especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.XYZ>} layers Capas XYZ a añadir.
   * @returns {IDEE.impl.Map} Mapa.
   * @public
   * @api
   */
  addXYZ(layers) {
    layers.forEach((layer) => {
      // checks if layer is XYZ and was added to the map
      if (layer.type === LayerType.XYZ) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas XYZ del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.XYZ>} layers Capas XYZ a eliminar.
   * @returns {IDEE.impl.Map} Mapa.
   * @public
   * @api
   */
  removeXYZ(layers) {
    const xyzMapLayers = this.getXYZs(layers);
    xyzMapLayers.forEach((xyzLayer) => {
      xyzLayer.getImpl().destroy();
      this.layers_ = this.layers_.filter((layer) => !layer.equals(xyzLayer));
      xyzLayer.fire(EventType.REMOVED_FROM_MAP, [xyzLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas TMS añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros para aplicar en la búsqueda.
   * @returns {Array<IDEE.layer.TMS>} Capas TMS del mapa.
   * @public
   * @api
   */
  getTMS(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;
    const tmsLayers = this.layers_.filter((layer) => layer.type === LayerType.TMS);

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = tmsLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredTMSLayers = tmsLayers.filter((tmsLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(tmsLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === tmsLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === tmsLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === tmsLayer.name));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredTMSLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas TMS especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.TMS>} layers Capas TMS a añadir.
   * @returns {IDEE.impl.Map} Mapa.
   * @public
   * @api
   */
  addTMS(layers) {
    layers.forEach((layer) => {
      // checks if layer is TMS and was added to the map
      if (layer.type === LayerType.TMS) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas TMS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.TMS>} layers Capas TMS a eliminar.
   * @returns {IDEE.impl.Map} Mapa.
   * @public
   * @api
   */
  removeTMS(layers) {
    const tmsMapLayers = this.getTMS(layers);
    tmsMapLayers.forEach((tmsLayer) => {
      tmsLayer.fire(EventType.REMOVED_FROM_MAP, [tmsLayer]);
      this.layers_ = this.layers_.filter((layer) => !layer.equals(tmsLayer));
      tmsLayer.getImpl().destroy();
    });

    return this;
  }

  /**
   * Este método obtiene las capas Tiles3D añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.Tiles3D>} Capas Tiles3D del mapa.
   * @public
   * @api
   */
  getTiles3D(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const tiles3DLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.Tiles3D);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = tiles3DLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredTiles3DLayers = tiles3DLayers.filter((tiles3DLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(tiles3DLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === tiles3DLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === tiles3DLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === tiles3DLayer.name));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === tiles3DLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredTiles3DLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas Tiles3D especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<IDEE.layer.Tiles3D>} layers Capas Tiles3D a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addTiles3D(layers) {
    layers.forEach((layer) => {
      // checks if layer is Tiles3D and was added to the map
      if (layer.type === LayerType.Tiles3D) {
        if (!includes(this.layers_, layer)) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas Tiles3D del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.Tiles3D>} layers Capas Tiles3D a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeTiles3D(layers) {
    const tiles3DMapLayers = this.getTiles3D(layers);
    tiles3DMapLayers.forEach((tiles3DLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(tiles3DLayer));
      tiles3DLayer.getImpl().destroy();
      tiles3DLayer.fire(EventType.REMOVED_FROM_MAP, [tiles3DLayer]);
    });
    return this;
  }

  /**
   * Este método obtiene las capas Terrain añadidas al mapa.
   *
   * @function
   * @param {Array<IDEE.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<IDEE.layer.Terrain>} Capas Terrain del mapa.
   * @public
   * @api
   */
  getTerrain(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const terrainLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.Terrain);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = terrainLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredTerrainLayers = terrainLayers.filter((terrainLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(terrainLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === terrainLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === terrainLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === terrainLayer.name));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === terrainLayer.legend));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredTerrainLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método añade las capas Terrain especificadas por el usuario al mapa.
   * Solo disponible para Cesium.
   *
   * @function
   * @param {Array<IDEE.layer.Terrain>} layers Capas Terrain a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addTerrain(layers) {
    layers.forEach((layer) => {
      // checks if layer is Terrain and was added to the map
      if (layer.type === LayerType.Terrain) {
        // checks if a Terrain layer already exists
        const hasTerrain = this.getTerrain().length > 0;
        if (!includes(this.layers_, layer) && !hasTerrain) {
          this.layers_.push(layer);
          layer.getImpl().addTo(this.facadeMap_);
        } else if (hasTerrain) {
          // eslint-disable-next-line no-console
          console.warn(getValue('exception').terrain_exists);
        }
      }
    });
    return this;
  }

  /**
   * Este método elimina las capas Terrain del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<IDEE.layer.Terrain>} layers Capas Terrain a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeTerrain(layers) {
    const terrainMapLayers = this.getTerrain(layers);
    terrainMapLayers.forEach((terrainLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(terrainLayer));
      terrainLayer.getImpl().destroy();
      terrainLayer.fire(EventType.REMOVED_FROM_MAP, [terrainLayer]);
    });
    return this;
  }

  /**
   * Este método obtiene los controles especificados por el usuario.
   *
   * @function
   * @param {string|Array<String>} filters Filtros.
   * @returns {Array<IDEE.Control>} Controles.
   * @public
   * @api
   */
  getControls(filters) {
    let filtersVar = filters;
    let foundControls = [];

    let panelControls = this.facadeMap_.getPanels().map((p) => p.getControls());
    if (panelControls.length > 0) {
      panelControls = panelControls.reduce((acc, controls) => acc.concat(controls));
    }
    const controlsToSearch = this.controls_.concat(panelControls);
    // parse to Array
    if (isNullOrEmpty(filtersVar)) {
      filtersVar = [];
    }
    if (!isArray(filtersVar)) {
      filtersVar = [filtersVar];
    }
    if (filtersVar.length === 0) {
      foundControls = controlsToSearch;
    } else {
      filtersVar.forEach((filterControl) => {
        foundControls = foundControls.concat(controlsToSearch.filter((control) => {
          let controlMatched = false;

          if (!includes(foundControls, control)) {
            if (isString(filterControl)) {
              controlMatched = (filterControl === control.name);
            } else if (filterControl instanceof Control) {
              controlMatched = (filterControl === control);
            } else if (isObject(filterControl)) {
              controlMatched = (filterControl.name === control.name);
            }
          }
          return controlMatched;
        }));
      });
    }
    const nonRepeatFoundControls = [];
    foundControls.forEach((control) => {
      const controlNames = nonRepeatFoundControls.map((c) => c.name);
      if (!controlNames.includes(control.name)) {
        nonRepeatFoundControls.push(control);
      }
    });
    return nonRepeatFoundControls;
  }

  /**
   * Este método añade los controles del mapa especificados por el usuario.
   *
   * @function
   * @param {IDEE.Control} controls Controles a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addControls(controls) {
    controls.forEach((control) => {
      if (!includes(this.controls_, control) && control) {
        this.controls_.push(control);
      }
    });

    return this;
  }

  /**
   * Este método elimina los controles del mapa especificados por el usuario.
   *
   * @function
   * @param {IDEE.Control} controls Controles a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeControls(controls) {
    const mapControls = this.getControls(controls);
    mapControls.forEach((control) => {
      control.destroy();
      this.controls_ = this.controls_.filter((control2) => {
        let equals = control2.constructor === control.constructor;
        if (!isNullOrEmpty(control2.equals)) {
          equals = !control2.equals(control);
        }
        return equals;
      });
    });
    return this;
  }

  /**
   * Este método establece la extensión máxima para la
   * instancia del mapa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Nueva extensión máxima.
   * @param {Boolean} zoomToExtent Indica si se establece la extensión actual.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setMaxExtent(maxExtent, zoomToExtent) {
    let cesiumExtent = maxExtent;

    if (!isNullOrEmpty(cesiumExtent) && !isArray(cesiumExtent) && isObject(cesiumExtent)) {
      cesiumExtent = [maxExtent.x.min, maxExtent.y.min, maxExtent.x.max, maxExtent.y.max];
    }

    this.getMapImpl().scene
      .globe.cartographicLimitRectangle = Rectangle.fromDegrees(...cesiumExtent);

    this.getMapImpl().scene.skyAtmosphere.show = false;

    if (!isNullOrEmpty(cesiumExtent) && (zoomToExtent !== false)) {
      this.setBbox(cesiumExtent);
    }

    return this;
  }

  /**
   * Este método obtiene la extensión máxima para la
   * instancia del mapa.
   *
   * @function
   * @returns {Mx.Extent} Máxima extensión actual.
   * @public
   * @api
   */
  getMaxExtent() {
    return this.getMapImpl().scene.globe.cartographicLimitRectangle;
  }

  // TODO: JSDOC
  async getCapabilities(url, version, type) {
    const layerUrl = url;
    const layerVersion = version;
    const projection = this.getProjection();
    // gest the capabilities URL
    const getCapabilitiesUrl = (type === 'WMS')
      ? getWMSGetCapabilitiesUrl(layerUrl, layerVersion)
      : getWMTSGetCapabilitiesUrl(layerUrl, layerVersion);

    // gets the getCapabilities response
    const response = await getRemote(getCapabilitiesUrl);
    const getCapabilitiesDocument = response.xml;
    const parser = (type === 'WMS') ? new FormatWMS() : new CesiumFormatWMTSCapabilities();
    const parsedCapabilities = (type === 'WMS') ? await
    parser.customRead(getCapabilitiesDocument) : await parser.read(getCapabilitiesDocument);

    if (type === 'WMS') {
      const getCapabilitiesUtils = await new GetCapabilities(
        parsedCapabilities,
        layerUrl,
        projection,
      );
      this.getCapabilitiesPromise = getCapabilitiesUtils;
    } else {
      try {
        parsedCapabilities.Contents.Layer.forEach((l) => {
          const name = l.Identifier;
          l.Style.forEach((s) => {
            const layerText = response.text.split('Layer>').filter((text) => text.indexOf(`Identifier>${name}<`) > -1)[0];
            /* eslint-disable no-param-reassign */
            s.LegendURL = layerText.split('LegendURL')[1].split('xlink:href="')[1].split('"')[0];
          });
        });
        /* eslint-disable no-empty */
      } catch (err) {}
      this.getCapabilitiesPromise = parsedCapabilities;
    }
    return this.getCapabilitiesPromise;
  }

  /**
   * Este método establece el encuadre de visualización del mapa.
   *
   * @function
   * @param {Mx.Extent} bbox Nuevo encuadre de visualización del mapa.
   * @param {Object} vendorOpts Opciones para la biblioteca base.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setBbox(bbox, vendorOpts) {
    // checks if the param is null or empty
    if (isNullOrEmpty(bbox)) {
      Exception(getValue('exception').no_bbox);
    }

    this.userBbox_ = bbox;

    // set the extent by cesium
    let extent;
    if (isArray(bbox)) {
      extent = bbox;
    } else if (isObject(bbox)) {
      extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    }

    const cesiumMap = this.getMapImpl();
    // chaeck if bbox is out range
    if (extent[0] < -180 || extent[1] < -90 || extent[2] > 180 || extent[3] > 90) {
      extent = [-180, -90, 180, 90];
    }

    const options = {
      destination: new Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]),
      ...vendorOpts,
    };
    cesiumMap.camera.setView(options);

    return this;
  }

  /**
   * Este método obtiene el encuadre de visualización del mapa.
   *
   * @function
   * @returns {Mx.Extent} Encuadre de visualización del mapa.
   * @public
   * @api
   */
  getBbox() {
    let bbox = null;

    const cesiumMap = this.getMapImpl();
    // Obtiene el bounding box de la vista actual
    bbox = cesiumMap.camera.computeViewRectangle();

    // EPSG:4979
    // Convertir el bbox de radianes a grados
    const west = CesiumMath.toDegrees(bbox.west);
    const south = CesiumMath.toDegrees(bbox.south);
    const east = CesiumMath.toDegrees(bbox.east);
    const north = CesiumMath.toDegrees(bbox.north);

    bbox = {
      x: {
        min: west,
        max: east,
      },
      y: {
        min: south,
        max: north,
      },
    };

    return bbox;
  }

  /**
   * Este método establece el actual zoom de la
   * instancia del mapa.
   *
   * @function
   * @param {Number} zoom Nuevo zoom del mapa.
   * @param {Boolean} inmeters Si es verdadero el zoom
   * dado por parámetro está en metros, en caso contrario
   * como niveles de zoom. Por defecto, es falso.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setZoom(zoom, inmeters = false) {
    // checks if the param is null or empty
    if (isNullOrEmpty(zoom)) {
      Exception(getValue('exception').no_zoom);
    }

    let meters = zoom;
    const cesiumView = this.getMapImpl().camera;
    const center = cesiumView.positionCartographic;

    if (!inmeters) {
      zoom = Math.round(zoom);
      const values = Object.values(this.facadeMap_.zoom_meters);
      meters = isUndefined(this.facadeMap_.zoom_meters[zoom])
        ? Number(values[values.length - 1])
        : this.facadeMap_.zoom_meters[zoom];
    }

    cesiumView.setView({
      destination: Cartesian3.fromDegrees(
        CesiumMath.toDegrees(center.longitude),
        CesiumMath.toDegrees(center.latitude),
        meters,
      ),
    });

    return this;
  }

  /**
   * Este método establece el mínimo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Number} zoom Nuevo mínimo zoom del mapa.
   * @param {Boolean} inmeters Si es verdadero el zoom
   * dado por parámetro está en metros, en caso contrario
   * como niveles de zoom. Por defecto, es falso.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setMinZoom(zoom, inmeters = false) {
    if (isNullOrEmpty(zoom)) {
      Exception(getValue('exception').no_zoom);
    }

    if (!inmeters) {
      zoom = Math.round(zoom);
      const values = Object.values(this.facadeMap_.zoom_meters);
      zoom = isUndefined(this.facadeMap_.zoom_meters[zoom])
        ? Number(values[0])
        : this.facadeMap_.zoom_meters[zoom];
    }

    this.getMapImpl().scene.screenSpaceCameraController.maximumZoomDistance = zoom;

    if (this.getMapImpl().camera.positionCartographic.height > zoom) {
      this.getMapImpl().camera.zoomOut(zoom - this.getMapImpl().camera.positionCartographic.height);
    }

    return this;
  }

  /**
   * Este método establece el máximo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Number} zoom Nuevo máximo zoom del mapa.
   * @param {Boolean} inmeters Si es verdadero el zoom
   * dado por parámetro está en metros, en caso contrario
   * como niveles de zoom. Por defecto, es falso.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setMaxZoom(zoom, inmeters = false) {
    if (isNullOrEmpty(zoom)) {
      Exception(getValue('exception').no_zoom);
    }

    if (!inmeters) {
      zoom = Math.round(zoom);
      const values = Object.values(this.facadeMap_.zoom_meters);
      zoom = isUndefined(this.facadeMap_.zoom_meters[zoom])
        ? Number(values[values.length - 1])
        : this.facadeMap_.zoom_meters[zoom];
    }

    this.getMapImpl().scene.screenSpaceCameraController.minimumZoomDistance = zoom;

    if (this.getMapImpl().camera.positionCartographic.height < zoom) {
      this.getMapImpl().camera.zoomIn(this.getMapImpl().camera.positionCartographic.height - zoom);
    }

    return this;
  }

  /**
   * Este método obtiene el zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Boolean} inmeters Si es verdadero el zoom
   * obtenido está en metros, en caso contrario como niveles de zoom.
   * Por defecto, es falso.
   * @returns {Number} Zoom del mapa.
   * @public
   * @api
   */
  getZoom(inmeters = false) {
    let zoom = null;
    // Obtener la posición cartográfica (EPSG:4979) actual de la cámara
    const positionCartographic = this.getMapImpl().camera.positionCartographic;
    // Obtener la altura actual de la cámara (en metros)
    zoom = positionCartographic.height;

    if (!inmeters) {
      const keys = Object.keys(this.facadeMap_.zoom_meters);
      const level = Object.entries(this.facadeMap_.zoom_meters)
        .find(([_, value]) => Math.round(zoom) >= value);
      zoom = !isNullOrEmpty(level) ? level[0] : keys[keys.length - 1];
    }
    return zoom;
  }

  /**
   * Este método obtiene el mínimo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Boolean} inmeters Si es verdadero el zoom
   * obtenido está en metros, en caso contrario como niveles de zoom.
   * Por defecto, es falso.
   * @returns {Number} Mínimo zoom del mapa.
   * @public
   * @api
   */
  getMinZoom(inmeters = false) {
    let minZoom;

    if (this.getMapImpl() && this.getMapImpl().scene) {
      minZoom = this.getMapImpl().scene.screenSpaceCameraController.maximumZoomDistance;
    }
    if (!inmeters) {
      const keys = Object.keys(this.facadeMap_.zoom_meters);
      const level = Object.entries(this.facadeMap_.zoom_meters)
        .find(([_, value]) => Math.round(minZoom) >= value);
      minZoom = !isNullOrEmpty(level) ? level[0] : keys[keys.length - 1];
    }

    return Number(minZoom);
  }

  /**
   * Este método obtiene el máximo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Boolean} inmeters Si es verdadero el zoom
   * obtenido está en metros, en caso contrario como niveles de zoom.
   * Por defecto, es falso.
   * @returns {Number} Máximo zoom del mapa.
   * @public
   * @api
   */
  getMaxZoom(inmeters = false) {
    let maxZoom;
    if (this.getMapImpl() && this.getMapImpl().scene) {
      maxZoom = this.getMapImpl().scene.screenSpaceCameraController.minimumZoomDistance;
    }

    if (!inmeters) {
      const keys = Object.keys(this.facadeMap_.zoom_meters);
      const level = Object.entries(this.facadeMap_.zoom_meters)
        .find(([_, value]) => Math.round(maxZoom) >= value);
      maxZoom = !isNullOrEmpty(level) ? level[0] : keys[keys.length - 1];
    }
    return Number(maxZoom);
  }

  /**
   * Este método establece el centro actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Object} center Nuevo centro del mapa.
   * @returns {Map} Mapa.
   * @public
   * @api
   */

  setCenter(center) {
    // checks if the param is null or empty
    if (isNullOrEmpty(center)) {
      Exception(getValue('exception').no_center);
    }

    const cesiumMap = this.getMapImpl();
    const cesiumView = cesiumMap.camera;

    // Obtener el zoom actual en metros
    const height = this.getZoom(true);

    cesiumView.setView({
      destination: Cartesian3.fromDegrees(center.x, center.y, height),
    });
    return this;
  }

  /**
   * Este método obtiene el centro actual de la
   * instancia del mapa.
   *
   * @function
   * @returns {Object} Centro del mapa.
   * @public
   * @api
   */

  getCenter() {
    let center = null;
    const cesiumMap = this.getMapImpl();
    const cesiumCenter = cesiumMap.camera.positionCartographic;

    if (!isNullOrEmpty(cesiumCenter)) {
      // EPSG:4979
      center = {
        x: CesiumMath.toDegrees(cesiumCenter.longitude),
        y: CesiumMath.toDegrees(cesiumCenter.latitude),
      };
    }
    return center;
  }

  /**
   * Este método establece el estado de zoomConstrains
   * instancia del mapa.
   * No disponible para Cesium.
   *
   * @function
   * @param {Boolean} zoomConstrains Nuevo valor.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setZoomConstrains(zoomConstrains) {
    console.warn(getValue('exception').no_zoomconstrains); // eslint-disable-line

    return this;
  }

  /**
   * Este método obtiene el estado actual de
   * zoomConstrains de la instancia del mapa.
   * No disponible para Cesium.
   *
   * @function
   * @returns {Boolean} Valor actual.
   * @public
   * @api
   */
  getZoomConstrains() {
    console.warn(getValue('exception').no_zoomconstrains); // eslint-disable-line

    return false;
  }

  /**
   * Este método obtiene las resoluciones actuales
   * para la instancia del mapa.
   * No disponible para Cesium.
   *
   * @function
   * @returns {Array<Number>} Resoluciones del mapa.
   * @public
   * @api
   */
  getResolutions() {
    console.warn(getValue('exception').no_getresolutions); // eslint-disable-line
    return undefined;
  }

  /**
   * Este método establece las resoluciones actuales
   * para la instancia del mapa.
   * No disponible para Cesium.
   *
   * @function
   * @param {Array<Number>} resolutions Resoluciones.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setResolutions(resolutions, optional) {
    // checks if the param is null or empty
    if (isNullOrEmpty(resolutions)) {
      Exception(getValue('exception').no_resolutions);
    }

    console.warn(getValue('exception').no_setresolutions); // eslint-disable-line

    return this;
  }

  /**
   * Este método obtiene el factor de escala para la
   * resolución de renderizado.
   *
   * @function
   * @returns {Number} LOD
   * @public
   * @api
   */
  getLOD() {
    return this.getMapImpl().resolutionScale;
  }

  /**
   * Este método establece el factor de escala para la resolución
   * de renderizado para la instancia del mapa.
   *
   * @function
   * @param {Number} lod LOD.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setLOD(lod) {
    // checks if the param is null or empty
    if (isNullOrEmpty(lod) || isUndefined(lod)) {
      this.getMapImpl().resolutionScale = 1;
      this.getMapImpl().useBrowserRecommendedResolution = true;
    } else {
      let lodParam = lod;
      if (lod <= 0) {
        lodParam = 0.1;
      } else if (lod > 2) {
        lodParam = 2;
      }
      this.getMapImpl().resolutionScale = lodParam;
      this.getMapImpl().useBrowserRecommendedResolution = false;
    }

    return this;
  }

  /**
   * Este método obtiene la escala actual
   * para la instancia del mapa.
   *
   * @function
   * @returns {number} Escala actual.
   * @public
   * @api
   */
  getScale() {
    let scale;

    const positionCartographic = this.getMapImpl().camera.positionCartographic;
    const height = positionCartographic.height;
    if (!isNullOrEmpty(height)) {
      scale = height / FOCAL;
    }

    if (!isNullOrEmpty(scale)) {
      if (scale >= 1000 && scale <= 950000) {
        scale = Math.round(scale / 1000) * 1000;
      } else if (scale >= 950000) {
        scale = Math.round(scale / 1000000) * 1000000;
      } else {
        scale = Math.round(scale);
      }
    }

    return scale;
  }

  /**
   * Este método obtiene la escala actual exacta
   * para la instancia del mapa.
   *
   * @function
   * @returns {number} Escala actual.
   * @public
   * @api
   */
  getExactScale() {
    let scale;

    const positionCartographic = this.getMapImpl().camera.positionCartographic;
    const height = positionCartographic.height;
    if (!isUndefined(height)) {
      scale = height / FOCAL;
    }

    return scale;
  }

  /**
   * Este método establece la proyección actual para la
   * instancia del mapa.
   * No disponible para Cesium.
   *
   * @function
   * @param {Mx.Projection} bbox Bbox.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setProjection(projection) {
    console.warn(getValue('exception').no_setprojection); // eslint-disable-line

    return this;
  }

  /**
   * Este método obtiene la proyección actual de la instancia del mapa.
   *
   * @function
   * @returns {Mx.Projection} Proyección actual de la instancia del mapa.
   * @public
   * @api
   */
  getProjection() {
    return {
      code: 'EPSG:4979',
      units: 'd',
      getExtent: () => {
        const extent = [-180, -90, 180, 90];
        return extent;
      },
    };
  }

  /**
   * Este método obtiene la implementación del mapa.
   *
   * @function
   * @returns {cesium.Map} Implementación del mapa.
   * @public
   * @api
   */
  getMapImpl() {
    return this.map_;
  }

  /**
   * Este método elimina el "popup".
   *
   * @function
   * @param {IDEE.impl.Popup} popup "Popup" a eliminar.
   * @returns {cesium.Map} Mapa.
   * @public
   * @api
   */
  removePopup(popup) {
    if (!isNullOrEmpty(popup)) {
      const cesiumPopup = popup.getImpl();
      cesiumPopup.container.remove();
      cesiumPopup.removePreRenderEvent_();
    }
    return this;
  }

  /**
   * This function destroys this map, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.layers_.length = 0;
    this.controls_.length = 0;

    this.popup_ = null;
    this.options_ = null;

    this.map_.destroy();
    this.map_ = null;
  }

  /**
   * Actualiza las resoluciones de este mapa calculadas
   * a partir de las capas base.
   *
   * @function
   * @returns {IDEE.Map} Mapa
   * @public
   * @api
   */
  updateResolutionsFromBaseLayer() {
    this.fire(EventType.COMPLETED);
  }

  /**
   * Este método añade un "popup" y elimina el anterior.
   *
   * @function
   * @param {IDEE.impl.Popup} label "Popup" a añadir.
   * @returns {Cesium.Viewer} Mapa.
   * @public
   * @api
   */
  addLabel(label) {
    this.label = label;
    label.show(this.facadeMap_);
    return this;
  }

  /**
   * Este método obtiene un "popup" con el texto indicado.
   *
   * @function
   * @returns {Cesium.Viewer} Mapa.
   * @public
   * @api
   */
  getLabel() {
    return this.label;
  }

  /**
   * Este método elimina un "popup" con el texto indicado.
   *
   * @function
   * @returns {Cesium.Viewer} Mapa.
   * @public
   * @api
   */
  removeLabel() {
    if (!isNullOrEmpty(this.label)) {
      const popup = this.label.getPopup();
      this.removePopup(popup);
      this.label = null;
    }
  }

  /**
   * This function provides the core map used by the
   * implementation
   *
   * @function
   * @api stable
   * @returns {Object} core map used by the implementation
   */
  getContainer() {
    return this.map_.container;
  }

  /**
   * Este método establece la fachada del mapa a implementar.
   *
   * @function
   * @param {IDEE.Map} facadeMap Fachada del mapa a implementar.
   * @public
   * @api
   */
  setFacadeMap(facadeMap) {
    this.facadeMap_ = facadeMap;
  }

  /**
   * Este método registra el evento de cambio de zoom.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  registerEvents_() {
    this.map_.camera.moveEnd.addEventListener(() => this.zoomEvent_.call(this));
  }

  /**
   * Este método se ejecuta cuando el usuario realiza zoom.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  zoomEvent_() {
    if (this.currentZoom !== this.getZoom(true)) {
      this.facadeMap_.fire(EventType.CHANGE_ZOOM, this.facadeMap_);
      this.currentZoom = this.getZoom(true);
    }
  }

  /**
   * Este método se ejecuta cuando el usuario hace click en el mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {IDEE.evt} evt Evento.
   * @public
   * @api
   */
  onMapClick_(evt) {
    const pixel = evt.position;
    const ray = this.map_.camera.getPickRay(pixel);
    const position = this.map_.scene.globe.pick(ray, this.map_.scene);
    let coord;

    if (position) {
      coord = Cartographic.fromCartesian(position);
      coord = [
        CesiumMath.toDegrees(coord.longitude),
        CesiumMath.toDegrees(coord.latitude),
        coord.height,
      ];
    }
    // hides the label if it was added
    const label = this.facadeMap_.getLabel();
    if (!isNullOrEmpty(label)) {
      label.hide();
    }

    if (!isUndefined(coord)) {
      this.facadeMap_.fire(EventType.CLICK, [{
        pixel,
        coord,
        vendor: evt,
      }]);
    }
  }

  /**
   * Este método se ejecuta cuando el usuario mueve el mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {IDEE.evt} evt Evento.
   * @public
   * @api
   */
  onMapMove_(evt) {
    const pixel = evt.position;
    const ray = this.map_.camera.getPickRay(pixel);
    const position = this.map_.scene.globe.pick(ray, this.map_.scene);
    let coord;

    if (position) {
      coord = Cartographic.fromCartesian(position);
      coord = [
        CesiumMath.toDegrees(coord.longitude),
        CesiumMath.toDegrees(coord.latitude),
        coord.height,
      ];
    }
    if (!isUndefined(coord)) {
      this.facadeMap_.fire(EventType.MOVE_MOUSE, [{
        pixel,
        coord,
        vendor: evt,
      }]);
    }
  }

  /**
   * Este método se ejecuta cuando el usuario mueve el ratón.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {IDEE.evt} evt Evento.
   * @public
   * @api
   */
  onMapMoveMouse_(evt) {
    const pixel = evt.endPosition;
    const ray = this.map_.camera.getPickRay(pixel);
    const position = this.map_.scene.globe.pick(ray, this.map_.scene);
    let coord;

    if (position) {
      coord = Cartographic.fromCartesian(position);
      coord = [
        CesiumMath.toDegrees(coord.longitude),
        CesiumMath.toDegrees(coord.latitude),
        coord.height,
      ];
    }
    if (!isUndefined(coord)) {
      this.facadeMap_.fire(EventType.MOVE_MOUSE, [{
        pixel,
        coord,
        vendor: evt,
      }]);
    }
  }

  /**
   * Este método actualiza los índices de las capas añadidas al mapa y
   * su capa base.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   */
  refreshIndexAndBaseStatus_() {
    this.facadeMap_.getLayers().forEach((layer) => {
      const layerImpl = layer.getImpl().getLayer();
      if (layerImpl instanceof ImageryLayer) {
        /* eslint-disable no-param-reassign */
        layer.zindex_ = layerImpl._layerIndex;
        layer.isBase = layerImpl.isBaseLayer();
      } else if (layerImpl instanceof CustomDataSource || layerImpl instanceof GeoJsonDataSource
        || layerImpl instanceof KmlDataSource) {
        // eslint-disable-next-line
        layer.zindex_ = this.getMapImpl().dataSources.indexOf(layerImpl);
        layer.isBase = false;
      } else if (layerImpl instanceof Cesium3DTileset) {
        // eslint-disable-next-line no-underscore-dangle
        layer.zindex_ = this.getMapImpl().scene.primitives._primitives
          .findIndex((l) => layerImpl === l);
        layer.isBase = false;
      }
    });
  }
}

export default Map;
