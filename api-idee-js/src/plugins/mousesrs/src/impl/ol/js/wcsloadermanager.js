import WCSLoader from './wcsloader';

export default class WCSLoaderManager {
  constructor() {
    this.wcsLoaders = {};
  }

  addLayers(layers) {
    if (!layers) {
      return;
    }

    for (let i = 0, layers1 = layers; i < layers1.length; i += 1) {
      const wcsLayer = layers1[i];
      this.addLayer(wcsLayer.url, wcsLayer.options);
    }
  }

  addLayer(url, options) {
    const name = options.name || options.coverage;
    if (this.wcsLoaders[name]) {
      return;
    }

    this.wcsLoaders[name] = new WCSLoader(url, options);
  }

  updateDataGrid(extent, epsgCode) {
    this.wcsLoader = this.getWcsLoaderForExtension(extent, epsgCode);
    if (this.wcsLoader) {
      this.wcsLoader.getDataGrid(extent, epsgCode);
    }
  }

  getValue(coords, epsgCode) {
    let res = Number.NaN;
    if (this.wcsLoader) {
      res = this.wcsLoader.getValue(coords, epsgCode);
    }

    return res;
  }

  getWcsLoaderForExtension(extent, epsgCode) {
    let res = Number.POSITIVE_INFINITY;
    let loader = null;
    let mLoader = null;
    let mRes = Number.NEGATIVE_INFINITY;
    Object.keys(this.wcsLoaders).forEach((key) => {
      const wcsLoader = this.wcsLoaders[key];
      const r = wcsLoader.getResolutionDif(extent, epsgCode);
      if (r < 0 && r > mRes) {
        mRes = r;
        mLoader = wcsLoader;
      }

      if (r > 0 && r < res) {
        res = r;
        loader = wcsLoader;
      }
    });

    return loader !== null ? loader : mLoader;
  }
}
