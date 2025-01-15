# M.plugin.SelectionDraw

Plugin que permite representar geometrías y obtener la información asociada en formato JSON.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **selectiondraw.ol.min.js**
- **selectiondraw.ol.min.css**


```html
 <link href="https://componentes.cnig.es//plugins/selectiondraw/selectiondraw.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es//plugins/selectiondraw/selectiondraw.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-ign-legacy](https://github.com/IGN-CNIG/API-IDEE/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es//plugins/selectiondraw/selectiondraw-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es//plugins/selectiondraw/selectiondraw-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **projection**: Indica la proyección en que seran devueltas las geometrías que se dibujen en el mapa. Por defecto, EPSG:4326.

# Ejemplos de uso

```javascript
   const map = M.map({
     container: 'map'
   });

   const mp = new M.plugin.SelectionDraw({
        projection: 'EPSG:4326',
        position: 'TL',
        collapsed: false,
        collapsible: true,
   });

   mp.on('finisihed:draw', (featureJSON) => {
      // lógica de negocio
      console.log(featureJSON);
   });
   // Al terminar de dibujar, el plugin ejecutará siempre el callback anterior,
   // tomando como parámetro el feature dibujado como GeoJSON
   // en la proyección que indiquemos en el constructor.

   map.addPlugin(mp);
```
