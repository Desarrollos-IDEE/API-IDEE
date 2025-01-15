/**
 * @module M/filter
 */
import FilterFunction from './Function';
/**
  * Esta función une los filtros para que se cumplan todos.
  *
  * @function
  * @param {Array<M.Fiter>} filters Filtros para unirse.
  * @return {M.Filter} Filtro.
  * @api
  */
export const AND = (filters) => {
  let cqlFilter = '';
  const numFilters = filters.length;
  filters.forEach((filter, index) => {
    cqlFilter += `(${filter.toCQL()})`;
    if (index < (numFilters - 1)) {
      cqlFilter += ' AND ';
    }
  });
  return new FilterFunction((feature) => {
    return filters.every((filter) => {
      return filter.getFunctionFilter()(feature);
    });
  }, {
    cqlFilter,
  });
};

/**
  * Esta función une los filtros para que al menos uno de los filtros se ejecute.
  *
  * @function
  * @param {Array<M.Fiter>} filters Filtros para unirse.
  * @return {M.Filter} Filtro.
  * @api
  */
export const OR = (filters) => {
  const numFilters = filters.length;
  let cqlFilter = '';
  filters.forEach((filter, index) => {
    cqlFilter += `(${filter.toCQL()})`;
    if (index < (numFilters - 1)) {
      cqlFilter += ' OR ';
    }
  });
  return new FilterFunction((feature) => {
    return filters.some((filter) => {
      return filter.getFunctionFilter()(feature);
    });
  }, {
    cqlFilter,
  });
};

/**
  * Este método ejecuta lo contrario del filtro.
  *
  * @function
  * @param {M.Fiter} filters Filtros para unirse.
  * @return {M.Filter} Filtro opuesto.
  * @api
  */
export const NOT = (filter) => {
  return new FilterFunction((feature) => {
    return !filter.getFunctionFilter()(feature);
  }, {
    cqlFilter: `NOT ${filter.toCQL()}`,
  });
};

/**
  * Esta función compara el valor del atributo indicado con el valor indicado.
  *
  * @function
  * @param {string} nameAtt Nombre del atributo.
  * @param {string|number} value El valor que se compara.
  * @return {M.Filter} Filtro.
  * @api
  */
export const EQUAL = (nameAtt, value) => {
  return new FilterFunction((feature) => {
    return Object.is(feature.getAttribute(nameAtt), value);
  }, {
    cqlFilter: `${nameAtt}='${value}'`,
  });
};

/**
  * Esta función devuelve el valor del atributo indicado de la característica.
  * si cumple la condición de la expresión regular.
  *
  * @function
  * @param {string} nameAtt Nombre del atributo.
  * @param {string|number} value Expresión regular.
  * @return {M.Filter} Filtro.
  * @api
  */
export const LIKE = (nameAtt, value) => {
  return new FilterFunction((feature) => {
    return (feature.getAttribute(nameAtt)).toString().match(new RegExp(value));
  }, {
    cqlFilter: `${nameAtt} LIKE '%${value}%'`,
  });
};

/**
  * Esta función devuelve si el valor del atributo indicado de
  * la característica es menor que el valor indicado.
  * @function
  * @param {string} nameAtt Nombre del atributo.
  * @param {string|number} value Valor.
  * @return {M.Filter} Filtro.
  * @api
  */
export const LT = (nameAtt, value) => {
  return new FilterFunction((feature) => {
    return feature.getAttribute(nameAtt) != null && feature.getAttribute(nameAtt) < value;
  }, {
    cqlFilter: `${nameAtt} < '${value}'`,
  });
};

/**
  * Esta función devuelve si el valor del atributo indicado de la característica
 * es mayor que el valor indicado.
  * @function
  * @param {string} nameAtt Nombre del atributo.
  * @param {string|number} value Valor.
  * @return {M.Filter} Filtro.
  * @api
  */
export const GT = (nameAtt, value) => {
  return new FilterFunction((feature) => {
    return feature.getAttribute(nameAtt) != null && feature.getAttribute(nameAtt) > value;
  }, {
    cqlFilter: `${nameAtt} > '${value}'`,
  });
};

/**
  * Esta función devuelve si el valor del atributo indicado de
  * la característica es menor o igual al valor indicado.
  * @function
  * @param {string} nameAtt Nombre del atributo.
  * @param {string|number} value Valor.
  * @return {M.Filter} Filtro.
  * @api
  */
export const LTE = (nameAtt, value) => {
  return new FilterFunction((feature) => {
    return feature.getAttribute(nameAtt) != null && feature.getAttribute(nameAtt) <= value;
  }, {
    cqlFilter: `${nameAtt} <= '${value}'`,
  });
};

/**
  * Esta función devuelve si el valor del atributo indicado de
  * la característica es mayor o igual al valor indicado.
  * @function
  * @param {string} nameAtt Nombre del atributo.
  * @param {string|number} value Valor.
  * @return {M.Filter} Filtro.
  * @api
  */
export const GTE = (nameAtt, value) => {
  return new FilterFunction((feature) => {
    return feature.getAttribute(nameAtt) != null && feature.getAttribute(nameAtt) >= value;
  }, {
    cqlFilter: `${nameAtt} >= '${value}'`,
  });
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
