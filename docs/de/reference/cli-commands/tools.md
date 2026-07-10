<a id="cli--tools"></a>
# CLI — Tools

<a id="dashboard"></a>
### `dashboard`

**Synopsis:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Startet das Übersetzungs-Dashboard (lokale Weboberfläche für Cache-Segmente, `strings.json`, Glossar, Fehler und Statistiken). Standard-Port **8675** (versucht den nächsten Port, falls nicht verfügbar). Mit `--no-open` wird der Standardbrowser nicht automatisch geöffnet. Der veraltete Alias `editor` funktioniert weiterhin, gibt aber eine Warnung aus.

**Wichtige Optionen:** `-p` / `--port`, `--no-open`

**Siehe auch:** [Übersetzungs-Dashboard](/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis:** `ai-i18n-tools glossary-generate [-o <path>]`

Schreibt eine leere `glossary-user.csv`-Vorlage. Verweigert das Überschreiben einer bestehenden Datei (Exit-Code **1**).

**Wichtige Optionen:** `-o` / `--output`

`-o`: Überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).

**Siehe auch:** [Dashboard-Glossar](/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Zeigt die Hilfe für einen Unterbefehl an (gleiche Ausgabe wie `ai-i18n-tools <command> --help`).
