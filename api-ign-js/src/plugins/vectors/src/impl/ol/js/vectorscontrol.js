/**
 * @module M/impl/control/VectorsControl
 */

import Profil from './profilcontrol';
import { getValue } from '../../../facade/js/i18n/language';

const WGS84 = 'EPSG:4326';
const MERCATOR = 'EPSG:900913';
const PLUS_ZINDEX = 1000;
const GML_FORMAT = 'text/xml; subtype="gml/3.1.1"';
const PROFILE_URL = 'https://servicios.idee.es/wcs-inspire/mdt?request=GetCoverage&bbox=';
const PROFILE_URL_SUFFIX = '&service=WCS&version=1.0.0&coverage=Elevacion4258_5&'
  + 'interpolationMethod=bilinear&crs=EPSG%3A4258&format=ArcGrid&width=2&height=2';
const NO_DATA_VALUE = 'NODATA_value -9999.000';
const WFS_EXCEPTIONS = [
  'https://servicios.idee.es/wfs-inspire/hidrografia?',
  'https://servicios.idee.es/wfs-inspire/hidrografia',
  'https://www.ign.es/wfs-inspire/unidades-administrativas?',
  'https://www.ign.es/wfs-inspire/unidades-administrativas',
  'https://servicios.idee.es/wfs-inspire/transportes?',
  'https://servicios.idee.es/wfs-inspire/transportes',
  'https://servicios.idee.es/wfs-inspire/ocupacion-suelo?',
  'https://servicios.idee.es/wfs-inspire/ocupacion-suelo',
  'https://www.cartociudad.es/wfs-inspire/direcciones?',
  'https://www.cartociudad.es/wfs-inspire/direcciones',
  'http://ideihm.covam.es/wfs/costaspain?',
  'http://ideihm.covam.es/wfs/costaspain',
  'http://ideihm.covam.es/wfs/catalogoENC?',
  'http://ideihm.covam.es/wfs/catalogoENC',
  'http://ideihm.covam.es/wfs/catalogoPapel?',
  'http://ideihm.covam.es/wfs/catalogoPapel',
  'http://ideihm.covam.es/wfs/lucesIHM?',
  'http://ideihm.covam.es/wfs/lucesIHM',
  'http://ideihm.covam.es/wfs/limitesMAR?',
  'http://ideihm.covam.es/wfs/limitesMAR',
  'http://ideihm.covam.es/wfs/CartaOF?',
  'http://ideihm.covam.es/wfs/CartaOF',
];

const formatNumber = (x, decimals) => {
  const pow = 10 ** decimals;
  let num = Math.round(x * pow) / pow;
  num = num.toString().replace('.', ',');
  if (decimals > 2) {
    num = `${num.split(',')[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${num.split(',')[1]}`;
  } else {
    num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return num;
};

export default class VectorsControl extends M.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    /**
     * Facade map
     * @private
     * @type {M.map}
     */
    this.facadeMap_ = map;

    this.distance_ = 30;

    this.selected_ = null;

    this.initOlLayers();
    super.addTo(map, html);
  }

  initOlLayers() {
    this.style_ = (evt) => {
      let style;
      if (evt.getGeometry().getType() === 'LineString') {
        style = [new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: '#4286f4',
            width: 2,
          }),
        })];
      } else {
        style = [new ol.style.Style({
          image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
              color: '#4286f4',
            }),
          }),
          stroke: new ol.style.Stroke({
            color: '#4286f4',
            width: 2,
          }),
          fill: new ol.style.Fill({
            color: '#4286f4',
          }),
        })];
      }

      return style;
    };

    this.source_ = new ol.source.Vector({ wrapX: false });
    this.vector_ = new ol.layer.Vector({
      source: this.source_,
      style: this.style_,
      name: 'capatopo',
    });

    this.vector_.setZIndex(1000000);
    this.facadeMap_.getMapImpl().addLayer(this.vector_);
  }

  /**
   * Creates new OpenLayers vector source
   * @public
   * @function
   * @api
   * @param {Boolean} featuresIncluded - indicates if an OL collection of
   * features should be included in new source
   */
  newVectorSource(featuresIncluded) {
    return featuresIncluded
      ? new ol.source.Vector({ features: new ol.Collection([]) })
      : new ol.source.Vector();
  }

  /**
   * Transforms x,y coordinates to 4326 on coordinates array.
   * @public
   * @function
   * @api
   * @param {String} codeProjection
   * @param {Array<Number>} oldCoordinates
   */
  getTransformedCoordinates(codeProjection, oldCoordinates) {
    const transformFunction = ol.proj.getTransform(codeProjection, 'EPSG:4326');
    return this.getFullCoordinates(
      oldCoordinates,
      transformFunction(this.getXY(oldCoordinates)),
    );
  }

  /**
   * Given a coordinate set (x, y, altitude?), returns [x,y].
   * @public
   * @function
   * @api
   * @param {Array<Number>} coordinatesSet
   */
  getXY(coordinatesSet) {
    const coordinateCopy = [];
    for (let i = 0; i < coordinatesSet.length; i += 1) coordinateCopy.push(coordinatesSet[i]);
    while (coordinateCopy.length > 2) coordinateCopy.pop();
    return coordinateCopy;
  }

  /**
   * Substitutes x, y coordinates on coordinate set (x, y, altitude...)
   * @public
   * @function
   * @api
   * @param {Array} oldCoordinates
   * @param {Array<Number>} newXY - [x,y]
   */
  getFullCoordinates(oldCoordinates, newXY) {
    const newCoordinates = oldCoordinates;
    newCoordinates[0] = newXY[0];
    newCoordinates[1] = newXY[1];
    return newCoordinates;
  }

  /**
   * This function adds draw interaction to map.
   * @public
   * @function
   * @api
   */
  addDrawInteraction(layer, feature) {
    const olMap = this.facadeMap_.getMapImpl();
    const vectorSource = layer.getImpl().getOL3Layer().getSource();
    const geometry = layer.getGeometryType() !== null ? layer.getGeometryType() : layer.geometry;
    this.draw = this.newDrawInteraction(vectorSource, geometry);
    this.addDrawEvent(feature !== undefined);
    olMap.addInteraction(this.draw);
    if (feature !== undefined) {
      this.draw.extend(feature.getImpl().getOLFeature());
    }
  }

  /**
   * Defines function to be executed on click on draw interaction.
   * Creates feature with drawing and adds it to map.
   * @public
   * @function
   * @api
   */
  addDrawEvent(isAdding) {
    this.draw.on('drawend', (event) => {
      this.facadeControl.onDraw(event);
      if (isAdding) {
        this.removeDrawInteraction();
      }
    });

    document.addEventListener('keyup', this.addEscEvent.bind(this));
    this.draw.once('drawstart', (evt) => {
      document.onkeydown = this.addUndoEvent.bind(this, evt.feature);
    });
  }

  addAddPointsInteraction(layer, feature) {
    this.removeDrawInteraction();
    this.addDrawInteraction(layer, feature);
  }

  addUndoEvent(feature, evt) {
    if (evt.ctrlKey && evt.key === 'z') {
      this.draw.removeLastPoint();
    }
  }

  addEscEvent(evt) {
    if (evt.key === 'Escape') {
      if (this.draw !== undefined) {
        this.draw.finishDrawing();
      }

      this.facadeControl.deactivateDrawing();
      this.facadeControl.isDrawingActive = false;
      this.facadeControl.isEditionActive = false;
      this.facadeControl.drawLayer = undefined;
      this.removeEditInteraction();
      this.removeSelectInteraction();
    }
  }

  /**
   * Removes draw interaction from map.
   * @public
   * @function
   * @api
   */
  removeDrawInteraction() {
    document.onkeydown = null;
    this.facadeMap_.getMapImpl().removeInteraction(this.draw);
  }

  /**
   * Removes edit interaction
   * @public
   * @api
   * @function
   */
  removeEditInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.edit);
  }

  /**
   * Removes select interaction
   * @public
   * @function
   * @api
   */
  removeSelectInteraction() {
    this.facadeMap_.getMapImpl().removeInteraction(this.select);
  }

  /**
   * Creates new OpenLayers draw interaction
   * @public
   * @function
   * @api
   * @param {OLVectorSource} vectorSource -
   * @param {String} geometry - type of geometry ['Point', 'LineString', 'Polygon']
   */
  newDrawInteraction(vectorSource, geometry) {
    return new ol.interaction.Draw({
      source: vectorSource,
      type: geometry,
      snapTolerance: 1,
    });
  }

  /**
   * Creates polygon feature from extent.
   * @public
   * @function
   * @api
   * @param {Array} extent - geometry extent
   */
  newPolygonFeature(extent) {
    return new ol.Feature({ geometry: ol.geom.Polygon.fromExtent(extent) });
  }

  /**
   * Creates current feature clone.
   * @public
   * @function
   * @api
   */
  getMapeaFeatureClone() {
    // eslint-disable-next-line no-underscore-dangle
    const implFeatureClone = this.facadeControl.feature.getImpl().olFeature_.clone();
    const emphasis = M.impl.Feature.olFeature2Facade(implFeatureClone);
    return emphasis;
  }

  /**
   * Deletes attributes from feature.
   * @public
   * @function
   * @api
   * @param {M.Feature} feature
   */
  unsetAttributes(feature) {
    const properties = feature.getImpl().getOLFeature().getProperties();
    const keys = Object.keys(properties);
    keys.forEach((key) => {
      if (key !== 'geometry') feature.getImpl().getOLFeature().unset(key);
    });
  }

  /**
   * Activates selection mode.
   * @public
   * @function
   * @api
   */
  activateSelection(layer) {
    const olMap = this.facadeMap_.getMapImpl();
    const facadeControl = this.facadeControl;
    const drawingLayer = layer.getImpl().getOL3Layer();

    if (drawingLayer) {
      this.select = new ol.interaction.Select({
        wrapX: false,
        layers: [drawingLayer],
      });

      this.select.on('select', (e) => {
        if (e.target.getFeatures().getArray().length > 0) {
          facadeControl.onSelect(e);
        }
      });

      olMap.addInteraction(this.select);

      this.edit = new ol.interaction.Modify({ features: this.select.getFeatures() });
      this.edit.on('modifyend', (evt) => {
        facadeControl.onModify();
      });

      document.addEventListener('keyup', this.addEscEvent.bind(this));
      olMap.addInteraction(this.edit);
    }
  }

  /**
   * Loads GeoJSON layer
   * @public
   * @function
   * @param {*} source2 -
   */
  loadGeoJSONLayer(source, layerName) {
    let features = new ol.format.GeoJSON()
      .readFeatures(source, { featureProjection: this.facadeMap_.getProjection().code });

    features = this.featuresToFacade(features);
    features = features.filter((f) => {
      return f.getGeometry() !== null;
    });

    const layer = new M.layer.Vector({ name: layerName, legend: layerName, extract: true });
    layer.addFeatures(features);
    this.facadeMap_.addLayers(layer);
    layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
    return features;
  }

  /**
   * Loads GML layer
   * @public
   * @function
   * @param {*} source -
   */
  loadGMLLayer(source, layerName) {
    let newSource = source;
    let srs = this.facadeMap_.getProjection().code;
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

    let features = new ol.format.WFS({ gmlFormat: new ol.format.GML2() }).readFeatures(newSource, {
      dataProjection: srs,
      featureProjection: this.facadeMap_.getProjection().code,
    });

    features = features.map((f, index) => {
      const newF = f;
      if (!f.getGeometry()) {
        newF.setGeometry(f.get('geometry'));
      }

      return newF;
    });

    if (features.length === 0 || features[0].getGeometry() === undefined) {
      features = new ol.format.WFS({ gmlFormat: new ol.format.GML3() }).readFeatures(newSource, {
        dataProjection: srs,
        featureProjection: this.facadeMap_.getProjection().code,
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
      features = this.gmlParser(newSource);
    }

    features = this.featuresToFacade(features);
    const layer = new M.layer.Vector({ name: layerName, legend: layerName, extract: true });
    layer.addFeatures(features);
    this.facadeMap_.addLayers(layer);
    layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
    return features;
  }

  gmlParserAU(srs, source) {
    const features = [];
    const proj = this.facadeMap_.getProjection().code;
    source.split('<gml:LineString').forEach((elem) => {
      if (elem.indexOf('</gml:LineString>') > -1) {
        const coords = [];
        const rawCoords = elem.split('<gml:posList>')[1].split('</gml:posList>')[0].split(' ');
        for (let i = 0; i < rawCoords.length; i += 2) {
          if (i + 1 < rawCoords.length) {
            const coord = ol.proj.transform(
              [parseFloat(rawCoords[i]), parseFloat(rawCoords[i + 1])],
              srs,
              proj,
            );

            coords.push(coord);
          }
        }

        const newOlFeature = new ol.Feature({
          geometry: new ol.geom.LineString(coords),
        });

        newOlFeature.setId(elem.split('gml:id="')[1].split('"')[0]);
        features.push(newOlFeature);
      }
    });

    source.split('<gml:Point').forEach((elem) => {
      if (elem.indexOf('</gml:Point>') > -1) {
        const rawCoords = elem.split('<gml:pos>')[1].split('</gml:pos>')[0].split(' ');
        const coord = ol.proj.transform(
          [parseFloat(rawCoords[0]), parseFloat(rawCoords[1])],
          srs,
          proj,
        );

        const newOlFeature = new ol.Feature({
          geometry: new ol.geom.Point(coord),
        });

        newOlFeature.setId(elem.split('gml:id="')[1].split('"')[0]);
        features.push(newOlFeature);
      }
    });

    return features;
  }

  /**
   * Parse the features of a GML 3.2 layer
   * @private
   * @function
   * @param {*} source-
   */
  gmlParser(source) {
    const features = [];
    let superficies = this.parseSurfacesGml(source);
    if (superficies.length === 0) {
      superficies = this.parseGeometriesGml(source);
    }

    superficies = this.getEPSGFromGML32(source, superficies);
    const poligonos = this.getCoordinatesFromGML32(source, superficies);
    const geometriasPoligonos = [];
    poligonos.forEach((poligono) => {
      geometriasPoligonos.push({
        modo: poligono.modo,
        gml_tipo: poligono.tipo,
        gml: poligono.fichero,
        sistema: poligono.sistema,
        referencia: poligono.id,
        vertices: poligono.coordenadas.trim().split(' '),
      });
    });

    geometriasPoligonos.forEach((geometria) => {
      const polygonCoords = [];
      for (let i = 0; i < geometria.vertices.length; i += 2) {
        polygonCoords.push(ol.proj.transform(
          [parseFloat(geometria.vertices[i]),
            parseFloat(geometria.vertices[i + 1]),
          ],
          geometria.sistema,
          this.facadeMap_.getProjection().code,
        ));
      }

      const newOlFeature = new ol.Feature({
        geometry: new ol.geom.Polygon([polygonCoords]),
      });

      const style = new ol.style.Style({
        text: new ol.style.Text({
          text: `GML: ${geometria.referencia}\nFichero: ${geometria.gml}\n${geometria.modo}`,
        }),
      });

      newOlFeature.setStyle(style);
      newOlFeature.setId(`GML ${features.length + 1}`);
      features.push(newOlFeature);
    });

    return features;
  }

  /**
   * Parse the surfaces of a GML 3.2 layer
   * @private
   * @function
   * @param {*} source-
   */
  parseSurfacesGml(source) {
    const surfaces = [];
    const endTagSurface = '</gml:Surface>';
    let auxSource = source;
    while (auxSource !== '') {
      const firstSurfaceTag = auxSource.indexOf('<gml:Surface');
      let lastSurfaceTag = -2;
      if (firstSurfaceTag >= 0) {
        lastSurfaceTag = auxSource.indexOf(endTagSurface);
      }

      if (lastSurfaceTag > firstSurfaceTag) {
        surfaces.push({ surface: auxSource.substring(firstSurfaceTag, lastSurfaceTag + endTagSurface.length), id: '', sistema: '' });
        auxSource = auxSource.substring(lastSurfaceTag + endTagSurface.length, auxSource.length);
      } else if (auxSource.length !== 0) {
        auxSource = '';
      } else if (auxSource.length === 0) {
        break;
      }
    }

    return surfaces;
  }

  /**
   * Parse the other geometries of a GML 3.2 layer
   * @private
   * @function
   * @param {*} source-
   */
  parseGeometriesGml(source) {
    const geometries = [];
    const endTagPoint = '</gml:Point>';
    const endTagLine = '</gml:LineString>';
    const endTagInteriorPolygon = '</gml:interior>';
    const endTagPolygon = '</gml:exterior>';
    let polygonIndex = source.indexOf('<gml:exterior>');
    let lineIndex = source.indexOf('<gml:LineString');
    let pointIndex = source.indexOf('<gml:Point');
    let sourceAux = source;
    let indexInicial = -1;
    while (sourceAux !== '') {
      let indexEndTag = -2;
      if (polygonIndex !== '-1') {
        indexInicial = sourceAux.indexOf('<gml:exterior>');
        if (indexInicial >= 0) {
          indexEndTag = sourceAux.indexOf(endTagPolygon) + endTagPolygon.length;
        } else {
          polygonIndex = -1;
        }

        if (sourceAux.indexOf(endTagInteriorPolygon) >= 0) {
          indexEndTag = sourceAux.indexOf(endTagInteriorPolygon) + endTagInteriorPolygon.length;
        }
      }

      if (lineIndex !== -1 && indexInicial < 0) {
        indexInicial = sourceAux.indexOf('<gml:LineString');
        if (indexInicial >= 0) {
          indexEndTag = sourceAux.indexOf(endTagLine) + endTagLine.length;
        } else {
          lineIndex = -1;
        }
      }

      if (pointIndex !== -1 && indexInicial < 0) {
        indexInicial = sourceAux.indexOf('<gml:Point');
        if (indexInicial >= 0) {
          indexEndTag = sourceAux.indexOf(endTagPoint) + endTagPoint.length;
        } else {
          pointIndex = -1;
        }
      }

      if (indexInicial > indexEndTag) {
        geometries.push({ surface: sourceAux.substring(indexInicial, indexEndTag), id: '', sistema: '' });
      } else {
        sourceAux = '';
      }
    }

    return geometries;
  }

  /**
   * Parse the surface coordinates of a GML 3.2 layer
   * @private
   * @function
   * @param {*} source -
   * @param {*} superficies -
   */
  getCoordinatesFromGML32(source, superficies) {
    const poligonos = [];
    superficies.forEach((superficie) => {
      let exteriores = superficie.surface;
      let posiciones = superficie.surface;
      let contador = 0;
      while (exteriores !== '') {
        let indexInicial = exteriores.indexOf('gml:exterior');
        let indexFinal = -2;
        let coordenadas = '';
        if (indexInicial >= 0) {
          indexFinal = exteriores.indexOf('</gml:exterior');
          if (indexFinal > indexInicial) {
            const exteriorElement = exteriores.substring(indexInicial, indexFinal);
            const indexInicialElement = exteriorElement.indexOf('gml:posList');
            let indexFinalElement = -2;
            if (indexInicialElement >= 0) {
              indexFinalElement = exteriorElement.indexOf('</gml:posList>');
              if (indexFinalElement > indexInicialElement) {
                coordenadas = exteriorElement.substring(indexInicialElement, indexFinalElement);
              }
            }
            exteriores = exteriores.substring(indexFinal + 14, exteriores.length);
          } else {
            exteriores = '';
          }
        } else {
          exteriores = '';
        }

        if (coordenadas !== '') {
          indexInicial = coordenadas.indexOf('>');
          if (indexInicial >= 0) {
            coordenadas = coordenadas.substring(indexInicial + 1, coordenadas.legnth);
            const idSuperficie = superficie.id !== '' ? superficie.id : `ID_${contador}`;
            const nombreSuperficie = superficie.id !== '' ? superficie.id : `nombre_${contador}`;
            poligonos.push({
              modo: 'Exterior',
              fichero: undefined,
              tipo: undefined,
              id: `${idSuperficie}_${contador}`,
              coordenadas,
              nombre: `${nombreSuperficie}_${contador}`,
              sistema: superficie.sistema,
            });

            contador += 1;
          }
        }
      }

      while (posiciones.indexOf('<gml:posList>') !== -1) {
        const lineStringTag = '<gml:posList>';
        let coordenadas = '';
        const indexInicial = posiciones.indexOf(lineStringTag) + lineStringTag.length;
        const indexFinal = posiciones.indexOf('</gml:posList>');
        if (indexInicial >= 0) {
          coordenadas = posiciones.substring(indexInicial, indexFinal);
          posiciones = posiciones.substring(indexFinal, posiciones.length);
        }

        if (coordenadas !== '') {
          const idSuperficie = superficie.id !== '' ? superficie.id : `ID_${contador}`;
          const nombreSuperficie = superficie.id !== '' ? superficie.id : `nombre_${contador}`;
          poligonos.push({
            modo: 'Exterior',
            fichero: undefined,
            tipo: undefined,
            id: `${idSuperficie}_${contador}`,
            coordenadas,
            nombre: `${nombreSuperficie}_${contador}`,
            sistema: superficie.sistema,
          });

          contador += 1;
        }
      }

      while (posiciones.indexOf('<gml:pos>') !== -1) {
        const pointTag = '<gml:pos>';
        let coordenadas = '';
        const indexInicial = posiciones.indexOf(pointTag) + pointTag.length;
        const indexFinal = posiciones.indexOf('</gml:pos>');
        if (indexInicial >= 0) {
          coordenadas = posiciones.substring(indexInicial, indexFinal);
          posiciones = posiciones.substring(indexFinal, posiciones.length);
        }

        if (coordenadas !== '') {
          const idSuperficie = superficie.id !== '' ? superficie.id : `ID_${contador}`;
          const nombreSuperficie = superficie.id !== '' ? superficie.id : `nombre_${contador}`;
          poligonos.push({
            modo: 'Exterior',
            fichero: undefined,
            tipo: undefined,
            id: `${idSuperficie}_${contador}`,
            coordenadas,
            nombre: `${nombreSuperficie}_${contador}`,
            sistema: superficie.sistema,
          });

          contador += 1;
        }
      }
    });

    return poligonos;
  }

  getEPSGFromGML32(source, superficies) {
    superficies.map((superficie) => {
      const superficieAux = superficie;
      let indexInicial = superficieAux.surface.indexOf('id=');
      let indexFinal = -2;
      let coordSystem = '';
      if (indexInicial >= 0) {
        indexFinal = superficieAux.surface.indexOf('srsName=', indexInicial + 4);
      }

      if (indexFinal > indexInicial) {
        superficieAux.id = superficieAux.surface.substring(indexInicial + 4, indexFinal - 2);
      }

      indexInicial = superficieAux.surface.indexOf('>', indexFinal + 10);
      if (indexInicial > indexFinal) {
        coordSystem = superficieAux.surface.substring(indexInicial + 25, indexFinal - 1);
      }

      if (coordSystem.indexOf('EPSG::326') > -1) {
        const projectionNumber = parseInt(coordSystem.substring(coordSystem.indexOf('::') + 2, coordSystem.indexOf('>') - 1), 10) - 6800;
        coordSystem = `EPSG::${projectionNumber}`;
      } else if (coordSystem.indexOf('::') === -1) {
        if (coordSystem.indexOf('opengis.net/def/crs')) {
          const projectionType = coordSystem.indexOf('258') === -1 ? coordSystem.indexOf('326') : coordSystem.indexOf('258');
          coordSystem = `EPSG::${coordSystem.substring(projectionType, coordSystem.indexOf('>') - 1)}`;
        } else {
          const gmlGlobalEPSG = source.indexOf('srsName=') + 9;
          coordSystem = source.substring(indexInicial, source.indexOf('"', gmlGlobalEPSG));
        }
      } else {
        coordSystem = coordSystem.substring(coordSystem.indexOf('EPSG'), coordSystem.indexOf('>') - 1);
      }

      superficieAux.sistema = coordSystem.replace('::', ':');
      return superficieAux;
    });

    return superficies;
  }

  /**
   * Loads GeoJSON layer
   * @public
   * @function
   * @param {*} source-
   */
  loadAllInGeoJSONLayer(sources, layerName) {
    let features = [];
    sources.forEach((source) => {
      const localFeatures = new ol.format.GeoJSON()
        .readFeatures(source, { featureProjection: this.facadeMap_.getProjection().code });
      if (localFeatures !== null && localFeatures !== undefined && localFeatures.length > 0) {
        features = features.concat(localFeatures);
      }
    });

    features = this.featuresToFacade(features);
    const layer = new M.layer.Vector({ name: layerName, legend: layerName, extract: true });
    layer.addFeatures(features);
    this.facadeMap_.addLayers(layer);
    layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
    return features;
  }

  /**
   * Loads KML layer
   * @public
   * @function
   * @api
   * @param {*} source -
   * @param {*} extractStyles -
   */
  loadKMLLayer(source, layerName, extractStyles) {
    let features = new ol.format.KML({ extractStyles })
      .readFeatures(source, { featureProjection: this.facadeMap_.getProjection().code });

    features = this.featuresToFacade(features);
    features = this.geometryCollectionParse(features);
    const others = [];
    const lines = [];
    features.forEach((f) => {
      if (f.getGeometry().type.toLowerCase().indexOf('linestring') > -1) {
        lines.push(f);
      } else {
        others.push(f);
      }
    });

    if (lines.length > 0) {
      const layer = new M.layer.Vector({ name: `${layerName}_lines`, legend: `${layerName}_lines`, extract: true });
      layer.addFeatures(lines);
      this.facadeMap_.addLayers(layer);
      layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
    }

    if (others.length > 0) {
      const layer = new M.layer.Vector({ name: layerName, legend: layerName, extract: true });
      layer.addFeatures(others);
      this.facadeMap_.addLayers(layer);
      layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
    }

    return features;
  }

  /**
   * Loads GPX layer.
   * @public
   * @function
   * @api
   * @param {*} source -
   */
  loadGPXLayer(source, layerName) {
    let features = [];
    const origFeatures = new ol.format.GPX()
      .readFeatures(source, { featureProjection: this.facadeMap_.getProjection().code });
    origFeatures.forEach((f) => {
      if (f.getGeometry().getType() === 'MultiLineString') {
        if (f.getGeometry().getLineStrings().length === 1) {
          const geom = f.getGeometry().getLineStrings()[0];
          f.setGeometry(geom);
        }
      }

      features.push(f);
    });

    let lines = features.filter((f) => {
      return f.getGeometry().getType().indexOf('LineString') > -1;
    });

    let points = features.filter((f) => {
      return f.getGeometry().getType().indexOf('Point') > -1;
    });

    lines = this.featuresToFacade(lines);
    const layer = new M.layer.Vector({ name: layerName, legend: layerName, extract: true });
    layer.addFeatures(lines);
    this.facadeMap_.addLayers(layer);
    layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);

    if (points.length > 0) {
      points = this.featuresToFacade(points);
      const layer2 = new M.layer.Vector({ name: `${layerName}_points`, legend: `${layerName}_points`, extract: true });
      layer2.addFeatures(points);
      this.facadeMap_.addLayers(layer2);
      layer2.setZIndex(layer2.getZIndex() + PLUS_ZINDEX);
      features = lines.concat(points);
    } else {
      features = lines;
    }

    return features;
  }

  /**
   * Converts Openlayers features to Mapea features.
   * @public
   * @function
   * @api
   * @param {Array<OL.Feature>} implFeatures
   * @returns {Array<M.Feature>}
   */
  featuresToFacade(implFeatures) {
    return implFeatures.map((feature) => {
      return M.impl.Feature.olFeature2Facade(feature);
    });
  }

  /**
   * Centers on features
   * @public
   * @function
   * @api
   * @param {*} features -
   */
  centerFeatures(features, isGPX) {
    if (!M.utils.isNullOrEmpty(features)) {
      if ((features.length === 1) && (features[0].getGeometry().type === 'Point')) {
        const pointView = new ol.View({
          center: features[0].getGeometry().coordinates,
          zoom: 15,
        });
        this.facadeMap_.getMapImpl().setView(pointView);
      } else {
        const extent = M.impl.utils.getFeaturesExtent(features);
        this.facadeMap_.getMapImpl().getView().fit(extent, {
          duration: 500,
          minResolution: 1,
        });
      }

      features.forEach((f) => {
        switch (f.getGeometry().type) {
          case 'Point':
          case 'MultiPoint':
            const newPointStyle = {
              radius: 6,
              fill: {
                color: '#71a7d3',
              },
              stroke: {
                color: 'white',
                width: 2,
              },
            };

            if (isGPX && f.getAttributes().name !== undefined && f.getAttributes().name !== '') {
              newPointStyle.label = {
                fill: {
                  color: '#ff0000',
                },
                stroke: {
                  color: 'white',
                  width: 2,
                  linedash: [0, 0],
                  linedashoffset: 0,
                  linecap: 'none',
                  linejoin: 'none',
                },
                scale: 2,
                text: f.getAttributes().name,
                font: '8px sanserif',
                align: 'center',
                baseline: 'top',
                rotate: false,
                rotation: 0,
                offset: [0, 10],
              };
            }

            if (f !== undefined) f.setStyle(new M.style.Point(newPointStyle));
            break;
          case 'LineString':
          case 'MultiLineString':
            const newLineStyle = new M.style.Line({
              stroke: {
                color: '#71a7d3',
                width: 6,
                linedash: undefined,
              },
            });
            if (f !== undefined) f.setStyle(newLineStyle);
            break;
          case 'Polygon':
          case 'MultiPolygon':
            const newPolygonStyle = new M.style.Polygon({
              fill: {
                color: '#71a7d3',
                opacity: 0.2,
              },
              stroke: {
                color: '#71a7d3',
                width: 6,
              },
            });
            if (f !== undefined) f.setStyle(newPolygonStyle);
            break;
          default:
            break;
        }
      });
    }
  }

  /**
   * Gets extent of feature
   * @public
   * @function
   * @api
   * @param {M.Featuer} mapeaFeature
   */
  getFeatureExtent() {
    return this.facadeControl.feature.getImpl().getOLFeature().getGeometry().getExtent();
  }

  /**
   * Gets coordinates of current feature.
   * @public
   * @function
   * @api
   */
  getFeatureCoordinates() {
    return this.facadeControl.feature.getImpl().getOLFeature().getGeometry().getCoordinates();
  }

  /**
   * Gets feature length
   * @public
   * @function
   * @api
   */
  getFeatureLength() {
    let res = 0;
    const geom = this.facadeControl.feature.getImpl().getOLFeature().getGeometry();
    if (typeof geom.getLength !== 'function') {
      geom.getLineStrings().forEach((line) => {
        res += this.getGeometryLength(line);
      });
    } else {
      res = this.getGeometryLength(geom);
    }

    return res;
  }

  getGeometryLength(geometry) {
    let length = 0;
    const codeProj = this.facadeMap_.getProjection().code;
    const unitsProj = this.facadeMap_.getProjection().units;
    if (codeProj === 'EPSG:3857') {
      length = ol.sphere.getLength(geometry);
    } else if (unitsProj === 'd') {
      const coordinates = geometry.getCoordinates();
      for (let i = 0, ii = coordinates.length - 1; i < ii; i += 1) {
        length += ol.sphere.getDistance(ol.proj.transform(coordinates[i], codeProj, 'EPSG:4326'), ol.proj.transform(coordinates[i + 1], codeProj, 'EPSG:4326'));
      }
    } else {
      length = geometry.getLength();
    }

    return length;
  }

  get3DLength(id) {
    const elem = document.querySelector(`#${id}`);
    const flatLength = this.getFeatureLength();
    this.calculateProfilePoints(this.facadeControl.feature, (points) => {
      let length = 0;
      for (let i = 0, ii = points.length - 1; i < ii; i += 1) {
        const geom = new ol.geom.LineString([points[i], points[i + 1]]);
        const distance = this.getGeometryLength(geom);
        const elevDiff = Math.abs(points[i][2] - points[i + 1][2]);
        length += Math.sqrt((distance * distance) + (elevDiff * elevDiff));
      }

      if (length < flatLength) {
        length = flatLength + ((flatLength - length) / 2);
      }

      let m = `${formatNumber(length / 1000, 2)}km`;
      if (length < 1000) {
        m = `${formatNumber(length, 0)}m`;
      }

      elem.innerHTML = m;
      this.facadeControl.feature.setAttribute('3dLength', length);
    }, () => {
      elem.innerHTML = '-';
      M.dialog.error(getValue('try_again'));
    });
  }

  /**
   * Gets feature area
   * @public
   * @function
   * @api
   */
  getFeatureArea() {
    const projection = this.facadeMap_.getProjection();
    const geom = this.facadeControl.feature.getImpl().getOLFeature().getGeometry();
    return ol.sphere.getArea(geom, { projection: projection.code });
  }

  /**
   * Convert olFeature to M.Feature
   * @public
   * @function
   * @api
   */
  convertToMFeatures(olFeature) {
    const feature = new M.Feature(olFeature.getId(), {
      geometry: {
        coordinates: olFeature.getGeometry().getCoordinates(),
        type: olFeature.getGeometry().getType(),
      },
      properties: olFeature.getProperties(),
    });

    return feature;
  }

  /**
   * Turns GeometryCollection features into single geometry features.
   * @public
   * @function
   * @api
   * @param {Array<M.Feature>} features
   */
  geometryCollectionParse(features) {
    const parsedFeatures = [];
    features.forEach((feature) => {
      if (feature.getGeometry().type === 'GeometryCollection') {
        const geometries = feature.getGeometry().geometries;
        geometries.forEach((geometry) => {
          const num = Math.random();
          const newFeature = new M.Feature(`mf${num}`, {
            type: 'Feature',
            id: `gf${num}`,
            geometry: {
              type: geometry.type,
              coordinates: geometry.coordinates,
            },
          });
          parsedFeatures.push(newFeature);
        });
      } else {
        parsedFeatures.push(feature);
      }
    });
    return parsedFeatures;
  }

  calculateElevations(feature) {
    const srs = this.facadeMap_.getProjection().code;
    const geomType = feature.getGeometry().type;
    const coordinates = feature.getGeometry().coordinates;
    let pointsCoord = '';
    if (geomType.toLowerCase().indexOf('point') > -1) {
      const newC = ol.proj.transform(coordinates, srs, WGS84);
      pointsCoord += `${newC[0]},${newC[1]},${newC[0] + 0.000001},${newC[1] + 0.000001}|`;
    } else if (geomType.toLowerCase().indexOf('linestring') > -1) {
      coordinates.forEach((c) => {
        const newC = ol.proj.transform(c, srs, WGS84);
        pointsCoord += `${newC[0]},${newC[1]},${newC[0] + 0.000001},${newC[1] + 0.000001}|`;
      });
    } else if (geomType.toLowerCase().indexOf('polygon') > -1) {
      coordinates[0].forEach((c) => {
        const newC = ol.proj.transform(c, srs, WGS84);
        pointsCoord += `${newC[0]},${newC[1]},${newC[0] + 0.000001},${newC[1] + 0.000001}|`;
      });
    }

    const pointsBbox = pointsCoord.split('|').filter((elem) => {
      return elem !== '' && elem.trim().length > 3;
    });

    const altitudes = [];
    const promises = [];
    M.proxy(false);
    pointsBbox.forEach((bbox) => {
      const url = `${PROFILE_URL}${bbox}${PROFILE_URL_SUFFIX}`;
      promises.push(M.remote.get(url));
    });

    Promise.all(promises).then((responses) => {
      M.proxy(true);
      responses.forEach((response) => {
        let alt = 0;
        const responseText = response.text.split(NO_DATA_VALUE).join('');
        if (responseText.indexOf('dy') > -1) {
          alt = responseText.split('dy')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        } else if (responseText.indexOf('cellsize') > -1) {
          alt = responseText.split('cellsize')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        }

        altitudes.push(parseFloat(alt));
      });

      const geom = feature.getGeometry();
      if (geomType.toLowerCase().indexOf('point') > -1) {
        geom.coordinates.push(altitudes[0]);
      } else if (geomType.toLowerCase().indexOf('linestring') > -1) {
        geom.coordinates.forEach((c, index) => {
          c.push(altitudes[index]);
        });
      } else if (geomType.toLowerCase().indexOf('polygon') > -1) {
        geom.coordinates[0].forEach((c, index) => {
          c.push(altitudes[index]);
        });
      }

      feature.setGeometry(geom);
    }).catch((err) => {
      M.proxy(true);
    });
  }

  calculateProfilePoints(feature, callback, callbackError) {
    let coordinates = [];
    if (feature.getGeometry().type === 'MultiLineString') {
      feature.getGeometry().coordinates.forEach((path) => {
        coordinates = coordinates.concat(path);
      });
    } else {
      coordinates = feature.getGeometry().coordinates;
    }

    let pointsCoord = '';
    for (let i = 1; i < coordinates.length; i += 1) {
      pointsCoord = pointsCoord.concat(this.findNewPoints(coordinates[i - 1], coordinates[i]));
    }

    let pointsBbox = pointsCoord.split('|');
    while (pointsBbox.length > 150) {
      pointsBbox = pointsBbox.filter((elem, i) => {
        return i % 2 === 0;
      });
    }

    const altitudes = [];
    const promises = [];
    pointsBbox = pointsBbox.filter((elem) => {
      return elem !== '' && elem.trim().length > 3;
    });

    M.proxy(false);
    pointsBbox.forEach((bbox) => {
      const url = `${PROFILE_URL}${bbox}${PROFILE_URL_SUFFIX}`;
      promises.push(M.remote.get(url));
    });

    Promise.all(promises).then((responses) => {
      M.proxy(true);
      responses.forEach((response) => {
        let alt = 0;
        const responseText = response.text.split(NO_DATA_VALUE).join('');
        if (responseText.indexOf('dy') > -1) {
          alt = responseText.split('dy')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        } else if (responseText.indexOf('cellsize') > -1) {
          alt = responseText.split('cellsize')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        }

        altitudes.push(parseFloat(alt));
      });

      const arrayXZY = [];
      altitudes.forEach((data, index) => {
        const points = pointsBbox[index].split(',');
        const center = ol.extent.getCenter([parseFloat(points[0]), parseFloat(points[1]),
          parseFloat(points[2]), parseFloat(points[3]),
        ]);
        arrayXZY.push([center[0], center[1], data]);
      });

      let arrayXZY2 = arrayXZY.map((coord) => {
        return ol.proj.transform(coord, 'EPSG:4326', this.facadeMap_.getProjection().code);
      });

      arrayXZY2 = arrayXZY2.filter((item) => {
        return item[2] > 0;
      });

      callback(arrayXZY2);
    }).catch((err) => {
      M.proxy(true);
      callbackError();
    });
  }

  calculateProfile(feature) {
    let coordinates = [];
    if (feature.getGeometry().type === 'MultiLineString') {
      feature.getGeometry().coordinates.forEach((path) => {
        coordinates = coordinates.concat(path);
      });
    } else if (feature.getGeometry().type === 'Polygon') {
      coordinates = [].concat(feature.getGeometry().coordinates[0]);
      coordinates.pop();
    } else {
      coordinates = [].concat(feature.getGeometry().coordinates);
    }

    let pointsCoord = '';
    for (let i = 1; i < coordinates.length; i += 1) {
      pointsCoord = pointsCoord.concat(this.findNewPoints(coordinates[i - 1], coordinates[i]));
    }

    let pointsBbox = pointsCoord.split('|');
    while (pointsBbox.length > 150) {
      pointsBbox = pointsBbox.filter((elem, i) => {
        return i % 2 === 0;
      });
    }

    const altitudes = [];
    const promises = [];
    pointsBbox = pointsBbox.filter((elem) => {
      return elem !== '' && elem.trim().length > 3;
    });

    M.proxy(false);
    pointsBbox.forEach((bbox) => {
      const url = `${PROFILE_URL}${bbox}${PROFILE_URL_SUFFIX}`;
      promises.push(M.remote.get(url));
    });

    Promise.all(promises).then((responses) => {
      M.proxy(true);
      responses.forEach((response) => {
        let alt = 0;
        const responseText = response.text.split(NO_DATA_VALUE).join('');
        if (responseText.indexOf('dy') > -1) {
          alt = responseText.split('dy')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        } else if (responseText.indexOf('cellsize') > -1) {
          alt = responseText.split('cellsize')[1].split(' ').filter((item) => {
            return item !== '';
          })[1];
        }

        altitudes.push(parseFloat(alt));
      });

      const arrayXZY = [];
      altitudes.forEach((data, index) => {
        const points = pointsBbox[index].split(',');
        const center = ol.extent.getCenter([parseFloat(points[0]), parseFloat(points[1]),
          parseFloat(points[2]), parseFloat(points[3]),
        ]);
        arrayXZY.push([center[0], center[1], data]);
      });

      let arrayXZY2 = arrayXZY.map((coord) => {
        return ol.proj.transform(coord, 'EPSG:4326', this.facadeMap_.getProjection().code);
      });

      arrayXZY2 = arrayXZY2.filter((item) => {
        return item[2] > 0;
      });

      this.showProfile(arrayXZY2);
    }).catch((err) => {
      M.proxy(true);
      document.querySelector('.m-vectors .m-vectors-loading-container').innerHTML = '';
      M.dialog.error(getValue('exception.query_profile'), 'Error');
    });
  }

  showProfile(coord) {
    const lineString = new ol.geom.LineString(coord);
    const feature = new ol.Feature({
      geometry: lineString,
      name: 'Line',
    });

    this.pt = new ol.Feature(new ol.geom.Point([0, 0]));
    const profil = new Profil({
      info: {
        zmin: getValue('zmin'),
        zmax: getValue('zmax'),
        altitude: getValue('altitude'),
        distance: getValue('distance'),
        ytitle: getValue('ytitle'),
        xtitle: getValue('xtitle'),
        altitudeUnits: 'm',
        distanceUnitsM: 'm',
        distanceUnitsKM: 'km',
      },
      projection: this.facadeMap_.getProjection().code,
      map: this.facadeMap_.getMapImpl(),
      title: getValue('profile'),
      pointLayer: this.source_,
      width: 400,
      height: 200,
    });

    this.facadeMap_.getMapImpl().addControl(profil);
    const drawPoint = (e) => {
      if (!this.pt) return;
      if (e.type === 'over') {
        this.pt.setGeometry(new ol.geom.Point(e.coord));
        this.pt.setStyle([new ol.style.Style({
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: '#ff0000',
            }),
          }),
        })]);
      } else {
        this.pt.setStyle([]);
      }
    };

    profil.setGeometry(feature);
    this.pt.setStyle([]);
    this.source_.addFeature(this.pt);
    profil.on(['over', 'out'], (e) => {
      if (e.type === 'over') profil.popup(`${e.coord[2]} m`);
      drawPoint(e);
    });

    profil.show();
    document.querySelector('.m-vectors .m-vectors-loading-container').innerHTML = '';
  }

  findNewPoints(originPoint, destPoint) {
    const srs = this.facadeMap_.getProjection().code;
    const oriMete = ol.proj.transform(originPoint, srs, MERCATOR);
    const destMete = ol.proj.transform(destPoint, srs, MERCATOR);
    const angle = this.getAngleBetweenPoints(oriMete, destMete);
    const distance = this.getDistBetweenPoints(originPoint, destPoint);
    let addX;
    let addY;
    let res;
    let points = '';
    if (distance >= 50) {
      const distPoint = (distance / this.distance_ > this.distance_)
        ? distance / this.distance_
        : this.distance_;
      for (let i = 0; i <= distance / distPoint; i += 1) {
        if (angle >= 0 && angle <= 90) {
          [addX, addY] = [1, 1];
        } else if (angle >= 90) {
          [addX, addY] = [-1, 1];
        } else if (angle <= 0 && angle >= -90) {
          [addX, addY] = [1, -1];
        } else {
          [addX, addY] = [-1, -1];
        }

        const nPA = [(Math.cos((angle * Math.PI) / 180) * (distPoint * i)) + oriMete[0],
          (Math.sin((angle * Math.PI) / 180) * (distPoint * i)) + oriMete[1],
        ];
        const nPB = [(Math.cos((angle * Math.PI) / 180) * ((distPoint * i) + addX)) + oriMete[0],
          (Math.sin((angle * Math.PI) / 180) * ((distPoint * i) + addY)) + oriMete[1],
        ];
        const coord1 = (ol.proj.transform(nPA, MERCATOR, WGS84));
        const coord2 = (ol.proj.transform(nPB, MERCATOR, WGS84));
        points += `${coord1},${coord2}|`;
      }

      res = points;
    } else {
      const distPoint = (distance / this.distance_ > this.distance_)
        ? distance / this.distance_
        : this.distance_;
      if (angle >= 0 && angle <= 90) {
        [addX, addY] = [1, 1];
      } else if (angle >= 90) {
        [addX, addY] = [-1, 1];
      } else if (angle <= 0 && angle >= -90) {
        [addX, addY] = [1, -1];
      } else {
        [addX, addY] = [-1, -1];
      }

      const nPA = [(Math.cos((angle * Math.PI) / 180) * distPoint) + oriMete[0],
        (Math.sin((angle * Math.PI) / 180) * distPoint) + oriMete[1],
      ];
      const nPB = [(Math.cos((angle * Math.PI) / 180) * (distPoint + addX)) + oriMete[0],
        (Math.sin((angle * Math.PI) / 180) * (distPoint + addY)) + oriMete[1],
      ];
      const coord1 = (ol.proj.transform(nPA, MERCATOR, WGS84));
      const coord2 = (ol.proj.transform(nPB, MERCATOR, WGS84));
      res = `${coord1},${coord2}|`;
    }

    return res;
  }

  getDistBetweenPoints(firstPoint, secondPoint) {
    const srs = this.facadeMap_.getProjection().code;
    const line = new ol.geom.LineString([ol.proj.transform(firstPoint, srs, MERCATOR),
      ol.proj.transform(secondPoint, srs, MERCATOR),
    ]);
    return line.getLength();
  }

  getAngleBetweenPoints(firstPoint, secondPoint) {
    const p1 = { x: firstPoint[0], y: firstPoint[1] };
    const p2 = { x: secondPoint[0], y: secondPoint[1] };
    return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  }

  removeMapEvents(map) {
    this.removeMapOverlays(map);
    map.getMapImpl().removeEventListener('pointermove');
  }

  addMapsEvents(map) {
    map.getMapImpl().on('pointermove', (evt) => {
      if (this.selected_ !== null) {
        this.removeMapOverlays(map);
        this.selected_ = null;
      }

      const layers = [];
      map.getMapImpl().forEachFeatureAtPixel(evt.pixel, (feature) => {
        if (feature.getId() !== undefined && feature.getId() !== null) {
          const filtered = map.getLayers().filter((l) => {
            return ['kml', 'geojson', 'wfs', 'vector'].indexOf(l.type.toLowerCase()) > -1 && l.getFeatureById(feature.getId()) !== undefined;
          });

          if (filtered.length > 0) {
            const layer = filtered[0];
            const name = layer.legend || layer.name;
            if (layers.indexOf(name) < 0) {
              layers.push(name);
            }
          }

          this.selected_ = feature;
        }
      });

      if (layers.length > 0 && this.selected_ !== null) {
        let layerNames = '';
        layers.forEach((layerName) => {
          layerNames += `<p>- ${layerName}</p>`;
        });

        const htmlString = `<div id='popup-overlay' class='popup-overlay-container'>
          <div class='popup-overlay-title'>
            ${getValue('vector_layers')}
            <button id='overlay-close-button' class='popup-overlay-close-button'>
              X
            </button>
          </div>
          <div class='popup-overlay-info-container'>
            <div>
              ${layerNames}
            </div>
          </div>
        </div>`;

        const doc = new DOMParser().parseFromString(htmlString, 'text/html');
        const overlay = new ol.Overlay({
          element: doc.getElementById('popup-overlay'),
          stopEvent: true,
          autoPan: true,
          autoPanAnimation: {
            duration: 250,
          },
          position: evt.coordinate,
          positioning: 'top-right',
        });

        map.getMapImpl().addOverlay(overlay);
        document.getElementById('overlay-close-button').addEventListener('click', this.removeMapOverlays.bind(null, map));
      } else {
        this.removeMapOverlays(map);
      }
    });
  }

  removeMapOverlays(map) {
    const overlays = map.getMapImpl().getOverlays().getArray();
    overlays.forEach((item) => {
      if (item.getKeys().indexOf('element') > -1
        && item.element.innerHTML.indexOf('m-measure') < 0) {
        map.getMapImpl().removeOverlay(item);
      }
    });
  }

  addWFSLayer(url, name, legend) {
    const map = this.facadeMap_;
    const srs = map.getProjection().code;
    if (WFS_EXCEPTIONS.indexOf(url) > -1) {
      const facadeControl = this.facadeControl;
      if (map.getZoom() >= facadeControl.wfszoom) {
        let cancelFlag = false;
        const content = '<p class="m-vectors-loading"><span class="icon-spinner" /></p>';
        M.dialog.info(content, getValue('loading'));
        setTimeout(() => {
          document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
          const button = document.querySelector('div.m-dialog.info div.m-button > button');
          button.innerHTML = getValue('cancel');
          button.style.width = '75px';
          button.style.backgroundColor = '#71a7d3';
          button.addEventListener('click', (e) => {
            e.preventDefault();
            cancelFlag = true;
          });

          const bbox = map.getBbox();
          const extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
          const wfsURL = `${url}service=WFS&version=2.0.0&request=GetFeature&typename=${name}&`
            + `outputFormat=${encodeURIComponent(GML_FORMAT)}&srsName=${srs}&bbox=${extent.join(',')},${srs}`;
          const layer = new M.layer.Vector({ name, legend, extract: true });
          M.remote.get(wfsURL).then((response) => {
            if (!cancelFlag) {
              const responseWFS = response.text.replace(/wfs:member/gi, 'gml:featureMember');
              const formatter = new ol.format.WFS({ gmlFormat: ol.format.GML2() });
              let features = formatter.readFeatures(responseWFS);
              features = features.map((f, index) => {
                const newF = f;
                if (!f.getGeometry()) {
                  newF.setGeometry(f.get('geometry'));
                }

                return newF;
              });

              if (features.length > 0) {
                features = this.featuresToFacade(features);
                layer.addFeatures(features);
                layer.updatable = true;
                layer.url = url;
                this.facadeMap_.addLayers(layer);
                layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
                document.querySelector('div.m-mapea-container div.m-dialog').remove();
              } else {
                document.querySelector('div.m-mapea-container div.m-dialog').remove();
                M.dialog.error(getValue('exception.error_no_features_wfs'), 'Error');
              }
            } else {
              document.querySelector('div.m-mapea-container div.m-dialog').remove();
            }
          }).catch((err) => {
            document.querySelector('div.m-mapea-container div.m-dialog').remove();
            if (!cancelFlag) {
              M.dialog.error(getValue('exception.error_features_wfs'), 'Error');
            }
          });
        }, 10);
      } else {
        const levels = facadeControl.wfszoom - map.getZoom();
        M.dialog.info(getValue('exception.wfs_zoom').replace('*', levels), getValue('warning'));
      }
    } else {
      const namespace = name.split(':')[0];
      const namelayer = name.split(':')[1];
      try {
        const obj = {
          url,
          legend,
        };
        if (M.utils.isUndefined(namelayer)) {
          obj.name = namespace;
        } else if (!M.utils.isUndefined(namespace && !M.utils.isUndefined(namelayer))) {
          obj.name = namelayer;
          obj.namespace = namespace;
        }
        const layer = new M.layer.WFS(obj);

        this.facadeMap_.addLayers(layer);
        this.waitLayerLoaded(layer);
      } catch (err) {
        M.dialog.error(getValue('exception.error_wfs'), 'Error');
      }
    }
  }

  reloadFeaturesUpdatables(layerName, layerURL) {
    const map = this.facadeMap_;
    const srs = map.getProjection().code;
    const filtered = map.getLayers().filter((layer) => {
      return ['kml', 'geojson', 'wfs', 'vector'].indexOf(layer.type.toLowerCase()) > -1 && layer.isVisible()
        && layer.name !== undefined && layer.name !== 'selectLayer' && layer.name !== '__draw__' && layer.updatable
        && layer.name === layerName && layer.url === layerURL && layer.name !== 'coordinateresult'
        && layer.name !== 'searchresult' && layer.name !== 'infocoordinatesLayerFeatures';
    });

    if (filtered.length > 0) {
      const layer = filtered[0];
      const facadeControl = this.facadeControl;
      if (map.getZoom() >= facadeControl.wfszoom) {
        let cancelFlag = false;
        const content = '<p class="m-vectors-loading"><span class="icon-spinner" /></p>';
        M.dialog.info(content, getValue('loading'));
        setTimeout(() => {
          document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
          const button = document.querySelector('div.m-dialog.info div.m-button > button');
          button.innerHTML = getValue('cancel');
          button.style.width = '75px';
          button.style.backgroundColor = '#71a7d3';
          button.addEventListener('click', (e) => {
            e.preventDefault();
            cancelFlag = true;
          });

          const bbox = map.getBbox();
          const extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
          const wfsURL = `${layer.url}service=WFS&version=2.0.0&request=GetFeature&typename=${layer.name}&`
            + `outputFormat=${encodeURIComponent(GML_FORMAT)}&srsName=${srs}&bbox=${extent.join(',')},${srs}`;
          M.remote.get(wfsURL).then((response) => {
            if (!cancelFlag) {
              const responseWFS = response.text.replace(/wfs:member/gi, 'gml:featureMember');
              const formatter = new ol.format.WFS({ gmlFormat: ol.format.GML2() });
              let features = formatter.readFeatures(responseWFS);
              features = features.map((f, index) => {
                const newF = f;
                if (!f.getGeometry()) {
                  newF.setGeometry(f.get('geometry'));
                }

                return newF;
              });

              if (features.length > 0) {
                features = this.featuresToFacade(features);
                layer.removeFeatures(layer.getFeatures());
                layer.addFeatures(features);
                document.querySelector('div.m-mapea-container div.m-dialog').remove();
              } else {
                document.querySelector('div.m-mapea-container div.m-dialog').remove();
                M.dialog.error(getValue('exception.error_no_features_wfs'), 'Error');
              }
            } else {
              document.querySelector('div.m-mapea-container div.m-dialog').remove();
            }
          }).catch((err) => {
            document.querySelector('div.m-mapea-container div.m-dialog').remove();
            if (!cancelFlag) {
              M.dialog.error(getValue('exception.error_features_wfs'), 'Error');
            }
          });
        }, 10);
      } else {
        const levels = facadeControl.wfszoom - map.getZoom();
        M.dialog.info(getValue('exception.wfs_zoom').replace('*', levels), getValue('warning'));
      }
    } else {
      M.dialog.error(getValue('exception.error_features_wfs'), 'Error');
    }
  }

  waitLayerLoaded(layer) {
    if (layer.getGeometryType() === null) {
      setTimeout(() => {
        this.waitLayerLoaded(layer);
      }, 200);
    } else {
      layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
      this.facadeControl.renderLayers();
    }
  }

  waitLayerLoadedAsync(layer) {
    return new Promise((resolve) => {
      const geometry = !M.utils.isNullOrEmpty(layer.geometry)
        ? layer.geometry
        : layer.getGeometryType();

      if (geometry === null) {
        setTimeout(() => {
          this.waitLayerLoadedAsync(layer).then(() => {
            resolve();
          });
        }, 200);
      } else {
        layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
        resolve();
      }
    });
  }
}
