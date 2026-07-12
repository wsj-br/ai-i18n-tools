<a id="cli-options"></a>
# CLI-Optionen

Referenz für das `translate-docs`-Cache-Verhalten, Flags, Batch-Prompt-Format und interne SQLite-Pfadschlüssel.

<a id="cache-behaviour-and-translate-docs-flags"></a>
## Cache-Verhalten und `translate-docs`-Flags

Die CLI speichert die **Dateiverfolgung** in SQLite (Quell-Hash pro Datei × Gebietsschema) und **Segmentzeilen** (Hash × Gebietsschema pro übersetzbarem Chunk). Ein normaler Durchlauf überspringt eine Datei vollständig, wenn der verfolgte Hash mit der aktuellen Quelle übereinstimmt, die Ausgabedatei bereits existiert **und** die Änderungszeit der Ausgabe mindestens so neu ist wie die der Quelle; andernfalls verarbeitet sie die Datei und verwendet den Segment-Cache, sodass unveränderter Text die API nicht aufruft.

| Flag                          | Wirkung                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(Standard)*                   | Überspringt unveränderte Dateien, wenn Tracking + vorhandene Ausgabe auf Datenträger übereinstimmen; verwendet Segment-Cache für den Rest.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Kommagetrennte Ziel-Gebietsschemas (wenn weggelassen, entsprechen die Standardwerte der Vereinigung des Stammverzeichnisses `targetLocales` und des optionalen `docs[]` jedes `targetLocales`-Blocks).                                                                                                       |
| `-p, --path` / `-f, --file`   | Übersetzen Sie nur Markdown/JSON unter diesem Pfad (projektbezogen, absolut oder Glob-Muster); `--file` ist ein Alias für `--path`.                                                                                                                                 |
| `--dry-run`                   | Keine Datei-Schreibvorgänge und keine API-Aufrufe.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Auf `markdown` oder `json` beschränken (andernfalls beide, wenn in der Konfiguration aktiviert).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Nur JSON-Label-Dateien übersetzen oder JSON überspringen und ausschließlich Markdown übersetzen.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Maximale parallele Ziel-Sprachen (Standardwert aus Konfiguration oder CLI-Standard).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Maximale parallele Batch-API-Aufrufe pro Datei (Dokumente; Standardwert aus Konfiguration oder CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Maskiert Markdown-Hervorhebungsmarker als Platzhalter vor der Übersetzung. Automatisch aktiviert für CJK- und RTL-Gebietsschemas, es sei denn, dies wird pro Block über `docs[].emphasisPlaceholders` überschrieben oder mit `--no-emphasis-placeholders` deaktiviert.                                                                                                                                                                          |
| `--debug-failed`              | Detaillierte `FAILED-TRANSLATION`-Protokolle unter `cacheDir` schreiben, wenn die Validierung fehlschlägt.                                                                                                                                                                                        |
| `--force-update`              | Jede gefundene Datei erneut verarbeiten (Extrahieren, Zusammenfügen, Ausgabe schreiben), auch wenn die Datei-Verfolgung dies überspringen würde. **Segment-Cache bleibt aktiv** – unveränderte Segmente werden nicht an das LLM gesendet.                                                                                    |
| `--force`                     | Löscht die Dateiüberwachung für jede verarbeitete Datei und **liest nicht** aus dem Segment-Cache für die API-Übersetzung (vollständige Neübersetzung). Neue Ergebnisse werden weiterhin **in den Segment-Cache geschrieben**.                                                                                 |
| `--stats`                     | Anzahl der Segmente, Anzahl der verfolgten Dateien und Segment-Gesamtzahlen pro Sprache anzeigen und dann beenden.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Gecachte Übersetzungen (und Datei-Verfolgung) löschen: alle Sprachen oder eine einzelne Sprache, dann beenden.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Wie jeder **Batch** von Segmenten an das Modell gesendet und geparst wird (`xml`, `json-array` oder `json-object`). Standard ist `json-array`. Ändert nicht Extraktion, Platzhalter, Validierung, Cache oder Fallback-Verhalten – siehe [Batch-Prompt-Format](#batch-prompt-format). |

Sie können `--force` nicht mit `--force-update` kombinieren (beide schließen sich gegenseitig aus).

<a id="batch-prompt-format"></a>
## Batch-Prompt-Format

`translate-docs` sendet übersetzbare Segmente in **Batches** (gruppiert nach `batchSize` / `maxBatchChars`) an den aktiven LLM-Anbieter. Das Flag `--prompt-format` ändert nur das **Wire-Format** dieses Batches; `PlaceholderHandler`-Tokens, Markdown-AST-Prüfungen, SQLite-Cache-Schlüssel und der Fallback pro Segment bei Fehlschlagen der Batch-Analyse bleiben unverändert.

| Modus                   | Benutzernachricht                                                           | Modellantwort                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: ein `<seg id="N">…</seg>` pro Segment (mit XML-Escaping). | Nur `<t id="N">…</t>`-Blöcke, einer pro Segmentindex.       |
| `json-array` (Standard) | Ein JSON-Array von Zeichenketten, ein Eintrag pro Segment in der Reihenfolge.               | Ein JSON-Array der **gleichen Länge** (gleiche Reihenfolge).           |
| `json-object`          | Ein JSON-Objekt `{"0":"…","1":"…",…}`, indiziert nach Segmentindex.            | Ein JSON-Objekt mit den **gleichen Schlüsseln** und übersetzten Werten. |

Einige Modelle folgen einem Format zuverlässiger als einem anderen. Versuchen Sie daher einen anderen Modus, wenn ein Modell häufig fehlerhafte Batches oder nicht übereinstimmende Segment-IDs zurückgibt. `json-array` ist die Standardeinstellung, da es ein gängiges, einfaches Format ist, das Modelle im Allgemeinen gut verarbeiten.

Der Ausführungsheader gibt auch `Batch prompt format: …` aus, damit Sie den aktiven Modus bestätigen können. JSON-Label-Dateien (`docusaurusCatalogDir`) und SVG-Dateibatches verwenden dieselbe Einstellung, wenn diese Schritte als Teil von `translate-docs` (oder der Dokumentationsphase von `sync` – `sync` macht dieses Flag nicht verfügbar; es wird standardmäßig auf `json-array` gesetzt) ausgeführt werden.
