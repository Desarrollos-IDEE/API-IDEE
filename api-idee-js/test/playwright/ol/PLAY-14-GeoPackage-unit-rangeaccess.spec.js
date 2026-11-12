import { test, expect } from '@playwright/test';
import { PackageAccess, PackageReader } from '../../../src/facade/js/datasource/contracts';
import RangeAccess from '../../../src/facade/js/datasource/geopackage/RangeAccess';
import { RangeUnsupportedError } from '../../../src/facade/js/datasource/geopackage/errors';
import { getValue } from '../../../src/facade/js/i18n/language';

const createSetup = ({ ranges = true, body = null, packageError = null, readError = null } = {}) => {
  const log = [];
  const fallback = {
    createReader: (source, options) => {
      log.push(['fallback', source, options]);
      return {
        getVectorProviders: () => Promise.resolve(['download']),
        getTileProviders: () => Promise.resolve([]),
        getMetadata: () => Promise.resolve({ mode: 'download' }),
        dispose: () => log.push(['dispose-download']),
      };
    },
  };
  const access = new RangeAccess({ blockSize: 8192 }, {
    fallback,
    isRemoteURL: (url) => url.startsWith('http'),
    createSource: (url, options) => {
      log.push(['source', url, options]);
      return {
        read: () => (readError ? Promise.reject(readError) : Promise.resolve(new Uint8Array(100))),
        isRangeSupported: () => ranges,
        getFullBody: () => body,
      };
    },
    createPackage: (source, options) => {
      log.push(['package', options]);
      const failure = packageError ? Promise.reject(packageError) : null;
      failure?.catch(() => undefined);
      return {
        getVectorProviders: () => failure || Promise.resolve(['range']),
        getTileProviders: () => failure || Promise.resolve([]),
        getMetadata: () => failure || Promise.resolve({ mode: 'range' }),
        dispose: () => log.push(['dispose-range']),
      };
    },
    warn: (message) => log.push(['warn', message]),
  });
  return { access, log };
};

test('acceso por rangos: orígenes binarios o no remotos usan la descarga', async () => {
  const { access, log } = createSetup();
  const bytes = new Uint8Array(1);

  expect(access).toBeInstanceOf(PackageAccess);
  await access.createReader({ source: bytes }, {}).getMetadata();
  await access.createReader({ url: 'blob:local' }, {}).getMetadata();
  expect(log.map(([kind, source]) => [kind, source])).toEqual([
    ['fallback', { source: bytes }], ['fallback', { url: 'blob:local' }],
  ]);
});

test('acceso por rangos: un servidor con rangos lee el paquete por rangos', async () => {
  const { access, log } = createSetup();
  const reader = access.createReader({ url: 'https://a/b.gpkg' }, { vector: {} });

  expect(reader).toBeInstanceOf(PackageReader);
  expect(await reader.getVectorProviders()).toEqual(['range']);
  expect(await reader.isRangeReading()).toBe(false);
  expect(log.slice(0, 2)).toEqual([
    ['source', 'https://a/b.gpkg', { blockSize: 8192 }], ['package', { vector: {} }],
  ]);
});

test('acceso por rangos: si el servidor envía el fichero completo se reutiliza', async () => {
  const body = new Uint8Array(10);
  const { access, log } = createSetup({ ranges: false, body });

  expect(await access.createReader({ url: 'https://a/b.gpkg' }, {}).getMetadata())
    .toEqual({ mode: 'download' });
  expect(log.find(([kind]) => kind === 'fallback')[1]).toEqual({ source: body });
  expect(log.some(([kind]) => kind === 'package' || kind === 'warn')).toBe(false);
});

test('acceso por rangos: contenido no admitido o error de red descargan el fichero', async () => {
  const unsupported = createSetup({ packageError: new RangeUnsupportedError('curvas') });
  expect(await unsupported.access.createReader({ url: 'https://a/b.gpkg' }, {}).getMetadata())
    .toEqual({ mode: 'download' });
  expect(unsupported.log.filter(([kind]) => kind === 'warn' || kind === 'fallback')
    .map(([kind, value]) => [kind, value])).toEqual([
    ['warn', getValue('exception').geopackage_range_fallback],
    ['fallback', { url: 'https://a/b.gpkg' }],
  ]);

  const network = createSetup({ readError: getValue('exception').geopackage_range_network });
  expect(await network.access.createReader({ url: 'https://a/b.gpkg' }, {}).getMetadata())
    .toEqual({ mode: 'download' });
});

test('acceso por rangos: los errores HTTP no se ocultan con la descarga', async () => {
  const error = `${getValue('exception').geopackage_response} (404)`;
  const { access, log } = createSetup({ readError: error });

  await expect(access.createReader({ url: 'https://a/b.gpkg' }, {}).getMetadata()).rejects.toBe(error);
  expect(log.some(([kind]) => kind === 'fallback')).toBe(false);
});
