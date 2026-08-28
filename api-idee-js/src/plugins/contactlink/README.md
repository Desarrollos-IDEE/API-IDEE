<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.ContactLink</small></h1>

# Descripción

Provee de enlaces a sitios, redes sociales y correo institucionales.

# Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **contactlink.ol.min.js**
- **contactlink.ol.min.css**

Para uso de implementación Cesium:
- **contactlink.cesium.min.js**
- **contactlink.cesium.min.css**


```html
 <link href="https://componentes.idee.es/api-idee/plugins/contactlink/contactlink.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/contactlink/contactlink.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/contactlink/contactlink-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/contactlink/contactlink-1.0.0.ol.min.js"></script>
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
- **descargascnig**: Indica la url al centro de descargas CNIG. Por defecto: 'http://centrodedescargas.cnig.es/CentroDescargas/index.jsp'
- **pnoa**: Indica la url al comparador PNOA. Por defecto: 'https://www.ign.es/web/'comparador_pnoa/index.html
- **visualizador3d**: Indica la url al Visualizador3D. Por defecto: 'https://visualizadores.ign.es/estereoscopico/'
- **fototeca**: Indica la url a Fototeca. Por defecto: 'https://fototeca.cnig.es/'
- **twitter**: Indica la url al Twitter del CNIG. Por defecto: 'https://twitter.com/IGNSpain'
- **instagram**: Indica la url al Instagram del CNIG. Por defecto: 'https://www.instagram.com/ignspain/'
- **facebook**: Indica la url al Facebook del CNIG. Por defecto: 'https://www.facebook.com/IGNSpain/'
- **pinterest**: Indica la url al Pinterest del CNIG. Por defecto: 'https://www.pinterest.es/IGNSpain/'
- **youtube**: Indica la url al Youtube del CNIG. Por defecto: 'https://www.youtube.com/user/IGNSpain'
- **mail**: Indica la url para escribir correo al CNIG. Por defecto: 'mailto:consulta@cnig.es'
- **tooltip**. Información emergente para mostrar en el tooltip del plugin (se muestra al dejar el ratón encima del plugin como información). Por defecto: 'Enlaces y contacto IGN'

# API-REST

```javascript
URL_API?contactlink=position*collapsed*collapsible*tooltip*descargascnig*pnoa*visualizador3d*fototeca*twitter
*instagram*facebook*pinterest*youtube*mail
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
  <tr>
    <td>descargascnig</td>
    <td>URL del centro de descargas CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>pnoa</td>
    <td>URL del comparador PNOA</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>visualizador3d</td>
    <td>URL del Visualizador3D</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>fototeca</td>
    <td>URL de Fototeca</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>twitter</td>
    <td>URL del Twitter del CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>instagram</td>
    <td>URL del Instagram del CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>facebook</td>
    <td>URL del Facebook del CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>pinterest</td>
    <td>URL del Pinterest del CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>youtube</td>
    <td>URL del Youtube del CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
  <tr>
    <td>mail</td>
    <td>URL del correo del CNIG</td>
    <td>Base64 ✔️ | Separador ✔️</td>
  </tr>
</table>


### Ejemplos de uso API-REST

```
https://componentes.idee.es/api-idee/?contactlink=TR*true*true*Enlaces*http%3A%2F%2Fcentrodedescargas.cnig.es%2FCentroDescargas%2Findex.jsp*https%3A%2F%2Fwww.ign.es%2Fweb%2Fcomparador_pnoa%2Findex.html*https%3A%2F%2Fwww.ign.es%2F3D-Stereo%2F*https%3A%2F%2Ffototeca.cnig.es%2F*https%3A%2F%2Ftwitter.com%2FIGNSpain*https%3A%2F%2Fwww.instagram.com%2Fignspain%2F*https%3A%2F%2Fwww.facebook.com%2FIGNSpain%2F*https%3A%2F%2Fwww.pinterest.es%2FIGNSpain%2F*https%3A%2F%2Fwww.youtube.com%2Fuser%2FIGNSpain*mailto:consulta@cnig.es
```

```
https://componentes.idee.es/api-idee/?contactlink=TR*true*true
```

### Ejemplos de uso API-REST en base64

Ejemplo del constructor:
```javascript
{
  position:"TL",
  descargascnig:"http://centrodedescargas.cnig.es/CentroDescargas/index.jsp",
  pnoa:"https://www.ign.es/web/comparador_pnoa/index.html",
  visualizador3d:"https://www.ign.es/3D-Stereo/",
  fototeca:"https://fototeca.cnig.es/",
  twitter:"https://twitter.com/IGNSpain",
  instagram:"https://www.instagram.com/ignspain/",
  facebook:"https://www.facebook.com/IGNSpain/",
  pinterest:"https://www.pinterest.es/IGNSpain/",
  youtube:"https://www.youtube.com/user/IGNSpain",
  mail:"mailto:consulta@cnig.es",
  tooltip:"Contacta con nosotros"
}
```
```
https://componentes.idee.es/api-idee/?contactlink=base64=eyJwb3NpdGlvbiI6IlRMIiwiZGVzY2FyZ2FzY25pZyI6Imh0dHA6Ly9jZW50cm9kZWRlc2Nhcmdhcy5jbmlnLmVzL0NlbnRyb0Rlc2Nhcmdhcy9pbmRleC5qc3AiLCJwbm9hIjoiaHR0cHM6Ly93d3cuaWduLmVzL3dlYi9jb21wYXJhZG9yX3Bub2EvaW5kZXguaHRtbCIsInZpc3VhbGl6YWRvcjNkIjoiaHR0cHM6Ly93d3cuaWduLmVzLzNELVN0ZXJlby8iLCJmb3RvdGVjYSI6Imh0dHBzOi8vZm90b3RlY2EuY25pZy5lcy8iLCJ0d2l0dGVyIjoiaHR0cHM6Ly90d2l0dGVyLmNvbS9JR05TcGFpbiIsImluc3RhZ3JhbSI6Imh0dHBzOi8vd3d3Lmluc3RhZ3JhbS5jb20vaWduc3BhaW4vIiwiZmFjZWJvb2siOiJodHRwczovL3d3dy5mYWNlYm9vay5jb20vSUdOU3BhaW4vIiwicGludGVyZXN0IjoiaHR0cHM6Ly93d3cucGludGVyZXN0LmVzL0lHTlNwYWluLyIsInlvdXR1YmUiOiJodHRwczovL3d3dy55b3V0dWJlLmNvbS91c2VyL0lHTlNwYWluIiwibWFpbCI6Im1haWx0bzpjb25zdWx0YUBjbmlnLmVzIiwidG9vbHRpcCI6IkNvbnRhY3RhIGNvbiBub3NvdHJvcyJ9
```


# Ejemplo de uso

```javascript
const mp = new ContactLink({
  position: 'TR',
  descargascnig: 'http://centrodedescargas.cnig.es/CentroDescargas/index.jsp',
  pnoa: 'https://www.ign.es/web/comparador_pnoa/index.html',
  visualizador3d: 'https://visualizadores.ign.es/estereoscopico/',
  fototeca: 'https://fototeca.cnig.es/',
  twitter: 'https://twitter.com/IGNSpain',
  instagram: 'https://www.instagram.com/ignspain/',
  facebook: 'https://www.facebook.com/IGNSpain/',
  pinterest: 'https://www.pinterest.es/IGNSpain/',
  youtube: 'https://www.youtube.com/user/IGNSpain',
  mail: 'mailto:consulta@cnig.es',
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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=contactlink)