require('../../configuration_filtered');
const { TextDecoder, TextEncoder } = require('util');

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
if (typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = () => {
    return 'blob:dummy';
  };
}
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.WebGLRenderingContext = jest.fn();
global.WebGL2RenderingContext = jest.fn();

if (!document.getElementById('map')) {
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map';
  document.body.appendChild(mapDiv);
}
