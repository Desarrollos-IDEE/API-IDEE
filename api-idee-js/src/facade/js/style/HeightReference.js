/**
 * @module M/style/heightReference
 */

/**
 * Posición absoluta.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const NONE = 'NONE';

/**
 * Posición fijada al terreno y a los mosaicos 3D.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const CLAMP_TO_GROUND = 'CLAMP_TO_GROUND';

/**
 * La altura de las coordenadas es la altura sobre el
 * terreno y los mosaicos 3D.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const RELATIVE_TO_GROUND = 'RELATIVE_TO_GROUND';

/**
 * La posición está fijada al terreno.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const CLAMP_TO_TERRAIN = 'CLAMP_TO_TERRAIN';

/**
 * La altura de las coordenadas es la altura sobre el terreno.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const RELATIVE_TO_TERRAIN = 'RELATIVE_TO_TERRAIN';

/**
 * La posición está fijada a mosaicos 3D.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const CLAMP_TO_3D_TILE = 'CLAMP_TO_3D_TILE';

/**
 * La altura de las coordenadas es la altura sobre los mosaicos 3D.
 * Solo disponible para Cesium.
 * @const
 * @type {string}
 * @public
 * @api
 */
export const RELATIVE_TO_3D_TILE = 'RELATIVE_TO_3D_TILE';
