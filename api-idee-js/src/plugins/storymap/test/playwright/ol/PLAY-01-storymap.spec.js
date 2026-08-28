import { test, expect } from '@playwright/test';

import StoryMapJSON2 from '../../StoryMapJSON2.json';

import StoryMapJSON1 from '../../StoryMapJSON1.json';

test('Test storymap', async ({ page }) => {

await page.goto('/src/plugins/storymap/test/playwright/ol/storymap-ol.html');

await page.evaluate(({ contentEs, contentEn }) => {

window.mapjs = IDEE.map({

container: 'mapjs',

});

window.mp = new IDEE.plugin.StoryMap({

collapsed: false,

collapsible: true,

position: 'TR',

tooltip: 'Tooltip Storymap',

content: {

es: contentEs,

en: contentEn,

},

indexInContent: {

title: 'Índice StoryMap',

subtitle: 'Visualizador de Cervantes y el Madrid del siglo XVII',

js: "console.log('Visualizador de Cervantes');",

},

delay: 2000,

});

window.mapjs.addPlugin(window.mp);

}, { contentEs: StoryMapJSON2, contentEn: StoryMapJSON1 });


const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);

expect(nPlugins).toBe(1);

});
