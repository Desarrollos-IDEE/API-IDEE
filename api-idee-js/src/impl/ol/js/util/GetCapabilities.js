import OLFormatWMTSCapabilities from 'ol/format/WMTSCapabilities';
import { get as getRemote } from 'IDEE/util/Remote';

/**
 * Este método recupera la información descriptiva del servicio WMTS.
 * @function
 * @param {String| URLLike} url URL del servicio WMTS
 * @returns {Promise}
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
