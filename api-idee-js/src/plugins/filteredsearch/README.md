<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.FilteredSearch</small></h1>

# Descripción

Plugin que permite aplicar filtros sobre las capas de un mapa y visualizar de forma gráfica las features que cumplen los filtros. Permite guardar consultas, combinarlas y exportar los resultados de estas.

![Imagen1](./img/filteredSearch_1.png)

## Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **filteredsearch.ol.min.js**
- **filteredsearch.ol.min.css**

Para uso de implementación Cesium:
- **filteredsearch.cesium.min.js**
- **filteredsearch.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/filteredsearch/filteredsearch.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/filteredsearch/filteredsearch.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/filteredsearch/filteredsearch-2.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/filteredsearch/filteredsearch-2.0.0.ol.min.js"></script>
```

## Parámetros

| Parámetro | Tipo | Por defecto | Descripción |
| ----------- | ------ | ------------- | ------------- |
| `position` | `left` \| `right` | `right` | Barra de herramientas donde se muestra el botón del plugin |
| `collapsed` | `boolean` | `true` | Indica si el panel aparece colapsado al inicio |
| `order` | `number` | — | Orden del botón/panel entre controles y plugins |
| `tooltip` | `string` | `Búsqueda por filtros` | Texto al pasar el ratón sobre el botón |

# API-REST

```javascript
URL_API?filteredsearch=position*collapsed*order*tooltip
```

| Parámetros | Opciones/Descripción | Disponibilidad |
| --- | --- | --- |
| position | left / right | Base64 ✔️ \| Separador ✔️ |
| collapsed | true / false | Base64 ✔️ \| Separador ✔️ |
| order | número | Base64 ✔️ \| Separador ✔️ |
| tooltip | texto | Base64 ✔️ \| Separador ✔️ |

### Ejemplos de uso API-REST
```
https://componentes.idee.es/api-idee?filteredsearch=right*true*0*Búsqueda filtrada
```

### Ejemplo de uso API-REST en base64

```javascript
IDEE.utils.encodeBase64({
  position: 'right',
  collapsed: true,
  order: 0,
  tooltip: 'Búsqueda filtrada',
});
```

## Ejemplos de uso

```javascript
const map = IDEE.map({
  container: 'map'
});

const mp = new IDEE.plugin.FilteredSearch({
  position: 'right',
  collapsed: true,
  order: 0,
  tooltip: 'Búsqueda filtrada',
});

map.addPlugin(mp);
```

# 👨‍💻 Desarrollo

Para el stack de desarrollo de este componente se ha utilizado

* NodeJS Versión: 16 o superior
* NPM Versión: 8.19.4 o superior

## 📐 Configuración del stack de desarrollo / *Work setup*


### 🐑 Clonar el repositorio / *Cloning repository*

```bash
git clone [URL del repositorio]
```

### 1️⃣ Instalación de dependencias / *Install Dependencies*

```bash
npm i
```

### 2️⃣ Arranque del servidor de desarrollo / *Run Application*

```bash
npm run start:ol
npm run start:cesium
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
  * [NPM ESLint](https://www.npmjs.com/package/eslint)
  * [NPM ESLint | Airbnb](https://www.npmjs.com/package/eslint-config-airbnb)

## ⛽️ Revisión e instalación de dependencias / *Review and Update Dependencies*

Para la revisión y actualización de las dependencias de los paquetes npm es necesario instalar de manera global el paquete/ módulo "npm-check-updates".

```bash
# Install and Run
$npm i -g npm-check-updates
$ncu
```

## Tabla de compatibilidad de versiones
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=filteredsearch)
