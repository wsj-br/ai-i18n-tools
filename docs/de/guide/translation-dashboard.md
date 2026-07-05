<a id="translation-dashboard"></a>
# Übersetzungs-Dashboard

Ausführen:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Der Standard-Listen-Port ist **8675**. Falls dieser Port nicht verfügbar ist, versucht der Server den nächsten Port (bis zu 1000 Versuche) und protokolliert den gewählten Port. Der veraltete Alias `editor` funktioniert weiterhin, gibt aber eine Warnung aus – bevorzugen Sie `dashboard`.

Dadurch wird eine lokale Web-Oberfläche gestartet, die auf Ihrer konfigurierten `cacheDir`-SQLite-Datenbank basiert – demselben Verzeichnis, das die CLI für Dokumentationssegmente, Protokolle und verwandte Metadaten verwendet. Es enthält die Registerkarten **Dokumentation** (zwischengespeicherte Dokumentationssegmente), **UI-Texte**, **UI-Pluralformen**, **Glossar**, **Fehler**, **Markdown-Probleme** und **Statistiken**.

![Translation Dashboard](/translation-dashboard.png)

Wenn Sie **Cache-Zeilen** in dieser App bearbeiten (z. B. Dokumentationsabschnitte), führen Sie `sync --force-update` oder den entsprechenden Übersetzungsbefehl mit `--force-update` aus, damit die Ausgaben auf der Festplatte mit dem Cache übereinstimmen. Wenn sich später der **Quelltext** im Repository ändert, ändern sich die Segment-Hashes und manuelle Bearbeitungen des alten Textes werden überschrieben.

<a id="failures-document-translation"></a>
### Fehler (Dokumentenübersetzung)

Die Registerkarte **Fehler** betrifft ausschließlich die **Dokumentationsübersetzung**. Sie liest Fehlerdatensätze aus der SQLite-Datenbank, die geschrieben werden, wenn ein Segment für eine Locale nicht erfolgreich übersetzt werden konnte – z. B. leere oder ungültige Modellausgaben, Validierungsfehler nach der Übersetzung (`AST mismatch`, Platzhalter-Durchsickern und ähnliche **Qualitätsprüfungen**) oder eine **kritische** Bedingung, die den Fortschritt blockiert hat. Sie hilft Ihnen dabei, folgende Fragen zu beantworten: *Welches Quellsegment ist fehlgeschlagen, für welche Locale und welches Modell, und welcher Fehlertext wurde aufgezeichnet?*

<a id="when-to-use-it"></a>
#### Wann Sie es verwenden sollten

- Nachdem `translate-docs` oder `sync` mit Fehlern, teilweisen Gebietsschemata oder unklaren Protokollen abgeschlossen wurde – können Sie Fehler sortieren und filtern, anstatt nur durch die Terminalausgabe zu scrollen.
- Wenn Sie die **Nacharbeit priorisieren** möchten: nach **# Fehler** sortieren, damit Segmente, die bei mehreren Wiederholungen fehlgeschlagen sind, zuerst erscheinen; diese sind gute Kandidaten, um sie in der Quell-Markdown-Datei zu **vereinfachen oder umzuformatieren**, damit zukünftige Durchläufe erfolgreich sind.
- Wenn Sie das **genaue Segment** benötigen – Dateipfad, Zeilenhinweis, Quell-Hash und vollständiger Quelltext – um den richtigen Absatz in Ihrem Repository zu bearbeiten.

<a id="why-source-edits-matter"></a>
#### Warum Quelltextänderungen wichtig sind

Dichtes Inline-Markup (**fett** kombiniert mit `` `code` ``, verschachtelte Hervorhebungen, lange Sätze mit vielen Abschnitten) erschwert es Modellen, Übersetzungen zurückzugeben, die weiterhin strukturelle Prüfungen bestehen. Segmente mit **mehreren aufgezeichneten Fehlern** profitieren in der Regel stärker von einer **Umschreibung oder Aufteilung** der Quelle (oder dem Verschieben von Beispielen in gefährmete Codeblöcke), als von erneuten Übersetzungsversuchen mit unverändertem Text. Dies entspricht [Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### So verwenden Sie die Registerkarte

1. Öffnen Sie **Fehler** im Dashboard (dieselbe Browsersitzung wie [Translation Dashboard](#translation-dashboard)).
2. Lesen Sie den **Zusammenfassungsstreifen** (Segmente mit einem Fehler sowie Anzahlen für Segmente mit **1**, **2** oder **3+** Fehlermeldungen).
3. Filtern Sie nach teilweisem **Dateinamen**, **Gebietsschema**, **Modell**, **Qualitätsfehler** (Werte stammen aus Ihrem Cache), **nur schwerwiegende Fehler** sowie optional nach **Quell-Hash**, **Quelltext** oder Teilzeichenfolge der **Fehlermeldung** – klicken Sie dann auf **Übernehmen**.
4. Wählen Sie **Sortierung: # Fehler** (Standard) oder **Sortierung: Dateipfad + Zeilennummer**.
5. Verwenden Sie die Paginierung oben oder unten in der Tabelle. **Klicken Sie auf eine Zeile**, um den vollständigen Quelltext anzuzeigen. Die Linksteuerung in der Zeile (falls aktiviert) fordert den Serverprozess auf, Datei-/Zeilen-Hinweise im **Terminal** anzuzeigen, in dem `ai-i18n-tools dashboard` ausgeführt wird – nützlich, um vom Browser direkt zum Editor zu wechseln.
6. Beheben Sie die **Quelldatei** in Ihrem Projekt und führen Sie anschließend erneut `translate-docs` oder `sync` aus. Falls die Liste nach einem erfolgreichen Durchlauf **veraltet** erscheint, führen Sie `ai-i18n-tools sync --force-update` aus und laden Sie das Dashboard neu (der Fehlerbereich zeigt denselben Hinweis).

Für die dateibasierte Fehlersuche parallel zur Benutzeroberfläche können Sie weiterhin `translate-docs --debug-failed` verwenden, um `FAILED-TRANSLATION`-Details unter `cacheDir` während Wiederholungen zu schreiben – siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Markdown-Probleme (statische Prüfungen)

Die Registerkarte **Markdown-Probleme** listet Zeilen aus der `markdown_source_issues` SQLite-Tabelle auf. Jede Zeile ist ein **Vor-Übersetzungs**-Fund: beispielsweise aufeinanderfolgende Delimiter, die unter den gleichen CommonMark-ähnlichen Regeln, die `translate-docs` für Maskierung verwendet, niemals als Hervorhebung/Durchstreichung gepaart werden, ein Inline-Code-Abschnitt, der mit Backticks geöffnet, aber nie geschlossen wird, oder `STRONG_OUTSIDE_LINK`, wenn `**` / `__` einen `[text](url)`-Link umschließen (fetten Text nur innerhalb des Link-Textes platzieren). Dies ist **nicht** dasselbe wie **Fehler**, die pro-Lokalisierung Modellausgaben und Nach-Übersetzungs-Validierungsprobleme aufzeichnen (`AST mismatch`, Platzhalter-Durchsickern und Ähnliches).

Verwenden Sie diese Registerkarte, wenn Sie den **Quell-Markdown** beheben möchten, bevor Token verbraucht werden – insbesondere wenn Qualitätsprüfungen immer wieder an der Struktur scheitern. Filtern Sie nach Dateipfad (Teilübereinstimmung mit dem Cache-Schlüssel, einschließlich `doc-block:{index}:`-Präfixen), **Fehlercode** oder **Quell-Hash**; sortieren Sie nach Dateipfad + Zeile oder nach neuestem Scan-Zeitpunkt. Die Link-Schaltfläche protokolliert Datei-/Zeilen-Hinweise im Terminal, in dem `ai-i18n-tools dashboard` ausgeführt wird (ähnlich wie bei der Registerkarte Dokumentation).

**Zeilen aktualisieren:** Führen Sie `ai-i18n-tools check-markdown` aus (optionaler `-p`- / `--path`-Bereich, `--no-cache` zum Überspringen von SQLite, `--json` für maschinenlesbare Ausgabe auf stdout mit menschlichen Zeilen auf stderr). Standardmäßig scannt jede ausgeführte `translate-docs`-Markdown-Datei auch Zeilen für diese Datei neu und ersetzt sie, wenn `docs[].warnMarkdownSourceIssues` nicht auf `false` gesetzt ist. Das Löschen aller Übersetzungen für einen Cache-Dateipfad entfernt Markdown-Problemzeilen für diesen Dateipfad als Teil desselben Bereinigungspfads wie Fehler. `cleanup` bereinigt zusätzlich Markdown-Problemzeilen, deren aufgelöster Quellpfad auf der Festplatte fehlt, sodass Diagnosen für gelöschte oder umbenannte Dateien (selbst solche, die nur von `check-markdown` gescannt, aber nie übersetzt wurden) nicht bestehen bleiben.
