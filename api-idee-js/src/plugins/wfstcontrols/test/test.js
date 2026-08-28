import WFSTControls from 'facade/wfstcontrols';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  ticket: 'PWUMZ5MQTPUGAEWTHCXVXSFZLLAKXUNKBQSTBOWUDL4AZDOVZKN35B67X6SCPMMISIWNFHW7AAYH4MLGMG4G7NTD3HIALJ42K73PC7W7SQIUUCSKTEIXHCXP6VGOTNXJ4K2SAIEI2GAOURMWOMKWEDURE5K2H357Y35B5GI',
});
window.map = map;

const wfsLayer = new IDEE.layer.WFS({
  url: 'https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Global/wfs?',
  legend: 'capa wfs',
  name: 'superadmin_mispuntos_1758802353451',
  geometry: 'LINE',
  extract: false,
});

map.addWFS(wfsLayer);

const mp = new WFSTControls({
  features: 'drawfeature,modifyfeature,deletefeature,editattribute',
  position: 'BR',
  proxy: {},
});

map.addPlugin(mp); window.mp = mp;
map.addPlugin(new IDEE.plugin.Help({}));
