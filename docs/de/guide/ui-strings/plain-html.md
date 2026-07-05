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
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## Praxisbeispiel: Lokalisierung einer reinen HTML-App (das gebündelte Dashboard)

Das eigene Translation Dashboard (`src/dashboard-app`) des Pakets verwendet dieselben Marker. Sein `index.html` enthält reine Marker wie:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` schreibt jede englische Quellzeichenkette in den Katalog (`strings.json`) und `translate-ui` füllt ein flaches Bundle pro Gebietsschema, das nach dem englischen Quelltext benannt ist. Für eine typische statische HTML-App würden Sie `ui.flatOutputDir` auf ein Web-vernetztes Verzeichnis wie `public/locales/` verweisen:

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

Laden Sie zur Laufzeit das Bundle für das aktive Gebietsschema und durchlaufen Sie die markierten Elemente. Der Schlüssel stammt aus dem Markierungswert, wenn vorhanden, andernfalls aus dem eigenen Text/Titel/Platzhalter des Elements (normalisiert auf die gleiche Weise, wie der Extraktor Leerzeichen normalisiert):

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

Die Marker-Walking-Hälfte dieses Snippets ist genau `applyStaticI18n` in [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js). Da der englische Quelltext der Katalogschlüssel ist, fallen nicht übersetzte Zeichenfolgen automatisch auf Englisch zurück.

Wie sich das gebündelte Dashboard unterscheidet: Da es einen Node-Server hat, ruft es keine statische `/locales/{locale}.json` ab. Der Client ruft `GET /api/ui-i18n` auf, und der Server löst das aktive Gebietsschema auf (`--ui-lang` > `AI_I18N_LANG` > Konfiguration `uiLanguage` > Host-Betriebssystem) und gibt `{ locale, dir, bundle }` zurück. Der Client setzt dann `document.documentElement` `lang`/`dir` aus dieser Antwort (anstatt `lang` zu lesen, um das Gebietsschema auszuwählen), bevor er `applyStaticI18n` aufruft. Die Bundles selbst sind nicht der zu übersetzende Inhalt des Tools – es sind die eigenen UI-Zeichenfolgen des Dashboards, die in `src/i18n/locales/{locale}.json` (beim Build nach `dist/i18n/locales` kopiert) ausgeliefert und serverseitig von `loadUiBundle` in [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts) gelesen werden. Das `t()` des Dashboards unterstützt auch die ```{{name}}```-Interpolation, im Gegensatz zum minimalen `t` oben.
