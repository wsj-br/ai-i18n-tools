<a id="glossary"></a>
# Glossar

Auf der Registerkarte **Glossar** wird Ihre Benutzerglossar-CSV-Datei (`glossary.userGlossary` in der Konfiguration) bearbeitet. Die Einträge hier sind Terminologiehinweise für `translate-ui`, `proofread-ui` und `translate-docs` (über das gemeinsame Glossar). Kompakte UI-Label-Abkürzungen (z. B. `Size` → `Tam` / `Tam.`) werden für die UI-Übersetzung beibehalten, aber beim Erstellen von Dokument-Prompts übersprungen, damit sie die Modelle nicht zu erfundenen <code v-pre>{{…}}</code>-Tokens in Markdown/MDX drängen.

Die Registerkarte ist ausgeblendet, wenn `glossary.userGlossary` nicht konfiguriert ist.

<a id="csv-columns"></a>
## CSV-Spalten

| Spalte | Bedeutung |
| --- | --- |
| **Originalsprachen-String** | Quellbegriff oder -phrase |
| **locale** | Ziel-Locale oder `*` für alle Locales |
| **Übersetzung** | Bevorzugte Übersetzung |
| **Kontext** | Optionale Erklärung der beabsichtigten Bedeutung oder Verwendung in der Ausgangssprache. Wird nur gesendet, wenn dieser Begriff mit dem aktuellen Stapel übereinstimmt. |
| **Erzwingen** | Wenn aktiviert, muss der Begriff genau wie angegeben übersetzt werden |

<a id="add-a-row"></a>
## Zeile hinzufügen

Verwenden Sie das Formular oben auf der Registerkarte:

1. Geben Sie **Original**, **Gebietsschema** (`*` oder einen Zielgebietsschema-Code) und **Übersetzung** ein.
2. Fügen Sie optional **Kontext** (Nutzungshinweise) hinzu und aktivieren Sie **Erzwingen**.
3. Klicken Sie auf **Hinzufügen**.

Die CSV-Datei wird beim ersten Hinzufügen erstellt, falls sie noch nicht existiert.

<a id="edit-or-delete"></a>
## Bearbeiten oder löschen

- **Inline-Bearbeitung** – Ändern Sie Felder direkt in der Tabelle und klicken Sie auf **Speichern** in dieser Zeile.
- **Löschen** – Entfernen Sie eine Zeile mit der Löschfunktion.

Änderungen werden beim nächsten Ausführen von `translate-ui`, `proofread-ui`, `translate-docs` oder `sync` wirksam. Das Bearbeiten einer **Kontext**-Notiz (oder `glossary.contextFiles` in der Konfiguration) aktualisiert automatisch die zwischengespeicherten Übersetzungen für das betroffene Gebietsschema – Sie benötigen `--force` nicht.

Halten Sie Kontextdateien als kompakte Markdown- oder Klartext-Kurzbeschreibungen außerhalb übersetzter `docs[]`-Bäume. Der Text wird bei jeder passenden Anfrage an das LLM gesendet; fügen Sie keine Geheimnisse oder personenbezogenen Daten hinzu. Wie diese Dateien und die CSV erstellt werden, wird im [Glossar](/de/guide/glossary) beschrieben.

<a id="filters"></a>
## Filter

Filtern Sie nach **Originaltext**, **Gebietsschema** (einschließlich `*`), **Übersetzungstext** oder **Kontext**-Teilzeichenfolge und klicken Sie dann auf **Anwenden**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Dashboard-Bearbeitungen und Glossar-Auto-Hinzufügen

Wenn Sie einen UI-String in der Registerkarte **UI-Strings** oder **UI-Plurale** korrigieren, kann der nächste `translate-ui`-Lauf diese Korrektur automatisch zum Glossar hinzufügen, wenn `glossary.autoAddUserEditedToGlossary` auf `true` gesetzt ist. Verwenden Sie die Registerkarte Glossar, um diese automatisch hinzugefügten Zeilen zu überprüfen, anzupassen oder zu entfernen.
