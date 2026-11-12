import { test, expect } from '@playwright/test';
import GeoPackageRefreshCoordinator from '../../../src/facade/js/datasource/geopackage/RefreshCoordinator';

const createReader = (id) => ({
  id,
  disposed: 0,
  getVectorProviders: () => Promise.resolve([`${id}:vector`]),
  getTileProviders: () => Promise.resolve([`${id}:tile`]),
  getMetadata: () => Promise.resolve({ id }),
  dispose() {
    this.disposed += 1;
  },
});

const setup = () => {
  const created = [];
  const initial = createReader('initial');
  const coordinator = new GeoPackageRefreshCoordinator({
    createReader: () => {
      const reader = createReader(`r${created.length + 1}`);
      created.push(reader);
      return reader;
    },
  });
  coordinator.register(['places', 'imagery'], initial);
  return { coordinator, created, initial };
};

const always = () => true;
const apply = () => Promise.resolve(true);

test('recargas: las tablas que se recargan a la vez comparten una sola lectura', async () => {
  const { coordinator, created, initial } = setup();
  const received = [];
  const update = (data) => {
    received.push(data);
    return Promise.resolve(true);
  };

  await Promise.all([
    coordinator.refresh('places', always, update),
    coordinator.refresh('imagery', always, update),
  ]);

  expect(created.map(({ id }) => id)).toEqual(['r1']);
  expect(received).toEqual([
    { vectors: ['r1:vector'], tiles: ['r1:tile'], metadata: { id: 'r1' } },
    { vectors: ['r1:vector'], tiles: ['r1:tile'], metadata: { id: 'r1' } },
  ]);
  expect(initial.disposed).toBe(1);
  expect(created[0].disposed).toBe(0);
  expect(coordinator.getCurrentReader()).toBe(created[0]);
});

test('recargas: una tabla atrasada reutiliza la última lectura sin descargar de nuevo', async () => {
  const { coordinator, created, initial } = setup();

  await coordinator.refresh('places', always, apply);
  expect(initial.disposed).toBe(0);
  await coordinator.refresh('imagery', always, apply);

  expect(created.map(({ id }) => id)).toEqual(['r1']);
  expect(initial.disposed).toBe(1);

  await coordinator.refresh('places', always, apply);
  expect(created.map(({ id }) => id)).toEqual(['r1', 'r2']);
  expect(created[0].disposed).toBe(0);
});

test('recargas: una recarga no vigente o no aplicada no cambia el lector de la tabla', async () => {
  const { coordinator, created, initial } = setup();
  let updates = 0;

  await coordinator.refresh('places', () => false, () => {
    updates += 1;
    return Promise.resolve(true);
  });
  expect(updates).toBe(0);
  expect(created[0].disposed).toBe(1);
  expect(coordinator.getCurrentReader()).toBe(initial);

  await coordinator.refresh('places', always, () => Promise.resolve(false));
  expect(created[1].disposed).toBe(1);
  expect(initial.disposed).toBe(0);
  expect(coordinator.getCurrentReader()).toBe(initial);
});

test('recargas: un error se propaga y libera la lectura', async () => {
  const { coordinator, created } = setup();

  await expect(coordinator.refresh('places', always, () => Promise.reject(new Error('esquema'))))
    .rejects.toThrow('esquema');
  expect(created[0].disposed).toBe(1);

  await coordinator.refresh('places', always, apply);
  expect(created.map(({ id }) => id)).toEqual(['r1', 'r2']);
});

test('recargas: sin tablas, el lector vigente es el inicial', () => {
  const coordinator = new GeoPackageRefreshCoordinator({ createReader: () => null });
  const initial = createReader('initial');
  coordinator.register([], initial);
  expect(coordinator.getCurrentReader()).toBe(initial);
});
