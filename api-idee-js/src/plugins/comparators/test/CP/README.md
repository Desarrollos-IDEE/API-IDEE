**Control windowsyn**
* CP-001 - Parametrización.
    * [X] Se comprueba que si no se declara en el contructor aparecerá con valores por defecto.
    * [X] Se comprueba que con valor a false no se mostrará el control.
    * [X] Se comprueba el parámetro defaultCompareMode (panel abierto por defecto).
    * [X] Se comprueba que se puede modificar el tooltip.
    * [X] Se comprueba en el navegador chrome, firefox y safari.

* CP-002 - Parámetro controls y plugins.
    * [X] Se comprueba que se carga con todos los plugins.
        - [X] viewmanagement.
        - [] timeline.
        - [X] stylemanager.
        - [X] queryattributes.
        - [X] modal.
        - [X] overviewmap.
        - [X] mousesrs.
        - [X] locator.
        - [X] information.
        - [X] infocoordinates.
        - [X] incicarto.
        - [X] contactlink.
        - [X] layerswitcher.
        - [X] backimglayer.
        - [X] sharemap.
    * [X] Se comprueba que se carga con todos los controles.
        - [X] backgroundlayers.
        - [X] getfeatureinfo.
        - [X] location.
        - [X] panzoom.
        - [X] panzoombar.
        - [X] rotate.
        - [X] scale.
        - [X] scaleline.
        - [X] attributions.
    * [FALTA TIMELINE] Se comprueba que funcionan todos correctamente.

* CP-003 - Capas.
    * [X] Se comprueba que se puede compartir todos los tipos de capas Raster.
    * [X] Se comprueba que se puede compartir todos los tipos de capas Vectoriales.

**Pruebas API REST - windowsyn**
- https://mapea-lite.desarrollo.guadaltel.es/api-core/?plugins=comparators

- https://mapea-lite.desarrollo.guadaltel.es/api-core/?comparators=base64=ewogIHBvc2l0aW9uOiAnVEwnLAogIGNvbGxhcHNlZDogZmFsc2UsCiAgY29sbGFwc2libGU6IHRydWUsCiAgaXNEcmFnZ2FibGU6IHRydWUsCiAgdG9vbHRpcDogJ1BsdWdpbiBDb21wYXJhdG9ycycsCiAgZGVmYXVsdENvbXBhcmVNb2RlOiAnbWlycm9yJywKICBsaXN0TGF5ZXJzOiBbCiAgICAnV01TKkxhbmRzYXQgNSBUTSAxOTk2LiBDb2xvciBuYXR1cmFsKmh0dHBzOi8vd21zLXNhdGVsaXRlcy1oaXN0b3JpY29zLmlkZWUuZXMvc2F0ZWxpdGVzLWhpc3Rvcmljb3MqTEFORFNBVDUuMTk5Nl8zMjEtNTQzKnRydWUnLAogICAgJ1dNUypMYW5kc2F0IDUgVE0gMTk5Ni4gRmFsc28gY29sb3IgaW5mcmFycm9qbypodHRwczovL3dtcy1zYXRlbGl0ZXMtaGlzdG9yaWNvcy5pZGVlLmVzL3NhdGVsaXRlcy1oaXN0b3JpY29zKkxBTkRTQVQ1LjE5OTZfNDMyKnRydWUnLAogICAgJ1dNUypMYW5kc2F0IDUgVE0gMTk5MS4gQ29sb3IgbmF0dXJhbCpodHRwczovL3dtcy1zYXRlbGl0ZXMtaGlzdG9yaWNvcy5pZGVlLmVzL3NhdGVsaXRlcy1oaXN0b3JpY29zKkxBTkRTQVQ1LjE5OTFfMzIxLTU0Myp0cnVlJywKICAgICdXTVMqTGFuZHNhdCA1IFRNIDE5OTEuIEZhbHNvIGNvbG9yIGluZnJhcnJvam8qaHR0cHM6Ly93bXMtc2F0ZWxpdGVzLWhpc3Rvcmljb3MuaWRlZS5lcy9zYXRlbGl0ZXMtaGlzdG9yaWNvcypMQU5EU0FUNS4xOTkxXzQzMip0cnVlJywKICAgICdXTVMqTGFuZHNhdCA1IFRNIDE5ODYuIENvbG9yIG5hdHVyYWwqaHR0cHM6Ly93bXMtc2F0ZWxpdGVzLWhpc3Rvcmljb3MuaWRlZS5lcy9zYXRlbGl0ZXMtaGlzdG9yaWNvcypMQU5EU0FUNS4xOTg2XzMyMS01NDMqdHJ1ZScsCiAgXSwKICBlbmFibGVkS2V5RnVuY3Rpb25zOiB0cnVlLAogIGx5cnNNaXJyb3JNaW5aaW5kZXg6IDEwLAogIHRyYW5zcGFyZW5jeVBhcmFtczogewogICAgcmFkaXVzOiAxMDAsCiAgICBtYXhSYWRpdXM6IDEwMCwKICAgIG1pblJhZGl1czogMTAsCiAgICB0b29sdGlwOiAndG9vbHRpcFRyYW5zcGFyZW5jeScsCiAgfSwKICBseXJjb21wYXJlUGFyYW1zOiB7CiAgICBzdGF0aWNEaXZpc2lvbjogMSwKICAgIGRlZmF1bHRMeXJBOiAxLAogICAgZGVmYXVsdEx5ckI6IDIsCiAgICBkZWZhdWx0THlyQzogMywKICAgIGRlZmF1bHRMeXJEOiAwLAogICAgb3BhY2l0eVZhbDogMTAwLAogICAgdG9vbHRpcDogJ3Rvb2x0aXBMeXJDb21wYXJlJywKICAgIGRlZmF1bHRDb21wYXJlVml6OiAxLAogIH0sCiAgbWlycm9ycGFuZWxQYXJhbXM6IHsKICAgIHNob3dDdXJzb3JzOiB0cnVlLAogICAgcHJpbmNpcGFsTWFwOiB0cnVlLAogICAgZW5hYmxlZENvbnRyb2xzUGx1Z2luczogewogICAgICBtYXAyOiB7CiAgICAgICAgY29uc3Ryb2xzOiBbJ3NjYWxlJ10sCiAgICAgICAgRnVsbFRPQzogewogICAgICAgICAgcG9zaXRpb246ICdUTCcsCiAgICAgICAgfSwKICAgICAgfSwKICAgIH0sCiAgICBlbmFibGVkRGlzcGxheUluTGF5ZXJTd2l0Y2hlcjogdHJ1ZSwKICAgIGRlZmF1bHRDb21wYXJlVml6OiAyLAogICAgbW9kZVZpelR5cGVzOiBbMCwgMl0sCiAgICB0b29sdGlwOiAndG9vbHRpcE1pcnJvcicsCiAgfSwKICB3aW5kb3dzeW5jUGFyYW1zOiB7CiAgICBjb250cm9sczogWwogICAgICAnc2NhbGUnLAogICAgICAnYmFja2dyb3VuZGxheWVycycsCiAgICAgICdwYW56b29tYmFyJywKICAgIF0sCiAgICBwbHVnaW5zOiBbCiAgIHsKICBuYW1lOiAnTGF5ZXJzd2l0Y2hlcicsCiAgcGFyYW1zOiB7fSwKfSx7CiAgbmFtZTogJ1NoYXJlTWFwJywKICBwYXJhbXM6IHt9LAp9CiAgICBdLAogIH0sCn0=

**Pruebas Accesibilidad - windowsyn**
- Responsive
    * [X] Movil - Nueva ventana, permite rotación.
    * [X] Tablet - Nueva ventana, permite rotación.
- Tabs y Enter
    * [X] Se comprueba que se puede hacer enter y tabs sobre los botones para abrir y cerrar las ventanas.

CP-004
https://proyectos.cnig.es/issues/7280