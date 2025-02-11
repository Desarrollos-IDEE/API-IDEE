import createMap from './map';

/**
 * MaxExtent WMS layers test
 *
 * @testsuite
 */
describe('CP-101 Gestión del MaxExtent', () => {
  let mapjs;
  beforeAll(async () => {
    jest.setTimeout(10000);
    mapjs = await createMap({
      container: 'map',
      layers: [
        'WMS*Municipios*http://www.ideandalucia.es/wms/dea100_divisiones_administrativas?*terminos_municipales*false*true',
        'WMS*Mapa*http://www.ideandalucia.es/services/andalucia/wms?*00_Mapa_Andalucia*true*false',
      ],
    });
  });

  describe('Cálculo maxExtent con dos WMS', () => {
    test('Tiene zoom 3', () => {
      const zoom = mapjs.getZoom();
      expect(zoom).toBe(3);
    });
  });
});
