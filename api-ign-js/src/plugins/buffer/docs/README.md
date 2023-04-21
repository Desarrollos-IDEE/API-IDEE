<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>APICNIG</strong> <small>🔌 M.plugin.Buffer</small></h1>

# Descripción

Plugin que genera un buffer o un área de influencia sobre un punto, linea o polígono que se dibuje sobre el mapa y con una equidistancia determinada.

## Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **buffer.ol.min.js**
- **buffer.ol.min.css**


```html
 <link href="https://componentes.cnig.es/api-core/plugins/buffer/buffer.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/buffer/buffer.ol.min.js"></script>
```

## Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsible**: Si es *true*, el botón aparece, y puede desplegarse y contraerse. Si es *false*, el botón no aparece. Por defecto: true.
- **collapsed**: Si es *true*, el panel aparece cerrado. Si es *false*, el panel aparece abierto. Por defecto: true.

# API-REST

```javascript
URL_API?buffer=position*collapsed*collapsible
```

<table>
  <tr>
    <td>Parámetros</td>
    <td>Opciones/Descripción</td>
  </tr>
  <tr>
    <td>position</td>
    <td>TR/TL/BR/BL</td>
  </tr>
  <tr>
    <td>collapsed</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>collapsible</td>
    <td>true/false</td>
  </tr>
</table>

### Ejemplos de uso API-REST

```
https://componentes.cnig.es/api-core?buffer=TR*true*false
```

```
https://componentes.cnig.es/api-core?buffer=TL
```

# Ejemplo de uso

```javascript
const map = M.map({
  container: 'map'
});

const mp = new M.plugin.Buffer({
  position: 'TL',
  collapsible: true
  collapsed: false
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
