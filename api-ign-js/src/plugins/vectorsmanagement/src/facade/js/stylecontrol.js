/**
 * @module M/control/StyleControl
 */
import StyleImplControl from '../../impl/ol/js/stylecontrol';
import template from '../../templates/style';
import { getValue } from './i18n/language';

export default class StyleControl extends M.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor(map, managementControl) {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(StyleImplControl)) {
      M.exception(getValue('exception'));
    }

    // 2. implementation of this control
    const impl = new StyleImplControl();
    super(impl, 'Style');
    impl.facadeControl = this;

    this.map_ = map;

    /**
     * vectorsmanagementcontrol to comunicate with others controls
     */
    this.managementControl_ = managementControl;

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;

    /**
     * Selected layer
     */
    this.layer_ = null;
  }

  /**
   * This functions active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.template = M.template.compileSync(template, {
      vars: {
        translations: {
          styleColor: getValue('styleColor'),
          styleThickness: getValue('styleThickness'),
          styleFont: getValue('styleFont'),
          styleSize: getValue('styleSize'),
          creationText: getValue('creationText'),
          opacity: getValue('opacity'),
          radius: getValue('radius'),
          style_options: getValue('style_options'),
          apply_style: getValue('apply_style'),
          fill: getValue('fill'),
          stroke: getValue('stroke'),
          opts_point: getValue('opts_point'),
        },
      },
    });
    html.querySelector('#m-vectorsmanagement-controls').appendChild(this.template);

    this.refreshStyle();
    this.addEvents();
    this.managementControl_.accessibilityTab(this.template);
  }

  /**
   * This functions refresh style of template
   *
   * @public
   * @function
   * @api
   */
  refreshStyle() {
    const selection = this.managementControl_.getSelection();
    if (selection === 'layer') {
      this.showLayerStyle();
    } else if (selection === 'feature') {
      this.showFeatureStyle();
    }
  }

  /**
   * This function adds events to template.
   * @public
   * @function
   * @api
   */
  addEvents() {
    this.template.querySelector('#options').addEventListener('click', () => this.toggleContent());
    this.template.querySelector('#options').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.toggleContent();
      }
    });
    this.template.querySelector('#set-style-btn').addEventListener('click', () => this.applyStyle());
  }

  /**
   * This function show/hide styles sections
   * @public
   * @function
   * @param {String} type style type (point/line/polygon)
   * @api
   */
  toggleContent() {
    const elem = this.template.querySelector('.content');
    const span = this.template.querySelector('#options').children[0];
    if (elem.classList.contains('closed')) {
      elem.classList.remove('closed');
      span.classList.remove('g-cartografia-flecha-abajo');
      span.classList.add('g-cartografia-flecha-arriba');
    } else {
      elem.classList.add('closed');
      span.classList.remove('g-cartografia-flecha-arriba');
      span.classList.add('g-cartografia-flecha-abajo');
    }
  }

  /**
   * This function show layer style on template
   * @public
   * @function
   * @api
   */
  showLayerStyle() {
    const style = this.layer_.getStyle();
    let options = {};
    if (style) {
      options = style.getOptions();
    }
    this.showStyle(options);
  }

  /**
   * This function show feature style on template
   * @public
   * @function
   * @api
   */
  showFeatureStyle() {
    const selectedFeatures = this.managementControl_.getSelectedFeatures();
    if (selectedFeatures.length > 0) {
      const options = {};
      for (let i = 0; i < selectedFeatures.length; i += 1) {
        const feature = selectedFeatures[i];
        const style = feature.getStyle();
        if (style && style.getOptions()) {
          if ((feature.getGeometry().type === 'Point' || feature.getGeometry().type === 'MultiPoint') && !options.point) {
            options.point = style.getOptions();
          } else if ((feature.getGeometry().type === 'LineString' || feature.getGeometry().type === 'MultiLineString') && !options.line) {
            options.line = style.getOptions();
          } else if ((feature.getGeometry().type === 'Polygon' || feature.getGeometry().type === 'MultiPolygon') && !options.polygon) {
            options.polygon = style.getOptions();
          }
        }
      }
      if (options.point || options.line || options.polygon) {
        this.showStyle(options);
      } else {
        this.showLayerStyle();
      }
    } else {
      M.dialog.info(getValue('exception.featuresel'));
    }
  }

  /**
   * This function show style on template
   * @public
   * @function
   * @param {Object} styleOptions
   * @api
   */
  showStyle(styleOptions) {
    if (styleOptions) {
      // TO-DO ¿?
      this.setStyle(styleOptions.point);
      this.setStyle(styleOptions.line);
      this.setStyle(styleOptions.polygon);
    }
    this.template.classList.remove('closed');
  }

  rgbaToHex(rgbaColor) {
    // Extraer los valores de RGBA usando expresiones regulares
    const rgbaValues = rgbaColor.match(/(\d+(\.\d+)?)/g);

    // Convertir los valores a enteros
    const r = Number.parseInt(rgbaValues[0], 10);
    const g = Number.parseInt(rgbaValues[1], 10);
    const b = Number.parseInt(rgbaValues[2], 10);

    // Convertir a hexadecimal y combinar los componentes de color
    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return hexColor.toUpperCase();
  }

  /**
   * This function set style inputs value
   * @public
   * @function
   * @param {Object} options style options
   * @param {String} type style type (point/line/polygon)
   * @api
   */
  setStyle(options, type) {
    if (options) {
      // Relleno
      const colorInputFill = this.template.querySelector('#colorSelectorFill');
      const opacityInput = this.template.querySelector('#opacity');
      if (colorInputFill) {
        if (options.fill.opacity) {
          opacityInput.value = options.fill.opacity;
        } else {
          opacityInput.value = 0.4;
        }

        if (options.fill.color) {
          const color = options.fill.color.indexOf('rgba') >= 0;
          colorInputFill.value = color
            ? this.rgbaToHex(options.fill.color)
            : options.fill.color; // TO-DO VALORES RGBA
        }
      }

      // Borde
      const colorInputStoke = this.template.querySelector('#colorSelector');
      if (options.stroke && options.stroke.color && colorInputStoke) {
        colorInputStoke.value = options.stroke.color;
      }

      const widthInput = this.template.querySelector('#thicknessSelector');

      if (options.stroke && options.stroke.width && widthInput) {
        widthInput.value = options.stroke.width;
      }

      const opacityStroke = this.template.querySelector('#opacityStroke');

      if (options.stroke && options.stroke.opacity && opacityStroke) {
        opacityStroke.value = options.stroke.opacity;
      }

      // Fuente
      const textInput = this.template.querySelector('#textContent');
      const fontInput = this.template.querySelector('#fontFamily');
      const fontSizeInput = this.template.querySelector('#fontSize');
      const colorSelectorText = this.template.querySelector('#colorSelector-text');

      if (options.label && options.label.text) {
        textInput.value = options.label.text;
      } else {
        textInput.value = '';
      }
      if (options.label && options.label.font) {
        const font = options.label.font.split(' ');
        if (font.length === 2) {
          fontSizeInput.value = Number.parseInt(font[0].replace('px', ''), 10);
          fontInput.value = font[1];
        } else {
          fontSizeInput.value = 12;
          fontInput.value = options.label.font;
        }

        if (options.label.color) {
          colorSelectorText.value = options.label.color;
        }
      } else {
        fontSizeInput.value = 12;
        fontInput.value = 'Arial';
      }

      // Opciones de puntos
      const radiusInput = this.template.querySelector('#radiusSelector-point');

      if (radiusInput) {
        if (options.radius) {
          radiusInput.value = options.radius;
        } else {
          radiusInput.value = 5;
        }
      }
    }
  }

  /**
   * This function applies style to layer or features
   * @public
   * @function
   * @api
   */
  applyStyle() {
    const styleOpts = this.getStyle();
    const options = {
      point: styleOpts,
      line: styleOpts,
      polygon: styleOpts,
    };
    const selection = this.managementControl_.getSelection();
    if (selection === 'layer') {
      this.layer_.setStyle(new M.style.Generic(options));
    } else if (selection === 'feature') {
      const features = this.managementControl_.getSelectedFeatures();
      features.forEach((f) => {
        let style;
        const geometryType = f.getGeometry().type;
        switch (geometryType) {
          case 'Point':
          case 'MultiPoint':
            style = new M.style.Point(options.point);
            break;
          case 'LineString':
          case 'MultiLineString':
            style = new M.style.Line(options.line);
            break;
          case 'Polygon':
          case 'MultiPolygon':
            style = new M.style.Polygon(options.polygon);
            break;
          default:
            break;
        }
        if (style) {
          f.setStyle(style);
        }
      });
    }
  }

  /**
   * This function gets style options from template inputs
   * @public
   * @function
   * @param {String} type style type (point/line/polygon)
   * @api
   */
  getStyle() {
    const options = {
      stroke: {},
      fill: {},
    };

    // Relleno
    const colorInputFill = this.template.querySelector('#colorSelectorFill');

    if (colorInputFill) {
      options.fill.color = colorInputFill.value;
    }

    const opacityInput = this.template.querySelector('#opacity');

    if (opacityInput) {
      options.fill.opacity = opacityInput.value;
    }

    // Borde
    const colorInputStoke = this.template.querySelector('#colorSelector');
    if (colorInputStoke) {
      options.stroke.color = colorInputStoke.value;
    }

    const widthInput = this.template.querySelector('#thicknessSelector');

    if (widthInput) {
      options.stroke.width = widthInput.value;
    }

    const opacityStroke = this.template.querySelector('#opacityStroke');

    if (opacityStroke) {
      options.stroke.opacity = opacityStroke.value;
    }

    // Fuente
    const fontInput = this.template.querySelector('#fontFamily');
    const textInput = this.template.querySelector('#textContent');
    const fontSizeInput = this.template.querySelector('#fontSize');
    const colorSelectorText = this.template.querySelector('#colorSelector-text');

    if (textInput && textInput.value) {
      options.label = {};
      options.label.text = textInput.value;
      if (fontInput && fontSizeInput) {
        options.label.font = `${fontSizeInput.value}px ${fontInput.value}`;
      }

      if (colorSelectorText) {
        options.label.color = colorSelectorText.value;
      }
    }

    // Opciones de puntos:
    const radiusInput = this.template.querySelector('#radiusSelector-point');
    if (radiusInput) {
      options.radius = radiusInput.value;
    }
    return options;
  }

  /**
   * Sets the layer selected for management
   * @public
   * @function
   * @api
   * @param {M.layer} layer
   */
  setLayer(layer) {
    this.layer_ = layer;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {}

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.template.remove();
    // this.getImpl().removeSelectInteraction();
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
    // eslint-disable-next-line no-undef
    return control instanceof EditionControl;
  }
}
