
<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.ShareMap</small></h1>

# Descripción

Plugin que permite copiar la url del mapa actual visualizado. Exporta la información de todas las capas cargadas en el mapa.

La url incluye siempre la capa base (fondo) que se está visualizando en el parámetro `baselayer`, tanto si se ha elegido con el control BackgroundLayers como con el plugin BackImgLayer, con independencia de `shareLayer` y `filterLayers`. Si el mapa no tiene fondo, se comparte `baselayer=none`. Las capas del fondo no se repiten en el parámetro `layers`.

El diálogo muestra también un código QR con la misma url y una imagen en el centro: la indicada en `qrImage` o, por defecto, el logo de IDEE. El código se genera en el navegador con la librería [qrcode](https://www.npmjs.com/package/qrcode). Si la url es demasiado larga para mostrar la imagen, el QR se genera sin ella; si no cabe en un código QR, se muestra un aviso y debe usarse el enlace.

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

- **position**: Ubicación del plugin sobre el mapa.
  - 'left' (LEFT) - A la izquierda.
  - 'right' (RIGHT) - A la derecha (por defecto).
- **order**: Determina la prioridad visual dentro del contenedor. Un valor más alto desplaza el botón hacia el final del flujo.
- **tooltip**: Texto que se muestra al dejar el ratón encima del botón del plugin. Por defecto: 'Compartir'.
- **svgPath**: URL al SVG que se usará como icono del botón del plugin. Por defecto: 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_share.svg'.
- **baseUrl**: URL de la instancia de API-IDEE sobre la que se genera la URL compartida cuando urlAPI es true. Por defecto: 'https://componentes.idee.es/api-idee/'.
- **urlAPI**: Tipo de URL compartida. Si es true, se genera una URL de la API REST sobre baseUrl; si es false, una URL del visor actual. Por defecto: false.
- **minimize**: Genera una URL simplificada cuando urlAPI es true: los plugins del mapa se sustituyen por layerswitcher y mousesrs, y se añade la escala. Por defecto: false.
- **title**: Título de la sección de la URL compartida. Por defecto: 'Compartir URL'.
- **text**: Título de la sección del HTML embebido. Por defecto: 'HTML embebido'.
- **shareLayer**: Indica si se comparten todas las capas del mapa (true) o solo las de filterLayers (false o sin definir). La capa base que se visualiza se comparte siempre en el parámetro `baselayer`. Por defecto: false.
- **filterLayers**: Nombres de las capas que se comparten cuando shareLayer es false o no está definido, valor de tipo _Array<String>_. Por defecto: [ ].
- **btn**: Texto del botón que cierra la ventana. Por defecto: 'Aceptar'.
- **copyBtn**: Texto del botón que copia la URL. Por defecto: 'Copiar'.
- **copyBtnHtml**: Texto del botón que copia el HTML embebido. Por defecto: 'Copiar'.
- **tooltipCopy**: Mensaje que se muestra al copiar la URL o el HTML. Por defecto: '¡Copiado!'.
- **overwriteStyles**: Si es true, se aplican los colores del parámetro styles; si es false, los estilos por defecto. Por defecto: false.
- **styles**: Colores que se aplican cuando overwriteStyles es true. Por defecto:
  - primaryColor: '#71a7d3' (botones, bordes y textos).
  - secondaryColor: '#fff' (fondo de la ventana y texto de los botones).
  - **Ejemplo:**
```javascript
styles: {
  primaryColor: 'yellow',
  secondaryColor: 'green'
}
```
- **qrImage**: URL de la imagen que se muestra en el centro del código QR. La imagen se ajusta, sin deformarse, a un cuadrado central del 25 % del ancho del QR, y solo lleva fondo blanco la zona que ocupa. Por defecto: el logo de IDEE de los recursos estáticos (`imagenes/logos/IDEE-logo.png`).

# API-REST

```javascript
URL_API?sharemap=position*order*tooltip*baseUrl*urlAPI*minimize*title*text*shareLayer*btn*copyBtn*copyBtnHtml*tooltipCopy*overwriteStyles*qrImage
```

Los parámetros con separador son posicionales: para indicar uno hay que rellenar las posiciones anteriores. overwriteStyles ocupa su posición, pero solo tiene efecto en base64, junto con styles.

<table>
  <tr>
    <th>Parámetros</th>
    <th>Opciones/Descripción</th>
    <th>Disponibilidad</th>
  </tr>
  <tr>
    <td>position</td>
    <td>left/right</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>order</td>
    <td>Número entero positivo</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>Texto del tooltip del botón del plugin</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>baseUrl</td>
    <td>URL de la instancia de API-IDEE</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>urlAPI</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>minimize</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>title</td>
    <td>Título de la sección de la URL compartida</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>text</td>
    <td>Título de la sección del HTML embebido</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>shareLayer</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>btn</td>
    <td>Texto del botón que cierra la ventana</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>copyBtn</td>
    <td>Texto del botón que copia la URL</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>copyBtnHtml</td>
    <td>Texto del botón que copia el HTML embebido</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>tooltipCopy</td>
    <td>Mensaje que se muestra al copiar</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>overwriteStyles</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>qrImage</td>
    <td>URL de la imagen del centro del código QR</td>
    <td>Base64 ✔️ | Separador ✔️ </td>
  </tr>
  <tr>
    <td>styles</td>
    <td>Colores primario y secundario</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>filterLayers</td>
    <td>Array con los nombres de las capas</td>
    <td>Base64 ✔️ | Separador ❌ </td>
  </tr>
  <tr>
    <td>svgPath</td>
    <td>URL del icono SVG del botón del plugin</td>
    <td>Base64 ✔️ | Separador ❌ </td>
  </tr>
</table>

### Ejemplos de uso API-REST
```
https://componentes.idee.es/api-idee/?sharemap=position=left;tooltip=Compartir%20mapa;urlAPI=true;filterLayers=base64~WyJPSS5PcnRob2ltYWdlQ292ZXJhZ2UiXQ==;styles=base64~eyJwcmltYXJ5Q29sb3IiOiIjNzFhN2QzIiwic2Vjb25kYXJ5Q29sb3IiOiIjZmZmIn0=
```

```
https://componentes.idee.es/api-idee/?sharemap=right*1*Compartir*https://componentes.idee.es/api-idee/*true*false*Compartir%20URL*HTML%20embebido*true*Aceptar*Copiar*Copiar*Copiado*false*https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg
```

```
https://componentes.idee.es/api-idee/?sharemap=left
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
  position: "right",
  tooltipCopy: "Copiado al portapapeles",
  minimize: true,
  title: "Compartir mapa",
  btn: "Aceptar",
  copyBtn: "Copiar URL",
  text: "HTML embebido",
  copyBtnHtml: "Copiar HTML",
  urlAPI: true,
  shareLayer: true,
  qrImage: "https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg",
}
```
```
https://componentes.idee.es/api-idee/?sharemap=base64=eyJiYXNlVXJsIjoiaHR0cHM6Ly9jb21wb25lbnRlcy5pZGVlLmVzL2FwaS1pZGVlLyIsInBvc2l0aW9uIjoicmlnaHQiLCJ0b29sdGlwQ29weSI6IkNvcGlhZG8gYWwgcG9ydGFwYXBlbGVzIiwibWluaW1pemUiOnRydWUsInRpdGxlIjoiQ29tcGFydGlyIG1hcGEiLCJidG4iOiJBY2VwdGFyIiwiY29weUJ0biI6IkNvcGlhciBVUkwiLCJ0ZXh0IjoiSFRNTCBlbWJlYmlkbyIsImNvcHlCdG5IdG1sIjoiQ29waWFyIEhUTUwiLCJ1cmxBUEkiOnRydWUsInNoYXJlTGF5ZXIiOnRydWUsInFySW1hZ2UiOiJodHRwczovL2NvbXBvbmVudGVzLmlkZWUuZXMvZXN0YXRpY29zL2ltYWdlbmVzL2xvZ29zL0FQSV9JREVFL0FQSV8yL0FQSV8yLnN2ZyJ9
```
#### Ejemplo filtrando las capas
En este ejemplo, le pasamos por url dos capas y especificamos en el parámetro filterLayers el nombre de la capa que queremos compartir (shareLayer tiene que estar como false o no definido).

Ejemplo de constructor del plugin:
```javascript
{
  position: "left",
  shareLayer: false,
  filterLayers: ["OI.OrthoimageCoverage"],
}
```
(*) En este ejemplo, le pasamos por url dos capas y especificamos en el parámetro filterLayers el nombre de la capa que queremos compartir.
```
https://componentes.idee.es/api-idee/?sharemap=base64=eyJwb3NpdGlvbiI6ImxlZnQiLCJzaGFyZUxheWVyIjpmYWxzZSwiZmlsdGVyTGF5ZXJzIjpbIk9JLk9ydGhvaW1hZ2VDb3ZlcmFnZSJdfQ==&layers=WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*imagen*true*image/jpeg*true*true*true,WMS*Unidad%20administrativa*http://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true*true**1.3.0*true*true*true
```

# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new IDEE.plugin.ShareMap({
  position: 'right',
  order: 1,
  tooltip: 'Compartir',
  baseUrl: 'https://componentes.idee.es/api-idee/',
  urlAPI: false,
  title: 'Compartir URL',
  text: 'HTML embebido',
  shareLayer: false,
  filterLayers: ['cosas1_poligono'],
  btn: 'Aceptar',
  copyBtn: 'Copiar',
  copyBtnHtml: 'Copiar',
  tooltipCopy: '¡Copiado!',
  overwriteStyles: true,
  styles: {
    primaryColor: '#71a7d3',
    secondaryColor: '#272727',
  },
  qrImage: 'https://componentes.idee.es/estaticos/imagenes/logos/IDEE-logo.png',
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