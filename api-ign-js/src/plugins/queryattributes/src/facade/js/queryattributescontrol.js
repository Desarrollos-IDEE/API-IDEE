/**
 * @module M/control/QueryAttributesControl
 */

import QueryAttributesImplControl from 'impl/queryattributescontrol';
import template from 'templates/queryattributes';
import initialView from 'templates/initialview';
import tabledata from 'templates/tabledata';
import information from 'templates/information';
import downloadTemplate from 'templates/downloading';
import shpWrite from 'shp-write';
import tokml from 'tokml';
import { getValue } from './i18n/language';

export default class QueryAttributesControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */

  constructor(configuration, filters, collapsed_, position_, refreshBBOXFilterOnPanning_) {
    if (M.utils.isUndefined(QueryAttributesImplControl)) {
      M.exception(getValue('exception.impl'));
    }

    const impl = new QueryAttributesImplControl();
    super(impl, 'QueryAttributes');

    /**
     * Mapea filter with the user's query.
     * @public
     */
    this.mapeaFilterQuery = null;

    /**
     * Parentheses click counter
     * @public
     * If 0, a '(' is written. If 1, a ')'.
     */
    this.parenthesesClick = 0;

    /**
     * Operators for creating queries
     * @public
     */
    this.operators = ['=', '<', '>', '<=', '>=', '<>', '()', 'and', 'or', 'not', 'like', '%', '_'];

    /**
     * Operators html codes.
     * @public
     */
    this.operatorCodes = ['&#61;', '&lt;', '&gt;'];

    /**
     * Selected layer attributes list.
     * @public
     */
    this.fields = [];

    /**
     * Possible values for all fields of the selected layer.
     * @public
     */
    this.fieldValues = [];

    /**
     * KML layers added to map.
     * @public
     */
    this.kmlLayers = [];

    this.filtered = false;

    this.bboxfilter = false;

    // e2m: Guarda el id del elemento selecionado
    this.featureIdSelected = -1;

    this.configuration = configuration;

    this.collapsed = collapsed_;

    this.position = position_;

    this.refreshBBOXFilterOnPanning = refreshBBOXFilterOnPanning_;

    this.selectionLayer = new M.layer.Vector({
      extract: false,
      name: 'selectLayer',
      source: this.getImpl().newVectorSource(true),
    }, { displayInLayerSwitcher: false });

    this.selectionLayerStyle = new M.style.Point({
      radius: 10,
      stroke: {
        color: '#FF0000',
        width: 2,
      },
      /*
      icon: {
              form: M.style.form.CIRCLE,
              radius: 10,
              rotation: 3.14159,
              rotate: false,
              offset: [0,0],
              color: '#3e77f7',
              fill: 'green',
              gradientcolor: '#3e77f7',
              gradient: false,
              opacity: 1,
              snaptopixel: true,
      },
      */
    });

    /**
     * e2m: add pk column to the beginning of configuration.columns
     */
    this.configuration.columns.unshift({
      name: this.configuration.pk,
      alias: 'pk',
      visible: true,
      align: 'right',
      type: 'pkcolumn',
    });

    this.filters = filters;

    this.sortProperties_ = {
      active: false,
      sortBy: null,
      sortType: 'asc',
    };

    if (configuration.initialSort !== undefined) {
      this.sortProperties_ = {
        active: true,
        sortBy: configuration.initialSort.name,
        sortType: configuration.initialSort.dir,
      };
    }
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
    this.map = map;
    return new Promise((success, fail) => {
      this.createInitialView(map);
      const html = M.template.compileSync(template, {
        vars: {
          translations: {
            attribute_table: getValue('attribute_table'),
            clean_filters: getValue('clean_filters'),
            export: getValue('export'),
          },
        },
      });
      const mbtilesvector = this.map.getMBTilesVector();
      const hasmbtilesvector = mbtilesvector
        .find((layer) => this.configuration.layer === layer.name);
      if (!hasmbtilesvector && this.hasLayer_(this.configuration.layer)[0]) {
        html.querySelector('#m-queryattributes-options-container').appendChild(this.initialView);

        this.addEvents(html);
        this.kmlLayers = this.map.getKML().map((layer) => {
          return { layer, loaded: false };
        });

        this.selectionLayer.setStyle(this.selectionLayerStyle);
        this.map.addLayers(this.selectionLayer);
      }

      success(html);
    });
  }

  /**
   * Adds event listeners to several HTML elements.
   * @public
   * @function
   * @param {HTML Element} html - 'queryattributes.html' template
   * @api
   */
  addEvents(html) {
    this.html = html;
    html.querySelector('#m-queryattributes-options-buttons>button#exportar-btn')
      .addEventListener('click', this.exportResults.bind(this));
    html.querySelector('#m-queryattributes-options-buttons>button#limpiar-filtro-btn')
      .addEventListener('click', () => {
        this.layer.removeFilter();
        this.showAttributeTable(this.layer.name);
        document.querySelector('#m-queryattributes-options-buttons #limpiar-filtro-btn').style.display = 'none';
        document.querySelector('#m-queryattributes-filter #m-queryattributes-search-input').value = '';
        document.querySelector('#m-queryattributes-options-information-container').innerHTML = '';
        this.bboxfilter = false;
      });
    html.querySelector('#m-queryattributes-options-buttons>button#cleanEmphasis-btn')
      .addEventListener('click', () => {
        document.querySelector('#m-queryattributes-options-buttons #cleanEmphasis-btn').style.display = 'none';
        this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
        // e2m: limpiamos tabla
        const rowfeature = document.getElementById(`feat_${this.featureIdSelected}`).parentNode; // e2m: elemento tr
        // e2m: Limpiamos filas <tr> de la clase highlight-attrow
        const nodes = rowfeature.parentNode.childNodes;
        for (let i = 0; i < nodes.length; i += 1) {
          if (nodes[i].nodeName.toLowerCase() === 'tr') {
            nodes[i].classList.remove('highlight-attrow');
          }
        }
        this.featureIdSelected = -1;
      });

    html.querySelector('#m-queryattributes-filter #m-queryattributes-search-btn').addEventListener('click', this.searchFilter.bind(this));
    html.querySelector('#m-queryattributes-filter #m-queryattributes-search-input').addEventListener('keyup', (e) => {
      this.searchFilter();
      // e2m: en vez de esperar al Enter para buscar, lo hace en cada pulsación
      // if (e.keyCode === 13) {
      //   this.searchFilter();
      // }
    });

    if (this.filters) {
      html.querySelector('#m-queryattributes-filter button.filter-bbox').addEventListener('click', this.setBboxFilter.bind(this));
      html.querySelector('#m-queryattributes-filter button.filter-area').addEventListener('click', this.setDrawFilter.bind(this));
    }

    this.map.getKML().forEach((kmlLayer) => {
      kmlLayer.on(M.evt.LOAD, () => {
        this.kmlLayers.find((layer) => {
          return layer.layer === kmlLayer;
        }).loaded = true;
      });
    });

    if (this.filters) {
      this.showAttributeTable(this.configuration.layer);
    } else {
      this.showAttributeTable(this.configuration.layer, this.setBboxFilter.bind(this));
      this.map.getMapImpl().on('moveend', () => {
        this.setBboxFilter();
      });
    }
  }

  showAttributeTable(layerName, callback) {
    const columns = this.configuration.columns;

    if (!M.utils.isNullOrEmpty(layerName)) {
      this.layer = this.hasLayer_(layerName)[0];
      if (this.allFeatures === undefined) {
        this.allFeatures = this.layer.getFeatures();
      }
    }

    if (M.utils.isNullOrEmpty(this.layer)) {
      // Cuando layer es nulo o vacío, no se muestra el gif de carga.
      this.html.querySelector('.m-queryattributes-table-loading').style.display = 'none';
    }

    const interval = setInterval(() => {
      if (!M.utils.isNullOrEmpty(this.layer) && this.isLayerLoaded(this.layer)) {
        clearInterval(interval);
        document.getElementById('m-queryattributes-table').innerHTML = '';
        document.getElementById('m-queryattributes-search-results').innerHTML = '';
        const headerAtt = [];
        const aligns = [];
        const typesdata = [];
        const typesparam = [];
        let attributes = [];
        const features = this.layer.getFeatures();
        if (this.allFeatures.length !== features.length) {
          document.getElementById('m-queryattributes-search-results').innerHTML = `Filtrados ${features.length} de ${this.allFeatures.length} registros.`;
        } else {
          document.getElementById('m-queryattributes-search-results').innerHTML = `Total: ${this.allFeatures.length} registros. `;
        }
        // e2m: ocultamos nuestro spinner de búsqueda.
        this.html.querySelector('#m-queryattributes-searching-results').style.display = 'none';

        if (!M.utils.isNullOrEmpty(features)) {
          Object.keys(features[0].getAttributes()).forEach((attr) => {
            if (columns !== undefined && columns.length > 0) {
              const filtered = columns.filter((elem) => {
                return elem.name === attr && elem.visible;
              });
              if (filtered.length > 0) {
                filtered.forEach((item) => {
                  headerAtt.push({
                    name: attr,
                    alias: item.alias,
                    isPkColumn: item.type === 'pkcolumn',
                  });
                  aligns.push(item.align);
                  typesdata.push(item.type);
                  typesparam.push(item.typeparam);
                });
              }
            } else {
              headerAtt.push({
                name: attr,
                alias: attr.alias,
                isPkColumn: attr.type === 'pkcolumn',
              });
              aligns.push('right');
              typesdata.push('string');
              typesparam.push('');
            }
          });

          features.forEach((feature) => {
            const keys = Object.keys(feature.getAttributes());
            const properties = Object.values(feature.getAttributes());
            if (!M.utils.isNullOrEmpty(properties)) {
              if (columns !== undefined && columns.length > 0) {
                const newProperties = [];
                properties.forEach((prop, index) => {
                  const filtered = columns.filter((elem) => {
                    return elem.name === keys[index] && elem.visible;
                  });
                  if (filtered.length > 0) {
                    filtered.forEach((item) => {
                      newProperties.push(prop);
                    });
                  }
                });
                attributes.push(newProperties);
              } else {
                attributes.push(properties);
              }
            }
          });
          if (this.sortProperties_.active) {
            attributes = this.sortAttributes_(attributes, headerAtt);
          }
        }

        let params = {};
        const attributesParam = [];
        attributes.forEach((values) => {
          const attrP = [];
          values.forEach((v, index) => {
            attrP.push({
              value: v,
              align: aligns[index],
              /**
               * e2m:
               * typesdata[index] lo cambiamos por flags -> gestión más fácil en Handlebars
               */
              isLinkURL: typesdata[index] === 'linkURL',
              isButtonURL: typesdata[index] === 'buttonURL',
              isImage: typesdata[index] === 'image',
              isString: typesdata[index] === 'string',
              isPercentage: typesdata[index] === 'percentage',
              isFormatter: typesdata[index] === 'formatter',
              isPkColumn: typesdata[index] === 'pkcolumn',
              typeparam: typesparam[index],
            });
          });
          attributesParam.push(attrP);
        });
        if (!M.utils.isUndefined(headerAtt)) {
          params = {
            headerAtt,
            legend: this.layer.legend,
            attributes: (M.utils.isNullOrEmpty(attributesParam)) ? false : attributesParam,
          };
        }

        params.translations = { not_attributes: getValue('not_attributes') };
        const options = {
          jsonp: true,
          vars: params,
        };
        const html = M.template.compileSync(tabledata, options);
        document.getElementById('m-queryattributes-table').appendChild(html);
        document.getElementById('m-queryattributes-filter').style.display = 'flex';
        document.querySelector('#m-queryattributes-options-buttons #exportar-btn').style.display = 'block';

        html.querySelectorAll('table thead tr th span').forEach((th) => {
          th.addEventListener('click', this.sort_.bind(this));
        });
        html.querySelectorAll('table tbody tr').forEach((tr) => {
          tr.addEventListener('click', this.centerOnFeature.bind(this));
        });
        if (callback) {
          callback();
        }
        this.map.getMapImpl().on('click', (evt) => {
          this.actualizaInfo(evt, this.layer);
        });

        if (this.refreshBBOXFilterOnPanning) {
          this.map.getMapImpl().on('moveend', (evt) => {
            if (this.bboxfilter) {
              this.setBboxFilter();
            }
          });
        }
      }
    }, 1000);
  }

  /**
   * This function sort attributes
   *
   * @private
   * @function
   * @param {array<string>} attributes - Attributes to sort
   * @param {array<string>} headerAtt - name attributes
   * @return {array<string>} attributes - Ordered attributes
   */
  sortAttributes_(attributes, headerAtt) {
    const sortBy = this.sortProperties_.sortBy;
    let pos = 0;
    headerAtt.forEach((elem, index) => {
      if (elem.name === sortBy) {
        pos = index;
      }
    });

    let attributesSort = attributes.sort((a, b) => {
      return this.compareStrings(a[pos], b[pos]);
    });

    if (this.sortProperties_.sortType === 'desc') {
      attributesSort = attributesSort.reverse();
    }
    return attributesSort;
  }

  compareStrings(a, b) {
    let res = 0;
    let newA = a;
    let newB = b;
    if (Number.isNaN(newA) || Number.isNaN(newB)) {
      newA = (`${newA}`).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      newB = (`${newB}`).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    if (newA < newB) {
      res = -1;
    } else if (newA > newB) {
      res = 1;
    }
    return res;
  }

  /**
   * e2m:
   * Procedimiento para mostrar información al hacer clic en el elemento de la tabla
   * @param {*} evt
   */
  centerOnFeature(evt) {
    document.querySelector('#m-queryattributes-options-information-container').innerHTML = '';
    const value = evt.target.parentNode.children[0].textContent.trim();
    const features = this.layer.getFeatures();
    const field = Object.keys(features[0].getAttributes())[0];
    // e2m: Limpiamos filas de la clase highlight-attrow
    const nodes = evt.target.parentNode.parentNode.childNodes;
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].nodeName.toLowerCase() === 'tr') {
        nodes[i].classList.remove('highlight-attrow');
      }
    }
    // e2m: Añadimos la clase highlight-attrow
    evt.target.parentNode.classList.add('highlight-attrow');

    const filtered = features.filter((f) => {
      return this.compareStrings(`${f.getAttributes()[field]}`.trim(), value) === 0;
    });
    if (filtered.length > 0) {
      const type = filtered[0].getGeometry().type.toLowerCase();
      const coordinates = filtered[0].getGeometry().coordinates;
      const ext = this.getImpl().getGeomExtent(type, coordinates);
      if (ext !== null) {
        this.map.setBbox(ext);
        if (type.indexOf('point') > -1) {
          this.map.setZoom(14);
        }
      }

      const fields = [];
      Object.entries(filtered[0].getAttributes()).forEach((entry) => {
        const config = this.getColumnConfig(entry[0]);
        if (config.showpanelinfo === false) return;
        fields.push({
          name: config.alias,
          value: entry[1],
          isLinkURL: config.type === 'linkURL',
          isButtonURL: config.type === 'buttonURL',
          isImage: config.type === 'image',
          isString: config.type === 'string',
          isPercentage: config.type === 'percentage',
          isFormatter: config.type === 'formatter',
          typeparam: config.typeparam,
        });
      });

      /**
       * e2m
       * Una vez que tenemos el feature en el que vamos a centrar lo añadimos
       * a la capa de selecciones para aplicarle un énfasis
       */
      this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
      this.selectionLayer.addFeatures(filtered[0]);
      const buttons = '#m-queryattributes-options-buttons>button';
      document.querySelector(`${buttons}#cleanEmphasis-btn`).style.display = 'block';

      const html = M.template.compileSync(information, {
        vars: {
          fields,
          translations: {
            close: getValue('close'),
            information: getValue('information'),
            show_hide: getValue('show_hide'),
          },
        },
      });
      // e2m: Vaciamos el contenedor de información para cargar los datos nuevos
      this.launchInfoWindow(html);
    }
  }

  /**
   * e2m:
   * Procedimiento para mostrar información al hacer clic en el dfeature sobre la cartografía
   * @param {*} evt
   */
  actualizaInfo(evt, layer) {
    /* eslint no-underscore-dangle: 0 */
    const this_ = this;
    const mapaOL = this.map.getMapImpl();

    mapaOL.forEachFeatureAtPixel(evt.pixel, (feature) => {
      const featureFacade = M.impl.Feature.olFeature2Facade(feature);
      const fields = [];

      /**
       * e2m
       * Añado el feature del que consulto la información a la
       * capa de selecciones para aplicarle un énfasis
       */
      this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
      this.selectionLayer.addFeatures(featureFacade);
      const buttons = '#m-queryattributes-options-buttons>button';
      document.querySelector(`${buttons}#cleanEmphasis-btn`).style.display = 'block';

      Object.entries(featureFacade.getAttributes()).forEach((entry) => {
        const config = this_.getColumnConfig(entry[0]);
        if (config.showpanelinfo === false) return;
        fields.push({
          name: config.alias,
          value: entry[1],
          isLinkURL: config.type === 'linkURL',
          isButtonURL: config.type === 'buttonURL',
          isImage: config.type === 'image',
          isString: config.type === 'string',
          isPercentage: config.type === 'percentage',
          isFormatter: config.type === 'formatter',
          typeparam: config.typeparam,
        });
        // e2m: cogemos el identificador único del feature
        if (config.type === 'pkcolumn') { this.featureIdSelected = entry[1]; }
      });
      if (this.featureIdSelected === -1) return;

      /**
       * e2m
       * Procedimiento para marcar en tabla feature seleccionado
       * Mostrar información atributos en ventana
       * Scroll en lista hasta visualizarlo, sólo si el panel está abierto
       */

      // Seleccionamos la fila <tr> que contiene la celda con el pk del elemento
      const rowfeature = document.getElementById(`feat_${this.featureIdSelected}`).parentNode; // e2m: elemento tr

      // Limpiamos filas <tr> de la clase highlight-attrow
      const nodes = rowfeature.parentNode.childNodes;
      for (let i = 0; i < nodes.length; i += 1) {
        if (nodes[i].nodeName.toLowerCase() === 'tr') {
          nodes[i].classList.remove('highlight-attrow');
        }
      }

      // Añadimos la clase highlight-attrow
      rowfeature.classList.add('highlight-attrow');

      const html = M.template.compileSync(information, {
        vars: {
          fields,
          translations: {
            close: getValue('close'),
            information: getValue('information'),
            show_hide: getValue('show_hide'),
          },
        },
      });
      this_.launchInfoWindow(html);

      const elemSidebar = document.querySelector('.m-panel.m-queryattributes.opened');
      if (elemSidebar !== null) {
        try {
          // Efecto scroll. Se hace tras redimensionar la tabla
          rowfeature.scrollIntoView({
            alignToTop: true,
            behavior: 'smooth',
            block: 'center',
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }
    }, {
      layerFilter: (l) => {
        return l === this.getImpl().getOL3Layer(layer);
      },
    });

    const elemSidebar = document.querySelector('.m-panel.m-queryattributes.opened');
    if (elemSidebar !== null) {
      return; // El sidebar está abierto
    }

    this.addCierraPanelEvent();
    const container = this.map_.getContainer().parentElement.parentElement;
    container.style.width = 'calc(100% - 530px)';
    container.style.position = 'fixed';
    if (this_.position === 'TL') {
      container.style.left = '530px';
    } else {
      container.style.right = '530px';
    }

    const elem = document.querySelector('.m-panel.m-queryattributes.collapsed');
    if (elem !== null) {
      elem.classList.remove('collapsed');
      elem.classList.add('opened');
    }
    this.map_.refresh();

    // e2m: efecto scroll. Se hace tras redimensionar la tabla y abrir el panel.
    if (this.featureIdSelected >= 0) {
      const rowfeature = document.getElementById(`feat_${this.featureIdSelected}`).parentNode; // e2m: elemento tr
      rowfeature.scrollIntoView({
        alignToTop: true,
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  /**
   * e2m:
   * Abre el sidepanel por código, al hacer clic sobre uno de los features de la capa vectorial
   * @param {*} html
   */
  launchInfoWindow(html) {
    document.querySelector('.m-queryattributes #m-queryattributes-table-container').style.maxHeight = '25vh'; // e2m:tamaño máximo cuando se muestra información
    document.querySelector('#m-queryattributes-options-information-container').innerHTML = ''; // e2m:borro contenido para evitar que concatene dentro ventanas de información
    document.querySelector('#m-queryattributes-options-information-container').appendChild(html);
    document.querySelector('#m-queryattributes-information-content > p > span > span:first-child').addEventListener('click', () => {
      const elem = document.querySelector('#m-queryattributes-information-content div');
      if (elem.style.display !== 'none') {
        elem.style.display = 'none'; // e2m:colapsado
        document.querySelector('.m-queryattributes #m-queryattributes-table-container').style.maxHeight = '64vh';
        document.querySelector('#m-queryattributes-information-content > p > span > span:first-child').classList.remove('icon-colapsar');
        document.querySelector('#m-queryattributes-information-content > p > span > span:first-child').classList.add('icon-desplegar');
      } else {
        elem.style.display = 'block'; // e2m:desplegado
        document.querySelector('.m-queryattributes #m-queryattributes-table-container').style.maxHeight = '15vh';
        document.querySelector('#m-queryattributes-information-content > p > span > span:first-child').classList.remove('icon-desplegar');
        document.querySelector('#m-queryattributes-information-content > p > span > span:first-child').classList.add('icon-colapsar');
      }
    });

    document.querySelector('#m-queryattributes-information-content > p > span > span.icon-cerrar').addEventListener('click', () => {
      document.querySelector('#m-queryattributes-options-information-container').innerHTML = '';
      this.selectionLayer.removeFeatures(this.selectionLayer.getFeatures());
      document.querySelector('.m-queryattributes #m-queryattributes-table-container').style.maxHeight = '75vh';
    });
  }

  getColumnConfig(column) {
    let res = {};
    const filtered = this.configuration.columns.filter((elem) => {
      return elem.name === column;
    });

    if (filtered.length > 0) {
      res = filtered[0];
    }

    return res;
  }

  /**
   * This function sets the order
   *
   * @private
   * @function
   * @param {goog.events.BrowserEvent} evt - Event
   */
  sort_(evt) {
    const sortBy = evt.target.parentElement.getAttribute('data-sort');
    if (this.sortProperties_.active === false) this.sortProperties_.active = true;
    if (this.sortProperties_.sortBy !== sortBy) {
      this.sortProperties_.sortType = 'asc';
    } else {
      this.sortProperties_.sortType = (this.sortProperties_.sortType === 'desc') ? 'asc' : 'desc';
    }
    this.sortProperties_.sortBy = sortBy;
    this.showAttributeTable(this.layer.name);
  }

  /**
   * Creates initialview.html template dinamically.
   * @public
   * @function
   * @api
   * @param {Map} map
   */
  createInitialView(map) {
    const searchingFields = this.configuration.columns.filter((item) => {
      return item.searchable === true;
    });
    const options = {
      jsonp: true,
      vars: {
        filters: this.filters,
        searchableFields: searchingFields,
        translations: {
          filters: getValue('filters'),
          bbox: getValue('bbox'),
          area: getValue('area'),
          loading: getValue('loading'),
          search: getValue('search'),
          search_all_fields: getValue('search_all_fields'),
          filter_by_bbox: getValue('filter_by_bbox'),
          filter_by_area: getValue('filter_by_area'),
        },
      },
    };
    this.initialView = M.template.compileSync(initialView, options);
  }

  /**
   * Add html option in Selects.
   * @public
   * @function
   * @param { HTMLElement } html to add the plugin
   * @api stable
   */
  addLayerOption(htmlSelect, layer) {
    const layerName = layer.name;
    if (layerName !== 'cluster_cover' && this.isNotAdded(layerName, htmlSelect)) {
      const htmlOption = document.createElement('option');
      htmlOption.setAttribute('name', layerName);
      htmlOption.innerText = layerName;
      htmlSelect.add(htmlOption);
    }
  }

  /**
   * Remove html option in Selects.
   * @public
   * @function
   * @param { HTMLElement } html to add the plugin
   * @api stable
   */
  removeLayerOption(select, layer) {
    const layerName = layer.name;
    const htmlSelect = select;
    if (layerName !== 'cluster_cover' && !this.isNotAdded(layerName, htmlSelect)) {
      const arrayOptions = [...htmlSelect.children];
      arrayOptions.forEach((opt) => {
        if (opt.innerText === layerName) {
          htmlSelect.removeChild(opt);
        }
      });
      htmlSelect.selectedIndex = 0;
    }
  }

  /**
   * Check if the layer is not added yet.
   * @public
   * @function
   * @param { String } name of layer to add.
   * @api stable
   */
  isNotAdded(layerName, htmlSelect) {
    const aChildren = [...htmlSelect.children];
    return !aChildren.some((o) => o.innerHTML === layerName);
  }

  setBboxFilter() {
    const bbox = this.map.getBbox();
    const extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    const feature = this.getImpl().getPolygonFromExtent(extent);
    const filter = M.filter.spatial.INTERSECT(feature);
    this.layer.setFilter(filter);
    this.filtered = true;
    this.bboxfilter = true;
    this.oldFilter = filter;
    this.oldLayer = this.layer;
    this.showAttributeTable(this.layer.name);
    const buttons = '#m-queryattributes-options-buttons>button';
    document.querySelector(`${buttons}#limpiar-filtro-btn`).style.display = 'block';
    if (this.filters) {
      this.map.setBbox(this.getImpl().getLayerExtent(this.layer));
    }
  }

  setDrawFilter() {
    this.getImpl().addDrawInteraction(() => {
      const feature = this.getImpl().getPolygonFromDrawnFeature();
      const filter = M.filter.spatial.INTERSECT(feature);
      this.layer.setFilter(filter);
      this.filtered = true;
      this.oldFilter = filter;
      this.oldLayer = this.layer;
      this.map.setBbox(this.getImpl().getLayerExtent(this.layer));
      this.showAttributeTable(this.layer.name);
      const buttons = '#m-queryattributes-options-buttons>button';
      document.querySelector(`${buttons}#limpiar-filtro-btn`).style.display = 'block';
    });
  }

  // e2m: búsqueda por filtro de texto.
  searchFilter() {
    this.html.querySelector('#m-queryattributes-searching-results').style.display = 'block';
    let text = this.html.querySelector('#m-queryattributes-filter #m-queryattributes-search-input').value;
    text = this.normalizeString_(text);
    const searchbyColumn = document.getElementById('m-queryattributes-fieldselector').value;
    // e2m: con esto busco en los valores de todos los campos
    // const filter = new M.filter.Function((feature) => {
    //   let res = false;
    //   Object.values(feature.getAttributes()).forEach((v) => {
    //     const value = this.normalizeString_(v);
    //     if (value.indexOf(text) > -1) {
    //       res = true;
    //     }
    //   });
    //   return res;
    // });

    /**
     * e2m:
     * Con esto busco en los campos con la propiedad searchable true
     * Primero filtramos los campos con el aributo searchable = true
     * Después extraemos a un array lso nombres de los campos
     */
    const searchingFields = this.configuration.columns.filter((item) => {
      return item.searchable === true;
    }).map((field) => field.name);

    const filter = new M.filter.Function((feature) => {
      let res = false;
      Object.entries(feature.getAttributes()).forEach((entry) => {
        if (searchingFields.indexOf(entry[0]) < 0) return;
        if (searchbyColumn !== 'All') {
          if (entry[0] !== searchbyColumn) return;
        }
        const value = this.normalizeString_(entry[1]);
        if (value.indexOf(text) > -1) {
          res = true;
        }
      });
      return res;
    });

    this.layer.setFilter(filter);
    this.filtered = true;
    this.oldFilter = filter;
    this.oldLayer = this.layer;

    // e2m: aquí hay que comprobar que el resultado del filtro no es cero

    if (this.layer.getFeatures().length > 0) {
      this.map.setBbox(this.getImpl().getLayerExtent(this.layer));
    }
    this.showAttributeTable(this.layer.name);
    const buttons = '#m-queryattributes-options-buttons>button';
    document.querySelector(`${buttons}#limpiar-filtro-btn`).style.display = 'block';
  }

  /**
   * Downloads .csv file with results data.
   * @public
   * @function
   * @api
   */
  exportResults() {
    if (this.layer.getFeatures().length > 0) {
      const download = M.template.compileSync(downloadTemplate, {
        jsonp: true,
        parseToHtml: false,
        vars: {
          translations: {
            csv: getValue('csv'),
            download: getValue('download'),
          },
        },
      });

      M.dialog.info(download, getValue('export'));
      setTimeout(() => {
        const title = 'div.m-mapea-container div.m-dialog div.m-title';
        document.querySelector(title).style.backgroundColor = '#a15bd7';
        const selector = 'div.m-mapea-container div.m-dialog #downloadFormat button';
        document.querySelector(selector).addEventListener('click', this.downloadLayer.bind(this));
        document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';
        const button = document.querySelector('div.m-dialog.info div.m-button > button');
        button.innerHTML = getValue('close');
        button.style.width = '75px';
        button.style.backgroundColor = '#71a7d3';
      }, 10);
    } else {
      M.dialog.error(getValue('exception.no_data'));
    }
  }

  downloadLayer() {
    const layer = this.layer;
    const selector = 'div.m-mapea-container div.m-dialog #downloadFormat select';
    const format = document.querySelector(selector).value;
    if (format !== 'csv') {
      const geojsonLayer = this.toGeoJSON(layer.getFeatures());
      let arrayContent;
      let mimeType;
      let extensionFormat;

      switch (format) {
        case 'geojson':
          arrayContent = JSON.stringify(geojsonLayer);
          mimeType = 'json';
          extensionFormat = 'geojson';
          break;
        case 'kml':
          const fixedGeojsonLayer = this.fixGeojsonKmlBug(geojsonLayer);
          arrayContent = tokml(fixedGeojsonLayer);
          mimeType = 'xml';
          extensionFormat = 'kml';
          break;
        case 'shp':
          const json = this.parseGeojsonForShp(geojsonLayer);
          const options = {
            folder: layer.name,
            types: {
              point: 'points',
              polygon: 'polygons',
              line: 'lines',
            },
          };
          shpWrite.download(json, options);
          break;
        default:
          M.dialog.error(getValue('exception.no_data'));
          break;
      }

      if (format !== 'shp') {
        const url = window.URL.createObjectURL(new window.Blob([arrayContent], {
          type: `application/${mimeType}`,
        }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${layer.name}.${extensionFormat}`);
        document.body.appendChild(link);
        link.click();
      }
    } else {
      const csvString = this.dataToCsv(layer.getFeatures());
      this.downloadCsv(csvString);
    }

    document.querySelector('div.m-mapea-container div.m-dialog').remove();
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
   * Creates vector layer with copied features
   * @public
   * @function
   * @api
   * @returns {M.layer.Vector}
   */
  toGeoJSON(features) {
    const code = this.map.getProjection().code;
    const featuresAsJSON = features.map((feature) => feature.getGeoJSON());
    return { type: 'FeatureCollection', features: this.geojsonTo4326(featuresAsJSON, code) };
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
   * Saves features attributes on csv string.
   * @public
   * @function
   * @param {M.feature} features - query results features
   * @api
   */
  dataToCsv(features) {
    let csv = '';
    const featureKeys = Object.keys(features[0].getAttributes());
    featureKeys.forEach((key) => { csv += `${key},`; });
    csv = `${csv.substring(0, csv.length - 1)}\n`;
    features.forEach((feature) => {
      const featureAttrs = feature.getAttributes();
      featureKeys.forEach((key) => {
        csv += featureAttrs[key];
        csv += ',';
      });
      csv = `${csv.substring(0, csv.length - 1)}\n`;
    });

    csv = csv.substring(0, csv.length - 1);
    return csv;
  }

  /**
   * Creates hidden link element and clicks it to download given csv data.
   * @public
   * @function
   * @api
   * @param {String} csvdata - csv data with query results
   */
  downloadCsv(csvdata) {
    const fileName = 'queryresults.csv';
    const fileUrl = `data:text/csv;charset=utf-8,${encodeURI(csvdata)}`;
    const hiddenLink = document.createElement('a');
    hiddenLink.href = fileUrl;
    hiddenLink.download = fileName;
    hiddenLink.click();
  }

  /**
   * Checks if layer is loaded.
   * @public
   * @function
   * @param {Mapea Layer} layer - clicked layer on select menu
   * @api
   */
  isLayerLoaded(layer) {
    let isLoaded = false;
    const kmlLayerLoaded = this.kmlLayers.some((l) => l.layer === layer)
      ? this.kmlLayers.find((l) => l.layer === layer).loaded
      : false;
    if (layer.type && layer.type !== 'KML' && layer.getImpl().isLoaded()) {
      isLoaded = true;
    } else if (kmlLayerLoaded) {
      isLoaded = true;
    }
    return isLoaded;
  }

  /**
   * Checks if map has given layer and returns that layer.
   *
   * @private
   * @param {array<string>| string| M.Layer} layerSearch -
        Array of layer names, layer name or layer instance
   * @function
   */
  hasLayer_(layerSearch) {
    const layersFind = [];
    if (M.utils.isNullOrEmpty(layerSearch) || (!M.utils.isArray(layerSearch)
      && !M.utils.isString(layerSearch) && !(layerSearch instanceof M.Layer))) {
      return layersFind;
    }

    if (M.utils.isString(layerSearch)) {
      this.map.getLayers().forEach((lay) => {
        if (lay.name === layerSearch) {
          layersFind.push(lay);
        }
      });
    }

    if (layerSearch instanceof M.Layer) {
      this.map.getLayers().forEach((lay) => {
        if (lay.equals(layerSearch)) {
          layersFind.push(lay);
        }
      });
    }
    if (M.utils.isArray(layerSearch)) {
      this.map.getLayers().forEach((lay) => {
        if (layerSearch.indexOf(lay.name) >= 0) {
          layersFind.push(lay);
        }
      });
    }
    return layersFind;
  }

  normalizeString_(string) {
    return `${string}`.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    return control instanceof QueryAttributesControl;
  }

  addAbrePanelEvent() {
    const elem = document.querySelector('.m-panel.m-queryattributes.collapsed .m-panel-btn.icon-tabla');
    if (elem !== null) {
      elem.addEventListener('click', () => {
        const container = this.map_.getContainer().parentElement.parentElement;
        container.style.width = 'calc(100% - 530px)';
        container.style.position = 'fixed';
        if (this.position === 'TL') {
          container.style.left = '530px';
        } else {
          container.style.right = '530px';
        }
        this.map_.refresh();
        this.addCierraPanelEvent();
      });
    }
  }

  addCierraPanelEvent() {
    const elem = document.querySelector('.m-panel.m-queryattributes.opened .m-panel-btn');
    if (elem !== null) {
      elem.addEventListener('click', () => {
        const container = this.map_.getContainer().parentElement.parentElement;
        container.style.width = '100%';
        container.style.position = '';
        if (this.position_ === 'TL') {
          container.style.left = 'unset';
        } else {
          container.style.right = 'unset';
        }

        this.map_.refresh();
        this.addAbrePanelEvent();
      });
    }
  }

  initPanelAttributes() {
    if (this.collapsed) {
      this.addAbrePanelEvent();
    } else {
      this.addCierraPanelEvent();
      const container = this.map_.getContainer().parentElement.parentElement;
      container.style.width = 'calc(100% - 530px)';
      container.style.position = 'fixed';
      if (this.position === 'TL') {
        container.style.left = '530px';
      } else {
        container.style.right = '530px';
      }
      this.map_.refresh();
    }
  }
}
