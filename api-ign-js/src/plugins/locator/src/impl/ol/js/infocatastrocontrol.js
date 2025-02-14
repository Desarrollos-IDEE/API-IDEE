/**
 * @module M/impl/control/InfoCatastroControl
 */

export default class InfoCatastroControl extends M.impl.Control {
  /**
   * This function reprojects given coordinates to given projection.
   * @private
   * @function
   * @param { Array <number> } coordinates - [x,y]
   * @param { string } source - 'EPSG:4326'
   * @param { string } destiny - 'EPSG:4326'
   */
  reprojectReverse(coordinates, source, destiny) {
    const transformFunc = ol.proj.getTransform(source, destiny);
    return transformFunc(coordinates);
  }
}
