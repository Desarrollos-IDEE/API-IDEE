const fse = require('fs-extra');
const path = require('path');

const INDEX_DOC = path.resolve(__dirname, '..', 'config', 'jsdoc', 'index.html');
const DOC_PATH = path.resolve(__dirname, '..', 'doc');

fse.copy(INDEX_DOC, path.join(DOC_PATH, 'index.html'));
