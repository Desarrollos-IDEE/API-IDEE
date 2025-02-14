# M.plugin.Calendar

Plugin que muestra información sobre la página y manual de uso.

# Dependencias

- calendar.ol.min.js
- calendar.ol.min.css

```html
 <link href="../../plugins/calendar/calendar.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/calendar/calendar.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-CNIG en [api-ign-legacy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-core/plugins/calendar/calendar-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/calendar/calendar-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- *position*.  Ubicación del plugin sobre el mapa (Default = 'BL')
  - 'BL' = Bottom left
  - 'BR' = Bottom right


# Ejemplo de uso

```javascript
   const map = M.map({
     container: 'map'
   });


const mp = new M.plugin.Calendar({
  position: 'TR',
});

   map.addPlugin(mp);
```
