/**
 * @module IDEE/control/IGNSearchLocatorControl
 */
import IGNSearchLocatorImplControl from 'impl/ignsearchlocatorcontrol';
import template from '../../templates/ignsearchlocator';
import results from '../../templates/results';
import xylocator from '../../templates/xylocator';
import parcela from '../../templates/parcela';
import { getValue } from './i18n/language';
import recentresults from '../../templates/recent-results';

let typingTimer;
/**
 * @classdesc
 * This class creates an input for searching locations on a map.
 * It uses Instituto Geográfico Nacional services Geocoder and Nomenclator
 * to search user's input location and return coordinates on click.
 */
export default class IGNSearchLocatorControl extends IDEE.Control {
  /*
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(
    servicesToSearch,
    /* eslint-disable default-param-last */
    cmcUrl = null,
    dnpppUrl = null,
    cpmrcUrl = null,
    catastroWMS,
    maxResults,
    noProcess,
    countryCode,
    urlCandidates,
    urlFind,
    urlReverse,
    urlPrefix,
    urlAssistant,
    urlDispatcher,
    resultVisibility = true,
    /* eslint-enable default-param-last */
    reverse,
    locationID,
    requestStreet,
    geocoderCoords,
    zoom,
    searchPosition,
    position,
    pointStyle,
    nomenclatorSearchType,
    helpUrl,
    cadastre,
    searchCoordinatesXYZ,
    order,
  ) {
    if (IDEE.utils.isUndefined(IGNSearchLocatorImplControl)
      || (IDEE.utils.isObject(IGNSearchLocatorImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(IGNSearchLocatorImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new IGNSearchLocatorImplControl();
    super(impl, 'IGNSearchLocator');
    // Class properties
    /**
     * This variable indicates which services should be searched
     * (geocoder, nomenclator or both)
     * @private
     * @type {string} - 'g' | 'n' | 'gn'
     */
    this.servicesToSearch = servicesToSearch;

    /**
     * Url for "consulta de municipios para una provincia"
     * @private
     * @type {String}
     */
    // eslint-disable-next-line camelcase
    this.ConsultaMunicipioCodigos_ = cmcUrl;

    /**
     * Url for "consulta de datos no protegidos para un inmueble por su polígono parcela"
     * @private
     * @type {String}
     */
    // eslint-disable-next-line camelcase
    this.DNPPP_url_ = dnpppUrl;

    /**
     * Url for "consulta de coordenadas por Provincia, Municipio y Referencia Catastral"
     * @private
     * @type {String}
     */
    // eslint-disable-next-line camelcase
    this.CPMRC_url_ = cpmrcUrl;

    /**
     * catastroWMS
     * @private
     * @type {string}
     */
    this.catastroWMS = catastroWMS;

    /**
     * Select element for Provincias
     * @private
     * @type {HTMLElement}
     */
    this.selectProvincias = null;

    /**
     * Select element for Municipios
     * @private
     * @type {HTMLElement}
     */
    this.selectMunicipios = null;

    /**
     * Input element for Poligono
     * @private
     * @type {HTMLElement}
     */
    this.inputPoligono = null;

    /**
     * Input element for Parcela
     * @private
     * @type {HTMLElement}
     */
    this.inputParcela = null;

    /**
     * Input element for Parcela
     * @private
     * @type {HTMLElement}
     */
    this.inputRefCatastral = null;
    /**
     * This variable sets the maximun results returned by a service
     * (if both services are searched the maximum results will be twice this number)
     * @private
     * @type {number}
     */
    this.maxResults = maxResults;
    /**
     * This variables indicates which entities shouldn't be searched
     * @private
     * @type {string} - 'municipio' | 'poblacion' | 'toponimo' | 'municipio,poblacion' | etc
     */
    this.noProcess = noProcess;
    /**
     * This variable indicates the country code.
     * @private
     * @type {string} - 'es'
     */
    this.countryCode = countryCode;
    /**
     * This variable indicates Geocoder Candidates service url
     * @private
     * @type {string}
     */
    this.urlCandidates = urlCandidates;
    /**
     * This variable indicates Geocoder Find service url
     * @private
     * @type {string}
     */
    this.urlFind = urlFind;
    /**
     * This variable indicates Geocoder Reverse service url
     * @private
     * @type {string}
     */
    this.urlReverse = urlReverse;
    /**
     * This variable indicates Nomenclator url prefix
     * @private
     * @type {string}
     */
    this.urlPrefix = urlPrefix;
    /**
     * This variable indicates Nomenclator SearchAssistant service url
     * @private
     * @type {string}
     */
    this.urlAssistant = urlAssistant;
    /**
     * This variable indicates Nomenclator Dispatcher service url
     * @private
     * @type {string}
     */
    this.urlDispatcher = urlDispatcher;
    /**
     * This variable indicates whether result geometry should be drawn on map.
     * @private
     * @type {boolean}
     */
    this.resultVisibility_ = resultVisibility;
    /**
     * This variable indicates which entity types should be searched on Nomenclator service.
     * @private
     * @type {Array<string>}
     */
    this.nomenclatorSearchType = nomenclatorSearchType;
    /**
     * Text to search
     * @private
     * @type {string}
     */
    this.searchPosition = searchPosition;
    /**
     * This variable indicates whether reverse geocoder button should be available.
     * @private
     * @type {Boolean}
     */
    this.reverse = reverse;
    /**
     * This variable indicates whether reverse geocoder button is activated.
     * @private
     * @type {Boolean}
     */
    this.reverseActivated = false;
    /**
     * Text to search
     * @private
     * @type {string}
     */
    this.locationID = locationID;
    /**
     * Text to search
     * @private
     * @type {string}
     */
    this.requestStreet = requestStreet;
    /**
     *
     * @private
     * @type {string}
     */
    this.geocoderCoords = geocoderCoords;

    /**
     *
     * @private
     * @type {string}
     */
    this.urlParse = null;

    /**
     * Checks if point drawing tool is active.
     * @private
     * @type {Boolean}
     */
    this.isXYLocatorActive = false;

    /**
     * Zoom
     *
     * @private
     * @type {number}
     */
    this.zoom = zoom;

    /**
     *
     * @private
     * @type {string}
     */
    this.position = position;

    // PARCELA
    /**
     *
     * @private
     * @type {string}
     */
    this.parcela_prov = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.parcela_mun = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.parcela_pol = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.parcela_parc = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xytype = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xydata = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylon = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylat = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylathh = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylatmm = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylatss = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylonhh = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylonmm = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xylonss = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xyutmx = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.xyutmy = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.provincecode = null;

    /**
     *
     * @private
     * @type {string}
     */
    this.municipalityvalue = null;

    /**
     * This variable indicates Nomenclator url prefix
     * @private
     * @type {string}
     */
    this.pointStyle = pointStyle;

    /**
     * Input element for RC
     * @private
     * @type {HTMLElement}
     */
    this.inputRC_ = null;

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl = helpUrl;

    /**
     * @private
     * @type {Boolean}
     */

    this.cadastre = cadastre;

    /**
     * @private
     * @type {Boolean}
     */

    this.searchCoordinatesXYZ = searchCoordinatesXYZ;

    this.order = order;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map = map;
    // eslint-disable-next-line
    console.warn(getValue('exception.ignsearchlocator_obsolete'));
    this.destroyMapLayers();
    return new Promise((success) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            direccion: getValue('direccion'),
            obtener: getValue('obtener'),
            buscparcela: getValue('buscparcela'),
            busccoord: getValue('busccoord'),
            borrarresult: getValue('borrarresult'),
            tooltip_input: getValue('tooltip_input'),
          },
        },
      });
      this.accessibilityTab(html);
      this.html = html;
      this.resultsBox = html.querySelector('#m-ignsearchlocator-results');
      this.searchInput = this.html.querySelector('#m-ignsearchlocator-search-input');
      html.querySelector('#m-ignsearchlocator-clear-button').addEventListener('click', this.clearResultsAndGeometry.bind(this));
      if (this.cadastre === false) {
        html.querySelector('#m-ignsearchlocator-parcela-button').style.display = 'none';
      } else {
        html.querySelector('#m-ignsearchlocator-parcela-button').addEventListener('click', this.openParcela.bind(this));
      }
      if (this.searchCoordinatesXYZ === false) {
        html.querySelector('#m-ignsearchlocator-xylocator-button').style.display = 'none';
      } else {
        html.querySelector('#m-ignsearchlocator-xylocator-button').addEventListener('click', this.openXYLocator.bind(this));
      }
      html.querySelector('#m-ignsearchlocator-search-input').addEventListener('keyup', (e) => this.createTimeout(e));
      html.querySelector('#m-ignsearchlocator-search-input').addEventListener('click', () => {
        if (document.getElementById('m-ignsearchlocator-xylocator-button').style.backgroundColor === 'rgb(113, 167, 211)'
          || document.getElementById('m-ignsearchlocator-parcela-button').style.backgroundColor === 'rgb(113, 167, 211)') {
          // Eliminamos la seleccion del xylocator y parcela
          this.clearResults();
          this.activationManager(false, 'm-ignsearchlocator-xylocator-button');
          this.activationManager(false, 'm-ignsearchlocator-parcela-button');
        }
        if (!document.getElementById('m-ignsearchlocator-search-input').value
          && !document.getElementById('m-ignsearchlocator-recent-results-list')) {
          this.openRecentsResults();
        }
      });
      html.querySelector('#m-ignsearchlocator-search-input').addEventListener('keydown', () => {
        clearTimeout(typingTimer);
      });
      html.querySelector('#m-ignsearchlocator-search-input').addEventListener('keydown', () => {
        clearTimeout(typingTimer);
      });

      html.querySelector('#m-ignsearchlocator-locate-button').addEventListener('click', this.activateDeactivateReverse.bind(this));
      document.querySelector('.ign-searchlocator-panel>.m-panel-btn').addEventListener('click', this.clearResults.bind(this));
      this.clickReverseEvent = this.map.on(IDEE.evt.CLICK, (e) => this.showReversePopUp(e));
      this.changePlaceholder();
      if (!this.reverse) {
        html.querySelector('#m-ignsearchlocator-locate-button').style.display = 'none';
      }

      if (this.position === 'TC') {
        document.querySelector('.ign-searchlocator-panel').style = 'position: relative; left: calc(50vw - 210px);';
      }

      this.on(IDEE.evt.ADDED_TO_MAP, () => {
        if (this.locationID && this.locationID.length > 0) {
          this.point = new IDEE.style.Point({
            radius: 5,
            icon: {
              form: 'none',
              class: 'g-cartografia-pin',
              radius: 12,
              rotation: 0,
              rotate: false,
              offset: [0, -12],
              color: '#f00',
              opacity: 1,
            },
          });
          this.simple = new IDEE.style.Polygon({
            fill: {
              color: 'black',
              opacity: 0,
            },
          });
          this.drawNomenclatorResult(this.locationID, false);
        }
        if (this.requestStreet && this.requestStreet.length > 0) {
          IDEE.proxy(false);
          IDEE.remote.get(this.requestStreet).then((res) => {
            const geoJsonData = res.text.substring(9, res.text.length - 1);
            this.map.removeLayers(this.clickedElementLayer);
            const properties = JSON.parse(geoJsonData);
            const olFeature = this.getImpl().readFromWKT(properties.geom, geoJsonData);
            // Center coordinates
            this.coordinates = `${properties.lat}, ${properties.lng}`;
            // New layer with geometry
            this.clickedElementLayer = new IDEE.layer.GeoJSON({
              name: getValue('searchresult'),
              source: {
                type: 'FeatureCollection',
                features: [],
              },
            }, { displayInLayerSwitcher: false });

            this.clickedElementLayer.displayInLayerSwitcher = false;
            this.createGeometryStyles();
            this.map.addLayers(this.clickedElementLayer);
            const type = olFeature.getGeometry().getType();
            if (type === 'Point') {
              this.clickedElementLayer.setStyle(this.point);
            }

            if (type.indexOf('Polygon') > -1 || type.indexOf('Collection') > -1) {
              this.clickedElementLayer.setStyle(new IDEE.style.Polygon({
                fill: {
                  color: '#3399CC',
                  opacity: 0,
                },
                stroke: {
                  color: '#3399CC',
                  width: 2,
                },
              }));
            }

            // Change zIndex value
            this.clickedElementLayer.setZIndex(999999999999999);
            // Stops showing polygon geometry
            if (!this.resultVisibility_) {
              this.clickedElementLayer.setStyle(this.simple);
            }

            setTimeout(() => {
              this.clickedElementLayer.getImpl().getLayer().getSource().addFeature(olFeature);
              this.zoomInLocation('g', type, this.zoom);
            }, 200);
            // show popup for streets
            if (properties.type === 'callejero' || properties.type === 'portal') {
              const fullAddress = this.createFullAddress(properties);
              const coordinates = [properties.lat, properties.lng];
              const perfectResult = properties.state;
              this.showSearchPopUp(fullAddress, coordinates, perfectResult, { fake: true });
            }
            IDEE.proxy(true);
          }).catch((err) => {
            IDEE.proxy(true);
          });
        }

        if (this.geocoderCoords && this.geocoderCoords.length === 2) {
          this.activateDeactivateReverse();
          // const reprojCoords = this.getImpl()
          // .reproject(this.geocoderCoords, 'EPSG:4326', map.getProjection().code);
          const reprojCoords = this.getImpl().reproject('EPSG:4326', this.geocoderCoords);
          this.showReversePopUp({
            coord: reprojCoords,
            fake: true,
          });
        }
      });
      success(html);
    });
  }

  /**
   * This function openresults
   *
   * @public
   * @function
   * @api
   *
   */
  openRecentsResults() {
    document.getElementById('m-ignsearchlocator-results').style = 'width: 347px';
    const recents = window.localStorage.getItem('recents');
    if (recents && recents.length > 0) {
      const compiledResult = IDEE.template.compileSync(recentresults, {
        vars: {
          places: JSON.parse(recents),
        },
      });
      const elementList = compiledResult.querySelectorAll('li');
      elementList.forEach((listElement) => {
        listElement.addEventListener('click', () => {
          this.goToLocation(listElement, true);
        });
      });
      this.resultsBox.appendChild(compiledResult);
    }
  }

  /**
   * This function remove search layers.
   *
   * @public
   * @function
   * @api
   *
   */
  destroyMapLayers() {
    for (let i = 0; i < this.map.getLayers().length; i += 1) {
      if (this.map.getLayers()[i].name === getValue('searchresult')) {
        this.map.removeLayers(this.map.getLayers()[i]);
        this.map.removePopup();
      }
    }
  }

  /**
   * This function toggles reverse geocoder button activation.
   *
   * @public
   * @function
   * @api
   *
   */
  activateDeactivateReverse() {
    if (!this.reverseActivated) {
      this.invokeEscKey();
      this.reverseActivated = true;
      document.querySelector('#m-ignsearchlocator-locate-button span').style.color = '#71a7d3';
      document.addEventListener('keyup', this.checkEscKey.bind(this));
      document.getElementsByTagName('body')[0].style.cursor = `url(${IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/pushpin.svg'])}) 0 20, auto`;
    } else {
      this.reverseActivated = false;
      document.querySelector('#m-ignsearchlocator-locate-button span').style.color = '#7A7A73';
      document.removeEventListener('keyup', this.checkEscKey);
      document.getElementsByTagName('body')[0].style.cursor = 'auto';
    }
  }

  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.reverseActivated = false;
      document.querySelector('#m-ignsearchlocator-locate-button span').style.color = '#7A7A73';
      document.removeEventListener('keyup', this.checkEscKey);
      document.getElementsByTagName('body')[0].style.cursor = 'auto';
    }
  }

  invokeEscKey() {
    try {
      document.dispatchEvent(new window.KeyboardEvent('keyup', {
        key: 'Escape',
        keyCode: 27,
        code: '',
        which: 69,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
      }));
    } catch (err) {
      /* eslint-disable no-console */
      console.error(err);
    }
  }

  /**
   * This function shows information tooltip on clicked point.
   * @param {Event} e - Event
   */
  showReversePopUp(e) {
    if (this.reverseActivated) {
      // Reproject coordinates to ETRS89 on decimal grades (+ North latitude and East longitude)
      const origin = this.map.getProjection().code;
      const destiny = 'EPSG:4258';
      const etrs89pointCoordinates = this.getImpl()
        .reprojectReverse([e.coord[0], e.coord[1]], origin, destiny);
      const params = `lon=${etrs89pointCoordinates[0]}&lat=${etrs89pointCoordinates[1]}`;
      const urlToGet = `${this.urlReverse}?${params}`;
      const mapCoordinates = e.coord;
      this.geocoderCoords = etrs89pointCoordinates;
      const dataCoordinates = [etrs89pointCoordinates[1], etrs89pointCoordinates[0]];
      let fullAddress = '';
      IDEE.proxy(false);
      IDEE.remote.get(urlToGet).then((res) => {
        if (res.text !== null) {
          const returnData = JSON.parse(res.text);
          fullAddress = this.createFullAddress(returnData);
        } else {
          fullAddress = getValue('exception.exists');
        }
        this.showPopUp(fullAddress, mapCoordinates, dataCoordinates, null, true, e, false);
      });

      IDEE.proxy(true);
    }
  }

  /**
   * This function sets a timeout between keypress and search.
   * @public
   * @function
   * @param {e} event that triggers the method
   * @api
   */
  createTimeout(e) {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => this.searchInputValue(e), 500);
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api
   */
  getActivationButton(html) {
    return html.querySelector('.m-ignsearchlocator button');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof IGNSearchLocatorControl;
  }

  /**
   * This function
   * 1.- Takes user's input
   * 2.- Searches for ocurrences on IGN sources
   * 3.- Returns results as items in a drop-down list (returns address)
   * 4.- Onclick on an item goes to its coordinates
   * @public
   * @function
   * @param {event} e - event that triggers this method
   * @api
   */
  searchInputValue(e, firstResult = false) {
    document.getElementById('m-ignsearchlocator-results').style = 'width: 347px';

    // const { value } = e.target;
    const value = e.target.value.replace(',', ' ');
    this.searchValue = value;
    if (value.length <= 2) {
      this.resultsBox.innerHTML = '';
    } else {
      this.resultsBox.innerHTML = '';
      // Adds animation class during loading
      this.resultsBox.classList.add('g-cartografia-spinner');
      this.resultsBox.style.fontSize = '24px';

      this.nomenclatorCandidates = [];
      this.geocoderCandidates = [];

      // saves on allCandidates search results from Nomenclator (CommunicationPoolservlet)
      this.nomenclatorFinished = false;
      this.candidatesFinished = false;
      this.getNomenclatorData(value, this.nomenclatorCandidates).then(() => {
        // saves on allCandidates search results from CartoCiudad (geocoder)
        this.nomenclatorFinished = true;
        this.showCandidatesResults(firstResult);
      });

      this.getCandidatesData(value, this.geocoderCandidates).then(() => {
        this.candidatesFinished = true;
        this.showCandidatesResults(firstResult);
      });
    }
  }

  showCandidatesResults(firstResult) {
    this.allCandidates = [];
    for (let i = 0; i < this.searchPosition.split(',').length; i += 1) {
      if (this.searchPosition.split(',')[i] === 'nomenclator') {
        for (let j = 0; j < this.nomenclatorCandidates.length; j += 1) {
          this.allCandidates.push(this.nomenclatorCandidates[j]);
        }
      }
      if (this.searchPosition.split(',')[i] === 'geocoder') {
        for (let j = 0; j < this.geocoderCandidates.length; j += 1) {
          this.allCandidates.push(this.geocoderCandidates[j]);
        }
      }
    }

    // Service doesn't find results
    if (this.allCandidates.length === 0 && this.nomenclatorFinished && this.candidatesFinished) {
      // Clears previous search
      this.resultsBox.innerHTML = '';

      // remove animation class and return to normal font size after loading
      this.resultsBox.classList.remove('g-cartografia-spinner');
      this.resultsBox.style.fontSize = '1em';
      const parragraph = document.createElement('p');
      const infoMsg = document.createTextNode(getValue('exception.noresults'));
      parragraph.classList.add('m-ignsearchlocator-noresults');
      parragraph.appendChild(infoMsg);
      this.resultsBox.appendChild(parragraph);
    } else if (this.allCandidates.length > 0) {
      // Clears previous search
      this.resultsBox.innerHTML = '';

      // remove animation class and return to normal font size after loading
      this.resultsBox.classList.remove('g-cartografia-spinner');
      this.resultsBox.style.fontSize = '1em';

      const compiledResult = IDEE.template.compileSync(results, {
        vars: {
          places: this.allCandidates,
        },
      });
      this.accessibilityTab(compiledResult);

      const elementList = compiledResult.querySelectorAll('li');
      elementList.forEach((listElement) => {
        listElement.addEventListener('click', () => {
          this.goToLocation(listElement);
        });
      });
      if (firstResult === true && elementList.length > 0) {
        elementList.item(0).click();
      }

      this.resultsBox.appendChild(compiledResult);
    }
  }

  /**
   * This function removes last search layer and adds new layer with current result (from geocoder)
   * features to map, zooms in result, edits popup information and shows a message saying
   *  if it's a perfect result or an approximation.
   * @public
   * @function
   * @param {Object} geoJsonData - clicked result object
   * @api
   */
  drawGeocoderResult(geoJsonData) {
    this.map.removeLayers(this.clickedElementLayer);
    const urlSinJSON = geoJsonData;
    const json = JSON.parse(urlSinJSON);
    const olFeature = this.getImpl().readFromWKT(json.geom, urlSinJSON);
    const properties = JSON.parse(urlSinJSON);
    // Center coordinates
    this.coordinates = `${properties.lat}, ${properties.lng}`;
    // New layer with geometry
    this.clickedElementLayer = new IDEE.layer.GeoJSON({
      name: getValue('searchresult'),
      source: {
        type: 'FeatureCollection',
        features: [],
      },
    }, { displayInLayerSwitcher: false });

    this.clickedElementLayer.displayInLayerSwitcher = false;
    this.map.addLayers(this.clickedElementLayer);
    const type = olFeature.getGeometry().getType();
    if (type === 'Point') {
      this.clickedElementLayer.setStyle(this.point);
    }

    if (type.indexOf('Polygon') > -1 || type.indexOf('Collection') > -1) {
      this.clickedElementLayer.setStyle(new IDEE.style.Polygon({
        fill: {
          color: '#3399CC',
          opacity: 0,
        },
        stroke: {
          color: '#3399CC',
          width: 2,
        },
      }));
    }

    // Change zIndex value
    this.clickedElementLayer.setZIndex(999999999999999);
    // Stops showing polygon geometry
    if (!this.resultVisibility_) {
      this.clickedElementLayer.setStyle(this.simple);
    }

    setTimeout(() => {
      this.clickedElementLayer.getImpl().getLayer().getSource().addFeature(olFeature);
      this.zoomInLocation('g', type, this.zoom);
    }, 200);
    // show popup for streets
    if (properties.type === 'callejero' || properties.type === 'portal') {
      const fullAddress = this.createFullAddress(properties);
      const coordinates = [properties.lat, properties.lng];
      const perfectResult = properties.state;
      this.showSearchPopUp(fullAddress, coordinates, perfectResult);
    } else if (this.popup !== undefined) {
      this.map.removePopup(this.popup);
    }
  }

  /**
   * This function takes data from an entity and returns the complete address
   * @param {string} jsonResult - json string with entity data
   */
  createFullAddress(jsonResult) {
    const via = (jsonResult.tip_via === null
      || jsonResult.tip_via === undefined) ? '' : jsonResult.tip_via;
    const address = (jsonResult.address === null
      || jsonResult.address === undefined) ? '' : jsonResult.address;
    const portal = (jsonResult.portalNumber === null
      || jsonResult.portalNumber === undefined
      || jsonResult.portalNumber === 0) ? '' : jsonResult.portalNumber;
    const muni = (jsonResult.muni === null
      || jsonResult.muni === undefined) ? '' : jsonResult.muni;
    const province = (jsonResult.province === null
      || jsonResult.province === undefined) ? '' : jsonResult.province;
    return `${via} ${address} ${portal}, ${muni.toUpperCase()}, ${province.toUpperCase()}`;
  }

  /**
   * This function removes last search layer and adds new layer
   * with current result (from nomenclator) features to map and zooms in result.
   * @public
   * @function
   * @param {string} locationId - id of the location object
   * @api
   */
  drawNomenclatorResult(locationId, zoomIn = true) {
    this.requestStreet = '';
    this.requestPlace = IDEE.utils.addParameters(this.urlDispatcher, {
      request: 'OpenQuerySource',
      query: `<ogc:Filter><ogc:FeatureId fid="${locationId}"/></ogc:Filter>`,
      sourcename: `${this.urlPrefix}communicationsPoolServlet/sourceAccessWFS-INSPIRE-NGBE.rdf`,
      outputformat: 'application/json',
    });
    this.locationID = locationId;
    IDEE.remote.get(this.requestPlace).then((res) => {
      const latLngString = JSON.parse(res.text).results[0].location;
      const resultTitle = JSON.parse(res.text).results[0].title;
      const latLngArray = latLngString.split(' ');
      const latitude = parseFloat(latLngArray[0]);
      const longitude = parseFloat(latLngArray[1]);
      this.map.removeLayers(this.clickedElementLayer);
      const newGeojson = {
        name: getValue('searchresult'),
        source: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [
                longitude, latitude,
              ],
            },
            properties: {
              name: resultTitle,
            },
          }],
        },
      };
      this.clickedElementLayer = new IDEE.layer.GeoJSON(
        newGeojson,
        { displayInLayerSwitcher: false },
      );
      this.clickedElementLayer.displayInLayerSwitcher = false;
      this.clickedElementLayer.setStyle(this.point);

      // Change zIndex value
      this.clickedElementLayer.setZIndex(999999999999999);
      // Stops showing polygon geometry
      if (!this.resultVisibility_) {
        this.clickedElementLayer.setStyle(this.simple);
      }
      this.map.addLayers(this.clickedElementLayer);
      if (zoomIn === true) {
        this.zoomInLocation('n', 'Point', this.zoom, [longitude, latitude]);
      }
    });
  }

  /**
   * This function gets user input, searches for coincidences and adds each one to the given array.
   * @public
   * @function
   * @param {string} inputValue search text written by user
   * @param {Array <Object>} resultsArray search result candidates from IGN services
   * @api
   */
  getCandidatesData(inputValue, resultsArray) {
    const newInputVal = window.encodeURIComponent(inputValue);
    return new Promise((resolve) => {
      if (this.servicesToSearch !== 'n') {
        let params = `q=${newInputVal}&limit=${this.maxResults + 5}&no_process=${this.noProcess}`;
        params += `&countrycode=${this.countryCode}&autocancel=true`;
        const urlToGet = `${this.urlCandidates}?${params}`;
        IDEE.proxy(false);
        IDEE.remote.get(urlToGet).then((res) => {
          const returnData = JSON.parse(res.text.substring(9, res.text.length - 1));
          for (let i = 0; i < returnData.length; i += 1) {
            resultsArray.push(returnData[i]);
          }
          resolve();
        });

        IDEE.proxy(true);
      } else {
        resolve();
      }
    });
  }

  /**
   * This function adds search coincidences on Nomenclator to array
   * @public
   * @function
   * @param {string} inputValue location searched by user
   * @param {Array <Object>} resultsArray search results
   * @api
   */
  getNomenclatorData(inputValue, resultsArray) {
    const newInputVal = window.encodeURIComponent(inputValue);
    return new Promise((resolve) => {
      if (this.servicesToSearch !== 'g') {
        const params = `maxresults=${this.maxResults - 5}&name_equals=${newInputVal}`;
        const urlToGet = `${this.urlAssistant}?${params}`;
        IDEE.remote.get(urlToGet).then((res) => {
          const temporalData = (res.text !== '' && res.text !== null) ? JSON.parse(res.text) : { results: [] };
          const returnData = temporalData.results;
          for (let i = 0; i < returnData.length; i += 1) {
            // avoid nameplaces not included in this.nomenclatorSearchType
            if (this.nomenclatorSearchType.indexOf(returnData[i].type) >= 0) {
              resultsArray.push(returnData[i]);
            }
          }
          // move 'Núcleos de población' to start
          for (let i = 0; i < resultsArray.length; i += 1) {
            if (resultsArray[i].type === 'Núcleos de población') {
              const thisElement = resultsArray.splice(i, 1);
              resultsArray.splice(0, 0, thisElement);
            }
          }

          resultsArray.forEach((elem) => {
            // eslint-disable-next-line no-param-reassign
            elem.cps = true;
          });

          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * This function gets address of selected item and returns geojson data (with coordinates)
   * Only for Geocoder service
   * @public
   * @function
   * @param {string} listElement element from drop-down list("li")
   * @param {Array <Object> } elementsData search results
   * @api
   */
  getFindData(listElement, elementsData) {
    return new Promise((resolve) => {
      let id;
      let type;
      let portal;
      let via;
      let address;
      elementsData.forEach((element) => {
        if (listElement.getAttribute('id') === element.id) {
          id = `&id=${element.id}`;
          type = `&type=${element.type}`;
          portal = (element.portalNumber !== 0 && element.portalNumber !== undefined)
            ? `&portal=${element.portalNumber}`
            : '';
          via = element.tip_via !== '' ? `&tip_via=${element.tip_via}` : '';
        }
      });
      address = listElement.innerHTML;
      if (listElement.innerHTML.includes('(')) {
        const parenthesisIndex = listElement.innerHTML.indexOf('(');
        address = listElement.innerHTML.substring(0, parenthesisIndex);
      }
      // const params = `${type}${via}${id}${portal}&outputformat=geojson`;
      const params = `${type}${via}${id}${portal}`;
      const urlToGet = `${this.urlFind}?q=${address}${params}`;
      // this.urlParse = urlToGet.replace('&outputformat=geojson', '');
      this.urlParse = urlToGet;
      this.requestStreet = urlToGet;
      this.locationID = '';
      IDEE.proxy(false);
      IDEE.remote.get(urlToGet).then((res) => {
        const geoJsonData = res.text.substring(9, res.text.length - 1);
        resolve(geoJsonData);
      });
      IDEE.proxy(true);
    });
  }

  /**
   * This function zooms in clicked location and draws geometry
   * @public
   * @function
   * @param {Object} listElement clicked result information
   * @api
   */
  goToLocation(listElement, isRecentElement = false) {
    const text = listElement.querySelector('#info').innerHTML;
    this.html.querySelector('#m-ignsearchlocator-search-input').value = text;
    this.currentElement = listElement; // <li>
    const candidates = isRecentElement ? JSON.parse(window.localStorage.getItem('recents')) : this.allCandidates;
    const selectedObject = this.findClickedItem(listElement, candidates);
    this.createGeometryStyles();
    // if item comes from geocoder
    if (Object.prototype.hasOwnProperty.call(selectedObject, 'address')) {
      this.getFindData(listElement, candidates).then((geoJsonData) => {
        this.drawGeocoderResult(geoJsonData);
        if (geoJsonData.includes('"tip_via":null') && (geoJsonData.includes('"type":"Municipio"') || geoJsonData.includes('"type":"municipio"') || geoJsonData.includes('"type":"Provincia"') || geoJsonData.includes('"type":"provincia"') || geoJsonData.includes('"type":"comunidad autonoma"'))) {
          this.map.removePopup();
        }
      });
    } else { // if item comes from nomenclator
      this.drawNomenclatorResult(selectedObject.id);
    }
    this.resultsBox.innerHTML = '';
  }

  /**
   * This function zooms in MaxExtent of clicked element
   * @public
   * @function
   * @param {string} service { 'g' | 'n' }
   * @param { string } type of geometry in which we zoom
   * @api
   */
  zoomInLocation(service, type, zoom, coords) {
    this.resultsList = document.getElementById('m-ignsearchlocator-results-list');
    if (this.clickedElementLayer instanceof IDEE.layer.Vector) {
      if (service === 'n' && type === 'Point') {
        this.clickedElementLayer.calculateMaxExtent().then((extent) => {
          this.map.setBbox(extent);
          this.map.setZoom(zoom);
          this.fire('ignsearchlocator:entityFound', [extent]);
        });
      } else {
        const extent = this.clickedElementLayer.getImpl().getLayer().getSource().getExtent();
        this.map.setBbox(extent);
        this.fire('ignsearchlocator:entityFound', [extent]);
      }
    }
  }

  /**
   * This function returns clicked location object
   * @public
   * @function
   * @param { string } listElement <li>Location</li>
   * @param { Array < Object > } allCandidates possible locations
   * @api
   */
  findClickedItem(listElement, allCandidates) {
    const elementClicked = allCandidates.filter((element) => element.id === listElement.getAttribute('id'))[0];
    this.setRecents(elementClicked);
    return elementClicked;
  }

  /**
   * This function check duplicates results
   * @public
   * @function
   * @api
   */
  checkDuplicateRecent(element) {
    const recents = JSON.parse(window.localStorage.getItem('recents'));
    let found = false;

    recents.forEach((r) => {
      if (r.id === element.id) {
        found = true;
      }
    });

    return found;
  }

  /**
   * This function set search
   * @public
   * @function
   * @api
   */
  setRecents(element) {
    let recents = JSON.parse(window.localStorage.getItem('recents'));

    if (!recents || recents.length === 0) {
      recents = [element];
    } else if (!this.checkDuplicateRecent(element)) {
      if (recents.length === 5) {
        recents.shift();
        recents.push(element);
      } else {
        recents.push(element);
      }
    }
    window.localStorage.setItem('recents', JSON.stringify(recents));
  }

  /* Given a set of coordinates (lat, long),
    searches for the corresponding place
  */
  searchCoordinates(setOfCoordinates) {
    return new Promise((resolve) => {
      resolve();
    });
  }

  /**
   * This function clears drawn geometry from map.
   * @public
   * @function
   * @api
   */
  clearResults() {
    this.activationManager(false, 'm-ignsearchlocator-xylocator-button');
    this.activationManager(false, 'm-ignsearchlocator-parcela-button');

    this.searchInput.value = '';
    this.resultsBox.innerHTML = '';
    this.searchValue = '';
    this.map.removeLayers(this.coordinatesLayer);
    this.map.removeLayers(this.clickedElementLayer);
    this.map.removePopup(this.map.getPopup());
  }

  /**
   * This function clears input content, results box, popup and shown geometry.
   * @public
   * @function
   * @api
   */
  clearResultsAndGeometry() {
    this.clearResults();
    this.activationManager(false, 'm-ignsearchlocator-xylocator-button');
    this.activationManager(false, 'm-ignsearchlocator-parcela-button');

    if (this.clickedElementLayer !== undefined) {
      this.clickedElementLayer.setStyle(this.simple);
    }
    this.map.removePopup(this.popup, [
      this.lng,
      this.lat,
    ]);

    this.xytype = null;
    this.xydata = null;
    this.xylon = null;
    this.xylat = null;
    this.xylathh = null;
    this.xylatmm = null;
    this.xylatss = null;
    this.xylonhh = null;
    this.xylonmm = null;
    this.xylonss = null;
    this.xyutmx = null;
    this.xyutmy = null;
    this.provincecode = null;
    this.selectMunicipios = null;
    this.inputPoligono = null;
    this.inputParcela = null;
    this.inputRefCatastral = null;
  }

  /**
   * Handler for search with RC button
   *
   * @public
   * @function
   * @api stable
   */
  onRCSearch(evt) {
    evt.preventDefault();
    this.inputRefCatastral = document.querySelector('#m-refCatastral-input');
    this.inputRC_ = this.element_.querySelector('#m-refCatastral-input').value.trim();
    if ((evt.type !== 'keyup') || (evt.keyCode === 13)) {
      let inputRC = this.inputRC_;
      if (IDEE.utils.isNullOrEmpty(inputRC)) {
        IDEE.dialog.info(getValue('RCnull'));
      } else {
        inputRC = inputRC.substr(0, 14);
        const searchUrl = IDEE.utils.addParameters(this.CPMRC_url_, {
          Provincia: '',
          Municipio: '',
          SRS: this.map.getProjection().code,
          RC: inputRC,
        });
        this.search_(searchUrl, this.showResults_);
        this.clearResults();
        this.activationManager(false, 'm-ignsearchlocator-parcela-button');
      }
    }
  }

  /**
   * Handler for search with RC button
   *
   * @public
   * @function
   * @api stable
   */
  onRCConsult(evt) {
    evt.preventDefault();

    // Se cambia al cursor a una cruz.
    document.body.style.cursor = 'crosshair';
    this.clearResults();
    this.activationManager(false, 'm-ignsearchlocator-parcela-button');

    this.map.on(IDEE.evt.CLICK, this.buildUrl_, this);
  }

  /**
   * This function builds the query URL and shows results
   *
   * @private
   * @function
   * @param {ol.MapBrowserPointerEvent} evt - Browser point event
   */
  buildUrl_(evt) {
    const options = {
      jsonp: true,
    };

    const srs = this.map.getProjection().code;
    IDEE.remote.get(this.catastroWMS, {
      SRS: srs,
      Coordenada_X: evt.coord[0],
      Coordenada_Y: evt.coord[1],
    }).then((res) => {
      this.showInfoFromURL_(res, evt.coord);

      // Se desactiva el evento del click una vez haya encontrado una catastro
      this.map.un(IDEE.evt.CLICK, this.buildUrl_, this);
      document.body.style.cursor = '';
    }, options);
  }

  /**
   * This function displays information in a popup
   *
   * @private
   * @function
   * @param {XML} response - response from the petition
   * @param {array} coordinate - Coordinate position onClick
   */
  showInfoFromURL_(response, coordinates) {
    if ((response.code === 200) && (response.error === false)) {
      const infos = [];
      const info = response.text;
      const formatedInfo = this.formatInfo_(info);
      infos.push(formatedInfo);

      const tab = {
        icon: 'g-cartografia-pin',
        title: this.POPUP_TITLE,
        content: infos.join(''),
      };

      let popup = this.map.getPopup();

      if (IDEE.utils.isNullOrEmpty(popup)) {
        popup = new IDEE.Popup();
        popup.addTab(tab);
        this.map.addPopup(popup, coordinates);
      } else if (popup.getCoordinate()[0] === coordinates[0]
        && popup.getCoordinate()[1] === coordinates[1]) {
        let hasExternalContent = false;
        popup.getTabs().forEach((t) => {
          if (t.title !== this.POPUP_TITLE) {
            hasExternalContent = true;
          } else {
            popup.removeTab(t);
          }
        });
        if (hasExternalContent) {
          popup.addTab(tab);
        } else {
          popup = new IDEE.Popup();
          popup.addTab(tab);
          this.map.addPopup(popup, coordinates);
        }
      } else {
        popup = new IDEE.Popup();
        popup.addTab(tab);
        this.map.addPopup(popup, coordinates);
      }
    } else {
      this.map.removePopup();
      IDEE.dialog.error(getValue('errorConexion'));
    }
  }

  /**
   * This function formats the response
   *
   * @param {string} info - Information to formatting
   * @returns {string} information - Formatted information
   * @private
   * @function
   */
  formatInfo_(info) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(info, 'text/xml');
    let ldtNode;
    let valuePopup;
    let codProv;
    let codMun;
    let link = '';

    const rootElement = xmlDoc.getElementsByTagName('consulta_coordenadas')[0];
    const controlNode = rootElement.getElementsByTagName('control')[0];
    const errorCtlNode = controlNode.getElementsByTagName('cuerr')[0].childNodes[0].nodeValue;
    if (errorCtlNode === '1') {
      // const errorNode = rootElement.getElementsByTagName('lerr')[0];
      // const errorDesc = errorNode.getElementsByTagName('err')[0];
      // const errorDescTxt = errorDesc.getElementsByTagName('des')[0].childNodes[0].nodeValue;
      valuePopup = getValue('noInfo');
    } else {
      const coordenadasNode = rootElement.getElementsByTagName('coordenadas')[0];
      const coordNode = coordenadasNode.getElementsByTagName('coord')[0];
      const pcNode = coordNode.getElementsByTagName('pc')[0];
      const pc1Node = pcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
      const pc2Node = pcNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;

      codProv = pc1Node.substring(0, 2);
      codMun = pc1Node.substring(2, 5);

      ldtNode = coordNode.getElementsByTagName('ldt')[0].childNodes[0].nodeValue;
      valuePopup = pc1Node + pc2Node;
      link = `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?del==${codProv}&mun=${codMun}&rc1=${pc1Node}&rc2=${pc2Node}`;
    }

    let formatedInfo = `${IDEE.utils.beautifyAttribute(getValue('informacionCatastral'))}
    <div class='divinfo'>
    <table class='api-idee-table'>
    <tbody>
    <tr><td class='header' colspan='4'></td></tr>
    <tr><td class='key'><b>${IDEE.utils.beautifyAttribute(getValue('reference'))}</b></td><td class='value'></b>
    <a href='${link}' target='_blank'>${valuePopup}</a></td></tr>
    <tr><td class='key'><b>${IDEE.utils.beautifyAttribute(getValue('description'))}</b></td>
    <td class='value'>${ldtNode}</td></tr>
    </tbody></table></div>`;

    if (valuePopup.toLowerCase().indexOf(getValue('noReference')) > -1) {
      formatedInfo = `${IDEE.utils.beautifyAttribute(getValue('informacionCatastral'))}
      <div class='divinfo'>
      <table class='api-idee-table'>
      <tbody>
      <tr><td class='header' colspan='4'></td></tr>
      <tr><td class='key' colspan='4'><b>${valuePopup}</b></td></tr>
      </tbody></table>
      </div>`;
    }

    return formatedInfo;
  }

  /**
   * Does the GET petition to search
   *
   * @private
   * @function
   */
  search_(searchUrl, processor) {
    IDEE.remote.get(searchUrl).then((response) => {
      const success = this.acceptOVCSW(response);
      if (success) {
        processor.call(this, response.xml);
      }
    });
  }

  /**
   * This function parses results and compiles template
   * with vars to show results
   *
   * @private
   * @function
   */
  showResults_(result) {
    let resultsTemplateVars = {};
    resultsTemplateVars = this.parseRCResultsForTemplate_(result, false);
    Promise.resolve(resultsTemplateVars).then((resultTemplate) => {
      this.drawGeocoderResultRC(resultTemplate);
    });
  }

  /**
   * This function parses results from RC search for template
   *
   * @private
   * @function
   */
  parseRCResultsForTemplate_(result, append) {
    const docs = this.parseCPMRCResults(result);
    if (append === true) {
      this.rcResults_.unshift(docs);
    } else {
      this.rcResults_ = [docs];
    }

    return {
      docs: this.rcResults_,
      total: this.rcResults_.length,
      partial: false,
      notResutls: false,
      query: this.inputRC_.value,
    };
  }

  /**
   * This function removes last search layer and adds new layer with current result (from geocoder)
   * features to map, zooms in result, edits popup information and shows a message saying
   *  if it's a perfect result or an approximation.
   * @public
   * @function
   * @param {Object} geoJsonData - clicked result object
   * @api
   */
  drawGeocoderResultRC(geoJsonData) {
    this.map.removeLayers(this.clickedElementLayer); // Center coordinates
    const attri = geoJsonData.docs[0];
    // Center coordinates
    this.coordinates = `${attri.coords[0].xcen}, ${attri.coords[0].ycen}`;
    const coords = [parseFloat(attri.coords[0].xcen), parseFloat(attri.coords[0].ycen)];
    // this.coordinates = [236284.96, 4144064.69];

    this.locator_(coords, this.point);

    // show popup for streets
    const fullAddress = attri.attributes[1].value;
    this.showSearchPopUpRC(fullAddress, coords, 1, { fake: true });

    const x = coords[0];
    const y = coords[1];
    const xFloat = parseFloat(x);
    const yFloat = parseFloat(y);
    this.map.setCenter(`${xFloat},${yFloat}*false`);
  }

  /**
   * This function opens xylocator functions
   * @public
   * @function
   * @api
   */
  openParcela() {
    if (this.resultsBox.innerHTML.includes('coordinatesSystemParcela')) {
      this.clearResults();
      this.activationManager(false, 'm-ignsearchlocator-parcela-button');
    } else {
      this.clearResults();
      if (this.resultsBox.innerHTML.indexOf('coordinatesSystemParcela')) {
        this.activationManager(false, 'm-ignsearchlocator-xylocator-button');
      }
      this.activationManager(true, 'm-ignsearchlocator-parcela-button');

      document.getElementById('m-ignsearchlocator-results').style = 'width: 258px !important; min-width: 258px !important;';

      const compiledXYLocator = IDEE.template.compileSync(parcela, {
        vars: {
          translations: {
            titleparcela: getValue('titleparcela'),
            province: getValue('province'),
            municipality: getValue('municipality'),
            selectmuni: getValue('selectmuni'),
            selectprov: getValue('selectprov'),
            estate: getValue('estate'),
            plot: getValue('plot'),
            titlerefCatastral: getValue('titlerefCatastral'),
            refCastatro: getValue('refCastatro'),
            search: getValue('search'),
            consultReference: getValue('consultReference'),
            notaRef: getValue('notaRef'),
          },
          accessibility: {
            province: getValue('accessibility.province'),
            town: getValue('accessibility.town'),
            estate: getValue('accessibility.estate'),
            plot: getValue('accessibility.plot'),
            cadastre: getValue('accessibility.cadastre'),
            srs: getValue('accessibility.srs'),
          },
        },
      });

      this.accessibilityTab(compiledXYLocator);

      /**
       *crear provincias y rellenar municipios
       */
      if (this.provincecode === null) {
        this.selectProvincias = compiledXYLocator.querySelector('select#m-searchParamsProvincia-select');
        this.selectProvincias.addEventListener('change', (evt) => this.onProvinciaSelect(evt, null));
      } else {
        compiledXYLocator.querySelector('select#m-searchParamsProvincia-select').value = this.provincecode;
        this.selectProvincias = compiledXYLocator.querySelector('select#m-searchParamsProvincia-select');
        this.onProvinciaSelect(null, this.provincecode, this.selectMunicipios);
        this.selectProvincias.addEventListener('change', (evt) => this.onProvinciaSelect(evt, null, null));
      }

      if (this.selectMunicipios === null) {
        this.selectMunicipios = compiledXYLocator.querySelector('#m-searchParamsMunicipio-select');
      } else {
        // compiledXYLocator.querySelector('#m-searchParamsMunicipio-select')
        // .replace(this.municipalityhtml);
        compiledXYLocator.querySelector('#m-searchParamsMunicipio-select').value = this.selectMunicipios.value;
      }

      if (this.inputPoligono === null) {
        this.inputPoligono = compiledXYLocator.querySelector('#m-searchParamsPoligono-input');
      } else {
        compiledXYLocator.querySelector('#m-searchParamsPoligono-input').value = this.inputPoligono.value;
      }

      if (this.inputParcela === null) {
        this.inputParcela = compiledXYLocator.querySelector('#m-searchParamsParcela-input');
      } else {
        compiledXYLocator.querySelector('#m-searchParamsParcela-input').value = this.inputParcela.value;
      }

      if (this.inputRefCatastral === null) {
        this.inputRefCatastral = compiledXYLocator.querySelector('#m-refCatastral-input');
      } else {
        compiledXYLocator.querySelector('#m-refCatastral-input').value = this.inputRefCatastral.value;
      }

      const buttonParamsSearch = compiledXYLocator.querySelector('button#m-searchParams-button');
      buttonParamsSearch.addEventListener('click', (e) => this.onParamsSearch(e));

      const buttonParamsSearchRC = compiledXYLocator.querySelector('button#m-refCatastral-button');
      buttonParamsSearchRC.addEventListener('click', this.onRCSearch.bind(this));

      const buttonParamsConsultRef = compiledXYLocator.querySelector('button#m-consulRef-button');
      buttonParamsConsultRef.addEventListener('click', this.onRCConsult.bind(this));
      this.resultsBox.appendChild(compiledXYLocator);

      if (IDEE.language.getLang() === 'es') {
        document.querySelectorAll('p.parcela--input')[0].style = 'width: 71px';
        document.querySelectorAll('p.parcela--input')[1].style = 'width: 71px';

        document.querySelector('#m-searchParamsProvincia-select').style = 'width: 68%';
        document.querySelector('#m-searchParamsMunicipio-select').style = 'width: 68%';
      }
    }
  }

  /**
   * Handler for search with params button
   *
   * @public
   * @function
   * @api stable
   */
  onParamsSearch(evt) {
    evt.preventDefault();
    // Actualizamos los inputs de parcela y poligino
    this.inputPoligono = document.querySelector('#m-searchParamsPoligono-input');
    this.inputParcela = document.querySelector('#m-searchParamsParcela-input');

    if ((evt.type !== 'keyup') || (evt.keyCode === 13)) {
      if (IDEE.utils.isNullOrEmpty(this.selectProvincias.value) || this.selectProvincias.value === '0') {
        IDEE.dialog.info(getValue('debeprov'));
        return;
      }
      if (IDEE.utils.isNullOrEmpty(this.selectMunicipios.value) || document.querySelector('#m-searchParamsMunicipio-select').value === '0') {
        IDEE.dialog.info(getValue('debemuni'));
        return;
      }
      if (IDEE.utils.isNullOrEmpty(this.inputPoligono.value)) {
        IDEE.dialog.info(getValue('debepoli'));
        return;
      }
      if (IDEE.utils.isNullOrEmpty(this.inputParcela.value)) {
        IDEE.dialog.info(getValue('debeparce'));
        return;
      }

      this.provincecode = this.selectProvincias.value;
      this.selectMunicipios = document.querySelector('#m-searchParamsMunicipio-select');
      this.municipalityvalue = this.selectMunicipios.value;

      const searchUrl = IDEE.utils.addParameters(this.DNPPP_url_, {
        CodigoProvincia: this.selectProvincias.value,
        CodigoMunicipio: this.selectMunicipios.value,
        CodigoMunicipioINE: '',
        Poligono: this.inputPoligono.value,
        Parcela: this.inputParcela.value,
      });

      IDEE.remote.get(searchUrl).then((response) => {
        const success = this.acceptOVCSW(response);
        if (success) {
          this.parseParamsResultsForTemplate_(response.xml);
        }

        this.clearResults();
        this.activationManager(false, 'm-ignsearchlocator-parcela-button');
      });
    }
  }

  parseParamsResultsForTemplate_(response) {
    const rootElement = response.getElementsByTagName('consulta_dnp')[0];
    let rcNode;
    const lrcdnpNode = rootElement.getElementsByTagName('lrcdnp');

    if (lrcdnpNode.length > 0) {
      const rcdnpNode = lrcdnpNode[0].getElementsByTagName('rcdnp')[0];
      rcNode = rcdnpNode.getElementsByTagName('rc')[0];
    } else {
      const bicoNode = rootElement.getElementsByTagName('bico')[0];
      const biNode = bicoNode.getElementsByTagName('bi')[0];
      const idbiNode = biNode.getElementsByTagName('idbi')[0];
      rcNode = idbiNode.getElementsByTagName('rc')[0];
    }
    const pc1Value = rcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
    const pc2Value = rcNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;

    const searchUrl = IDEE.utils.addParameters(this.CPMRC_url_, {
      Provincia: '',
      Municipio: '',
      SRS: this.map.getProjection().code,
      RC: pc1Value + pc2Value,
    });

    return IDEE.remote.get(searchUrl).then((res) => {
      const success = this.acceptOVCSW(res);
      if (success) {
        const docsRC = this.parseCPMRCResults(res.xml);
        const xcen = docsRC.coords[0].xcen;
        const ycen = docsRC.coords[0].ycen;

        this.locator_([xcen, ycen], null);
      }
    });
  }

  /**
   * Parses CPMRC results
   *
   * @private
   * @function
   */
  parseCPMRCResults(xmlResults) {
    const rootElement = xmlResults.getElementsByTagName('consulta_coordenadas')[0];
    const coordenadasNode = rootElement.getElementsByTagName('coordenadas')[0];
    const coordNode = coordenadasNode.getElementsByTagName('coord')[0];

    const pcNode = coordNode.getElementsByTagName('pc')[0];
    const pc1Node = pcNode.getElementsByTagName('pc1')[0].childNodes[0].nodeValue;
    const pc2Node = pcNode.getElementsByTagName('pc2')[0].childNodes[0].nodeValue;

    const geoNode = coordNode.getElementsByTagName('geo')[0];
    const xcenNode = geoNode.getElementsByTagName('xcen')[0].childNodes[0].nodeValue;
    const ycenNode = geoNode.getElementsByTagName('ycen')[0].childNodes[0].nodeValue;
    const srsNode = geoNode.getElementsByTagName('srs')[0].childNodes[0].nodeValue;

    const ldtNode = coordNode.getElementsByTagName('ldt')[0].childNodes[0].nodeValue;

    return {
      attributes: [{
        key: 'Referencia Catastral',
        value: pc1Node + pc2Node,
      }, {
        key: 'Descripción',
        value: ldtNode,
      }],
      rcId: `rc_${pc1Node}${pc2Node}`,
      coords: [{
        xcen: xcenNode,
        ycen: ycenNode,
        srs: srsNode,
      }],
    };
  }

  /**
   * Checks if response is valid
   *
   * @private
   * @function
   */
  acceptOVCSW(response) {
    let success = true;
    try {
      if ((response.code === 200) && (response.error === false)) {
        const results2 = response.xml;
        const rootElement = results2.childNodes[0];
        const controlNode = rootElement.getElementsByTagName('control')[0];
        const errorCtlNode = controlNode.getElementsByTagName('cuerr')[0];
        let cuerr = '0';
        if (errorCtlNode !== undefined) {
          cuerr = errorCtlNode.childNodes[0].nodeValue;
        }
        if (cuerr === '1') {
          const errorNode = rootElement.getElementsByTagName('lerr')[0];
          const errorDesc = errorNode.getElementsByTagName('err')[0];
          const errorDescTxt = errorDesc.getElementsByTagName('des')[0].childNodes[0].nodeValue;
          this.element_.classList.remove(this.SEARCHING_CLASS);
          success = false;
          IDEE.dialog.info(errorDescTxt);
        }
      } else {
        success = false;
        IDEE.dialog.error(getValue('exception.apiideerror'));
      }
    } catch (err) {
      success = false;
      IDEE.exception(`La respuesta no es un JSON válido: ${err}.`);
    }
    return success;
  }

  /**
   * Handler for selecting an option on Provincia select
   *
   * @public
   * @function
   * @api stable
   */
  onProvinciaSelect(e, idprov, munici) {
    // En cada click a las provincias, se borran los municipios y se calculan de nuevo.
    let provinceCode = null;
    if (e != null) {
      const elt = e.target;
      provinceCode = elt.value;
    } else {
      provinceCode = idprov;
    }
    if (provinceCode !== '0') {
      if (this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'] !== undefined) {
        this.clearMunicipiosSelect();
      }

      IDEE.remote.get(this.ConsultaMunicipioCodigos_, {
        CodigoProvincia: provinceCode,
        CodigoMunicipio: '',
        CodigoMunicipioIne: '',
      }).then((res) => {
        this.loadMunicipiosSelect(res, munici);
      });
    } else {
      this.clearMunicipiosSelect();
    }
  }

  /**
   * Loads and renders options set to Municipios select
   *
   * @public
   * @function
   * @api stable
   */
  loadMunicipiosSelect(response, munici) {
    if ((response.code === 200) && (response.error === false)) {
      const rootElement = response.xml.getElementsByTagName('consulta_municipiero')[0];
      const rootMunicipios = rootElement.getElementsByTagName('municipiero')[0];
      const muniNodes = rootMunicipios.getElementsByTagName('muni');
      const select = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
      for (let i = 0; i < muniNodes.length; i += 1) {
        const option = document.createElement('option');
        const locat = muniNodes[i].getElementsByTagName('locat')[0];
        option.value = locat.getElementsByTagName('cmc')[0].childNodes[0].nodeValue;
        option.innerHTML = muniNodes[i].getElementsByTagName('nm')[0].childNodes[0].nodeValue;
        select.appendChild(option);
      }
      if (munici !== undefined && munici !== null) {
        document.querySelector('#m-searchParamsMunicipio-select').value = this.municipalityvalue;
      }
    } else {
      IDEE.dialog.error(getValue('exception.apiideerror'));
    }
  }

  /**
   * Clears options set to Municipios select
   *
   * @public
   * @function
   * @api stable
   */
  clearMunicipiosSelect() {
    const select = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
    const option = document.createElement('option');
    option.value = '0';
    option.innerHTML = getValue('selectmuni');
    select.appendChild(option);
  }

  /**
   * This function opens xylocator functions
   * @public
   * @function
   * @api
   */
  openXYLocator() {
    if (this.resultsBox.innerHTML.includes('coordinatesSystemXYLocator')) {
      this.clearResults();
      this.activationManager(false, 'm-ignsearchlocator-xylocator-button');
    } else {
      this.clearResults();
      if (this.resultsBox.innerHTML.indexOf('coordinatesSystemParcela')) {
        this.activationManager(false, 'm-ignsearchlocator-parcela-button');
      }
      this.activationManager(true, 'm-ignsearchlocator-xylocator-button');

      document.getElementById('m-ignsearchlocator-results').style = 'width: 301px;';

      const compiledXYLocator = IDEE.template.compileSync(xylocator, {
        vars: {
          hasHelp: this.helpUrl !== undefined && IDEE.utils.isUrl(this.helpUrl),
          helpUrl: this.helpUrl,
          translations: {
            title: getValue('title'),
            srs: getValue('srs'),
            longitude: getValue('longitude'),
            latitude: getValue('latitude'),
            locate: getValue('locate'),
            negative: getValue('negative'),
            east: getValue('east'),
            west: getValue('west'),
            north: getValue('north'),
            south: getValue('south'),
            geographic: getValue('geographic'),
            zone: getValue('zone'),
            dms: getValue('dms'),
            dd: getValue('dd'),
          },
        },
      });

      this.accessibilityTab(compiledXYLocator);

      if (this.xytype != null) {
        if (this.xytype === 'EPSG:4258d' && this.xydata === 'd') {
          compiledXYLocator.querySelector('#m-xylocator-srs').value = this.xytype;
          const selectTarget = compiledXYLocator.querySelector('#m-xylocator-srs');
          const selectedOption = selectTarget.options[selectTarget.selectedIndex];
          selectedOption.setAttribute('data-units', this.xydata);
          compiledXYLocator.querySelector('input#LON').value = this.xylon;
          compiledXYLocator.querySelector('input#LAT').value = this.xylat;
        } else if (this.xytype === 'EPSG:4326d' && this.xydata === 'd') {
          compiledXYLocator.querySelector('#m-xylocator-srs').value = this.xytype;
          const selectTarget = compiledXYLocator.querySelector('#m-xylocator-srs');
          const selectedOption = selectTarget.options[selectTarget.selectedIndex];
          selectedOption.setAttribute('data-units', this.xydata);
          compiledXYLocator.querySelector('input#LON').value = this.xylon;
          compiledXYLocator.querySelector('input#LAT').value = this.xylat;
        } else if (this.xytype === 'EPSG:4258dms' && this.xydata === 'dms') {
          compiledXYLocator.querySelector('#m-xylocator-srs').value = this.xytype;
          const selectTarget = compiledXYLocator.querySelector('#m-xylocator-srs');
          const selectedOption = selectTarget.options[selectTarget.selectedIndex];
          selectedOption.setAttribute('data-units', this.xydata);
          compiledXYLocator.querySelector('input#LONHH').value = this.xylonhh;
          compiledXYLocator.querySelector('input#LONMM').value = this.xylonmm;
          compiledXYLocator.querySelector('input#LONSS').value = this.xylonss;
          compiledXYLocator.querySelector('input#LATHH').value = this.xylathh;
          compiledXYLocator.querySelector('input#LATMM').value = this.xylatmm;
          compiledXYLocator.querySelector('input#LATSS').value = this.xylatss;
        } else if (this.xytype === 'EPSG:4326dms' && this.xydata === 'dms') {
          compiledXYLocator.querySelector('#m-xylocator-srs').value = this.xytype;
          const selectTarget = compiledXYLocator.querySelector('#m-xylocator-srs');
          const selectedOption = selectTarget.options[selectTarget.selectedIndex];
          selectedOption.setAttribute('data-units', this.xydata);
          compiledXYLocator.querySelector('input#LONHH').value = this.xylonhh;
          compiledXYLocator.querySelector('input#LONMM').value = this.xylonmm;
          compiledXYLocator.querySelector('input#LONSS').value = this.xylonss;
          compiledXYLocator.querySelector('input#LATHH').value = this.xylathh;
          compiledXYLocator.querySelector('input#LATMM').value = this.xylatmm;
          compiledXYLocator.querySelector('input#LATSS').value = this.xylatss;
        } else {
          compiledXYLocator.querySelector('#m-xylocator-srs').value = this.xytype;
          const selectTarget = compiledXYLocator.querySelector('#m-xylocator-srs');
          const selectedOption = selectTarget.options[selectTarget.selectedIndex];
          selectedOption.setAttribute('data-units', this.xydata);
          compiledXYLocator.querySelector('input#UTM-X').value = this.xyutmx;
          compiledXYLocator.querySelector('input#UTM-Y').value = this.xyutmy;
        }

        if (this.xydata === 'd') {
          const divToHidden1 = compiledXYLocator.querySelector('div#m-xylocator-utm');
          divToHidden1.style.display = 'none';
          const divToHidden2 = compiledXYLocator.querySelector('div#m-xylocator-dms');
          divToHidden2.style.display = 'none';
          const divToShow = compiledXYLocator.querySelector('div#m-xylocator-latlon');
          divToShow.style.display = 'table';
        } else if (this.xydata === 'dms') {
          const divToHidden1 = compiledXYLocator.querySelector('div#m-xylocator-utm');
          divToHidden1.style.display = 'none';
          const divToHidden2 = compiledXYLocator.querySelector('div#m-xylocator-latlon');
          divToHidden2.style.display = 'none';
          const divToShow = compiledXYLocator.querySelector('div#m-xylocator-dms');
          divToShow.style.display = 'block';
        } else {
          const divToHidden1 = compiledXYLocator.querySelector('div#m-xylocator-latlon');
          divToHidden1.style.display = 'none';
          const divToHidden2 = compiledXYLocator.querySelector('div#m-xylocator-dms');
          divToHidden2.style.display = 'none';
          const divToShow = compiledXYLocator.querySelector('div#m-xylocator-utm');
          divToShow.style.display = 'block';
        }
      }
      compiledXYLocator.querySelector('select#m-xylocator-srs').addEventListener('change', (evt) => this.manageInputs_(evt));
      compiledXYLocator.querySelector('button#m-xylocator-loc').addEventListener('click', (evt) => this.calculate_(evt, compiledXYLocator));
      this.resultsBox.appendChild(compiledXYLocator);
    }
  }

  /**
   * Hides/shows tools menu and de/activates drawing.
   * @public
   * @function
   * @api
   * @param {Boolean} clickedGeometry - i.e.isPointActive
   * @param {String} drawingDiv - i.e.pointdrawing
   */
  activationManager(clickedGeometry, drawingDiv) {
    // if drawing is active
    if (clickedGeometry) {
      document.getElementById(drawingDiv).style.backgroundColor = '#71a7d3';
      document.getElementById(drawingDiv).style.color = 'white';
    } else {
      document.querySelectorAll(drawingDiv).forEach((e) => e.parentNode.removeChild(e));
      document.getElementById(drawingDiv).style.backgroundColor = 'white';
      document.getElementById(drawingDiv).style.color = '#7A7A73';
    }
  }

  /**
   * This function transforms coordinates to map SRS
   *
   * @public
   * @function
   * @param {DOMEvent} evt - event
   * @api
   */
  calculate_(evt, compiledXYLocator) {
    try {
      const selectTarget = document.querySelector('.m-xylocator-container select#m-xylocator-srs');
      const selectedOption = selectTarget.options[selectTarget.selectedIndex];
      let origin = selectedOption.value;

      this.xytype = compiledXYLocator.querySelector('#m-xylocator-srs').value;
      this.xydata = selectedOption.getAttribute('data-units');

      if (this.xydata === 'd') {
        origin = origin.replace('d', '');
      }
      if (this.xydata === 'dms') {
        origin = origin.replace('dms', '');
      }

      if (this.xytype === 'EPSG:4258d' && this.xydata === 'd') {
        this.xylon = compiledXYLocator.querySelector('input#LON').value;
        this.xylat = compiledXYLocator.querySelector('input#LAT').value;
      } else if (this.xytype === 'EPSG:4326d' && this.xydata === 'd') {
        this.xylon = compiledXYLocator.querySelector('input#LON').value;
        this.xylat = compiledXYLocator.querySelector('input#LAT').value;
      } else if (this.xytype === 'EPSG:4258dms' && this.xydata === 'dms') {
        this.xylonhh = compiledXYLocator.querySelector('input#LONHH').value;
        this.xylonmm = compiledXYLocator.querySelector('input#LONMM').value;
        this.xylonss = compiledXYLocator.querySelector('input#LONSS').value;
        this.xylathh = compiledXYLocator.querySelector('input#LATHH').value;
        this.xylatmm = compiledXYLocator.querySelector('input#LATMM').value;
        this.xylatss = compiledXYLocator.querySelector('input#LATSS').value;
      } else if (this.xytype === 'EPSG:4326dms' && this.xydata === 'dms') {
        this.xylonhh = compiledXYLocator.querySelector('input#LONHH').value;
        this.xylonmm = compiledXYLocator.querySelector('input#LONMM').value;
        this.xylonss = compiledXYLocator.querySelector('input#LONSS').value;
        this.xylathh = compiledXYLocator.querySelector('input#LATHH').value;
        this.xylatmm = compiledXYLocator.querySelector('input#LATMM').value;
        this.xylatss = compiledXYLocator.querySelector('input#LATSS').value;
      } else {
        this.xyutmx = compiledXYLocator.querySelector('input#UTM-X').value;
        this.xyutmy = compiledXYLocator.querySelector('input#UTM-Y').value;
      }

      let x = -1;
      let y = -1;
      if (selectedOption.getAttribute('data-units') === 'd') {
        const xString = document.querySelector('div#m-xylocator-latlon input#LON').value.replace(',', '.');
        const yString = document.querySelector('div#m-xylocator-latlon input#LAT').value.replace(',', '.');
        x = parseFloat(xString);
        y = parseFloat(yString);
        const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
        this.locator_(coordinatesTransform, null);
      } else if (selectedOption.getAttribute('data-units') === 'dms') {
        const hhLon = document.querySelector('div#m-xylocator-dms input#LONHH').value;
        const mmLon = document.querySelector('div#m-xylocator-dms input#LONMM').value;
        const ssLon = document.querySelector('div#m-xylocator-dms input#LONSS').value;
        const dirLon = document.querySelector('div#m-xylocator-dms input[name="LONDIR"]:checked').value;
        const hhLat = document.querySelector('div#m-xylocator-dms input#LATHH').value;
        const mmLat = document.querySelector('div#m-xylocator-dms input#LATMM').value;
        const ssLat = document.querySelector('div#m-xylocator-dms input#LATSS').value;
        const dirLat = document.querySelector('div#m-xylocator-dms input[name="LATDIR"]:checked').value;
        if (this.checkDegreeValue_(mmLon) && this.checkDegreeValue_(ssLon)
          && this.checkDegreeValue_(mmLat) && this.checkDegreeValue_(ssLat)
          && parseFloat(hhLon) >= 0 && parseFloat(hhLon) <= 180
          && parseFloat(hhLat) >= 0 && parseFloat(hhLat) <= 180) {
          try {
            x = parseFloat(hhLon) + (parseFloat(mmLon) / 60) + (parseFloat(ssLon) / 3600);
            y = parseFloat(hhLat) + (parseFloat(mmLat) / 60) + (parseFloat(ssLat) / 3600);
            if (dirLon !== 'east' && x !== 0) {
              x = -x;
            }
            if (dirLat !== 'north' && y !== 0) {
              y = -y;
            }
            const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
            this.locator_(coordinatesTransform, null);
          } catch (ex) {
            IDEE.dialog.error(getValue('exception.transforming'), 'Error');
          }
        } else {
          IDEE.dialog.error(getValue('exception.wrong_values'), 'Error');
        }
      } else {
        try {
          const xString = document.querySelector('div#m-xylocator-utm input#UTM-X').value.replace(',', '.');
          const yString = document.querySelector('div#m-xylocator-utm input#UTM-Y').value.replace(',', '.');
          x = parseFloat(xString);
          y = parseFloat(yString);
          const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
          this.locator_(coordinatesTransform, null);
        } catch (ex) {
          IDEE.dialog.error(getValue('exception.transforming'), 'Error');
        }
      }

      this.clearResults();
      this.activationManager(false, 'm-ignsearchlocator-xylocator-button');

      const coordinatesTransform = this.getImpl().reprojectXY(origin, [x, y]);
      this.locator_(coordinatesTransform, null);
    } catch (ex) {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
      throw ex;
    }
  }

  /**
   * This function checks degree value
   *
   * @public
   * @function
   * @param {String} num
   * @api
   */
  checkDegreeValue_(num) {
    return parseFloat(num) >= 0 && parseFloat(num) < 60;
  }

  /**
   * This function changes input label depending on SRS
   *
   * @private
   * @function
   * @param {DOMEvent} evt - event
   */
  manageInputs_(evt) {
    const selectTarget = evt.target;
    const selectedOption = selectTarget.options[selectTarget.selectedIndex];
    if (selectedOption.getAttribute('data-units') === 'd') {
      const divToHidden1 = document.querySelector('div#m-xylocator-utm');
      divToHidden1.style.display = 'none';
      const divToHidden2 = document.querySelector('div#m-xylocator-dms');
      divToHidden2.style.display = 'none';
      const divToShow = document.querySelector('div#m-xylocator-latlon');
      divToShow.style.display = 'table';
    } else if (selectedOption.getAttribute('data-units') === 'dms') {
      const divToHidden1 = document.querySelector('div#m-xylocator-utm');
      divToHidden1.style.display = 'none';
      const divToHidden2 = document.querySelector('div#m-xylocator-latlon');
      divToHidden2.style.display = 'none';
      const divToShow = document.querySelector('div#m-xylocator-dms');
      divToShow.style.display = 'block';
    } else {
      const divToHidden1 = document.querySelector('div#m-xylocator-latlon');
      divToHidden1.style.display = 'none';
      const divToHidden2 = document.querySelector('div#m-xylocator-dms');
      divToHidden2.style.display = 'none';
      const divToShow = document.querySelector('div#m-xylocator-utm');
      divToShow.style.display = 'block';
    }
  }

  /**
   * This function centers the map on given point
   *
   * @public
   * @function
   * @param coords - coordinates writen by user
   * @api
   */
  locator_(coords, point) {
    const x = coords[0];
    const y = coords[1];
    const xFloat = parseFloat(x);
    const yFloat = parseFloat(y);
    this.map.removeLayers(this.coordinatesLayer);
    if (!Number.isNaN(xFloat) && !Number.isNaN(yFloat)) {
      this.map.setCenter(`${xFloat},${yFloat}*false`);
      this.map.setZoom(this.zoom);
      this.fire('xylocator:locationCentered', [{
        zoom: this.zoom,
        center: [xFloat, yFloat],
      }]);

      this.coordinatesLayer = new IDEE.layer.Vector({
        name: getValue('coordinateresult'),
      }, { displayInLayerSwitcher: false });

      const feature = new IDEE.Feature('localizacion', {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [xFloat, yFloat],
        },
      });

      this.coordinatesLayer.addFeatures([feature]);

      if (point === null) {
        this.coordinatesLayer.setStyle(new IDEE.style.Point({
          radius: 8,
          fill: {
            color: '#f00',
            opacity: 0.5,
          },
          stroke: {
            color: '#f00',
            opacity: 1,
            width: 3,
          },
        }));
      } else {
        this.createGeometryStyles();
        this.coordinatesLayer.setStyle(this.point);
      }

      this.createGeometryStyles();
      this.coordinatesLayer.setStyle(this.point);

      // Change zIndex value
      this.coordinatesLayer.setZIndex(999999999999999);

      this.map.addLayers(this.coordinatesLayer);
    } else {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
    }
  }

  /**
   * This function sets geometry visibility on map (visible|invisible).
   * @public
   * @function
   * @param {boolean} flag
   * @api
   */
  setResultVisibility(flag) {
    this.resultVisibility_ = flag;
  }

  /**
   * This function changes input placeholder based on services choice
   * @public
   * @function
   * @api
   */
  changePlaceholder() {
    if (this.servicesToSearch === 'g') {
      this.searchInput.placeholder = getValue('direccion');
    } else if (this.servicesToSearch === 'n') {
      this.searchInput.placeholder = 'Topónimo';
    }
  }

  /**
   * This function creates some geometry styles.
   * @public
   * @function
   * @api
   */
  createGeometryStyles() {
    // Shows pin on drawn point
    if (this.pointStyle === 'pinBlanco') {
      this.point = new IDEE.style.Point({
        radius: 5,
        icon: {
          src: IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/marker.svg']),
          scale: 1.4,
          fill: {
            color: '#71a7d3',
          },
          stroke: {
            width: 30,
            color: 'white',
          },
          anchor: [0.5, 1],
        },
      });
    } else if (this.pointStyle === 'pinRojo') {
      this.point = new IDEE.style.Point({
        radius: 5,
        icon: {
          src: IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/pinign.svg']),
        },
      });
    } else if (this.pointStyle === 'pinMorado') {
      this.point = new IDEE.style.Point({
        radius: 5,
        icon: {
          src: IDEE.utils.concatUrlPaths([IDEE.config.THEME_URL, '/img/m-pin-24.svg']),
        },
      });
    }
    // Style for hiding geometry
    this.simple = new IDEE.style.Polygon({
      fill: {
        color: 'black',
        opacity: 0,
      },
    });
  }

  /**
    * This
    function inserts a popUp with information about the searched location
      (and whether it 's an exact result or an approximation)
    * @param { string } fullAddress location address(street, portal, etc.)
    * @param { Array } coordinates latitude[0] and longitude[1] coordinates
    * @param { boolean } exactResult indicating
    if the given result is a perfect match
    */
  showSearchPopUp(fullAddress, coordinates, exactResult, e = {}) {
    const destinyProj = this.map.getProjection().code;
    const destinySource = 'EPSG:4326';
    const newCoordinates = this.getImpl()
      .reprojectReverse([coordinates[1], coordinates[0]], destinySource, destinyProj);
    let exitState;
    if (exactResult !== 1) {
      exitState = getValue('aprox');
    } else {
      exitState = getValue('exact');
    }
    this.showPopUp(fullAddress, newCoordinates, coordinates, exitState, false, e);
  }

  /**
    * This
    function inserts a popUp with information about the searched location
      (and whether it 's an exact result or an approximation)
    * @param { string } fullAddress location address(street, portal, etc.)
    * @param { Array } coordinates latitude[0] and longitude[1] coordinates
    * @param { boolean } exactResult indicating
    if the given result is a perfect match
    */
  showSearchPopUpRC(fullAddress, coords, exactResult, e = {}) {
    const target = 'EPSG:4326';
    const source = this.map.getProjection().code;
    const newCoords = this.getImpl().reprojectReverse([coords[0], coords[1]], source, target);
    let exitState;
    if (exactResult !== 1) {
      exitState = getValue('aprox');
    } else {
      exitState = getValue('exact');
    }

    this.showPopUp(fullAddress, coords, newCoords, exitState, false, e);
  }

  /**
   * This function inserts a popup on the map with information about its location.
   * @param { string } fullAddress location address(street, portal, etc.)
   * @param { Array } mapCoordinates latitude[0] and longitude[1] coordinates on map projection
   * @param { Array } featureCoordinates latitude[0] and longitude[1] coordinates from feature
   * @param { string } exitState indicating if the given result is a perfect match
   */
  showPopUp(
    fullAddress,
    mapcoords,
    featureCoordinates,
    exitState = null,
    addTab = true,
    e = {},
    hasOffset = true,
  ) {
    const featureTabOpts = { content: '', title: '' };
    if (exitState !== null) {
      featureTabOpts.content += `<div><b>${exitState}</b></div>`;
    }

    featureTabOpts.content += `<div><b>${fullAddress !== undefined ? fullAddress : '-'}</b></div><br/>
                <div class='ignsearchlocator-popup'><b>Lat:</b>${featureCoordinates[0].toFixed(6)}</div>
                <div class='ignsearchlocator-popup'><b>Lon:</b>${featureCoordinates[1].toFixed(6)} </div>`;
    if (this.map.getPopup() instanceof IDEE.Popup && addTab === true) {
      this.popup = this.map.getPopup();
      this.popup.addTab(featureTabOpts);
    } else {
      const myPopUp = new IDEE.Popup({ panMapIfOutOfView: !e.fake });
      myPopUp.addTab(featureTabOpts);
      this.map.addPopup(myPopUp, [
        mapcoords[0],
        mapcoords[1],
      ]);
      this.popup = myPopUp;
    }
    if (hasOffset && this.pointStyle === 'pinBlanco') this.popup.getImpl().setOffset([0, -30]);
    this.lat = mapcoords[1];
    this.lng = mapcoords[0];
  }

  /**
   * This function sets given scale to map
   * @public
   * @function
   * @param { number } scale to which the map will zoom in
   *   (5000 if we want 1: 5000)
   * @api
   */
  setScale(scale) {
    this.getImpl().setScale(scale);
  }

  accessibilityTab(html) {
    if (html.getAttribute('tabindex')) html.setAttribute('tabindex', this.order);
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
