/** Normalize a visible geographic extent to an OGC API Features CRS84 bbox, without rounding. */
export default function dataIDEEBbox(extent) {
  if (!extent || extent.length !== 4 || !extent.every(Number.isFinite)) return null;
  let [west, south, east, north] = extent;
  south = Math.max(-90, south);
  north = Math.min(90, north);
  if (south >= north || west === east) return null;
  if (east - west >= 360) {
    west = -180;
    east = 180;
  } else {
    const wrap = (value) => (value >= -180 && value <= 180
      ? value : ((((value + 180) % 360) + 360) % 360) - 180);
    west = wrap(west);
    east = wrap(east);
  }
  // west > east represents an extent crossing the antimeridian.
  return [west, south, east, north];
}
