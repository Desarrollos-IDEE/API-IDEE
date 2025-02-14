/**
 * @module M/control/StoryMapControl
 */

import StoryMapControlImplControl from '../../impl/ol/js/storymapcontrol';
import template from '../../templates/storymap';

// import { getValue } from './i18n/language';

export default class StoryMapControl extends M.Control {
  /**
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(content = {}, delay = 2000, indexInContent = false, isDraggable_ = false) {
    const impl = new StoryMapControlImplControl();
    super(impl, 'StoryMapControl');
    this.content_ = content;
    this.delay = delay;

    this.stepIndex = 0;
    this.indexCap = 0;

    this.indexInContent = indexInContent;

    this.direction = true;

    this.svgArrowScroll = true;
    this.arrowScrollEffect_contador = 1;
    this.panelHTML_ = null;

    this.isDraggable_ = isDraggable_;
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
    this.map_ = map;
    return new Promise((success, fail) => {
      let html = M.template.compileSync(template, {
        vars: {
          title: 'Story Map',
          speed: (this.delay / 1000),
        },
      });

      html = this.createContent(html, this.indexInContent);
      this.scrollEvent(html);
      html = this.createNavPointer(html, this.content_.cap.length);
      html = this.buttonDelay(html);

      map.on('M.evt.COMPLETED', () => {
        this.createPointerSteps(0);
      });

      if (window.innerWidth <= 772) {
        this.handleMovil();
        document.querySelector('.m-plugin-storymap .m-panel-btn')
          .addEventListener('click', this.handleMovil);
      }

      html = this.createPlayPause(html);
      html = this.arrowEvent(html);
      html = this.eventIndex(html);

      this.panelHTML_ = html;

      if (this.isDraggable_) {
        M.utils.draggabillyPlugin(this.getPanel(), '#m-storymap-panel .title');
      }

      success(this.panelHTML_);
    });
  }

  createContent(allhtml, indexInContent) {
    const contentHistory = allhtml.querySelector('#contentStoryMap');
    const { cap } = this.content_;

    if (indexInContent) {
      const index = {
        title: indexInContent.title,
        subtitle: indexInContent.subtitle,
        steps: [{
          html: `${this.createIndex()}<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>`,
          js: indexInContent.js,
        }],
      };
      cap.unshift(index);
    }

    const title = allhtml.querySelector('#title_contentStoryMap');
    title.innerHTML = cap[0].title;

    const subtitle = allhtml.querySelector('#subtitle_contentStoryMap');
    subtitle.innerHTML = cap[0].subtitle;

    let content = '';

    cap.forEach(({ steps }, i) => {
      if (i === 0) {
        content += `<div id=cap${i} style="display: block;" class="chapters">`;
      } else {
        content += `<div id=cap${i} style="display: none;" class="chapters">`;
      }
      steps.forEach(({ html, js }, j) => {
        if (j === 0 && i === 0) {
          content += `<div id="step${j}" class="step" style="display: block;"><br><br>${html}<br><br></div>`;
        } else {
          content += `<div id="step${j}" class="step" style="display: none;"><br><br>${html}<br><br></div>`;
        }
      });
      content += '</div>';
    });
    contentHistory.innerHTML += content;

    // eslint-disable-next-line no-param-reassign
    allhtml.querySelector('#navStep').innerHTML = `<svg id="pointStep0" height="23" width="23" index="0">
    <circle class="pointerEffect" index="0" stroke="#71a7d3" strokeWidth="1" fill="#71a7d3" cx="50%" cy="50%" r="4" />
  </svg>`;

    return allhtml;
  }

  disableCap(indexNextCap, indexCap, positionStep) {
    const divElement = document.querySelector('#contentStoryMap');
    const caps = divElement.querySelectorAll('.chapters');
    const steps = caps[indexNextCap].querySelectorAll('.step');

    caps[indexCap].style = 'display: none';
    caps[indexNextCap].style = 'display: block';

    const step = (positionStep) ? steps[0] : steps[steps.length - 1];

    this.addJSCap(indexNextCap, (positionStep) ? 0 : steps.length - 1);

    step.style = 'display: block';

    step.scroll({
      top: 20,
      behavior: 'smooth',
    });

    this.changeTitleSubtitle(indexNextCap);
  }

  disableStep(numberCap, activate) {
    const cap = document.querySelector(`#cap${numberCap}`);
    cap.querySelectorAll('.step').forEach((step) => {
      // eslint-disable-next-line no-param-reassign
      step.style = 'display: none;';
    });

    const stepActive = cap.querySelector(`#step${activate}`);
    stepActive.style = 'display: block';

    stepActive.scroll({
      top: 20,
      behavior: 'smooth',
    });
  }

  changeTitleSubtitle(indexNextCap) {
    const { cap } = this.content_;
    const title = document.querySelector('#title_contentStoryMap');
    title.innerHTML = cap[indexNextCap].title;

    const subtitle = document.querySelector('#subtitle_contentStoryMap');
    subtitle.innerHTML = cap[indexNextCap].subtitle;
  }

  capIndex(idContainer, idElement) {
    const container = document.querySelector(idContainer);
    const divElement = container.querySelectorAll(idElement);
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const key in divElement) {
      if (divElement[key].style.display === 'block' && !Number.isNaN(key)) {
        const id = divElement[key].id;
        return Number.parseInt(id[id.length - 1], 10);
      }
    }
    return false;
  }

  createNavPointer(html, capLength) {
    const divElement = html.querySelector('#navPointer');
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < capLength; i++) {
      if (i === 0) {
        divElement.innerHTML += `
        <svg id="pointerNav${i}" height="23" width="23" index="${i}">
          <circle class="pointerEffect" index="${i}" stroke="#71a7d3" strokeWidth="1" fill="#71a7d3" cx="50%" cy="50%" r="4" />
        </svg>
        `;
      } else {
        divElement.innerHTML += `
        <svg id="pointerNav${i}" height="23" width="23" index="${i}">
          <circle index="${i}" stroke="#71a7d3" strokeWidth="1" fill="#71a7d3" cx="50%" cy="50%" r="4" />
        </svg>
        `;
      }
    }

    const pointers = html.querySelectorAll('#navPointer > svg');
    pointers.forEach((pointer, i) => {
      if (i !== 0 && i !== 1) {
        pointer.addEventListener('click', ({ target }) => {
          this.resetScroll();
          this.disableCap(target.getAttribute('index'), this.capIndex('#contentStoryMap', '.chapters'), true);
          this.createPointerSteps(target.getAttribute('index'));
          this.effectPointer(target.getAttribute('index'), '#pointerNav', 'navPointer');
          this.effectPointer(0, '#pointStep', 'navStep');
        });
        pointer.children[0].addEventListener('click', ({ target }) => {
          this.resetScroll();
          this.disableCap(target.getAttribute('index'), this.capIndex('#contentStoryMap', '.chapters'), true);
          this.createPointerSteps(target.getAttribute('index'));
          this.effectPointer(target.getAttribute('index'), '#pointerNav', 'navPointer');
          this.effectPointer(0, '#pointStep', 'navStep');
        });
      }
    });

    return html;
  }

  createPointerSteps(indexCap) {
    const { cap } = this.content_;
    const steps = cap[indexCap].steps;

    let stepsPoint = '';

    steps.forEach((s, i) => {
      if (i === 0) {
        stepsPoint += `<svg id="pointStep${i}" height="23" width="23" index="${i}">
        <circle class="pointerEffect" index="${i}" stroke="#71a7d3" strokeWidth="1" fill="#71a7d3" cx="50%" cy="50%" r="4" />
      </svg>`;
      } else {
        stepsPoint += `<svg id="pointStep${i}" height="23" width="23" index="${i}">
        <circle index="${i}" stroke="#71a7d3" strokeWidth="1" fill="#71a7d3" cx="50%" cy="50%" r="4" />
      </svg>`;
      }
    });

    const navStep = document.querySelector('#navStep');
    navStep.innerHTML = stepsPoint;

    navStep.querySelectorAll('svg').forEach((elemt) => {
      elemt.addEventListener('click', ({ target }) => {
        this.disableStep(indexCap, target.getAttribute('index'));
        this.addJSCap(indexCap, target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointStep', 'navStep');
      });
    });
  }

  createPlayPause(html) {
    const play = html.querySelector('#play');
    const pause = html.querySelector('#pause');
    this.idTimeCap = 0;
    this.allIntervalId = [];
    play.addEventListener('click', () => {
      play.style.display = 'none';
      pause.style.display = 'block';
      this.idTimeCap = this.timeCap();
      this.allIntervalId.push(this.idTimeCap);
    });

    pause.addEventListener('click', () => {
      pause.style.display = 'none';
      play.style.display = 'block';
      this.allIntervalId.forEach((id) => {
        clearInterval(id);
      });
    });
    return html;
  }

  resetScroll() {
    document.querySelectorAll('.step').forEach((e) => {
      e.style = 'display: none';
    });
  }

  scrollEvent(html) {
    const navContent = html.querySelectorAll('.chapters');
    navContent.forEach((cap) => {
      cap.querySelectorAll('.step').forEach((step) => {
        step.addEventListener('scroll', ({ target }) => {
          if (this.svgArrowScroll) this.arrowScrollEffect();
          // ***** Delante *****
          // Evitar que ejecute esto cuando es el ultimo capitulo y el ultimo step
          if (Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 1
            && !(navContent[navContent.length - 1].id === cap.id && `step${cap.childElementCount - 1}` === target.id)) {
            target.scroll({ top: 10, behavior: 'auto' });
            // eslint-disable-next-line no-param-reassign
            target.style = 'display: none';
            const idStep = Number(step.id.replace('step', '')) + 1;

            if (cap.querySelectorAll('.step').length - 1 < idStep) {
              const idCap = Number(cap.id.replace('cap', '')) + 1;
              document.querySelector(`#cap${idCap}`).style = 'display: block';
              const siguienteStep = document.querySelector(`#cap${idCap}`).querySelector('#step0');
              siguienteStep.style = 'display: block';

              document.querySelector(`#${cap.id}`).style = 'display: none';
              this.addJSCap(idCap, 0);
              this.effectPointer(idCap, '#pointerNav', 'navPointer');
              this.createPointerSteps(idCap);
              this.effectPointer(0, '#pointStep', 'navStep');
              this.changeTitleSubtitle(idCap);
            } else {
              const siguienteStep = document.querySelector(`#${cap.id}`).querySelector(`#step${idStep}`);
              const idCap = Number(cap.id.replace('cap', ''));
              siguienteStep.style = 'display: block';
              siguienteStep.scrollTop = 1;
              this.addJSCap(idCap, idStep);
              this.effectPointer(idStep, '#pointStep', 'navStep');
            }
            // ***** Atras *****
          } else if (target.scrollTop === 0 && !(cap.id === 'cap0' && target.id === 'step0')) {
            const idStep = Number(step.id.replace('step', '')) - 1;
            target.scroll({ top: 10, behavior: 'auto' });
            // eslint-disable-next-line no-param-reassign
            target.style = 'display: none';

            if (idStep < 0) {
              const idCap = Number(cap.id.replace('cap', '')) - 1;
              const capNext = document.querySelector(`#cap${idCap}`);
              capNext.style = 'display: block';

              const siguienteStep = document.querySelector(`#cap${idCap}`).querySelector(`#step${capNext.childElementCount - 1}`);
              siguienteStep.style = 'display: block';
              siguienteStep.scrollTop = 10;

              document.querySelector(`#${cap.id}`).style = 'display: none';
              this.addJSCap(idCap, capNext.childElementCount - 1);
              this.effectPointer(idCap, '#pointerNav', 'navPointer');
              this.createPointerSteps(idCap);
              this.changeTitleSubtitle(idCap);
              this.effectPointer(capNext.childElementCount - 1, '#pointStep', 'navStep');
            } else {
              const idCap = Number(cap.id.replace('cap', ''));
              const siguienteStep = document.querySelector(`#${cap.id}`).querySelector(`#step${idStep}`);
              siguienteStep.style = 'display: block';
              siguienteStep.scrollTop = 10;
              this.addJSCap(idCap, idStep);
              this.effectPointer(idStep, '#pointStep', 'navStep');
            }
          }
        });
      });
    });

    return html;
  }

  addJSCap(indexCap, indexStep) {
    try {
      if (document.querySelector('#storyMap_jsCap')) document.body.removeChild(document.querySelector('#storyMap_jsCap'));
      const newScript = document.createElement('script');
      newScript.id = 'storyMap_jsCap';

      const inlineScript = document.createTextNode(`{${this.content_.cap[indexCap].steps[indexStep].js}}`);
      newScript.appendChild(inlineScript);
      document.body.appendChild(newScript);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Comprueba que has introducido correctamente el script, respetando ";" y llamando a map o mapjs');
    }
  }

  timeCap() {
    const id = setInterval(() => {
      const idStep = this.capIndex(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`, '.step');
      const div = document.querySelector(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`);
      const step = div.querySelector(`#step${idStep}`);
      const lenghtCap = this.content_.cap.length - 1;
      const lengthStep = this.content_.cap[this.content_.cap.length - 1].steps.length - 1;
      if (`#cap${this.capIndex('#contentStoryMap', '.chapters')}` !== `#cap${lenghtCap}`
        || `#step${idStep}` !== `#step${lengthStep}`) {
        step.scroll({ top: step.scrollHeight + 10, behavior: 'smooth' });
      }
    }, (document.querySelector('#buttonDelay').getAttribute('speed') * 1000));

    return id;
  }

  arrowScrollEffect() {
    setTimeout(() => {
      this.arrowScrollEffect_contador -= 0.1;
      document.querySelector('.arrowScroll').style = `opacity: ${this.arrowScrollEffect_contador}`;
      if (this.arrowScrollEffect_contador >= 0) this.arrowScrollEffect();
    }, 150);

    this.svgArrowScroll = !this.svgArrowScroll;
  }

  arrowEvent(html) {
    html.querySelector('.arrowScroll').addEventListener('mouseover', (e) => {
      document.querySelector('#cap0').querySelector('#step0').scroll({ top: 70, behavior: 'smooth' });
    });
    return html;
  }

  effectPointer(indexNext, typeNapID, container) {
    document.querySelector(`.${container} .pointerEffect`).classList.remove('pointerEffect');
    document.querySelector(`${typeNapID}${indexNext} > circle`).classList.add('pointerEffect');
  }

  createIndex() {
    const { cap } = this.content_;

    let index = '';

    cap.forEach(({ title = '', subtitle = '' }, i) => {
      index += `<li index="${i + 1}">${title}. ${subtitle}</li>`;
    });

    index = `<ol id='indexContent'>${index}</ol>`;

    return index;
  }

  eventIndex(html) {
    html.querySelectorAll('#indexContent > li').forEach((li, i) => {
      li.addEventListener('click', ({ target }) => {
        this.resetScroll();
        this.disableCap(target.getAttribute('index'), this.capIndex('#contentStoryMap', '.chapters'), true);
        this.createPointerSteps(target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointerNav', 'navPointer');
      });
    });
    return html;
  }

  buttonDelay(html) {
    const speed = [
      { text: '0.5x', value: 0 },
      { text: '1x', value: 1 },
      { text: '2x', value: 2 },
      { text: '3x', value: 3 },
      { text: '5x', value: 5 },
    ];
    let position = 0;
    html.querySelector('#buttonDelay').addEventListener('click', ({ target }) => {
      this.allIntervalId.forEach((id) => {
        clearInterval(id);
      });

      position = (position >= speed.length - 1) ? 0 : position + 1;
      if (position !== 0) {
        // eslint-disable-next-line no-param-reassign
        target.style = 'width: 23px';
        target.setAttribute('speed', (this.delay / 1000) / speed[position].value);
        document.querySelector('#navStep').style = 'margin-left: 5px;';
      } else {
        target.setAttribute('speed', (this.delay / 1000) * (speed[position].value + 1.5));
        // eslint-disable-next-line no-param-reassign
        target.style = 'width: 40px;';
        document.querySelector('#navStep').style = 'margin-left: -15px;';
      }

      // eslint-disable-next-line no-param-reassign
      target.innerHTML = speed[position].text;

      const play = html.querySelector('#play');
      const pause = html.querySelector('#pause');

      play.style.display = 'none';
      pause.style.display = 'block';

      const id = setInterval(() => {
        const displayLast = document.querySelector(`#cap${this.content_.cap.length - 1}`)
          .lastChild.style.display;
        const idStep = this.capIndex(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`, '.step');
        const div = document.querySelector(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`);
        const step = div.querySelector(`#step${idStep}`);
        const lenghtCap = this.content_.cap.length - 1;
        const lengthStep = this.content_.cap[this.content_.cap.length - 1].steps.length - 1;
        if (`#cap${this.capIndex('#contentStoryMap', '.chapters')}` !== `#cap${lenghtCap}`
          || `#step${idStep}` !== `#step${lengthStep}`) {
          step.scroll({ top: step.scrollHeight + 10, behavior: 'smooth' });
          // step.scrollTop = 9999999999;
        }

        if (displayLast === 'block') {
          play.style.display = 'block';
          pause.style.display = 'none';
          clearInterval(id);
        }
      }, (target.getAttribute('speed') * 1000));
      this.allIntervalId.push(id);
    });
    return html;
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
    return html.querySelector('.m-storymap button');
  }

  handleMovil() {
    if (document.querySelector('.m-plugin-storymap.opened')) {
      document.querySelectorAll('.m-panel').forEach((p) => {
        if (!p.classList.contains('m-plugin-storymap')) {
          // eslint-disable-next-line no-param-reassign
          p.style.display = 'none';
        }
      });
    } else {
      document.querySelectorAll('.m-panel').forEach((p) => {
        if (!p.classList.contains('m-plugin-storymap')) {
        // eslint-disable-next-line no-param-reassign
          p.style.display = 'block';
        }
      });
    }
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
    return control instanceof StoryMapControl;
  }
}
