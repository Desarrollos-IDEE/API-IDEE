
<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Stereoscopic</small></h1>

# Descripción

Plugin que muestra una vista 3D, incluye vistas por anaglifos y orbitación 3D.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **stereoscopic.ol.min.js**
- **stereoscopic.ol.min.css**

Para uso de implementación Cesium:
- **stereoscopic.cesium.min.js**
- **stereoscopic.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/stereoscopic/stereoscopic.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/stereoscopic/stereoscopic.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/stereoscopic/stereoscopic-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/stereoscopic/stereoscopic-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- *position*.  Ubicación del plugin sobre el mapa.
  - 'TL':top left
  - 'TR':top right (default)
  - 'BL':bottom left
  - 'BR':bottom right
- **collapsed**. Indica si el plugin aparece por defecto colapsado o no.
- **orbitControls**. Valor Boolean, activa "true" o desactiva (default) "false" la imagen que permite orbitar alrededor del mapa en 3D.
- **anaglyphActive**. Valor Boolean, activa "true" o desactiva (default) "false" el efecto anaglifo por defecto cuando se carga el mapa.
- **defaultAnaglyphActive**: Valor Boolean, define si la funcionalidad del control iniciará activada o desactivada.


# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map',
  layers: ['TMS*PNOA-MA*https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg*true*false*19'],
  center: [-428106.86611520057, 4884472.25393817],
  minZoom: 8,
  zoom: 8
});

const mp = new Stereoscopic({
  position: 'TL',
  collapsible: true,
  collapsed: false,
  orbitControls: false,
  anaglyphActive: true
  defaultAnaglyphActive: false,
});


 map.addPlugin(mp);
```

## Tabla de compatibilidad de versiones   
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=Stereoscopic)