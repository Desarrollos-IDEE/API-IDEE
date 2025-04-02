/**
 * @module IDEE/language
 */
import en from './en';
import es from './es';
import Exception from '../exception/exception';

import pluginsLanguage from './plugins';

/**
 * Opciones de idiomas por defecto, (español, "es.json" o inglés, "en.json").
 * @public
 * @const
 * @type {object}
 * @api
 */
export const configuration = {
  translations: {
    en,
    es,
  },
  lang: 'es',
};

/**
 * Esta función añade un nuevo idioma.
 * @public
 * @function
 * @param {string} lang Idioma.
 * @param {JSON} json Valores, traducción.
 * @api
 */
export const addTranslation = (lang, json) => {
  configuration.translations[lang] = json;
};

/**
 * Esta función te devuelve todas las traducciones disponibles
 * en la API-IDEE.
 *
 * @public
 * @function
 *
 * @param {string} lang Idioma.
 * @return {JSON} JSON con todas las traducciones.
 *
 * @api
 */
export const getTranslation = (lang) => {
  if (lang === 'es') {
    configuration.translations[lang].backimglayer = pluginsLanguage.backimglayer.esBackimglayer;
    configuration.translations[lang].comparators = pluginsLanguage.comparators.esComparators;
    configuration.translations[lang].contactlink = pluginsLanguage.contactlink.esContactlink;
    configuration.translations[lang].help = pluginsLanguage.help.esHelp;
    configuration.translations[lang].incicarto = pluginsLanguage.incicarto.esIncicarto;
    configuration.translations[lang].infocoordinates = pluginsLanguage.infocoordinates
      .esInfocoordinates;
    configuration.translations[lang].information = pluginsLanguage.information.esInformation;
    configuration.translations[lang].layerswitcher = pluginsLanguage.layerswitcher.esLayerswitcher;
    configuration.translations[lang].measurebar = pluginsLanguage.measurebar.esMeasurebar;
    configuration.translations[lang].mousesrs = pluginsLanguage.mousesrs.esMousesrs;
    configuration.translations[lang].printviewmanagement = pluginsLanguage.printviewmanagement
      .esPrintviewmanagement;
    configuration.translations[lang].queryattributes = pluginsLanguage.queryattributes
      .esQueryattributes;
    // configuration.translations[lang].querydatabase = pluginsLanguage
    // .querydatabase.esQuerydatabase;
    configuration.translations[lang].rescale = pluginsLanguage.rescale.esRescale;
    configuration.translations[lang].selectionzoom = pluginsLanguage.selectionzoom.esSelectionzoom;
    configuration.translations[lang].sharemap = pluginsLanguage.sharemap.esSharemap;
    configuration.translations[lang].stylemanager = pluginsLanguage.stylemanager.esStylemanager;
    configuration.translations[lang].timeline = pluginsLanguage.timeline.esTimeline;
    configuration.translations[lang].viewmanagement = pluginsLanguage.viewmanagement
      .esViewmanagement;
    configuration.translations[lang].locator = pluginsLanguage.locator.esLocator;
    configuration.translations[lang].locatorscn = pluginsLanguage.locatorscn.esLocatorscn;
    configuration.translations[lang].vectorsmanagement = pluginsLanguage.vectorsmanagement
      .esVectorsmanagement;
  } else if (lang === 'en') {
    configuration.translations[lang].backimglayer = pluginsLanguage.backimglayer.enBackimglayer;
    configuration.translations[lang].comparators = pluginsLanguage.comparators.enComparators;
    configuration.translations[lang].contactlink = pluginsLanguage.contactlink.enContactlink;
    configuration.translations[lang].help = pluginsLanguage.help.enHelp;
    configuration.translations[lang].incicarto = pluginsLanguage.incicarto.enIncicarto;
    configuration.translations[lang].infocoordinates = pluginsLanguage.infocoordinates
      .enInfocoordinates;
    configuration.translations[lang].information = pluginsLanguage.information.enInformation;
    configuration.translations[lang].layerswitcher = pluginsLanguage.layerswitcher.enLayerswitcher;
    configuration.translations[lang].measurebar = pluginsLanguage.measurebar.enMeasurebar;
    configuration.translations[lang].mousesrs = pluginsLanguage.mousesrs.enMousesrs;
    // configuration.translations[lang].querydatabase = pluginsLanguage
    // .querydatabase.enQuerydatabase;
    configuration.translations[lang].rescale = pluginsLanguage.rescale.enRescale;
    configuration.translations[lang].queryattributes = pluginsLanguage.queryattributes
      .enQueryattributes;
    configuration.translations[lang].selectionzoom = pluginsLanguage.selectionzoom.enSelectionzoom;
    configuration.translations[lang].sharemap = pluginsLanguage.sharemap.enSharemap;
    configuration.translations[lang].stylemanager = pluginsLanguage.stylemanager.enStylemanager;
    configuration.translations[lang].timeline = pluginsLanguage.timeline.enTimeline;
    configuration.translations[lang].viewmanagement = pluginsLanguage.viewmanagement
      .enViewmanagement;
    configuration.translations[lang].locator = pluginsLanguage.locator.enLocator;
    configuration.translations[lang].locatorscn = pluginsLanguage.locatorscn.enLocatorscn;
    configuration.translations[lang].vectorsmanagement = pluginsLanguage.vectorsmanagement
      .enVectorsmanagement;
  }
  return configuration.translations[lang];
};

/**
 * Esta función te devuelve una traducción dependiendo
 * del valor que se le pase por parámetros.
 *
 * @public
 * @function
 *
 * @param {string} key Nombre del control, plugin, ...
 * @param {string} lang Idioma.
 * @return {JSON} JSON con la traducción.
 * @api
 */
export const getValue = (key, lang = configuration.lang) => {
  return getTranslation(lang)[key];
};

/**
 * Esta función modifica el idioma del API-IDEE.
 * @public
 * @function
 * @param {string} lang Idioma.
 * @api
 */
export const setLang = (lang) => {
  if (!Object.keys(configuration.translations).includes(lang)) {
    Exception(getValue('exception').unsupported_lang);
  }
  configuration.lang = lang;
};

/**
 * Esta función devuelve el idioma de la API-IDEE.
 *
 * @function
 * @public
 * @return {String} Devuelve el idioma especificado en el archivo "configuration.lang".
 * @api
 */
export const getLang = () => {
  return configuration.lang;
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
