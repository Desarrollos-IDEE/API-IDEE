/**
 * @module IDEE/control/FullTOCControl
 */

/*
eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["item"] }]
*/

import Sortable from 'sortablejs';
import FullTOCImplControl from 'impl/fulltoccontrol';
import template from '../../templates/fulltoc';
import configTemplate from '../../templates/config';
import infoTemplate from '../../templates/information';
import addServicesTemplate from '../../templates/addservices';
import resultstemplate from '../../templates/addservicesresults';
import ogcModalTemplate from '../../templates/ogcmodal';
import customQueryFiltersTemplate from '../../templates/customqueryfilters';
import { getValue } from './i18n/language';

const CATASTRO = '//ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx';
const CODSI_CATALOG = 'http://www.idee.es/csw-codsi-idee/srv/spa/q?_content_type=json&bucket=s101&facet.q=type%2Fservice&fast=index&from=*1&serviceType=view&resultType=details&sortBy=title&sortOrder=asc&to=*2';
const CODSI_PAGESIZE = 9;

export default class FullTOCControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(http, https, precharged, codsi, order) {
    if (IDEE.utils.isUndefined(FullTOCImplControl)
      || (IDEE.utils.isObject(FullTOCImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(FullTOCImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }

    const impl = new FullTOCImplControl();
    super(impl, 'FullTOC');

    // facade control goes to impl as reference param
    impl.facadeControl = this;

    /**
     * Map
     * @private
     * @type {Object}
     */
    this.map_ = undefined;

    /**
     * Template
     * @private
     * @type {String}
     */
    this.template_ = undefined;

    this.http = http;

    this.https = https;

    this.precharged = precharged;

    this.codsi = codsi;

    this.stateSelectAll = false;

    this.filterName = undefined;

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
    // eslint-disable-next-line
    console.warn(getValue('exception.fulltoc_obsolete'));
    this.map_ = map;
    return new Promise((success, fail) => {
      this.getTemplateVariables(map).then((templateVars) => {
        const html = IDEE.template.compileSync(template, {
          vars: templateVars,
        });

        this.template_ = html;
        success(html);
        this.template_.addEventListener('click', this.clickLayer.bind(this), false);
        this.template_.addEventListener('keydown', (evt) => (evt.keyCode === 13) && evt.target.click());
        this.template_.addEventListener('input', this.inputLayer.bind(this), false);
        this.getImpl().registerEvents();
        this.render();
        this.afterRender(map.getLayers());
        setTimeout(() => {
          const openBtn = document.querySelector('.m-plugin-fulltoc .m-panel-btn.icon-capas');
          if (openBtn !== null) {
            openBtn.addEventListener('click', () => {
              this.template_.querySelector('.m-fulltoc-container .m-title .span-title').click();
              setTimeout(() => {
                this.template_.querySelector('.m-fulltoc-container .m-title .span-title').click();
              }, 100);
            });
          }
        }, 200);
      });
    });
  }

  afterRender(layers) {
    setTimeout(() => {
      this.template_.querySelector('.m-fulltoc-container .m-title .span-title').click();
    }, 700);

    if (layers !== undefined && layers.length > 0) {
      layers.forEach((l) => {
        l.getImpl().on(IDEE.evt.ADDED_TO_MAP, (layer) => {
          if (layer.getLayer() != null) {
            this.template_.querySelector('.m-fulltoc-container .m-title .span-title').click();
          }
        });
      });
    }
  }

  /**
   * Sets the visibility of the clicked layer
   *
   * @public
   * @function
   * @api stable
   */
  inputLayer(evtParameter) {
    const evt = (evtParameter || window.event);
    if (!IDEE.utils.isNullOrEmpty(evt.target)) {
      const layerName = evt.target.getAttribute('data-layer-name');
      if (!IDEE.utils.isNullOrEmpty(layerName)) {
        evt.stopPropagation();
        const layer = this.map_.getLayers().filter((l) => l.name === layerName)[0];
        if (evt.target.classList.contains('m-check')) {
          if (layer.transparent === true || !layer.isVisible()) {
            const opacity = evt.target.parentElement.parentElement.parentElement.parentElement.querySelector('div.tools > input');
            if (!IDEE.utils.isNullOrEmpty(opacity)) {
              layer.setOpacity(opacity.value);
            }
            layer.setVisible(!layer.isVisible());
          }
        } else if (evt.target.classList.contains('m-fulltoc-transparency')) {
          layer.setOpacity(evt.target.value);
        }
      }
    }
  }

  /**
   * Sets the visibility of the clicked layer
   *
   * @public
   * @function
   * @api stable
   */
  clickLayer(evtParameter) {
    const evt = (evtParameter || window.event);
    let scroll;
    let notRender = false;
    if (!IDEE.utils.isNullOrEmpty(evt.target)) {
      if (document.querySelector('.m-panel.m-plugin-fulltoc.opened ul.m-layers') !== null) {
        scroll = document.querySelector('.m-panel.m-plugin-fulltoc.opened ul.m-layers').scrollTop;
      }

      const layerName = evt.target.getAttribute('data-layer-name');
      const layerURL = evt.target.getAttribute('data-layer-url');
      if (!IDEE.utils.isNullOrEmpty(layerName) && layerURL !== null) {
        evt.stopPropagation();
        const layer = this.map_.getLayers().filter((l) => {
          return l.name === layerName && l.url === layerURL;
        })[0];
        // checkbox
        if (evt.target.classList.contains('m-check')) {
          if (layer.transparent === true || !layer.isVisible()) {
            const opacity = evt.target.parentElement.parentElement.parentElement.querySelector('div.tools > input');
            if (!IDEE.utils.isNullOrEmpty(opacity)) {
              layer.setOpacity(opacity.value);
            }
            layer.setVisible(!layer.isVisible());
          }
        } else if (evt.target.classList.contains('m-fulltoc-transparency')) {
          layer.setOpacity(evt.target.value);
        } else if (evt.target.classList.contains('m-fulltoc-remove')) {
          this.map_.removeLayers(layer);
        } else if (evt.target.classList.contains('m-fulltoc-zoom')) {
          if (layer.type === 'WMS' || layer.type === 'WMTS' || layer.type === 'WFS') {
            const extent = layer.getMaxExtent();
            this.map_.setBbox(extent);
          } else if (layer.type === 'KML') {
            const extent = layer.getImpl().getExtent();
            this.map_.setBbox(extent);
          } else if (layer.type === 'GeoJSON') {
            const extent = this.getImpl().getGeoJSONExtent(layer);
            this.map_.setBbox(extent);
          } else if (layer.type === 'OGCAPIFeatures') {
            const extent = layer.getFeaturesExtent();
            this.map_.setBbox(extent);
          } else {
            IDEE.dialog.info(getValue('exception.extent'), getValue('info'), this.order);
          }
        } else if (evt.target.classList.contains('m-fulltoc-legend')) {
          const legend = evt.target.parentElement.parentElement.parentElement.querySelector('.m-legend');
          if (layer.type === 'OGCAPIFeatures') {
            const legendUrl = layer.getLegendURL();
            if (legendUrl instanceof Promise) {
              legendUrl.then((url) => {
                legend.querySelector('img').src = url;
              });
            } else {
              legend.querySelector('img').src = legendUrl;
            }
          }
          if (legend.style.display === 'block') {
            legend.style.display = 'none';
          } else {
            legend.style.display = 'block';
          }
          notRender = true;
        } else if (evt.target.classList.contains('m-fulltoc-config')) {
          let otherStyles;
          let isOgcApiFeatures;
          let indexCurrentStyle;
          if (layer.type === 'OGCAPIFeatures') {
            otherStyles = layer.predefinedStyles;
            const currentStyle = layer.getStyle();
            try {
              indexCurrentStyle = otherStyles.findIndex((style) => {
                return style === currentStyle;
              });
            } catch (error) {
              indexCurrentStyle = undefined;
            }
            isOgcApiFeatures = true;
          } else {
            otherStyles = layer.capabilitiesMetadata.style;
          }

          const config = IDEE.template.compileSync(configTemplate, {
            jsonp: true,
            parseToHtml: false,
            vars: {
              ogcapifeatures: isOgcApiFeatures,
              styles: otherStyles,
              currentStyle: indexCurrentStyle,
              translations: {
                select_style: getValue('select_style'),
                change: getValue('change'),
                style: getValue('style'),
                default_style: getValue('default_style'),
                selected: getValue('selected'),
              },
            },
          });

          IDEE.dialog.info(config, getValue('configure_layer'), this.order);
          setTimeout(() => {
            const selector = 'div.m-api-idee-container div.m-dialog #m-fulltoc-change-config button';
            document.querySelector(selector).addEventListener('click', this.changeLayerConfig.bind(this, layer, otherStyles));
            document.querySelector('div.m-api-idee-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
            const button = document.querySelector('div.m-dialog.info div.m-button > button');
            button.innerHTML = getValue('close');
            button.style.width = '75px';
            button.style.backgroundColor = '#71a7d3';

            this.accessibilityTab(document.querySelector('#m-fulltoc-change-config'));
          }, 10);
        } else if (evt.target.classList.contains('m-fulltoc-info')) {
          if (layer.type === 'OGCAPIFeatures') {
            const metadataURL = `${layer.url}${layer.name}?f=json`;
            const htmlURL = `${layer.url}${layer.name}?f=html`;
            let jsonResponseOgc;
            IDEE.remote.get(metadataURL).then((response) => {
              jsonResponseOgc = JSON.parse(response.text);
              const vars = {
                title: jsonResponseOgc.description,
                abstract: jsonResponseOgc.title,
                hasMetadata: true,
                metadata: htmlURL,
                isOgc: true,
                translations: {
                  title: getValue('title'),
                  name: getValue('name'),
                  abstract: getValue('abstract'),
                  provider: getValue('provider'),
                  service_info: getValue('service_info'),
                  download_center: getValue('download_center'),
                  see_more: getValue('see_more'),
                  metadata_abstract: getValue('metadata_abstract'),
                  responsible: getValue('responsible'),
                  access_constraints: getValue('access_constraints'),
                  use_constraints: getValue('use_constraints'),
                  online_resources: getValue('online_resources'),
                  see_more_layer: getValue('see_more_layer'),
                  see_more_service: getValue('see_more_service'),
                  metadata: getValue('metadata'),
                },
              };
              this.renderInfo(vars);
            });
          } else {
            const vars = {
              name: layer.name,
              title: layer.legend,
              abstract: layer.capabilitiesMetadata.abstract,
              translations: {
                title: getValue('title'),
                name: getValue('name'),
                abstract: getValue('abstract'),
                provider: getValue('provider'),
                service_info: getValue('service_info'),
                download_center: getValue('download_center'),
                see_more: getValue('see_more'),
                metadata_abstract: getValue('metadata_abstract'),
                responsible: getValue('responsible'),
                access_constraints: getValue('access_constraints'),
                use_constraints: getValue('use_constraints'),
                online_resources: getValue('online_resources'),
                see_more_layer: getValue('see_more_layer'),
                see_more_service: getValue('see_more_service'),
                metadata: getValue('metadata'),
              },
            };

            if (layer.type === 'WMS') {
              vars.capabilities = IDEE.utils.getWMSGetCapabilitiesUrl(layer.url, layer.version);
              const murl = layer.capabilitiesMetadata.metadataURL;
              vars.metadata = !IDEE.utils.isNullOrEmpty(murl) ? murl[0].OnlineResource : '';
              if (!IDEE.utils.isNullOrEmpty(layer.capabilitiesMetadata.attribution)) {
                vars.provider = `${layer.capabilitiesMetadata.attribution.Title}`;
                if (layer.capabilitiesMetadata.attribution.OnlineResource !== undefined) {
                  vars.provider += `<p><a class="m-fulltoc-provider-link" href="${layer.capabilitiesMetadata.attribution.OnlineResource}" target="_blank">${layer.capabilitiesMetadata.attribution.OnlineResource}</a></p>`;
                }
              }
            } else if (layer.type === 'WMTS') {
              vars.capabilities = IDEE.utils.getWMTSGetCapabilitiesUrl(layer.url);
              if (!IDEE.utils.isNullOrEmpty(layer.capabilitiesMetadata.attribution)) {
                vars.provider = `${layer.capabilitiesMetadata.attribution.ProviderName}`
                  + `<p><a class="m-fulltoc-provider-link" href="${layer.capabilitiesMetadata.attribution.ProviderSite}" target="_blank">${layer.capabilitiesMetadata.attribution.ProviderSite}</a></p>`;
                const sc = layer.capabilitiesMetadata.attribution.ServiceContact;
                if (!IDEE.utils.isNullOrEmpty(sc) && !IDEE.utils.isNullOrEmpty(sc.ContactInfo)) {
                  const mail = sc.ContactInfo.Address.ElectronicMailAddress;
                  vars.provider += `<p><a class="m-fulltoc-provider-link" href="mailto:${mail}">${mail}</a></p>`;
                }
              }
            }

            IDEE.remote.get(vars.capabilities).then((response) => {
              const source = response.text;
              const urlService = source.split('<inspire_common:URL>')[1].split('<')[0].split('&amp;').join('&');
              if (!IDEE.utils.isNullOrEmpty(urlService) && IDEE.utils.isUrl(urlService)) {
                vars.metadata_service = urlService;
                vars.hasMetadata = true;
              }

              if (IDEE.utils.isNullOrEmpty(vars.metadata) || !IDEE.utils.isUrl(vars.metadata)) {
                delete vars.metadata;
                if (vars.metadata_service !== undefined) {
                  IDEE.remote.get(vars.metadata_service).then((response2) => {
                    const metadataText = response2.text;
                    const unfiltered = metadataText.split('<gmd:MD_DigitalTransferOptions>')[1].split('<gmd:URL>').filter((elem) => {
                      return elem.indexOf('centrodedescargas') > -1 && elem.indexOf('atom') === -1;
                    });

                    if (unfiltered.length > 0) {
                      const downloadCenter = unfiltered[0].split('</gmd:URL>')[0].trim();
                      vars.downloadCenter = downloadCenter;
                    }

                    this.renderInfo(vars);
                  }).catch((err) => {
                    this.renderInfo(vars);
                  });
                } else {
                  this.renderInfo(vars);
                }
              } else {
                vars.hasMetadata = true;
                IDEE.remote.get(vars.metadata).then((response2) => {
                  const metadataText = response2.text;
                  const unfiltered = metadataText.split('<gmd:MD_DigitalTransferOptions>')[1].split('<gmd:URL>').filter((elem) => {
                    return elem.indexOf('centrodedescargas') > -1 && elem.indexOf('atom') === -1;
                  });

                  if (unfiltered.length > 0) {
                    const downloadCenter = unfiltered[0].split('</gmd:URL>')[0].trim();
                    vars.downloadCenter = downloadCenter;
                  }

                  this.renderInfo(vars);
                }).catch((err) => {
                  this.renderInfo(vars);
                });
              }
            }).catch((err) => {
              this.renderInfo(vars);
            });
          }
        }
      } else if (evt.target.classList.contains('m-fulltoc-addservice')) {
        const precharged = this.precharged;
        const hasPrecharged = (precharged.groups !== undefined && precharged.groups.length > 0)
          || (precharged.services !== undefined && precharged.services.length > 0);
        const codsiActive = this.codsi;
        const addServices = IDEE.template.compileSync(addServicesTemplate, {
          jsonp: true,
          parseToHtml: false,
          vars: {
            precharged,
            hasPrecharged,
            codsiActive,
            translations: {
              url_service: getValue('url_service'),
              query: getValue('query'),
              loaded_services: getValue('loaded_services'),
              clean: getValue('clean'),
              availables: getValue('availables'),
              codsi_services: getValue('codsi_services'),
              filter_results: getValue('filter_results'),
              clean_filter: getValue('clean_filter'),
              filter_text: getValue('filter_text'),
            },
          },
        });

        IDEE.dialog.info(addServices, getValue('load_ext_services'), this.order);
        setTimeout(() => {
          if (document.querySelector('#m-fulltoc-addservices-list-btn') !== null) {
            document.querySelector('#m-fulltoc-addservices-list-btn').addEventListener('click', (e) => this.showSuggestions(e));
            document.querySelector('#m-fulltoc-addservices-list-btn').addEventListener('keydown', (e) => (e.keyCode === 13) && this.showSuggestions(e));
          }

          if (document.querySelector('#m-fulltoc-addservices-codsi-btn') !== null) {
            document.querySelector('#m-fulltoc-addservices-codsi-btn').addEventListener('click', (e) => this.showCODSI(e));
            document.querySelector('#m-fulltoc-addservices-codsi-btn').addEventListener('keydown', (e) => (e.keyCode === 13) && this.showCODSI(e));
            document.querySelector('#m-fulltoc-addservices-codsi-filter-btn').addEventListener('click', (e) => {
              this.loadCODSIResults(1);
            });

            document.querySelector('#m-fulltoc-addservices-codsi-filter-btn').addEventListener('keydown', (e) => (e.keyCode === 13) && this.loadCODSIResults(1));

            document.querySelector('#m-fulltoc-addservices-codsi-search-input').addEventListener('keypress', (e) => {
              if (e.keyCode === 13) {
                this.loadCODSIResults(1);
              }
            });

            document.querySelector('#m-fulltoc-addservices-codsi-clean-btn').addEventListener('click', (e) => {
              document.querySelector('#m-fulltoc-addservices-codsi-search-input').value = '';
              this.loadCODSIResults(1);
            });
          }

          document.querySelector('#m-fulltoc-addservices-search-btn').addEventListener('click', (e) => {
            this.filterName = undefined;
            this.readCapabilities(e);
          });

          document.querySelector('#m-fulltoc-addservices-search-btn').addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
              this.filterName = undefined;
              this.readCapabilities(e);
            }
          });

          document.querySelector('#m-fulltoc-addservices-search-input').addEventListener('keypress', (e) => {
            if (e.keyCode === 13) {
              this.filterName = undefined;
              this.readCapabilities(e);
            }
          });

          document.querySelector('div.m-api-idee-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
          const button = document.querySelector('div.m-dialog.info div.m-button > button');
          button.innerHTML = getValue('close');
          button.style.width = '75px';
          button.style.backgroundColor = '#71a7d3';
          button.addEventListener('click', () => {
            this.afterRender();
          });

          document.querySelector('div.m-dialog #m-fulltoc-addservices-search-input').addEventListener('keyup', (e) => {
            const url = document.querySelector('div.m-dialog #m-fulltoc-addservices-search-input').value.trim();
            document.querySelector('div.m-dialog #m-fulltoc-addservices-search-input').value = url;
          });

          document.querySelectorAll('.m-fulltoc-suggestion-caret').forEach((elem) => {
            elem.addEventListener('click', () => {
              elem.parentElement.querySelector('.m-fulltoc-suggestion-group').classList.toggle('active');
              elem.classList.toggle('m-fulltoc-suggestion-caret-close');
            });

            elem.addEventListener('keydown', (e) => {
              if (e.keyCode === 13) {
                elem.parentElement.querySelector('.m-fulltoc-suggestion-group').classList.toggle('active');
                elem.classList.toggle('m-fulltoc-suggestion-caret-close');
              }
            });
          });

          document.querySelectorAll('#m-fulltoc-addservices-suggestions .m-fulltoc-suggestion').forEach((elem) => {
            elem.addEventListener('click', (e) => this.loadSuggestion(e));
            elem.addEventListener('keydown', (e) => (e.keyCode === 13) && this.loadSuggestion(e));
          });
          this.accessibilityTab(document.querySelector('.m-fulltoc-addservices'));
        }, 10);
      }
    }

    if (!notRender) {
      this.render(scroll);
    }
  }

  renderInfo(vars) {
    const info = IDEE.template.compileSync(infoTemplate, {
      jsonp: true,
      parseToHtml: false,
      vars,
    });

    IDEE.dialog.info(info, getValue('layer_info'), this.order);
    setTimeout(() => {
      document.querySelector('div.m-api-idee-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
      const button = document.querySelector('div.m-dialog.info div.m-button > button');
      button.innerHTML = getValue('close');
      button.style.width = '75px';
      button.style.backgroundColor = '#71a7d3';
      const elem = document.querySelector('#m-fulltoc-information .show-more-metadata');
      if (elem !== null) {
        elem.addEventListener('click', () => {
          const block = document.querySelector('#m-fulltoc-information .more-metadata');
          if (block.style.display !== 'block') {
            block.style.display = 'block';
            elem.innerHTML = `<span class="icon-colapsar"></span>&nbsp;${getValue('see_less')}`;
          } else {
            block.style.display = 'none';
            elem.innerHTML = `<span class="icon-desplegar"></span>&nbsp;${getValue('see_more')}`;
          }
        });
      }
      this.accessibilityTab(document.querySelector('#m-fulltoc-information'));
    }, 10);
  }

  showSuggestions() {
    if (document.querySelector('#m-fulltoc-addservices-codsi') !== null) {
      document.querySelector('#m-fulltoc-addservices-codsi').style.display = 'none';
    }
    if (document.querySelector('#fromOGCContainer') !== null) {
      document.querySelector('#fromOGCContainer').style.display = 'none';
    }
    document.querySelector('#m-fulltoc-addservices-results').innerHTML = '';
    document.querySelector('#m-fulltoc-addservices-suggestions').style.display = 'block';
  }

  showCODSI() {
    document.querySelector('#m-fulltoc-addservices-results').innerHTML = '';
    document.querySelector('#m-fulltoc-addservices-codsi').style.display = 'block';
    document.querySelector('#m-fulltoc-addservices-suggestions').style.display = 'none';
    if (document.querySelector('#fromOGCContainer') !== null) {
      document.querySelector('#fromOGCContainer').style.display = 'none';
    }
    this.loadCODSIResults(1);
  }

  loadCODSIResults(pageNumber) {
    document.querySelector('#m-fulltoc-addservices-codsi-results').innerHTML = '<p class="m-fulltoc-loading"><span class="icon-spinner" /></p>';
    const query = document.querySelector('#m-fulltoc-addservices-codsi-search-input').value.trim();
    const start = 1 + ((pageNumber - 1) * CODSI_PAGESIZE);
    const end = pageNumber * CODSI_PAGESIZE;
    let url = CODSI_CATALOG.split('*1').join(`${start}`).split('*2').join(`${end}`);
    if (query !== '') {
      url += `&any=*${encodeURIComponent(query)}*`;
    }

    IDEE.remote.get(url).then((response) => {
      const data = JSON.parse(response.text);
      const total = data.summary['@count'];
      const results = [];
      if (data.metadata !== undefined) {
        data.metadata.forEach((m) => {
          let links = [];
          if (Array.isArray(m.link)) {
            m.link.forEach((l) => {
              let parts = [];
              if (l.indexOf('||') > -1) {
                parts = l.split('||').filter((part) => {
                  return part.indexOf('http://') > -1 || part.indexOf('https://') > -1;
                });
              } else if (l.indexOf('|') > -1) {
                parts = l.split('|').filter((part) => {
                  return part.indexOf('http://') > -1 || part.indexOf('https://') > -1;
                });
              }

              links = links.concat(parts);
            });
          } else {
            let parts = [];
            if (m.link.indexOf('||') > -1) {
              parts = m.link.split('||').filter((part) => {
                return part.indexOf('http://') > -1 || part.indexOf('https://') > -1;
              });
            } else if (m.link.indexOf('|') > -1) {
              parts = m.link.split('|').filter((part) => {
                return part.indexOf('http://') > -1 || part.indexOf('https://') > -1;
              });
            }

            links = links.concat(parts);
          }

          if (links.length > 0) {
            results.push({
              title: m.title || m.defaultTitle,
              url: links[0].split('?')[0],
            });
          }
        });
      }

      this.renderCODSIResults(results);
      this.renderCODSIPagination(pageNumber, total);
    }).catch((err) => {
      IDEE.dialog.error(getValue('exception.codsi'));
    });
  }

  renderCODSIResults(results) {
    document.querySelector('#m-fulltoc-addservices-codsi-results').innerHTML = '';
    if (results.length > 0) {
      let textResults = '<table><tbody>';
      results.forEach((r) => {
        textResults += `<tr><td><span tabindex="0" class="m-fulltoc-codsi-result" data-link="${r.url}">${r.title}</span></td></tr>`;
      });

      textResults += '</tbody></table>';
      document.querySelector('#m-fulltoc-addservices-codsi-results').innerHTML = textResults;
      document.querySelectorAll('#m-fulltoc-addservices-codsi-results .m-fulltoc-codsi-result').forEach((elem) => {
        elem.addEventListener('click', (evt) => {
          const url = elem.getAttribute('data-link');
          document.querySelector('div.m-dialog #m-fulltoc-addservices-search-input').value = url;
          this.filterName = undefined;
          this.readCapabilities(evt);
        });
      });
    } else {
      document.querySelector('#m-fulltoc-addservices-codsi-results').innerHTML = `<div class="codsi-no-results">${getValue('exception.codsi_no_results')}</div>`;
    }
  }

  renderCODSIPagination(pageNumber, total) {
    document.querySelector('#m-fulltoc-addservices-codsi-pagination').innerHTML = '';
    if (total > 0) {
      const numPages = Math.ceil(total / CODSI_PAGESIZE);
      let buttons = '';
      for (let i = 1; i <= numPages; i += 1) {
        if (i === pageNumber) {
          buttons += `<button type="button" tabindex="0" class="m-fulltoc-addservices-pagination-btn" disabled>${i}</button>`;
        } else {
          buttons += `<button type="button" tabindex="0" class="m-fulltoc-addservices-pagination-btn">${i}</button>`;
        }
      }

      document.querySelector('#m-fulltoc-addservices-codsi-pagination').innerHTML = buttons;
      document.querySelectorAll('#m-fulltoc-addservices-codsi-pagination button').forEach((elem, index) => {
        elem.addEventListener('click', () => {
          this.loadCODSIResults(index + 1);
        });
      });
    }
  }

  loadSuggestion(evt) {
    const url = evt.target.getAttribute('data-link');
    try {
      const group = evt.target.parentElement.parentElement.parentElement;
      const nameGroup = group.querySelector('span.m-fulltoc-suggestion-caret').innerText;
      this.filterName = nameGroup;
      if (group.localName === 'tbody') {
        this.filterName = 'none';
      }
      /* eslint-disable no-empty */
    } catch (err) {}
    const serviceType = evt.target.getAttribute('data-service-type');
    document.querySelector('div.m-dialog #m-fulltoc-addservices-search-input').value = url;
    if (serviceType === 'WMTS') {
      document.getElementById('m-fulltoc-addservices-wmts').checked = true;
      document.getElementById('m-fulltoc-addservices-wms').checked = false;
    } else {
      document.getElementById('m-fulltoc-addservices-wms').checked = true;
      document.getElementById('m-fulltoc-addservices-wmts').checked = false;
    }

    this.readCapabilities(evt);
  }

  changeLayerConfig(layer, otherStyles) {
    const scroll = document.querySelector('.m-panel.m-plugin-fulltoc.opened ul.m-layers').scrollTop;
    const styleSelected = document.querySelector('#m-fulltoc-change-config #m-fulltoc-style-select').value;
    if (styleSelected !== '') {
      if (layer.type === 'OGCAPIFeatures') {
        if (!IDEE.utils.isNullOrEmpty(otherStyles)) {
          const filtered = otherStyles[styleSelected];
          if (styleSelected === 0) {
            layer.setStyle();
          } else {
            layer.setStyle(filtered);
          }
        }
      } else {
        layer.getImpl().getLayer().getSource().updateParams({ STYLES: styleSelected });
        document.querySelector('div.m-api-idee-container div.m-dialog').remove();
        const cm = layer.capabilitiesMetadata;
        if (!IDEE.utils.isNullOrEmpty(cm) && !IDEE.utils.isNullOrEmpty(cm.style)) {
          const filtered = layer.capabilitiesMetadata.style.filter((style) => {
            return style.Name === styleSelected;
          });

          if (filtered.length > 0 && filtered[0].LegendURL.length > 0) {
            const newURL = filtered[0].LegendURL[0].OnlineResource;
            layer.setLegendURL(newURL);
            this.render(scroll);
          }
        }
      }
    }
  }

  /**
   * @function
   * @public
   * @api
   */
  getTemplateVariables(map) {
    return new Promise((success, fail) => {
      // gets base layers and overlay layers
      if (!IDEE.utils.isNullOrEmpty(map)) {
        const overlayLayers = map.getRootLayers().filter((layer) => {
          const isTransparent = (layer.transparent === true);
          const displayInLayerSwitcher = (layer.displayInLayerSwitcher === true);
          const isRaster = ['wms', 'wmts'].indexOf(layer.type.toLowerCase()) > -1;
          const isNotWMSFull = !((layer.type === IDEE.layer.type.WMS)
            && IDEE.utils.isNullOrEmpty(layer.name));
          return ((isTransparent && displayInLayerSwitcher && isRaster && isNotWMSFull) || (layer.type === 'OGCAPIFeatures'));
        }).reverse();

        const overlayLayersPromise = Promise.all(overlayLayers.map(this.parseLayerForTemplate_));
        overlayLayersPromise.then((parsedOverlayLayers) => success({
          layers: overlayLayers,
          overlayLayers: parsedOverlayLayers,
          translations: {
            layers: getValue('layers'),
            add_service: getValue('add_service'),
            show_hide: getValue('show_hide'),
            zoom: getValue('zoom'),
            info_metadata: getValue('info_metadata'),
            change_style: getValue('change_style'),
            remove_layer: getValue('remove_layer'),
            drag_drop: getValue('drag_drop'),
          },
        }));
      }
    });
  }

  /**
   * @function
   * @public
   * @api
   */
  render(scroll) {
    this.getTemplateVariables(this.map_).then((templateVars) => {
      const html = IDEE.template.compileSync(template, {
        vars: templateVars,
      });
      this.accessibilityTab(html);

      this.registerImgErrorEvents_(html);
      this.template_.innerHTML = html.innerHTML;
      const layerList = this.template_.querySelector('.m-fulltoc-container .m-layers');
      const layers = templateVars.layers;
      if (layerList !== null) {
        Sortable.create(layerList, {
          animation: 150,
          ghostClass: 'm-fulltoc-gray-shadow',
          filter: '.m-opacity-container',
          preventOnFilter: false,
          onEnd: (evt) => {
            const from = evt.from;
            let maxZIndex = Math.max(...(layers.map((l) => {
              return l.getZIndex();
            })));
            from.querySelectorAll('li.m-layer div.m-visible-control span').forEach((elem) => {
              const name = elem.getAttribute('data-layer-name');
              const url = elem.getAttribute('data-layer-url');
              const filtered = layers.filter((layer) => {
                return layer.name === name && layer.url === url;
              });

              if (filtered.length > 0) {
                filtered[0].setZIndex(maxZIndex);
                maxZIndex -= 1;
              }
            });
          },
        });

        if (scroll !== undefined) {
          document.querySelector('.m-panel.m-plugin-fulltoc.opened ul.m-layers').scrollTop = scroll;
        }
      }
    });
  }

  registerImgErrorEvents_(html) {
    const imgElements = html.querySelectorAll('img');
    Array.prototype.forEach.call(imgElements, (imgElem) => {
      imgElem.addEventListener('error', (evt) => {
        const layerName = evt.target.getAttribute('data-layer-name');
        const layerURL = evt.target.getAttribute('data-layer-url');
        const legendErrorUrl = IDEE.utils.concatUrlPaths([
          IDEE.config.THEME_URL,
          IDEE.layer.WMS.LEGEND_ERROR,
        ]);

        const layer = this.map_.getLayers().filter((l) => {
          return l.name === layerName && l.url === layerURL;
        })[0];

        if (!IDEE.utils.isNullOrEmpty(layer) && layerURL.indexOf('/mirame.chduero.es/') === -1) {
          layer.setLegendURL(legendErrorUrl);
        }
        /*
        else if (layerURL.indexOf('/mirame.chduero.es/') > -1
          && layer.getImpl().getLayer() !== null) {
          const styleName = layer.getImpl().getLayer().getSource().getStyle();
          const urlLegend = layer.getLegendURL().split('&amp;').join('&').split('default')
            .join(styleName);
          layer.setLegendURL(urlLegend);
        }
        */
      });
    });
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    super.deactivate();
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
    return html.querySelector('.m-fulltoc button');
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
    return control instanceof FullTOCControl;
  }

  /**
   *
   *
   * @private
   * @function
   */
  parseLayerForTemplate_(layer) {
    let ogcapiFeaturesStyles;
    const layerTitle = layer.legend || layer.name;
    const hasMetadata = !IDEE.utils.isNullOrEmpty(layer.capabilitiesMetadata)
      && !IDEE.utils.isNullOrEmpty(layer.capabilitiesMetadata.abstract);

    if (layer.type === 'OGCAPIFeatures') {
      if (!IDEE.utils.isNullOrEmpty(layer.otherStyles)) {
        ogcapiFeaturesStyles = layer.otherStyles.length > 1;
      }
    }

    return new Promise((success, fail) => {
      const layerVarTemplate = {
        visible: (layer.isVisible() === true),
        id: layer.name,
        title: layerTitle,
        outOfRange: !layer.inRange(),
        opacity: layer.getOpacity(),
        metadata: hasMetadata,
        type: layer.type,
        tag: layer.type === 'OGCAPIFeatures' ? 'Features' : layer.type,
        hasStyles: hasMetadata && layer.capabilitiesMetadata.style.length > 1,
        hasOgcapiFeaturesStyles: ogcapiFeaturesStyles,
        url: layer.url,
      };

      const legendUrl = layer.getLegendURL();
      if (legendUrl instanceof Promise) {
        legendUrl.then((url) => {
          layerVarTemplate.legend = url;
          success(layerVarTemplate);
        });
      } else {
        layerVarTemplate.legend = layer.type !== 'KML' ? legendUrl : null;
        success(layerVarTemplate);
      }
    });
  }

  checkIfApiFeatures(url) {
    return IDEE.remote.get(`${url}?f=json`).then((response) => {
      let isJson = false;
      if (!IDEE.utils.isNullOrEmpty(response) && !IDEE.utils.isNullOrEmpty(response.text)) {
        const responseString = response.text;
        JSON.parse(responseString);
        isJson = true;
      }
      return isJson;
    }).catch(() => {
      return false;
    });
  }

  /**
   * This function reads service capabilities
   *
   * @function
   * @private
   * @param {Event} evt - Click event
   */
  readCapabilities(evt) {
    if (document.querySelector('#m-fulltoc-addservices-codsi') !== null) {
      document.querySelector('#m-fulltoc-addservices-codsi').style.display = 'none';
    }

    evt.preventDefault();
    let HTTPeval = false;
    let HTTPSeval = false;
    document.querySelector('#m-fulltoc-addservices-suggestions').style.display = 'none';
    const url = document.querySelector('div.m-dialog #m-fulltoc-addservices-search-input').value.trim().split('?')[0];
    this.removeContains(evt);
    let type = null;
    if (!IDEE.utils.isNullOrEmpty(url)) {
      if (IDEE.utils.isUrl(url)) {
        if (this.http && !this.https) {
          const expReg = /^(http:)/;
          HTTPeval = expReg.test(url);
        } else if (this.https && !this.http) {
          const expReg = /^(https:)/;
          HTTPSeval = expReg.test(url);
        } else if (this.http && this.https) {
          HTTPeval = true;
          HTTPSeval = true;
        }

        if (HTTPeval === true || HTTPSeval === true) {
          const promise = new Promise((success, reject) => {
            const id = setTimeout(() => reject(), 15000);
            IDEE.remote.get(IDEE.utils.getWMTSGetCapabilitiesUrl(url)).then((response) => {
              clearTimeout(id);
              success(response);
            });
          });

          promise.then((response) => {
            try {
              if (response.text.indexOf('TileMatrixSetLink') >= 0) {
                type = 'WMTS';
              } else {
                type = 'WMS';
              }
              if (type === 'WMTS') {
                const getCapabilitiesParser = new IDEE.impl.format.WMTSCapabilities();
                const getCapabilities = getCapabilitiesParser.read(response.xml);
                this.serviceCapabilities = getCapabilities.capabilities || {};
                const layers = IDEE.impl.util.wmtscapabilities.getLayers(
                  getCapabilities.capabilities,
                  url,
                  this.map_.getProjection().code,
                );
                this.capabilities = this.filterResults(layers);
                this.showResults();
              } else {
                this.checkIfApiFeatures(url).then((reponseIsJson) => {
                  if (reponseIsJson === true) {
                    this.printOGCModal(url);
                  } else {
                    const promise2 = new Promise((success, reject) => {
                      const id = setTimeout(() => reject(), 15000);
                      IDEE.remote.get(IDEE.utils.getWMSGetCapabilitiesUrl(url, '1.3.0')).then((response2) => {
                        clearTimeout(id);
                        success(response2);
                      });
                    });
                    promise2.then((response2) => {
                      try {
                        const getCapabilitiesParser = new IDEE.impl.format.WMSCapabilities();
                        const getCapabilities = getCapabilitiesParser.read(response2.xml);
                        this.serviceCapabilities = getCapabilities.Service || {};
                        const getCapabilitiesUtils = new IDEE.impl.GetCapabilities(
                          getCapabilities,
                          url,
                          this.map_.getProjection().code,
                        );
                        this.capabilities = this.filterResults(getCapabilitiesUtils.getLayers());
                        this.capabilities.forEach((layer) => {
                          try {
                            this.getParents(getCapabilities, layer);
                            /* eslint-disable no-empty */
                          } catch (err) {}
                        });
                        this.showResults();
                      } catch (error) {
                        IDEE.dialog.error(getValue('exception.capabilities'));
                      }
                    }).catch((eerror) => {
                      IDEE.dialog.error(getValue('exception.capabilities'));
                    });
                  }
                });
              }
            } catch (err) {
              IDEE.dialog.error(getValue('exception.capabilities'));
            }
          }).catch((err) => {
            IDEE.dialog.error(getValue('exception.capabilities'));
          });
        } else {
          let errorMsg;
          if (this.http) {
            errorMsg = getValue('exception.only_http');
          } else if (this.https) {
            errorMsg = getValue('exception.only_https');
          } else if (!this.http && !this.https) {
            errorMsg = getValue('exception.no_http_https');
          }
          IDEE.dialog.error(errorMsg);
        }
      } else {
        IDEE.dialog.error(getValue('exception.valid_url'));
      }
    } else {
      IDEE.dialog.error(getValue('exception.empty'));
    }
  }

  filterResults(allLayers) {
    const layers = [];
    const layerNames = [];
    let allServices = [];
    if (this.filterName === undefined) {
      if (this.precharged.services !== undefined && this.precharged.services.length > 0) {
        allServices = allServices.concat(this.precharged.services);
      }

      if (this.precharged.groups !== undefined && this.precharged.groups.length > 0) {
        this.precharged.groups.forEach((group) => {
          if (group.services !== undefined && group.services.length > 0) {
            allServices = allServices.concat(group.services);
          }
        });
      }

      allLayers.forEach((layer) => {
        layers.push(layer);
        layerNames.push(layer.name);
      });
    } else if (this.filterName === 'none') {
      if (this.precharged.services !== undefined && this.precharged.services.length > 0) {
        allServices = allServices.concat(this.precharged.services);
      }

      if (this.precharged.groups !== undefined && this.precharged.groups.length > 0) {
        this.precharged.groups.forEach((group) => {
          if (group.services !== undefined && group.services.length > 0) {
            allServices = allServices.concat(group.services);
          }
        });
      }

      allLayers.forEach((layer) => {
        let insideService = false;
        allServices.forEach((service) => {
          if (service.type === layer.type && this.checkUrls(service.url, layer.url)) {
            if (service.white_list !== undefined && service.white_list.length > 0
                && service.white_list.indexOf(layer.name) > -1
                && layerNames.indexOf(layer.name) === -1) {
              layers.push(layer);
              layerNames.push(layer.name);
            } else if (service.white_list === undefined && layerNames.indexOf(layer.name) === -1) {
              layers.push(layer);
              layerNames.push(layer.name);
            }

            insideService = true;
          }
        });

        if (!insideService) {
          layers.push(layer);
          layerNames.push(layer.name);
        }
      });
    } else if (this.precharged.groups !== undefined && this.precharged.groups.length > 0) {
      this.precharged.groups.forEach((group) => {
        if (group.services !== undefined && group.services.length > 0
            && group.name === this.filterName) {
          allLayers.forEach((layer) => {
            let insideService = false;
            group.services.forEach((service) => {
              if (service.type === layer.type && this.checkUrls(service.url, layer.url)) {
                if (service.white_list !== undefined && service.white_list.length > 0
                    && service.white_list.indexOf(layer.name) > -1
                    && layerNames.indexOf(layer.name) === -1) {
                  layers.push(layer);
                  layerNames.push(layer.name);
                } else if (service.white_list === undefined
                    && layerNames.indexOf(layer.name) === -1) {
                  layers.push(layer);
                  layerNames.push(layer.name);
                }

                insideService = true;
              }
            });

            if (!insideService) {
              layers.push(layer);
              layerNames.push(layer.name);
            }
          });
        }
      });
    }

    return layers;
  }

  getParents(capabilities, layer) {
    const name = layer.name;
    const layers = capabilities.Capability.Layer.Layer;
    let parent;
    layers.forEach((l) => {
      if (l.Name !== name && l.Layer !== undefined && l.Layer.length > 0) {
        const filtered = l.Layer.filter((ll) => {
          return ll.Name === name;
        });

        if (filtered.length > 0) {
          parent = l.Title;
        } else if (IDEE.utils.isObject(l.Layer.Layer) && l.Layer.Layer.Name === name) {
          parent = `${l.Title} - ${l.Layer.Layer.Title}`;
        } else if (IDEE.utils.isArray(l.Layer) && l.Layer.length > 0) {
          const innerFiltered = l.Layer.filter((ll) => {
            return ll.Name === name;
          });

          if (innerFiltered.length > 0) {
            parent = `${l.Title} - ${l.Layer.Title}`;
          } else {
            const innerInnerFiltered = l.Layer.filter((ll) => {
              let contains = false;
              if (ll.Layer !== undefined && ll.Layer.length > 0) {
                contains = ll.Layer.filter((lll) => {
                  return lll.Name === name;
                }).length > 0;
              }

              return contains;
            });

            if (innerInnerFiltered.length > 0) {
              parent = `${l.Title} - ${innerInnerFiltered[0].Title}`;
            }
          }
        }
      }
    });

    if (parent !== undefined) {
      /* eslint-disable no-param-reassign */
      layer.legend = `${parent} - ${layer.legend}`;
    }
  }

  /**
   * This function shows results
   *
   * @function
   * @private
   */
  showResults() {
    const result = [];
    let serviceType = 'WMS';
    this.capabilities.forEach((capability) => {
      const add = capability.getImpl();
      add.abstract = capability.capabilitiesMetadata.abstract.trim();
      serviceType = capability.type;
      result.push(add);
    });

    const container = document.querySelector('#m-fulltoc-addservices-results');
    if (result.length > 0) {
      const serviceCapabilities = {};
      if (serviceType === 'WMTS') {
        const si = this.serviceCapabilities.ServiceIdentification;
        const sp = this.serviceCapabilities.ServiceProvider;
        if (si !== undefined && si.Title !== undefined) {
          serviceCapabilities.title = si.Title.trim();
        }

        if (si !== undefined && si.Abstract !== undefined) {
          serviceCapabilities.abstract = si.Abstract.trim();
        }

        if (si !== undefined && si.AccessConstraints !== undefined) {
          serviceCapabilities.accessConstraints = si.AccessConstraints.trim();
        }

        if (sp !== undefined) {
          let contact = `${sp.ProviderName}<p><a class="m-fulltoc-provider-link" href="${sp.ProviderSite}" target="_blank">${sp.ProviderSite}</a></p>`;
          const ci = sp.ServiceContact.ContactInfo;
          if (!IDEE.utils.isNullOrEmpty(sp.ServiceContact) && !IDEE.utils.isNullOrEmpty(ci)) {
            const mail = ci.Address.ElectronicMailAddress;
            contact += `<p><a class="m-fulltoc-provider-link" href="mailto:${mail}">${mail}</a></p>`;
          }

          serviceCapabilities.contact = contact;
        }
      } else {
        const ci = this.serviceCapabilities.ContactInformation;
        if (this.serviceCapabilities.Title !== undefined) {
          serviceCapabilities.title = this.serviceCapabilities.Title.trim();
        }

        if (this.serviceCapabilities.Abstract !== undefined) {
          serviceCapabilities.abstract = this.serviceCapabilities.Abstract.trim();
        }

        if (this.serviceCapabilities.AccessConstraints !== undefined) {
          serviceCapabilities.accessConstraints = this.serviceCapabilities.AccessConstraints.trim();
        }

        if (ci !== undefined && ci.ContactPersonPrimary !== undefined) {
          if (ci.ContactPersonPrimary.ContactOrganization !== undefined) {
            serviceCapabilities.contact = ci.ContactPersonPrimary.ContactOrganization.trim();
          }
        }
      }

      const html = IDEE.template.compileSync(resultstemplate, {
        vars: {
          result,
          serviceCapabilities,
          translations: {
            layers: getValue('layers'),
            add: getValue('add'),
            title: getValue('title'),
            abstract: getValue('abstract'),
            responsible: getValue('responsible'),
            access_constraints: getValue('access_constraints'),
            show_service_info: getValue('show_service_info'),
          },
          order: this.order,
        },
      });

      container.innerHTML = html.innerHTML;
      this.accessibilityTab(container);
      IDEE.utils.enableTouchScroll(container);
      const results = container.querySelectorAll('span.m-check-fulltoc-addservices');
      for (let i = 0; i < results.length; i += 1) {
        results[i].addEventListener('click', (evt) => this.registerCheck(evt));
      }

      const resultsNames = container.querySelectorAll('.table-results .table-container table tbody tr td.table-layer-name');
      for (let i = 0; i < resultsNames.length; i += 1) {
        resultsNames[i].addEventListener('click', (evt) => this.registerCheckFromName(evt));
      }

      const checkboxResults = container.querySelectorAll('.table-results .table-container table tbody tr td span');
      checkboxResults.forEach((l) => l.addEventListener('keydown', (e) => (e.keyCode === 13) && this.registerCheckFromName(e)));

      container.querySelector('#m-fulltoc-addservices-selectall').addEventListener('click', (evt) => this.registerCheck(evt));
      container.querySelector('.m-fulltoc-addservices-add').addEventListener('click', (evt) => this.addLayers(evt));
      const elem = container.querySelector('.m-fulltoc-show-capabilities');
      elem.addEventListener('click', () => {
        const block = container.querySelector('.m-fulltoc-capabilities-container');
        if (block.style.display !== 'block') {
          block.style.display = 'block';
          elem.innerHTML = `<span class="icon-colapsar"></span>&nbsp;${getValue('hide_service_info')}`;
        } else {
          block.style.display = 'none';
          elem.innerHTML = `<span class="icon-desplegar"></span>&nbsp;${getValue('show_service_info')}`;
        }
      });
    } else {
      container.innerHTML = `<p class="m-fulltoc-noresults">${getValue('exception.no_results')}</p>`;
    }
  }

  /**
   * This function registers the marks or unmarks check and click allselect
   *
   * @function
   * @private
   * @param {Event} evt - Event
   */
  registerCheck(evt) {
    const e = (evt || window.event);
    if (!IDEE.utils.isNullOrEmpty(e.target) && e.target.classList.contains('m-check-fulltoc-addservices')) {
      const container = document.querySelector('#m-fulltoc-addservices-results');
      let numNotChecked = container.querySelectorAll('.m-check-fulltoc-addservices.icon-check').length;
      numNotChecked += (e.target.classList.contains('icon-check') ? -1 : 1);
      e.stopPropagation();
      e.target.classList.toggle('icon-check');
      e.target.classList.toggle('icon-check-seleccionado');
      if (numNotChecked > 0) {
        this.stateSelectAll = false;
        document.querySelector('#m-fulltoc-addservices-selectall').classList.remove('icon-check-seleccionado');
        document.querySelector('#m-fulltoc-addservices-selectall').classList.add('icon-check');
      } else if (numNotChecked === 0) {
        this.stateSelectAll = true;
        document.querySelector('#m-fulltoc-addservices-selectall').classList.remove('icon-check');
        document.querySelector('#m-fulltoc-addservices-selectall').classList.add('icon-check-seleccionado');
      }
    } else if (!IDEE.utils.isNullOrEmpty(e.target) && e.target.id === 'm-fulltoc-addservices-selectall') {
      if (this.stateSelectAll) {
        e.target.classList.remove('icon-check-seleccionado');
        e.target.classList.add('icon-check');
        this.unSelect();
        this.stateSelectAll = false;
      } else {
        e.target.classList.remove('icon-check');
        e.target.classList.add('icon-check-seleccionado');
        this.select();
        this.stateSelectAll = true;
      }
    }
  }

  /**
   * This function registers the marks or unmarks check and click allselect from layer name
   *
   * @function
   * @private
   * @param {Event} evt - Event
   */
  registerCheckFromName(evt) {
    const e = (evt || window.event);
    e.target.parentElement.querySelector('span.m-check-fulltoc-addservices').click();
  }

  /**
   * This function unselects checkboxs
   *
   * @function
   * @private
   */
  unSelect() {
    const unSelect = document.querySelectorAll('#m-fulltoc-addservices-results .icon-check-seleccionado');
    for (let i = 0; i < unSelect.length; i += 1) {
      unSelect[i].classList.remove('icon-check-seleccionado');
      unSelect[i].classList.add('icon-check');
    }
  }

  /**
   * This function selects checkboxs
   *
   * @function
   * @private
   */
  select() {
    const select = document.querySelectorAll('#m-fulltoc-addservices-results .icon-check');
    for (let i = 0; i < select.length; i += 1) {
      select[i].classList.remove('icon-check');
      select[i].classList.add('icon-check-seleccionado');
    }
  }

  /**
   * This function adds layers
   *
   * @function
   * @param {Event} evt - Event
   * @private
   */
  addLayers(evt) {
    evt.preventDefault();
    const layers = [];
    const elmSel = document.querySelectorAll('#m-fulltoc-addservices-results .icon-check-seleccionado');
    if (elmSel.length === 0) {
      IDEE.dialog.error(getValue('exception.select_layer'));
    } else {
      for (let i = 0; i < elmSel.length; i += 1) {
        for (let j = 0; j < this.capabilities.length; j += 1) {
          const name = this.capabilities[j].name;
          if (elmSel[i].id === name || elmSel[i].name === name) {
            const limit = parseInt(this.serviceCapabilities.MaxWidth, 10);
            const hasLimit = !Number.isNaN(limit) && limit < 4096;
            const isIDECanarias = this.serviceCapabilities.Title !== undefined && this.serviceCapabilities.Title.toLowerCase().indexOf('idecanarias') > -1;
            if (this.capabilities[j].url.indexOf(CATASTRO) > -1 || isIDECanarias) {
              this.capabilities[j].version = '1.1.1';
            }

            this.capabilities[j].tiled = this.capabilities[j].type === 'WMTS' || hasLimit || isIDECanarias;
            this.capabilities[j].options.origen = this.capabilities[j].type;
            const legendUrl = this.capabilities[j].getLegendURL();
            const meta = this.capabilities[j].capabilitiesMetadata;
            if ((legendUrl.indexOf('GetLegendGraphic') > -1 || legendUrl.indexOf('assets/img/legend-default.png') > -1) && meta !== undefined && meta.style.length > 0) {
              if (meta.style[0].LegendURL !== undefined && meta.style[0].LegendURL.length > 0) {
                const style = meta.style[0].LegendURL[0].OnlineResource;
                if (style !== undefined && style !== null) {
                  this.capabilities[j].setLegendURL(style);
                }
              }

              if (this.capabilities[j].type === 'WMTS') {
                if (meta.style !== undefined && meta.style.length > 0) {
                  meta.style.forEach((s) => {
                    if (s.isDefault === true && s.LegendURL !== undefined
                        && s.LegendURL.length > 0) {
                      const urlDefaultStyle = s.LegendURL[0].href;
                      this.capabilities[j].setLegendURL(urlDefaultStyle);
                    }
                  });
                }
              }
            }

            layers.push(this.capabilities[j]);
          }
        }
      }

      layers.reverse();
      this.map_.addLayers(layers);
      layers.forEach((l) => {
        l.setZIndex(l.getZIndex() + 8);
      });

      this.afterRender(layers);
    }
  }

  /**
   * This function remove results show
   *
   * @function
   * @param {goog.events.BrowserEvent} evt - Event
   * @private
   */
  removeContains(evt) {
    evt.preventDefault();
    if (document.querySelector('#m-fulltoc-addservices-codsi') !== null) {
      document.querySelector('#m-fulltoc-addservices-codsi').style.display = 'none';
    }
    if (document.querySelector('#fromOGCContainer') !== null) {
      document.querySelector('#fromOGCContainer').style.display = 'none';
    }

    if (document.querySelector('#m-fulltoc-addservices-suggestions') !== null) {
      document.querySelector('#m-fulltoc-addservices-suggestions').style.display = 'none';
    }

    document.querySelector('#m-fulltoc-addservices-results').innerHTML = '';
  }

  /**
   * This function get filters as a dict
   *
   * @function
   * @param formInputs - formInputs
   * @private
   */
  getFiltersDict(formInputs) {
    const formData = {};
    const checkboxes = {};
    formInputs.forEach((inputForm) => {
      const id = inputForm.id;
      const attrName = id.substring(inputForm.id.indexOf('form-') + 5);
      switch (inputForm.type) {
        case 'checkbox':
          // Agrupar los checkboxes por su atributo name
          if (!checkboxes[attrName]) {
            checkboxes[attrName] = [];
          }

          checkboxes[attrName].push(inputForm);
          // if (inputForm.checked !== false) {
          //   formData[attrName] = inputForm.value;
          // }
          break;
        case 'date':
          if (!IDEE.utils.isNullOrEmpty(inputForm.value)) {
            const date = new Date(inputForm.value);
            formData[attrName] = date.toISOString().split('T')[0];
          }
          break;
        default:
          if (!IDEE.utils.isNullOrEmpty(inputForm.value)) {
            // formData[attrName] = encodeURIComponent(inputForm.value);
            formData[attrName] = inputForm.value;
          }
      }
    });

    // Procesar los checkboxes agrupados
    Object.keys(checkboxes).forEach((name) => {
      const checkboxGroup = checkboxes[name];
      /* eslint-disable-next-line max-len */
      const checkedValues = checkboxGroup.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);

      if (checkedValues.length === 1) {
        // Si solo hay un checkbox marcado, establecer el valor correspondiente en formData
        formData[name] = checkedValues[0];
      }
    });

    const propsKeysForm = Object.keys(formData);
    const propsValuesForm = Object.values(formData);

    const cDict = {};

    propsKeysForm.forEach((key, i) => {
      cDict[key] = propsValuesForm[i];
    });
    return cDict;
  }

  getProperties(selectValue, summary) {
    document.getElementById('loading-fulltoc').style.display = 'initial';
    document.getElementById('loading-fulltoc').style.display = 'none';
    // loading
    const urlQuery = document.querySelector('#m-fulltoc-addservices-search-input').value;
    const selectValueText = document.querySelector('#m-vectors-ogc-select').selectedOptions[0].text;
    selectValue = document.querySelector('#m-vectors-ogc-select').value;
    const limit = document.querySelector('#limit-items-input').value;
    const checked = document.querySelector('#search-bbox').checked;
    const limitValue = limit;
    let bboxString;
    if (checked) {
      const bbox = this.map_.getBbox();
      const min = this.getImpl().getTransformedCoordinates(
        this.map_.getProjection().code,
        [bbox.x.min, bbox.y.min],
      );
      const max = this.getImpl().getTransformedCoordinates(
        this.map_.getProjection().code,
        [bbox.x.max, bbox.y.max],
      );
      bboxString = `${min[0]};${min[1]};${max[0]};${max[1]}`;
    }
    const properties = {};
    properties.url = `${urlQuery}/collections/`;
    properties.name = selectValue;
    properties.legend = selectValueText;
    properties.limit = limitValue;
    if (checked) {
      properties.bbox = bboxString;
    }

    const isFiltroPorID = document.querySelector('#filtro-id-input').checked;

    if (isFiltroPorID === true) {
      properties.id = document.querySelector('#search-form-ID').value;
    } else if (summary !== undefined) {
      properties.conditional = summary;
    }

    properties.format = 'json';

    return properties;
  }

  setOnClickersFiltersButtons(
    summary,
    urlOGC,
    radioBtnFilterByID,
    radioBtnFilterByOther,
    layers,
    url,
    filterByID,
    filterByOtherFilters,
  ) {
    let indexCurrentLayer;
    let formInputs;
    let properties;
    let selectValue = document.querySelector('#m-vectors-ogc-select').value;
    const btnAddLayer = document.querySelector('#fromOGCContainer #select-button');
    const btnCheck = document.querySelector('#fromOGCContainer #check-button');
    const btnCustomQuery = document.querySelector('#custom-query-button');

    btnAddLayer.addEventListener('click', () => {
      if (selectValue === getValue('select_service')) {
        IDEE.dialog.error(getValue('no_results'));
      } else {
        properties = this.getProperties(selectValue, summary);

        this.getImpl().loadOGCAPIFeaturesLayer(properties);

        const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
        buttonClose.click();
      }
    });

    btnCheck.addEventListener('click', () => {
      if (selectValue === getValue('select_service')) {
        IDEE.dialog.error(getValue('no_results'));
      } else {
        properties = this.getProperties(selectValue, summary);
        this.getImpl().getNumberFeaturesOGCAPIFeaturesLayer(properties).then((numberFeatures) => {
          let results1;
          let results2;
          if (numberFeatures === 1) {
            results1 = getValue('results_1_singular');
            results2 = getValue('results_2_singular');
          } else {
            results1 = getValue('results_1_plural');
            results2 = getValue('results_2_plural');
          }
          document.querySelector('#check-results').innerHTML = `${results1}${numberFeatures}${results2}`;
        });
      }
    });

    btnCustomQuery.addEventListener('click', () => {
      let filtersList;

      const previousModal = document.querySelector('.m-content').innerHTML;
      selectValue = document.querySelector('#m-vectors-ogc-select').value;
      const limit = document.querySelector('#limit-items-input').value;
      const checked = document.querySelector('#search-bbox').checked;
      const urlQueryables = `${urlOGC}/collections/${selectValue}/queryables`;
      IDEE.remote.get(urlQueryables).then((queryablesResponse) => {
        try {
          const res = JSON.parse(queryablesResponse.text);
          const props = res.properties;
          filtersList = Object.values(props);
          filtersList.forEach((v) => {
            if (v.title !== undefined) {
              const type = v.type.toLowerCase();
              if (type === 'bool' || type === 'boolean') {
                v.bool = true;
              } else if (type === 'timestamp' || type === 'date') {
                v.date = true;
              } else if (type === 'int4' || type === 'int'
                || type === 'number' || type === 'numeric' || type.includes('numeric')) {
                v.number = true;
              } else {
                v.text = true;
              }
            }
            if (summary !== undefined) {
              if (v.title in summary) {
                v.value = summary[v.title];
              }
              document.querySelector('#check-results').innerHTML = '';
            }
          });
        } catch (error) {}
        const urlInput = document.querySelector('#m-fulltoc-addservices-search-input').value;

        const customQueryTemplate = IDEE.template.compileSync(customQueryFiltersTemplate, {
          jsonp: true,
          parseToHtml: false,
          vars: {
            filtersList,
            summary,
            translations: {
              other_filters: getValue('other_filters'),
              id_filter: getValue('id_filter'),
              filters: getValue('filters'),
              custom_query_warning: getValue('custom_query_warning'),
            },
          },
        });
        const msg = `${getValue('custom_query_btn')}`;
        IDEE.dialog.remove(ogcModalTemplate);
        IDEE.dialog.info(customQueryTemplate, msg);
        const btnApplyFilters = document.createElement('button');
        const btnBack = document.createElement('button');
        setTimeout(() => {
          const temp = document.querySelector('div.m-api-idee-container div.m-dialog div.m-title');
          temp.style.backgroundColor = '#71a7d3';
          const button = document.querySelector('div.m-dialog.info div.m-button > button');
          button.innerHTML = getValue('close');
          button.style.width = '75px';
          button.style.backgroundColor = '#71a7d3';
          button.style.display = 'none';
          const buttons = document.querySelector('div.m-dialog.info div.m-button');

          btnBack.textContent = getValue('close');
          btnBack.style.width = '75px';
          btnBack.style.backgroundColor = '#71a7d3';
          btnBack.style.marginLeft = '4px';
          btnBack.setAttribute('data-link', urlInput);
          btnBack.setAttribute('data-service-type', 'OGCAPIFeatures');
          buttons.insertBefore(btnBack, buttons.firstChild);

          btnApplyFilters.textContent = getValue('apply_btn');
          btnApplyFilters.style.width = '75px';
          btnApplyFilters.style.backgroundColor = '#71a7d3';
          btnApplyFilters.setAttribute('data-link', urlInput);
          btnApplyFilters.setAttribute('data-service-type', 'OGCAPIFeatures');
          buttons.insertBefore(btnApplyFilters, buttons.firstChild);
        }, 10);
        btnApplyFilters.addEventListener('click', () => {
          let filterByIDTemp = false;
          let filterByOtherFiltersTemp = false;

          // comprobar el valor del tipo de filtro seleccionado
          if (radioBtnFilterByID.checked) {
            filterByIDTemp = true;
            filterByOtherFiltersTemp = false;
            formInputs = document.querySelectorAll('#search-form-id input');
          } else if (radioBtnFilterByOther.checked) {
            filterByIDTemp = false;
            filterByOtherFiltersTemp = true;
            formInputs = document.querySelectorAll('#search-form-otros input');
          }
          const cDict = this.getFiltersDict(formInputs);

          const modalActual = document.querySelector('.m-content');

          modalActual.innerHTML = previousModal;

          indexCurrentLayer = layers.findIndex((capa) => {
            return capa.id === selectValue;
          });

          if (IDEE.utils.isNullOrEmpty(cDict)) {
            this.printOGCModal(url, indexCurrentLayer, limit, checked);
          } else if (Object.keys(cDict).length === 0) {
            this.printOGCModal(url, indexCurrentLayer, limit, checked);
          } else {
            this.printOGCModal(
              url,
              indexCurrentLayer,
              limit,
              checked,
              cDict,
              filterByIDTemp,
              filterByOtherFiltersTemp,
            );
          }
        });
        btnBack.addEventListener('click', () => {
          const modalActual = document.querySelector('.m-content');
          modalActual.innerHTML = previousModal;
          indexCurrentLayer = layers.findIndex((capa) => {
            return capa.id === selectValue;
          });
          this.printOGCModal(
            url,
            indexCurrentLayer,
            limit,
            checked,
            summary,
            filterByID,
            filterByOtherFilters,
          );
        });
      }).catch((err) => {
        IDEE.dialog.error(getValue('no_results'));
      });
    });
  }

  setOnChanges(summary) {
    document.querySelector('#search-form-ID').addEventListener('change', () => {
      document.querySelector('#check-results').innerHTML = '';
    });

    document.querySelector('#limit-items-input').addEventListener('change', () => {
      document.querySelector('#check-results').innerHTML = '';
    });
    document.querySelector('#search-bbox').addEventListener('change', () => {
      document.querySelector('#check-results').innerHTML = '';
    });

    document.querySelector('#m-vectors-ogc-select').addEventListener('change', () => {
      const divSummary = document.querySelector('#div-summary');
      if (divSummary !== null) {
        divSummary.remove();
        summary = undefined;
      }
      document.querySelector('#check-results').innerHTML = '';
    });
  }

  setOnClickRadioBtn(radioBtnFilterByID, radioBtnFilterByOther) {
    radioBtnFilterByID.addEventListener('click', () => {
      document.querySelector('#otros-filtros').style.display = 'none';
      document.querySelector('#filtro-id').style.display = 'block';
      document.querySelector('#check-results').innerHTML = '';
    });
    radioBtnFilterByOther.addEventListener('click', () => {
      document.querySelector('#otros-filtros').style.display = 'block';
      document.querySelector('#filtro-id').style.display = 'none';
      document.querySelector('#check-results').innerHTML = '';
    });
  }

  setOnClickCloseBtn() {
    const buttonClose = document.querySelector('div.m-dialog.info div.m-button > button');
    buttonClose.innerHTML = getValue('close');
    buttonClose.style.width = '75px';
    buttonClose.style.backgroundColor = '#71a7d3';
    buttonClose.addEventListener('click', () => {
      try {
        document.querySelector('div.m-dialog.info').parentNode.removeChild(document.querySelector('div.m-dialog.info'));
      } catch (error) {}
      this.afterRender();
    });
  }

  printOGCModal(
    url,
    selectedLayer,
    limitVal,
    onlyBbox,
    summary,
    filterByID,
    filterByOtherFilters,
  ) {
    let prevID;
    let urlOGC = url.trim();
    if (IDEE.utils.isUrl(urlOGC)) {
      document.querySelector('#m-fulltoc-addservices-search-input').value = url;

      document.querySelector('#m-fulltoc-addservices-search-btn').addEventListener('click', (e) => {
        this.filterName = undefined;
        this.readCapabilities(e);
      });

      const collections = `${(urlOGC.endsWith('/') ? urlOGC : `${urlOGC}/`)}collections?f=json`;
      IDEE.remote.get(collections).then((response) => {
        const resJSON = JSON.parse(response.text);
        const layers = resJSON.collections;
        if (IDEE.utils.isNullOrEmpty(summary)) {
          summary = undefined;
          filterByID = undefined;
          filterByOtherFilters = undefined;
        }

        const ogcModal = IDEE.template.compileSync(ogcModalTemplate, {
          jsonp: true,
          parseToHtml: false,
          vars: {
            layers,
            selectedLayer,
            limit: limitVal,
            bbox: onlyBbox,
            summary,
            filterByID,
            filterByOtherFilters,
            prevID,
            translations: {
              select_service: getValue('select_service'),
              amount_results: getValue('amount_results'),
              amount_results_2: getValue('amount_results_2'),
              bbox_select: getValue('bbox-select'),
              other_filters: getValue('other_filters'),
              id_filter: getValue('id_filter'),
              warning: getValue('warning'),
              add_btn: getValue('add_btn'),
              custom_query_btn: getValue('custom_query_btn'),
              filters: getValue('filters'),
              check_results: getValue('check_results'),
            },
          },
        });

        document.querySelector('#fromOGCContainer').outerHTML = ogcModal;
        this.accessibilityTab(document.querySelector('#fromOGCContainer'));

        const radioBtnFilterByID = document.querySelector('input[name="filtro"][value="id"]');

        const radioBtnFilterByOther = document.querySelector('input[name="filtro"][value="otros"]');

        this.setOnClickRadioBtn(radioBtnFilterByID, radioBtnFilterByOther);

        this.setOnChanges(summary);

        this.setOnClickCloseBtn();

        this.setOnClickersFiltersButtons(
          summary,
          urlOGC,
          radioBtnFilterByID,
          radioBtnFilterByOther,
          layers,
          url,
          filterByID,
          filterByOtherFilters,
        );
      }).catch((err) => {
        urlOGC = '';
        IDEE.dialog.error(getValue('exception.error_ogc'));
      });
    }
  }

  checkUrls(url1, url2) {
    return url1 === url2 || (url1.indexOf(url2) > -1) || (url2.indexOf(url1) > -1);
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
