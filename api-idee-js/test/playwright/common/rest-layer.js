import { inflate } from 'pako';

const decodeValue = (value) => {
  let text = value;
  if (value.startsWith('base64~')) {
    text = Buffer.from(value.substring('base64~'.length), 'base64').toString('utf8');
  } else if (value.startsWith('deflate~')) {
    text = inflate(Buffer.from(value.substring('deflate~'.length), 'base64'), { to: 'string' });
  } else if (value === 'true' || value === 'false') {
    return value === 'true';
  } else if (value !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  if (/^'.*'$/s.test(text)) {
    return text.slice(1, -1);
  }
  if (/^[[{]/.test(text)) {
    return JSON.parse(text);
  }
  return text;
};

/**
 * Decodifica una cadena REST con parámetros nombrados (Tipo*clave=valor;clave=valor).
 * @param {String} rest Cadena REST.
 * @returns {Object} Tipo y parámetros decodificados.
 */
export const decodeRestLayer = (rest) => {
  const star = rest.indexOf('*');
  const params = rest.substring(star + 1).split(';').map((field) => {
    const separator = field.indexOf('=');
    return [field.substring(0, separator), decodeValue(field.substring(separator + 1))];
  });
  return { type: rest.substring(0, star), ...Object.fromEntries(params) };
};

export default decodeRestLayer;
