CP-001
Mapa básico con todas las capas vectoriales, con pruebas de funciones.

CP-002
Mapa básico con todas las capas Rasters, con pruebas de funciones.

CP-003
Mapa básico con OSM.

CP-004
Mapa básico con capas genéricas.

CP-005
Mapa básico con capas TMS.

CP-006
Mapa básico con capas WMTS.

CP-007
Mapa básico con capas WFS.

CP-008
Mapa básico con capas WMS.

CP-009
Mapa básico con capas KML.

CP-010
Mapa básico con capas XYZ.

CP-011
Mapa básico para testear parámetro isBase y transparent.

CP-012
Mapa básico para testear parámetro extent a las capas.

CP-013
Mapa básico con capas MVT.

CP-014
Mapa básico con capas MBTiles.

CP-015
Mapa básico con capas OGCAPIFeatures.

CP-016
Pruebas de la función "toGeoJSON" de las capas y pruebas de la función "getGeoJSON" de los features de estas capas.

CP-017
WMS_FULL, capas wms sin nombre

CP-018
Mapa básico con capas MapLibre.

CP-019
Mapa básico con pruebas en todas las capas de parámetros de minZoom, maxZoom y tileGridMaxZoom.

CP-020
Mapa básico con capas GeoTiff (COG).

CP-021
Mapa básico con capas LayerGroup.

CP-022
Mapa básico con capa GeoJSON y WFS, para probar select/unselect de features múltiples.

CP-023
Mapa básico con Capas rápidas.

CP-024
Mapa básico con secciones.

CP-025
Mapa básico con Capas WMC y una WMS.

CP-026
Mapa básico con capa GeoPackage.

CP-027
Pruebas de refreshInterval por tipo de capa, con OpenLayers o Cesium.
Elegir el tipo, con/sin intervalo y alta addLayers/específica. Comprobar peticiones
nuevas en Red (_ideeRefresh), retirar, reinsertar y destruir. En vectores remotos,
editar un atributo debe pausar la recarga; descartar y reanudar permite continuar.
Vector local conserva sus datos y no descarga nada. Las imágenes de prueba son fijas.

CP-028
Intervalo del mapa con WMS, GeoJSON y XYZ: el valor válido del mapa sobrescribe
el de las capas, también en altas posteriores y grupos OL. Actualizarlo cambia las
capas actuales; 0 o sin intervalo las desactiva. Retirar conserva el último valor
configurado de esa instancia. Los grupos no transmiten su intervalo; OverviewMap se excluye.

Desde api-idee-js, iniciar los datos sintéticos en una terminal:

~~~sh
python3 test/development/CP-0002-layers/servidor-autorefresco.py --port 8083
~~~

En otra terminal iniciar un caso (cambiar CP-027 por CP-028 para el segundo):

~~~sh
npm start -- --name=CP-0002-layers/CP-027 --port 8082 --no-open
~~~

Abrir http://localhost:8082/test/development/CP-0002-layers/CP-027.html.
Para Cesium usar npm run start:cesium en lugar de npm start. Si se ejecutan en
paralelo, asignar otro puerto al segundo (por ejemplo 8084) y cambiar la URL.
El propio caso indica el motor; solo ofrece los tipos compatibles.

Pruebas automáticas, con los bundles del núcleo generados y el servidor de datos activo:

~~~sh
npm run test:playwright-ol -- PLAY-wms-autorefresh.spec.js PLAY-layer-autorefresh.spec.js
npm run test:playwright-cesium -- PLAY-wms-autorefresh.spec.js PLAY-layer-autorefresh.spec.js
~~~
