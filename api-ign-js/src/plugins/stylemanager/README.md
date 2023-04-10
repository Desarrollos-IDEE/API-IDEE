
<p align="center">
  <img src="https://www.ign.es/resources/viewer/images/logoApiCnig0.5.png" height="152" />
</p>
<h1 align="center"><strong>APICNIG</strong> <small>🔌 M.plugin.StyleManager</small></h1>


# Descripción

Plugin que permite la gestión de la simbología de las capas vectoriales del mapa.
 
Los tipos de simbología soportada son: simple (polígono, línea, punto), coropletas, símbolos proporcionales, categorías, estadísticos, cluster y mapas de calor. La capa a modificar se selecciona desde el propio plugin, que mantendrá activos únicamente los tipos de simbología compatibles con la capa según su geometría.  
 
La simbología puede ser Compuesta, y a medida que se van aplicando simbologías concretas, la interfaz desactiva las que no son compatibles.  


# Dependencias

- stylemanager.ol.js
- stylemanager.min.css

```html
 <link href="https://componentes.cnig.es/api-core/plugins/stylemanager/stylemanager.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.cnig.es/api-core/plugins/stylemanager/stylemanager.ol.min.js"></script>
```
# Parámetros

El constructor se inicializa con un JSON de options con los siguientes atributos:

- **position**: Indica la posición donde se mostrará el plugin.
  - 'TL': (top left) - Arriba a la izquierda (por defecto).
  - 'TR': (top right) - Arriba a la derecha.
  - 'BL': (bottom left) - Abajo a la izquierda.
  - 'BR': (bottom right) - Abajo a la derecha.
- **collapsible**: Indica si el plugin se puede cerrar (true/false). Por defecto: true.
- **collapsed**: Indica si el plugin viene cerrado por defecto (true/false). Por defecto: true.
- **layer**: Capa pre seleccionada.<br> Si no tiene o no ha cargado aún sus features, lanzará un error. (Válido sólo para creación del plugin por JS).

# Parámetros API REST
```javascript
URL_API?stylemanager=position*collapsible*collapsed
````

<table>
  <tr>
    <td>Parámetros</td>
    <td>Opciones/Descripción</td>
  </tr>
  <tr>
    <td>position</td>
    <td>TR/TL/BR/BL</td>
  </tr>
  <tr>
    <td>collapsible</td>
    <td>true/false</td>
  </tr>
  <tr>
    <td>collapsed</td>
    <td>true/false</td>
  </tr>
</table>

### Ejemplos de uso API-REST

```
https://componentes.cnig.es/api-core?stylemanager=TR*true*true

```

# Ejemplo de uso

```javascript
// Creación por defecto
var mp = new M.plugin.StyleManager({
        collapsed: true,
        collapsible: true,
        position: 'TL'
    });
myMap.addPlugin(mp);
```  

```javascript
// Inicialización con capa
capaVectorial.on(M.evt.LOAD, function() {
    var mp = new M.plugin.StyleManager({
        collapsed: true,
        collapsible: true,
        position: 'TL',
        layer: capaVectorial
    });
    myMap.addPlugin(mp);
});
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
npm run start
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