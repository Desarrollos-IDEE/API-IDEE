import Catalogmanager from 'facade/catalogmanager';

// IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  projection: 'EPSG:4326',
  bbox: [-15.017115565547565, 34.64614470425839, 7.599236393104354, 45.047310735242576],
});
window.map = map;

const PREDEFINED_CATALOGS = [
  {
    title: 'GNEIS',
    url: 'https://stac-gneis.idee.es',
    authUrl: 'https://gneis.desarrollo.guadaltel.es/o/custom-auth/token',
    collectionsUrl: 'https://gneis.desarrollo.guadaltel.es/o/custom-auth/collections',
    public: false,
  } /*, {
    title: 'Astraea Earth',
    url: 'https://eod-catalog-svc-prod.astraea.earth',
    public: true,
  }, {
    title: 'AWS Element84',
    url: 'https://earth-search.aws.element84.com/v1',
    public: true,
  }, {
    title: 'Copernicus',
    url: 'https://stac.dataspace.copernicus.eu/v1',
    public: true,
  } */
];

const mp = new Catalogmanager({
  position: 'TL', // TR, BR, TL, BL
  collapsed: false,
  collapsible: true,
  tooltip: 'Gestor STAC',
  predefinedCatalogs: PREDEFINED_CATALOGS,
  addCatalogEnabled: true,
  downloadUrl: 'https://gneissd.desarrollo.guadaltel.es/serviciodescarga/v1/download-jobs',
});
window.mp = mp;

map.addPlugin(mp);

map.addPlugin(new IDEE.plugin.Layerswitcher({
  isMoveLayers: true,
  position: 'TR', // TR, BR, TL, BL
}));

map.addPlugin(new IDEE.plugin.RasterManagement({
  position: 'TR', // TR, BR, TL, BL
  collapsed: true,
  collapsible: true,
  tooltip: 'Gestor de estilos ráster',
}));

map.addPlugin(new IDEE.plugin.Help({
  position: 'TR', // TR, BR, TL, BL
  collapsed: true,
  collapsible: true,
  tooltip: 'Ayuda',
}));
