# M.plugin.ZoomPanel

Ofrece diferentes herramientas de zoom.

# Dependencias

- zoompanel.ol.min.js
- zoompanel.ol.min.css


```html
 <link href="../../plugins/zoompanel/zoompanel.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/zoompanel/zoompanel.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-CNIG en [api-ign-legacy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-core/plugins/zoompanel/zoompanel-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/zoompanel/zoompanel-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
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

   const mp = new M.plugin.ZoomPanel({
        position: 'TL',
        collapsed: true,
        collapsible: true,
   });

   map.addPlugin(mp);
```
