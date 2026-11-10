/**
 * @module IDEE/plugin/layerswitcher/sld
 */

export const SLD_ERROR = {
  INVALID_XML: 'sld_invalid_xml',
  NOT_SLD: 'sld_not_sld',
  RASTER_ONLY: 'sld_raster_only',
  NO_STYLES: 'sld_no_styles',
};

export class SLDError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const GEOMETRY_BY_SYMBOLIZER = {
  PolygonSymbolizer: 'polygon',
  LineSymbolizer: 'line',
  PointSymbolizer: 'point',
};

const IGNORED_ELEMENTS = ['VendorOption', 'Priority', 'LinePlacement', 'Geometry', 'PerpendicularOffset'];

const childrenOf = (node, name) => Array.from(node?.children || [])
  .filter((child) => child.localName === name);

const childOf = (node, name) => childrenOf(node, name)[0] || null;

const textOf = (node) => (node?.textContent || '').trim();

const titleOf = (node) => textOf(childOf(node, 'Title'))
  || textOf(childOf(childOf(node, 'Description'), 'Title'));

const toNumber = (value) => {
  const number = parseFloat(value);
  return Number.isFinite(number) ? number : undefined;
};

const setDefined = (target, key, value) => {
  if (value !== undefined && value !== '') {
    // eslint-disable-next-line no-param-reassign
    target[key] = value;
  }
  return target;
};

const mergeOptions = (base, extra) => {
  const merged = { ...base };
  Object.keys(extra || {}).forEach((key) => {
    const value = extra[key];
    merged[key] = value !== null && typeof value === 'object' && !Array.isArray(value)
      && typeof merged[key] === 'object' && merged[key] !== null
      ? mergeOptions(merged[key], value) : value;
  });
  return merged;
};

const COMPARISONS = {
  PropertyIsEqualTo: 'eq',
  PropertyIsNotEqualTo: 'ne',
  PropertyIsLessThan: 'lt',
  PropertyIsLessThanOrEqualTo: 'le',
  PropertyIsGreaterThan: 'gt',
  PropertyIsGreaterThanOrEqualTo: 'ge',
};

const RULE_BASE = 0;
const RULE_FILTERED = 1;
const RULE_ELSE = 2;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const likeToRegExp = (pattern, wildCard, singleChar, escapeChar) => {
  let source = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === escapeChar && i + 1 < pattern.length) {
      i += 1;
      source += escapeRegExp(pattern[i]);
    } else if (char === wildCard) {
      source += '.*';
    } else if (char === singleChar) {
      source += '.';
    } else {
      source += escapeRegExp(char);
    }
  }
  return `^${source}$`;
};

const ruleValue = (rules, feature, map) => {
  const scale = map && typeof map.getScale === 'function' ? map.getScale() : null;
  const inScale = (rule) => scale === null || scale === undefined
    || ((rule[4] === null || scale >= rule[4]) && (rule[5] === null || scale < rule[5]));
  const test = (node) => {
    if (node.op === 'and' || node.op === 'or') {
      for (let i = 0; i < node.args.length; i += 1) {
        const passed = test(node.args[i]);
        if (node.op === 'and' && !passed) return false;
        if (node.op === 'or' && passed) return true;
      }
      return node.op === 'and';
    }
    if (node.op === 'not') return !test(node.args[0]);
    const raw = feature.getAttribute(node.property);
    if (node.op === 'null') return raw === null || raw === undefined;
    if (raw === null || raw === undefined) return false;
    const text = String(raw);
    if (node.op === 'like') return new RegExp(node.pattern, node.matchCase === false ? 'i' : '').test(text);
    const compare = (literal) => {
      const other = String(literal);
      const left = Number(text);
      const right = Number(other);
      if (text.trim() !== '' && other.trim() !== '' && !Number.isNaN(left) && !Number.isNaN(right)) {
        return left - right;
      }
      const a = node.matchCase === false ? text.toLowerCase() : text;
      const b = node.matchCase === false ? other.toLowerCase() : other;
      if (a === b) return 0;
      return a < b ? -1 : 1;
    };
    if (node.op === 'between') return compare(node.lower) >= 0 && compare(node.upper) <= 0;
    const result = compare(node.value);
    if (node.op === 'eq') return result === 0;
    if (node.op === 'ne') return result !== 0;
    if (node.op === 'lt') return result < 0;
    if (node.op === 'le') return result <= 0;
    if (node.op === 'gt') return result > 0;
    if (node.op === 'ge') return result >= 0;
    return false;
  };
  let value;
  let elseValue;
  let hasElse = false;
  let matched = false;
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (inScale(rule)) {
      if (rule[0] === 0) {
        if (rule[3]) value = rule[2];
      } else if (rule[0] === 2) {
        if (rule[3]) {
          elseValue = rule[2];
          hasElse = true;
        }
      } else if (test(rule[1])) {
        matched = true;
        if (rule[3]) value = rule[2];
      }
    }
  }
  if (!matched && hasElse) value = elseValue;
  if (typeof value === 'string') {
    const template = /^\{\{(.+)\}\}$/.exec(value);
    if (template) value = feature.getAttribute(template[1]);
  }
  return value === null ? undefined : value;
};

const RULE_VALUE_SOURCE = ruleValue.toString().replace(/\s*\n\s*/g, ' ');

const createRuleFunction = (rules) => {
  // eslint-disable-next-line no-new-func
  const factory = new Function(`return (feature, map) => (${RULE_VALUE_SOURCE})(${JSON.stringify(rules)}, feature, map);`);
  return factory();
};

const leafPaths = (options, prefix = []) => Object.keys(options).reduce((leaves, key) => {
  const value = options[key];
  const path = prefix.concat(key);
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return leaves.concat(leafPaths(value, path));
  }
  return leaves.concat({ path: path.join('.'), value });
}, []);

const setPath = (target, path, value) => {
  const keys = path.split('.');
  let node = target;
  keys.slice(0, -1).forEach((key) => {
    if (node[key] === undefined) node[key] = {};
    node = node[key];
  });
  node[keys[keys.length - 1]] = value;
};

const ruleBasedOptions = (rules) => {
  const entries = rules.map((rule) => {
    let kind = RULE_FILTERED;
    if (rule.filter.type === 'all') kind = RULE_BASE;
    if (rule.filter.type === 'else') kind = RULE_ELSE;
    const leaves = new Map(leafPaths(rule.options).map(({ path, value }) => [path, value]));
    return {
      kind, condition: rule.filter.condition || null, leaves, scale: rule.scale,
    };
  });
  const paths = [...new Set(entries.flatMap((entry) => [...entry.leaves.keys()]))];
  const options = {};
  paths.forEach((path) => {
    const definers = entries.filter((entry) => entry.leaves.has(path));
    if (definers.every((entry) => entry.kind === RULE_BASE && !entry.scale.limited)) {
      setPath(options, path, definers[definers.length - 1].leaves.get(path));
      return;
    }
    setPath(options, path, createRuleFunction(entries.map((entry) => [
      entry.kind,
      entry.condition,
      entry.leaves.has(path) ? entry.leaves.get(path) : null,
      entry.leaves.has(path),
      entry.scale.min,
      entry.scale.max,
    ])));
  });
  return options;
};

class Reader {
  constructor() {
    this.ignored = [];
  }

  ignore(key, name = '') {
    if (!this.ignored.some((item) => item.key === key && item.name === name)) {
      this.ignored.push({ key, name });
    }
  }

  parameters(node) {
    const params = {};
    if (!node) return params;
    Array.from(node.children)
      .filter((child) => child.localName === 'CssParameter' || child.localName === 'SvgParameter')
      .forEach((param) => {
        const name = param.getAttribute('name');
        if (Array.from(param.children).some((child) => child.localName === 'PropertyName')) {
          this.ignore('attribute_value', name);
          return;
        }
        params[name] = textOf(param);
      });
    return params;
  }

  fill(node) {
    if (!node) return undefined;
    if (childOf(node, 'GraphicFill')) this.ignore('element', 'GraphicFill');
    const params = this.parameters(node);
    const fill = { color: params.fill || '#808080' };
    fill.opacity = toNumber(params['fill-opacity']) ?? 1;
    return fill;
  }

  stroke(node) {
    if (!node) return undefined;
    ['GraphicFill', 'GraphicStroke'].forEach((name) => {
      if (childOf(node, name)) this.ignore('element', name);
    });
    const params = this.parameters(node);
    const stroke = { color: params.stroke || '#000000', width: toNumber(params['stroke-width']) ?? 1 };
    setDefined(stroke, 'opacity', toNumber(params['stroke-opacity']));
    setDefined(stroke, 'linecap', params['stroke-linecap']);
    setDefined(stroke, 'linejoin', params['stroke-linejoin']);
    if (params['stroke-dasharray']) {
      const dash = params['stroke-dasharray'].split(/[\s,]+/).map(toNumber)
        .filter((value) => value !== undefined);
      if (dash.length > 0) stroke.linedash = dash;
    }
    if (params['stroke-dashoffset']) this.ignore('element', 'stroke-dashoffset');
    return stroke;
  }

  point(symbolizer) {
    const graphic = childOf(symbolizer, 'Graphic');
    if (!graphic) return {};
    const options = {};
    const size = toNumber(textOf(childOf(graphic, 'Size')));
    const opacity = toNumber(textOf(childOf(graphic, 'Opacity')));
    if (childOf(graphic, 'Rotation')) this.ignore('element', 'Rotation');
    const external = childOf(graphic, 'ExternalGraphic');
    const mark = childOf(graphic, 'Mark');
    if (external) {
      const resource = childOf(external, 'OnlineResource');
      const href = resource?.getAttribute('xlink:href')
        || resource?.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (href) {
        options.icon = { src: href };
        setDefined(options.icon, 'opacity', opacity);
        if (size !== undefined) this.ignore('element', 'ExternalGraphic Size');
      }
    } else if (mark) {
      const shape = textOf(childOf(mark, 'WellKnownName')).toLowerCase() || 'square';
      if (shape !== 'circle') this.ignore('mark', shape);
      setDefined(options, 'radius', size !== undefined ? size / 2 : 3);
      const markFill = childOf(mark, 'Fill');
      const markStroke = childOf(mark, 'Stroke');
      if (!markFill && !markStroke) {
        options.fill = { color: '#808080', opacity: 1 };
        options.stroke = { color: '#000000', width: 1 };
      } else {
        setDefined(options, 'fill', this.fill(markFill));
        setDefined(options, 'stroke', this.stroke(markStroke));
      }
      if (opacity !== undefined && options.fill) {
        options.fill.opacity = (options.fill.opacity ?? 1) * opacity;
      }
    }
    return options;
  }

  label(symbolizer) {
    const labelNode = childOf(symbolizer, 'Label');
    if (!labelNode) return undefined;
    const properties = Array.from(labelNode.getElementsByTagNameNS('*', 'PropertyName'));
    const literal = Array.from(labelNode.childNodes)
      .filter((node) => node.nodeType === 3 || node.localName === 'Literal')
      .map((node) => node.textContent)
      .join('')
      .trim();
    let text;
    if (properties.length > 0) {
      if (properties.length > 1 || literal !== '') this.ignore('label');
      text = `{{${textOf(properties[0])}}}`;
    } else {
      text = literal;
    }
    if (text === '') return undefined;
    const label = { text };
    const font = this.parameters(childOf(symbolizer, 'Font'));
    if (Object.keys(font).length > 0) {
      const size = toNumber(font['font-size']) || 10;
      label.font = [font['font-style'], font['font-weight'], `${size}px`, font['font-family'] || 'sans-serif']
        .filter((part) => part && part !== 'normal').join(' ');
    }
    const fill = this.fill(childOf(symbolizer, 'Fill'));
    if (fill?.color) label.color = fill.color;
    const halo = childOf(symbolizer, 'Halo');
    if (halo) {
      const haloFill = this.fill(childOf(halo, 'Fill'));
      const radius = toNumber(textOf(childOf(halo, 'Radius'))) ?? 1;
      label.stroke = { color: haloFill?.color || '#ffffff', width: radius * 2 };
    }
    const pointPlacement = childOf(childOf(symbolizer, 'LabelPlacement'), 'PointPlacement');
    if (pointPlacement) {
      const anchor = childOf(pointPlacement, 'AnchorPoint');
      if (anchor) {
        const x = toNumber(textOf(childOf(anchor, 'AnchorPointX')));
        const y = toNumber(textOf(childOf(anchor, 'AnchorPointY')));
        if (x !== undefined) label.align = ['left', 'center', 'right'][Math.round(Math.min(1, Math.max(0, x)) * 2)];
        if (y !== undefined) label.baseline = ['bottom', 'middle', 'top'][Math.round(Math.min(1, Math.max(0, y)) * 2)];
      }
      const displacement = childOf(pointPlacement, 'Displacement');
      if (displacement) {
        const dx = toNumber(textOf(childOf(displacement, 'DisplacementX'))) || 0;
        const dy = toNumber(textOf(childOf(displacement, 'DisplacementY'))) || 0;
        label.offset = [dx, -dy];
      }
      if (childOf(pointPlacement, 'Rotation')) this.ignore('element', 'Rotation');
    }
    Array.from(symbolizer.children).forEach((child) => {
      if (IGNORED_ELEMENTS.includes(child.localName)) this.ignore('element', child.localName);
    });
    return label;
  }

  symbolizers(rule) {
    const options = {};
    let raster = false;
    let labels = [];
    Array.from(rule.children).forEach((node) => {
      const geometry = GEOMETRY_BY_SYMBOLIZER[node.localName];
      if (geometry) {
        let symbol;
        if (geometry === 'point') {
          symbol = this.point(node);
        } else {
          symbol = {};
          setDefined(symbol, 'fill', geometry === 'polygon' ? this.fill(childOf(node, 'Fill')) : undefined);
          setDefined(symbol, 'stroke', this.stroke(childOf(node, 'Stroke')));
        }
        if (childOf(node, 'Geometry')) this.ignore('element', 'Geometry');
        options[geometry] = mergeOptions(options[geometry] || {}, symbol);
      } else if (node.localName === 'TextSymbolizer') {
        const label = this.label(node);
        if (label) labels = labels.concat(label);
      } else if (node.localName === 'RasterSymbolizer') {
        raster = true;
      }
    });
    if (labels.length > 0) {
      const label = labels[labels.length - 1];
      const targets = Object.keys(options).length > 0 ? Object.keys(options) : ['point', 'line', 'polygon'];
      targets.forEach((geometry) => {
        options[geometry] = { ...(options[geometry] || {}), label };
      });
    }
    return { options, raster };
  }

  condition(node) {
    if (!node) return { unsupported: 'Filter' };
    const name = node.localName;
    if (name === 'And' || name === 'Or' || name === 'Not') {
      const args = Array.from(node.children).map((child) => this.condition(child));
      const failed = args.find((arg) => arg.unsupported);
      if (failed) return failed;
      if (args.length === 0 || (name === 'Not' && args.length !== 1)) return { unsupported: name };
      return { op: name.toLowerCase(), args };
    }
    const property = textOf(childOf(node, 'PropertyName'));
    const matchCase = node.getAttribute('matchCase') !== 'false';
    const literal = childOf(node, 'Literal');
    if (COMPARISONS[name] && property && literal) {
      return {
        op: COMPARISONS[name], property, value: textOf(literal), matchCase,
      };
    }
    if (name === 'PropertyIsLike' && property && literal) {
      const pattern = likeToRegExp(
        textOf(literal),
        node.getAttribute('wildCard') || '*',
        node.getAttribute('singleChar') || '.',
        node.getAttribute('escapeChar') || node.getAttribute('escape') || '!',
      );
      return {
        op: 'like', property, pattern, matchCase,
      };
    }
    if (name === 'PropertyIsBetween' && property) {
      const lower = textOf(childOf(childOf(node, 'LowerBoundary'), 'Literal'));
      const upper = textOf(childOf(childOf(node, 'UpperBoundary'), 'Literal'));
      if (lower !== '' && upper !== '') {
        return {
          op: 'between', property, lower, upper,
        };
      }
    }
    if (name === 'PropertyIsNull' && property) return { op: 'null', property };
    return { unsupported: name };
  }

  filter(rule) {
    if (childOf(rule, 'ElseFilter')) return { type: 'else' };
    const filter = childOf(rule, 'Filter');
    if (!filter) return { type: 'all' };
    const condition = this.condition(filter.children[0]);
    if (condition.unsupported) {
      this.ignore('filter', condition.unsupported);
      return null;
    }
    if (condition.op === 'eq' && condition.matchCase) {
      return {
        type: 'equal', property: condition.property, value: condition.value, condition,
      };
    }
    return { type: 'rule', condition };
  }

  userStyle(userStyle, fallbackLabel) {
    const rules = [];
    let raster = false;
    let symbolized = false;
    Array.from(userStyle.getElementsByTagNameNS('*', 'Rule')).forEach((rule) => {
      const min = toNumber(textOf(childOf(rule, 'MinScaleDenominator')));
      const max = toNumber(textOf(childOf(rule, 'MaxScaleDenominator')));
      const scale = {
        min: min === undefined ? null : min,
        max: max === undefined ? null : max,
        limited: min !== undefined || max !== undefined,
      };
      const filter = this.filter(rule);
      const result = this.symbolizers(rule);
      raster = raster || result.raster;
      if (Object.keys(result.options).length > 0) symbolized = true;
      if (filter && Object.keys(result.options).length > 0) {
        rules.push({ filter, options: result.options, scale });
      }
    });

    const base = rules.filter((rule) => rule.filter.type === 'all')
      .reduce((options, rule) => mergeOptions(options, rule.options), {});
    const filteredRules = rules.filter((rule) => ['equal', 'rule'].includes(rule.filter.type));
    const equalRules = filteredRules.filter((rule) => rule.filter.type === 'equal');
    const elseRules = rules.filter((rule) => rule.filter.type === 'else');
    const isCategory = equalRules.length > 0 && equalRules.length === filteredRules.length
      && equalRules.every((rule) => rule.filter.property === equalRules[0].filter.property);
    const byScale = rules.some((rule) => rule.scale.limited);
    let style = null;

    if (byScale || (filteredRules.length > 0 && !isCategory)) {
      style = new IDEE.style.Generic(ruleBasedOptions(rules));
    } else if (isCategory) {
      const { property } = equalRules[0].filter;
      const categories = {};
      equalRules.forEach((rule) => {
        const key = rule.filter.value;
        categories[key] = mergeOptions(categories[key] || base, rule.options);
      });
      const other = elseRules.reduce((options, rule) => mergeOptions(options, rule.options), base);
      const styles = {};
      Object.keys(categories).forEach((key) => {
        styles[key] = new IDEE.style.Generic(categories[key]);
      });
      if (Object.keys(other).length > 0) styles.other = new IDEE.style.Generic(other);
      style = new IDEE.style.Category(property, styles);
    } else {
      const options = elseRules.reduce((merged, rule) => mergeOptions(merged, rule.options), base);
      if (Object.keys(options).length > 0) style = new IDEE.style.Generic(options);
    }

    return {
      style,
      raster: raster && !symbolized,
      label: titleOf(userStyle) || textOf(childOf(userStyle, 'Name')) || fallbackLabel,
      isDefault: ['1', 'true'].includes(textOf(childOf(userStyle, 'IsDefault')).toLowerCase()),
    };
  }
}

const nameKeys = (name) => {
  const full = String(name || '').trim().toLowerCase();
  const short = full.split(/[.:]/).pop();
  return full === '' ? [] : [full, short];
};

const findLayerNode = (root, layerNames) => {
  const candidates = Array.from(root.getElementsByTagNameNS('*', 'NamedLayer'))
    .concat(Array.from(root.getElementsByTagNameNS('*', 'UserLayer')));
  if (candidates.length === 0) return { node: root, fallback: null };
  const layerKeys = layerNames.flatMap(nameKeys);
  const matching = candidates.find((node) => nameKeys(textOf(childOf(node, 'Name')))
    .some((key) => layerKeys.includes(key)));
  if (matching) return { node: matching, fallback: null };
  const [first] = candidates;
  return { node: first, fallback: candidates.length > 1 ? textOf(childOf(first, 'Name')) : null };
};

export const parseSLD = (text, { layerNames = [], fileName = 'SLD' } = {}) => {
  const document = new DOMParser().parseFromString(text || '', 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0 || !document.documentElement) {
    throw new SLDError(SLD_ERROR.INVALID_XML);
  }
  const root = document.documentElement;
  if (!['StyledLayerDescriptor', 'UserStyle', 'FeatureTypeStyle'].includes(root.localName)) {
    throw new SLDError(SLD_ERROR.NOT_SLD);
  }
  const reader = new Reader();
  const { node, fallback } = findLayerNode(root, layerNames.filter(Boolean));
  let userStyles = ['UserStyle', 'FeatureTypeStyle'].includes(root.localName)
    ? [root] : Array.from(node.getElementsByTagNameNS('*', 'UserStyle'));
  if (userStyles.length === 0) {
    userStyles = Array.from(node.getElementsByTagNameNS('*', 'FeatureTypeStyle'));
  }
  if (userStyles.length === 0) throw new SLDError(SLD_ERROR.NOT_SLD);

  const parsed = userStyles.map((userStyle, index) => reader.userStyle(
    userStyle,
    userStyles.length > 1 ? `${fileName} (${index + 1})` : fileName,
  ));
  const styles = parsed.filter((item) => item.style !== null);
  if (styles.length === 0) {
    const rasterOnly = parsed.some((item) => item.raster);
    throw new SLDError(rasterOnly ? SLD_ERROR.RASTER_ONLY : SLD_ERROR.NO_STYLES);
  }
  return {
    styles: styles.map(({ style, label, isDefault }) => ({ style, label, isDefault })),
    ignored: reader.ignored,
    fallbackLayer: fallback,
  };
};

export default parseSLD;
