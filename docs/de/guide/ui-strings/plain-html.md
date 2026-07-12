<a id="plain-html-apps"></a>
# Reine HTML-Apps

<a id="marking-html-for-translation"></a>
## HTML zur Übersetzung markieren

Für reine HTML-Anwendungen (ohne `t("…")`-Aufrufe im Markup) markieren Sie übersetzbare Elemente mit Attributen und lassen `extract` den englischen Text aus dem Element selbst erfassen – keine doppelten String-Literale.

Bevorzugen Sie die einfache Form (das Attribut hat keinen Wert; der Quelltext wird aus dem Element gelesen):

- `data-i18n` – Schlüssel ist der `textContent` des Elements; zur Laufzeit setzen Sie `el.textContent = t(key)`.
- `data-i18n-title` – Schlüssel ist der `title` des Elements; zur Laufzeit setzen Sie die übersetzte `title`.
- `data-i18n-placeholder` – Schlüssel ist der `placeholder` des Elements.

Verwenden Sie die Form mit Wert `data-i18n="Some key"` nur, wenn die einfache Form nicht funktioniert: Elemente mit gemischtem Inhalt (Text, der mit Kind-Tags verschachtelt ist) oder wenn der Schlüssel vom sichtbaren Text abweichen muss. Opten Sie ein Element (und seinen Unterbaum) mit `data-i18n-ignore` aus.

Einschränkung: Die einfache Form `data-i18n` ist nur für Blatt-Textelemente gedacht (ein einzelner Textknoten, keine Kindelemente), da das Setzen von `textContent` alle Kindelemente ersetzt. Für einen Absatz wie `Run <code>build</code> now.` umschließen Sie stattdessen jede Textpassage in ihrer eigenen Markierung:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Fügen Sie die Markierungen manuell hinzu oder lassen Sie den Befehl `mark-html` die einfachen Markierungen für Sie einfügen. Standardmäßig ist es ein Trockenlauf – es meldet, wie viele Markierungen pro Datei hinzugefügt würden, und listet alle Elemente mit gemischtem Inhalt auf, die eine manuelle `<span data-i18n>` benötigen – und schreibt nur mit `--write`:

```bash
# Preview (no changes written)
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
```

`mark-html` ist idempotent, beachtet `data-i18n-ignore`, markiert niemals codeähnliche Elemente (`code`, `pre`, `kbd`, `samp`, `var`) oder leere / nur numerische Texte und gibt niemals eine Markierung mit Wert aus. Nach dem Markieren umschließen Sie alle gemeldeten Fragmente mit gemischtem Inhalt manuell und fügen dann `.html` zu `ui.uiExtractor.extensions` hinzu, damit `extract` die Strings erfasst:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app"></a>
## Praxisbeispiel: Lokalisierung einer einfachen HTML-App

Das Beispiel des [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/)-Arbeitsbereichs ist eine ausführbare statische App, die diese Marker durchgängig verwendet. Klonen Sie es mit `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html`, führen Sie `pnpm install` und `pnpm dev` aus und öffnen Sie dann [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) für Portugiesisch (Brasilien).

Ihr `public/index.html` enthält einfache Marker wie:

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

`ai-i18n-tools.config.json` richtet die Extraktion auf `public/` aus und schreibt flache Bundles neben die statischen Dateien:

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

`extract` schreibt jeden englischen Quellstring in den Katalog (`public/strings.json`), und `translate-ui` füllt ein flaches Bundle pro Gebietsschema, das durch den englischen Quelltext gekennzeichnet ist:

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

Zur Laufzeit lädt `public/app.js` `/locales/ui-languages.json` für Gebietsschema-Metadaten, löst das aktive Gebietsschema auf (`?locale=` → `localStorage` → Browser → `en`), ruft `/locales/{locale}.json` ab (für Englisch übersprungen) und durchläuft dann die markierten Elemente. Der Schlüssel stammt, falls vorhanden, aus dem Markerwert, andernfalls aus dem eigenen Text/Titel/Platzhalter des Elements (auf die gleiche Weise normalisiert, wie der Extraktor Leerzeichen normalisiert):

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

`normalizeI18nText` muss in [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) identisch mit `normalizeI18nText` bleiben. Da der englische Quelltext der Katalogschlüssel ist, fallen nicht übersetzte Zeichenfolgen automatisch auf Englisch zurück.

Das gebündelte [Übersetzungs-Dashboard](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) verwendet denselben `applyStaticI18n`-Algorithmus für seine HTML-Marker, liefert jedoch Gebietsschema-Bundles von `GET /api/ui-i18n` anstelle von statischen `/locales/{locale}.json`-Dateien. Im [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) des Beispiels finden Sie den vollständigen Workflow, das Projektlayout und eine Vergleichstabelle.
