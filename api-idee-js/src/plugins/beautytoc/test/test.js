import BeautyTOC from 'facade/beautytoc';

M.language.setLang('es');

const map = M.map({
  container: 'mapjs',
  controls: ['scale'],
});

const mp = new BeautyTOC({
  collapsed: true,
  position: 'TR',
});

const mp2 = new M.plugin.LyrCompare({
  position: 'TL',
  layers: [
    `WMS*Vuelo americano (Serie B, 1956-1957)*https://www.ign.es/wms/pnoa-historico*AMS_1956-1957`,
    `WMS*Vuelo Interministerial (1973-1986)*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986`,
    `WMS*Vuelo Nacional (1981-1986)*https://www.ign.es/wms/pnoa-historico*Nacional_1981-1986`,
    'WMS*OLISTAT (1997-1998)*https://www.ign.es/wms/pnoa-historico*OLISTAT',
    'WMS*SIGPAC (1997-2003)*https://www.ign.es/wms/pnoa-historico*SIGPAC',
    'WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*PNOA2004',
    'WMS*PNOA 2005*https://www.ign.es/wms/pnoa-historico*PNOA2005',
    'WMS*PNOA 2006*https://www.ign.es/wms/pnoa-historico*PNOA2006',
    'WMS*PNOA 2007*https://www.ign.es/wms/pnoa-historico*PNOA2007',
    'WMS*PNOA 2008*https://www.ign.es/wms/pnoa-historico*PNOA2008',
    'WMS*PNOA 2009*https://www.ign.es/wms/pnoa-historico*PNOA2009',
    'WMS*PNOA 2010*https://www.ign.es/wms/pnoa-historico*PNOA2010',
    'WMS*PNOA 2011*https://www.ign.es/wms/pnoa-historico*PNOA2011',
    'WMS*PNOA 2012*https://www.ign.es/wms/pnoa-historico*PNOA2012',
    'WMS*PNOA 2013*https://www.ign.es/wms/pnoa-historico*PNOA2013',
    'WMS*PNOA 2014*https://www.ign.es/wms/pnoa-historico*PNOA2014',
    'WMS*PNOA 2015*https://www.ign.es/wms/pnoa-historico*PNOA2015',
    'WMS*PNOA 2016*https://www.ign.es/wms/pnoa-historico*PNOA2016',
    'WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico*PNOA2017',
  ],
  collapsible: true,
  collapsed: true,
  staticDivision: 1,
  opacityVal: 100,
  comparisonMode: 0,
  defaultLyrA: 1,
  defaultLyrB: 2,
  defaultLyrC: 3,
  defaultLyrD: 4,
});

map.addPlugin(mp);
// map.addPlugin(mp2);
const layers = [
  new M.layer.WMS({
    url: 'http://www.ign.es/wms-inspire/cuadriculas?',
    name: 'Grid-ETRS89-lonlat-25k,Grid-REGCAN95-lonlat-25k',
    legend: 'Cuadrícula cartográfica del MTN25',
    tiled: false,
    version: '1.1.1',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'http://www.ign.es/wms-inspire/cuadriculas?',
    name: 'Grid-ETRS89-lonlat-50k,Grid-REGCAN95-lonlat-50k',
    legend: 'Cuadrícula cartográfica del MTN50',
    tiled: false,
    version: '1.1.1',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
    name: 'Catastro',
    legend: 'Catastro',
    tiled: false,
    version: '1.1.1',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: true }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
    name: 'AU.AdministrativeBoundary,AU.AdministrativeUnit',
    legend: 'Unidades administrativas',
    tiled: false,
    version: '1.1.1',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'AMS_1956-1957',
    legend: 'Vuelo americano (Serie B, 1956-1957)',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'Interministerial_1973-1986',
    legend: 'Vuelo Interministerial (1973-1986)',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'Nacional_1981-1986',
    legend: 'Vuelo Nacional (1981-1986)',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'OLISTAT',
    legend: 'OLISTAT (1997-1998)',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'SIGPAC',
    legend: 'SIGPAC (1997-2003)',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2004',
    legend: 'PNOA 2004',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2005',
    legend: 'PNOA 2005',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2006',
    legend: 'PNOA 2006',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2007',
    legend: 'PNOA 2007',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2008',
    legend: 'PNOA 2008',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2009',
    legend: 'PNOA 2009',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2010',
    legend: 'PNOA 2010',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2011',
    legend: 'PNOA 2011',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2012',
    legend: 'PNOA 2012',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2013',
    legend: 'PNOA 2013',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2014',
    legend: 'PNOA 2014',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2015',
    legend: 'PNOA 2015',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2016',
    legend: 'PNOA 2016',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
  new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'PNOA2017',
    legend: 'PNOA 2017',
    tiled: false,
    version: '1.3.0',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false }),
];

layers.forEach((l, index) => {
  l.setVisible(false);
  l.displayInLayerSwitcher = true;
  if (l.url === 'https://www.ign.es/wms/pnoa-historico?') {
    l.setZIndex(500 + index);
  } else {
    l.setZIndex(2000 + index);
  }
});

map.addLayers(layers);

window.map = map;
