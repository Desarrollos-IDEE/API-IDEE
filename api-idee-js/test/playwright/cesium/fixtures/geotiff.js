/*
 * GeoTIFF mínimo y determinista para las pruebas (el escritor de la librería
 * geotiff solo escribe 8 bits). Una sola tira sin compresión, en little-endian,
 * con claves GeoTIFF y, opcionalmente, las etiquetas GDAL de estadísticas y nodata.
 */
const TYPES = {
  ASCII: { id: 2, size: 1 },
  SHORT: { id: 3, size: 2 },
  LONG: { id: 4, size: 4 },
  DOUBLE: { id: 12, size: 8 },
};

/**
 * @param {Object} options Opciones.
 * @param {Number} options.width Ancho en píxeles.
 * @param {Number} options.height Alto en píxeles.
 * @param {Uint16Array} options.values Valores (una banda de 16 bits sin signo).
 * @param {Array<Number>} options.bbox [minX, minY, maxX, maxY] en la proyección.
 * @param {Number} options.epsg Código EPSG (4326 geográfico; el resto, proyectado).
 * @param {Number} [options.nodata] Valor sin datos (etiqueta GDAL_NODATA).
 * @param {Array<Number>} [options.stats] [mínimo, máximo] (etiqueta GDAL_METADATA).
 * @returns {Buffer} Fichero GeoTIFF.
 */
export const createGeoTIFF = ({
  width, height, values, bbox, epsg, nodata, stats,
}) => {
  const [minX, minY, maxX, maxY] = bbox;
  const geographic = epsg === 4326;
  const geoKeys = [
    1, 1, 0, 3,
    1024, 0, 1, geographic ? 2 : 1, // GTModelTypeGeoKey
    1025, 0, 1, 1, // GTRasterTypeGeoKey: PixelIsArea
    geographic ? 2048 : 3072, 0, 1, epsg, // GeographicTypeGeoKey | ProjectedCSTypeGeoKey
  ];
  const data = Buffer.from(values.buffer, values.byteOffset, values.byteLength);
  const entries = [
    [256, 'LONG', [width]],
    [257, 'LONG', [height]],
    [258, 'SHORT', [16]],
    [259, 'SHORT', [1]],
    [262, 'SHORT', [1]],
    [273, 'LONG', [0]], // StripOffsets: se rellena después
    [277, 'SHORT', [1]],
    [278, 'LONG', [height]],
    [279, 'LONG', [data.length]],
    [284, 'SHORT', [1]],
    [339, 'SHORT', [1]],
    [33550, 'DOUBLE', [(maxX - minX) / width, (maxY - minY) / height, 0]],
    [33922, 'DOUBLE', [0, 0, 0, minX, maxY, 0]],
    [34735, 'SHORT', geoKeys],
  ];
  if (stats) {
    entries.push([42112, 'ASCII', '<GDALMetadata>'
      + `<Item name="STATISTICS_MINIMUM" sample="0">${stats[0]}</Item>`
      + `<Item name="STATISTICS_MAXIMUM" sample="0">${stats[1]}</Item>`
      + '</GDALMetadata>']);
  }
  if (nodata !== undefined) entries.push([42113, 'ASCII', String(nodata)]);

  const encode = (type, value) => {
    if (type === 'ASCII') return Buffer.from(`${value}\0`, 'latin1');
    const { size } = TYPES[type];
    const buffer = Buffer.alloc(size * value.length);
    value.forEach((v, i) => {
      if (type === 'SHORT') buffer.writeUInt16LE(v, i * size);
      else if (type === 'LONG') buffer.writeUInt32LE(v, i * size);
      else buffer.writeDoubleLE(v, i * size);
    });
    return buffer;
  };

  const ifdOffset = 8;
  const ifdSize = 2 + entries.length * 12 + 4;
  let extraOffset = ifdOffset + ifdSize;
  const extras = [];
  const ifd = Buffer.alloc(ifdSize);
  ifd.writeUInt16LE(entries.length, 0);
  const encoded = entries.map(([tag, type, value]) => [tag, type, value, encode(type, value)]);
  const dataOffset = encoded.reduce((offset, [, , , bytes]) => {
    return bytes.length > 4 ? offset + bytes.length + (bytes.length % 2) : offset;
  }, extraOffset);
  encoded.forEach(([tag, type, value, rawBytes], i) => {
    const bytes = tag === 273 ? encode('LONG', [dataOffset]) : rawBytes;
    const base = 2 + i * 12;
    ifd.writeUInt16LE(tag, base);
    ifd.writeUInt16LE(TYPES[type].id, base + 2);
    ifd.writeUInt32LE(type === 'ASCII' ? bytes.length : value.length, base + 4);
    if (bytes.length <= 4) {
      bytes.copy(ifd, base + 8);
    } else {
      ifd.writeUInt32LE(extraOffset, base + 8);
      extras.push(bytes);
      if (bytes.length % 2) extras.push(Buffer.alloc(1));
      extraOffset += bytes.length + (bytes.length % 2);
    }
  });
  ifd.writeUInt32LE(0, ifdSize - 4);

  const header = Buffer.alloc(8);
  header.write('II', 0, 'latin1');
  header.writeUInt16LE(42, 2);
  header.writeUInt32LE(ifdOffset, 4);
  return Buffer.concat([header, ifd, ...extras, data]);
};

export default createGeoTIFF;
