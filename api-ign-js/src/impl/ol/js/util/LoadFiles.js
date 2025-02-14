/**
 * @module M/impl/loadFiles
 */
import KML from 'ol/format/KML';
import GeoJSON from 'ol/format/GeoJSON';
import GPX from 'ol/format/GPX';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import WFS from 'ol/format/WFS';
import GML2 from 'ol/format/GML2';
import GML3 from 'ol/format/GML3';
import View from 'ol/View';
import { transform } from 'ol/proj';
import OLFeature from 'ol/Feature';
import ImplUtils from './Utils';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * Clase contiene funciones para la gestion de
 * la carga de ficheros en el mapa
 *
 * @api
 */
class LoadFiles {
/**
 * Centra el mapa en los features obtenidos
 * @public
 * @function
 * @param {Array<M.Feature>} features array de features
 * @param {M.Map} map mapa donde se realizará el centrado
 */
  static centerFeatures(features, map) {
    if ((features.length === 1) && (features[0].getGeometry().type === 'Point')) {
      const pointView = new View({
        center: features[0].getGeometry().coordinates,
        zoom: 15,
      });
      map.getMapImpl().setView(pointView);
    } else {
      const extent = ImplUtils.getFeaturesExtent(features);
      map.getMapImpl().getView().fit(extent, {
        duration: 500,
        minResolution: 1,
      });
    }
  }

  /**
 * Obtiene los features de un GeoJSON
 * @public
 * @function
 * @param {String} source geojson source
 * @param {String} projection proyección del mapa
 * @returns {Array<M.Feature>} array de features
 */
  static loadGeoJSONLayer(source, projection) {
    let features = new GeoJSON()
      .readFeatures(source, { featureProjection: projection });
    features = this.featuresToFacade(features);
    features = features.filter((f) => {
      return f.getGeometry() !== null;
    });

    return features;
  }

  /**
 * Obtiene los features de varios GeoJSON
 * @public
 * @function
 * @param {Array<String>} sources Array de geojson
 * @param {String} projection proyección del mapa
 * @returns {Array<M.Feature>} array de features
 */
  static loadAllInGeoJSONLayer(sources, projection) {
    let features = [];
    sources.forEach((source) => {
      const localFeatures = this.loadGeoJSONLayer(source, projection);
      if (localFeatures !== null && localFeatures !== undefined && localFeatures.length > 0) {
        features = features.concat(localFeatures);
      }
    });
    return features;
  }

  /**
 * Obtiene los features de un GPX.
 * @public
 * @function
 * @api
 * @param {String} source source GPX
 * @param {String} projection proyeccion del mapa
 * @returns {Array<M.Feature>} array de features
 */
  static loadGPXLayer(source, projection) {
    let features = [];
    const origFeatures = new GPX()
      .readFeatures(source, { featureProjection: projection });
    origFeatures.forEach((f) => {
      if (f.getGeometry().getType() === 'MultiLineString') {
        if (f.getGeometry().getLineStrings().length === 1) {
          const geom = f.getGeometry().getLineStrings()[0];
          f.setGeometry(geom);
        }
      }

      features.push(f);
    });
    features = this.featuresToFacade(features);
    return features;
  }

  /**
 * Parsea las superficies de un GML 3.2
 * @private
 * @function
 * @param {String} source source de GML32
 * @returns {Array<Object>} array de surfaces
 */
  static parseSurfacesGml(source) {
    const surfaces = [];
    const xmlDoc = new DOMParser().parseFromString(source, 'text/xml');
    const surfaceNodes = xmlDoc.querySelectorAll('Surface');
    surfaceNodes.forEach((s) => {
      surfaces.push({ surface: s, id: '', sistema: '' });
    });
    return surfaces;
  }

  /**
 * Obtiene los nodos de los diferentes tipos de geometrias de un GML 3.2
 * @private
 * @function
 * @param {String} source source GML32
 * @returns {Array<Object>} array de geometrias
 */
  static parseGeometriesGml(source) {
    const geometries = [];
    const xmlDoc = new DOMParser().parseFromString(source, 'text/xml');
    const points = xmlDoc.querySelectorAll('Point');
    const lines = xmlDoc.querySelectorAll('LineString');
    const polygons = xmlDoc.querySelectorAll('Polygon');

    points.forEach((p) => {
      geometries.push({
        surface: p,
        id: '',
        sistema: '',
        type: 'Point',
      });
    });

    lines.forEach((l) => {
      geometries.push({
        surface: l,
        id: '',
        sistema: '',
        type: 'LineString',
      });
    });

    polygons.forEach((p) => {
      geometries.push({
        surface: p,
        id: '',
        sistema: '',
        type: 'Polygon',
      });
    });
    return geometries;
  }

  /**
 * Obtiene el sistema de referencia de un GML 3.2
 * @private
 * @function
 * @param {Array<Object>} superficies array de elementos del GML
 * @returns {Array<Object>} array de superficies con su srs
 */
  static getEPSGFromGML32(superficies) {
    superficies.map((superficie) => {
      const superficieAux = superficie;
      let coordSystem = superficie.surface.getAttribute('srsName');
      if (coordSystem.indexOf('EPSG::326') > -1) {
        const projectionNumber = parseInt(coordSystem.substring(coordSystem.indexOf('::') + 2, coordSystem.length), 10) - 6800;
        coordSystem = `EPSG::${projectionNumber}`;
      } else if (coordSystem.indexOf('::') === -1) {
        if (coordSystem.indexOf('opengis.net/def/crs')) {
          const projectionType = coordSystem.indexOf('258') === -1 ? coordSystem.indexOf('326') : coordSystem.indexOf('258');
          coordSystem = `EPSG::${coordSystem.substring(projectionType, coordSystem.length)}`;
        }
      } else {
        coordSystem = coordSystem.substring(coordSystem.indexOf('EPSG'), coordSystem.length);
      }
      superficieAux.sistema = coordSystem.replace('::', ':');
      return superficieAux;
    });
    return superficies;
  }

  /**
 * Obtiene las coordenadas de una lista de vertices de un GML 3.2
 * @private
 * @function
 * @param {String} posList cadena con lista de coordenadas
 * @param {String} srs sistema de coordenadas del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<Float>} array de coordenadas
 */
  static parseCoordinatesGML32(posList, srs, projection) {
    const coords = [];
    for (let i = 0; i < posList.length; i += 2) {
      const coordsParse = [parseFloat(posList[i + 1]), parseFloat(posList[i])];
      coords.push(transform(coordsParse, srs, projection));
    }
    return coords;
  }

  /**
 * Obtiene las coordenadas de un poligono de un GML 3.2
 * @private
 * @function
 * @param {Object} superficie elemento de tipo polígono obtenido del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<Float>} array de coordenadas
 */
  static getGML32PolygonCoordinates(superficie, projection) {
    const exterior = superficie.surface.querySelector('exterior');
    const interior = superficie.surface.querySelectorAll('interior');
    const srs = superficie.sistema;
    const coordenadas = [];
    const coordsExterior = exterior.querySelector('posList').textContent.split(' ');
    coordenadas.push(this.parseCoordinatesGML32(coordsExterior, srs, projection));
    interior.forEach((i) => {
      const coordsInterior = i.querySelector('posList').textContent.split(' ');
      coordenadas.push(this.parseCoordinatesGML32(coordsInterior, srs, projection));
    });
    return coordenadas;
  }

  /**
 * Obtiene las coordenadas de una linea de un GML 3.2
 * @private
 * @function
 * @param {Object} superficie elemento de tipo linea obtenido del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<Float>} array de coordenadas
 */
  static getGML32LineCoordinates(superficie, projection) {
    const srs = superficie.sistema;
    const coords = superficie.surface.querySelector('posList').textContent.split(' ');
    const coordenadas = this.parseCoordinatesGML32(coords, srs, projection);
    return coordenadas;
  }

  /**
 * Obtiene las coordenadas de un punto de un GML 3.2
 * @private
 * @function
 * @param {Object} superficie elemento de tipo punto obtenido del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<Float>} array de coordenadas
 */
  static getGML32PointCoordinates(superficie, projection) {
    const srs = superficie.sistema;
    const coords = superficie.surface.querySelector('pos').textContent.split(' ');
    const coordenadas = this.parseCoordinatesGML32(coords, srs, projection)[0];
    return coordenadas;
  }

  /**
 * Obtiene las coordenadas de los features de un GML 3.2
 * @private
 * @function
 * @param {Array<Object>} superficies array de elementos obtenidos del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<Object>} array de objetos con los datos necesarios para crear un feature
 */
  static getCoordinatesFromGML32(superficies, projection) {
    const geometries = [];
    let contador = 1;
    superficies.forEach((superficie) => {
      let coordenadas = [];
      const idSuperficie = superficie.id !== '' ? superficie.id : `ID_${contador}`;
      const nombreSuperficie = superficie.id !== '' ? superficie.id : `nombre_${contador}`;
      if (superficie.type === 'Polygon') {
        coordenadas = this.getGML32PolygonCoordinates(superficie, projection);
      } else if (superficie.type === 'LineString') {
        coordenadas = this.getGML32LineCoordinates(superficie, projection);
      } else if (superficie.type === 'Point') {
        coordenadas = this.getGML32PointCoordinates(superficie, projection);
      }
      contador += 1;
      geometries.push({
        fichero: undefined,
        tipo: superficie.type,
        id: `${idSuperficie}`,
        coordenadas,
        nombre: `${nombreSuperficie}`,
        sistema: superficie.sistema,
      });
    });
    return geometries;
  }

  /**
 * Parsea un GML 3.2 y obtiene sus features
 * @private
 * @function
 * @param {String} source source del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<OL.Feature>} OL Features del GML
 */
  static gmlParser(source, projection) {
    const features = [];
    let superficies = this.parseSurfacesGml(source);
    if (superficies.length === 0) {
      superficies = this.parseGeometriesGml(source);
    }

    superficies = this.getEPSGFromGML32(superficies);
    const geometrias = this.getCoordinatesFromGML32(superficies, projection);

    geometrias.forEach((geometria) => {
      let geom;
      if (geometria.tipo === 'Polygon') {
        geom = new Polygon(geometria.coordenadas);
      } else if (geometria.tipo === 'LineString') {
        geom = new LineString(geometria.coordenadas);
      } else if (geometria.tipo === 'Point') {
        geom = new Point(geometria.coordenadas);
      }
      const newOlFeature = new OLFeature({
        geometry: geom,
      });
      newOlFeature.setId(`GML ${features.length + 1}`);
      features.push(newOlFeature);
    });

    return features;
  }

  /**
 * Obtiene los features de un GML
 * @public
 * @function
 * @param {String} source source del GML
 * @param {String} projection proyección del mapa
 * @returns {Array<M.Feature>} Features del GML
 */
  static loadGMLLayer(source, projection) {
    let newSource = source;
    let srs = projection;
    if (newSource.indexOf('srsName="GCS_WGS_1984"') > -1) {
      newSource = newSource.replace(/srsName="GCS_WGS_1984"/gi, 'srsName="EPSG:4326"');
    }

    if (newSource.indexOf('cp:geometry') > -1) {
      newSource = newSource.replace(/cp:geometry/gi, 'ogr:geometryProperty');
    }

    if (newSource.indexOf('certificacion:the_geom') > -1) {
      newSource = newSource.replace(/certificacion:the_geom/gi, 'ogr:geometryProperty');
    }

    if (newSource.split('srsName="')[1].split('"')[0].indexOf('http') > -1) {
      try {
        srs = `EPSG:${newSource.split('srsName="')[1].split('#')[1].split('"')[0]}`;
      } catch (err) {
        srs = `EPSG:${newSource.split('srsName="')[1].split('/EPSG/')[1].split('/')[1]}`;
      }
    } else if (newSource.split('srsName="')[1].indexOf('crs:EPSG::') > -1) {
      srs = `EPSG:${newSource.split('srsName="')[1].split('::')[1].split('"')[0]}`;
    } else {
      srs = newSource.split('srsName="')[1].split('"')[0];
    }

    if (newSource.indexOf('<member>') > -1) {
      newSource = newSource.replace(/member/gi, 'gml:featureMember');
    } else if (newSource.indexOf('<wfs:member>') > -1) {
      newSource = newSource.replace(/wfs:member/gi, 'gml:featureMember');
    } else if (newSource.indexOf('<ogr:featureMember>') > -1) {
      newSource = newSource.replace(/ogr:featureMember/gi, 'gml:featureMember');
    }

    let features = new WFS({ gmlFormat: new GML2() }).readFeatures(newSource, {
      dataProjection: srs,
      featureProjection: projection,
    });

    features = features.map((f, index) => {
      const newF = f;
      if (!f.getGeometry()) {
        newF.setGeometry(f.get('geometry'));
      }

      return newF;
    });

    if (features.length === 0 || features[0].getGeometry() === undefined) {
      features = new WFS({ gmlFormat: new GML3() }).readFeatures(newSource, {
        dataProjection: srs,
        featureProjection: projection,
      });

      features = features.map((f, index) => {
        const newF = f;
        if (!f.getGeometry()) {
          newF.setGeometry(f.get('geometry'));
        }
        return newF;
      });
    }

    // En el caso de que no tenga geometrías, comprobamos si es GML 3.2,
    // si lo es tenemos que parsearlo a mano.
    if ((features.length === 0 || features[0].getGeometry() === undefined)
      && newSource.indexOf('gml/3.2') > 0) {
      features = this.gmlParser(newSource, projection);
    }

    features = this.featuresToFacade(features);
    return features;
  }

  /**
    * Obtiene los features de un KML
    * @public
    * @function
    * @param {String} source source del KML
    * @param {Boolean} extractStyles indica si se extraen los estilos del KML (true/false)
    * @returns {Array<M.Feature>} array con los features del KML
  */
  static loadKMLLayer(source, projection, extractStyles) {
    let features = new KML({ extractStyles })
      .readFeatures(source, { featureProjection: projection });
    features = this.featuresToFacade(features);
    return features;
  }

  /**
   * Convierte features de Openlayers en features de Mapea
   * @public
   * @function
   * @param {Array<OL.Feature>} implFeatures
   * @returns {Array<M.Feature>} features de mapea
   */
  static featuresToFacade(implFeatures) {
    return implFeatures.map((feature) => {
      const newFeature = Feature.olFeature2Facade(feature);
      return newFeature;
    });
  }
}

export default LoadFiles;
