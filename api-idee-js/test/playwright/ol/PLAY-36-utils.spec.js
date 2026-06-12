import { test, expect } from '@playwright/test';

test.describe('IDEE.Utils', () => {
  let map;
  test('Comprobando funcionalidades de utils', async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    const res = await page.evaluate(() => {
      map = IDEE.map({ container: 'map' });
      window.map = map;

      // Utils - isNullOrEmpty / getWMSGetCapabilitiesUrl
      return [IDEE.utils.isNullOrEmpty({}),
        IDEE.utils.getWMSGetCapabilitiesUrl('https://www.ign.es/wms-inspire/unidades-administrativas?', '1.1.0', 'xx'),
      ];
    });
    expect.soft(res[0]).toBe(true);
    expect.soft(res[1]).toBe(('https://www.ign.es/wms-inspire/unidades-administrativas?request=GetCapabilities&service=WMS&ticket=xx&version=1.1.0'));

    // Utils - isNumber / isPositiveNumber
    const numberTest = await page.evaluate(() => {
      const list = ['A', -1, 1];
      let checkIsNumber = '';
      list.forEach((item) => {
        if (IDEE.utils.isNumber(item)) {
          if (IDEE.utils.isPositiveNumber(item)) checkIsNumber += `, ${item} es positivo`;
          else checkIsNumber += `, ${item} no es positivo`;
        } else checkIsNumber += `${item} no es un numero`;
      });
      return checkIsNumber;
    });
    expect.soft(numberTest).toBe('A no es un numero, -1 no es positivo, 1 es positivo');

    // Utils - rgbToHex / rgbaToHex / getOpacityFromRgba
    const colorTest = await page.evaluate(() => {
      return [
        IDEE.utils.rgbToHex('rgb(255, 99, 71)'),
        IDEE.utils.rgbaToHex('rgba(255, 99, 71, 0.5)'),
        IDEE.utils.getOpacityFromRgba('rgba(255, 99, 71, 0.5)'),
      ];
    });
    expect.soft(colorTest[0]).toBe('#ff6347');
    expect.soft(colorTest[1]).toBe('#ff634780');
    expect.soft(colorTest[2]).toBe(0.5);

    // Utils - getWMTSCapabilities
    const capabilities = await page.evaluate(() => {
      return IDEE.utils.getWMTSCapabilities('http://www.ign.es/wmts/pnoa-ma?request=GetCapabilities&service=WMTS');
    });
    expect.soft(capabilities).not.toBeNull();
    expect.soft(typeof capabilities).toBe('object');

    // Utils - setEquals
    const setEquals = await page.evaluate(() => {
      const resSetEquals = [];
      resSetEquals[0] = IDEE.utils.setEquals(
        [new IDEE.control.Attributions(), new IDEE.control.Scale()],
        [new IDEE.control.Scale(), new IDEE.control.Attributions()],
      );
      resSetEquals[1] = IDEE.utils.setEquals(
        [new IDEE.control.Attributions(), 5, new IDEE.control.Scale()],
        [new IDEE.control.Scale(), 5, new IDEE.control.Attributions()],
      );
      resSetEquals[2] = IDEE.utils.setEquals([1, 2, 3], [3, 2, 1]);

      resSetEquals[3] = IDEE.utils.setEquals(
        [new IDEE.control.Panzoombar(), new IDEE.control.Scale()],
        [new IDEE.control.Scale(), new IDEE.control.Attributions()],
      );
      resSetEquals[4] = IDEE.utils.setEquals(
        [new IDEE.control.Attributions(), 5, new IDEE.control.Scale()],
        [new IDEE.control.Scale(), 9, new IDEE.control.Attributions()],
      );
      resSetEquals[5] = IDEE.utils.setEquals([1, 2, 3], [3, 2, 7]);
      return resSetEquals;
    });
    expect.soft(setEquals[0]).toBe(true);
    expect.soft(setEquals[1]).toBe(true);
    expect.soft(setEquals[2]).toBe(true);
    expect.soft(setEquals[3]).toBe(false);
    expect.soft(setEquals[4]).toBe(false);
    expect.soft(setEquals[5]).toBe(false);

    // Utils - replaceNode
    await page.evaluate(() => {
      const para = document.createElement('p');
      const node = document.createTextNode('INFORMACIÓN');
      para.appendChild(node);
      const newElement = IDEE.utils.stringToHtml('<p id="elem">NUEVA INFORMACIÓN</p>');
      const body = document.getElementsByTagName('body')[0];
      body.appendChild(para);
      IDEE.utils.replaceNode(newElement, para);
    });
    const textonodo = await page.textContent('body > p');
    expect.soft(textonodo).toBe('NUEVA INFORMACIÓN');

    // Utils - classToggle
    await page.evaluate(() => {
      const elemento = document.getElementById('elem');
      IDEE.utils.classToggle(elemento, 'myclass');
    });
    const listaclases = await page.getAttribute('body > p', 'class');
    expect.soft(listaclases).toContain('myclass'); // comprueba que añade la nueva clase

    await page.evaluate(() => {
      const elemento = document.getElementById('elem');
      IDEE.utils.classToggle(elemento, 'myclass');
    });
    const listaclases2 = await page.getAttribute('body > p', 'class');
    expect.soft(listaclases2).not.toContain('myclass'); // comprueba que elimina la clase ya existente

    // Utils - removeHTML
    await page.evaluate(() => {
      const elemento = document.getElementById('elem');
      IDEE.utils.removeHTML(elemento);
    });
    const eliminado = await page.$('body > p');
    expect.soft(eliminado).toBeNull();

    // Utils - dynamicLegend / getFeaturesExtent / getCentroid
    const legendAndExtentCheck = await page.evaluate(() => {
      const capa = new IDEE.layer.WFS({
        name: 'reservas_biosfera',
        namespace: 'reservas_biosfera',
        legend: 'Reservas biosferas',
        geometry: 'POLYGON',
        url: 'https://www.juntadeandalucia.es/medioambiente/mapwms/REDIAM_WFS_Patrimonio_Natural?',
        version: '1.1.0',
      });

      return new Promise((resolve) => {
        capa.on(IDEE.evt.LOAD, async () => {
          const estilo1 = new IDEE.style.Polygon({
            fill: {
              color: () => {
                return 'black';
              },
            },
            stroke: {
              color: '#FF0000',
              width: 2,
            },
          });

          capa.setStyle(estilo1);

          resolve([
            capa.getLegendURL(),
            IDEE.utils.getFeaturesExtent(capa.getFeatures(), map.getProjection().code),
            IDEE.impl.utils.getCentroid(capa.getFeatures()[0].getImpl().getOLFeature()
              .getGeometry()),
          ]);
        });
        map.addWFS(capa);
      });
    });
    // dynamicLegend
    expect.soft(legendAndExtentCheck[0]).toBe('https://componentes.idee.es/estaticos/imagenes/leyenda/dynamic_legend.png');
    // getFeaturesExtent
    expect.soft(legendAndExtentCheck[1]).toStrictEqual(
      [-788218.6946264381, 4136175.969672982, -207373.0608899173, 4652267.961161624],
    );
    // getCentroid
    expect.soft(legendAndExtentCheck[2]).toStrictEqual([-552149.7463648957, 4398504.551029887]);
  });
});
