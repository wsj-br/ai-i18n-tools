<a id="plain-html-apps"></a>
# Aplicaciones HTML simples

<a id="marking-html-for-translation"></a>
## Marcar HTML para traducción

Para aplicaciones HTML sencillas (sin llamadas `t("…")` en el marcado), marque los elementos traducibles con atributos y deje que `extract` capture el texto en inglés del propio elemento; no hay literales de cadena duplicados.

Prefiera la forma desnuda (el atributo no tiene valor; el texto fuente se lee del elemento):

- `data-i18n` — la clave es el `textContent` del elemento; en tiempo de ejecución, establezca `el.textContent = t(key)`.
- `data-i18n-title` — la clave es el `title` del elemento; en tiempo de ejecución, establezca el `title` traducido.
- `data-i18n-placeholder` — la clave es el `placeholder` del elemento.

Utilice la forma con valor `data-i18n="Some key"` solo cuando la forma desnuda no pueda funcionar: elementos de contenido mixto (texto intercalado con etiquetas secundarias), o cuando la clave deba ser diferente del texto visible. Excluya un elemento (y su subárbol) con `data-i18n-ignore`.

Restricción: la forma desnuda `data-i18n` es solo para elementos de texto hoja (un solo nodo de texto, sin elementos secundarios), ya que el establecimiento de `textContent` reemplaza a cualquier hijo. Para un párrafo como `Run <code>build</code> now.`, envuelva cada fragmento de texto en su propio marcador en su lugar:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Añada los marcadores manualmente, o deje que el comando `mark-html` inserte los marcadores desnudos por usted. Es una ejecución de prueba por defecto: informa cuántos marcadores añadiría por archivo y enumera cualquier elemento de contenido mixto que necesite un `<span data-i18n>` manual; solo escribe con `--write`:

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html` es idempotente, respeta `data-i18n-ignore`, nunca marca elementos similares a código (`code`, `pre`, `kbd`, `samp`, `var`) ni texto vacío/solo numérico, y nunca emite un marcador con valor. Después de marcar, envuelva manualmente cualquier fragmento de contenido mixto reportado, luego añada `.html` a `ui.uiExtractor.extensions` para que `extract` capture las cadenas:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## Ejemplo práctico: localización de una aplicación HTML simple (el panel de control incluido)

El propio panel de traducción del paquete (`src/dashboard-app`) utiliza estos mismos marcadores. Su `index.html` contiene marcadores simples como:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` escribe cada cadena de origen en inglés en el catálogo (`strings.json`), y `translate-ui` rellena un paquete plano por cada idioma, indexado por el texto de origen en inglés. Para una aplicación HTML estática típica, apuntaría `ui.flatOutputDir` a un directorio servido por la web, como `public/locales/`:

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

En tiempo de ejecución, cargue el paquete del idioma activo y recorra los elementos marcados. La clave proviene del valor del marcador cuando está presente, de lo contrario, del propio texto/título/marcador de posición del elemento (normalizado de la misma manera que el extractor normaliza los espacios en blanco):

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

La mitad de este fragmento que recorre los marcadores es exactamente `applyStaticI18n` en [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js). Dado que el texto fuente en inglés es la clave del catálogo, las cadenas sin traducir vuelven automáticamente al inglés.

En qué se diferencia el panel de control incluido: como tiene un servidor Node, no obtiene un `/locales/{locale}.json` estático. El cliente llama a `GET /api/ui-i18n`, y el servidor resuelve la configuración regional activa (`--ui-lang` > `AI_I18N_LANG` > configuración `uiLanguage` > sistema operativo del host) y devuelve `{ locale, dir, bundle }`. Luego, el cliente establece `document.documentElement` `lang`/`dir` a partir de esa respuesta (en lugar de leer `lang` para elegir la configuración regional) antes de llamar a `applyStaticI18n`. Los paquetes en sí no son el contenido de la herramienta que se está traduciendo, son las cadenas de la interfaz de usuario del propio panel de control, enviadas en `src/i18n/locales/{locale}.json` (copiadas a `dist/i18n/locales` en la compilación) y leídas en el lado del servidor por `loadUiBundle` en [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts). El `t()` del panel de control también admite la interpolación ```{{name}}```, a diferencia del `t` mínimo anterior.
