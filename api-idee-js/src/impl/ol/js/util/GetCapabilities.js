import OLFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';
import { get as getRemote } from 'IDEE/util/Remote';

/**
 * Este método recupera la información descriptiva del servicio WMTS.
 *
 * @function
 * @public
 * @param {string} url URL del servicio WMTS (debe incluir el parámetro service=WMTS
 *  y request=GetCapabilities)
 * @returns {Promise<Object>} Promesa que se resuelve con un objeto que contiene
 *  las capacidades del servicio WMTS.
 * @api
 */
const getImplWMTSCapabilities = (url) => {
  return new Promise((success, fail) => {
    const parser = new OLFormatWMTSCapabilities();
    getRemote(url).then((response) => {
      const getCapabilitiesDocument = response.xml;
      const parsedCapabilities = parser.read(getCapabilitiesDocument);
      success.call(this, parsedCapabilities);
    });
  });
};

export default getImplWMTSCapabilities;
