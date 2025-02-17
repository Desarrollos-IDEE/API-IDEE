const EPSG_DEFAULT = 'EPSG:4326';

export const reproject = (origin, coordinates) => {
  const originProj = ol.proj.get(origin);
  const destProj = ol.proj.get(EPSG_DEFAULT);
  const coordinatesTransform = ol.proj.transform(coordinates, originProj, destProj);
  return coordinatesTransform;
};

export const transformExt = (box, code, currProj) => {
  return ol.proj.transformExtent(box, code, currProj);
};

export const transform = (box, code, currProj) => {
  return ol.proj.transform(box, code, currProj);
};

export const pixelToCoordinateTransform = (map) => {
  return map.getMapImpl().pixelToCoordinateTransform_; // eslint-disable-line
};

export const adjustExtentForSquarePixels = (extent, size) => {
  const ext = extent;
  const f = (ext[2] - ext[0]) / size[0];
  ext[3] = ext[1] + (f * size[1]);

  return ext;
};
