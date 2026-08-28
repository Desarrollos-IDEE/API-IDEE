// eslint-disable-next-line import/no-extraneous-dependencies
import initGdalJs from 'gdal3.js';

/** @type {Gdal} */
let gdal;

/** @type {Promise<Gdal>} */
let gdalPromise;

const gdalWorker = false;

/** extensiones soportadas por GDAL */
export const extensionFiles = [
  'gpkg',
  // 'shp', 'geojson', 'json', 'kml', 'gml', 'jpg', 'png', 'img', 'vrt',
];

/**
 * @returns {Promise<Gdal>} get a Promise thats contains an instance of Gdal library to work
 */
export const init = async () => {
  if (gdalPromise) {
    await gdalPromise;
  } else {
    const path = 'https://cdn.jsdelivr.net/npm/gdal3.js@2.8.1/dist/package';
    const paths = {
      wasm: `${path}/gdal3WebAssembly.wasm`,
      data: `${path}/gdal3WebAssembly.data`,
      js: '../../js/gdal/gdal3.js',
    };
    try {
      gdalPromise = initGdalJs({
        paths,
        useWorker: gdalWorker,
      }).catch((err) => {
        throw new Error(err);
      });
      gdal = await gdalPromise;
    } catch (err) {
      gdalPromise = null;
      // eslint-disable-next-line no-console
      console.error(err);
      IDEE.dialog.error('Gdal library failed', 'ERROR');
      throw err;
    }
  }
};

/**
 * @param {File} file
 * @param {string} projectionCode
 * @returns {Promise<Object>} object with specific data to process
 */
export const processFile = async (file, projectionCode) => {
  const currentMouseCursorStyle = document.body.style.cursor ?? 'auto';
  document.body.style.cursor = 'wait';
  const geoJSONPromisses = [];
  const blobPromisses = [];
  const geoJSONs = [];
  const rasterBlobs = [];
  const dataObject = {};
  try {
    await init();
    const datasetList = await gdal.open(file);
    const fileName = file.name;
    datasetList.datasets.forEach((dataset) => {
      const newDataset = dataset;
      const onlyName = fileName.split('.')[0];
      newDataset.name = onlyName;
      if (dataset.type === 'vector') {
        const groupLayerName = onlyName;
        newDataset.info.layers.forEach((layer) => {
          const layerName = layer.name;
          if (typeof layerName === 'string') {
            const options = [
              '-f', 'GeoJSON',
              '-t_srs', projectionCode,
              '-sql', `SELECT * from ${layerName}`,
            ];
            const outputName = `gjson_${groupLayerName}_${layerName}`;
            const geoJSONPromise = gdal.ogr2ogr(dataset, options, outputName)
              .then(async (filePath) => {
                const decoder = new TextDecoder('utf-8');
                let gjsonFile = null;
                if (gdalWorker) {
                  const dtset = await gdal.getFileBytes(filePath.local);
                  gjsonFile = JSON.parse(decoder.decode(dtset));
                } else {
                  gjsonFile = JSON.parse(decoder.decode(gdal.Module.FS.readFile(filePath.local)));
                }
                gjsonFile.name = layer.name;
                geoJSONs.push(gjsonFile);
              }).catch((err) => {
                throw err;
              });
            geoJSONPromisses.push(geoJSONPromise);
          }
        });
      } else if (dataset.type === 'raster') {
        newDataset.info.layers = [];
        newDataset.info.layers.push({ name: onlyName });
        const options = [
          '-of', 'GTiff',
          '-t_srs', projectionCode,
        ];
        const outputName = `GTiff_${dataset.name}`;
        const blobPromise = gdal.gdalwarp(newDataset, options, outputName)
          .then(async (filePath) => {
            let blobFile;
            if (gdalWorker) {
              const dtset = await gdal.getFileBytes(filePath.local);
              blobFile = new Blob([dtset], { type: 'application/octet-stream' });
            } else {
              blobFile = new Blob([gdal.Module.FS.readFile(filePath.local)], { type: 'application/octet-stream' });
            }
            rasterBlobs.push(blobFile);
          }).catch((err) => {
            throw err;
          });
        blobPromisses.push(blobPromise);
      }
    });
  } catch (err) {
    document.body.style.cursor = currentMouseCursorStyle;
    // eslint-disable-next-line no-console
    console.error(err);
    IDEE.dialog.error('File to GeoJSON conversion failed', 'ERROR');
    throw new Error(err);
  }
  if (geoJSONPromisses.length > 0) await Promise.all(geoJSONPromisses);
  if (blobPromisses.length > 0) await Promise.all(blobPromisses);
  if (geoJSONs.length > 0) dataObject.vectors = geoJSONs;
  if (rasterBlobs.length > 0) dataObject.rasters = rasterBlobs;

  document.body.style.cursor = currentMouseCursorStyle;
  return dataObject;
};

export default {};
