/**
 * @module IDEE/control/HelpControl
 */

import HelpImplControl from '../../impl/ol/js/helpcontrol';
import template from '../../templates/help';
import helps from '../../templates/helps';
import { getValue } from './i18n/language';

const SVG_CLOSE = '<svg id="indexLink-top-arrow" fill="currentColor" height="18px" width="18px" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>';
const SVG_OPEN = '<svg fill="currentColor" height="18px" width="18px" viewBox="0 0 24 24" style="display: inline-block; vertical-align: middle;"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>';

export default class HelpControl extends IDEE.Control {
  /**
   * @classdesc
   * Constructor
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(options) {
    if (IDEE.utils.isUndefined(HelpImplControl) || (IDEE.utils.isObject(HelpImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(HelpImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new HelpImplControl();
    super(impl, 'help');

    // Opciones
    this.headerImages = options.headerImages;

    this.headerTitle = options.headerTitle;
    if (!IDEE.utils.isString(this.headerTitle)) {
      const optionstTitle = { ...this.headerTitle };
      this.headerTitle = this.headerTitle[IDEE.language.getLang()];
      if (IDEE.utils.isUndefined(this.headerTitle)) {
        const es = 'es';
        this.headerTitle = optionstTitle[es];
        if (IDEE.utils.isUndefined(this.headerTitle)) {
          this.headerTitle = optionstTitle[Object.keys(optionstTitle)[0]];
        }
      }
    }

    this.controls = options.controls;

    this.tooltip = options.tooltip;

    this.order = options.order;

    this.extendInitialExtraContents = options.extendInitialExtraContents;

    this.initialExtraContents = options.initialExtraContents;
    if (!IDEE.utils.isArray(this.initialExtraContents)) {
      const optionsInitial = { ...this.initialExtraContents };
      this.initialExtraContents = this.initialExtraContents[IDEE.language.getLang()];
      if (IDEE.utils.isUndefined(this.initialExtraContents)) {
        const es = 'es';
        this.initialExtraContents = optionsInitial[es];
        if (IDEE.utils.isUndefined(this.initialExtraContents)) {
          this.initialExtraContents = Object.keys(optionsInitial)[0];
        }
      }
    }

    this.defaultInitialContents = [
      { title: 'API-IDEE', content: `<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">API-IDEE</h2><div><p style='text-align: center'>${getValue('welcome0')}: <a tabindex="0" href='https://plataforma.idee.es/cnig-api' target='_blank'>https://plataforma.idee.es/cnig-api</a></p><p>${getValue('welcome1')}</p><h4>${getValue('welcome2')}</h4><p>${getValue('welcome3')}: <a tabindex="0" href="https://github.com/Desarrollos-IDEE/API-IDEE" target="_blank">https://github.com/Desarrollos-IDEE/API-IDEE</a></p><h4>${getValue('welcome4')}</h4><p>${getValue('welcome5')}: <a tabindex="0" href="http://componentes.idee.es/api-idee/test.html" target="_blank">http://componentes.idee.es/api-idee/test.html</a></p><h4>Wiki API-IDEE</h4><p>${getValue('welcome6')}: <a tabindex="0" href="https://github.com/Desarrollos-IDEE/API-IDEE/wiki" target="_blank">https://github.com/Desarrollos-IDEE/API-IDEE/wiki</a></p><h4>${getValue('welcome7')}</h4><p>${getValue('welcome8')}: <a tabindex="0" href="https://plataforma.idee.es/resources/GaleriaEjemplos_APICNIG/" target="_blank">https://plataforma.idee.es/resources/GaleriaEjemplos_APICNIG/</a></p><h4>${getValue('welcome9')}</h4><p>${getValue('welcome10')}: <a tabindex="0" href="https://plataforma.idee.es/cnig-api" target="_blank">https://plataforma.idee.es/cnig-api</a></p></div>` },
    ];

    if (this.extendInitialExtraContents) {
      this.initialExtraContents = [...this.initialExtraContents, ...this.defaultInitialContents];
    }

    this.finalExtraContents = options.finalExtraContents;
    if (!IDEE.utils.isArray(this.finalExtraContents)) {
      const optionsFinal = { ...this.finalExtraContents };
      this.finalExtraContents = this.finalExtraContents[IDEE.language.getLang()];
      if (IDEE.utils.isUndefined(this.finalExtraContents)) {
        const es = 'es';
        this.finalExtraContents = optionsFinal[es];
        if (IDEE.utils.isUndefined(this.finalExtraContents)) {
          this.finalExtraContents = Object.keys(optionsFinal)[0];
        }
      }
    }

    this.initialIndex = options.initialIndex;

    this.helpsContent = [];
  }

  /**
   * Crea la vista
   *
   * @public
   * @function
   * @param {IDEE.Map} map mapa para añadir el control
   * @api
   */
  createView(map) {
    this.map = map;
    return new Promise((success) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            tooltip: this.tooltip,
          },
          order: this.order || 0,
        },
      });
      html.querySelector('#m-help-button').addEventListener('click', this.showHelp.bind(this, this.initialIndex));
      success(html);
    });
  }

  /**
   * Muestra la ayuda
   *
   * @public
   * @function
   * @api
   */
  showHelp(initialIndex = 0) {
    this.initialIndex = initialIndex;
    let allContents = [...this.initialExtraContents];
    allContents.push({
      title: getValue('tools'),
      content: `<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">${getValue('tools')}</h2><div><p>${getValue('tools1')}</p><p>${getValue('tools2')}</p><p>${getValue('tools3')}</p><p>${getValue('tools4')}</p></div></div>`,
      subContents: this.getHelpsPluginsControls(),
    });
    allContents = [...allContents, ...this.finalExtraContents];

    const list = `<ol>${this.generateContent(allContents)}</ol>`;

    Promise.all(this.helpsContent).then((resultsHelps) => {
      const html = IDEE.template.compileSync(helps, {
        parseToHtml: false,
        vars: {
          library: `${IDEE.config.API_IDEE_URL}js/print.min.js`,
          headerImages: this.headerImages,
          downloadPDFimg: 'https://componentes.idee.es/estaticos/imagenes/logos/file-pdf.svg',
          zoom1: 'https://componentes.idee.es/estaticos/Simbologia/svg/controles_complementos/help/magnify_on.svg',
          zoom2: 'https://componentes.idee.es/estaticos/Simbologia/svg/controles_complementos/help/magnify_off.svg',
          translations: {
            header: getValue('short_title'),
            pdf: getValue('pdf'),
            title: this.headerTitle,
            tools: getValue('tools'),
            help: getValue('help'),
            write: getValue('write'),
            search: getValue('search'),
          },
        },
      });
      const windowHelp = window.open(`${window.location.href}`, '_blank');
      windowHelp.document.open();
      windowHelp.document.write(html);

      windowHelp.document.close();
      windowHelp.addEventListener('load', () => {
        const listContent = windowHelp.document.querySelector('#m-help-index > div:nth-child(2)');
        listContent.appendChild(IDEE.utils.stringToHtml(list));

        const contents = windowHelp.document.querySelector('#m-help-contents');
        resultsHelps.forEach((element, index) => {
          const divContainer = document.createElement('div');
          divContainer.classList.add('m-help-hidden');
          divContainer.id = `help-element-${index}`;
          divContainer.tabIndex = index;
          // eslint-disable-next-line no-return-assign
          [...element.querySelectorAll('[tabindex]')].forEach((e) => e.tabIndex = index);
          divContainer.appendChild(element);
          contents.appendChild(divContainer);
        });
        windowHelp.document.querySelector('#m-help-index > div > ol > li > a').click();
        windowHelp.addZoomAction();

        listContent.querySelectorAll('li:has(>ol)').forEach((element) => {
          // AÑADIR como primer elemento del li
          const span = document.createElement('span');
          span.innerHTML = SVG_OPEN;
          element.insertBefore(span, element.firstChild);

          span.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.querySelector('ol').classList.toggle('hiddenSubContent');

            if (element.querySelector('ol').classList.contains('hiddenSubContent')) {
              span.innerHTML = SVG_CLOSE;
            } else {
              span.innerHTML = SVG_OPEN;
            }
          });
        });
        this.showDefaultContent(windowHelp, this.initialIndex);
      });

      this.helpsContent = [];
    });
  }

  showDefaultContent(windowHelp, contentIndex) {
    const links = windowHelp.document.querySelectorAll('.indexLink');
    for (let i = 0; i < links.length; i += 1) {
      const a = links.item(i);
      if (a.tabIndex === contentIndex) {
        a.click();
        break;
      }
    }
  }

  /**
   * Obtiene la ayuda de los plugins
   *
   * @public
   * @function
   * @api
  */
  getHelpsPluginsControls() {
    const plugins = this.map.getPlugins();
    const controls = this.map.getControls().filter((control) => {
      return this.controls.includes(control.name);
    });
    const pluginsAndControls = [...plugins, ...controls];
    const result = [];
    pluginsAndControls.forEach((element) => {
      if (!IDEE.utils.isUndefined(element.getHelp)) {
        result.push(element.getHelp());
      }
    });
    return result;
  }

  /**
   * Genera el contenido para la página de ayuda
   *
   * @public
   * @function
   * @api
  */
  generateContent(array) {
    let count = -1;
    const generateSubContent = (subContentsArray) => {
      if (!subContentsArray || subContentsArray.length === 0) return '';

      let subContentHTML = '<ol>';
      subContentsArray.forEach(({ title, content, subContents }) => {
        count += 1;
        if (IDEE.utils.isString(content)) {
          this.helpsContent.push(IDEE.utils.stringToHtml(content));
        } else {
          this.helpsContent.push(content);
        }
        subContentHTML += `<li><a class="indexLink" tabindex="${count}" href="#m-help-contents" onclick="showContent('help-element-${count}', event)">${title}</a>${generateSubContent(subContents)}</li>`;
      });
      subContentHTML += '</ol>';
      return subContentHTML;
    };

    let extraContentHTML = '';
    array.forEach(({ title, content, subContents }) => {
      count += 1;
      extraContentHTML += `<li><a class="indexLink" tabindex="${count}" href="#m-help-contents" onclick="showContent('help-element-${count}', event)">${title}</a>`;
      this.helpsContent.push(IDEE.utils.stringToHtml(content));

      if (subContents && subContents.length > 0) {
        extraContentHTML += generateSubContent(subContents);
      }

      extraContentHTML += '</li>';
    });

    return extraContentHTML.replace(/\n/g, '');
  }

  /**
   * Compara dos controles
   *
   * @public
   * @function
   * @param {IDEE.Control} control control para comparar
   * @api
   */
  equals(control) {
    return control instanceof HelpControl;
  }
}
