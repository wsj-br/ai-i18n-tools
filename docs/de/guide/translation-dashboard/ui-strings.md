<a id="ui-strings--plurals"></a>
# UI-Strings & Pluralformen

Die Tabs **UI-Strings** und **UI-Pluralformen** bearbeiten Zeilen in Ihrem `strings.json`-Katalog. Änderungen im Dashboard werden direkt in diese Datei geschrieben – nicht in den SQLite-Dokumentations-Cache.

Verwenden Sie diese Tabs, wenn eine UI-Beschriftung oder Pluralform nach `translate-ui` oder `sync` manuell korrigiert werden muss.

<a id="ui-strings-tab"></a>
## UI-Strings-Tab

Listet nicht-plurale Einträge aus `strings.json` auf – eine Zeile pro String-ID und Gebietsschema.

<a id="filters"></a>
### Filter

| Filter | Zweck |
| --- | --- |
| **ID / Hash** | String-ID oder Hash |
| **Dateiname (teilweise)** / **Dateipfad auswählen** | Quellendateibereich |
| **Quelle enthält** / **Übersetzung enthält** | Text-Teilstring |
| **Gebietsschema** | Einzelnes Gebietsschema oder alle |
| **Modell** | Modell, das die Übersetzung erstellt hat |

<a id="edit"></a>
### Bearbeiten

1. Klicken Sie auf das Bearbeitungssymbol in einer Zeile.
2. Ändern Sie den übersetzten Text und speichern Sie.

Der `models[locale]`-Eintrag wird auf `user-edited` gesetzt. Führen Sie einfaches `sync` oder `translate-ui` aus, um flache Gebietsschema-Dateien (`de.json` usw.) zu aktualisieren. Verwenden Sie **nicht** `--force` – es übersetzt jeden Eintrag neu und kann manuelle Korrekturen überschreiben.

Wenn `glossary.autoAddUserEditedToGlossary` auf `true` (Standard) eingestellt ist, kann das nächste `translate-ui` oder `sync` Ihre Bearbeitung automatisch an die Benutzer-Glossar-CSV-Datei anhängen – siehe [Konfiguration](/reference/configuration#glossary).

<a id="delete"></a>
### Löschen

- **Zeilenlöschsymbol** – entfernt einen Gebietsschema-Bucket aus einem Eintrag.
- **Gefilterte löschen** – löscht alle Gebietsschema-Buckets, die den aktuellen Filtern entsprechen, in einem Rutsch.

<a id="log-links"></a>
### Protokoll-Links

Das 🔗-Steuerelement gibt Quellendatei:Zeilenpositionen aus dem `locations`-Array des Eintrags in das Terminal aus.

<a id="ui-plurals-tab"></a>
## UI-Pluralformen-Tab

Listet Einträge von Pluralgruppen (`"plural": true` in `strings.json`). Jede Zeile zeigt die Kardinalformen eines Gebietsschemas (`one`, `other` und gebietsschemaspezifische Formen).

<a id="filters-1"></a>
### Filter

Wie bei der Registerkarte „UI-Strings“, zusätzlich:

| Filter | Zweck |
| --- | --- |
| **Vollständig / Unvollständig** | Ob alle erforderlichen CLDR-Formen für das ausgewählte Gebietsschema vorhanden sind |

Unvollständigen Zeilen fehlen eine oder mehrere erforderliche Formen für dieses Gebietsschema.

<a id="edit-1"></a>
### Bearbeiten

1. Klicken Sie auf das Bearbeitungssymbol in einer Zeile.
2. Bearbeiten Sie jede CLDR-Form im Modal (ein Textbereich pro Form).
3. Speichern – leere Formularzeichenfolgen werden beim Speichern entfernt.

Der `models[locale]` des Eintrags wird auf `user-edited` gesetzt. Führen Sie anschließend ein einfaches `sync` oder `translate-ui` aus (nicht `--force`).

<a id="other-columns"></a>
### Andere Spalten

- **Formen** – zeigt `one: "…"`, `other: "…"` usw. an.
- **`zeroDigit`-Badge** – schreibgeschützte Anzeige, wenn die Quelle ein Pluralmuster mit der Ziffer Null verwendet.

Erforderliche Formen stammen aus CLDR-Regeln pro Gebietsschema (`requiredPluralFormsByLocale`).

<a id="delete-1"></a>
### Löschen

Wie bei UI-Strings: Löschen pro Gebietsschema oder Massenaktion **Gefilterte löschen**.
