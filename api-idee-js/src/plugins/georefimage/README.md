# IDEE.plugin.Georefimage


Plugin que permite la descarga de la imagen georeferenciada que se muestra en pantalla.

# Dependencias

- georefimage.ol.min.js
- georefimage.ol.min.css

```html
 <link href="../../plugins/georefimage/georefimage.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/georefimage/georefimage.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/georefimage/georefimage-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/georefimage/georefimage-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.

- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.

- **serverUrl**: URL del servidor Geoprint.

- **printTemplateUrl**: URL con las plantillas.

- **printStatusUrl**: URL que indica el estado del servidor Geoprint.

- **tooltip**. Valor a usar para mostrar en el tooltip del plugin.


# Ejemplos de uso

## Configuración por defecto sin parámetros:
```javascript
mapajs = IDEE.map({
  container: "map"
});

mapajs.addPlugin(new IDEE.plugin.Georefimage());
```
## Configuración con parámetros:
```javascript
mapajs = IDEE.map({
  container: "map"
});

mapajs.addPlugin(new IDEE.plugin.Georefimage({
  position: 'TR',
  collapsed: false,
  collapsible: false,
  serverUrl: 'https://componentes.cnig.es',
  printTemplateUrl: 'https://componentes.cnig.es/geoprint/print/CNIG',
  printStatusUrl: 'https://componentes.cnig.es/geoprint/print/CNIG/status',

}));