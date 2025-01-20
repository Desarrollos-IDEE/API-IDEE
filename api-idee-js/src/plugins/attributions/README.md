<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 M.plugin.Attributions</small></h1>

# Descripción

Plugin que permite mostrar la información de las atribuciones sobre las capas que se visualizan en el mapa.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

- **attributions.ol.min.js**
- **attributions.ol.min.css**

```html
 <link href="https://componentes.cnig.es/api-idee/plugins/attributions/attributions.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/attributions/attributions.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/attributions/attributions-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/attributions/attributions-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

* **position**: Posición del plugin sobre el mapa.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda (posición por defecto).
  - 'BR': (bottom right) - Abajo a la derecha.
* **tooltip**: Información emergente para mostrar en el tooltip del plugin (se muestra al dejar el ratón encima del plugin como información). Por defecto: 'Reconocimientos'.
* **mode**: Modo de uso del plugin Attributions (1 ó 2). Por defecto: 1
     - **1** `DISPONIBLE`: Atribuciones mediante archivo de atribuciones (modo por defecto). Parámetros específicos:
         + **url**: Url del archivo de atribuciones a utilizar. Por defecto: 'https://componentes.cnig.es/api-idee/files/attributions/WMTS_PNOA_20170220/atribucionPNOA_Url.kml'.
         + **type**: En el caso de no pasar nada por el parámetro 'layer' o pasar una capa que no sea de tipo vectorial, generará la capa de atribuciones con el tipo indicado en este parámetro. Los valores permitidos son ('kml' y 'geojson'). Por defecto: 'kml'.
         + **layerName**: Nombre asociado a la capa de atribuciones (nombre de la capa). Se usa para la construcción de la capa. Por defecto: 'attributions'.
         + **layer**: Capa definida por el usuario para determinar las atribuciones {M.layer.GeoJSON | M.layer.KML}. No requiere los parámetros anteriores (type, url y layerName)
         + **attributionParam**: Nombre del campo de atribución en el archivo. Por defecto: 'atribucion'.
         + **urlParam**: Nombre del campo de url en el archivo. Por defecto: 'url'.
     - **2** ` NO DISPONIBLE`: Atribuciones mediante consulta de parámetros de Capabilities de los servicios cargados en el mapa.
* **scale**: Escala a partir de la cual se activa la asignación de atribuciones. Por defecto 10000.
* **defaultAttribution**: Valor por defecto que se mostrará en la atribución del mapa definido por el usuario. Por defecto: Instituto Geográfico Nacional.
* **defaultURL**: Valor por defecto a usar como url asociada a la atribución definida por el usuario. Por defecto: https://www.ign.es/.
* **minWidth**: Mínimo ancho de visualización del plugin. Por defecto '100px'.
* **maxWidth**: Máximo ancho de visualización del plugin. Por defecto '200px'.
* **urlAttribute**: Texto adicional que se añade a la atribución. Por defecto: "Gobierno de España".

### Parámetros "defaultURL" y "defaultAttribution".
Para determinadas capas base ("OI.OrthoimageCoverage" WMTS del servicio http://www.ign.es/wmts/pnoa-ma, "LC.LandCoverSurfaces" WMTS del servicio https://servicios.idee.es/wmts/ocupacion-suelo e "IGNBaseTodo" WMTS del servicio https://www.ign.es/wmts/ign-base), el nombre y url de atribución cargan los valores especificados por defecto.

  * Si la capa base es "OI.OrthoimageCoverage" (https://sentinel.esa.int/web/sentinel/home) y tiene un nivel de zoom menor a 14:
    - Nombre de la atribución: Copernicus Sentinel 2019.
    - URL de la atribución: https://sentinel.esa.int/web/sentinel/home.
  * Si la capa base es "LC.LandCoverSurfaces" (https://www.ign.es/) y tiene un nivel de zoom menor a 14:
    - Nombre de la atribución: CORINE-Land Cover. Instituto Geográfico Nacional.
    - URL de la atribución: https://www.ign.es/ o defaultURL si este tiene valor.
  * Si la capa base es "IGNBaseTodo" (http://www.scne.es/):
    - Nombre de la atribución: Sistema Cartográfico Nacional.
    - URL de la atribución: http://www.scne.es/.
  * Si alguno de los casos anterior supera el zoom 14:
    - Nombre de la atribución: Sistema Cartográfico Nacional.
    - URL de la atribución: http://www.scne.es/.

En el caso de que la capa base no se corresponda con los casos anteriores, se podrá definir un nombre de atribución y una URL por defecto con los siguientes parámetros:
* **defaultURL**: Valor por defecto a usar como url asociada a la atribución definida por el usuario.
* **defaultAttribution**: Valor por defecto que se mostrará en la atribución del mapa definido por el usuario.


# Archivos de atribuciones CNIG
Ejemplos de archivo de atribuciones según formato predefinido (kml o geojson):
- https://componentes.cnig.es/NucleoVisualizador/vectorial_examples/atribucionPNOA.kml
- https://componentes.cnig.es/NucleoVisualizador/vectorial_examples/atribucion.kml
- https://www.ign.es/resources/viewer/data/20200206_atribucionPNOA-3857.geojson

# API-REST

```javascript
URL_API?attributions=position*tooltip*mode*scale*defaultAttribution*defaultURL*url*type*layerName*attributionParam*urlParam*minWidth*maxWidth*urlAttribute
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
    <td>Valor a usar para mostrar en el tooltip del plugin</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>mode</td>
    <td>1/2</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>scale</td>
    <td>Escala desde la que se activa la asignación de atribuciones</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>defaultAttribution</td>
    <td>Valor por defecto que se mostrará en la atribución del mapa</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>defaultURL</td>
    <td>URL por defecto asociada a la atribución</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>url</td>
    <td>URL del archivo de atribuciones a utilizar</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>type</td>
    <td>kml/geojson</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>layerName</td>
    <td>Nombre de la capa</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>layer</td>
    <td>Capa definida por el usuario, No requiere (type, url y layerName)</td>
    <td>Base64 ✔️ | Separador ❌</td>
  </tr>
  <tr>
    <td>attributionParam</td>
    <td>Nombre del campo de atribución en el archivo</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>urlParam</td>
    <td>Nombre del campo de URL en el archivo</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>minWidth</td>
    <td>Mínimo ancho de visualización del plugin</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>maxWidth</td>
    <td>Máximo ancho de visualización del plugin.</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>urlAttribute</td>
    <td>Texto adicional a añadir en la atribución</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>

</table>


### Ejemplos de uso API-REST

```
https://componentes.cnig.es/api-idee?attributions=TR*Plugin%20atribuciones*1*300*attributions*https://componentes.cnig.es/NucleoVisualizador/vectorial_examples/atribucion.kml*https://componentes.ign.es/NucleoVisualizador/vectorial_examples/atribucionPNOA.kml*kml*attributions*atribucion*url*100*200*Gobierno%20de%20España
```

```
https://componentes.cnig.es/api-idee?attributions=BL*Plugin%20atribuciones*1*10000***http://www.ign.es/resources/viewer/data/20200206_atribucionPNOA-3857.geojson*geojson
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad M.utils.encodeBase64.
Ejemplo:
```javascript
M.utils.encodeBase64(obj_params);
```

Ejemplo de constructor:
```javascript
{
  mode: 1,
  scale: 10000,
  url: "http://www.ign.es/resources/viewer/data/20200206_atribucionPNOA-3857.geojson",
  type: "geojson",
  position: "BL",
  tooltip: "Atribuciones",
}
```
```
https://componentes.cnig.es/api-idee/?attributions=base64=eyJtb2RlIjoxLCJzY2FsZSI6MTAwMDAsInVybCI6Imh0dHA6Ly93d3cuaWduLmVzL3Jlc291cmNlcy92aWV3ZXIvZGF0YS8yMDIwMDIwNl9hdHJpYnVjaW9uUE5PQS0zODU3Lmdlb2pzb24iLCJ0eXBlIjoiZ2VvanNvbiIsInBvc2l0aW9uIjoiQkwiLCJ0b29sdGlwIjoiQXRyaWJ1Y2lvbmVzIn0=
```
# Ejemplo de uso

```javascript
const map = M.map({
  container: 'map'
});

const mp = new M.plugin.Attributions({
  mode: 1,
  scale: 10000,
  /*Uso de type, para generar una capa de tipo GeoJSON o KML*/
  type: 'geojson', // En este caso la capa será de tipo GeoJSON
  url: 'http://www.ign.es/resources/viewer/data/20200206_atribucionPNOA-3857.geojson', // URL de la capa
  layerName: 'Ejemplo Attributions', // Nombre de la capa
  /*
  + Se puede defenir una capa directamente sin usar los
    parámetros anteriores (type, url y layerName).

  layer: new M.layer.GeoJSON({
    name: 'Ejemplo Attributions',
      source: {
        url: 'http://www.ign.es/resources/viewer/data/20200206_atribucionPNOA-3857.geojson',
      type: 'geojson',
    },
  }),
  */
  position: 'TL',
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
