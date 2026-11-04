/**
 * @module IDEE/elevation
 */

/**
 * URL del proceso que calcula el perfil topográfico.
 * @const
 * @type {String}
 */
const ELEVATION_PROFILE_PROCESS_URL = 'https://api-processes.idee.es/processes/elevationProfile/execution';

/**
 * Valor que devuelve el servicio cuando no hay datos.
 * @const
 * @type {Number}
 */
const NO_DATA_VALUE = -9999;

/**
 * @classdesc
 * Esta clase consulta altitudes al servicio de procesos de la IDEE.
 * @api
 */
class Elevation {
  /**
   * Este método obtiene el perfil topográfico de unas coordenadas.
   *
   * @function
   * @param {Array<Array<Number>>} coordinates Coordenadas [x, y] del perfil.
   * @param {Number|String} crs Código EPSG de las coordenadas (sin el prefijo "EPSG:").
   * @param {Object} [options] Opciones de la consulta.
   * @param {Number} [options.distance=1000] Distancia entre los puntos del perfil.
   * @returns {Promise<Array<Array<Number>>|undefined>} Coordenadas [x, y, altitud] del
   * perfil, o undefined si el servicio no tiene datos. Se rechaza si la consulta falla.
   * @api
   */
  static getProfile(coordinates, crs, { distance = 1000 } = {}) {
    const features = coordinates
      .map((coordinate) => `{"geometry": { "type": "Point", "coordinates": [${coordinate[0]},${coordinate[1]}] } }`)
      .join(',');
    return fetch(ELEVATION_PROFILE_PROCESS_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          crs: parseInt(crs, 10),
          distance,
          geom: `{ "type": "FeatureCollection", "features": [${features}] }`,
          withCoord: true,
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Elevation profile request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        const values = response && response.values;
        return values && values !== NO_DATA_VALUE ? values : undefined;
      });
  }
}

export default Elevation;
