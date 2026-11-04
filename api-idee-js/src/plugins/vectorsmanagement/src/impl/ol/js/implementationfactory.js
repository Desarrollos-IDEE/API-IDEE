/**
 * Factoría de las implementaciones OpenLayers de VectorsManagement.
 */
import VectorsManagementControl from './vectorsmanagementcontrol';
import Selectioncontrol from './selectioncontrol';
import Creationcontrol from './creationcontrol';
import Editioncontrol from './editioncontrol';
import Analysiscontrol from './analysiscontrol';
import Turfcontrol from './turfcontrol';

export default Object.freeze({
  vectorsManagement: () => new VectorsManagementControl(),
  selection: (map) => new Selectioncontrol(map),
  creation: (map) => new Creationcontrol(map),
  edition: (map) => new Editioncontrol(map),
  analysis: (map) => new Analysiscontrol(map),
  turf: (map) => new Turfcontrol(map),
});
