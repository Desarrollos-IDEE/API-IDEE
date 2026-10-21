import { test, expect } from '@playwright/test';

/*
 * Grupos de capas y secciones en Cesium (grupo emulado: las hijas van directas al
 * visor y el grupo propaga visibilidad, opacidad y orden). Teselas simuladas.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const TILES = 'https://group.cesium.test';
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const WAIT = { timeout: 20000 };

test.describe.configure({ timeout: 60000 });

test.describe('Grupos y secciones en Cesium', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${TILES}/**`, (route) => route.fulfill({
      status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'image/png', body: PNG_1PX,
    }));
    await page.goto(PAGE);
    await page.evaluate((tiles) => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 6,
      });
      window.xyz = (name) => new IDEE.layer.XYZ({
        url: `${tiles}/${name}/{z}/{x}/{y}.png`, name, legend: name, transparent: true,
      });
      window.puntos = (name) => new IDEE.layer.GeoJSON({
        name,
        source: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {} }],
        },
      });
      // Nombres de las capas de fachada en el orden de la colección de imágenes del visor
      window.imageryOrder = () => {
        const { imageryLayers } = window.map.getMapImpl();
        const layers = window.map.getLayers().concat(window.map.getImpl().getAllLayerInGroup());
        const names = [];
        for (let i = 0; i < imageryLayers.length; i += 1) {
          const layer = layers.find((l) => l.getImpl().getLayer() === imageryLayers.get(i));
          if (layer) names.push(layer.name);
        }
        return names;
      };
      window.inViewer = (layer) => {
        const native = layer.getImpl().getLayer();
        const { imageryLayers, dataSources } = window.map.getMapImpl();
        return !!native && (imageryLayers.contains(native) || dataSources.contains(native));
      };
    }, TILES);
  });

  test('un grupo añade sus capas al visor y aparece en el mapa', async ({ page }) => {
    const state = await page.evaluate(() => {
      window.events = [];
      window.grupo = new IDEE.layer.LayerGroup({
        name: 'grupo', legend: 'Grupo', layers: [window.xyz('a'), window.puntos('p')],
      });
      window.grupo.on(IDEE.evt.ADDED_TO_LAYERGROUP, (layer) => window.events.push(layer.name));
      window.map.addLayers(window.grupo);
      return {
        groups: window.map.getLayerGroup().map((g) => g.name),
        inLayers: window.map.getLayers().includes(window.grupo),
        children: window.grupo.getLayers().map((l) => l.name),
        grouped: window.map.getImpl().getAllLayerInGroup().map((l) => l.name),
      };
    });
    expect(state.groups).toEqual(['grupo']);
    expect(state.inLayers).toBe(true);
    expect(state.children).toEqual(['a', 'p']);
    expect(state.grouped).toEqual(['a', 'p']);
    await expect.poll(() => page.evaluate(() => window.grupo.getLayers()
      .every((l) => window.inViewer(l))), WAIT).toBe(true);
  });

  test('el grupo propaga visibilidad y opacidad a sus capas', async ({ page }) => {
    await page.evaluate(() => {
      window.grupo = new IDEE.layer.LayerGroup({ name: 'grupo', layers: [window.xyz('a'), window.xyz('b')] });
      window.map.addLayers(window.grupo);
    });
    await expect.poll(() => page.evaluate(() => window.grupo.getLayers()
      .every((l) => window.inViewer(l))), WAIT).toBe(true);
    const state = await page.evaluate(() => {
      window.grupo.setVisible(false);
      const hidden = window.grupo.getLayers().map((l) => [l.isVisible(), l.getImpl().getLayer().show]);
      window.grupo.setVisible(true);
      window.grupo.setOpacity(0.5);
      const opacity = window.grupo.getLayers().map((l) => l.getImpl().getLayer().alpha);
      return { hidden, opacity, visible: window.grupo.isVisible() };
    });
    expect(state.hidden).toEqual([[false, false], [false, false]]);
    expect(state.opacity).toEqual([0.5, 0.5]);
    expect(state.visible).toBe(true);
  });

  test('las capas del grupo quedan juntas, por debajo del z-index del grupo', async ({ page }) => {
    const order = await page.evaluate(() => {
      const suelta = window.xyz('suelta');
      window.map.addLayers(suelta);
      window.grupo = new IDEE.layer.LayerGroup({ name: 'grupo', layers: [window.xyz('a'), window.xyz('b')] });
      window.map.addLayers(window.grupo);
      const encima = window.xyz('encima');
      window.map.addLayers(encima);
      const [a, b] = window.grupo.getLayers();
      return {
        imagery: window.imageryOrder(),
        group: window.grupo.getZIndex(),
        children: [a.getZIndex(), b.getZIndex()],
        suelta: suelta.getZIndex(),
        encima: encima.getZIndex(),
      };
    });
    expect(order.imagery).toEqual(['suelta', 'a', 'b', 'encima']);
    expect(order.children[1]).toBe(order.group - 1);
    expect(order.children[0]).toBe(order.group - 2);
    expect(order.suelta).toBeLessThan(order.children[0]);
    expect(order.encima).toBeGreaterThan(order.group);
  });

  test('grupos anidados', async ({ page }) => {
    const state = await page.evaluate(() => {
      const sub = new IDEE.layer.LayerGroup({ name: 'sub', layers: [window.xyz('hija')] });
      window.grupo = new IDEE.layer.LayerGroup({ name: 'grupo', layers: [window.xyz('a'), sub] });
      window.map.addLayers(window.grupo);
      return {
        grouped: window.map.getImpl().getGroupedLayers().map((g) => g.name),
        leaves: window.map.getImpl().getAllLayerInGroup().map((l) => l.name).sort(),
        total: window.grupo.getImpl().getTotalLayers(),
      };
    });
    expect(state.grouped).toEqual(['grupo', 'sub']);
    expect(state.leaves).toEqual(['a', 'hija']);
    expect(state.total).toBe(4);
    await expect.poll(() => page.evaluate(() => window.imageryOrder()), WAIT).toEqual(['a', 'hija']);
  });

  test('añadir, quitar y sacar capas de un grupo ya añadido', async ({ page }) => {
    await page.evaluate(() => {
      window.events = [];
      window.grupo = new IDEE.layer.LayerGroup({ name: 'grupo', layers: [window.xyz('a')] });
      window.grupo.on(IDEE.evt.ADDED_TO_LAYERGROUP, (l) => window.events.push(`+${l.name}`));
      window.grupo.on(IDEE.evt.REMOVED_FROM_LAYERGROUP, (l) => window.events.push(`-${l.name}`));
      window.map.addLayers(window.grupo);
      window.b = window.xyz('b');
      window.c = window.xyz('c');
      window.grupo.addLayers([window.b, window.c]);
    });
    await expect.poll(() => page.evaluate(() => [window.inViewer(window.b), window.inViewer(window.c)]), WAIT)
      .toEqual([true, true]);
    const state = await page.evaluate(() => {
      window.grupo.removeLayers(window.b);
      window.grupo.ungroup(window.c, true);
      return {
        events: window.events,
        children: window.grupo.getLayers().map((l) => l.name),
        bInViewer: window.inViewer(window.b),
        cInViewer: window.inViewer(window.c),
        cAtRoot: window.map.getLayers().includes(window.c),
      };
    });
    // La hija inicial también se notifica al añadirse el grupo al mapa (como en OL)
    expect(state.events).toEqual(['+a', '+b', '+c', '-b']);
    expect(state.children).toEqual(['a']);
    expect(state.bInViewer).toBe(false);
    expect(state.cInViewer).toBe(true);
    expect(state.cAtRoot).toBe(true);
  });

  test('quitar el grupo retira sus capas del visor', async ({ page }) => {
    await page.evaluate(() => {
      window.removed = [];
      window.map.on(IDEE.evt.REMOVED_LAYER, (layers) => window.removed.push(...[].concat(layers).map((l) => l.name)));
      window.grupo = new IDEE.layer.LayerGroup({ name: 'grupo', layers: [window.xyz('a'), window.puntos('p')] });
      window.map.addLayers(window.grupo);
    });
    await expect.poll(() => page.evaluate(() => window.grupo.getLayers()
      .every((l) => window.inViewer(l))), WAIT).toBe(true);
    const state = await page.evaluate(() => {
      const children = window.grupo.getLayers().slice();
      window.map.removeLayers(window.grupo);
      return {
        inViewer: children.map((l) => window.inViewer(l)),
        groups: window.map.getLayerGroup().length,
        removed: window.removed,
      };
    });
    expect(state.inViewer).toEqual([false, false]);
    expect(state.groups).toBe(0);
    expect(state.removed).toContain('grupo');
  });

  test('secciones: alta, capas, visibilidad y baja', async ({ page }) => {
    const state = await page.evaluate(() => {
      window.seccion = new IDEE.layer.Section({
        idSection: 'seccion_1', title: 'Sección 1', children: [window.xyz('s1'), window.puntos('s2')],
      });
      let added = false;
      window.seccion.on(IDEE.evt.ADDED_TO_MAP, () => { added = true; });
      window.map.addSections(window.seccion);
      return {
        added,
        sections: window.map.getSections().map((s) => s.idSection),
        layers: window.map.getImpl().getSectionsLayers().map((l) => l.name),
        inMap: window.seccion.getChildren().every((l) => window.map.getLayers().includes(l)),
      };
    });
    expect(state.added).toBe(true);
    expect(state.sections).toEqual(['seccion_1']);
    expect(state.layers).toEqual(['s1', 's2']);
    expect(state.inMap).toBe(true);
    await expect.poll(() => page.evaluate(() => window.seccion.getChildren()
      .every((l) => window.inViewer(l))), WAIT).toBe(true);

    const after = await page.evaluate(() => {
      window.seccion.setVisible(false);
      const hidden = window.seccion.getChildren().map((l) => l.isVisible());
      window.map.removeSections(window.seccion);
      return { hidden, sections: window.map.getSections().length };
    });
    expect(after.hidden).toEqual([false, false]);
    expect(after.sections).toBe(0);
  });
});
