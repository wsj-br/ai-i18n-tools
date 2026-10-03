<a id="html-pages"></a>
# HTML-Seiten

`translate-docs` kann eine HTML-Datei pro Locale ausgeben. Platzieren Sie `.html`- oder `.htm`-Dateien in einem `docs[]` `contentPaths`-Eintrag und führen Sie `translate-docs` oder `sync` aus. Die englische Datei bleibt die Quelle. Locale-Kopien werden unter `outputDir` geschrieben.

Verwenden Sie dies, wenn jede Sprache eine eigene Seite darstellt (eine statische Website, eine Sammlung manuell erstellter HTML-Dokumente). Verwenden Sie [Einfache HTML-Apps](/de/guide/ui-strings/plain-html), wenn eine einzelne HTML-Datei unverändert bleibt und der Browser die Zeichenfolgen aus flachem JSON austauscht.

Grundgerüst erstellen mit:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

Die ausführbare Demo ist [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) (Port 3092).

<a id="what-is-translated"></a>
## Was übersetzt wird

Übersetzt: sichtbarer Text, `alt`, `title`, `aria-label`, `placeholder`, `<title>`, `meta name="description"` und `og:title` / `og:description`.

Unverändert bleiben: Elemente wie `script`, `style`, `textarea`, `pre` und `code` sowie `src`, `href` und andere URLs. Ein Absatz, der `<code>` oder `<em>` enthält, behält diese Tags bei und übersetzt die umgebenden Wörter.

`html lang` und `dir` werden in der Locale-Datei festgelegt. Die englische Quelle behält ihr eigenes `lang` bei, bis Sie es ändern.

Generierte Locale-Dateien werden beim nächsten Durchlauf übersprungen, wenn sie sich unter `outputDir` befinden (ein `pt-BR/`-Verzeichnis oder eine flache `name.pt-BR.html`). Eine Warnung wird ausgegeben, wenn dieselbe `.html`-Datei auch als UI-Katalogquelle dient (`ui.sourceRoots`).

<a id="links-and-images"></a>
## Links und Bilder

Links zu anderen HTML-Seiten im selben `docs[]`-Block werden in die Locale-Ausgabe dieser Seite umgeschrieben. Andere relative URLs werden mit einem Präfix versehen, damit sie weiterhin von der Locale-Datei aus aufgelöst werden.

`docsOutput.localizedAssets` benennt Bilder und Symbole optional um, wenn eine localesspezifische Datei vorhanden ist. CSS `url()` wird nicht umgeschrieben.

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| Platzhalter | Bedeutung |
| --- | --- |
| `{stem}` | Dateiname ohne Erweiterung |
| `{ext}` | Erweiterung, einschließlich des Punktes |
| `{basename}` | Dateiname mit Erweiterung |
| `{locale}` | Locale-Code wie konfiguriert (`pt-BR`) |
| `{llocale}` | Locale in Kleinbuchstaben |
| `{LOCALE}` | Locale in Großbuchstaben |

`img/trulli.jpg` mit dem obigen Muster wird zu `img/trulli-pt-BR.jpg`. Bei `onlyIfExists: true` (der Standardeinstellung) wird die ursprüngliche URL beibehalten, wenn die entsprechende Datei fehlt. Absolute URLs, `data:`-URLs und `#`-Fragmente werden übersprungen. Root-relative URLs (`/img/trulli.jpg`) werden unter `assetRoot` geprüft oder im Verzeichnis der HTML-Datei, wenn `assetRoot` weggelassen wird.

`srcset`, `poster`, `<source src>`, Icon-`<link>`-URLs und `og:image` / `twitter:image` folgen denselben Regeln.

Bei HTML wird `docsOutput.docsRoot` aus dem projektrelativen Pfad entfernt, bevor der Locale-Ordner hinzugefügt wird. Bei `docsRoot: "site"` und `style: "nested"` wird `site/index.html` in `site/pt-BR/index.html` geschrieben.

<a id="language-list-and-hreflang"></a>
## Sprachliste und hreflang

Zwei Kommentarpaare werden in jede Locale-Kopie und in die englische Quelle eingefügt (damit die Alternativen reziprok bleiben):

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

Marker in `script`, `style`, `pre` und `code` werden ignoriert. Ein ausführlicher Durchlauf warnt, wenn eine Seite kein Paar hat. Dieselben Kommentare sind die Standardwerte, wenn `docsOutput.html` weggelassen wird.

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"` schreibt `<a>`-Elemente. Innerhalb eines `<ul>`, `<ol>` oder `<nav>` wird jeder Link in `<li>` eingeschlossen. `format: "select"` schreibt `<option>`-Zeilen. Platzieren Sie die Marker in Ihrem eigenen `<select data-lang-select>` und laden Sie `lang-select.js` (mitgeliefert als `ai-i18n-tools/html-runtime/lang-select.js` und im Beispiel kopiert). Ein Block verwendet ein Format.

`label` ist `local` (Endonym), `english` oder `both` (`English / endonym`, wenn sie sich unterscheiden). Locales, die nicht im konfigurierten Satz enthalten sind, werden weggelassen.

`hreflang.siteUrl` stellt alternativen Links ein Präfix voran. Wenn es nicht gesetzt ist, sind die Links relativ und es wird eine Warnung protokolliert. `xDefault` hat standardmäßig den Wert `sourceLocale`. `stripIndexHtml` wandelt `index.html` in eine Verzeichnis-URL um.

Es gibt keine Sitemap-Datei, keine automatische `<head>`-Injection und kein `canonical`- oder `og:locale`-Rewrite. Die Browsersprache leitet den Besucher nicht um.

<a id="second-run"></a>
## Zweiter Durchlauf

Satzübersetzungen bleiben im Cache. Der Datei-Tracking-Hash enthält auch die Locale-Liste und `docsOutput.html` / `localizedAssets`. Das Hinzufügen einer Locale schreibt die Sprachliste und den hreflang-Block neu, selbst wenn jeder Satz bereits zwischengespeichert ist. Bei einem übereinstimmenden Hash und einer aktuellen Ausgabedatei wird die Seite übersprungen.
