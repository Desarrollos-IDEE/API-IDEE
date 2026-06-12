/**
 * @module IDEE/control/InfoCatastroControl
 */
/* eslint-disable no-restricted-syntax */
import template from 'templates/infocatastro';
import InfoCatastroImpl from 'impl/infocatastrocontrol';
import { getValue } from './i18n/language';

export default class InfoCatastroControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(map, zoom, pointStyle, options, positionPlugin) {
    if (IDEE.utils.isUndefined(InfoCatastroImpl) || (IDEE.utils.isObject(InfoCatastroImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(InfoCatastroImpl)))) {
      IDEE.exception(getValue('exception.impl_infocatastro'));
    }
    const impl = new InfoCatastroImpl();
    super(impl, 'InfoCatastroImpl');

    /**
     * CMC_url
     * @private
     * @type {String}
     */
    const defectCMC = 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos';
    this.CMC_url = options.CMC_url || defectCMC;

    /**
     * DNPPP_url
     * @private
     * @type {String}
     */
    const defectDNPP = 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos';
    this.DNPPP_url = options.DNPPP_url || defectDNPP;

    /**
     * CPMRC_url
     * @private
     * @type {String}
     */
    const defectCPMRC = 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC';
    this.CPMRC_url = options.CPMRC_url || defectCPMRC;

    /**
     * catastroWMS
     * @private
     * @type {string}
     */
    this.cadastreWMS = options.cadastreWMS || 'https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR';

    /**
     * zoom
     * @private
     * @type {number}
     */
    this.zoom = zoom;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle = pointStyle;

    /**
     * Map
     */
    this.map = map;

    /**
     * Province code
     * @private
     * @type {string}
     */
    this.provincecode = null;

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
     * Input element for Referencia Catastral
     * @private
     * @type {HTMLElement}
     */
    this.inputRefCatastral = null;

    /**
     * Position plugin
     * @private
     * @type {String}
     */
    this.positionPlugin = positionPlugin;

    /**
     * Tabs
     */
    this.tabs = null;
    this.tabpanels = null;
    this.activeTab = null;
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
    const infocatastroactive = html.querySelector('#m-locator-infocatastro').classList.contains('activated');
    this.deactive();
    if (!infocatastroactive) {
      if (this.positionPlugin === 'TC') {
        document.querySelector('.m-plugin-locator').classList.remove('m-plugin-locator-tc');
        document.querySelector('.m-plugin-locator').classList.add('m-plugin-locator-tc-withpanel');
      }
      this.html_.querySelector('#m-locator-infocatastro').classList.add('activated');
      const panel = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            plot: getValue('plot'),
            searchplot: getValue('searchplot'),
            searchcadastre: getValue('searchcadastre'),
            province: getValue('province'),
            selectprov: getValue('selectprov'),
            municipality: getValue('municipality'),
            selectmuni: getValue('selectmuni'),
            estate: getValue('estate'),
            search: getValue('search'),
            clean: getValue('clean'),
            refCastatro: getValue('refCastatro'),
            insertCadastre: getValue('insertCadastre'),
            notaRef: getValue('notaRef'),
            consultReference: getValue('consultReference'),
          },
        },
      });
      document.querySelector('#div-contenedor-locator').appendChild(panel);

      // Tabs
      this.tabs = this.html_.querySelectorAll('[role=tab]');
      this.activeTab = this.html_.querySelector('[role=tab][aria-selected=true]');
      this.tabpanels = this.html_.querySelectorAll('[role=tabpanel]');

      for (const tab of this.tabs) {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          this.setActiveTab(tab.getAttribute('aria-controls'));
        });
        tab.addEventListener('keyup', (e) => {
          if (e.keyCode === 13 || e.keyCode === 32) { // return or space
            e.preventDefault();
            this.setActiveTab(tab.getAttribute('aria-controls'));
          }
        });
      }
      this.initParams();

      // Buscar parcela
      const buttonParcelSearch = this.html_.querySelector('button#m-infocatastro-searchParams');
      buttonParcelSearch.addEventListener('click', (e) => this.onParamsSearch(e));

      // Limpiar (tab parcela)
      const buttonParcelClean = this.html_.querySelector('button#m-infocatastro-parcela-limpiar');
      buttonParcelClean.addEventListener('click', () => this.clearResults(true, false));

      // Buscar catastro
      const buttonCatastroSearch = this.html_.querySelector('button#m-infocatastro-refCatastral');
      buttonCatastroSearch.addEventListener('click', this.onRCSearch.bind(this));

      // Consultar referencia
      const buttonParamsConsultRef = this.html_.querySelector('button#m-infocatastro-consulRef');
      buttonParamsConsultRef.addEventListener('click', this.onRCConsult.bind(this));

      // Eliminar catastro
      const buttonCatastro = this.html_.querySelector('button#m-infocatastro-catastro-limpiar');
      buttonCatastro.addEventListener('click', () => this.clearResults(false, true));
    }
  }

  /**
   * This function change active tab
   *
   * @function
   * @public
   * @api
   * @param {string} id ID of tab click
   */
  setActiveTab(id) {
    for (const tab of this.tabs) {
      if (tab.getAttribute('aria-controls') === id) {
        tab.setAttribute('aria-selected', 'true');
        tab.focus();
        this.activeTab = tab;
      } else {
        tab.setAttribute('aria-selected', 'false');
      }
    }

    for (const tabpanel of this.tabpanels) {
      if (tabpanel.getAttribute('id') === id) {
        tabpanel.setAttribute('aria-expanded', 'true');
      } else {
        tabpanel.setAttribute('aria-expanded', 'false');
      }
    }
  }

  /**
   * This function deactive control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  deactive() {
    this.html_.querySelector('#m-locator-infocatastro').classList.remove('activated');
    const panel = this.html_.querySelector('#m-infocatastro-panel');
    if (panel) {
      this.clearResults(true, true);
      document.querySelector('#div-contenedor-locator').removeChild(panel);
    }
  }

  /**
   * This function initializes parameters and event listeners
   *
   * @public
   * @function
   * @api
   */
  initParams() {
    this.selectProvincias = this.html_.querySelector('#m-infocatastro-coordinatesSystemParcela>select#m-searchParamsProvincia-select');
    this.selectProvincias.addEventListener('change', (evt) => this.onProvinciaSelect(evt, null));
    if (this.provincecode !== null) {
      this.onProvinciaSelect(null, this.provincecode, this.selectMunicipios);
    }

    this.selectMunicipios = this.html_.querySelector('#m-infocatastro-coordinatesSystemParcela>select#m-searchParamsMunicipio-select');
    this.inputPoligono = this.html_.querySelector('#m-infocatastro-estatePlot>#m-searchParamsPoligono-input');
    this.inputParcela = this.html_.querySelector('#m-infocatastro-estatePlot>#m-searchParamsParcela-input');
    this.inputRefCatastral = this.html_.querySelector('#m-infocatastro-coordinatesSystemRefCatastral>#m-refCatastral-input');
  }

  /**
   * This function clears drawn geometry from map and inputs.
   *
   * @public
   * @function
   * @param {boolean} clearParcela - Indicating if it clears inputs from tab "Buscar Parcela"
   * @param {boolean} clearCatastro - Indicating if it clears inputs from tab "Buscar Catastro"
   * @api
   */
  clearResults(clearParcela = true, clearCatastro = true) {
    if (clearParcela) {
      this.selectProvincias.value = '0';
      this.provincecode = '0';
      this.clearMunicipiosSelect();
      this.inputPoligono.value = null;
      this.inputParcela.value = null;
      const layer = this.map.getLayers().find((l) => l.name === 'coordinateparcel');
      this.map.removeLayers(layer);
    }
    if (clearCatastro) {
      this.inputRefCatastral.value = null;
      const layer = this.map.getLayers().find((l) => l.name === 'coordinatecatastro');
      this.map.removeLayers(layer);
      this.map.removePopup(this.map.getPopup());
    }
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this.html_ && this.html_.querySelector('button#m-infocatastro-consulRef')) {
      this.html_.querySelector('button#m-infocatastro-consulRef').removeEventListener('click', this.onRCConsult);
    }
    const layer = this.map.getLayers().filter((l) => l.name === 'coordinatecatastro' || l.name === 'coordinateparcel');
    this.map.removeLayers(layer);
    this.map.removePopup(this.map.getPopup());
  }

  /**
   * Handler for selecting an option on Provincia select
   *
   * @public
   * @function
   * @param {Event} e - Event
   * @param {string} idprov - Province code of select
   * @param {string} mun - Municipality code of select
   * @api
   */
  onProvinciaSelect(e, idprov, mun) {
    let provinceCode = null;
    if (e != null) {
      const elt = e.target;
      provinceCode = elt.value;
    } else {
      provinceCode = idprov;
    }
    this.clearMunicipiosSelect();
    if (provinceCode !== '0') {
      IDEE.remote.get(this.CMC_url, {
        CodigoProvincia: provinceCode,
        CodigoMunicipio: '',
        CodigoMunicipioIne: '',
      }).then((res) => {
        this.loadMunicipiosSelect(res, mun);
      });
    }
  }

  /**
   * Clears options set to Municipios select
   *
   * @public
   * @function
   * @api
   */
  clearMunicipiosSelect() {
    this.selectMunicipios = this.html_.querySelector('#m-infocatastro-coordinatesSystemParcela>select#m-searchParamsMunicipio-select');
    while (this.selectMunicipios.firstChild) {
      this.selectMunicipios.removeChild(this.selectMunicipios.firstChild);
    }
    const option = document.createElement('option');
    option.value = '0';
    option.innerHTML = getValue('selectmuni');
    this.selectMunicipios.appendChild(option);
  }

  /**
   * Loads and renders options set to Municipios select
   *
   * @public
   * @function
   * @param {Object} response - Response
   * @param {string} mun - Municipality code of select
   * @api
   */
  loadMunicipiosSelect(response, mun) {
    if ((response.code === 200) && (response.error === false)) {
      const rootElement = response.xml.getElementsByTagName('consulta_municipiero')[0];
      const rootMunicipios = rootElement.getElementsByTagName('municipiero')[0];
      const muniNodes = rootMunicipios.getElementsByTagName('muni');
      for (let i = 0; i < muniNodes.length; i += 1) {
        const option = document.createElement('option');
        const locat = muniNodes[i].getElementsByTagName('locat')[0];
        option.value = locat.getElementsByTagName('cmc')[0].childNodes[0].nodeValue;
        option.innerHTML = muniNodes[i].getElementsByTagName('nm')[0].childNodes[0].nodeValue;
        this.selectMunicipios.appendChild(option);
      }
      if (mun !== undefined && mun !== null) {
        this.selectMunicipios.value = this.municipalityvalue;
      }
    } else {
      IDEE.dialog.error(getValue('exception.apiideerror'));
    }
  }

  /**
   * Handler for search with params button
   *
   * @public
   * @function
   * @param {Event} evt - Event
   * @api
   */
  onParamsSearch(evt) {
    evt.preventDefault();
    this.clearResults(false, true);
    this.inputPoligono = this.html_.querySelector('#m-infocatastro-estatePlot>#m-searchParamsPoligono-input');
    this.inputParcela = this.html_.querySelector('#m-infocatastro-estatePlot>#m-searchParamsParcela-input');

    if ((evt.type !== 'keyup') || (evt.keyCode === 13)) {
      if (IDEE.utils.isNullOrEmpty(this.selectProvincias.value) || this.selectProvincias.value === '0') {
        IDEE.dialog.info(getValue('exception.no_province'));
        return;
      }
      if (IDEE.utils.isNullOrEmpty(this.selectMunicipios.value) || this.selectMunicipios.value === '0') {
        IDEE.dialog.info(getValue('exception.no_mun'));
        return;
      }
      if (IDEE.utils.isNullOrEmpty(this.inputPoligono.value)) {
        IDEE.dialog.info(getValue('exception.no_polygon'));
        return;
      }
      if (IDEE.utils.isNullOrEmpty(this.inputParcela.value)) {
        IDEE.dialog.info(getValue('exception.no_parcel'));
        return;
      }

      const searchUrl = IDEE.utils.addParameters(this.DNPPP_url, {
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
      });
    }
  }

  /**
   * Checks if response is valid
   *
   * @private
   * @function
   * @param {Object} response - Response
   * @api
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
          success = false;
          IDEE.dialog.info(errorDescTxt);
        }
      } else {
        success = false;
        IDEE.dialog.error(getValue('exception.apiideerror'));
      }
    } catch (err) {
      success = false;
      IDEE.exception(`${getValue('exception.json_invalid')} ${err}.`);
    }
    return success;
  }

  /**
   * This function parse results for template
   *
   * @param {Object} response - Response
   * @public
   * @function
   * @api
   */
  parseParamsResultsForTemplate_(response) {
    let rcNode;
    const rootElement = response.getElementsByTagName('consulta_dnp')[0];
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

    const searchUrl = IDEE.utils.addParameters(this.CPMRC_url, {
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

        this.locator_([xcen, ycen], 'parcel');
      }
    });
  }

  /**
   * Parses CPMRC results
   *
   * @private
   * @function
   * @param {XMLDocument} xmlResults - XML
   * @returns {Object} CPMRC results parsed
   * @api
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
   * This function centers the map on given point
   *
   * @public
   * @function
   * @param {Array<number>} coords - coordinates writen by user
   * @param {string} type - type search
   * @api
   */
  locator_(coords, type = 'cadastre') {
    const x = coords[0];
    const y = coords[1];
    const xFloat = parseFloat(x);
    const yFloat = parseFloat(y);
    const someCoordinatesLayerInMap = this.coordinatesLayer ? this.map.getLayers()
      .some((l) => this.coordinatesLayer.idLayer === l.idLayer) : false;

    if (someCoordinatesLayerInMap) {
      this.map.removeLayers(this.coordinatesLayer);
    }

    if (!Number.isNaN(xFloat) && !Number.isNaN(yFloat)) {
      this.map.setCenter(`${xFloat},${yFloat}*false`);
      this.map.setZoom(this.zoom);
      this.fire('infocatastro:locationCentered', [{
        zoom: this.zoom,
        center: [xFloat, yFloat],
      }]);

      this.coordinatesLayer = new IDEE.layer.Vector({
        name: type === 'cadastre' ? 'coordinatecatastro' : 'coordinateparcel',
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
      this.createGeometryStyles();
    } else {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
    }
  }

  /**
   * This function creates the style of the geometry according
   * to the user parameter
   *
   * @function
   * @public
   * @api
   */
  createGeometryStyles() {
    let style = {
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
    };

    if (this.pointStyle === 'pinAzul') {
      style = {
        radius: 5,
        icon: {
          src: `${IDEE.config.STATIC_RESOURCES_URL}/Simbologia/svg/marcadores/marker.svg`,
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
      };
    } else if (this.pointStyle === 'pinRojo') {
      style = {
        radius: 5,
        icon: {
          src: `${IDEE.config.STATIC_RESOURCES_URL}/Simbologia/svg/marcadores/pinign.svg`,
        },
      };
    } else if (this.pointStyle === 'pinMorado') {
      style = {
        radius: 5,
        icon: {
          src: `${IDEE.config.STATIC_RESOURCES_URL}/Simbologia/svg/marcadores/m-pin-24.svg`,
        },
      };
    }
    this.coordinatesLayer.setStyle(new IDEE.style.Point(style));
    // Change zIndex value
    this.coordinatesLayer.setZIndex(999999999999999);

    this.map.addLayers(this.coordinatesLayer);
  }

  /**
   * Handler for search with RC button
   *
   * @public
   * @function
   * @param {Event} evt - Event
   * @api
   */
  onRCSearch(evt) {
    evt.preventDefault();
    this.clearResults(true, false);
    this.inputRefCatastral = this.html_.querySelector('#m-infocatastro-coordinatesSystemRefCatastral>#m-refCatastral-input');
    let refcatastral = this.inputRefCatastral.value.trim();
    if ((evt.type !== 'keyup') || (evt.keyCode === 13)) {
      if (IDEE.utils.isNullOrEmpty(refcatastral)) {
        IDEE.dialog.info(getValue('exception.no_refcatastro'));
      } else {
        refcatastral = refcatastral.substr(0, 14);
        const searchUrl = IDEE.utils.addParameters(this.CPMRC_url, {
          Provincia: '',
          Municipio: '',
          SRS: this.map.getProjection().code,
          RC: refcatastral,
        });
        IDEE.remote.get(searchUrl).then((response) => {
          const success = this.acceptOVCSW(response);
          if (success) {
            const docs = this.parseCPMRCResults(response.xml);
            this.rcResults_ = [docs];
            const resultsTemplateVars = {
              docs: this.rcResults_,
              total: this.rcResults_.length,
              partial: false,
              notResutls: false,
              query: refcatastral,
            };
            Promise.resolve(resultsTemplateVars).then((resultTemplate) => {
              this.drawGeocoderResultRC(resultTemplate);
            });
          }
        });
      }
    }
  }

  /**
   * This function removes last search layer and adds new layer with current result (from geocoder)
   * features to map, zooms in result, edits popup information and shows a message saying
   *  if it's a perfect result or an approximation.
   *
   * @public
   * @function
   * @param {Object} geoJsonData - clicked result object
   * @api
   */
  drawGeocoderResultRC(geoJsonData) {
    const attri = geoJsonData.docs[0];

    // Center coordinates
    this.coordinates = `${attri.coords[0].xcen}, ${attri.coords[0].ycen}`;
    const coords = [parseFloat(attri.coords[0].xcen), parseFloat(attri.coords[0].ycen)];

    this.locator_(coords, this.point);

    // show popup for streets
    const fullAddress = attri.attributes[1].value;

    // inserts a popUp with information about the searched location
    const target = 'EPSG:4326';
    const source = this.map.getProjection().code;
    const newCoords = this.getImpl().reprojectReverse([coords[0], coords[1]], source, target);
    const exitState = getValue('exact');

    this.showPopUp(fullAddress, coords, newCoords, exitState, { fake: true });

    const x = coords[0];
    const y = coords[1];
    const xFloat = parseFloat(x);
    const yFloat = parseFloat(y);
    this.map.setCenter(`${xFloat},${yFloat}*false`);
  }

  /**
   * This function inserts a popup on the map with information about its location.
   *
   * @param {string} fullAddress - Location address(street, portal, etc.)
   * @param {Array} mapCoordinates - Latitude[0] and longitude[1] coordinates on map projection
   * @param {Array} featureCoordinates - Latitude[0] and longitude[1] coordinates from feature
   * @param {string} exitState - Indicating if the given result is a perfect match
   * @param {Object} e - Object
   * @public
   * @function
   * @api
   */
  showPopUp(fullAddress, mapcoords, featureCoordinates, exitState = null, e = {}) {
    const featureTabOpts = { content: '', title: '' };
    if (exitState !== null) {
      featureTabOpts.content += `<div><b>${exitState}</b></div>`;
    }

    featureTabOpts.content += `<div><b>${fullAddress !== undefined ? fullAddress : '-'}</b></div><br/>
                  <div class='ignsearchlocator-popup'><b>Lon:</b> ${featureCoordinates[0].toFixed(6)} </div>
                  <div class='ignsearchlocator-popup'><b>Lat:</b> ${featureCoordinates[1].toFixed(6)}</div>
                  `;

    const myPopUp = new IDEE.Popup({ panMapIfOutOfView: !e.fake });
    myPopUp.addTab(featureTabOpts);
    this.map.addPopup(myPopUp, [
      mapcoords[0],
      mapcoords[1],
    ]);
    this.popup = myPopUp;
    if (this.pointStyle === 'pinAzul') {
      this.popup.getImpl().setOffset([0, -30]);
    } else if (this.pointStyle === 'pinRojo') {
      this.popup.getImpl().setOffset([2, -15]);
    } else if (this.pointStyle === 'pinMorado') {
      this.popup.getImpl().setOffset([1, -10]);
    }
    this.lat = mapcoords[1];
    this.lng = mapcoords[0];
  }

  /**
   * Handler for search with RC button
   *
   * @public
   * @function
   * @param {Event} evt - Event
   * @api
   */
  onRCConsult(evt) {
    evt.preventDefault();

    // Se cambia al cursor a una cruz.
    document.body.style.cursor = 'crosshair';
    this.clearResults(true, true);

    this.map.on(IDEE.evt.CLICK, this.buildUrl_, this);
  }

  /**
   * This function builds the query URL and shows results
   *
   * @private
   * @function
   * @param {ol.MapBrowserPointerEvent} evt - Browser point event
   * @api
   */
  buildUrl_(evt) {
    const options = {
      jsonp: true,
    };

    const srs = this.map.getProjection().code;
    IDEE.remote.get(this.cadastreWMS, {
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
   * @param {array} coordinates - Coordinate position onClick
   * @api
   */
  showInfoFromURL_(response, coordinates) {
    if ((response.code === 200) && (response.error === false)) {
      const infos = [];
      const info = response.text;
      const formatedInfo = this.formatInfo_(info);
      infos.push(formatedInfo);

      const tab = {
        icon: 'locator-icon-pin',
        title: this.POPUP_TITLE,
        content: infos.join(''),
      };

      let popup = this.map.getPopup();

      if (!IDEE.utils.isNullOrEmpty(popup) && popup.getCoordinate()[0] === coordinates[0]
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
      IDEE.dialog.error(getValue('exception.apiideerror'));
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
      valuePopup = getValue('exception.noInfo');
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

    let formatedInfo = `${IDEE.utils.beautifyAttribute(getValue('cadastral_information'))}
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
      formatedInfo = `${IDEE.utils.beautifyAttribute(getValue('cadastral_information'))}
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
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof InfoCatastroControl;
  }
}
