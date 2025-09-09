/* eslint-disable no-restricted-syntax,guard-for-in */
// eslint-disable-next-line
export class ColorPickerPolyfill {
  static apply(window) {
    const document = window.document;
    const nativeColorPicker = {
      // initialized flag
      started: false,

      // start color
      color: '#000000',

      // inputs where plugin was initialized
      inputs: {},

      // flag to know if color input is supported
      hasNativeColorSupport: false,

      // inits the plugin on specified input
      init: (inputId) => {
        // start the plugin
        this.start();

        if (this.hasNativeColorSupport) {
          return;
        }

        if (typeof inputId !== 'string') {
          throw new Error('inputId have to be a string id selector');
        }

        // set the input
        this.input = (this.inputs[inputId])
          || document.getElementById(inputId);

        if (!this.input) {
          throw new Error(`There was no input found with id: "${inputId}"`);
        }

        // input defaults
        this.input.value = this.color;
        this.input.unselectable = 'on';
        this.css(this.input, {
          backgroundColor: this.color,
          borderWidth: '0.4em 0.3em',
          width: '3em',
          cursor: 'default',
        });

        // register input event
        this.input.onfocus = () => {
          nativeColorPicker.onFocus(this.id);
        };
      },

      // initialize once
      start: () => {
        // is already started
        if (this.started) {
          return;
        }

        // test if browser has native support for color input
        try {
          this.hasNativeColorSupport = !!(document.createElement('input').type = 'color');
        } catch (e) {
          // continue regardless of error
        }

        // no native support...
        if (!this.hasNativeColorSupport) {
          // create object element
          const objectElement = document.createElement('object');
          objectElement.classid = 'clsid:3050f819-98b5-11cf-bb82-00aa00bdce0b';
          // set attributes
          objectElement.id = 'colorHelperObj';
          this.css(objectElement, {
            width: '0',
            height: '0',
          });
          document.body.appendChild(objectElement);
        }
        // mark as started
        this.started = true;
      },

      // destroys the plugin
      destroy: (inputId) => {
        let i;
        // destroy one input or all the plugin if no input id
        if (typeof inputId === 'string') {
          this.off(this.inputs[inputId]);
        } else {
          // remove helper object
          document.body.removeChild(document.getElementById('colorHelperObj'));
          // remove input events and styles
          for (i in this.inputs) {
            this.off(this.inputs[i]);
          }
          // mark not started
          this.started = false;
        }
      },

      off: (input) => {
        // eslint-disable-next-line no-param-reassign
        input.onfocus = null;
        this.css(input, {
          backgroundColor: '',
          borderWidth: '',
          width: '',
          cursor: '',
        });
      },

      // input focus function
      onFocus: (inputId) => {
        this.input = this.inputs[inputId];
        this.color = this.getColor();
        this.input.value = this.color;
        nativeColorPicker.css(this.input, {
          backgroundColor: this.color,
          color: this.color,
        });
        this.input.blur();
      },

      // gets the color from the object
      // and normalize it
      getColor: () => {
        // get decimal color, (passing the previous one)
        // and change to hex
        const colorHelperObj = document.getElementById('colorHelperObj');
        let hex = colorHelperObj.ChooseColorDlg(this.color.replace(/#/, '')).toString(16);

        // add extra zeroes if hex number is less than 6 digits
        if (hex.length < 6) {
          const tmpstr = '000000'.substring(0, 6 - hex.length);
          hex = tmpstr.concat(hex);
        }

        return `# ${hex}`;
      },

      // set css properties
      css: (el, props) => {
        for (const prop in props) {
          // eslint-disable-next-line no-param-reassign
          el.style[prop] = props[prop];
        }
      },
    };

    // expose to global
    // eslint-disable-next-line no-param-reassign
    window.nativeColorPicker = nativeColorPicker;
  }
}
