import { map as Mmap } from 'IDEE/api-idee';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
// import GeoTIFF from 'ol/source/GeoTIFF';
// import TileLayer from 'ol/layer/Tile.js';

const geotiff = new GeoTIFF({
  url: 'https://ss3.scayle.es/libre/PVA/Mosaicos_nacionales_Sentinels/Mosaico_Sentinel-2/2026_invierno/02_Peninsula/pnt_sentinel2_2026_invierno_mosaico_peninsula_illes-balears_75%25b4-3-2_25%25b11-8-4_hu30_8bits_cog.tif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ewogICAgIlJHV19UT0tFTiI6IHsKICAgICAgICAidmVyc2lvbiI6IDEsCiAgICAgICAgInR5cGUiOiAiYWQiLAogICAgICAgICJpZCI6ICJndWFkYWx0ZWxfcDUyMF8xXzEiLAogICAgICAgICJrZXkiOiAiQW5hX05vdmllbWJyZV8yMDIyLiIKICAgIH0KfQo=/20260915/us-east-1/s3/aws4_request&X-Amz-Date=20260915T093331Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=29f2233cfae074f9771c6cb2e932e13490dc4e5effc46ecfe66dcdd8c8bf59e1',
  // isBase: true
});

// const source = new GeoTIFF({
//   sources: [
//     {
//       url: 'https://ss3.scayle.es/libre/PVA/Mosaicos_nacionales_Sentinels/Mosaico_Sentinel-2/2026_invierno/02_Peninsula/pnt_sentinel2_2026_invierno_mosaico_peninsula_illes-balears_75%25b4-3-2_25%25b11-8-4_hu30_8bits_cog.tif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ewogICAgIlJHV19UT0tFTiI6IHsKICAgICAgICAidmVyc2lvbiI6IDEsCiAgICAgICAgInR5cGUiOiAiYWQiLAogICAgICAgICJpZCI6ICJndWFkYWx0ZWxfcDUyMF8xXzEiLAogICAgICAgICJrZXkiOiAiQW5hX05vdmllbWJyZV8yMDIyLiIKICAgIH0KfQo=/20260915/us-east-1/s3/aws4_request&X-Amz-Date=20260915T093331Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=29f2233cfae074f9771c6cb2e932e13490dc4e5effc46ecfe66dcdd8c8bf59e1',
//       nodata: 0
//     },
//   ],
// });

// const tile = new TileLayer({
//   source: source,
// });

const mapjs = Mmap({
  container: 'map',
  controls: ['scale*1'],
  // layers: [geotiff],
  // projection: 'EPSG:25830',
});
window.mapjs = mapjs;

mapjs.addLayers([geotiff]);

// mapjs.getMapImpl().addLayer(tile);