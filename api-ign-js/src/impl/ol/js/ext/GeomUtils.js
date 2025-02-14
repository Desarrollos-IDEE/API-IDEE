/**
 * Este fichero contiene las funciones de utilidad para la gestión de geometrías
 * @module M/impl/ol/js/ext/GeomUtils
 * @example import 'M/impl/ol/js/ext/GeomUtils';
 */

/**
 * Copyright (c) 2016 Jean-Marc VIGLINO,
 * released under the CeCILL-B license (French BSD license)
 * (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
 * Usefull function to handle geometric operations
 */

import OLGeomLineString from 'ol/geom/LineString';
import OLGeomLinearRing from 'ol/geom/LinearRing';
import OLGeomMultiLineString from 'ol/geom/MultiLineString';
import OLGeomMultiPoint from 'ol/geom/MultiPoint';
import OLGeomMultiPolygon from 'ol/geom/MultiPolygon';
import OLGeomPoint from 'ol/geom/Point';
import OLGeomPolygon from 'ol/geom/Polygon';
import OLGeomCircle from 'ol/geom/Circle';
import { buffer as olExtentBuffer, getCenter as olExtentGetCenter } from 'ol/extent';

/**
 * Distancia entre 2 puntos.
 * @function
 * @param {ol.Coordinate} p1 Primer punto.
 * @param {ol.Coordinate} p2 Segundo punto.
 * @return {number} Distancia entre los 2 puntos.
 * @api stable
 */
const olCoordinateDist2d = (p1, p2) => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt((dx * dx) + (dy * dy));
};

/**
 * Distancia entre 2 puntos.
 * @function
 * @param {ol.Coordinate} p1 Primer punto.
 * @param {ol.Coordinate} p2 Segundo punto.
 * @return {boolean} Verdadero si los puntos son iguales.
 * @api stable
 */
const olCoordinateEqual = (p1, p2) => {
  return (p1[0] === p2[0] && p1[1] === p2[1]);
};

/**
 * Devuelve el centroide de una geometría.
 * @function
 * @param {ol.geom.Geometry} geom Geometría.
 * @return {ol.Coordinate} Centroide de la geometría.
 * @api stable
 */
const olCoordinateGetGeomCenter = (geom) => {
  switch (geom.getType()) {
    case 'Point':
      return geom.getCoordinates();
    case 'MultiPolygon':
      geom.getPolygon(0);
      // fallthrough
    case 'Polygon':
      return geom.getInteriorPoint().getCoordinates();
    default:
      return geom.getClosestPoint(olExtentGetCenter(geom.getExtent()));
  }
};

/**
 * Devuelve el centroide de un objeto geográfico.
 * @function
 * @param {ol.Feature} f Objeto geográfico.
 * @return {ol.coordinate} Centroide del objeto geográfico.
 * @api stable
 */
const olCoordinateGetFeatureCenter = (f) => {
  return olCoordinateGetGeomCenter(f.getGeometry());
};

/**
 * Devuelve las coordenadas de un punto tras el desplazamiento.
 * @function
 * @param {Array<ol.Coordinate>} coords Coordenadas.
 * @param {number} offset Desplazamiento.
 * @return {Array<ol.Coordinate>} Coordenadas desplazadas.
 * @see http://stackoverflow.com/a/11970006/796832
 * @api stable
 */
const olCoordinateOffsetCoords = (coords, offset) => {
  const path = [];
  let N = coords.length - 1;
  let max = N;
  let mi;
  let mi1;
  let li;
  let li1;
  let ri;
  let ri1;
  let si;
  let si1;
  let Xi1;
  let Yi1;
  let p0;
  let p1;
  let p2;
  const isClosed = olCoordinateEqual(coords[0], coords[N]);
  if (!isClosed) {
    p0 = coords[0];
    p1 = coords[1];
    p2 = [
      p0[0] + (((p1[1] - p0[1]) / olCoordinateDist2d(p0, p1)) * offset),
      p0[1] - (((p1[0] - p0[0]) / olCoordinateDist2d(p0, p1)) * offset),
    ];
    path.push(p2);
    coords.push(coords[N]);
    N += 1;
    max -= 1;
  }
  for (let i = 0; i < max; i += 1) {
    p0 = coords[i];
    p1 = coords[(i + 1) % N];
    p2 = coords[(i + 2) % N];

    mi = (p1[1] - p0[1]) / (p1[0] - p0[0]);
    mi1 = (p2[1] - p1[1]) / (p2[0] - p1[0]);
    // Prevent alignements
    if (Math.abs(mi - mi1) > 1e-10) {
      li = Math.sqrt(((p1[0] - p0[0]) * (p1[0] - p0[0])) + ((p1[1] - p0[1]) * (p1[1] - p0[1])));
      li1 = Math.sqrt(((p2[0] - p1[0]) * (p2[0] - p1[0])) + ((p2[1] - p1[1]) * (p2[1] - p1[1])));
      ri = p0[0] + ((offset * (p1[1] - p0[1])) / li);
      ri1 = p1[0] + ((offset * (p2[1] - p1[1])) / li1);
      si = p0[1] - ((offset * (p1[0] - p0[0])) / li);
      si1 = p1[1] - ((offset * (p2[0] - p1[0])) / li1);
      Xi1 = ((((mi1 * ri1) - (mi * ri)) + si) - si1) / (mi1 - mi);
      Yi1 = (((mi * mi1 * (ri1 - ri)) + (mi1 * si)) - (mi * si1)) / (mi1 - mi);

      // Correction for vertical lines
      if (p1[0] - p0[0] === 0) {
        Xi1 = p1[0] + ((offset * (p1[1] - p0[1])) / Math.abs(p1[1] - p0[1]));
        Yi1 = ((mi1 * Xi1) - (mi1 * ri1)) + si1;
      }
      if (p2[0] - p1[0] === 0) {
        Xi1 = p2[0] + ((offset * (p2[1] - p1[1])) / Math.abs(p2[1] - p1[1]));
        Yi1 = ((mi * Xi1) - (mi * ri)) + si;
      }

      path.push([Xi1, Yi1]);
    }
  }
  if (isClosed) {
    path.push(path[0]);
  } else {
    coords.pop();
    p0 = coords[coords.length - 1];
    p1 = coords[coords.length - 2];
    p2 = [
      p0[0] - (((p1[1] - p0[1]) / olCoordinateDist2d(p0, p1)) * offset),
      p0[1] + (((p1[0] - p0[0]) / olCoordinateDist2d(p0, p1)) * offset),
    ];
    path.push(p2);
  }
  return path;
};

/**
 * Devuelve las coordenadas de un segmento.
 * @function
 * @param {ol.Coordinate} pt El punto.
 * @param {Array<ol.Coordinate>} coords Las coordenadas.
 * @return {Object} El indice del segmento y las coordenadas del segmento.
 * @api stable
 */
const olCoordinateFindSegment = (pt, coords) => {
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    if (olCoordinateEqual(pt, p0) || olCoordinateEqual(pt, p1)) {
      return { index: 1, segment: [p0, p1] };
    }
    const d0 = olCoordinateDist2d(p0, p1);
    const v0 = [(p1[0] - p0[0]) / d0, (p1[1] - p0[1]) / d0];
    const d1 = olCoordinateDist2d(p0, pt);
    const v1 = [(pt[0] - p0[0]) / d1, (pt[1] - p0[1]) / d1];
    if (Math.abs((v0[0] * v1[1]) - (v0[1] * v1[0])) < 1e-10) {
      return { index: 1, segment: [p0, p1] };
    }
  }
  return { index: -1 };
};

/**
 * Divide un polígono en dos partes.
 * @function
 * @param {Array<ol.Coordinate>} geom La geometría.
 * @param {number} y La coordenada Y.
 * @param {number} n El número de contorno.
 * @return {Array<Array<ol.Coordinate>>} Las geometrías.
 * @api stable
 */
const olCoordinateSplitH = (geom, y, n) => {
  let x;
  let abs;
  const list = [];
  for (let i = 0; i < geom.length - 1; i += 1) {
    // Hole separator?
    // if (!geom[i].length || !geom[i + 1].length) continue;
    // Intersect
    if ((geom[i][1] <= y && geom[i + 1][1] > y) || (geom[i][1] >= y && geom[i + 1][1] < y)) {
      abs = (y - geom[i][1]) / (geom[i + 1][1] - geom[i][1]);
      x = (abs * (geom[i + 1][0] - geom[i][0])) + geom[i][0];
      list.push({
        contour: n,
        index: i,
        pt: [x, y],
        abs,
      });
    }
  }
  // Sort x
  list.sort((a, b) => { return a.pt[0] - b.pt[0]; });
  // Horizontal segment
  const result = [];
  for (let j = 0; j < list.length - 1; j += 2) {
    result.push([list[j], list[j + 1]]);
  }
  return result;
};

/**
 * Crea una geometría dada un tipo y coordenadas.
 * @function
 * @param {string} type El tipo de geometría.
 * @param {Array<ol.Coordinate>} coordinates Las coordenadas.
 * @return {ol.geom.Geometry} La geometría.
 * @api stable
 * */
const olGeomCreateFromType = (type, coordinates) => {
  switch (type) {
    case 'LineString':
      return new OLGeomLineString(coordinates);
    case 'LinearRing':
      return new OLGeomLinearRing(coordinates);
    case 'MultiLineString':
      return new OLGeomMultiLineString(coordinates);
    case 'MultiPoint':
      return new OLGeomMultiPoint(coordinates);
    case 'MultiPolygon':
      return new OLGeomMultiPolygon(coordinates);
    case 'Point':
      return new OLGeomPoint(coordinates);
    case 'Polygon':
      return new OLGeomPolygon(coordinates);
    default:
      /* eslint-disable-next-line no-console */
      console.error(`[createFromType] Unsupported type: ${type}`);
      return null;
  }
};

export { olGeomCreateFromType };
export {
  olCoordinateDist2d,
  olCoordinateEqual,
  olCoordinateFindSegment,
  olCoordinateGetFeatureCenter,
  olCoordinateGetGeomCenter,
  olCoordinateOffsetCoords,
  olCoordinateSplitH,
};

/**
 *  Devuelve las coordenadas en la intersección de dos segmentos.
 * @param {Arrar<ol.coordinate>} d1 Segmento 1.
 * @param {Arrar<ol.coordinate>} d2 Segmento 2.
 * @return {ol.coordinate} Las coordenadas de la intersección.
 * @api stable
 */
const olCoordinateGetIntersectionPoint = (d1, d2) => {
  const d1x = d1[1][0] - d1[0][0];
  const d1y = d1[1][1] - d1[0][1];
  const d2x = d2[1][0] - d2[0][0];
  const d2y = d2[1][1] - d2[0][1];
  const det = (d1x * d2y) - (d1y * d2x);
  if (det !== 0) {
    const k = (((d1x * d1[0][1]) - (d1x * d2[0][1]) - (d1y * d1[0][0])) + (d1y * d2[0][0])) / det;
    return [d2[0][0] + (k * d2x), d2[0][1] + (k * d2y)];
  }
  return false;
};

export { olCoordinateGetIntersectionPoint };

let olExtentIntersection;

(() => {
  // Split at x
  function splitX(pts, x) {
    let pt;
    for (let i = pts.length - 1; i > 0; i -= 1) {
      if ((pts[i][0] > x && pts[i - 1][0] < x) || (pts[i][0] < x && pts[i - 1][0] > x)) {
        pt = [x, (((x - pts[i][0]) / (pts[i - 1][0] - pts[i][0]))
          * (pts[i - 1][1] - pts[i][1])) + pts[i][1]];
        pts.splice(i, 0, pt);
      }
    }
  }
  // Split at y
  function splitY(pts, y) {
    let pt;
    for (let i = pts.length - 1; i > 0; i -= 1) {
      if ((pts[i][1] > y && pts[i - 1][1] < y) || (pts[i][1] < y && pts[i - 1][1] > y)) {
        pt = [(((y - pts[i][1]) / (pts[i - 1][1] - pts[i][1]))
          * (pts[i - 1][0] - pts[i][0])) + pts[i][0], y];
        pts.splice(i, 0, pt);
      }
    }
  }

  /** Fast polygon intersection with an extent (used for area calculation)
   * @param {ol_extent_Extent} extent
   * @param {OLGeomPolygon|OLGeomMultiPolygon} polygon
   * @returns {OLGeomPolygon|OLGeomMultiPolygon|null} return null if not a polygon geometry
   */
  olExtentIntersection = (extent, polygon) => {
    const poly = (polygon.getType() === 'Polygon');
    if (!poly && polygon.getType() !== 'MultiPolygon') return null;
    let geom = polygon.getCoordinates();
    if (poly) geom = [geom];
    geom.forEach((g) => {
      g.forEach((c) => {
        splitX(c, extent[0]);
        splitX(c, extent[2]);
        splitY(c, extent[1]);
        splitY(c, extent[3]);
      });
    });
    // Snap geom to the extent
    geom.forEach((g) => {
      g.forEach((c) => {
        c.forEach((p) => {
          const pAux = p;
          if (pAux[0] < extent[0]) pAux[0] = extent[0];
          else if (pAux[0] > extent[2]) pAux[0] = extent[2];
          if (pAux[1] < extent[1]) pAux[1] = extent[1];
          else if (pAux[1] > extent[3]) pAux[1] = extent[3];
        });
      });
    });
    if (poly) {
      return new OLGeomPolygon(geom[0]);
    }
    return new OLGeomMultiPolygon(geom);
  };
})();

export { olExtentIntersection };
export { olExtentIntersection as extentIntersection };

/**
 * Añade puntos a lo largo de un segmento.
 * @function
 * @param {ol_Coordinate} p1 Punto inicial.
 * @param {ol_Coordinate} p2 Punto final.
 * @param {number} d Distancia entre puntos.
 * @param {boolean} start Añadir el punto inicial, por defecto verdadero.
 * @returns {Array<ol_Coordinate>} Array de puntos.
 * @api stable
 */
const olCoordinateSampleAt = (p1, p2, d, start) => {
  const pts = [];
  if (start !== false) pts.push(p1);
  const dl = olCoordinateDist2d(p1, p2);
  if (dl) {
    const nb = Math.round(dl / d);
    if (nb > 1) {
      const dx = (p2[0] - p1[0]) / nb;
      const dy = (p2[1] - p1[1]) / nb;
      for (let i = 1; i < nb; i += 1) {
        pts.push([p1[0] + (dx * i), p1[1] + (dy * i)]);
      }
    }
  }
  pts.push(p2);
  return pts;
};
export { olCoordinateSampleAt };

/**
 * Muestra un punto de una línea.
 * @param {number} d Distancia entre puntos.
 * @returns {OLGeomLineString} "LineString" con los puntos.
 */
OLGeomLineString.prototype.sampleAt = (d) => {
  const line = this.getCoordinates();
  let result = [];
  for (let i = 1; i < line.length; i += 1) {
    result = result.concat(olCoordinateSampleAt(line[i - 1], line[i], d, i === 1));
  }
  return new OLGeomLineString(result);
};

/**
 * Muestra un "MultiLineString" a distancia.
 * @param {number} d Distancia entre puntos.
 * @returns {OLGeomMultiLineString} "MultiLineString" con los puntos.
 */
OLGeomMultiLineString.prototype.sampleAt = (d) => {
  const lines = this.getCoordinates();
  const result = [];
  lines.forEach((p) => {
    let l = [];
    for (let i = 1; i < p.length; i += 1) {
      l = l.concat(olCoordinateSampleAt(p[i - 1], p[i], d, i === 1));
    }
    result.push(l);
  });
  return new OLGeomMultiLineString(result);
};

/**
 * Muestra un "Polygon" a distancia.
 * @function
 * @param {number} d Distancia entre puntos.
 * @returns {OLGeomPolygon} "Polygon" con los puntos.
 */
OLGeomPolygon.prototype.sampleAt = (res) => {
  const poly = this.getCoordinates();
  const result = [];
  poly.forEach((p) => {
    let l = [];
    for (let i = 1; i < p.length; i += 1) {
      l = l.concat(olCoordinateSampleAt(p[i - 1], p[i], res, i === 1));
    }
    result.push(l);
  });
  return new OLGeomPolygon(result);
};

/**
 * Muestra un "MultiPolygon" a distancia.
 * @param {number} res Distancia entre puntos.
 * @returns {OLGeomMultiPolygon} "MultiPolygon" con los puntos.
 */
OLGeomMultiPolygon.prototype.sampleAt = (res) => {
  const mpoly = this.getCoordinates();
  const result = [];
  mpoly.forEach((poly) => {
    const a = [];
    result.push(a);
    poly.forEach((p) => {
      let l = [];
      for (let i = 1; i < p.length; i += 1) {
        l = l.concat(olCoordinateSampleAt(p[i - 1], p[i], res, i === 1));
      }
      a.push(l);
    });
  });
  return new OLGeomMultiPolygon(result);
};

/**
 * Inserta un geometría usando una circunferencia.
 * @param {ol_geom_Geometry} geom Geometría a insertar.
 * @param {number} resolution Circunferencia de inserción.
 * @returns {ol_geom_Geometry} Geometría insertada.
 */
OLGeomCircle.prototype.intersection = (geom, resolution) => {
  if (geom.sampleAt) {
    const ext = olExtentBuffer(this.getCenter().concat(this.getCenter()), this.getRadius());
    const geomAux = olExtentIntersection(ext, geom);
    // eslint-disable-next-line no-param-reassign
    geom = geomAux.simplify(resolution);
    const c = this.getCenter();
    const r = this.getRadius();
    // let res = (resolution||1) * r / 100;
    let g = geom.sampleAt(resolution).getCoordinates();
    switch (geom.getType()) {
      case 'Polygon':
        g = [g];
        // fallthrough
      case 'MultiPolygon': {
        let hasout = false;
        // let hasin = false;
        const result = [];
        g.forEach((poly) => {
          const a = [];
          result.push(a);
          poly.forEach((ring) => {
            const l = [];
            a.push(l);
            ring.forEach((p) => {
              const d = olCoordinateDist2d(c, p);
              if (d > r) {
                hasout = true;
                l.push([
                  c[0] + ((r / d) * (p[0] - c[0])),
                  c[1] + ((r / d) * (p[1] - c[1])),
                ]);
              } else {
                // hasin = true;
                l.push(p);
              }
            });
          });
        });
        if (!hasout) return geom;
        if (geom.getType() === 'Polygon') {
          return new OLGeomPolygon(result[0]);
        }
        return new OLGeomMultiPolygon(result);
      }
      default:
        break;
    }
  } else {
    /* eslint-disable-next-line no-console */
    console.warn(`[ol/geom/Circle~intersection] Unsupported geometry type: ${geom.getType()}`);
  }
  return geom;
};
