<a id="plain-html-apps"></a>
# Reine HTML-Apps

Verwenden Sie diesen Pfad für eine interaktive Seite, die in einer einzigen HTML-Datei verbleibt. `extract` liest `data-i18n*`-Marker in `strings.json` ein, `translate-ui` schreibt ein flaches JSON-Bundle pro Locale, und ein Browser-Skript wendet die Zeichenfolgen an. Dasselbe Skript kann Suffixe an Bilddateinamen anhängen und Links auf der aktuellen Seite belassen.

Für eine statische Website, die pro Locale eine übersetzte HTML-Datei ausgeben soll (keine Laufzeitumgebung, neu geschriebene seitenübergreifende Links), verwenden Sie stattdessen [HTML-Seiten](/de/guide/documents/html-pages). Eine Datei gehört zu einem Pfad.

<a id="quick-start"></a>
## Schnellstart

1. Projektgerüst mit `ai-i18n-tools init -t ui-plain-html` erstellen oder die folgende Konfiguration hinzufügen.
2. Quell-HTML auszeichnen (oder dies `mark-html` überlassen).
3. `ui.sourceRoots` und `ui.uiExtractor.extensions` auf diese Dateien verweisen lassen.
4. `extract` ausführen, danach `translate-ui` (oder beides mit `sync-ui` ausführen).
5. `i18n.js` neben die Seite kopieren und vor dem eigenen Skript laden.
6. Den Ordner über HTTP bereitstellen. `file://` kann die Locale-JSON nicht `fetch`.

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

Beispiel für `ai-i18n-tools.config.json`:

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

Das Projektgerüst fügt zudem die von `translate-ui` verwendete LLM-[Provider-Konfiguration](/de/guide/providers-and-models) hinzu; diese wurde oben weggelassen, um die HTML-spezifischen Einstellungen übersichtlich zu halten.

`extract` verwaltet `strings.json` und schreibt `ui-languages.json`; `translate-ui` verwaltet die JSON-Dateien der Ziel-Locales. Bearbeiten Sie diese generierten Dateien nicht manuell.

In `flatOutputDir` werden die generierten Locale-Dateien gespeichert. Das `data-locales-base` des Skripts muss als URL relativ zu `i18n.js` (nicht zur Seite) auf dieses Verzeichnis verweisen. Eine Basis von `./locales` auf `public/i18n.js` lädt `public/locales/pt-BR.json`. Verwenden Sie eine relative Basis, damit die Website auch unter einem Bereitstellungs-Subpfad weiterhin funktioniert.

<a id="obtain-the-runtime"></a>
## Laufzeitumgebung beziehen

`i18n.js` ist ein klassisches Skript (kein Modul). Kopieren Sie eines davon; es ist dieselbe Datei:

- `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` nach der Installation des Pakets
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- das Listing unter [Laufzeitquellcode](#runtime-source)

Laden Sie es am Ende von `<body>`, dann Ihr eigenes Skript. Setzen Sie `class="i18n-pending"` auf `<html>` und blenden Sie den Body aus, während diese Klasse gesetzt ist, damit die Ausgangssprache nicht aufblitzt:

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

Passen Sie die Skriptattribute an Ihre Anforderungen an:

| Attribut | Standard | Rolle |
| --- | --- | --- |
| `data-source-locale` | `en` | Locale, die das englische HTML beibehält und das Abrufen des Bundles überspringt |
| `data-locales-base` | `./locales` | Verzeichnis von `ui-languages.json` und `{locale}.json`, aufgelöst gegen die Skript-URL |
| `data-storage-key` | `ai-i18n-locale` | `localStorage`-Schlüssel |
| `data-locale-select` | (keine) | CSS-Selektor eines `<select>`, der aus dem Manifest gefüllt werden soll |
| `data-locale-list` | (keine) | CSS-Selektor eines Elements, das mit Sprachlinks gefüllt werden soll |
| `data-label-mode` | `native` | `native` (Manifest-`label`), `english` (`englishName`) oder `both` (`englishName / label`, wenn sie sich unterscheiden) |

`window.i18n` stellt `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)` und `ready` (ein Promise) bereit. Warten Sie auf `ready`, bevor Ihr eigenes Skript von der aufgelösten Locale oder den übersetzten Werten abhängt. Rufen Sie `apply()` auf, nachdem Sie neue ausgezeichnete Elemente eingefügt haben.

<a id="marking-html-for-translation"></a>
## HTML zur Übersetzung markieren

Bevorzugen Sie einfache Marker. Der englische Quelltext verbleibt auf dem Element und dient als Katalogschlüssel. `extract` liest ihn; die Runtime schreibt die Übersetzung zurück in dieselbe Eigenschaft.

- `data-i18n` — Schlüssel ist `textContent`. Die Laufzeitumgebung setzt `textContent`.
- `data-i18n-title` — Schlüssel ist `title`.
- `data-i18n-placeholder` — Schlüssel ist `placeholder`.
- `data-i18n-alt` — Schlüssel ist `alt`.
- `data-i18n-aria-label` — Schlüssel ist `aria-label`.

Ein Element kann mehrere dieser Marker tragen. Jeder Marker ist ein eigener Katalogeintrag.

### Text

Setzen Sie `data-i18n` auf ein Element, dessen Inhalt ausschließlich Text ist:

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

Die Runtime setzt zudem `document.title` basierend auf dem `<title>`-Element. Verwenden Sie `data-i18n` nicht bei einem Container mit gemischtem Inhalt: Die Runtime weist `textContent` zu, wodurch dessen Kindelemente entfernt würden.

### Tooltip

```html
<select title="Filter by locale" data-i18n-title></select>
```

Ein Steuerelement kann seine Beschriftung und seinen Tooltip als zwei Schlüssel übersetzen:

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

### Platzhalter

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

Platzhalter und Tooltip für dasselbe Feld:

```html
<input
  type="text"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-placeholder
  data-i18n-title
/>
```

### Alt-Text

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

### Barrierefreier Name

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

Die Schaltflächenbeschriftung `×` hat kein `data-i18n`, daher bleibt sie unverändert. Der barrierefreie Name ist der String, der übersetzt wird.

### Gemischter Inhalt

`data-i18n` liest den gesamten `textContent` des Elements. Wenn ein Satz sein übergeordnetes Element mit einem anderen Element teilt, umschließen Sie jeden Textabschnitt:

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

### Nur Quellsprache

`data-i18n-ignore` überspringt dieses Element und seine untergeordneten Elemente sowohl für `mark-html` als auch für UI-String-`extract`. Verwenden Sie dies für Beispielzeilen, Bezeichner und Markennamen:

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

### Ein anderer Katalogschlüssel

Ein Marker mit Wert benennt den Katalogschlüssel. Die Laufzeitumgebung schreibt die Übersetzung weiterhin in das Element (oder in das benannte Attribut):

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html` fügt die obigen Marker ohne Wert ein. Es ist ein Probelauf, sofern Sie nicht `--write` übergeben. Es überspringt `data-i18n-ignore`-Teilbäume, codeähnliche Elemente (`code`, `pre`, `kbd`, `samp`, `var`) sowie leeren oder rein numerischen Text. Es meldet übergeordnete Elemente mit gemischtem Inhalt und überlässt es Ihnen, diese in `<span data-i18n>` einzuschließen. Es schreibt niemals einen Marker mit Wert.

Die Laufzeitumgebung zeichnet bei der ersten Ausführung jeden Quellschlüssel in einem internen `data-i18n-source`-Attribut auf, sodass bei einem späteren Wechsel der Locale weiterhin die englische Zeichenfolge nachgeschlagen wird. Diese Attribute werden nicht extrahiert.

<a id="locale-assets"></a>
## Locale-spezifische Bilder und Links

Diese Marker werden niemals an den Übersetzer gesendet. `mark-html` fügt sie nicht hinzu.

- `data-i18n-locale-src` — ohne Wert: `chart.png` wird zu `chart-pt-BR.png` (der Locale-Code wird vor der Erweiterung eingefügt). Mit Wert: Der Wert ist eine Vorlage. [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) verwendet `chart_{locale}.png`, was zu `chart_pt-BR.png` wird.
- `data-i18n-locale-href` — hängt `?locale=` an, damit der Link in derselben HTML-Datei bleibt.

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

Die Quell-Locale behält die ursprüngliche URL. Bei einem `data-i18n-locale-src` ohne Wert werden absolute URLs, protokollrelative URLs, `data:`-URLs und `#`-Fragmente unverändert gelassen; Query-Strings und Fragmente bleiben an Ort und Stelle. Ein Marker mit Wert verwendet seine Vorlage für jede Nicht-Quell-Locale und ersetzt nur `{locale}`. Wenn das lokalisierte Bild einen 404-Fehler zurückgibt, stellt die Laufzeitumgebung das ursprüngliche `src` einmalig wieder her. Sie liefern `chart_pt-BR.png` selbst aus; das Skript erstellt es nicht.

`data-i18n-locale-href` ist für dieses Katalogmodell. Ein Link zu `about.pt-BR.html` gehört zur Pipeline für [HTML-Seiten](/de/guide/documents/html-pages).

<a id="language-selector"></a>
## Sprachauswahl

Verweisen Sie mit `data-locale-select` auf ein leeres `<select>`. Die Laufzeitumgebung füllt ein `<option>` pro Zeile von `ui-languages.json` (`code`, `label`, `englishName`, `direction`). Das Ändern der Auswahl ruft `setLocale` auf, was die Auswahl speichert, `?locale=` mit `history.pushState` aktualisiert (ohne Neuladen), das Bundle abruft, jeden Marker erneut anwendet und `<html lang>` sowie `dir` setzt. Die Zurück-Schaltfläche wendet die Locale in der URL erneut an.

`data-locale-list` macht dasselbe mit Links (`lang`, `hreflang` und `aria-current` auf dem aktiven Link). Diese Links wechseln die Katalogseite; es sind nicht die dateispezifischen Links, die von der Dokument-Pipeline geschrieben werden. Ein Script-Tag kann beide Selektoren festlegen:

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

Lassen Sie beide Steuerelemente leer. Für dieses Manifest bezeichnet `data-label-mode="native"` Portugiesisch als `Português (Brasil)`. `english` bezeichnet es als `Portuguese (Brazil)`. `both` bezeichnet es als `Portuguese (Brazil) / Português (Brasil)`, da die beiden Namen unterschiedlich sind, siehe den folgenden Ausschnitt aus `ui-languages.json`:

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

Mit `?locale=pt-BR` ersetzt die Laufzeitumgebung die Optionen des Select-Elements und die untergeordneten Elemente der Liste. Attribute, die Sie für diese Elemente festlegen, bleiben erhalten:

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

Eine `"direction": "rtl"`-Zeile setzt `dir="rtl"` auf `<html>`, wenn diese Locale aktiv ist.

Richten Sie darüber hinaus keine automatische Weiterleitung per `navigator.language` ein. Die Laufzeitumgebung verwendet die Browsersprache ohnehin nur dann, wenn URL und `localStorage` keine Auswahl vorgeben. Eine Weiterleitung, die die URL ignoriert, erschwert das Teilen einer Locale und das Crawlen der Seite.

`ui-languages.json` wird von `extract` oder `generate-ui-languages` nach `languagesManifestPath` geschrieben (Standard `{ui.flatOutputDir}/ui-languages.json`). Siehe [Sprachumschalter & RTL](/de/guide/ui-strings/language-switcher).

<a id="troubleshooting"></a>
## Fehlerbehebung

| Symptom | Was zu prüfen ist |
| --- | --- |
| Locale-Dateien werden nicht geladen | Öffnen Sie die Website mit einem lokalen Server. `file://` blockiert `fetch`; die Laufzeitumgebung greift auf den Quelltext zurück. |
| 404 bei `ui-languages.json` | `data-locales-base` ist relativ zu `i18n.js`. Es muss mit `flatOutputDir` übereinstimmen. |
| 404 bei `{locale}.json` | Führen Sie `translate-ui` für diese Locale aus und prüfen Sie, ob der Locale-Code exakt mit dem Dateinamen übereinstimmt. |
| Strings bleiben unter `/docs/` englisch | Dasselbe Problem mit dem Basispfad. Vermeiden Sie ein führendes `/`, es sei denn, das Locale-Verzeichnis befindet sich im Host-Stammverzeichnis. |
| Englisch flackert kurz auf, dann wird übersetzt | Fügen Sie `class="i18n-pending"` auf `<html>` und die obige Sichtbarkeitsregel hinzu. |
| Zweiter Wechsel zeigt den übersetzten String als Schlüssel | Laden Sie das mitgelieferte `i18n.js`. Es speichert `data-i18n-source`, bevor der Text ersetzt wird. |
| RTL-Layout spiegelt nicht | Die Manifest-Zeile benötigt `"direction": "rtl"`. Die Laufzeitumgebung setzt `dir` nur auf `<html>`. |
| Neue DOM-Knoten bleiben englisch | Rufen Sie `window.i18n.apply()` auf, nachdem Sie sie eingefügt haben. |
| Bild bleibt auf Portugiesisch `chart.png` | Das Element benötigt `data-i18n-locale-src`, und die Locale darf nicht die Quell-Locale sein. |

`normalizeI18nText` in der Laufzeit entspricht `normalizeI18nText` in [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts): trimmen, dann Leerzeichen zusammenfassen. Da der englische Quelltext der Katalogschlüssel ist, erfolgt bei fehlender Übersetzung ein Fallback auf Englisch.

Die ausführbare Demo ist [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). `pnpm dev` stellt sie unter [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) bereit.

<a id="runtime-source"></a>
## Laufzeitquelle

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
