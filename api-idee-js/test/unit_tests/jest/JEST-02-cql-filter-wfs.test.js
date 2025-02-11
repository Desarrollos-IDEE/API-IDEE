import WFS from 'IDEE/layer/WFS';
import { LOAD } from 'IDEE/event/eventtype';
import { map as Mmap, proxy } from 'IDEE/api-idee';
// import createMap from './map';

/**
 * CQL Filter test
 *
 * @testsuite
 */
describe('CP-103 Capa WFS y filtro CQL', () => {
  let mapjs;
  let gridWFS;
  beforeAll(() => {
    proxy(false);
    mapjs = Mmap({ container: 'map' });
    gridWFS = new WFS({
      namespace: 'gonce',
      name: 'a1666093351106_colegios',
      url: 'https://demos.guadaltel.es/geoserver/gonce/ows?',
      legend: 'Colegios',
      cql: "MUNICIPIO LIKE '%Granada%'",
    });
    mapjs.addWFS(gridWFS);
  });

  describe('Añadimos capa WFS con filtro CQL por municipio', () => {
    test('Todos los features cumplen el filtro cql', () => {
      jest.setTimeout(5000);
      gridWFS.once(LOAD, () => {
        const features = gridWFS.getFeatures();
        expect(features.every((f) => /.*Granada.*/.test(f.getAttribute('MUNICIPIO')))).toBeTruthy();
      });
    });
  });

  // describe('Cambiamos el filtro CQL por otro', () => {
  //   test('Todos los features cumplen el filtro cql', () => {
  //     gridWFS.setCQL("MUNICIPIO LIKE '%Sevilla%'");
  //     jest.setTimeout(5000);
  //     gridWFS.once(LOAD, () => {
  //       const features = gridWFS.getFeatures();
  //       expect(features.every((f) =>
  // f.getAttribute('MUNICIPIO').indexOf('Sevilla') !== -1)).toBeTruthy();
  //     });
  //   });
  // });
});
