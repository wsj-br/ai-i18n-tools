<a id="markdown-issues-static-checks"></a>
# Markdown-Probleme (statische Prüfungen)

Die Registerkarte **Markdown-Probleme** listet Zeilen aus der SQLite-Tabelle `markdown_source_issues` auf. Jede Zeile ist ein **Vorübersetzungsfund**: zum Beispiel Begrenzerfolgen, die sich nie als Hervorhebung/Durchstreichung unter denselben CommonMark-Regeln paaren, die `translate-docs` zum Maskieren verwendet, ein Inline-Code-Bereich, der mit Backticks geöffnet, aber nie geschlossen wurde, oder `STRONG_OUTSIDE_LINK`, wenn `**` / `__` einen `[text](url)`-Link umschließen (Fett innerhalb des Linktextes platzieren).

Dies ist **nicht** dasselbe wie **Fehler**, die die Modellausgabe pro Gebietsschema und Probleme bei der Nachübersetzungsvalidierung (`AST mismatch`, Platzhalterlecks und Ähnliches) aufzeichnen.

<a id="when-to-use-it"></a>
## Wann es verwendet werden sollte

Verwenden Sie diese Registerkarte, wenn Sie den **Quell-Markdown** korrigieren möchten, bevor Sie Tokens ausgeben – insbesondere wenn Qualitätsprüfungen aufgrund der Struktur in der Registerkarte [Fehler](/guide/translation-dashboard/failures) immer wieder fehlschlagen.

<a id="how-to-use-the-tab"></a>
## So verwenden Sie den Tab

1. Lesen Sie den **Zusammenfassungsstreifen** – Gesamtzahl der Problemzeilen und Zählungen pro Problemcode.
2. Filtern Sie nach Dateipfad (Teilübereinstimmung mit dem Cache-Schlüssel, einschließlich `doc-block:{index}:`-Präfixen), **Problemcode** oder **Quell-Hash**.
3. Sortieren Sie nach **Dateipfad + Zeile** (Standard) oder nach **neuester Scanzeit**.
4. Die 🔗-Link-Schaltfläche protokolliert Datei-/Zeilenhinweise im Terminal, in dem `ai-i18n-tools dashboard` ausgeführt wird.

Korrigieren Sie die Quelldatei und führen Sie dann die Übersetzung erneut aus.

<a id="refreshing-rows"></a>
## Zeilen aktualisieren

| Befehl / Ereignis | Effekt |
| --- | --- |
| `ai-i18n-tools check-markdown` | Konfigurierte Dokumente erneut scannen; optionaler `-p` / `--path`-Bereich, `--no-cache`, `--json` |
| `translate-docs` (Standard) | Scannt und ersetzt Zeilen für jede Markdown-Datei, wenn `docs[].warnMarkdownSourceIssues` nicht `false` ist |
| Alle Übersetzungen für einen Dateipfad löschen | Entfernt Markdown-Problemzeilen für diesen Dateipfad (gleiche Bereinigung wie bei Fehlern) |
| `cleanup` | Löscht die gesamte `markdown_source_issues`-Tabelle und führt dann `sync --force-update` aus, um die Zeilen neu zu füllen |

<a id="common-issue-codes"></a>
## Häufige Problemcodes

| Code | Bedeutung |
| --- | --- |
| Ungepaarte Hervorhebung / Durchstreichung | Begrenzerfolgen, die sich unter CommonMark-Regeln nie schließen |
| Ungeschlossener Inline-Code | Backtick-Bereich geöffnet, aber nicht geschlossen |
| `STRONG_OUTSIDE_LINK` | Fett-Marker umschließen einen Markdown-Link – Fett innerhalb des Linktextes verschieben |

Siehe auch [Komplexer Markdown und fehlgeschlagene Qualitätsprüfungen](/guide/documents/#complex-markdown-and-failed-quality-checks).
