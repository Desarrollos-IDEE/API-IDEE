/**
 * @module IDEE/control/InfocoordinatesControl
 */
import InfocoordinatesImplControl from 'impl/infocoordinatescontrol';
import template from 'templates/infocoordinates';
import { getValue } from './i18n/language';

/* global navigator */
/* global FileReader */
/* global MouseEvent */
const NO_DATA_VALUE = -9999;

export default class InfocoordinatesControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  // constructor(decimalGEOcoord, decimalUTMcoord, helpUrl, order, outputDownloadFormat) {
  constructor(options = {}) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(InfocoordinatesImplControl)
      || (IDEE.utils.isObject(InfocoordinatesImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(InfocoordinatesImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new InfocoordinatesImplControl();
    super('Infocoordinates', impl, options);
    this.map = null;
    this.numTabs = 0;
    this.layerFeatures = new IDEE.layer.Vector();
    this.layerFeatures.name = 'infocoordinatesLayerFeatures';
    this.layerFeatures.displayInLayerSwitcher = false;
    this.decimalGEOcoord_ = options.decimalGEOcoord;
    this.decimalUTMcoord_ = options.decimalUTMcoord;
    this.helpUrl = options.helpUrl;
    this.clickedDeactivate = false;
    this.order = options.order;
    this.outputDownloadFormat = options.outputDownloadFormat;
    this.projections = IDEE.impl.ol.js.projections.getSupportedProjs();
    this.selectedProjection = null;
    this.displayON = false;
    this.epsgResults = options.epsgResults;
    this.epsgResultsTemplate = null;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  async createView(map) {
    this.map_ = map;
    this.selectedProjection = this.map_.getProjection().code;
    this.isProjGeographic = this.getImpl().isProjGeographic(this.selectedProjection);
    if (!IDEE.template.compileSync) { // JGL: retrocompatibilidad API IDEE
      IDEE.template.compileSync = (string, options) => {
        let templateCompiled;
        let templateVars = {};
        let parseToHtml;
        if (!IDEE.utils.isUndefined(options)) {
          templateVars = IDEE.utils.extends(templateVars, options.vars);
          parseToHtml = options.parseToHtml;
        }
        const templateFn = Handlebars.compile(string);
        const htmlText = templateFn(templateVars);
        if (parseToHtml !== false) {
          templateCompiled = IDEE.utils.stringToHtml(htmlText);
        } else {
          templateCompiled = htmlText;
        }
        return templateCompiled;
      };
    }

    if (this.epsgResults) {
      const validated = [];
      const results = await Promise.all(
        this.epsgResults.map(async (epsg) => {
          const valid = await IDEE.impl.ol.js.projections.ensureProjection(epsg);
          if (!valid) {
            IDEE.dialog.error(`${getValue('exception.epsgResultsInvalid')}${epsg}`);
          }
          return valid ? epsg : null;
        }),
      );
      validated.push(...results.filter(Boolean));
      this.epsgResults = validated.length > 0 ? validated : null;
      if (this.epsgResults) {
        this.epsgResultsTemplate = this.epsgResults.map((code) => ({
          code,
          safeCode: code.replace(':', '-'),
          isGeo: this.getImpl().isProjGeographic(code),
        }));
      }
    }

    const templateOptions = {
      jsonp: true,
      vars: {
        hasEpsgResults: !!this.epsgResults,
        epsgResultsTemplate: this.epsgResultsTemplate,
        hasHelp: this.helpUrl !== undefined && IDEE.utils.isUrl(this.helpUrl),
        helpUrl: this.helpUrl,
        projections: this.projections,
        datum: this.getImpl().datumCalc(this.selectedProjection),
        geographicProj: this.isProjGeographic,
        translations: {
          title: getValue('title'),
          point: getValue('point'),
          datum: getValue('datum'),
          latitude: getValue('latitude'),
          longitude: getValue('longitude'),
          formatCoordinates: getValue('formatCoordinates'),
          coordX: getValue('coordX'),
          coordY: getValue('coordY'),
          altitude: getValue('altitude'),
          removePoint: getValue('removePoint'),
          removeAllPoints: getValue('removeAllPoints'),
          importAllPoints: getValue('importAllPoints'),
          copyLatLon: getValue('copyLatLon'),
          copyxy: getValue('copyxy'),
          copyAllPoints: getValue('copyAllPoints'),
          displayONAllPoints: getValue('displayONAllPoints'),
          displayOFFAllPoints: getValue('displayOFFAllPoints'),
          select_srs: getValue('select_srs'),
          choose_create_epsg: getValue('choose_create_epsg'),
        },
      },
    };

    const html = IDEE.template.compileSync(template, templateOptions);

    if (!this.epsgResults) {
      this.initCustomDropdown(html);
    }
    this.accessibilityTab(html);
    this.map.addLayers(this.layerFeatures);

    html.querySelector('#m-infocoordinates-buttonRemoveAllPoints').addEventListener('click', this.removeAllPoints.bind(this));
    html.querySelector('#m-infocoordinates-buttonImportAllPoints').addEventListener('click', this.importAllPoints.bind(this));
    html.querySelector('#m-infocoordinates-buttonCopyAllPoints').addEventListener('click', this.copyAllPoints.bind(this));
    html.querySelector('#m-infocoordinates-buttonDisplayAllPoints').addEventListener('click', this.displayAllPoints.bind(this));
    html.querySelector('#m-infocoordinates-buttonConversorFormat').addEventListener('change', this.changeSelectSRSorChangeFormat.bind(this));
    html.querySelector('#m-infocoordinates-buttonRemovePoint').addEventListener('click', this.removePoint.bind(this));

    if (!this.epsgResults) {
      html.querySelector('#m-infocoordinates-copylatlon').addEventListener('click', this.copylatlon.bind(this));
      html.querySelector('#m-infocoordinates-copyxy').addEventListener('click', this.copyxy.bind(this));
      (this.isProjGeographic
        ? html.querySelector('#m-infocoordinates-geo-coords')
        : html.querySelector('#m-infocoordinates-utm-coords')
      ).classList.remove('noDisplay');
    } else {
      html.querySelectorAll('.m-infocoordinates-copylatlon-btn').forEach((btn) => {
        btn.addEventListener('click', () => this.copylatlonMulti(btn.dataset.epsg));
      });
      html.querySelectorAll('.m-infocoordinates-copyxy-btn').forEach((btn) => {
        btn.addEventListener('click', () => this.copyxyMulti(btn.dataset.epsg));
      });
    }

    const helpBtn = html.querySelector('#m-infocoordinates-help-icon');
    if (helpBtn) helpBtn.addEventListener('click', this.showHelp.bind(this));

    return html;
  }

  /**
   * This function initializes the custom dropdown for SRS selection
   * @param {*} html
   *
   * @public
   * @function
   * @api stable
   */
  initCustomDropdown(html) {
    const input = html.querySelector('#m-infocoordinates-epsg-selected');
    const selector = html.querySelector('#m-infocoordinates-srs-selector');
    const arrow = html.querySelector('.arrow-down');
    let isEditable = false;

    input.setAttribute('readonly', 'readonly');
    input.value = this.selectedProjection;

    const openDropdown = () => {
      if (!isEditable) {
        this.refreshProjectionsSelector(selector);
        selector.classList.remove('noDisplay');
        arrow.classList.add('arrow-up');
      }
    };

    const closeDropdown = () => {
      selector.classList.add('noDisplay');
      arrow.classList.remove('arrow-up');
    };

    input.addEventListener('focus', openDropdown);
    input.addEventListener('blur', () => {
      // We need a small delay to allow the mousedown on an option to fire
      setTimeout(closeDropdown, 200);
    });

    selector.addEventListener('mousedown', (event) => {
      // Evita el blur del input al elegir opción o usar la barra de scroll.
      // Sin esto, el blur cierra la lista al interactuar con el scrollbar.
      event.preventDefault();
      const { target } = event;
      if (target.tagName === 'A') {
        const value = target.getAttribute('value');
        if (value === 'default') {
          isEditable = true;
          input.removeAttribute('readonly');
          input.value = '';
          input.placeholder = getValue('placeholder_custom_epsg');
          closeDropdown();
          input.focus();
        } else if (value) {
          input.value = value;
          this.changeSelectSRSorChangeFormat();
          closeDropdown();
          input.blur();
        }
      }
    });

    arrow.addEventListener('click', () => {
      if (selector.classList.contains('noDisplay')) {
        this.refreshProjectionsSelector(selector);
      }
      selector.classList.toggle('noDisplay');
      arrow.classList.toggle('arrow-up');
    });

    input.addEventListener('keyup', (event) => {
      if (isEditable && event.key === 'Enter') {
        isEditable = false;
        input.setAttribute('readonly', 'readonly');
        this.changeSelectSRSorChangeFormat();
      }
    });
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    this.invokeEscKey();
    this.map.on(IDEE.evt.CLICK, this.addPoint, this);
    document.body.style.cursor = 'crosshair';
    this.map.getFeatureHandler().deactivate();
    document.addEventListener('keyup', this.checkEscKey.bind(this));
  }

  checkEscKey(evt) {
    const panelElement = document.querySelector('div.m-panel.m-plugin-infocoordinates');

    if (panelElement) {
      const opened = panelElement.classList.contains('opened');
      if (evt.key === 'Escape' && opened) {
        const buttonElement = panelElement.querySelector('button');
        if (buttonElement) {
          buttonElement.click();
        }
        document.removeEventListener('keyup', this.checkEscKey);
      }
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
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.clickedDeactivate = true;
    this.map.un(IDEE.evt.CLICK, this.addPoint, this);
    document.body.style.cursor = 'default';
    this.map.getFeatureHandler().activate();
  }

  addPoint(evt) {
    const numPoint = this.numTabs + 1;

    if (!this.epsgResults) {
      document.getElementById('m-infocoordinates-srs-selector').removeAttribute('disabled');
    }

    if (this.numTabs === 0) {
      document.getElementById('m-infocoordinates-buttonRemovePoint').classList.remove('noDisplay');
      if (!this.epsgResults) {
        document.getElementById('m-infocoordinates-copylatlon').classList.remove('noDisplay');
      }

      document.getElementsByClassName('m-infocoordinates-div-buttonRemoveAllPoints')[0].classList.remove('noDisplay');
      document.getElementsByClassName('m-infocoordinates-div-buttonImportAllPoints')[0].classList.remove('noDisplay');
      document.getElementsByClassName('m-infocoordinates-div-buttonCopyAllPoints')[0].classList.remove('noDisplay');
      document.getElementsByClassName('m-infocoordinates-div-buttonDisplayAllPoints')[0].classList.remove('noDisplay');
    }

    // Mostramos la barra de herramientas inferior
    const toolbar = document.querySelector('.infocoordinates-toolbar');
    if (toolbar) {
      toolbar.style.display = 'flex';
    }

    // Eliminamos las etiquetas de los puntos
    if (this.displayON && this.map.getMapImpl().getOverlays().getLength() > 0) {
      this.removeAllDisplaysPoints();
    }

    // Agrego la tab que es un botón con el número de punto
    const tabsDiv = document.getElementsByClassName('m-infocoordinates-tabs')[0];
    const buttonTab = document.createElement('button');
    const buttonTabText = document.createTextNode(numPoint);
    buttonTab.appendChild(buttonTabText);
    buttonTab.classList.add('tablinks');
    buttonTab.setAttribute('id', `tablink${numPoint}`);
    buttonTab.setAttribute('tabindex', '0');
    buttonTab.setAttribute('type', 'button');
    tabsDiv.appendChild(buttonTab);

    // cojo las coordenadas del punto pinchado
    const coordinates = evt.coord;

    // Agrego la feature
    const featurePoint = new IDEE.Feature(numPoint, {
      'type': 'Feature',
      'id': numPoint,
      'geometry': {
        'type': 'Point',
        'coordinates': [coordinates[0], coordinates[1]],
      },
      'properties': {
        'EPSGcode': this.map.getProjection().code,
        'coordinates': [coordinates[0], coordinates[1]],
      },

    });

    // Ubico el scroller centrado en el ultimo botón añadido
    tabsDiv.scrollTop = tabsDiv.scrollHeight;

    // Altura
    let altitudeFromElevationProcess;
    const altitudeBox = document.getElementById('m-infocoordinates-altitude');

    const promesa = new Promise((success) => {
      altitudeBox.innerHTML = getValue('readingAltitude');
      altitudeFromElevationProcess = this.getImpl()
        .readAltitudeFromElevationProcess(coordinates, this.map.getProjection().code.split(':')[1]);
      success(altitudeFromElevationProcess);
    });

    // IDEE.proxy(false);
    promesa.then((response) => {
      // IDEE.proxy(true);
      if (!response || response === NO_DATA_VALUE) {
        altitudeFromElevationProcess = getValue('noDatafromElevationProcess');
      } else {
        altitudeFromElevationProcess = parseFloat(response).toFixed(2);
      }
      featurePoint.setAttribute('Altitude', altitudeFromElevationProcess);
      altitudeBox.innerHTML = altitudeFromElevationProcess;
      buttonTab.addEventListener('click', () => this.openTabFromTab(numPoint));
    }).catch(() => {
      // IDEE.proxy(true);
    });

    this.layerFeatures.addFeatures([featurePoint]);
    this.layerFeatures.setZIndex(999);
    this.openTab(numPoint);
    this.numTabs = numPoint;
  }

  activateSelection() {
    const olMap = this.facadeMap_.getMapImpl();
    const facadeControl = this.facadeControl;
    const drawingLayer = facadeControl.drawLayer.getImpl().getLayer();

    this.facadeControl.hideTextPoint();

    if (document.querySelector('.m-geometrydraw>#downloadFormat') !== null) {
      document.querySelector('.m-geometrydraw').removeChild(facadeControl.downloadingTemplate);
    }

    if (drawingLayer) {
      this.select = new ol.interaction.Select({
        wrapX: false,
        layers: [drawingLayer],
      });

      this.select.on('select', (e) => {
        if (e.target.getFeatures().getArray().length > 0) {
          this.facadeControl.onSelect(e);
        }
      });

      olMap.addInteraction(this.select);

      this.edit = new ol.interaction.Modify({ features: this.select.getFeatures() });
      this.edit.on('modifyend', (evt) => {
        this.facadeControl.onModify();
      });
      olMap.addInteraction(this.edit);
    }
  }

  selectFeature(numPoint) {
    this.point = new IDEE.style.Point({
      icon: {
        form: IDEE.style.form.NONE,
        class: '+',
        fontsize: 1.5,
        radius: 10,
        color: 'black',
        fill: 'white',
      },
    });

    this.pointDisable = new IDEE.style.Point({
      radius: 5,
      icon: {
        form: 'none',
        class: '+',
        radius: 15,
        rotation: 0,
        rotate: false,
        offset: [0, 0],
        color: '#2690e7',
        opacity: 1,
        stroke: {
          width: 20,
        },
      },
    });

    const countPoints = document.getElementsByClassName('contenedorPunto').length + document.getElementsByClassName('contenedorPuntoSelect').length;
    if (numPoint > countPoints) {
      this.displayPoint(numPoint);
    } else {
      const currentSelected = document.querySelector('.contenedorPuntoSelect');
      if (currentSelected) {
        currentSelected.classList.replace('contenedorPuntoSelect', 'contenedorPunto');
      }
      document.querySelectorAll('.contenedorPunto').forEach((elem) => {
        if (parseInt(elem.textContent.trim(), 10) === numPoint) {
          elem.classList.replace('contenedorPunto', 'contenedorPuntoSelect');
        }
      });

      if (this.displayON && this.map.getMapImpl().getOverlays().getLength() > 0) {
        this.removeAllDisplaysPoints();
      }
    }

    this.layerFeatures.getFeatures().map((elemento) => (elemento.setStyle(this.pointDisable)));
    const featureSelected = this.layerFeatures.getFeatureById(numPoint);
    featureSelected.setStyle(this.point);
  }

  displayPoint(numPoint) {
    const pos = this.layerFeatures.getImpl()
      .getFeatures(true)[numPoint - 1].getImpl().getFeature().getProperties().coordinates;

    // Modificamos el color del estilo de los puntos anteriores.
    if (numPoint > 1) {
      document.getElementsByClassName('contenedorPuntoSelect')[0].classList.replace('contenedorPuntoSelect', 'contenedorPunto');
    }

    const textHTML = `<div class="contenedorPuntoSelect">
                <table>
                    <tbody>
                      <tr>
                        <td style="font-weight: var(--idee-font-weight-bold);">${numPoint}</td></b>
                      </tr>
                    </tbody>
                </table>
            </div>
          </div>
      </div>`;

    const helpTooltipElement = IDEE.template.compileSync(textHTML, {
      jsonp: true,
      vars: {
        translations: getValue('text'),
      },
    });

    this.helpTooltip_ = new ol.Overlay({
      element: helpTooltipElement,
      offset: [10, -5],
    });

    this.helpTooltip_.setPosition(pos);
    this.map.getMapImpl().addOverlay(this.helpTooltip_);
  }

  activateTab(numPoint) {
    const allTabsLinks = document.getElementsByClassName('tablinks');
    for (let i = 0; i < allTabsLinks.length; i += 1) {
      allTabsLinks[i].classList.remove('active');
    }
    const idBotonTab = document.getElementById(`tablink${numPoint}`);
    idBotonTab.classList.add('active');
  }

  /**
   * Refresca el listado de proyecciones del selector de EPSG con las
   * proyecciones actualmente soportadas, incluyendo las registradas
   * al vuelo por otros plugins.
   * @param {HTMLElement} selector Elemento <ul> del selector de EPSG
   * @public
   * @function
   * @api
   */
  refreshProjectionsSelector(selector) {
    this.projections = IDEE.impl.ol.js.projections.getSupportedProjs();
    // eslint-disable-next-line no-param-reassign
    selector.innerHTML = `
      <li><a class="m-infocoordinates-option-disabled" href="#" value="default" tabindex="-1" disabled>
          ${getValue('choose_create_epsg')}
      </a></li>
      ${this.projections.map((proj) => `
          <li>
              <a href="#" value="${proj.codes[0]}">
                  ${proj.codes[0]}
              </a>
          </li>
      `).join('')}
    `;
  }

  changeSelectSRSorChangeFormat() {
    // Cojo la tab activa
    const elem = document.querySelector('.tablinks.active');
    if (elem !== null) {
      const numPoint = Number(elem.textContent);
      this.displayXYcoordinates(numPoint);
    }
  }

  async displayXYcoordinates(numPoint) {
    const featureSelected = this.layerFeatures.getFeatureById(numPoint);
    const pointBox = document.getElementById('m-infocoordinates-point');
    const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

    if (this.epsgResults) {
      pointBox.innerHTML = numPoint;
      const gmsButtonMulti = document.getElementById('m-infocoordinates-buttonConversorFormat');
      if (this.epsgResultsTemplate.some((e) => e.isGeo)) {
        gmsButtonMulti.removeAttribute('disabled');
      }
      this.epsgResultsTemplate.forEach(({ code, safeCode, isGeo }) => {
        const pointDataOutput = this.getImpl().getCoordinates(
          featureSelected,
          code,
          formatGMS,
          this.decimalGEOcoord_,
          this.decimalUTMcoord_,
        );

        const datumEl = document.getElementById(`m-infocoordinates-datum-${safeCode}`);
        if (datumEl) datumEl.innerHTML = pointDataOutput.projectionUTM.datum;

        if (isGeo) {
          const latEl = document.getElementById(`m-infocoordinates-latitude-${safeCode}`);
          const lonEl = document.getElementById(`m-infocoordinates-longitude-${safeCode}`);
          const geoCoords = pointDataOutput.projectionGEO.coordinatesGEO;
          if (latEl) latEl.innerHTML = `${geoCoords.latitude}`.replace('.', ',');
          if (lonEl) lonEl.innerHTML = `${geoCoords.longitude}`.replace('.', ',');
        } else {
          const xEl = document.getElementById(`m-infocoordinates-coordX-${safeCode}`);
          const yEl = document.getElementById(`m-infocoordinates-coordY-${safeCode}`);
          if (xEl) {
            xEl.innerHTML = this.formatUTMCoordinate(
              pointDataOutput.projectionUTM.coordinatesUTM.coordX,
            );
          }
          if (yEl) {
            yEl.innerHTML = this.formatUTMCoordinate(
              pointDataOutput.projectionUTM.coordinatesUTM.coordY,
            );
          }
        }
      });
    } else {
      const latitudeBox = document.getElementById('m-infocoordinates-latitude');
      const longitudeBox = document.getElementById('m-infocoordinates-longitude');
      const datumBox = document.getElementById('m-infocoordinates-datum');
      const coordX = document.getElementById('m-infocoordinates-coordX');
      const coordY = document.getElementById('m-infocoordinates-coordY');
      const inputSRS = document.querySelector('.m-infocoordinates-input-select');
      const selector = document.querySelector('#m-infocoordinates-srs-selector');

      const selectSRS = !inputSRS.value.startsWith('EPSG:') ? `EPSG:${inputSRS.value}` : inputSRS.value;

      if (!await IDEE.impl.ol.js.projections.ensureProjection(selectSRS)) {
        IDEE.dialog.error(`${getValue('exception.srs')} ${this.selectedProjection}`);
      } else {
        this.selectedProjection = selectSRS;
      }
      const pointDataOutput = this.getImpl().getCoordinates(
        featureSelected,
        this.selectedProjection,
        formatGMS,
        this.decimalGEOcoord_,
        this.decimalUTMcoord_,
      );
      inputSRS.value = this.selectedProjection;
      this.isProjGeographic = this.getImpl().isProjGeographic(this.selectedProjection);
      const gmsButton = document.getElementById('m-infocoordinates-buttonConversorFormat');
      if (this.isProjGeographic) {
        document.getElementById('m-infocoordinates-geo-coords').classList.remove('noDisplay');
        document.getElementById('m-infocoordinates-utm-coords').classList.add('noDisplay');
        gmsButton.removeAttribute('disabled');
      } else {
        document.getElementById('m-infocoordinates-geo-coords').classList.add('noDisplay');
        document.getElementById('m-infocoordinates-utm-coords').classList.remove('noDisplay');
        gmsButton.checked = false;
        gmsButton.setAttribute('disabled', 'disabled');
      }
      this.refreshProjectionsSelector(selector);

      pointBox.innerHTML = pointDataOutput.NumPoint;
      latitudeBox.innerHTML = `${pointDataOutput.projectionGEO.coordinatesGEO.latitude}`.replace('.', ',');
      longitudeBox.innerHTML = `${pointDataOutput.projectionGEO.coordinatesGEO.longitude}`.replace('.', ',');
      datumBox.innerHTML = pointDataOutput.projectionUTM.datum;
      coordX.innerHTML = this.formatUTMCoordinate(
        pointDataOutput.projectionUTM.coordinatesUTM.coordX,
      );
      coordY.innerHTML = this.formatUTMCoordinate(
        pointDataOutput.projectionUTM.coordinatesUTM.coordY,
      );
    }
  }

  displayZcoordinate(numPoint) {
    const featureSelected = this.layerFeatures.getFeatureById(numPoint);
    const altitudeBox = document.getElementById('m-infocoordinates-altitude');
    altitudeBox.innerHTML = `${parseFloat(featureSelected.getAttribute('Altitude')).toFixed(2)}`.replace('.', ',');
  }

  openTab(numPoint) {
    this.selectFeature(numPoint);
    this.activateTab(numPoint);
    this.displayXYcoordinates(numPoint);
  }

  openTabFromTab(numPoint) {
    this.selectFeature(numPoint);
    this.activateTab(numPoint);
    this.displayXYcoordinates(numPoint);
    this.displayZcoordinate(numPoint);
  }

  removePoint() {
    if (document.getElementsByClassName('tablinks').length > 1) {
      const totalTabs = document.getElementsByClassName('m-infocoordinates-tabs')[0].children.length;
      const tablinkActive = document.querySelector('.tablinks.active');
      const numPoint = tablinkActive.textContent;
      // Elimina tab
      tablinkActive.parentNode.removeChild(tablinkActive);
      // elimina la feature
      const featureSelect = this.layerFeatures.getFeatureById(Number(numPoint));
      this.layerFeatures.removeFeatures(featureSelect);
      this.layerFeatures.getFeatures().forEach((f) => {
        if (f.getId() > numPoint) {
          f.setId(f.getId() - 1);
        }
      });

      for (let i = (numPoint - 1); i < (totalTabs - 1); i += 1) {
        const elem = document.getElementById(`tablink${i + 2}`);
        const value = parseInt(elem.innerHTML, 10);
        elem.setAttribute('id', `tablink${value - 1}`);
        elem.innerHTML = (value - 1);
      }

      document.querySelector('.contenedorPuntoSelect').parentNode.remove();
      document.querySelectorAll('.contenedorPunto').forEach((elem) => {
        if (parseInt(elem.textContent.trim(), 10) > numPoint) {
          const value = parseInt(elem.querySelector('td').innerHTML, 10);
          const newElement = elem.cloneNode(true);
          newElement.querySelector('td').innerHTML = (value - 1);
          elem.parentNode.replaceChild(newElement, elem);
        }
      });

      // Mostrar otro punto, muestro el último punto y lo activo
      const lastTablink = document.getElementsByClassName('m-infocoordinates-tabs')[0].lastChild;
      lastTablink.classList.add('active');
      this.numTabs -= 1;
      this.openTabFromTab(Number(lastTablink.textContent));
    } else {
      this.removeAllPoints();
    }
  }

  copylatlon() {
    const lat = document.getElementById('m-infocoordinates-latitude').innerHTML.replace(',', '.');
    const long = document.getElementById('m-infocoordinates-longitude').innerHTML.replace(',', '.');
    const alt = document.getElementById('m-infocoordinates-altitude').innerHTML.replace(',', '.');
    let proj = document.getElementById('m-infocoordinates-epsg-selected').value;
    if (proj.indexOf('25829') > -1 || proj.indexOf('25830') > -1 || proj.indexOf('25831') > -1) {
      proj = 'EPSG:4258';
    } else {
      proj = 'EPSG:4326';
    }
    const result = `${long},${lat},${alt},${proj}`;
    navigator.clipboard.writeText(result);
    IDEE.toast.success(getValue('clipboard'));
  }

  copyxy() {
    const x = document.getElementById('m-infocoordinates-coordX').innerHTML.replaceAll('.', '').replace(',', '.');
    const y = document.getElementById('m-infocoordinates-coordY').innerHTML.replaceAll('.', '').replace(',', '.');
    const alt = document.getElementById('m-infocoordinates-altitude').innerHTML.replaceAll('.', '').replace(',', '.');
    const proj = document.getElementById('m-infocoordinates-epsg-selected').value;
    const result = `${x},${y},${alt},${proj}`;
    navigator.clipboard.writeText(result);
    IDEE.toast.success(getValue('clipboard'));
  }

  copylatlonMulti(epsgCode) {
    const safeCode = epsgCode.replace(':', '-');
    const latEl = document.getElementById(`m-infocoordinates-latitude-${safeCode}`);
    const lonEl = document.getElementById(`m-infocoordinates-longitude-${safeCode}`);
    const lat = latEl.innerHTML.replace(',', '.');
    const lon = lonEl.innerHTML.replace(',', '.');
    const alt = document.getElementById('m-infocoordinates-altitude').innerHTML.replace(',', '.');
    navigator.clipboard.writeText(`${lon},${lat},${alt},${epsgCode}`);
    IDEE.toast.success(getValue('clipboard'));
  }

  copyxyMulti(epsgCode) {
    const safeCode = epsgCode.replace(':', '-');
    const xEl = document.getElementById(`m-infocoordinates-coordX-${safeCode}`);
    const yEl = document.getElementById(`m-infocoordinates-coordY-${safeCode}`);
    const altEl = document.getElementById('m-infocoordinates-altitude');
    const x = xEl.innerHTML.replaceAll('.', '').replace(',', '.');
    const y = yEl.innerHTML.replaceAll('.', '').replace(',', '.');
    const alt = altEl.innerHTML.replace(',', '.');
    navigator.clipboard.writeText(`${x},${y},${alt},${epsgCode}`);
    IDEE.toast.success(getValue('clipboard'));
  }

  copyAllPoints() {
    const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

    if (this.epsgResults) {
      const printDocument = this.layerFeatures.getImpl().getFeatures(true)
        .map((featureSelected, idx) => {
          const alt = featureSelected.getAttributes().Altitude !== undefined
            ? parseFloat(featureSelected.getAttributes().Altitude) : '-';
          const epsgLines = this.epsgResultsTemplate.map(({ code, isGeo }) => {
            const pointDataOutput = this.getImpl().getCoordinates(
              featureSelected,
              code,
              formatGMS,
              this.decimalGEOcoord_,
              this.decimalUTMcoord_,
            );
            const geo = pointDataOutput.projectionGEO.coordinatesGEO;
            const utm = pointDataOutput.projectionUTM.coordinatesUTM;
            const coords = isGeo
              ? `${geo.longitude},${geo.latitude}`
              : `${utm.coordX},${utm.coordY}`;
            return `${code}: ${coords},${alt}`;
          }).join('\n');
          return `${getValue('point').replace(':', '')} ${idx + 1}\n${epsgLines}`;
        }).join('\n\n');
      navigator.clipboard.writeText(printDocument);
      IDEE.toast.success(getValue('clipboard'));
    } else {
      let printDocument = `${getValue('point').replace(':', '')},${this.isProjGeographic ? 'Long,Lat' : 'X,Y'},Alt,EPSG\n`;
      for (let i = 0; i < this.layerFeatures.getImpl().getFeatures(true).length; i += 1) {
        const featureSelected = this.layerFeatures.getImpl().getFeatures(true)[i];
        const alt = featureSelected.getAttributes().Altitude !== undefined ? parseFloat(featureSelected.getAttributes().Altitude) : '-';

        const selectSRS = document.getElementById('m-infocoordinates-epsg-selected').value;

        const pointDataOutput = this.getImpl().getCoordinates(
          featureSelected,
          selectSRS,
          formatGMS,
          this.decimalGEOcoord_,
          this.decimalUTMcoord_,
        );

        const coordinates = this.isProjGeographic
          ? [
            pointDataOutput.projectionGEO.coordinatesGEO.longitude,
            pointDataOutput.projectionGEO.coordinatesGEO.latitude,
          ]
          : [
            pointDataOutput.projectionUTM.coordinatesUTM.coordX,
            pointDataOutput.projectionUTM.coordinatesUTM.coordY,
          ];

        const result = `${i + 1},${coordinates},${alt.toString()},${this.selectedProjection}\n`;
        printDocument = printDocument.concat(result);
      }

      navigator.clipboard.writeText(printDocument);
      IDEE.toast.success(getValue('clipboard'));
    }
  }

  importAllPoints() {
    const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;
    const printDocument = [];

    if (this.epsgResults) {
      if (this.outputDownloadFormat === 'csv') {
        printDocument.push(`${getValue('point').replace(':', '')},Coord1,Coord2,Alt,EPSG\n`);
        this.layerFeatures.getImpl().getFeatures(true).forEach((featureSelected, idx) => {
          const alt = featureSelected.getAttributes().Altitude !== undefined
            ? parseFloat(featureSelected.getAttributes().Altitude) : '-';
          this.epsgResultsTemplate.forEach(({ code, isGeo }) => {
            const pointDataOutput = this.getImpl().getCoordinates(
              featureSelected,
              code,
              formatGMS,
              this.decimalGEOcoord_,
              this.decimalUTMcoord_,
            );
            const geo = pointDataOutput.projectionGEO.coordinatesGEO;
            const utm = pointDataOutput.projectionUTM.coordinatesUTM;
            const coords = isGeo
              ? `${geo.longitude},${geo.latitude}`
              : `${utm.coordX},${utm.coordY}`;
            printDocument.push(`${idx + 1},${coords},${alt},${code}\n`);
          });
        });
      } else {
        this.layerFeatures.getImpl().getFeatures(true).forEach((featureSelected, idx) => {
          const alt = featureSelected.getAttributes().Altitude !== undefined
            ? parseFloat(featureSelected.getAttributes().Altitude) : '-';
          printDocument.push(`${getValue('point').replace(':', ' ')}${idx + 1}:\n`);
          this.epsgResultsTemplate.forEach(({ code, isGeo }) => {
            const pointDataOutput = this.getImpl().getCoordinates(
              featureSelected,
              code,
              formatGMS,
              this.decimalGEOcoord_,
              this.decimalUTMcoord_,
            );
            const geo = pointDataOutput.projectionGEO.coordinatesGEO;
            const utm = pointDataOutput.projectionUTM.coordinatesUTM;
            const coords = isGeo
              ? `${geo.longitude},${geo.latitude}`
              : `${utm.coordX},${utm.coordY}`;
            printDocument.push(`${code}: [${coords},${alt}]\n`);
          });
          printDocument.push('\n');
        });
      }
    } else {
      if (this.outputDownloadFormat === 'csv') {
        printDocument.push(`${getValue('point').replace(':', '')},${this.isProjGeographic ? 'Long,Lat' : 'X,Y'},Alt,EPSG\n`);
      }
      for (let i = 0; i < this.layerFeatures.getImpl().getFeatures(true).length; i += 1) {
        const featureSelected = this.layerFeatures.getImpl().getFeatures(true)[i];
        const alt = featureSelected.getAttributes().Altitude !== undefined ? parseFloat(featureSelected.getAttributes().Altitude) : '-';

        const selectSRS = document.getElementById('m-infocoordinates-epsg-selected').value;

        const pointDataOutput = this.getImpl().getCoordinates(
          featureSelected,
          selectSRS,
          formatGMS,
          this.decimalGEOcoord_,
          this.decimalUTMcoord_,
        );

        const coordinates = this.isProjGeographic
          ? [
            pointDataOutput.projectionGEO.coordinatesGEO.longitude,
            pointDataOutput.projectionGEO.coordinatesGEO.latitude,
          ]
          : [
            pointDataOutput.projectionUTM.coordinatesUTM.coordX,
            pointDataOutput.projectionUTM.coordinatesUTM.coordY,
          ];

        if (this.outputDownloadFormat === 'csv') {
          printDocument.push(`${i + 1},${coordinates},${alt.toString()},${this.selectedProjection}\n`);
        } else {
          printDocument.push(`${getValue('point').replace(':', ' ')}${i + 1}: \n`);
          printDocument.push(`${this.selectedProjection}: `);
          printDocument.push(`[${coordinates},${alt}]\n`);
        }
      }
    }

    const toBlobType = new Blob(printDocument, {
      type: this.outputDownloadFormat === 'csv' ? 'csv' : 'text/plain',
    });
    const f = new Date();
    const titulo = 'mapa_'.concat(f.getFullYear(), '-', f.getMonth() + 1, '-', f.getDay() + 1, '_', f.getHours(), f.getMinutes(), f.getSeconds());

    this.descargarArchivo(toBlobType, titulo.concat(`.${this.outputDownloadFormat}`));
  }

  displayAllPoints() {
    if (this.displayON && this.map.getMapImpl().getOverlays().getLength() > 0) {
      this.removeAllDisplaysPoints();
    } else {
      // Modificamos el icono
      const buttonDisplayAllPointsElem = document.querySelector('#m-infocoordinates-buttonDisplayAllPoints');
      buttonDisplayAllPointsElem.classList.add('hidden');
      buttonDisplayAllPointsElem.title = getValue('displayOFFAllPoints');

      // Eliminamos el num sobre el punto
      for (let i = 0; i < document.getElementsByClassName('contenedorPunto').length; i += 1) {
        document.getElementsByClassName('contenedorPunto')[i].style = 'display: none';
      }
      document.getElementsByClassName('contenedorPuntoSelect')[0].style = 'display: none';

      const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

      // Creamos las etiquetas de los puntos
      this.layerFeatures.getImpl().getFeatures(true).forEach((implFeature, idx) => {
        const pos = implFeature.getImpl().getFeature().getProperties().coordinates;
        const altRaw = implFeature.getImpl().getFeature().getProperties().Altitude;
        const altitude = `${parseFloat(altRaw).toFixed(2)}`.replace('.', ',');

        let coordsHTML = '';

        if (this.epsgResults) {
          const facadeFeature = this.layerFeatures.getFeatureById(idx + 1);
          this.epsgResultsTemplate.forEach(({ code, isGeo }) => {
            const pointDataOutput = this.getImpl().getCoordinates(
              facadeFeature,
              code,
              formatGMS,
              this.decimalGEOcoord_,
              this.decimalUTMcoord_,
            );
            if (isGeo) {
              const geo = pointDataOutput.projectionGEO.coordinatesGEO;
              const lat = `${geo.latitude}`.replace('.', ',');
              const lon = `${geo.longitude}`.replace('.', ',');
              coordsHTML += `<tr><td>${code}: ${lon}, ${lat}</td></tr>`;
            } else {
              const utm = pointDataOutput.projectionUTM.coordinatesUTM;
              const x = this.formatUTMCoordinate(utm.coordX);
              const y = this.formatUTMCoordinate(utm.coordY);
              coordsHTML += `<tr><td>${code}: X=${x} Y=${y}</td></tr>`;
            }
          });
        } else {
          const varUTM = this.calculateCoordinates(idx + 1);
          coordsHTML = `
            <tr>
              <td>X: ${this.formatUTMCoordinate(varUTM[0])}</td>
            </tr>
            <tr>
              <td>Y: ${this.formatUTMCoordinate(varUTM[1])}</td>
            </tr>`;
        }

        const textHTML = `<div class="m-popup m-collapsed" style="padding: 5px 5px 5px 5px !important;background-color: rgba(255, 255, 255, 0.7) !important;">
              <div class="contenedorCoordPunto">
                <table>
                    <tbody>
                      <tr>
                        <td style="font-weight: var(--idee-font-weight-bold)">${getValue('point')} ${idx + 1}</td></b>
                      </tr>
                      ${coordsHTML}
                      <tr>
                        <td>${getValue('altitude')} ${altitude}</td>
                      </tr>
                    </tbody>
                </table>
            </div>
          </div>
          </div>
      </div>`;

        const helpTooltipElement = IDEE.template.compileSync(textHTML, {
          jsonp: true,
          vars: {
            translations: getValue('text'),
          },
        });

        this.helpTooltip_ = new ol.Overlay({
          element: helpTooltipElement,
          offset: [10, -5],
        });

        this.helpTooltip_.setPosition(pos);
        this.map.getMapImpl().addOverlay(this.helpTooltip_);
      });
      this.displayON = true;
    }
  }

  calculateCoordinates(numPoint) {
    const featureSelected = this.layerFeatures.getFeatureById(numPoint);
    // Cojo el srs seleccionado en el select
    const selectSRS = document.getElementById('m-infocoordinates-epsg-selected').value;

    // Cojo el formato de las coordenadas geográficas
    const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

    // Cambio coordenadas y calculo las UTM
    const pointDataOutput = this.getImpl().getCoordinates(
      featureSelected,
      selectSRS,
      formatGMS,
      this.decimalGEOcoord_,
      this.decimalUTMcoord_,
    );

    return this.isProjGeographic
      ? [
        pointDataOutput.projectionGEO.coordinatesGEO.longitude,
        pointDataOutput.projectionGEO.coordinatesGEO.latitude,
      ]
      : [
        pointDataOutput.projectionUTM.coordinatesUTM.coordX,
        pointDataOutput.projectionUTM.coordinatesUTM.coordY,
      ];
  }

  removeAllDisplaysPoints() {
    // Modificamos el icono
    const buttonDisplayAllPointsElem = document.querySelector('#m-infocoordinates-buttonDisplayAllPoints');
    if (!buttonDisplayAllPointsElem) return;
    buttonDisplayAllPointsElem.classList.remove('hidden');
    buttonDisplayAllPointsElem.title = getValue('displayONAllPoints');

    // Mostramos el num sobre el punto
    for (let i = 0; i < document.getElementsByClassName('contenedorPunto').length; i += 1) {
      document.getElementsByClassName('contenedorPunto')[i].style = 'display: block';
    }
    const contenedorPuntoSelect = document.getElementsByClassName('contenedorPuntoSelect')[0];
    if (contenedorPuntoSelect) contenedorPuntoSelect.style = 'display: block';

    // Eliminamos todas las etiquetas de los puntos
    const numOverlays = this.map.getMapImpl().getOverlays().getArray().length;
    for (let i = numOverlays - 1; i > -1; i -= 1) {
      if (this.map.getMapImpl().getOverlays().getArray()[i].options.element.className === 'm-popup m-collapsed') {
        this.map.getMapImpl().removeOverlay(this.map.getMapImpl().getOverlays().getArray()[i]);
      }
    }
    this.displayON = false;
  }

  descargarArchivo(contenidoEnBlob, nombreArchivo) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const save = document.createElement('a');
      save.href = event.target.result;
      save.target = '_blank';
      save.download = nombreArchivo || 'archivo.dat';
      const clicEvent = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true,
      });
      save.dispatchEvent(clicEvent);
      (window.URL || window.webkitURL).revokeObjectURL(save.href);
    };
    reader.readAsDataURL(contenidoEnBlob);
  }

  removeAllPoints() {
    const divTabContainer = document.getElementsByClassName('m-infocoordinates-tabs')[0];
    if (!divTabContainer) return;
    divTabContainer.innerHTML = '';

    document.getElementById('m-infocoordinates-point').innerHTML = '--';
    document.getElementById('m-infocoordinates-altitude').innerHTML = '--';

    if (this.epsgResults) {
      this.epsgResultsTemplate.forEach(({ safeCode, isGeo }) => {
        const datumEl = document.getElementById(`m-infocoordinates-datum-${safeCode}`);
        if (datumEl) datumEl.innerHTML = '--';
        if (isGeo) {
          const latEl = document.getElementById(`m-infocoordinates-latitude-${safeCode}`);
          const lonEl = document.getElementById(`m-infocoordinates-longitude-${safeCode}`);
          if (latEl) latEl.innerHTML = '--';
          if (lonEl) lonEl.innerHTML = '--';
        } else {
          const xEl = document.getElementById(`m-infocoordinates-coordX-${safeCode}`);
          const yEl = document.getElementById(`m-infocoordinates-coordY-${safeCode}`);
          if (xEl) xEl.innerHTML = '--';
          if (yEl) yEl.innerHTML = '--';
        }
      });
    } else {
      document.getElementById('m-infocoordinates-latitude').innerHTML = '--';
      document.getElementById('m-infocoordinates-longitude').innerHTML = '--';
      document.getElementById('m-infocoordinates-coordX').innerHTML = '--';
      document.getElementById('m-infocoordinates-coordY').innerHTML = '--';
      document.getElementById('m-infocoordinates-copylatlon').classList.add('noDisplay');
      document.getElementById('m-infocoordinates-copyxy').classList.add('noDisplay');
    }

    document.getElementById('m-infocoordinates-buttonRemovePoint').classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonRemoveAllPoints')[0].classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonImportAllPoints')[0].classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonCopyAllPoints')[0].classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonDisplayAllPoints')[0].classList.add('noDisplay');
    document.getElementById('m-infocoordinates-buttonConversorFormat').setAttribute('disabled', 'disabled');

    // Elimino todas las features
    this.layerFeatures.removeFeatures((this.layerFeatures.getFeatures()));

    // Elimino todos los popups del mapa
    const numOverlays = this.map.getMapImpl().getOverlays().getArray().length;
    for (let i = numOverlays - 1; i > -1; i -= 1) {
      this.map.getMapImpl().removeOverlay(this.map.getMapImpl().getOverlays().getArray()[i]);
    }

    // Reseteo el contador de tabs
    this.numTabs = 0;
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof InfocoordinatesControl;
  }

  removeLayerFeatures() {
    this.map.removeLayers(this.layerFeatures);
  }

  formatUTMCoordinate(coord) {
    return coord.replace(/\d(?=(\d{3})+\.)/g, '$&*').split('.').join(',').split('*')
      .join('.');
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  showHelp() {
    window.open(this.helpUrl, '_blank');
  }
}
