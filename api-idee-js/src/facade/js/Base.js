/**
 * @module IDEE/facade/Base
 */
import { isNullOrEmpty, isFunction } from './util/Utils';
import MObject from './Object';

/**
 * @classdesc
 * Esta clase es la base de las clases de la fachada,
 * proporciona los métodos necesarios para acceder a
 * la implementación.
 *
 * @api
 * @extends {IDEE.facade.Object}
 */
class Base extends MObject {
  /**
   * Constructor principial de la clase.
   *
   * @constructor
   * @param {Object} impl Implementación.
   * @extends {IDEE.Object}
   * @api
   */
  constructor(impl) {
    // calls the super constructor.
    super();

    /**
     * Implementación.
     */
    this.impl_ = impl;

    if (!isNullOrEmpty(this.impl_) && isFunction(this.impl_.setFacadeObj)) {
      this.impl_.setFacadeObj(this);
    }
  }

  /**
   * Este método proporciona la implementación
   * del objeto.
   *
   * @public
   * @function
   * @returns {Object} Implementación.
   * @api
   */
  getImpl() {
    return this.impl_;
  }

  /**
   * Este método establece la implementación de este control.
   *
   * @public
   * @function
   * @param {IDEE.Map} impl Implementación.
   * @api
   */
  setImpl(value) {
    this.impl_ = value;
  }

  /**
   * Este método destruye su implementación.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (!isNullOrEmpty(this.impl_) && isFunction(this.impl_.destroy)) {
      this.impl_.destroy();
    }
  }

  /**
   * Realiza una copia profunda del objeto, incluyendo objetos anidados y funciones.
   *
   * @public
   * @function
   * @returns {*} Una copia profunda de la instancia actual.
   * @api
   */
  clone() {
    const visited = new WeakMap();

    /**
     * Función auxiliar para realizar la copia profunda
     * @param {*} obj - Objeto a copiar
     * @param {number} depth - Profundidad actual (para evitar recursión infinita)
     * @returns {*} Copia profunda del objeto
     */
    const deepClone = (obj, depth = 0) => {
      // Verificar referencias circulares
      if (visited.has(obj)) {
        return visited.get(obj);
      }

      // Evitar recursividad infinita
      if (depth > 10) {
        // console.warn('Clone profundo: profundidad máxima alcanzada');
        return obj;
      }

      if (obj === undefined || obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (obj instanceof Promise) {
        return undefined;
      }

      if (typeof obj === 'function') {
        const clonedFunction = function (...args) {
          return obj.apply(this, args);
        };

        Object.getOwnPropertyNames(obj).forEach((prop) => {
          if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
            try {
              const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
              if (descriptor) {
                Object.defineProperty(clonedFunction, prop, descriptor);
              }
            } catch (e) {
              // do nothing
            }
          }
        });

        return clonedFunction;
      }

      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }

      if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags);
      }

      if (obj instanceof Map) {
        const clonedMap = new Map();
        obj.forEach((value, key) => {
          clonedMap.set(deepClone(key, depth + 1), deepClone(value, depth + 1));
        });
        return clonedMap;
      }

      if (obj instanceof Set) {
        const clonedSet = new Set();
        obj.forEach((value) => {
          clonedSet.add(deepClone(value, depth + 1));
        });
        return clonedSet;
      }

      if (obj instanceof ArrayBuffer) {
        return obj.slice(0);
      }

      if (ArrayBuffer.isView(obj)) {
        return new obj.constructor(obj);
      }

      let cloned;

      if (Array.isArray(obj)) {
        cloned = [];
      } else if (obj.constructor && obj.constructor !== Object) {
        try {
          cloned = Object.create(Object.getPrototypeOf(obj));
        } catch (e) {
          cloned = {};
        }
      } else {
        cloned = {};
      }

      visited.set(obj, cloned);

      const allProps = new Set([
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj),
      ]);

      allProps.forEach((prop) => {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
          if (descriptor) {
            const clonedDescriptor = { ...descriptor };

            if (descriptor.value !== undefined) {
              const clonedValue = deepClone(descriptor.value, depth + 1);
              if (descriptor.value instanceof Promise && clonedValue === undefined) {
                return;
              }
              clonedDescriptor.value = clonedValue;
            }

            if (descriptor.get) {
              clonedDescriptor.get = deepClone(descriptor.get, depth + 1);
            }

            if (descriptor.set) {
              clonedDescriptor.set = deepClone(descriptor.set, depth + 1);
            }

            Object.defineProperty(cloned, prop, clonedDescriptor);
          }
        } catch (e) {
          try {
            const fallbackClonedValue = deepClone(obj[prop], depth + 1);
            if (obj[prop] instanceof Promise && fallbackClonedValue === undefined) {
              return;
            }
            cloned[prop] = fallbackClonedValue;
          } catch (ex) {
            cloned[prop] = obj[prop];
          }
        }
      });

      return cloned;
    };

    const clonedObject = this.constructorParameters
      ? new this.constructor(...Object.values(this.constructorParameters))
      : new this.constructor([]);

    const allProps = new Set([
      ...Object.getOwnPropertyNames(this),
      ...Object.getOwnPropertySymbols(this),
    ]);

    allProps.forEach((prop) => {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(this, prop);
        if (descriptor) {
          const clonedDescriptor = { ...descriptor };

          if (descriptor.value !== undefined) {
            clonedDescriptor.value = deepClone(descriptor.value);
          }

          if (descriptor.get) {
            clonedDescriptor.get = deepClone(descriptor.get);
          }

          if (descriptor.set) {
            clonedDescriptor.set = deepClone(descriptor.set);
          }

          Object.defineProperty(clonedObject, prop, clonedDescriptor);
        }
      } catch (e) {
        try {
          clonedObject[prop] = deepClone(this[prop]);
        } catch (ex) {
          clonedObject[prop] = this[prop];
        }
      }
    });

    /* eslint-disable-next-line no-underscore-dangle */
    if (!isNullOrEmpty(clonedObject.impl_) && isFunction(clonedObject.impl_.setFacadeObj)) {
      /* eslint-disable-next-line no-underscore-dangle */
      clonedObject.impl_.setFacadeObj(clonedObject);
    }

    return clonedObject;
  }
}

export default Base;
