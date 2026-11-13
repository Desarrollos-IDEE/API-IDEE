import { test, expect } from '@playwright/test';
import {
  ByteSource, SourceReader, PackageDatabase, GeometryLinearizer, PackageReader, PackageAccess,
  LoadStrategy, LayerSerializer,
} from '../../../src/facade/js/datasource/contracts';

const CONTRACTS = {
  ByteSource: [ByteSource, ['read']],
  SourceReader: [SourceReader, ['canRead', 'read']],
  PackageDatabase: [PackageDatabase, ['open', 'close']],
  GeometryLinearizer: [GeometryLinearizer, ['linearize']],
  PackageReader: [PackageReader, ['getVectorProviders', 'getTileProviders', 'getMetadata', 'dispose']],
  PackageAccess: [PackageAccess, ['createReader']],
  LoadStrategy: [LoadStrategy, ['prepare', 'getInitialSource', 'getLoaders', 'refresh']],
  LayerSerializer: [LayerSerializer, ['toJSON', 'getRestLayer']],
};

Object.entries(CONTRACTS).forEach(([name, [Contract, methods]]) => {
  test(`contratos: ${name} es abstracto y sus métodos sin implementar lanzan`, () => {
    expect(() => new Contract()).toThrow(`${name}: clase abstracta`);
    class Incomplete extends Contract {}
    const instance = new Incomplete();
    methods.forEach((method) => {
      expect(() => instance[method]()).toThrow(`${name}.${method}`);
    });
  });
});

test('contratos: una implementación sustituye los métodos abstractos', async () => {
  class MemoryBytes extends ByteSource {
    constructor(bytes) {
      super();
      this.bytes = bytes;
    }

    read(offset, length) {
      return Promise.resolve(this.bytes.subarray(offset, offset + length));
    }
  }
  const source = new MemoryBytes(Uint8Array.from([1, 2, 3, 4]));
  expect(source).toBeInstanceOf(ByteSource);
  expect(Array.from(await source.read(1, 2))).toEqual([2, 3]);
  expect(source.dispose()).toBeUndefined();
});
