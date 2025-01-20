# M.plugin.Transparency

Plugin que permite aplicar un efecto de transparencia a la capa seleccionada.

# Dependencias

- transparency.ol.min.js
- transparency.ol.min.css


```html
 <link href="../../plugins/transparency/transparency.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/transparency/transparency.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es//plugins/transparency/transparency-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es//plugins/transparency/transparency-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **layer**. Parámetro obligatorio. Array que puede contener el/los nombre/s de la/s capa/s (que está/n en el mapa), la/s url en formato api-idee para insertar una capa a través de servicios WMS ó WMTS, o la capa como objeto.
  A esta/s capa/s se le aplicará el efecto de transparencia.

- **position**. Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

- **radius**. Campo numérico que modifica el radio del efecto transparencia. Tiene un rango entre 30 y 200.
- **tooltip**. Valor a usar para mostrar en el tooltip del plugin.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.

# Ejemplos de uso

## Ejemplo 1
Insertar una capa a través de un servicio WMS. La URL en formato api-idee sigue la siguiente estructura:
  - Servicio,Leyenda,URL,Nombre. Separados por "*".
```javascript
  const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: ['WMS*IGN*http://www.ign.es/wms-inspire/ign-base*IGNBaseTodo'],
  collapsible: false
});

   map.addPlugin(mp);
```

## Ejemplo 2
Insertar dos capas a través de servicio WMS.
```javascript
  const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: ['WMS*Eventos sísmicos*https://www.ign.es/wms-inspire/geofisica*NZ.ObservedEvent', 'WMS*IGN*http://www.ign.es/wms-inspire/ign-base*IGNBaseTodo']
});

   map.addPlugin(mp);
```

## Ejemplo 3
Insertar una capa WMS por nombre.
```javascript
const wms = new M.layer.WMS({
  url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});
map,addWMS(wms);
const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: ['AU.AdministrativeBoundary'],
});

   map.addPlugin(mp);
```

## Ejemplo 4
Insertar una capa WMS como objeto.
```javascript
const wms = new M.layer.WMS({
  url: 'http://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});
map,addWMS(wms);
const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: [wms],
});

   map.addPlugin(mp);
```

## Ejemplo 5
Insertar una capa a través de servicio WMTS. Sigue la misma estructura que las WMS.
```javascript
  const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: ['WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*imagen*true*image/jpeg*true*true*']
});

   map.addPlugin(mp);
```

## Ejemplo 6
Insertar una capa WMTS por nombre.
```javascript
let wmts = new M.layer.WMTS({
  url: 'http://www.ign.es/wmts/pnoa-ma?',
  name: 'OI.OrthoimageCoverage',
  legend: 'Imagen (PNOA)',
  matrixSet: 'GoogleMapsCompatible',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  format: 'image/jpeg',
});

map.addWMTS(wmts);
  const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: ['toporaster'],
});

   map.addPlugin(mp);
```

## Ejemplo 7
Insertar una capa WMTS como objeto.
```javascript
let wmts = new M.layer.WMTS({
  url: 'http://www.ign.es/wmts/pnoa-ma?',
  name: 'OI.OrthoimageCoverage',
  legend: 'Imagen (PNOA)',
  matrixSet: 'GoogleMapsCompatible',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  format: 'image/jpeg',
});

map.addWMTS(wmts);
  const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: [wmts],
});

   map.addPlugin(mp);
```

## Ejemplo 8
Especificar radio.
```javascript
let wmts = new M.layer.WMTS({
  url: 'http://www.ign.es/wmts/pnoa-ma?',
  name: 'OI.OrthoimageCoverage',
  legend: 'Imagen (PNOA)',
  matrixSet: 'GoogleMapsCompatible',
  transparent: false,
  displayInLayerSwitcher: false,
  queryable: false,
  visible: true,
  format: 'image/jpeg',
});

map.addWMTS(wmts);
  const mp = new M.plugin.Transparency({
  position: 'TL',
  layers: ['toporaster'],
  radius: 200
});

   map.addPlugin(mp);
```
