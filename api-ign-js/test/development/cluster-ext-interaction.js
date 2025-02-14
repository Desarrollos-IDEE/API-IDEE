import { map as Mmap } from 'M/mapea';
import { SELECT_FEATURES, LOAD } from 'M/event/eventtype';
import { MARKER } from 'M/style/Form';
import { get as getProjection, transform } from 'ol/proj';
import KML from 'M/layer/KML';
import Line from 'M/style/Line';
import Cluster from 'M/style/Cluster';
import Point from 'M/style/Point';
import Vector from 'M/layer/Vector';
import Feature from 'M/feature/Feature';
import ClusteredFeature from 'M/feature/Clustered';
import Popup from 'M/Popup';
import SelectCluster from '../../src/impl/ol/js/interaction/SelectedCluster';

let poiLayer;

const mapjs = Mmap({
  container: 'map',
});

const kmlLayer = new KML( {
  url: 'https://www.ign.es/resources/CaminoDeSantiago_PRE/rutas/04/04-Via%20de%20la%20Plata%20-%20Camino%20Moz%C3%A1rabe%20a%20Santiago.kml',
  name: 'routeKmlLayer',
  extract: true
} );

kmlLayer.on( LOAD, () => {
  var bbox = kmlLayer.getFeaturesExtent();
  map.setBbox( bbox );
  map.setZoom( map.getZoom() - 0.2 );

  kmlLayer.getFeatures().forEach( ( feature, i ) => {
    let style = new Line( {
      stroke: {
        width: 5,
        linedash: feature.getAttributes().name.includes( '_v' ) ? [ 10, 10 ] : null,
        color: i % 2 === 0 ? 'yellow' : 'blue'
      }
    } );
    feature.setStyle( style );
  } );

  drawCluster();

} );

mapjs.addKML(kmlLayer);
kmlLayer.setVisible( true );

function drawCluster() {
  fetch('https://www.ign.es/resources/CaminoDeSantiago_PRE/rutas/04/04-Via%20de%20la%20Plata%20-%20Camino%20Moz%C3%A1rabe%20a%20Santiago-pois.json')
  .then(rs => rs.json())
  .then(data => {
    poiLayer = new Vector( {
      name: 'poilayer',
    } );
    poiLayer.refresh = () => null;
    mapjs.addLayers( poiLayer );
    data.pois.forEach(poi => {
      const proj4326 = getProjection( 'EPSG:4326' );
      const proj3857 = getProjection( 'EPSG:3857' );
      const coordinates = transform( [ poi.coordenadas.lng, poi.coordenadas.lat ], proj4326, proj3857 );

      if(!poi.coordenadas.lng || !poi.coordenadas.lat) {
        return;
      }

      const feature = new Feature( poi.identificador, {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates,
        },
      } );

      poiLayer.addFeatures( feature );
    });

    poiLayer.setStyle( new Cluster( {
      ranges: [ {
        min: 1,
        max: 1,
        style: new Point( {
          icon: {
            form: MARKER,
            radius: 20,
            fill: "#A03000",
          }
        } )
      }, {
        min: 2,
        style: new Point( {
          fill: {
            color: "#A03000"
          },
          radius: 20
        } ),
      } ],
      hoverInteraction: false,
      maxFeaturesToSelect: 0,
      selectInteraction: true,
      distance: 80,
      label: {
        font: 'bold 25px arial',
        color: '#FFFFFF'
      }
    }));

    poiLayer.on( SELECT_FEATURES, ( features, e ) => {
      if ( !( features[ 0 ] instanceof ClusteredFeature ) ) {
        const tab = {
          content: features[0].getImpl().getOLFeature().ol_uid,
        };
        const popup = new Popup();
        popup.addTab( tab );
        map.addPopup( popup, e.coord );
      }
    });

  });
}

window.abcd = (evt) => {
  const _feature = map.getLayers().find(l => l.name === 'poilayer').getImpl().getOL3Layer().getSource().getFeatures()[0];
  if(_feature.getProperties('features').features.length > 1) {
    map.getMapImpl().getInteractions().forEach((interaction) => {
      if (interaction.selectCluster_) {
        let _evt = {};
        _evt.selected = [];
        _evt.selected.push(_feature);
        interaction.selectCluster(_evt);
      }
    })
  } else {
    const mapeaFeature = poiLayer.getFeatures().find(f => f.getImpl().getOLFeature().ol_uid === _feature.getProperties('features').features[0].ol_uid);
    evt.coord = _feature.getGeometry().flatCoordinates;
    map.getFeatureHandler().selectFeatures([mapeaFeature], poiLayer, evt);
  }
}

window.map = mapjs;