/**
 * @module M/layer/BufferLayer
 */

import BufferLayerImpl from 'impl/bufferLayerImpl';
import { getValue } from './i18n/language';

export default class BufferLayer extends M.Layer {
  /**
   * @classdesc
   * Main constructor of the class. Creates a Draw layer
   * with parameters specified by the user
   *
   * @constructor
   * @extends {M.Layer}
   * @api stable
   */
  constructor(layer) {
    const impl = new BufferLayerImpl(layer);

    super({ type: M.layer.type.GeoJSON }, impl);

    // checks if the implementation can create KML layers
    if (M.utils.isUndefined(BufferLayerImpl)) {
      M.exception(getValue('exception_layer'));
    }

    this.layer = layer;
  }

  /**
   * This function checks if an object is equals
   * to this layer
   *
   * @function
   * @api
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof BufferLayer) {
      equals = this.name === obj.name;
    }

    return equals;
  }
}
