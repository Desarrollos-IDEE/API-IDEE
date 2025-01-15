/* eslint-disable camelcase,import/prefer-default-export */
import GeoTIFF from 'M/layer/GeoTIFF';
import { normalize } from 'ol/color';
import GeoTIFFSource from 'ol/source/GeoTIFF';

export const geotiff_001 = new GeoTIFF({
  url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
  name: 'Nombre geotiff',
  legend: 'Leyenda geotiff',
  // transparent: false,
  // isBase: true,
  // visibility: true,
  //   attribution: {
  //   name: 'GeoTIFF',
  //   description: 'Mi GeoTIFF',
  //   url: 'https://www.ign.es',
  //   contentAttributions: 'https://componentes.cnig.es/api-core/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
  //   contentType: 'kml',
  // },
  // projection: 'EPSG:4326',
  // maxExtent: [299487.4297775584, 5224273.407288137, 317192.1564541124, 5228878.738242318],
}, {
  // minZoom: 11,
  // maxZoom: 13,
  // minScale: 54000,
  // maxScale: 217000,
  // minResolution: 38.21851414258813,
  // maxResolution: 152.8740565703525,
  // opacity: 0.5,
  // convertToRGB: false,
  nodata: 0,
  // bands: [1],
  // opacity: 0.25,
  styles: {
    // color: [
    //   'interpolate',
    //   ['linear'],
    //   ['/', ['+',
    //     ['/', ['band', 1], 3000],
    //     ['/', ['band', 2], 3000],
    //     ['/', ['band', 3], 3000]
    //   ], 2],
    //   0, [255, 255, 255],  // Color blanco en lugar de negro
    //   1, [255, 0, 0],      // Rojo
    // ],
    gamma: 0.5,
  },
}, {
  // opacity: 0.3
});

export const geotiff_002 = 'GeoTIFF*https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif';

export const geotiff_003 = new GeoTIFF({
  url: 'http://ftpcdd.cnig.es/Vuelos_2022/Vuelos_2022/murcia_2022/01.VF/01.08_PNOA_2022_MUR_35cm_VF_img8c_rgb_hu30/h50_0932_fot_011-0034_cog.tif',
}, { nodata: 0 });

export const geotiff_004 = new GeoTIFF(
  {
    url: 'http://ftpcdd.cnig.es/Vuelos_2015_2016/Vuelos_2015/Baleares/1.VF/1.08_PNOA_L6_2015_BAL_25cm_VF_img8c_rgb_hu31/h50_0697_fot_002-0026.tif',
    projection: 'EPSG:4326',
    normalize: false,
  },
  {
    convertToRGB: false,
    nodata: 99,
  },
  {
    source: new GeoTIFFSource({
      sources: [
        {
          url: 'http://ftpcdd.cnig.es/Vuelos_2021/Vuelos_2021/catalunya_2021/Costa/01.VF/01.08_PNOA_2021_CAT_COSTA_22cm_VF_img8c_rgb_hu31/h50_0219_fot_002-0001_cog.tif',
          nodata: 0,
        },
      ],
      convertToRGB: true,
      projection: 'EPSG:3857',
      normalize: true,
    }),
  },
);
