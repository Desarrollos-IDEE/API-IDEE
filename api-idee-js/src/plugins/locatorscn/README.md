<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Locatorscn</small></h1>

# Descripción

Plugin que permite utilizar diferentes herramientas para la localización:
- Servicio REST pelias-directo: permite la búsqueda de direcciones postales, topónimos y puntos de interés.
- Servicio REST pelias-inverso: Obtener dirección en un punto del mapa.

Esta extensión es una fachada del servicio pelias. En la siguiente dirección se puede encontrar toda la información sobre la api pelias:
https://github.com/pelias/api

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **locatorscn.ol.min.js**
- **locatorscn.ol.min.css**

Para uso de implementación Cesium:
- **locatorscn.cesium.min.js**
- **locatorscn.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/locatorscn/locatorscn.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/locatorscn/locatorscn.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/locatorscn/locatorscn-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/locatorscn/locatorscn-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**:  Ubicación del plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
  - 'TC': (top center) - Arriba en el centro.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**: Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Localizador.
- **zoom**: Zoom que aplicará al mostrar resultado de tipo puntual. Por defecto: 16.
- **pointStyle**: Tipo de icono a mostrar cuando se encuentra un resultado de tipo puntual.
  - 'pinAzul' (por defecto)
  - 'pinRojo'
  - 'pinMorado'
- **isDraggable**: Permite mover el plugin por el mapa. Por defecto: false.
- **searchOptions**: Configura las opciones del servicio de pelias para poder consumirlo correctamente:
  - **addendum**: Nombre de la propiedad que corresponde al addendum. Por defecto: 'none'.
  - **size**: Numero de resultados maximos para la búsqueda por texto. Por defecto: 10.
  - **layers**: Capas para pasar en la petición a pelias. Por defecto: 'address,street,venue'.
  - **sources**: Fuentes para pasar en la petición a pelias. Por defecto: ''.
  - **radius**: Radio maximo para hacer la búsqueda inversa. Por defecto: 100 (en kilómetros).
  - **urlAutocomplete**: URL del servicio de autocomplete de pelias. Por defecto: 'https://geolocalizador.idee.es/v1/autocomplete'.
  - **urlReverse**: URL del servicio de reverse de pelias. Por defecto: 'https://geolocalizador.idee.es/v1/reverse'.

  ```javascript
  searchOptions: {
    addendum: 'iderioja',
    size: 15,
    layers: 'address,street,venue',
    // sources: 'calrj',
    radius: 200,
    // urlAutocomplete: '',
    // urlReverse: '',
  }
  ```
  (Válido sólo para la creación del plugin por JS y API-REST en base64).
- **useProxy**: Determina si se desea que las peticiones que se realizan en el control de búsqueda de lugares se realizan con el proxy o no. Por defecto: true.

# API-REST

```javascript
URL_API?locatorscn=position*collapsed*collapsible*tooltip*zoom*pointStyle*isDraggable*searchOptions
```

<table>
  <tr>
    <td>Parámetros</td>
    <td>Opciones/Descripción</td>
    <td>Disponibilidad</td>
  </tr>
  <tr>
    <td>position</td>
    <td>TR/TL/BR/BL</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>collapsed</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>collapsible</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>tooltip</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>zoom</td>
    <td>zoom</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>useProxy</td>
    <td>useProxy</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>pointStyle</td>
    <td>pinAzul/pinRojo/pinMorado</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>isDraggable</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>searchOptions</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
</table>
### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee?locatorscn=TL*true*true*tooltip*16
```

```
https://componentes.idee.es/api-idee?locatorscn=TL*true*true*tooltip*16*pinAzul*true
```

### Ejemplo de uso

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

```
Ejemplo de constructor del plugin: {position:'TL', collapsible: true, collapsed: true, tooltip: 'Localización', searchOptions: {addendum: 'iderioja', size: 15, layers: 'address,street,venue', radius: 200}}

https://componentes.idee.es/api-idee?locatorscn=base64=eyJwb3NpdGlvbiI6IlRMIiwiY29sbGFwc2libGUiOnRydWUsImNvbGxhcHNlZCI6dHJ1ZSwidG9vbHRpcCI6IkxvY2FsaXphY2nDs24iLCJzZWFyY2hPcHRpb25zIjp7ImFkZGVuZHVtIjoiaWRlcmlvamEiLCJzaXplIjoxNSwibGF5ZXJzIjoiYWRkcmVzcyxzdHJlZXQsdmVudWUiLCJyYWRpdXMiOjIwMH19
```

# Eventos

- **ignsearchlocatorscn:entityFound**
  - Evento que se dispara cuando se ha localizado la búsqueda del plugin sobre el mapa.
  - Expone, como parámetro devuelto, el **extent** actual calculado en la búsqueda

```javascript
pluginignsearchlocatorscn.on('ignsearchlocatorscn:entityFound', (extent) => {
  // eslint-disable-next-line no-alert
  window.alert('Encontrado');
});
```

# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new IDEE.plugin.Locatorscn({
  position: 'TL',
  collapsible: true,
  collapsed: true,
  zoom: 16,
  pointStyle: 'pinMorado',
    searchOptions: {
    addendum: 'iderioja',
    size: 15,
    layers: 'address,street,venue',
    // sources: 'calrj',
    radius: 200,
    // urlAutocomplete: '',
    // urlReverse: '',
  },
  isDraggable: false,
});

map.addPlugin(mp);
```


# 👨‍💻 Desarrollo

Para el stack de desarrollo de este componente se ha utilizado

* NodeJS Version: 14.16
* NPM Version: 6.14.11
* Entorno Windows.

## 📐 Configuración del stack de desarrollo / *Work setup*


### 🐑 Clonar el repositorio / *Cloning repository*

Para descargar el repositorio en otro equipo lo clonamos:

```bash
git clone [URL del repositorio]
```

### 1️⃣ Instalación de dependencias / *Install Dependencies*

```bash
npm i
```

### 2️⃣ Arranque del servidor de desarrollo / *Run Application*

```bash
npm start:ol
npm start:cesium
```

## 📂 Estructura del código / *Code scaffolding*

```any
/
├── src 📦                  # Código fuente
├── task 📁                 # EndPoints
├── test 📁                 # Testing
├── webpack-config 📁       # Webpack configs
└── ...
```
## 📌 Metodologías y pautas de desarrollo / *Methodologies and Guidelines*

Metodologías y herramientas usadas en el proyecto para garantizar el Quality Assurance Code (QAC)

* ESLint
  * [NPM ESLint](https://www.npmjs.com/package/eslint) \
  * [NPM ESLint | Airbnb](https://www.npmjs.com/package/eslint-config-airbnb)

## ⛽️ Revisión e instalación de dependencias / *Review and Update Dependencies*

Para la revisión y actualización de las dependencias de los paquetes npm es necesario instalar de manera global el paquete/ módulo "npm-check-updates".

```bash
# Install and Run
$npm i -g npm-check-updates
$ncu
```

## Tabla de compatibilidad de versiones   
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=locatorscn)