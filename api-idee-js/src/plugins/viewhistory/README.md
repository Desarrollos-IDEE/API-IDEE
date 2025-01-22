# IDEE.plugin.ViewHistory

Plugin que permite navegar entre las vistas visitadas del mapa (hacia adelante y atrás).

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **viewhistory.ol.min.js**
- **viewhistory.ol.min.css**


```html
 <link href="https://componentes.cnig.es/)/plugins/viewhistory/viewhistory.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es//plugins/viewhistory/viewhistory.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es//plugins/viewhistory/viewhistory-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es//plugins/viewhistory/viewhistory-1.0.0.ol.min.js"></script>
```


# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

# Ejemplos de uso

```javascript
   const map = IDEE.map({
     container: 'map'
   });

   const mp = new IDEE.plugin.ViewHistory({
     position: 'TL'
   });

   map.addPlugin(mp);
});
```
