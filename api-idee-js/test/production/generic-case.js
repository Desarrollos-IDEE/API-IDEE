/**
 * Puts the map retrieved by the API on window scope
 */
window.putMapOnWindowScope = function putMapOnWindowScope(mapInstance) {
  window.mapjs = mapInstance;
  // window.mapjs.on(M.evt.COMPLETED, () => {
  const divElem = document.createElement('div');
  divElem.id = 'mapLoaded';
  divElem.style.display = 'none';
  document.body.appendChild(divElem);
  // });
};

// gets parameters to use the API
const API_IDEE_URL = 'https://componentes-desarrollo.idee.es/api-idee/';
const useCaseUrl = `${API_IDEE_URL}api/js${window.location.search}&callback=putMapOnWindowScope`;

// creates the <script> element pointing the use case URL
const scriptElement = document.createElement('script');
scriptElement.type = 'text/javascript';
scriptElement.src = useCaseUrl;
scriptElement.setAttribute('async', '');
window.document.body.appendChild(scriptElement);
