/**
 * Comprueba si un punto está a la izquierda o a
 * la derecha de la línea (a,b).
 *
 * @function
 * @param {number} a punto en la línea
 * @param {number} b punto en la línea
 * @param {Cesium} o punto
 * @returns {bool} Verdadero si (a, b, o) gira en
 * sentido horario
 * @public
 * @api
 */
const clockwise = (a, b, o) => {
  return (((a[0] - o[0]) * (b[1] - o[1])) - ((a[1] - o[1]) * (b[0] - o[0])) <= 0);
};

/**
 * Calcula el cerco convexo utilizando el algoritmo
 * 'Monotone Chain' de Andrew
 *
 * @function
 * @param {Array<number>} points Array de punto
 * @returns {Array<number>} Vértices convexos del cerco
 * @public
 * @api
 */
const coordinatesConvexHull = (points) => {
  // Ordenar por coordeada "x" creciente y luego por "y"
  points.sort((a, b) => {
    return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
  });

  // Parte inferior
  const lower = [];
  for (let i = 0; i < points.length; i += 1) {
    while (
      lower.length >= 2 && clockwise(lower[lower.length - 2], lower[lower.length - 1], points[i])
    ) {
      lower.pop();
    }
    lower.push(points[i]);
  }

  // Parte superior
  const upper = [];
  for (let i = points.length - 1; i >= 0; i -= 1) {
    while (
      upper.length >= 2 && clockwise(upper[upper.length - 2], upper[upper.length - 1], points[i])
    ) {
      upper.pop();
    }
    upper.push(points[i]);
  }

  // Eliminar duplicados del inicio y fin
  lower.pop();
  upper.pop();

  return lower.concat(upper);
};

export default coordinatesConvexHull;
