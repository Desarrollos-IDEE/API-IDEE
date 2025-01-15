import { map as Mmap } from 'M/mapea';


const mapa = Mmap({
  container: 'map',
  controls: ['scale'],
  // center: [1330615.7883883417, 6496535.908013698]
}, {}, {
  // center: [1330615.7883883417, 6496535.908013698], // no funciona, lo permite en el primer objeto
  // enableRotation: false, // ok
  // rotation: Math.PI / 6, // ok
  // constrainRotation: 14, // ok
  // extent: [-564240.9156316388, 4888363.2608466195, -270722.727016562, 4959296.823095263],
  // smoothExtentConstraint: false
  // constrainOnlyCenter: true // no funciona
  // minZoom: 5,
  // maxZoom: 10
  // multiWorld: false // no funciona,
  // zoom: 10, // no funciona
  // projection: 'EPSG:4326', // no funciona
});

window.mapa = mapa;
