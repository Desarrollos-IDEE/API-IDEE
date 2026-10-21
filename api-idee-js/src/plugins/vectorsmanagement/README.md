<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.VectorsManagement</small></h1>

# Descripción

Plugin que permite el dibujo y edición de geometrías sobre un mapa, cálculo de perfiles topográficos y áreas de influencia, así como su descarga.

|  Herramienta abierta  |Herramienta cerrada
|:----:|:----:|
|![Vectorsmanagement abierto](./src/facade/assets/images/vectorsmanagement-abierto.png)|![Vectorsmanagement cerrado](./src/facade/assets/images/vectorsmanagement-cerrado.png)|

# Dependencias
Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

Para uso de implementación OpenLayers:
- **vectorsmanagement.ol.min.js**
- **vectorsmanagement.ol.min.css**

Para uso de implementación Cesium:
- **vectorsmanagement.cesium.min.js**
- **vectorsmanagement.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/vectorsmanagement/vectorsmanagement.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/vectorsmanagement/vectorsmanagement.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/vectorsmannagement/vectorsmanagement-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/vectorsmanagement/vectorsmanagement-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:


- **position**:  Ubicación del plugin sobre el mapa.
  - 'left' (LEFT) - A la izquierda.
  - 'right' (RIGHT) - A la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **order**: Determina la prioridad visual dentro del contenedor. Un valor más alto desplaza el botón hacia el final del flujo.
- **selection**: Indica si se incluye la herramienta de selección de elementos (true/false). Por defecto: true.
- **addlayer**: Indica si se incluye la herramienta de creación de capas vectoriales (true/false). Por defecto: true.
- **analysis**: Indica si se incluye la herramienta de análisis (cálculo de perfil topografico y área de influencia) (true/false). Por defecto: true. Es necesario tener añadida la herramienta de selección para poder añadir esta.
- **creation**: Indica si se incluye la herramienta de dibujo (true/false). Por defecto: true. Es necesario tener añadida la herramienta de selección para poder añadir esta.
- **download**: Indica si se incluye la herramienta de descarga de elementos y capas vectoriales (true/false). Por defecto: true. Es necesario tener añadida la herramienta de selección para poder añadir esta.
- **edition**: Indica si se incluye la herramienta de edición de elementos (true/false). Por defecto: true. Es necesario tener añadida la herramienta de selección para poder añadir esta.
- **help**: Indica si se incluye la herramienta de ayuda (true/false). Por defecto: true.
- **style**: Indica si se incluye la herramienta de edición de estilos (true/false). Por defecto: true. Es necesario tener añadida la herramienta de selección para poder añadir esta.
- **turf**: Indica si se incluye la herramienta de geoprocesos con Turf.js (true/false). Por defecto: true. Es necesario tener añadida la herramienta de selección para poder añadir esta. Requiere una versión de API-IDEE que publique Turf.js (`window.turf`). Ver [Geoprocesos con Turf.js](#geoprocesos-con-turfjs).
- **snapping**: Configuración inicial del ajuste (snapping) que usan las herramientas de dibujo (`creation`) y de edición (`edition`). El usuario puede modificarla después desde la interfaz del plugin. Si ambas herramientas están desactivadas (`false`), este parámetro no tiene efecto. Valores posibles:
  - `true`: snapping activado con los valores por defecto. Es el valor por defecto.
  - `false`: snapping desactivado (el usuario puede activarlo desde la interfaz).
  - Objeto JavaScript, JSON o JSON en base64: snapping activado con esa configuración. Las propiedades que no se indiquen toman su valor por defecto y las que no estén contempladas se ignoran. Si el valor no es un JSON ni un base64 válido, se muestra un error y se usan los valores por defecto.

  | Propiedad | Descripción | Por defecto |
  |---|---|---|
  | **vertex** | Ajuste a los vértices de las geometrías existentes (true/false). | true |
  | **edge** | Ajuste a cualquier punto de las aristas de líneas y polígonos (true/false). | true |
  | **intersection** | Ajuste a los puntos donde se cruzan dos segmentos (true/false). | false |
  | **allLayers** | Ajuste a todas las capas vectoriales visibles y no solo a la capa seleccionada (true/false). | false |
  | **guides** | Muestra guías ortogonales y paralelas y se ajusta a ellas. Solo al dibujar líneas, polígonos o agujeros (true/false). | false |
  | **pixelTolerance** | Distancia en píxeles para realizar el ajuste. También es la distancia para seleccionar un vértice al editar una geometría. | 10 |

  ```javascript
  snapping: { intersection: true, allLayers: true, pixelTolerance: 12 },
  ```

# API-REST

## Edición espacial DataIDEE (OpenLayers)

La edición trabaja con una zona CRS84 fija. Antes de habilitarla carga todas las
páginas y rechaza una preparación incompleta o que supere los límites
configurables de la capa: por defecto 250 entidades por página, 1.000
entidades, 100.000 coordenadas y 10 MiB de GeoJSON. Durante la sesión, navegar
por el mapa no consulta ni sustituye los datos. Guardar envía cambios
secuencialmente; los éxitos parciales permanecen confirmados y el resto puede
descartarse o revisarse.

Para probar los cambios sin dependencias adicionales, compila el núcleo y el
plugin, y arranca el servicio local:

```sh
npm run build:ol-core
npm run build --prefix src/plugins/vectorsmanagement
node src/plugins/vectorsmanagement/test/demo/dataidee-server.js
```

Abre `http://127.0.0.1:8787` para editar la colección local. Los cambios se
mantienen mientras el proceso esté activo; restaura la colección con
`POST /local/reset`. Los modos `readonly`, `dense`, `complex`, `conflict`,
`partial`, `write-error` y `uncertain` sirven para comprobar permisos, límites,
conflictos, éxitos parciales, validación y respuestas de escritura perdidas.

Abre `http://127.0.0.1:8787/teunesco.html` para iniciar sesión y editar las
colecciones `externa:puntos` y `externa:estaciones` directamente. El token se
mantiene solo en memoria. Usa el selector de capas de VectorsManagement; para
crear entidades, introduce `nombre` y, en estaciones, un identificador entero.
Los puntos reciben su identificador del servidor. La sesión limita los cambios
a la extensión visible al iniciarla; guarda, descarta o cancela antes de
finalizarla o cambiar de capa.

```javascript
URL_API?vectorsmanagement=position*!collapsed*!order*!selection*!addlayer*!analysis*!creation*!download*!edition*!help*!style*!snapping*!turf
```
Ejemplo:
```javascript
https://componentes.idee.es/api-idee/?vectorsmanagement=RIGHT*true*true
```

# Geoprocesos con Turf.js

La herramienta de geoprocesos ejecuta operaciones de [Turf.js](https://turfjs.org/) sobre los elementos seleccionados o, si no hay selección, sobre todos los elementos de la capa seleccionada:

- Si la operación necesita parámetros (marcada con «…»), se piden en un diálogo antes de ejecutarla.
- Si devuelve geometría, cada ejecución añade al mapa su propia capa con la leyenda `Turf: <operación> (n)`, donde `n` es el número de orden de esa operación (1, 2, 3…). Su nombre interno es `turf_<operación>_<n>_<aleatorio>`.
- Si no devuelve geometría, el resultado se muestra en un toast o en un diálogo.

| Categoría | Operación | Entrada | Parámetros | Resultado |
|---|---|---|---|---|
| Medición | `area` | 1+ polígonos | unidades de área¹ | Área total |
| Medición | `length` | 1+ líneas | unidades² | Longitud total |
| Medición | `distance` | 2 puntos | unidades² | Distancia |
| Medición | `bbox` | 1+ elementos | – | Extensión en EPSG:4326 |
| Medición | `along` | 1 línea | distancia, unidades² | Punto |
| Centros | `center`, `centroid`, `centerOfMass`, `pointOnFeature` | 1+ elementos | – | Un punto por elemento |
| Transformación | `buffer` | 1+ elementos | radio (negativo reduce polígonos), unidades², pasos | Polígonos |
| Transformación | `simplify` | 1+ líneas o polígonos | tolerancia (grados), alta calidad | Geometrías simplificadas |
| Transformación | `convex` | 1+ elementos | concavidad (opcional; vacía = envolvente convexa) | Polígono |
| Transformación | `envelope` | 1+ elementos | – | Polígono |
| Transformación | `bezierSpline` | 1+ líneas | resolución, suavizado | Líneas suavizadas |
| Transformación | `transformRotate` | 1+ elementos | ángulo, punto de giro opcional (longitud y latitud; vacío = centroide) | Geometrías rotadas |
| Transformación | `transformScale` | 1+ elementos | factor, origen (centroide, centro o una esquina) | Geometrías escaladas |
| Transformación | `transformTranslate` | 1+ elementos | distancia, unidades², dirección | Geometrías desplazadas |
| Superposición | `union`, `intersect` | 2+ polígonos | – | Polígono |
| Superposición | `difference` | 2+ polígonos | – | Primer polígono seleccionado menos el resto |
| Relación | `booleanPointInPolygon` | 1 punto y 1 polígono | ignorar el borde | Sí / No |
| Relación | `booleanIntersects` | 2 elementos | ignorar autointersecciones | Sí / No |
| Relación | `booleanContains`, `booleanWithin` | 2 elementos (en orden de selección) | – | Sí / No |

¹ Metros, milímetros, centímetros, kilómetros, millas, millas náuticas, pulgadas, yardas y pies cuadrados, acres y hectáreas.

² Metros, milímetros, centímetros, kilómetros, millas, millas náuticas, pulgadas, yardas, pies, radianes y grados.

Las operaciones se definen en `src/facade/js/turf/turfoperations.js`. Para añadir una nueva basta con añadir una entrada al catálogo y sus traducciones (`turf.ops.<id>`).

Turf.js lo publica el núcleo de API-IDEE como variable global `turf`, igual que `ol` o `proj4`, por lo que también se puede usar directamente:

```javascript
const buffered = turf.buffer(turf.point([-3.7, 40.4]), 500, { units: 'meters' });
```

# Atajos de teclado

| Atajo | Herramienta | Acción |
|---|---|---|
| Mantener pulsada **Ctrl** | Dibujo y edición | Desactiva temporalmente el snapping mientras se mantiene pulsada. |
| **Alt + clic** sobre un vértice | Edición ("Editar geometría") | Elimina el vértice. |

# Ejemplo de uso

```javascript
const map = IDEE.map({
    container: 'map'
});

const mp = new IDEE.plugin.VectorsManagement({
    position: 'right',
    collapsible: true,
    collapsed: true,
    order: 1,
    selection: true,
    addlayer: true,
    creation: true,
    edition: true,
    style: true,
    analysis: true,
    download: true,
    help: true,
    turf: true,
    snapping: { intersection: true, allLayers: true },
});

map.addPlugin(mp);
```

Para crear etiquetas durante la digitalización de elementos vectoriales, se tiene que usar la herramienta de creación con la funcionalidad texto activada.
El campo se tiene que rellenar con el nombre de la propiedad y el valor con el formato ```{{}}```, por ejemplo:
![Ejemplo](./src/facade/assets/images/image.png)

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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=vectorsmanagement)
