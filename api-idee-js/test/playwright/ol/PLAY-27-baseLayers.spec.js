import { test, expect } from '@playwright/test';

test.describe('IDEE.Layer', () => {
  let map;
  test('Comprobando funcionamiento de setVisible con capas base', async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    const res = await page.evaluate(() => {
      map = IDEE.map({ container: 'map' });

      const xyz = new IDEE.layer.XYZ({
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
        name: 'AtlasDeCresques',
        isBase: true,
      });

      const wms = new IDEE.layer.WMS({
        url: 'https://www.ign.es/wms/pnoa-historico?',
        name: 'OLISTAT',
        isBase: true,
      });

      const geodesia = new IDEE.layer.WFS({
        url: 'https://www.ign.es/wfs/redes-geodesicas?',
        legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
        name: 'RED_REGENTE',
        geometry: 'POINT',
        isBase: true,
      });

      map.addLayers([xyz, wms, geodesia]);

      const nombreBase1 = map.getBaseLayers()[0].name;

      map.removeLayers(map.getLayers()[0]);

      const nombreBase2 = map.getBaseLayers()[0].name;

      map.removeLayers(map.getLayers()[0]);

      const nombreBase3 = map.getBaseLayers()[0].name;

      map.removeLayers(map.getLayers()[0]);

      const nombreBase4 = map.getBaseLayers()[0].name;
      return [nombreBase1, nombreBase2, nombreBase3, nombreBase4, map.getBaseLayers()[0].isVisible()];
    });
    expect(res[0]).not.toBe(res[1]);
    expect(res[1]).not.toBe(res[2]);
    expect(res[2]).not.toBe(res[3]);
    expect(res[4]).toBe(true);
  });
});
