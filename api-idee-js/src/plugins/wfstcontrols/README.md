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

Los cambios realizados no se persisten en el servidor WFST hasta que no se pulse el botón de 'guardar cambios'. Los cambios no persistidos pueden deshacerse con el botón 'deshacer'.

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
 <link href="https://componentes.idee.es/api-idee/plugins/wfstcontrols/wfstcontrols-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/wfstcontrols/wfstcontrols-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un objeto JSON de opciones:

```javascript
var edicionWFST = new IDEE.plugin.WFSTControls({
  features: "drawfeature,modifyfeature,deletefeature,editattribute",
  layername: "nombreCapaWFS",
  geometry: "POINT",
  proxy: {
    status: true,
    disable: false
  }
});
```

**Propiedades del objeto de configuración**:

- **features** (string): Lista de herramientas separadas por comas. Opciones disponibles:
  - `drawfeature`: Habilita la herramienta de dibujo de nuevos features.
  - `modifyfeature`: Habilita la herramienta de modificación de geometría de features existentes.
  - `deletefeature`: Habilita la herramienta de eliminación de features.
  - `editattribute`: Habilita la herramienta de edición de atributos alfanuméricos.
  - `clearfeature`: Habilita la herramienta de limpieza de features (deshacer cambios).
  - `savefeature`: Habilita la herramienta de guardado de cambios en el servidor WFST.

- **layername** (string): Nombre de la capa WFS sobre la que se realizarán las ediciones.

- **geometry** (string, opcional): Tipo de geometría de la capa WFS. Valores posibles:
  - `POINT` / `MPOINT`: Punto o multipunto
  - `LINE` / `MLINE`: Línea o multilínea
  - `POLYGON` / `MPOLYGON`: Polígono o multipolígono
  
  Si no se especifica, el plugin intentará detectarlo automáticamente de los features existentes en la capa.

- **proxy** (object, opcional): Configuración del proxy WFST.
  - `status` (boolean): Estado actual del proxy. Por defecto: `true`
  - `disable` (boolean): Deshabilita ciertas funcionalidades del proxy. Por defecto: `false`

# API-REST

```javascript
URL_API?wfstcontrols=features*layername*geometry*proxy
```

<table>
  <tr>
    <th>Parámetros</th>
    <th>Opciones/Descripción</th>
    <th>Disponibilidad</th>
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
    <td>POINT/MPOINT/LINE/MLINE/POLYGON/MPOLYGON</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>proxy</td>
    <td>Objeto</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
</table>
(*) Este parámetro podrá ser enviado por API-REST con los valores true o false. Si es true indicará al plugin que se añada el control con los valores por defecto. Para configurar parámetros complejos se deberá realizar mediante API-REST en base64.

### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee/?ticket=EBC4MITICKET&layers=OSM,WFS*RED_REGENTE*https://www.ign.es/wfs/redes-geodesicas?*RED_REGENTE*POINT&wfstcontrols=drawfeature,modifyfeature,deletefeature,editattribute*RED_REGENTE*POINT
```

### Ejemplos de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

Ejemplo de constructor del plugin:
```javascript
{
  features: 'drawfeature,modifyfeature,deletefeature,editattribute',
  layername: 'RED_REGENTE',
  geometry: 'POINT',
  proxy: {
    status: true,
    disable: false
  }
}
```
```
https://componentes.idee.es/api-idee/?ticket=EBC4MITICKET&layers=OSM,WFS*RED_REGENTE*https://www.ign.es/wfs/redes-geodesicas?*RED_REGENTE*POINT&wfstcontrols=base64=eyJmZWF0dXJlcyI6ImRyYXdmZWF0dXJlLG1vZGlmeWZlYXR1cmUsZGVsZXRlZmVhdHVyZSxlZGl0YXR0cmlidXRlIiwibGF5ZXJuYW1lIjoiUkVEX1JFR0VOVEUiLCJnZW9tZXRyeSI6IlBPSU5UIiwicHJveHkiOnsic3RhdHVzIjp0cnVlLCJkaXNhYmxlIjpmYWxzZX19
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
  extract: true
});

map.addWFS(wfsLayer);

// Crear el plugin con las herramientas deseadas
const edicionWFST = new IDEE.plugin.WFSTControls({
  features: 'drawfeature,modifyfeature,deletefeature,editattribute',
  layername: 'RED_REGENTE',
  geometry: 'POINT',
  proxy: {
    status: true,
    disable: false
  }
});

// Añadir el plugin al mapa
map.addPlugin(edicionWFST);
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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=wfstcontrols)
