/**
 * @module M/control/IGNSearchControl
 */
import IGNSearchImplControl from '../../impl/ol/js/ignsearchcontrol';
import template from '../../templates/ignsearch';
import results from '../../templates/results';
import { getValue } from './i18n/language';

let typingTimer;
/**
 * @classdesc
 * This class creates an input for searching locations on a map.
 * It uses Instituto Geográfico Nacional services Geocoder and Nomenclator
 * to search user's input location and return coordinates on click.
 */
export default class IGNSearchControl extends M.Control {
  /*
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(
    servicesToSearch,
    maxResults,
    noProcess,
    countryCode,
    urlCandidates,
    urlFind,
    urlReverse,
    urlPrefix,
    urlAssistant,
    urlDispatcher,
    resultVisibility,
    reverse,
    locationID,
    requestStreet,
    geocoderCoords,
    zoom,
    searchPosition,
    pointStyle,
    nomenclatorSearchType,
  ) {
    if (M.utils.isUndefined(IGNSearchImplControl)) {
      M.exception('La implementación usada no puede crear controles IGNSearchControl');
    }
    const impl = new IGNSearchImplControl();
    super(impl, 'IGNSearch');
    // Class properties
    /**
     * This variable indicates which services should be searched
     * (geocoder, nomenclator or both)
     * @private
     * @type {string} - 'g' | 'n' | 'gn'
     */
    this.servicesToSearch = servicesToSearch;
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
     * Reverse geocoder coordinates
     * @private
     * @type {string}
     */
    this.geocoderCoords = geocoderCoords;

    /**
     * Zoom
     *
     * @private
     * @type {number}
     */
    this.zoom = zoom;

    /**
     * Reverse geocoder coordinates
     * @private
     * @type {string}
     */
    this.urlParse = null;

    /**
     * This variable indicates Nomenclator url prefix
     * @private
     * @type {string}
     */
    this.pointStyle = pointStyle;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api
   */
  createView(map) {
    // eslint-disable-next-line
    console.warn(getValue('exception.ignsearch_obsolete'));
    this.map = map;
    this.destroyMapLayers();
    return new Promise((success) => {
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            deleteresults: getValue('deleteresults'),
            obtener: getValue('obtener'),
            direccion: getValue('direccion'),
            tooltip_input: getValue('tooltip_input'),
          },
        },
      });
      this.html = html;
      this.resultsBox = html.querySelector('#m-ignsearch-results');
      this.searchInput = this.html.querySelector('#m-ignsearch-search-input');
      html.querySelector('#m-ignsearch-clear-button').addEventListener('click', this.clearResultsAndGeometry.bind(this));
      html.querySelector('#m-ignsearch-search-input').addEventListener('keyup', (e) => this.createTimeout(e));
      html.querySelector('#m-ignsearch-search-input').addEventListener('keydown', () => {
        clearTimeout(typingTimer);
      });
      html.querySelector('#m-ignsearch-search-input').addEventListener('keydown', () => {
        clearTimeout(typingTimer);
      });
      html.querySelector('#m-ignsearch-locate-button').addEventListener('click', this.activateDeactivateReverse.bind(this));
      document.querySelector('.ign-search-panel>.m-panel-btn').addEventListener('click', this.clearResults.bind(this));
      this.clickReverseEvent = this.map.on(M.evt.CLICK, (e) => this.showReversePopUp(e));
      this.changePlaceholder();
      if (!this.reverse) {
        html.querySelector('#m-ignsearch-locate-button').style.display = 'none';
      }
      this.on(M.evt.ADDED_TO_MAP, () => {
        if (this.locationID && this.locationID.length > 0) {
          this.point = new M.style.Point({
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
          this.simple = new M.style.Polygon({
            fill: {
              color: 'black',
              opacity: 0,
            },
          });
          this.drawNomenclatorResult(this.locationID, false);
        }
        if (this.requestStreet && this.requestStreet.length > 0) {
          M.proxy(false);
          M.remote.get(this.requestStreet).then((res) => {
            const geoJsonData = res.text.substring(9, res.text.length - 1);
            this.map.removeLayers(this.clickedElementLayer);
            const featureJSON = JSON.parse(geoJsonData);
            featureJSON.geometry.coordinates = this.fixCoordinatesPath(featureJSON);
            // Center coordinates
            this.coordinates = `${featureJSON.properties.lat}, ${featureJSON.properties.lng}`;
            // New layer with geometry
            this.clickedElementLayer = new M.layer.GeoJSON({
              name: getValue('searchresult'),
              source: {
                type: 'FeatureCollection',
                features: [featureJSON],
              },
            }, { displayInLayerSwitcher: false });
            this.clickedElementLayer.displayInLayerSwitcher = false;

            this.createGeometryStyles();

            if (featureJSON.geometry.type === 'Point') {
              this.clickedElementLayer.setStyle(this.point);
            }

            // Change zIndex value
            this.clickedElementLayer.setZIndex(999999999999999);

            // Stops showing polygon geometry
            if (!this.resultVisibility_) {
              this.clickedElementLayer.setStyle(this.simple);
            }
            this.map.addLayers(this.clickedElementLayer);
            // show popup for streets
            if (featureJSON.properties.type === 'callejero' || featureJSON.properties.type === 'portal') {
              const fullAddress = this.createFullAddress(featureJSON.properties);

              const coordinates = [featureJSON.properties.lat, featureJSON.properties.lng];
              const perfectResult = featureJSON.properties.state;
              this.showSearchPopUp(fullAddress, coordinates, perfectResult, { fake: true });
            }

            M.proxy(true);
          }).catch((err) => {
            M.proxy(true);
          });
        }

        if (this.geocoderCoords && this.geocoderCoords.length === 2) {
          this.activateDeactivateReverse();
          const reprojCoords = this.getImpl().reproject(this.geocoderCoords, 'EPSG:4326', map.getProjection().code);
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
      this.reverseActivated = true;
      document.querySelector('#m-ignsearch-locate-button span').style.color = '#71a7d3';
    } else {
      this.reverseActivated = false;
      document.querySelector('#m-ignsearch-locate-button span').style.color = '#7A7A73';
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
        .reproject([e.coord[0], e.coord[1]], origin, destiny);
      // Params:
      // lon, lat
      // type (only if refcatastral) = 'refcatastral'
      const params = `lon=${etrs89pointCoordinates[0]}&lat=${etrs89pointCoordinates[1]}`;
      const urlToGet = `${this.urlReverse}?${params}`;
      const mapCoordinates = e.coord;
      this.geocoderCoords = etrs89pointCoordinates;
      const dataCoordinates = [etrs89pointCoordinates[1], etrs89pointCoordinates[0]];
      let fullAddress = '';
      M.proxy(false);
      M.remote.get(urlToGet).then((res) => {
        if (res.text !== null) {
          const returnData = JSON.parse(res.text);
          fullAddress = this.createFullAddress(returnData);
        } else {
          fullAddress = getValue('exception.exists');
        }
        this.showPopUp(fullAddress, mapCoordinates, dataCoordinates, null, true, e);
      });

      M.proxy(true);
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
    return html.querySelector('.m-ignsearch button');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof IGNSearchControl;
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

      const regExpCoord = /[+-]?\d+\.\d+(\s|,|(,\s))[+-]?\d+\.\d+/;
      // Checks if input content represents coordinates, else searches text
      if (regExpCoord.test(value)) {
        // searches coordinates point (TO DO) if coordinates are entered
        this.searchCoordinates(value);
      } else {
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
      const infoMsg = document.createTextNode(getValue('exception.results'));
      parragraph.classList.add('m-ignsearch-noresults');
      parragraph.appendChild(infoMsg);
      this.resultsBox.appendChild(parragraph);
    } else if (this.allCandidates.length > 0) {
      // Clears previous search
      this.resultsBox.innerHTML = '';
      // remove animation class and return to normal font size after loading
      this.resultsBox.classList.remove('g-cartografia-spinner');
      this.resultsBox.style.fontSize = '1em';
      const compiledResult = M.template.compileSync(results, {
        vars: {
          places: this.allCandidates,
        },
      });

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
  drawGeocoderResultProv(geoJsonData) {
    this.map.removeLayers(this.clickedElementLayer);
    M.proxy(false);
    M.remote.get(this.urlParse).then((res) => {
      const urlSinJSON = res.text.substring(9, res.text.length - 1);

      let geoJsonData2 = geoJsonData;

      let datosGeometria;
      let datosCoordenadas;
      if (urlSinJSON.includes('MULTIPOLYGON (((')) {
        if (geoJsonData2.includes('"type":"MultiPolygon"')) {
          datosGeometria = urlSinJSON.split('(((');
          datosCoordenadas = datosGeometria[1].split('), (');

          if (geoJsonData2.includes(']]]')) {
            geoJsonData2 = geoJsonData2.replace(']]]', ']]]]');
          }

          for (let i = 0; i < datosCoordenadas.length; i += 1) {
            const hol = datosCoordenadas[i].substring(0, 9).replace('(', '');

            if (geoJsonData.includes('[[['.concat(hol))) {
              geoJsonData2 = geoJsonData2.replace('[[['.concat(hol), '[[[['.concat(hol));
            } else if (geoJsonData.includes(']],[['.concat(hol))) {
              geoJsonData2 = geoJsonData2.replace(']],[['.concat(hol), ']]],[[['.concat(hol));
            } else if (geoJsonData.includes('],['.concat(hol))) {
              geoJsonData2 = geoJsonData2.replace('],['.concat(hol), ']],[['.concat(hol));
            }
          }
        }
      } else if (urlSinJSON.includes('POLYGON ((')) {
        if (geoJsonData2.includes('"type":"Polygon"')) {
          datosGeometria = urlSinJSON.split('((');
          datosCoordenadas = datosGeometria[1].split('), (');

          if (geoJsonData2.includes(']]')) {
            geoJsonData2 = geoJsonData2.replace(']]', ']]]');
          }

          geoJsonData2 = geoJsonData2.replace('Polygon', 'MultiPolygon');

          for (let i = 0; i < datosCoordenadas.length; i += 1) {
            const numFirstValue = datosCoordenadas[i].split(' ');
            const val = datosCoordenadas[i].substring(0, numFirstValue[0].length).replace('(', '');

            if (geoJsonData.includes('[[['.concat(val))) {
              geoJsonData2 = geoJsonData2.replace('[[['.concat(val), '[[[['.concat(val));
            } else if (geoJsonData.includes('],['.concat(val))) {
              geoJsonData2 = geoJsonData2.replace('],['.concat(val), ']],[['.concat(val));
            }
          }
        } else if (geoJsonData2.includes('"type":"MultiPolygon"')) {
          geoJsonData2 = geoJsonData2.replace(']]],[[', ']],[[');
          geoJsonData2 = geoJsonData2.replace('"type":"MultiPolygon"', '"type":"Polygon"');
        }
      }

      if (geoJsonData2.includes('MultiMultiPolygon')) {
        geoJsonData2 = geoJsonData2.replace('MultiMultiPolygon', 'MultiPolygon');
      }
      const featureJSON = JSON.parse(geoJsonData2);

      // featureJSON.geometry.coordinates = this.fixCoordinatesPath(featureJSON);
      // Center coordinates
      this.coordinates = `${featureJSON.properties.lat}, ${featureJSON.properties.lng}`;
      // New layer with geometry
      this.clickedElementLayer = new M.layer.GeoJSON({
        name: getValue('searchresult'),
        source: {
          type: 'FeatureCollection',
          features: [featureJSON],
        },
      }, { displayInLayerSwitcher: false });
      this.clickedElementLayer.displayInLayerSwitcher = false;

      if (featureJSON.geometry.type === 'Point') {
        this.clickedElementLayer.setStyle(this.point);
      }

      if (featureJSON.geometry.type.indexOf('Polygon') > -1) {
        this.clickedElementLayer.setStyle(new M.style.Polygon({
          fill: {
            color: '#3399CC',
            opacity: 0,
          },
          stroke: {
            color: '#3399CC',
            width: 2,
          },
          radius: 5,
        }));
      }

      // Change zIndex value
      this.clickedElementLayer.setZIndex(999999999999999);

      // Stops showing polygon geometry
      if (!this.resultVisibility_) {
        this.clickedElementLayer.setStyle(this.simple);
      }
      this.map.addLayers(this.clickedElementLayer);
      this.zoomInLocation('g', featureJSON.geometry.type, this.zoom);
      // show popup for streets
      if (featureJSON.properties.type === 'callejero'
        || featureJSON.properties.type === 'portal') {
        const fullAddress = this.createFullAddress(featureJSON.properties);

        const coordinates = [featureJSON.properties.lat, featureJSON.properties.lng];
        const perfectResult = featureJSON.properties.state;
        this.showSearchPopUp(fullAddress, coordinates, perfectResult);
      }
    });

    M.proxy(true);
  }

  drawGeocoderResult(geoJsonData) {
    this.map.removeLayers(this.clickedElementLayer);
    const featureJSON = JSON.parse(geoJsonData);
    featureJSON.geometry.coordinates = this.fixCoordinatesPath(featureJSON);
    // Center coordinates
    this.coordinates = `${featureJSON.properties.lat}, ${featureJSON.properties.lng}`;
    // New layer with geometry
    this.clickedElementLayer = new M.layer.GeoJSON({
      name: getValue('searchresult'),
      source: {
        type: 'FeatureCollection',
        features: [featureJSON],
      },
    }, { displayInLayerSwitcher: false });
    this.clickedElementLayer.displayInLayerSwitcher = false;
    if (featureJSON.geometry.type === 'Point') {
      this.clickedElementLayer.setStyle(this.point);
    }

    // Change zIndex value
    this.clickedElementLayer.setZIndex(999999999999999);

    // Stops showing polygon geometry
    if (!this.resultVisibility_) {
      this.clickedElementLayer.setStyle(this.simple);
    } else if (featureJSON.geometry.type.indexOf('Polygon') > -1) {
      this.clickedElementLayer.setStyle(new M.style.Polygon({
        fill: {
          color: '#3399CC',
          opacity: 0,
        },
        stroke: {
          color: '#3399CC',
          width: 2,
        },
        radius: 5,
      }));
    }

    this.map.addLayers(this.clickedElementLayer);
    this.zoomInLocation('g', featureJSON.geometry.type, this.zoom);
    // show popup for streets
    if (featureJSON.properties.type === 'callejero'
      || featureJSON.properties.type === 'portal') {
      const fullAddress = this.createFullAddress(featureJSON.properties);
      const coordinates = [featureJSON.properties.lat, featureJSON.properties.lng];
      const perfectResult = featureJSON.properties.state;
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
    return `${via} ${address} ${portal}, ${muni.toUpperCase()}`;
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
    this.requestPlace = M.utils.addParameters(this.urlDispatcher, {
      request: 'OpenQuerySource',
      query: `<ogc:Filter><ogc:FeatureId fid="${locationId}"/></ogc:Filter>`,
      sourcename: `${this.urlPrefix}communicationsPoolServlet/sourceAccessWFS-INSPIRE-NGBE.rdf`,
      outputformat: 'application/json',
    });
    this.locationID = locationId;
    M.proxy(true);
    M.remote.get(this.requestPlace).then((res) => {
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
      this.clickedElementLayer = new M.layer.GeoJSON(newGeojson, { displayInLayerSwitcher: false });
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
        this.zoomInLocation('n', 'Point', this.zoom);
      }
    });
  }

  /**
   * This function gets user input, searches for coincidences and adds each one to the given array.
   * @public
   * @function
   * @param {string} inputValue search text written by user
   * @param { Array < Object > } resultsArray search result candidates from IGN services
   * @api
   */
  getCandidatesData(inputValue, resultsArray) {
    const newInputVal = window.encodeURIComponent(inputValue);
    return new Promise((resolve) => {
      if (this.servicesToSearch !== 'n') {
        let params = `q=${newInputVal}&limit=${this.maxResults + 5}&no_process=${this.noProcess}`;
        params += `&countrycode=${this.countryCode}&autocancel=true`;
        const urlToGet = `${this.urlCandidates}?${params}`;
        M.proxy(false);
        M.remote.get(urlToGet).then((res) => {
          const returnData = JSON.parse(res.text.substring(9, res.text.length - 1));
          for (let i = 0; i < returnData.length; i += 1) {
            resultsArray.push(returnData[i]);
          }
          resolve();
        });

        M.proxy(true);
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
        M.proxy(true);
        M.remote.get(urlToGet).then((res) => {
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
      const params = `${type}${via}${id}${portal}&outputformat=geojson`;
      // const params = `${type}${via}${id}${portal}`;

      const urlToGet = `${this.urlFind}?q=${address}${params}`;

      this.urlParse = urlToGet.replace('&outputformat=geojson', '');

      this.requestStreet = urlToGet;
      this.locationID = '';
      M.proxy(false);
      M.remote.get(urlToGet).then((res) => {
        const geoJsonData = res.text.substring(9, res.text.length - 1);
        resolve(geoJsonData);
      });

      M.proxy(true);
    });
  }

  /**
   * This function zooms in clicked location and draws geometry
   * @public
   * @function
   * @param {Object} listElement clicked result information
   * @api
   */
  goToLocation(listElement) {
    const text = listElement.querySelector('#info').innerHTML;
    this.html.querySelector('#m-ignsearch-search-input').value = text;
    this.currentElement = listElement; // <li>
    const selectedObject = this.findClickedItem(listElement, this.allCandidates); // json
    this.createGeometryStyles();
    // if item comes from geocoder
    if (Object.prototype.hasOwnProperty.call(selectedObject, 'address')) {
      this.getFindData(listElement, this.allCandidates).then((geoJsonData) => {
        if (geoJsonData.includes('"tip_via":null') && (geoJsonData.includes('"type":"Municipio"') || geoJsonData.includes('"type":"municipio"') || geoJsonData.includes('"type":"Provincia"') || geoJsonData.includes('"type":"provincia"') || geoJsonData.includes('"type":"comunidad autonoma"'))) {
          this.drawGeocoderResultProv(geoJsonData);
          this.map.removePopup();
        } else {
          this.drawGeocoderResult(geoJsonData);
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
  zoomInLocation(service, type, zoom) {
    this.resultsList = document.getElementById('m-ignsearch-results-list');
    if (this.clickedElementLayer instanceof M.layer.Vector) {
      this.clickedElementLayer.calculateMaxExtent().then((extent) => {
        this.map.setBbox(extent);
        if (service === 'n' || type === 'Point') {
          this.setScale(17061); // last scale requested by our client: 2000
        }
        // En el caso de que se haga una búsqueda de Provincias o CCAA, se dejaría el zoom que
        // calcula el servicio para no afectar en la visualización de la geometría.
        if (type === 'Point') {
          this.map.setZoom(zoom);
        }
        this.fire('ignsearch:entityFound', [extent]);
      });
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
    return allCandidates.filter((element) => element.id === listElement.getAttribute('id'))[0];
  }

  /**
   * This function fixes path to get to this feature's coordinates
   * @public
   * @function
   * @param {feature} feature with geometry information for the given location
   * @api
   */
  fixCoordinatesPath(feature) {
    let coordinates;
    if (feature.geometry.type === 'Point') {
      coordinates = feature.geometry.coordinates[0][0];
    } else if (feature.geometry.type === 'MultiPolygon') {
      coordinates = [feature.geometry.coordinates];
    } else if (feature.geometry.type === 'LineString') {
      coordinates = feature.geometry.coordinates[0];
    } else {
      coordinates = feature.geometry.coordinates;
    }
    return coordinates;
  }

  /* Given a set of coordinates (lat, long),
    searches for the corresponding place
  */
  searchCoordinates(setOfCoordinates) {
    // const latLongSeparationRegExp = /(\s+|,|,\s)/;
    // setOfCoordinates.replace(latLongSeparationRegExp, ' ');
    // const latFromSet = setOfCoordinates.split(' ')[0];
    // const longFromSet = setOfCoordinates.split(' ')[1];
    return new Promise((resolve) => {
      // TODO
      // if lat,long separation character/s are not a space, it turns into a space
      // const latLongSeparationRegExp = /(\s+|,|,\s)/;
      // setOfCoordinates.replace(latLongSeparationRegExp, ' ');
      // const latFromSet = setOfCoordinates.split(' ')[0];
      // const longFromSet = setOfCoordinates.split(' ')[1];
      // // geocoder service
      // const urlToGet = `${this.urlReverse}?lat=${latFromSet}&lon=${longFromSet}`;
      // M.remote.get(urlToGet).then((res) => {
      //   const parsedResponse = JSON.parse(res.text);
      //   const coordinatesSetAddress = parsedResponse.address;
      //   resolve();
      // });
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
    this.searchInput.value = '';
    this.resultsBox.innerHTML = '';
    this.searchValue = '';
  }

  /**
   * This function clears input content, results box, popup and shown geometry.
   * @public
   * @function
   * @api
   */
  clearResultsAndGeometry() {
    this.clearResults();
    if (this.clickedElementLayer !== undefined) {
      this.clickedElementLayer.setStyle(this.simple);
      this.map.removeLayers(this.clickedElementLayer);
    }
    this.map.removePopup(this.popup, [
      this.lng,
      this.lat,
    ]);
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
      this.point = new M.style.Point({
        radius: 5,
        icon: {
          form: 'none',
          class: 'g-cartografia-pin',
          radius: 12,
          rotation: 0,
          rotate: false,
          offset: [0, -12],
          color: '#f00',
          border: '5px solid green',
          opacity: 1,
        },
      });
    } else if (this.pointStyle === 'pinRojo') {
      this.point = new M.style.Point({
        radius: 5,
        icon: {
          src: M.utils.concatUrlPaths([M.config.THEME_URL, '/img/pinign.svg']),
        },
      });
    } else if (this.pointStyle === 'pinMorado') {
      this.point = new M.style.Point({
        radius: 5,
        icon: {
          src: M.utils.concatUrlPaths([M.config.THEME_URL, '/img/m-pin-24.svg']),
        },
      });
    }

    // Style for hiding geometry
    this.simple = new M.style.Polygon({
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
      .reproject([coordinates[1], coordinates[0]], destinySource, destinyProj);

    let exitState;
    if (exactResult !== 1) {
      exitState = getValue('aprox');
    } else {
      exitState = getValue('exact');
    }
    this.showPopUp(fullAddress, newCoordinates, coordinates, exitState, false, e);
  }

  /**
   * This function inserts a popup on the map with information about its location.
   * @param { string } fullAddress location address(street, portal, etc.)
   * @param { Array } mapCoordinates latitude[0] and longitude[1] coordinates on map projection
   * @param { Array } featureCoordinates latitude[0] and longitude[1] coordinates from feature
   * @param { string } exitState indicating if the given result is a perfect match
   */
  showPopUp(fullAddress, mapcoords, featureCoordinates, exitState = null, addTab = true, e = {}) {
    const featureTabOpts = { content: '', icon: 'icon-locate' };
    if (exitState !== null) {
      featureTabOpts.content += `<div><b>${exitState}</b></div>`;
    }
    featureTabOpts.content += `<div>${fullAddress}</div>
                <div class='ignsearch-popup'>Lat: ${featureCoordinates[0].toFixed(6)}</div>
                <div class='ignsearch-popup'> Lon: ${featureCoordinates[1].toFixed(6)} </div>`;
    if (this.map.getPopup() instanceof M.Popup && addTab === true) {
      this.popup = this.map.getPopup();
      this.popup.addTab(featureTabOpts);
    } else {
      const myPopUp = new M.Popup({ panMapIfOutOfView: !e.fake });
      myPopUp.addTab(featureTabOpts);

      this.map.addPopup(myPopUp, [
        mapcoords[0],
        mapcoords[1],
      ]);
      this.popup = myPopUp;
    }
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
}
