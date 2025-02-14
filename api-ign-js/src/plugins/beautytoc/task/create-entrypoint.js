const path = require('path');
const fs = require('fs-extra');

const SRC_PATH = path.resolve(__dirname, '..', 'src');
const DIST_PATH = path.resolve(__dirname, '..', 'dist');
const FACADE_PATH = path.resolve(SRC_PATH, 'facade', 'js');

const files = [];
const namespaces = [];
const uniqueNS = [];
let imports = '';
let exportedClasses = '';
let createNS = '';

const getAbsolutePath = (fileNames, fullPath) => {
  const absolutePaths = fileNames.map((fileName) => path.resolve(fullPath, fileName));
  absolutePaths.forEach((absolutePath) => {
    if (fs.lstatSync(absolutePath).isDirectory() === true) {
      getAbsolutePath(fs.readdirSync(absolutePath), absolutePath);
    } else if (/.js$/.test(absolutePath)) {
      files.push(absolutePath);
    }
  });
};

const facadeFiles = fs.readdirSync(FACADE_PATH);
getAbsolutePath(facadeFiles, FACADE_PATH);

files.forEach((file) => {
  const match = fs.readFileSync(file, 'utf8').match(/@module.*/);
  if (match !== null) {
    const namespace = match[0].replace(/@module (.*)/, '$1');
    namespaces.push({
      alias: namespace.replace(/\//g, '$'),
      namespace: namespace.replace(/\//g, '.'),
      path: file.replace(/.*\/src(\/.*)/, '.$1'),
    });
  }
});

namespaces.forEach((namespace) => {
  const partitions = namespace.namespace.split('.');
  for (let i = 2; i < partitions.length; i += 1) {
    const partition = partitions.slice(0, i).join('.');
    if (uniqueNS.includes(partition) === false) {
      uniqueNS.push(partition);
    }
  }
});

namespaces.forEach((namespace) => {
  imports += `import ${namespace.alias} from '${namespace.path.replace(/(.*)\.js/, '$1')}';\n`;
  exportedClasses += `window.${namespace.namespace} = ${namespace.alias};\n`;
});

uniqueNS.forEach((ns) => {
  createNS += `if (!window.${ns}) window.${ns} = {};\n`;
});

const contentEntryPoint = `${imports}\n${createNS}${exportedClasses}`;

fs.writeFileSync(path.join(SRC_PATH, 'index.js'), contentEntryPoint);
fs.removeSync(DIST_PATH);
fs.ensureDirSync(DIST_PATH);
