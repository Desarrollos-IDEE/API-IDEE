import { test, expect } from '@playwright/test';
import { isDataFileUrl, isCollectionsPath } from '../../../src/facade/js/ogcapi/ogcapiurl';

test('URL de ficheros de datos: no se buscan servicios OGC API en ellas', () => {
  [
    'https://datos.example.org/capas/zonas.geojson',
    'https://datos.example.org/capas/zonas.geojson?version=2',
    'http://localhost:8081/test/playwright/fixtures/kmz/basic.kml',
    'https://datos.example.org/capas/datos.json',
    'https://datos.example.org/capas/datos.KMZ',
    '/capas/rutas.gpx',
    '/capas/edificios.gml',
    '/capas/shape.zip',
    '/capas/paquete.GPKG',
    '/raster/mdt.tif',
    '/raster/mdt.tiff#vista',
  ].forEach((url) => expect(isDataFileUrl(url), url).toBe(true));
});

test('URL de servicios: se siguen detectando como posibles servicios', () => {
  [
    'https://demo.example.org/ogcapi',
    'https://demo.example.org/ogcapi/',
    'https://api-features.idee.es/collections',
    'https://api-features.idee.es/collections/falls/items',
    'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx',
    'https://www.ign.es/wms-inspire/unidades-administrativas?service=WMS&request=GetCapabilities',
    'https://mapas.example.org/cgi-bin/mapserv.cgi?map=/datos/zonas.map',
    '',
    undefined,
  ].forEach((url) => expect(isDataFileUrl(url), String(url)).toBe(false));
  expect(isCollectionsPath('https://api-features.idee.es/collections')).toBe(true);
});
