<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.WFSTControls</small></h1>

# Descripción

Plugin que proporciona herramientas de edición WFST (Web Feature Service - Transactional) sobre capas vectoriales. Permite realizar operaciones de creación, modificación y eliminación de features, así como editar sus atributos alfanuméricos:

- **drawfeature**: Dibuja nuevos features sobre el mapa.
- **modifyfeature**: Modifica la geometría de un feature existente.
- **deletefeature**: Elimina el feature seleccionado.
- **editattribute**: Edita los atributos alfanuméricos de un feature.

Los cambios realizados no se persisten en el servidor WFST hasta que no se pulse el botón de guardar. Los cambios no persistidos pueden deshacerse con el botón de limpiar.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:

- **wfstcontrols.ol.min.js**
- **wfstcontrols.ol.min.css**

Para uso de implementación Cesium:

- **wfstcontrols.cesium.min.js**
- **wfstcontrols.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/wfstcontrols/wfstcontrols.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/wfstcontrols/wfstcontrols.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:

```html
 <link href="https://componentes.idee.es/api-idee/plugins/wfstcontrols/wfstcontrols-2.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/wfstcontrols/wfstcontrols-2.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un objeto JSON de opciones:

```javascript
var edicionWFST = new IDEE.plugin.WFSTControls({
  position: 'right',
  collapsed: true,
  order: 1,
  tooltip: 'Herramientas de edición',
  features: 'drawfeature,modifyfeature,deletefeature,editattribute',
  layername: 'RED_REGENTE',
  geometry: 'POINT',
  proxy: {
    status: true,
    disable: false,
  },
});
```

**Propiedades del objeto de configuración**:

| Parámetro | Tipo | Por defecto | Descripción |
| ----------- | ------ | ------------- | ------------- |
| `position` | `left` \| `right` \| `down` \| `center-top-left` \| `center-top-right` \| `center-bottom-left` \| `center-bottom-right` | `center-top-left` | Posición del panel en el mapa. También admite valores legacy `TL`, `TR`, `BL` y `BR` |
| `collapsed` | `boolean` | `true` | Si el panel aparece colapsado al cargar |
| `order` | `number` | — | Orden del botón/panel entre controles y plugins |
| `tooltip` | `string` | `Herramientas de edición` | Texto al pasar el ratón sobre el botón |
| `features` | `string` \| `string[]` | `drawfeature,modifyfeature,deletefeature,editattribute` | Herramientas habilitadas. Valores: `drawfeature`, `modifyfeature`, `deletefeature`, `editattribute`, `clearfeature`, `savefeature` |
| `layername` | `string` | Primera capa WFS del mapa | Nombre de la capa WFS sobre la que se edita |
| `geometry` | `POINT` \| `LINE` \| `POLYGON` \| `MPOINT` \| `MLINE` \| `MPOLYGON` | Detección automática | Tipo de geometría de la capa WFS |
| `proxy` | `object` | `{ status: true, disable: false }` | Configuración del proxy WFST (`status`, `disable`) |
| `proxyStatus` | `boolean` | `true` | Equivalente a `proxy.status` |
| `proxyDisable` | `boolean` | `false` | Equivalente a `proxy.disable` |
| `className` | `string` | `m-plugin-wfstcontrols` | Clase CSS adicional del panel |
| `collapsedButtonClass` | `string` | `g-cartografia-btn-wfstcontrols-main` | Clase CSS del botón colapsado |

# API-REST

```javascript
URL_API?wfstcontrols=position*collapsed*order*tooltip*features*layername*geometry*proxyStatus*proxyDisable
```

<table>
    <tr>
        <th>Parámetros</th>
        <th>Opciones/Descripción</th>
        <th>Disponibilidad</th>
    </tr>
    <tr>
        <td>position</td>
        <td>left / right / down / center-top-left / center-top-right / center-bottom-left / center-bottom-right</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>collapsed</td>
        <td>true / false</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>order</td>
        <td>number</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>tooltip</td>
        <td>string</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>features</td>
        <td>drawfeature,modifyfeature,deletefeature,editattribute,clearfeature,savefeature</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>layername</td>
        <td>Nombre de la capa WFS</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>geometry</td>
        <td>POINT / LINE / POLYGON / MPOINT / MLINE / MPOLYGON</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>proxyStatus</td>
        <td>true / false</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>proxyDisable</td>
        <td>true / false</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>proxy</td>
        <td>Objeto `{ status, disable }`</td>
        <td>Base64 ✔️ | Separador ❌</td>
    </tr>
</table>
(*) Este parámetro podrá ser enviado por API-REST con los valores true o false. Si es true indicará al plugin que se añada el control con los valores por defecto. Para configurar parámetros complejos se deberá realizar mediante API-REST en base64.

### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee?layers=OSM,WFS*RED_REGENTE*https://www.ign.es/wfs/redes-geodesicas?*RED_REGENTE*POINT&wfstcontrols=right*true*0*Herramientas de edición*drawfeature,modifyfeature,deletefeature,editattribute*RED_REGENTE*POINT*true*false
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:

```javascript
IDEE.utils.encodeBase64({
  position: 'right',
  collapsed: true,
  order: 0,
  tooltip: 'Herramientas de edición',
  features: 'drawfeature,modifyfeature,deletefeature,editattribute',
  layername: 'RED_REGENTE',
  geometry: 'POINT',
  proxy: {
    status: true,
    disable: false,
  },
});
```

```
https://api-idee.juntadeandalucia.es/api-idee?layers=OSM,WFS*RED_REGENTE*https://www.ign.es/wfs/redes-geodesicas?*RED_REGENTE*POINT&wfstcontrols=base64=eyJwb3NpdGlvbiI6InJpZ2h0IiwiY29sbGFwc2VkIjp0cnVlLCJvcmRlciI6MCwidG9vbHRpcCI6IkhlcnJhbWllbnRhcyBkZSBlZGljacOzbiIsImZlYXR1cmVzIjoiZHJhd2ZlYXR1cmUsbW9kaWZ5ZmVhdHVyZSxkZWxldGVmZWF0dXJlLGVkaXRhdHRyaWJ1dGUiLCJsYXllcm5hbWUiOiJSRURfUkVHRU5URSIsImdlb21ldHJ5IjoiUE9JTlQiLCJwcm94eSI6eyJzdGF0dXMiOnRydWUsImRpc2FibGUiOmZhbHNlfX0=
```

# Ejemplo de uso

```javascript
IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
});

// Crear la capa WFS
const wfsLayer = new IDEE.layer.WFS({
  url: 'https://www.ign.es/wfs/redes-geodesicas?',
  legend: 'Red Geodésica Nacional por Técnicas Espaciales (REGENTE)',
  name: 'RED_REGENTE',
  geometry: 'POINT',
  extract: true,
});

map.addWFS(wfsLayer);

// Crear el plugin con las herramientas deseadas
const edicionWFST = new IDEE.plugin.WFSTControls({
  position: 'right',
  collapsed: true,
  order: 0,
  tooltip: 'Herramientas de edición',
  features: 'drawfeature,modifyfeature,deletefeature,editattribute',
  layername: 'RED_REGENTE',
  geometry: 'POINT',
  proxy: {
    status: true,
    disable: false,
  },
});

// Añadir el plugin al mapa
map.addPlugin(edicionWFST);
```

# 👨‍💻 Desarrollo

Para el stack de desarrollo de este componente se ha utilizado

- NodeJS Version: 14.16
- NPM Version: 6.14.11
- Entorno Windows.

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

- ESLint
  - [NPM ESLint](https://www.npmjs.com/package/eslint) \
  - [NPM ESLint | Airbnb](https://www.npmjs.com/package/eslint-config-airbnb)

## ⛽️ Revisión e instalación de dependencias / *Review and Update Dependencies*

Para la revisión y actualización de las dependencias de los paquetes npm es necesario instalar de manera global el paquete/ módulo "npm-check-updates".

```bash
# Install and Run
$npm i -g npm-check-updates
$ncu
```

## Tabla de compatibilidad de versiones

[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=wfstcontrols)
