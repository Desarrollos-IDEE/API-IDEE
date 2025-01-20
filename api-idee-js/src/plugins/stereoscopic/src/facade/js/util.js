const urlAPI = `${M.config.API_IDEE_URL}plugins/stereoscopic/`;

function loadAllScripts() {
  return new Promise((resolve1, reject1) => {
    const scripts = [
      'TR3-pack/jquery/jquery-3.4.1.min.js',
      'TR3-pack/jquery/jquery-ui.min.js',
      'TR3-pack/jquery/miniColors/jquery.minicolors.min.js',
      'TR3-pack/TR3.min.js',
      'TR3-pack/TWEEN/tween.min.js',
      'TR3-pack/proj4js/proj4.js',
    ];

    function loadScript(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.onload = () => {
          resolve();
        };
        script.onerror = () => {
          reject(new Error(`Error al cargar ${url}`));
        };
        script.src = urlAPI + url;
        document.head.appendChild(script);
      });
    }

    const loadPromises = scripts.map(loadScript);

    Promise.all(loadPromises)
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error al cargar los scripts:', error);
        reject1(error);
      });
  });
}

function loadAllStyles() {
  return new Promise((resolve1, reject1) => {
    const styles = [
      'TR3-pack/jquery/jquery-ui-1.12.1.css',
      'TR3-pack/jquery/miniColors/jquery.minicolors.css',
    ];

    function loadStyle(url) {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.onload = () => {
          resolve();
        };
        link.onerror = () => {
          reject(new Error(`Error al cargar ${url}`));
        };
        link.href = urlAPI + url;
        document.head.appendChild(link);
      });
    }

    const loadPromises = styles.map(loadStyle);

    Promise.all(loadPromises)
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error al cargar los estilos:', error);
        reject1(error);
      });
  });
}

function loadAllResources() {
  return Promise.all([
    loadAllScripts(),
    loadAllStyles(),
  ]);
}

export default loadAllResources;
