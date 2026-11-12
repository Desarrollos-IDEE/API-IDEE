# GeoPackage: fuente de datos, estrategias de carga y lectura por rangos

Documentación técnica interna del requisito «Fuente de datos IDEE.layer.GeoPackage» (PPT TEUNESCO, apdo. 2.2.5). El contrato público está en el JSDoc de `IDEE.layer.GeoPackage` (`api-idee-js/src/facade/js/layer/GeoPackage.js`).

## Qué es

`IDEE.layer.GeoPackage` es una **capa compuesta** y a la vez una **fuente de datos**:

- **Capa compuesta.** Crea una capa hija por tabla (`IDEE.layer.GeoJSON` para las vectoriales, `IDEE.layer.GeoPackageTile` para las de teselas). Además ofrece la API común de las capas: visibilidad, opacidad, z-index, extensión, zoom, recarga y cadena REST.
- **Fuente de datos.** Lee el fichero `.gpkg` en el navegador y entrega un proveedor por tabla.

`layer/GeoPackage.js` y `connector/GeoPackageConnector.js` solo orquestan, y conservan su API `@api`. El resto vive en `api-idee-js/src/facade/js/datasource/`:

```
datasource/
├─ contracts.js        contratos abstractos (sin dependencias)
├─ range/              HttpRangeSource: lectura de un fichero remoto por rangos HTTP
├─ sqlite/             SqliteReader y RTreeIndex: lectura del formato SQLite y de su índice R*Tree
├─ strategy/           FullLoadStrategy y BBoxLoadStrategy: carga de una tabla vectorial
└─ geopackage/         todo lo específico de GeoPackage:
                       - capa: parameters, tableOptions, LayerFactory, RefreshCoordinator,
                         Serializer, strategies
                       - modo descarga: sourceReaders, Database, MetadataReader,
                         CurveLinearizer, ProviderFactory, DownloadAccess
                       - modo rangos: RangeAccess, RangeGeoPackage, RangeVectorProvider,
                         RangeTileProvider, errors
```

## Flujo

1. `normalizeParameters` admite la firma histórica `(fichero, opcionesPorTabla)` y la nueva `({ url | source, name, legend, … }, opciones)`, y copia la configuración sin modificar la del llamador. `resolveTableOptions` combina después las opciones comunes con las de cada tabla.
2. Según `loadStrategy`, `strategies.js` elige el **acceso** al paquete (`DownloadAccess` o `RangeAccess`) y la **carga** de cada tabla vectorial (`FullLoadStrategy` o `BBoxLoadStrategy`).
3. El acceso crea un lector (`PackageReader`) que entrega proveedores y metadatos: `GeoPackageConnector` en modo descarga, `RangeGeoPackage` en modo rangos.
4. `LayerFactory` crea las capas hijas con la colección inicial y los cargadores de la estrategia (`bboxLoader`, `fullLoader`, `refreshLoader`).
5. `RefreshCoordinator` comparte una sola lectura del paquete entre las tablas que se recargan a la vez y libera los lectores que ya no se usan.
6. `Serializer` genera `toJSON()` y `getRestLayer()`.

## Contratos (`datasource/contracts.js`)

| Contrato | Implementaciones |
|---|---|
| `ByteSource` | `HttpRangeSource` |
| `SourceReader` | `UrlSourceReader`, `ResponseSourceReader`, `FileSourceReader` |
| `PackageDatabase` | `GeoPackageDatabase` (sql.js + @ngageoint/geopackage) |
| `GeometryLinearizer` | `CurveLinearizer` (GDAL inyectado) |
| `PackageReader` | `GeoPackageConnector`, `RangeGeoPackage`, `RangePackageReader` |
| `PackageAccess` | `DownloadAccess`, `RangeAccess` |
| `LoadStrategy` | `FullLoadStrategy`, `BBoxLoadStrategy` |
| `LayerSerializer` | `GeoPackageSerializer` |

Además se documentan como `@typedef` las interfaces pequeñas del contenedor: `Refreshable`, `LayerDisplay`, `ExtentProvider`, `RestSerializable` y `VectorDataProvider`. Los contratos no importan bibliotecas de terceros ni código de `impl/`. Las dependencias volátiles (sql.js, @ngageoint, gdal3.js, `fetch`, las clases de capa) se inyectan por constructor con valores por defecto, así que los colaboradores se prueban en Node con dobles.

## Estrategias de carga

| `loadStrategy` | Acceso al paquete | Carga de las tablas vectoriales |
|---|---|---|
| `full` (por defecto) | Descarga completa | Todas las entidades |
| `bbox` (equivale a `tiled: true`) | Descarga completa | Entidades de la extensión visible |
| `range` | Rangos HTTP, con reserva | Entidades de la extensión visible |

- Un valor booleano de `tiled` en una tabla prevalece para esa tabla. Por ejemplo, `tiled: false` en una tabla de un paquete `range` la carga entera recorriendo solo sus páginas.
- Para añadir una estrategia basta con registrarla en `LoadStrategyRegistry`, sin tocar las demás ni `GeoPackage`.
- OpenLayers y Cesium cargan por extensión igual. Cesium escucha `camera.moveEnd` y los cambios de tamaño, y pide el rectángulo visible en grados, partido en dos si cruza el antimeridiano. Las entidades se acumulan sin duplicados y una recarga pide de nuevo la extensión visible.
- En modo descarga, si el fichero tiene índice R*Tree (`gpkg_rtree_index`, el valor por defecto de GDAL), la consulta por extensión lo lee desde sus tablas de nodos. sql.js no incluye el módulo `rtree`, y antes se recorrían todas las filas para crear un índice propio.

## Lectura por rangos (`loadStrategy: 'range'`)

Se eligió leer por rangos HTTP las partes necesarias del propio `.gpkg` con un lector propio, sin dependencias nuevas, frente a un servicio en servidor por BBOX o a mejorar solo el filtrado en cliente.

1. **Primera petición.** `Range: bytes=0-4095` comprueba que el servidor admite rangos y lee la cabecera SQLite.
2. **Esquema.** Se leen `sqlite_schema` y las tablas `gpkg_contents`, `gpkg_geometry_columns`, `gpkg_spatial_ref_sys`, `gpkg_extensions`, `gpkg_tile_matrix(_set)`, `gpkg_ogr_contents` y `gpkg_metadata*`.
3. **Extensión visible.** Se transforma a la SRS de la tabla (con las proyecciones de @ngageoint) y se busca en el R*Tree, un nivel por petición. Solo se piden las filas que intersecan, con búsquedas por rowid que siguen únicamente las ramas necesarias.
4. **Teselas.** Si la matriz está alineada con WebMercator, cada tesela XYZ se localiza en el índice único `(zoom_level, tile_column, tile_row)` y se lee solo su fila.

`HttpRangeSource` pide bloques de 4 KiB (la página SQLite más habitual; configurable con `rangeBlockSize`). Reúne las lecturas simultáneas y agrupa en una misma petición los bloques contiguos o separados por un bloque. Además guarda hasta 1024 bloques en memoria.

**Medida de referencia (test automático).** Con un GeoPackage de GDAL de 7,8 MB (20 301 puntos) y una vista de unos 3,5° × 2°, se leyeron 462 KB (5,9 %) en 63 peticiones. El test exige menos del 10 %.

**Reservas.** En estos casos se descarga el fichero completo y se avisa por consola con un mensaje i18n:

- El servidor responde 200 en lugar de 206. Se usa ese mismo cuerpo, sin una segunda descarga.
- Hay error de red o de CORS en la petición con `Range`.
- El fichero no es SQLite, no tiene `gpkg_contents` o usa una codificación distinta de UTF-8.
- Hay tablas con geometrías curvas, que necesitan GDAL y el fichero completo.
- Hay tablas de teselas cuya matriz no está alineada con WebMercator.

Los errores HTTP (por ejemplo, 404) no se ocultan con la descarga.

**Límites defensivos.** Se valida la cabecera y el tamaño de página, el tipo y los límites de cada página, y la profundidad de los B-tree y del R*Tree. También se detectan los ciclos en B-tree, R*Tree y cadenas de desbordamiento, y se limitan las páginas visitadas por operación. Opcionalmente se puede fijar un tamaño máximo de bytes recibidos.

### Requisitos del servidor

- Respuestas `206 Partial Content` a `Range: bytes=a-b` (`Accept-Ranges: bytes`).
- Si el fichero está en otro origen: CORS con `Access-Control-Allow-Origin` y `Range` en `Access-Control-Allow-Headers`. Es recomendable exponer `Content-Range` y `Content-Length`.
- Sin `Content-Encoding` (gzip) en las respuestas por rangos.
- Que el `.gpkg` tenga índice R*Tree. Sin él, la tabla se recorre por rangos entera, aunque solo sus páginas.

## API del contenedor

`GeoPackage` sigue extendiendo `IDEE.Object` y solo implementa estas interfaces:

| Método | Comportamiento |
|---|---|
| `setVisible` / `isVisible` | Actúa sobre todas las hijas y emite `LAYER_VISIBILITY_CHANGE`. Es visible si lo es alguna hija |
| `setOpacity` / `getOpacity` | Valor propio (por defecto, el de las opciones o 1), propagado a las hijas |
| `setZIndex` / `getZIndex` | Valores consecutivos desde el del paquete, manteniendo el orden relativo. Devuelve el menor |
| `getMaxExtent` / `calculateMaxExtent` | Unión de las extensiones de las hijas, en versión síncrona y tras `whenReady()` |
| `setMinZoom` / `setMaxZoom` (y getters) | Delegan en las hijas y recurren a las opciones del paquete |
| `refresh()` | Devuelve `Promise<void>`: una sola descarga para todas las tablas. Rechaza si una tabla ya no existe y no hace nada con fuentes binarias |
| `updateRefreshInterval(ms)` | Cambia el intervalo de las hijas, también el de las que se creen después |

Los valores asignados antes de crear las capas se aplican al crearlas.

## API-REST

- **Formato posicional** (como MBTiles): `GeoPackage*leyenda*url*nombre*loadStrategy`. Los campos vacíos se omiten.
- **Formato con nombre**: `GeoPackage*url=…;name=…;legend=…;options=base64~…`. Es el que genera `getRestLayer()` y conserva el estado y los estilos de cada tabla, `tableNames` y `loadStrategy`.
- `IDEE.Layer.getRestLayers(capas)` agrupa las tablas de un mismo paquete en una sola cadena. Lo usan ShareMap y `LayerGroup.getRestLayer()`, de modo que un paquete de N tablas ya no se comparte como N cadenas ni se descarga N veces al reabrir la URL.
- `api-idee-rest` reenvía la cadena sin interpretarla. Un `options={…}` en JSON escrito a mano se corta en las comas en el servidor, así que hay que usar `base64~` o `deflate~`, como hace `getRestLayer()`.

## Diferencias entre OpenLayers y Cesium

- En Cesium, `IDEE.layer.GeoJSON` descarta el `maxExtent` del usuario al añadirse al mapa (`impl/cesium/js/layer/GeoJSON.js`). El paquete devuelve lo que devuelven sus hijas.
- `IDEE.style.Proportional` no tiene implementación específica en ningún motor. Se aplica desde la fachada en ambos.

## Limitaciones conocidas

- En modo `range`:
  - `toGeoJSON()` devuelve las entidades ya cargadas en las capas (en EPSG:4326), en lugar de leer las tablas completas;
  - `count` de los metadatos sale de `gpkg_ogr_contents`, y es `null` si no existe;
  - los tipos de columna son los declarados en el `CREATE TABLE`.
- Las recargas por rangos vuelven a leer el esquema del fichero (unos pocos KB). No se reutiliza el contador de cambios de la cabecera.
- VectorsManagement trata las tablas cargadas por extensión como completas: los análisis usan las entidades cargadas.

## Almacenamiento y privacidad

- SQLite es solo el **formato del fichero** `.gpkg` (estándar OGC GeoPackage). La API no tiene, no crea y no consulta ninguna base de datos de clientes.
- El `.gpkg` lo aporta quien integra el visor (URL o fichero local) y se lee en la memoria de la pestaña del usuario. No se usa `localStorage`, IndexedDB ni Cache API, y no se envía nada a ningún servidor: solo hay peticiones GET, con `Range` en el modo `range`.
- La memoria se libera al quitar la capa (`dispose`). `api-idee-rest` solo reenvía la cadena `?layers=`.
- sql.js (SQLite compilado a WebAssembly) ya se usaba para GeoPackage y MBTiles.
- En modo descarga sin índice R*Tree, @ngageoint crea su índice en la copia en memoria y nunca lo persiste. Con R*Tree no se escribe nada.

## Pruebas

- **Unitarias en Node** (specs Playwright sin navegador, `test/playwright/ol/PLAY-14-GeoPackage-unit-*.spec.js`): contratos, parámetros, serializador, factoría, recargas, orígenes, lectura, estrategias, rangos, SQLite, R*Tree, paquete por rangos y acceso por rangos. Los paquetes con R*Tree real se generan con gdal3.js en Node durante la prueba (`createGdalGeoPackage` en `test/playwright/ol/fixtures/geopackage.js`); no hay binarios en el repositorio.
- **Comunes a OL y Cesium** (`test/playwright/common/geopackage-*.js`, registradas en `ol/PLAY-14-GeoPackage-*.spec.js` y `cesium/PLAY-13-GeoPackage.spec.js`): API del contenedor, carga por extensión, lectura por rangos con recuento de peticiones y bytes, estilos en la configuración JSON y API-REST.
- **Plugins**: ShareMap (`PLAY-02`), StyleManager (`PLAY-02`), VectorsManagement (`PLAY-03`) y LayerSwitcher (`PLAY-14-GeoPackage-layerswitcher*.spec.js`).
- **api-idee-rest**: `src/test/java/es/api_idee/parameter/parser/ParametersParserGeoPackageTest.java`.

## Métricas de estabilidad (SAP)

Se calculan sobre los `import` reales. Ce es el número de módulos importados (internos y de terceros), Ca el de módulos de `src` que lo importan, I = Ce/(Ca+Ce), A la proporción de clases abstractas y D = |A + I − 1|.

| Módulo | Ce | Ca | I | A | D |
|---|---|---|---|---|---|
| contracts | 0 | 11 | 0,00 | 1 | 0,00 |
| geopackage/parameters | 0 | 4 | 0,00 | 0 | 1,00 |
| geopackage/tableOptions | 1 | 1 | 0,50 | 0 | 0,50 |
| geopackage/Serializer | 2 | 1 | 0,67 | 0 | 0,33 |
| geopackage/LayerFactory | 1 | 1 | 0,50 | 0 | 0,50 |
| geopackage/RefreshCoordinator | 0 | 1 | 0,00 | 0 | 1,00 |
| geopackage/sourceReaders | 3 | 1 | 0,75 | 0 | 0,25 |
| geopackage/Database | 3 | 1 | 0,75 | 0 | 0,25 |
| geopackage/CurveLinearizer | 1 | 1 | 0,50 | 0 | 0,50 |
| geopackage/MetadataReader | 1 | 1 | 0,50 | 0 | 0,50 |
| geopackage/ProviderFactory | 0 | 1 | 0,00 | 0 | 1,00 |
| strategy/FullLoadStrategy | 1 | 1 | 0,50 | 0 | 0,50 |
| strategy/BBoxLoadStrategy | 1 | 1 | 0,50 | 0 | 0,50 |
| geopackage/strategies | 4 | 1 | 0,80 | 0 | 0,20 |
| geopackage/DownloadAccess | 2 | 2 | 0,50 | 0 | 0,50 |
| geopackage/RangeAccess | 7 | 1 | 0,88 | 0 | 0,12 |
| geopackage/errors | 0 | 3 | 0,00 | 0 | 1,00 |
| range/HttpRangeSource | 3 | 1 | 0,75 | 0 | 0,25 |
| sqlite/SqliteReader | 0 | 4 | 0,00 | 0 | 1,00 |
| sqlite/RTreeIndex | 1 | 2 | 0,33 | 0 | 0,67 |
| geopackage/RangeGeoPackage | 7 | 1 | 0,88 | 0 | 0,12 |
| geopackage/RangeVectorProvider | 5 | 1 | 0,83 | 0 | 0,17 |
| geopackage/RangeTileProvider | 2 | 1 | 0,67 | 0 | 0,33 |
| layer/GeoPackage (antes → después) | 12 → 17 | 3 | 0,80 → 0,85 | 0 | 0,20 → 0,15 |
| connector/GeoPackageConnector (antes → después) | 7 → 9 | 3 | 0,70 → 0,75 | 0 | 0,30 → 0,25 |
| provider/VectorProvider | 5 | 3 | 0,62 | 0 | 0,38 |

**Módulos con D > 0,5.**

- `parameters`, `SqliteReader`, `RTreeIndex` y `errors` son funciones puras o tipos de error sobre formatos congelados (SQLite file format 3, nodo R*Tree, GeoPackage 1.x). Son concretos y estables pero no volátiles, la excepción que admite el propio Martin.
- `RefreshCoordinator` y `ProviderFactory` tienen Ce = 0 porque reciben sus dependencias volátiles por constructor (fábrica de lectores y clases de proveedor). La métrica los sitúa como estables y concretos, pero su motivo de cambio está fuera, en lo inyectado.
- Abstraer cualquiera de ellos añadiría indirección sin reducir el riesgo de cambio.

**Orquestadores.** `GeoPackage` y `GeoPackageConnector` son inestables (I ≈ 0,8) y concretos, y quedan cerca de la secuencia principal. Las dependencias volátiles (sql.js, @ngageoint, gdal3.js) ya no las usa el conector directamente: están en las hojas `Database`, `MetadataReader`, proveedores y `CurveLinearizer` (GDAL inyectado).
