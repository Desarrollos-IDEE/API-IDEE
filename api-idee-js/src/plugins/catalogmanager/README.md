<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Catalogmanager</small></h1>

# Descripción

Plugin que permite la gestión de catálogos STAC.

**Funcionalidades:**
- Añadir un catálogo mediante url.
- Listar las colecciones de un catálogo.
- Listar los elementos de una colección
- Realizar filtros básicos sobre los elementos de las colecciones (extensión y fecha)
- Realizar filtros avanzados sobre las propiedades queryables de los elementos de una colección.
- Ver la información de un elemento
- Ver en el mapa la huella de una colección
- Ver en el mapa la imagen tif asociada a un elemento
- Descarga individual de la imagen tif asociada a un elemento. Solo habilitado para catálogos privados autenticados.
- Descarga masiva de las imágenes de una colección completa, elementos seleccionados o imagenes seleccionadas. Solo habilitado para catálogo de GNEIS


# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:

Para uso de implementación OpenLayers:
- **catalogmanager.ol.min.js**
- **catalogmanager.ol.min.css**

Para uso de implementación Cesium:
- **catalogmanager.cesium.min.js**
- **catalogmanager.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/catalogmanager/catalogmanager.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/catalogmanager/catalogmanager.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/catalogmanager/catalogmanager-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/catalogmanager/catalogmanager-1.0.0.ol.min.js"></script>
```

# Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda.
  - 'TR': (top right) - Arriba a la derecha (por defecto).
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsed**: Indica si el plugin viene colapsado de entrada (true/false). Por defecto: true.
- **collapsible**: Indica si el plugin puede abrirse y cerrarse (true) o si permanece siempre abierto (false). Por defecto: true.
- **tooltip**. Información emergente para mostrar en el tooltip del plugin (se muestra al dejar el ratón encima del plugin como información). Por defecto: 'Plantilla plugin'
- **draggable**. Indica si el plugin puede arrastrarse.
- **predefinedCatalogs**. Lista de propiedades de catalogos predefinidos que se cargarán por defecto.
- **addCatalogEnabled**. Indica si se podrán añadir catalogos desde la interfaz. Por defecto false.
- **downloadUrl**. Url del servicio de descarga masiva.

# API-REST

```javascript
URL_API?catalogmanager=position*collapsed*collapsible*tooltip*draggable
```

<table>
  <tr>
    <th>Parámetros</th>
    <th>Opciones/Descripción</th>
    <th>Disponibilidad</th>
  </tr>
  <tr>
    <td>position</td>
    <td>TR/TL/BR/BL</td>
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
    <td>tooltip</td>
    <td>Valor a usar para mostrar en el tooltip del plugin</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
</table>


### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee/?catalogmanager=TR*true*true*GestorCatalogos
```

```
https://componentes.idee.es/api-idee/?catalogmanager=TR*true*true
```

### Ejemplos de uso API-REST en base64

Ejemplo del constructor:
```javascript
{
  position:"TL",
  tooltip:"Gestor de catálogos"
}
```
```
https://componentes.idee.es/api-idee/?catalogmanager=base64=eyJwb3NpdGlvbiI6IlRMIiwiZGVzY2FyZ2FzY25pZyI6Imh0dHA6Ly9jZW50cm9kZWRlc2Nhcmdhcy5jbmlnLmVzL0NlbnRyb0Rlc2Nhcmdhcy9pbmRleC5qc3AiLCJwbm9hIjoiaHR0cHM6Ly93d3cuaWduLmVzL3dlYi9jb21wYXJhZG9yX3Bub2EvaW5kZXguaHRtbCIsInZpc3VhbGl6YWRvcjNkIjoiaHR0cHM6Ly93d3cuaWduLmVzLzNELVN0ZXJlby8iLCJmb3RvdGVjYSI6Imh0dHBzOi8vZm90b3RlY2EuY25pZy5lcy8iLCJ0d2l0dGVyIjoiaHR0cHM6Ly90d2l0dGVyLmNvbS9JR05TcGFpbiIsImluc3RhZ3JhbSI6Imh0dHBzOi8vd3d3Lmluc3RhZ3JhbS5jb20vaWduc3BhaW4vIiwiZmFjZWJvb2siOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vSUdOU3BhaW4vIiwicGludGVyZXN0IjoiaHR0cHM6Ly93d3cucGludGVyZXN0LmVzL0lHTlNwYWluLyIsInlvdXR1YmUiOiJodHRwczovL3d3dy55b3V0dWJlLmNvbS91c2VyL0lHTlNwYWluIiwibWFpbCI6Im1haWx0bzppZ25AZm9tZW50by5lcyIsInRvb2x0aXAiOiJDb250YWN0YSBjb24gbm9zb3Ryb3MifQ==
```


# Ejemplo de uso

```javascript
const mp = new IDEE.plugin.Catalogmanager({
  position: 'TR',
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

## Tabla de compatibilidad de versiones   
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=catalogmanager)