<p align="center">
  <img src="https://componentes.idee.es/estaticos/imagenes/logos/API_IDEE/API_2/API_2.svg" height="152" />
</p>
<h1 align="center"><strong>API IDEE</strong> <small>🔌 IDEE.plugin.Mapfooter</small></h1>

## Descripción

 Plugin para la generación automática de pie de pagina. 

![Imagen](./docs/images//mapfooterPlugin.png)


## Dependencias

Para que el plugin funcione correctamente es necesario importar las siguientes dependencias en el documento html:
Para uso de implementación OpenLayers:
- **mapfooter.ol.min.js**
- **mapfooter.ol.min.css**

Para uso de implementación Cesium:
- **mapfooter.cesium.min.js**
- **mapfooter.cesium.min.css**

```html
 <link href="https://componentes.idee.es/api-idee/plugins/mapfooter/mapfooter.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/mapfooter/mapfooter.ol.min.js"></script>
```

# Uso del histórico de versiones

Existe un histórico de versiones de todos los plugins de API-IDEE en [api-idee-legacy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-legacy/plugins) para hacer uso de versiones anteriores.
Ejemplo:
```html
 <link href="https://componentes.idee.es/api-idee/plugins/mapfooter/mapfooter-1.0.0.ol.min.css" rel="stylesheet" />
 <script type="text/javascript" src="https://componentes.idee.es/api-idee/plugins/mapfooter/mapfooter-1.0.0.ol.min.js"></script>
```

## Parámetros

El constructor se inicializa con un JSON con los siguientes atributos:

- **open**. Parámetro que inicializa el plugin con el pie de página abierta o cerrada.
- **htmlCode**. CÓdigo html a partir del cual se construye el pie de la página.
- **cssList**. Listado de archivos css que se inyectan en el visor para su uso en el pie de página.

# API-REST

```javascript
URL_API?mapheader=open*htmlCode*cssList
```

<table>
    <tr>
        <th>Parámetros</th>
        <th>Opciones/Descripción</th>
        <th>Disponibilidad</th>
    </tr>
    <tr>
        <td>open</td>
        <td>Boolean</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>htmlCode</td>
        <td>Elemento para mostrar en el pie de la página</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
    <tr>
        <td>cssList</td>
        <td>Links CSS para el pie de la página</td>
        <td>Base64 ✔️ | Separador ✔️</td>
    </tr>
</table>

### Ejemplos de uso API-REST
```
https://componentes.idee.es/api-idee?mapfooter=open*htmlCode*cssList
```

```
https://componentes.idee.es/api-idee?mapfooter=true*<p>Mi%20pie%20de%20página</p>*https://www.sevilla.org/++theme++aysevilla/styles/build/plonetheme.aysevilla.min.css
```

### Ejemplo de uso API-REST en base64

Para la codificación en base64 del objeto con los parámetros del plugin podemos hacer uso de la utilidad IDEE.utils.encodeBase64.
Ejemplo:
```javascript
IDEE.utils.encodeBase64(obj_params);

Ejemplo de constructor:
```javascript
{
  open: true,
  htmlCode: `<p>mi pie de página</p>`,
  cssList: [
    'https://www.sevilla.org/++theme++aysevilla/styles/build/plonetheme.aysevilla.min.css',
  ],
}
```
```
https://componentes.idee.es/api-idee?mapfooter=base64=eyJvcGVuIjp0cnVlLCJodG1sQ29kZSI6IjxwPm1pIHBpZSBkZSBww6FnaW5hPC9wPiIsImNzc0xpc3QiOlsiaHR0cHM6Ly93d3cuc2V2aWxsYS5vcmcvKyt0aGVtZSsrYXlzZXZpbGxhL3N0eWxlcy9idWlsZC9wbG9uZXRoZW1lLmF5c2V2aWxsYS5taW4uY3NzIl19
```

## Ejemplos de uso

```javascript
   const map = IDEE.map({
     container: 'map'
   });

   const mp = new IDEE.plugin.Mapheader({
  open: true,
  htmlCode: `<div class="col-12 col-m-12 displayInlineBlock txtCenter fontSize09em">
                <p class="marginBottom0">© Organismo Autónomo Centro Nacional de Información Geográfica (CNIG)</p>
                <div id="dirCnigPC" class="row paddingBottom1por">
                    <div class="col-12">
                    Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España.   
                    </div>
                    <div class="col-12">
                        NIF: ES Q2817024I  - NIPO: 798-20-071-1 - DOI: 10.7419/162.09.2020
                    </div>
                </div>
                <div id="dirCnigMobile" class="row paddingBottom2por" style="display: none;">
                    <div class="col-12">
                        Calle General Ibáñez de Ibero, 3. 28003 - Madrid - España. 
                    </div>
                    <div class="col-12">
                        NIF: ES Q2817024I 
                    </div>
                    <div class="col-12">
                        NIPO: 798-20-071-1
                    </div>
                    <div class="col-12">
                        DOI: 10.7419/162.09.2020
                    </div>
                </div>
              </div>`,
  cssList: [
    'https://centrodedescargas.cnig.es/CentroDescargas/css/estilos-css-cnig-2024.css'
  ]
});

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
[Consulta el api resourcePlugin](https://componentes.idee.es/api-idee/api/actions/resourcesPlugins?name=mapfooter)

