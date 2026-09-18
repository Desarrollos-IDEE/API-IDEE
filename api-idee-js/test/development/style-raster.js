import { map as Mmap } from 'IDEE/api-idee';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
import Layer from 'IDEE/layer/Layer';
import Raster from 'IDEE/style/Raster';
window.Raster = Raster;

const RAMP_PRESETS = {
  2: ['#000080', '#ff0000'],
  3: ['#000080', '#00ff80', '#ff0000'],
  5: ['#000080', '#0080ff', '#00ff80', '#ffff00', '#ff0000'],
};

const DEFAULT_RAMP = RAMP_PRESETS[5];

const DEFAULT_FORM = {
  styleMode: 'ramp',
  formula: '',
  bandsInput: '1, 2, 3',
  min: 0,
  max: 1,
  ramp: DEFAULT_RAMP,
  interpolation: 'linear',
  interpolationBase: 2,
  gamma: 1,
  saturation: 0,
  exposure: 0,
  contrast: 0,
  brightness: 0,
  nodata: '',
};

const NDVI_FORM = {
  styleMode: 'ramp',
  formula: 'ndvi',
  bandsInput: '2, 1',
  min: -1,
  max: 1,
  ramp: ['#a6611a', '#dfc27d', '#f5f5f5', '#80cdc1', '#018571'],
  interpolation: 'linear',
  interpolationBase: 2,
  gamma: 1,
  saturation: 0,
  exposure: 0,
  contrast: 0,
  brightness: 0,
  nodata: '',
};

const NDWI_FORM = {
  styleMode: 'ramp',
  formula: 'ndwi',
  bandsInput: '2, 3',
  min: -1,
  max: 1,
  ramp: ['#8c510a', '#d8b365', '#f5f5f5', '#5ab4ac', '#01665e'],
  interpolation: 'linear',
  interpolationBase: 2,
  gamma: 1,
  saturation: 0,
  exposure: 0,
  contrast: 0,
  brightness: 0,
  nodata: '',
};

const NBR_FORM = {
  styleMode: 'ramp',
  formula: 'nbr',
  bandsInput: '1, 3',
  min: -1,
  max: 1,
  ramp: ['#d73027', '#fdae61', '#ffffbf', '#a6d96a', '#1a9850'],
  interpolation: 'linear',
  interpolationBase: 2,
  gamma: 1,
  saturation: 0,
  exposure: 0,
  contrast: 0,
  brightness: 0,
  nodata: '',
};

const FORMULA_PRESETS = {
  ndvi: NDVI_FORM,
  ndwi: NDWI_FORM,
  nbr: NBR_FORM,
};

const mapjs = Mmap({
  container: 'map',
  bbox: [3226511.5398818217, 1735204.4920150614, 4207995.393869615, 2056231.5025902353],
});

const layerGeoTIFF = new GeoTIFF({
  url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
  name: 'Sentinel TCI',
  legend: 'Sentinel-2 color verdadero',
}, {
  // convertToRGB: false,
  normalize: true,
});

let rasterStyle = null;

// Función para obtener el elemento del DOM por su id
const $ = (id) => document.getElementById(id);

const getStyleMode = () => $('style-mode').value;

const isRampMode = () => getStyleMode() === 'ramp';

const getFormulaFromForm = () => {
  const value = $('formula').value.trim();
  if (!value) {
    return undefined;
  }
  return value;
};

const getFormulaPreset = () => {
  return FORMULA_PRESETS[getFormulaFromForm()];
};

// Función para cambiar los inputs de colores según el número de colores seleccionados
const renderRampColors = (ramp) => {
  const container = $('ramp-colors');
  container.innerHTML = '';
  ramp.forEach((color, index) => {
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'ramp-color';
    input.dataset.index = String(index);
    input.value = color;
    input.addEventListener('input', applyRasterStyle);
    container.appendChild(input);
  });
  updateRampPresetButtons(ramp.length);
};

// Actualiza el botón activo de rampas de colores
const updateRampPresetButtons = (size) => {
  document.querySelectorAll('.ramp-preset-btn').forEach((button) => {
    const isActive = parseInt(button.dataset.rampSize, 10) === size;
    button.classList.toggle('active', isActive);
  });
};

// Establece la rampa de colores seleccionada
const setRampPreset = (size) => {
  const preset = RAMP_PRESETS[size];
  if (!preset) {
    return;
  }
  renderRampColors([...preset]);
  applyRasterStyle();
};

// Obtiene la rampa de colores seleccionada desde el formulario
const getRampFromForm = () => {
  return Array.from(document.querySelectorAll('.ramp-color')).map((input) => input.value);
};

// Analiza la entrada de bandas y devuelve un array de números
const parseBandsInput = (value) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 1;
  }

  const cleaned = trimmed.replace(/^\[|\]$/g, '');
  const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return 1;
  }

  const numbers = parts.map((part) => parseInt(part, 10));
  if (numbers.length === 1) {
    return numbers[0];
  }
  return numbers;
};

// Formatea el array de bandas para mostrarlo en el formulario
const formatBands = (bands) => {
  if (Array.isArray(bands)) {
    return `[${bands.join(', ')}]`;
  }
  return String(bands);
};

// Lee el valor del input de nodata y lo convierte a número
const readNodataFromForm = () => {
  const raw = $('nodata').value.trim();
  if (raw === '') {
    return undefined;
  }
  return parseFloat(raw);
};

// Lee los valores del formulario y los convierte a números
const readForm = () => {
  const options = {
    gamma: parseFloat($('gamma').value),
    saturation: parseFloat($('saturation').value),
    exposure: parseFloat($('exposure').value),
    contrast: parseFloat($('contrast').value),
    brightness: parseFloat($('brightness').value),
  };

  if (isRampMode()) {
    const formula = getFormulaFromForm();
    if (formula) {
      options.formula = formula;
    }
    options.bands = parseBandsInput($('bands-input').value);
    options.min = parseFloat($('min').value);
    options.max = parseFloat($('max').value);
    options.ramp = getRampFromForm();
    options.interpolation = $('interpolation').value;
    options.interpolationBase = parseFloat($('interpolationBase').value);
  }

  const nodata = readNodataFromForm();
  if (nodata !== undefined) {
    options.nodata = nodata;
    if (!isRampMode()) {
      options.bands = parseBandsInput($('bands-input').value);
    }
  }

  return options;
};

// Establece los valores del formulario
const setFormValues = (values) => {
  $('style-mode').value = values.styleMode;
  let formulaValue = '';
  if (values.formula) {
    formulaValue = values.formula;
  }
  $('formula').value = formulaValue;
  $('bands-input').value = values.bandsInput;
  $('min').value = values.min;
  $('max').value = values.max;
  $('interpolation').value = values.interpolation;
  $('interpolationBase').value = values.interpolationBase;
  $('gamma').value = values.gamma;
  $('saturation').value = values.saturation;
  $('saturation-value').textContent = String(values.saturation);
  $('exposure').value = values.exposure;
  $('exposure-value').textContent = String(values.exposure);
  $('contrast').value = values.contrast;
  $('contrast-value').textContent = String(values.contrast);
  $('brightness').value = values.brightness;
  $('brightness-value').textContent = String(values.brightness);
  let nodataValue = '';
  if (values.nodata !== '' && values.nodata !== undefined && values.nodata !== null) {
    nodataValue = values.nodata;
  }
  $('nodata').value = nodataValue;
  renderRampColors(values.ramp);
  updateFormVisibility();
};

// Actualiza la visibilidad de los elementos del formulario
const updateFormVisibility = () => {
  const useRamp = isRampMode();
  const isExponential = $('interpolation').value === 'exponential';
  const formula = getFormulaFromForm();
  $('ramp-options').classList.toggle('hidden', !useRamp);
  $('interpolationBase').disabled = !isExponential;
  $('interpolation-base-row').classList.toggle('disabled', !isExponential);

  if (formula === 'ndvi') {
    $('bands-hint').textContent = 'NDVI: exactamente dos bandas [nir, red]. En TCI RGB de demo: [2, 1] ≈ (G−R)/(G+R).';
    $('range-hint').textContent = 'Rango del índice (típico −1…1). No se fuerza a 0–1 aunque la capa tenga normalize.';
    $('formula-hint').textContent = 'NDVI: (nir−red)/(nir+red). En TCI RGB no es NDVI real (falta NIR).';
  } else if (formula === 'ndwi') {
    $('bands-hint').textContent = 'NDWI: exactamente dos bandas [green, nir]. En TCI RGB de demo: [2, 3] ≈ (G−B)/(G+B).';
    $('range-hint').textContent = 'Rango del índice (típico −1…1). No se fuerza a 0–1 aunque la capa tenga normalize.';
    $('formula-hint').textContent = 'NDWI: (green−nir)/(green+nir). En TCI RGB no es NDWI real (falta NIR).';
  } else if (formula === 'nbr') {
    $('bands-hint').textContent = 'NBR: exactamente dos bandas [nir, swir]. En TCI RGB de demo: [1, 3] ≈ (R−B)/(R+B).';
    $('range-hint').textContent = 'Rango del índice (típico −1…1). No se fuerza a 0–1 aunque la capa tenga normalize.';
    $('formula-hint').textContent = 'NBR: (nir−swir)/(nir+swir). En TCI RGB no es NBR real (falta SWIR).';
  } else {
    $('bands-hint').textContent = 'Un número para una banda; varios separados por coma para media.';
    $('range-hint').textContent = 'Rango de datos de la rampa (0–1 con normalize; índices típico −1…1).';
    $('formula-hint').textContent = 'Sin fórmula: banda o media. NDVI [nir, red]; NDWI [green, nir]; NBR [nir, swir].';
  }

  if (useRamp) {
    const bandsLabel = formatBands(parseBandsInput($('bands-input').value));
    let title = `Rampa bands ${bandsLabel} (${$('min').value}–${$('max').value})`;
    if (formula === 'ndvi') {
      title = `NDVI ${bandsLabel} (${$('min').value}–${$('max').value})`;
    }
    if (formula === 'ndwi') {
      title = `NDWI ${bandsLabel} (${$('min').value}–${$('max').value})`;
    }
    if (formula === 'nbr') {
      title = `NBR ${bandsLabel} (${$('min').value}–${$('max').value})`;
    }
    $('legend-title').textContent = title;
    return;
  }

  $('legend-title').textContent = 'Solo filtros WebGL';
};

const applyFormulaPreset = (formula) => {
  const preset = FORMULA_PRESETS[formula];
  if (!preset) {
    updateFormVisibility();
    applyRasterStyle();
    return;
  }
  setFormValues({
    ...preset,
    gamma: parseFloat($('gamma').value),
    saturation: parseFloat($('saturation').value),
    exposure: parseFloat($('exposure').value),
    contrast: parseFloat($('contrast').value),
    brightness: parseFloat($('brightness').value),
    nodata: $('nodata').value,
  });
  applyRasterStyle();
};

const isValidLegendUrl = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  if (url.indexOf(Layer.LEGEND_ERROR) !== -1) {
    return false;
  }
  if (url.indexOf(Layer.LEGEND_DEFAULT) !== -1) {
    return false;
  }
  return true;
};

const clearLegendImage = () => {
  const legend = $('legend');
  const legendImg = $('legend-img');
  if (legendImg) {
    legendImg.removeAttribute('src');
  }
  if (legend) {
    legend.classList.add('hidden');
  }
};

const showLegendImage = (url) => {
  const legend = $('legend');
  const legendImg = $('legend-img');
  if (!legendImg) {
    return;
  }
  legendImg.src = url;
  if (legend) {
    legend.classList.remove('hidden');
  }
};

// Actualiza la imagen de la leyenda
const updateLegendImage = () => {
  if (!layerGeoTIFF.getStyle()) {
    clearLegendImage();
    return;
  }
  const legendUrl = layerGeoTIFF.getLegendURL();
  if (legendUrl instanceof Promise) {
    legendUrl.then((url) => {
      if (isValidLegendUrl(url)) {
        showLegendImage(url);
      } else {
        clearLegendImage();
      }
    }).catch(() => {
      clearLegendImage();
    });
    return;
  }
  if (isValidLegendUrl(legendUrl)) {
    showLegendImage(legendUrl);
  } else {
    clearLegendImage();
  }
};

// Establece el mensaje de estado
const setStatus = (message) => {
  $('status').textContent = message;
};

// Aplica el estilo ráster
const applyRasterStyle = () => {
  const options = readForm();

  try {
    layerGeoTIFF.setStyle(options);
    rasterStyle = layerGeoTIFF.getStyle();
    window.rasterStyle = rasterStyle;
  } catch (err) {
    console.error(err);
    setStatus('Error al aplicar el estilo. Revisa rampa, nodata o filtros.');
    return;
  }

  updateLegendImage();
  updateFormVisibility();

  if (!rasterStyle) {
    setStatus('Sin estilo activo. Color nativo de la capa restaurado.');
    return;
  }

  let status = 'Aplicado: ';
  if (isRampMode()) {
    if (options.formula) {
      status += `formula ${options.formula}, `;
    }
    status += `bands ${formatBands(options.bands)}, rango ${options.min}–${options.max}`;
    status += `, ${options.ramp.length} colores`;
    status += `, ${options.interpolation}`;
    if (options.interpolation === 'exponential') {
      status += ` (base ${$('interpolationBase').value})`;
    }
  } else {
    status += 'solo filtros WebGL';
  }
  if (options.nodata !== undefined) {
    status += `, nodata ${options.nodata}`;
  }
  setStatus(status);
};

// Restablece el formulario
const resetForm = () => {
  setFormValues(DEFAULT_FORM);
  rasterStyle = null;
  layerGeoTIFF.clearStyle();
  $('legend-title').textContent = 'Rampa de colores';
  clearLegendImage();
  $('serialized-style').value = '';
  setStatus('Formulario restablecido. Estilo ráster eliminado de la capa.');
};

const getSerializedStyleText = () => {
  if (!rasterStyle) {
    return null;
  }
  return rasterStyle.serialize();
};

const copySerializedStyle = async () => {
  const serialized = getSerializedStyleText();
  if (!serialized) {
    setStatus('No hay estilo activo para serializar.');
    return;
  }

  $('serialized-style').value = serialized;

  try {
    await navigator.clipboard.writeText(serialized);
    setStatus('Estilo serializado (base64) copiado al portapapeles.');
  } catch (err) {
    console.error(err);
    setStatus('No se pudo copiar al portapapeles. El serializado está en el campo.');
  }
};

const detectStyleModeFromOptions = (options) => {
  if (Raster.hasRamp(options, true)) {
    return 'ramp';
  }
  return 'filters';
};

const syncFormFromStyle = (style) => {
  const options = style.getOptions();

  let nodata = '';
  if (options.nodata !== undefined && options.nodata !== null) {
    nodata = options.nodata;
  }

  let ramp = DEFAULT_FORM.ramp;
  if (Array.isArray(options.ramp) && options.ramp.length > 0) {
    ramp = [...options.ramp];
  }

  setFormValues({
    styleMode: detectStyleModeFromOptions(options),
    formula: options.formula || '',
    bandsInput: formatBands(options.bands),
    min: options.min,
    max: options.max,
    ramp,
    interpolation: options.interpolation,
    interpolationBase: options.interpolationBase,
    gamma: options.gamma,
    saturation: options.saturation,
    exposure: options.exposure,
    contrast: options.contrast,
    brightness: options.brightness,
    nodata,
  });
};

const applySerializedStyle = () => {
  const raw = $('serialized-style').value.trim();
  if (!raw) {
    setStatus('Introduce un estilo serializado (base64 de serialize()).');
    return;
  }

  try {
    layerGeoTIFF.setStyle(raw);
    rasterStyle = layerGeoTIFF.getStyle();
    window.rasterStyle = rasterStyle;
    if (!rasterStyle) {
      setStatus('El serializado no produjo un estilo activo.');
      return;
    }
    syncFormFromStyle(rasterStyle);
    updateLegendImage();
    setStatus('Estilo deserializado aplicado a la capa.');
  } catch (err) {
    console.error(err);
    setStatus('Error al deserializar o aplicar el estilo. Revisa el base64.');
  }
};

$('style-mode').addEventListener('change', () => {
  updateFormVisibility();
  applyRasterStyle();
});

$('formula').addEventListener('change', () => {
  const preset = getFormulaPreset();
  if (preset) {
    applyFormulaPreset(getFormulaFromForm());
    return;
  }
  updateFormVisibility();
  applyRasterStyle();
});

$('interpolation').addEventListener('change', () => {
  updateFormVisibility();
  applyRasterStyle();
});

$('bands-input').addEventListener('change', applyRasterStyle);
$('interpolationBase').addEventListener('change', applyRasterStyle);
$('nodata').addEventListener('change', applyRasterStyle);

const updateSaturationLabel = () => {
  $('saturation-value').textContent = $('saturation').value;
};

$('saturation').addEventListener('input', () => {
  updateSaturationLabel();
  applyRasterStyle();
});

const updateExposureLabel = () => {
  $('exposure-value').textContent = $('exposure').value;
};

$('exposure').addEventListener('input', () => {
  updateExposureLabel();
  applyRasterStyle();
});

const updateContrastLabel = () => {
  $('contrast-value').textContent = $('contrast').value;
};

$('contrast').addEventListener('input', () => {
  updateContrastLabel();
  applyRasterStyle();
});

const updateBrightnessLabel = () => {
  $('brightness-value').textContent = $('brightness').value;
};

$('brightness').addEventListener('input', () => {
  updateBrightnessLabel();
  applyRasterStyle();
});

document.querySelectorAll('.ramp-preset-btn').forEach((button) => {
  button.addEventListener('click', () => {
    setRampPreset(parseInt(button.dataset.rampSize, 10));
  });
});

['min', 'max', 'gamma'].forEach((id) => {
  $(id).addEventListener('change', () => {
    updateFormVisibility();
    applyRasterStyle();
  });
});

$('reset-btn').addEventListener('click', resetForm);
$('copy-serialized-btn').addEventListener('click', copySerializedStyle);
$('apply-serialized-btn').addEventListener('click', applySerializedStyle);

window.mapjs = mapjs;
window.layerGeoTIFF = layerGeoTIFF;
window.applyRasterStyle = applyRasterStyle;
window.copySerializedStyle = copySerializedStyle;
window.applySerializedStyle = applySerializedStyle;

setFormValues(DEFAULT_FORM);
mapjs.addGeoTIFF(layerGeoTIFF);
applyRasterStyle();
