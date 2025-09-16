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
  constructor(decimalGEOcoord, decimalUTMcoord, helpUrl, order, outputDownloadFormat) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(InfocoordinatesImplControl)
      || (IDEE.utils.isObject(InfocoordinatesImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(InfocoordinatesImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new InfocoordinatesImplControl();
    super(impl, 'Infocoordinates');
    this.map_ = null;
    this.numTabs = 0;
    this.layerFeatures = new IDEE.layer.Vector();
    this.layerFeatures.name = 'infocoordinatesLayerFeatures';
    this.layerFeatures.displayInLayerSwitcher = false;
    this.decimalGEOcoord = decimalGEOcoord;
    this.decimalUTMcoord = decimalUTMcoord;
    this.helpUrl = helpUrl;
    this.clickedDeactivate = false;
    this.order = order;
    this.outputDownloadFormat = outputDownloadFormat;
    this.projections = IDEE.impl.ol.js.projections.getSupportedProjs();
    this.selectedProjection = null;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map_ = map;
    this.selectedProjection = this.map_.getProjection().code;
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

    return new Promise((success, fail) => {
      const options = {
        jsonp: true,
        vars: {
          hasHelp: this.helpUrl !== undefined && IDEE.utils.isUrl(this.helpUrl),
          helpUrl: this.helpUrl,
          projections: this.projections,
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
      const html = IDEE.template.compileSync(template, options);
      this.initCustomDropdown(html);
      // Añadir código dependiente del DOM
      this.accessibilityTab(html);

      this.map_.addLayers(this.layerFeatures);
      this.panel_.on(IDEE.evt.SHOW, this.activate, this);
      this.panel_.on(IDEE.evt.HIDE, this.deactivate, this);

      success(html);
      html.querySelector('#m-infocoordinates-buttonRemoveAllPoints').addEventListener('click', this.removeAllPoints.bind(this));
      html.querySelector('#m-infocoordinates-buttonImportAllPoints').addEventListener('click', this.importAllPoints.bind(this));
      html.querySelector('#m-infocoordinates-buttonCopyAllPoints').addEventListener('click', this.copyAllPoints.bind(this));
      html.querySelector('#m-infocoordinates-buttonDisplayAllPoints').addEventListener('click', this.displayAllPoints.bind(this));
      html.querySelector('#m-infocoordinates-buttonConversorFormat').addEventListener('change', this.changeSelectSRSorChangeFormat.bind(this));
      html.querySelector('#m-infocoordinates-buttonRemovePoint').addEventListener('click', this.removePoint.bind(this));
      html.querySelector('#m-infocoordinates-copylatlon').addEventListener('click', this.copylatlon.bind(this));
      html.querySelector('#m-infocoordinates-copyxy').addEventListener('click', this.copyxy.bind(this));
    });
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
    let isEditable = false;

    input.setAttribute('readonly', 'readonly');
    input.value = this.selectedProjection;

    input.addEventListener('focus', () => {
      if (!isEditable) {
        selector.style.display = 'block';
        const list = selector.querySelectorAll('li a');
        list.forEach((li) => {
          li.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const value = event.target.getAttribute('value');
            if (value === 'default') {
              isEditable = true;
              input.removeAttribute('readonly');
              input.value = '';
              input.placeholder = getValue('placeholder_custom_epsg');
              selector.style.display = 'none';
              input.focus();
            } else {
              input.value = value;
              this.changeSelectSRSorChangeFormat();
            }
          });
        });
      }
    });

    input.addEventListener('blur', () => {
      selector.style.display = 'none';
      isEditable = false;
      if (!input.hasAttribute('readonly')) {
        input.setAttribute('readonly', 'readonly');
        input.value = this.selectedProjection;
      }
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
    this.map_.on(IDEE.evt.CLICK, this.addPoint, this);
    document.body.style.cursor = 'crosshair';
    this.map_.getFeatureHandler().deactivate();
    document.addEventListener('keyup', this.checkEscKey.bind(this));
    if (this.clickedDeactivate) {
      document.querySelector('div.m-panel.m-plugin-infocoordinates > button').click();
    }
  }

  checkEscKey(evt) {
    const opened = document.querySelector('div.m-panel.m-plugin-infocoordinates').classList.contains('opened');
    if (evt.key === 'Escape' && opened) {
      document.querySelector('div.m-panel.m-plugin-infocoordinates.opened > button').click();
      document.removeEventListener('keyup', this.checkEscKey);
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
    this.map_.un(IDEE.evt.CLICK, this.addPoint, this);
    document.body.style.cursor = 'default';
    this.map_.getFeatureHandler().activate();
  }

  addPoint(evt) {
    const numPoint = this.numTabs + 1;
    document.getElementById('m-infocoordinates-comboDatum').removeAttribute('disabled');
    document.getElementById('m-infocoordinates-buttonConversorFormat').removeAttribute('disabled');
    document.getElementById('m-infocoordinates-buttonRemovePoint').classList.remove('noDisplay');
    document.getElementById('m-infocoordinates-copylatlon').classList.remove('noDisplay');
    document.getElementById('m-infocoordinates-copyxy').classList.remove('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonRemoveAllPoints')[0].classList.remove('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonImportAllPoints')[0].classList.remove('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonCopyAllPoints')[0].classList.remove('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonDisplayAllPoints')[0].classList.remove('noDisplay');

    // Eliminamos las etiquetas de los puntos
    if (document.getElementsByClassName('icon-displayON').length === 0 && this.map_.getMapImpl().getOverlays().getLength() > 0) {
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
        'EPSGcode': this.map_.getProjection().code,
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
        .readAltitudeFromElevationProcess(coordinates, this.map_.getProjection().code.split(':')[1]);
      success(altitudeFromElevationProcess);
    });

    // IDEE.proxy(false);
    promesa.then((response) => {
      // IDEE.proxy(true);
      if (!response || response === NO_DATA_VALUE) {
        altitudeFromElevationProcess = getValue('noDatafromElevationProcess');
      } else {
        altitudeFromElevationProcess = parseFloat(response).toFixed(2).replace('.', ',');
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

    // Calculamos el número de elementos de numPoints que hay
    const countPoints = document.getElementsByClassName('contenedorPunto').length + document.getElementsByClassName('contenedorPuntoSelect').length;
    // Si el numPoint que se pasa es mayor que la cantidad de numPoints
    // que existe, quiere decir que es nuevo, se añade.
    // En el caso de que no sea nuevo, se modifica el estilo del punto.
    if (numPoint > countPoints) {
      this.displayPoint(numPoint);
    } else if (numPoint === countPoints) {
      document.querySelectorAll('.contenedorPunto').forEach((elem) => {
        if (parseInt(elem.textContent, 10) === numPoint) {
          elem.classList.replace('contenedorPunto', 'contenedorPuntoSelect');
        }
      });

      // Eliminamos las etiquetas de los puntos
      if (document.getElementsByClassName('icon-displayON').length === 0 && this.map_.getMapImpl().getOverlays().getLength() > 0) {
        this.removeAllDisplaysPoints();
      }
    } else {
      document.getElementsByClassName('contenedorPuntoSelect')[0].classList.replace('contenedorPuntoSelect', 'contenedorPunto');
      try {
        document.getElementsByClassName('contenedorPunto')[document.getElementsByClassName('contenedorPunto').length - numPoint].classList.replace('contenedorPunto', 'contenedorPuntoSelect');
      } catch (err) { /* Continue */ }

      // Eliminamos las etiquetas de los puntos
      if (document.getElementsByClassName('icon-displayON').length === 0 && this.map_.getMapImpl().getOverlays().getLength() > 0) {
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
                        <td style="font-weight: bold; font-family: arial;">${numPoint}</td></b>
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
    this.map_.getMapImpl().addOverlay(this.helpTooltip_);
  }

  activateTab(numPoint) {
    const allTabsLinks = document.getElementsByClassName('tablinks');
    for (let i = 0; i < allTabsLinks.length; i += 1) {
      allTabsLinks[i].classList.remove('active');
    }
    const idBotonTab = document.getElementById(`tablink${numPoint}`);
    idBotonTab.classList.add('active');
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

    // Capturo los elementos
    const pointBox = document.getElementById('m-infocoordinates-point');
    const latitudeBox = document.getElementById('m-infocoordinates-latitude');
    const longitudeBox = document.getElementById('m-infocoordinates-longitude');
    const datumBox = document.getElementById('m-infocoordinates-datum');
    const coordX = document.getElementById('m-infocoordinates-coordX');
    const coordY = document.getElementById('m-infocoordinates-coordY');
    const inputSRS = document.querySelector('.m-infocoordinates-input-select');
    const selector = document.querySelector('#m-infocoordinates-srs-selector');

    // Cojo el srs seleccionado en el select
    const selectSRS = inputSRS.value;

    // Cojo el formato de las coordenadas geográficas
    const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

    // Cambio coordenadas y calculo las UTM
    let pointDataOutput;
    try {
      pointDataOutput = this.getImpl().getCoordinates(
        featureSelected,
        selectSRS,
        formatGMS,
        this.decimalGEOcoord,
        this.decimalUTMcoord,
      );
    } catch (error) {
      try {
        await IDEE.impl.ol.js.projections.setNewProjection(selectSRS);
        pointDataOutput = this.getImpl().getCoordinates(
          featureSelected,
          selectSRS,
          formatGMS,
          this.decimalGEOcoord,
          this.decimalUTMcoord,
        );
      } catch (err) {
        pointDataOutput = this.getImpl().getCoordinates(
          featureSelected,
          this.selectedProjection,
          formatGMS,
          this.decimalGEOcoord,
          this.decimalUTMcoord,
        );
        inputSRS.value = this.selectedProjection;
        IDEE.dialog.error(`${getValue('exception.srs')} ${this.selectedProjection}`);
      }
    }

    this.projections = IDEE.impl.ol.js.projections.getSupportedProjs();
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

    // pinto
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
    let proj = document.getElementById('m-infocoordinates-comboDatum').value;
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
    const proj = document.getElementById('m-infocoordinates-comboDatum').value;
    const result = `${x},${y},${alt},${proj}`;
    navigator.clipboard.writeText(result);
    IDEE.toast.success(getValue('clipboard'));
  }

  copyAllPoints() {
    let printDocument = `${getValue('point').replace(':', '')},Long,Lat,Alt,EPSG,X,Y,Alt,EPSG\n`;
    for (let i = 0; i < this.layerFeatures.getImpl().getFeatures(true).length; i += 1) {
      const featureSelected = this.layerFeatures.getImpl().getFeatures(true)[i];
      const alt = featureSelected.getAttributes().Altitude !== undefined ? parseFloat(featureSelected.getAttributes().Altitude) : '-';

      // Cojo el srs seleccionado en el select
      const selectSRS = document.querySelector('.m-infocoordinates-input-select').value;

      // Cojo el formato de las coordenadas geográficas
      const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

      // Cambio coordenadas y calculo las UTM
      const pointDataOutput = this.getImpl().getCoordinates(
        featureSelected,
        selectSRS,
        formatGMS,
        this.decimalGEOcoord,
        this.decimalUTMcoord,
      );
      const proj = pointDataOutput.projectionUTM.code;

      const coordinatesGEO = [
        pointDataOutput.projectionGEO.coordinatesGEO.longitude,
        pointDataOutput.projectionGEO.coordinatesGEO.latitude,
      ];

      const coordinatesUTM = [
        pointDataOutput.projectionUTM.coordinatesUTM.coordX,
        pointDataOutput.projectionUTM.coordinatesUTM.coordY,
      ];

      let projection;
      if (proj.indexOf('25829') > -1 || proj.indexOf('25830') > -1 || proj.indexOf('25831') > -1) {
        projection = ',EPSG:4258';
      } else {
        projection = ',EPSG:4326';
      }

      const result = `${i + 1},${coordinatesGEO},${alt.toString()}${projection.trim()},${coordinatesUTM},${alt.toString()},${proj}\n`;

      printDocument = printDocument.concat(result);
    }

    navigator.clipboard.writeText(printDocument);
    IDEE.toast.success(getValue('clipboard'));
  }

  importAllPoints() {
    const printDocument = [];
    if (this.outputDownloadFormat === 'csv') {
      printDocument.push(`${getValue('point').replace(':', '')},Long,Lat,Alt,EPSG,X,Y,Alt,EPSG\n`);
    }
    for (let i = 0; i < this.layerFeatures.getImpl().getFeatures(true).length; i += 1) {
      const featureSelected = this.layerFeatures.getImpl().getFeatures(true)[i];
      const alt = featureSelected.getAttributes().Altitude !== undefined ? parseFloat(featureSelected.getAttributes().Altitude) : '-';

      // Cojo el srs seleccionado en el select
      const selectSRS = document.querySelector('.m-infocoordinates-input-select').value;

      // Cojo el formato de las coordenadas geográficas
      const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

      // Cambio coordenadas y calculo las UTM
      const pointDataOutput = this.getImpl().getCoordinates(
        featureSelected,
        selectSRS,
        formatGMS,
        this.decimalGEOcoord,
        this.decimalUTMcoord,
      );
      const proj = pointDataOutput.projectionUTM.code;

      const coordinatesGEO = [
        pointDataOutput.projectionGEO.coordinatesGEO.longitude,
        pointDataOutput.projectionGEO.coordinatesGEO.latitude,
      ];

      const coordinatesUTM = [
        pointDataOutput.projectionUTM.coordinatesUTM.coordX,
        pointDataOutput.projectionUTM.coordinatesUTM.coordY,
      ];

      let projection = 'EPSG:4326: ';
      if (proj.indexOf('25829') > -1 || proj.indexOf('25830') > -1 || proj.indexOf('25831') > -1) {
        projection = 'EPSG:4258: ';
      }

      if (this.outputDownloadFormat === 'csv') {
        printDocument.push(`${i + 1},${coordinatesGEO},${alt.toString()},${projection.trim().slice(0, -1)},${coordinatesUTM},${alt.toString()},${proj}\n`);
      } else {
        printDocument.push(`${getValue('point').replace(':', ' ')}${i + 1}: \n`);
        printDocument.push(projection);

        printDocument.push(`[${coordinatesGEO},${alt}]\n`);
        printDocument.push(`${proj}: `);
        printDocument.push(`[${coordinatesUTM},${alt}]\n`);
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
    if (document.getElementsByClassName('icon-displayON').length === 0 && this.map_.getMapImpl().getOverlays().getLength() > 0) {
      this.removeAllDisplaysPoints();
    } else {
      // Modificamos el icono
      document.getElementsByClassName('icon-displayON')[0].classList.replace('icon-displayON', 'icon-displayOFF');
      document.getElementsByClassName('icon-displayOFF')[0].title = getValue('displayOFFAllPoints');

      // Eliminamos el num sobre el punto
      for (let i = 0; i < document.getElementsByClassName('contenedorPunto').length; i += 1) {
        document.getElementsByClassName('contenedorPunto')[i].style = 'display: none';
      }
      document.getElementsByClassName('contenedorPuntoSelect')[0].style = 'display: none';

      // Creamos las etiquetas de los puntos
      for (let i = 0; i < this.layerFeatures.getImpl().getFeatures(true).length; i += 1) {
        const pos = this.layerFeatures.getImpl()
          .getFeatures(true)[i].getImpl().getFeature().getProperties().coordinates;
        const varUTM = this.calculateUTMcoordinates(i + 1);
        const altitude = `${parseFloat(this.layerFeatures.getImpl().getFeatures(true)[i].getImpl().getFeature().getProperties().Altitude).toFixed(2)}`.replace('.', ',');
        const textHTML = `<div class="m-popup m-collapsed" style="padding: 5px 5px 5px 5px !important;background-color: rgba(255, 255, 255, 0.7) !important;">
              <div class="contenedorCoordPunto">
                <table>
                    <tbody>
                      <tr>
                        <td style="font-weight: bold">${getValue('point')} ${i + 1}</td></b>
                      </tr>
                      <tr>
                        <td>X: ${this.formatUTMCoordinate(varUTM[0])}</td>
                      </tr>
                      <tr>
                        <td>Y: ${this.formatUTMCoordinate(varUTM[1])}</td>
                      </tr>
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
        this.map_.getMapImpl().addOverlay(this.helpTooltip_);
      }
    }
  }

  calculateUTMcoordinates(numPoint) {
    const featureSelected = this.layerFeatures.getFeatureById(numPoint);
    // Cojo el srs seleccionado en el select
    const selectSRS = document.querySelector('.m-infocoordinates-input-select').value;

    // Cojo el formato de las coordenadas geográficas
    const formatGMS = document.getElementById('m-infocoordinates-buttonConversorFormat').checked;

    // Cambio coordenadas y calculo las UTM
    const pointDataOutput = this.getImpl().getCoordinates(
      featureSelected,
      selectSRS,
      formatGMS,
      this.decimalGEOcoord,
      this.decimalUTMcoord,
    );

    return [pointDataOutput.projectionUTM.coordinatesUTM.coordX,
      pointDataOutput.projectionUTM.coordinatesUTM.coordY];
  }

  removeAllDisplaysPoints() {
    // Modificamos el icono
    document.getElementsByClassName('icon-displayOFF')[0].classList.replace('icon-displayOFF', 'icon-displayON');
    document.getElementsByClassName('icon-displayON')[0].title = getValue('displayONAllPoints');

    // Mostramos el num sobre el punto
    for (let i = 0; i < document.getElementsByClassName('contenedorPunto').length; i += 1) {
      document.getElementsByClassName('contenedorPunto')[i].style = 'display: block';
    }
    document.getElementsByClassName('contenedorPuntoSelect')[0].style = 'display: block';

    // Eliminamos todas las etiquetas de los puntos
    const numOverlays = this.map_.getMapImpl().getOverlays().getArray().length;
    for (let i = numOverlays - 1; i > -1; i -= 1) {
      if (this.map_.getMapImpl().getOverlays().getArray()[i].options.element.className === 'm-popup m-collapsed') {
        this.map_.getMapImpl().removeOverlay(this.map_.getMapImpl().getOverlays().getArray()[i]);
      }
    }
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
    divTabContainer.innerHTML = '';

    document.getElementById('m-infocoordinates-point').innerHTML = '--';
    document.getElementById('m-infocoordinates-latitude').innerHTML = '--';
    document.getElementById('m-infocoordinates-longitude').innerHTML = '--';
    document.getElementById('m-infocoordinates-coordX').innerHTML = '--';
    document.getElementById('m-infocoordinates-coordY').innerHTML = '--';
    document.getElementById('m-infocoordinates-altitude').innerHTML = '--';

    document.getElementById('m-infocoordinates-buttonRemovePoint').classList.add('noDisplay');
    document.getElementById('m-infocoordinates-copylatlon').classList.add('noDisplay');
    document.getElementById('m-infocoordinates-copyxy').classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonRemoveAllPoints')[0].classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonImportAllPoints')[0].classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonCopyAllPoints')[0].classList.add('noDisplay');
    document.getElementsByClassName('m-infocoordinates-div-buttonDisplayAllPoints')[0].classList.add('noDisplay');
    document.getElementById('m-infocoordinates-buttonConversorFormat').setAttribute('disabled', 'disabled');
    // document.getElementById('m-infocoordinates-comboDatum').setAttribute('disabled', 'disabled');

    // Elimino todas las features
    this.layerFeatures.removeFeatures((this.layerFeatures.getFeatures()));

    // Elimino todos los popups del mapa
    const numOverlays = this.map_.getMapImpl().getOverlays().getArray().length;
    for (let i = numOverlays - 1; i > -1; i -= 1) {
      this.map_.getMapImpl().removeOverlay(this.map_.getMapImpl().getOverlays().getArray()[i]);
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
    this.map_.removeLayers(this.layerFeatures);
  }

  formatUTMCoordinate(coord) {
    return coord.replace(/\d(?=(\d{3})+\.)/g, '$&*').split('.').join(',').split('*')
      .join('.');
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
