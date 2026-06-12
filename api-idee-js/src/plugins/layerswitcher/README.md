<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Layerswitcher</small></h1>

# Descripción

Extensión que permite listar y gestionar las capas (servicios web y/o ficheros) añadidas en el mapa, de forma fácil y rápida.
La carga de nuevos servicios se pueden realizar mediante el listado predefinido o indicando la URL del servicio.



# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **layerswitcher.ol.min.js**
- **layerswitcher.ol.min.css**

Para uso de implementación Cesium:
- **layerswitcher.cesium.min.js**
- **layerswitcher.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**:  Ubicación del plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**: Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Gestor de capas.
- **isDraggable**: Permite mover el plugin por el mapa. Por defecto: false.
- **http**: Si es *true* se permite la carga de capas de servicios desplegados con http, si se le da valor *false* no se permitirá la carga de servicios http. Por defecto: true.
- **https**: Si es *true* sólo se permite la carga de capas de servicios desplegados con https, si no se rellena o se le da valor *false* se permite la carga de cualquier servicio. Por defecto: true.
- **showCatalog**: Si es *true* se habilitará una nueva funcionalidad que permitirá la carga de servicios del catálogo habilitando un listado con buscador de dichos servicios. Disponible al pulsar sobre el botón añadir del plugin, apareciendo unos prismáticos para realizar la búsqueda. Por defecto: false.
- **precharged**: Aquí debemos definir la estructura de los servicios predefinidos que queremos que tenga el plugin (árbol de contenido, servicios sin nodo padre, etc.). También podremos definir un parámetro para cada servicio con el que restringiremos qué capas de cada servicio queremos que sea posible cargar (white_list).
El listado de capas aparece al pulsar sobre el botón añadir (Listado de algunas capas disponibles).
- **isMoveLayers**: Permite mover las capas en el árbol de contenidos para cambiar el orden de visualización. Por defecto: false.
- **modeSelectLayers**: Permite cambiar el modo de selección de las capas para su visualización.
  - 'eyes': permite visualizar varias capas a la vez. Por defecto activado.
  - 'radio': permite la visualización de una sola capa a la vez.
- **tools**: permite añadir funcionalidades a cada capa. Se forma mediante un array de funcionalidades:
  - 'transparency': permite cambiar la opacidad a la capa.
  - 'legend': permite consultar la leyenda de la capa.
  - 'zoom': permite hacer zoom a la capa.
  - 'information': permite consultar la información de la capa.
  - 'style': permite cambiar el estilo a la capa (si lo permite).
  - 'delete': permite eliminar la capa del mapa.
  Por defecto añade todas las herramientas.
- **useProxy**: Determina si se desea que las peticiones de red que se realizan en la extensión se realicen con el proxy o no. Por defecto: true.
- **displayLabel**: Muestra la etiqueta del tipo del servicio si tiene valor true, en caso de tener valor false no la mostrará. Por defecto: false.
- **addLayers**: Permite añadir la funcionalidad de añadir capas. Por defecto: true.
- **statusLayers**: Permite añadir la funcionalidad de mostrar/ocultar todas las capas. Por defecto: true.

# API-REST

```javascript
https://componentes.idee.es/api-idee/?layerswitcher=position*collapsed*collapsible*tooltip*isDraggable*isMoveLayers*modeSelectLayers*tools*http*https*showCatalog`;
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
    <td>isDraggable</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
  <tr>
    <td>precharged</td>
    <td>Objeto</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>isMoveLayers</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>modeSelectLayers</td>
    <td>eyes/radio</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>tools</td>
    <td>['transparency', 'legend', 'zoom', 'information', 'style', 'delete']</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>http</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>https</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>showCatalog</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>useProxy</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>displayLabel</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>addLayers</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>statusLayers</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
</table>

### Ejemplo de uso API-REST
```
https://componentes.idee.es/api-idee?layerswitcher=TR*true*true*layerswitcher*true*true*eyes*zoom,legend*true*true*false*true*true*true
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

Ejemplo de constructor del plugin:
```
     {
           collapsed: false,
           position: 'TL',
           tooltip: 'Capas',
           collapsible: true,
           isDraggable: true,
           modeSelectLayers: 'eyes',
           tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'],
           isMoveLayers: true,
           https: true,
           http: true,
           showCatalog: false,
       }
```
```
https://componentes.idee.es/api-idee?layerswitcher=base64=eyJjb2xsYXBzZWQiOmZhbHNlLCJwb3NpdGlvbiI6IlRMIiwidG9vbHRpcCI6IkNhcGFzIiwiY29sbGFwc2libGUiOnRydWUsImlzRHJhZ2dhYmxlIjp0cnVlLCJtb2RlU2VsZWN0TGF5ZXJzIjoiZXllcyIsInRvb2xzIjpbInRyYW5zcGFyZW5jeSIsImxlZ2VuZCIsInpvb20iLCJpbmZvcm1hdGlvbiIsInN0eWxlIiwiZGVsZXRlIl0sImlzTW92ZUxheWVycyI6dHJ1ZSwiaHR0cHMiOnRydWUsImh0dHAiOnRydWUsImNvZHNpIjpmYWxzZX0=
```


# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new IDEE.plugin.Layerswitcher({
  collapsed: false,
  position: 'TL',
  tooltip: 'Capas',
  collapsible: true,
  isDraggable: true,
  modeSelectLayers: 'eyes',
  tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'],
  isMoveLayers: true,
  https: true,
  http: true,
  showCatalog: false,
  displayLabel: true,
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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=layerswitcher)