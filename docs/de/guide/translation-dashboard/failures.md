<a id="failures-document-translation"></a>
# Fehler (Dokumentübersetzung)

Der Tab **Fehler** ist nur für die **Dokumentenübersetzung** vorgesehen. Er liest Fehlerdatensätze aus SQLite, wenn ein Segment für ein Gebietsschema nicht erfolgreich übersetzt werden konnte – zum Beispiel leere oder ungültige Modellausgaben, Validierungsfehler nach der Übersetzung (`AST mismatch`, Platzhalterlecks und ähnliche **Qualitätsprüfungen**) oder ein **fataler** Zustand, der den Fortschritt blockierte.

Es hilft Ihnen bei der Beantwortung der Frage: *Welches Quellsegment ist für welches Gebietsschema und Modell fehlerhaft, und welcher Fehlertext wurde aufgezeichnet?*

<a id="when-to-use-it"></a>
## Wann es verwendet werden sollte

- Nachdem `translate-docs` oder `sync` mit Fehlern, teilweisen Gebietsschemas oder verwirrenden Protokollen abgeschlossen wurde – sortieren und filtern Sie Fehler, anstatt nur die Terminalausgabe zu scrollen.
- Wenn Sie die **Nacharbeit priorisieren** möchten: Sortieren Sie nach **# Fehler**, damit Segmente, die bei Wiederholungsversuchen wiederholt fehlgeschlagen sind, zuerst erscheinen; diese sind starke Kandidaten, um im Quell-Markdown **vereinfacht oder neu formatiert** zu werden.
- Wenn Sie das **genaue Segment** benötigen – Dateipfad, Zeilenhinweis, Quell-Hash und vollständiger Quelltext –, um den richtigen Absatz in Ihrem Repository zu bearbeiten.

<a id="why-source-edits-matter"></a>
## Warum Quellbearbeitungen wichtig sind

Dichte Inline-Auszeichnungen (**fett** gemischt mit `` `code` ``, verschachtelte Hervorhebungen, lange Sätze mit vielen Spannen) erschweren es Modellen, Übersetzungen zurückzugeben, die noch strukturelle Prüfungen bestehen. Segmente mit **mehreren aufgezeichneten Fehlern** verbessern sich in der Regel mehr durch **Umschreiben oder Aufteilen** der Quelle (oder Verschieben von Beispielen in umgrenzte Codeblöcke) als durch erneutes Ausführen der Übersetzung auf unverändertem Text. Dies stimmt mit [Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen](/de/guide/documents/#complex-markdown-and-failed-quality-checks) überein.

<a id="how-to-use-the-tab"></a>
## So verwenden Sie den Tab

1. Öffnen Sie **Fehler** im Dashboard.
2. Lesen Sie den **Zusammenfassungsstreifen** – Segmente mit Fehlern sowie Zählungen für Segmente mit **1**, **2** oder **3+** Fehlerdatensätzen.
3. Filtern Sie nach partiellem **Dateinamen**, **Gebietsschema**, **Modell**, **Qualitätsfehler** (Werte stammen aus Ihrem Cache), **nur fatal** und optionalem **Quell-Hash**, **Quelltext** oder **Fehlermeldungs-Teilstring** – klicken Sie dann auf **Anwenden**.
4. Wählen Sie **Sortieren: # Fehler** (Standard) oder **Sortieren: Dateipfad + Zeilennummer**.
5. Verwenden Sie die Paginierung oben oder unten in der Tabelle. **Klicken Sie auf eine Zeile**, um den vollständigen Quelltext zu erweitern. Die Spalte **Modell** zeigt das Fehlermodell und, falls verfügbar, das Modell aus einem späteren erfolgreichen Cache-Eintrag an.
6. Die 🔗-Verknüpfung protokolliert Datei-/Zeilenhinweise im **Terminal**, in dem `ai-i18n-tools dashboard` ausgeführt wird.
7. Beheben Sie die **Quelldatei** in Ihrem Projekt und führen Sie dann `translate-docs` oder `sync` erneut aus. Wenn die Liste nach einem erfolgreichen Durchlauf **veraltet** aussieht, führen Sie `ai-i18n-tools sync --force-update` aus und laden Sie das Dashboard neu.

Für dateibasiertes Debugging neben der Benutzeroberfläche verwenden Sie `translate-docs --debug-failed`, um `FAILED-TRANSLATION`-Details unter `cacheDir` während der Wiederholungsversuche zu schreiben – siehe [Cache-Verhalten und `translate-docs`-Flags](/de/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags).

<a id="failures-vs-markdown-issues"></a>
## Fehler vs. Markdown-Probleme

| | **Fehler** | **Markdown-Probleme** |
| --- | --- | --- |
| Wann aufgezeichnet | Während der Übersetzung (pro Gebietsschema) | Vor der Übersetzung (Quellscan) |
| Typische Ursache | Schlechte Modellausgabe, Validierungsfehler | Ungepaarte Hervorhebung, ungeschlossene Code-Spannen, Fett außerhalb von Links |
| Behebung | Quelle bearbeiten und neu übersetzen | Quell-Markdown korrigieren, dann neu übersetzen |

Siehe [Markdown-Probleme](/de/guide/translation-dashboard/markdown-issues) für statische Prüfungen vor der Übersetzung.
