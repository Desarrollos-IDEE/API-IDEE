/**
 * @module M/impl/loader/KML
 */
import MObject from 'M/Object';
import { get as getRemote } from 'M/util/Remote';
import { isUndefined, isNullOrEmpty } from 'M/util/Utils';
import FacadeFeature from 'M/feature/Feature';
import Exception from 'M/exception/exception';
import { getValue } from 'M/i18n/language';

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
    return ((extent, resolution, projection, scaleLabel, segregacion, removeFolderChildren) => {
      this.loadInternal_(projection, scaleLabel, segregacion, removeFolderChildren)
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
   * @param {ol.proj.Projection} projection Proyección.
   * @param {Number} scaleLabel Escala de la etiqueta.
   * @param {Array} layers Listado de nombres de carpetas para filtrar KML.
   * @param {boolean} removeFolderChildren Especifica si mostrar o no los hijos de las carpetas.
   * @returns {Promise} Promesa con la obtención de los objetos geográficos.
   * @public
   * @api
   */
  loadInternal_(projection, scaleLabel, layers, removeFolderChildren) {
    return new Promise((success, fail) => {
      getRemote(this.url_).then((response) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.text, 'text/xml');
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

          Array.prototype.forEach.call(folders, (folder) => {
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

        /*
           Fix: While the KML URL was being resolved the map projection
           might have been changed therefore the projection is readed again
         */
        const lastProjection = this.map_.getProjection().code;
        if (!isNullOrEmpty(response.text)) {
          const features = this.format_.readCustomFeatures(response.text, {
            featureProjection: lastProjection,
          });

          const screenOverlay = this.format_.getScreenOverlay();

          const mFeatures = features.map((olFeature) => {
            const feature = new FacadeFeature(olFeature.getId(), {
              geometry: {
                coordinates: olFeature.getGeometry().getCoordinates(),
                type: olFeature.getGeometry().getType(),
              },
              properties: olFeature.getProperties(),
            });
            feature.getImpl().getOLFeature().setStyle(olFeature.getStyle());
            return feature;
          });

          success({
            features: mFeatures,
            screenOverlay,
          });
        } else {
          Exception(getValue('exception').no_kml_response);
        }
      });
    });
  }
}

export default KML;
