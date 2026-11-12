import { test, expect } from '@playwright/test';
import { LoadStrategy, PackageAccess } from '../../../src/facade/js/datasource/contracts';
import FullLoadStrategy from '../../../src/facade/js/datasource/strategy/FullLoadStrategy';
import BBoxLoadStrategy from '../../../src/facade/js/datasource/strategy/BBoxLoadStrategy';
import {
  LoadStrategyRegistry, createDefaultStrategies, getTableStrategyName, getAccessName,
  createDefaultAccess, LOAD_STRATEGY_NAMES,
} from '../../../src/facade/js/datasource/geopackage/strategies';
import RangeAccess from '../../../src/facade/js/datasource/geopackage/RangeAccess';
import DownloadAccess from '../../../src/facade/js/datasource/geopackage/DownloadAccess';

const createProvider = (id) => {
  const calls = [];
  return {
    calls,
    prepareForBoundingBox: () => {
      calls.push('prepare');
      return Promise.resolve(true);
    },
    getGeoJSON: () => {
      calls.push('all');
      return { id, features: ['all'] };
    },
    getEmptyGeoJSON: () => ({ id, features: [] }),
    getGeoJSONByBoundingBox: (extent, projection) => {
      calls.push(['bbox', extent, projection]);
      return { id, features: ['bbox'] };
    },
  };
};

test('estrategias: carga completa', async () => {
  const strategy = new FullLoadStrategy();
  const provider = createProvider('p');

  expect(strategy).toBeInstanceOf(LoadStrategy);
  expect(strategy.prepare(provider)).toBeUndefined();
  expect(strategy.getInitialSource(provider)).toEqual({ id: 'p', features: ['all'] });
  expect(strategy.getLoaders(() => provider)).toEqual({});
  expect(await strategy.refresh(provider, [0, 0, 1, 1], 'EPSG:3857'))
    .toEqual({ id: 'p', features: ['all'] });
  expect(provider.calls).toEqual(['all', 'all']);
});

test('estrategias: carga por extensión con el proveedor vigente', async () => {
  const strategy = new BBoxLoadStrategy();
  const first = createProvider('first');
  const second = createProvider('second');
  let current = first;

  expect(strategy).toBeInstanceOf(LoadStrategy);
  expect(await strategy.prepare(first)).toBe(true);
  expect(strategy.getInitialSource(first)).toEqual({ id: 'first', features: [] });
  const { bboxLoader, fullLoader } = strategy.getLoaders(() => current);
  expect(bboxLoader([0, 0, 1, 1], 'EPSG:3857').id).toBe('first');
  current = second;
  expect(bboxLoader([0, 0, 1, 1], 'EPSG:3857').id).toBe('second');
  expect(fullLoader().features).toEqual(['all']);
  expect(second.calls).toEqual([['bbox', [0, 0, 1, 1], 'EPSG:3857'], 'all']);
});

test('estrategias: la recarga por extensión prepara el índice nuevo y sin extensión lo carga todo', async () => {
  const strategy = new BBoxLoadStrategy();
  const provider = createProvider('p');

  expect((await strategy.refresh(provider, [1, 2, 3, 4], 'EPSG:4326')).features).toEqual(['bbox']);
  expect((await strategy.refresh(provider)).features).toEqual(['all']);
  expect(provider.calls).toEqual(['prepare', ['bbox', [1, 2, 3, 4], 'EPSG:4326'], 'all']);
});

test('estrategias: registro predeterminado y extensible', () => {
  const registry = createDefaultStrategies();
  class CustomStrategy extends FullLoadStrategy {}
  const custom = new CustomStrategy();

  expect(registry.get('full')).toBeInstanceOf(FullLoadStrategy);
  expect(registry.get('bbox')).toBeInstanceOf(BBoxLoadStrategy);
  expect(() => registry.get('range')).toThrow('estrategia de carga desconocida (range)');
  expect(registry.register('custom', custom)).toBe(registry);
  expect(registry.get('custom')).toBe(custom);
  expect(new LoadStrategyRegistry().register('a', custom).get('a')).toBe(custom);
});

test('estrategias: la tabla elige la carga por extensión con tiled', () => {
  expect(getTableStrategyName({ tiled: true })).toBe('bbox');
  expect(getTableStrategyName({ tiled: 'true' })).toBe('full');
  expect(getTableStrategyName({})).toBe('full');
});

test('estrategias: loadStrategy decide el acceso y la carga por defecto de las tablas', () => {
  expect(LOAD_STRATEGY_NAMES).toEqual(['full', 'bbox', 'range']);
  expect(['full', 'bbox', 'range'].map((name) => getTableStrategyName({}, name)))
    .toEqual(['full', 'bbox', 'bbox']);
  expect(getTableStrategyName({ tiled: false }, 'range')).toBe('full');
  expect(getTableStrategyName({ tiled: true }, 'full')).toBe('bbox');
  expect(['full', 'bbox', 'range', undefined].map(getAccessName))
    .toEqual(['download', 'download', 'range', 'download']);
  expect(createDefaultAccess('download')).toBeInstanceOf(DownloadAccess);
  expect(createDefaultAccess('range', { blockSize: 8192 })).toBeInstanceOf(RangeAccess);
});

test('acceso por descarga: crea el lector inyectado con el origen y las opciones', () => {
  class FakeReader {
    constructor(source, options) {
      this.source = source;
      this.options = options;
    }
  }
  const access = new DownloadAccess({ Reader: FakeReader });
  const reader = access.createReader({ url: '/a.gpkg' }, { tile: {} });

  expect(access).toBeInstanceOf(PackageAccess);
  expect(reader).toBeInstanceOf(FakeReader);
  expect(reader.source).toEqual({ url: '/a.gpkg' });
  expect(reader.options).toEqual({ tile: {} });
});
