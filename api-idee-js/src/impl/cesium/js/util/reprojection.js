import proj4 from 'proj4';

/**
 * Esta función reproyecta coordenadas de un sistema de referencia a otro.
 *
 * @public
 * @function
 * @param {Array<number>} coordinates Coordenadas a reproyectar.
 * @param {string} sourceProj Identificador del sistema de referencia de origen.
 * @param {string} destProj Identificador del sistema de referencia de destino.
 * @returns {Array<number>} Coordenadas reproyectadas.
 * @api
 */
const reproject = (coordinates, sourceProj, destProj) => {
  return proj4(sourceProj, destProj, coordinates);
};

export default reproject;
