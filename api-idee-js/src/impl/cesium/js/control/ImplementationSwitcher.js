/**
 * @module IDEE/impl/control/ImplementationSwitcher
 */
import Control from './Control';

class ImplementationSwitcher extends Control {
  addTo(map, element) {
    super.addTo(map, element);

    const implementation = window.implementations?.find((impl) => impl.type === 'cesium');
    if (implementation) {
      implementation.epsg = map.getProjection().code;
    }
  }
}

export default ImplementationSwitcher;
