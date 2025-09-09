import { transform, get } from 'ol/proj';

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
  const source = get(sourceProj);
  const dest = get(destProj);
  return transform(coordinates, source, dest);
};

export default reproject;
