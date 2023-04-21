<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>APICNIG</strong> <small>🔌 M.plugin.Information</small></h1>

# Descripción

Muestra información GetFeatureInfo mediante activación de plugin.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **information.ol.min.js**
- **information.ol.min.css**


```html
 <link href="https://componentes.cnig.es/api-core/plugins/information/information.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/information/information.ol.min.js"></script>
```


# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **tooltip**: Tooltip que se muestra sobre el plugin (Se muestra al dejar el ratón encima del plugin como información).
- **format**: Formato de respuesta de la consulta GetFeatureInfo.
- **featureCount**: Máximo número de features a los que realizar la consulta.
- **buffer**: Buffer del click para realizar la consulta.
- **opened**: Indica si queremos que la información devuelta esté abierta por defecto si sólo es una capa, abiertas todas si son varias o cerradas (por defecto). Si no se le indica ningún valor tendrá el funcionamiento por defecto, todas cerradas.
  - 'one': abierta la información si sólo es una capa
  - 'all': todas abiertas
  - 'closed': cerradas

# API-REST

```javascript
URL_API?information=position*tooltip*format*featureCount*buffer*opened
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
    <td>tooltip</td>
    <td>Texto informativo</td>
  </tr>
  <tr>
    <td>format</td>
    <td>Formato de respuesta de GetFeatureInfo</td>
  </tr>
  <tr>
    <td>featureCount</td>
    <td>Número máximo de features a los que le realizará la consulta</td>
  </tr>
  <tr>
    <td>buffer</td>
    <td>Buffer del click para la consulta</td>
  </tr>
  <tr>
    <td>opened</td>
    <td>one/all/closed</td>
  </tr>
</table>


### Ejemplos de uso API-REST

```
https://componentes.cnig.es/api-core/?information=TR*Consultar%20capas*html*5*5*one
```

```
https://componentes.cnig.es/api-core/?information=TR**html*5*5*one
```

# Ejemplo de uso

```javascript
const mp = new M.plugin.Information({
  position: 'BL',
  tooltip: 'Consultar capas',
  format: 'html',
  featureCount: 5,
  buffer: 5,
  opened: 'one',
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
