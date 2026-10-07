CP-032
Pruebas de refreshInterval por tipo de capa, con OpenLayers o Cesium.
Elegir el tipo, con/sin intervalo y alta addLayers/específica. Comprobar peticiones
nuevas en Red (_ideeRefresh), retirar, reinsertar y destruir. En vectores remotos,
editar un atributo debe pausar la recarga; descartar y reanudar permite continuar.
Vector local conserva sus datos y no descarga nada. Las imágenes de prueba son fijas.

CP-033
Intervalo del mapa con WMS, GeoJSON, KMZ y XYZ: el valor válido del mapa sobrescribe
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

CP-034: KMZ y refresco (OpenLayers y Cesium)
-----------------------------------------

1. Construir el núcleo con `npm run build:core` desde `api-idee-js`.
2. Iniciar el servidor de datos del comando anterior en el puerto 8083.
3. Servir la raíz del worktree por HTTP, por ejemplo
   `python3 -m http.server 8086 --bind 127.0.0.1` desde `.worktrees/kmz`.
   Si ya existe ese servidor, conservarlo.
4. Abrir
   http://localhost:8086/api-idee-js/test/development/CP-0002-layers/CP-034.html?engine=ol.
   Repetir con `engine=cesium`.
5. Marcar «Refresco automático», indicar 2000 ms y pulsar «Cargar KMZ cambiante».
   Debe aparecer un objeto cuyo nombre numérico cambia aproximadamente cada 2 s.
   En Red, filtrar `puntos.kmz`: las recargas llevan `_ideeRefresh`.
6. Cambiar a 5000 ms y pulsar «Aplicar intervalo a la capa»: comprobar la nueva cadencia.
   Desmarcar el refresco y aplicar: deben cesar las recargas.
7. Eliminar la capa: no deben continuar sus peticiones. Volver a cargar permite repetir.
8. Cargar un ejemplo fijo por HTTP con intervalo: se vuelve a descargar, pero sus
   objetos no cambian. Importar un archivo con el selector local carga una copia:
   no vigila el archivo del disco ni se actualiza al editarlo externamente.

En CP-032 seleccionar KMZ y probar las dos rutas (addLayers/addKMZ), sin intervalo,
con intervalo, retirar/reinsertar, editar y descartar/reanudar.
En CP-033 comprobar el intervalo efectivo de «KMZ propia» y usar «Añadir KMZ
posterior» para verificar que también hereda el intervalo del mapa.
