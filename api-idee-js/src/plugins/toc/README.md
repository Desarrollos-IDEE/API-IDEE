# M.plugin.TOC

Muestra un árbol de contenidos con las capas disponibles para mostrar.

## Api.json

INTEGRACIÓN DE PARÁMETROS EN API REST

OPCIONES:
1. Nuevo parámetro en la API REST normalmente porque requiera parámetros de configuración.
Example: <url_apiIdee>?toc=[params]

2. Nuevo valor para el parámetro plugins, el plugin no requiere configuración
Example: <url_apiIdee>?plugins=toc

# Dependencias

- toc.ol.min.js
- toc.ol.min.css


```html
 <link href="../../plugins/toc/toc.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/toc/toc.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-ign-legacy](https://github.com/IGN-CNIG/API-IDEE/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es//plugins/toc/toc-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es//plugins/toc/toc-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**. Indica la posición donde se mostrará el plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**. Valor a usar para mostrar en el tooltip del plugin.

# Ejemplos de uso

```javascript
   const map = M.map({
     container: 'map'
   });

   const mp = new M.plugin.TOC({
        postition: 'TL',
      });

   map.addPlugin(mp);
```
