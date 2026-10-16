<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Mapheader</small></h1>

## Descripción

 Plugin para la generación automática de cabecera de pagina. 

![Imagen](./docs/images//mapheaderPlugin.png)

## Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **mapheader.ol.min.js**
- **mapheader.ol.min.css**

Para uso de implementación Cesium:
- **mapheader.cesium.min.js**
- **mapheader.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/mapheader/mapheader.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/mapheader/mapheader.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/mapheader/mapheader-2.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/mapheader/mapheader-2.0.0.ol.min.js"></script>
```

## Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Posición donde se muestra el plugin (por defecto `center-top-left`).
  - `left`, `right`
  - `center-bottom-left`, `center-bottom-right`
  - `center-top-left`, `center-top-right`
  - `down`
- **collapsed**: Si la cabecera aparece colapsada al inicio (por defecto `true`). Compatibilidad legacy: `open: true` equivale a `collapsed: false`.
- **collapsible**: Si el panel puede abrirse y cerrarse (por defecto `true`).
- **order**: Orden del panel respecto a otros controles/plugins.
- **tooltip**: Texto del tooltip del botón.
- **htmlCode**: Código HTML de la cabecera.
- **cssList**: Lista de URLs CSS (array o string separado por comas) que se inyectan en el visor.

# API-REST

```javascript
URL_API?mapheader=position*collapsed*order*tooltip*collapsible
```

`htmlCode` y `cssList` deben enviarse mediante **base64** (demasiado largos para el separador `*`).

<table>
    <tr>
        <th>Parámetros</th>
        <th>Opciones/Descripción</th>
        <th>Disponibilidad</th>
    </tr>
    <tr>
        <td>position</td>
        <td>left, right, down, center-top-left, center-top-right, center-bottom-left, center-bottom-right</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>collapsed</td>
        <td>true / false</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>order</td>
        <td>número</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>tooltip</td>
        <td>texto</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>collapsible</td>
        <td>true / false</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>htmlCode</td>
        <td>HTML de la cabecera</td>
        <td>Base64 ✔️</td>
    </tr>
    <tr>
        <td>cssList</td>
        <td>URLs CSS</td>
        <td>Base64 ✔️</td>
    </tr>
</table>

### Ejemplos de uso API-REST
```
https://componentes.idee.es/api-idee?mapheader=center-top-left*false*0*Cabecera*true
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

Ejemplo de constructor:
```javascript
{
  position: 'center-top-left',
  collapsed: false,
  htmlCode: `<p>mi cabecera</p>`,
  cssList: [
    'https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css',
  ],
}
```
```
https://componentes.idee.es/api-idee?mapheader=base64=...
```

## Ejemplos de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new IDEE.plugin.Mapheader({
  position: 'center-top-left',
  collapsed: false,
  htmlCode: `
<header>
<div id="header-pc">
  <div class="col-12">
    <div class="col-3 marginTop20px">
      <a href="https://www.ign.es" target="_blank" title="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica">
      <img src="https://centrodedescargas.cnig.es/CentroDescargas/imgCdD/escudoInstitucional.png" alt="Instituto Geográfico Nacional y O. A. Centro Nacional de Información Geográfica" class="img-fluid imgMinisterio "></a>
    </div>
    <div class="col-6 col-m-12 marginTop20px">
      <div class="col-12 txtCenter"><a href="https://centrodedescargas.cnig.es/CentroDescargas/home" class="txtSupCdDCabenlace" title="Centro de Descargas">Centro de Descargas</a></div>
      <div class="marginTop10px col-12 colorVerdeClaro txtCenter paddingBottom10px">Instituto Geográfico Nacional</div>
      <div class="col-12 colorVerdeClaro txtCenter">Organismo Autónomo Centro Nacional de Información Geográfica</div>
    </div>
  </div>
</div>
</header>
  `,
  cssList: [
    'https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css',
  ],
});

map.addPlugin(mp);
```
# 👨‍💻 Desarrollo

Para el stack de desarrollo de este componente se ha utilizado

* NodeJS Versión: 16 o superior
* NPM Versión: 8.19.4 o superior

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
npm run start:ol
npm run start:cesium
```

## 📂 Estructura del código / *Code scaffolding*

```any
/
├── src 📦                  # Código fuente
├── legacy 📁               # Histórico de versiones
├── task 📁                 # EndPoints
├── test 📁                 # Testing
├── webpack-config 📁       # Webpack configs
└── ...
```
## 📌 Metodologías y pautas de desarrollo / *Methodologies and Guidelines*

Metodologías y herramientas usadas en el proyecto para garantizar el Quality Assurance Code (QAC)

* ESLint
  * [NPM ESLint](https://www.npmjs.com/package/eslint)
  * [NPM ESLint | Airbnb](https://www.npmjs.com/package/eslint-config-airbnb)

## ⛽️ Revisión e instalación de dependencias / *Review and Update Dependencies*

Para la revisión y actualización de las dependencias de los paquetes npm es necesario instalar de manera global el paquete/ módulo "npm-check-updates".

```bash
# Install and Run
$npm i -g npm-check-updates
$ncu
```

## Tabla de compatibilidad de versiones
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=mapheader)
