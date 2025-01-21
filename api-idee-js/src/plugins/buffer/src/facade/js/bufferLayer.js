/**
 * @module IDEE/layer/BufferLayer
 */

import BufferLayerImpl from 'impl/bufferLayerImpl';
import { getValue } from './i18n/language';

export default class BufferLayer extends IDEE.Layer {
  /**
   * @classdesc
   * Main constructor of the class. Creates a Draw layer
   * with parameters specified by the user
   *
   * @constructor
   * @extends {IDEE.Layer}
   * @api stable
   */
  constructor(layer) {
    // checks if the implementation can create KML layers
    if (IDEE.utils.isUndefined(BufferLayerImpl)
      || (IDEE.utils.isObject(BufferLayerImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(BufferLayerImpl)))) {
      IDEE.exception(getValue('exception_layer'));
    }

    const impl = new BufferLayerImpl(layer);

    super({ type: IDEE.layer.type.GeoJSON }, impl);

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
