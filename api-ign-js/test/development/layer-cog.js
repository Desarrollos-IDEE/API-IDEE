import { map as Mmap } from 'M/mapea';
import WMS from 'M/layer/WMS';
import GeoTIFF from 'M/layer/GeoTIFF';

const mapjs = Mmap({
  container: 'map',
  controls: ['scaleline', 'panzoombar'],
});
const layerUA = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});

const layerGeoTIFF = new GeoTIFF({
  url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
  // url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  // url: 'http://ftpcdd.cnig.es/Vuelos_2015_2016/Vuelos_2015/Baleares/1.VF/1.08_PNOA_L6_2015_BAL_25cm_VF_img8c_rgb_hu31/h50_0697_fot_002-0026.tif',
  // url: 'http://ftpcdd.cnig.es/Vuelos_2022/Vuelos_2022/murcia_2022/01.VF/01.08_PNOA_2022_MUR_35cm_VF_img8c_rgb_hu30/h50_0932_fot_011-0034_cog.tif',
  // url: 'http://ftpcdd.cnig.es/PUBLICACION_CNIG_DATOS_VARIOS/MDT05/MDT05_ETRS89_HU30_ENTPNOA50/PNOA_MDT05_ETRS89_HU30_0685_LID.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  transparent: true,
}, {
  minZoom: 5,
  maxZoom: 15,
  convertToRGB: 'auto',
  nodata: 1000,
  // bands: [1],
  // opacity: 0.25,

  // styles: {
  //   color: [
  //     'interpolate',
  //     ['linear'],
  //     ['/', ['+',
  //       ['/', ['band', 1], 3000],
  //       ['/', ['band', 2], 3000],
  //       ['/', ['band', 3], 3000]
  //     ], 2],
  //     0, [255, 255, 255],  // Color blanco en lugar de negro
  //     1, [255, 0, 0],      // Rojo
  //   ],
  //   opacity: 0.1, // Puedes ajustar la opacidad según tus necesidades
  //   gamma: 1.1,
  // },
});

window.mapjs = mapjs;
mapjs.addWMS(layerUA);
mapjs.addCOG(layerGeoTIFF);
