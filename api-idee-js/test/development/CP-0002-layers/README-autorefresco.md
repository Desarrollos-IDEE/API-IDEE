CP-032
Pruebas de refreshInterval por tipo de capa, con OpenLayers o Cesium.
Elegir el tipo, con/sin intervalo y alta addLayers/específica. Comprobar peticiones
nuevas en Red (_ideeRefresh), retirar, reinsertar y destruir. En vectores remotos,
editar un atributo debe pausar la recarga; descartar y reanudar permite continuar.
Vector local conserva sus datos y no descarga nada. Las imágenes de prueba son fijas.

CP-033
Intervalo del mapa con WMS, GeoJSON y XYZ: el valor válido del mapa sobrescribe
el de las capas, también en altas posteriores y grupos OL. Actualizarlo cambia las
capas actuales; 0 o sin intervalo las desactiva. Retirar conserva el último valor
configurado de esa instancia. Los grupos no transmiten su intervalo; OverviewMap se excluye.

Desde api-idee-js, iniciar los datos sintéticos en una terminal:

~~~sh
python3 test/development/CP-0002-layers/servidor-autorefresco.py --port 8083
~~~

En otra terminal iniciar un caso (cambiar CP-032 por CP-033 para el segundo):

~~~sh
npm start -- --name=CP-0002-layers/CP-032 --port 8082 --no-open
~~~

Abrir http://localhost:8082/test/development/CP-0002-layers/CP-032.html.
Para Cesium usar npm run start:cesium en lugar de npm start. Si se ejecutan en
paralelo, asignar otro puerto al segundo (por ejemplo 8084) y cambiar la URL.
El propio caso indica el motor; solo ofrece los tipos compatibles.

Pruebas automáticas, con los bundles del núcleo generados y el servidor de datos activo:

~~~sh
npm run test:playwright-ol -- PLAY-wms-autorefresh.spec.js PLAY-layer-autorefresh.spec.js
npm run test:playwright-cesium -- PLAY-wms-autorefresh.spec.js PLAY-layer-autorefresh.spec.js
~~~
