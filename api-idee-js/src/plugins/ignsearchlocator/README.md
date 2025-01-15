<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 M.plugin.IGNSearchLocator</small></h1>

# Descripción

Plugin que permite la búsqueda de Direcciones postales (Geocoder de Cartociudad) y Topónimos (Nomenclátor del IGN), también permite localizar coordenadas en varios SRS.

# Dependencias

- ignsearchlocator.ol.min.js
- ignsearchlocator.ol.min.css

```html
 <link href="https://componentes.cnig.es/api-idee/plugins/ignsearchlocator/ignsearchlocator.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/ignsearchlocator/ignsearchlocator.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-ign-legacy](https://github.com/IGN-CNIG/API-IDEE/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.cnig.es/api-idee/plugins/ignsearchlocator/ignsearchlocator-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-idee/plugins/ignsearchlocator/ignsearchlocator-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **isCollapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: false.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: false.
- **tooltip**: Tooltip que se muestra sobre el plugin (se muestra al dejar el ratón encima del plugin como información).
- **zoom**: Zoom que aplicará al mostrar resultado de tipo puntual. Por defecto: 16.
- **servicesToSearch**: Servicio que se consulta:
  - **'g'**: Consulta Geocoder.
  - **'n'**: Consulta Topónimos.
  - **'gn'** : Consulta Geocoder y Topónimos (por defecto).
- **maxResults**: Número de resultados en la consulta (10 por defecto).
- **noProcess**: En geocoder, indica las entidades que no se incluirán en los resultados.
  - Admite combinación de 'municipio,poblacion,toponimo'.
  - Por defecto: 'poblacion'.
- **countryCode**: Código por defecto del país en la petición a geocoder. Por defecto: countryCode = 'es'.
- **reverse**: Valor booleano que indica si la funcionalidad obtener dirección en un punto del mapa está activada.
  - true (por defecto).
  - false.
- **cadastre**: Valor booleano que indica si la funcionalidad buscar parcela/catastro está activada.
  - true (por defecto).
  - false.
- **searchCoordinatesXYZ**: Valor booleano que indica si la funcionalidad buscar por coordenadas está activada.
  - true (por defecto).
  - false.
- **resultVisibility**: Indica si se muestra o no la geometría del elemento localizado. Por defecto: true.
- **urlCandidates**: Url servicio candidates de geocoder. Por defecto: 'http://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp'.
- **urlFind**: Url servicio find de geocoder. Por defecto: 'http://www.cartociudad.es/geocoder/api/geocoder/findJsonp'.
- **urlReverse**: Url Servicio geocoding inverso. Por defecto: 'http://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode'.
- **urlPrefix**: Prefijo source servicio Nomenclátor. Por defecto: 'http://www.idee.es/'.
- **urlAssistant**: Url servicio SearchAssitant de Nomenclátor. Por defecto: 'https://www.idee.es/communicationsPoolServlet/SearchAssistant'.
- **urlDispatcher**: Url servicio Dispatcher de Nomenclátor. Por defecto: 'https://www.idee.es/communicationsPoolServlet/Dispatcher'.
- **CMC_url**: Url servicio para la consulta de municipios de una provincia. Por defecto: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/ConsultaMunicipioCodigos'.
- **DNPPP_url**: Url servicio para la consulta de datos no protegidos para un inmueble por su polígono parcela. Por defecto: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPPP_Codigos'.
- **CPMRC_url**: Url servicio para consulta de coordenadas por Provincia, Municipio y Referencia Catastral. Por defecto: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC'.
- **catastroWMS**: Url servicio para la consulta por referencia catastral. Por defecto: 'http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR'.
- **pointStyle**: Tipo de icono a mostar cuando se encuentra un resultado de tipo puntual. Por defecto: 'pinBlanco'.
- **help**: URL de ayuda.
- **searchPosition**: Orden de resultados de las dos búsquedas. Por defecto: 'nomenclator,geocoder'.
- **locationID**: Búsqueda inicial en el servicio nomenclátor por ID, muestra el resultado y se realiza un zoom a la posición.
- **geocoderCoords**: Búsqueda inicial en el servicio geocoder por longitud, latitud.
- **requestStreet**: URL del findJSON de un resultado de búsqueda, para que aparezca cargado al inicio.

# API-REST

```javascript
URL_API?ignsearchlocator=position*collapsible*isCollapsed*tooltip*servicesToSearch*maxResults*noProcess*resultVisibility
*reverse*requestStreet*locationID*geocoderCoords*zoom*searchPosition*pointStyle*help*countryCode*cadastre
*searchCoordinatesXYZ*urlCandidates*urlFind*urlReverse*urlPrefix*urlAssistant*urlDispatcher*CMC_url*DNPPP_url
*CPMRC_url*catastroWMS
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
    <td>collapsible</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>isCollapsed</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>Texo informativo</td>
  </tr>
  <tr>
    <td>servicesToSearch</td>
    <td>g/n/gn</td>
  </tr>
  <tr>
    <td>maxResults</td>
    <td>Número de resultados</td>
  </tr>
  <tr>
    <td>noProcess</td>
    <td>municipio/poblacion/toponimo (admite combinación separado por ',')</td>
  </tr>
  <tr>
    <td>resultVisibility</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>reverse</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>requestStreet</td>
    <td>URL findJSON de un resultado</td>
  </tr>
  <tr>
    <td>locationID</td>
    <td>Búsqueda inicial en nomenclátor</td>
  </tr>
  <tr>
    <td>Búsqueda inicial en geocoder</td>
    <td>TR/TL/BR/BL</td>
  </tr>
  <tr>
    <td>zoom</td>
    <td>Nivel de zoom al resultado</td>
  </tr>
  <tr>
    <td>searchPosition</td>
    <td>nomenclator,geocoder/geocoder,nomenclator</td>
  </tr>
  <tr>
    <td>pointStyle</td>
    <td>pinBlanco/pinRojo/pinMorado</td>
  </tr>
  <tr>
    <td>help</td>
    <td>URL ayuda</td>
  </tr>
  <tr>
    <td>countryCode</td>
    <td>Código país para geocoder</td>
  </tr>
  <tr>
    <td>cadastre</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>searchCoordinatesXYZ</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>urlCandidates</td>
    <td>URL candidares geocoder</td>
  </tr>
  <tr>
    <td>urlFind</td>
    <td>TR/TL/BR/BL</td>
  </tr>
  <tr>
    <td>urlReverse</td>
    <td>URL geocoding inverso/td>
  </tr>
  <tr>
    <td>urlPrefix</td>
    <td>Prefijo source nomenclátor</td>
  </tr>
  <tr>
    <td>urlAssistant</td>
    <td>URL SearchAssitant nomenclátor</td>
  </tr>
  <tr>
    <td>urlDispatcher</td>
    <td>URL Dispatcher nomenclátor</td>
  </tr>
  <tr>
    <td>CMC_url</td>
    <td>URL consulta municipios</td>
  </tr>
  <tr>
    <td>DNPPP_url</td>
    <td>URL consulta datos no protegidos</td>
  </tr>
  <tr>
    <td>CPMRC_url</td>
    <td>URL consulta coordenadas por provincia</td>
  </tr>
  <tr>
    <td>catastroWMS</td>
    <td>URL consulta por referencia catastral</td>
  </tr>
</table>



### Ejemplos de uso API-REST

```
https://componentes.cnig.es/api-idee?ignsearchlocator=TL*true*false*IGNSEARCHLOCATOR*gn*10*poblacion*true*false*https%3A%2F%2Fwww.cartociudad.es%2Fgeocoder%2Fapi%2Fgeocoder%2FfindJsonp%3Fq%3D%3Cspan%2520id%3D%22info%22%3EC%C3%A1ceres%2C%2520C%C3%A1ceres%3C%2Fspan%3E%2520%26type%3DMunicipio%26tip_via%3Dnull%26id%3D10037
```

```
https://componentes.cnig.es/api-idee?ignsearchlocator=TL*true*false*IGNSEARCHLOCATOR*gn*10*poblacion*true*false**ES.IGN.NGBE.2814868
```

```
https://componentes.cnig.es/api-idee?ignsearchlocator=TL*true*false*IGNSEARCHLOCATOR*gn*10*poblacion*true*false***-5.98351886687987,37.39136733122602
```


# Eventos

- **ignsearchlocator:entityFound**
  - Evento que se dispara cuando se ha localizado la búsqueda del plugin sobre el mapa.
  - Expone, como parámetro devuelto, el **extent** actual calculado en la búsqueda

```javascript
pluginignsearchlocator.on('ignsearchlocator:entityFound', (extent) => {
  // eslint-disable-next-line no-alert
  window.alert('Encontrado');
});
```

- **ignsearchlocator:locationCentered**
  - Evento que se dispara cuando se realiza una búsqueda por coordenadas.
  - Expone, como parámetro devuelto, el **zoom** y el **center** donde se encuentra el resultado.

```javascript
pluginignsearchlocator.on('xylocator:locationCentered', (result) => {
  console.log(response.center);
  console.log(response.zoom);
});
```

# Ejemplo de uso

```javascript
   const map = M.map({
     container: 'map'
   });

   const mp = new M.plugin.IGNSearchLocator({
        servicesToSearch: 'gn',
        maxResults: 10,
        isCollapsed: false,
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