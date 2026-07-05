<a id="glossary"></a>
# Glossar

Die Registerkarte **Glossar** bearbeitet Ihre Benutzer-Glossar-CSV (`glossary.userGlossary` in der Konfiguration). Die Einträge hier sind Terminologiehinweise für `translate-ui` und `proofread-ui` – sie werden **nicht** für die Dokumentationsübersetzung verwendet.

Die Registerkarte ist ausgeblendet, wenn `glossary.userGlossary` nicht konfiguriert ist.

<a id="csv-columns"></a>
## CSV-Spalten

| Spalte | Bedeutung |
| --- | --- |
| **Originalsprachen-String** | Quellbegriff oder -phrase |
| **locale** | Ziel-Locale oder `*` für alle Locales |
| **Übersetzung** | Bevorzugte Übersetzung |
| **Erzwingen** | Wenn aktiviert, muss der Begriff genau wie angegeben übersetzt werden |

<a id="add-a-row"></a>
## Zeile hinzufügen

Verwenden Sie das Formular oben auf der Registerkarte:

1. Geben Sie **Original**, **Locale** (`*` oder einen Ziel-Locale-Code) und **Übersetzung** ein.
2. Aktivieren Sie optional **Erzwingen**.
3. Klicken Sie auf **Hinzufügen**.

Die CSV-Datei wird beim ersten Hinzufügen erstellt, falls sie noch nicht existiert.

<a id="edit-or-delete"></a>
## Bearbeiten oder löschen

- **Inline-Bearbeitung** – Ändern Sie Felder direkt in der Tabelle und klicken Sie auf **Speichern** in dieser Zeile.
- **Löschen** – Entfernen Sie eine Zeile mit der Löschfunktion.

Änderungen werden beim nächsten `translate-ui`-, `proofread-ui`- oder `sync`-UI-Schritt wirksam.

<a id="filters"></a>
## Filter

Filtern Sie nach **Originaltext**, **Locale** (einschließlich `*`) oder **Übersetzungstext**-Teilstring und klicken Sie dann auf **Anwenden**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Dashboard-Bearbeitungen und Glossar-Auto-Hinzufügen

Wenn Sie einen UI-String in der Registerkarte **UI-Strings** oder **UI-Plurale** korrigieren, kann der nächste `translate-ui`-Lauf diese Korrektur automatisch zum Glossar hinzufügen, wenn `glossary.autoAddUserEditedToGlossary` auf `true` gesetzt ist. Verwenden Sie die Registerkarte Glossar, um diese automatisch hinzugefügten Zeilen zu überprüfen, anzupassen oder zu entfernen.
