import { test, expect } from '@playwright/test';

test.describe('Filter getFeaturesExtent', () => {
  let map;
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      map = IDEE.map({ container: 'map' });
      window.map = map;
    });
  });

  test('Capa vector con filtro aplicado y llamada a getFeaturesExtent', async ({ page }) => {
    await page.evaluate(() => {   
      const vector = new IDEE.layer.Vector({
        name: 'vector',
        legend: 'vector'
      });

      const feature1 = new IDEE.Feature("feature1",{
        "type": "Feature",
        "id": "feat1",
        "geometry": {
          "type": "Point",
          "coordinates": [-755109.7337616489,4513546.579897233]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Huelva"
        }
      });

      const feature2 = new IDEE.Feature("feature2",{
        "type": "Feature",
        "id": "feat2",
        "geometry": {
          "type": "Point",
          "coordinates": [-626839.7183692876,4494672.13548314]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Sevilla"
        }
      });

      const feature3 = new IDEE.Feature("feature3",{
        "type": "Feature",
        "id": "feat3",
        "geometry": {
          "type": "Point",
          "coordinates": [-629552.9778532784,4391241.821996185]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Cádiz"
        }
      });

      const feature4 = new IDEE.Feature("feature4",{
        "type": "Feature",
        "id": "feat4",
        "geometry": {
          "type": "Point",
          "coordinates": [-530220.8856216791,4579384.266469908]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Córdoba"
        }
      });

      const feature5 = new IDEE.Feature("feature5",{
        "type": "Feature",
        "id": "feat5",
        "geometry": {
          "type": "Point",
          "coordinates": [-511620.1124483812,4399437.477561126]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Málaga"
        }
      });

      const feature6 = new IDEE.Feature("feature6",{
        "type": "Feature",
        "id": "feat6",
        "geometry": {
          "type": "Point",
          "coordinates": [-397943.81397533376,4556173.594633493]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Jaén"
        }
      });

      const feature7 = new IDEE.Feature("feature7",{
        "type": "Feature",
        "id": "feat7",
        "geometry": {
          "type": "Point",
          "coordinates": [-381184.81934568693,4466754.181765879]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Granada"
        }
      });

      const feature8 = new IDEE.Feature("feature8",{
        "type": "Feature",
        "id": "feat8",
        "geometry": {
          "type": "Point",
          "coordinates": [-267641.3653886991,4447711.315655752]
        },
        "geometry_name": "geometry",
        "properties": {
          "provincia": "Almería"
        }
      });

      vector.on(IDEE.evt.LOAD, () => {
        let filter = IDEE.filter.OR([IDEE.filter.EQUAL("provincia", "Huelva"),
          IDEE.filter.EQUAL("provincia", "Cádiz"),
          IDEE.filter.EQUAL("provincia", "Granada")]);
        vector.setFilter(filter);
      });

      vector.addFeatures([feature1,feature2,feature3,feature4,feature5,feature6,feature7,feature8]);

      map.addLayers(vector);
      window.vector = vector;
      setTimeout(() => {
        const extension = vector.getFeaturesExtent();
        const result = '-755109.7337616489,4391241.821996185,-381184.81934568693,4513546.579897233';
        expect(extension.toString()).toEqual(result);
      }, 1000);
    });
  });
});
