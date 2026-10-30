/**
 * Capas de ejemplo deterministas para validar las operaciones de Turf.
 * Coordenadas en EPSG:4326 [lon, lat]. Las usan test/test.js y las pruebas
 * de Playwright.
 *
 * - Zonas A (polígonos): Z1 y Z2 se solapan en [-3.69, 40.41, -3.68, 40.42];
 *   Z3 está aislada.
 * - Puntos B: P1 solo en Z1; P2 en el solape Z1/Z2; P3 en el borde superior
 *   (horizontal) de Z3; P4 fuera de todo; P5 en Z3 y sin «categoria».
 * - Red lineal C: C1 cruza Z1 y Z2; C2 está dentro de Z3; C3 fuera de todo;
 *   C4 es una MultiLineString que cruza Z1 y entra en Z3.
 * - Ámbitos D (polígonos): D1 solapa Z1 y Z2 (más con Z2); D2 solapa Z3;
 *   D3 es disjunto. Repite los campos «nombre» y «tipo» de Zonas A.
 * - Capa vacía: capa vectorial sin entidades.
 */
const rectangle = (minX, minY, maxX, maxY) => ({
  type: 'Polygon',
  coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]],
});

const feature = (id, geometry, properties) => ({
  type: 'Feature', id, geometry, properties,
});

export const TURF_SAMPLES = {
  extent: [-3.72, 40.355, -3.595, 40.45],
  zones: {
    name: 'zonas_a',
    legend: 'Zonas A',
    color: '#e67e22',
    features: [
      feature('Z1', rectangle(-3.70, 40.40, -3.68, 40.42), { idZona: 'Z1', nombre: 'Centro', tipo: 'urbana' }),
      feature('Z2', rectangle(-3.69, 40.41, -3.67, 40.43), { idZona: 'Z2', nombre: 'Norte', tipo: 'residencial' }),
      feature('Z3', rectangle(-3.65, 40.40, -3.63, 40.42), { idZona: 'Z3', nombre: 'Este', tipo: 'industrial' }),
    ],
  },
  points: {
    name: 'puntos_b',
    legend: 'Puntos B',
    color: '#c0392b',
    features: [
      feature('P1', { type: 'Point', coordinates: [-3.695, 40.405] }, { idPunto: 'P1', nombre: 'Fuente', categoria: 'mobiliario' }),
      feature('P2', { type: 'Point', coordinates: [-3.685, 40.415] }, { idPunto: 'P2', nombre: 'Kiosco', categoria: 'comercio' }),
      feature('P3', { type: 'Point', coordinates: [-3.64, 40.42] }, { idPunto: 'P3', nombre: 'Hito', categoria: 'señal' }),
      feature('P4', { type: 'Point', coordinates: [-3.66, 40.39] }, { idPunto: 'P4', nombre: 'Banco', categoria: 'mobiliario' }),
      feature('P5', { type: 'Point', coordinates: [-3.64, 40.41] }, { idPunto: 'P5', nombre: 'Farola' }),
    ],
  },
  lines: {
    name: 'red_lineal_c',
    legend: 'Red lineal C',
    color: '#27ae60',
    features: [
      feature('C1', { type: 'LineString', coordinates: [[-3.705, 40.415], [-3.665, 40.415]] }, { idTramo: 'C1', clase: 'calle' }),
      feature('C2', { type: 'LineString', coordinates: [[-3.645, 40.405], [-3.635, 40.415]] }, { idTramo: 'C2', clase: 'camino' }),
      feature('C3', { type: 'LineString', coordinates: [[-3.66, 40.44], [-3.62, 40.44]] }, { idTramo: 'C3', clase: 'carretera' }),
      feature('C4', {
        type: 'MultiLineString',
        coordinates: [[[-3.695, 40.395], [-3.695, 40.425]], [[-3.64, 40.395], [-3.64, 40.405]]],
      }, { idTramo: 'C4', clase: 'senda' }),
    ],
  },
  areas: {
    name: 'ambitos_d',
    legend: 'Ámbitos D',
    color: '#8e44ad',
    features: [
      feature('D1', rectangle(-3.685, 40.405, -3.675, 40.425), { idAmbito: 'D1', nombre: 'Barrio 1', tipo: 'distrito' }),
      feature('D2', rectangle(-3.645, 40.415, -3.625, 40.435), { idAmbito: 'D2', nombre: 'Barrio 2', tipo: 'distrito' }),
      feature('D3', rectangle(-3.62, 40.36, -3.60, 40.38), { idAmbito: 'D3', nombre: 'Barrio 3', tipo: 'rural' }),
    ],
  },
  empty: {
    name: 'capa_vacia',
    legend: 'Capa vacía',
  },
};

/**
 * Añade las capas de ejemplo a window.map y encuadra su extensión.
 * - Zonas A, Red lineal C y Ámbitos D: IDEE.layer.GeoJSON con el
 *   FeatureCollection en línea (mecanismo ajeno a vectorsmanagement).
 * - Puntos B y Capa vacía: IDEE.layer.Vector con IDEE.Feature, como las
 *   capas que crea el plugin.
 * Es autocontenida para poder ejecutarse con page.evaluate.
 *
 * @param {Object} samples TURF_SAMPLES.
 * @returns {Object<String, String>} idLayer de cada capa por clave.
 */
export function addSampleLayers(samples) {
  const { map } = window;
  const projection = map.getProjection().code;
  const style = (color) => new IDEE.style.Generic({
    point: {
      radius: 7,
      fill: { color, opacity: 0.9 },
      stroke: { color: '#ffffff', width: 2 },
    },
    line: { stroke: { color, width: 4 } },
    polygon: {
      fill: { color, opacity: 0.25 },
      stroke: { color, width: 2 },
    },
  });
  // Sin consulta por clic (extract): su popup desplazaría el mapa al seleccionar.
  const geojsonLayer = (sample) => new IDEE.layer.GeoJSON({
    name: sample.name,
    legend: sample.legend,
    extract: false,
    source: { type: 'FeatureCollection', features: sample.features },
  }, { style: style(sample.color) });

  const zones = geojsonLayer(samples.zones);
  const areas = geojsonLayer(samples.areas);
  const lines = geojsonLayer(samples.lines);
  const points = new IDEE.layer.Vector({
    name: samples.points.name,
    legend: samples.points.legend,
    extract: false,
  }, { style: style(samples.points.color) });
  const empty = new IDEE.layer.Vector({
    name: samples.empty.name,
    legend: samples.empty.legend,
    extract: false,
  });
  map.addLayers([empty, zones, areas, lines, points]);
  points.addFeatures(samples.points.features.map((f) => new IDEE.Feature(f.id, {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: ol.proj.fromLonLat(f.geometry.coordinates, projection) },
    properties: f.properties,
  })));
  map.setBbox(ol.proj.transformExtent(samples.extent, 'EPSG:4326', projection));
  return {
    zones: zones.idLayer,
    points: points.idLayer,
    lines: lines.idLayer,
    areas: areas.idLayer,
    empty: empty.idLayer,
  };
}
