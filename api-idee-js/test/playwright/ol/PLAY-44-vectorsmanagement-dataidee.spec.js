import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.afterEach(async ({ request }) => {
  await request.post('http://127.0.0.1:8787/local/reset');
});

test('local DataIDEE editing uses the shared VectorsManagement controls and persists a new feature', async ({ page }) => {
  const writes = [];
  const pendingCount = () => page.evaluate(() => (
    window.dataideeDemo.layer.getEditingSession().count
  ));
  page.on('request', (request) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) writes.push(request.method());
  });
  await page.request.post('http://127.0.0.1:8787/local/reset');
  await page.goto('http://127.0.0.1:8787/');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length >= 5);
  const localGeometryTypes = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .map((feature) => feature.getGeometry().type));
  expect(localGeometryTypes).toEqual(expect.arrayContaining([
    'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiPolygon',
  ]));
  const holeCount = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .find((feature) => feature.getAttributes()?.name === 'Polígono con hueco')
    .getGeometry().coordinates.length - 1);
  expect(holeCount).toBe(1);
  await page.locator('#vectorsmanagement-button').click();
  await expect(page.locator('#m-vectorsmanagement-layer-selector')).toBeVisible();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await expect(page.locator('#m-vectorsmanagement-editing')).toBeVisible();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeVisible();
  await page.locator('#m-vectorsmanagement-editing-fields input[name="name"]').fill('Created in UI');
  await page.locator('#m-vectorsmanagement-creation').click();
  await expect(page.locator('#m-vectorsmanagement-editing-fields input[name="name"]')).toHaveValue('Created in UI');
  await page.locator('#pointdrawing').click();
  const pixel = await page.evaluate(() => {
    const map = window.dataideeDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const position = map.getPixelFromCoordinate(map.getView().getCenter());
    return [bounds.left + position[0], bounds.top + position[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await expect.poll(pendingCount).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  expect(writes).toEqual(['POST']);
  await expect.poll(async () => page.evaluate(() => (
    window.dataideeDemo.layer.getFeatures().length
  ))).toBe(6);
  await page.reload();
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 6);
  const savedName = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .map((feature) => feature.getAttributes()?.name).find((name) => name === 'Created in UI'));
  expect(savedName).toBe('Created in UI');
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.dataideeDemo.layer.getEditingSession(),
  ))).toBe(true);
  const originalCoordinates = await page.evaluate(() => {
    const feature = window.dataideeDemo.layer.getFeatures().find((item) => item.getId() === 0);
    return feature.getImpl().getFeature().getGeometry().getCoordinates();
  });
  await page.evaluate(() => {
    const feature = window.dataideeDemo.layer.getFeatures().find((item) => item.getId() === 0);
    feature.getImpl().getFeature().getGeometry().translate(10, 0);
  });
  await expect.poll(pendingCount).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-discard').click();
  const restoredCoordinates = await page.evaluate(() => {
    const feature = window.dataideeDemo.layer.getFeatures().find((item) => item.getId() === 0);
    return feature.getImpl().getFeature().getGeometry().getCoordinates();
  });
  expect(restoredCoordinates).toEqual(originalCoordinates);
  await page.evaluate(() => {
    const created = window.dataideeDemo.layer.getFeatures()
      .find((feature) => feature.getAttributes()?.name === 'Created in UI');
    window.dataideeDemo.layer.removeFeatures(created);
  });
  await expect.poll(pendingCount).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  await page.reload();
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 5);
  const deletedName = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .map((feature) => feature.getAttributes()?.name).find((name) => name === 'Created in UI'));
  expect(deletedName).toBeUndefined();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#vectorsmanagement-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#m-vectorsmanagement-layer-selector')).toBeVisible();
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    mapWidth: document.querySelector('#map').getBoundingClientRect().width,
  }));
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);
  expect(viewport.mapWidth).toBeGreaterThan(0);
});

test('local DataIDEE handles read-only, limits, conflicts, partial and uncertain writes', async ({ page }) => {
  await page.goto('http://127.0.0.1:8787/?mode=readonly');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await expect(page.locator('#m-vectorsmanagement-editing-start')).toBeDisabled();

  await page.goto('http://127.0.0.1:8787/?mode=dense');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const preparationError = await page.evaluate(async () => {
    try {
      await window.dataideeDemo.layer.beginEditing({ bbox: [-2, -2, 2, 2] });
      return '';
    } catch (error) {
      return error.message;
    }
  });
  expect(preparationError).toContain('feature limit');
  expect(await page.evaluate(() => window.dataideeDemo.layer.getEditingSession())).toBeNull();

  await page.goto('http://127.0.0.1:8787/?mode=conflict');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const conflict = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    prepared.features[0].getGeometry().translate(5, 0);
    try {
      await prepared.session.save();
      return '';
    } catch (error) {
      const message = error.message;
      prepared.session.discard();
      await layer.endEditing(false);
      return message;
    }
  });
  expect(conflict).toContain('changed on the server');

  await page.goto('http://127.0.0.1:8787/?mode=partial');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const partial = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    prepared.features.forEach((feature) => feature.getGeometry().translate(5, 0));
    try {
      await prepared.session.save();
      return { error: '', pending: prepared.session.count };
    } catch (error) {
      const result = { error: error.message, pending: prepared.session.count };
      prepared.session.discard();
      await layer.endEditing(false);
      return result;
    }
  });
  expect(partial.error).toContain('HTTP 422');
  expect(partial.pending).toBe(1);

  await page.goto('http://127.0.0.1:8787/?mode=empty');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const duplicateSave = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    const feature = new IDEE.Feature(null, {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [0, 0] },
    });
    prepared.session.prepareFeature(feature, { name: 'single save' });
    layer.addFeatures(feature);
    const results = await Promise.allSettled([
      prepared.session.save(), prepared.session.save(),
    ]);
    const rejection = results.find((result) => result.status === 'rejected');
    const state = {
      successCount: results.filter((result) => result.status === 'fulfilled').length,
      duplicateError: rejection?.reason?.message,
      savedId: feature.getId(),
    };
    await layer.endEditing(false);
    return state;
  });
  expect(duplicateSave.successCount).toBe(1);
  expect(duplicateSave.duplicateError).toContain('already in progress');
  expect(duplicateSave.savedId).toBe(0);

  await page.goto('http://127.0.0.1:8787/?mode=uncertain');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const uncertain = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    const feature = new IDEE.Feature(null, {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [0, 0] },
    });
    prepared.session.prepareFeature(feature, { name: 'uncertain write' });
    layer.addFeatures(feature);
    try {
      await prepared.session.save();
    } catch (error) {
      const result = {
        error: error.message,
        requiresReview: prepared.session.requiresReview,
      };
      prepared.session.discard();
      await layer.endEditing(false);
      return result;
    }
    return { error: '', requiresReview: prepared.session.requiresReview };
  });
  expect(uncertain.error).toBeTruthy();
  expect(uncertain.requiresReview).toBe(true);
});
