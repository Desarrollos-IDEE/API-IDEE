import { test, expect } from '@playwright/test';
import { CORS, routePng } from '../common/mocks';

/*
 * Control ImplementationSwitcher: cambia el mapa entre OpenLayers y Cesium en la misma
 * página conservando su estado (capas, grupos, secciones, controles, configuración e
 * idioma). Cada núcleo se carga una sola vez y lo que el destino no admite se conserva
 * para cuando se vuelva.
 */
const PAGE = '/test/playwright/ol/basic-ol.html';
const TILES = 'https://tiles.switcher.test';
const WMS = 'https://wms.switcher.test/wms';
const TILESET = 'https://tiles3d.switcher.test/tileset.json';
const CHANGE_TIMEOUT = 60000;

test.describe.configure({ timeout: 180000 });

const mockServices = async (page) => {
  await routePng(page, `${TILES}/**`);
  await routePng(page, `${WMS}**`);
  await page.route(TILESET, (route) => route.fulfill({
    status: 200,
    headers: CORS,
    contentType: 'application/json',
    body: JSON.stringify({
      asset: { version: '1.0' },
      geometricError: 0,
      root: {
        boundingVolume: { region: [-0.07, 0.7, -0.06, 0.71, 0, 10] },
        geometricError: 0,
        refine: 'ADD',
      },
    }),
  }));
};

/** Abre un mapa OL sin capa base ni terreno (sin red) con el control de cambio. */
const openMap = async (page) => {
  await page.goto(PAGE);
  await page.evaluate(({ tiles, wms }) => {
    IDEE.config.baseLayer = [];
    if (IDEE.config.terrain) IDEE.config.terrain.default = [];
    window.changes = [];
    window.addEventListener('idee:implementationchange', ({ detail }) => {
      window.map = detail.map;
      window.changes.push(detail);
    });
    window.map = IDEE.map({
      container: 'map', layers: [], controls: ['scale'], center: [-411884, 4927603], zoom: 6,
    });
    const xyz = (name) => new IDEE.layer.XYZ({
      url: `${tiles}/${name}/{z}/{x}/{y}.png`, name, legend: name, transparent: true,
    });
    const points = (name) => new IDEE.layer.GeoJSON({
      name,
      legend: name,
      source: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {},
          },
        ],
      },
    });
    const wmsLayer = new IDEE.layer.WMS({
      url: wms, name: 'unidades', legend: 'Unidades', useCapabilities: false,
    });
    const hidden = xyz('oculta');
    window.map.addLayers([wmsLayer, hidden, points('puntos')]);
    wmsLayer.setOpacity(0.5);
    hidden.setVisible(false);
    window.map.addLayers(new IDEE.layer.LayerGroup({
      name: 'grupo', legend: 'Grupo', layers: [xyz('hija_xyz'), points('hija_puntos')],
    }));
    window.map.addSections(new IDEE.layer.Section({ title: 'Sección', children: [xyz('en_seccion')] }));
    window.map.addControls(new IDEE.control.ImplementationSwitcher({ collapsed: false }));
  }, { tiles: TILES, wms: WMS });
};

/** Cambia de implementación con el desplegable y espera al mapa nuevo. */
const switchTo = async (page, index, changes) => {
  await page.locator('select#m-implementationswitcher-select').selectOption({ index });
  await expect.poll(() => page.evaluate(() => window.changes.length), { timeout: CHANGE_TIMEOUT })
    .toBe(changes);
};

/** Resumen del mapa actual comparable entre implementaciones. */
const summary = (page) => page.evaluate(() => {
  const { map } = window;
  const layer = (l) => ({
    name: l.name, visible: l.isVisible(), opacity: Math.round(l.getOpacity() * 100) / 100,
  });
  const userLayers = map.getLayers().filter((l) => !l.name.startsWith('__') && !l.getSection());
  return {
    implementation: map.getImplementation(),
    layers: userLayers.filter((l) => l.type !== 'LayerGroup').map(layer)
      .sort((a, b) => a.name.localeCompare(b.name)),
    group: map.getLayerGroup().map((g) => [g.name, g.getLayers().map((l) => l.name).sort()]),
    sections: map.getSections().map((s) => [s.title, s.getChildren().map((l) => l.name)]),
    controls: map.getControls().map((c) => c.name).sort(),
    config: IDEE.config.TEST_SWITCHER,
    lang: IDEE.language.getLang(),
  };
});

test.describe('IDEE.control.ImplementationSwitcher', () => {
  test('isKnownControl solo reconoce los controles del núcleo', async ({ page }) => {
    await page.goto(PAGE);
    const known = await page.evaluate(() => [
      'scale', 'scale*exactScale=true', 'implementationswitcher', 'location', 'Locator', 'layerswitcher', '',
    ].map((name) => IDEE.facade.builder.isKnownControl(name)));
    expect(known).toEqual([true, true, true, true, false, false, false]);
  });

  test('OL → Cesium → OL conserva capas, grupos, secciones, controles, configuración e idioma', async ({ page }) => {
    const cores = [];
    page.on('request', (request) => {
      const match = /apiidee\.(ol|cesium)\.min\.js/.exec(request.url());
      if (match) cores.push(match[1]);
    });
    await mockServices(page);
    await openMap(page);
    await page.evaluate(() => {
      IDEE.config('TEST_SWITCHER', 'conservado');
      IDEE.language.setLang('en');
    });
    const before = await summary(page);
    expect(before.layers.map((l) => l.name)).toEqual(['oculta', 'puntos', 'unidades']);

    await switchTo(page, 1, 1);
    const in3D = await summary(page);
    expect(in3D.implementation).toBe('cesium');
    expect(await page.evaluate(() => window.changes[0].previous)).toBe('ol');
    // La escala no existe en Cesium: queda aparcada y vuelve en 2D
    expect(in3D.controls).toEqual(['implementationswitcher']);
    expect({ ...in3D, implementation: 'ol', controls: before.controls }).toEqual(before);
    await expect(page.locator('div.m-dialog')).toHaveCount(0);

    await switchTo(page, 0, 2);
    const back = await summary(page);
    expect(back).toEqual(before);
    // La vista vuelve a la zona de partida
    const center = await page.evaluate(() => window.map.getCenter());
    expect(Math.abs(center.x - -411884)).toBeLessThan(50000);
    expect(Math.abs(center.y - 4927603)).toBeLessThan(50000);
    // Cada núcleo se ha descargado una sola vez
    expect(cores.sort()).toEqual(['cesium', 'ol']);
  });

  test('IDEE.loadImplementation arranca en Cesium y el switcher lo reconoce', async ({ page }) => {
    const cores = [];
    page.on('request', (request) => {
      const match = /apiidee\.(ol|cesium)\.min\.js/.exec(request.url());
      if (match) cores.push(match[1]);
    });
    await mockServices(page);
    await page.goto(PAGE);
    // Con la implementación activa no descarga nada
    expect(await page.evaluate(async () => (await IDEE.loadImplementation('ol')) === window.IDEE))
      .toBe(true);
    await page.evaluate(async (tiles) => {
      IDEE.config.baseLayer = [];
      if (IDEE.config.terrain) IDEE.config.terrain.default = [];
      IDEE.config('TEST_SWITCHER', 'conservado');
      await IDEE.loadImplementation('cesium');
      window.changes = [];
      window.addEventListener('idee:implementationchange', ({ detail }) => {
        window.map = detail.map;
        window.changes.push(detail);
      });
      window.map = IDEE.map({
        container: 'map', layers: [], controls: ['implementationswitcher'], center: [-3.7, 40.4], zoom: 6,
      });
      window.map.addLayers(new IDEE.layer.XYZ({
        url: `${tiles}/capa/{z}/{x}/{y}.png`, name: 'capa', legend: 'capa', transparent: true,
      }));
    }, TILES);
    expect(await page.evaluate(() => [window.map.getImplementation(), IDEE.config.TEST_SWITCHER]))
      .toEqual(['cesium', 'conservado']);
    // El desplegable marca la implementación con la que arrancó el mapa
    const select = page.locator('select#m-implementationswitcher-select');
    expect(await select.evaluate((element) => element.options[element.selectedIndex].text))
      .toBe('Cesium');

    await select.selectOption({ index: 0 }, { force: true });
    await expect.poll(() => page.evaluate(() => window.changes.length), { timeout: CHANGE_TIMEOUT })
      .toBe(1);
    expect(await page.evaluate(() => [window.map.getImplementation(),
      window.map.getLayers().some((l) => l.name === 'capa')])).toEqual(['ol', true]);
    // El núcleo OL de la página se reutiliza: cada núcleo se descarga una sola vez
    expect(cores.sort()).toEqual(['cesium', 'ol']);
  });

  test('lo que la implementación de destino no admite se conserva y vuelve', async ({ page }) => {
    await mockServices(page);
    await openMap(page);
    await switchTo(page, 1, 1);
    await page.evaluate((url) => {
      window.map.addLayers(new IDEE.layer.Tiles3D({ url, name: 'edificios', legend: 'Edificios' }));
    }, TILESET);

    await switchTo(page, 0, 2);
    expect(await page.evaluate(() => window.map.getLayers().some((l) => l.name === 'edificios')))
      .toBe(false);
    expect(await page.evaluate(() => window.IDEE_IMPLEMENTATIONS.parked.layers.map((e) => e.key)))
      .toEqual(['Tiles3D']);

    await switchTo(page, 1, 3);
    expect(await page.evaluate(() => window.map.getLayers()
      .filter((l) => l.name === 'edificios').map((l) => l.type))).toEqual(['Tiles3D']);
    expect(await page.evaluate(() => window.IDEE_IMPLEMENTATIONS.parked.layers)).toEqual([]);
  });
});
