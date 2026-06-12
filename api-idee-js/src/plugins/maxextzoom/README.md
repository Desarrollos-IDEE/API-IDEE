<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.MaxExtZoom</small></h1>

# Descripción

Plugin que va a la extensión y posición original del mapa base.

![Imagen1](img/maxExtZoom_1.png)

## Dependencias

Para uso de implementación OpenLayers:
- **maxextzoom.ol.min.js**
- **maxextzoom.ol.min.css**

Para uso de implementación Cesium:
- **maxextzoom.cesium.min.js**
- **maxextzoom.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/maxextzoom/maxextzoom.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/maxextzoom/maxextzoom.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/maxextzoom/maxextzoom-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/maxextzoom/maxextzoom-1.0.0.ol.min.js"></script>
```

## Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **position**. Indica la posición donde se mostrará el plugin
  - 'TL':top left (por defecto)
  - 'TR':top right 
  - 'BL':bottom left
  - 'BR':bottom right

# API-REST

```javascript
URL_API?maxextzoom=position
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
</table>

### Ejemplos de uso API-REST
```
https://componentes.idee.es/api-idee?maxextzoom=position
```

```
https://componentes.idee.es/api-idee?maxextzoom=TR&maxextent=-3267535.078657374,2900457.9904398364,2248102.1864131317,5693133.810152115
```


### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);

Ejemplo de constructor:
```javascript
{
  position: 'TR'
}
```
```
https://componentes.idee.es/api-idee?maxextzoom=base64=eyJwb3NpdGlvbiI6IlRSIn0=&maxextent=-3267535.078657374,2900457.9904398364,2248102.1864131317,5693133.810152115
```

## Ejemplos de uso

### Ejemplo 1
```javascript
  const map = IDEE.map({
    container: 'map',
    maxExtent: [-3267535.078657374, 2900457.9904398364, 2248102.1864131317, 5693133.810152115],
  });

  const mp = new IDEE.plugin.MaxExtZoom({
    position: 'TL',
  });

  map.addPlugin(mp);
```

```javascript
  const map = IDEE.map({
    container: 'map',
    maxExtent: [-3267535.078657374, 2900457.9904398364, 2248102.1864131317, 5693133.810152115],
  }); 

  const mp = new IDEE.plugin.MaxExtZoom();

  map.addPlugin(mp);
```

# 👨‍💻 Desarrollo

Para el stack de desarrollo de este componente se ha utilizado

* NodeJS Versión: 16 o superior
* NPM Versión: 8.19.4 o superior

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
npm run start:ol
npm run start:cesium
```

## 📂 Estructura del código / *Code scaffolding*

```any
/
├── src 📦                  # Código fuente
├── legacy 📁               # Histórico de versiones
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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=maxextzoom)
