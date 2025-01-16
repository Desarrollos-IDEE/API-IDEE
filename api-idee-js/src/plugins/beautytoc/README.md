# M.plugin.BeautyTOC

Muestra una tabla de contenidos con las capas disponibles para mostrar.

# Dependencias
Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **beautytoc.ol.min.js**
- **beautytoc.ol.min.css**

```html
 <link href="https://componentes.cnig.es/api-idee/plugins/beautytoc/beautytoc.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/beautytoc/beautytoc.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/IGN-CNIG/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/beautytoc/beautytoc-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/beautytoc/beautytoc-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **tooltip**: Descripción emergente que se muestra sobre el plugin (se muestra al dejar el ratón encima del plugin como información). Por defecto, _Capas Adicionales_.

# Ejemplos de uso

```javascript
   const map = M.map({
     container: 'map'
   });

  const capaRaster = new M.layer.WMS({
    url: 'https://www.ign.es/wms/pnoa-historico?',
    name: 'OLISTAT',
    legend: 'OLISTAT (1997-1998)',
    tiled: false,
    version: '1.3.0',
  });

  const capaVectorial = new M.layer.WMS({
    url: 'http://www.ign.es/wms-inspire/cuadriculas?',
    name: 'Grid-ETRS89-lonlat-25k,Grid-REGCAN95-lonlat-25k',
    legend: 'Cuadrícula cartográfica del MTN25',
    tiled: false,
    version: '1.1.1',
  }, { visibility: false, displayInLayerSwitcher: true, queryable: false });

map.addLayers([capaRaster, capaVectorial]);


   const mp = new M.plugin.BeautyTOC({
        postition: 'TL',
    });

   map.addPlugin(mp);
```
