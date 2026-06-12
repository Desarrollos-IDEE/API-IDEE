<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.StoryMap</small></h1>

# Descripción

Plugin que muestra una historia en forma de carrusel. Esta compuesta por diferentes steps en los cuales se ejecurán animaciones preconfiguradas.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **storymap.ol.min.js**
- **storymap.ol.min.css**

Para uso de implementación Cesium:
- **storymap.cesium.min.js**
- **storymap.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/storymap/storymap.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/storymap/storymap.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/storymap/storymap-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/storymap/storymap-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**.  Ubicación del plugin sobre el mapa.
  - 'TL':top left (default)
  - 'TR':top right
- **collapsed**. Indica si el plugin aparece por defecto colapsado o no.

- **tooltip**: Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Gestión de la vista.

- **indexInContent**. Si este parámetro se incluye se genera un "capítulo 0" que contiene el índice. Este parámetro recibe un objeto donde se determina el título del índice, subtitulo y js.
```javascript
      indexInContent: {
        title: 'Índice',
        subtitle: 'Visualizador de Cervantes y el Madrid del siglo XVII',
        js: "",
      },
```
- **delay**. Valor tipo Number, determina el tiempo de cada step cuando se hace clic en el botón "play". Por defecto dura 2s (1000 = 1s).
- **content**.  Recibe un objeto con JSON, se define los idomas.

```javascript
   content: {
        es: StoryMapJSON,
        en: StoryMapJSON
      },
```
- **isDraggable**: "True" para que el plugin se pueda desplazar, por defecto false.

##### JSON Content StoryMap
Cada JSON "StoryMapJSON", contiene un JSON con la historia que se mostrará en el Story Map.

Para crear interacciones con el mapa es necesario llamar a map o mapjs y el uso de ";" es obligatorio para poder ejecutar el código JS.

```javascript
{
 "head": {"title": "StoryMap"},
 "cap": [
  {
   "title": "Capítulo 1",
   "subtitle": "Subtítulo 1",
   "steps": [
      {
        "html": "[html]",
        "js": "[js]",
      },
      {
        "html": "[html]",
        "js": "[js]",
      }
    ]
  },
 {
   "title": "Capítulo 2",
   "subtitle": "Subtítulo 2",
   "steps": [
      {
        "html": "[html]",
        "js": "[js]",
      }
    ]
  }
 ]
}
```

# API-REST

```javascript
URL_API?storymap=position*collapsed*collapsible*tooltip*delay*isDraggable
```

<table>
  <tr>
    <th>Parámetros</th>
    <th>Opciones/Descripción</th>
    <th>Disponibilidad</th>
  </tr>
  <tr>
    <td>position</td>
    <td>TR/TL/BR/BL</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>collapsible</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>collapsed</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>tooltip</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>indexInContent</td>
    <td>Objeto</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>delay</td>
    <td>Numero</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>content</td>
    <td>Objeto</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>isDraggable</td>
    <td>Objeto</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
</table>
(*) Este parámetro podrá ser enviado por API-REST con los valores true o false. Si es true indicará al plugin que se añada el control con los valores por defecto. Para añadir los zooms deseados en los que se podrá centrar el mapa se deberá realizar mediante API-REST en base64.

### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee/?storymap=TL*true*true*tooltip*delay*isDraggable
```

### Ejemplos de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

Ejemplo de constructor del plugin:
```javascript
{
  collapsed: false,
  collapsible: true,
  position: 'TR',
  tooltip: 'Tooltip Storymap',
  content: {
    es: StoryMapJSON2,
    en: StoryMapJSON1,
  },
  indexInContent: {
    title: 'Índice StoryMap',
    subtitle: 'Visualizador de Cervantes y el Madrid del siglo XVII',
    js: "console.log('Visualizador de Cervantes');",
  },
  delay: 2000,
}
```
```
https://componentes.idee.es/api-idee/?storymap=base64=eyJjb2xsYXBzZWQiOmZhbHNlLCJjb2xsYXBzaWJsZSI6dHJ1ZSwicG9zaXRpb24iOiJUUiIsImNvbnRlbnQiOnsiZXMiOnsiaGVhZCI6eyJ0aXRsZSI6IlN0b3J5TWFwIn0sImNhcCI6W119LCJlbiI6eyJoZWFkIjp7InRpdGxlIjoiU3RvcnlNYXAifSwiY2FwIjpbXX19LCJpbmRleEluQ29udGVudCI6eyJ0aXRsZSI6IkluZGljZSBTdG9yeU1hcCIsInN1YnRpdGxlIjoiVmlzdWFsaXphZG9yIGRlIENlcnZhbnRlcyB5IGVsIE1hZHJpZCBkZWwgc2lnbG8gWFZJSSIsImpzIjoiY29uc29sZS5sb2coJ0hvbGFNdW5kbycpIn0sImRlbGF5IjoyMDAwfQ==
```

# Ejemplo de uso
```javascript
import StoryMapJSON2 from './StoryMapJSON2';
import StoryMapJSON1 from './StoryMapJSON1';

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',

});

const mp = IDEE.plugin.new StoryMap({
  collapsed: false,
  collapsible: true,
  position: 'TR',
  tooltip: 'Tooltip Storymap',
  content: {
    es: StoryMapJSON2,
    en: StoryMapJSON1,
  },
  indexInContent: {
    title: 'Índice StoryMap',
    subtitle: 'Visualizador de Cervantes y el Madrid del siglo XVII',
    js: "console.log('Visualizador de Cervantes');",
  },
  delay: 2000,
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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=storymap)