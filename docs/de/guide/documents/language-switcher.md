<a id="language-switcher-languagelistblock"></a>
# Sprachwechsler (`languageListBlock`)

Verwenden Sie `docsOutput.postProcessing.languageListBlock`, wenn übersetzte Markdown-Dateien eine Zeile mit Links **„In anderen Sprachen lesen“** enthalten sollen – ein Link pro Gebietsschema, wobei die `href`-Werte relativ zu jeder Ausgabedatei berechnet werden.

Dieses Repository verwendet es für [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (flache Ausgabe unter `translated-docs/`). Nach `translate-docs` erhält jede übersetzte Kopie einen aktualisierten Block; zum Beispiel verlinkt [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) auf gleichgeordnete Gebietsschema-Dateien unter `translated-docs/` und zurück zur englischen Quelle im Repo-Stammverzeichnis.

Erfordert `docsOutput.style = "flat"` (oder ein anderes Layout, bei dem gleichgeordnete Gebietsschema-Dateien über einen relativen Pfad adressierbar sind). Siehe [Ausgabelayouts](/guide/documents/output-layouts).

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. Block in der Quell-Markdown-Datei markieren

Umschließen Sie den Sprachwechsler mit HTML (oder beliebigen Zeilen), die durch die Unterzeichenketten-Marker `start` und `end` begrenzt sind. Dieses Repository verwendet:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
```

Der anfängliche Link-Text ist nur ein Platzhalter. `translate-docs` ersetzt den gesamten Abschnitt von der ersten Zeile, die `start` enthält, bis zur ersten späteren Zeile, die `end` enthält (Marker innerhalb von Codeblöcken werden ignoriert, sodass Konfigurationsbeispiele in derselben Datei nicht berücksichtigt werden).

<a id="2-configure-the-block"></a>
## 2. Block konfigurieren

`start` und `end` sind beliebige Unterzeichenketten-Marker – sie müssen nicht `<small id="lang-list">` / `</small>` sein. Wählen Sie beliebigen öffnenden und schließenden Text, der nur im Sprachwechsler-Abschnitt vorkommt: ein anderes HTML-Tag (`<div class="lang-switcher">` … `</div>`), HTML-Kommentare (`<!-- lang-list -->` … `<!-- /lang-list -->`) oder rein Markdown-Grenzen (zum Beispiel eine Zeile `**Languages:**` bis zu einer Zeile `---`). Legen Sie `start` und `end` in der Konfiguration exakt so fest, wie sie in der Quelldatei stehen.

Stammkonfiguration ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Feld       | Funktion                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Unterzeichenkette, die die öffnende Zeile des Blocks identifiziert                                                  |
| `end`       | Unterzeichenkette in der schließenden Zeile (kann dieselbe Zeile wie `start` sein, wenn beide auf einer Zeile stehen)             |
| `separator` | Text zwischen den generierten `[label](href)`-Links (dieses Repository verwendet `" · "`)                                    |
| `label`     | Optional: `"local"` (Standard) verwendet den Endonymen jedes Gebietsschemas aus dem Manifest; `"english"` verwendet `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. Was zur Laufzeit passiert

1. **Extraktion** — der Sprachlisten-Abschnitt wird **nicht** an das Modell gesendet (`translatable: false`).
2. **Pro übersetzte Datei** — nach der Segmentübersetzung und optionaler Umwandlung flacher Links baut `postProcessing` den Block neu auf: ein Markdown-Link pro Gebietsschema, Beschriftungen aus `ui-languages.json`, falls vorhanden (ansonsten aus dem gebündelten Hauptkatalog, sonst `localeDisplayNames`), Pfade relativ zur geschriebenen Datei.
3. **Aktualisierung der Quelle** — am Ende eines `translate-docs` / `sync` Dokumentationsdurchlaufs wird derselbe kanonische Block in die **englischen Quelldateien** in `contentPaths` zurückgeschrieben, sodass das Hinzufügen eines Gebietsschemas den Wechsler im Repository aktualisiert, ohne dass jeder Link manuell bearbeitet werden muss.

Wenn eine Datei keinen passenden Block enthält, protokolliert die CLI eine Warnung (wenn `--verbose`) und lässt den Inhalt unverändert.

<a id="4-label-manifest"></a>
## 4. Label-Manifest

Für Endonym-Labels (`label: "local"`) generieren oder pflegen Sie `ui-languages.json` über `generate-ui-languages` (erfordert [`uiLanguagesPath`](/reference/configuration#uilanguagespath-optional)). Die reine Dokumentationskonfiguration dieses Repositories hat keine UI-Pipeline, daher stammen die Labels aus dem gebündelten Masterkatalog für `sourceLocale` + `targetLocales`.

<a id="5-examples-in-this-repository"></a>
## 5. Beispiele in diesem Repository

| Beispiel | Dateien |
|---|---|
| Dieses Paket (flaches README + VitePress-Site) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README-Block: `docsOutput.style = "flat"`; Site-Block: `docsOutput.style = "vitepress"`; Theme-JSON über `json[]`) |
| Flaches README + Docusaurus-Dokumentation | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (zweiter Block: `docsOutput.style = "flat"`; erster Block: `docsOutput.style = "docusaurus"`) |
| VitePress-Dokumentation (minimales Demo) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `json[]` Theme-Katalog) |

Die Zeile unmittelbar vor `<small id="lang-list">` (z. B. `**Read in other languages:**`) ist ein normaler übersetzbarer Abschnitt und wird in jedem Zielgebietsschema lokalisiert; nur die Link-Zeile innerhalb der Marker wird wortwörtlich neu generiert, abgesehen von `href` und manifestgesteuerten Bezeichnungen.
