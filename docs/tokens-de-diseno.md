# Tokens de diseño: de la configuración a las variables CSS

Documentación técnica interna. El contrato público (estructura de `IDEE.config.token`) está en la wiki: [2.9. Tokens de diseño](https://github.com/administradorcnig/Wiki-APIIDEE-2.0.0/wiki/2.9.-Tokens-de-dise%C3%B1o).

## Flujo

1. **Configuración.** `IDEE.config.token` contiene uno o varios temas con nombre, e `IDEE.config.activeTOKEN` indica el activo. El tema por defecto es `cnig`, definido en `api-idee-js/src/configuration.js`. Ambos valores deben fijarse antes de crear el mapa.
2. **Generación.** `api-idee-js/src/facade/js/theme/tokens.js` convierte el tema activo en variables CSS:
   - `getDesignTokenCssVariables(token)` es una función pura que devuelve `{ '--idee-…': valor }`.
   - `applyDesignTokenCssVariables()` se ejecuta en el constructor de `IDEE.Map`. Escribe las variables en línea sobre `<html>`, de modo que alcanzan a todo el documento, incluidos los elementos montados fuera del contenedor del mapa. Además, elimina las variables que aplicó un tema anterior y que el nuevo no define.
3. **Valores por defecto.** El bloque `@layer base { :root { … } }` al principio de `api-idee-js/src/facade/assets/css/idee.css` define todas las variables con los valores del tema `cnig`.
4. **Consumo.** Las hojas de estilos de la API y de los plugins usan `var(--idee-…)` en las propiedades de tipografía y forma.

### Precedencia

| Prioridad | Origen | Uso |
|---|---|---|
| 1 | Token activo (en línea sobre `<html>`) | Lo que el usuario configura en `IDEE.config.token`. Siempre gana. |
| 2 | CSS de la página que consume la API (sin capa) | Puede redefinir las variables que el tema no define, sin `!important`. |
| 3 | Valores por defecto de la API (`@layer base`) | Solo actúan cuando el tema activo no define una clave. |

Un tema parcial (por ejemplo, solo `typography.fontFamily`) y los valores vacíos (`""`, `null`) no generan variables, así que actúan los valores por defecto. Nunca se escriben valores como `undefined`.

## Nomenclatura

La clave del token pasa a kebab-case: `_` se convierte en `-` y camelCase se separa (`borderRadius` → `border-radius`).

| Token | Variable CSS | Valor por defecto |
|---|---|---|
| `color.<clave>` | `--idee-color-<clave>` (p. ej. `neutral_05` → `--idee-color-neutral-05`) | colores de `cnig` |
| `typography.fontFamily` | `--idee-font-family` | `'Roboto', sans-serif` |
| `typography.fontSize.body_m` | `--idee-font-size-body-m` | `16px` |
| `typography.fontSize.heading_l` | `--idee-font-size-heading-l` | `32px` |
| `typography.fontSize.caption` | `--idee-font-size-caption` | `body_m × 0.75` (12px) |
| `typography.fontSize.body_s` | `--idee-font-size-body-s` | `body_m × 0.875` (14px) |
| `typography.fontSize.body_l` | `--idee-font-size-body-l` | `body_m × 1.125` (18px) |
| `typography.fontSize.heading_m` | `--idee-font-size-heading-m` | `heading_l × 0.75` (24px) |
| `typography.fontWeight.regular` / `.bold` | `--idee-font-weight-regular` / `-bold` | `400` / `700` |
| `shape.borderRadius` | `--idee-shape-border-radius` | `4px` |
| `shape.boxShadow` | `--idee-shape-box-shadow` | `0 2px 4px rgba(0,0,0,.2), 0 -1px 0 rgba(0,0,0,.02)` |
| `shape.border` | `--idee-shape-border` | `none` (sin consumidores, ver limitaciones) |

Los tamaños derivados se calculan en el propio `:root`. Si un tema define solo `body_m` y `heading_l` (como los ejemplos de la wiki), toda la escala tipográfica se ajusta a ellos. Si un tema define una clave derivada explícitamente, por ejemplo `caption`, prevalece su valor. Cualquier otra clave de `fontSize`, `fontWeight`, `color` o `shape` genera su variable con la misma regla.

`--control-font-family` y `--control-font-weight` siguen existiendo como alias de compatibilidad para CSS externo. El código de la API usa siempre las variables `--idee-*`.

## Cómo consumirlas en CSS

**Tipografía:** cada regla usa el rol que le corresponde, no un tamaño fijo.

| Rol | Uso |
|---|---|
| `caption` | Texto pequeño de los controles, etiquetas, tooltips, escala, atribuciones |
| `body-s` | Texto general de la interfaz: contenedor del mapa, botones, tablas, listas |
| `body-m` | Campos de formulario, mensajes y títulos de diálogos y popups, títulos de 15–16px |
| `body-l` | Títulos de paneles y pestañas |
| `heading-m` / `heading-l` | Encabezados grandes, como la cabecera de la ventana de ayuda o de mapheader |

- Para la familia de texto se usa `var(--idee-font-family)`.
- Para el peso se usa `var(--idee-font-weight-bold)` o `var(--idee-font-weight-regular)`.
- Para heredar el tamaño del padre se usa `inherit`, nunca `1em` ni `100%`.

**Forma:**
- Radios genéricos: `var(--idee-shape-border-radius)`.
- Contenedores grandes (diálogos de ayuda, paneles): `calc(var(--idee-shape-border-radius) * 2)`.
- `0` y los porcentajes (`50%` para círculos) se escriben tal cual.
- Sombras de elevación (paneles, popups, desplegables, diálogos): `var(--idee-shape-box-shadow)`.

```css
.m-mi-plugin-panel {
    font-size: var(--idee-font-size-body-s);
    border-radius: var(--idee-shape-border-radius);
    box-shadow: var(--idee-shape-box-shadow);
}
.m-mi-plugin-panel h3 {
    font-size: var(--idee-font-size-body-l);
    font-weight: var(--idee-font-weight-bold);
}
```

Los elementos que se añaden a `document.body`, fuera de `.m-api-idee-container`, reciben las variables pero no heredan la tipografía del contenedor. Por eso deben declarar `font-family` y `font-size` (ver `#vectorsmanagement-point-profile-container`).

Para un documento nuevo, como una ventana abierta con `window.open`, se usa `IDEE.utils.copyDesignTokenCssVariables(nuevoDocumento)`, que copia los valores resueltos (ver el plugin help).

## Comprobación automática

`api-idee-js/tasks/check-css-tokens.js` (`npm run check:css-tokens`) analiza con postcss las hojas de estilos propias:

- **Alcance:** `src/facade`, `src/impl` y `src/plugins/*/src`.
- **Propiedades vigiladas:** `font-family`, `font-size`, `font-weight`, `font`, `border-radius` y sus esquinas, y `box-shadow`, incluidas las versiones con prefijo.
- **Integración:** se ejecuta en `prebuild`, así que `npm run build` y el build Maven fallan si se introduce un valor rígido. Las pruebas de navegador de los tokens están en `test/playwright/ol/PLAY-49-design-tokens.spec.js`.

**Valores admitidos:**
- variables `--idee-*` del tipo correspondiente, incluidas dentro de `calc()`;
- `inherit`, `initial`, `unset`, `revert` y `revert-layer`;
- `0` y porcentajes en los radios;
- `none` en las sombras.

Los comentarios y los descriptores de `@font-face` no se analizan.

**Excepciones justificadas:** el motivo es obligatorio.

```css
.mi-icono::before {
    /* idee-token-exception: tamaño de glifo de icono */
    font-size: 24px;
}

/* idee-token-exception-start: bloque copiado de una librería */
/* … */
/* idee-token-exception-end */
```

**Excepciones existentes:**
- fuentes y tamaños de iconos y glifos;
- píldoras (radio igual a la mitad de la altura) y círculos;
- partes de los controles `range` y de los interruptores;
- sombras con un efecto propio: halos, anillos de estado, efecto de lupa, relieve de botones, sombra de los botones de zoom, sombras coloreadas;
- la tipografía monoespaciada del selector de capas dinámicas de timeline.

**Ficheros excluidos** (la lista y sus motivos están en el script):
- `src/impl/cesium/assets/css/widgets.css` (CSS de Cesium);
- `src/impl/leaflet/` (sin compilación);
- `src/facade/assets/css/panel.css` (no se importa);
- la fuente de iconos IcoMoon de information;
- las hojas `*.min.css` de terceros.

**Limitaciones del comprobador:** no analiza estilos en línea dentro de plantillas HTML o JS, ni el `<style>` de la ventana de ayuda. Esos se revisan a mano.

## Limitaciones conocidas

- **Fuentes:** la API carga Roboto 400/700 desde Google Fonts, que es la fuente por defecto. Si un tema usa otra familia, la página debe cargarla (`<link>` o `@font-face`). Si no está disponible, el navegador usa la siguiente familia de la lista.
- **`shape.border`:** genera `--idee-shape-border`, pero no se consume. Su valor abreviado incluye el color y entraría en conflicto con los tokens de color.
- **`typography.lineHeight` y `typography.letterSpacing`:** están vacíos en `cnig`, no forman parte del contrato documentado y no generan variables.
- **Varios mapas en la misma página:** las variables son globales, así que gana el tema del último mapa creado.
- **Iframes:** el contenido en iframes de usuario (plugins modal y basic) es un documento independiente y no recibe las variables.
