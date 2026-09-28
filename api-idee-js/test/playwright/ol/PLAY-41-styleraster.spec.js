import { test, expect } from '@playwright/test';

test.describe('IDEE.style.Raster', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      window.mapjs = IDEE.map({
        container: 'map',
      });
    });
  });

  test('filtros WebGL, rampa, NDVI y serialización', async ({ page }) => {
    const result = await page.evaluate(() => {
      const Raster = IDEE.style.Raster;
      const filterStyle = new Raster({
        saturation: -1,
        gamma: 0.6,
        contrast: 0.4,
      });
      filterStyle.setBrightness(0.35);
      filterStyle.setExposure(0.3);

      const rampStyle = new Raster({
        bands: 1,
        min: 0,
        max: 255,
        ramp: ['#000080', '#ff0000'],
      });

      const ndviStyle = new Raster({
        formula: Raster.FORMULA.NDVI,
        bands: Raster.DEFAULT_NDVI.bands,
        min: Raster.DEFAULT_NDVI.min,
        max: Raster.DEFAULT_NDVI.max,
        ramp: Raster.DEFAULT_NDVI.ramp,
      });

      const serialized = filterStyle.toJSON();
      const restored = Raster.deserialize(serialized.parameters);

      return {
        filterStyle: {
          isRaster: filterStyle instanceof Raster,
          saturation: filterStyle.getSaturation(),
          gamma: filterStyle.getGamma(),
          contrast: filterStyle.getContrast(),
          brightness: filterStyle.getBrightness(),
          exposure: filterStyle.getExposure(),
        },
        rampStyle: {
          min: rampStyle.getMin(),
          max: rampStyle.getMax(),
          hasRamp: Raster.hasRamp({ bands: 1, ramp: ['#000080', '#ff0000'] }),
          optionsHaveEffect: Raster.optionsHaveEffect({ bands: 1, ramp: ['#000080', '#ff0000'] }),
        },
        ndviStyle: {
          formula: ndviStyle.getFormula(),
          min: ndviStyle.getMin(),
          max: ndviStyle.getMax(),
          bands: ndviStyle.getOptions().bands,
        },
        serialization: {
          deserializedMethod: serialized.deserializedMethod,
          restoredGamma: restored.getGamma(),
          restoredSaturation: restored.getSaturation(),
        },
      };
    });

    expect(result.filterStyle.isRaster).toBe(true);
    expect(result.filterStyle.saturation).toBe(-1);
    expect(result.filterStyle.gamma).toBe(0.6);
    expect(result.filterStyle.contrast).toBe(0.4);
    expect(result.filterStyle.brightness).toBe(0.35);
    expect(result.filterStyle.exposure).toBe(0.3);

    expect(result.rampStyle.min).toBe(0);
    expect(result.rampStyle.max).toBe(255);
    expect(result.rampStyle.hasRamp).toBe(true);
    expect(result.rampStyle.optionsHaveEffect).toBe(true);

    expect(result.ndviStyle.formula).toBe('ndvi');
    expect(result.ndviStyle.min).toBe(-1);
    expect(result.ndviStyle.max).toBe(1);
    expect(result.ndviStyle.bands).toEqual([2, 1]);

    expect(result.serialization.deserializedMethod).toBe('IDEE.style.Raster.deserialize');
    expect(result.serialization.restoredGamma).toBe(0.6);
    expect(result.serialization.restoredSaturation).toBe(-1);
  });
});
