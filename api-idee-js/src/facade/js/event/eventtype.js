/**
 * @module IDEE/evt
 */

/**
 * Evento que se produce al añadir al mapa.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_TO_MAP = 'added:map';

/**
 * Evento que se produce al añadir al panel.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_TO_PANEL = 'added:panel';
/**
 * Evento que se produce al cambiar la visibilidad de la capa.
 * @public
 * @type {string}
 * @api
 */
export const LAYER_VISIBILITY_CHANGE = 'changed:layer-visibility';
/**
 * Evento que se produce al añadir a la capa.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_LAYER = 'added:layer';

/**
 * Evento que se produce al añadir KML.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_KML = 'added:kml';

/**
 * Evento que se produce al añadir WMS.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_WMS = 'added:wms';

/**
 * Evento que se produce al añadir GeoTIFF.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_GEOTIFF = 'added:geotiff';

/**
 * Evento que se produce al añadir MapLibre.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_MAPLIBRE = 'added:maplibre';

/**
 * Evento que se produce al añadir LayerGroup.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_LAYERGROUP = 'added:layergroup';

/**
 * Evento que se produce al añadir LayerGroup.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_TO_LAYERGROUP = 'added:tolayergroup';

/**
 * Evento que se produce al añadir WFS.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_WFS = 'added:wfs';

/**
 * Evento que se produce al añadir tesela vector.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_VECTOR_TILE = 'added:vectortile';

/**
 * Evento que se produce al añadir MBTiles.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_MBTILES = 'added:mbtiles';

/**
 * Evento que se produce al añadir MBTilesVector.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_MBTILES_VECTOR = 'added:mbtilesvector';

/**
 * Evento que se produce al añadir XYZ.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_XYZ = 'added:xyz';

/**
 * Evento que se produce al añadir TMS.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_TMS = 'added:tms';

/**
 * Evento que se produce al añadir QuickLayers.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_QUICK_LAYERS = 'added:quicklayers';

/**
 * Evento que se produce al añadir OGCAPIFeatures.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_OGCAPIFEATURES = 'added:ogcapifeatures';

/**
 * Evento que se produce al añadir Tiles3D.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_TILES3D = 'added:tiles3d';

/**
 * Evento que se produce al añadir Terrain.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_TERRAIN = 'added:terrain';

/**
 * Evento que se produce al eliminar layer.
 * @public
 * @type {string}
 * @api
 */
export const REMOVED_LAYER = 'removed:layer';

/**
 * Evento que se produce al eliminar mapa.
 * @public
 * @type {string}
 * @api
 */
export const REMOVED_FROM_MAP = 'removed:map';

/**
 * Evento que se produce al añadir WMTS.
 * @public
 * @type {string}
 * @api
 */
export const ADDED_WMTS = 'added:wmts';

/**
 * Evento que se produce cuando es activado.
 * @public
 * @type {string}
 * @api
 */
export const ACTIVATED = 'activated';

/**
 * Evento que se produce cuando es desactivado.
 * @public
 * @type {string}
 * @api
 */
export const DEACTIVATED = 'deactivated';

/**
 * Evento que se produce al ser mostrado.
 * @public
 * @type {string}
 * @api
 */
export const SHOW = 'show';

/**
 * Evento que se produce al ser ocultado.
 * @public
 * @type {string}
 * @api
 */
export const HIDE = 'hide';

/**
 * Evento que se produce al ser destruido.
 * @public
 * @type {string}
 * @api
 */
export const DESTROY = 'destroy';

/**
 * Evento que se produce al seleccionar un objeto geográfico.
 * @public
 * @type {string}
 * @api
 */
export const SELECT_FEATURES = 'select:features';

/**
 * Evento que se produce al deseleccionar un objeto geográfico.
 * @public
 * @type {string}
 * @api
 */
export const UNSELECT_FEATURES = 'unselect:features';

/**
 * Evento que se produce al hacer "hover" sobre un objeto geográfico.
 * @public
 * @type {string}
 * @api
 */
export const HOVER_FEATURES = 'hover:features';

/**
 * Evento que se produce al salir del "hover" sobre un objeto geográfico.
 * @public
 * @type {string}
 * @api
 */
export const LEAVE_FEATURES = 'leave:features';

/**
 * Evento que se produce al ser cargado.
 * @public
 * @type {string}
 * @api
 */
export const LOAD = 'load';

/**
 * Evento que se produce al pasar un estado completado.
 * @public
 * @type {string}
 * @api
 */
export const COMPLETED = 'completed';

/**
 * Evento que se produce cuando se ha cambiado.
 * @public
 * @type {string}
 * @api
 */
export const CHANGE = 'change';

/**
 * Evento que se produce cuando se ha cambiado una proyección.
 * @public
 * @type {string}
 * @api
 */
export const CHANGE_PROJ = 'change:proj';

/**
 * Evento que se produce cuando se ha cambiado el estilo.
 * @public
 * @type {string}
 * @api
 */
export const CHANGE_STYLE = 'change:style';

/**
 * Evento que se produce cuando se ha cambiado el zoom.
 * @public
 * @type {string}
 * @api
 */
export const CHANGE_ZOOM = 'change:zoom';

/**
 * Evento que se produce cuando se hace clic.
 * @public
 * @type {string}
 * @api
 */
export const CLICK = 'click';

/**
 * Evento que se produce cuando se mueve.
 * @public
 * @type {string}
 * @api
 */
export const MOVE = 'move';

/**
 * Evento que se produce cuando se mueve el ratón.
 * @public
 * @type {string}
 * @api
 */
export const MOVE_MOUSE = 'movemouse';

/**
 * Evento que se produce cuando se completa la asignación de estilos a un objeto geográfico.
 * @public
 * @type {string}
 * @api
 */
export const COMPLETED_CHANGE_STYLE_FEATURE = 'changestylefeature';

/**
 * Evento que se produce cuando se completa la carga de una capa terreno.
 * @public
 * @type {string}
 * @api
 */
export const LOAD_TERRAIN = 'LOAD_TERRAIN';

/**
 * Evento que se produce cuando se completa la carga de una capa GenericVector.
 * @public
 * @type {string}
 * @api
 */
export const LOAD_GENERIC_VECTOR = 'LOAD_GENERIC_VECTOR';

/**
 * Evento que se produce cuando se añade un popup.
 * @public
 * @type {string}
 * @api
 */
export const POPUP_ADDED = 'popup:added';

/**
 * Evento que se produce cuando se elimina un popup.
 * @public
 * @type {string}
 * @api
 */
export const POPUP_REMOVED = 'popup:removed';

/**
 * Evento que se produce cuando se añade una ventana a un popup.
 * @public
 * @type {string}
 * @api
 */
export const POPUP_ADDED_TAB = 'popup:addtabed';

/**
 * Evento que se produce cuando se elimina una ventana de un popup.
 * @public
 * @type {string}
 * @api
 */
export const POPUP_REMOVED_TAB = 'popup:removedtab';

/**
 * Evento que se produce cuando se cambia la rotación del mapa.
 * @public
 * @type {string}
 * @api
 */
export const CHANGE_ROTATION = 'change:rotation';
