/**
 * @module M/control/FilteredSearchControl
 */

import FilteredSearchImplControl from 'impl/filteredsearchcontrol';
import template from 'templates/filteredsearch';
import fieldsTemplate from 'templates/fieldstable';
import valuesTemplate from 'templates/valuestable';
import seeResults from 'templates/seeresults';
import initialView from 'templates/initialview';
import savedQueries from 'templates/savedqueries';
import { getValue } from './i18n/language';

export default class FilteredSearchControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(values) {
    if (IDEE.utils.isUndefined(FilteredSearchImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new FilteredSearchImplControl();
    super(impl, 'FilteredSearch');
    this.pluginOnLeft = values.pluginOnLeft;
    /**
     * Filtering query (written in sql style)
     * @public
     */
    this.sqlQuery = '';

    /**
     * Mapea filter with the user's query.
     * @public
     */
    this.mapeaFilterQuery = null;

    /**
     * Saved queries
     * @public
     */
    this.myqueries = [];

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
     * Layer fields items divided by page.
     * format: [[item_1, item_2, item_3], [i4, i5, i6], ... ]
     * @public
     */
    this.fieldsPages = [];

    /**
     * Layer field values items divided by page.
     * format: [[item_1, item_2, item_3], [i4, i5, i6], ... ]
     * @public
     */
    this.valuesPages = [];

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
     * Fields page counter
     * @public
     */
    this.currentFieldsPage = 0;

    /**
     * Field values page counter.
     * @public
     */
    this.currentValuesPage = 0;

    /**
     * Table view results page counter.
     * @public
     */
    this.resultsPage = 0;

    /**
     * KML layers added to map.
     * @public
     */
    this.kmlLayers = [];
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
    this.map = map;
    return new Promise((success, fail) => {
      this.createInitialView(map);

      // Desplazar open button
      if (this.pluginOnLeft) {
        document.querySelector('.m-panel.filtered-search-panel').querySelector('.m-panel-btn.g-plugin-filteredsearch-filter').addEventListener('click', (evt) => {
          let buttonOpened = document.querySelector('.m-panel.filtered-search-panel.opened');
          if (buttonOpened !== null) {
            buttonOpened = buttonOpened.querySelector('.m-panel-btn.g-cartografia-flecha-izquierda');
          }
          if (buttonOpened && this.pluginOnLeft) {
            buttonOpened.classList.add('opened-left');
          }
        });
      }

      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            title: getValue('title'),
            return_btn: getValue('return'),
            accept_btn: getValue('accept'),
            clear_search: getValue('clear_search'),
            clear_filter: getValue('clear_filter'),
            see_table: getValue('see_table'),
            export: getValue('export'),
            save: getValue('save'),
            my_queries: getValue('my_queries'),
            remove_queries: getValue('remove_queries'),
          },
        },
      });
      html.querySelector('#m-filteredsearch-options-container').appendChild(this.initialView);
      this.filterResults = IDEE.template.compileSync(seeResults);
      this.valuesTemplate = IDEE.template
        .compileSync(valuesTemplate, { jsonp: true, vars: { values: [] } });
      this.addEvents(html);
      const htmlSelect = html.querySelector('#m-filteredsearch-layers-select');
      this.subscribeActionLayer(htmlSelect);
      this.setInitialButtons(html);
      this.kmlLayers = this.map.getKML().map((layer) => {
        return { layer, loaded: false };
      });
      success(html);
    });
  }

  /**
   * Adds event listeners to several HTML elements.
   * @public
   * @function
   * @param {HTML Element} html - 'filteredsearch.html' template
   * @api
   */
  addEvents(html) {
    this.initialView.querySelector('#m-filteredsearch-layers-select').addEventListener('change', (evt) => {
      this.showLayerFields(evt.target[evt.target.selectedIndex].getAttribute('name'));
    });
    this.initialView.querySelector('#m-filteredsearch-method-select').addEventListener('change', (evt) => {
      this.selectionMethod = evt.target.value;
    });
    html.querySelectorAll('#m-filteredsearch-operators-container>button').forEach((element) => {
      element.addEventListener('click', (e) => this.operatorClick(e, element));
    });
    html.querySelectorAll('#m-filteredsearch-options-buttons>button')
      .forEach((btn) => btn.addEventListener('click', (e) => {
        this.processQuery(e);
      }));
    html.querySelector('#m-filteredsearch-query-container>textarea').addEventListener('input', (e) => {
      this.sqlQuery = e.target.value.replace(/_/g, '.').replace(/%/g, '.*');
      this.setInitialButtons(document.querySelector('#m-filteredsearch-options-buttons'));
    });
    // checks if KML layers are loaded and saves flag on this.kmlLayers object
    this.map.getKML().forEach((kmlLayer) => {
      kmlLayer.on(IDEE.evt.LOAD, () => {
        this.kmlLayers.filter((layer) => {
          return layer.layer === kmlLayer;
        })[0].loaded = true;
      });
    });
  }

  /**
   * Creates initialview.html template dinamically.
   * @public
   * @function
   * @api
   * @param {Map} map
   */
  createInitialView(map) {
    const options = {
      jsonp: true,
      vars: {
        layers: map.getLayers()
          .filter((layer) => layer instanceof IDEE.layer.Vector && layer.name !== '__draw__'),
        translations: {
          layer: getValue('layer'),
          select_layer: getValue('select_layer'),
          method: getValue('method'),
          select_method: getValue('select_method'),
          new_select: getValue('new_select'),
          previous_selection: getValue('previous_selection'),
          previous_remove: getValue('previous_remove'),
          previous_add: getValue('previous_add'),
          fields: getValue('fields'),
          values: getValue('values'),
          operators: getValue('operators'),
          filter_exp: getValue('filter_exp'),
          placeholder: getValue('placeholder'),
        },
      },
    };
    this.initialView = IDEE.template.compileSync(initialView, options);
    this.operators.forEach((operator) => {
      const btnTextNode = document.createTextNode(operator);
      const buttonNode = document.createElement('button');
      buttonNode.appendChild(btnTextNode);
      this.initialView.querySelector('#m-filteredsearch-operators-container').appendChild(buttonNode);
    });
  }

  /**
   * Turns sql-like query string into Mapea filter.
   * @public
   * @function
   * @api
   * @param { String } stringQ - sql-like query
   */
  turnStringIntoQuery(stringQ) {
    let pieces = [];
    let mapeaFilter;
    const nextOperator = this.findNextOperator(stringQ);
    if (!this.isThisTheLastOperator(stringQ, nextOperator)) {
      pieces = this.saveOperands(stringQ, nextOperator.indexes);
      for (let i = 0; i < pieces.length; i += 1) {
        pieces[i] = this.turnStringIntoQuery(pieces[i]);
      }
    } else {
      pieces[0] = stringQ.substring(0, nextOperator.indexes[0]).trim();
      pieces[1] = stringQ.substring(nextOperator.indexes[1] + 1).trim();
      mapeaFilter = this.translateOrderToQuery(nextOperator.operator, pieces);
      return mapeaFilter;
    }

    mapeaFilter = this.translateOrderToQuery(nextOperator.operator, pieces);

    return mapeaFilter;
  }

  /**
   * Action layer in Selects layers
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   */
  subscribeActionLayer(html) {
    // Subscribe remove layer event.
    this.map.on(IDEE.evt.REMOVED_LAYER, (layers) => {
      if (Array.isArray(layers)) {
        layers.filter((layer) => layer instanceof IDEE.layer.Vector)
          .forEach((layer) => this.removeLayerOption(html, layer));
      } else if (layers instanceof IDEE.layer.Vector) {
        const layer = { ...layers };
        this.removeLayerOption(html, layer);
      }
    });
    // Subscribe add layer event.
    this.map.on(IDEE.evt.ADDED_LAYER, (layers) => {
      if (Array.isArray(layers)) {
        layers.filter((layer) => layer instanceof IDEE.layer.Vector)
          .forEach((layer) => this.addLayerOption(html, layer));
      } else if (layers instanceof IDEE.layer.Vector) {
        const layer = { ...layers };
        this.addLayerOption(html, layer);
      }
    });
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
          // htmlSelect.selectedIndex = 0;
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

  /**
   * Finds the next most important operator on a string.
   * @public
   * @function
   * @api
   * @param {String} query - query string
   */
  findNextOperator(query) { // TODO: shorten this method
    let operator = '';
    const indexes = [];

    // First, and/or search (outside parentheses)
    for (let i = 0; i < query.length; i += 1) {
      // avoids searching inside ()
      if (query.charAt(i) === '(') {
        const closingParenthesesIndex = this.findClosingParentheses(query, i);
        i = closingParenthesesIndex + 1;
      }

      if ((query.substring(i, i + 3) === 'and'
        && !this.operatorInWord(query, [i, i + 2]))
        || (query.substring(i, i + 2) === 'or'
          && !this.operatorInWord(query, [i, i + 1]))
      ) {
        if (query.substring(i, i + 3) === 'and') {
          operator = query.substring(i, i + 3);
          indexes[0] = i;
          indexes[1] = i + 2;
        } else { // or
          operator = query.substring(i, i + 2);
          indexes[0] = i;
          indexes[1] = i + 1;
        }
        i = query.length;
      }
    }

    if (operator === '') {
      for (let i = 0; i < query.length; i += 1) {
        // avoids searching inside ()
        if (query.charAt(i) === '(') {
          const closingParenthesesIndex = this.findClosingParentheses(query, i);
          i = closingParenthesesIndex + 1;
        }

        if ((query.substring(i, i + 3) === 'not'
          && !this.operatorInWord(query, [i, i + 2]))
          || (query.substring(i, i + 4) === 'like'
            && !this.operatorInWord(query, [i, i + 3]))) {
          if (query.substring(i, i + 3) === 'not') {
            operator = query.substring(i, i + 3);
            indexes[0] = i;
            indexes[1] = i + 2;
          } else { // like
            operator = query.substring(i, i + 4);
            indexes[0] = i;
            indexes[1] = i + 3;
          }
          i = query.length;
        }
      }
    }

    if (operator === '') {
      for (let i = 0; i < query.length; i += 1) {
        // avoids searching inside ()
        if (query.charAt(i) === '(') {
          const closingParenthesesIndex = this.findClosingParentheses(query, i);
          i = closingParenthesesIndex + 1;
        }

        if (query.substring(i, i + 2) === '<='
          || query.substring(i, i + 2) === '>='
          || query.substring(i, i + 2) === '<>') {
          operator = query.substring(i, i + 2);
          indexes[0] = i;
          indexes[1] = i + 1;
          i = query.length;
        } else if (query.charAt(i) === '=' || query.charAt(i) === '<'
          || query.charAt(i) === '>') {
          operator = query.charAt(i);
          indexes[0] = i;
          indexes[1] = i;
          i = query.length;
        }
      }
    }

    return { operator, indexes };
  }

  /**
   * Checks if a string has any operators other than the given one.
   * @function
   * @public
   * @param {String} query
   * @param {String} operator
   * @api
   */
  isThisTheLastOperator(query, operator) {
    let isLastOp = true;
    const ops = ['=', '<=', '>=', '<>', '(', 'and', 'or', 'not', 'like'];
    const cutQuery = `${query.substring(0, operator.indexes[0])}${query.substring(operator.indexes[1] + 1)}`;
    if (
      ops.some((v) => {
        const operatorContainedInQuery = cutQuery.indexOf(v) >= 0;
        const possibleOperatorIndexes = [
          cutQuery.indexOf(v),
          (cutQuery.indexOf(v) + ops[ops.indexOf(v)].length) - 1,
        ];
        const operatorNotInWord = !this.operatorInWord(cutQuery, possibleOperatorIndexes);
        return operatorContainedInQuery && operatorNotInWord;
      })) {
      isLastOp = false;
    }
    return isLastOp;
  }

  /**
   * Splits string into operands by operator position.
   * @public
   * @function
   * @api
   * @param {String} query - query string
   * @param {String} operator - calculation operator
   * @param {Array} startEndIndexes - operands limits
   */
  saveOperands(query, startEndIndexes) {
    let operands = [];
    const startSplitIndex = startEndIndexes[0];
    const endSplitIndex = startEndIndexes[1];

    if (startSplitIndex !== 0) {
      operands.push(query.substring(0, startSplitIndex).trim());
    }
    operands.push(query.substring(endSplitIndex + 1).trim());

    operands = operands.map((operand) => {
      let newOperand = operand;
      if (operand[0] === '(') {
        newOperand = newOperand.substring(1);
      }
      if (operand[operand.length - 1] === ')') {
        newOperand = newOperand.substring(0, operand.length - 1);
      }
      return newOperand;
    });

    return operands;
  }

  /**
   * Turns simple query expression into Mapea filter.
   * @public
   * @function
   * @param {String} operator - operator to apply on split query
   * @param { Array < String > } pieces - expression operands
   * @api
   */
  translateOrderToQuery(operator, pieces) {
    let mFilter = '';

    switch (operator) {
      case '=':
        mFilter = IDEE.filter.EQUAL(...pieces);
        break;
      case '<>':
        const attr = pieces[0];
        const val = pieces[1];
        mFilter = new IDEE.filter.Function((feature) => {
          return feature.getAttribute(attr) !== val;
        });
        break;
      case '<':
        mFilter = IDEE.filter.LT(...pieces);
        break;
      case '>':
        mFilter = IDEE.filter.GT(...pieces);
        break;
      case '<=':
        mFilter = IDEE.filter.LTE(...pieces);
        break;
      case '>=':
        mFilter = IDEE.filter.GTE(...pieces);
        break;
      case 'and':
        mFilter = IDEE.filter.AND([...pieces]);
        break;
      case 'or':
        mFilter = IDEE.filter.OR([...pieces]);
        break;
      case 'like':
        mFilter = IDEE.filter.LIKE(...pieces);
        break;
      case 'not':
        mFilter = IDEE.filter.NOT(...pieces);
        break;
      default:
    }

    return mFilter;
  }

  /**
   * Finds the closing parentheses of a pair.
   * @public
   * @function
   * @api
   * @param {String} query - query string where the parentheses set is found
   * @param { Number } openingIndex - opening parentheses index
   */
  findClosingParentheses(query, openingIndex) {
    let closingParenthesesIndex;
    let parenthesesCounter = 0;
    for (let i = openingIndex + 1; i < query.length; i += 1) {
      if (parenthesesCounter === 0 && query.charAt(i) === ')') {
        closingParenthesesIndex = i;
        i = query.length;
      } else if (query.charAt(i) === '(') {
        parenthesesCounter += 1;
      } else if (query.charAt(i) === ')' && parenthesesCounter !== 0) {
        parenthesesCounter -= 1;
      }
    }
    return closingParenthesesIndex;
  }

  /**
   * Checks if given operator is part of a word or a real operator.
   * Returns true if it's a real operator.
   * @public
   * @function
   * @api
   * @param {String} query - string in which the operator candidate is found
   * @param { Array < String > } operatorIndexes - start and end operator indexes on query
   */
  operatorInWord(query, operatorIndexes) {
    let inWord = false;
    const startSplitIndex = operatorIndexes[0];
    const endSplitIndex = operatorIndexes[1];
    const previousChar = query[startSplitIndex - 1];
    const nextChar = query[endSplitIndex + 1];

    if (((previousChar !== undefined) && (previousChar.match(/[a-z]/i)))
      || ((nextChar !== undefined) && (nextChar.match(/[a-z]/i)))) {
      inWord = true;
    }

    return inWord;
  }

  /**
   * Checks if a parentheses in a string belongs to a Mapea filter method.
   * @public
   * @function
   * @param { String } query - complete or partial query string
   * @param {Number} index - indexOf first parentheses on string
   * @api
   */
  isMapeaFilterParentheses(query, index) {
    const twoLettersOperators = ['OR', 'LT', 'GT'];
    const threeLettersOperators = ['AND', 'NOT', 'LTE', 'GTE'];
    const position = index;
    let isMFilterPar = false;

    if ((((position - 11 !== -1) && (query.substring(position - 11, position - 2) === 'IDEE.filter.'))
      && twoLettersOperators.includes(query.substring(position - 2, position)))
      || (((position - 12 !== -1) && (query.substring(position - 12, position - 3) === 'IDEE.filter.'))
        && threeLettersOperators.includes(query.substring(position - 3, position)))
        || (((position - 13 !== -1) && (query.substring(position - 13, position - 4) === 'IDEE.filter.'))
        && (query.substring(position - 4, position) === 'LIKE'))
        || (((position - 14 !== -1) && (query.substring(position - 14, position - 5) === 'IDEE.filter.'))
        && (query.substring(position - 5, position) === 'EQUAL'))) {
      isMFilterPar = true;
    }

    return isMFilterPar;
  }

  /**
   * Turns new given filter into a filter that combines the already applied filter and the new one.
   * @public
   * @function
   * @param { IDEE.Filter } mapeaFilter - new query filter
   * @api
   */
  getMethodFilter(mapeaFilter) {
    let combinedFilter;
    switch (this.selectionMethod) {
      case '1':
        combinedFilter = mapeaFilter;
        break;
      case '2':
        if (this.oldFilter !== undefined) {
          // AND nueva query
          combinedFilter = IDEE.filter.AND([this.oldFilter, mapeaFilter]);
        } else {
          IDEE.dialog.error(getValue('exception.no_previous_query'));
        }
        break;
      case '3':
        if (this.oldFilter !== undefined) {
          // AND NOT nueva query
          combinedFilter = IDEE.filter.AND([this.oldFilter, IDEE.filter.NOT(mapeaFilter)]);
        } else {
          IDEE.dialog.error(getValue('exception.no_previous_query'));
        }
        break;
      case '4':
        if (this.oldFilter !== undefined) {
          // OR nueva query
          combinedFilter = IDEE.filter.OR([this.oldFilter, mapeaFilter]);
        } else {
          IDEE.dialog.error(getValue('exception.no_previous_query'));
        }
        break;
      default:
        IDEE.dialog.error(getValue('exception.must_select_method'));
        break;
    }

    return combinedFilter;
  }

  /**
   * Performs button action onClick.
   * @public
   * @function
   * @param {Event} e - triggering event
   * @api
   */
  processQuery(e) {
    const optsContainer = document.querySelector('#m-filteredsearch-options-container');
    const btnContainer = document.querySelector('#m-filteredsearch-options-buttons');
    const action = e.target.getAttribute('id');

    switch (action) {
      case 'aceptar-btn':
        if (this.layer_ === undefined) {
          IDEE.dialog.error(getValue('exception.must_select_layer'));
        } else {
          if (this.selectionMethod === '1') {
            this.oldFilter = undefined;
            this.oldLayer = undefined;
          }
          this.setNewFilter();
          if (this.isValidQuery && this.selectionMethod !== undefined) this.setOkButtons();
        }
        break;
      case 'limpiar-busqueda-btn':
        this.cleanSearch();
        break;
      case 'limpiar-filtro-btn':
        this.layer_.removeFilter();
        this.setInitialButtons(btnContainer);
        break;
      case 'vertabla-btn':
        this.saveResultsOnTable();
        optsContainer.innerHTML = '';
        optsContainer.appendChild(this.filterResults);
        this.setTableViewButtons(btnContainer);
        break;
      case 'exportar-btn':
        this.exportResults();
        break;
      case 'guardar-btn':
        if (this.isValidQuery) {
          this.myqueries.push({
            query: this.sqlQuery,
            layer: this.layer_,
          });
        } else {
          IDEE.dialog.error(getValue('exception.invalid_query'));
        }
        break;
      case 'misconsultas-btn':
        this.myQueriesClick(optsContainer);
        this.showMyQueriesViewButtons(btnContainer);
        break;
      case 'volver-btn':
        optsContainer.innerHTML = '';
        optsContainer.appendChild(this.initialView);
        this.setOkButtons();
        if (this.clickedQuery !== undefined) {
          document.getElementById('m-filteredsearch-textArea').value = this.clickedQuery.query;
          const Select = document.getElementById('m-filteredsearch-layers-select');
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < Select.options.length; i++) {
            if (Select.options[i].value === this.clickedQuery.layer.name) {
              Select.options.selectedIndex = [i];
            }
          }
          this.clickedQuery = undefined;
        }
        // TODO: check if there's a filter applied to show data btns or not
        document.querySelector('#guardar-btn').style.display = 'none';
        break;
      case 'eliminar-btn':
        // this.deleteFromButton();
        break;
      default:
        break;
    }
  }

  /**
   * Shows saved queries view (saved queries with filter activation on click).
   * @public
   * @function
   * @api
   * @param {HTML Element} central panel
   */
  myQueriesClick(container) {
    const optsContainer = container;
    optsContainer.innerHTML = '';

    this.compileMyQueriesTemplate();

    this.addSavedQueryClick();

    optsContainer.appendChild(this.savedQueriesView);
  }

  /**
   * Adds event listener for click on saved query table cell.
   * @public
   * @function
   * @api
   */
  addSavedQueryClick() {
    this.savedQueriesView.querySelectorAll('td').forEach((td, idx) => {
      td.addEventListener('click', (e) => {
        this.savedQueryClicked(e, td, idx);
      });
    });
  }

  /**
   * Deletes previous filters and applies clicked filter to map.
   * Adds focus to clicked query cell.
   * Shows delete query button.
   * @param {Event} e - triggering event
   * @param {HTML Element} td - clicked query table cell
   * @param {Number} idx - this.myqueries clicked query index
   */
  savedQueryClicked(e, td, idx) {
    this.deleteAppliedFilters();
    this.clickedQuery = this.myqueries[idx];
    this.mapeaFilterQuery = this.turnStringIntoQuery(this.clickedQuery.query);
    this.layer_ = this.clickedQuery.layer;
    this.layer_.setFilter(this.mapeaFilterQuery);

    Array.prototype.forEach.call(
      e.target.parentNode.parentNode.parentNode.children[0].children,
      (row) => {
        Array.prototype.forEach.call(row.children, (rowCell) => {
          rowCell.classList.remove('focus');
        });
      },
    );
    e.target.classList.add('focus');

    const deleteBtn = document.querySelector('#m-filteredsearch-options-buttons').querySelector('#eliminar-btn');
    deleteBtn.style.display = 'inline';
    deleteBtn.onclick = () => {
      this.deleteSavedQuery(td, idx);
      this.compileMyQueriesTemplate();
      this.addSavedQueryClick();
      document.querySelector('#m-filteredsearch-options-container').appendChild(this.savedQueriesView);
    };
  }

  /**
   * Deletes saved query from this.myqueries.
   * @public
   * @function
   * @param {HTML Element} td - results table cell with query
   * @param {Number} idx - saved queries array query index
   * @api
   */
  deleteSavedQuery(td, idx) {
    this.myqueries.splice(idx, 1);
    td.parentNode.remove();
    document.querySelector('#m-filteredsearch-options-buttons').querySelector('#eliminar-btn').style.display = 'none';
    this.sqlQuery = '';
    this.layer_.removeFilter();
    if (this.myqueries.length === 0) {
      document.querySelector('#m-filteredsearch-options-container').innerHTML = getValue('no_saved_queries');
    }
  }

  /**
   * Compiles savedQueries template with this.myqueries data.
   * @public
   * @function
   * @api
   */
  compileMyQueriesTemplate() {
    if (this.savedQueriesView !== undefined) {
      let child = this.savedQueriesView.lastElementChild;
      while (child) {
        child.remove();
        child = this.savedQueriesView.lastElementChild;
      }
    }

    this.mySqlQueries = this.myqueries.map((q) => {
      const newQuery = q;
      newQuery.query = q.query.replace(/\.\*/g, '%').replace(/\./g, '_');
      return newQuery;
    });
    this.savedQueriesView = IDEE.template.compileSync(savedQueries, {
      vars: {
        queries: this.mySqlQueries,
        translations: {
          no_saved_queries: getValue('no_saved_queries'),
        },
      },
    });
  }

  /**
   * Resets every layer to initial filter (null).
   * @public
   * @function
   * @api
   */
  deleteAppliedFilters() {
    const vectorLayers = this.map.getWFS()
      .concat(this.map.getKML()
        .concat(this.map.getLayers().filter((layer) => {
          return layer.type === 'GeoJSON';
        })));
    vectorLayers.forEach((layer) => {
      if (layer.getFilter !== null) layer.removeFilter();
    });
  }

  /**
   * Sets new filter on layer.
   * @public
   * @function
   * @api
   */
  setNewFilter() {
    // Sets new filter
    if (this.sqlQuery === '') {
      IDEE.dialog.error(getValue('exception.must_query'));
      // Resets last saved query
      this.mapeaFilterQuery = this.oldFilter;
      this.layer_ = this.oldLayer;
    } else if (this.oldLayer !== undefined && this.oldLayer !== this.layer_) {
      IDEE.dialog.error(getValue('exception.cant_apply'));
      // Resets last saved query
      this.mapeaFilterQuery = this.oldFilter;
      this.layer_ = this.oldLayer;
    } else {
      // Gets new query
      let tryFilter;

      // FIXME: Trying to do nothing if filter doesn't get set on map
      // Cases visibility and description of 'Arboleda' layer never enter catch. Doesn't work right.
      try {
        tryFilter = this.turnStringIntoQuery(this.sqlQuery);
        tryFilter = this.getMethodFilter(tryFilter);
        this.layer_.setFilter(tryFilter);
        if (this.layer_.getFilter() !== null) {
          this.mapeaFilterQuery = tryFilter;
          this.oldFilter = this.mapeaFilterQuery;
          this.oldLayer = this.layer_;
          this.isValidQuery = true;
        } else {
          this.isValidQuery = false;
          throw new Error(getValue('exception.invalid_filter'));
        }
      } catch (err) {
        this.isValidQuery = false;
        IDEE.dialog.error(getValue('exception.cant_apply_filter'));
      }
    }
  }

  /**
   * Downloads .csv file with results data.
   * @public
   * @function
   * @api
   */
  exportResults() {
    const features = this.layer_.getFeatures();
    if (features.length > 0) {
      const csvString = this.dataToCsv(features);
      this.downloadCsv(csvString);
    } else {
      IDEE.dialog.error(getValue('exception.no_export_data'));
    }
  }

  /**
   * Saves features attributes on csv string.
   * @public
   * @function
   * @param {IDEE.feature} features - query results features
   * @api
   */
  dataToCsv(features) {
    let csv = '';
    const featureKeys = Object.keys(features[0].getAttributes());
    featureKeys.forEach((key) => { csv += `${key},`; });
    csv = `${csv.substring(0, csv.length - 1)}\n`; // deletes last ',' and adds line break

    features.forEach((feature) => {
      const featureAttrs = feature.getAttributes(); // {cod: '11', nombre: 'Cádiz'}
      featureKeys.forEach((key) => {
        // only escape() if string has more than letters and spaces
        // substitute 'escape' (deprecated) for own escape method
        // csv += `${escape(featureAttrs[key])},`;
        csv += featureAttrs[key];
        csv += ',';
      });
      csv = `${csv.substring(0, csv.length - 1)}\n`; // deletes last ',' and adds line break
    });
    csv = csv.substring(0, csv.length - 1); // deletes last line break
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
   * Shows initial view buttons.
   * @public
   * @function
   * @param {HTML Element} panelContainer - Buttons div container
   * @api
   */
  setInitialButtons(panelContainer) {
    const btnContainer = panelContainer;
    btnContainer.querySelector('#volver-btn').style.display = 'none';
    btnContainer.querySelector('#aceptar-btn').style.display = 'inline';
    btnContainer.querySelector('#limpiar-busqueda-btn').style.display = 'inline';
    btnContainer.querySelector('#limpiar-filtro-btn').style.display = 'inline';
    btnContainer.querySelector('#vertabla-btn').style.display = 'none';
    btnContainer.querySelector('#exportar-btn').style.display = 'none';
    btnContainer.querySelector('#guardar-btn').style.display = 'none';
    btnContainer.querySelector('#misconsultas-btn').style.display = 'inline';
    btnContainer.querySelector('#eliminar-btn').style.display = 'none';
  }

  /**
   * Shows buttons for view after a filter is set.
   * @public
   * @function
   * @api
   */
  setOkButtons() {
    document.querySelector('#volver-btn').style.display = 'none';
    document.querySelector('#aceptar-btn').style.display = 'inline';
    document.querySelector('#limpiar-busqueda-btn').style.display = 'inline';
    document.querySelector('#limpiar-filtro-btn').style.display = 'inline';
    document.querySelector('#vertabla-btn').style.display = 'inline';
    document.querySelector('#exportar-btn').style.display = 'inline';
    document.querySelector('#guardar-btn').style.display = 'inline';
    document.querySelector('#misconsultas-btn').style.display = 'inline';
    document.querySelector('#eliminar-btn').style.display = 'none';
  }

  /**
   * Hides some buttons for "Results table" view.
   * @public
   * @function
   * @param {HTML Element} container - Buttons div container
   * @api
   */
  setTableViewButtons(container) {
    const btnContainer = container;
    btnContainer.querySelector('#volver-btn').style.display = 'inline';
    btnContainer.querySelector('#aceptar-btn').style.display = 'none';
    btnContainer.querySelector('#limpiar-busqueda-btn').style.display = 'none';
    btnContainer.querySelector('#limpiar-filtro-btn').style.display = 'none';
    btnContainer.querySelector('#vertabla-btn').style.display = 'none';
    btnContainer.querySelector('#exportar-btn').style.display = 'none';
    btnContainer.querySelector('#guardar-btn').style.display = 'none';
    btnContainer.querySelector('#misconsultas-btn').style.display = 'none';
  }

  /**
   * Hides all unnecessary buttons for MyQueries view.
   * @public
   * @function
   * @api
   * @param {HTML Element} container - Buttons div container
   */
  showMyQueriesViewButtons(container) {
    const btnContainer = container;
    btnContainer.querySelector('#volver-btn').style.display = 'inline';
    btnContainer.querySelector('#aceptar-btn').style.display = 'none';
    btnContainer.querySelector('#limpiar-busqueda-btn').style.display = 'none';
    btnContainer.querySelector('#limpiar-filtro-btn').style.display = 'none';
    btnContainer.querySelector('#vertabla-btn').style.display = 'none';
    btnContainer.querySelector('#exportar-btn').style.display = 'none';
    btnContainer.querySelector('#guardar-btn').style.display = 'none';
    btnContainer.querySelector('#misconsultas-btn').style.display = 'none';
  }

  /**
   * Cleans input selections.
   * @public
   * @function
   * @api
   */
  cleanSearch() {
    document.querySelector('.filtered-search-panel').querySelector('textarea').value = '';
    document.querySelector('#m-filteredsearch-method-select').value = getValue('select_method');
    this.selectionMethod = '';
    this.sqlQuery = '';
    document.querySelector('#m-filteredsearch-layers-select').querySelector('#layers0').selected = true;
    document.querySelector('#m-filteredsearch-fields').innerHTML = `<p class="m-filteredsearch-headers">${getValue('fields')}</p>`;
    document.querySelector('#m-filteredsearch-values').innerHTML = `<p class="m-filteredsearch-headers">${getValue('values')}</p>`;
  }

  /**
   * Shows expected results page
   * @public
   * @function
   * @param {Array <Array>} pages - results divided in pages
   * @api
   */
  showTableViewPage(pages) {
    // empty results table
    this.filterResults.querySelector('#queryresults').innerHTML = '';

    // Get layer attributes and show column titles and pagination buttons
    const attributes = this.layer_.getFeatures()[0].getAttributes();
    let newLine = document.createElement('tr');
    Object.keys(attributes).forEach((attributeKey) => {
      const newTitleCell = document.createElement('th');
      const cellText = document.createTextNode(attributeKey);
      newTitleCell.appendChild(cellText);
      newLine.appendChild(newTitleCell);
    });
    this.filterResults.querySelector('#queryresults').appendChild(newLine);
    this.filterResults.querySelector('#paginationbuttons>#pageNumBtn').innerHTML = `${this.resultsPage + 1} de ${pages.length}`;

    // Show every result on a new table row
    const currentPageFeatures = pages[this.resultsPage];
    currentPageFeatures.forEach((filteredFeature) => {
      newLine = document.createElement('tr');
      const filteredAttributes = filteredFeature.getAttributes();
      Object.keys(filteredAttributes).forEach((key) => {
        const newCell = document.createElement('td');
        // Commented code in case table field needs to show table
        // const htmlContent = document.createElement('div');
        // htmlContent.innerHTML = filteredAttributes[key];
        // newCell.appendChild(htmlContent);
        const txt = document.createTextNode(filteredAttributes[key].toString());
        newCell.appendChild(txt);
        newLine.appendChild(newCell);
      });
      this.filterResults.querySelector('#queryresults').appendChild(newLine);
    });
  }

  /**
   * Creates a table row for every result after filtering layer features.
   * @function
   * @public
   * @api
   */
  saveResultsOnTable() {
    if (this.layer_.getFeatures().length > 0) {
      // Divide filter results into pages & show current page
      const pages = this.divideList(this.layer_.getFeatures());
      this.showTableViewPage(pages);

      // Page turning
      this.filterResults.querySelectorAll('#paginationbuttons>button').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          if (e.target.id === 'prevBtn') {
            this.resultsPage = this.resultsPage > 0 ? this.resultsPage -= 1 : this.resultsPage;
          } else {
            this.resultsPage = this.resultsPage < pages.length - 1
              ? this.resultsPage += 1 : this.resultsPage;
          }
          this.showTableViewPage(pages);
        });
      });
    } else {
      this.filterResults.innerHTML = getValue('no_entities');
    }
  }

  /**
   * Saves clicked button operator in query and adds it to textarea.
   * @public
   * @function
   * @param {Event} e
   * @param {HTML Element} btn
   * @api
   */
  operatorClick(e, btn) {
    const txtarea = document.querySelector('.filtered-search-panel').querySelector('textarea');
    switch (btn.innerHTML) {
      case '()':
        if (this.parenthesesClick === 0) {
          txtarea.value += '(';
          this.sqlQuery += '(';
          this.parenthesesClick = 1;
        } else {
          txtarea.value += ')';
          this.sqlQuery += ')';
          this.parenthesesClick = 0;
        }
        break;
      case '&#61;':
        txtarea.value += ' = ';
        this.sqlQuery += ' = ';
        break;
      case '&lt;':
        txtarea.value += ' < ';
        this.sqlQuery += ' < ';
        break;
      case '&gt;':
        txtarea.value += ' > ';
        this.sqlQuery += ' > ';
        break;
      case '&lt;&gt;':
        txtarea.value += ' <> ';
        this.sqlQuery += ' <> ';
        break;
      case '&gt;=':
        txtarea.value += ' >= ';
        this.sqlQuery += ' >= ';
        break;
      case '&lt;=':
        txtarea.value += ' <= ';
        this.sqlQuery += ' <= ';
        break;
      case '_': // sql _ -> regexp .
        txtarea.value += '_';
        this.sqlQuery += '.';
        break;
      case '%': // sql % -> regexp .*
        txtarea.value += '%';
        this.sqlQuery += '.*';
        break;
      default:
        txtarea.value += ` ${btn.innerHTML.toLowerCase()} `;
        this.sqlQuery += ` ${btn.innerHTML.toLowerCase()} `;
    }
  }

  /**
   * Shows selected layer fields list first page (if layer is loaded).
   * @public
   * @function
   * @param { String } layerName - selected layer name
   * @api
   */
  showLayerFields(layerName) {
    // finds and saves param layerName
    if (!IDEE.utils.isNullOrEmpty(layerName)) {
      this.layer_ = this.hasLayer_(layerName)[0];
    }

    if (this.isLayerLoaded(this.layer_)) {
      this.fieldValues = [];
      const features = this.layer_.getFeatures();

      // clears previous query
      this.oldFilter = this.mapeaFilterQuery;
      this.oldLayer = this.layer_;
      document.querySelector('.filtered-search-panel').querySelector('textarea').value = '';
      this.sqlQuery = '';
      this.mapeaFilterQuery = null;

      // if there's features on this.layer_, save them and their values on arrays
      if (!IDEE.utils.isNullOrEmpty(features)) {
        this.fields = Object.keys(features[0].getAttributes());
        features.forEach((feature) => {
          const properties = Object.values(feature.getAttributes());
          if (!IDEE.utils.isNullOrEmpty(properties)) {
            this.fieldValues.push(properties);
          }
        });

        this.fieldsPages = this.divideList(this.fields);
        const fields = this.fieldsPages[0];

        const options = { jsonp: true, vars: { fields } };
        this.fieldsTemplate = IDEE.template.compileSync(fieldsTemplate, options);
        this.fieldsTemplate.querySelector('#pageNumBtn').innerHTML = `1 de ${this.fieldsPages.length}`;
        document.querySelector('#m-filteredsearch-fields').innerHTML = `<p class="m-filteredsearch-headers">${getValue('fields')}</p>`;
        document.querySelector('#m-filteredsearch-fields').appendChild(this.fieldsTemplate);

        this.showFields();
        this.addpageBtnEvt();
      }
    } else {
      IDEE.dialog.error(getValue('exception.layer_load'));
    }
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
    const kmlLayerLoaded = this.kmlLayers.find((l) => l.layer === layer)
      ? this.kmlLayers.find((l) => l.layer === layer).loaded : false;
    if (layer.type && layer.type !== 'KML' && layer.getImpl().isLoaded()) {
      isLoaded = true;
    } else if (kmlLayerLoaded) {
      isLoaded = true;
    }
    return isLoaded;
  }

  /**
   * Adds click event on each field.
   * Adds field name to query, finds possible field values and shows them and changes cell focus.
   * @public
   * @function
   * @api
   */
  showFields() {
    document.querySelector('#m-filteredsearch-fields').querySelectorAll('td').forEach((cell) => {
      const values = [];
      const fieldIndex = this.fields.indexOf(cell.innerHTML);
      this.fieldValues.forEach((element) => {
        values.push(element[fieldIndex]);
      });
      cell.addEventListener('click', (e) => {
        const txtarea = document.querySelector('.filtered-search-panel').querySelector('textarea');
        txtarea.value += e.target.innerHTML;
        this.sqlQuery += e.target.innerHTML;
        this.selectField(values);
        // sets 'focus'
        Array.prototype.forEach.call(
          e.target.parentNode.parentNode.parentNode.children[0].children,
          (row) => {
            Array.prototype.forEach.call(row.children, (rowCell) => {
              rowCell.classList.remove('focus');
            });
          },
        );
        e.target.classList.add('focus');
      });
    });
  }

  /**
   * Adds pagination buttons onclick events.
   * @public
   * @function
   * @api
   */
  addpageBtnEvt() {
    this.fieldsTemplate.querySelectorAll('#m-attributetable-tfoot>button').forEach((element) => {
      element.addEventListener('click', (e) => this.changePage(e, 'fields', this.fieldsPages.length));
    });
    this.valuesTemplate.querySelectorAll('#m-attributetable-tfoot>button').forEach((element) => {
      element.addEventListener('click', (e) => this.changePage(e, 'values', this.valuesPages.length));
    });
  }

  /**
   * Divides list items in groups of 5 items.
   * @public
   * @function
   * @api
   * @param {List} items - items (fields/values) to separate in pages
   * @returns {Array <Array>} pages - each inside array has n items
   */
  divideList(items) {
    const numberOfItemsPerPage = 5;
    const pages = [];
    let firstItem = 0;
    while (firstItem < items.length) {
      const newPage = [];
      for (let i = firstItem; i < firstItem + numberOfItemsPerPage; i += 1) {
        newPage.push(items[i]);
        if (i + 1 === items.length) {
          i = firstItem + numberOfItemsPerPage;
        }
      }
      pages.push(newPage);
      firstItem += numberOfItemsPerPage;
    }
    return pages;
  }

  /**
   * Changes currentPage number and shows page results on fields/values list.
   * @public
   * @function
   * @api
   * @param {Event} e - event triggering button
   * @param {String} fieldsOrValues - container key (either 'fields' or 'values')
   * @param {Number} numberOfPages
   */
  changePage(e, fieldsOrValues, numberOfPages) {
    let currentPage = fieldsOrValues === 'fields' ? this.currentFieldsPage : this.currentValuesPage;

    if (e.target.id === 'prevBtn') {
      currentPage = currentPage > 0 ? currentPage -= 1 : currentPage;
    } else {
      currentPage = currentPage < numberOfPages - 1 ? currentPage += 1 : currentPage;
    }

    if (fieldsOrValues === 'fields') {
      this.currentFieldsPage = currentPage;
    } else {
      this.currentValuesPage = currentPage;
    }

    this.showPageResults(fieldsOrValues);
    this.addpageBtnEvt();
  }

  /**
   * Shows current page results on fields/values area.
   * @public
   * @function
   * @api
   * @param {HTML Element} fieldsOrValues - element where items will be shown
   */
  showPageResults(fieldsOrValues) {
    if (fieldsOrValues === 'fields') {
      const fields = this.fieldsPages[this.currentFieldsPage];
      const options = { jsonp: true, vars: { fields } };
      this.fieldsTemplate = IDEE.template.compileSync(fieldsTemplate, options);
      this.fieldsTemplate.querySelector('#pageNumBtn').innerHTML = `${this.currentFieldsPage + 1} de ${this.fieldsPages.length}`;
      document.querySelector('#m-filteredsearch-fields').innerHTML = `<p class="m-filteredsearch-headers">${getValue('fields')}</p>`;
      document.querySelector('#m-filteredsearch-fields').appendChild(this.fieldsTemplate);
      this.showFields();
    } else {
      const values = this.valuesPages[this.currentValuesPage];
      const options = { jsonp: true, vars: { values } };
      this.valuesTemplate = IDEE.template.compileSync(valuesTemplate, options);
      this.valuesTemplate.querySelector('#pageNumBtn').innerHTML = `${this.currentValuesPage + 1} de ${this.valuesPages.length}`;
      this.fieldsTemplate.querySelector('#pageNumBtn').innerHTML = `${this.currentFieldsPage + 1} de ${this.fieldsPages.length}`;
      document.querySelector('#m-filteredsearch-values').innerHTML = `<p class="m-filteredsearch-headers">${getValue('values')}</p>`;
      document.querySelector('#m-filteredsearch-values').appendChild(this.valuesTemplate);
      document.querySelector('#m-filteredsearch-values').querySelectorAll('td').forEach((cell) => {
        cell.addEventListener('click', (e) => {
          const txtarea = document.querySelector('.filtered-search-panel').querySelector('textarea');
          txtarea.value += e.target.innerHTML;
          this.sqlQuery += e.target.innerHTML;
          Array.prototype.forEach.call(
            e.target.parentNode.parentNode.parentNode.children[0].children,
            (row) => {
              Array.prototype.forEach.call(row.children, (rowCell) => {
                rowCell.classList.remove('focus');
              });
            },
          );
          e.target.classList.add('focus');
        });
      });
    }
  }

  /**
   * Shows possible values for selected field.
   * @public
   * @function
   * @param {Array} values - existing values for selected field
   * @api
   */
  selectField(fieldValues) {
    // reduces field values to unique possible values
    const values = fieldValues.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    this.valuesPages = this.divideList(values);
    const firstValues = this.valuesPages[0];
    const options = { jsonp: true, vars: { values: firstValues } };

    this.currentFieldsPage = 0;
    this.currentValuesPage = 0;

    this.valuesTemplate = IDEE.template.compileSync(valuesTemplate, options);
    this.valuesTemplate.querySelector('#pageNumBtn').innerHTML = `${this.currentValuesPage + 1} de ${this.valuesPages.length}`;

    this.valuesTemplate.querySelectorAll('#m-filteredsearch-valuestable>tbody>tr>td').forEach((tableCell) => {
      tableCell.addEventListener('click', (e) => this.selectValue(e));
    });
    document.querySelector('#m-filteredsearch-values').innerHTML = `<p class='m-filteredsearch-headers'>${getValue('values')}</p>`;
    document.querySelector('#m-filteredsearch-values').appendChild(this.valuesTemplate);
    this.addpageBtnEvt();
  }

  /**
   * Adds clicked option info to textarea and query.
   * @public
   * @function
   * @param {Event} e - triggering event
   * @api
   */
  selectValue(e) {
    const txtarea = document.querySelector('.filtered-search-panel').querySelector('textarea');
    txtarea.value += e.currentTarget.innerHTML;
    this.sqlQuery += e.currentTarget.innerHTML;
    Array.prototype.forEach.call(
      e.currentTarget.parentNode.parentNode.children,
      (row) => {
        row.children[0].classList.remove('focus');
      },
    );
    e.currentTarget.classList.add('focus');
  }

  /**
   * Checks if map has given layer and returns that layer.
   *
   * @private
   * @param {array<string>| string| IDEE.Layer} layerSearch -
        Array of layer names, layer name or layer instance
   * @function
   */
  hasLayer_(layerSearch) {
    const layersFind = [];
    if (IDEE.utils.isNullOrEmpty(layerSearch) || (!IDEE.utils.isArray(layerSearch)
      && !IDEE.utils.isString(layerSearch) && !(layerSearch instanceof IDEE.Layer))) {
      IDEE.dialog.error(getValue('exception.hasLayer_error'), getValue('exception.error'));
      return layersFind;
    }

    if (IDEE.utils.isString(layerSearch)) {
      this.map.getLayers().forEach((lay) => {
        if (lay.name === layerSearch) {
          layersFind.push(lay);
        }
      });
    }

    if (layerSearch instanceof IDEE.Layer) {
      this.map.getLayers().forEach((lay) => {
        if (lay.equals(layerSearch)) {
          layersFind.push(lay);
        }
      });
    }
    if (IDEE.utils.isArray(layerSearch)) {
      this.map.getLayers().forEach((lay) => {
        if (layerSearch.indexOf(lay.name) >= 0) {
          layersFind.push(lay);
        }
      });
    }
    return layersFind;
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
    return control instanceof FilteredSearchControl;
  }
}
