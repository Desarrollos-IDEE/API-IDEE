/* eslint-disable import/no-relative-packages */
/**
 * @module IDEE/i18n/plugins
 * @example import pluginsLanguage from 'IDEE/i18n/plugins';
 */

// Backimglayer
import esBackimglayer from '../../../plugins/backimglayer/src/facade/js/i18n/es';
import enBackimglayer from '../../../plugins/backimglayer/src/facade/js/i18n/en';

// Comparators
import esComparators from '../../../plugins/comparators/src/facade/js/i18n/es';
import enComparators from '../../../plugins/comparators/src/facade/js/i18n/en';

// Contactlink
import esContactlink from '../../../plugins/contactlink/src/facade/js/i18n/es';
import enContactlink from '../../../plugins/contactlink/src/facade/js/i18n/en';

// Help
import esHelp from '../../../plugins/help/src/facade/js/i18n/es';
import enHelp from '../../../plugins/help/src/facade/js/i18n/en';

// Incicarto
import esIncicarto from '../../../plugins/incicarto/src/facade/js/i18n/es';
import enIncicarto from '../../../plugins/incicarto/src/facade/js/i18n/en';

// Infocoordinates
import esInfocoordinates from '../../../plugins/infocoordinates/src/facade/js/i18n/es';
import enInfocoordinates from '../../../plugins/infocoordinates/src/facade/js/i18n/en';

// Information
import esInformation from '../../../plugins/information/src/facade/js/i18n/es';
import enInformation from '../../../plugins/information/src/facade/js/i18n/en';

// Layerswitcher
import esLayerswitcher from '../../../plugins/layerswitcher/src/facade/js/i18n/es';
import enLayerswitcher from '../../../plugins/layerswitcher/src/facade/js/i18n/en';

// Measurebar
import esMeasurebar from '../../../plugins/measurebar/src/facade/js/i18n/es';
import enMeasurebar from '../../../plugins/measurebar/src/facade/js/i18n/en';

// Mousesrs
import esMousesrs from '../../../plugins/mousesrs/src/facade/js/i18n/es';
import enMousesrs from '../../../plugins/mousesrs/src/facade/js/i18n/en';

// Overviewmap
import esOverviewmap from '../../../plugins/overviewmap/src/facade/js/i18n/es';
import enOverviewmap from '../../../plugins/overviewmap/src/facade/js/i18n/en';

// Printviewmanagement
import esPrintviewmanagement from '../../../plugins/printviewmanagement/src/facade/js/i18n/es';
import enPrintviewmanagement from '../../../plugins/printviewmanagement/src/facade/js/i18n/en';

// Queryattributes
import esQueryattributes from '../../../plugins/queryattributes/src/facade/js/i18n/es';
import enQueryattributes from '../../../plugins/queryattributes/src/facade/js/i18n/en';

// Querydatabase
// import esQuerydatabase from '../../../plugins/querydatabase/src/facade/js/i18n/es';
// import enQuerydatabase from '../../../plugins/querydatabase/src/facade/js/i18n/en';

// Rescale
import esRescale from '../../../plugins/rescale/src/facade/js/i18n/es';
import enRescale from '../../../plugins/rescale/src/facade/js/i18n/en';

// Selectionzoom
import esSelectionzoom from '../../../plugins/selectionzoom/src/facade/js/i18n/es';
import enSelectionzoom from '../../../plugins/selectionzoom/src/facade/js/i18n/en';

// Sharemap
import esSharemap from '../../../plugins/sharemap/src/facade/js/i18n/es';
import enSharemap from '../../../plugins/sharemap/src/facade/js/i18n/en';

// Sharemap
import esStylemanager from '../../../plugins/stylemanager/src/facade/js/i18n/es';
import enStylemanager from '../../../plugins/stylemanager/src/facade/js/i18n/en';

// Timeline
import esTimeline from '../../../plugins/timeline/src/facade/js/i18n/es';
import enTimeline from '../../../plugins/timeline/src/facade/js/i18n/en';

// Viewmanagement
import esViewmanagement from '../../../plugins/viewmanagement/src/facade/js/i18n/es';
import enViewmanagement from '../../../plugins/viewmanagement/src/facade/js/i18n/en';

// Locator
import esLocator from '../../../plugins/locator/src/facade/js/i18n/es';
import enLocator from '../../../plugins/locator/src/facade/js/i18n/en';

// Locatorscn
import esLocatorscn from '../../../plugins/locatorscn/src/facade/js/i18n/es';
import enLocatorscn from '../../../plugins/locatorscn/src/facade/js/i18n/en';

// Vectorsmanagement
import esVectorsmanagement from '../../../plugins/vectorsmanagement/src/facade/js/i18n/es';
import enVectorsmanagement from '../../../plugins/vectorsmanagement/src/facade/js/i18n/en';

/**
 * Este objeto devuelve un objeto JSON dinámico que contiene
 * los plugins disponibles que soportan traducciones.
 * @public
 * @const
 * @type {object}
 * @api
 */
const pluginsLanguage = {
  backimglayer: {
    esBackimglayer,
    enBackimglayer,
  },
  comparators: {
    esComparators,
    enComparators,
  },
  contactlink: {
    esContactlink,
    enContactlink,
  },
  help: {
    esHelp,
    enHelp,
  },
  incicarto: {
    esIncicarto,
    enIncicarto,
  },
  infocoordinates: {
    esInfocoordinates,
    enInfocoordinates,
  },
  information: {
    esInformation,
    enInformation,
  },
  layerswitcher: {
    esLayerswitcher,
    enLayerswitcher,
  },
  measurebar: {
    esMeasurebar,
    enMeasurebar,
  },
  mousesrs: {
    esMousesrs,
    enMousesrs,
  },
  overviewmap: {
    esOverviewmap,
    enOverviewmap,
  },
  printviewmanagement: {
    esPrintviewmanagement,
    enPrintviewmanagement,
  },
  queryattributes: {
    esQueryattributes,
    enQueryattributes,
  },
  /*
  querydatabase: {
    esQuerydatabase,
    enQuerydatabase,
  },
  */
  rescale: {
    esRescale,
    enRescale,
  },
  selectionzoom: {
    esSelectionzoom,
    enSelectionzoom,
  },
  sharemap: {
    esSharemap,
    enSharemap,
  },
  stylemanager: {
    esStylemanager,
    enStylemanager,
  },
  timeline: {
    esTimeline,
    enTimeline,
  },
  viewmanagement: {
    esViewmanagement,
    enViewmanagement,
  },
  locator: {
    esLocator,
    enLocator,
  },
  locatorscn: {
    esLocatorscn,
    enLocatorscn,
  },
  vectorsmanagement: {
    esVectorsmanagement,
    enVectorsmanagement,
  },
};

export default pluginsLanguage;
