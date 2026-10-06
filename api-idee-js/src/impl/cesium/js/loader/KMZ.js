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
  getResponse_(url) {
    return load(url).then((text) => ({ text, code: 200 }));
  }
}

export default KMZ;
