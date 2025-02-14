# API CNIG

API CNIG es una herramienta que permite integrar de una forma muy sencilla un visualizador de mapas interactivo en cualquier página web y configurarlo consumiendo ficheros WMC, servicios WMS, servicios WFS, ficheros KML, etc. Además, provee la capacidad de añadir una gran cantidad de herramientas y controles.

Para adaptarse a las necesidades de los usuarios y ser mucho más flexible, API CNIG cuenta con dos APIs. De esta manera, es el propio usuario el que selecciona la que más se adapta a las necesidades que necesite cubrir en cada momento:

 - A través de una API REST muy sencilla y documentada permite incluir un visualizador interactivo en cualquier página web sin necesidad de disponer de conocimientos específicos en programación ni en el ámbito de los SIG.
 - A través de una API JavaScript que permite crear desde visualizadores de mapas básico hasta otros de mayor complejidad.

## Componentes

La arquitectura de API CNIG está compuesta por los siguientes componentes:

- [api-ign-js](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-js) Librería JavaScript que provee una API para facilitar la creación de visores de mapas.
- [api-ign-parent](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-parent) Módulo padre que hace uso de maven para compilar y generar el war final de api-core.
- [api-ign-proxy](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-proxy) Proxy para realizar peticiones POST por si el [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) no está habilitado.
- [api-ign-rest](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-rest) Servicio Web con API RESTful que genera el código JS necesario para generar un visor con la configuración especificada por parámetros.
- [api-ign-database](https://github.com/IGN-CNIG/API-CNIG/tree/master/api-ign-database) Proporciona un módulo de conexión a la base de datos (PostgreSQL). Realizando diferentes peticiones GET se puede obtener diferentes servicios (bases de datos disponibles, tablas disponibles, campos de una tabla, realizar consultas personalizadas, ...)..


## Navegadores soportados

- EdgeHTML 12+
- Mozilla Firefox 45+
- Goole Chrome 49+

## Dispositivos móviles y SO soportados

- Android 6+
- iOS 9+
