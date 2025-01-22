import Printer from 'plugins/printer/facade/js/printer';
import SelectionDraw from 'plugins/printer/facade/js/selectiondraw';

const mapjs = IDEE.map({
  container: 'map',
  // wmcfiles: ['cdau'],
});

const layerinicial = new IDEE.layer.WMS({
  url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

const campamentos = new IDEE.layer.GeoJSON({
  name: 'Campamentos',
  url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/sepim/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sepim:campamentos&outputFormat=application/json&',
  extract: true,
});

const printer = new Printer({
  url: 'https://geoprint.desarrollo.guadaltel.es/print/CNIG',
  params: {
    layout: {
      outputFilename: 'api-idee_${yyyy-MM-dd_hhmmss}',
    },
    pages: {
      clientLogo: 'http://www.juntadeandalucia.es/economiayhacienda/images/plantilla/logo_cabecera.gif',
      creditos: 'Impresión generada a través de API-IDEE',
    },
    parameters: {
      imageSpain: 'file://E01_logo_IGN_CNIG.png',
      imageCoordinates: 'file://E01_logo_IGN_CNIG.png',
    },
  },
}, {
  options: {
    legend: 'true',
  },
});

const selectiondraw = new SelectionDraw({
  projection: 'EPSG:4326',
});
selectiondraw.on('finished:draw', (feature) => {
  console.log(feature);
});

mapjs.addLayers([layerinicial, campamentos]);

// mapjs.addLayerGroup(layerGroup1);
// mapjs.addWFS(layer);

mapjs.addPlugin(printer);
mapjs.addPlugin(selectiondraw);

window.mapjs = mapjs;
