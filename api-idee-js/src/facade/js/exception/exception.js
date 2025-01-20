/**
 * @module M/exception
 * @example
 * import exception from "M/exception";
 */

/**
 * Esta función arroja un mensaje de error (el error
 * que se produzca).
 * @function
 * @public
 * @param {string} msg Mensaje de error.
 * @returns {String} Error.
 * @api
 */
const exception = (msg) => {
  throw msg;
};

export default exception;
