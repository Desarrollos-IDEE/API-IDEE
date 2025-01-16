# M.plugin.IberpixCompare

Plugin compilatorio de comparadores

# Dependencias

- iberpixcompare.ol.min.js
- iberpixcompare.ol.min.css


```html
 <link href="../../plugins/iberpixcompare/iberpixcompare.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/iberpixcompare/iberpixcompare.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/IGN-CNIG/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/iberpixcompare/iberpixcompare-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/iberpixcompare/iberpixcompare-1.0.0.ol.min.js"></script>
```

# Parámetros

- El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**. Indica la posición donde se mostrará el plugin.
  - 'TL':top left
  - 'TR':top right (default)
  - 'BL':bottom left
  - 'BR':bottom right

- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.

- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.

- **vertical**. Si es *true*, el panel se verá con la orientación vertical. Si es *false*, el panel se verá con la orientación horizontal. Por defecto tiene el valor *true*

- **baseLayers**. Parámetro obligatorio. Array que contiene cada capa junto a sus datos:
  - Nombre: nombre descriptivo de la capa. Se puede dejar vacío con comillas vacías: *''*
  - Etiqueta: etiqueta o fecha de la capa. Se puede dejar vacío con comillas vacías: *''*
  - Servicio en formato api-idee para insertar una capa a través de servicios WMS ó WMTS, o la capa como objeto, de cada intervalo.

- **mirrorpanelParams**. Parámetros opcionales del plugin mirrorpanel.

- **backImgLayersConfig**. Parámetros opcionales del plugin BackImgLayers.

- **fullTOCConfig**. Parámetros opcionales del plugin FullTOC.

- **vectorsConfig**. Parámetros opcionales del plugin Vectors.

- **lyrcompareParams**. Objeto con el resto de parámetros de lyrcompare

- **tooltip**. Valor a usar para mostrar en el tooltip del plugin.

# Ejemplos de uso

## Ejemplo
Insertar intervalos a través de servicios WMS. La URL en formato api-idee sigue la siguiente estructura:
  - Servicio,Leyenda,URL,Nombre. Separados por "*".
```javascript
const mp = new M.plugin.IberpixCompare({
    position: 'TL',
    vertical: true,
    collapsible: false,
    baseLayers: [
      ['Americano 1956-1957', '1956', 'WMS*Americano 1956-1957*https://www.ign.es/wms/pnoa-historico*AMS_1956-1957'],
      ['Interministerial 1973-1986', '1983', 'WMS*Interministerial 1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986'],
      ['Nacional 1981-1986', '1986', 'WMS*Nacional 1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
      ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
      ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
      ['PNOA 2004', '2004', 'WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
      ['PNOA 2005', '2005', 'WMS*PNOA 2005*https://www.ign.es/wms/pnoa-historico*pnoa2005'],
      ['PNOA 2006', '2006', 'WMS*PNOA 2006*https://www.ign.es/wms/pnoa-historico*pnoa2006'],
      ['PNOA 2007', '2007', 'WMS*PNOA 2007*https://www.ign.es/wms/pnoa-historico*pnoa2007'],
      ['PNOA 2008', '2008', 'WMS*PNOA 2008*https://www.ign.es/wms/pnoa-historico*pnoa2008'],
      ['PNOA 2009', '2009', 'WMS*PNOA 2009*https://www.ign.es/wms/pnoa-historico*pnoa2009'],
      ['PNOA 2010', '2010', 'WMS*PNOA 2010*https://www.ign.es/wms/pnoa-historico*pnoa2010'],
      ['PNOA 2011', '2011', 'WMS*PNOA 2011*https://www.ign.es/wms/pnoa-historico*pnoa2011'],
      ['PNOA 2012', '2012', 'WMS*PNOA 2012*https://www.ign.es/wms/pnoa-historico*pnoa2012'],
      ['PNOA 2013', '2013', 'WMS*PNOA 2013*https://www.ign.es/wms/pnoa-historico*pnoa2013'],
      ['PNOA 2014', '2014', 'WMS*PNOA 2014*https://www.ign.es/wms/pnoa-historico*pnoa2014'],
      ['PNOA 2015', '2015', 'WMS*PNOA 2015*https://www.ign.es/wms/pnoa-historico*pnoa2015'],
      ['PNOA 2016', '2016', 'WMS*PNOA 2016*https://www.ign.es/wms/pnoa-historico*pnoa2016'],
      ['PNOA 2017', '2017', 'WMS*PNOA 2017*https://www.ign.es/wms/pnoa-historico*pnoa2017'],
      ['PNOA 2018', '2018', 'WMS*PNOA 2018*https://www.ign.es/wms/pnoa-historico*pnoa2018'],
      ['PNOA 2019', '2019', 'WMS*PNOA 2019*https://www.ign.es/wms/pnoa-historico*pnoa2019'],
      ['PNOA 2020', '2020', 'WMS*PNOA 2020*https://www.ign.es/wms/pnoa-historico*OrtoimagenExpedita'],
    ],
    mirrorpanelParams: { showCursors: true },
    backImgLayersConfig: {
      position: 'TR',
      layerId: 0,
      layerVisibility: true,
      collapsed: true,
      collapsible: true,
      columnsNumber: 3,
      layerOpts: [
        {
          id: 'mapa',
          preview: MAPA,
          title: 'Mapa',
          layers: [
            new M.layer.WMTS({
              url: 'http://www.ign.es/wmts/ign-base?',
              name: 'IGNBaseTodo',
              legend: 'Mapa',
              matrixSet: 'GoogleMapsCompatible',
              transparent: false,
              displayInLayerSwitcher: false,
              queryable: false,
              visible: true,
              format: 'image/jpeg',
            }),
          ],
        },
        {
          id: 'imagen',
          preview: IMAGEN,
          title: 'Imagen',
          layers: [
            new M.layer.WMTS({
              url: 'http://www.ign.es/wmts/pnoa-ma?',
              name: 'OI.OrthoimageCoverage',
              legend: 'Imagen',
              matrixSet: 'GoogleMapsCompatible',
              transparent: false,
              displayInLayerSwitcher: false,
              queryable: false,
              visible: true,
              format: 'image/jpeg',
            }),
          ],
        },
        {
          id: 'hibrido',
          title: 'Híbrido',
          preview: HIBRIDO,
          layers: [
            new M.layer.WMTS({
              url: 'http://www.ign.es/wmts/pnoa-ma?',
              name: 'OI.OrthoimageCoverage',
              matrixSet: 'GoogleMapsCompatible',
              legend: 'Imagen',
              transparent: true,
              displayInLayerSwitcher: false,
              queryable: false,
              visible: true,
              format: 'image/jpeg',
            }),
            new M.layer.WMTS({
              url: 'http://www.ign.es/wmts/ign-base?',
              name: 'IGNBaseOrto',
              matrixSet: 'GoogleMapsCompatible',
              legend: 'Topónimos',
              transparent: true,
              displayInLayerSwitcher: false,
              queryable: false,
              visible: true,
              format: 'image/png',
            })
          ],
        },
      ],
    },
    fullTOCConfig: {
      collapsed: true,
      position: 'TR',
      https: true,
      http: true,
      precharged: {
        groups: [
          {
            name: 'IGN',
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
              {
                name: 'Información sísmica y volcánica',
                type: 'WMS',
                url: 'https://www.ign.es/wms-inspire/geofisica?',
              },
              {
                name: 'Fototeca',
                type: 'WMS',
                url: 'https://wms-fototeca.idee.es/fototeca?',
              },
              {
                name: 'Camino de Santiago',
                type: 'WMS',
                url: 'https://www.ign.es/wms-inspire/camino-santiago?',
              },
            ],
          },
          {
            name: 'IGN. Cartografía histórica',
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
            ],
          },
      	  {
            name: 'Sistema Cartográfico Nacional',
            services: [
              {
                name: 'PNOA. Ortofotos máxima actualidad',
                type: 'WMS',
                url: 'https://www.ign.es/wms-inspire/pnoa-ma?',
              },
              {
                name: 'PNOA. Ortofotos históricas',
                type: 'WMS',
                url: 'https://www.ign.es/wms/pnoa-historico?',
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
                name: 'Copernicus Land Monitoring Service',
                type: 'WMS',
                url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
              },
            ],
          },
          {
            name: 'Capas de fondo',
            services: [
              {
                name: 'Mapa',
                type: 'WMTS',
                url: 'https://www.ign.es/wmts/mapa-raster?',
              },
              {
                name: 'Imagen',
                type: 'WMTS',
                url: 'https://www.ign.es/wmts/pnoa-ma?',
              },
              {
                name: 'Callejero',
                type: 'WMTS',
                url: 'https://www.ign.es/wmts/ign-base?',
              },
              {
                name: 'Relieve',
                type: 'WMTS',
                url: 'https://wmts-mapa-lidar.idee.es/lidar?',
              },
              {
                name: 'Ocupación del suelo',
                type: 'WMTS',
                url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
              },
              {
                name: 'Mapas Históricos',
                type: 'WMTS',
                url: 'https://www.ign.es/wmts/primera-edicion-mtn',
              }
            ],
          }
        ],
        services: [
          {
            name: 'Catastro',
            type: 'WMS',
            url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
          },
        ],
      },
    },
    vectorsConfig: {
      collapsed: true,
      collapsible: true,
      position: 'TR',
      wfszoom: 12,
      precharged: [
        {
          name: 'Hidrografía',
          url: 'https://servicios.idee.es/wfs-inspire/hidrografia?',
        },
        {
          name: 'Límites administrativos',
          url: 'https://www.ign.es/wfs-inspire/unidades-administrativas?',
        },
      ],
    },
  }));

   map.addPlugin(mp);
```
