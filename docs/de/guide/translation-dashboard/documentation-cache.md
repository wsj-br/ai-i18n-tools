<a id="documentation-cache"></a>
# Dokumentations-Cache

Die Registerkarte **Dokumentation** listet zwischengespeicherte Übersetzungen von Dokumentationssegmenten auf, die in SQLite unter Ihrem konfigurierten `cacheDir` gespeichert sind. Jede Zeile ist ein Quellsegment (identifiziert durch Dateipfad, Zeilenhinweis und Quell-Hash), das in ein Zielsprachgebiet übersetzt wurde.

Verwenden Sie diese Registerkarte, wenn Sie zwischengespeicherte Dokumentationsübersetzungen **überprüfen, überschreiben oder bereinigen** möchten, ohne die gesamte Pipeline erneut auszuführen.

<a id="filters"></a>
## Filter

| Filter | Zweck |
| --- | --- |
| **Dateipfad auswählen** / **Dateiname (teilweise)** | Auf eine Datei oder einen Pfad-Substring eingrenzen |
| **Alle Sprachgebiete** | Zielsprachgebiet |
| **Alle Modelle** | Modell, das die Übersetzung erstellt hat |
| **Quell-Hash** | Exakter Segment-Hash |
| **Quelltextsuche** / **Übersetzte Textsuche** | Substring-Übereinstimmung |
| **Alle Einträge** | **Veraltet** (seit Erstellung nie wiederverwendet) oder **Aktiv** (hat einen `last_hit_at`-Zeitstempel) |

Klicken Sie nach dem Ändern der Filter auf **Anwenden**. **Löschen** setzt alle Filterfelder zurück.

<a id="edit-a-translation"></a>
## Eine Übersetzung bearbeiten

1. Klicken Sie auf das Bearbeitungssymbol in einer Zeile.
2. Ändern Sie den übersetzten Text im Modal und speichern Sie.

Der Cache speichert das Modell `user-edited` für diese Zeile. Führen Sie `sync --force-update` oder `translate-docs --force-update` aus, damit die Markdown-Ausgaben auf der Festplatte mit dem Cache übereinstimmen.

Wenn sich der **Quelltext** in Ihrem Repository später ändert, ändert sich der Segment-Hash, und manuelle Bearbeitungen für den alten Text werden beim nächsten Übersetzungsdurchlauf überschrieben.

<a id="delete-rows"></a>
## Zeilen löschen

- **Zeilenlöschsymbol** – entfernt einen Cache-Eintrag (ein Sprachgebiet für einen Quell-Hash).
- **Gefilterte löschen** – entfernt alle Zeilen, die den aktuellen Filtern entsprechen (Bestätigung erforderlich).
- **Alle für Dateipfad löschen** – entfernt jede zwischengespeicherte Übersetzung für den ausgewählten Dateipfad, einschließlich zugehöriger Fehler- und Markdown-Problemzeilen für diese Datei.

Führen Sie nach Massenlöschungen `translate-docs` oder `sync` aus, um fehlende Übersetzungen neu zu generieren.

<a id="table-columns"></a>
## Tabellenspalten

| Spalte | Bedeutung |
| --- | --- |
| **Dateipfad** | Cache-Schlüssel für die Quelldatei |
| **Zeile Nr.** | Zeilenhinweis in der Quelldatei |
| **Quell-Hash** | Hash des Quellsegmenttextes |
| **Quelltext** | Originalsegment (Quell-Locale) |
| **Locale** | Ziel-Locale |
| **Übersetzter Text** | Zwischengespeicherte Übersetzung |
| **Modell** | Modell, das die Übersetzung erstellt hat (oder `user-edited`) |
| **Erstellt** | Wann die Zeile zuerst geschrieben wurde |
| **Zuletzt verwendet** | Letzte Verwendung dieses Cache-Eintrags (roter Strich = veraltet) |

Die Paginierung ist standardmäßig auf 50 Zeilen pro Seite eingestellt (25 oder 100 sind ebenfalls verfügbar).

<a id="log-links"></a>
## Protokoll-Links

Das 🔗-Steuerelement in einer Zeile fordert den Server auf, Datei- und Zeilenhinweise im Terminal auszugeben, in dem das Dashboard ausgeführt wird. Verwenden Sie es, um die richtige Quellposition in Ihrem Editor zu öffnen.
