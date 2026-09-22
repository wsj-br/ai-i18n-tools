<a id="cli--dashboard--glossary"></a>
# CLI — Dashboard & Glossar

<a id="dashboard"></a>
### `dashboard`

**Synopsis:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Starten Sie das Übersetzungs-Dashboard (lokale Web-UI für Cache-Segmente, `strings.json`, Glossar, Fehler, Statistiken und Nutzung). Standard-Port **8675** (versucht den nächsten Port, falls nicht verfügbar). Mit `--no-open` wird der Standardbrowser nicht automatisch geöffnet. `dash` ist ein gleichwertiger Alias. Der veraltete Alias `editor` funktioniert weiterhin, gibt aber eine Warnung aus.

**Wichtige Optionen:** `-p` / `--port`, `--no-open`

**Siehe auch:** [Übersetzungs-Dashboard](/de/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Synopsis:** `ai-i18n-tools glossary-generate [-o <path>]`

Schreibt eine leere `glossary-user.csv`-Vorlage. Verweigert das Überschreiben einer bestehenden Datei (Exit-Code **1**).

**Wichtige Optionen:** `-o` / `--output`

`-o`: Überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).

**Siehe auch:** [Glossar](/de/guide/glossary), [Dashboard-Glossar](/de/guide/translation-dashboard/glossary)
