<a id="cli--workflows--reporting"></a>
# CLI – Workflows und Reporting

<a id="sync"></a>
### `sync`

**Übersicht:** `ai-i18n-tools sync [options]`

Extraktion (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `features.translateSVG` und `config.svg` gesetzt sind, dann Dokumentationsübersetzung, dann `translate-json`, wenn `features.translateJson` und `json[]` gesetzt sind – es sei denn, sie werden mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json` übersprungen.

**Wichtige Optionen:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` wird an die UI- und SVG-Schritte sowie an docs/JSON weitergeleitet; `--force-update` gilt für docs, JSON und SVG (nicht UI). `--check-cache` wird an docs, JSON und SVG weitergeleitet: Es revalidiert zwischengespeicherte Segmente für Gebietsschemas mit einem erzwungenen nativen Skript, selbst wenn die Dateiverfolgung überspringen würde. Die Docs-Phase leitet auch `--emphasis-placeholders` weiter (gleiche Bedeutung wie `translate-docs`). Das globale `--debug-failed` schreibt `FAILED-TRANSLATION`-Protokolle unter `cacheDir` für jeden verworfenen Modellversuch (einschließlich SVG/Docs-Skript-Fallbacks), nicht nur, wenn jedes Modell in der Kette fehlschlägt. `--prompt-format` ist kein `sync`-Flag; Docs- und JSON-Schritte verwenden den integrierten Standard (`json-array`).

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

---

<a id="usage"></a>
### `usage`

**Zusammenfassung:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

Gibt die aufgezeichneten API-Aufrufstatistiken des Modells aus (Aufrufe, Token und Kosten in USD). Die Kosten entsprechen dem `usage.cost` des Anbieters, sofern vorhanden (einschließlich `0`), andernfalls dem `providers.<name>.modelPricing` für dieses Modell, andernfalls dem anbieterweiten `providers.<name>.pricing`-Standardwert oder andernfalls dem in models.dev aufgeführten Listenpreis für Ein- und Ausgaben für diese Modell-ID. Gemeldete Kosten und explizit konfigurierte Tarife werden niemals überschrieben. Unbekannte Kosten bleiben `—` und werden niemals als `$0.00` angezeigt. Neue Aufrufe speichern den Betrag; bei älteren Zeilen, die Token enthalten, aber keine gespeicherten Kosten aufweisen, erfolgt eine Schätzung bei Ausführung des Berichts. Es werden dieselben Aggregate wie unter „Translation Dashboard → Usage & costs“ verwendet. Detailzeilen, die älter als sieben UTC-Kalendertage sind, werden in monatliche `api_totals` zusammengefasst; Berichte kombinieren beide Tabellen. `--since` akzeptiert `YYYY-MM-DD`, eine Zeitdauer (`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`) oder ein Kalendermonat-Fenster (`1mo`, `2mo`, `3mo`). `--clear` löscht Detailzeilen und Monatssummen (`--older-than` ist `1mo`, `2mo`, `3mo`, `6mo`, `1y` oder `all`; `--dry-run` gibt die Anzahl ohne Löschvorgang aus).

**Wichtige Optionen:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**Siehe auch:** [Dashboard-Nutzung & Kosten](/de/guide/translation-dashboard/usage)
