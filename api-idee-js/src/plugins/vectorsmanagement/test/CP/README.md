# Casos de prueba de VectorsManagement

Cada caso de prueba se centra en una herramienta del plugin y usa un tipo de capa distinto. Para lanzar un caso:

```bash
npm start -- --name=CP-00X
```

| Caso | Herramienta | Capa |
|---|---|---|
| [CP-001](#cp-001---selección-capa-vector) | Selección (`selection`) | Vector |
| [CP-002](#cp-002---crear-capa-capa-wfs) | Crear capa (`addlayer`) | WFS |
| [CP-003](#cp-003---análisis-capa-geojson) | Análisis (`analysis`) | GeoJSON |
| [CP-004](#cp-004---creación-capa-kml) | Creación (`creation`) | KML |
| [CP-005](#cp-005---descarga-capa-mvt) | Descarga (`download`) | MVT |
| [CP-006](#cp-006---edición-capa-ogcapifeatures) | Edición (`edition`) | OGCAPIFeatures |
| [CP-007](#cp-007---estilos-capa-mbtilesvector) | Estilos (`style`) | MBTilesVector |
| [CP-008](#cp-008---snapping-capa-genericvector) | Snapping (`snapping`) | GenericVector |
| [CP-009](#cp-009---geoprocesos-con-turfjs-capa-geojson) | Geoprocesos con Turf.js (`turf`) | GeoJSON |

# CP-001 - Selección (capa Vector)
La capa contiene un polígono y un punto.

[ ] Funcionalidad seleccionar
- [ ] Seleccionar un elemento con clic
- [ ] Selección múltiple con Ctrl/Cmd + clic
- [ ] Resaltado de los elementos seleccionados
- [ ] Deseleccionar al desactivar la herramienta
- [ ] Cambiar de capa limpia la selección

# CP-002 - Crear capa (capa WFS)
Se cargan también los plugins StyleManager y PrintViewManagement.

[ ] Funcionalidad crear capa
- [ ] Crear una capa vectorial con nombre y leyenda
- [ ] La capa creada aparece en el selector de capas del plugin
- [ ] La capa creada se puede usar en las demás herramientas
- [ ] Convive con StyleManager y PrintViewManagement

# CP-003 - Análisis (capa GeoJSON)
Se cargan también los plugins StyleManager y PrintViewManagement.

[ ] Funcionalidad de análisis
- [ ] Perfil topográfico de una línea
- [ ] Datos de altitud de un punto
- [ ] Área de influencia (metros y kilómetros)
- [ ] Extensión (información del elemento)
- [ ] Ver GeoJSON

# CP-004 - Creación (capa KML)
Se cargan también los plugins StyleManager y PrintViewManagement.

[ ] Funcionalidad creación
- [ ] Creación de puntos
- [ ] Creación de punto coordenadas
- [ ] Creación de línea
- [ ] Creación de polígono
- [ ] Creación de figura (cuadrilátero, círculo, triángulo, pentágono, hexágono)
- [ ] Creación de texto

# CP-005 - Descarga (capa MVT)
Se cargan también los plugins StyleManager y PrintViewManagement.

[ ] Aviso de capa no editable al seleccionar la capa MVT
[ ] Funcionalidad de descarga
- [ ] GeoJSON
- [ ] KML
- [ ] GPX
- [ ] Shapefile

# CP-006 - Edición (capa OGCAPIFeatures)
[ ] Funcionalidad de edición
- [ ] Editar geometría
- [ ] Eliminar vértice con Alt + clic
- [ ] Agujero
- [ ] Rotación
- [ ] Escala
- [ ] Mover
- [ ] Atributos
- [ ] Borrar geometría
- [ ] Limpiar capa

# CP-007 - Estilos (capa MBTilesVector)
[ ] Aviso de capa no editable al seleccionar la capa MBTilesVector
[ ] Funcionalidad de estilos
- [ ] Opciones puntos
- [ ] Opciones líneas
- [ ] Opciones polígonos

# CP-008 - Snapping (capa GenericVector)
Configuración inicial: `{ vertex: true, edge: false, intersection: true, allLayers: true, guides: true, pixelTolerance: 15 }`.

[ ] El panel de snapping muestra la configuración inicial
[ ] Ajuste a vértices
[ ] Sin ajuste a aristas
[ ] Ajuste a intersecciones
[ ] Ajuste a todas las capas visibles
[ ] Guías ortogonales (solo al dibujar líneas, polígonos o agujeros)
[ ] Distancia de enganche de 15 píxeles
[ ] Mantener pulsada Ctrl desactiva el snapping temporalmente
[ ] Snapping en creación y en edición

# CP-009 - Geoprocesos con Turf.js (capa GeoJSON)
La capa contiene dos puntos (P1, P2), una línea (L1) y dos polígonos solapados (A, B). Requiere un núcleo de API-IDEE que publique `window.turf`.

[ ] Panel con las operaciones agrupadas por categoría; todas abren su formulario en el panel sin bloquear el mapa
[ ] Entradas de cada formulario
- [ ] Ámbitos «Todas», «Solo las seleccionadas», «Una entidad seleccionada» (lista de entidades) y «Resultado de una operación anterior»
- [ ] Añadir y quitar capas en una misma entrada
- [ ] Con A y B seleccionados, la primera entrada usa la selección; en relaciones y «Restar polígonos», la primera y la segunda entidad
- [ ] Seleccionar en otra capa con el formulario abierto: el formulario y el resumen de selecciones se actualizan
[ ] Medición
- [ ] Área en distintas unidades: m², hectáreas, acres (toast)
- [ ] Longitud en distintas unidades: millas, pies, grados (toast)
- [ ] Distancia entre P1 y P2 (una entidad seleccionada en cada entrada) en distintas unidades (toast)
- [ ] Extensión bbox (diálogo)
- [ ] Punto sobre la línea (capa con los campos de la línea)
[ ] Centros: centro, centroide, centro de masas y punto en el elemento (capa con los campos de cada elemento)
[ ] Área de influencia (ámbito «Solo las seleccionadas» o «Todas»)
- [ ] Área de influencia (capa con los campos de origen; disuelta, con num_entidades y los campos elegidos combinados)
- [ ] Área de influencia con radio negativo sobre A: el polígono encoge
[ ] Reunir, extraer y excluir
- [ ] Reunir entidades de dos capas: geometrías y campos sin cambios, capa_origen y aviso de tipos mezclados
- [ ] Extraer solo las seleccionadas
- [ ] Excluir la selección de toda la capa
[ ] Transformación
- [ ] Simplificar (capa con los campos de origen)
- [ ] Envolvente convexa sin concavidad y con concavidad 1 (capa con num_entidades)
- [ ] Rectángulo envolvente (capa)
- [ ] Suavizar línea Bézier (capa)
- [ ] Rotar sin punto de giro, con punto de giro y con solo uno de los dos campos (error)
- [ ] Escalar desde el centroide y desde una esquina
- [ ] Desplazar en distintas unidades
[ ] Combinar polígonos con A y B seleccionados, y con polígonos de otra capa
- [ ] Fusionar polígonos (multiparte o una entidad por parte separada), con campos combinados («Valores distintos» y «Valor común»)
- [ ] Parte común de los polígonos
- [ ] Restar polígonos (por defecto, la primera entidad seleccionada menos el resto)
[ ] Relación espacial (toast Sí/No), con entidades de la misma capa y de capas distintas
- [ ] Punto en polígono, con un punto sobre el borde marcando y sin marcar "Ignorar el borde"
- [ ] Intersecan, marcando y sin marcar "Ignorar autointersecciones"
- [ ] Contiene y está dentro (Primera y Segunda entidad)
[ ] Las capas de resultado aparecen en el selector de capas y se pueden usar en otras operaciones
[ ] Ejecutar dos veces la misma operación crea `Turf: <operación> (1)` y `(2)`; otra operación empieza en `(1)`; al borrar la `(2)` y repetir, se vuelve a crear la `(2)`
[ ] Errores
- [ ] Sin selección guardada o capa vacía
- [ ] Número de entidades incorrecto (p. ej. dos entidades en una entrada de una sola)
- [ ] Tipo de geometría incorrecto
- [ ] Operación sin resultado (por ejemplo, parte común sin solape)
- [ ] Botón "Ejecutar" deshabilitado con valores no válidos, con el motivo
