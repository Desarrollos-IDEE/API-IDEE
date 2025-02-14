# M.plugin.Vectors

Plugin que permite el dibujo y edición de geometrías sobre un mapa, así como su descarga.


# Dependencias

- vectors.ol.min.js
- vectors.ol.min.css


```html
 <link href="../../plugins/vectors/vectors.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/vectors/vectors.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-CNIG en [api-ign-legacy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-core/plugins/vectors/vectors-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/vectors/vectors-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **wfszoom**. Zoom WFS, por defecto 12.
- **precharged**. Conjunto de capas. Ejemplo:
```JavaScript
const precharged = [
  {
    name: 'Hidrografía',
    url: 'https://servicios.idee.es/wfs-inspire/hidrografia?',
  },
  {
    name: 'Límites administrativos',
    url: 'https://www.ign.es/wfs-inspire/unidades-administrativas?',
  },
];
```

# Parámetros API REST
```javascript
URL_API?vectors=position*collapsed*collapsible
````
Ejemplo:
```javascript
https://componentes.cnig.es/api-core/?vectors=BL*true*true
```


# Ejemplos de uso

```javascript
const map = M.map({
  container: 'mapjs',
});

const mp = new M.plugin.Vectors();

map.addPlugin(mp);
```

```javascript
const map = M.map({
  container: 'mapjs',
});

const mp = new M.plugin.Vectors({
  collapsed: true,
  collapsible: true,
  position: 'TL',
});

map.addPlugin(mp);
```
