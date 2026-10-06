/**
 * @module IDEE/format/GPX
 */
import GeoJSON from './GeoJSON';
import { getValue } from '../i18n/language';

const namespaces = ['', 'http://www.topografix.com/GPX/1/0', 'http://www.topografix.com/GPX/1/1'];
const children = (node, name) => Array.from(node.children).filter((child) => (
  child.localName === name && child.namespaceURI === node.namespaceURI
));
const value = (node, name) => children(node, name)[0]?.textContent.trim();
const invalid = () => new Error(getValue('exception').invalid_gpx);

/**
 * Lector GPX 1.0/1.1 independiente del motor. Conserva los segmentos de los tracks.
 * Las fechas se exponen como cadenas ISO en time y coordTimes, fuera de las coordenadas.
 * @api
 */
class GPX {
  /**
   * @param {Object} options Opciones de lectura GeoJSON (clampToGround en Cesium).
   * @api
   */
  constructor(options = {}) {
    this.geoJSON_ = new GeoJSON(options);
    this.splitTracks_ = options.splitTracks === true;
  }

  /**
   * Lee XML GPX y devuelve entidades IDEE en la proyección solicitada.
   * @param {String} source Contenido XML.
   * @param {Object} projection Proyección del mapa.
   * @returns {Array<IDEE.Feature>} Puntos, rutas y tracks.
   * @api
   */
  read(source, projection) {
    if (typeof source !== 'string') throw invalid();
    const document = new DOMParser().parseFromString(source, 'text/xml');
    const root = document.documentElement;
    if (document.querySelector('parsererror') || root.localName !== 'gpx'
      || !namespaces.includes(root.namespaceURI || '')) throw invalid();
    const features = Array.from(root.children)
      .filter((node) => ['wpt', 'rte', 'trk'].includes(node.localName)
        && node.namespaceURI === root.namespaceURI)
      .flatMap((node, index) => {
        const feature = this.readFeature_(node, index);
        if (!feature) return [];
        if (!this.splitTracks_ || feature.geometry.type !== 'MultiLineString') return [feature];
        // Cesium representa cada segmento como una entidad de línea independiente.
        return feature.geometry.coordinates.map((coordinates, segment) => ({
          ...feature,
          id: `${feature.id}-${segment}`,
          properties: {
            ...feature.properties,
            segment,
            ...(feature.properties.coordTimes ? {
              coordTimes: feature.properties.coordTimes[segment],
              time: feature.properties.coordTimes[segment].find((time) => time !== null),
            } : {}),
          },
          geometry: { type: 'LineString', coordinates },
        }));
      });
    return this.geoJSON_.read({ type: 'FeatureCollection', features }, projection);
  }

  /**
   * Lee una posición WGS84; la elevación opcional ocupa únicamente la tercera coordenada.
   * @private
   */
  readCoordinate_(node) {
    const lon = node.getAttribute('lon');
    const lat = node.getAttribute('lat');
    const coordinates = [Number(lon), Number(lat)];
    if (lon === null || lat === null || !lon.trim() || !lat.trim()
      || coordinates.some((number) => !Number.isFinite(number))
      || Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90) throw invalid();
    const elevation = value(node, 'ele');
    if (elevation !== undefined) {
      if (!elevation || !Number.isFinite(Number(elevation))) throw invalid();
      coordinates.push(Number(elevation));
    }
    return coordinates;
  }

  /** Construye una entidad conservando atributos GPX y fechas por posición. @private */
  readFeature_(node, index) {
    const properties = { gpxType: node.localName };
    ['name', 'cmt', 'desc', 'src', 'sym', 'type', 'time', 'fix'].forEach((name) => {
      const text = value(node, name);
      if (text !== undefined) properties[name] = text;
    });
    ['ele', 'magvar', 'geoidheight', 'sat', 'hdop', 'vdop', 'pdop', 'ageofdgpsdata', 'dgpsid', 'number']
      .forEach((name) => {
        const text = value(node, name);
        if (text !== undefined && text !== '' && Number.isFinite(Number(text))) {
          properties[name] = Number(text);
        }
      });
    const links = children(node, 'link').map((link) => ({
      href: link.getAttribute('href'), text: value(link, 'text'), type: value(link, 'type'),
    }));
    if (links.length) properties.links = links;
    const url = value(node, 'url');
    if (url !== undefined) properties.url = url;
    let geometry;
    if (node.localName === 'wpt') {
      geometry = { type: 'Point', coordinates: this.readCoordinate_(node) };
    } else {
      const segments = node.localName === 'rte'
        ? [children(node, 'rtept')]
        : children(node, 'trkseg').map((segment) => children(segment, 'trkpt'));
      const nonEmptySegments = segments.filter((segment) => segment.length > 0);
      if (!nonEmptySegments.length) return null;
      const coordinates = nonEmptySegments.map((segment) => segment.map((point) => (
        this.readCoordinate_(point)
      )));
      const times = nonEmptySegments.map((segment) => segment.map((point) => value(point, 'time') || null));
      const firstTime = times.flat().find((time) => time !== null);
      if (firstTime !== undefined) {
        properties.time = firstTime;
        properties.coordTimes = node.localName === 'rte' ? times[0] : times;
      }
      geometry = node.localName === 'rte'
        ? { type: 'LineString', coordinates: coordinates[0] }
        : { type: 'MultiLineString', coordinates };
    }
    return {
      type: 'Feature', id: `${node.localName}-${index}`, geometry, properties,
    };
  }
}

export default GPX;
