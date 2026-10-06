/*
 * Caso manual servido de forma estática después de construir api-idee-js.
 * Véase docs/PRUEBAS_MANUALES_KMZ.md.
 */
(async () => {
  const params = new URLSearchParams(location.search);
  const engine = params.get('engine') === 'cesium' ? 'cesium' : 'ol';
  const byId = (id) => document.getElementById(id);
  const status = byId('status');
  const log = byId('log');
  const engineSelect = byId('engine');
  engineSelect.value = engine;

  const writeLog = (message) => {
    const time = new Date().toLocaleTimeString();
    log.textContent = `[${time}] ${message}\n${log.textContent}`;
  };
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('error', error);
    writeLog(message);
  };
  const loadAsset = (tagName, attributes) => new Promise((resolve, reject) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => { element[key] = value; });
    element.onload = resolve;
    element.onerror = reject;
    document.head.appendChild(element);
  });

  engineSelect.addEventListener('change', () => {
    const next = new URL(location.href);
    next.searchParams.set('engine', engineSelect.value);
    location.href = next.href;
  });

  try {
    await loadAsset('link', {
      rel: 'stylesheet', href: `../../../dist/assets/css/apiidee.${engine}.min.css`,
    });
    await loadAsset('script', { src: `../../../dist/js/apiidee.${engine}.min.js` });
    await loadAsset('script', { src: '../../configuration_filtered.js' });

    IDEE.config('CESIUM_URL', new URL('../../../dist/cesium/', location.href).href);
    IDEE.config.baseLayer = [];
    IDEE.config.terrain.default = [];
    IDEE.proxy(false);

    const map = IDEE.map({
      container: 'map',
      layers: [],
      controls: [],
      projection: 'EPSG:3857',
      center: [-333958, 4865942],
      zoom: 5,
    });
    window.mapa = map;
    let layer;

    const updateSummary = () => {
      byId('type').textContent = layer?.type || '—';
      byId('name').textContent = layer?.name || '—';
      byId('features').textContent = layer?.getFeatures?.().length ?? 0;
      byId('visibility').textContent = layer ? String(layer.isVisible()) : '—';
      byId('registered').textContent = layer ? map.getKMZ({ name: layer.name }).length : 0;
    };
    const removeCurrent = () => {
      if (layer) map.removeLayers(layer);
      layer = undefined;
      window.capaKMZ = undefined;
      updateSummary();
    };
    const listen = (candidate) => {
      layer = candidate;
      window.capaKMZ = candidate;
      updateSummary();
      setStatus('Descomprimiendo y cargando…');
      candidate.on('load:error', (error) => {
        updateSummary();
        setStatus(`Error esperado o de carga: ${error.message}`, true);
      });
      candidate.on(IDEE.evt.LOAD, () => {
        updateSummary();
        const names = candidate.getFeatures()
          .map((feature) => feature.getAttribute?.('name'))
          .filter(Boolean)
          .join(', ');
        setStatus(`${engine}: ${candidate.getFeatures().length} objetos cargados${names ? ` (${names})` : ''}.`);
      });
    };
    const loadURL = (url) => {
      removeCurrent();
      const candidate = new IDEE.layer.KMZ({
        name: 'Prueba KMZ',
        url,
        extract: true,
        refreshInterval: byId('refresh').checked ? Number(byId('interval').value) : undefined,
      });
      listen(candidate);
      map.addLayers(candidate);
    };

    map.on(IDEE.evt.ADDED_KMZ, (layers) => {
      if (layers[0] !== layer) listen(layers[0]);
      writeLog(`Evento ADDED_KMZ: ${layers.map((item) => item.name).join(', ')}`);
    });
    map.on(IDEE.evt.REMOVED_LAYER, () => {
      writeLog('Evento REMOVED_LAYER');
      updateSummary();
    });

    byId('sample').addEventListener('click', () => {
      loadURL(new URL(`../../playwright/fixtures/kmz/${byId('fixture').value}`, location.href).href);
    });
    byId('dynamic').addEventListener('click', () => {
      const base = params.get('data') || 'http://localhost:8083/datos-prueba/';
      byId('url').value = new URL('puntos.kmz', base).href;
      loadURL(byId('url').value);
    });
    byId('apply-interval').addEventListener('click', () => {
      if (!layer) return;
      layer.updateRefreshInterval(byId('refresh').checked ? Number(byId('interval').value) : 0);
      setStatus(`Intervalo configurado: ${layer.getAutoRefreshInterval() || 'desactivado'} ms.`);
    });
    byId('load').addEventListener('click', () => {
      const url = byId('url').value.trim();
      const localPath = /^(file:|\\\\|\/\/wsl)/i.test(url);
      if (localPath) {
        setStatus('Una ruta local no se puede cargar como URL. Usa el selector «Archivo local».', true);
      } else if (/^https?:\/\//i.test(url)) {
        loadURL(url);
      } else if (url) {
        setStatus('La URL debe comenzar por http:// o https://.', true);
      } else {
        setStatus('Introduce una URL antes de cargar.', true);
      }
    });
    byId('file').addEventListener('change', (event) => {
      const [file] = event.target.files;
      if (!file) return;
      removeCurrent();
      IDEE.loadFiles.addFileToMap(map, file);
    });
    byId('visible').addEventListener('click', () => {
      if (!layer) return;
      layer.setVisible(!layer.isVisible());
      updateSummary();
      setStatus(`Visibilidad cambiada a ${layer.isVisible()}.`);
    });
    byId('reload').addEventListener('click', () => {
      if (layer) {
        setStatus('Recarga solicitada…');
        layer.refresh();
      }
    });
    byId('change-url').addEventListener('click', () => {
      if (!layer) return;
      const url = new URL('../../playwright/fixtures/kmz/updated.kmz', location.href).href;
      setStatus('Cambiando la URL de la capa…');
      layer.setURL(url);
    });
    byId('fit').addEventListener('click', async () => {
      if (!layer) return;
      const extent = await layer.calculateMaxExtent();
      map.setBbox(extent);
      setStatus('Mapa encuadrado a la extensión de la capa.');
    });
    byId('remove').addEventListener('click', () => {
      removeCurrent();
      setStatus('Capa KMZ eliminada.');
    });
    byId('kml').addEventListener('click', () => {
      const kml = new IDEE.layer.KML({
        name: `Control KML ${Date.now()}`,
        url: new URL('../../playwright/fixtures/kmz/basic.kml', location.href).href,
        extract: true,
      });
      map.addLayers(kml);
      kml.on(IDEE.evt.LOAD, () => setStatus(`KML de control cargado: ${kml.getFeatures().length} objetos.`));
    });

    let plugin;
    const loadedPlugins = new Set();
    const loadPluginBundle = async (name) => {
      window.M = window.IDEE;
      const base = `../../../src/plugins/${name}/dist/${name}.${engine}.min`;
      if (!loadedPlugins.has(name)) {
        await loadAsset('link', { rel: 'stylesheet', href: `${base}.css` });
        await loadAsset('script', { src: `${base}.js` });
        loadedPlugins.add(name);
      }
    };
    const loadPlugin = async (name, className, options = {}) => {
      if (plugin) map.removePlugin(plugin);
      await loadPluginBundle(name);
      const Constructor = IDEE.plugin?.[className] || M.plugin?.[className];
      if (!Constructor) throw new Error(`El bundle ${name} no publica ${className}.`);
      plugin = new Constructor(options);
      map.addPlugin(plugin);
      setStatus(`Plugin ${className} añadido. Interactúa con su panel en el mapa.`);
      return plugin;
    };

    window.pruebaKMZ = {
      map,
      get layer() { return layer; },
      get plugin() { return plugin; },
      loadURL,
      loadPlugin,
      loadPluginBundle,
      removePlugin: () => { if (plugin) map.removePlugin(plugin); plugin = undefined; },
      fixture: (name) => new URL(`../../playwright/fixtures/kmz/${name}`, location.href).href,
    };
    setStatus(`Caso preparado con ${engine}. Elige un ejemplo, una URL o un archivo local.`);
  } catch (error) {
    setStatus(`No se pudo iniciar: ${error.message}. Construye los bundles y sirve api-idee-js por HTTP.`, true);
  }
})();
