/**
 * Acceso a un GeoPackage remoto leyendo por rangos HTTP solo las páginas necesarias.
 *
 * @module IDEE/datasource/geopackage/RangeAccess
 */
import { PackageAccess, PackageReader } from '../contracts';
import HttpRangeSource from '../range/HttpRangeSource';
import { SqliteFormatError } from '../sqlite/SqliteReader';
import RangeGeoPackage from './RangeGeoPackage';
import { RangeUnsupportedError } from './errors';
import DownloadAccess from './DownloadAccess';
import { getValue } from '../../i18n/language';

/**
 * Indica si un error permite continuar con la descarga completa.
 * @param {*} error Error.
 * @returns {Boolean} Verdadero si se puede descargar el fichero completo.
 */
const canFallBack = (error) => error instanceof RangeUnsupportedError
  || error instanceof SqliteFormatError
  || error === getValue('exception').geopackage_range_network
  || error === getValue('exception').geopackage_range_response;

/**
 * Lector que decide, tras la primera petición, si lee por rangos o descarga el fichero.
 */
class RangePackageReader extends PackageReader {
  /**
   * @param {Promise<PackageReader>} ready Lector elegido.
   */
  constructor(ready) {
    super();
    this.ready_ = ready;
    this.ready_.catch(() => undefined);
  }

  getVectorProviders() {
    return this.ready_.then((reader) => reader.getVectorProviders());
  }

  getTileProviders() {
    return this.ready_.then((reader) => reader.getTileProviders());
  }

  getMetadata() {
    return this.ready_.then((reader) => reader.getMetadata());
  }

  /**
   * Indica si el paquete se lee por rangos o se ha descargado completo.
   * @returns {Promise<Boolean>} Verdadero si se lee por rangos.
   */
  isRangeReading() {
    return this.ready_.then((reader) => reader instanceof RangeGeoPackage);
  }

  dispose() {
    this.ready_.then((reader) => reader.dispose()).catch(() => undefined);
  }
}

/**
 * Crea lectores por rangos para URL http(s); el resto de orígenes, y los servidores o
 * ficheros que no lo permiten, se leen con la descarga completa.
 */
class RangeAccess extends PackageAccess {
  /**
   * @param {Object} [options] Opciones.
   * @param {Number} [options.blockSize] Tamaño de bloque de las peticiones.
   * @param {Number} [options.maxBytes] Bytes que se pueden recibir por lector.
   * @param {Object} [dependencies] Dependencias.
   * @param {PackageAccess} [dependencies.fallback] Acceso por descarga completa.
   * @param {Function} [dependencies.createSource] Crea el origen por rangos.
   * @param {Function} [dependencies.createPackage] Crea el paquete por rangos.
   * @param {function(String): Boolean} [dependencies.isRemoteURL] Indica si una URL es
   * http(s).
   * @param {function(String, *): void} [dependencies.warn] Avisa de la descarga completa.
   */
  constructor({ blockSize, maxBytes } = {}, {
    fallback = new DownloadAccess(),
    createSource = (url, options) => new HttpRangeSource(url, options),
    createPackage = (source, options) => new RangeGeoPackage(source, options),
    isRemoteURL = (url) => {
      try {
        return /^https?:$/.test(new URL(url, window.location.href).protocol);
      } catch (error) {
        return false;
      }
    },
    // eslint-disable-next-line no-console
    warn = (message, reason) => console.warn(message, reason),
  } = {}) {
    super();
    this.sourceOptions_ = {
      ...(blockSize === undefined ? {} : { blockSize }),
      ...(maxBytes === undefined ? {} : { maxBytes }),
    };
    this.fallback_ = fallback;
    this.createSource_ = createSource;
    this.createPackage_ = createPackage;
    this.isRemoteURL_ = isRemoteURL;
    this.warn_ = warn;
  }

  createReader(source, options) {
    const { url } = source || {};
    if (source?.source !== undefined || typeof url !== 'string' || !this.isRemoteURL_(url)) {
      return this.fallback_.createReader(source, options);
    }
    const ready = (async () => {
      const bytes = this.createSource_(url, this.sourceOptions_);
      try {
        await bytes.read(0, 100);
        if (!bytes.isRangeSupported()) {
          return this.fallback_.createReader({ source: bytes.getFullBody() }, options);
        }
        const pack = this.createPackage_(bytes, options);
        await pack.getMetadata();
        return pack;
      } catch (error) {
        if (!canFallBack(error)) throw error;
        this.warn_(getValue('exception').geopackage_range_fallback, error);
        const body = bytes.getFullBody();
        return this.fallback_.createReader(body ? { source: body } : { url }, options);
      }
    })();
    return new RangePackageReader(ready);
  }
}

export { RangePackageReader };
export default RangeAccess;
