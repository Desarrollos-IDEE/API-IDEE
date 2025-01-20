/**
 * @module M/impl/loader/KML
 */
import MObject from 'M/Object';
import { get as getRemote } from 'M/util/Remote';
import { isNullOrEmpty, isUndefined, extend } from 'M/util/Utils';
import FacadeFeature from 'M/feature/Feature';
import Exception from 'M/exception/exception';
import { getValue } from 'M/i18n/language';
import { ArcType, HeightReference } from 'cesium';
import ImplUtils from '../util/Utils';

/**
 * @classdesc
 * Implementación de la clase del "loader" para los objetos geográficos KML.
 *
 * @property {M.Map} map_ Mapa.
 * @property {M.impl.service.WFS} url_ URL del servicio WFS.
 * @property {M.impl.format.GeoJSON} format_ Formato.
 *
 * @api
 * @extends {M.Object}
 */
class KML extends MObject {
  /**
   * Constructor principal de la clase KML.
   *
   * @constructor
   * @param {M.Map} map Mapa
   * @param {M.impl.service.WFS} url URL del servicio WFS.
   * @param {M.impl.format.GeoJSON} format Formato.
   * @api
   */
  constructor(map, url, format) {
    super();
    /**
     * Mapa.
     * @private
     * @type {M.Map}
     */
    this.map_ = map;

    /**
     * URL del servicio WFS.
     * @private
     * @type {M.impl.service.WFS}
     */
    this.url_ = url;

    /**
     * Formato.
     * @private
     * @type {M.impl.format.GeoJSON}
     */
    this.format_ = format;
  }

  /**
   * Este método ejecutará la función "callback" a los objetos geográficos.
   *
   * @function
   * @param {function} callback Función "callback" de llamada para ejecutar
   * @returns {function} Método que ejecutará la función 'callback' a los objetos geográficos.
   * @public
   * @api
   */
  getLoaderFn(callback) {
    return ((
      extent,
      resolution,
      projection,
      scaleLabel,
      segregacion,
      removeFolderChildren,
      label,
      clampToGround,
    ) => {
      this.loadInternal_(
        projection,
        scaleLabel,
        segregacion,
        removeFolderChildren,
        label,
        clampToGround,
      )
        .then((response) => {
          callback(response);
        });
    });
  }

  /**
   * Este método obtiene los objetos geográficos a partir de los parámetros
   * especificados.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @param {Object} projection Proyección.
   * @param {Number} scaleLabel Escala de la etiqueta.
   * @param {Array} layers Listado de nombres de carpetas para filtrar KML.
   * @param {boolean} removeFolderChildren Especifica si mostrar o no los hijos de las carpetas.
   * @param {boolean} showLabel Especifica si mostrar o no las etiquetas.
   * @param {boolean} clampToGround Indica si la capa se ajusta al terreno.
   * @returns {Promise} Promesa con la obtención de los objetos geográficos.
   * @public
   * @api
   */
  loadInternal_(projection, scaleLabel, layers, removeFolderChildren, showLabel, clampToGround) {
    return new Promise((success, fail) => {
      getRemote(this.url_).then((response) => {
        const parser = new DOMParser();
        const result = response.text.replace(/<extrude>.*?<\/extrude>/gs, '');
        const xmlDoc = parser.parseFromString(result, 'text/xml');
        const is2D = this.is2D(xmlDoc.getElementsByTagName('coordinates'));
        let transformXMLtoText = false;
        if (!isUndefined(layers)) {
          const folders = xmlDoc.getElementsByTagName('Folder');
          let count = -1;
          const foldersArray = [...folders].map((folder) => folder.cloneNode(true));

          if (removeFolderChildren) {
            foldersArray.map((folder) => {
              let folderElement;
              do {
                folderElement = folder.querySelector(':scope > Folder');
                if (folderElement) {
                  folder.removeChild(folderElement);
                }
              } while (folderElement);
              return folder;
            });
          }

          Array.from(folders).forEach((folder) => {
            folder.parentNode.removeChild(folder);
          });

          const filteredFolders = foldersArray.filter((folder) => {
            const nameElement = folder.querySelector(':scope > name');
            count += 1;
            if (nameElement) {
              return layers.includes(nameElement.textContent.trim());
            }
            return layers.includes(`Layer__${count}`);
          });

          const documentElement = xmlDoc.querySelector('kml > Document');
          filteredFolders.forEach((folderElement) => {
            documentElement.appendChild(folderElement);
          });

          transformXMLtoText = true;
        }
        if (!isUndefined(scaleLabel)) {
          const styles = xmlDoc.getElementsByTagName('Style');

          if (styles.length === 0) {
            const style = xmlDoc.createElement('Style');
            style.id = 'defaultLabelStyle';
            const labelStyle = xmlDoc.createElement('LabelStyle');
            labelStyle.innerHTML = `<scale>${scaleLabel}</scale>`;
            style.appendChild(labelStyle);
            xmlDoc.getElementsByTagName('Document')[0].appendChild(style);
            Array.prototype.forEach.call(xmlDoc.getElementsByTagName('Placemark'), (element) => {
              const styleUrl = element.getElementsByTagName('styleUrl');
              if (styleUrl.length === 0) {
                const styleUrlEl = xmlDoc.createElement('styleUrl');
                styleUrlEl.innerHTML = '#defaultLabelStyle';
                element.appendChild(styleUrlEl);
              } else {
                styleUrl[0].innerHTML = '#defaultLabelStyle';
              }
            });
          } else {
            Array.prototype.forEach.call(styles, (element) => {
              const label = element.getElementsByTagName('LabelStyle');
              if (label.length === 0) {
                const labelStyle = xmlDoc.createElement('LabelStyle');
                labelStyle.innerHTML = `<scale>${scaleLabel}</scale>`;
                element.appendChild(labelStyle);
              } else {
                const scale = label[0].getElementsByTagName('scale');
                if (scale.length === 0) {
                  const scaleEl = xmlDoc.createElement('scale');
                  scaleEl.innerHTML = `${scaleLabel}`;
                  label[0].appendChild(scaleEl);
                } else {
                  scale[0].innerHTML = `${scaleLabel}`;
                }
              }
            });
          }

          transformXMLtoText = true;
        }

        if (transformXMLtoText) {
          const serializer = new XMLSerializer();
          const xmlString = serializer.serializeToString(xmlDoc);
          response.text = xmlString;
        }

        let clamp = clampToGround;
        if (isUndefined(clampToGround) && is2D) {
          clamp = true;
        } else if (isUndefined(clampToGround) && !is2D) {
          clamp = false;
        }

        /*
            Fix: While the KML URL was being resolved the map projection
            might have been changed therefore the projection is readed again
          */
        const lastProjection = this.map_.getProjection().code;
        if (!isNullOrEmpty(response.text)) {
          this.format_.readCustomFeatures(response.text, {
            featureProjection: lastProjection,
            clampToGround: clamp,
          }).then(({ features, extractStyles }) => {
            const screenOverlay = this.format_.getScreenOverlay();
            const mFeatures = [];
            features.forEach((cesiumFeature) => {
              const coordinates = ImplUtils.getCoordinateEntity(cesiumFeature, is2D);
              const type = ImplUtils.getGeometryType(cesiumFeature);
              if (coordinates) {
                let props = {};
                const properties = cesiumFeature.properties;
                if (!isNullOrEmpty(properties)) {
                  // eslint-disable-next-line no-return-assign
                  props = properties.propertyNames.reduce((acc, curr) =>
                    // eslint-disable-next-line
                    (acc[curr] = properties[curr].getValue(), acc), {});
                }

                if (!isUndefined(cesiumFeature.name)) {
                  props = extend({ name: cesiumFeature.name }, props, true);
                }

                // eslint-disable-next-line no-underscore-dangle
                if (!isUndefined(cesiumFeature.description)) {
                  // eslint-disable-next-line no-underscore-dangle
                  props = extend({ description: cesiumFeature.description._value }, props, true);
                }

                let isKMLBillboard = false;
                if (extractStyles !== false && cesiumFeature.billboard
                  && cesiumFeature.billboard.image
                  // eslint-disable-next-line no-underscore-dangle
                  && !(cesiumFeature.billboard.image._value instanceof window.HTMLCanvasElement)) {
                  isKMLBillboard = true;
                }

                const feature = new FacadeFeature(cesiumFeature.id, {
                  geometry: {
                    coordinates,
                    type,
                  },
                  properties: props,
                  isKMLBillboard,
                  clampToGround: clamp,
                });

                if (extractStyles !== false) {
                  // eslint-disable-next-line no-underscore-dangle
                  feature.getImpl().isLoadCesiumFeature_.then(() => {
                    if (showLabel !== false) {
                      feature.getImpl().getFeature().label = cesiumFeature.label;
                    }
                    if (cesiumFeature.point) {
                      feature.getImpl().getFeature().point = cesiumFeature.point;
                      if (clamp) {
                        feature.getImpl().getFeature().point
                          .heightReference = HeightReference.CLAMP_TO_GROUND;
                      }
                    } else if (cesiumFeature.billboard && isKMLBillboard) {
                      feature.getImpl().getFeature().billboard = cesiumFeature.billboard;
                      if (clamp) {
                        feature.getImpl().getFeature().billboard
                          .heightReference = HeightReference.CLAMP_TO_GROUND;
                      }
                    } else if (cesiumFeature.polygon) {
                      feature.getImpl().getFeature().polygon = cesiumFeature.polygon;
                    } else if (cesiumFeature.polyline) {
                      feature.getImpl().getFeature().polyline = cesiumFeature.polyline;
                      if (clamp) {
                        feature.getImpl().getFeature().polyline.arcType = ArcType.RHUMB;
                        feature.getImpl().getFeature().polyline.clampToGround = true;
                      }
                    }
                  });
                }
                mFeatures.push(feature);
              }
            });

            success({
              features: mFeatures,
              screenOverlay,
            });
          });
        } else {
          Exception(getValue('exception').no_kml_response);
        }
      });
    });
  }

  /**
   * Este método obtiene las primeras coordenadas de una geometría
   * de Cesium.
   *
   * @function
   * @param {Array<HTMLCollection>} coordinatesNodes Matriz de nodos "<coordinates>".
   * @returns {Boolean} Verdadero si son coordenadas 2D, falso en caso contrario.
   * @public
   * @api
   */
  is2D(coordinatesNodes) {
    let is2D;
    if (coordinatesNodes.length > 0) {
      const firstNode = coordinatesNodes[0];
      const coordinatesText = firstNode.textContent.trim();
      const coordinates = coordinatesText.split(/\s+/);
      is2D = coordinates.some((point) => point.split(',').length === 2);
    }
    return is2D;
  }
}

export default KML;
