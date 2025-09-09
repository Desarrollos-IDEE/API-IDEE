/* eslint-disable import/no-relative-packages */

import * as algorithm from '../../node_modules/jsts/org/locationtech/jts/algorithm';
import * as densify from '../../node_modules/jsts/org/locationtech/jts/densify';
import * as dissolve from '../../node_modules/jsts/org/locationtech/jts/dissolve';
import * as geom from '../../node_modules/jsts/org/locationtech/jts/geom';
import * as geomgraph from '../../node_modules/jsts/org/locationtech/jts/geomgraph';
import * as index from '../../node_modules/jsts/org/locationtech/jts/index';
import * as io from '../../node_modules/jsts/org/locationtech/jts/io';
import * as linearref from '../../node_modules/jsts/org/locationtech/jts/linearref';
import * as noding from '../../node_modules/jsts/org/locationtech/jts/noding';
import * as operation from '../../node_modules/jsts/org/locationtech/jts/operation';
import * as precision from '../../node_modules/jsts/org/locationtech/jts/precision';
import * as simplify from '../../node_modules/jsts/org/locationtech/jts/simplify';
import * as triangulate from '../../node_modules/jsts/org/locationtech/jts/triangulate';
import * as util from '../../node_modules/jsts/org/locationtech/jts/util';

import '../../node_modules/jsts/org/locationtech/jts/monkey';

const packageJson = require('../../node_modules/jsts/package');

const version = packageJson.version;

export {
  version,
  algorithm,
  densify,
  dissolve,
  geom,
  geomgraph,
  index,
  io,
  linearref,
  noding,
  operation,
  precision,
  simplify,
  triangulate,
  util,
};
