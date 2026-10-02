/**
 * Utilidades internas de carga GPX compartidas por las implementaciones OL y Cesium.
 */
import { get } from './Remote';
import { addParameters } from './Utils';
import { getValue } from '../i18n/language';

/**
 * Lee una fuente local o remota sin modificar su URL original.
 * @param {String|File} source Fuente local opcional.
 * @param {String} url URL opcional.
 * @param {Boolean} refresh Evita reutilizar la respuesta almacenada en caché.
 * @returns {Promise<String>} XML.
 */
export const loadGPX = async (source, url, refresh = false) => {
  if (source !== undefined && source !== null) {
    if (typeof source === 'string') return source;
    if (source instanceof File) return source.text();
    throw new Error(getValue('exception').invalid_gpx_source);
  }
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error(getValue('exception').invalid_gpx_source);
  }
  const response = await get(refresh ? addParameters(url, { _ideeRefresh: Date.now() }) : url);
  if (response.code >= 400) throw new Error(`HTTP ${response.code}`);
  return response.text;
};

export default {};
