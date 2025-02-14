/**
 * @module M/control/VectorsControl
 */

import Sortable from 'sortablejs';
import VectorsImplControl from 'impl/vectorscontrol';
import template from 'templates/vectors';
import layersTemplate from 'templates/layers';
import drawingTemplate from 'templates/drawing';
import downloadingTemplate from 'templates/downloading';
import uploadingTemplate from 'templates/uploading';
import changeNameTemplate from 'templates/changename';
import addWFSTemplate from 'templates/addwfs';
import fromURLTemplate from 'templates/fromurl';
import selectWFSTemplate from 'templates/selectwfs';
import helpTemplate from 'templates/help';
import shpWrite from 'shp-write';
import tokml from 'tokml';
import togpx from 'togpx';
import * as shp from 'shpjs';
import { getValue } from './i18n/language';

const formatNumber = (x, decimals) => {
  const pow = 10 ** decimals;
  let num = Math.round(x * pow) / pow;
  num = num.toString().replace('.', ',');
  if (decimals > 2) {
    num = `${num.split(',')[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${num.split(',')[1]}`;
  } else {
    num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return num;
};

const POINTS = [1, 15];
const LINES = [10, 15];
const LINE_POINTS = [1, 15, 20, 15];
const PLUS_ZINDEX = 1000;

export default class VectorsControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(options) {
    if (M.utils.isUndefined(VectorsImplControl)) {
      M.exception(getValue('exception.impl'));
    }

    const impl = new VectorsImplControl(options.order);
    super(impl, 'Vectors');

    // facade control goes to impl as reference param
    impl.facadeControl = this;

    /**
     * Selected Mapea feature
     * @private
     * @type {M.feature}
     */
    this.feature = undefined;

    /**
     * Feature that is drawn on selection layer around this.feature
     * to emphasize it.
     * @private
     * @type {M.feature}
     */
    this.emphasis = undefined;

    /**
     * Current geometry type selected for drawing.
     * @private
     * @type {String}
     */
    this.geometry = undefined; // Point, LineString, Polygon

    /**
     * Template that expands drawing tools with color and thickness options.
     * @private
     * @type {String}
     */
    this.drawingTools = undefined;

    /**
     * Template with uploading format options.
     * @private
     * @type {String}
     */
    this.uploadingTemplate = undefined;

    /**
     * Current color for drawing features.
     * @private
     * @type {String}
     */
    this.currentColor = undefined;

    /**
     * Current line thickness (or circle radius) for drawing features.
     * @private
     * @type {Number}
     */
    this.currentThickness = undefined;

    /**
     * Current line dash for drawing linestring features.
     * @private
     * @type {Number}
     */
    this.currentLineDash = undefined;

    /**
     * SRS of the input coordinates.
     * @private
     * @type {String}
     */
    this.srs = 'EPSG:4258';

    /**
     * Saves drawing layer ( __ draw__) from Mapea.
     * @private
     * @type {*} - Mapea layer
     */
    this.drawLayer = undefined;

    /**
     * File to upload.
     * @private
     * @type {*}
     */
    this.file_ = null;

    /**
     * Mapea layer where a square will be drawn around selected feature.
     * @private
     * @type {*}
     */
    this.selectionLayer = new M.layer.Vector({
      extract: false,
      name: 'selectLayer',
      source: this.getImpl().newVectorSource(true),
    }, { displayInLayerSwitcher: false });

    this.html = null;

    this.isEditionActive = false;

    this.isDrawingActive = false;

    this.isDownloadActive = false;

    this.pluginOpened = false;

    this.wfszoom = options.wfszoom;

    this.precharged = options.precharged;

    this.order = options.order;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    // eslint-disable-next-line
    console.warn(getValue('exception.obsolete'));
    this.map = map;
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        jsonp: true,
        vars: {
          translations: {
            add_point_layer: getValue('add_point_layer'),
            add_line_layer: getValue('add_line_layer'),
            add_poly_layer: getValue('add_poly_layer'),
            add_wfs_layer: getValue('add_wfs_layer'),
            title_plugin: getValue('title_plugin'),
            load_layer: getValue('load_layer'),
          },
        },
      });
      this.accessibilityTab(html);
      this.html = html;
      this.renderLayers();
      success(html);
      this.addEvents(html);
      this.createDrawingTemplate();
      this.createUploadingTemplate();
      this.map.addLayers(this.selectionLayer);
      this.selectionLayer.setZIndex(this.selectionLayer.getZIndex() + PLUS_ZINDEX);
    });
  }

  toogleActivate() {
    if (this.pluginOpened) {
      this.pluginOpened = false;
    } else {
      this.pluginOpened = true;
    }
  }

  renderLayers() {
    const filtered = this.map.getLayers().filter((layer) => {
      return ['kml', 'geojson', 'wfs', 'vector'].indexOf(layer.type.toLowerCase()) > -1
        && layer.name !== undefined && layer.displayInLayerSwitcher === true;
    });

    let layers = [];
    filtered.forEach((layer) => {
      if (!(layer.type.toLowerCase() === 'kml' && layer.name.toLowerCase() === 'attributions')) {
        const newLayer = layer;
        const geometry = !M.utils.isNullOrEmpty(layer.geometry)
          ? layer.geometry
          : layer.getGeometryType();

        if (geometry === null) {
          this.impl_.waitLayerLoadedAsync(layer).then(() => {
            this.renderLayers();
          });
        }

        if (!M.utils.isNullOrEmpty(geometry) && geometry.toLowerCase().indexOf('point') > -1) {
          newLayer.point = true;
        } else if (!M.utils.isNullOrEmpty(geometry) && geometry.toLowerCase().indexOf('polygon') > -1) {
          newLayer.polygon = true;
        } else if (!M.utils.isNullOrEmpty(geometry) && geometry.toLowerCase().indexOf('line') > -1) {
          newLayer.line = true;
        }

        if (newLayer.point || newLayer.polygon || newLayer.line) {
          if (newLayer.legend === undefined) {
            newLayer.legend = newLayer.name;
          }

          newLayer.visible = layer.isVisible();
          layers.push(newLayer);
          layers = this.reorderLayers(layers);
        }
      }
    });

    const html = M.template.compileSync(layersTemplate, {
      jsonp: true,
      vars: {
        layers,
        translations: {
          point_layer: getValue('point_layer'),
          line_layer: getValue('line_layer'),
          poly_layer: getValue('poly_layer'),
          show_hide: getValue('show_hide'),
          add_geom: getValue('add_geom'),
          edit_geom: getValue('edit_geom'),
          edit_geom_line: getValue('edit_geom_line'),
          layer_zoom: getValue('layer_zoom'),
          download_layer: getValue('download_layer'),
          delete_layer: getValue('delete_layer'),
          change_name: getValue('change_name'),
          reload_from_view: getValue('reload_from_view'),
        },
      },
    });

    this.accessibilityTab(html);

    const container = this.html.querySelector('.m-vectors-layers-container');
    container.innerHTML = '';
    if (layers.length > 0) {
      container.appendChild(html);
      html.addEventListener('click', this.clickLayer.bind(this), false);
      html.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) this.clickLayer(e);
      });
      const layerList = this.html.querySelector('#m-vector-list');
      Sortable.create(layerList, {
        animation: 150,
        ghostClass: 'm-vectors-gray-shadow',
        onEnd: (evt) => {
          const from = evt.from;
          let maxZIndex = Math.max(...(layers.map((l) => {
            return l.getZIndex();
          })));
          from.querySelectorAll('li.m-vector-layer').forEach((elem) => {
            const name = elem.getAttribute('name');
            const url = elem.getAttribute('url');
            const filtered2 = layers.filter((layer) => {
              return layer.name === name && (layer.url === url || url === '');
            });

            if (filtered2.length > 0) {
              filtered2[0].setZIndex(maxZIndex);
              maxZIndex -= 1;
            }
          });
        },
      });
    }
  }

  /**
   * Creates drawing options template.
   * @public
   * @function
   * @api
   */
  createDrawingTemplate() {
    this.drawingTools = M.template.compileSync(drawingTemplate, {
      jsonp: true,
      vars: {
        translations: {
          color: getValue('color'),
          thickness: getValue('thickness'),
          line: getValue('line'),
          delete_geom: getValue('delete_geom'),
          query_profile: getValue('query_profile'),
          collapse: getValue('collapse'),
          add_points: getValue('add_points'),
        },
      },
    });

    this.accessibilityTab(this.drawingTools);
    this.currentColor = this.drawingTools.querySelector('#colorSelector').value;
    this.currentThickness = this.drawingTools.querySelector('#thicknessSelector').value;
    this.drawingTools.querySelector('.collapsor').addEventListener('click', (e) => this.toogleCollapse(e));
    this.drawingTools.querySelector('.collapsor').addEventListener('keydown', (e) => (e.keyCode === 13) && this.toogleCollapse(e));
    this.drawingTools.querySelector('#colorSelector').addEventListener('change', (e) => this.styleChange(e));
    this.drawingTools.querySelector('#thicknessSelector').addEventListener('change', (e) => this.styleChange(e));
    this.drawingTools.querySelector('button.m-vector-layer-delete-feature').addEventListener('click', () => this.deleteSingleFeature());
    this.drawingTools.querySelector('button.m-vector-layer-add-points').addEventListener('click', () => this.activeAddPoints());
    this.drawingTools.querySelector('button.m-vector-layer-profile').addEventListener('click', () => this.getProfile());
    this.drawingTools.querySelector('button').style.display = 'none';
    this.drawingTools.querySelector('div.stroke-options').addEventListener('click', (e) => {
      const evt = (e || window.event);
      const selector = this.drawingTools.querySelector('div.stroke-options');
      if (evt.target.classList.contains('stroke-continuous')) {
        selector.querySelectorAll('div').forEach((elem) => {
          elem.classList.remove('active');
        });

        selector.querySelector('div.stroke-continuous').classList.add('active');
        this.currentLineDash = undefined;
      } else if (evt.target.classList.contains('stroke-dots-lines')) {
        selector.querySelectorAll('div').forEach((elem) => {
          elem.classList.remove('active');
        });

        if (evt.target.classList.contains('active')) {
          selector.querySelector('div.stroke-continuous').classList.add('active');
          this.currentLineDash = undefined;
        } else {
          selector.querySelector('div.stroke-dots-lines').classList.add('active');
          this.currentLineDash = LINE_POINTS;
        }
      } else if (evt.target.classList.contains('stroke-lines')) {
        selector.querySelectorAll('div').forEach((elem) => {
          elem.classList.remove('active');
        });

        if (evt.target.classList.contains('active')) {
          selector.querySelector('div.stroke-continuous').classList.add('active');
          this.currentLineDash = undefined;
        } else {
          selector.querySelector('div.stroke-lines').classList.add('active');
          this.currentLineDash = LINES;
        }
      } else if (evt.target.classList.contains('stroke-dots')) {
        selector.querySelectorAll('div').forEach((elem) => {
          elem.classList.remove('active');
        });

        if (evt.target.classList.contains('active')) {
          selector.querySelector('div.stroke-continuous').classList.add('active');
          this.currentLineDash = undefined;
        } else {
          selector.querySelector('div.stroke-dots').classList.add('active');
          this.currentLineDash = POINTS;
        }
      }

      this.styleChange(e);
    });
  }

  toogleCollapse(e) {
    const elem = document.querySelector('#drawingtools .drawingToolsContainer');
    if (elem !== null) {
      if (elem.style.display !== 'none') {
        elem.style.display = 'none';
        const cond = this.drawLayer.getGeometryType() !== null && this.drawLayer.getGeometryType().toLowerCase() === 'linestring';
        if (cond || (this.drawLayer.geometry !== undefined && this.drawLayer.geometry !== '' && this.drawLayer.geometry.toLowerCase() === 'linestring')) {
          document.querySelector('#drawingtools .collapsor').innerHTML = `${getValue('symbology_profile')}&nbsp;&nbsp;<span class="icon-show"></span>`;
        } else {
          document.querySelector('#drawingtools .collapsor').innerHTML = `${getValue('symbology')}&nbsp;&nbsp;<span class="icon-show"></span>`;
        }
      } else {
        elem.style.display = 'block';
        document.querySelector('#drawingtools .collapsor').innerHTML = `${getValue('collapse')}&nbsp;&nbsp;<span class="icon-hide"></span>`;
      }
    }
  }

  /**
   * Creates upload options template.
   *
   * @public
   * @function
   * @api
   */
  createUploadingTemplate() {
    const accept = '.kml, .zip, .gpx, .geojson, .gml, .json';
    this.uploadingTemplate = M.template.compileSync(uploadingTemplate, {
      jsonp: true,
      vars: {
        accept,
        translations: {
          accepted: getValue('accepted'),
          select_file: getValue('select_file'),
          from_url: getValue('from_url'),
        },
      },
    });

    this.accessibilityTab(this.uploadingTemplate);

    const inputFile = this.uploadingTemplate.querySelector('#vectors-uploading>input');
    const fromURL = this.uploadingTemplate.querySelector('#vectors-uploading #uploadFromURL');
    const labelFileInput = this.uploadingTemplate.querySelector('#labelFileInput');
    inputFile.addEventListener('change', (evt) => this.changeFile(evt, inputFile.files[0]));
    labelFileInput.addEventListener('keydown', (evt) => (evt.keyCode === 13) && evt.target.click());
    fromURL.addEventListener('click', () => this.openFromURL());
    fromURL.addEventListener('keydown', (evt) => (evt.keyCode === 13) && this.openFromURL());
  }

  openFromURL() {
    const fromURL = M.template.compileSync(fromURLTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        translations: {
          url_layer: getValue('url_layer'),
          add_layer: getValue('add_layer'),
          clean: getValue('clean').split(' ')[0],
        },
      },
    });

    M.dialog.info(fromURL, getValue('add_from_url'), this.order);
    setTimeout(() => {
      const input = document.querySelector('#m-vectors-fromurl-search-input');
      document.querySelector('#m-vectors-fromurl-add-btn').addEventListener('click', () => {
        const url = input.value.trim();
        if (M.utils.isUrl(url)) {
          const fileName = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
          const extension = url.substring(url.lastIndexOf('.') + 1, url.length);
          if (['zip', 'kml', 'gpx', 'geojson', 'gml', 'json'].indexOf(extension) > -1) {
            const content = `<div class="m-vectors-loading"><p>${getValue('loading')}...</p><span class="icon-spinner" /></div>`;
            const previous = document.querySelector('.m-dialog .m-vectors-fromurl').innerHTML;
            document.querySelector('.m-dialog .m-vectors-fromurl').innerHTML = previous + content;
            M.remote.get(url).then((response) => {
              const source = response.text;
              let features = [];
              if (extension === 'zip') {
                const geojsonArray = [].concat(shp.parseZip(source));
                features = this.getImpl().loadAllInGeoJSONLayer(geojsonArray, fileName);
              } else if (extension === 'kml') {
                features = this.getImpl().loadKMLLayer(source, fileName, false);
              } else if (extension === 'gpx') {
                features = this.getImpl().loadGPXLayer(source, fileName);
              } else if (extension === 'geojson' || extension === 'json') {
                features = this.getImpl().loadGeoJSONLayer(source, fileName);
              } else if (extension === 'gml') {
                features = this.getImpl().loadGMLLayer(source, fileName);
              } else {
                M.dialog.error(getValue('exception.load'));
                return;
              }

              if (features.length === 0) {
                M.dialog.info(getValue('exception.no_geoms'), null, this.order);
              } else {
                this.getImpl().centerFeatures(features, extension === 'gpx');
              }

              input.value = '';
              document.querySelector('.m-dialog .m-vectors-fromurl .m-vectors-loading').remove();
            }).catch((err) => {
              input.value = '';
              M.dialog.error(getValue('exception.load_correct'));
            });
          } else {
            input.value = '';
            M.dialog.error(getValue('exception.extension'));
          }
        } else {
          input.value = '';
          M.dialog.error(getValue('exception.url_not_valid'));
        }
      });

      document.querySelector('#m-vectors-fromurl-clean-btn').addEventListener('click', () => {
        input.value = '';
      });

      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.innerHTML = getValue('close');
      button.style.width = '75px';
      button.style.backgroundColor = '#71a7d3';
    }, 10);
  }

  /**
   * Adds event listeners to geometry buttons.
   * @public
   * @function
   * @api
   * @param {String} html - Geometry buttons template.
   */
  addEvents(html) {
    document.querySelector('.m-vectors > button.m-panel-btn').addEventListener('click', this.toogleActivate.bind(this));
    html.querySelector('#vector-add-point').addEventListener('click', this.addNewLayer.bind(this, 'Point'));
    html.querySelector('#vector-add-line').addEventListener('click', this.addNewLayer.bind(this, 'LineString'));
    html.querySelector('#vector-add-poly').addEventListener('click', this.addNewLayer.bind(this, 'Polygon'));
    html.querySelector('#vector-add-wfs').addEventListener('click', this.openAddWFS.bind(this));
    html.querySelector('#vector-upload').addEventListener('click', () => this.openUploadOptions());
    html.querySelector('#vector-question').addEventListener('click', this.createHelp.bind(this));
    this.addDragDropEvents();
  }

  createHelp() {
    const help = M.template.compileSync(helpTemplate, {
      jsonp: true,
      parseToHtml: false,
    });
    M.dialog.info(help, getValue('help_template.help'), this.order);
    document.querySelector('#m-vectors-help-create-layers').innerHTML = getValue('help_template.create_layers');
    document.querySelector('#m-vectors-help-create-layers-content').innerHTML = getValue('help_template.create_layers_content');
    document.querySelector('#m-vectors-help-addWFS').innerHTML = getValue('help_template.add_wfs');
    document.querySelector('#m-vectors-help-addWFS-content').innerHTML = getValue('help_template.add_wfs_content');
    document.querySelector('#m-vectors-help-loaded-layer').innerHTML = getValue('help_template.loaded_layer');
    document.querySelector('#m-vectors-help-loaded-layer-content').innerHTML = getValue('help_template.loaded_layer_content');
    const button = document.querySelector('div.m-dialog.info div.m-button > button');
    button.innerHTML = getValue('close');
    button.style.width = '75px';

    setTimeout(() => {
      document.querySelector('.m-dialog.info div.m-title').style.backgroundColor = '#71a7d3';
      document.querySelector('.m-modal .m-content .m-button button').style.backgroundColor = '#71a7d3';
    }, 10);
  }

  openAddWFS() {
    const addWFS = M.template.compileSync(addWFSTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        hasPrecharged: this.precharged.length > 0,
        precharged: this.precharged,
        translations: {
          url_service: getValue('url_service'),
          query: getValue('query'),
          clean: getValue('clean'),
          availables: getValue('availables'),
          loaded_services: getValue('loaded_services'),
        },
        order: this.order,
      },
    });

    M.dialog.info(addWFS, getValue('add_wfs_layer'), this.order);
    setTimeout(() => {
      if (document.querySelector('#m-vectors-addwfs-list-btn') !== null) {
        document.querySelector('#m-vectors-addwfs-list-btn').addEventListener('click', (e) => this.showSuggestions(e));
      }

      document.querySelector('#m-vectors-addwfs-search-input').addEventListener('keyup', (e) => {
        const url = document.querySelector('#m-vectors-addwfs-search-input').value.trim();
        document.querySelector('#m-vectors-addwfs-search-input').value = url;
      });

      document.querySelector('#m-vectors-addwfs-search-btn').addEventListener('click', (e) => this.readWFSCapabilities(e));
      document.querySelector('#m-vectors-addwfs-search-btn').addEventListener('keydown', (e) => (e.keyCode === 13) && this.readWFSCapabilities(e));
      document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.innerHTML = getValue('close');
      button.style.width = '75px';
      button.style.backgroundColor = '#71a7d3';
      document.querySelectorAll('#m-vectors-addwfs-suggestions .m-vectors-addwfs-suggestion').forEach((elem) => {
        elem.addEventListener('click', (e) => this.loadSuggestion(e));
      });
    }, 10);
  }

  showSuggestions() {
    document.querySelector('#m-vectors-addwfs-results').innerHTML = '';
    document.querySelector('#m-vectors-addwfs-suggestions').style.display = 'block';
  }

  loadSuggestion(evt) {
    const url = evt.target.getAttribute('data-link');
    document.querySelector('div.m-dialog #m-vectors-addwfs-search-input').value = url;
    this.readWFSCapabilities(evt);
  }

  /**
   * This function reads WFS service capabilities
   *
   * @function
   * @private
   * @param {Event} evt - Click event
   */
  readWFSCapabilities(evt) {
    evt.preventDefault();
    document.querySelector('#m-vectors-addwfs-suggestions').style.display = 'none';
    let url = document.querySelector('div.m-dialog #m-vectors-addwfs-search-input').value.trim();
    const auxurl = document.querySelector('div.m-dialog #m-vectors-addwfs-search-input').value.trim();
    if (!M.utils.isNullOrEmpty(url)) {
      if (M.utils.isUrl(url)) {
        url += url.endsWith('?') ? '' : '?';
        url += 'service=WFS&request=GetCapabilities';
        M.remote.get(url).then((response) => {
          try {
            const services = [];
            const prenode = response.text.split('<FeatureTypeList>')[1].split('</FeatureTypeList>')[0];
            if (prenode.indexOf('<FeatureType>') > -1) {
              const nodes = prenode.split('<FeatureType>');
              nodes.forEach((node) => {
                if (node.indexOf('</Name>') > -1) {
                  services.push({
                    name: node.split('</Name>')[0].split('>')[1].trim(),
                    title: node.split('</Title>')[0].split('<Title>')[1].trim(),
                  });
                }
              });
            } else if (prenode.indexOf('<FeatureType') > -1) {
              const nodes = prenode.split('<FeatureType');
              nodes.forEach((node) => {
                if (node.indexOf('</Name>') > -1) {
                  services.push({
                    name: node.split('</Name>')[0].split('<Name>')[1].trim(),
                    title: node.split('</Title>')[0].split('<Title>')[1].trim(),
                  });
                }
              });
            }

            const capabilities = {};
            let hasCapabilities = false;
            try {
              capabilities.title = response.text.split('<ows:Title>')[1].split('</ows:Title>')[0];
              hasCapabilities = true;
            } catch (err) {
              hasCapabilities = hasCapabilities || false;
            }

            try {
              capabilities.abstract = response.text.split('<ows:Abstract>')[1].split('</ows:Abstract>')[0];
              hasCapabilities = true;
            } catch (err) {
              hasCapabilities = hasCapabilities || false;
            }

            try {
              capabilities.accessConstraints = response.text.split('<ows:AccessConstraints>')[1].split('</ows:AccessConstraints>')[0];
              hasCapabilities = true;
            } catch (err) {
              hasCapabilities = hasCapabilities || false;
            }

            document.querySelector('div.m-dialog #m-vectors-addwfs-search-input').value = auxurl;
            this.showResults(services, capabilities, hasCapabilities);
          } catch (err) {
            M.dialog.error(getValue('exception.capabilities'));
          }
        });
      } else {
        M.dialog.error(getValue('exception.valid_url'));
      }
    } else {
      M.dialog.error(getValue('exception.empty'));
    }
  }

  showResults(services, capabilities, hasCapabilities) {
    const selectWFS = M.template.compileSync(selectWFSTemplate, {
      jsonp: true,
      vars: {
        services,
        capabilities,
        hasCapabilities,
        translations: {
          select_service: getValue('select_service'),
          select: getValue('select'),
          show_service_info: getValue('show_service_info'),
          title: getValue('title'),
          abstract: getValue('abstract'),
          responsible: getValue('responsible'),
          access_constraints: getValue('access_constraints'),
        },
      },
    });

    this.accessibilityTab(selectWFS);

    document.querySelector('#m-vectors-addwfs-results').innerHTML = '';
    document.querySelector('#m-vectors-addwfs-results').appendChild(selectWFS);
    const selector = '#m-vectors-select-wfs .m-vectors-common-btn';
    document.querySelector(selector).addEventListener('click', (e) => this.openWFSFilters(e, services));
    const elem = document.querySelector('#m-vectors-select-wfs .m-vectors-wfs-show-capabilities');
    if (elem !== null) {
      elem.addEventListener('click', () => {
        const block = document.querySelector('#m-vectors-select-wfs .m-vectors-wfs-capabilities-container');
        if (block.style.display !== 'block') {
          block.style.display = 'block';
          elem.innerHTML = `<span class="icon-hide"></span>&nbsp;${getValue('hide_service_info')}`;
        } else {
          block.style.display = 'none';
          elem.innerHTML = `<span class="icon-show"></span>&nbsp;${getValue('show_service_info')}`;
        }
      });
    }
  }

  openWFSFilters(evt, services) {
    evt.preventDefault();
    const selected = document.querySelector('#m-vectors-wfs-select').value;
    let url = document.querySelector('div.m-dialog #m-vectors-addwfs-search-input').value.trim();
    url += url.endsWith('?') ? '' : '?';
    document.querySelector('div.m-mapea-container div.m-dialog').remove();
    let legend = selected;
    const filtered = services.filter((s) => {
      return s.name === selected;
    });

    if (filtered.length > 0) {
      legend = filtered[0].title;
    }

    this.getImpl().addWFSLayer(url, selected, legend);
  }

  addDragDropEvents() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    }, false);

    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
    }, false);

    document.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files;
      this.changeFile(e, files[0]);
    }, false);
  }

  addNewLayer(geom) {
    const layerName = `temp_${new Date().getTime()}`;
    const layer = new M.layer.Vector({ name: layerName, legend: layerName, extract: true });
    layer.geometry = geom;
    this.map.addLayers(layer);
    layer.setZIndex(layer.getZIndex() + PLUS_ZINDEX);
    setTimeout(() => {
      document.querySelector(`li[name="${layerName}"] span.m-vector-layer-add`).click();
    }, 100);
  }

  /**
   * Changes style of current feature.
   * @public
   * @function
   * @api
   * @param {Event} e - input on.change
   */
  styleChange(e) {
    if (this.feature) {
      this.currentColor = document.querySelector('#colorSelector').value;
      this.currentThickness = document.querySelector('#thicknessSelector').value;

      switch (this.feature.getGeometry().type) {
        case 'Point':
        case 'MultiPoint':
          const newPointStyle = {
            radius: this.currentThickness,
            fill: {
              color: this.currentColor,
            },
            stroke: {
              color: 'white',
              width: 2,
            },
          };

          if (this.feature.getStyle().getOptions().label !== undefined) {
            newPointStyle.label = this.feature.getStyle().getOptions().label;
          }

          if (this.feature !== undefined) {
            this.feature.setStyle(new M.style.Point(newPointStyle));
            this.style = this.feature.getStyle();
          }
          break;
        case 'LineString':
        case 'MultiLineString':
          const newLineStyle = new M.style.Line({
            stroke: {
              color: this.currentColor,
              width: this.currentThickness,
              linedash: this.currentLineDash,
            },
          });
          if (this.feature !== undefined) {
            this.feature.setStyle(newLineStyle);
            this.style = this.feature.getStyle();
          }
          break;
        case 'Polygon':
        case 'MultiPolygon':
          const newPolygonStyle = new M.style.Polygon({
            fill: {
              color: this.currentColor,
              opacity: 0.2,
            },
            stroke: {
              color: this.currentColor,
              width: this.currentThickness,
            },
          });
          if (this.feature !== undefined) {
            this.feature.setStyle(newPolygonStyle);
            this.style = this.feature.getStyle();
          }
          break;
        default:
          break;
      }
    } else if (document.querySelector('#colorSelector') !== null) {
      this.currentColor = document.querySelector('#colorSelector').value;
      this.currentThickness = document.querySelector('#thicknessSelector').value;
    }
  }

  /**
   * Sets style for a point, line or polygon feature
   * @public
   * @function
   * @api
   * @param {*} feature
   * @param {*} geometryType - Point / LineString / Polygon
   */
  setFeatureStyle(feature, geometryType) {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        feature.setStyle(new M.style.Point({
          radius: this.currentThickness,
          fill: {
            color: this.currentColor,
          },
          stroke: {
            color: 'white',
            width: 2,
          },
        }));
        break;
      case 'LineString':
      case 'MultiLineString':
        feature.setStyle(new M.style.Line({
          stroke: {
            color: this.currentColor,
            width: this.currentThickness,
            linedash: this.currentLineDash,
          },
        }));
        break;
      case 'Polygon':
      case 'MultiPolygon':
        feature.setStyle(new M.style.Polygon({
          fill: {
            color: this.currentColor,
            opacity: 0.2,
          },
          stroke: {
            color: this.currentColor,
            width: Number.parseInt(this.currentThickness, 10),
          },
        }));
        break;
      default:
        throw new Error(getValue('exception.unknown_geom'));
    }
  }

  /**
   * Opens download template
   * @public
   * @function
   * @api
   */
  openDownloadOptions(layer) {
    const selector = `.m-vectors #m-vector-list li[name="${layer.name}"] .m-vector-layer-actions-container`;
    if (this.isDownloadActive) {
      document.querySelector(selector).innerHTML = '';
      this.isDownloadActive = false;
    } else {
      const html = M.template.compileSync(downloadingTemplate, {
        jsonp: true,
        vars: {
          translations: {
            download: getValue('download'),
          },
        },
      });
      this.accessibilityTab(html);
      document.querySelector(selector).appendChild(html);
      html.querySelector('button').addEventListener('click', this.downloadLayer.bind(this, layer));
      this.isDownloadActive = true;
    }
  }

  /**
   * Opens upload template
   * @public
   * @function
   * @api
   */
  openUploadOptions() {
    if (this.html.querySelector('#vectors-uploading') !== null) {
      this.html.querySelector('.m-vectors-general-container').innerHTML = '';
    } else {
      this.html.querySelector('.m-vectors-general-container').appendChild(this.uploadingTemplate);
    }
  }

  /**
   * Parses geojsonLayer removing last item on every coordinate (NaN)
   * before converting the layer to kml.
   * @public
   * @function
   * @api
   * @param {*} geojsonLayer - geojson layer with drawn features
   */
  fixGeojsonKmlBug(geojsonLayer) {
    const newGeojsonLayer = geojsonLayer;
    const features = newGeojsonLayer.features;
    features.forEach((feature) => {
      switch (feature.geometry.type) {
        case 'Point':
          if (Number.isNaN(feature.geometry.coordinates[feature.geometry.coordinates.length - 1])) {
            feature.geometry.coordinates.pop();
          }
          break;
        case 'LineString':
          if (Number
            .isNaN(feature.geometry.coordinates[0][feature.geometry.coordinates[0].length - 1])) {
            feature.geometry.coordinates.map((line) => { return line.pop(); });
          }
          break;
        case 'Poylgon':
        case 'MultiPolygon':
          feature.geometry.coordinates.forEach((coord) => {
            if (feature.geometry.type === 'Polygon'
              && Number.isNaN(coord[0][coord[0].length - 1])) {
              coord.map((c) => {
                c.pop();
                return c;
              });
            } else if (feature.geometry.type === 'MultiPolygon'
              && Number.isNaN(coord[0][0][coord[0][0].length - 1])) {
              coord.forEach((coordsArray) => {
                coordsArray.map((c) => {
                  c.pop();
                  return c;
                });
              });
            }
          });
          break;
        default:
      }
    });

    newGeojsonLayer.features = features;
    return newGeojsonLayer;
  }

  /**
   * Parses geojson before shp download.
   * Changes geometry type to simple when necessary and removes one pair of brackets.
   * @public
   * @function
   * @api
   * @param {*} geojsonLayer - geojson layer with drawn and uploaded features
   */
  parseGeojsonForShp(geojsonLayer) {
    const newGeoJson = geojsonLayer;
    const newFeatures = [];

    geojsonLayer.features.forEach((originalFeature) => {
      const featureType = originalFeature.geometry.type;

      if (featureType.match(/^Multi/)) {
        const features = originalFeature.geometry.coordinates
          .map((simpleFeatureCoordinates, idx) => {
            const newFeature = {
              type: 'Feature',
              id: `${originalFeature.id}${idx}`,
              geometry: {
                type: '',
                coordinates: simpleFeatureCoordinates,
              },
              properties: {},
            };
            switch (featureType) {
              case 'MultiPoint':
                newFeature.geometry.type = 'Point';
                break;
              case 'MultiLineString':
                newFeature.geometry.type = 'LineString';
                break;
              case 'MultiPolygon':
                newFeature.geometry.type = 'Polygon';
                break;
              default:
            }
            return newFeature;
          });
        newFeatures.push(...features);
      } else {
        newFeatures.push(originalFeature);
      }
    });

    newGeoJson.features = newFeatures;
    for (let i = 0; i < newGeoJson.features.length; i += 1) {
      delete newGeoJson.features[i].id;
    }
    return newGeoJson;
  }

  /**
   * Creates vector layer copy of __draw__ layer excluding text features.
   * @public
   * @function
   * @api
   * @returns {M.layer.Vector}
   */
  toGeoJSON(layer) {
    const code = this.map.getProjection().code;
    const featuresAsJSON = layer.getFeatures().map((feature) => feature.getGeoJSON());
    return { type: 'FeatureCollection', features: this.geojsonTo4326(featuresAsJSON, code) };
  }

  /**
   * Downloads selected layer as GeoJSON, kml, gpx or shp.
   * @public
   * @function
   * @api
   */
  downloadLayer(layer) {
    const fileName = layer.legend || layer.name;
    const selector = `.m-vectors #m-vector-list li[name="${layer.name}"] .m-vector-layer-actions-container`;
    const downloadFormat = document.querySelector(selector).querySelector('select').value;
    const geojsonLayer = this.toGeoJSON(layer);
    let arrayContent;
    let mimeType;
    let extensionFormat;

    switch (downloadFormat) {
      case 'geojson':
        arrayContent = JSON.stringify(geojsonLayer);
        mimeType = 'geo+json';
        extensionFormat = 'geojson';
        break;
      case 'kml':
        const fixedGeojsonLayer = this.fixGeojsonKmlBug(geojsonLayer);
        arrayContent = tokml(fixedGeojsonLayer);
        mimeType = 'vnd.google-earth.kml+xml';
        extensionFormat = 'kml';
        break;
      case 'gpx':
        arrayContent = togpx(geojsonLayer);
        mimeType = 'gpx+xml';
        extensionFormat = 'gpx';
        break;
      case 'shp':
        const json = this.parseGeojsonForShp(geojsonLayer);
        const options = {
          folder: fileName,
          types: {
            point: 'points',
            polygon: 'polygons',
            line: 'lines',
          },
        };
        shpWrite.download(json, options);
        break;
      default:
        M.dialog.error(getValue('exception.format_not_selected'));
        break;
    }

    if (downloadFormat !== 'shp') {
      const url = window.URL.createObjectURL(new window.Blob([arrayContent], {
        type: `application/${mimeType}`,
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}.${extensionFormat}`);
      document.body.appendChild(link);
      link.click();
    }

    document.querySelector(selector).innerHTML = '';
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {M.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof VectorsControl;
  }

  /* Layer upload */

  /**
   * Changes selected file.
   * @public
   * @function
   * @api
   * @param {Event} evt - file input change event
   * @param {File} file - selected file on file input
   */
  changeFile(evt, file) {
    this.file_ = file;
    if (!M.utils.isNullOrEmpty(file)) {
      if (file.size > 20971520) {
        M.dialog.info(getValue('exception.size'), null, this.order);
        this.file_ = null;
        this.uploadingTemplate.querySelector('#vectors-uploading>input').value = '';
      } else {
        this.loadLayer();
      }
    }
  }

  /**
   * Loads vector layer on map.
   * @public
   * @function
   * @api
   */
  loadLayer() {
    // eslint-disable-next-line no-bitwise
    const fileExt = this.file_.name.slice((this.file_.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    const fileName = this.file_.name.split('.').slice(0, -1).join('.');
    const fileReader = new window.FileReader();
    fileReader.addEventListener('load', (e) => {
      try {
        let features = [];
        if (fileExt === 'zip') {
          // In case of shp group, this unites features
          const geojsonArray = [].concat(shp.parseZip(fileReader.result));
          features = this.getImpl().loadAllInGeoJSONLayer(geojsonArray, fileName);
        } else if (fileExt === 'kml') {
          features = this.getImpl().loadKMLLayer(fileReader.result, fileName, false);
        } else if (fileExt === 'gpx') {
          features = this.getImpl().loadGPXLayer(fileReader.result, fileName);
        } else if (fileExt === 'geojson' || fileExt === 'json') {
          features = this.getImpl().loadGeoJSONLayer(fileReader.result, fileName);
        } else if (fileExt === 'gml') {
          features = this.getImpl().loadGMLLayer(fileReader.result, fileName);
        } else {
          M.dialog.error(getValue('exception.load'));
          return;
        }

        if (features.length === 0) {
          M.dialog.info(getValue('exception.no_geoms'), null, this.order);
        } else {
          this.getImpl().centerFeatures(features, fileExt === 'gpx');
        }

        this.uploadingTemplate.querySelector('#vectors-uploading>input').value = '';
      } catch (error) {
        this.uploadingTemplate.querySelector('#vectors-uploading>input').value = '';
        M.dialog.error(getValue('exception.load_correct'));
      }
    });

    if (fileExt === 'zip') {
      fileReader.readAsArrayBuffer(this.file_);
    } else if (fileExt === 'kml' || fileExt === 'gpx' || fileExt === 'geojson' || fileExt === 'gml' || fileExt === 'json') {
      fileReader.readAsText(this.file_);
    } else {
      M.dialog.error(getValue('exception.extension'));
    }
  }

  /**
   * Creates GeoJSON feature from a previous feature and a new set of coordinates.
   * @public
   * @function
   * @api
   * @param {GeoJSON Feature} previousFeature
   * @param {Array} coordinates
   */
  createGeoJSONFeature(previousFeature, coordinates) {
    return {
      ...previousFeature,
      geometry: {
        type: previousFeature.geometry.type,
        coordinates,
      },
    };
  }

  /**
    * Este método transforma coordenadas a EPSG:4326.
    *
    * @function
    * @param {String} type Tipo de geometría.
    * @param {Object} codeProjection Código de proyección actual.
    * @param {Number|Array} coordinates Coordenadas a transformar.
    * @return {Array} Coordenadas transformadas.
    * @public
    * @api
    */
  geometryTypeCoordTransform(type, codeProjection, coordinates) {
    const newCoordinates = [];
    switch (type) {
      case 'Point':
        return this.getImpl().getTransformedCoordinates(codeProjection, coordinates);
      case 'MultiPoint':
      case 'LineString':
        for (let i = 0; i < coordinates.length; i += 1) {
          const newDot = this.getImpl().getTransformedCoordinates(codeProjection, coordinates[i]);
          newCoordinates.push(newDot);
        }
        return newCoordinates;
      case 'MultiLineString':
      case 'Polygon':
        for (let i = 0; i < coordinates.length; i += 1) {
          const group = [];
          for (let j = 0; j < coordinates[i].length; j += 1) {
            const dot = this.getImpl().getTransformedCoordinates(codeProjection, coordinates[i][j]);
            group.push(dot);
          }
          newCoordinates.push(group);
        }
        return newCoordinates;
      case 'MultiPolygon':
        for (let i = 0; i < coordinates.length; i += 1) {
          const group = [];
          for (let j = 0; j < coordinates[i].length; j += 1) {
            const newPolygon = [];
            const aux = coordinates[i][j];
            for (let k = 0; k < aux.length; k += 1) {
              const dot = this.getImpl().getTransformedCoordinates(codeProjection, aux[k]);
              newPolygon.push(dot);
            }
            group.push(newPolygon);
          }
          newCoordinates.push(group);
        }
        return newCoordinates;
      default:
        return newCoordinates;
    }
  }

  /**
   * Converts features coordinates on geojson format to 4326.
   * @public
   * @function
   */
  geojsonTo4326(featuresAsJSON, codeProjection) {
    const jsonResult = [];
    featuresAsJSON.forEach((featureAsJSON) => {
      let jsonFeature;
      if (featureAsJSON.geometry.type !== 'GeometryCollection') {
        const newCoordinates = this.geometryTypeCoordTransform(
          featureAsJSON.geometry.type,
          codeProjection,
          featureAsJSON.geometry.coordinates,
        );
        jsonFeature = this.createGeoJSONFeature(featureAsJSON, newCoordinates);
      } else {
        const collection = featureAsJSON.geometry.geometries.map((g) => {
          return {
            type: g.type,
            coordinates: this.geometryTypeCoordTransform(g.type, codeProjection, g.coordinates),
          };
        });
        jsonFeature = { ...featureAsJSON, geometry: { type: 'GeometryCollection', geometries: collection } };
      }
      jsonResult.push(jsonFeature);
    });
    return jsonResult;
  }

  /**
   * Modifies drawing tools, updates inputs, emphasizes selection
   * and shows feature info on select.
   * @public
   * @function
   * @api
   * @param {Event}
   */
  onSelect(e) {
    if (this.style !== undefined && this.feature !== undefined) {
      this.feature.setStyle(this.style);
    }
    this.style = undefined;
    const MFeatures = this.drawLayer.getFeatures();
    const olFeature = e.target.getFeatures().getArray()[0];
    this.feature = MFeatures.filter((f) => f.getImpl().getOLFeature() === olFeature)[0]
      || undefined;
    this.geometry = this.feature.getGeometry().type;
    const selector = `#m-vector-list li[name="${this.drawLayer.name}"] div.m-vector-layer-actions-container`;
    document.querySelector(selector).appendChild(this.drawingTools);
    document.querySelector('div.m-vector-layer-actions-container #drawingtools button').style.display = 'block';
    if (document.querySelector('.ol-profil.ol-unselectable.ol-control-vector') !== null) {
      document.querySelector('.ol-profil.ol-unselectable.ol-control-vector').remove();
    }

    this.emphasizeSelectedFeature();
    this.showFeatureInfo();
  }

  /**
   * Emphasizes selection and shows feature info after feature is modified.
   * @public
   * @function
   * @api
   */
  onModify() {
    this.emphasizeSelectedFeature();
    this.showFeatureInfo();
    if (document.querySelector('.ol-profil.ol-unselectable.ol-control-vector') !== null) {
      document.querySelector('.ol-profil.ol-unselectable.ol-control-vector').remove();
    }
  }

  /**
   * Controls clicks events of each layer
   * @public
   * @function
   * @api stable
   */
  clickLayer(evtParameter) {
    const evt = (evtParameter || window.event);
    const layerName = evt.target.getAttribute('data-layer-name');
    const layerURL = evt.target.getAttribute('data-layer-url');
    let render = false;
    if (!M.utils.isNullOrEmpty(layerName)) {
      evt.stopPropagation();
      const layer = this.map.getLayers().filter((l) => l.name === layerName && (l.url === layerURL || layerURL === ''))[0];
      if (evt.target.classList.contains('m-vector-layer-legend-change')) {
        const changeName = M.template.compileSync(changeNameTemplate, {
          jsonp: true,
          parseToHtml: false,
          vars: {
            name: layer.legend || layer.name,
            translations: {
              change: getValue('change'),
            },
            order: this.order,
          },
        });

        M.dialog.info(changeName, getValue('change_name'), this.order);
        setTimeout(() => {
          const selector = 'div.m-mapea-container div.m-dialog #m-layer-change-name button';
          document.querySelector(selector).addEventListener('click', this.changeLayerLegend.bind(this, layer));
          document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
          const button = document.querySelector('div.m-dialog.info div.m-button > button');
          button.innerHTML = getValue('close');
          button.style.width = '75px';
          button.style.backgroundColor = '#71a7d3';
        }, 10);
      } else if (evt.target.classList.contains('m-vector-layer-add')) {
        this.isDownloadActive = false;
        this.openDrawOptions(layer);
      } else if (evt.target.classList.contains('m-vector-layer-edit')) {
        this.isDownloadActive = false;
        this.openEditOptions(layer, false);
      } else if (evt.target.classList.contains('m-vector-layer-zoom')) {
        this.isDownloadActive = false;
        this.resetInteractions();
        if (layer.type === 'WFS' || (layer.type === 'Vector' && layer.getFeatures().length > 0)) {
          const extent = layer.getMaxExtent();
          this.map.setBbox(extent);
        } else if (layer.type === 'KML') {
          const extent = layer.getImpl().getExtent();
          this.map.setBbox(extent);
        } else if (layer.type === 'GeoJSON') {
          const extent = this.getImpl().getGeoJSONExtent(layer);
          this.map.setBbox(extent);
        } else {
          M.dialog.info(getValue('exception.not_extent'), getValue('info'), this.order);
        }
      } else if (evt.target.classList.contains('m-vector-layer-reload')) {
        this.getImpl().reloadFeaturesUpdatables(layer.name, layer.url);
      } else if (evt.target.classList.contains('m-vector-layer-toogle')) {
        this.isDownloadActive = false;
        this.resetInteractions();
        layer.setVisible(!layer.visible);
        layer.visible = !layer.visible;
        render = true;
      } else if (evt.target.classList.contains('m-vector-layer-download')) {
        this.resetInteractions();
        this.openDownloadOptions(layer);
      } else if (evt.target.classList.contains('m-vector-layer-delete')) {
        this.isDownloadActive = false;
        this.resetInteractions();
        this.map.removeLayers(layer);
        render = true;
      }
    }

    if (render) {
      this.renderLayers();
    }
  }

  resetInteractions() {
    this.deactivateDrawing();
    this.deactivateSelection();
    this.isDrawingActive = false;
    this.isEditionActive = false;
    this.drawLayer = undefined;
  }

  changeLayerLegend(layer) {
    const selector = 'div.m-mapea-container div.m-dialog #m-layer-change-name input';
    const newValue = document.querySelector(selector).value.trim();
    if (newValue.length > 0) {
      layer.setLegend(newValue);
      this.renderLayers();
      document.querySelector('div.m-mapea-container div.m-dialog').remove();
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

  openDrawOptions(layer) {
    this.isEditionActive = false;
    this.deactivateSelection();
    this.deactivateDrawing();
    if (document.querySelector('.ol-profil.ol-unselectable.ol-control-vector') !== null) {
      document.querySelector('.ol-profil.ol-unselectable.ol-control-vector').remove();
    }

    const cond = this.drawLayer !== undefined && layer.name !== this.drawLayer.name;
    if (cond || !this.isDrawingActive) {
      this.invokeEscKey();
      this.drawLayer = layer;
      this.isDrawingActive = true;
      this.drawingTools.querySelector('button.m-vector-layer-profile').style.display = 'none';
      this.drawingTools.querySelector('button.m-vector-layer-add-points').style.display = 'none';
      this.drawingTools.querySelector('button.m-vector-layer-delete-feature').style.display = 'none';
      const selector = `#m-vector-list li[name="${layer.name}"] div.m-vector-layer-actions-container`;
      const selector2 = `#m-vector-list li[name="${layer.name}"] div.m-vector-layer-actions .m-vector-layer-add`;
      document.querySelector(selector).appendChild(this.drawingTools);
      document.querySelector(selector2).classList.add('active-tool');
      this.getImpl().addDrawInteraction(layer);
      if (document.querySelector('#drawingtools #featureInfo') !== null) {
        document.querySelector('#drawingtools #featureInfo').style.display = 'none';
      }

      const elem = document.querySelector('#drawingtools .drawingToolsContainer');
      if (elem.style.display === 'none') {
        const cond2 = this.drawLayer.getGeometryType() !== null && this.drawLayer.getGeometryType().toLowerCase() === 'linestring';
        if (cond2 || (this.drawLayer.geometry !== undefined && this.drawLayer.geometry !== '' && this.drawLayer.geometry.toLowerCase() === 'linestring')) {
          document.querySelector('#drawingtools .collapsor').innerHTML = `${getValue('symbology_profile')}&nbsp;&nbsp;<span class="icon-show"></span>`;
        } else {
          document.querySelector('#drawingtools .collapsor').innerHTML = `${getValue('symbology')}&nbsp;&nbsp;<span class="icon-show"></span>`;
        }
      }
    } else {
      this.isDrawingActive = false;
      this.drawLayer = undefined;
    }
  }

  openEditOptions(layer, afterDelete) {
    this.isDrawingActive = false;
    this.deactivateSelection();
    this.deactivateDrawing();
    if (document.querySelector('.ol-profil.ol-unselectable.ol-control-vector') !== null) {
      document.querySelector('.ol-profil.ol-unselectable.ol-control-vector').remove();
    }

    const cond = this.drawLayer !== undefined && layer.name !== this.drawLayer.name;
    if (cond || !this.isEditionActive) {
      this.invokeEscKey();
      if (layer.getFeatures().length > 0) {
        this.drawLayer = layer;
        this.isEditionActive = true;
        this.getImpl().activateSelection(layer);
        const selector = `#m-vector-list li[name="${layer.name}"] div.m-vector-layer-actions .m-vector-layer-edit`;
        document.querySelector(selector).classList.add('active-tool');
      } else if (!afterDelete) {
        M.dialog.error(getValue('exception.no_features'), getValue('warning'));
      }
    } else {
      this.isEditionActive = false;
      this.drawLayer = undefined;
    }
  }

  /**
   * Checks if any drawing button is active and deactivates it,
   * deleting drawing interaction.
   * @public
   * @function
   * @api
   */
  deactivateDrawing() {
    const selector = '.m-vectors #m-vector-list div.m-vector-layer-actions-container';
    const selector2 = '#m-vector-list div.m-vector-layer-actions span';
    document.querySelectorAll(selector).forEach((elem) => {
      /* eslint-disable no-param-reassign */
      elem.innerHTML = '';
    });

    document.querySelectorAll(selector2).forEach((elem) => {
      /* eslint-disable no-param-reassign */
      elem.classList.remove('active-tool');
    });

    this.feature = undefined;
    this.emphasizeSelectedFeature();
    this.getImpl().removeDrawInteraction();
  }

  /**
   * Deletes selected geometry.
   * @public
   * @function
   * @api
   */
  deleteSingleFeature() {
    this.drawLayer.removeFeatures([this.feature]);
    this.feature = undefined;
    this.geometry = undefined;
    this.selectionLayer.removeFeatures([this.emphasis]);
    if (this.isEditionActive) {
      this.isEditionActive = false;
      this.openEditOptions(this.drawLayer, true);
    }
  }

  /**
   * Continues drawing selected feature
   * @public
   * @function
   * @api
   */
  activeAddPoints() {
    this.getImpl().addAddPointsInteraction(this.drawLayer, this.feature);
  }

  /**
   * After draw interaction event is over,
   * updates feature style, inputs, adds feature to draw layer,
   * shows feature info and emphasizes it.
   * @public
   * @function
   * @api
   * @param {Event} event - 'drawend' triggering event
   */
  onDraw(event) {
    this.feature = event.feature;
    this.feature.setId(`${this.drawLayer.name}.${new Date().getTime()}`);
    this.feature = M.impl.Feature.olFeature2Facade(this.feature);
    this.geometry = this.feature.getGeometry().type;
    this.setFeatureStyle(this.feature, this.geometry);
    document.querySelector('.m-vectors #drawingtools button').style.display = 'block';
    this.drawLayer.addFeatures(this.feature);
    this.emphasizeSelectedFeature();
    this.showFeatureInfo();
    this.getImpl().calculateElevations(this.feature);
  }

  /**
   * Clears selection layer.
   * Draws square around feature and adds it to selection layer.
   * For points:
   *    If feature doesn't have style, sets new style.
   * @public
   * @function
   * @api
   */
  emphasizeSelectedFeature() {
    this.emphasis = null;
    this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());

    if (this.feature) {
      if ((this.geometry === 'Point' || this.geometry === 'MultiPoint')) {
        this.emphasis = this.getImpl().getMapeaFeatureClone();
        this.emphasis.setStyle(new M.style.Point({
          radius: 20,
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      } else {
        // eslint-disable-next-line no-underscore-dangle
        const extent = this.getImpl().getFeatureExtent();
        this.emphasis = M.impl.Feature.olFeature2Facade(this.getImpl().newPolygonFeature(extent));
        this.emphasis.setStyle(new M.style.Line({
          stroke: {
            color: '#FF0000',
            width: 2,
          },
        }));
      }
      this.selectionLayer.addFeatures([this.emphasis]);
    }
  }

  /**
   * On select, shows feature info.
   * @public
   * @function
   * @api
   */
  showFeatureInfo() {
    const infoContainer = document.querySelector('#drawingtools #featureInfo');
    document.querySelector('#drawingtools button.m-vector-layer-profile').style.display = 'none';
    document.querySelector('#drawingtools button.m-vector-layer-add-points').style.display = 'none';
    if (infoContainer !== null) {
      infoContainer.style.display = 'block';
      infoContainer.innerHTML = '';
    }

    switch (this.geometry) {
      case 'Point':
      case 'MultiPoint':
        const x = this.getImpl().getFeatureCoordinates()[0];
        const y = this.getImpl().getFeatureCoordinates()[1];
        if (infoContainer !== null) {
          document.querySelector('#drawingtools div.stroke-container').style.display = 'none';
          let html = `<table class="m-vectors-results-table"><tbody><tr><td><b>${getValue('coordinates')}</b></td>`;
          html += `<td><b>X:</b> ${Math.round(x * 1000) / 1000}</td><td><b>Y:</b> ${Math.round(y * 1000) / 1000}</td>`;
          html += '</tr></tbody></table>';
          infoContainer.innerHTML = html;
          if (this.feature.getStyle() !== undefined && this.feature.getStyle() !== null) {
            const style = this.feature.getStyle().getOptions();
            this.currentColor = style.fill.color;
            document.querySelector('#colorSelector').value = style.fill.color;
            this.currentThickness = style.radius || 6;
            document.querySelector('#thicknessSelector').value = style.radius || 6;
          }
        }
        break;
      case 'LineString':
      case 'MultiLineString':
        const lineLength = this.getImpl().getFeatureLength();
        let m = `${formatNumber(lineLength / 1000, 2)}km`;
        if (lineLength < 1000) {
          m = `${formatNumber(lineLength, 0)}m`;
        }

        if (infoContainer !== null) {
          document.querySelector('#drawingtools div.stroke-container').style.display = 'block';
          const id = `m-vectors-3d-measure-${this.drawLayer.name.replaceAll(' ', '')}`;
          const attr = this.feature.getAttributes()['3dLength'];
          let html = `<table class="m-vectors-results-table"><tbody><tr><td><b>${getValue('length')}</b></td>`;
          if (attr !== undefined && attr.length > 0) {
            html += `<td><b>2D: </b>${m}</td><td><b>3D: </b><span>${attr}m</span></td>`;
          } else {
            html += `<td><b>2D: </b>${m}</td><td><b>3D: </b><span class="m-vectors-3d-measure" id="${id}">${getValue('calculate')}</span></td>`;
          }

          html += '</tr></tbody></table>';
          infoContainer.innerHTML = html;
          if (this.feature.getStyle() !== undefined && this.feature.getStyle() !== null) {
            const stroke = this.feature.getStyle().getOptions().stroke;
            this.currentColor = stroke.color;
            document.querySelector('#colorSelector').value = stroke.color;
            this.currentThickness = stroke.width || 6;
            document.querySelector('#thicknessSelector').value = stroke.width || 6;
            this.currentLineDash = stroke.linedash;
            const selector = this.drawingTools.querySelector('div.stroke-options');
            selector.querySelectorAll('div').forEach((elem) => {
              elem.classList.remove('active');
            });

            if (stroke.linedash !== undefined && stroke.linedash.length > 2) {
              selector.querySelector('div.stroke-dots-lines').classList.add('active');
            } else if (stroke.linedash !== undefined && stroke.linedash[0] > 2) {
              selector.querySelector('div.stroke-lines').classList.add('active');
            } else if (stroke.linedash !== undefined && stroke.linedash[0] < 2) {
              selector.querySelector('div.stroke-dots').classList.add('active');
            } else {
              selector.querySelector('div.stroke-continuous').classList.add('active');
            }
          }

          document.querySelector('#drawingtools button.m-vector-layer-profile').style.display = 'block';
          if (!this.isDrawingActive) {
            document.querySelector('#drawingtools button.m-vector-layer-add-points').style.display = 'block';
          }

          const elem = document.getElementById(id);
          if (elem !== null) {
            elem.addEventListener('click', () => {
              elem.classList.remove('m-vectors-3d-measure');
              elem.innerHTML = getValue('calculating');
              this.getImpl().get3DLength(id);
            });
          }
        }
        break;
      case 'Polygon':
      case 'MultiPolygon':
        const area = this.getImpl().getFeatureArea();
        let m2 = `${formatNumber(area / 1000000, 4)}km${'2'.sup()}`;
        if (area < 1000000) {
          m2 = `${formatNumber(area, 0)}m${'2'.sup()}`;
        }

        if (infoContainer !== null) {
          document.querySelector('#drawingtools div.stroke-container').style.display = 'none';
          let html = `<table class="m-vectors-results-table"><tbody><tr><td><b>${getValue('area')}</b></td>`;
          html += `<td>${m2}</td></tr></tbody></table>`;
          infoContainer.innerHTML = html;
          if (this.feature.getStyle() !== undefined && this.feature.getStyle() !== null) {
            const style = this.feature.getStyle().getOptions();
            this.currentColor = style.fill.color;
            document.querySelector('#colorSelector').value = style.fill.color;
            this.currentThickness = style.stroke.width || 6;
            document.querySelector('#thicknessSelector').value = style.stroke.width || 6;
          }

          if (this.geometry === 'Polygon') {
            document.querySelector('#drawingtools button.m-vector-layer-profile').style.display = 'block';
          }
        }
        break;
      default:
        if (document.querySelector('#drawingtools #featureInfo') !== null) {
          document.querySelector('#drawingtools div.stroke-container').style.display = 'none';
          document.querySelector('#drawingtools #featureInfo').style.display = 'none';
        }
        break;
    }
  }

  /**
   * Deactivates selection mode.
   * @public
   * @function
   * @api
   */
  deactivateSelection() {
    const selector = '.m-vectors #m-vector-list div.m-vector-layer-actions-container';
    const selector2 = '#m-vector-list div.m-vector-layer-actions span';
    document.querySelectorAll(selector).forEach((elem) => {
      /* eslint-disable no-param-reassign */
      elem.innerHTML = '';
    });

    document.querySelectorAll(selector2).forEach((elem) => {
      /* eslint-disable no-param-reassign */
      elem.classList.remove('active-tool');
    });
    this.getImpl().removeSelectInteraction();

    if (this.style !== undefined && this.feature !== undefined) {
      this.feature.setStyle(this.style);
    }
    this.style = undefined;
    this.feature = undefined;
    this.geometry = undefined;
    this.emphasizeSelectedFeature();
    this.getImpl().removeEditInteraction();
  }

  //  Esta función ordena todas las capas por zindex
  reorderLayers(layers) {
    const result = layers.sort((layer1, layer2) => layer1.getZIndex()
      - layer2.getZIndex()).reverse();
    return result;
  }

  getProfile() {
    if (document.querySelector('.ol-profil.ol-unselectable.ol-control-vector') !== null) {
      document.querySelector('.ol-profil.ol-unselectable.ol-control-vector').remove();
    }

    this.getImpl().calculateProfile(this.feature);
    this.drawingTools.querySelector('.collapsor').click();
    const content = `<div class="m-vectors-loading"><p>${getValue('generating_profile')}...</p><span class="icon-spinner" /></div>`;
    document.querySelector('.m-vectors .m-vectors-loading-container').innerHTML = content;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
