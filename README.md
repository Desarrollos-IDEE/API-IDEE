# API IDEE

API IDEE es una herramienta que permite integrar de una forma muy sencilla un visualizador de mapas interactivo en cualquier página web y configurarlo consumiendo ficheros WMC, servicios WMS y WMTS, servicios WFS, ficheros KML, etc. Además, provee la capacidad de añadir una gran cantidad de herramientas y controles.

Para adaptarse a las necesidades de los usuarios y ser mucho más flexible, API IDEE cuenta con dos APIs. De esta manera, es el propio usuario el que selecciona la que más se adapta a las necesidades que necesite cubrir en cada momento:

 - A través de una API REST muy sencilla y documentada permite incluir un visualizador interactivo en cualquier página web sin necesidad de disponer de conocimientos específicos en programación ni en el ámbito de los SIG.
 - A través de una API JavaScript que permite crear desde visualizadores de mapas básico hasta otros de mayor complejidad.

API IDEE se presenta como una solución gratuita para la incorporación de clientes de mapas interactivos en nuestras páginas web muy fácilmente.

## Componentes

La arquitectura de API IDEE está compuesta por los siguientes componentes:

- [api-idee-js](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-js) Librería JavaScript que provee una API para facilitar la creación de visores de mapas.
- [api-idee-parent](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-parent) Módulo padre que hace uso de maven para compilar y generar el war final de api-idee.
- [api-idee-proxy](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-proxy) Proxy para realizar peticiones POST por si el [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) no está habilitado.
- [api-idee-rest](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-rest) Servicio Web con API RESTful que genera el código JS necesario para generar un visor con la configuración especificada por parámetros.
- [api-idee-database](https://github.com/Desarrollos-IDEE/API-IDEE/tree/master/api-idee-database) Módulo de conexión a la base de datos (PostgreSQL). Realizando diferentes peticiones GET se puede obtener diferentes servicios (bases de datos disponibles, tablas disponibles, campos de una tabla, realizar consultas personalizadas, ...).

## Plugins

El API IDEE se puede extender en base al desarrollo de plugins.

Podemos consultar el listado de plugins que por defecto vienen incorporados [aquí](https://github.com/Desarrollos-IDEE/API-IDEE/wiki/2.3.-Plugins).

## Primeros pasos

Se ha creado una [Wiki](https://github.com/Desarrollos-IDEE/API-IDEE/wiki/1.3.-Primeros-pasos) para servir de guía en los primeros pasos, así como para tenerla como referencia de consulta en cualquier momento.

## Navegadores soportados

- EdgeHTML 12+
- Mozilla Firefox 45+
- Goole Chrome 49+

## Dispositivos móviles y SO soportados

- Android 6+
- iOS 9+

<h2 id="readme-versions" style="visibility: hidden">Versiones de librerías base</h2>

<script>
    async function currentBaseLibrariesVersion() {
        try {
          const response = await fetch('https://componentes-desarrollo.idee.es/api-idee/api/proxy/?url=https://componentes-desarrollo.idee.es/api-idee/api/actions/version');
          let json = await response.json();
          json = JSON.parse(json.content);

          let versionOL = json['number-ol'];
          let versionCesium = json['number-cesium'];

          // Si la versión de OL en llamada no tiene 3 dígitos
          if (versionOL.split('.').length < 3) {
            versionOL = `${versionOL}.0`;
          }
          // Si la versión de Cesium en llamada no tiene 3 dígitos
          if (versionCesium.split('.').length < 3) {
            versionCesium = `${versionCesium}.0`;
          }

          // Cabecera
          document.getElementById('readme-versions').style.visibility = 'visible';
          document.getElementById('readme-list-versions').style.visibility = 'visible';

          // Version OL
          document.getElementById('ol-version').href = `https://openlayers.org/en/v${versionOL}/apidoc/`;
          document.getElementById('ol-version').innerHTML = `OpenLayers v${versionOL}`;

          // Version Cesium
          document.getElementById('cesium-version').href = 'https://cesium.com/learn/cesiumjs/ref-doc/';
          document.getElementById('cesium-version').innerHTML = `Cesium v${versionCesium}`;
        } catch (error) {
          console.error('Error:', error);
          document.getElementById('readme-versions').style.visibility = 'hidden';
          document.getElementById('readme-list-versions').style.visibility = 'hidden';
        }
      }

      currentBaseLibrariesVersion();
</script>
<ul id="readme-list-versions" style="visibility: hidden">
<li><a id="ol-version"></a></li>
<li><a id="cesium-version"></a></li>
</ul>

## Bugs

A través de [GitHub issue tracker](https://github.com/Desarrollos-IDEE/API-IDEE/issues) podremos informar de los bugs detectados durante el uso de API IDEE o realizar peticiones de nuevas funcionalidades. Antes de crear una petición se recomienda realizar una búsqueda rápida por si ya fue reportada por alguien.
