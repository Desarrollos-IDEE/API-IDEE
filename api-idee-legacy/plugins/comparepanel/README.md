<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>APICNIG</strong> <small>🔌 M.plugin.ComparePanel</small></h1>

<p align="center">
  <a title="MIT License" href="LICENSE">
    <img src="https://img.shields.io/badge/license-EUPL-blue.svg">
  </a>
  <a title="Node version" href="https://nodejs.org/es">
    <img src="https://img.shields.io/badge/node-v14.16-blue">
  </a>
  <a title="NPM version" href="https://www.npmjs.com/package/npm">
    <img src="https://img.shields.io/badge/npm-v6.14-blue">
  </a>
  <a title="Language" href="https://www.w3schools.com/html/" target="_blank">
    <img src="https://img.shields.io/static/v1?label=Lang&message=HTML&color=maroon">
  </a>
  <a title="Language" href="https://www.w3schools.com/js/" target="_blank">
    <img src="https://img.shields.io/static/v1?label=Lang&message=Javascript&color=maroon">
  </a>
  <a title="Language" href="https://www.w3schools.com/css/" target="_blank">
    <img src="https://img.shields.io/static/v1?label=Lang&message=CSS3&color=maroon">
  </a>

  <br />
  <br />
</p>

## Descripción 👷

Plugin que agrupa los diversos plugins comparadores en una misma herramienta, compuesta de una barra de herramientas de comparación.

| Herramienta cerrada |Despliegue vertical|Despliegue horizontal|
|:----:|:----:|:-----:|
|![Imagen1](./assets/comparepanel-collapsed.png)|![Imagen1](./assets/comparepanel-vertical.png)|![Imagen2](./assets/comparepanel-horizontal.png)|


Los modos de comparación de cortina y Spy Eye se aplican siempre al mapa principal. Ahora podemos aplicar uno de estos dos modos de comparación y además acytivar algonmo de los modos de comparación por mapa espejo

## Dependencias 👷

- comparepanel.ol.min.js
- comparepanel.ol.min.css


```html
 <link href="../../plugins/comparepanel/comparepanel.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="../../plugins/comparepanel/comparepanel.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-CNIG en [api-ign-legacy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/comparepanel/comparepanel-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/comparepanel/comparepanel-1.0.0.ol.min.js"></script>
```


## Modos de comparación

<p align="center">
  <img src="assets/comparadoresv2.png" height="256" />
</p>

**Comparador de espejo / Mirror**: permite comparar varias capas dividiendo la pantalla en varias partes. Los mapas tienen sus vistas sincronizadas, y podemos ver la representación de una misma zona por distintas capas.

**Comparador de cortina / Curtain**: permite comparar varias capas sobre una cartografía base. La extensión de las capas sobre lienzo vienen definidas por la posición del ratón o por el punto medio del lienzo.

**Comparador zonal / Spyeye**: reducción de la capa comparativa a una zona circular para contratarla con el mapa de fondo.

## Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.

- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.

- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.

- **vertical**: Si es *true*, el panel se verá con la orientación vertical. Si es *false*, el panel se verá con la orientación horizontal. Por defecto tiene el valor *true*.

- **defaultCompareMode**: indica el modo de comparación que se arranca por defecto.

  - 'mirror': Comparador de espejo.
  - 'curtain': Comparador de paneles móviles.
  - 'spyeye': Comparador de zona o puntual.
  - 'none': no arranca ninguno de los comparadores. Es equivalente a arrancar como  *defaultCompareMode='mirror'* &  *defaultCompareViz=0*.

- **defaultCompareViz**: ajustamos el modo de visualización una vez vea seleccionado el comparador.

  - En el caso del modo *mirror* indicamos de 0 a 9 el modo de visualización:
    - 0: barra de herramientas desplegada con el mapa simple esperando al usuario.
    - 1: dos mapas en vertical.
    - 2: dos mapas en horizontal.
    - 3: tres mapas en vertical.
    - 4: cuatro mapas en vertical.
    - 5: mosaico con cuatro mapas.
    - 6: cuatro mapas en horizontal.
    - 7: tres mapas en proporción 2-1-1.
    - 8: un mapa arriba y dos abajo.
    - 9: dos mapas arriba y uno abajo.
  - En el caso del modo *curtain* indicamos de 0 a 3:
    - 0: barra de herramientas desplegada con el mapa simple esperando al usuario.
    - 1: dos mapas en vertical.
    - 2: dos mapas en horizontal.
    - 3: cuatro mapas.
  - En el caso del modo *spyeye* arranca con la barra de herramientas desplegada con el mapa simple esperando al usuario.

- **baseLayers**: Parámetro obligatorio. Array que contiene cada capa junto a sus datos:
  - Nombre: nombre descriptivo de la capa. Se puede dejar vacío con comillas vacías: *''*
  - Etiqueta: etiqueta o fecha de la capa. Se puede dejar vacío con comillas vacías: *''*
  - Servicio en formato API-CORE para insertar una capa a través de servicios WMS ó WMTS, o la capa como objeto, de cada intervalo.

- **urlcoberturas**: fichero en formato geoJSON con la cobertura de capas. Es necesario que entre los atributos de cada *feature* haya uno llamado **layerkey**, que contendrá el nombre de la capa dentro del servicio WMS/WMTS. Si este parámetro no se encuentra presente, no se aplicará el filtro por coberturas y todas las capas podrán seleccionarse siempre, aunque en la zona visible en el mapa no tenga cobertura.
- **layerCobertura**. Capa de cobertura con atribuciones.
- **layerName**. El nombre del sombrero de capa vectorial contiene la información de atribución.
- **lyrsMirrorMinZindex**: indica el nivel zIndex a partir del cual se cargan las capas superpuestas en los comparadores espejo. Por defecto, tiene valor de 100.
- **tooltip**. Valor a usar para mostrar en el tooltip del plugin.

```javascript
  // Ejemplos de definiciones de capas esperadas por el comparador en formato StringLayer

  /* WMS */
  ['Americano 1956-57', '1956', 'WMS*Americano 1956-1957*https://www.ign.es/wms/pnoa-historico*AMS_1956-1957'],
  ['Interministerial 1973-86', '1983', 'WMS*Interministerial 1973-1986*https://www.ign.es/wms/pnoa-historico*Interministerial_1973-1986'],
  ['Nacional 1981-86', '1986', 'WMS*Nacional 1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986'],
  ['OLISTAT', '1998', 'WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT'],
  ['SIGPAC', '2003', 'WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC'],
  ['PNOA 2004', '2004', 'WMS*PNOA 2004*https://www.ign.es/wms/pnoa-historico*pnoa2004'],
  ['PNOA 2019', '2019', 'WMS*PNOA 2019*https://www.ign.es/wms/pnoa-historico*pnoa2019'],

  /* WMTS */
  ['MTN', '2020', 'WMTS*MTN*https://www.ign.es/wmts/mapa-raster*MTN*GoogleMapsCompatible*image/jpeg'],
  ['SIOSE', '2020', 'WMTS*SIOSE*https://servicios.idee.es/wmts/ocupacion-suelo*LC.LandCoverSurfaces*GoogleMapsCompatible*image/png'],
  ['LIDAR', '2020', 'WMTS*LIDAR*https://wmts-mapa-lidar.idee.es/lidar*EL.GridCoverageDSM*GoogleMapsCompatible*image/png'],

```

- **mirrorpanelParams**: Parámetros opcionales del plugin mirrorpanel. A destacar:
  - showCursors (true/false): Si es true, muestra cursores sincronizados en cada unao de los mapas espejo. Defecto: *true*.
  - reverseLayout (true/false): indica en qué posición de la pantalla se mantiene el mapa principal (el que contiene el botón con las herramientas de comparación) con respecto a los demás. *False*: se sitúa a la izquierda. *True*: se sitúa a la derecha. Defecto: *false*.
  - enabledPlugins: permite que algunos de los plugins configurados en el mapa principal se repliquen en los mapas espejo: disponible actualmente para el control FullTOC y el control Vectors.

![](assets/fulltoc-mirror.png)

- **lyrcompareParams**: Parámetros opcionales del plugin lyrcompare.
  - defaultLyrA (numérico): Capa cargada al inicio en posición 1. Valores de 1 al número de capas disponibles. Defecto, 1.
  - defaultLyrB (numérico): Capa cargada al inicio en posición 2. Valores de 1 al número de capas disponibles. Defecto, 2.
  - defaultLyrC (numérico): Capa cargada al inicio en posición 3. Valores de 1 al número de capas disponibles. Defecto, 3.
  - defaultLyrD (numérico): Capa cargada al inicio en posición 4. Valores de 1 al número de capas disponibles. Defecto, 4.
  - opacityVal: Define el valor de la opacidad que se aplicará a las capas que se muestran sobre la cartografía base. Rango 0 a 100.
  - staticDivision: Permite definir si al arrancar la herramienta dividirá las capas por la posición del ratón (valor 0), por el punto medio del lienzo de cartografía (valor 1) o por el punto medio del lienzo de cartografía con líneas arrastrables (valor 2). Por defecto toma el valor 1.

- **transparencyParams**: Parámetros opcionales del plugin transparency.
  - radius (numérico): radio del efecto transparencia. Tiene un rango entre 30 y 200. Defecto: 100.


## Ejemplo

Insertar intervalos a través de servicios WMS. La URL en formato API-CORE sigue la siguiente estructura:
  - Servicio,Leyenda,URL,Nombre. Separados por "*".
```javascript

  const mp = new Comparepanel({
    position: 'TR',
    vertical: false,
    collapsed: false,
    collapsible: true,
    defaultCompareMode: 'mirror',// mirror - curtain - spyeye - none
    defaultCompareViz: 1,
    baseLayers: [
      ["NACIONAL 1981-1986", "1986", "WMS*NACIONAL_1981-1986*https://www.ign.es/wms/pnoa-historico*NACIONAL_1981-1986"],
      ["OLISTAT", "1998", "WMS*OLISTAT*https://www.ign.es/wms/pnoa-historico*OLISTAT"],
      ["SIGPAC", "2003", "WMS*SIGPAC*https://www.ign.es/wms/pnoa-historico*SIGPAC"],
      ["PNOA 2004", "2004", "WMS*pnoa2004*https://www.ign.es/wms/pnoa-historico*pnoa2004"],
      ["PNOA 2005", "2005", "WMS*pnoa2005*https://www.ign.es/wms/pnoa-historico*pnoa2005"],
      ["PNOA 2006", "2006", "WMS*pnoa2006*https://www.ign.es/wms/pnoa-historico*pnoa2006"],
      ["PNOA 2010", "2010", "WMS*pnoa2010*https://www.ign.es/wms/pnoa-historico*pnoa2010"]
    ],
    urlcoberturas: 'https://projects.develmap.com/apicnig/pnoahisto/coberturas.geojson',
    lyrsMirrorMinZindex: 50,
    transparencyParams: {
      radius: 100,
    },
    lyrcompareParams: {
        staticDivision: 2,
    },
    mirrorpanelParams: {
        showCursors: true,
        reverseLayout:false,
    }
  });

   map.addPlugin(mp);
```

## 👨‍💻 Desarrollo

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
├── assets 🌈               # Recursos
├── src 📦                  # Código fuente.
├── task 📁                 # EndPoints
├── test 📁                 # Testing
├── tmp 📁                  # Destination directory for images.
├── webpack-config 📁       # Webpack configs.
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

## 🚔 Licencia

* [European Union Public Licence v1.2](https://raw.githubusercontent.com/JoseJPR/tutorial-nodejs-cli-system-notification/main/README.md)
