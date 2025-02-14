import Comparators from 'facade/comparators';

M.language.setLang('es');
// M.proxy(false);

const map = M.map({
  container: 'mapjs',
  zoom: 6,
  bbox: [323020, 4126873, 374759, 4152013],
});

const mp = new Comparators({
  position: 'TR',
  collapsed: false,
  collapsible: true,
  isDraggable: true,
  // ? -> Se comprueba que se abre el panel, parámetro defaultCompareMode
  // defaultCompareMode: 'windowsyncParams',
  transparencyParams: true,
  lyrcompareParams: true,
  mirrorpanelParams: true,
  // ? -> Se comprueba que si no se declara en el contructor aparecerá con valores por defecto.
  // ? -> Se comprueba que con valor a false no se mostrará el control.
  // windowsyncParams: false,
  // ? -> Se comprueba que se puede modificar el tooltip.
  // windowsyncParams: { tooltip: 'prueba' },
});

map.addPlugin(mp);
window.map = map;
