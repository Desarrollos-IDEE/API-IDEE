import registerGeoPackageContainerTests from '../common/geopackage-container';
import registerGeoPackageTiledTests from '../common/geopackage-tiled';
import registerGeoPackageStyleTests from '../common/geopackage-styles';
import registerGeoPackageRestTests from '../common/geopackage-rest';

registerGeoPackageContainerTests('cesium');
registerGeoPackageTiledTests('cesium');
registerGeoPackageStyleTests('cesium');
registerGeoPackageRestTests('cesium');
