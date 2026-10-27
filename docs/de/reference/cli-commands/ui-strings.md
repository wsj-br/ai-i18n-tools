<a id="cli--ui-strings"></a>
# CLI – UI-Zeichenfolgen

<a id="extract"></a>
### `extract`

**Synopsis:** `ai-i18n-tools extract`

Aktualisiert `strings.json` aus `t("…")`- / `i18n.t("…")`-Literalen, der optionalen `package.json`-Beschreibung und optionalen gebündelten Master-`englishName`-Einträgen, wenn `includeUiLanguageEnglishNames` aktiviert ist (siehe `ui.uiExtractor`; liest `languagesManifestPath` nicht). Regeneriert außerdem `ui-languages.json` jedes Blocks. Wenn `.html` / `.htm` in `ui.uiExtractor.extensions` aufgeführt sind, werden auch `data-i18n`- / `data-i18n-title`- / `data-i18n-placeholder`-Marker-Strings aus dem HTML erfasst. Durchläuft jeden `ui`-Block, der `sourceRoots` enthält. `--ui-block` beschränkt die Ausführung auf einen Block (Index, Beschreibung oder `stringsJson`-Pfad). Ruft kein LLM auf.

**Siehe auch:** [Übersicht über UI-Strings](/de/guide/ui-strings/), [Reine HTML-Anwendungen](/de/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**Synopsis:** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

Intlayer `*.content.ts`-Wörterbücher in `strings.json` und flache Locale-Dateien importieren und einfache `useIntlayer` / `getIntlayer`-Aufrufstellen zu `t('source string')` umschreiben. Der String ist in `sourceLocale` geschrieben, was jede Sprache sein kann. Standardmäßig im Trockenlauf (der Bericht wird trotzdem geschrieben). `--write` initialisiert den Katalog und wendet sichere Umschreibungen an. Ruft kein LLM auf.

Der Bericht dient als Übergabedokument für alles, was `--write` zurücklässt, und endet mit einer **Schritt-für-Schritt-To-do-Liste**, die die weiteren Arbeitsschritte strukturiert: ein konkreter `t()`- oder JSX-Aufruf für jede manuelle Stelle, die `import { t }`-Zeile, Wörterbuchdateien und `IntlayerProvider`-Überreste, die anschließend gelöscht werden müssen, Ausgangszeichenfolgen, die `extract` und anschließend `translate-ui` benötigen, sowie ein i18next-Laufzeit-Bootstrap, um das i18n-Modul der App zu überschreiben. Die Locale-Steuerung muss sowohl `i18n.changeLanguage` als auch `loadLocale` aufrufen. `extract` schreibt `ui-languages.json`, das von diesem Bootstrap importiert wird. Bearbeiten Sie `strings.json`, die flachen Locale-Dateien oder `ui-languages.json` nicht manuell.

**Schlüsseloptionen:** `--write`, `--report`, `--content-glob` (Standard `**/*.content.ts`), `--t-import`

**Siehe auch:** [Migration von Intlayer](/de/guide/migrating-from-intlayer)

---

<a id="translate-intlayer"></a>
### `translate-intlayer`

**Zusammenfassung:** `ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]`

Fehlende und veraltete Locale-Blätter innerhalb von Intlayer `*.content.ts`-Wörterbüchern direkt übersetzen, wobei die Wörterbücher die Quelle der Wahrheit bleiben. Im Gegensatz zu [`migrate-intlayer`](#migrate-intlayer) verschiebt dies die Anwendung nicht von Intlayer weg; es füllt nur die `t({ … })`-Blätter. Verwenden Sie es, wenn Sie Intlayer zur Laufzeit beibehalten und ai-i18n-tools als Übersetzungs-Engine verwenden möchten.

Es extrahiert jedes `t({ … })`-Blatt, initialisiert das `strings.json` des ausgewählten UI-Blocks mit dem Quelltext, führt dieselbe Engine wie [`translate-ui`](#translate-ui) aus (Anbieterauswahl, Glossar, Übersetzungs-Kontext und Modell-Fallback), und schreibt dann die neuen pro-Locale-Strings zurück in jedes `t({ … })`-Objekt. Bearbeitungen sind chirurgisch: Nur die fehlenden oder veralteten Locale-Zeilen ändern sich, sodass Ihre Formatierung und Kommentare erhalten bleiben. Intlayer `{token}`-Platzhalter durchlaufen <code v-pre>{{token}}</code> für die Übersetzung und zurück.

Ein Blatt+Locale wird übersetzt, wenn das Locale im Blatt fehlt (fehlend), oder wenn sich der Quell-Locale-Text seit dem letzten Lauf für dieses Locale geändert hat (veraltet). Veraltetheit wird in `cacheDir` verfolgt, sodass das Bearbeiten dieses Quell-Strings dieses eine Blatt beim nächsten Lauf neu übersetzt. Die Quellsprache ist `sourceLocale` und kann jede Sprache sein. `--dry-run` meldet die fehlenden/veralteten Zählungen, ohne ein LLM aufzurufen oder etwas zu schreiben. Erfordert `features.translateUIStrings` und das `stringsJson` des UI-Blocks (wie `translate-ui`).

**Wichtige Optionen:** `-l` / `--locale`, `--ui-block`, `--dry-run`, `-j` / `--concurrency`

`[paths...]`: zu scannende Dateien/Verzeichnisse/Globs (Standard: das `sourceRoots` des Blocks). `-l` / `--locale`: Komma-getrennte Ziel-Locales zum Füllen (Standard: das konfigurierte `targetLocales` des Blocks). `--ui-block`: nullbasierter Index, Beschreibung oder `stringsJson`-Pfad (Standard: Block 0). `-j` parallelisiert Locales.

**Siehe auch:** [migrate-intlayer](#migrate-intlayer), [Migration von Intlayer](/de/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**Synopsis:** `ai-i18n-tools mark-html [paths...] [--write]`

Fügt reine `data-i18n`- / `data-i18n-title`- / `data-i18n-placeholder`-Marker in HTML ein, sodass der Quelltext nur einmal geschrieben wird (direkt auf dem Element selbst). Scannt die angegebenen Dateien/Verzeichnisse/Globs (Standard: `.html` / `.htm` unter `sourceRoots` jedes Blocks). Standardmäßig ein Trockenlauf (meldet die Anzahl der hinzugefügten Einträge pro Datei und alle Elemente mit gemischtem Inhalt, die ein manuelles `<span data-i18n>` erfordern); `--write` wendet die Änderungen an. Idempotent, respektiert `data-i18n-ignore` (überspringt das Element und seinen Unterbaum), fasst niemals codeähnliche Elemente (`code`, `pre`, `kbd`, `samp`, `var`) oder leeren/rein numerischen Text an und gibt niemals einen Marker mit Wert aus. Ruft kein LLM auf.

**Schlüsseloptionen:** `--write`

**Siehe auch:** [HTML für die Übersetzung markieren](/de/guide/ui-strings/plain-html#marking-html-for-translation)

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

`-l` / `--locale`: durch Kommas getrennte Ziellokale (Standard: Konfiguration `targetLocales` minus `sourceLocale`). `--force`: alle Einträge pro Gebietsschema neu übersetzen (bestehende Übersetzungen ignorieren). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe. `-j` parallelisiert **Gebietsschemata**; innerhalb jedes Gebietsschemas parallelisiert die Konfiguration `uiBatchConcurrency` (Standard **2**) LLM-Batches (Blöcke von 50 Zeichenfolgen, dann Pluralgruppen). Es gibt kein CLI-Flag für `uiBatchConcurrency`.

---

<a id="sync-ui"></a>
### `sync-ui`

**Synopsis:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrahieren und dann UI-Strings übersetzen (erfordert `features.translateUIStrings`). Nur UI – keine Dokumentation, SVG oder `json[]`. Dieselben Optionen für `-l`, `--force`, `--dry-run` und `-j` wie bei `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Synopsis:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Führt zuerst `extract` aus (erfordert `features.translateUIStrings`), damit jeder ausgewählte Katalog mit der Quelle übereinstimmt, anschließend erfolgt eine LLM-Überprüfung der UI-Strings des Quell-Locales (Rechtschreibung, Grammatik). `--ui-block` beschränkt Extraktion und Überprüfung auf einen Block. Terminologiehinweise stammen ausschließlich aus der `glossary.userGlossary`-CSV (gleicher Geltungsbereich wie `translate-ui` — UI-Kataloge werden nicht zurückgespeist, sodass fehlerhafte Texte nicht im Glossar verfestigt werden). Verwendet den aktiven LLM-Provider (dessen Umgebungsvariable für den API-Schlüssel).

Beendet mit **1** bei Fehlern (fehlendes Feature-Flag, Extraktionsfehler, fehlender/ungültiger Katalog, fehlender API-Schlüssel oder wenn alle Batches fehlschlagen); beendet mit **0**, wenn die Ausführung erfolgreich abgeschlossen wird (Ergebnisse sind informativ). Schreibt `proofread-ui-results_<timestamp>.log` unter `cacheDir` als menschenlesbaren Bericht (Zusammenfassung, Probleme, nicht überprüfte Zeilen und OK-Zeilen für jeden String); das Terminal gibt nur die Zählwerte der Zusammenfassung und Probleme aus (keine `[ok]`-Zeilen pro String). Wenn ein Batch fehlschlägt oder eine Modellantwort kürzer als der Batch ist und keinen verwendbaren `index` für jeden Slot enthält, werden die entsprechenden Strings als nicht überprüft gezählt. Die zugehörigen Probleme werden verworfen, damit ein zu kurzes Array nicht auf die falschen Strings angewendet wird. Gibt den Dateinamen des Protokolls in der letzten Zeile aus. Mit `--json` wird die menschenlesbare Ausgabe an stderr geleitet. Links verwenden `path:line`, wie die Link-Schaltfläche für Strings in der Dashboard-UI.

**Schlüsseloptionen:** `-l` / `--locale`, `--chunk` (Standard **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Synopsis:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exportiert `strings.json` nach XLIFF 2.0 (eine `.xliff` pro Ziellokale). Nur lesend; keine API.

**Schlüsseloptionen:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: Ausgabeverzeichnis (Standard: derselbe Ordner wie der Katalog). `--untranslated-only`: nur Einheiten, denen eine Übersetzung für diese Lokale fehlt.
