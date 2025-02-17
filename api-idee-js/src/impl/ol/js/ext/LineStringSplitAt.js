import OLGeomLineString from 'ol/geom/LineString';
import { olCoordinateEqual } from './GeomUtils';

/**
 * Divida una cadena de línea por un punto o una lista de puntos
 * NB: los puntos deben estar en la línea, use "getClosestPoint()"" para obtener uno.
 * @function
 * @param {ol.Coordinate | Array<ol.Coordinate>} pt Puntos para dividir la línea.
 * @param {Number} tol Tolerancia de distancia para que 2 puntos sean iguales.
 * @return {Array<OLGeomLineString>} Lista de líneas.
 */
OLGeomLineString.prototype.splitAt = (pt, tol) => {
  let i;
  let tolAux = tol;
  if (!pt) return [this];
  if (!tol) tolAux = 1e-10;
  // Test if list of points
  if (pt.length && pt[0].length) {
    let result = [this];
    for (i = 0; i < pt.length; i += 1) {
      let r = [];
      for (let k = 0; k < result.length; k += 1) {
        const ri = result[k].splitAt(pt[i], tolAux);
        r = r.concat(ri);
      }
      result = r;
    }
    return result;
  }
  // Nothing to do
  if (olCoordinateEqual(pt, this.getFirstCoordinate())
    || olCoordinateEqual(pt, this.getLastCoordinate())) {
    return [this];
  }
  // Get
  const c0 = this.getCoordinates();
  let ci = [c0[0]];
  const c = [];
  for (i = 0; i < c0.length - 1; i += 1) {
    // Extremity found
    if (olCoordinateEqual(pt, c0[i + 1])) {
      ci.push(c0[i + 1]);
      c.push(new OLGeomLineString(ci));
      ci = [];
    } else if (!olCoordinateEqual(pt, c0[i])) { // Test alignement
      let d1;
      let d2;
      let split = false;
      if (c0[i][0] === c0[i + 1][0]) {
        d1 = (c0[i][1] - pt[1]) / (c0[i][1] - c0[i + 1][1]);
        split = (c0[i][0] === pt[0]) && (d1 > 0 && d1 <= 1);
      } else if (c0[i][1] === c0[i + 1][1]) {
        d1 = (c0[i][0] - pt[0]) / (c0[i][0] - c0[i + 1][0]);
        split = (c0[i][1] === pt[1]) && (d1 > 0 && d1 <= 1);
      } else {
        d1 = (c0[i][0] - pt[0]) / (c0[i][0] - c0[i + 1][0]);
        d2 = (c0[i][1] - pt[1]) / (c0[i][1] - c0[i + 1][1]);
        split = (Math.abs(d1 - d2) <= tolAux && d1 > 0 && d1 <= 1);
      }
      // pt is inside the segment > split
      if (split) {
        ci.push(pt);
        c.push(new OLGeomLineString(ci));
        ci = [pt];
      }
    }
    // Filter equal points
    if (!olCoordinateEqual(c0[i], c0[i + 1])) ci.push(c0[i + 1]);
  }
  if (ci.length > 1) c.push(new OLGeomLineString(ci));
  if (c.length) return c;
  return [this];
};

// import('ol-ext/geom/LineStringSplitAt')
