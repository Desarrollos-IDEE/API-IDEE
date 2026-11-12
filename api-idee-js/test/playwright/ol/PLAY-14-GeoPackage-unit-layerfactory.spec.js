import { test, expect } from '@playwright/test';
import GeoPackageLayerFactory from '../../../src/facade/js/datasource/geopackage/LayerFactory';

class FakeLayer {
  constructor(parameters, options) {
    this.parameters = parameters;
    this.options = options;
  }
}

test('factoría de capas: crea la capa vectorial con fuente, recarga y cargadores', () => {
  const factory = new GeoPackageLayerFactory({ VectorLayer: FakeLayer, TileLayer: FakeLayer });
  const source = { type: 'FeatureCollection', features: [] };
  const refreshLoader = () => undefined;
  const bboxLoader = () => source;
  const options = { name: 'pkg:places', style: { point: { radius: 2 } } };

  const layer = factory.createVectorLayer(options, source, refreshLoader, { bboxLoader });

  expect(layer).toBeInstanceOf(FakeLayer);
  expect(layer.parameters).toEqual({
    name: 'pkg:places', style: { point: { radius: 2 } }, source, refreshLoader, bboxLoader,
  });
  expect(layer.parameters.source).toBe(source);
  expect(layer.options).toEqual(options);
  expect(layer.options).not.toBe(options);
  expect(layer.options.style).not.toBe(options.style);
  expect(factory.createVectorLayer(options, source, refreshLoader).parameters.bboxLoader)
    .toBeUndefined();
});

test('factoría de capas: crea la capa de teselas con su proveedor', () => {
  class FakeTile extends FakeLayer {}
  const factory = new GeoPackageLayerFactory({ VectorLayer: FakeLayer, TileLayer: FakeTile });
  const provider = { getTableName: () => 'imagery' };
  const refreshLoader = () => undefined;

  const layer = factory.createTileLayer({ name: 'pkg:imagery' }, provider, refreshLoader);

  expect(layer).toBeInstanceOf(FakeTile);
  expect(layer.parameters).toEqual({ name: 'pkg:imagery', refreshLoader });
  expect(layer.options).toBe(provider);
});
