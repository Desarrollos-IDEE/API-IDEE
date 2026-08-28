
<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.ShareMap</small></h1>

# Descripción

Plugin que permite copiar la url del mapa actual visualizado. Exporta la información de todas las capas cargadas en el mapa.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **sharemap.ol.min.js**
- **sharemap.ol.min.css**

Para uso de implementación Cesium:
- **sharemap.cesium.min.js**
- **sharemap.cesium.min.css**


```html
 <link href="https://componentes.idee.es/api-idee/plugins/sharemap/sharemap.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/sharemap/sharemap.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/sharemap/sharemap-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/sharemap/sharemap-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha (por defecto).
- **tooltip**: Texto para el mensaje cuando se copia la cadena (por defecto '¡Copiado!').
- **baseUrl**: Url sobre la que está montada la instancia. Por defecto: https://componentes.idee.es/api-idee/
- **minimize**: Genera URL minificada. (por defecto: false).
- **title**: Título para la cabecera de la ventana (por defecto: 'Compartir Mapa').
- **btn**: Título para el botón Aceptar (por defecto: 'OK').
- **copyBtn**: Título para el botón copiar (por defecto: 'Copiar').
- **overwriteStyles**: Parámetro para sobreescribir los estilos. Si su valor es *true*, se aplicarán los estilos del parámetro *styles*. Si su valor es *false*, se aplicarán los estilos por defecto. Valor por defecto del parámetro: false. Colores por defecto:
  - primaryColor: '#71a7d3'
  - secondaryColor: '#ffffff'
- **styles**: Estilo a aplicar para sobreescribir. (por defecto: {}).
  - **Ejemplo:**
```javascript
styles: {
  primaryColor: 'yellow',
  secondaryColor: 'green'
}
```
- **text**: Texto del segundo título. (por defecto: 'HTML embebido').
- **copyBtnHtml**: Título para el segundo botón. (por defecto: 'Copiar').
- **urlAPI**: URL API o URL Visor (API verdadero o predeterminado, visor falso). Por defecto: false.
- **shareLayer**: Define si se comparten todas las capas o ninguna, valor de tipo _Boolean_. Para que tenga efecto filterLayers, shareLayer debe estar como false o no definido. Por defecto: false.
- **filterLayers**: Selecciona la capa a compartir por el nombre, valor de tipo _Array_.
  - Por defecto: [ ].
  - ```Array<String>```: Los valores serán los nombres de la capa.

# API-REST

```javascript
URL_API?sharemap=position*tooltip*baseUrl*minimize*title*btn*copyBtn*text*copyBtnHtml*urlAPI*shareLayer
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
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>Texto para el mensaje cuando se copia la cadena</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>baseUrl</td>
    <td>URL instancia de api-idee</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>minimize</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>title</td>
    <td>Título para la cabecera de la ventana</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>btn</td>
    <td>Título para el botón Aceptar</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>copyBtn</td>
    <td>Título para el botón copiar</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>overwriteStyles</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>styles</td>
    <td>Estilos para color primario y secundario</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>text</td>
    <td>Texto del segundo título</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>copyBtnHtml</td>
    <td>Título para el segundo botón</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>urlAPI</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>shareLayer</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>filterLayers</td>
    <td>Array con los nombres de las capas</td>
    <td>Base64 ✔️ | Separador ❌ </td>
  </tr>
</table>

### Ejemplos de uso API-REST
```
https://componentes.idee.es/api-idee/?sharemap=TR*Copiado%20al%20portapapeles*https://componentes.idee.es/api-idee/*true*Compartir%20mapa%20title*OK*copyBtn*Compartir%20mapa%20text*copyBtnHtml*false*true
```

```
https://componentes.idee.es/api-idee/?sharemap=TL
```

### Ejemplos de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

#### Ejemplo compartiendo todas las capas
Ejemplo de constructor del plugin:

```javascript
{
  baseUrl: "https://componentes.idee.es/api-idee/",
  position: "TR",
  tooltip: "Copiado al portapapeles",
  minimize: true,
  title: "Compartir mapa title",
  btn: "OK",
  copyBtn: "copyBtn",
  text: "Compartir mapa text",
  copyBtnHtml: "copyBtnHtml",
  urlAPI: false,
  shareLayer: true,
}
```
```
https://componentes.idee.es/api-idee/?sharemap=base64=eyJiYXNlVXJsIjoiaHR0cHM6Ly9jb21wb25lbnRlcy5jbmlnLmVzL2FwaS1jb3JlLyIsInBvc2l0aW9uIjoiVFIiLCJ0b29sdGlwIjoiQ29waWFkbyBhbCBwb3J0YXBhcGVsZXMiLCJtaW5pbWl6ZSI6dHJ1ZSwidGl0bGUiOiJDb21wYXJ0aXIgbWFwYSB0aXRsZSIsImJ0biI6Ik9LIiwiY29weUJ0biI6ImNvcHlCdG4iLCJ0ZXh0IjoiQ29tcGFydGlyIG1hcGEgdGV4dCIsImNvcHlCdG5IdG1sIjoiY29weUJ0bkh0bWwiLCJ1cmxBUEkiOmZhbHNlLCJzaGFyZUxheWVyIjp0cnVlfQ==
```
#### Ejemplo filtrando las capas
En este ejemplo, le pasamos por url dos capas y especificamos en el parámetro filterLayers el nombre de la capa que queremos compartir (shareLayer tiene que estar como false o no definido).

Ejemplo de constructor del plugin:
```javascript
{
  position: "TL",
  shareLayer: false,
  filterLayers: ["OI.OrthoimageCoverage"],
}
```
(*) En este ejemplo, le pasamos por url dos capas y especificamos en el parámetro filterLayers el nombre de la capa que queremos compartir.
```
https://componentes.idee.es/api-idee/?sharemap=base64=eyJwb3NpdGlvbiI6IlRMIiwic2hhcmVMYXllciI6ZmFsc2UsImZpbHRlckxheWVycyI6WyJPSS5PcnRob2ltYWdlQ292ZXJhZ2UiXX0=&layers=WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*imagen*true*image/jpeg*true*true*true,WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**1.3.0*true*true*true
```

# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new ShareMap({
  baseUrl: 'https://componentes.idee.es/api-idee/',
  position: 'TR',
  tooltip: '¡Copiado!',
  minimize: true,
  title: 'Compartir mapa',
  btn: 'OK',
  copyBtn: 'Copiar',
  text: 'Compartir mapa',
  copyBtnHtml: 'Copiar',
  urlAPI: false,
  shareLayer: true,
  filterLayers: ['cosas1_poligono'],
  overwriteStyles: false,
  styles: {
    secondaryColor: '#272727',
  },
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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=sharemap)