import { test, expect } from '@playwright/test';

// Estilo vectorial real: sus teselas se decodifican en el worker de MapLibre
const STYLE_URL = 'https://demotiles.maplibre.org/style.json';

test.describe('IDEE.layer.MapLibre', () => {
  test('carga el worker publicado junto al núcleo y pinta las teselas vectoriales', async ({ page }) => {
    const errors = [];
    const workers = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('worker', (worker) => workers.push(worker.url()));

    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate((url) => {
      window.map = IDEE.map({
        container: 'map',
        projection: 'EPSG:3857*m',
        center: [-411884, 4927603],
        zoom: 3,
      });
      window.maplibre = new IDEE.layer.MapLibre({ name: 'demo', legend: 'Demo', url });
      window.map.addLayers(window.maplibre);
    }, STYLE_URL);

    const mapLibreMap = () => page.evaluate(() => {
      const mlMap = window.maplibre.getImpl().getLayer().mapLibreMap;
      return mlMap ? {
        loaded: mlMap.loaded(),
        features: mlMap
          .queryRenderedFeatures().length,
      } : {};
    });
    await expect.poll(async () => (await mapLibreMap()).loaded, { timeout: 30000 }).toBe(true);
    expect((await mapLibreMap()).features).toBeGreaterThan(0);
    expect(workers.some((url) => /\/dist\/js\/maplibre-gl-worker\.[0-9a-f]{8}\.js$/.test(url))).toBe(true);
    expect(errors).toEqual([]);
  });
});
