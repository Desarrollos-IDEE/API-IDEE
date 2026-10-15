// eslint-disable-next-line import/no-extraneous-dependencies
import initGdalJs from 'gdal3.js';

/** @type {Gdal} */
let gdal;

/** @type {Promise<Gdal>} */
let gdalPromise;

/** Nombres únicos para las conversiones GeoPackage concurrentes en el sistema virtual. */
let geopackageSequence = 0;

const gdalWorker = false;

/** CRS que se asume para formatos CAD sin CRS embebido (DXF, DGN) */
const CAD_DEFAULT_SRS = 'EPSG:25830';

/** extensiones soportadas por GDAL */
export const extensionFiles = [
  'gpkg',
  'dxf',
  'dgn',
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
      // gdal3.js puede dejar pendiente su promesa ante un fallo de descarga.
      // Descargamos primero los recursos con fetch para propagar errores y permitir reintentos.
      gdalPromise = Promise.all([paths.wasm, paths.data].map(async (url) => {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`GDAL: HTTP ${response.status}`);
        await response.arrayBuffer();
      })).then(() => initGdalJs({ paths, useWorker: gdalWorker }));
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
 * Linealiza tablas de curvas mediante ogr2ogr, sin reproyectar ni modificar el fichero original.
 * Reutiliza GDAL y su aproximación predeterminada; devuelve solo geometrías indexadas por FID.
 * @param {Uint8Array} bytes Contenido del GeoPackage.
 * @param {Array<Object>} tables Nombre y columnas de identidad/geometría de cada tabla.
 * @returns {Promise<Map<String, Map<Number, Object>>>} Geometrías por tabla e identificador.
 */
export const linearizeGeoPackage = async (bytes, tables) => {
  await init();
  geopackageSequence += 1;
  const name = `apiidee_curves_${geopackageSequence}`;
  const input = `/input/${name}.gpkg`;
  const temporary = [input];
  let datasets = [];
  try {
    gdal.Module.FS.writeFile(input, bytes);
    datasets = (await gdal.open(input)).datasets;
    // Un GeoPackage mixto puede estar etiquetado como ráster y contener tablas vectoriales.
    const [dataset] = datasets;
    if (!dataset) throw new Error('GDAL: GeoPackage vector dataset unavailable');
    // Una operación por tabla mantiene separados los FID y admite nombres con espacios.
    return await tables.reduce(async (previous, table, index) => {
      const geometries = await previous;
      const quote = (identifier) => `"${identifier.replace(/"/g, '""')}"`;
      const outputName = `${name}_${index}`;
      temporary.push(`/output/${outputName}.geojson`);
      const output = await gdal.ogr2ogr(dataset, [
        '-f', 'GeoJSON', '-nlt', 'CONVERT_TO_LINEAR',
        '-lco', 'COORDINATE_PRECISION=17',
        // El FID de una consulta SQL puede ser renumerado: se transporta como atributo explícito.
        '-sql', `SELECT ${quote(table.idColumn)} AS apiidee_fid, ${quote(table.geometryColumn)} FROM ${quote(table.name)}`,
      ], outputName);
      const geojson = JSON.parse(new TextDecoder().decode(await gdal.getFileBytes(output)));
      const features = new Map(geojson.features.map(({ properties, geometry }) => [
        properties.apiidee_fid, geometry,
      ]));
      if (features.has(undefined) || features.size !== geojson.features.length) {
        throw new Error(`GDAL: invalid feature identifier (${table.name})`);
      }
      return geometries.set(table.name, features);
    }, Promise.resolve(new Map()));
  } finally {
    await Promise.all(datasets.map((dataset) => gdal.close(dataset)));
    temporary.forEach((file) => {
      if (gdal.Module.FS.analyzePath(file).exists) gdal.Module.FS.unlink(file);
    });
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
            const hasCrs = Array.isArray(layer.geometryFields)
              && layer.geometryFields.some((geometryField) => !!geometryField.coordinateSystem);
            const options = [
              '-f', 'GeoJSON',
              ...(hasCrs
                ? ['-t_srs', projectionCode]
                : ['-s_srs', CAD_DEFAULT_SRS, '-t_srs', projectionCode]),
              // ...(hasCrs ? ['-t_srs', projectionCode] : ['-a_srs', projectionCode]),
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
