import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

['vector', 'raster', 'mixed'].forEach((kind) => {
  ['legacy', 'parameters', 'url'].forEach((signature) => {
    test(`GeoPackage ${kind}: constructor ${signature}`, async ({ page }) => {
      const result = await page.evaluate(async ({ fixture, form }) => {
        const url = `/fixtures/geopackage/${fixture}.gpkg`;
        const input = form === 'url' ? { url, name: 'sample', legend: 'Ejemplo' }
          : await window.fetch(url);
        const gpkg = new IDEE.layer.GeoPackage(form === 'parameters'
          ? { source: input, name: 'sample', legend: 'Ejemplo' } : input);
        const loaded = new Promise((resolve) => {
          gpkg.once(IDEE.evt.LOAD_LAYERS, resolve);
        });
        gpkg.addTo(null, false);
        const layers = await loaded;
        return {
          tables: Object.keys(layers).sort(),
          types: gpkg.getLayers().map((layer) => layer.type).sort(),
          name: gpkg.name,
          legend: gpkg.legend,
        };
      }, { fixture: kind, form: signature });
      expect(result.tables).toEqual(kind === 'mixed' ? ['imagery', 'places'] : [kind === 'vector' ? 'places' : 'imagery']);
      expect(result.types).toEqual(kind === 'mixed' ? ['GeoJSON', 'GeoPackageTile'] : [kind === 'vector' ? 'GeoJSON' : 'GeoPackageTile']);
      if (signature !== 'legacy') {
        expect(result.name).toBe('sample');
        expect(result.legend).toBe('Ejemplo');
      }
    });
  });
});

['file', 'response', 'buffer', 'bytes', 'view'].forEach((kind) => {
  test(`GeoPackage: fuente binaria ${kind}`, async ({ page }) => {
    const tables = await page.evaluate(async (inputType) => {
      const response = await window.fetch('/fixtures/geopackage/vector.gpkg');
      const buffer = await response.arrayBuffer();
      let source;
      if (inputType === 'file') source = new File([buffer], 'sample.gpkg');
      if (inputType === 'response') source = new Response(buffer);
      if (inputType === 'buffer') source = buffer;
      if (inputType === 'bytes') source = new Uint8Array(buffer);
      if (inputType === 'view') {
        const padded = new Uint8Array(buffer.byteLength + 16);
        padded.set(new Uint8Array(buffer), 8);
        source = padded.subarray(8, 8 + buffer.byteLength);
      }
      const connector = new IDEE.GeoPackageConnector(source);
      const providers = await connector.getVectorProviders();
      return providers.map((provider) => provider.getTableName());
    }, kind);
    expect(tables).toEqual(['places']);
  });
});

test('GeoPackage: errores de entrada y descarga rechazan la inicialización', async ({ page }) => {
  await page.route('**/missing.gpkg', (route) => route.fulfill({ status: 404, body: 'Not found' }));
  const errors = await page.evaluate(async () => {
    const badFile = new File(['invalid'], 'bad.gpkg');
    badFile.arrayBuffer = () => Promise.reject(new Error('read failed'));
    const inputs = [
      {}, { source: new Uint8Array([1]), url: '/missing.gpkg' },
      { url: '' }, { url: '/missing.gpkg' }, { source: null },
      'unsupported', new Uint8Array(), new Uint8Array([1, 2, 3]), badFile,
    ];
    return Promise.all(inputs.map(async (source) => {
      try {
        await new IDEE.GeoPackageConnector(source).getVectorProviders();
        return null;
      } catch (error) {
        return String(error);
      }
    }));
  });
  expect(errors).toHaveLength(9);
  errors.forEach((error) => expect(error).toBeTruthy());
  expect(errors[3]).toContain('404');
  expect(errors[8]).toContain('read failed');
});
