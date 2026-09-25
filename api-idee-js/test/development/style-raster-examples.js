/**
 * Test de desarrollo: ejemplos sencillos de IDEE.style.Raster
 *
 * Cada entrada de EXAMPLES es un caso independiente (filtros, monobanda,
 * fórmulas espectrales, etc.) con título, explicación y opciones del estilo.
 *
 * Abrir: test/development/style-raster-examples.html
 */
import { map as Mmap } from 'IDEE/api-idee';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
import Raster from 'IDEE/style/Raster';

const RAMP_DEFAULT = ['#000080', '#0000ff', '#00ff00', '#ffff00', '#ff0000'];
const RAMP_DEFAULT_2 = ['#000080', '#ff0000'];
const RAMP_NDVI = [
  '#8c2d04', // -1: sin vegetación / agua / suelo
  '#d95f0e', // -0.5: suelo seco
  '#f7f7b9', //  0: transición
  '#78c679', //  0.5: vegetación
  '#006837', //  1: vegetación muy densa
];

const RAMP_NDWI = [
  '#8c510a', // -1: suelo / vegetación
  '#d8b365', // -0.5: superficie seca
  '#f5f5f5', //  0: transición
  '#67a9cf', //  0.5: agua probable
  '#2166ac', //  1: agua clara
];

const RAMP_NBR = [
  '#d73027', // -1: valor muy bajo / posible zona quemada
  '#fdae61', // -0.5: valor bajo
  '#ffffbf', //  0: transición
  '#a6d96a', //  0.5: vegetación
  '#1a9850', //  1: vegetación sana
];

/**
 * Catálogo de ejemplos. Cada uno se aplica solo (no se mezclan entre sí).
 * @type {Object<string, {title: string, description: string, options: Object|null}>}
 */
const EXAMPLES = {
  none: {
    title: 'Sin estilo',
    description: [
      'Quita cualquier IDEE.style.Raster de la capa (clearStyle).',
      'La imagen se ve con el render por defecto de OpenLayers / WebGLTile.',
    ].join('\n'),
    options: null,
  },

  // ---------- Filtros (cada uno por separado) ----------
  saturation: {
    title: 'Filtro: saturación',
    description: [
      'saturation: controla la intensidad del color (-1 a 1).',
      '  0  = sin cambio',
      ' -1  = escala de grises',
      '  1  = saturación máxima',
      '',
      'Aquí: saturation: -1 → imagen en grises.',
    ].join('\n'),
    options: {
      saturation: -1,
    },
  },

  gamma: {
    title: 'Filtro: gamma',
    description: [
      'gamma: corrige el brillo perceptual (por defecto 1).',
      '  < 1 → aclara tonos medios',
      '  > 1 → oscurece tonos medios',
      '',
      'Aquí: gamma: 0.6 → imagen más clara.',
    ].join('\n'),
    options: {
      gamma: 0.6,
    },
  },

  brightness: {
    title: 'Filtro: brillo',
    description: [
      'brightness: desplaza el brillo global (-1 a 1).',
      '  > 0 → más luminosa',
      '  < 0 → más oscura',
      '',
      'Aquí: brightness: 0.35',
    ].join('\n'),
    options: {
      brightness: 0.35,
    },
  },

  contrast: {
    title: 'Filtro: contraste',
    description: [
      'contrast: separa más o menos luces y sombras (-1 a 1).',
      '  > 0 → más contraste',
      '  < 0 → imagen más «plana»',
      '',
      'Aquí: contrast: 0.4',
    ].join('\n'),
    options: {
      contrast: 0.4,
    },
  },

  exposure: {
    title: 'Filtro: exposición',
    description: [
      'exposure: simula abrir/cerrar el diafragma (-1 a 1).',
      '  > 0 → sobreexpuesta (más clara)',
      '  < 0 → subexpuesta (más oscura)',
      '',
      'Aquí: exposure: 0.3',
    ].join('\n'),
    options: {
      exposure: 0.3,
    },
  },

  'filters-all': {
    title: 'Filtros combinados',
    description: [
      'Se pueden combinar varios filtros en el mismo estilo.',
      'No usan rampa: solo ajustan el aspecto de la imagen.',
      '',
      'Aquí: gamma + saturation + brightness + contrast + exposure.',
    ].join('\n'),
    options: {
      gamma: 0.8,
      saturation: -0.4,
      brightness: 0.1,
      contrast: 0.2,
      exposure: 0.1,
    },
  },

  // ---------- Color y rampa ----------
  monoband: {
    title: 'Monobanda + rampa',
    description: [
      'Caso típico de MDT / DEM / una sola banda:',
      '  bands: 1  → se lee el valor de la banda 1',
      '  min / max → rango que se mapea a la rampa',
      '  ramp      → colores de bajo a alto',
      '',
      'Con normalize: true en la capa, min/max suelen ser 0 y 1.',
      'Sin normalizar (MDT real), pondrías p. ej. min: 0, max: 2000.',
    ].join('\n'),
    options: {
      bands: 1,
      min: 0,
      max: 1,
      ramp: RAMP_DEFAULT,
    },
  },

  'bands-mean': {
    title: 'Media de bandas + rampa',
    description: [
      'Si bands es un array de 2 o más bandas (sin formula),',
      'Raster calcula la MEDIA aritmética y colorea ese valor.',
      '',
      '  bands: [1, 2, 3] → (b1 + b2 + b3) / 3',
      '',
      'No es composición RGB: es un escalar → rampa.',
      'Para RGB visual usa las bandas de la capa y filtros, o sin rampa.',
    ].join('\n'),
    options: {
      bands: [1, 2, 3],
      min: 0,
      max: 1,
      ramp: RAMP_DEFAULT,
    },
  },

  interpolation: {
    title: 'Interpolación exponencial',
    description: [
      'Con rampa, interpolation define cómo se reparten los colores:',
      '  \'linear\'      → intervalos iguales (por defecto)',
      '  \'exponential\' → usa interpolationBase (p. ej. 2)',
      '',
      'Útil cuando los valores se concentran en un extremo del rango.',
    ].join('\n'),
    options: {
      bands: 1,
      min: 0,
      max: 1,
      ramp: RAMP_DEFAULT_2,
      interpolation: 'exponential',
      interpolationBase: 2,
    },
  },

  nodata: {
    title: 'Nodata + rampa',
    description: [
      'nodata: valor que se pinta transparente (alpha 0).',
      'Conviene repetirlo en opciones de capa y de estilo.',
      '',
      'Aquí: nodata: 0 con rampa monobanda.',
      'Los píxeles con valor 0 no se ven.',
    ].join('\n'),
    options: {
      bands: 1,
      min: 0,
      max: 1,
      nodata: 1,
      ramp: RAMP_DEFAULT,
    },
  },

  // ---------- Índices espectrales ----------
  // Demo aproximada: el TCI no tiene bandas NIR/SWIR reales
  ndvi: {
    title: 'NDVI (vegetación)',
    description: [
      'Índice espectral: (NIR − Rojo) / (NIR + Rojo).',
      '  formula: \'ndvi\'',
      '  bands: [nir, red]  → exactamente 2 bandas',
      '  min/max por defecto: -1 / 1',
      '',
      'La rampa colorea el resultado del índice (no la media).',
      'Demo en TCI RGB: bands [2, 1] (aprox. G≈NIR, R≈rojo).',
    ].join('\n'),
    options: {
      formula: 'ndvi',
      bands: [2, 1],
      min: -1,
      max: 1,
      ramp: RAMP_NDVI,
      // nodata: 0,
    },
  },

  ndwi: {
    title: 'NDWI (agua / humedad)',
    description: [
      'Índice espectral: (Verde − NIR) / (Verde + NIR).',
      '  formula: \'ndwi\'',
      '  bands: [green, nir]  → exactamente 2 bandas',
      '  min/max por defecto: -1 / 1',
      '',
      'Resalta agua y humedad superficial.',
      'Demo en TCI RGB: bands [2, 3].',
    ].join('\n'),
    options: {
      formula: 'ndwi',
      bands: [2, 3],
      min: -1,
      max: 1,
      ramp: RAMP_NDWI,
      // nodata: 0,
    },
  },

  nbr: {
    title: 'NBR (quemas)',
    description: [
      'Índice espectral: (NIR − SWIR) / (NIR + SWIR).',
      '  formula: \'nbr\'',
      '  bands: [nir, swir]  → exactamente 2 bandas',
      '  min/max por defecto: -1 / 1',
      '',
      'Resalta áreas quemadas / severidad de incendio.',
      'Demo en TCI RGB: bands [1, 3] (sin SWIR real).',
    ].join('\n'),
    options: {
      formula: 'nbr',
      bands: [1, 3],
      min: -1,
      max: 1,
      ramp: RAMP_NBR,
      // nodata: 0,
    },
  },
};

const mapjs = Mmap({
  container: 'map',
  bbox: [
    3226511.5398818217,
    1735204.4920150614,
    4207995.393869615,
    2056231.5025902353,
  ],
});

const layerGeoTIFF = new GeoTIFF({
  url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
  name: 'Sentinel TCI',
  legend: 'Ejemplos Raster',
}, {
  convertToRGB: false,
  normalize: true,
  nodata: 0,
});

mapjs.addLayers(layerGeoTIFF);

window.mapjs = mapjs;
window.layer = layerGeoTIFF;
window.Raster = Raster;
window.EXAMPLES = EXAMPLES;

/**
 * Formatea las opciones del estilo para mostrarlas en el panel.
 * @param {Object|null} options Opciones del ejemplo.
 * @returns {string} Texto legible.
 */
function formatOptions(options) {
  if (options === null) {
    return 'layer.clearStyle();';
  }
  return `new IDEE.style.Raster(${JSON.stringify(options, null, 2)})`;
}

/**
 * Actualiza la caja de descripción del panel.
 * @param {string} exampleId Identificador del ejemplo.
 */
function updateDescription(exampleId) {
  const example = EXAMPLES[exampleId];
  const descriptionEl = document.getElementById('description');
  if (!example || !descriptionEl) {
    return;
  }
  descriptionEl.innerHTML = '';
  const titleEl = document.createElement('strong');
  titleEl.textContent = example.title;
  descriptionEl.appendChild(titleEl);
  const textEl = document.createElement('div');
  textEl.textContent = `${example.description}\n\n${formatOptions(example.options)}`;
  descriptionEl.appendChild(textEl);
}

/**
 * Actualiza la imagen de leyenda si el estilo tiene rampa.
 */
function updateLegend() {
  const legendEl = document.getElementById('legend');
  const legendImg = document.getElementById('legend-img');
  if (!legendEl || !legendImg) {
    return;
  }
  const style = layerGeoTIFF.getStyle();
  let hasRamp = false;
  if (style instanceof Raster) {
    hasRamp = Raster.hasRamp(style.getOptions(), true);
  }
  if (!hasRamp) {
    legendEl.classList.add('hidden');
    legendImg.removeAttribute('src');
    return;
  }
  legendImg.src = layerGeoTIFF.getLegendURL();
  legendEl.classList.remove('hidden');
}

/**
 * Marca el botón activo en el panel.
 * @param {string} exampleId Identificador del ejemplo.
 */
function setActiveButton(exampleId) {
  const buttons = document.querySelectorAll('#examples-panel button[data-example]');
  buttons.forEach((button) => {
    if (button.getAttribute('data-example') === exampleId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

/**
 * Aplica un ejemplo del catálogo a la capa.
 * @param {string} exampleId Identificador del ejemplo.
 */
function applyExample(exampleId) {
  const example = EXAMPLES[exampleId];
  if (!example) {
    return;
  }
  if (example.options === null) {
    layerGeoTIFF.clearStyle();
  } else {
    layerGeoTIFF.setStyle(new Raster({ ...example.options }));
  }
  setActiveButton(exampleId);
  updateDescription(exampleId);
  updateLegend();
}

document.querySelectorAll('#examples-panel button[data-example]').forEach((button) => {
  button.addEventListener('click', () => {
    applyExample(button.getAttribute('data-example'));
  });
});

window.applyExample = applyExample;

applyExample('none');
