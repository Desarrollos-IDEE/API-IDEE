/**
 * Lectura de los orígenes binarios completos de un GeoPackage.
 *
 * @module IDEE/datasource/geopackage/sourceReaders
 */
import { SourceReader } from '../contracts';
import Exception from '../../exception/exception';
import { getValue } from '../../i18n/language';

/**
 * Lanza el error de origen no válido.
 */
const invalidSource = () => Exception(getValue('exception').geopackage_source);

/**
 * Petición de descarga obtenida del parámetro url.
 */
export class UrlRequest {
  /**
   * @param {*} url URL indicada por el usuario.
   */
  constructor(url) {
    this.url = url;
  }
}

/**
 * Descarga el fichero completo indicado por el parámetro url.
 */
export class UrlSourceReader extends SourceReader {
  /**
   * @param {Object} [dependencies] Dependencias.
   * @param {function(String): Promise<Response>} [dependencies.fetch] Descarga.
   */
  constructor({ fetch = (url) => window.fetch(url) } = {}) {
    super();
    this.fetch_ = fetch;
  }

  canRead(input) {
    return input instanceof UrlRequest;
  }

  read({ url }) {
    if (typeof url !== 'string' || url.trim().length === 0) {
      invalidSource();
    }
    return this.fetch_(url);
  }
}

/**
 * Lee el cuerpo binario de una respuesta HTTP correcta.
 */
export class ResponseSourceReader extends SourceReader {
  canRead(input) {
    return typeof Response !== 'undefined' && input instanceof Response;
  }

  read(response) {
    if (!response.ok) {
      Exception(`${getValue('exception').geopackage_response} (${response.status})`);
    }
    return response.arrayBuffer();
  }
}

/**
 * Lee un fichero local seleccionado por el usuario.
 */
export class FileSourceReader extends SourceReader {
  canRead(input) {
    return typeof File !== 'undefined' && input instanceof File;
  }

  read(file) {
    return file.arrayBuffer();
  }
}

/**
 * Lectores predeterminados, en orden de evaluación.
 * @const
 * @type {Array<SourceReader>}
 */
export const DEFAULT_SOURCE_READERS = Object.freeze([
  new UrlSourceReader(),
  new ResponseSourceReader(),
  new FileSourceReader(),
]);

/**
 * Indica si un valor ya son los bytes del paquete.
 * @param {*} value Valor.
 * @returns {Boolean} Verdadero para ArrayBuffer y Uint8Array.
 */
const isBinary = (value) => value instanceof ArrayBuffer || value instanceof Uint8Array;

/**
 * Busca el lector que admite un valor.
 * @param {Array<SourceReader>} readers Lectores.
 * @param {*} value Valor.
 * @returns {SourceReader|undefined} Lector.
 */
const findReader = (readers, value) => readers.find((candidate) => candidate.canRead(value));

/**
 * Obtiene el origen de los parámetros { source } o { url }, que son excluyentes.
 * @param {*} data Origen o parámetros.
 * @returns {*} Origen.
 */
const unwrapParameters = (data) => {
  if (!data || Object.getPrototypeOf(data) !== Object.prototype) {
    return data;
  }
  const hasSource = data.source !== undefined;
  const hasURL = data.url !== undefined;
  if (hasSource === hasURL) {
    invalidSource();
  }
  return hasURL ? new UrlRequest(data.url) : data.source;
};

/**
 * Lee un origen completo encadenando los lectores hasta obtener los bytes.
 * No modifica el origen ni interpreta respuestas binarias como texto.
 *
 * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Origen o parámetros.
 * @param {Array<SourceReader>} [readers] Lectores disponibles.
 * @returns {Promise<Uint8Array>} Copia de los bytes del fichero.
 */
export const readSource = async (data, readers = DEFAULT_SOURCE_READERS) => {
  let value = unwrapParameters(data);
  const used = new Set();
  while (!isBinary(value)) {
    const reader = findReader(readers, value);
    if (!reader || used.has(reader)) {
      invalidSource();
    }
    used.add(reader);
    // eslint-disable-next-line no-await-in-loop
    value = await reader.read(value);
  }
  if (value.byteLength === 0) {
    invalidSource();
  }
  return new Uint8Array(value);
};
