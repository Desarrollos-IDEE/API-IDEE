<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>APICNIG</strong> <small>🔌 M.plugin.PrinterMap</small></h1>

# Descripción

Plugin de impresión a través del servicio Geoprint. Las capacidades del mismo definen las opciones de impresión disponibles: dpi, formatos y plantillas.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **printermap.ol.min.js**
- **printermap.ol.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/printermap/printermap.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/printermap/printermap.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-CNIG en [api-ign-legacy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/printermap/printermap-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/printermap/printermap-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**. Tooltip que se muestra sobre el plugin. Por defecto: Impresión del mapa.
- **serverUrl**: URL del servidor Geoprint. Por defecto: https://componentes.cnig.es/geoprint.
- **printTemplateUrl**: URL con las plantillas a utilizar. Por defecto: https://componentes.cnig.es/geoprint/print/CNIG.
- **printStatusUrl**: URL para consultar el estado de la impresión. Por defecto: https://componentes.cnig.es/geoprint/print/status.
- **printTemplateGeoUrl**: URL de las plantillas a utilizar para Geoprint. Por defecto: https://componentes.cnig.es/geoprint/print/mapexport.
- **credits**: URL que indica el estado del servidor Geoprint.
- **georefActive**: Valor booleano que indica si abrir plugin con opciones de descarga de imagen georreferenciada o no  (true/false). Por defecto: true.
- **fototeca**: Valor booleano que indica si añadir por defecto un texto a la descripción específico de fototeca sin posibilidad de edición (true/false). Por defecto: false.
- **logo**: URL de una imagen para añadir como logo en la esquina superior derecha
- **headerLegend**: URL de una imagen para añadir como leyenda en la parte central de la cabecera.
- **filterTemplates**: Listado de nombres de plantillas que queremos tener disponibles, si no se manda el parámetro aparecerán todas por defecto.

# API-REST

### Estructura API-REST

```javascript
URL_API?printermap=position*collapsed*collapsible*tooltip*serverUrl*printTemplateUrl*printTemplateGeoUrl*printStatusUrl
*georefActive*logo*headerLegend*fototeca*credits
```

<table>
  <tr>
    <th>Parámetros</th>
    <th>Opciones/Descripción</th>
    <th>Disponibilidad</th>
  </tr>
  <tr>
    <td>position</td>
    <td>TR/TL/BL/BR</td>
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
    <td>Valor que se muestra sobre el plugin</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>serverUrl</td>
    <td>URL del servidor Geoprint</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>printTemplateUrl</td>
    <td>URL de las plantillas a utilizar</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>printTemplateGeoUrl</td>
    <td>URL de las plantillas a utilizar para Geoprint</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>printStatusUrl</td>
    <td>URL para consultar el estado de la impresión</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>georefActive</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>logo</td>
    <td>URL de la imagen para el logo</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>headerLegend</td>
    <td>URL de la imagen como leyenda</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>fototeca</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>credits</td>
    <td>URL que indica el estado del servidor Geoprint</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>filterTemplates</td>
    <td>Listado de nombres de plantillas disponibles</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
</table>

### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee/?printermap=TR*true*true*Imprimir%20mapa*https://componentes.cnig.es/geoprint*https://componentes.cnig.es/geoprint/print/CNIG*https://componentes.cnig.es/geoprint/print/mapexport*https://componentes.cnig.es/geoprint/print/status*true*https://www.ign.es/IGNCNIG/Imagenes/Contenidos/IGN-Header-Tittle.png*https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png*true*Impresión%20generada
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad M.utils.encodeBase64.
Ejemplo:
```javascript
M.utils.encodeBase64(obj_params);
```

Ejemplo de constructor:
```javascript
{
  position: "TR",
  collapsed: true,
  collapsible: true,
  tooltip: "Imprimir mapa",
  credits: "Impresin generada",
  fototeca: true,
  logo: "https://www.ign.es/IGNCNIG/Imagenes/Contenidos/IGN-Header-Tittle.png",
  headerLegend: "https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png",
  filterTemplates: ["A3 Horizontal"],
}
```
```
https://componentes.idee.es/api-idee/?printermap=base64=eyJwb3NpdGlvbiI6IlRSIiwiY29sbGFwc2VkIjp0cnVlLCJjb2xsYXBzaWJsZSI6dHJ1ZSwidG9vbHRpcCI6IkltcHJpbWlyIG1hcGEiLCJjcmVkaXRzIjoiSW1wcmVzaW4gZ2VuZXJhZGEiLCJmb3RvdGVjYSI6dHJ1ZSwibG9nbyI6Imh0dHBzOi8vd3d3Lmlnbi5lcy9JR05DTklHL0ltYWdlbmVzL0NvbnRlbmlkb3MvSUdOLUhlYWRlci1UaXR0bGUucG5nIiwiaGVhZGVyTGVnZW5kIjoiaHR0cHM6Ly9jZW50cm9kZWRlc2Nhcmdhcy5jbmlnLmVzL0NlbnRyb0Rlc2Nhcmdhcy9pbWdDZEQvZXNjdWRvSW5zdGl0dWNpb25hbC5wbmciLCJmaWx0ZXJUZW1wbGF0ZXMiOlsiQTMgSG9yaXpvbnRhbCJdfQ==
```

# Eventos

- **ADDED_TO_MAP**
  - Evento que se dispara cuando el control se añade al mapa.
  - Expone, como parámetro devuelto, el **PrinterMapControl**.

```javascript
pluginprintermap.on(M.evt.ADDED_TO_MAP, () => {
  window.alert('Añadido al mapa');
});
```

# Ejemplo de uso

```javascript
mapajs = M.map({
  container: "map"
});

mapajs.addPlugin(new M.plugin.PrinterMap({
  position: 'TR',
  collapsed: false,
  collapsible: false,
  serverUrl: 'https://componentes.cnig.es',
  printTemplateUrl: 'https://componentes.cnig.es/geoprint/print/CNIG',
  printStatusUrl: 'https://componentes.cnig.es/geoprint/print/CNIG/status',
}));
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
