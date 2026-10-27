<a id="ui-strings"></a>
# Benutzeroberflächen-Strings

Referenz für `extract` und `translate-ui`, die Pipeline, die `t()`-Aufrufe in sprachspezifische Kataloge umwandelt. Fügen Sie einer App zum ersten Mal i18n hinzu? Beginnen Sie mit [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). Diese behandeln den Wrapping-Schritt und leiten Sie dann für die Schritte 2 bis 4 hierher zurück.

Diese Pipeline dient JS/TS-Projekten (React, Next.js Client- und Serverkomponenten, Node.js-Dienste, einfaches HTML, Astro-Websites und CLI-Tools) und Python-Anwendungen. JS/TS sucht Zeichenfolgen mit i18next, nachdem der Quellcode `t()` aufruft. Python ruft `t()` oder gettext über eine generierte `i18n.py`-Datei auf (Django behält Djangos gettext).

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihre App | Als Nächstes lesen |
| --- | --- |
| JS/TS mit hartcodierten Quelltexten, noch kein `t()` | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) |
| React / Next.js / Node, `t()` bereits im Quellcode | [i18next einbinden](/de/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Python-Anwendungen](/de/guide/ui-strings/python). Initialisierung: `ui-python`, `ui-python-gettext`, `ui-python-flask` oder `ui-python-django`. Hilfsprogramm: `i18n.py`. Um einer bestehenden Anwendung Locales hinzuzufügen, siehe [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). |
| Reines HTML (kein `t()` im Markup) | [Reine HTML-Apps](/de/guide/ui-strings/plain-html) |
| Astro Marketing-Website (hybrid) | [Astro-Website](/de/guide/ui-strings/astro-website) |
| `t()`-Regeln, Interpolation, Plurale | [t()-Aufrufe & Plurale](/de/guide/ui-strings/t-calls-and-plurals) |
| Sprachauswahl / RTL | [Sprachumschalter & RTL](/de/guide/ui-strings/language-switcher) |
| Laufzeit-API-Signaturen | [Laufzeit-Helfer](/de/guide/runtime-helpers) |
| Intlayer `.content.ts`-Wörterbücher, Umstieg von Intlayer | [Migration von Intlayer](/de/guide/migrating-from-intlayer) |
| Intlayer `.content.ts`-Wörterbücher, Intlayer beibehalten | [Intlayer direkt übersetzen](/de/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## Schritt 1: Initialisieren

```bash
ai-i18n-tools init -P openrouter
```

Dies schreibt `ai-i18n-tools.config.json` mit der `ui-markdown`-Vorlage (einschließlich des `provider`- / `providers`-Blocks für dieses Preset). Diese Vorlage aktiviert auch die Dokumentübersetzung für `README.md`, die als flache Dateien unter `translated-docs/` geschrieben werden. Nur-README-Repositories verwenden stattdessen `init -t docs-markdown`. Siehe [i18n zu Ihrem README und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme). Bevor Sie `translate-ui` oder `sync` ausführen, legen Sie den API-Schlüssel für diesen Anbieter in der Umgebung oder in `.env` fest – Ollama ausgenommen; siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key). Vier Schlüssel sind für UI-Zeichenfolgen wichtig:

- `sourceLocale`: der BCP-47-Code der Sprache, in der Ihr Quelltext geschrieben ist. Jede Sprache ist gültig; `"en-GB"` ist nur ein Beispiel. Er muss mit `SOURCE_LOCALE` übereinstimmen, das aus Ihrer Laufzeit-i18n-Setup-Datei (`src/i18n.ts` / `src/i18n.js`) exportiert wird. Die Zeichenfolge innerhalb von `t()` ist diese Quellsprache, und flache Lokalisierungsdateien verwenden sie als Schlüssel.
- `targetLocales`: BCP-47-Codes für Ihre Zielsprachen (zum Beispiel `["de", "fr", "pt-BR"]`). Führen Sie `generate-ui-languages` aus, um das `ui-languages.json`-Manifest aus dieser Liste zu erstellen.
- `ui.sourceRoots`: Verzeichnisse oder Glob-Muster, die nach `t("…")`-Aufrufen durchsucht werden sollen (zum Beispiel `["src/"]`).
- `ui.stringsJson` und `ui.flatOutputDir`: wo der Masterkatalog und die sprachspezifischen Dateien (`de.json`, `pt-BR.json`) geschrieben werden.

Jeder andere Schlüssel, einschließlich `providers.<active>.uiModels`, ist in [Konfiguration](/de/reference/configuration).

<a id="step-2-extract-strings"></a>
## Schritt 2: Zeichenfolgen extrahieren

`extract` tut nichts Nützliches, solange diese `t()`- / `i18n.t()`-Aufrufe nicht existieren. Umschließen Sie zuerst hartcodierten Text: [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js).

```bash
ai-i18n-tools extract
```

Durchsucht Dateien unter `ui.sourceRoots` nach `t("literal")`- und `i18n.t("literal")`-Aufrufen. Schreibt (oder führt zusammen in) `ui.stringsJson`.

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.uiExtractor.funcNames` (oder das ältere `ui.reactExtractor.funcNames`) hinzu. Für Astro-Seiten und -Komponenten fügen Sie `.astro` zu `ui.uiExtractor.extensions` hinzu. Für reines HTML siehe [Reine HTML-Apps](/de/guide/ui-strings/plain-html).

<a id="what-extract-scans"></a>
### Was sind Extrakt-Scans

- Standarderweiterungen sind nur `.js`, `.jsx`, `.ts` und `.tsx`. `.mjs`, `.cjs`, `.mts` und `.cts` werden nur eingeschlossen, wenn Sie sie zu `ui.uiExtractor.extensions` hinzufügen.
- Ein nicht-literaler Schlüssel wie `t(variable)` oder ein Template-Literal wird ohne Warnung übersprungen.
- `package.json` `description` ist standardmäßig enthalten (`ui.uiExtractor.includePackageDescription`).
- Vue- und Svelte-Single-File-Komponenten werden nicht unterstützt. Das Hinzufügen von `.vue` oder `.svelte` zu `extensions` extrahiert keinen Vorlagentext. Es gibt keinen SFC-Parser.

<a id="step-3-translate-ui-strings"></a>
## Schritt 3: UI-Zeichenfolgen übersetzen

```bash
ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Batches für jedes Ziel-Gebietsschema an die Modelle des aktiven LLM-Anbieters und schreibt flache JSON-Dateien (`de.json`, `fr.json` usw.) in `ui.flatOutputDir`. Die Modellauswahl verwendet die UI-Kette: `localeModels(locale)` → `uiModels` → `translationModels` (siehe [KI-Modelle](/de/guide/ai-models#model-fallback-chain)). Innerhalb eines Gebietsschemas können bis zu `uiBatchConcurrency` Batches gleichzeitig ausgeführt werden (Standard: **2**; siehe [Konfiguration – uiBatchConcurrency](/de/reference/configuration#uibatchconcurrency-optional)). `-j` parallelisiert weiterhin nur Ziel-Gebietsschemas.

<a id="translations-database-stringsjson"></a>
### Übersetzungsdatenbank (`strings.json`)

Für jeden Eintrag speichert `translate-ui` die **Modell-ID des aktiven Anbieters**, der jede Sprache erfolgreich übersetzt hat, in einem optionalen `models`-Objekt (dieselben Sprachschlüssel wie `translated`). Im Übersetzungs-Dashboard bearbeitete Zeichenfolgen werden mit dem Sentinel-Wert `user-edited` in `models` für diese Sprache markiert. Die sprachspezifischen Flatfiles unter `ui.flatOutputDir` bleiben nur **Quellzeichenfolge → Übersetzung**; sie enthalten keine `models` (sodass Laufzeit-Bundles unverändert bleiben).

> **Hinweis:** Dashboard-Bearbeitungen an UI-Strings befinden sich in `strings.json`, nicht im SQLite-Dokumentations-Cache. Führen Sie einfaches `sync` oder `translate-ui` (ohne spezielles Flag) aus, um flache Gebietsschema-Dateien aus dem Katalog neu zu schreiben – `--force-update` wird **nicht** an den UI-Schritt weitergeleitet. Vermeiden Sie `--force` bei UI-Befehlen nach manuellen Bearbeitungen: Es übersetzt jeden Eintrag neu und kann Ihre `user-edited`-Zeilen überschreiben. Katalogzeilen, deren gespeicherte Übersetzung die Überprüfung des Schreibsystems des Gebietsschemas nicht besteht (z. B. romanisiertes Hindi für `hi`), werden als fehlend behandelt und ohne `--force` neu übersetzt.

<a id="step-4-use-the-output-in-your-app"></a>
## Schritt 4: Die Ausgabe in Ihrer App verwenden

`translate-ui` schreibt nur Dateien. Die App muss sie laden.

- JS/TS: i18next mit den Laufzeit-Helfern einbinden, die vom Benutzer ausgewählte Lokalisierungsdatei laden und einen Sprachumschalter hinzufügen. Siehe [i18next einbinden](/de/guide/ui-strings/i18next-runtime) und [Sprachumschalter und RTL](/de/guide/ui-strings/language-switcher).
- Python: Verwenden Sie die generierte `i18n.py`-Datei oder Ihre gettext-Kataloge. Siehe [Python-Anwendungen](/de/guide/ui-strings/python).
- Einfaches HTML: Laden Sie das Laufzeit-Skript neben der Seite. Siehe [Einfache HTML-Apps](/de/guide/ui-strings/plain-html).
- Astro: Siehe [Astro-Website](/de/guide/ui-strings/astro-website).

<a id="optional"></a>
## Optional

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

Einige Modelle übersetzen bestimmte Sprachen besser als andere. Zum Beispiel eignen sich qwen- und z-ai-Modelle tendenziell gut für asiatische Sprachen. Fügen Sie `providers.<active>.localeModels`-Einträge hinzu, um eine priorisierte Modellliste für jedes BCP-47-Gebietsschema bereitzustellen. Diese Listen werden vor `uiModels` und `translationModels` für dieses Gebietsschema verwendet. Gebietsschema-Tags stimmen groß-/kleinschreibungsunabhängig überein (`zh-cn` und `ZH-CN` sind äquivalent). Wenn kein passender Eintrag vorhanden ist, verwendet das Tool die Standardreihenfolge von `uiModels` und `translationModels`. Derselbe `localeModels`-Mechanismus gilt für die Dokument-, JSON- und SVG-Übersetzung.

<a id="exporting-to-xliff-20"></a>
### Exportieren nach XLIFF 2.0

Um UI-Zeichenketten an einen Übersetzungsdienstleister, ein TMS oder ein CAT-Tool weiterzugeben, exportieren Sie den Katalog als **XLIFF 2.0** (eine Datei pro Zielsprachgebiet). Dieser Befehl ist **schreibgeschützt**: Er verändert `strings.json` nicht und ruft keine API auf.

```bash
ai-i18n-tools export-ui-xliff
```

Standardmäßig werden die Dateien neben `ui.stringsJson` abgelegt, mit Namen wie `strings.de.xliff`, `strings.pt-BR.xliff` (Basisname Ihres Katalogs + Sprachgebiet + `.xliff`). Verwenden Sie `-o` / `--output-dir`, um an anderer Stelle zu schreiben. Vorhandene Übersetzungen aus `strings.json` erscheinen in `<target>`; fehlende Sprachgebiete verwenden `state="initial"` ohne `<target>`, sodass Tools diese ergänzen können. Verwenden Sie `--untranslated-only`, um nur Einheiten zu exportieren, die für jedes Sprachgebiet noch übersetzt werden müssen (nützlich für Aufträge an Dienstleister). `--dry-run` gibt Pfade aus, ohne Dateien zu schreiben.
