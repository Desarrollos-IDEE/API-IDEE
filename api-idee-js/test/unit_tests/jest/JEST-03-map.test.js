// import { map as Mmap, config } from 'IDEE/api-idee';
import { map as Mmap } from 'IDEE/api-idee';
import Map from 'IDEE/Map';
// import Panzoombar from 'IDEE/control/Panzoombar';
// import WMC from 'IDEE/layer/WMC';

/**
 * IDEE.Map/IDEE.map test
 *
 * @testsuite
 */
describe('IDEE.map', () => {
  /**
   * Constructor test
   */
  describe('constructor', () => {
    test('Creates a new map', () => {
      const map = Mmap({ container: 'map' });
      expect(map).toBeInstanceOf(Map);
    });
    test('Destroys the map', () => {
      const map = Mmap({ container: 'map' });
      map.on(() => {
        map.destroy();
        expect(map.getMapImpl()).toBeTruthy();
      });
    });

    // /**
    //  * Default controls
    //  */
    // describe('Default controls', () => {
    //   test('There is an array of controls in the map', () => {
    //     const map = Mmap({ container: 'map' });
    //     expect(Array.isArray(map.getControls())).toBeTruthy();
    //   });
    //   test('There is only one control in the map', () => {
    //     const map = Mmap({ container: 'map' });
    //     expect(map.getControls()).toHaveLength(1);
    //   });
    //   test('The control is an instance of IDEE.control.Panzoombar', () => {
    //     const map = Mmap({ container: 'map' });
    //     expect(map.getControls()[0]).toBeInstanceOf(Panzoombar);
    //   });
    // });

    // /**
    //  * Default WMC
    //  */
    // describe('Default WMC', () => {
    //   let map;
    //   beforeAll(() => {
    //     map = Mmap({ container: 'map' });
    //   });
    //   test('There is an array of wmc layers in the map', () => {
    //     expect(Array.isArray(map.getWMC())).toBeTruthy();
    //   });
    //   test('There is only one wmc layer in the map', () => {
    //     expect(map.getWMC()).toHaveLength(1);
    //   });
    //   test('The wmc layer is an instance of IDEE.layer.WMC', () => {
    //     expect(map.getWMC()[0]).toBeInstanceOf(WMC);
    //   });
    //   test('The name of default wmc layer', () => {
    //     expect(map.getWMC()[0].name).toBe(config.predefinedWMC.names[0]);
    //   });
    // });

    // /**
    //  * Param predefined wmcfile
    //  */
    // describe('Param url wmcfile', () => {
    //   let map;
    //   beforeAll(() => {
    //     map = Mmap({ container: 'map', wmcfile: `${config.predefinedWMC.urls[1]}*WMC` });
    //   });
    //   test('There is an array of wmc layers in the map', () => {
    //     expect(Array.isArray(map.getWMC())).toBeTruthy();
    //   });
    //   test('There is only one wmc layer in the map', () => {
    //     expect(map.getWMC()).toHaveLength(1);
    //   });
    //   test('The wmc layer is an instance of IDEE.layer.WMC', () => {
    //     expect(map.getWMC()[0]).toBeInstanceOf(WMC);
    //   });
    //   test('The name of default wmc layer', () => {
    //     expect(map.getWMC()[0].name).toBe('wmc');
    //   });
    // });

    /**
     * Param center
     */
    describe('Param center', () => {
      test('Center array type', () => {
        const map = Mmap({ container: 'map', center: [0, 0] });
        expect(map.getCenter()).toEqual({ x: 0, y: 0 });
      });
      test('Center string type', () => {
        const map = Mmap({ container: 'map', center: '0,0' });
        expect(map.getCenter()).toEqual({ x: 0, y: 0 });
      });
      test('Center object type', () => {
        const map = Mmap({ container: 'map', center: { x: 0, y: 0 } });
        expect(map.getCenter()).toEqual({ x: 0, y: 0 });
      });
      test('Set center array type', () => {
        const map = Mmap({ container: 'map' });
        map.setCenter([0, 0]);
        expect(map.getCenter()).toEqual({ x: 0, y: 0 });
      });
      test('Set center string type', () => {
        const map = Mmap({ container: 'map' });
        map.setCenter('0,0');
        expect(map.getCenter()).toEqual({ x: 0, y: 0 });
      });
      test('Set center object type', () => {
        const map = Mmap({ container: 'map' });
        map.setCenter({ x: 0, y: 0 });
        expect(map.getCenter()).toEqual({ x: 0, y: 0 });
      });
    });
  });
});
