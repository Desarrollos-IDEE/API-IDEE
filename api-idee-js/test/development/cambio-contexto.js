import { map as Mmap } from 'M/api-idee';

const mapjs = Mmap({
  container: 'map',
  "controls": ["navtoolbar", "layerswitcher"],
  "wmcfiles": ["cdau", "cdau_satelite", "cdau_hibrido"]
});

window.mapjs = mapjs;
