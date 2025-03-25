/**
 * @classdesc
 * @api
 */
class Base {
  /**
   * This function get a function filter
   *
   * @public
   * @protected
   * @function
   */
  getFunctionFilter() {}

  /**
   * This function execute a function filter
   *
   * @protected
   * @param {Array<IDEE.Feature>} features - Features on which the filter runs
   * @function
   */
  execute(features) {}

  /**
   * This function execute a function filter
   *
   * @protected
   * @param {Array<IDEE.Feature>} features - Features on which the filter runs
   * @return {Array<IDEE.Feature>} Result of execute
   * @function
   */
  toCQL() {}
}

/**
 * @classdesc
 * @api
 */
class Function extends Base {
  /**
   * Creates a Filter Function to filter features
   *
   * @param {function} filterFunction - Function to execute
   * @api
   */
  constructor(filterFunction, options = {}) {
    super();
    /**
     * Function to execute
     * @private
     * @type {function}
     */
    this.filterFunction_ = filterFunction;

    /**
     * Filter CQL
     * @private
     * @type {String}
     */
    this.cqlFilter_ = '';
    if (!IDEE.utils.isNullOrEmpty(options.cqlFilter)) {
      this.cqlFilter_ = options.cqlFilter;
    }
  }

  /**
   * This function set a function filter
   *
   * @public
   * @function
   * @api
   */
  setFunction(filterFunction) {
    this.filterFunction_ = filterFunction;
  }

  /**
   * This function get a function filter
   *
   * @public
   * @function
   * @return {IDEE.filter.Function} filter to execute
   * @api
   */
  getFunctionFilter() {
    return this.filterFunction_;
  }

  /**
   * This function execute a function filter
   *
   * @public
   * @function
   * @param {Array<IDEE.Feature>} features - Features on which the filter runs
   * @return {Array<IDEE.Feature>} features to passed filter
   * @api
   */
  execute(features) {
    return features.filter(this.filterFunction_);
  }

  /**
   * This function return CQL
   *
   * @public
   * @function
   * @api
   * @return {string} CQL
   */
  toCQL() {
    return this.cqlFilter_;
  }
}

/**
 * @classdesc
 * @api
 */
class Spatial extends Function {
  /**
   * Creates a Filter Spatial to filter features
   *
   * @api
   */
  constructor(FunctionParam, options) {
    const filterFunction = (feature, index) => {
      let geometry = null;
      if (!IDEE.utils.isNullOrEmpty(feature)) {
        geometry = feature.getGeometry();
      }
      return FunctionParam(geometry, index);
    };
    super(filterFunction, options);
  }
}

/**
 * @function
 * @api
 */
export const parseParamToGeometries = (paramParameter) => {
  let param = paramParameter;
  let geometries = [];
  if (param instanceof IDEE.layer.Vector) {
    geometries = [...param.getFeatures().map((feature) => feature.getGeometry())];
  } else {
    if (!IDEE.utils.isArray(param)) {
      param = [param];
    }
    geometries = param.map((p) => {
      let geom;
      if (p instanceof IDEE.Feature) {
        geom = p.getGeometry();
      } else if (IDEE.isObject(p)) {
        geom = p;
      }
      return geom;
    });
  }

  return geometries;
};

/**
 * @private
 * @function
 */
const toCQLFilter = (operation, geometries) => {
  let cqlFilter = '';
  const wktFormat = new IDEE.format.WKT();
  geometries.forEach((value, index) => {
    if (index !== 0) {
      // es un OR porque se hace una interseccion completa con todas
      // las geometries
      cqlFilter += ' OR ';
    }
    const geometry = new IDEE.Feature('filtered_geom', {
      type: 'Feature',
      geometry: value,
    });
    const formatedGeometry = wktFormat.write(geometry);
    cqlFilter += `${operation}({{geometryName}}, ${formatedGeometry})`;
  });
  return cqlFilter;
};

/**
 * This function creates a spatial filter to know which features intersects
 * another feature or layer
 *
 * @function
 * @api
 */
export const intersect = (param) => {
  const geometries = parseParamToGeometries(param);
  return new Spatial((geometryToFilter, index) => {
    const geojsonParser = new jsts.io.GeoJSONReader();
    const jtsGeomToFilter = geojsonParser.read(geometryToFilter);
    return geometries.some((geom) => {
      const jtsGeom = geojsonParser.read(geom);
      return jsts.operation.relate.RelateOp.intersects(jtsGeomToFilter, jtsGeom);
    });
  }, {
    cqlFilter: toCQLFilter('INTERSECTS', geometries),
  });
};
