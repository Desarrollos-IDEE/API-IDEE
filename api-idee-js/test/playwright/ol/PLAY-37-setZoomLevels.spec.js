import { test, expect } from '@playwright/test';

test('Comprobamos que los niveles de zoom se establecen correctamente', async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    const mapjs = IDEE.map({
      container: 'map',
      controls: ['scale*1'],
      layers: ['OSM'],
      resolutions: [
        55659.74539663679,
        27829.872698318395,
        13914.936349159198,
        6957.468174579599,
        3478.7340872897994,
        1739.3670436448997,
        869.6835218224498,
        434.8417609112249,
        217.42088045561246,
        108.71044022780623,
        54.355220113903115,
        27.177610056951558,
        13.588805028475779,
        6.794402514237889,
        3.3972012571189447,
        1.6986006285594724,
        0.8493003142797362,
        0.4246501571398681,
        0.21232507856993404,
        0.10616253928496702,
      ],
    });
    window.mapjs = mapjs;
  });
  await page.waitForFunction(() => window.mapjs.isFinished());

  const resolutionsMap = await page.evaluate(() => window.mapjs.getResolutions());
  expect(resolutionsMap, 4).toEqual([
    55659.74539663679,
    27829.872698318395,
    13914.936349159198,
    6957.468174579599,
    3478.7340872897994,
    1739.3670436448997,
    869.6835218224498,
    434.8417609112249,
    217.42088045561246,
    108.71044022780623,
    54.355220113903115,
    27.177610056951558,
    13.588805028475779,
    6.794402514237889,
    3.3972012571189447,
    1.6986006285594724,
    0.8493003142797362,
    0.4246501571398681,
    0.21232507856993404,
    0.10616253928496702,
  ]);

  await page.evaluate(() => window.mapjs.setZoomLevels(10));
  const resolutionsMap2 = await page.evaluate(() => window.mapjs.getResolutions());
  expect(resolutionsMap2, 4).toEqual([
    55659.74539663679,
    27829.872698318395,
    13914.936349159198,
    6957.468174579599,
    3478.7340872897994,
    1739.3670436448997,
    869.6835218224498,
    434.8417609112249,
    217.42088045561246,
    108.71044022780623,
  ]);
});
