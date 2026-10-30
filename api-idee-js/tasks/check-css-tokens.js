/**
 * Comprueba que las hojas de estilos propias de la API y de sus plugins usan las
 * variables CSS de los tokens de diseño (--idee-*) en las propiedades de tipografía
 * y forma, en lugar de valores rígidos.
 *
 * Uso: node tasks/check-css-tokens.js (npm run check:css-tokens, también en prebuild).
 *
 * Las excepciones justificadas se marcan con un comentario con motivo obligatorio:
 * "idee-token-exception: <motivo>" antes de la declaración, o un bloque entre
 * "idee-token-exception-start: <motivo>" e "idee-token-exception-end".
 * Ver docs/tokens-de-diseno.md.
 */
const path = require('path');
const fs = require('fs');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');

/** Carpetas analizadas (relativas a api-idee-js). Los plugins solo en su carpeta src. */
const SCAN_DIRS = ['src/facade', 'src/impl', 'src/plugins/*/src'];

/** Ficheros o carpetas excluidos y su motivo. */
const EXCLUDED = {
  'src/impl/cesium/assets/css/widgets.css': 'CSS de Cesium (packages/widgets/Source/shared.css), código de terceros',
  'src/impl/leaflet/': 'implementación Leaflet sin configuración de compilación',
  'src/facade/assets/css/panel.css': 'hoja no importada (SidePanel.js)',
  'src/plugins/information/src/facade/assets/fonts/': 'fuente de iconos generada por IcoMoon',
};

/** Las hojas minificadas son copias de terceros (p. ej. font-awesome.min.css). */
const EXCLUDED_PATTERN = /\.min\.css$/;

/** Prefijo de variable exigido por cada propiedad vigilada. */
const TOKEN_PREFIX = {
  'font-family': '--idee-font-family',
  'font-size': '--idee-font-size-',
  'font-weight': '--idee-font-weight-',
  'border-radius': '--idee-shape-border-radius',
  'border-top-left-radius': '--idee-shape-border-radius',
  'border-top-right-radius': '--idee-shape-border-radius',
  'border-bottom-left-radius': '--idee-shape-border-radius',
  'border-bottom-right-radius': '--idee-shape-border-radius',
  'box-shadow': '--idee-shape-box-shadow',
};

const CSS_WIDE_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

const EXCEPTION = /^idee-token-exception(-start|-end)?\s*(?::\s*(.*))?$/s;

const usesToken = (value, prefix) => new RegExp(`var\\(\\s*${prefix}`).test(value);

/**
 * Divide un valor por espacios y '/' de primer nivel (fuera de paréntesis).
 * @param {string} value Valor CSS.
 * @returns {Array<string>} Componentes.
 */
const splitTopLevel = (value) => {
  const parts = [];
  let depth = 0;
  let current = '';
  Array.from(value).forEach((char) => {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (depth === 0 && (/\s/.test(char) || char === '/')) {
      if (current) parts.push(current);
      current = '';
    } else {
      current += char;
    }
  });
  if (current) parts.push(current);
  return parts;
};

/**
 * Indica si el valor de una propiedad vigilada es admisible.
 * @param {string} prop Propiedad sin prefijo de proveedor.
 * @param {string} rawValue Valor de la declaración.
 * @returns {boolean} Verdadero si es admisible.
 */
const isAllowedValue = (prop, rawValue) => {
  const value = rawValue.trim();
  const lower = value.toLowerCase();
  if (CSS_WIDE_KEYWORDS.has(lower)) {
    return true;
  }
  if (prop === 'font') {
    return usesToken(value, TOKEN_PREFIX['font-family']) && usesToken(value, TOKEN_PREFIX['font-size']);
  }
  if (prop === 'box-shadow') {
    return lower === 'none' || usesToken(value, TOKEN_PREFIX['box-shadow']);
  }
  if (prop.endsWith('radius')) {
    // Cada esquina: 0, porcentaje (geometría relativa a la caja) o la variable de forma
    return splitTopLevel(value).every((part) => /^0(\.0+)?([a-z]+)?$/i.test(part)
      || /^\d+(\.\d+)?%$/.test(part)
      || CSS_WIDE_KEYWORDS.has(part.toLowerCase())
      || usesToken(part, TOKEN_PREFIX[prop]));
  }
  return usesToken(value, TOKEN_PREFIX[prop]);
};

/**
 * Analiza una hoja de estilos.
 * @param {string} source Contenido CSS.
 * @param {string} file Ruta para los mensajes.
 * @returns {Array<Object>} Infracciones: { file, line, column, prop, value, message }.
 */
const checkCss = (source, file = '<css>') => {
  const violations = [];
  const report = (node, message, prop = '', value = '') => {
    const { line = 0, column = 0 } = node.source && node.source.start ? node.source.start : {};
    violations.push({
      file, line, column, prop, value, message,
    });
  };

  let root;
  try {
    root = postcss.parse(source, { from: file });
  } catch (error) {
    violations.push({
      file,
      line: error.line || 0,
      column: error.column || 0,
      prop: '',
      value: '',
      message: `CSS no analizable: ${error.reason || error.message}`,
    });
    return violations;
  }

  let openBlock = null;
  root.walk((node) => {
    if (node.type === 'comment') {
      const match = node.text.trim().match(EXCEPTION);
      if (!match) return;
      const [, kind, reason] = match;
      if (kind === '-end') {
        if (!openBlock) report(node, 'idee-token-exception-end sin bloque abierto');
        openBlock = null;
        return;
      }
      if (!reason || !reason.trim()) {
        report(node, 'Excepción de tokens sin motivo');
      }
      if (kind === '-start') {
        if (openBlock) report(node, 'Bloque idee-token-exception-start anidado');
        openBlock = node;
      }
      return;
    }
    if (node.type !== 'decl') return;
    // Los descriptores de @font-face declaran la fuente, no la aplican
    if (node.parent.type === 'atrule' && node.parent.name.toLowerCase() === 'font-face') return;

    const prop = node.prop.toLowerCase().replace(/^-(webkit|moz|ms|o)-/, '');
    if (prop !== 'font' && !TOKEN_PREFIX[prop]) return;
    if (isAllowedValue(prop, node.value)) return;
    if (openBlock) return;

    const previous = node.prev();
    if (previous && previous.type === 'comment') {
      const match = previous.text.trim().match(EXCEPTION);
      if (match && !match[1] && match[2] && match[2].trim()) return;
    }
    report(node, `Valor rígido; usar var(${prop === 'font' ? '--idee-font-*' : TOKEN_PREFIX[prop]}…)`, node.prop, node.value);
  });

  if (openBlock) {
    report(openBlock, 'Bloque idee-token-exception-start sin cerrar');
  }
  return violations;
};

const toPosix = (file) => file.split(path.sep).join('/');

const isExcluded = (relative) => EXCLUDED_PATTERN.test(relative)
  || Object.keys(EXCLUDED).some((excluded) => relative === excluded
    || (excluded.endsWith('/') && relative.startsWith(excluded)));

const walkCss = (dir, files) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') walkCss(full, files);
    } else if (entry.name.endsWith('.css')) {
      files.push(full);
    }
  });
};

/**
 * Obtiene las hojas de estilos propias que se deben comprobar.
 * @param {string} root Carpeta api-idee-js.
 * @returns {Array<string>} Rutas relativas (formato posix).
 */
const collectCssFiles = (root = ROOT) => {
  const dirs = [];
  SCAN_DIRS.forEach((pattern) => {
    if (pattern.includes('*')) {
      const [base, rest] = pattern.split('/*/');
      const baseDir = path.join(root, base);
      if (!fs.existsSync(baseDir)) return;
      fs.readdirSync(baseDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .forEach((entry) => dirs.push(path.join(baseDir, entry.name, rest)));
    } else {
      dirs.push(path.join(root, pattern));
    }
  });

  const files = [];
  dirs.filter((dir) => fs.existsSync(dir)).forEach((dir) => walkCss(dir, files));
  return files
    .map((file) => toPosix(path.relative(root, file)))
    .filter((file) => !isExcluded(file))
    .sort();
};

/**
 * Comprueba todas las hojas de estilos propias.
 * @param {string} root Carpeta api-idee-js.
 * @returns {Object} { files, violations }.
 */
const checkProject = (root = ROOT) => {
  const files = collectCssFiles(root);
  const violations = files.flatMap((file) => checkCss(fs.readFileSync(path.join(root, file), 'utf8'), file));
  return { files, violations };
};

if (require.main === module) {
  const { files, violations } = checkProject();
  violations.forEach(({
    file, line, column, prop, value, message,
  }) => {
    const declaration = prop ? ` ${prop}: ${value}` : '';
    console.error(`${file}:${line}:${column}${declaration} -> ${message}`);
  });
  if (violations.length > 0) {
    console.error(`check-css-tokens: ${violations.length} infracciones en ${files.length} hojas de estilos.`);
    console.error('Consulta docs/tokens-de-diseno.md para usar las variables --idee-* o justificar una excepción.');
    process.exit(1);
  }
  console.log(`check-css-tokens: ${files.length} hojas de estilos sin valores rígidos de tipografía ni forma.`);
}

module.exports = {
  EXCLUDED,
  checkCss,
  checkProject,
  collectCssFiles,
  isAllowedValue,
};
