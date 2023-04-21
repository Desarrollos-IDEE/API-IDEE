<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>APICNIG</strong> <small>🔌 M.plugin.MouseSRS</small></h1>

# Descripción

Muestra las coordenas en el sistema de referencia elegido del puntero del ratón.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **mousesrs.ol.min.js**
- **mousesrs.ol.min.css**


```html
 <link href="https://componentes.cnig.es/api-core/plugins/mousesrs/mousesrs.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/mousesrs/mousesrs.ol.min.js"></script>
```


# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **tootltip**. Tooltip que se muestra sobre el plugin (Se muestra al dejar el ratón encima del plugin como información).
- **srs**. Código EPSG del SRS sobre el que se mostrarán las coordenadas del ratón.
- **label**. Nombre del SRS sobre el que se mostrarán las coordenadas del ratón.
- **precision**. Precisión de las coordenadas.
- **geoDecimalDigits**. Cifras decimales para proyecciones geográficas.
- **utmDecimalDigits**. Cifras decimales para proyecciones UTM.
- **activeZ**. Activar visualización valor z.
- **helpUrl**. URL a la ayuda para el icono.

# API-REST

```javascript
URL_API?mousesrs=tooltip*srs*label*precision*geoDecimalDigits*utmDecimalDigits*activeZ*helpUrl
```

<table>
  <tr>
    <td>Parámetros</td>
    <td>Opciones/Descripción</td>
  <tr>
  <tr>
    <td>tooltip</td>
    <td>Texto informativo</td>
  </tr>
  <tr>
    <td>srs</td>
    <td>Código EPSG del SRS</td>
  </tr>
  <tr>
    <td>label</td>
    <td>Nombre del SRS</td>
  </tr>
  <tr>
    <td>precision</td>
    <td>Precisión de las coordenadas</td>
  </tr>
  <tr>
    <td>geoDecimalDigits</td>
    <td>Cifras decimales para proyecciones geográficas</td>
  </tr>
  <tr>
    <td>utmDecimalDigits</td>
    <td>Cifras decimales para proyecciones UTM</td>
  </tr>
  <tr>
    <td>activeZ</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>helpUrl</td>
    <td>URL del icono para la ayuda</td>
  </tr>
</table>


### Ejemplos de uso API-REST

```
https://componentes.cnig.es/api-core?mousesrs=Muestra coordenadas*EPSG:4326*WGS84*4*3*2*false*https%3A%2F%2Fvisores-cnig-gestion-publico.desarrollo.guadaltel.es%2Fiberpix%2Fhelp%3Fnode%3Dnode107
```

```
https://componentes.cnig.es/api-core?mousesrs=Muestra coordenadas*EPSG:4326*WGS84*4*4*2*false
```

# Ejemplo de uso

```javascript
const mp = new M.plugin.MouseSRS({
  position: 'BL',
  tooltip: 'Muestra coordenadas',
  srs: 'EPSG:4326',
  label: 'WGS84',
  precision: 4,
  geoDecimalDigits: 3,
  utmDecimalDigits: 2,
});
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
npm run start
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
