
# M.plugin.FullTOC

Plugin que proporciona un árbol de contenidos con las capas disponibles para mostrar en el visualizador. Permite la carga de:
- capas de un listado predefinido.
- capas de servicios que introduzca el usuario.

# Aclaraciones

A la hora de mostrar la leyenda de un servicio que se haya cargado se intentará obtener dicha leyenda desde el GetCapabilities del servicio (LegendURL). Si no viniese definido se intentará cargar una leyenda por defecto solicitando la petición GetLegendGraphic y en el caso de que el servicio no tuviese definida una leyenda se mostraría una imagen vacía.
En el caso de que el servicio sea de tipo OGCAPIFeatures obtiene la leyenda mediante el método de la capa "getLegendURL".

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **fulltoc.ol.min.js**
- **fulltoc.ol.min.css**

```html
 <link href="https://componentes.cnig.es/api-core/plugins/fulltoc/fulltoc.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/fulltoc/fulltoc.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-CNIG en [api-ign-legacy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-core/plugins/fulltoc/fulltoc-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/fulltoc/fulltoc-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

- **collapsible**. Si es *true*, el panel del plugin puede abrirse y cerrarse. Por defecto tiene el valor *true*.

- **collapsed**. Si es *true*, el panel aparece cerrado. Si es *false*, el panel aparece abierto. Por defecto tiene el valor *true*.

- **http**: Si es *true* o no se rellena se permite la carga de capas de servicios desplegados con http, si se le da valor *false* no se permitirá la carga de servicios http.

- **https**: Si es *true* sólo se permite la carga de capas de servicios desplegados con https, si no se rellena o se le da valor *false* se permite la carga de cualquier servicio.

- **codsi**: Si es *true* se habilitará una nueva funcionalidad que permitirá la carga de servicios del catálogo codsi habilitando un listado con buscador de dichos servicios. Disponible al pulsar sobre el botón añadir del plugin, apareciendo unos prismáticos para realizar la búsqueda.

- **precharged**: Aquí debemos definir la estructura de los servicios predefinidos que queremos que tenga el plugin (árbol de contenido, servicios sin nodo padre, etc.). También podremos definir un parámetro para cada servicio con el que restringiremos qué capas de cada servicio queremos que sea posible cargar (white_list).
El listado de capas aparece al pulsar sobre el botón añadir (Listado de algunas capas disponibles).


# Ejemplos de uso
```javascript
   const map = M.map({
     container: 'map'
   });
   const mp = new M.plugin.FullTOC({
     collapsed: true,
     position: 'TR',
     https: true,
     http: true,
     precharged: {
  groups: [
    {
      name: 'Mapas en formato imagen',
      services: [
        {
          name: 'Mapa',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/mapa-raster?',
        },

      ],
    },
    {
      name: 'Información geográfica de referencia',
      services: [
        {
          name: 'Unidades administrativas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
          white_list: ['AU.AdministrativeBoundary', 'AU.AdministrativeUnit'],
        },
        {
          name: 'Nombres geográficos',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/ngbe?',
        },
        {
          name: 'Redes geodésicas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
        },
        {
          name: 'Cuadrículas cartográficas',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/cuadriculas?',
          white_list: ['Grid-REGCAN95-lonlat-50k', 'Grid-ETRS89-lonlat-50k', 'Grid-ETRS89-lonlat-25k', 'Grid-REGCAN95-lonlat-25k', 'Grid-25k-extendida'],
        },
      ],
    },
    {
      name: 'Fotos e imágenes aéreas',
      services: [
        {
          name: 'PNOA. Ortofotos máxima actualidad',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/pnoa-ma?',
        },
        {
          name: 'PNOA. Ortofotos históricas y PNOA anual',
          type: 'WMS',
          url: 'https://www.ign.es/wms/pnoa-historico?',
        },
        {
          name: 'PNOA. Ortofotos provisionales',
          type: 'WMS',
          url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
        },
        {
          name: 'Imagen',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/pnoa-ma?',
        },
        {
          name: 'Fototeca',
          type: 'WMS',
          url: 'https://fototeca.cnig.es/wms/fototeca.dll?',
        },
        {
          name: 'Ocupación del suelo',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo?',
        },
        {
          name: 'Ocupación del suelo. Histórico',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
        },
        {
          name: 'Ocupación del suelo',
          type: 'WMTS',
          url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
        },
        {
          name: 'Mosaicos de Satélite históricos de España',
          type: 'WMS',
          url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
        },
      ],
    },
    {
      name: 'Mapas vectoriales y Bases Cartográficas y Topográficas',
      services: [
        {
          name: 'Callejero',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/ign-base?',
        },
      ],
    },
    {
      name: 'Información geográfica temática',
      services: [
        {
          name: 'Direcciones y códigos postales',
          type: 'WMS',
          url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
        },
        {
          name: 'Modelos digitales del terreno',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/mdt?',
        },
        {
          name: 'Información Geográfica de Referencia. Transportes',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/transportes?',
        },
        {
          name: 'Información Geográfica de Referencia. Hidrografía',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
        },
        {
          name: 'Copernicus Land Monitoring Service',
          type: 'WMS',
          url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
        },
        {
          name: 'Información sísmica y volcánica',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/geofisica?',
        },
        {
          name: 'Red de Vigilancia Volcánica',
          type: 'WMS',
          url: 'https://wms-volcanologia.ign.es/volcanologia?',
        },
        {
          name: 'Fototeca',
          type: 'WMS',
          url: 'https://wms-fototeca.idee.es/fototeca?',
        },
      ],
    },
    {
      name: 'Documentación geográfica y cartografía antiguas',
      services: [
        {
          name: 'Planos de Madrid (1622 - 1960)',
          type: 'WMS',
          url: 'https://www.ign.es/wms/planos?',
        },
        {
          name: 'Hojas kilométricas (Madrid - 1860)',
          type: 'WMS',
          url: 'https://www.ign.es/wms/hojas-kilometricas?',
        },
        {
          name: 'Planimetrías',
          type: 'WMS',
          url: 'https://www.ign.es/wms/minutas-cartograficas?',
        },
        {
          name: 'Primera edición de los Mapas Topográficos Nacionales',
          type: 'WMS',
          url: 'https://www.ign.es/wms/primera-edicion-mtn?',
        },
        {
          name: 'Mapas Históricos',
          type: 'WMTS',
          url: 'https://www.ign.es/wmts/primera-edicion-mtn',
        },
      ],
    },
    {
      name: 'Modelos Digitales de Elevaciones',
      services: [
        {
          name: 'Relieve',
          type: 'WMTS',
          url: 'https://wmts-mapa-lidar.idee.es/lidar?',
        },
      ],
    },
    {
      name: 'Rutas, ocio y tiempo libre',
      services: [
        {
          name: 'Camino de Santiago',
          type: 'WMS',
          url: 'https://www.ign.es/wms-inspire/camino-santiago?',
        },
      ],
    },
    {
      name: 'Capas vectoriales',
      services: [
        {
          name: 'Colecciones del Sistema Cartográfico Nacional',
          type: 'OGCAFPIFeatures',
          url: 'https://api-features.idee.es/',
        },
      ],
    },
    {
      name: 'Catastro',
      services: [
        {
          name: 'Catastro',
          type: 'WMS',
          url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
        },
      ],
    },
  ],
},
   });

   map.addPlugin(mp);
```