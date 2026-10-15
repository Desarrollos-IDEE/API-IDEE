/**
 * @module IDEE/impl/loader/KML
 */
import { addParameters as refreshParameters, isUndefined, isNullOrEmpty } from 'IDEE/util/Utils';
import MObject from 'IDEE/Object';
import { get as getRemote } from 'IDEE/util/Remote';
import FacadeFeature from 'IDEE/feature/Feature';
import Exception from 'IDEE/exception/exception';
import { getValue } from 'IDEE/i18n/language';
import { get as getProj } from 'ol/proj';

/**
 * @classdesc
 * Implementación de la clase del "loader" para los objetos geográficos KML.
 *
 * @property {IDEE.Map} map_ Mapa.
 * @property {IDEE.impl.service.WFS} url_ URL del servicio WFS.
 * @property {IDEE.impl.format.GeoJSON} format_ Formato.
 *
 * @api
 * @extends {IDEE.Object}
 */
class KML extends MObject {
  /**
   * Constructor principal de la clase KML.
   *
   * @constructor
   * @param {IDEE.Map} map Mapa
   * @param {IDEE.impl.service.WFS} url URL del servicio WFS.
   * @param {IDEE.impl.format.GeoJSON} format Formato.
   * @api
   */
  constructor(map, url, format) {
    super();
    /**
     * Mapa.
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = map;

    /**
     * URL del servicio WFS.
     * @private
     * @type {IDEE.impl.service.WFS}
     */
    this.url_ = url;

    /**
     * Formato.
     * @private
     * @type {IDEE.impl.format.GeoJSON}
     */
    this.format_ = format;
  }

  getFolders_(xml) {
    return xml.getElementsByTagName('Folder');
  }

  getResponse_(url) {
    return getRemote(url);
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
   * Recarga sin modificar la URL original del cargador.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   */
  loadForRefresh(projection, scaleLabel, layers, removeFolderChildren) {
    return this.loadInternal_(
      projection,
      scaleLabel,
      layers,
      removeFolderChildren,
      refreshParameters(this.url_, { _ideeRefresh: Date.now() }),
      true,
    );
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
  loadInternal_(
    projection,
    scaleLabel,
    layers,
    removeFolderChildren,
    requestUrl = this.url_,
    forRefresh = false,
  ) {
    return new Promise((success, fail) => {
      const request = this.getResponse_(requestUrl).then((response) => {
        if (forRefresh && response.code >= 400) throw new Error(`HTTP ${response.code}`);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.text, 'text/xml');
        if (forRefresh && xmlDoc.querySelector('parsererror')) throw new Error(getValue('exception').invalid_kml);
        let transformXMLtoText = false;
        if (!isUndefined(layers)) {
          const folders = this.getFolders_(xmlDoc);
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
        const lastProjection = getProj('EPSG:4326');
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
            feature.getImpl().getFeature().setStyle(olFeature.getStyle());
            feature.getImpl()
              .getFeature()
              .getGeometry()
              .transform(
                lastProjection,
                this.map_.getProjection().code,
              );
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
      if (forRefresh) request.catch(fail);
    });
  }
}

export default KML;
