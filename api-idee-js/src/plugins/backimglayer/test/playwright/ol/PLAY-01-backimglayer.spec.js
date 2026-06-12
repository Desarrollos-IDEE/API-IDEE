import { test, expect } from '@playwright/test';

test('Test backimglayer', async ({ page }) => {
  await page.goto('/src/plugins/backimglayer/test/playwright/ol/backimglayer-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.BackImgLayer({
      position: 'TR',
      layerOpts: [
         {
                  id: 'raster',
                  preview: '',
                  title: 'Mapa',
                  layers: [
                    new IDEE.layer.WMTS({
                      url: 'https://www.ign.es/wmts/mapa-raster?',
                      name: 'MTN',
                      legend: 'Mapa',
                      matrixSet: 'GoogleMapsCompatible',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/jpeg',
                    }),
                  ],
                },
                {
                  id: 'imagen',
                  preview: '',
                  title: 'Imagen',
                  layers: [
                    new IDEE.layer.XYZ({
                      url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                      name: 'PNOA-MA',
                      legend: 'Imagen',
                      projection: 'EPSG:3857',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      maxZoom: 19,
                    }),
                    new IDEE.layer.WMTS({
                      url: 'https://www.ign.es/wmts/pnoa-ma?',
                      name: 'OI.OrthoimageCoverage',
                      matrixSet: 'GoogleMapsCompatible',
                      legend: 'Imagen',
                      isBase: false,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/jpeg',
                      minZoom: 19,
                    }),
                  ],
                },
                {
                  id: 'mapa',
                  preview: '',
                  title: 'Callejero',
                  layers: [
                    new IDEE.layer.WMTS({
                      url: 'https://www.ign.es/wmts/ign-base?',
                      name: 'IGNBaseTodo',
                      legend: 'Callejero',
                      matrixSet: 'GoogleMapsCompatible',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/jpeg',
                    }),
                  ],
                },
                {
                  id: 'hibrido',
                  title: 'Híbrido',
                  preview: '',
                  layers: [
                    new IDEE.layer.XYZ({
                      url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
                      name: 'PNOA-MA',
                      legend: 'Imagen',
                      projection: 'EPSG:3857',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      maxZoom: 19,
                    }),
                    new IDEE.layer.WMTS({
                      url: 'https://www.ign.es/wmts/pnoa-ma?',
                      name: 'OI.OrthoimageCoverage',
                      matrixSet: 'GoogleMapsCompatible',
                      legend: 'Imagen',
                      isBase: false,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/jpeg',
                      minZoom: 19,
                    }),
                    new IDEE.layer.WMTS({
                      url: 'https://www.ign.es/wmts/ign-base?',
                      name: 'IGNBaseOrto',
                      matrixSet: 'GoogleMapsCompatible',
                      legend: 'Topónimos',
                      isBase: false,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/png',
                    }),
                  ],
                },
                {
                  id: 'lidar',
                  preview: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/pre_visualizacion/lidar.png`,
                  title: 'LiDAR',
                  layers: [
                    new IDEE.layer.WMTS({
                      url: 'https://wmts-mapa-lidar.idee.es/lidar?',
                      name: 'EL.GridCoverageDSM',
                      legend: 'LiDAR',
                      matrixSet: 'GoogleMapsCompatible',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/png',
                    }),
                  ],
                },
                {
                  id: 'ocupacion-suelo',
                  preview: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/pre_visualizacion/ocupacion_suelo.png`,
                  title: 'Ocupación',
                  layers: [
                    new IDEE.layer.WMTS({
                      url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
                      name: 'LC.LandCoverSurfaces',
                      legend: 'Ocupación',
                      matrixSet: 'GoogleMapsCompatible',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/png',
                    }),
                  ],
                },
                {
                  id: 'historicos',
                  preview: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/pre_visualizacion/historicos.png`,
                  title: 'Históricos',
                  layers: [
                    new IDEE.layer.WMTS({
                      url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
                      name: 'mtn50-edicion1',
                      legend: 'Históricos',
                      matrixSet: 'GoogleMapsCompatible',
                      isBase: true,
                      displayInLayerSwitcher: false,
                      queryable: false,
                      visible: true,
                      format: 'image/jpeg',
                    }),
                  ],
                },
      ],
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
