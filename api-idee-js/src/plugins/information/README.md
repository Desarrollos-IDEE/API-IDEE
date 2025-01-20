<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 M.plugin.Information</small></h1>

# Descripción

Muestra información GetFeatureInfo mediante activación de plugin.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **information.ol.min.js**
- **information.ol.min.css**


```html
 <link href="https://componentes.cnig.es/api-idee/plugins/information/information.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/information/information.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/information/information-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/information/information-1.0.0.ol.min.js"></script>
```


# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **tooltip**: Tooltip que se muestra sobre el plugin (Se muestra al dejar el ratón encima del plugin como información). Por defecto: 'Consultar capas'.
- **format**: Formato de respuesta de la consulta GetFeatureInfo. Por defecto: 'text/html'.
- **featureCount**: Máximo número de features a los que realizar la consulta. Por defecto: 10.
- **buffer**: Buffer del click para realizar la consulta. Por defecto: 10.
- **opened**: Indica si queremos que la información devuelta esté abierta por defecto si sólo es una capa, abiertas todas si son varias o cerradas (por defecto). Si no se le indica ningún valor tendrá el funcionamiento por defecto, todas cerradas.
  - 'one': abierta la información si sólo es una capa.
  - 'all': todas abiertas.
  - 'closed': cerradas (por defecto).

# API-REST

```javascript
URL_API?information=position*tooltip*format*featureCount*buffer*opened
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
    <td>tooltip</td>
    <td>Texto informativo</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>format</td>
    <td>Formato de respuesta de GetFeatureInfo</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>featureCount</td>
    <td>Número máximo de features a los que le realizará la consulta</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>buffer</td>
    <td>Buffer del click para la consulta</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>opened</td>
    <td>one/all/closed</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
</table>


### Ejemplo de uso API-REST

```
https://componentes.cnig.es/api-idee/?information=TR*Consultar%20capas*html*5*5*one
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad M.utils.encodeBase64.
Ejemplo:
```javascript
M.utils.encodeBase64(obj_params);
```

Ejemplo del constructor:
```javascript
{
  position:"TR",
  tooltip:"Información",
  buffer:100,
  opened:"one"
}
```
```
https://componentes.cnig.es/api-idee/?information=base64=eyJwb3NpdGlvbiI6IlRSIiwidG9vbHRpcCI6IkluZm9ybWFjacOzbiIsImJ1ZmZlciI6MTAwLCJvcGVuZWQiOiJvbmUifQ==
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
