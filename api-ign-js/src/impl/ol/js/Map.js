/**
 * @module M/impl/Map
 */
import OLMap from 'ol/Map';
import { get as getProj, transform } from 'ol/proj';
import OLFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';
import OLProjection from 'ol/proj/Projection';
import OLInteraction from 'ol/interaction/Interaction';
import MObject from 'M/Object';
import FacadePanzoombar from 'M/control/Panzoombar';
import * as LayerType from 'M/layer/Type';
import 'impl-assets/css/ol';
import 'impl-assets/css/custom';
import Control from 'M/control/Control';
import FacadeWMS from 'M/layer/WMS';
import * as EventType from 'M/event/eventtype';
import LayerBase from 'M/layer/Layer';
import Exception from 'M/exception/exception';
import { getValue } from 'M/i18n/language';
import { get as getRemote } from 'M/util/Remote';
import {
  isArray, isNullOrEmpty, isObject, isString, getWMSGetCapabilitiesUrl, getWMTSGetCapabilitiesUrl,
  getScaleFromResolution, includes,
  // fillResolutions,
  // generateResolutionsFromExtent,
} from 'M/util/Utils';
import 'patches';
import ImplUtils from './util/Utils';
import GetCapabilities from './util/WMSCapabilities';
import View from './View';
import FormatWMS from './format/WMS';
import LayerGroup from './layer/LayerGroup';

/**
 * @classdesc
 * Esta clase crea un mapa con un contenedor "div" específico
 *
 * @property {M.Map} facadeMap_ Fachada del mapa a implementar.
 * @property {ol.Collection<M.Layer>} layers_ Capas añadidas al mapa.
 * @property {Array<M.Control>} controls_ Controles añadidos al mapa.
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
 * @property {ol.Map} map_ Implementación del mapa.
 * @property {Object} Z_INDEX_BASELAYER Objeto con los valores de los z-index.
 * @property {Number} currentZoom Almacena el zoom del mapa.
 * @property {Object} objectView Almacena las propiedades indicadas por el usuario para la vista.
 *
 * @api
 * @extends {M.Object}
 */
class Map extends MObject {
  /**
   * Constructor principal de la clase. Crea un mapa con un
   * contenedor "div" específico.
   *
   * @constructor
   * @param {Object} div Elemento "div" proporcionado por el usuario.
   * @param {M.Map} facadeMap Fachada del mapa a implementar.
   * @param {Mx.parameters.MapOptions} options Opciones del mapa.
   * - zoom: Nivel de zoom inicial del mapa.
   * - bbox: Encuadre de visualización del mapa.
   * - maxExtent: Máxima extensión permitida; a diferencia del bbox,
   * no se dibujará el mapa fuera de los límites
   * establecidos.
   * - projection: Proyección de visualización del mapa.
   * - center: Punto central del mapa.
   * - label: "Popup" con el texto indicado en una coordenada especificada o,
   * en su defecto, en el centro (center)
   * establecido del mapa.
   * - resolutions: Array con las resoluciones asociadas a cada nivel de zoom del mapa.
   * @param {object} viewVendorOptions Parámetros para la vista del mapa de la librería base.
   * @api
   */
  constructor(div, facadeMap, options = {}, viewVendorOptions = {}) {
    super();
    /**
     * Fachada del mapa a implementar.
     * @private
     * @type {M.Map}
     */
    this.facadeMap_ = facadeMap;

    /**
     * Capas añadidas al mapa.
     * @private
     * @type {ol.Collection<M.Layer>}
     */
    this.layers_ = [];

    /**
     * Controles añadidos al mapa.
     * @private
     * @type {Array<M.Control>}
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
     * Almacena las propiedades indicadas por el usuario para la vista.
     * @api
     * @type {Object}
     */
    this.objectView = viewVendorOptions;

    if (this.viewExtent !== undefined && this.viewExtent.length === 4) {
      this.objectView.extent = this.viewExtent;
    }

    /**
     * Implementación del mapa.
     * @private
     * @type {ol.Map}
     */
    const view = new View(this.objectView);

    this.map_ = new OLMap({
      controls: [],
      target: div.id,
      // renderer,
      view,
    });

    this.registerEvents_();

    // this.map_.getView().setConstrainResolution(false);
    this.facadeMap_.on(EventType.COMPLETED, () => {
      this.map_.updateSize();
    });
    this.map_.on('singleclick', this.onMapClick_.bind(this));
    // pointermove
    this.map_.addInteraction(new OLInteraction({
      handleEvent: (e) => {
        if (e.type === 'pointerdrag' || e.type === 'wheel') {
          this.onMapMove_(e);
        } else if (e.type === 'pointermove') {
          this.onMapMoveMouse_(e);
        }
        return true;
      },
    }));
  }

  /**
   * Este método obtiene las capas del mapa.
   *
   * @function
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.Layer>} Capas del mapa.
   * @public
   * @api
   */
  getLayers(filters) {
    const kmlLayers = this.getKML(filters);
    const wmsLayers = this.getWMS(filters);
    const geotiffLayers = this.getGeoTIFF(filters);
    const mapLibreLayers = this.getMapLibre(filters);
    const wfsLayers = this.getWFS(filters);
    const ogcapifLayers = this.getOGCAPIFeatures(filters);
    const wmtsLayers = this.getWMTS(filters);
    const mvtLayers = this.getMVT(filters);
    const mbtilesLayers = this.getMBTiles(filters);
    const mbtilesVectorLayers = this.getMBTilesVector(filters);
    const xyzLayers = this.getXYZs(filters);
    const tmsLayers = this.getTMS(filters);
    const layersGroup = this.getLayerGroups(filters);
    const unknowLayers = this.getUnknowLayers_(filters);

    return kmlLayers.concat(wmsLayers)
      .concat(geotiffLayers)
      .concat(mapLibreLayers)
      .concat(wfsLayers)
      .concat(ogcapifLayers)
      .concat(wmtsLayers)
      .concat(mvtLayers)
      .concat(mbtilesLayers)
      .concat(mbtilesVectorLayers)
      .concat(xyzLayers)
      .concat(tmsLayers)
      .concat(layersGroup)
      .concat(unknowLayers);
  }

  /**
   * Este método obtiene las capas base del mapa.
   *
   * @function
   * @returns {Array<M.Layer>} Capas base del mapa.
   * @public
   * @api
   */
  getBaseLayers() {
    return this.layers_.filter((layer) => layer.transparent === false);
  }

  /**
   * Este método añade las capas especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<M.Layer>} layers Capas a añadir.
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
      } else if (layer.type === LayerType.GeoTIFF) {
        this.facadeMap_.addGeoTIFF(layer);
      } else if (layer.type === LayerType.OGCAPIFeatures) {
        this.facadeMap_.addOGCAPIFeatures(layer);
      } else if (layer.type === LayerType.MVT) {
        this.facadeMap_.addMVT(layer);
      } else if (layer.type === LayerType.MapLibre) {
        this.facadeMap_.addMapLibre(layer);
      } else if (layer.type === 'MBTiles') {
        this.facadeMap_.addMBTiles(layer);
      } else if (layer.type === 'MBTilesVector') {
        this.facadeMap_.addMBTilesVector(layer);
      } else if (layer.type === LayerType.XYZ) {
        this.facadeMap_.addXYZ(layer);
      } else if (layer.type === LayerType.TMS) {
        this.facadeMap_.addTMS(layer);
      } else if (layer.type === LayerType.LayerGroup) {
        this.facadeMap_.addLayerGroups(layer);
      } else if (!LayerType.know(layer.type)) {
        this.addUnknowLayers_([layer]);
        // eslint-disable-next-line no-underscore-dangle
        this.facadeMap_.addUnknowLayers_(layer);
      }
    });

    return this;
  }

  addToLayers_(layers) {
    let existsBaseLayer = null;

    layers.forEach((layer) => {
      if (!includes(this.layers_, layer)) {
        layer.getImpl().addTo(this.facadeMap_);
        this.layers_.push(layer);

        existsBaseLayer = this.addZIndex_(layer);
      }
    });

    if (!existsBaseLayer) {
      this.updateResolutionsFromBaseLayer();
    }
  }

  addToLayersCalcResolutions_(layers) {
    let existsBaseLayer = null;

    const addedLayers = [];
    layers.forEach((layer) => {
      if (!includes(this.layers_, layer)) {
        layer.getImpl().addTo(this.facadeMap_);
        this.layers_.push(layer);
        addedLayers.push(layer);

        existsBaseLayer = this.addZIndex_(layer);
      }
    });
    // calculate resolutions if layers were added and there is not any base layer
    // or if some base layer was added
    const calculateResolutions = (addedLayers.length > 0 && !existsBaseLayer)
      || addedLayers.some((l) => l.transparent !== true && l.isVisible());
    if (calculateResolutions) {
      this.updateResolutionsFromBaseLayer();
    }
  }

  addZIndex_(layer) {
    // cehcks if exists a base layer
    const baseLayers = this.getBaseLayers();
    const existsBaseLayer = (baseLayers.length > 1);

    /* if the layer is a base layer
     then sets its visibility */
    if (layer.transparent === false) {
      layer.setVisible(!existsBaseLayer);
      layer.setZIndex(Map.Z_INDEX_BASELAYER);
    } else if (layer.getZIndex() == null) {
      // let zIndex = this.getLengthZIndex_() + Map.Z_INDEX[LayerType[layer.type]];
      let zIndex = this.getMaxZIndex_(Map.Z_INDEX[LayerType[layer.type]]) + 1;
      if (layer.getImpl() instanceof LayerGroup) {
        zIndex += layer.getImpl().getTotalLayers();
      }
      layer.setZIndex(zIndex);
    } else {
      layer.setZIndex(layer.getZIndex());
    }

    return existsBaseLayer;
  }

  /**
   * Este método elimina las capas del mapa.
   *
   * @function
   * @param {Array<M.Layer>} layers Capas a eliminar.
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
      this.removeGeoTIFF(knowLayers);
      this.removeMapLibre(knowLayers);
      this.removeWFS(knowLayers);
      this.removeOGCAPIFeatures(knowLayers);
      this.removeWMTS(knowLayers);
      this.removeMVT(knowLayers);
      this.removeMBTiles(knowLayers);
      this.removeMBTilesVector(knowLayers);
      this.removeXYZ(knowLayers);
      this.removeTMS(knowLayers);
      this.removeLayerGroups(knowLayers);
    }

    if (unknowLayers.length > 0) {
      this.removeUnknowLayers_(unknowLayers);
    }

    this.facadeMap_.fire(EventType.REMOVED_LAYER, [layers]);

    return this;
  }

  /**
   * Devuelve el total de capas en el mapa y en los grupos de capas.
   *
   * Método privado.
   *
   * @public
   * @function
   * @returns {Number} Suma de capas en el mapa y en los grupos de capas.
   * @api stable
   */
  getLengthZIndex_() {
    const layersGroup = this.getAllLayerInGroup().length;
    const layers = this.layers_.length;
    return layersGroup + layers;
  }

  /**
   * Devuelve el máximo zIndex de las capas del mapa.
   *
   * Método privado.
   *
   * @public
   * @function
   * @returns {Number} zIndex máximo.
   * @api stable
   */
  getMaxZIndex_(initValue) {
    const layers = this.facadeMap_.getLayers();
    const maxZIndex = layers.map((l) => l.getZIndex()).filter((z) => z < 1000).reduce(
      (a, b) => {
        if (a > b) {
          return a;
        }
        return b;
      },
      initValue,
    );
    return maxZIndex;
  }

  /**
   * Este método devuelve los grupos de capas del mapa.
   *
   * @public
   * @function
   * @returns {Array<M.layer.Group>} layers from the map
   * @api stable
   */
  getLayerGroups(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;
    const groupLayers = this.layers_.filter((layer) => layer.type === LayerType.LayerGroup);

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = groupLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredGroupLayers = groupLayers.filter((groupLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(groupLayer)) {
            // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === groupLayer.type));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === groupLayer.name));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredGroupLayers);
      });
    }
    return foundLayers;
  }

  /**
     * Devuelve todos los grupos.
     *
     * @public
     * @function
     * @returns {Array<M.Layer>} Grupos.
     * @api stable
     */
  getGroupedLayers() {
    const groupedLayers = [];
    const groups = this.getLayerGroups();
    groupedLayers.push(...groups);

    // recursividad y añadir intance layerGroup en groupedLayers
    const getLayersFromGroup = (group) => {
      group.getLayers().forEach((layer) => {
        if (layer.type === LayerType.LayerGroup) {
          groupedLayers.push(layer);
          getLayersFromGroup(layer);
        }
      });
    };

    groups.forEach((group) => {
      getLayersFromGroup(group);
    });

    return groupedLayers;
  }

  /**
     * Devuelve todas las capas de los grupos de capas.
     *
     * @public
     * @function
     * @returns {Array<M.Layer>} Capas.
     * @api stable
     */
  getAllLayerInGroup() {
    const layers = [];
    const groups = this.getGroupedLayers();
    groups.forEach((group) => {
      group.getLayers().forEach((layer) => {
        if (layer.type !== LayerType.LayerGroup) {
          layers.push(layer);
        }
      });
    });
    return layers;
  }

  /**
     * Añade los grupos de capas al mapa.
     *
     * @public
     * @function
     * @param {Array<M.layer.Group>} layers Capas.
     * @returns {M.impl.Map}
     */
  addLayerGroups(groups = []) {
    this.addToLayers_(groups);
    return this;
  }

  /**
     * Elimina los grupos de capas del mapa.
     *
     * @function
     * @param {Array<M.layer.Group>} layers Elimina esta capa
     * @returns {M.impl.Map}
     * @api stable
     */
  removeLayerGroups(layers) {
    const layerGroupMapLayers = this.getLayerGroups(layers);
    layerGroupMapLayers.forEach((layerGroup) => {
      layerGroup.fire(EventType.REMOVED_FROM_MAP, [layerGroup]);
      this.layers_ = this.layers_.filter((layer) => !layerGroup.equals(layer));
      layerGroup.getImpl().destroy();
    });

    return this;
  }

  /**
   * Este método obtiene las capas KML añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.KML>} Capas KML del mapa.
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
   * @param {Array<M.layer.KML>} layers Capas KML a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addKML(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas KML del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.KML>} layers Capas KML a eliminar.
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
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
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
    this.addToLayersCalcResolutions_(layers);
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
      wmsLayer.fire(EventType.REMOVED_FROM_MAP, [wmsLayer]);
      this.layers_ = this.layers_.filter((layer) => !wmsLayer.equals(layer));
      wmsLayer.getImpl().destroy();
    });

    return this;
  }

  /**
   * Este método obtiene las capas GeoJSON añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.GeoJSON>} Capas GeoJSON del mapa.
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
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.WFS>} Capas WFS del mapa.
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
   * @param {Array<M.layer.WFS>} layers Capas WFS a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addWFS(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas WFS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.WFS>} layers Capas WFS a eliminar.
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
   * Este método obtiene las capas GeoTIFF añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.GeoTIFF>} Capas GeoTIFF del mapa.
   * @public
   * @api
   */
  getGeoTIFF(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    // get all geotiffLayers
    const geotiffLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.GeoTIFF);
    });

    // parse to Array
    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = geotiffLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredGeoTIFFLayers = geotiffLayers.filter((geotiffLayer) => {
          let layerMatched = true;
          // checks if the layer is not in selected layers
          if (!foundLayers.includes(geotiffLayer)) {
          // type
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === geotiffLayer.type));
            }
            // URL
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === geotiffLayer.url));
            }
            // name
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === geotiffLayer.name));
            }
            // namespace
            if (!isNullOrEmpty(filterLayer.namespace)) {
              layerMatched = (layerMatched && (filterLayer.namespace === geotiffLayer.namespace));
            }
            // legend
            if (!isNullOrEmpty(filterLayer.legend)) {
              layerMatched = (layerMatched && (filterLayer.legend === geotiffLayer.legend));
            }
            // cql
            if (!isNullOrEmpty(filterLayer.cql)) {
              layerMatched = (layerMatched && (filterLayer.cql === geotiffLayer.cql));
            }
            // geometry
            if (!isNullOrEmpty(filterLayer.geometry)) {
              layerMatched = (layerMatched && (filterLayer.geometry === geotiffLayer.geometry));
            }
            // ids
            if (!isNullOrEmpty(filterLayer.ids)) {
              layerMatched = (layerMatched && (filterLayer.ids === geotiffLayer.ids));
            }
            // version
            if (!isNullOrEmpty(filterLayer.version)) {
              layerMatched = (layerMatched && (filterLayer.version === geotiffLayer.version));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredGeoTIFFLayers);
      });
    }
    return foundLayers;
  }

  /**
 * Este método añade las capas WFS especificadas por el usuario al mapa.
 *
 * @function
 * @param {Array<M.layer.WFS>} layers Capas WFS a añadir.
 * @returns {Map} Mapa.
 * @public
 * @api
 */
  addGeoTIFF(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
 * Este método elimina las capas GeoTIFF del mapa especificadas por el usuario.
 *
 * @function
 * @param {Array<M.layer.GeoTIFF>} layers Capas GeoTIFF a eliminar.
 * @returns {Map} Mapa.
 * @public
 * @api
 */
  removeGeoTIFF(layers) {
    const geotiffMapLayers = this.getGeoTIFF(layers);
    geotiffMapLayers.forEach((geotiffLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(geotiffLayer));
      geotiffLayer.getImpl().destroy();
      geotiffLayer.fire(EventType.REMOVED_FROM_MAP, [geotiffLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas OGCAPIFeatures añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.OGCAPIFeatures>} Capas OGCAPIFeatures del mapa.
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
   * @param {Array<M.layer.OGCAPIFeatures>} layers Capas OGCAPIFeatures a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addOGCAPIFeatures(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas OGCAPIFeatures del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.OGCAPIFeatures>} layers Capas OGCAPIFeatures a eliminar.
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
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.WMTS>} Capas WMTS del mapa.
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
   * @param {Array<M.layer.WMTS>} layers Capas WMTS a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addWMTS(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas WMTS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.WMTS>} layers Capas WMTS a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeWMTS(layers) {
    const wmtsMapLayers = this.getWMTS(layers);
    wmtsMapLayers.forEach((wmtsLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(wmtsLayer));
      wmtsLayer.getImpl().destroy();
      wmtsLayer.fire(EventType.REMOVED_FROM_MAP, [wmtsLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene las capas MBTiles añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filtersParam Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.MBTiles>} Capas MBTiles del mapa.
   * @public
   * @api
   */
  getMBTiles(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const allLayers = this.layers_;
    const mbtilesLayers = allLayers.filter((layer) => {
      return (layer.type === 'MBTiles');
    });

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
   * @param {Array<M.layer.MBTiles>} layers Capas MBTiles a añadir al mapa.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addMBTiles(layers) {
    this.addToLayersCalcResolutions_(layers);
    return this;
  }

  /**
   * Este método elimina las capas MBTiles del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.MBTiles>} layers Capas MBTiles a eliminar.
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
   * Este método obtiene las capas MBTilesVector añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filtersParam Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.MBTilesVector>} Capas MBTilesVector del mapa.
   * @public
   * @api
   */
  getMBTilesVector(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;
    const allLayers = this.layers_;
    const mbtilesLayers = allLayers.filter((layer) => {
      return (layer.type === 'MBTilesVector');
    });
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
   * Este método añade las capas MBTilesVector especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<M.layer.MBTilesVector>} layers Capas MBTilesVector a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addMBTilesVector(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas MBTilesVector del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.MBTilesVector>} layers Capas MBTilesVector a eliminar.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  removeMBTilesVector(layers) {
    const mbtilesMapLayers = this.getMBTilesVector(layers);
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
   * @param {Array<M.Layer>} filters Filtros a aplicar en la búsqueda.
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
    this.addToLayers_(layers);
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
        if (layer.transparent === false) {
          // it was base layer so sets the visibility of the first one
          const baseLayers = this.facadeMap_.getBaseLayers();
          if (baseLayers.length > 0) {
            baseLayers[0].setVisible(true);
          }
        }
      }
    });
  }

  /**
   * Este método obtiene las capas MVT del mapa.
   *
   * @function
   * @param {Array<M.Layer>} filtersParam Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.MVT>} Capas MVT del mapa.
   * @public
   * @api
   */
  getMVT(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const MVTLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.MVT);
    });

    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = MVTLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredMVTLayers = MVTLayers.filter((mvtLayer) => {
          let layerMatched = true;
          if (!foundLayers.includes(mvtLayer)) {
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === mvtLayer.type));
            }
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === mvtLayer.url));
            }
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === mvtLayer.name));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredMVTLayers);
      });
    }
    return foundLayers;
  }

  /**
   * Este método elimina las capas MVT del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.MVT>} layers Capas MVT a eliminar.
   * @returns {M.impl.Map} Mapa.
   * @public
   * @api
   */
  removeMVT(layers) {
    const mvtLayers = this.getMVT(layers);
    mvtLayers.forEach((mvtLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(mvtLayer));
      mvtLayer.getImpl().destroy();
      mvtLayer.fire(EventType.REMOVED_FROM_MAP, [mvtLayer]);
    });

    return this;
  }

  /**
   * Este método añade las capas MVT especificadas por el usuario al mapa.
   *
   * @function
   * @param {Array<M.layer.MVT>} layers Capas MVT a añadir.
   * @returns {M.impl.Map} Mapa.
   * @public
   * @api
   */
  addMVT(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método obtiene las capas MapLibre del mapa.
   *
   * @function
   * @param {Array<M.Layer>} filtersParam Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.MapLibre>} Capas MapLibre del mapa.
   * @public
   * @api
   */
  getMapLibre(filtersParam) {
    let foundLayers = [];
    let filters = filtersParam;

    const MapLibreLayers = this.layers_.filter((layer) => {
      return (layer.type === LayerType.MapLibre);
    });

    if (isNullOrEmpty(filters)) {
      filters = [];
    }
    if (!isArray(filters)) {
      filters = [filters];
    }

    if (filters.length === 0) {
      foundLayers = MapLibreLayers;
    } else {
      filters.forEach((filterLayer) => {
        const filteredMapLibreLayers = MapLibreLayers.filter((mapLibreLayer) => {
          let layerMatched = true;
          if (!foundLayers.includes(mapLibreLayer)) {
            if (!isNullOrEmpty(filterLayer.type)) {
              layerMatched = (layerMatched && (filterLayer.type === mapLibreLayer.type));
            }
            if (!isNullOrEmpty(filterLayer.url)) {
              layerMatched = (layerMatched && (filterLayer.url === mapLibreLayer.url));
            }
            if (!isNullOrEmpty(filterLayer.name)) {
              layerMatched = (layerMatched && (filterLayer.name === mapLibreLayer.name));
            }
          } else {
            layerMatched = false;
          }
          return layerMatched;
        });
        foundLayers = foundLayers.concat(filteredMapLibreLayers);
      });
    }
    return foundLayers;
  }

  /**
     * Este método elimina las capas MapLibre del mapa especificadas por el usuario.
     *
     * @function
     * @param {Array<M.layer.MapLibre>} layers Capas MapLibre a eliminar.
     * @returns {M.impl.Map} Mapa.
     * @public
     * @api
     */
  removeMapLibre(layers) {
    const mapLibreLayers = this.getMapLibre(layers);
    mapLibreLayers.forEach((mapLibreLayer) => {
      this.layers_ = this.layers_.filter((layer) => !layer.equals(mapLibreLayer));
      mapLibreLayer.getImpl().destroy();
      mapLibreLayer.fire(EventType.REMOVED_FROM_MAP, [mapLibreLayer]);
    });

    return this;
  }

  /**
     * Este método añade las capas MapLibre especificadas por el usuario al mapa.
     *
     * @function
     * @param {Array<M.layer.MapLibre>} layers Capas MapLibre a añadir.
     * @returns {M.impl.Map} Mapa.
     * @public
     * @api
     */
  addMapLibre(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método obtiene las capas XYZ añadidas al mapa.
   *
   * @function
   * @param {Array<M.Layer>} filters Filtros a aplicar para la búsqueda.
   * @returns {Array<M.layer.XYZ>} Capas XYZ del mapa.
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
   * @param {Array<M.layer.XYZ>} layers Capas XYZ a añadir.
   * @returns {M.impl.Map} Mapa.
   * @public
   * @api
   */
  addXYZ(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas XYZ del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.XYZ>} layers Capas XYZ a eliminar.
   * @returns {M.impl.Map} Mapa.
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
   * @param {Array<M.Layer>} filters Filtros para aplicar en la búsqueda.
   * @returns {Array<M.layer.TMS>} Capas TMS del mapa.
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
   * @param {Array<M.layer.TMS>} layers Capas TMS a añadir.
   * @returns {M.impl.Map} Mapa.
   * @public
   * @api
   */
  addTMS(layers) {
    this.addToLayers_(layers);
    return this;
  }

  /**
   * Este método elimina las capas TMS del mapa especificadas por el usuario.
   *
   * @function
   * @param {Array<M.layer.TMS>} layers Capas TMS a eliminar.
   * @returns {M.impl.Map} Mapa.
   * @public
   * @api
   */
  removeTMS(layers) {
    const tmsMapLayers = this.getTMS(layers);
    tmsMapLayers.forEach((tmsLayer) => {
      tmsLayer.getImpl().destroy();
      this.layers_ = this.layers_.filter((layer) => !layer.equals(tmsLayer));
      tmsLayer.fire(EventType.REMOVED_FROM_MAP, [tmsLayer]);
    });

    return this;
  }

  /**
   * Este método obtiene los controles especificados por el usuario.
   *
   * @function
   * @param {string|Array<String>} filters Filtros.
   * @returns {Array<M.Control>} Controles.
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
   * @param {M.Control} controls Controles a añadir.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  addControls(controls) {
    controls.forEach((control) => {
      if (control instanceof FacadePanzoombar) {
        this.facadeMap_.addControls(M.config.controls.default.split(','));
      }
      if (!includes(this.controls_, control)) {
        this.controls_.push(control);
      }
    });

    return this;
  }

  /**
   * Este método elimina los controles del mapa especificados por el usuario.
   *
   * @function
   * @param {M.Control} controls Controles a eliminar.
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
    let olExtent = maxExtent;

    if (!isNullOrEmpty(olExtent) && !isArray(olExtent) && isObject(olExtent)) {
      olExtent = [maxExtent.x.min, maxExtent.y.min, maxExtent.x.max, maxExtent.y.max];
    }

    const olMap = this.getMapImpl();

    const view = olMap.getView();
    const newView = new View({ ...view, ...view.getProperties(), extent: maxExtent });
    olMap.setView(newView);

    this.updateResolutionsFromBaseLayer();

    if (!isNullOrEmpty(olExtent) && (zoomToExtent !== false)) {
      this.setBbox(olExtent);
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
    let extent;
    const olMap = this.getMapImpl();
    const olExtent = olMap.getView().get('extent');

    if (!isNullOrEmpty(olExtent)) {
      extent = {
        x: {
          min: olExtent[0],
          max: olExtent[2],
        },
        y: {
          min: olExtent[1],
          max: olExtent[3],
        },
      };
    } else {
      extent = this.envolvedMaxExtent_;
    }

    return extent;
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
    const parser = (type === 'WMS') ? new FormatWMS() : new OLFormatWMTSCapabilities();
    const parsedCapabilities = (type === 'WMS') ? await parser.customRead(getCapabilitiesDocument) : await parser.read(getCapabilitiesDocument);

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
            const layerText = response.text.split('Layer>').find((text) => text.indexOf(`Identifier>${name}<`) > -1);
            // eslint-disable-next-line no-param-reassign
            s.LegendURL = layerText.split('LegendURL')[1].split('xlink:href="')[1].split('"')[0];
          });
        });
      } catch (err) { /* Continue */ }
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

    // set the extent by ol
    let extent;
    if (isArray(bbox)) {
      extent = bbox;
    } else if (isObject(bbox)) {
      extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    }
    const olMap = this.getMapImpl();
    olMap.getView().fit(extent, vendorOpts);

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

    const olMap = this.getMapImpl();
    const view = olMap.getView();
    if (!isNullOrEmpty(view.getCenter())) {
      const olExtent = view.calculateExtent(olMap.getSize());

      if (!isNullOrEmpty(olExtent)) {
        bbox = {
          x: {
            min: olExtent[0],
            max: olExtent[2],
          },
          y: {
            min: olExtent[1],
            max: olExtent[3],
          },
        };
      }
    }
    return bbox;
  }

  /**
   * Este método establece el actual zoom de la
   * instancia del mapa.
   *
   * @function
   * @param {Number} zoom Nuevo zoom del mapa.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setZoom(zoom) {
    // checks if the param is null or empty
    if (isNullOrEmpty(zoom)) {
      Exception(getValue('exception').no_zoom);
    }

    // set the zoom by ol
    this.getMapImpl().getView().setUserZoom(zoom);
    return this;
  }

  /**
   * Este método establece el mínimo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Number} zoom Nuevo mínimo zoom del mapa.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setMinZoom(zoom) {
    if (isNullOrEmpty(zoom)) {
      Exception(getValue('exception').no_zoom);
    }

    this.getMapImpl().getView().setMinZoom(zoom);
    return this;
  }

  /**
   * Este método establece el máximo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @param {Number} zoom Nuevo máximo zoom del mapa.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setMaxZoom(zoom) {
    if (isNullOrEmpty(zoom)) {
      Exception(getValue('exception').no_zoom);
    }

    this.getMapImpl().getView().setMaxZoom(zoom);
    return this;
  }

  /**
   * Este método obtiene el zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @returns {Number} Zoom del mapa.
   * @public
   * @api
   */
  getZoom() {
    let zoom = null;
    const olView = this.getMapImpl().getView();
    const resolution = olView.getResolution();
    const resolutions = this.getResolutions();
    if (!isNullOrEmpty(resolutions)) {
      for (let i = 0, ilen = resolutions.length; i < ilen; i += 1) {
        if (resolutions[i] <= resolution) {
          zoom = i;
          break;
        }
      }
    } else if (!isNullOrEmpty(resolution)) {
      zoom = olView.getZoomForResolution(resolution);
    }
    return zoom;
  }

  /**
   * Este método obtiene el mínimo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @returns {Number} Mínimo zoom del mapa.
   * @public
   * @api
   */
  getMinZoom() {
    let minZoom;
    if (this.getMapImpl() && this.getMapImpl().getView()) {
      minZoom = this.getMapImpl().getView().getMinZoom();
    }
    return minZoom;
  }

  /**
   * Este método obtiene el máximo zoom actual de la
   * instancia del mapa.
   *
   * @function
   * @returns {Number} Máximo zoom del mapa.
   * @public
   * @api
   */
  getMaxZoom() {
    let maxZoom;
    if (this.getMapImpl() && this.getMapImpl().getView()) {
      maxZoom = this.getMapImpl().getView().getMaxZoom();
    }
    return maxZoom;
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

    // set the zoom by ol
    const olCenter = [center.x, center.y];
    const olView = this.getMapImpl().getView();
    const srcCenter = olView.getCenter();
    if (!isNullOrEmpty(srcCenter)) {
      this.getMapImpl().getView().animate({ duration: 250, source: srcCenter });
    }
    olView.setCenter(olCenter);
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
    const olCenter = this.getMapImpl().getView().getCenter();
    if (!isNullOrEmpty(olCenter)) {
      center = {
        x: olCenter[0],
        y: olCenter[1],
      };
    }
    return center;
  }

  /**
   * Este método establece el estado de zoomConstrains
   * instancia del mapa.
   *
   * @function
   * @param {Boolean} zoomConstrains Nuevo valor.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setZoomConstrains(zoomConstrains) {
    if (isNullOrEmpty(zoomConstrains)) {
      Exception(getValue('exception').no_zoomConstrains);
    }
    this.getMapImpl().getView().setConstrainResolution(zoomConstrains);
    return this;
  }

  /**
   * Este método obtiene el estado actual de
   * zoomConstrains de la instancia del mapa.
   *
   * @function
   * @returns {Boolean} Valor actual.
   * @public
   * @api
   */
  getZoomConstrains() {
    const olConstrainResolution = this.getMapImpl().getView().getConstrainResolution();
    return olConstrainResolution;
  }

  /**
   * Este método obtiene las resoluciones actuales
   * para la instancia del mapa.
   *
   * @function
   * @returns {Array<Number>} Resoluciones del mapa.
   * @public
   * @api
   */
  getResolutions() {
    const olMap = this.getMapImpl();
    const resolutions = olMap.getView().getResolutions();

    return resolutions;
  }

  /**
   * Este método establece las resoluciones actuales
   * para la instancia del mapa.
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

    if (isNullOrEmpty(optional)) {
      this.userResolutions_ = resolutions;
    }

    // gets the projection
    const projection = getProj(this.getProjection().code);

    // sets the resolutions
    const olMap = this.getMapImpl();
    const oldViewProperties = olMap.getView().getProperties();
    const oldZoom = olMap.getView().getUserZoom();
    const minZoom = olMap.getView().getMinZoom();
    const maxZoom = olMap.getView().getMaxZoom();
    const size = olMap.getSize();

    const newView = new View((this.viewExtent !== undefined && this.viewExtent.length === 4)
      ? { ...this.objectView, projection, extent: this.viewExtent }
      : { ...this.objectView, projection });

    newView.setProperties(oldViewProperties);
    newView.setResolutions(resolutions);
    newView.setUserZoom(oldZoom);
    newView.setMinZoom(minZoom);
    newView.setMaxZoom(maxZoom);
    // newView.setConstrainResolution(false);
    // calculates the new resolution
    let newResolution;
    if (!isNullOrEmpty(oldZoom)) {
      newResolution = resolutions[oldZoom];
    } else {
      const bbox = this.facadeMap_.getBbox();
      if (!isNullOrEmpty(bbox)) {
        const oldResolution = newView.getResolutionForExtent([
          bbox.x.min,
          bbox.y.min,
          bbox.x.max,
          bbox.y.max,
        ], size);
        const restDiff = resolutions.map((r) => Math.abs(r - oldResolution));
        const newResolutionIdx = restDiff.indexOf(Math.min(...restDiff));
        newResolution = resolutions[newResolutionIdx];
      }
    }
    newView.setResolution(newResolution);

    olMap.setView(newView);

    // sets the resolutions for each layer
    const layers = this.getWMS();
    layers.forEach((layer) => {
      layer.getImpl().setResolutions(resolutions);
    });

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
    const olMap = this.getMapImpl();

    const resolution = olMap.getView().getResolution();
    const units = this.getProjection().units;

    let scale = getScaleFromResolution(resolution, units);

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
    const olMap = this.getMapImpl();

    const resolution = olMap.getView().getResolution();
    const units = this.getProjection().units;

    const scale = getScaleFromResolution(resolution, units);

    return Math.trunc(scale);
  }

  /**
   * Este método establece la proyección actual para la
   * instancia del mapa.
   *
   * @function
   * @param {Mx.Projection} bbox Bbox.
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  setProjection(projection) {
    // checks if the param is null or empty
    if (isNullOrEmpty(projection)) {
      Exception(getValue('exception').no_projection);
    }

    // gets the current view and modifies its projection
    let olProjection = getProj(projection.code);
    if (isNullOrEmpty(olProjection)) {
      olProjection = new OLProjection(projection);
    }

    // gets previous data
    const olPrevProjection = getProj(this.getProjection().code);
    // let prevBbox = this.facadeMap_.getBbox();
    // const prevZoom = this.facadeMap_.getZoom();
    let prevMaxExtent = this.facadeMap_.getMaxExtent();
    const resolutions = this.facadeMap_.getResolutions();

    const olMap = this.getMapImpl();
    const oldViewProperties = olMap.getView().getProperties();
    const resolution = olMap.getView().getResolution();
    const userZoom = olMap.getView().getUserZoom();
    const minZoom = olMap.getView().getMinZoom();
    const maxZoom = olMap.getView().getMaxZoom();

    // sets the new view
    const newView = new View((this.viewExtent !== undefined && this.viewExtent.length === 4)
      ? { ...this.objectView, projection: olProjection, extent: this.viewExtent }
      : { ...this.objectView, projection: olProjection });

    newView.setProperties(oldViewProperties);
    if (!isNullOrEmpty(resolutions)) {
      newView.setResolutions(resolutions);
    }
    if (!isNullOrEmpty(resolution)) {
      newView.setResolution(resolution);
    }
    newView.setUserZoom(userZoom);
    newView.setMinZoom(minZoom);
    newView.setMaxZoom(maxZoom);
    // newView.setConstrainResolution(false);
    olMap.setView(newView);

    // updates min, max resolutions of all WMS layers
    this.facadeMap_.getWMS().forEach((layer) => {
      layer.updateMinMaxResolution(projection);
    });

    // recalculates maxExtent
    if (!isNullOrEmpty(prevMaxExtent)) {
      if (!isArray(prevMaxExtent)) {
        prevMaxExtent = [
          prevMaxExtent.x.min, prevMaxExtent.y.min,
          prevMaxExtent.x.max, prevMaxExtent.y.max,
        ];
      }
      this.setBbox(ImplUtils
        .transformExtent(prevMaxExtent, olPrevProjection, olProjection), false);
    }

    // recalculates resolutions
    this.updateResolutionsFromBaseLayer();

    // reprojects popup
    const popup = this.facadeMap_.getPopup();
    if (!isNullOrEmpty(popup)) {
      let coord = popup.getCoordinate();
      if (!isNullOrEmpty(coord)) {
        coord = transform(coord, olPrevProjection, olProjection);
        popup.setCoordinate(coord);
      }
    }

    // reprojects label
    const label = this.facadeMap_.getLabel();
    if (!isNullOrEmpty(label)) {
      let coord = label.getCoordinate();
      if (!isNullOrEmpty(coord)) {
        coord = transform(coord, olPrevProjection, olProjection);
        label.setCoordinate(coord);
      }
    }

    this.fire(EventType.CHANGE);

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
    const olMap = this.getMapImpl();
    const olProjection = olMap.getView().getProjection();

    let projection = null;

    if (!isNullOrEmpty(olProjection)) {
      projection = {
        code: olProjection.getCode(),
        units: olProjection.getUnits(),
        getExtent: () => olProjection.getExtent(),
      };
    }
    return projection;
  }

  /**
   * Este método obtiene la implementación del mapa.
   *
   * @function
   * @returns {ol.Map} Implementación del mapa.
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
   * @param {M.impl.Popup} popup "Popup" a eliminar.
   * @returns {ol.Map} Mapa.
   * @public
   * @api
   */
  removePopup(popup) {
    if (!isNullOrEmpty(popup)) {
      const olPopup = popup.getImpl();
      const olMap = this.getMapImpl();
      olMap.removeOverlay(olPopup);
    }
    return this;
  }

  /**
   * Este método destruye el mapa, limpiando el HTML y
   * anulando el registro de todos los eventos.
   *
   * @function
   * @public
   * @api
   */
  destroy() {
    this.layers_.length = 0;
    this.controls_.length = 0;

    this.popup_ = null;
    this.options_ = null;

    this.map_.setTarget(null);
    this.map_ = null;
  }

  /**
   * Actualiza las resoluciones de este mapa calculadas
   * a partir de las capas base.
   *
   * @function
   * @returns {M.Map} Mapa
   * @public
   * @api
   */
  updateResolutionsFromBaseLayer() {
    // FIXME:
    // let resolutions = [];

    // // zoom levels
    // let zoomLevels = 20;

    // // units
    // const units = this.getProjection().units;

    // // size
    // const size = this.getMapImpl().getSize();

    // const baseLayer = this.getBaseLayers().filter((bl) => {
    //   return bl.isVisible();
    // })[0];

    // // gets min/max resolutions from base layer
    // let maxResolution = null;
    // let minResolution = null;
    // if (!isNullOrEmpty(baseLayer)) {
    //   minResolution = baseLayer.getImpl().getMinResolution();
    //   maxResolution = baseLayer.getImpl().getMaxResolution();
    //   zoomLevels = baseLayer.getImpl().getNumZoomLevels();
    // }

    // if (this.userResolutions_ === null) {
    //   if (!isNullOrEmpty(minResolution) && !isNullOrEmpty(maxResolution)) {
    //     resolutions = fillResolutions(minResolution, maxResolution, zoomLevels);
    //     this.setResolutions(resolutions, true);

    //     this._resolutionsBaseLayer = true;

    //     // checks if it was the first time to
    //     // calculate resolutions in that case
    //     // fires the completed event
    //     if (this._calculatedResolutions === false) {
    //       this._calculatedResolutions = true;
    //       this.fire(EventType.COMPLETED);
    //     }
    //   } else {
    //     this.facadeMap_.calculateMaxExtent().then((extent) => {
    //       if (!this._resolutionsBaseLayer && (this.userResolutions_ === null)) {
    //         resolutions = generateResolutionsFromExtent(extent, size, zoomLevels, units);
    //         this.setResolutions(resolutions, true);

    //         this._resolutionsEnvolvedExtent = true;

    //         // checks if it was the first time to
    //         // calculate resolutions in that case
    //         // fires the completed event
    //         if (this._calculatedResolutions === false) {
    //           this._calculatedResolutions = true;
    //           this.fire(EventType.COMPLETED);
    //         }
    //       }
    //     }).catch((error) => {
    //       throw error;
    //     });
    //   }
    // }
    this.fire(EventType.COMPLETED);
    this.refresh();
  }

  /**
   * Este método añade un "popup" y elimina el anterior.
   *
   * @function
   * @param {M.impl.Popup} label "Popup" a añadir.
   * @returns {ol.Map} Mapa.
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
   * @returns {ol.Map} Mapa.
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
   * @returns {ol.Map} Mapa.
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
   * Este método refresca el estado de esta instancia del mapa,
   * es decir, todas sus capas.
   *
   * @function
   * @returns {Map} Mapa.
   * @public
   * @api
   */
  refresh() {
    this.map_.updateSize();
    return this;
  }

  /**
   * Este método proporciona el mapa central utilizado
   * para la implementación.
   *
   * @function
   * @returns {Object} Mapa central utilizado para la implementación.
   * @public
   * @api
   */
  getContainer() {
    return this.map_.getOverlayContainerStopEvent();
  }

  /**
   * Este método establece la fachada del mapa a implementar.
   *
   * @function
   * @param {M.Map} facadeMap Fachada del mapa a implementar.
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
    this.map_.on('moveend', this.zoomEvent_.bind(this));
  }

  /**
   * Este método se ejecuta cuando el usuario realiza zoom.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @api
   */
  zoomEvent_() {
    if (this.currentZoom !== this.getZoom()) {
      this.facadeMap_.fire(EventType.CHANGE_ZOOM, this.facadeMap_);
      this.currentZoom = this.getZoom();
    }
  }

  /**
   * Este método se ejecuta cuando el usuario hace click en el mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {M.evt} evt Evento.
   * @public
   * @api
   */
  onMapClick_(evt) {
    const pixel = evt.pixel;
    const coord = this.map_.getCoordinateFromPixel(pixel);

    // hides the label if it was added
    const label = this.facadeMap_.getLabel();
    if (!isNullOrEmpty(label)) {
      label.hide();
    }

    this.facadeMap_.fire(EventType.CLICK, [{
      pixel,
      coord,
      vendor: evt,
    }]);
  }

  /**
   * Este método se ejecuta cuando el usuario mueve el mapa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {M.evt} evt Evento.
   * @public
   * @api
   */
  onMapMove_(evt) {
    const pixel = evt.pixel;
    const coord = this.map_.getCoordinateFromPixel(pixel);

    this.facadeMap_.fire(EventType.MOVE, [{
      pixel,
      coord,
      vendor: evt,
    }]);
  }

  /**
   * Este método se ejecuta cuando el usuario mueve el ratón.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {M.evt} evt Evento.
   * @public
   * @api
   */
  onMapMoveMouse_(evt) {
    const pixel = evt.pixel;
    const coord = this.map_.getCoordinateFromPixel(pixel);

    this.facadeMap_.fire(EventType.MOVE_MOUSE, [{
      pixel,
      coord,
      vendor: evt,
    }]);
  }
}

/**
 * Z-INDEX para las capas.
 * @const
 * @type {Object}
 * @public
 * @api
 */
Map.Z_INDEX = {};
Map.Z_INDEX_BASELAYER = 0;
Map.Z_INDEX[LayerType.OSM] = 40;
Map.Z_INDEX[LayerType.WMS] = 40;
Map.Z_INDEX[LayerType.WMTS] = 40;
Map.Z_INDEX[LayerType.KML] = 40;
Map.Z_INDEX[LayerType.WFS] = 40;
Map.Z_INDEX[LayerType.MVT] = 40;
Map.Z_INDEX[LayerType.Vector] = 40;
Map.Z_INDEX[LayerType.GeoJSON] = 40;
Map.Z_INDEX[LayerType.GeoTIFF] = 40;
Map.Z_INDEX[LayerType.MapLibre] = 40;
Map.Z_INDEX[LayerType.MBTiles] = 40;
Map.Z_INDEX[LayerType.MBTilesVector] = 40;
Map.Z_INDEX[LayerType.XYZ] = 40;
Map.Z_INDEX[LayerType.TMS] = 40;
Map.Z_INDEX[LayerType.OGCAPIFeatures] = 40;
Map.Z_INDEX[LayerType.GenericVector] = 40;
Map.Z_INDEX[LayerType.GenericRaster] = 40;
Map.Z_INDEX[LayerType.LayerGroup] = 40;

export default Map;
