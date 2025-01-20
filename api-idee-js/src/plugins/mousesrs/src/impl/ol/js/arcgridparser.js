export default class ArcGridParser {
  constructor() {
    this.data = [];
    this.nCols = 0;
    this.nRows = 0;
    this.xllcorner = 0;
    this.yllcorner = 0;
    this.dx = 0;
    this.dy = 0;
    this.noDataValue = -9999;
  }

  parseData(dataOrg) {
    const data = dataOrg.toLowerCase();
    this.data = [];
    const lines = data.split('\n');
    lines.forEach(this.readLine.bind(this));
    return this.data;
  }

  getDx() {
    return this.dx;
  }

  getDy() {
    return this.dy;
  }

  getNoDataValue() {
    return this.noDataValue;
  }

  readLine(lineOrg) {
    const line = lineOrg.trim();
    if (!line) {
      return;
    }

    if (line.indexOf('ncols') >= 0) {
      this.nCols = parseFloat(line.substr(5));
    } else if (line.indexOf('nrows') >= 0) {
      this.nRows = parseFloat(line.substr(5));
    } else if (line.indexOf('xllcorner') >= 0) {
      this.xllcorner = parseFloat(line.substr(9));
    } else if (line.indexOf('yllcorner') >= 0) {
      this.yllcorner = parseFloat(line.substr(9));
    } else if (line.indexOf('cellsize') >= 0) {
      this.dx = parseFloat(line.substr(8));
      this.dy = parseFloat(line.substr(8));
    } else if (line.indexOf('dx') >= 0) {
      this.dx = parseFloat(line.substr(2));
    } else if (line.indexOf('dy') >= 0) {
      this.dy = parseFloat(line.substr(2));
    } else if (line.indexOf('nodata_value') >= 0) {
      this.noDataValue = parseFloat(line.substr(12));
    } else {
      this.data.push(line.split(' ').map((x) => {
        return parseFloat(x);
      }));
    }
  }
}
