<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Popup</small></h1>

# Descripción

Plugin que muestra información sobre la página y manual de uso.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **popup.ol.min.js**
- **popup.ol.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/popup/popup.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/popup/popup.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/popup/popup-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/popup/popup-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**:  Ubicación del plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **helpLink**: Enlace al manual de uso. Objeto formado por los atributos en y es. Por defecto: template_en y template_es.
  - Este parámetro se puede definir también con url_en y url_es directamente. Por defecto: template_en y template_es.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**. Tooltip que se muestra sobre el plugin. Por defecto: Más información.

# API-REST

```javascript
URL_API?popup=position*collapse*collapsible*tooltip*url_es*url_en
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
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>collapse</td>
    <td>true/false</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>collapsible</td>
    <td>true/false</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>Valor que se muestra sobre el plugin</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>url_es</td>
    <td>URL del manual de uso en español</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>url_en</td>
    <td>URL del manual de uso en inglés</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
</table>


### Ejemplo de uso API-REST

```
https://componentes.idee.es/api-idee?popup=TR*true*true*Ayuda*https%3A%2F%2Fcomponentes.cnig.es%2FayudaIberpix%2Fes.html*https%3A%2F%2Fcomponentes.cnig.es%2FayudaIberpix%2Fen.html
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
  position:'TR',
  collapsed: true,
  collapsible: true,
  url_es: 'https://componentes.cnig.es/ayudaIberpix/es.html',
  url_en: 'https://componentes.cnig.es/ayudaIberpix/en.html',
  tooltip: 'Ayuda',
}
```

```
https://componentes.idee.es/api-idee?popup=base64=eyJwb3NpdGlvbiI6IlRSIiwiY29sbGFwc2VkIjp0cnVlLCJjb2xsYXBzaWJsZSI6dHJ1ZSwidXJsX2VzIjoiaHR0cHM6Ly9jb21wb25lbnRlcy5jbmlnLmVzL2F5dWRhSWJlcnBpeC9lcy5odG1sIiwidXJsX2VuIjoiaHR0cHM6Ly9jb21wb25lbnRlcy5jbmlnLmVzL2F5dWRhSWJlcnBpeC9lbi5odG1sIiwidG9vbHRpcCI6IkF5dWRhIn0=

```

# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map'
});


const mp = new IDEE.plugin.Popup({
  position: 'TR',
  url_es: 'https://componentes.cnig.es/ayudaIberpix/es.html',
  url_en: 'https://componentes.cnig.es/ayudaIberpix/en.html',
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
