import { map as Mmap } from 'M/mapea';
import { wms_001 } from '../layers/wms/wms'

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857*m',
  // ? 01. Caso de uso: backgroundlayers
  // ! Añadir attribution capas rápidas -> mapea.js
  // ! Añadir capas rápidas al configuration.js, ejemplo:
  // const backgroundlayersLayers = 'QUICK*Base_IGNBaseTodo_TMS,QUICK*BASE_PNOA_MA_TMS,TMS*PNOA-MA*...;
  // controls: ['backgroundlayers'],

  // ? 02. Caso de uso: backgoundlayers + attributions
  // controls: ['backgroundlayers', 'attributions'],

  // layers: [wms_001],
  // layers: ['OSM'],
});

// ? 03. Caso de uso: Añadir controles tras la creación del mapa
// mapa.addControls('backgroundlayers')
// mapa.createAttribution({position: 'TL'});

// ? 04. Caso de uso: createAttributions con collectionsAttribution
/*
mapa.createAttribution({
  collectionsAttributions: ['<p>Prueba Attribution String 1</p>', {
    name: 'Prueba Nombre',
    description: 'Prueba Description',
    url: 'https://www.ign.es',
  }],
});
*/

// ? 05. Caso de uso: createAttribution con position
// mapa.createAttribution({position: 'TL'});

// ? 06. Caso de uso: Se añade una atribución al mapa
// mapa.addAttribution('<p>Prueba Attribution String 1</p>');

// ? 07. Caso de uso: Añadir atribución capa
// mapa.addLayers(wms_001);

// ? 08. Caso de uso: Se consulta las atribuciones del mapa
// console.log(mapa.getAttributions());

// ? 09. Caso de uso: Se consulta todas las atribuciones mapa + control
// console.log(mapa.getAttributions(true));

// ? 10. Caso de uso: Por URL.
// https://mapea-lite.desarrollo.guadaltel.es/api-core/?controls=attributions*<p>holaa</p>

// ? 11. Caso de uso: Crear control con addControls - String
// mapa.addControls('Attributions')

// ? 12. Caso de uso: Eliminar control
/*
const getControls = mapa.getControls()[0]

setTimeout(() => {
    mapa.removeControls(getControls)
}, 1000);
*/

// ? 13. Caso de uso: Eliminar atribución por nombre
/*
setTimeout(() => {
  mapa.removeAttribution('Name Prueba WMS');
}, 1000);
*/ 

// ? 14. Caso de uso: Eliminar atribución por id - string
/*
setTimeout(() => {
  const {id} = mapa.getAttributions(true)[0]
  mapa.removeAttribution(id);
}, 1000);
*/