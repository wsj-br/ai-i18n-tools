<a id="html-pages"></a>
# HTML-Seiten

Verwenden Sie die Documents-Pipeline, wenn eine statische Website pro Locale eine übersetzte `.html`- oder `.htm`-Datei benötigt. `translate-docs` übersetzt die Quellseite, passt die relativen Links an und speichert die Locale-Kopien unter `outputDir`. Weder eine i18n-Laufzeitumgebung im Browser noch `data-i18n*`-Marker sind erforderlich.

Verwenden Sie stattdessen [Plain HTML apps](/de/guide/ui-strings/plain-html), wenn eine HTML-Datei an ihrem Platz bleibt und ein Browser-Skript Zeichenfolgen aus flachem JSON dynamisch austauscht. Fügen Sie dieselbe Datei nicht in beide Pipelines ein; die CLI warnt, wenn eine HTML-Datei sowohl eine `docs[]`-Quelle als auch eine `ui.sourceRoots`-Katalogquelle ist.

Die ausführbare [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs)-Website liefert Englisch auf Port 3092 aus und schreibt Portugiesisch nach `site/pt-BR/`.

<a id="quick-start"></a>
## Schnellstart

Erstellen Sie eine funktionierende Konfiguration:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

Oder fügen Sie diesen HTML-Teil zu einer `ai-i18n-tools.config.json` hinzu, die bereits über einen LLM-[Anbieter](/de/guide/providers-and-models) verfügt:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` sollte der Quellbaum innerhalb von `contentPaths` sein. Er wird entfernt, bevor das Locale-Verzeichnis eingefügt wird. Mit der obigen Konfiguration:

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

Fügen Sie optional die [language-list- und hreflang-Marker](#language-list-and-hreflang) zu jeder Quellseite hinzu und führen Sie dann Folgendes aus:

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

Der Befehl aktualisiert auch die Marker-Inhalte in den ausgangssprachlichen Dateien. Behandeln Sie Locale-Dateien unter `outputDir` als generierte Ausgabe; bearbeiten Sie die Quellseiten und führen Sie den Befehl erneut aus.

<a id="what-is-translated"></a>
## Was übersetzt wird

Der HTML-Extraktor übersetzt:

- sichtbaren Text, der Buchstaben enthält, einschließlich `<title>` und Text um Inline-Markup herum
- `alt`-, `title`-, `aria-label`- und `placeholder`-Attributwerte
- `value` auf `<input type="submit">` und `<input type="button">`
- `content` auf `meta name="description"`, `meta property="og:title"` und `meta property="og:description"`

Inline-Elemente wie `<a>`, `<em>`, `<strong>`, `<span>`, `<img>` und `<br>` werden beibehalten, während der umgebende Satz übersetzt wird. Code-ähnliche Inline-Elemente wie `<code>` und `<kbd>` werden unverändert beibehalten:

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

Ganze `script`-, `style`-, `textarea`-, `pre`- und `code`-Teilbäume werden unverändert kopiert. Andere Attribute – einschließlich `class`, `id`, `src`, `href` und Metadaten mit URLs – werden nicht an das Modell gesendet.

Bei jeder Locale-Kopie setzt die Pipeline `<html lang="…">` und die `dir` der Locale (`ltr` oder `rtl`). Die Quellseite behält ihre vom Autor festgelegten `lang` und `dir` bei. Verwenden Sie UTF-8-HTML; die CLI warnt, wenn ein `<meta charset>` eine andere Kodierung deklariert.

<a id="output-layout"></a>
## Ausgabelayout

Für das übliche Layout einer statischen Website legen Sie Folgendes fest:

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` schreibt `{outputDir}/{locale}/{path relative to docsRoot}`. `style: "flat"` schreibt Dateien mit Locale-Suffix wie `site/about.pt-BR.html`. Siehe [Ausgabelayouts](/de/guide/documents/output-layouts) für alle Stile und benutzerdefinierten Pfadvorlagen.

Generierte Locale-Verzeichnisse und flache Locale-Dateinamen unter `outputDir` werden von der zukünftigen Quellenerkennung ausgeschlossen. Dies verhindert, dass `site/pt-BR/index.html` oder `site/index.pt-BR.html` erneut übersetzt werden.

<a id="links-and-images"></a>
## Links und Bilder

Relative Links, die auf `.html` oder `.htm` enden, werden umgeschrieben, wenn ihr Ziel eine andere Quellseite im selben `docs[]`-Block ist. Query-Strings und Fragmente werden beibehalten. Beispielsweise wird `href="about.html#history"` in `site/index.html` zu `href="./about.html#history"` in `site/pt-BR/index.html`.

Andere relative `href`-, `src`-, `srcset`- und `poster`-URLs werden mit einem Tiefen-Präfix versehen, damit freigegebene Dateien weiterhin von der Locale-Seite aus aufgelöst werden können. Absolute URLs, protokollrelative URLs, `data:`-URLs und Links nur mit Fragmenten bleiben unverändert. Root-relative URLs bleiben root-relativ.

`docsOutput.localizedAssets` kann einen Locale-spezifischen Bild- oder Symbol-Dateinamen auswählen:

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

`img/trulli.jpg` wird zu `img/trulli-pt-BR.jpg`. Bei `onlyIfExists: true` (der Standardeinstellung) wird diese URL nur verwendet, wenn die lokalisierte Datei vorhanden ist; andernfalls wird das ursprüngliche gemeinsame Asset beibehalten. Setzen Sie `onlyIfExists: false` nur, wenn ein anderer Build- oder CDN-Schritt diese Dateien garantiert.

`include` gleicht URL-Pfade wie `img/**` ab. Verwenden Sie `assetRoot`, um das Dateisystemverzeichnis festzulegen, gegen das lokalisierte Kandidaten – insbesondere root-relative URLs wie `/img/trulli.jpg` – geprüft werden.

Dieselben Lokalisierungsregeln gelten für `srcset`, `poster`, `<source src>`, das Icon `<link href>` und `og:image` / `twitter:image`. Die Pipeline schreibt Referenzen um, erstellt, übersetzt oder kopiert jedoch keine Asset-Dateien. CSS-`url()`-Werte werden nicht umgeschrieben.

<a id="language-list-and-hreflang"></a>
## Sprachliste und hreflang

Platzieren Sie ein Sprachlisten-Paar dort, wo die sichtbare Navigation hingehört, und ein hreflang-Paar innerhalb von `<head>`:

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

Bei jeder Ausführung ersetzt die Pipeline nur den Inhalt zwischen den einzelnen Paaren. Sie aktualisiert jede Locale-Kopie und die Quellseite, wobei die alternativen Links reziprok bleiben. Marker innerhalb von `script`, `style`, `pre` und `code` werden ignoriert. Mit `--verbose` warnt die CLI, wenn ein konfiguriertes Paar fehlt.

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

Die Standardkommentare funktionieren auch dann, wenn `docsOutput.html` weggelassen wird. Legen Sie `languageList.start` / `end` oder `hreflang.start` / `end` nur fest, wenn die Quelle einen anderen Markertext verwendet.

<a id="visible-language-navigation"></a>
### Sichtbare Sprachnavigation

- `format: "links"` schreibt `<a>`-Elemente. Innerhalb eines `<ul>`, `<ol>` oder `<nav>` wird jeder Link in `<li>` umbrochen; andernorts verbindet `separator` die Links.
- `format: "select"` schreibt `<option>`-Zeilen. Platzieren Sie die Marker in Ihrem eigenen `<select data-lang-select>`, kopieren Sie `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` in die Website und laden Sie dieses klassische Skript. Es navigiert zur generierten URL der ausgewählten Option.
- `label` ist `local` (Endonym), `english` oder `both` (`English / endonym`, wenn sie sich unterscheiden). Die Bezeichnungen stammen aus `ui-languages.json`, falls verfügbar, andernfalls aus der im Paket enthaltenen Locale-Liste.

Ein Marker-Block verwendet ein Format. Die generierten Links enthalten `lang`, `hreflang` und `aria-current`; die generierte Option für die aktuelle Seite hat `selected`.

<a id="search-engine-alternates"></a>
### Suchmaschinen-Alternativen

`hreflang.siteUrl` stellt alternativen URLs ein Präfix voran. Setzen Sie es vor der Bereitstellung auf den öffentlichen Ursprung der Website. Wenn es weggelassen wird, schreibt die Pipeline relative alternative Links und protokolliert eine Warnung.

`xDefault` ist standardmäßig auf `sourceLocale` gesetzt; es wird nur ausgegeben, wenn diese Locale für die Seite konfiguriert ist. `stripIndexHtml: true` wandelt eine `index.html`-Alternative in eine Verzeichnis-URL um.

Der Marker-Block ist erforderlich: Die Pipeline fügt keine Tags automatisch in `<head>` ein. Sie generiert auch keine Sitemap, kanonische URL oder `og:locale` und leitet nicht nach Browsersprache um.

Nur die konfigurierten Quell- und Ziel-Locales sind für Sprachblöcke zulässig. Wenn `ui-languages.json` vorhanden ist, bestimmen seine Zeilen und die Reihenfolge, welche zulässigen Locales erscheinen, also halten Sie das Manifest mit der Konfiguration synchron. Wenn Sie mit `--locale` übersetzen, um nur eine Teilmenge zu generieren, veröffentlichen Sie nichts, bis jede verlinkte Locale-Ausgabe vorhanden ist.

<a id="second-run"></a>
## Zweiter Durchlauf

Satzübersetzungen bleiben im Cache. Der Datei-Tracking-Hash umfasst auch die Locale-Liste, den Ausgabestil, `docsOutput.html` und `localizedAssets`. Das Hinzufügen einer Locale oder das Ändern dieser Optionen schreibt die generierten Blöcke und Links neu, selbst wenn jeder Satz bereits zwischengespeichert ist. Ein übereinstimmender Hash und eine aktuelle Ausgabedatei überspringen diese Locale-Seite.

<a id="troubleshooting"></a>
## Fehlerbehebung

| Symptom | Was zu prüfen ist |
| --- | --- |
| Ausgabe ist `site/pt-BR/site/index.html` | Setzen Sie `docsOutput.docsRoot` auf `"site"`, damit das Quellpräfix entfernt wird. |
| Link zeigt immer noch auf die englische Seite | Verwenden Sie einen relativen `.html` / `.htm`-Link und fügen Sie die Zielseite in denselben `docs[]`-Block ein. |
| Bildpfad ist von einer Locale-Seite aus defekt | Halten Sie ihn relativ, damit die Tiefenumschreibung greifen kann; denken Sie daran, dass CSS-`url()` nicht umgeschrieben wird. |
| Lokalisiertes Bild wird nicht ausgewählt | Prüfen Sie `localizedAssets.include`, den Dateinamen `pattern` und ob der Kandidat existiert, wenn `onlyIfExists` wahr ist. |
| Sprachliste ist leer oder unverändert | Belassen Sie beide Marker-Kommentare in der richtigen Reihenfolge und außerhalb von `script`, `style`, `pre` und `code`. |
| Dropdown-Menü navigiert nicht | Fügen Sie `data-lang-select` zu `<select>` hinzu und laden Sie `html-runtime/lang-select.js`. |
| Hreflang-URLs verwenden den falschen Host | Legen Sie `hreflang.siteUrl` auf den endgültigen öffentlichen Ursprung fest. |
| Eine übersetzte Seite wird erneut übersetzt | Belassen Sie generierte Locale-Dateien unter dem konfigurierten `outputDir`; fügen Sie sie nicht als separate Quellen hinzu. |
