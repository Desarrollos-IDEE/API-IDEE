# M.plugin.GeometryDraw

Plugin que permite el dibujo y edición de geometrías sobre un mapa, así como su descarga.


# Dependencias

- geometrydraw.ol.min.js
- geometrydraw.ol.min.css


```html
 <link href="../../plugins/geometrydraw/geometrydraw.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/geometrydraw/geometrydraw.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-ign-legacy](https://github.com/IGN-CNIG/API-IDEE/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/geometrydraw/geometrydraw-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/geometrydraw/geometrydraw-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**. Valor a usar para mostrar en el tooltip del plugin.

# Parámetros API REST
```javascript
URL_API?geometrydraw=position*collapsed*collapsible
````
Ejemplo:
```javascript
https://componentes.cnig.es/api-idee/?geometrydraw=BL*true*true
```


### Ejemplos de uso

```javascript
const map = M.map({
  container: 'mapjs',
});

const mp = new M.plugin.GeometryDraw();

map.addPlugin(mp);
```

```javascript
const map = M.map({
  container: 'mapjs',
});

const mp = new M.plugin.GeometryDraw({
  position: 'TL',
  collapsed: true,
  collapsible: true,

});

map.addPlugin(mp);
```
