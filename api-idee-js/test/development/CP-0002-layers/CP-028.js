const map = IDEE.map({
  container: 'map',
  layers: [],
  controls: [],
  center: [0, 0],
  zoom: 2,
});

const layerSwitcher = new IDEE.plugin.Layerswitcher({
  collapsed: false,
  precharged: { services: [] },
});

map.addPlugin(layerSwitcher);

window.map = map;
window.layerSwitcher = layerSwitcher;
