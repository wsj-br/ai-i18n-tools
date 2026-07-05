<a id="statistics"></a>
# Statistiken

Die Registerkarte **Statistiken** zeigt schreibgeschützte Aggregate für Ihren Dokumentations-Cache und den UI-String-Katalog an. Die Daten stimmen mit `ai-i18n-tools statistics` in der Befehlszeile überein.

Verwenden Sie sie, um folgende Fragen zu beantworten: *Wie viel ist übersetzt, welche Modelle wurden verwendet und wo gibt es Lücken?*

<a id="documentation-cache"></a>
## Dokumentations-Cache

**Zusammenfassungskarten:**

| Karte | Bedeutung |
| --- | --- |
| Gesamtzahl der Segmente | Alle gecachten Dokumentsegmentzeilen |
| Veraltet / Aktiv | Segmente, die seit ihrer Erstellung nie wiederverwendet wurden, vs. mindestens einmal wiederverwendete Segmente |
| Verfolgte Dateien / Eindeutige Dateipfade | Dateianzahl im Cache |
| Verwendete Modelle | Eindeutige Übersetzungsmodelle |
| Glossareinträge | Zeilenanzahl in der Benutzerglossar-CSV (sofern konfiguriert) |

**Tabellen:**

- **Segmente nach Gebietsschema** – Anzahl pro Zielgebietsschema, mit Aufschlüsselung nach veraltet/aktiv
- **Segmente nach Modell** – Anzahl pro Modell
- **Modell × Gebietsschema-Matrix** – vollständige Kreuztabelle (entspricht dem CLI `--max-columns`-Limit in der Terminalausgabe)

<a id="ui-strings"></a>
## UI-Strings

Wird angezeigt, wenn `strings.json` verfügbar ist:

| Abschnitt | Bedeutung |
| --- | --- |
| Zählungen für Singular vs. Plural | Gesamtzahl der Einträge ohne Plural und der Pluralgruppen |
| Abdeckung für Singular pro Gebietsschema | Wie viele Singular-Strings eine Übersetzung pro Gebietsschema haben |
| Plural-Vollständigkeit pro Gebietsschema | Wie viele Pluralgruppen alle erforderlichen CLDR-Formen haben |
| Nach Modell / Modell × Gebietsschema | Gleiches Matrix-Layout wie der Dokumentations-Cache |

<a id="no-editing-on-this-tab"></a>
## Keine Bearbeitung auf dieser Registerkarte

Statistiken ist schreibgeschützt. Um Daten zu ändern, verwenden Sie die anderen Dashboard-Registerkarten oder führen Sie die Übersetzungsbefehle erneut aus und laden Sie dann das Dashboard neu.

Für Skriptausgaben führen Sie Folgendes aus:

```bash
ai-i18n-tools statistics
# Optional: widen model × locale tables
# ai-i18n-tools statistics --max-columns 12
```
