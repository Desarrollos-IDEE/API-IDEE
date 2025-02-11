import { map as Mmap } from 'IDEE/api-idee';
import Vector from 'IDEE/layer/Vector';
import Layer from 'IDEE/layer/Layer';

/**
 * Vector layer test
 *
 * @testsuite
 */
describe('IDEE.layer.Vector', () => {
  describe('constructor', () => {
    test('Creates a new IDEE.layer.Vector', () => {
      const map = Mmap({ container: 'map' });
      const vector = new Vector({});
      map.addLayers(vector);
      expect(vector).toBeInstanceOf(Vector);
      expect(vector).toBeInstanceOf(Layer);
    });
    test('Name parameter is correct', () => {
      const vector = new Vector({ name: 'layer_vector' });
      expect(vector.name).toEqual('layer_vector');
    });
  });
});
