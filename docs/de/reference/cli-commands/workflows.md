<a id="cli--workflows--status"></a>
# CLI – Workflows & Status

<a id="sync"></a>
### `sync`

**Übersicht:** `ai-i18n-tools sync [options]`

Extraktion (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `features.translateSVG` und `config.svg` gesetzt sind, dann Dokumentationsübersetzung, dann `translate-json`, wenn `features.translateJson` und `json[]` gesetzt sind – es sei denn, sie werden mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json` übersprungen.

**Wichtige Optionen:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` wird an die UI- und SVG-Schritte sowie an Docs/JSON weitergeleitet; `--force-update` gilt für Docs, JSON und SVG (nicht UI). Die Docs-Phase leitet auch `--emphasis-placeholders` und `--debug-failed` weiter (gleiche Bedeutung wie `translate-docs`). `--prompt-format` ist kein `sync`-Flag; die Docs- und JSON-Schritte verwenden den integrierten Standard (`json-array`).

---

<a id="status"></a>
### `status`

**Übersicht:** `ai-i18n-tools status [--max-columns <n>]`

Wenn `features.translateUIStrings` aktiviert ist, wird die UI-Abdeckung pro Gebietsschema ausgegeben (`Translated` / `Missing` / `Total`). Anschließend wird der Markdown-Übersetzungsstatus pro Datei × Gebietsschema ausgegeben (kein `--locale`-Filter; Gebietsschemas stammen aus der Konfiguration). Wenn `features.translateJson` aktiviert ist und `json[]` konfiguriert ist, wird auch der JSON-Bundle-Status pro Block ausgegeben. Große Gebietsschema-Listen werden in wiederholte Tabellen mit bis zu `n` Gebietsschema-Spalten (Standard **9**) aufgeteilt, damit die Zeilen im Terminal schmal bleiben.

**Wichtige Optionen:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**Übersicht:** `ai-i18n-tools statistics [--max-columns <n>]`

Gibt Dokumentations-Cache- und `strings.json`-Statistiken aus (dieselben Aggregate wie Übersetzungs-Dashboard → Statistiken). `--max-columns`: maximale Gebietsschema-Spalten pro Modell × Gebietsschema-Tabelle (Standard **6**).

**Wichtige Optionen:** `--max-columns`

**Siehe auch:** [Dashboard-Statistiken](/de/guide/translation-dashboard/statistics)
