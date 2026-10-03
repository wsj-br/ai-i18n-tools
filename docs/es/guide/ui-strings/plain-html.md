<a id="plain-html-apps"></a>
# Aplicaciones HTML simples

Utilice esta ruta para una página interactiva que se mantiene en un solo archivo HTML. `extract` lee los marcadores `data-i18n*` en `strings.json`, `translate-ui` escribe un paquete JSON plano por configuración regional, y un script del navegador aplica las cadenas. El mismo script puede añadir sufijos a los nombres de archivo de las imágenes y mantener los enlaces en la página actual.

Para un sitio estático que debe generar un archivo HTML traducido por configuración regional (sin tiempo de ejecución, con enlaces entre páginas reescritos), utilice [páginas HTML](/es/guide/documents/html-pages) en su lugar. Un archivo pertenece a una sola ruta.

<a id="quick-start"></a>
## Inicio rápido

1. Genere la estructura con `ai-i18n-tools init -t ui-plain-html`, o añada la configuración a continuación.
2. Marque el HTML de origen (o deje que `mark-html` lo haga).
3. Apunte `ui.sourceRoots` y `ui.uiExtractor.extensions` a esos archivos.
4. Ejecute `extract` y luego `translate-ui` (o ejecute ambos con `sync-ui`).
5. Copie `i18n.js` junto a la página y cárguelo antes de su propio script.
6. Sirva la carpeta a través de HTTP. `file://` no puede `fetch` el JSON de configuración regional.

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

Ejemplo de `ai-i18n-tools.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

La estructura generada también añade la [configuración del proveedor](/es/guide/providers-and-models) de LLM utilizada por `translate-ui`; se omite arriba para mantener visibles las configuraciones específicas de HTML.

`extract` controla `strings.json` y genera `ui-languages.json`; `translate-ui` controla los archivos JSON de la configuración regional de destino. No edite manualmente estos archivos generados.

`flatOutputDir` es donde se almacenan los archivos de configuración regional generados. El `data-locales-base` del script debe apuntar a ese directorio como una URL relativa a `i18n.js` (no a la página). Una base de `./locales` en `public/i18n.js` carga `public/locales/pt-BR.json`. Utilice una base relativa para que el sitio siga funcionando bajo una subruta de implementación.

<a id="obtain-the-runtime"></a>
## Obtener el tiempo de ejecución

`i18n.js` es un script clásico (no un módulo). Copie uno de estos; son el mismo archivo:

- `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` después de instalar el paquete
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- el listado en [Código fuente del tiempo de ejecución](#runtime-source)

Cárguelo al final de `<body>`, y luego su propio script. Ponga `class="i18n-pending"` en `<html>` y oculte el cuerpo mientras esa clase esté configurada para que el idioma de origen no parpadee:

```html
<html lang="en" class="i18n-pending">
  <head>
    <style>
      html.i18n-pending body { visibility: hidden; }
    </style>
  </head>
  <body>
    <!-- page -->
    <script
      src="i18n.js"
      data-source-locale="en"
      data-locales-base="./locales"
      data-storage-key="ai-i18n-locale"
      data-locale-select="#locale-select"
      data-label-mode="native"
    ></script>
    <script src="app.js"></script>
  </body>
</html>
```

Ajuste los atributos del script según sus necesidades:

| Atributo | Valor predeterminado | Función |
| --- | --- | --- |
| `data-source-locale` | `en` | Configuración regional que mantiene el HTML en inglés y omite la obtención del paquete |
| `data-locales-base` | `./locales` | Directorio de `ui-languages.json` y `{locale}.json`, resuelto con respecto a la URL del script |
| `data-storage-key` | `ai-i18n-locale` | Clave de `localStorage` |
| `data-locale-select` | (ninguno) | Selector CSS de un `<select>` para rellenar desde el manifiesto |
| `data-locale-list` | (ninguno) | Selector CSS de un elemento para rellenar con enlaces de idioma |
| `data-label-mode` | `native` | `native` (`label` del manifiesto), `english` (`englishName`), o `both` (`englishName / label` cuando difieren) |

`window.i18n` expone `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)` y `ready` (una promesa). Espere a `ready` antes de que su propio script dependa de la configuración regional resuelta o de los valores traducidos. Llame a `apply()` después de insertar nuevos elementos marcados.

<a id="marking-html-for-translation"></a>
## Marcar HTML para traducción

Prefiera marcadores simples. El texto de origen en inglés permanece en el elemento, y ese texto es la clave del catálogo. `extract` lo lee; el entorno de ejecución escribe la traducción de vuelta en la misma propiedad.

- `data-i18n` — la clave es `textContent`. El tiempo de ejecución establece `textContent`.
- `data-i18n-title` — la clave es `title`.
- `data-i18n-placeholder` — la clave es `placeholder`.
- `data-i18n-alt` — la clave es `alt`.
- `data-i18n-aria-label` — la clave es `aria-label`.

Un elemento puede contener varios de estos. Cada marcador es su propia entrada de catálogo.

### Texto

Coloque `data-i18n` en un elemento cuyo contenido sea solo texto:

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

El entorno de ejecución también establece `document.title` desde el elemento `<title>`. No coloque `data-i18n` en un contenedor de contenido mixto: el entorno de ejecución asigna `textContent`, lo que eliminaría sus elementos secundarios.

### Tooltip

```html
<select title="Filter by locale" data-i18n-title></select>
```

Un control puede traducir su etiqueta y su información sobre herramientas como dos claves:

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

### Marcador de posición

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

Marcador de posición e información sobre herramientas en el mismo campo:

```html
<input
  type="text"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-placeholder
  data-i18n-title
/>
```

### Texto alternativo

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

### Nombre accesible

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

La etiqueta del botón `×` no tiene `data-i18n`, por lo que se mantiene como está escrita. El nombre accesible es la cadena que se traduce.

### Contenido mixto

`data-i18n` lee todo el `textContent` del elemento. Cuando una oración comparte su elemento padre con otro elemento, envuelva cada fragmento de texto:

```html
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers.</span>
</p>
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select"></select>
</label>
```

### Solo idioma de origen

`data-i18n-ignore` omite ese elemento y sus descendientes tanto para `mark-html` como para la `extract` de cadenas de UI. Úselo para filas de ejemplo, identificadores y nombres de marcas:

```html
<a
  href="https://github.com/wsj-br/ai-i18n-tools"
  aria-label="wsj-br/ai-i18n-tools on GitHub"
  data-i18n-ignore
>
  <span>wsj-br/ai-i18n-tools</span>
</a>
<tbody data-i18n-ignore>
  <tr>
    <td>public/index.html</td>
    <td>pt-BR</td>
  </tr>
</tbody>
```

### Una clave de catálogo diferente

Un marcador con valor especifica la clave del catálogo. El entorno de ejecución sigue escribiendo la traducción en el elemento (o en el atributo especificado):

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html` inserta los marcadores simples anteriores. Es una ejecución de prueba a menos que pase `--write`. Omite los subárboles de `data-i18n-ignore`, los elementos similares a código (`code`, `pre`, `kbd`, `samp`, `var`) y el texto vacío o solo numérico. Informa sobre los padres con contenido mixto y los deja para que los envuelva en `<span data-i18n>`. Nunca escribe un marcador con valor.

El entorno de ejecución registra cada clave de origen en un atributo `data-i18n-source` interno la primera vez que se ejecuta, por lo que un cambio posterior de configuración regional sigue buscando la cadena en inglés. Esos atributos no se extraen.

<a id="locale-assets"></a>
## Imágenes y enlaces específicos de la configuración regional

Estos marcadores nunca se envían al traductor. `mark-html` no los añade.

- `data-i18n-locale-src` — simple: `chart.png` se convierte en `chart-pt-BR.png` (el código de configuración regional se inserta antes de la extensión). Con valor: el valor es una plantilla. [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) usa `chart_{locale}.png`, que se convierte en `chart_pt-BR.png`.
- `data-i18n-locale-href` — añade `?locale=` para que el enlace permanezca en el mismo archivo HTML.

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

La configuración regional de origen mantiene la URL original. Para un `data-i18n-locale-src` simple, las URL absolutas, las URL relativas al protocolo, las URL de `data:` y los fragmentos de `#` se dejan intactos; las cadenas de consulta y los fragmentos permanecen en su lugar. Un marcador con valor usa su plantilla para cada configuración regional que no sea la de origen y reemplaza solo `{locale}`. Si la imagen localizada da un error 404, el entorno de ejecución restaura la `src` original una vez. Usted mismo proporciona `chart_pt-BR.png`; el script no la crea.

`data-i18n-locale-href` es para este modelo de catálogo. Un enlace a `about.pt-BR.html` pertenece a la canalización de [páginas HTML](/es/guide/documents/html-pages).

<a id="language-selector"></a>
## Selector de idioma

Apunte `data-locale-select` a un `<select>` vacío. El entorno de ejecución rellena un `<option>` por cada fila de `ui-languages.json` (`code`, `label`, `englishName`, `direction`). Cambiar la selección llama a `setLocale`, que almacena la elección, actualiza `?locale=` con `history.pushState` (sin recargar), obtiene el paquete, reaplica cada marcador y establece `<html lang>` y `dir`. El botón Atrás reaplica la configuración regional en la URL.

`data-locale-list` hace lo mismo con los enlaces (`lang`, `hreflang` y `aria-current` en el activo). Esos enlaces cambian la página del catálogo; no son los enlaces por archivo escritos por la canalización de documentos. Una etiqueta de script puede establecer ambos selectores:

```html
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select" title="Switch UI language" data-i18n-title></select>
</label>
<nav id="locale-list"></nav>
<script
  src="i18n.js"
  data-source-locale="en"
  data-locales-base="./locales"
  data-locale-select="#locale-select"
  data-locale-list="#locale-list"
  data-label-mode="native"
></script>
```

Deje ambos controles vacíos. Para este manifiesto, `data-label-mode="native"` etiqueta el portugués como `Português (Brasil)`. `english` lo etiqueta como `Portuguese (Brazil)`. `both` lo etiqueta como `Portuguese (Brazil) / Português (Brasil)`, porque los dos nombres difieren, vea el siguiente fragmento de `ui-languages.json`:

```json
[
  {
    "code": "en",
    "label": "English",
    "englishName": "English",
    "direction": "ltr"
  },
  {
    "code": "pt-BR",
    "label": "Português (Brasil)",
    "englishName": "Portuguese (Brazil)",
    "direction": "ltr"
  }
]
```

Con `?locale=pt-BR`, el entorno de ejecución reemplaza las opciones del selector y los elementos secundarios de la lista. Los atributos que establezca en esos elementos se mantienen:

```html
<select id="locale-select" title="Switch UI language" data-i18n-title>
  <option value="en" lang="en">English</option>
  <option value="pt-BR" lang="pt-BR" selected>Português (Brasil)</option>
</select>
<nav id="locale-list">
  <a href="#" lang="en" hreflang="en">English</a>
  <a href="#" lang="pt-BR" hreflang="pt-BR" aria-current="true">Português (Brasil)</a>
</nav>
```

Una fila de `"direction": "rtl"` establece `dir="rtl"` en `<html>` cuando esa configuración regional está activa.

No realice redirecciones automáticas por `navigator.language` además de esto. El entorno de ejecución ya utiliza el idioma del navegador solo cuando la URL y `localStorage` no tienen opción. Una redirección que ignora la URL dificulta compartir una configuración regional y rastrear la página.

`ui-languages.json` es escrito por `extract` o `generate-ui-languages` en `languagesManifestPath` (por defecto `{ui.flatOutputDir}/ui-languages.json`). Consulte [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher).

<a id="troubleshooting"></a>
## Solución de problemas

| Síntoma | Qué comprobar |
| --- | --- |
| Los archivos de configuración regional no se cargan | Abra el sitio con un servidor local. `file://` bloquea `fetch`; el entorno de ejecución recurre al texto de origen. |
| Error 404 en `ui-languages.json` | `data-locales-base` es relativo a `i18n.js`. Debe coincidir con `flatOutputDir`. |
| Error 404 en `{locale}.json` | Ejecute `translate-ui` para esa configuración regional y compruebe que el código de configuración regional coincida exactamente con su nombre de archivo. |
| Las cadenas permanecen en inglés bajo `/docs/` | Mismo problema de ruta base. Evite una `/` inicial a menos que el directorio de configuraciones regionales esté en la raíz del host. |
| El inglés parpadea y luego se traduce | Añada `class="i18n-pending"` en `<html>` y la regla de visibilidad anterior. |
| El segundo cambio muestra la cadena traducida como clave | Cargue el `i18n.js` distribuido. Almacena `data-i18n-source` antes de reemplazar el texto. |
| El diseño RTL no se invierte | La fila del manifiesto necesita `"direction": "rtl"`. El entorno de ejecución establece `dir` solo en `<html>`. |
| Los nuevos nodos DOM permanecen en inglés | Llame a `window.i18n.apply()` después de insertarlos. |
| La imagen permanece `chart.png` en portugués | El elemento necesita `data-i18n-locale-src` y la configuración regional no debe ser la de origen. |

`normalizeI18nText` en el entorno de ejecución coincide con `normalizeI18nText` en [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts): recortar y luego contraer los espacios en blanco. Dado que el texto de origen en inglés es la clave del catálogo, una traducción faltante recurre al inglés.

La demostración ejecutable es [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). `pnpm dev` la sirve en [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR).

<a id="runtime-source"></a>
## Origen en tiempo de ejecución

```javascript
/* global document, window, localStorage, fetch, URLSearchParams, URL, history, navigator, PopStateEvent */
/**
 * Drop-in catalog runtime for plain HTML.
 *
 * Classic script (not a module) so `document.currentScript` is available.
 * Configure with data-* attributes on the script tag:
 *   data-source-locale, data-locales-base, data-storage-key,
 *   data-locale-select, data-locale-list, data-label-mode
 *
 * `data-locales-base` resolves against this script's URL, not the page URL.
 * Put class="i18n-pending" on <html> and hide the body while that class is set
 * to avoid a flash of source-locale text.
 */
(function () {
  "use strict";

  var TEXT_SOURCE_ATTR = "data-i18n-source";

  function runtimeScript() {
    if (document.currentScript) return document.currentScript;
    var marked = document.querySelectorAll(
      "script[data-ai-i18n-runtime], script[data-source-locale], script[data-locales-base]"
    );
    return marked.length > 0 ? marked[marked.length - 1] : null;
  }

  var scriptEl = runtimeScript();

  function attr(name, fallback) {
    if (!scriptEl) return fallback;
    var value = scriptEl.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  var SOURCE_LOCALE = attr("data-source-locale", "en");
  var LOCALES_BASE_ATTR = attr("data-locales-base", "./locales");
  var STORAGE_KEY = attr("data-storage-key", "ai-i18n-locale");
  var SELECT_SEL = attr("data-locale-select", "");
  var LIST_SEL = attr("data-locale-list", "");
  var LABEL_MODE = attr("data-label-mode", "native");

  function resolveLocalesBase() {
    var baseUrl = scriptEl && scriptEl.src ? scriptEl.src : window.location.href;
    return new URL(LOCALES_BASE_ATTR, baseUrl).href.replace(/\/$/, "");
  }

  var LOCALES_BASE = resolveLocalesBase();
  var I18N = { locale: SOURCE_LOCALE, dir: "ltr", bundle: {} };
  var languages = [];
  var titleKey = "";
  var selectBound = false;

  /**
   * Collapse insignificant whitespace. MUST stay identical to `normalizeI18nText`
   * in `src/extractors/html-i18n-marks.ts` and `src/dashboard-app/app.js`.
   */
  function normalizeI18nText(s) {
    return s.trim().replace(/\s+/g, " ");
  }

  function normalizeLocaleCode(code) {
    if (!code) return "";
    var parts = String(code).split("-");
    if (parts.length === 1) return parts[0].toLowerCase();
    return parts[0].toLowerCase() + "-" + parts.slice(1).join("-");
  }

  function isSourceLocale(locale) {
    return normalizeLocaleCode(locale) === normalizeLocaleCode(SOURCE_LOCALE);
  }

  function t(key) {
    var raw = I18N.bundle[key];
    return typeof raw === "string" && raw.length > 0 ? raw : key;
  }

  function findLanguage(code) {
    var norm = normalizeLocaleCode(code);
    for (var i = 0; i < languages.length; i++) {
      if (normalizeLocaleCode(languages[i].code) === norm) return languages[i];
    }
    return undefined;
  }

  function resolveLocale() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("locale");
    if (fromUrl) return fromUrl;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* private mode */
    }
    var browser = navigator.language || (navigator.languages && navigator.languages[0]) || SOURCE_LOCALE;
    var match = findLanguage(browser);
    return match ? match.code : SOURCE_LOCALE;
  }

  function loadJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      return res.ok ? res.json() : null;
    });
  }

  function labelFor(row) {
    var native = row.label || row.code;
    var english = row.englishName || native;
    if (LABEL_MODE === "english") return english;
    if (LABEL_MODE === "both") return english === native ? english : english + " / " + native;
    return native;
  }

  function sourceAttrName(attrName) {
    return attrName ? TEXT_SOURCE_ATTR + "-" + attrName : TEXT_SOURCE_ATTR;
  }

  function rememberKey(el, attrName, marker) {
    var stored = el.getAttribute(sourceAttrName(attrName));
    if (stored) return stored;
    var valued = el.getAttribute(marker);
    var key = valued
      ? valued
      : attrName
        ? normalizeI18nText(el.getAttribute(attrName) || "")
        : normalizeI18nText(el.textContent || "");
    if (key) el.setAttribute(sourceAttrName(attrName), key);
    return key;
  }

  function applyTextMarkers(selector, attrName, write) {
    var marker = attrName ? "data-i18n-" + attrName : "data-i18n";
    document.querySelectorAll(selector).forEach(function (el) {
      var key = rememberKey(el, attrName, marker);
      if (key) write(el, t(key));
    });
  }

  function isSkippableUrl(url) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
  }

  function withLocaleSuffix(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var hash = url.indexOf("#");
    var fragment = hash >= 0 ? url.slice(hash) : "";
    var pathQuery = hash >= 0 ? url.slice(0, hash) : url;
    var q = pathQuery.indexOf("?");
    var path = q >= 0 ? pathQuery.slice(0, q) : pathQuery;
    var query = q >= 0 ? pathQuery.slice(q) : "";
    return path.replace(/(\.[^./]+)$/, "-" + locale + "$1") + query + fragment;
  }

  function applyLocaleTemplate(template, locale) {
    return template.split("{locale}").join(locale);
  }

  function withLocaleQuery(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var next = new URL(url, window.location.href);
    next.searchParams.set("locale", locale);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return next.href;
    return next.pathname + next.search + next.hash;
  }

  function applyLocaleSrc() {
    document.querySelectorAll("[data-i18n-locale-src]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-src-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("src") || "";
        el.setAttribute(baseAttr, raw);
      }
      var valued = el.getAttribute("data-i18n-locale-src") || "";
      var next = raw;
      if (!isSourceLocale(I18N.locale)) {
        next = valued ? applyLocaleTemplate(valued, I18N.locale) : withLocaleSuffix(raw, I18N.locale);
      }
      if (next) el.setAttribute("src", next);
      if (el.tagName === "IMG" && !el.hasAttribute("data-i18n-src-fallback-bound")) {
        el.setAttribute("data-i18n-src-fallback-bound", "");
        el.addEventListener("error", function onErr() {
          var original = el.getAttribute(baseAttr);
          if (original && el.getAttribute("src") !== original) el.setAttribute("src", original);
          el.removeEventListener("error", onErr);
        });
      }
    });
  }

  function applyLocaleHref() {
    document.querySelectorAll("[data-i18n-locale-href]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-href-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("href") || "";
        el.setAttribute(baseAttr, raw);
      }
      el.setAttribute("href", isSourceLocale(I18N.locale) ? raw : withLocaleQuery(raw, I18N.locale));
    });
  }

  function applyStaticI18n() {
    applyTextMarkers("[data-i18n]", "", function (el, text) {
      el.textContent = text;
    });
    applyTextMarkers("[data-i18n-title]", "title", function (el, text) {
      el.setAttribute("title", text);
    });
    applyTextMarkers("[data-i18n-placeholder]", "placeholder", function (el, text) {
      el.setAttribute("placeholder", text);
    });
    applyTextMarkers("[data-i18n-alt]", "alt", function (el, text) {
      el.setAttribute("alt", text);
    });
    applyTextMarkers("[data-i18n-aria-label]", "aria-label", function (el, text) {
      el.setAttribute("aria-label", text);
    });
    applyLocaleSrc();
    applyLocaleHref();
    if (titleKey) document.title = t(titleKey);
  }

  function fillSelect(select) {
    var previous = select.value;
    select.replaceChildren();
    languages.forEach(function (row) {
      var opt = document.createElement("option");
      opt.value = row.code;
      opt.textContent = labelFor(row);
      opt.lang = row.code;
      if (normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale)) opt.selected = true;
      select.appendChild(opt);
    });
    if (!select.value && previous) select.value = previous;
    if (!selectBound) {
      selectBound = true;
      select.addEventListener("change", function () {
        void setLocale(select.value);
      });
    }
  }

  function fillList(list) {
    list.replaceChildren();
    languages.forEach(function (row) {
      var link = document.createElement("a");
      link.href = "#";
      link.textContent = labelFor(row);
      link.lang = row.code;
      link.hreflang = row.code;
      var active = normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale);
      if (active) link.setAttribute("aria-current", "true");
      link.addEventListener("click", function (event) {
        event.preventDefault();
        void setLocale(row.code);
      });
      list.appendChild(link);
    });
  }

  function renderSelectors() {
    if (SELECT_SEL) {
      var select = document.querySelector(SELECT_SEL);
      if (select) fillSelect(select);
    }
    if (LIST_SEL) {
      var list = document.querySelector(LIST_SEL);
      if (list) fillList(list);
    }
  }

  function syncUrl(locale) {
    var url = new URL(window.location.href);
    if (isSourceLocale(locale)) url.searchParams.delete("locale");
    else url.searchParams.set("locale", locale);
    history.pushState({ locale: locale }, "", url.pathname + url.search + url.hash);
  }

  function setLocale(code, opts) {
    var push = !opts || opts.push !== false;
    I18N.locale = code;
    var langRow = findLanguage(code);
    I18N.dir = langRow && langRow.direction === "rtl" ? "rtl" : "ltr";
    var bundlePromise = isSourceLocale(code)
      ? Promise.resolve(null)
      : loadJson(LOCALES_BASE + "/" + encodeURIComponent(code) + ".json");
    return bundlePromise.then(function (bundle) {
      I18N.bundle = bundle && typeof bundle === "object" && !Array.isArray(bundle) ? bundle : {};
      document.documentElement.setAttribute("lang", (langRow && langRow.code) || code);
      document.documentElement.setAttribute("dir", I18N.dir);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* private mode */
      }
      applyStaticI18n();
      renderSelectors();
      if (push) syncUrl(code);
      document.documentElement.classList.remove("i18n-pending");
    });
  }

  function onPopState() {
    var params = new URLSearchParams(window.location.search);
    void setLocale(params.get("locale") || SOURCE_LOCALE, { push: false });
  }

  if (window.__aiI18nPop) window.removeEventListener("popstate", window.__aiI18nPop);
  window.__aiI18nPop = onPopState;
  window.addEventListener("popstate", onPopState);

  function captureTitleKey() {
    var titleEl = document.querySelector("title");
    if (!titleEl) {
      titleKey = normalizeI18nText(document.title || "");
      return;
    }
    titleKey =
      titleEl.getAttribute(TEXT_SOURCE_ATTR) ||
      titleEl.getAttribute("data-i18n") ||
      normalizeI18nText(titleEl.textContent || "");
    if (titleKey) titleEl.setAttribute(TEXT_SOURCE_ATTR, titleKey);
  }

  function initI18n() {
    document.documentElement.classList.add("i18n-pending");
    captureTitleKey();
    return loadJson(LOCALES_BASE + "/ui-languages.json").then(function (manifest) {
      languages = Array.isArray(manifest) ? manifest : [];
      return setLocale(resolveLocale(), { push: false });
    });
  }

  var ready = initI18n().catch(function () {
    applyStaticI18n();
    document.documentElement.classList.remove("i18n-pending");
  });

  window.i18n = {
    t: t,
    get locale() {
      return I18N.locale;
    },
    get dir() {
      return I18N.dir;
    },
    apply: applyStaticI18n,
    setLocale: function (code) {
      return setLocale(code);
    },
    ready: ready,
  };
})();
```
