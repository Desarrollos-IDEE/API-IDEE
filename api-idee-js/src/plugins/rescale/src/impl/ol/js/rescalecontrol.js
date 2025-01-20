/**
 * @module M/impl/control/RescaleControl
 */

export default class RescaleControl extends M.impl.Control {
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
    this.facadeMap_ = map;
  }

  /**
   * This function zooms the map to the selected scale
   *
   * @public
   * @function
   * @api stable
   */
  zoomToScale(scale) {
    let resolution;
    if (scale !== '0') {
      const view = this.facadeMap_.getMapImpl().getView();
      const closestZoom = this.getClosestResolution(scale);
      resolution = closestZoom.resolution;
      view.animate({
        center: view.getCenter(),
        resolution,
        duration: 500,
      });
      document.querySelector('#m-rescale-scaleinput').value = Math.trunc(closestZoom.scale);
    }
  }

  /**
   * Gets inputed scale and returns base layer closest scale and resolution.
   * @public
   * @function
   * @param {Number} originalScale - requested scale
   * @api
   */
  getClosestResolution(originalScale) {
    const minZoom = this.facadeMap_.getMinZoom();
    const maxZoom = this.facadeMap_.getMaxZoom();
    let lastZoom = {};
    let newScale;

    for (let zoom = minZoom; zoom < maxZoom + 1; zoom += 1) {
      const resolution = this.facadeMap_.getMapImpl().getView().getResolutionForZoom(zoom);
      let scale = this.getWMTSScale(resolution);
      if (scale < originalScale) {
        const oldWins = Math.abs(originalScale - scale) > Math.abs(originalScale - lastZoom.scale);
        this.facadeMap_.getMapImpl().getView().setResolution(resolution);
        scale = M.impl.utils.getWMTSScale(this.facadeMap_, true);
        newScale = oldWins ? lastZoom : { scale, resolution };
        zoom = maxZoom + 1;
      } else {
        lastZoom = { scale, resolution };
      }
    }

    if (newScale === undefined) {
      newScale = lastZoom;
    }

    return newScale;
  }

  /**
   * Gets view and size.
   * @public
   * @function
   * @api
   * @param {*} resolution -
   */
  getForViewAndSize(resolution) {
    const size = this.facadeMap_.getMapImpl().getSize();
    const dx = (size[0] / 2) * resolution;
    const dy = (size[1] / 2) * resolution;
    const rotation = this.facadeMap_.getMapImpl().getView().getRotation();
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const xCos = dx * cosRotation;
    const xSin = dx * sinRotation;
    const yCos = dy * cosRotation;
    const ySin = dy * sinRotation;
    const center = this.facadeMap_.getCenter();
    const x = center.x;
    const y = center.y;
    const x0 = (x - xCos) + ySin;
    const x1 = (x - xCos) - ySin;
    const x2 = (x + xCos) - ySin;
    const x3 = (x + xCos) + ySin;
    const y0 = (y - xSin) - yCos;
    const y1 = (y - xSin) + yCos;
    const y2 = (y + xSin) + yCos;
    const y3 = (y + xSin) - yCos;
    return [
      Math.min(x0, x1, x2, x3), Math.min(y0, y1, y2, y3),
      Math.max(x0, x1, x2, x3), Math.max(y0, y1, y2, y3),
    ];
  }

  /**
   * Gets WMTS scale.
   * @public
   * @function
   * @api
   * @param {*} resolution -
   */
  getWMTSScale(resolution) {
    const projection = this.facadeMap_.getProjection().code;
    const olProj = ol.proj.get(projection);
    const mpu = olProj.getMetersPerUnit(); // meters per unit in depending on the CRS;
    const size = this.facadeMap_.getMapImpl().getSize();
    const pix = size[0]; // Numero de pixeles en el mapa
    // Extension del mapa en grados (xmin, ymin, xmax, ymax)
    const pix2 = this.getForViewAndSize(resolution);
    // Extension angular del mapa (cuantos grados estan en el mapa)
    const ang = pix2[2] - pix2[0];
    // (numero de metros en el mapa / numero de pixeles) / metros por pixel
    const scale = (((mpu * ang) / pix) * 1000) / 0.28;
    return scale;
  }

  // /**
  //  * Gets size from viewport.
  //  * @public
  //  * @function
  //  * @api
  //  */
  // getSizeFromViewport() {
  //   const size = [100, 100];
  //   const selector = `.ol-viewport[data-view="${ol.util.
  //   getUid(this.facadeMap_.getMapImpl().getView())}"]`;
  //   const element = document.querySelector(selector);
  //   if (element) {
  //     const metrics = window.getComputedStyle(element);
  //     size[0] = parseInt(metrics.width, 10);
  //     size[1] = parseInt(metrics.height, 10);
  //   }
  //   return size;
  // }
}
