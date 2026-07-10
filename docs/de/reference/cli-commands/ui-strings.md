<a id="cli--ui-strings"></a>
# CLI – UI-Zeichenfolgen

<a id="extract"></a>
### `extract`

**Synopsis:** `ai-i18n-tools extract`

Aktualisiert `strings.json` aus `t("…")` / `i18n.t("…")`-Literalen, optionaler `package.json`-Beschreibung und optionalen gebündelten Master-`englishName`-Einträgen, wenn `includeUiLanguageEnglishNames` aktiviert ist (siehe `ui.uiExtractor`; liest nicht `languagesManifestPath`). Generiert auch `ui-languages.json` unter `languagesManifestPath` neu. Wenn `.html` / `.htm` in `ui.uiExtractor.extensions` aufgeführt sind, erfasst es auch `data-i18n` / `data-i18n-title` / `data-i18n-placeholder`-Marker-Strings aus HTML. Erfordert nicht-leeres `ui.sourceRoots`. Ruft kein LLM auf.

**Siehe auch:** [Übersicht über UI-Strings](/guide/ui-strings/), [Reine HTML-Anwendungen](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**Synopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

Fügt bloße `data-i18n` / `data-i18n-title` / `data-i18n-placeholder`-Marker in HTML ein, sodass der Quelltext einmal (auf dem Element selbst) geschrieben wird. Scannt die angegebenen Dateien/Verzeichnisse/Globs (Standard: `.html` / `.htm` unter `ui.sourceRoots`). Standardmäßig Trockenlauf (meldet die Anzahl der hinzugefügten Elemente pro Datei und alle Elemente mit gemischtem Inhalt, die eine manuelle `<span data-i18n>` benötigen); `--write` wendet Änderungen an. Idempotent, berücksichtigt `data-i18n-ignore` (überspringt das Element und seinen Unterbaum), berührt niemals codeähnliche Elemente (`code`, `pre`, `kbd`, `samp`, `var`) oder leeren/nur-numerischen Text und gibt niemals einen bewerteten Marker aus. Ruft kein LLM auf.

**Schlüsseloptionen:** `--write`

**Siehe auch:** [HTML für die Übersetzung markieren](/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**Synopsis:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

Schreibt `ui-languages.json` nach `languagesManifestPath` (Standard: `{ui.flatOutputDir}/ui-languages.json`) unter Verwendung von `sourceLocale` + `targetLocales` und dem gebündelten `data/ui-languages-complete.json` (oder `--master`). Warnt und gibt `TODO`-Platzhalter für Lokale aus, die in der Masterdatei fehlen. Wenn Sie ein vorhandenes Manifest mit angepassten `label`- oder `englishName`-Werten haben, werden diese durch die Standardwerte des Masterkatalogs ersetzt – überprüfen und passen Sie die generierte Datei anschließend an.

**Schlüsseloptionen:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**Synopsis:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Übersetzt nur UI-Strings (`strings.json` → Locale JSON). Erfordert `features.translateUIStrings`.

**Schlüsseloptionen:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: durch Kommas getrennte Ziellokale (Standard: Konfiguration `targetLocales` minus `sourceLocale`). `--force`: alle Einträge pro Locale neu übersetzen (bestehende Übersetzungen ignorieren). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe.

---

<a id="sync-ui"></a>
### `sync-ui`

**Synopsis:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrahieren und dann UI-Strings übersetzen (erfordert `features.translateUIStrings`). Nur UI – keine Dokumentation, SVG oder `json[]`. Dieselben Optionen für `-l`, `--force`, `--dry-run` und `-j` wie bei `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Synopsis:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Führt zuerst `extract` aus (erfordert `features.translateUIStrings`), damit `strings.json` mit der Quelle übereinstimmt, dann LLM-Überprüfung der UI-Strings der Quell-Locale (Rechtschreibung, Grammatik). Terminologiehinweise stammen nur aus der `glossary.userGlossary`-CSV-Datei (gleicher Umfang wie `translate-ui` – nicht `strings.json` / `uiGlossary`, sodass schlechte Kopien nicht als Glossar verstärkt werden). Verwendet den aktiven LLM-Anbieter (dessen API-Schlüssel-Umgebungsvariable).

Beendet mit **1** bei Fehler (fehlendes Feature-Flag, Extraktionsfehler, fehlender/ungültiger Katalog, fehlender API-Schlüssel oder wenn alle Batches fehlschlagen); beendet mit **0**, wenn der Lauf erfolgreich abgeschlossen wird (Ergebnisse sind beratend). Schreibt `proofread-ui-results_<timestamp>.log` unter `cacheDir` als menschenlesbaren Bericht (Zusammenfassung, Probleme und pro-String-OK-Zeilen); das Terminal druckt nur Zusammenfassungszählungen und Probleme (keine `[ok]`-Zeilen pro String). Druckt den Logdateinamen in der letzten Zeile. Mit `--json` geht die Ausgabe im menschlichen Stil an stderr. Links verwenden `path:line` wie der Link-Button für die Dashboard-UI-Strings.

**Schlüsseloptionen:** `-l` / `--locale`, `--chunk` (Standard **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Synopsis:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exportiert `strings.json` nach XLIFF 2.0 (eine `.xliff` pro Ziellokale). Nur lesend; keine API.

**Schlüsseloptionen:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: Ausgabeverzeichnis (Standard: derselbe Ordner wie der Katalog). `--untranslated-only`: nur Einheiten, denen eine Übersetzung für diese Lokale fehlt.
