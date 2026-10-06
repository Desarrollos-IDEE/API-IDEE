/**
 * @module IDEE/impl/loader/KMZ
 */
import { load } from 'IDEE/util/KMZ';
import KML from './KML';

/**
 * @classdesc
 * Cargador KMZ que reutiliza la interpretación KML del motor.
 * @api
 */
class KMZ extends KML {
  getFolders_(xml) {
    // La selección no debe cambiar mientras se extraen carpetas del documento.
    return Array.from(xml.getElementsByTagName('Folder'));
  }

  getResponse_(url) {
    return load(url).then((text) => ({ text, code: 200 }));
  }
}

export default KMZ;
