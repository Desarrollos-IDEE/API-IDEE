# API IDEE

API IDEE es una herramienta que permite integrar de una forma muy sencilla un visualizador de mapas interactivo en cualquier página web y configurarlo consumiendo ficheros WMC, servicios WMS y WMTS, servicios WFS, ficheros KML, etc. Además, provee la capacidad de añadir una gran cantidad de herramientas y controles.

Para adaptarse a las necesidades de los usuarios y ser mucho más flexible, API IDEE cuenta con dos APIs. De esta manera, es el propio usuario el que selecciona la que más se adapta a las necesidades que necesite cubrir en cada momento:

 - A través de una API REST muy sencilla y documentada permite incluir un visualizador interactivo en cualquier página web sin necesidad de disponer de conocimientos específicos en programación ni en el ámbito de los SIG.
 - A través de una API JavaScript que permite crear desde visualizadores de mapas básico hasta otros de mayor complejidad.

## Componentes

La arquitectura de API IDEE está compuesta por los siguientes componentes:

- [api-idee-js](/api-idee-js) Librería JavaScript que provee una API para facilitar la creación de visores de mapas.
- [api-idee-parent](/api-idee-parent) Módulo padre que hace uso de maven para compilar y generar el war final de api-idee.
- [api-idee-proxy](/api-idee-proxy) Proxy para realizar peticiones POST por si el [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) no está habilitado.
- [api-idee-rest](/api-idee-rest) Servicio Web con API RESTful que genera el código JS necesario para generar un visor con la configuración especificada por parámetros.
- [api-idee-database](/api-idee-database) Módulo de conexión a la base de datos (PostgreSQL). Realizando diferentes peticiones GET se puede obtener diferentes servicios.

## Plugins

El API IDEE se puede extender en base al desarrollo de plugins.

Podemos consultar el listado de plugins que por defecto vienen incorporados [aquí](https://github.com/Desarrollos-IDEE/API-IDEE/wiki/2.3.-Plugins).


## Navegadores soportados

- EdgeHTML 12+
- Mozilla Firefox 45+
- Goole Chrome 49+

## Dispositivos móviles y SO soportados

- Android 6+
- iOS 9+
