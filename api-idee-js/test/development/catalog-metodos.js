import { map as Mmap } from 'IDEE/api-idee';
import Catalog from 'IDEE/stac/Catalog';
import GeoJSON from 'IDEE/layer/GeoJSON';
import GeoTIFF from 'IDEE/layer/GeoTIFF';

// DUDAS:
// - En caso de no indicar title, estamos poniendo por defecto: 
// new URL('https://earth-search.aws.element84.com/v1').hostname => 
// 'earth-search.aws.element84.com'

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:4326',
});
window.mapa = mapa;


// Ejemplo de catálogo público
const catalog = new Catalog({
  url: 'https://earth-search.aws.element84.com/v1',
  title: 'earth-search.aws.element84.com',
});
window.catalog = catalog;

// autenticación del usuario
// const catalog = new Catalog({
//   url: 'https://earth-search.aws.element84.com/v1',
//   title: 'earth-search.aws.element84.com',
//   authUrl: 'https://gneis.desarrollo.guadaltel.es/o/custom-auth/token',
//   public: false,
// });

// catalog.authenticate('test@liferay.com', 'testt').then(() => {
//   console.log('Autenticación exitosa');
// }).catch((error) => {
//   console.error('Error al autenticar', error);
// });

// obtener las colecciones
// catalog.getCollections().then((collections) => {
//   console.log('Colecciones', collections);
// }).catch((error) => {
//   console.error('Error al obtener las colecciones', error);
// });

// obtener los items de una colección
catalog.getItems('sentinel-2-pre-c1-l2a', 5).then((items) => {
  console.log('Items', items);
  drawResult(items);
}).catch((error) => {
  console.error('Error al obtener los items', error);
});

// obtener un item concreto de una colección
// catalog.getItem('sentinel-2-pre-c1-l2a', 'S2B_T21NYC_20221205T140704_L2A').then((item) => {
//   console.log('Item', item);
//   drawResult(item);
// }).catch((error) => {
//   console.error('Error al obtener el item', error);
// });

// obtener los campos queryables de una colección
// catalog.getQueryableFields('sentinel-2-pre-c1-l2a').then((fields) => {
//   console.log('Campos queryables', fields);
// }).catch((error) => {
//   console.error('Error al obtener los campos queryables', error);
// });

// filtrar items de una colección
// catalog.getFilteredItems('sentinel-2-pre-c1-l2a', {
//   limit: 5,
//   bbox: [-23.495322, 34.521357, 18.692177, 45.441767],
//   ids: ['S2A_T29SMA_20221205T112439_L2A', 'S2A_T29SNA_20221205T112439_L2A', 'S2A_T29SPA_20221205T112439_L2A'],
//   datetime: '2022-12-05T11:31:16.835000Z',
// }).then((res) => {
//   console.log('Res', res);
//   drawResult(res);
// }).catch((error) => {
//   console.error('Error al obtener los items', error);
// });

// filtrar items de una colección mediante filtros avanzados
// catalog.getFilteredItemsAdvanced('sentinel-2-pre-c1-l2a', {
//   format: 'stac-query', 
//   filter: {
//     'eo:cloud_cover': { lte: 2 },
//   },
//   limit: 10,
// }, [-7.800346841312638, 33.47532371110385, 5.311399404533769, 36.29571496086144],
// '2022-12-04T11:11:26.067000Z/2024-05-03T00:38:41.546Z').then((items) => {
//   console.log('Items', items);
//   drawResult(items);
// }).catch((error) => {W
//   console.error('Error al obtener los items', error);
// });

// método auxiliar para obtener los items de una colección
// catalog.getItemsByLinks([{
//   "rel": "next",
//   "title": "Next page of Items",
//   "method": "GET",
//   "type": "application/geo+json",
//   "href": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-pre-c1-l2a/items?collections=sentinel-2-pre-c1-l2a&limit=5&next=2022-12-05T14%3A11%3A35.344000Z%2CS2B_T21NZD_20221205T140704_L2A%2Csentinel-2-pre-c1-l2a"
//   }], 'next').then((items) => {
//     console.log('Items', items);
//     drawResult(items);
//   }).catch((error) => {
//     console.error('Error al obtener los items', error);
//   });

// método auxiliar para obtener los items de una colección mediante filtros avanzados
// catalog.getFilteredItemsAdvancedByUrl('https://earth-search.aws.element84.com/v1/search', {
//   "limit": 10,
//   "collections": [
//       "sentinel-2-pre-c1-l2a"
//   ],
//   "bbox": [
//       -7.800346841312638,
//       33.47532371110385,
//       5.311399404533769,
//       36.29571496086144
//   ],
//   "datetime": "2022-12-04T11:11:26.067000Z/2024-05-03T00:38:41.546Z",
//   "query": {
//       "eo:cloud_cover": {
//           "lte": 2
//       }
//   }
// }, 'Error al obtener los ítems filtrados avanzados del catálogo.').then((items) => {
//   console.log('Items', items);
//   drawResult(items);
// }).catch((error) => {
//   console.error('Error al obtener los items', error);
// });

// método auxiliar para obtener los items de una colección mediante filtros avanzados mediante links
// catalog.getFilteredItemsAdvancedByLinks([{
//   "rel": "next",
//   "title": "Next page of Items",
//   "method": "POST",
//   "type": "application/geo+json",
//   "href": "https://earth-search.aws.element84.com/v1/search",
//   "merge": false,
//   "body": {
//       "datetime": "2022-12-04T11:11:26.067000Z/2024-05-03T00:38:41.546Z",
//       "query": {
//           "eo:cloud_cover": {
//               "lte": 2
//           }
//       },
//       "collections": [
//           "sentinel-2-pre-c1-l2a"
//       ],
//       "bbox": [
//           -7.800346841312638,
//           33.47532371110385,
//           5.311399404533769,
//           36.29571496086144
//       ],
//       "limit": 10,
//       "next": "2022-12-04T11:11:26.067000Z,S2B_T30SWD_20221204T110332_L2A,sentinel-2-pre-c1-l2a"
//   }
// }], 'next').then((items) => {
//   console.log('Items', items);
//   drawResult(items);
// }).catch((error) => {
//   console.error('Error al obtener los items', error);
// }); 

// método auxiliar para montar el cuerpo de la petición para obtener los items de una colección mediante filtros avanzados
// console.log(catalog.getFilterData('sentinel-2-pre-c1-l2a', {
//   "format": "stac-query",
//   "filter": {
//       "eo:cloud_cover": {
//           "lte": 2
//       }
//   },
//   "limit": 10
// }, [-7.800346841312638, 33.47532371110385, 5.311399404533769, 36.29571496086144],
// '2022-12-04T11:11:26.067000Z/2024-05-03T00:38:41.546Z'));


// // #################################


const drawResult = (items) => {
  const geojson = new GeoJSON({source: items});
  geojson.on('load', () => {
    mapa.setBbox(geojson.getFeaturesExtent());
  });
  mapa.addLayers(geojson);
  const features = items.features || [items];
  const tiffs = [];
  for (let feature of features) {
    const assets = feature.assets;
    const tiffsKeys = Object.keys(assets);  
    for (let key of tiffsKeys) {
      const type = assets[key].type;
      if (type.includes('image/tif')) {
        const geotiff = new GeoTIFF({url: assets[key].href}, {nodata: 0});
        tiffs.push(geotiff);
      }
    }
  }
  mapa.addLayers(tiffs);
};