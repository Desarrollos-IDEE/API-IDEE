/* eslint-disable no-console */
import ArcGridParser from './arcgridparser';

const NO_DATA_VALUE = 'NODATA_value -9999.000';

export default class WCSLoader {
  constructor(url, options) {
    this.fetchIndex = 0;
    this.noDataValue = Number.NaN;
    this.url = url;
    this.options = options;
    this.options.width = options.width || 500;
    this.options.height = options.height || 500;
    this.loadCoverage();
  }

  loadCoverage() {
    const innerThis = this;
    const params = {
      service: this.options.service ? this.options.service : 'WCS',
      request: 'describecoverage',
      version: this.options.version ? this.options.version : '1.0.0',
      coverage: this.options.coverage,
    };

    const url = this.addParameters(this.url, params);
    M.proxy(false);
    M.remote.get(url).then((response) => {
      M.proxy(true);
      const text = response.text;
      const dp = new DOMParser();
      const data = dp.parseFromString(text, 'text/xml');
      const envelope = data.querySelectorAll('Envelope');
      for (let i = 0; i < envelope.length; i += 1) {
        if (envelope[i].getAttribute('srsName') === innerThis.options.crs) {
          const coverageExtension = [];
          envelope[i].childNodes[1].childNodes[0].nodeValue.split(' ').forEach((coord) => {
            coverageExtension.push(parseFloat(coord));
          });
          envelope[i].childNodes[3].childNodes[0].nodeValue.split(' ').forEach((coord) => {
            coverageExtension.push(parseFloat(coord));
          });
          innerThis.coverageExtension = coverageExtension;
        }
      }

      const offsetVector = data.querySelectorAll('offsetVector');
      if (offsetVector) {
        innerThis.cellsizeX = Math.abs(parseFloat(offsetVector[0].childNodes[0].nodeValue.split(' ')[0]));
        innerThis.cellsizeY = Math.abs(parseFloat(offsetVector[1].childNodes[0].nodeValue.split(' ')[1]));
      }
    }).catch((error) => {
      M.proxy(true);
      // eslint-disable-next-line no-console
      console.error(`Error received in request: ${error.message}`);
    });
  }

  getResolutionDif(extent, epsgCode) {
    const w = this.options.width;
    const h = this.options.height;
    const newExtent = this.getVisibleExtent(extent, epsgCode);
    const nCols = Math.min(w, Math.ceil((newExtent[2] - newExtent[0]) / this.cellsizeX));
    const nRows = Math.min(h, Math.ceil((newExtent[3] - newExtent[1]) / this.cellsizeY));
    const rx = ((newExtent[2] - newExtent[0]) / nCols) - this.cellsizeX;
    const ry = ((newExtent[3] - newExtent[1]) / nRows) - this.cellsizeY;
    return Math.min(rx, ry);
  }

  getDataGrid(extent, epsgCode) {
    const innerThis = this;
    if (!this.cellsizeX || !this.cellsizeY) {
      return;
    }

    const ext = this.getVisibleExtent(extent, epsgCode);
    if (ext && this.visibleExtent && this.mdtData
      && ext[0] === this.visibleExtent[0]
      && ext[1] === this.visibleExtent[1]
      && ext[2] === this.visibleExtent[2]
      && ext[3] === this.visibleExtent[3]
    ) {
      return;
    }

    this.visibleExtent = ext;
    const nCols = Math.min(
      this.options.width,
      Math.ceil((this.visibleExtent[2] - this.visibleExtent[0]) / this.cellsizeX),
    );
    const nRows = Math.min(
      this.options.height,
      Math.ceil((this.visibleExtent[3] - this.visibleExtent[1]) / this.cellsizeY),
    );
    let mdtData;
    const params = {
      request: 'GetCoverage',
      bbox: this.visibleExtent,
    };

    this.assignOptions(params, this.options);
    params.width = nCols;
    params.height = nRows;
    const url = this.addParameters(this.url, params);
    this.fetchIndex += 1;
    M.proxy(false);
    M.remote.get(url).then((response) => {
      M.proxy(true);
      const text = response.text.split(NO_DATA_VALUE).join('');
      const parser = new ArcGridParser();
      mdtData = parser.parseData(text);
      innerThis.dx = parser.getDx();
      innerThis.dy = parser.getDy();
      innerThis.noDataValue = parser.getNoDataValue();
      innerThis.mdtData = mdtData;
    }).catch((error) => {
      M.proxy(true);
      // eslint-disable-next-line no-console
      console.error(`Error received in request: ${error.message}`);
    });
  }

  getValue(coords, epsgCode) {
    let newCoords = coords;
    let res = 0;
    if (!this.mdtData) {
      res = this.noDataValue;
    } else {
      if (epsgCode && epsgCode.toLowerCase() !== this.options.crs.toLowerCase()) {
        const pt = ol.proj.transform(coords, epsgCode, this.options.crs);
        newCoords = [pt.x, pt.y];
      }

      if (this.coverageExtension
          && newCoords[0] > this.coverageExtension[0]
          && newCoords[0] < this.coverageExtension[2]
          && newCoords[1] > this.coverageExtension[1]
          && newCoords[1] < this.coverageExtension[3]) {
        const x = this.visibleExtent[0] - newCoords[0];
        const y = this.visibleExtent[3] - newCoords[1];
        const col = Math.floor(Math.abs((x / this.dx)));
        const row = Math.floor(Math.abs((y / this.dy)));
        const h1 = this.mdtData[row] && this.mdtData[row][col]
          && this.mdtData[row][col] !== this.noDataValue ? this.mdtData[row][col] : 0;
        const h2 = this.mdtData[row] && this.mdtData[row][col + 1]
          && this.mdtData[row][col + 1] !== this.noDataValue ? this.mdtData[row][col + 1] : 0;
        const h3 = this.mdtData[row + 1] && this.mdtData[row + 1][col]
          && this.mdtData[row + 1][col] !== this.noDataValue ? this.mdtData[row + 1][col] : 0;
        const h4 = this.mdtData[row + 1] && this.mdtData[row + 1][col + 1]
          && this.mdtData[row + 1][col + 1] !== this.noDataValue
          ? this.mdtData[row + 1][col + 1]
          : 0;
        const xs = ((this.visibleExtent[0] - newCoords[0]) - (Math.floor((x / this.dx)) * this.dx))
          / this.dx;
        const ys = ((this.visibleExtent[3] - newCoords[1]) - (Math.floor((y / this.dy)) * this.dy))
          / this.dy;
        const r = this.bilinealInterpolation(h1, h3, h2, h4, xs, ys).toFixed(2);
        res = r;
      }
    }

    return res;
  }

  getGridResponse(error, result, userData) {
    if (userData !== this.fetchIndex) {
      return;
    }

    if (error) {
      return;
    }

    if (result) {
      const parser = new ArcGridParser();
      this.mdtData = parser.parseData(result);
      this.dx = parser.getDx();
      this.dy = parser.getDy();
      this.noDataValue = parser.getNoDataValue();
    }
  }

  getExtension(extent, epsgCode) {
    let res = [];
    if (epsgCode && epsgCode.toLowerCase() === this.options.crs.toLowerCase()) {
      res = extent;
    } else {
      const src = epsgCode;
      const dest = this.options.crs;
      const p0 = ol.proj.transform([extent[0], extent[1]], src, dest);
      const p1 = ol.proj.transform([extent[0], extent[3]], src, dest);
      const p2 = ol.proj.transform([extent[2], extent[1]], src, dest);
      const p3 = ol.proj.transform([extent[2], extent[3]], src, dest);
      res = [
        Math.min(p0.x, p1.x, p2.x, p3.x),
        Math.min(p0.y, p1.y, p2.y, p3.y),
        Math.max(p0.x, p1.x, p2.x, p3.x),
        Math.max(p0.y, p1.y, p2.y, p3.y),
      ];
    }

    return res;
  }

  getCoverageResponse(error, response, userData) {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`Error received in DescribeCoverage request: ${error.message}`);
      return;
    }

    if (response) {
      const data = response;
      const envelope = data.getElementsByTagName('gml:Envelope');
      const innerThis = this;
      const loop = (i) => {
        if (envelope[i].getAttribute('srsName') === innerThis.options.crs) {
          const coverageExtension = [];
          envelope[i].childNodes[1].childNodes[0].nodeValue.split(' ').forEach((coord) => {
            coverageExtension.push(parseFloat(coord));
          });
          envelope[i].childNodes[3].childNodes[0].nodeValue.split(' ').forEach((coord) => {
            coverageExtension.push(parseFloat(coord));
          });
          innerThis.coverageExtension = coverageExtension;
        }
      };

      for (let i = 0; i < envelope.length; i += 1) {
        loop(i);
      }

      const offsetVector = data.getElementsByTagName('gml:offsetVector');
      if (offsetVector) {
        this.cellsizeX = Math.abs(parseFloat(offsetVector[0].childNodes[0].nodeValue.split(' ')[0]));
        this.cellsizeY = Math.abs(parseFloat(offsetVector[1].childNodes[0].nodeValue.split(' ')[1]));
      }
    }
  }

  getVisibleExtent(mapExtent, epsgCode) {
    const extent = this.getExtension(mapExtent, epsgCode);
    return this.coverageExtension ? [
      Math.max(extent[0], this.coverageExtension[0]),
      Math.max(extent[1], this.coverageExtension[1]),
      Math.min(extent[2], this.coverageExtension[2]),
      Math.min(extent[3], this.coverageExtension[3]),
    ] : extent;
  }

  bilinealInterpolation(g00, g10, g01, g11, xs, ys) {
    return (g00 * (1 - xs) * (1 - ys)) + (g10 * xs * (1 - ys))
      + (g01 * (1 - xs) * ys) + (g11 * xs * ys);
  }

  assignOptions(obj, opts) {
    if (!obj || !opts) {
      return;
    }

    Object.keys(opts).forEach((opt) => {
      if (opts[opt] !== null && opts[opt]) {
        // eslint-disable-next-line no-param-reassign
        obj[opt] = opts[opt];
      }
    });
  }

  addParameters(uri, params) {
    let newUri = uri;
    const keyParams = [];
    Object.keys(params).forEach((k) => {
      if (params[k] !== null && params[k] !== undefined) {
        keyParams.push(`${k}=${encodeURIComponent(params[k])}`);
      }
    });

    const qs = keyParams.join('&');
    newUri = newUri.replace(/[?&]$/, '');
    newUri = newUri.indexOf('?') === -1 ? `${newUri}?` : `${newUri}&`;
    return newUri + qs;
  }
}
