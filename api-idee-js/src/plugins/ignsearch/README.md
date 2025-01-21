# IDEE.plugin.IGNSearch


Plugin que permite la búsqueda de Direcciones postales (Geocoder de Cartociudad) y Topónimos (Nomenclátor del IGN)

# Dependencias

- ignsearch.ol.min.js
- ignsearch.ol.min.css

```html
 <link href="../../plugins/ignsearch/ignsearch.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/ignsearch/ignsearch.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/ignsearch/ignsearch-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/ignsearch/ignsearch-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **servicesToSearch**. Servicio que se consulta:
  - **'g'**: Consulta Geocoder.
  - **'n'**: Consulta Topónimos.
  - **'gn'** : Consulta Geocoder y Topónimos.
- **maxResults**. Número de resultados en cada una de las consultas a los diferentes servicios (Cada uno de estos servicios internamente tiene también su límite de resultados, en geocoder, por ejemplo, es 5).
- **noProcess**. En geocoder, indica las entidades que no se incluirán en los resultados.
  - Admite combinación de 'municipio,poblacion,toponimo'.
  - Por defecto ('poblacion').
- **countryCode**. Código por defecto del país en la petición a geocoder. Por defecto countryCode = 'es'.
- **resultVisibility**. Indica si se muestra o no la geometría del elemento localizado. Por defecto true (la muestra).
- **isCollapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: false.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: false.

- **position**. Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

- **reverse**. Valor booleano que indica si debe aparecer (true) o no (false) el botón que gestiona la consulta de reverse sobre el mapa.
  La consulta reverse revela la información de un punto determinado del mapa tras pinchar en él.

- **requeststreet**. Url con la petición find que se le hace al geocoder. Este atributo se usa únicamente cuando se accede al plugin mediante la url de sharemap.

- **locationId**. ID del punto geográfico localizado. Este atributo se puede usar como alternativa al requeststreet.

- **geocodercoords**. Coordenadas x,y de un punto geográfico. Este atributo se usa principalmente para las peticiones de reverse al geocoder.

# Eventos

- **ignsearch:entityFound**
  - Evento que se dispara cuando se ha localizado la búsqueda del plugin sobre el mapa.
  - Expone, como parámetro devuelto, el **extent** actual calculado en la búsqueda.

```javascript
mp.on('ignsearch:entityFound', (extent) => {
  // eslint-disable-next-line no-alert
  window.alert('Encontrado');
});
```

# Otros métodos

- **setResultVisibility( boolean )**
  - Habilita o deshabilita la visualización de los resultados sobre el mapa.

# Otros parámetros dentro del código
- **urlCandidates**. Url servicio candidates de geocoder. Por defecto 'http://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp'.
- **urlFind**. Url servicio find de geocoder. Por defecto 'http://www.cartociudad.es/geocoder/api/geocoder/findJsonp'.
- **urlReverse**. Url Servicio geocoding inverso. Por defecto 'http://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode'.
- **urlPrefix**. Prefijo source servicio Nomenclátor. Por defecto 'http://www.idee.es/'.
- **urlAssistant**. Url servicio SearchAssitant de Nomenclátor. Por defecto 'https://www.idee.es/communicationsPoolServlet/.SearchAssistant'.
- **urlDispatcher**. Url servicio Dispatcher de Nomenclátor. Por defecto 'https://www.idee.es/communicationsPoolServlet/Dispatcher'.


# Ejemplo de uso

```javascript
   const map = IDEE.map({
     container: 'map'
   });

   const mp = new IDEE.plugin.IGNSearch({
        servicesToSearch: 'gn',
        maxResults: 10,
        noProcess: 'poblacion',
        countryCode: 'es',
        isCollapsed: false,
        position: 'TL',
        reverse: true,

            urlCandidates: 'https://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp',
            urlFind: 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp',
            urlReverse: 'https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode',
      });

   map.addPlugin(mp);
```
