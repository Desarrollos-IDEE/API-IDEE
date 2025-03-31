# IDEE.plugin.Calendar

Plugin que muestra información sobre la página y manual de uso.

# Dependencias

- calendar.ol.min.js
- calendar.ol.min.css

```html
 <link href="../../plugins/calendar/calendar.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/calendar/calendar.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/calendar/calendar-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/calendar/calendar-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- *position*.  Ubicación del plugin sobre el mapa (Default = 'BL')
  - 'BL' = Bottom left
  - 'BR' = Bottom right


# Ejemplo de uso

```javascript
   const map = IDEE.map({
     container: 'map'
   });


const mp = new IDEE.plugin.Calendar({
  position: 'TR',
});

   map.addPlugin(mp);
```
