import Modal from 'facade/modal';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

const mp = new Modal({
  collapsed: true,
  collapsible: true,
  position: 'TR', // 'TL' | 'TR' | 'BL' | 'BR'
  tooltip: 'Más información',
  // url_en: 'template_en', url_es: 'template_es',
  // url_en: 'https://www.ign.es/iberpix/ayuda/en.html', url_es: 'https://www.ign.es/iberpix/ayuda/es.html',
  helpLink: { en: 'https://www.ign.es/iberpix/ayuda/en.html', es: 'https://www.ign.es/iberpix/ayuda/es.html'},
  order: 1,
});

map.addPlugin(mp); window.mp = mp;