/**
 * @module M/control/ZoomPanelControl
 */
import ZoomPanelImplControl from 'impl/zoompanelcontrol';
import template from 'templates/zoompanel';
import { getValue } from './i18n/language';

export default class ZoomPanelControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api
   */
  constructor(options) {
    const impl = new ZoomPanelImplControl(options.projection);
    super(impl, 'ZoomPanel');

    this.facadeMap_ = null;

    this.completed_ = false;

    this.load_ = false;

    this.center_ = options.center;

    this.zoom_ = options.zoom;

    this.activeExtent_ = this.center_ !== undefined && this.zoom_ !== undefined;

    this.order = (options.order) ? options.order : null;
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
    // eslint-disable-next-line
    console.warn(getValue('zoompanel_obsolete'));
    this.facadeMap_ = map;
    this.addOnLoadEvents();
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        vars: {
          activeExtent: this.activeExtent_,
          translations: {
            zoomin: getValue('zoomin'),
            zoomout: getValue('zoomout'),
            previouszoom: getValue('previouszoom'),
            nextzoom: getValue('nextzoom'),
            rectzoom: getValue('rectzoom'),
            zoom_extent: getValue('zoom_extent'),
          },
        },
      });

      this.accessibilityTab(html);

      const zoomInBtn = html.querySelector('button#zoomIn');
      const zoomOutBtn = html.querySelector('button#zoomOut');
      html.querySelector('button#historyprevious').addEventListener('click', this.previousStep_.bind(this));
      html.querySelector('button#historynext').addEventListener('click', this.nextStep_.bind(this));
      if (this.activeExtent_) {
        html.querySelector('button#zoomExtend').addEventListener('click', this.zoomToExtend_.bind(this));
      }

      zoomInBtn.addEventListener('click', () => {
        this.facadeMap_.setZoom(this.facadeMap_.getZoom() + 1);
        this.registerViewEvents_();
      });

      zoomOutBtn.addEventListener('click', () => {
        this.facadeMap_.setZoom(this.facadeMap_.getZoom() - 1);
        this.registerViewEvents_();
      });

      document.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape') {
          const elem = document.querySelector('.m-panel.m-zoompanel.opened');
          if (elem !== null) {
            elem.querySelector('button.m-panel-btn').click();
          }
        }
      });

      success(html);
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
    this.invokeEscKey();
    super.activate();
    document.getElementById('zoomToBox').classList.add('active');
    this.getImpl().activateClick(this.map_);
    document.body.style.cursor = 'url(\'https://i.ibb.co/bPGFbVm/crosshair-zoom.png\') 9 13, auto';
    document.addEventListener('keyup', this.checkEscKey.bind(this));
  }

  checkEscKey(evt) {
    if (evt.key === 'Escape') {
      this.deactivate();
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
   * @api
   */
  deactivate() {
    super.deactivate();
    document.body.style.cursor = 'default';
    document.getElementById('zoomToBox').classList.remove('active');
    this.getImpl().deactivateClick(this.map_);
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
    return html.querySelector('button#zoomToBox');
  }

  /**
   * Adds event listeners to control and map
   * @public
   * @function
   * @api
   */
  addOnLoadEvents() {
    this.on(M.evt.ADDED_TO_MAP, () => {
      this.load_ = true;
      if (this.completed_ && this.load_) {
        this.registerViewEvents_();
      }
    });

    this.facadeMap_.on(M.evt.COMPLETED, () => {
      this.completed_ = true;
      if (this.completed_ && this.load_) {
        this.registerViewEvents_();
      }
    });
  }

  /**
   * This function registers view events on map
   *
   * @function
   * @private
   */
  registerViewEvents_() {
    this.getImpl().registerViewEvents();
  }

  /**
   * This function shows the next zoom change to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  nextStep_(evt) {
    evt.preventDefault();
    this.getImpl().nextStep();
  }

  /**
   * This function shows the previous zoom change to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  previousStep_(evt) {
    evt.preventDefault();
    this.getImpl().previousStep();
  }

  /**
   * This function sets de predefined zoom to the map
   *
   * @private
   * @function
   * @param {Event} evt - Event
   */
  zoomToExtend_() {
    this.facadeMap_.setCenter(this.center_);
    this.facadeMap_.setZoom(this.zoom_);
  }

  /**
   * @public
   * @function
   * @api
   */
  activateZoom(type, btn) {
    this.activeGeometry = type;
    this.getImpl().activate(type, btn);
  }

  /**
   * @public
   * @function
   * @api
   */
  deactivateZoom(listBtn) {
    this.activeGeometry = '';
    this.getImpl().deactivate(listBtn);
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
    return control instanceof ZoomPanelControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
