// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@playwright/test';
import { TURF_SAMPLES, addSampleLayers } from '../../turfsamples';

const PAGE = '/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html';
const SAMPLE_KEYS = ['zones', 'points', 'lines', 'areas'];

// Puntos de clic (EPSG:4326) dentro de cada entidad, lejos de las demás.
const CLICK = {
  P1: [-3.695, 40.405],
  P2: [-3.685, 40.415],
  Z1: [-3.698, 40.402],
};

/**
 * Ejecuta una operación de capas y devuelve su resultado serializable: los
 * elementos de la capa creada con sus propiedades, su geometría en EPSG:4326
 * y sus medidas (área en m², longitud en km).
 */
const run = (page, id, config) => page.evaluate(({ opId, opConfig }) => {
  const tc = window.mp.controls[0].turfControl;
  const result = tc.runLayerOperation(opId, opConfig);
  if (result.error) return { error: result.error.key || result.error.message };
  const format = new ol.format.GeoJSON();
  const projection = window.map.getProjection().code;
  const features = result.layer === null ? [] : result.layer.getFeatures().map((f) => {
    const geojson = format.writeFeatureObject(f.getImpl().getFeature(), {
      dataProjection: 'EPSG:4326', featureProjection: projection,
    });
    return {
      id: f.getId(),
      properties: f.getAttributes(),
      geometry: geojson.geometry,
      mapGeometry: f.getGeoJSON().geometry,
      area: turf.area(geojson),
      length: turf.length(geojson),
    };
  });
  return {
    layer: result.layer && {
      idLayer: result.layer.idLayer, name: result.layer.name, legend: result.layer.legend,
    },
    count: result.count,
    skipped: result.skipped,
    features,
  };
}, { opId: id, opConfig: config });

const all = (layerId) => [{ layerId, scope: 'all' }];

/** Geometrías (proyección del mapa) de una capa de ejemplo, por id de entidad. */
const sourceGeometries = (page, layerId) => page.evaluate((id) => Object.fromEntries(
  window.map.getLayers().find((l) => l.idLayer === id).getFeatures()
    .map((f) => [f.getId(), f.getGeoJSON().geometry]),
), layerId);

/** Elige una capa en el selector del plugin (cerrado hasta que se pulsa). */
const chooseLayer = async (page, layerId) => {
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator(`#m-vectorsmanagement-layer-selector-options span[data-value="${layerId}"]`).click();
};

/** Pulsa el botón de una operación del panel Turf, desplegando su categoría. */
const openOperation = async (page, opId) => {
  const category = page.locator('.m-vectorsmanagement-turf-category', {
    has: page.locator(`button[data-op="${opId}"]`),
  });
  if (!(await category.evaluate((details) => details.open))) await category.locator('summary').click();
  await category.locator(`button[data-op="${opId}"]`).click();
};

/** Posición en la página de una coordenada EPSG:4326. */
const pixelOf = (page, lonLat) => page.evaluate((c) => {
  const olMap = window.map.getMapImpl();
  const px = olMap.getPixelFromCoordinate(ol.proj.fromLonLat(c, window.map.getProjection().code));
  const rect = olMap.getTargetElement().getBoundingClientRect();
  return { x: rect.left + px[0], y: rect.top + px[1] };
}, lonLat);

/**
 * Selecciona elementos de una capa con la herramienta de selección del
 * plugin, haciendo clic en el mapa (Ctrl a partir del segundo).
 */
const selectOnMap = async (page, layerId, points) => {
  await chooseLayer(page, layerId);
  const button = page.locator('#m-vectorsmanagement-selection');
  if (!(await button.getAttribute('class')).includes('activated')) await button.click();
  await page.evaluate(() => new Promise((resolve) => {
    const olMap = window.map.getMapImpl();
    olMap.once('rendercomplete', resolve);
    olMap.render();
  }));
  // Cada clic espera a que se seleccione el elemento: dos clics seguidos
  // serían un doble clic para OpenLayers.
  for (let i = 0; i < points.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const { x, y } = await pixelOf(page, points[i]);
    // eslint-disable-next-line no-await-in-loop
    if (i > 0) await page.keyboard.down('Control');
    // eslint-disable-next-line no-await-in-loop
    await page.mouse.click(x, y);
    // eslint-disable-next-line no-await-in-loop
    if (i > 0) await page.keyboard.up('Control');
    // eslint-disable-next-line no-await-in-loop
    await expect.poll(() => page.evaluate(() => window.mp.controls[0].getSelectedFeatures().length))
      .toBe(i + 1);
  }
};

/** Cierra los diálogos abiertos (ayuda, errores, información...). */
const closeDialogs = (page) => page.evaluate(() => document.querySelectorAll('.m-dialog')
  .forEach((dialog) => dialog.remove()));

test.describe('VectorsManagement Turf: operaciones entre capas', () => {
  let ids;
  let pageErrors;

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.map = IDEE.map({ container: 'mapjs' });
      window.mp = new IDEE.plugin.VectorsManagement({ collapsed: false });
      window.map.addPlugin(window.mp);
    });
    ids = await page.evaluate(addSampleLayers, TURF_SAMPLES);
    // Deja libre la zona del panel del plugin, a la derecha.
    await page.evaluate(() => window.map.setBbox(ol.proj.transformExtent(
      [-3.72, 40.38, -3.53, 40.45],
      'EPSG:4326',
      window.map.getProjection().code,
    )));
    await expect.poll(() => page.evaluate((layerIds) => layerIds.every((id) => window.map
      .getLayers().find((l) => l.idLayer === id).getFeatures().length > 0), SAMPLE_KEYS.map((k) => ids[k])), { timeout: 15000 }).toBe(true);
    await page.waitForFunction(() => window.mp.controls[0] && window.mp.controls[0].turfControl);
  });

  // Ninguna prueba puede dejar errores no capturados en la página.
  test.afterEach(() => {
    expect(pageErrors).toEqual([]);
  });

  test('buffer de una entidad seleccionada y de una capa, disuelto y reutilizado', async ({ page }) => {
    await selectOnMap(page, ids.points, [CLICK.P1]);
    const single = await run(page, 'buffer', {
      inputs: { input: [{ layerId: ids.points, scope: 'selection' }] },
      params: { radius: 100, units: 'meters' },
    });
    expect(single.count).toBe(1);
    expect(single.features[0].properties).toEqual({ idPunto: 'P1', nombre: 'Fuente', categoria: 'mobiliario' });
    expect(single.features[0].geometry.type).toBe('Polygon');
    // steps = 8 genera un polígono de 32 lados: 0,9936 · π · r²
    expect(Math.abs(single.features[0].area / (0.9936 * Math.PI * 100 * 100) - 1)).toBeLessThan(0.015);

    const kilometers = await run(page, 'buffer', {
      inputs: { input: [{ layerId: ids.points, scope: 'selection' }] },
      params: { radius: 0.1, units: 'kilometers' },
    });
    expect(kilometers.features[0].area / single.features[0].area).toBeCloseTo(1, 3);

    const layer = await run(page, 'buffer', { inputs: { input: all(ids.points) }, params: { radius: 500 } });
    expect(layer.count).toBe(5);
    expect(layer.features.find((f) => f.properties.idPunto === 'P5').properties.categoria).toBeNull();

    const dissolved = await run(page, 'buffer', {
      inputs: { input: all(ids.points) }, params: { radius: 500, dissolve: true },
    });
    expect(dissolved.count).toBe(1);
    expect(dissolved.features[0].properties).toEqual({ num_entidades: 5 });

    const extracted = await run(page, 'extractByLocation', {
      inputs: {
        input: all(ids.lines),
        condition: [{ layerId: layer.layer.idLayer, scope: 'result' }],
      },
    });
    expect(extracted.features.map((f) => f.properties.idTramo).sort()).toEqual(['C1', 'C2', 'C4']);

    expect((await run(page, 'buffer', { inputs: { input: all(ids.points) }, params: { radius: 0 } })).error)
      .toBe('radiusZero');
    expect((await run(page, 'buffer', { inputs: { input: all(ids.points) }, params: { radius: -10 } })).error)
      .toBe('negativeRadius');
  });

  test('extraer por localización conserva las geometrías y distingue las relaciones', async ({ page }) => {
    const extract = (input, condition, predicate) => run(page, 'extractByLocation', {
      inputs: { input: all(input), condition: all(condition) }, params: { predicate },
    });
    const pointIds = (result) => result.features.map((f) => f.properties.idPunto).sort();

    const intersects = await extract(ids.points, ids.zones, 'intersects');
    expect(pointIds(intersects)).toEqual(['P1', 'P2', 'P3', 'P5']);
    // P3 está en el borde de Z3: interseca pero no está dentro
    expect(pointIds(await extract(ids.points, ids.zones, 'within'))).toEqual(['P1', 'P2', 'P5']);
    expect(pointIds(await extract(ids.points, ids.zones, 'disjoint'))).toEqual(['P4']);

    const sourcePoints = await sourceGeometries(page, ids.points);
    intersects.features.forEach((f) => {
      expect(f.mapGeometry).toEqual(sourcePoints[f.properties.idPunto]);
    });

    const lines = await extract(ids.lines, ids.zones, 'intersects');
    const sourceLines = await sourceGeometries(page, ids.lines);
    expect(lines.features.map((f) => f.properties.idTramo).sort()).toEqual(['C1', 'C2', 'C4']);
    lines.features.forEach((f) => {
      expect(f.mapGeometry).toEqual(sourceLines[f.properties.idTramo]);
    });
    expect((await extract(ids.lines, ids.zones, 'within')).features.map((f) => f.properties.idTramo))
      .toEqual(['C2']);

    // Un punto nunca contiene un polígono: la relación no se ofrece
    expect((await extract(ids.points, ids.zones, 'contains')).error).toBe('optionUnavailable');
  });

  test('unión espacial de atributos: geometría del destino, campos, conflictos y coincidencias', async ({ page }) => {
    const join = (params, attributes) => run(page, 'spatialJoin', {
      inputs: { target: all(ids.points), join: all(ids.zones) }, params, attributes,
    });
    const pairs = (result) => result.features
      .map((f) => `${f.properties.idPunto}-${f.properties.idZona}`).sort();

    const result = await join({ predicate: 'intersects' });
    expect(pairs(result)).toEqual(['P1-Z1', 'P2-Z1', 'P2-Z2', 'P3-Z3', 'P4-null', 'P5-Z3']);
    expect(Object.keys(result.features[0].properties))
      .toEqual(['idPunto', 'nombre', 'categoria', 'idZona', 'nombre_2', 'tipo']);
    const p5 = result.features.find((f) => f.properties.idPunto === 'P5').properties;
    expect(p5).toEqual({
      idPunto: 'P5', nombre: 'Farola', categoria: null, idZona: 'Z3', nombre_2: 'Este', tipo: 'industrial',
    });
    const p4 = result.features.find((f) => f.properties.idPunto === 'P4').properties;
    expect([p4.idZona, p4.nombre_2, p4.tipo]).toEqual([null, null, null]);
    const sourcePoints = await sourceGeometries(page, ids.points);
    result.features.forEach((f) => {
      expect(f.mapGeometry).toEqual(sourcePoints[f.properties.idPunto]);
    });

    const prefixed = await join({}, { join: { prefix: 'zona_' } });
    expect(Object.keys(prefixed.features[0].properties))
      .toEqual(['idPunto', 'nombre', 'categoria', 'zona_idZona', 'zona_nombre', 'zona_tipo']);

    const chosen = await join({}, { target: { fields: ['idPunto'] }, join: { fields: ['nombre'] } });
    expect(Object.keys(chosen.features[0].properties)).toEqual(['idPunto', 'nombre']);
    expect(chosen.features.find((f) => f.properties.idPunto === 'P1').properties.nombre).toBe('Centro');

    expect(pairs(await join({ predicate: 'within' })))
      .toEqual(['P1-Z1', 'P2-Z1', 'P2-Z2', 'P3-null', 'P4-null', 'P5-Z3']);

    const discarded = await join({ keepUnmatched: false });
    expect(discarded.count).toBe(5);
    expect(discarded.skipped).toEqual([{ reason: 'unmatched', count: 1 }]);

    const largest = await run(page, 'spatialJoin', {
      inputs: { target: all(ids.areas), join: all(ids.zones) },
      params: { matchPolicy: 'largestOverlap' },
    });
    expect(largest.features.map((f) => `${f.properties.idAmbito}-${f.properties.idZona}`).sort())
      .toEqual(['D1-Z2', 'D2-Z3', 'D3-null']);
    expect((await join({ matchPolicy: 'largestOverlap' })).error).toBe('optionUnavailable');
  });

  test('intersección geométrica de líneas y polígonos con los atributos de ambas capas', async ({ page }) => {
    const lines = await run(page, 'layerIntersection', {
      inputs: { input: all(ids.lines), overlay: all(ids.zones) },
    });
    const byPair = Object.fromEntries(lines.features
      .map((f) => [`${f.properties.idTramo}-${f.properties.idZona}`, f]));
    expect(Object.keys(byPair).sort()).toEqual(['C1-Z1', 'C1-Z2', 'C2-Z3', 'C4-Z1', 'C4-Z3']);
    const expected = await page.evaluate(() => ({
      'C1-Z1': turf.length(turf.lineString([[-3.70, 40.415], [-3.68, 40.415]])),
      'C1-Z2': turf.length(turf.lineString([[-3.69, 40.415], [-3.67, 40.415]])),
      'C2-Z3': turf.length(turf.lineString([[-3.645, 40.405], [-3.635, 40.415]])),
      'C4-Z1': turf.length(turf.lineString([[-3.695, 40.40], [-3.695, 40.42]])),
      'C4-Z3': turf.length(turf.lineString([[-3.64, 40.40], [-3.64, 40.405]])),
    }));
    Object.keys(expected).forEach((key) => {
      expect(byPair[key].length / expected[key]).toBeCloseTo(1, 6);
      expect(['LineString', 'MultiLineString']).toContain(byPair[key].geometry.type);
    });
    expect(byPair['C1-Z2'].properties).toEqual({
      idTramo: 'C1', clase: 'calle', idZona: 'Z2', nombre: 'Norte', tipo: 'residencial',
    });

    const polygons = await run(page, 'layerIntersection', {
      inputs: { input: all(ids.zones), overlay: all(ids.areas) },
    });
    expect(Object.keys(polygons.features[0].properties))
      .toEqual(['idZona', 'nombre', 'tipo', 'idAmbito', 'nombre_2', 'tipo_2']);
    const areas = await page.evaluate(() => {
      const rect = (a, b, c, d) => turf.area(turf.bboxPolygon([a, b, c, d]));
      return {
        'Z1-D1': rect(-3.685, 40.405, -3.68, 40.42),
        'Z2-D1': rect(-3.685, 40.41, -3.675, 40.425),
        'Z3-D2': rect(-3.645, 40.415, -3.63, 40.42),
      };
    });
    const polygonPairs = Object.fromEntries(polygons.features
      .map((f) => [`${f.properties.idZona}-${f.properties.idAmbito}`, f.area]));
    expect(Object.keys(polygonPairs).sort()).toEqual(Object.keys(areas));
    Object.keys(areas).forEach((key) => expect(polygonPairs[key] / areas[key]).toBeCloseTo(1, 3));

    expect((await run(page, 'layerIntersection', {
      inputs: { input: all(ids.zones), overlay: all(ids.points) },
    })).error).toBe('layerIncompatible');
  });

  test('unión de capas: partes solapadas y no solapadas, no una disolución', async ({ page }) => {
    const union = await run(page, 'layerUnion', {
      inputs: { input: all(ids.zones), overlay: all(ids.areas) },
    });
    expect(union.count).toBe(9);
    const props = union.features.map((f) => f.properties);
    expect(props.filter((p) => p.idZona && p.idAmbito)).toHaveLength(3);
    expect(props.filter((p) => p.idZona && p.idAmbito === null)).toHaveLength(3);
    expect(props.filter((p) => p.idZona === null && p.idAmbito)).toHaveLength(3);
    expect(props.find((p) => p.idAmbito === 'D3')).toEqual({
      idZona: null, nombre: null, tipo: null, idAmbito: 'D3', nombre_2: 'Barrio 3', tipo_2: 'rural',
    });

    const checks = await page.evaluate(({ features, samples }) => {
      const area = (geometry) => (geometry ? turf.area(geometry) : 0);
      const pieces = (key, value) => features.filter((f) => f.properties[key] === value);
      const zones = samples.zones.features.map((zone) => {
        const parts = pieces('idZona', zone.id).reduce((sum, f) => sum + f.area, 0);
        return parts / area(zone.geometry);
      });
      const areas = samples.areas.features.map((d) => {
        const own = pieces('idAmbito', d.id);
        const shared = own.filter((f) => f.properties.idZona !== null).map((f) => f.geometry);
        const sharedArea = shared.length > 1
          ? turf.area(turf.union(turf.featureCollection(shared.map((g) => turf.feature(g)))))
          : shared.reduce((sum, g) => sum + area(g), 0);
        const alone = own.filter((f) => f.properties.idZona === null)
          .reduce((sum, f) => sum + f.area, 0);
        return (sharedArea + alone) / area(d.geometry);
      });
      return { zones, areas };
    }, { features: union.features, samples: TURF_SAMPLES });
    [...checks.zones, ...checks.areas].forEach((ratio) => expect(ratio).toBeCloseTo(1, 3));

    expect((await run(page, 'layerUnion', {
      inputs: { input: all(ids.points), overlay: all(ids.zones) },
    })).error).toBe('layerIncompatible');
  });

  test('diferencia de capas con polígonos, líneas y varias capas que se restan', async ({ page }) => {
    const polygons = await run(page, 'layerDifference', {
      inputs: { input: all(ids.zones), overlay: all(ids.areas) },
    });
    expect(polygons.count).toBe(3);
    const expected = await page.evaluate(() => {
      const rect = (a, b, c, d) => turf.area(turf.bboxPolygon([a, b, c, d]));
      return {
        Z1: rect(-3.70, 40.40, -3.68, 40.42) - rect(-3.685, 40.405, -3.68, 40.42),
        Z3: rect(-3.65, 40.40, -3.63, 40.42) - rect(-3.645, 40.415, -3.63, 40.42),
      };
    });
    const byZone = Object.fromEntries(polygons.features.map((f) => [f.properties.idZona, f]));
    expect(byZone.Z1.area / expected.Z1).toBeCloseTo(1, 3);
    expect(byZone.Z3.area / expected.Z3).toBeCloseTo(1, 3);
    expect(Object.keys(byZone.Z1.properties)).toEqual(['idZona', 'nombre', 'tipo']);

    const lines = await run(page, 'layerDifference', {
      inputs: { input: all(ids.lines), overlay: [...all(ids.zones), ...all(ids.areas)] },
    });
    const byLine = Object.fromEntries(lines.features.map((f) => [f.properties.idTramo, f]));
    expect(Object.keys(byLine).sort()).toEqual(['C1', 'C3', 'C4']);
    const c1 = await page.evaluate(() => turf.length(turf.lineString([[-3.705, 40.415], [-3.70, 40.415]]))
      + turf.length(turf.lineString([[-3.67, 40.415], [-3.665, 40.415]])));
    expect(byLine.C1.length / c1).toBeCloseTo(1, 6);
    expect(byLine.C1.geometry.type).toBe('MultiLineString');

    expect((await run(page, 'layerDifference', {
      inputs: { input: all(ids.lines), overlay: [...all(ids.zones), ...all(ids.zones)] },
    })).error).toBe('duplicatedLayer');
  });

  test('las capas de origen no cambian y los resultados no reutilizan identificadores', async ({ page }) => {
    const snapshot = () => page.evaluate((layerIds) => JSON.stringify(layerIds.map((id) => window.map
      .getLayers().find((l) => l.idLayer === id).getFeatures()
      .map((f) => [f.getId(), f.getGeoJSON()]))), SAMPLE_KEYS.map((k) => ids[k]));
    const before = await snapshot();
    const sourceIds = await page.evaluate((layerIds) => layerIds.flatMap((id) => window.map
      .getLayers().find((l) => l.idLayer === id).getFeatures().map((f) => f.getId())),
    SAMPLE_KEYS.map((k) => ids[k]));

    const results = [
      await run(page, 'buffer', { inputs: { input: all(ids.zones) }, params: { radius: 50 } }),
      await run(page, 'layerUnion', { inputs: { input: all(ids.zones), overlay: all(ids.areas) } }),
      await run(page, 'spatialJoin', { inputs: { target: all(ids.points), join: all(ids.zones) } }),
      await run(page, 'extractByLocation', { inputs: { input: all(ids.points), condition: all(ids.zones) } }),
      await run(page, 'layerIntersection', { inputs: { input: all(ids.lines), overlay: all(ids.zones) } }),
    ];
    expect(await snapshot()).toBe(before);

    const outputIds = results.flatMap((r) => r.features.map((f) => f.id));
    expect(new Set(outputIds).size).toBe(outputIds.length);
    outputIds.forEach((id) => {
      expect(sourceIds).not.toContain(id);
      expect(id).toMatch(/^turf_feature_/);
    });
    results.flatMap((r) => r.features).forEach((f) => {
      ['vendor', 'parentID', 'geometry'].forEach((key) => expect(f.properties).not.toHaveProperty(key));
    });
  });

  test('las entradas no válidas y los resultados vacíos no crean capas', async ({ page }) => {
    const layerCount = () => page.evaluate(() => window.map.getLayers().length);
    const before = await layerCount();
    const errorOf = async (id, config) => (await run(page, id, config)).error;

    expect(await errorOf('buffer', { inputs: { input: all(ids.empty) } })).toBe('layerIncompatible');
    expect(await errorOf('buffer', { inputs: { input: [{ layerId: '', scope: 'all' }] } })).toBe('noLayer');
    expect(await errorOf('buffer', { inputs: { input: all('no-existe') } })).toBe('layerNotFound');
    expect(await errorOf('buffer', { inputs: { input: [{ layerId: ids.points, scope: 'selection' }] } }))
      .toBe('noSelection');
    expect(await errorOf('buffer', { inputs: { input: [{ layerId: ids.points, scope: 'result' }] } }))
      .toBe('notResult');
    expect(await errorOf('buffer', { inputs: { input: all(ids.points) }, params: { steps: 0 } })).toBe('param');
    expect(await errorOf('buffer', {
      inputs: { input: all(ids.points) }, attributes: { input: { fields: ['noExiste'] } },
    })).toBe('unknownField');

    const collapsed = await run(page, 'buffer', { inputs: { input: all(ids.zones) }, params: { radius: -3000 } });
    expect(collapsed.layer).toBeNull();
    expect(collapsed.skipped).toEqual([{ reason: 'collapsed', count: 3 }]);
    const empty = await run(page, 'extractByLocation', {
      inputs: { input: all(ids.lines), condition: all(ids.areas) }, params: { predicate: 'within' },
    });
    expect(empty.layer).toBeNull();

    expect(await layerCount()).toBe(before);
  });

  test('selecciones guardadas de dos capas usadas juntas desde el formulario del panel', async ({ page }) => {
    await selectOnMap(page, ids.points, [CLICK.P1, CLICK.P2]);
    await selectOnMap(page, ids.zones, [CLICK.Z1]);

    await page.locator('#m-vectorsmanagement-turf').click();
    const summary = page.locator('.m-vectorsmanagement-turf-selection');
    await expect(summary).toHaveCount(2);
    await expect(summary.filter({ hasText: 'Puntos B' })).toContainText('2');
    await expect(summary.filter({ hasText: 'Zonas A' })).toContainText('1');

    await openOperation(page, 'spatialJoin');
    const prefix = '#m-vectorsmanagement-turf-opform';
    await page.locator(`${prefix}-target-0-scope-selection`).check();
    await page.locator(`${prefix}-target-0-layer`).selectOption(ids.points);
    await page.locator(`${prefix}-join-0-scope-selection`).check();
    await page.locator(`${prefix}-join-0-layer`).selectOption(ids.zones);
    const status = page.locator('#m-vectorsmanagement-turf-opform-status');
    await expect(status).toContainText('Puntos B');
    await expect(status).toContainText('Zonas A');
    // Un punto no puede contener un polígono: solo se ofrecen intersects y within
    expect(await page.locator('#m-vectorsmanagement-turf-param-predicate option').evaluateAll(
      (options) => options.map((o) => o.value),
    )).toEqual(['intersects', 'within']);

    const layersBefore = await page.evaluate(() => window.map.getLayers().length);
    await page.locator(`${prefix}-run`).click();
    await expect.poll(() => page.evaluate(() => window.map.getLayers().length)).toBe(layersBefore + 1);
    const joined = await page.evaluate(() => window.map.getLayers()
      .find((l) => l.name.startsWith('turf_spatialJoin_1_'))
      .getFeatures().map((f) => f.getAttributes()));
    // P2 está también en Z2, pero solo Z1 está seleccionada
    expect(joined.map((p) => `${p.idPunto}-${p.idZona}`).sort()).toEqual(['P1-Z1', 'P2-Z1']);
    await expect(page.locator('#m-vectorsmanagement-layer-selector-options span'))
      .toContainText([/Turf: /]);

    await summary.filter({ hasText: 'Puntos B' }).locator('button').click();
    await expect(summary).toHaveCount(1);
    await page.locator('button[data-action="clear-selections"]').click();
    await expect(summary).toHaveCount(0);
  });

  test('el formulario deshabilita la ejecución y explica el motivo', async ({ page }) => {
    await chooseLayer(page, ids.points);
    await page.locator('#m-vectorsmanagement-turf').click();
    await openOperation(page, 'buffer');
    const runButton = page.locator('#m-vectorsmanagement-turf-opform-run');
    await expect(runButton).toBeEnabled();
    await page.locator('#m-vectorsmanagement-turf-param-radius').fill('0');
    await expect(runButton).toBeDisabled();
    await expect(page.locator('.m-vectorsmanagement-turf-errors li')).toHaveCount(1);
    await page.locator('#m-vectorsmanagement-turf-opform-input-0-layer').selectOption(ids.zones);
    await page.locator('#m-vectorsmanagement-turf-param-radius').fill('-10');
    await expect(runButton).toBeEnabled();
    expect(await page.locator('#m-vectorsmanagement-turf-opform-input-0-layer option').evaluateAll(
      (options) => options.filter((o) => o.disabled).map((o) => o.value),
    )).toContain(ids.empty);

    // La ayuda de la operación explica sus entradas en un modal
    const role = await page.locator('.m-vectorsmanagement-turf-group legend').first().innerText();
    await page.locator('#m-vectorsmanagement-turf-opform-help').click();
    await expect(page.locator('.m-dialog')).toHaveCount(1);
    await expect(page.locator('.m-dialog .m-vectorsmanagement-turf-helpbox')).toContainText(role);
    await closeDialogs(page);

    await page.locator('#m-vectorsmanagement-turf-back').click();
    await expect(page.locator('.m-vectorsmanagement-turf-catalog')).toBeVisible();
    await page.locator('button[data-action="turf-help"]').click();
    await expect(page.locator('.m-dialog .m-vectorsmanagement-turf-helpbox .popup-section')).toHaveCount(3);
  });

  test('al cambiar de capa la herramienta de selección se apaga aunque no haya selección', async ({ page }) => {
    const selection = page.locator('#m-vectorsmanagement-selection');
    await chooseLayer(page, ids.points);
    await selection.click();
    await expect(selection).toHaveClass(/activated/);
    await chooseLayer(page, ids.zones);
    await expect(selection).not.toHaveClass(/activated/);
    await selectOnMap(page, ids.zones, [CLICK.Z1]);
    expect(await page.evaluate(() => window.mp.controls[0].getSelectedFeatures()
      .map((f) => f.getAttributes().idZona))).toEqual(['Z1']);
  });

  test('las herramientas del plugin funcionan con capas de ejemplo y de resultado', async ({ page }) => {
    // El selector de capas empieza cerrado aunque el mapa ya tenga capas
    await expect(page.locator('#m-vectorsmanagement-layer-selector-options')).toBeHidden();
    const result = await run(page, 'buffer', { inputs: { input: all(ids.lines) }, params: { radius: 200 } });
    const tools = ['creation', 'edition', 'style', 'analysis', 'download', 'turf'];
    const toggle = async (tool) => {
      await page.locator(`#m-vectorsmanagement-${tool}`).click();
      await closeDialogs(page);
    };
    const layers = [
      [ids.zones, CLICK.Z1],
      [ids.points, CLICK.P1],
      [result.layer.idLayer, null],
    ];
    for (let i = 0; i < layers.length; i += 1) {
      const [layerId, point] = layers[i];
      // eslint-disable-next-line no-await-in-loop
      await chooseLayer(page, layerId);
      for (let j = 0; j < tools.length; j += 1) {
        // eslint-disable-next-line no-await-in-loop
        await toggle(tools[j]);
        // eslint-disable-next-line no-await-in-loop
        await toggle(tools[j]);
      }
      if (point) {
        // Estilo de un elemento seleccionado
        // eslint-disable-next-line no-await-in-loop
        await selectOnMap(page, layerId, [point]);
        // eslint-disable-next-line no-await-in-loop
        await toggle('style');
        // eslint-disable-next-line no-await-in-loop
        await page.locator('#set-style-btn').click();
        // eslint-disable-next-line no-await-in-loop
        await toggle('style');
        // eslint-disable-next-line no-await-in-loop
        await page.locator('#m-vectorsmanagement-selection').click();
      }
    }
  });

  test('las operaciones de colección existentes siguen funcionando', async ({ page }) => {
    await chooseLayer(page, ids.zones);
    await page.locator('#m-vectorsmanagement-turf').click();
    await openOperation(page, 'centroid');
    await expect.poll(() => page.evaluate(() => window.map.getLayers()
      .filter((l) => l.name.startsWith('turf_centroid_1_'))
      .map((l) => l.getFeatures().length))).toEqual([3]);

    // Relaciones con dos elementos seleccionados (Z1 y Z2, que se solapan)
    await page.evaluate(() => {
      window.toasts = [];
      const info = IDEE.toast.info;
      IDEE.toast.info = (message, ...args) => {
        window.toasts.push(message);
        return info(message, ...args);
      };
    });
    await selectOnMap(page, ids.zones, [CLICK.Z1, [-3.675, 40.425]]);
    await openOperation(page, 'booleanContains');
    await openOperation(page, 'booleanWithin');
    await expect.poll(() => page.evaluate(() => window.toasts)).toHaveLength(2);
    expect(await page.evaluate(() => window.toasts.map((t) => t.split(': ')[1])))
      .toEqual(['No', 'No']);
  });
});
