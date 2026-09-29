/**
 * Tipos de estilo para validar bandas frente al GeoTIFF.
 * @typedef {'monoband'|'mean'|'index'|'rgb'} BandStyleKind
 */

/**
 * Devuelve los números de banda activos (> 0) a partir de la configuración del estilo.
 *
 * @param {number|Array<number>} bands Banda o listado de bandas del formulario
 * @returns {Array<number>}
 */
export function getActiveBandNumbers(bands) {
  if (typeof bands === 'number') {
    if (bands > 0) {
      return [bands];
    }
    return [];
  }
  if (!Array.isArray(bands)) {
    return [];
  }
  const active = [];
  for (let i = 0; i < bands.length; i += 1) {
    const band = bands[i];
    if (typeof band === 'number' && band > 0) {
      active.push(band);
    }
  }
  return active;
}

/**
 * Comprueba si el uso de bandas es válido para el número de bandas del GeoTIFF.
 *
 * @param {number|null} bandCount Bandas del TIF o null si aún no se conoce
 * @param {BandStyleKind} styleKind Tipo de estilo
 * @param {number|Array<number>} bands Bandas del formulario
 * @returns {{ valid: boolean, reason: string|null, maxBand?: number }}
 */
export function validateBandUsageForLayer(bandCount, styleKind, bands) {
  if (bandCount === null || bandCount === undefined || bandCount < 1) {
    return { valid: false, reason: 'unavailable' };
  }

  if (styleKind === 'mean' || styleKind === 'index') {
    if (bandCount < 2) {
      return { valid: false, reason: 'singleBandMultiband' };
    }
  }

  const activeBands = getActiveBandNumbers(bands);
  for (let i = 0; i < activeBands.length; i += 1) {
    const band = activeBands[i];
    if (band > bandCount) {
      return {
        valid: false,
        reason: 'exceedsLayerCount',
        maxBand: bandCount,
      };
    }
  }

  return { valid: true, reason: null };
}
