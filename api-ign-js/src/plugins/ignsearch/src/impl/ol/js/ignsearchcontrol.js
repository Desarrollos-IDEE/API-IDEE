/**
 * @module M/impl/control/IGNSearchControl
 */
export default class IGNSearchControl extends M.impl.Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);
  }

  /**
   * This function sets a new scale to the map.
   * Developed for WGS 84 / Pseudo - Mercator 3857 projection.
   * @private
   * @function
   */
  setScale(scale) {
    const wmts3857scales = [
      559082264.0287178,
      279541132.0143589,
      139770566.0071794,
      69885283.00358972,
      34942641.50179486,
      17471320.75089743,
      8735660.375448715,
      4367830.187724357,
      2183915.093862179,
      1091957.546931089,
      545978.7734655447,
      272989.3867327723,
      136494.6933663862,
      68247.34668319309,
      34123.67334159654,
      17061.83667079827,
      8530.918335399136,
      4265.459167699568,
      2132.729583849784,
    ];
    // const wmts3857resolutions = [
    //   156543.0339280410,
    //   78271.51696402048,
    //   39135.75848201023,
    //   19567.87924100512,
    //   9783.939620502561,
    //   4891.969810251280,
    //   2445.984905125640,
    //   1222.992452562820,
    //   611.4962262814100,
    //   305.7481131407048,
    //   152.8740565703525,
    //   76.43702828517624,
    //   38.21851414258813,
    //   19.10925707129406,
    //   9.554628535647032,
    //   4.777314267823516,
    //   2.388657133911758,
    //   1.194328566955879,
    //   0.5971642834779395,
    // ];
    // Finds closest standard scale
    const newScale = wmts3857scales.reduce((prev, curr) => {
      return (Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev);
    });
    const olMap = this.facadeMap_.getMapImpl();
    const olView = olMap.getView();
    const newResolution = olView.getMaxResolution() / (2 ** wmts3857scales.indexOf(newScale));
    olView.setResolution(newResolution);
    // 4.777314267823516); // resolution for scale 17016, table page 120
    // const dpiToCM = M.units.DOTS_PER_INCH / 2.54;
    // const resolution = (scale / dpiToCM) / 100;
    // olView.setResolution(resolution);
  }

  /**
   * This function reprojects given coordinates to given projection.
   * @private
   * @function
   * @param { Array <number> } coordinates - [x,y]
   * @param { string } source - 'EPSG:4326'
   * @param { string } destiny - 'EPSG:4326'
   */
  reproject(coordinates, source, destiny) {
    const transformFunc = ol.proj.getTransform(source, destiny);
    return transformFunc(coordinates);
  }
}
