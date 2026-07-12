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
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app"></a>
## Ejemplo práctico: localización de una aplicación HTML sencilla

El ejemplo de espacio de trabajo [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) es una aplicación estática ejecutable que utiliza estos marcadores de principio a fin. Clónelo con `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html`, ejecute `pnpm install` y `pnpm dev`, luego abra [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) para portugués (Brasil).

Su `public/index.html` contiene marcadores simples como:

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json` dirige la extracción a `public/` y escribe paquetes planos junto a los archivos estáticos:

```jsonc
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

`extract` escribe cada cadena de origen en inglés en el catálogo (`public/strings.json`), y `translate-ui` rellena un paquete plano por cada configuración regional, con la cadena de origen en inglés como clave:

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

En tiempo de ejecución, `public/app.js` carga `/locales/ui-languages.json` para los metadatos de la configuración regional, resuelve la configuración regional activa (`?locale=` → `localStorage` → navegador → `en`), obtiene `/locales/{locale}.json` (omitido para inglés), luego recorre los elementos marcados. La clave proviene del valor del marcador cuando está presente, de lo contrario, del propio texto/título/marcador de posición del elemento (normalizado de la misma manera que el extractor normaliza los espacios en blanco):

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText` debe permanecer idéntico a `normalizeI18nText` en [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts). Debido a que el texto fuente en inglés es la clave del catálogo, las cadenas no traducidas vuelven automáticamente al inglés.

El [Panel de control de traducción](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) incluido utiliza el mismo algoritmo `applyStaticI18n` para sus marcadores HTML, pero sirve paquetes de configuración regional desde `GET /api/ui-i18n` en lugar de archivos estáticos `/locales/{locale}.json`. Consulte el [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) del ejemplo para ver el flujo de trabajo completo, el diseño del proyecto y la tabla comparativa.
