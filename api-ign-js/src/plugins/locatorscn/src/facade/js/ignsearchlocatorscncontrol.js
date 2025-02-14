/**
 * @module M/control/IGNSearchLocatorscnControl
 */
import template from 'templates/ignsearchlocatorscn';
import results from 'templates/ignsearchlocatorscn-results';
import ignsearchlocatorscnReverse from 'templates/ignsearchlocatorscn-reverse';
import IGNSearchLocatorscnImpl from '../../impl/ol/js/ignsearchlocatorscncontrol';
import { getValue } from './i18n/language';

let typingTimer;

export default class IGNSearchLocatorscnControl extends M.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(
    map,
    zoom,
    pointStyle,
    options,
    useProxy,
    statusProxy,
    positionPlugin,
  ) {
    if (M.utils.isUndefined(IGNSearchLocatorscnImpl)) {
      M.exception(getValue('exception.impl_ignsearchlocatorscn'));
    }
    const impl = new IGNSearchLocatorscnImpl(map);
    super(impl, 'IGNSearchLocatorscnImpl');

    /**
     * Zoom
     *
     * @type {number}
     */
    this.zoom = zoom;

    /**
     * This variable indicates whether the option to obtain the address
     * at a point on the map appears
     * @private
     * @type {boolean}
     */
    this.reverse = !M.utils.isUndefined(options.reverse) ? options.reverse : true;

    /**
     * This variable indicates whether result geometry should be drawn on map.
     * @private
     * @type {boolean}
     */
    this.resultVisibility = !M.utils.isUndefined(options.resultVisibility)
      ? options.resultVisibility
      : true;

    /**
     * This variable indicates the layers for the autocomplete.
     * @private
     * @type {boolean}
     */
    this.autocompleteLayers = options.layers || 'address,street,venue';

    /**
     * This variable indicates the max number of results for the autocomplete.
     * @private
     * @type {boolean}
     */
    this.autocompleteSize = options.size || 10;

    /**
     * This variable indicates addendum field name
     * @private
     * @type {string}
     */
    this.addendumField = options.addendum || 'iderioja';

    /**
     * This variable indicates pelias Candidates service url
     * @private
     * @type {string}
     */
    this.urlAutocomplete = options.urlAutocomplete || 'https://geocoder.larioja.org/v1/autocomplete';

    /**
     * This variable indicates pelias Reverse service url
     * @private
     * @type {string}
     */
    this.urlReverse = options.urlReverse || 'https://geocoder.larioja.org/v1/reverse';

    /**
     * This variable indicates Pelias Reverse radius
     * @private
     * @type {string}
     */
    this.reverseRadius = options.radius || 100;

    /**
     * This variable indicates pelias sources
     * @private
     * @type {string}
     */
    this.reverseSources = options.sources || '';

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle = pointStyle;

    let peliasCoords = options.peliasCoords;
    if (M.utils.isString(peliasCoords)) {
      peliasCoords = peliasCoords.split(',');
      peliasCoords = [Number.parseFloat(peliasCoords[0]),
        Number.parseFloat(peliasCoords[1]),
      ];
    }

    /**
     * Pelias reverse coordinates
     *
     * @private
     * @type {number}
     */
    this.peliasCoords = peliasCoords || [];

    /**
     * This variable indicates whether reverse button is activated.
     * @private
     * @type {Boolean}
     */
    this.reverseActivated = false;

    /**
     * Indicates if you want to use proxy in requests
     * @private
     * @type {Number}
     */
    this.useProxy = useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = statusProxy;

    /**
     * Position plugin
     * @private
     * @type {String}
     */
    this.positionPlugin = positionPlugin;

    /**
     * Map
     */
    this.map = map;
  }

  /**
   * This function gets the initial lookup
   *
   * @function
   * @public
   * @api
   * @param {Node} html - Panel html
   */
  initializateAddress(html) {
    if ((this.locationID && this.locationID.length > 0) || (this.requestStreet
        && this.requestStreet.length > 0)
        || (this.geocoderCoords && this.geocoderCoords.length === 2)) {
      this.active(html);
    }
    if (this.locationID && this.locationID.length > 0) {
      this.createGeometryStyles();
      this.drawNomenclatorResult(this.locationID, false);
    }
    if (this.requestStreet && this.requestStreet.length > 0) {
      M.proxy(this.useProxy);
      M.remote.get(this.requestStreet).then((res) => {
        const geoJsonData = res.text.substring(9, res.text.length - 1);
        this.createGeometryStyles();
        this.drawGeocoderResult(geoJsonData);
      }).catch();
      M.proxy(this.statusProxy);
    }
    if (this.geocoderCoords && this.geocoderCoords.length === 2) {
      const reprojCoords = this.getImpl().reproject('EPSG:4326', this.geocoderCoords);
      this.showReversePopUp({
        coord: reprojCoords,
        fake: true,
      }, true);
    }
  }

  /**
   * This function active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.html_ = html;
    const ignsearchactive = this.html_.querySelector('#m-locatorscn-ignsearch').classList.contains('activated');
    this.deactive();
    if (!ignsearchactive) {
      if (this.positionPlugin === 'TC') {
        document.querySelector('.m-plugin-locatorscn').classList.remove('m-plugin-locatorscn-tc');
        document.querySelector('.m-plugin-locatorscn').classList.add('m-plugin-locatorscn-tc-withpanel');
      }
      this.html_.querySelector('#m-locatorscn-ignsearch').classList.add('activated');
      const panel = M.template.compileSync(template, {
        vars: {
          reverse: this.reverse,
          placeholder: getValue('search_direction'),
          translations: {
            search_direction: getValue('search_direction'),
            get_direction: getValue('get_direction'),
            clean: getValue('clean'),
          },
        },
      });
      document.querySelector('#div-contenedor-locatorscn').appendChild(panel);
      this.resultsBox = this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-results');
      this.searchInput = this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-search-input');
      this.addEvents();
    }
  }

  /**
   * This function deactive control
   *
   * @public
   * @function
   * @api
   */
  deactive() {
    this.html_.querySelector('#m-locatorscn-ignsearch').classList.remove('activated');
    const panel = this.html_.querySelector('#m-ignsearch-panel');
    if (panel) {
      this.clearResults();
      document.querySelector('#div-contenedor-locatorscn').removeChild(panel);
    }
  }

  /**
   * This function add events to html
   *
   * @public
   * @function
   * @api
   */
  addEvents() {
    this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-search-input').addEventListener('keyup', (e) => this.createTimeout(e));
    this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-search-input').addEventListener('click', () => this.openRecentsResults());
    if (this.reverse) {
      this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-search-input').style.width = '160px';
      this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-locate-button').addEventListener('click', this.activateDeactivateReverse.bind(this));
      this.clickReverseEvent = this.map.on(M.evt.CLICK, (e) => this.showReversePopUp(e));
    }
    this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-clean-button').addEventListener('click', () => this.clearResults());
  }

  /**
   * This function toggles reverse Pelias button activation.
   *
   * @public
   * @function
   * @api
   */
  activateDeactivateReverse() {
    if (!this.reverseActivated) {
      this.invokeEscKey();
      this.reverseActivated = true;
      this.html_.querySelector('#m-ignsearchlocatorscn-locate-button').style.color = '#71a7d3';
      document.addEventListener('keyup', this.checkEscKey.bind(this));
      document.getElementsByTagName('body')[0].style.cursor = `url(${M.utils.concatUrlPaths([M.config.THEME_URL, '/img/pushpin.svg'])}) 0 20, auto`;
    } else {
      this.reverseActivated = false;
      this.html_.querySelector('#m-ignsearchlocatorscn-locate-button').style.color = '#7A7A73';
      document.removeEventListener('keyup', this.checkEscKey);
      document.getElementsByTagName('body')[0].style.cursor = 'auto';
    }
  }

  /**
   * This function invoke "Esc" key
   *
   * @public
   * @function
   * @api
   */
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
   * This function deactive option reverse when the user presses
   * "Esc" key
   *
   * @function
   * @public
   * @param {Event} evt - Event
   * @api
   */
  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.reverseActivated = false;
      this.html_.querySelector('#m-ignsearchlocatorscn-locate-button').style.color = '#7A7A73';
      document.removeEventListener('keyup', this.checkEscKey);
      document.getElementsByTagName('body')[0].style.cursor = 'auto';
    }
  }

  /**
   * This function shows information tooltip on clicked point.
   *
   * @public
   * @funcion
   * @param {Event} e - Event
   * @api
   */
  showReversePopUp(e, isPeliasCoords = false) {
    if (this.reverseActivated || isPeliasCoords) {
      // Reproject coordinates to ETRS89 on decimal grades (+ North latitude and East longitude)
      const origin = this.map.getProjection().code;
      const destiny = 'EPSG:4258';
      const etrs89pointCoordinates = this.getImpl()
        .reprojectReverse([e.coord[0], e.coord[1]], origin, destiny);
      const params = `point.lon=${etrs89pointCoordinates[0]}&point.lat=${etrs89pointCoordinates[1]}&size=1&boundary.circle.radius=${this.reverseRadius}${this.reverseSources ? `&sources=${this.reverseSources.replace(',', '%2C')}` : ''}`;
      const urlToGet = `${this.urlReverse}?${params}`;
      const mapCoordinates = e.coord;
      this.peliasCoords = etrs89pointCoordinates;
      const dataCoordinates = [etrs89pointCoordinates[1], etrs89pointCoordinates[0]];
      // let fullAddress = '';
      let addressData = {};
      M.proxy(this.useProxy);
      M.remote.get(urlToGet).then((res) => {
        if (res.text) {
          const returnData = JSON.parse(res.text);
          const { features } = returnData;
          addressData = this.parsePeliasToGeocoder(features[0]);
          // fullAddress = this.createFullAddress(addressData);
        } else {
          addressData = {};
          // fullAddress = '';
        }
        this.showPopUp(addressData, mapCoordinates, dataCoordinates, null, e, false);
      });
      M.proxy(this.statusProxy);
    }
  }

  /**
   * This function takes data from an entity and returns the complete address
   *
   * @function
   * @public
   * @param {string} jsonResult - json string with entity data
   * @api
   */
  createFullAddress(jsonResult) {
    const via = (jsonResult.tip_via === null
      || jsonResult.tip_via === undefined) ? '' : jsonResult.tip_via;
    const address = (jsonResult.address === null
      || jsonResult.address === undefined) ? '' : jsonResult.address;
    const extension = (jsonResult.extension === null
      || jsonResult.extension === undefined) ? '' : jsonResult.extension.trim();
    let street = `${via} ${address}`;
    if (!M.utils.isNullOrEmpty(extension)) {
      street += ` ${extension}`;
    }
    return `${street}`;
  }

  /**
   * This function sets a timeout between keypress and search.
   *
   * @public
   * @function
   * @param {e} event - Event that triggers the method
   * @api
   */
  createTimeout(e) {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => this.searchInputValue(e), 500);
  }

  /**
   * This function open recent results
   *
   * @public
   * @function
   * @api
   */
  openRecentsResults() {
    if (!this.html_.querySelector('#m-ignsearch-panel>#m-ignsearchlocatorscn-search-input').value
      && !this.html_.querySelector('#m-ignsearchlocatorscn-results-list')) {
      const recents = window.localStorage.getItem('recents');
      if (recents && recents.length > 0) {
        const compiledResult = M.template.compileSync(results, {
          vars: {
            noresults: false,
            places: JSON.parse(recents),
            translations: {
              noresults: getValue('exception.noresults'),
            },
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
  }

  /**
   * This function
   * 1.- Takes user's input
   * 2.- Searches for ocurrences on IGN sources
   * 3.- Returns results as items in a drop-down list (returns address)
   * 4.- Onclick on an item goes to its coordinates
   *
   * @public
   * @function
   * @param {event} e - Event that triggers this method
   * @api
   */
  searchInputValue(e) {
    const value = e.target.value.replace(',', ' ');
    this.searchValue = value;
    this.resultsBox.innerHTML = '';

    if (value.length > 2) {
      // Adds animation class during loading
      this.resultsBox.classList.add('locatorscn-icon-spinner');

      this.peliasCandidates = [];

      this.candidatesFinished = false;

      this.showCandidatesResults();

      // saves on allCandidates search results from CartoCiudad (geocoder)
      this.getCandidatesData(value, this.peliasCandidates).then(() => {
        this.candidatesFinished = true;
        this.showCandidatesResults();
      });
    }
  }

  /**
   * This function returns the current bbox in view.
   *
   * @public
   * @function
   * @api
   */
  generateBoundaryParams() {
    const bbox = this.map.getBbox();
    const minReprojected = this.getImpl().reprojectReverse([bbox.x.min, bbox.y.min], 'EPSG:3857', 'EPSG:4326');
    const maxReprojected = this.getImpl().reprojectReverse([bbox.x.max, bbox.y.max], 'EPSG:3857', 'EPSG:4326');
    const boundary = {
      min_lon: minReprojected[0],
      max_lon: maxReprojected[0],
      min_lat: minReprojected[1],
      max_lat: maxReprojected[1],
    };
    return `boundary.rect.min_lon=${boundary.min_lon}&boundary.rect.max_lon=${boundary.max_lon}&boundary.rect.min_lat=${boundary.min_lat}&boundary.rect.max_lat=${boundary.max_lat}`;
  }

  /**
   * This function gets user input, searches for coincidences and adds each one to the given array.
   *
   * @public
   * @function
   * @param {string} inputValue - Search text written by user
   * @param {Array<Object>} resultsArray - Search result candidates from IGN services
   * @api
   */
  getCandidatesData(inputValue, resultsArray) {
    const newInputVal = window.encodeURIComponent(inputValue);
    return new Promise((resolve) => {
      const boundaryParams = this.generateBoundaryParams();
      const params = `text=${newInputVal}&size=${this.autocompleteSize}&layers=${this.autocompleteLayers.replace(',', '%2C')}&${boundaryParams}`;
      const urlToGet = `${this.urlAutocomplete}?${params}`;
      M.proxy(this.useProxy);

      M.remote.get(urlToGet).then((res) => {
        if (res.code === 404 || res.code === 500) {
          M.dialog.error(getValue('exception.error_candidates'));
        } else {
          const returnData = JSON.parse(res.text);
          const { features } = returnData;

          for (let i = 0; i < features.length; i += 1) {
            resultsArray.push(features[i]);
          }
        }
        resolve();
      });
      M.proxy(this.statusProxy);
    });
  }

  /**
   * This function parses the pelias response
   * into a geocoder friendly format
   *
   * @function
   * @public
   * @api
   */
  parsePeliasToGeocoder(candicate) {
    const properties = candicate.properties;
    const coordinates = candicate.geometry.coordinates;
    const type = candicate.geometry.type;
    return {
      native: candicate,
      address: properties.label,
      comunidadAutonoma: properties.macroregion,
      countryCode: properties.country_code,
      extension: properties.extension,
      geom: `${type.toUpperCase()}(${coordinates[0]} ${coordinates[1]})`,
      id: properties.id,
      lng: coordinates[0],
      lat: coordinates[1],
      muni: properties.localadmin,
      municode: properties.localadmin_gid,
      noNumber: null,
      poblacion: properties.localadmin,
      portalNumber: properties.housenumber,
      postalCode: properties.postalcode,
      province: properties.region,
      provinceCode: properties.region_gid,
      refCatastral: null,
      state: 0,
      stateMsg: '',
      tip_via: null,
      type: '',
    };
  }

  /**
   * This function show results of search
   *
   * @function
   * @public
   * @api
   */
  showCandidatesResults() {
    this.allCandidates = [];
    for (let j = 0; j < this.peliasCandidates.length; j += 1) {
      const candicate = this.peliasCandidates[j];
      this.allCandidates.push(this.parsePeliasToGeocoder(candicate));
    }

    // Clears previous search
    this.resultsBox.innerHTML = '';
    // remove animation class and return to normal font size after loading
    this.resultsBox.classList.remove('locatorscn-icon-spinner');
    const compiledResult = M.template.compileSync(results, {
      vars: {
        noresults: this.allCandidates.length === 0
          && this.candidatesFinished,
        places: this.allCandidates,
        translations: {
          noresults: getValue('exception.noresults'),
        },
      },
    });
    if (this.allCandidates.length > 0) {
      const elementList = compiledResult.querySelectorAll('li');
      elementList.forEach((listElement) => {
        listElement.addEventListener('click', () => {
          this.goToLocation(listElement);
        });
      });
    }

    this.resultsBox.appendChild(compiledResult);
  }

  /**
   * This function zooms in clicked location and draws geometry
   *
   * @public
   * @function
   * @param {Object} listElement - Element clicked result information
   * @param {Boolean} isRecentElement - True if the clicked item is from the recents list
   * @api
   */
  goToLocation(listElement, isRecentElement = false) {
    this.currentElement = listElement;
    const text = listElement.querySelector('#info').innerHTML;
    this.html_.querySelector('#m-ignsearchlocatorscn-search-input').value = text;
    const candidates = isRecentElement ? JSON.parse(window.localStorage.getItem('recents')) : this.allCandidates;
    const selectedObject = candidates.find((element) => element.id === this.currentElement.getAttribute('id'));
    this.setRecents(selectedObject);
    this.createGeometryStyles();
    // if item comes from Pelias
    if (Object.prototype.hasOwnProperty.call(selectedObject, 'address')) {
      if (selectedObject) {
        this.drawPeliasResult(selectedObject);
      }
    }
    this.resultsBox.innerHTML = '';
  }

  /**
   * This function set search
   *
   * @public
   * @function
   * @param {Node} element - Element clicked
   * @api
   */
  setRecents(element) {
    let recents = JSON.parse(window.localStorage.getItem('recents'));

    if (!recents || recents.length === 0) {
      recents = [element];
    } else if (!this.checkDuplicateRecent(element)) {
      if (recents.length === 5) {
        recents.pop();
        recents.unshift(element);
      } else {
        recents.unshift(element);
      }
    }
    window.localStorage.setItem('recents', JSON.stringify(recents));
  }

  /**
   * This function check duplicates results
   *
   * @public
   * @function
   * @param {Node} element - Element clicked
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
   * This function creates some geometry styles.
   *
   * @public
   * @function
   * @api
   */
  createGeometryStyles() {
    // Shows pin on drawn point
    if (this.pointStyle === 'pinAzul') {
      this.point = new M.style.Point({
        radius: 5,
        icon: {
          src: M.utils.concatUrlPaths([M.config.THEME_URL, '/img/marker.svg']),
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
      this.point = new M.style.Point({
        radius: 5,
        icon: {
          src: M.utils.concatUrlPaths([M.config.THEME_URL, '/img/pinign.svg']),
          anchor: [0.5, 1],
        },
      });
    } else if (this.pointStyle === 'pinMorado') {
      this.point = new M.style.Point({
        radius: 5,
        icon: {
          src: M.utils.concatUrlPaths([M.config.THEME_URL, '/img/m-pin-24.svg']),
          anchor: [0.5, 1],
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
   * This function zooms in MaxExtent of clicked element
   *
   * @public
   * @function
   * @param {string} service - { 'g' | 'n' }
   * @param {string} type - Type of geometry in which we zoom
   * @param {number} zoom - Zoom
   * @api
   */
  zoomInLocation(service, type, zoom, properties) {
    if (this.html_) {
      this.resultsList = this.html_.querySelector('#m-ignsearchlocatorscn-results-list');
    }
    if (this.clickedElementLayer instanceof M.layer.Vector) {
      if (service === 'n' && type === 'Point') {
        this.clickedElementLayer.calculateMaxExtent().then((extent) => {
          this.map.setBbox(extent);
          this.map.setZoom(zoom);
          this.fire('ignsearchlocatorscn:entityFound', [extent]);
        });
      } else {
        const extent = this.clickedElementLayer.getImpl().getOL3Layer().getSource().getExtent();
        this.map.setBbox(extent);
        this.fire('ignsearchlocatorscn:entityFound', [extent]);
      }

      setTimeout(() => {
        // // show popup for streets
        M.config.MOVE_MAP_EXTRACT = true;
        const coordinates = [properties.lng, properties.lat];
        const perfectResult = properties.state;
        this.showSearchPopUp(properties, coordinates, perfectResult);
      }, 300);
    }
  }

  /**
   * This function removes last search layer and adds new layer with current result (from geocoder)
   * features to map, zooms in result, edits popup information and shows a message saying
   *  if it's a perfect result or an approximation.
   *
   * @public
   * @function
   * @param {Object} geoJsonData - Clicked result object
   * @api
   */
  drawPeliasResult(geoJsonData) {
    this.map.removeLayers(this.clickedElementLayer);

    const olFeature = this.getImpl().readFromWKT(geoJsonData);
    const mFeature = M.impl.Feature.olFeature2Facade(olFeature);
    const properties = geoJsonData;
    // Center coordinates
    this.coordinates = `${properties.lat}, ${properties.lng}`;
    // New layer with geometry
    this.clickedElementLayer = new M.layer.GeoJSON({
      name: 'searchresult',
      source: {
        type: 'FeatureCollection',
        features: [],
      },
    }, { displayInLayerSwitcher: false });

    this.clickedElementLayer.displayInLayerSwitcher = false;
    const type = mFeature.getGeometry().type;

    this.clickedElementLayer.on(M.evt.LOAD, () => {
      this.clickedElementLayer.addFeatures(mFeature);
      this.zoomInLocation('g', type, this.zoom, properties);
    });
    this.map.addLayers(this.clickedElementLayer);
    if (type === 'Point') {
      this.clickedElementLayer.setStyle(this.point);
    }

    if (type.indexOf('Polygon') > -1 || type.indexOf('Collection') > -1) {
      this.clickedElementLayer.setStyle(new M.style.Polygon({
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
    this.clickedElementLayer.setZIndex(9999999999999);
    // Stops showing polygon geometry
    if (!this.resultVisibility) {
      this.clickedElementLayer.setStyle(this.simple);
    }
  }

  /**
   * This function inserts a popUp with information about the searched location
   * (and whether it 's an exact result or an approximation)
   *
   * @param {string} addressData - Location address(street, portal, etc.)
   * @param {Array} coordinates - Latitude[0] and longitude[1] coordinates
   * @param {boolean} exactResult - Indicating if the given result is a perfect match
   * @param {Object} e
   * @function
   * @public
   * @api
   */
  showSearchPopUp(addressData, coordinates, exactResult, e = {}) {
    const destinyProj = this.map.getProjection().code;
    const destinySource = 'EPSG:4326';
    const newCoordinates = this.getImpl()
      .reprojectReverse([coordinates[0], coordinates[1]], destinySource, destinyProj);
    let exitState;
    if (exactResult !== 1) {
      exitState = getValue('aprox');
    } else {
      exitState = getValue('exact');
    }
    this.showPopUp(addressData, newCoordinates, coordinates, exitState, e);
  }

  /**
   * This function inserts a popup on the map with information about its location.
   *
   * @param {string} addressData - Location address(street, portal, etc.)
   * @param {Array} mapCoordinates - Latitude[0] and longitude[1] coordinates on map projection
   * @param {Array} featureCoordinates - Latitude[0] and longitude[1] coordinates from feature
   * @param {string} exitState - Indicating if the given result is a perfect match
   * @param {Object} e - Object
   * @param {boolean} hasOffset - Indicating if it has offset
   * @public
   * @function
   * @api
   */

  showPopUp(
    addressData,
    mapcoords,
    featureCoordinates,
    exitState = null,
    e = {},
    hasOffset = true,
  ) {
    const featureTabOpts = { content: '', title: '' };
    const addendum = addressData.native.properties.addendum[this.addendumField];
    const addendumKeys = Object.keys(addendum);
    addendumKeys.sort();
    const addendumElements = addendumKeys.filter((str) => {
      return addendum[str];
    })
      .map((key) => {
        return `<span>${key.toUpperCase()}: </span> ${addendum[key]}`;
      });

    const tab = M.template.compileSync(ignsearchlocatorscnReverse, {
      vars: {
        addressData: {
          ...addressData,
          geom: addressData.geom.replace('POINT', ''),
        },
        addendum,
        addendumHTML: addendumElements,
      },
      parseToHtml: true,
    });

    const addendumDiv = tab.querySelector('#m-ignsearchlocatorscn-addendum');
    addendumElements.forEach((elem) => {
      const divEle = document.createElement('div');
      divEle.innerHTML = elem;
      addendumDiv.appendChild(divEle);
    });

    featureTabOpts.content = tab.innerHTML;
    const myPopUp = new M.Popup({});
    myPopUp.addTab(featureTabOpts);
    this.map.addPopup(myPopUp, [
      mapcoords[0],
      mapcoords[1],
    ]);
    this.popup = myPopUp;

    if (hasOffset && this.pointStyle === 'pinAzul') {
      this.popup.getImpl().setOffset([0, -30]);
    } else if (hasOffset && this.pointStyle === 'pinRojo') {
      this.popup.getImpl().setOffset([2, -30]);
    } else if (hasOffset && this.pointStyle === 'pinMorado') {
      this.popup.getImpl().setOffset([1, -20]);
    }

    this.lat = mapcoords[1];
    this.lng = mapcoords[0];
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
    return control instanceof IGNSearchLocatorscnControl;
  }

  /**
   * This function clears input values
   *
   * @public
   * @function
   * @api
   */
  clearResults() {
    this.searchInput.value = '';
    this.resultsBox.innerHTML = '';
    this.searchValue = '';
    if (this.reverse) {
      this.reverseActivated = false;
      this.html_.querySelector('#m-ignsearchlocatorscn-locate-button').style.color = '#7A7A73';
      document.removeEventListener('keyup', this.checkEscKey);
      document.getElementsByTagName('body')[0].style.cursor = 'auto';
    }
    this.map.removeLayers(this.clickedElementLayer);
    this.map.removePopup(this.map.getPopup());
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    document.getElementsByTagName('body')[0].style.cursor = 'auto';
    document.removeEventListener('keyup', this.checkEscKey);
    this.map.removeLayers(this.clickedElementLayer);
    this.map.removePopup(this.map.getPopup());
  }
}
