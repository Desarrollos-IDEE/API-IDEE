/**
 * @module IDEE/util/KMZ
 */
import JSZip from 'jszip';
import { getValue } from '../i18n/language';
import { useproxy } from '../api-idee';
import { addParameters } from './Utils';

const MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  kml: 'application/vnd.google-earth.kml+xml',
  dae: 'model/vnd.collada+xml',
};

/**
 * Lee un KMZ y resuelve recursos relativos al KML principal.
 * Las URI de datos pertenecen al resultado: no dejan URL de objetos vivas.
 * @param {ArrayBuffer|Uint8Array|Blob} source Archivo comprimido.
 * @param {string} baseURL URL original para recursos externos relativos.
 * @returns {Promise<string>} KML con recursos resueltos.
 * @api
 */
export const read = async (source, baseURL = document.baseURI) => {
  const bytes = source instanceof Blob ? await source.arrayBuffer() : source;
  if (bytes.byteLength > 100 * 1024 * 1024) throw new Error(getValue('exception').kmz_size);
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (entries.length > 4096) throw new Error(getValue('exception').kmz_files);
  const main = entries.find((entry) => /^doc\.kml$/i.test(entry.name))
      || entries.find((entry) => /\.kml$/i.test(entry.name));
  if (!main) throw new Error(getValue('exception').kmz_no_kml);
  const paths = new Map(entries.map((entry) => [entry.name.replace(/\\/g, '/'), entry]));
  const resources = new Map();
  const archiveOrigin = 'https://kmz.invalid/';
  const externalBase = new URL('.', /^(blob|data):/i.test(baseURL) ? document.baseURI : baseURL);
  const resolveDocument = async (documentEntry, ancestors = []) => {
    const documentPath = new URL(documentEntry.name, archiveOrigin);
    const currentAncestors = [...ancestors, documentEntry.name];
    const resolveResource = async (reference) => {
      if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) return reference;
      const location = new URL(reference.replace(/\\/g, '/'), documentPath);
      const resourcePath = decodeURIComponent(location.pathname.substring(1));
      if (resourcePath === documentEntry.name && location.hash) return location.hash;
      const entry = paths.get(resourcePath);
      if (!entry) {
        return new URL(reference, new URL(documentEntry.name, externalBase)).href;
      }
      if (currentAncestors.includes(resourcePath)) throw new Error(getValue('exception').kmz_cycle);
      if (/\.kml$/i.test(resourcePath)) {
        const resolved = await resolveDocument(entry, currentAncestors);
        return `data:${MIME.kml},${encodeURIComponent(resolved)}${location.hash}`;
      }
      if (!resources.has(resourcePath)) {
        const ext = resourcePath.split('.').pop().toLowerCase();
        resources.set(
          resourcePath,
          entry.async('base64').then((data) => `data:${MIME[ext] || 'application/octet-stream'};base64,${data}`),
        );
      }
      return (await resources.get(resourcePath)) + location.hash;
    };
    const text = await documentEntry.async('string');
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror') || xml.documentElement.localName !== 'kml') {
      throw new Error(getValue('exception').kmz_invalid);
    }
    await Promise.all(Array.from(xml.getElementsByTagNameNS('*', 'href')).map(async (element) => {
      // eslint-disable-next-line no-param-reassign
      element.textContent = await resolveResource(element.textContent.trim());
    }));
    await Promise.all(Array.from(xml.getElementsByTagNameNS('*', 'styleUrl')).map(async (element) => {
      // eslint-disable-next-line no-param-reassign
      element.textContent = await resolveResource(element.textContent.trim());
    }));
    await Promise.all(Array.from(xml.getElementsByTagNameNS('*', 'description')).map(async (element) => {
      const html = new DOMParser().parseFromString(element.textContent, 'text/html');
      const images = Array.from(html.querySelectorAll('img[src]'));
      if (images.length) {
        await Promise.all(images.map(async (img) => {
          img.setAttribute('src', await resolveResource(img.getAttribute('src')));
        }));
        // eslint-disable-next-line no-param-reassign
        element.textContent = html.body.innerHTML;
      }
    }));
    return new XMLSerializer().serializeToString(xml);
  };
  return resolveDocument(main);
};

/**
 * Descarga binaria, respetando el proxy configurado.
 * @api
 */
export const load = async (url) => {
  const originalURL = new URL(url, document.baseURI).href;
  const proxyURL = () => {
    const endpoint = new URL(IDEE.config.KMZ_PROXY_URL || IDEE.config.PROXY_URL, document.baseURI);
    if (!IDEE.config.KMZ_PROXY_URL) endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/kmz`;
    return addParameters(endpoint.href, { url: originalURL });
  };
  const local = /^(blob|data):/i.test(originalURL);
  let response;
  try {
    response = await fetch(useproxy === true && !local ? proxyURL() : originalURL);
  } catch (error) {
    if (useproxy !== 'conditional' || local) throw error;
    response = await fetch(proxyURL());
  }
  if (!response.ok) throw new Error(`KMZ: HTTP ${response.status}`);
  return read(await response.arrayBuffer(), originalURL);
};

export default {};
