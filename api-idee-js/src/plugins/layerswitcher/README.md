<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Layerswitcher</small></h1>

# Descripción

Extensión que permite listar y gestionar las capas (servicios web y/o ficheros) añadidas en el mapa, de forma fácil y rápida.
La carga de nuevos servicios se pueden realizar mediante el listado predefinido o indicando la URL del servicio.

|  Herramienta abierta  |Herramienta cerrada
|:----:|:----:|
|![Layerswitcher abierto](./src/facade/assets/images/layerswitcher-abierto.png)|![Layerswitcher cerrado](./src/facade/assets/images/layerswitcher-cerrado.png)|

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **layerswitcher.ol.min.js**
- **layerswitcher.ol.min.css**

Para uso de implementación Cesium:
- **layerswitcher.cesium.min.js**
- **layerswitcher.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/layerswitcher/layerswitcher-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**:  Ubicación del plugin sobre el mapa.
  - 'left' (LEFT) - A la izquierda.
  - 'right' (RIGHT) - A la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **order**: Determina la prioridad visual dentro del contenedor. Un valor más alto desplaza el botón hacia el final del flujo.
- **tooltip**: Texto que se muestra al dejar el ratón encima del plugin. Por defecto: Gestor de capas.
- **isDraggable**: Permite mover el plugin por el mapa. Por defecto: false.
- **http**: Si es *true* se permite la carga de capas de servicios desplegados con http, si se le da valor *false* no se permitirá la carga de servicios http. Por defecto: true.
- **https**: Si es *true* sólo se permite la carga de capas de servicios desplegados con https, si no se rellena o se le da valor *false* se permite la carga de cualquier servicio. Por defecto: true.
- **showCatalog**: Si es *true* se habilitará una nueva funcionalidad que permitirá la carga de servicios del catálogo habilitando un listado con buscador de dichos servicios. Disponible al pulsar sobre el botón añadir del plugin, apareciendo unos prismáticos para realizar la búsqueda. Por defecto: false.
- **precharged**: Aquí debemos definir la estructura de los servicios predefinidos que queremos que tenga el plugin (árbol de contenido, servicios sin nodo padre, etc.). También podremos definir un parámetro para cada servicio con el que restringiremos qué capas de cada servicio queremos que sea posible cargar (white_list). Se puede indicar como objeto, como cadena JSON, como cadena JSON codificada en base64 o como **URL** (string) a un fichero JSON con esa misma estructura. Si no se informa, se usa el catálogo publicado en la URL `LIST_PRECHARGED_URL` de `configuration.js` (si no está configurada o no se puede cargar, se usa el catálogo por defecto del plugin).
Cada servicio admite además estilos predefinidos para las capas que se cargan desde él: un array `styles` para todo el servicio y, dentro de `layers`, un array `styles` propio de cada capa (ver [Estilos predefinidos por capa](#estilos-predefinidos-por-capa)). Cuando `precharged` es la URL de un fichero JSON, las URL relativas de sus servicios se resuelven respecto a la del fichero.
El listado de capas aparece al pulsar sobre el botón añadir (Listado de algunas capas disponibles).
- **isMoveLayers**: Permite mover las capas en el árbol de contenidos para cambiar el orden de visualización. Por defecto: false.
- **modeSelectLayers**: Permite cambiar el modo de selección de las capas para su visualización.
  - 'eyes': permite visualizar varias capas a la vez. Por defecto activado.
  - 'radio': permite la visualización de una sola capa a la vez.
- **tools**: permite añadir funcionalidades a cada capa. Se forma mediante un array de funcionalidades:
  - 'transparency': permite cambiar la opacidad a la capa.
  - 'legend': permite consultar la leyenda de la capa.
  - 'zoom': permite hacer zoom a la capa.
  - 'information': permite consultar la información de la capa.
  - 'style': permite cambiar el estilo a la capa (si tiene más de un estilo).
  - 'sld': añade al diálogo de estilo de las capas vectoriales la carga de un fichero de estilos SLD (ver [Carga de estilos SLD](#carga-de-estilos-sld)). Con esta herramienta el botón de estilo aparece en las capas vectoriales aunque solo tengan un estilo.
  - 'delete': permite eliminar la capa del mapa.
  Por defecto añade todas las herramientas.
- **useProxy**: Determina si se desea que las peticiones de red que se realizan en la extensión se realicen con el proxy o no. Por defecto: true.
- **displayLabel**: Muestra la etiqueta del tipo del servicio si tiene valor true, en caso de tener valor false no la mostrará. Por defecto: false.
- **addLayers**: Permite añadir la funcionalidad de añadir capas. Por defecto: true.
- **statusLayers**: Permite añadir la funcionalidad de mostrar/ocultar todas las capas. Por defecto: true.

## Servicios OGC API Features y DataIDEE

Al introducir la URL de un servicio OGC API Features (raíz, `/collections` o `/collections/{id}`), debajo del buscador aparece el selector **Cargar como**:

- **OGC API Features (estándar)**: las capas se añaden como `IDEE.layer.OGCAPIFeatures`. El parámetro `f` se toma del enlace `items` que anuncia el servicio; si el servicio no lo usa, no se envía.
- **DataIDEE**: las capas se añaden como `IDEE.layer.DataIDEE`. Si el servicio tiene login, aparece un candado para iniciar sesión con usuario y contraseña o pegando directamente un token de acceso (debe ser un JWT sin caducar; con la API de autenticación de DataIDEE se comprueba además con `GET /auth-api/auth/me`). El botón «Guardar» solo se habilita con usuario y contraseña o con un token válido. Se admite la API de autenticación de DataIDEE (`/auth-api/auth/login`, renovación con `GET /auth-api/auth/refresh` y cierre con `/auth-api/auth/logout`; se detecta con `GET /auth-api/auth/me`, que sin token responde 401) y, como alternativa, el contrato anterior (`/auth/login` y `POST /auth/refresh`). El token se guarda en el `localStorage` del navegador, uno por URL de servicio, se renueva antes de caducar y se envía siempre como `Authorization: Bearer <token>`: al listar las colecciones, en las consultas (queryables, recuento, información) y en las capas (`{ getFeature: { token } }`). Las capas también admiten `tokenLocation: 'query'` para enviar el token como `?token=<token>`.

Se recuerda el último modo usado con cada servicio. Los servicios precargados con `type: 'DataIDEE'` se abren en modo DataIDEE.
El servicio debe permitir CORS (cabeceras `Authorization` y `Content-Type`) para iniciar sesión y para consultar capas con token sin proxy.

## Estilos predefinidos por capa

Cada servicio de `precharged` puede declarar los estilos que tendrán las capas que se carguen desde él. El primero se aplica al añadir la capa y, si hay más de uno, se pueden alternar desde el selector de estilo de la capa (herramienta `style`). El selector muestra el estilo activo seleccionado y permite volver a cualquiera de ellos, incluido el primero.

```json
{
  "services": [{
    "type": "WMS",
    "name": "Unidades administrativas",
    "url": "https://www.ign.es/wms-inspire/unidades-administrativas?",
    "white_list": ["AU.AdministrativeUnit", "AU.AdministrativeBoundary"],
    "layers": [
      { "name": "AU.AdministrativeUnit", "styles": ["ua-comparador", "ua-EscalaGris", "provincias-gris"] },
      { "name": "AU.AdministrativeBoundary", "styles": ["LimitesRojo", "LimitesGris", "LimitesCruz"] }
    ]
  }],
  "groups": []
}
```

- **`layers`**: lista de capas del servicio con sus estilos. `name` es el identificador que publica el servicio, el mismo que se usa en `white_list`:
  - WMS: `Name` de la capa.
  - WFS: nombre del tipo de objeto, con o sin prefijo (`"puntos"` o `"prueba:puntos"`).
  - OGC API Features y DataIDEE: identificador de la colección.
- **`styles`** (del servicio): estilos de todas las capas del servicio que no tengan los suyos en `layers`. Es el formato anterior y se sigue admitiendo. Es la forma de indicar los estilos de los servicios de una sola capa (GeoJSON, KML/KMZ, MVT, GeoTIFF), cuya capa no tiene identificador propio.
- `white_list` mantiene su función: una capa que esté en `layers` pero no en `white_list` no se puede cargar.

Formato de cada estilo, según el tipo de capa:

| Capa | Estilos admitidos | Ejemplo |
|---|---|---|
| WMS | Nombre de un estilo publicado por el servicio para esa capa | `"ua-comparador"` |
| Vectoriales (GeoJSON, KML/KMZ, WFS, OGC API Features, DataIDEE, MVT, MBTilesVector) | Opciones de `IDEE.style.Generic` (`name` es la etiqueta) o un estilo serializado con `style.serialize()` (de cualquier clase de estilo vectorial: `Generic`, `Category`, `Choropleth`...) | `{"name": "Verde", "polygon": {"fill": {"color": "#2e7d32", "opacity": 0.6}}}` |
| GeoTIFF | Opciones de `IDEE.style.Raster` (`name` es la etiqueta) o un estilo serializado | `{"name": "Solo rojo", "bands": [1, 0, 0]}` |

```json
{
  "type": "GeoJSON",
  "name": "Zonas de ejemplo",
  "url": "zonas.geojson",
  "styles": [
    { "name": "Verde", "polygon": { "fill": { "color": "#2e7d32", "opacity": 0.6 }, "stroke": { "color": "#1b5e20", "width": 1 } } },
    { "name": "Naranja", "polygon": { "fill": { "color": "#ef6c00", "opacity": 0.6 }, "stroke": { "color": "#bf360c", "width": 1 } } },
    "eyJwYXJhbWV0ZXJzIjpbeyJuYW1lIjoiQXp1bCBzZXJpYWxpemFkbyIsInBvbHlnb24iOnsiZmlsbCI6eyJjb2xvciI6IiMxNTY1YzAiLCJvcGFjaXR5IjowLjV9LCJzdHJva2UiOnsiY29sb3IiOiIjMGQ0N2ExIiwid2lkdGgiOjF9fSwicG9pbnQiOnsicmFkaXVzIjo1fX1dLCJkZXNlcmlhbGl6ZWRNZXRob2QiOiIoKHNlcmlhbGl6ZWRQYXJhbWV0ZXJzKSA9PiBJREVFLnN0eWxlLlNpbXBsZS5kZXNlcmlhbGl6ZShzZXJpYWxpemVkUGFyYW1ldGVycywgJ0lERUUuc3R5bGUuR2VuZXJpYycpKSJ9"
  ]
}
```

El estilo serializado del ejemplo se ha generado con `new IDEE.style.Generic({ name: 'Azul serializado', polygon: { ... } }).serialize()` y se puede recuperar con `IDEE.Style.deserialize(texto)`.

**Prioridad.** Se usa la primera fuente que tenga algún estilo válido para la capa (no se mezclan):

1. Los estilos de la capa en `layers`.
2. Los estilos del servicio (`styles`).
3. Los estilos que publica el propio servicio (estilos WMS de las capacidades). Los KML/KMZ conservan sus propios estilos, salvo que el servicio precargado tenga estilos: entonces se cargan sin ellos (`extractStyles: false`).
4. Los estilos predefinidos de la capa (`predefinedStyles`, empezando por su estilo por defecto).

Los estilos que no son compatibles con la capa se descartan con un aviso en la consola: nombres de estilo que el servicio WMS no publica para esa capa, estilos ráster en capas vectoriales (y al revés) o estilos que la implementación del mapa no puede crear. Las capas sin estilos configurados se comportan como antes. Los estilos configurados no se modifican al aplicarse, así que se puede cambiar de estilo tantas veces como se quiera.

**Etiquetas del selector.** Se usa el `name` del estilo (o el título del estilo WMS). Si no tiene, se muestra «Estilo N» según su posición; «Estilo predeterminado» se reserva para el estilo por defecto de la propia capa.

## Carga de estilos SLD

La herramienta `sld` añade, dentro del diálogo que abre el botón de estilo de cada capa vectorial (GeoJSON, KML/KMZ con `extractStyles: false`, WFS, OGC API Features, DataIDEE, MVT, ficheros cargados...), el botón «Cargar estilo SLD» para elegir un fichero `.sld` o `.xml` (máximo 5 MB). El fichero se valida y se convierte a estilos de IDEE; cada `UserStyle` se añade al selector del diálogo con el sufijo «(SLD)» y queda seleccionado el marcado como `IsDefault` (o el primero). El estilo no se aplica hasta pulsar «Cambiar», y se puede volver a los estilos anteriores desde el mismo selector.

- Formatos: SLD 1.0.0 (`CssParameter`) y SE 1.1.0 (`SvgParameter`), que es el que exporta QGIS (*Propiedades de la capa → Simbología → Estilo → Guardar estilo… → Archivo SLD*).
- Se usa la `NamedLayer` cuyo nombre coincide con el de la capa, sin distinguir mayúsculas y comparando también la última parte del nombre (`AU.AdministrativeUnit` coincide con la colección `administrativeunit`). Si el SLD describe varias capas y ninguna coincide, se usa la primera y se avisa.
- Simbolizadores: `PolygonSymbolizer` (relleno y trazo), `LineSymbolizer` (trazo, incluido `stroke-dasharray`, `stroke-linecap` y `stroke-linejoin`), `PointSymbolizer` (`Mark` circular con su tamaño, relleno y trazo; `ExternalGraphic` como icono) y `TextSymbolizer` (etiqueta con un atributo o un texto, fuente, color, halo, anclaje y desplazamiento).
- Reglas:
  - Las reglas sin filtro (y `ElseFilter`) forman un `IDEE.style.Generic`.
  - Si todas las reglas filtradas usan `PropertyIsEqualTo` sobre un mismo atributo, forman un `IDEE.style.Category` (`ElseFilter` se usa para el resto de valores).
  - Con cualquier otro filtro admitido (`PropertyIsEqualTo` sobre varios atributos, `PropertyIsNotEqualTo`, `PropertyIsLessThan`, `PropertyIsLessThanOrEqualTo`, `PropertyIsGreaterThan`, `PropertyIsGreaterThanOrEqualTo`, `PropertyIsLike` con sus comodines, `PropertyIsBetween`, `PropertyIsNull`, `And`, `Or` y `Not`), cada propiedad del estilo se calcula objeto a objeto con las reglas que cumple. Se aplican en orden y `ElseFilter` solo cuando no se cumple ninguna. El estilo resultante se puede serializar, así que se conserva al pasar de 2D a 3D.
  - Los rangos de escala (`MinScaleDenominator`/`MaxScaleDenominator`) se respetan: cada regla solo se dibuja en su rango, como en GeoServer. En 2D se recalcula en cada repintado y en 3D al terminar de mover la cámara.
- Lo que no se puede aplicar se omite y se avisa: filtros espaciales, de identificador o con funciones, `VendorOption`, `Priority`, `LinePlacement`, rellenos y trazos con gráficos, marcas no circulares (se dibujan como círculos), etiquetas compuestas y valores calculados con atributos.
- Errores (se muestran en un diálogo y la capa conserva su estilo): fichero vacío, ilegible o mayor de 5 MB, XML no válido, documento que no es un SLD, SLD solo con simbolización ráster (`RasterSymbolizer`) y SLD sin reglas compatibles.
- Las capas WMS no tienen el botón: su estilo lo dibuja el servidor y los servicios de IDEE no aplican el parámetro `SLD_BODY` (se usan sus estilos publicados desde el selector de estilo).

Los servicios WMS del IGN y de IDEE publican el SLD de cada capa con la petición `GetStyles`, por ejemplo:

- [Masas de agua (IDEE)](https://servicios.idee.es/wms-inspire/hidrografia?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetStyles&LAYERS=HY.PhysicalWaters.Waterbodies): relleno `#AED1FF` y etiqueta con el atributo `nombre`.
- [Unidades administrativas (IGN)](https://www.ign.es/wms-inspire/unidades-administrativas?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetStyles&LAYERS=AU.AdministrativeUnit): reglas con `PropertyIsLike`, `And` y `Not` sobre los atributos `nationallevel` y `nameunit` (contorno y etiqueta de comunidades autónomas, provincias y municipios). Es compatible con la colección `administrativeunit` de la [OGC API Features del IGN](https://api-features.ign.es/collections/administrativeunit). Los municipios solo se dibujan por debajo de 1:600.000 y sus etiquetas por debajo de 1:800.000, así que hay que acercarse para verlos. Su estilo por defecto (contorno amarillo claro de 0,3 px) está pensado para ortofotos; sobre un mapa base claro se ven mejor sus estilos `ua-comparador` o `municipios-gris`, que se pueden elegir en el selector de estilo de la capa.

GeoServer sirve estas respuestas con el nombre `geoserver-GetStyles.application` (`Content-Disposition`). El contenido es un SLD válido, pero si se descarga desde la URL hay que renombrar el fichero con la extensión `.sld` para elegirlo con el botón SLD. El selector «Descargar un .sld» del entorno de pruebas ya los descarga con ese nombre.

## Estilos de QGIS (.qml)

No se cargan ficheros `.qml` (formato propio de QGIS). Los estilos de QGIS se pueden usar exportándolos como SLD desde QGIS y cargándolos con la herramienta `sld`. Para admitir `.qml` haría falta un lector de su XML (`renderer-v2` de tipo `singleSymbol`, `categorizedSymbol`, `graduatedSymbol` y `RuleRenderer`, capas de símbolo `SimpleFill`, `SimpleLine`, `SimpleMarker`, `SvgMarker`..., etiquetado y unidades en milímetros) que genere los mismos estilos de IDEE (`Generic`, `Category`, `Choropleth`); se añadiría como otra fuente de estilos de la capa, igual que los SLD, sin cambiar el selector ni la aplicación de los estilos.

## Compatibilidad 2D (OpenLayers) y 3D (Cesium)

La configuración es la misma en las dos implementaciones: el plugin solo usa la fachada de IDEE y cada implementación aplica los estilos con sus propios mecanismos.

| Estilo | 2D | 3D |
|---|---|---|
| Estilos WMS | ✔️ | ✔️ |
| `Generic` en capas vectoriales y estilos de SLD | ✔️ | ✔️ con las limitaciones de abajo |
| `Category`, `Choropleth` y demás estilos vectoriales serializados | ✔️ | ✔️ (`Heatmap`, `FlowLine` y `Chart` no existen en Cesium y se descartan con un aviso) |
| `IDEE.style.Raster` en GeoTIFF | ✔️ | ✔️ (rampa, paradas, fórmulas, bandas, valor sin datos y filtros de color calculados píxel a píxel) |

En 3D, el selector y el aviso de la carga de SLD indican las propiedades del estilo que el mapa no puede representar (método `IDEE.layer.Vector#getUnsupportedStyleProperties(style)`); el estilo se aplica igualmente con el resto de propiedades y se ve completo al volver a 2D:

- Entidades (GeoJSON, KML, WFS, OGC API Features...): `stroke.linedash`, `stroke.linecap`, `stroke.linejoin`, `stroke.miterlimit`, `stroke.pattern`, `label.rotate`, `label.rotation`, `label.overflow`, `label.path`, `label.smooth`, trazos de etiqueta discontinuos y líneas con `stroke` y `fill` a la vez (Cesium dibuja solo una).
- El contorno de los polígonos pegados al terreno, que Cesium no dibuja, se dibuja como una línea pegada al terreno con el color y el grosor del estilo (solo el anillo exterior, no los huecos).
- Los estilos con valores calculados por funciones (como los de los SLD con filtros o escalas) se vuelven a calcular al terminar de mover la cámara.
- Teselas vectoriales (MVT, MBTilesVector): iconos, etiquetas, patrones, `stroke.miterlimit`, `line.fill` y estilos por categorías.
- El radio de los puntos se aplica como tamaño en píxeles (`pixelSize`), por lo que en 3D se ven más pequeños que en 2D.

## Ejemplos locales

En `test/styles/` hay un ejemplo propio sin dependencias externas:

- `zonas.geojson` (polígonos con los atributos `nombre`, `tipo` y `area`) y `rutas.geojson` (líneas y puntos).
- `masas-agua.geojson`: masas de agua de ejemplo con los atributos `nombre` y `area`, los que usa el SLD de masas de agua de IDEE.
- `precharged-styles.json`: dos servicios GeoJSON con URL relativas, cada uno con sus estilos (las zonas incluyen un estilo serializado y otro con trazo discontinuo, que en 3D muestra el aviso de propiedades no representables).

Para probarlo en `test/dev.html` (`npm start` para 2D o `npm run start:cesium` para 3D):

1. En «Servicios precargados», elegir «Estilos por capa: ejemplo local (zonas y rutas, 2D/3D)».
2. Abrir el plugin, pulsar «Añadir», abrir el listado de servicios y elegir «Zonas de ejemplo» (y «Rutas de ejemplo» para comprobar que los estilos de cada capa son independientes).
3. Pulsar el botón de estilo de la capa, elegir otro estilo y pulsar «Cambiar»; se puede volver a cualquiera de ellos.
4. Para el SLD, descargar un SLD con el selector «Descargar un .sld» (se guarda como `idee-masas-de-agua.sld` o `ign-unidades-administrativas.sld`) y cargarlo con el botón SLD de una capa de «Añadir capa de ejemplo…»:
   - «Masas de agua (GeoJSON local, para el SLD de IDEE)» con `idee-masas-de-agua.sld`: relleno `#AED1FF` y nombre de cada masa de agua.
   - «Municipios del IGN (OGC API Features, para el SLD del IGN)» con `ign-unidades-administrativas.sld`: municipios reales del entorno de Madrid con el contorno y la etiqueta del estilo del IGN.
   - «Zonas (GeoJSON local, estilos y SLD)» admite cualquiera de los dos para probar los avisos.

La opción «Estilos por capa: WMS IGN» carga el contrato `layers` con el servicio real de unidades administrativas del IGN. Las pruebas automáticas están en `test/playwright/common/layerswitcher-styles.js` y `layerswitcher-sld.js` (se ejecutan en 2D y 3D).


# API-REST

```javascript
https://componentes.idee.es/api-idee/?layerswitcher=position*collapsed*collapsible*tooltip*isDraggable*isMoveLayers*modeSelectLayers*tools*http*https*showCatalog`;
```

<table>
  <tr>
    <td>Parámetros</td>
    <td>Opciones/Descripción</td>
    <td>Disponibilidad</td>
  </tr>
  <tr>
    <td>position</td>
    <td>RIGHT/LEFT</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>collapsed</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>collapsible</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>order</td>
    <td>Número entero positivo</td>
    <td>Base64 ✔️  | Separador ✔️ </td>
  </tr>
  <tr>
    <td>tooltip</td>
    <td>tooltip</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>isDraggable</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
  <tr>
    <td>precharged</td>
    <td>Objeto JSON o URL string</td>
    <td>Base64 ✔️ | Separador ✔️ (solo URL)</td>
  </tr>
  <tr>
    <td>isMoveLayers</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>modeSelectLayers</td>
    <td>eyes/radio</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>tools</td>
    <td>['transparency', 'legend', 'zoom', 'information', 'style', 'sld', 'delete']</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>http</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>https</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>showCatalog</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>useProxy</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>displayLabel</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>addLayers</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>statusLayers</td>
    <td>true/false</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
</table>

### Ejemplo de uso API-REST
```
https://componentes.idee.es/api-idee?layerswitcher=TR*true*true*layerswitcher*true*true*eyes*zoom,legend*true*true*false*true*true*true
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);
```

Ejemplo de constructor del plugin:
```
     {
           collapsed: false,
           position: 'right',
           order: 1,
           tooltip: 'Gestor de capas',
           collapsible: true,
           isDraggable: true,
           modeSelectLayers: 'eyes',
           tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'sld', 'delete'],
           isMoveLayers: true,
           https: true,
           http: true,
           showCatalog: false,
       }
```
```
https://componentes.idee.es/api-idee?layerswitcher=base64=eyJjb2xsYXBzZWQiOmZhbHNlLCJwb3NpdGlvbiI6IlRMIiwidG9vbHRpcCI6IkNhcGFzIiwiY29sbGFwc2libGUiOnRydWUsImlzRHJhZ2dhYmxlIjp0cnVlLCJtb2RlU2VsZWN0TGF5ZXJzIjoiZXllcyIsInRvb2xzIjpbInRyYW5zcGFyZW5jeSIsImxlZ2VuZCIsInpvb20iLCJpbmZvcm1hdGlvbiIsInN0eWxlIiwiZGVsZXRlIl0sImlzTW92ZUxheWVycyI6dHJ1ZSwiaHR0cHMiOnRydWUsImh0dHAiOnRydWUsImNvZHNpIjpmYWxzZX0=
```


# Ejemplo de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new IDEE.plugin.Layerswitcher({
  collapsed: false,
  position: 'left',
  order: 1,
  tooltip: 'Gestor de capas',
  collapsible: true,
  isDraggable: true,
  modeSelectLayers: 'eyes',
  tools: ['transparency', 'legend', 'zoom', 'information', 'style', 'sld', 'delete'],
  isMoveLayers: true,
  https: true,
  http: true,
  showCatalog: false,
  displayLabel: true,
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

La página de pruebas (`test/dev.html`) usa el núcleo compilado en local, así que antes hay que compilarlo una vez desde `api-idee-js`:

```bash
npm run build:ol-core
```

El servidor de desarrollo reenvía `/data-idee-api` al servicio DataIDEE de pruebas (configurable con la variable de entorno `DATAIDEE_PROXY_TARGET`). Así se puede probar aunque el servicio no permita CORS, introduciendo en el buscador `http://localhost:6123/data-idee-api/collections`.

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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=layerswitcher)