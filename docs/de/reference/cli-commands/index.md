<a id="cli-reference"></a>
# CLI-Referenz

Führen Sie `ai-i18n-tools <command> --help` für jede Flagge in einem Befehl aus. Die nachfolgenden Seiten fügen Kontext, Schlüsseloptionen und Links zu Themenleitfäden hinzu.

<a id="command-overview"></a>
## Befehlsübersicht

<a id="setupsetup"></a>
### [Einrichtung](setup)

| Befehl | Zusammenfassung |
|---------|---------|
| [`version`](setup#version) | Druckt die CLI-Version und den Build-Timestamp. |
| [`init`](setup#init) | Erstellt eine Starter-Konfiguration; `-t` wählt eine Scaffold-Vorlage aus. |

<a id="models--catalogmodels"></a>
### [Modelle & Katalog](models)

| Befehl | Zusammenfassung |
|---------|---------|
| [`check-models`](models#check-models) | Validiert konfigurierte Modell-IDs gegen den aktiven Anbieter. |
| [`list-models`](models#list-models) | Listet Modelle auf, die vom aktiven Anbieter beworben werden. |
| [`bench-models`](models#bench-models) | Benchmark konfigurierte Modelle auf einer Sample-Übersetzung. |
| [`list-languages`](models#list-languages) | Listet den gebündelten UI-Sprachenkatalog auf. |

<a id="ui-stringsui-strings"></a>
### [UI-Strings](ui-strings)

| Befehl | Zusammenfassung |
|---------|---------|
| [`extract`](ui-strings#extract) | Aktualisiert `strings.json` aus Quell-Literalen und HTML-Markern. |
| [`mark-html`](ui-strings#mark-html) | Fügt `data-i18n*`-Marker in HTML-Dateien ein. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | Erstellt `ui-languages.json` aus Konfig-Lokalen. |
| [`translate-ui`](ui-strings#translate-ui) | Übersetzt UI-Strings (`strings.json` → Lokale JSON). |
| [`sync-ui`](ui-strings#sync-ui) | Extrahiert und übersetzt dann UI-Strings. |
| [`proofread-ui`](ui-strings#proofread-ui) | Extrahiert und überprüft dann Quell-Lokale UI-Strings mit LLM. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | Exportiert `strings.json` nach XLIFF 2.0. |

<a id="documentsdocuments"></a>
### [Dokumente](documents)

| Befehl | Zusammenfassung |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Übersetzt Markdown, MDX, `.astro` und Framework-Kataloge. |
| [`write-heading-ids`](documents#write-heading-ids) | Fügt HTML-Ankerzeilen vor ATX-Überschriften ein. |
| [`check-markdown`](documents#check-markdown) | Scanniert Markdown/MDX auf Trennzeichen- und Betonungsprobleme. |

<a id="other-contentcontent"></a>
### [Andere Inhalte](content)

| Befehl | Zusammenfassung |
|---------|---------|
| [`translate-json`](content#translate-json) | Übersetzt verschachteltes JSON pro `json[]`-Konfig-Block. |
| [`translate-svg`](content#translate-svg) | Übersetzt SVG-Dateien, die in `config.svg` konfiguriert sind. |

<a id="workflows--statusworkflows"></a>
### [Workflows & Status](workflows)

| Befehl | Zusammenfassung |
|---------|---------|
| [`sync`](workflows#sync) | Führt Extraktion + UI + SVG + Dokumente + JSON in einer Pipeline aus. |
| [`status`](workflows#status) | Zeigt die Übersetzungsabdeckung von UI, Dokumentation und JSON an. |
| [`statistics`](workflows#statistics) | Zeigt Cache- und `strings.json`-Statistiken an. |

<a id="cache--maintenancemaintenance"></a>
### [Cache & Wartung](maintenance)

| Befehl | Zusammenfassung |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | Bereinigt veraltete Cache-Zeilen und füllt Markdown-Probleme neu auf. |
| [`clean-temp`](maintenance#clean-temp) | Sucht und löscht `*.log`, `*.tmp` und Cache-Backups. |
| [`purge-locale`](maintenance#purge-locale) | Entfernt Cache-Zeilen und generierte Artefakte für Gebietsschema(s). |

<a id="toolstools"></a>
### [Tools](tools)

| Befehl | Zusammenfassung |
|---------|---------|
| [`dashboard`](tools#dashboard) | Startet die Web-UI des Übersetzungs-Dashboards. |
| [`glossary-generate`](tools#glossary-generate) | Schreibt eine leere `glossary-user.csv`-Vorlage. |
| [`help`](tools#help) | Zeigt Hilfe für einen Unterbefehl an. |

<a id="synopsis"></a>
## Synopsis

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### Stamm- und globale Optionen

| Option                       | Bereich         | Beschreibung                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Stammprogramm  | Gibt die Versionsnummer und den Build-Zeitstempel aus (gleiche Informationen wie der Unterbefehl `version`). |
| `-h` / `--help`              | Stammprogramm  | Zeigt die Hilfe für das Stammprogramm oder für einen Unterbefehl an, wenn zusammen mit einem Befehlsnamen verwendet.      |
| `-c` / `--config <path>`     | Jeder Befehl | Pfad zur Konfigurationsdatei (Standard: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Jeder Befehl | Ausführliche Protokollierung.                                                                          |
| `-P` / `--provider <name>`   | Jeder Befehl | Aktiver LLM-Anbieter für diesen Lauf; überschreibt den Konfigurationsschlüssel `provider`. Muss unter `providers` konfiguriert werden. |
| `-L` / `--ui-lang <code>` | Jeder Befehl | Sprache für die eigene Benutzeroberfläche des Tools (CLI-Hilfe, Protokolle/Zusammenfassungen, Dashboard); Quelle mit höchster Priorität. Siehe [Sprache der Tool-Benutzeroberfläche](/de/guide/tool-ui-language). |
| `-w` / `--write-logs [path]` | Ausgewählte Befehle | Konsolenausgabe in eine `.log`-Datei umleiten (Standardpfad: unter dem Stammverzeichnis `cacheDir`). Nur für `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync` und `cleanup` verdrahtet. |

<a id="per-command-help"></a>
### Hilfe pro Befehl

| Verwendung                            | Beschreibung                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Alle Optionen für diesen Befehl.      |
| `ai-i18n-tools help <command>`   | Gibt dieselbe Ausgabe wie `<command> --help` aus. |

<a id="target-locales--l----locale"></a>
### Zielsprachen (`-l` / `--locale`)

| Befehle | Verhalten |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` – durch Kommas getrennte BCP-47-Zielcodes (z. B. `de,fr,pt-BR`). Wenn weggelassen, stammen die Standardwerte aus der Konfiguration (`json[]`-Blöcke können auch pro Block `targetLocales` festlegen; UI-Schritte verwenden `targetLocales` minus `sourceLocale`). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — einzelnes Quellgebietsschema zur Überprüfung (Standard: Konfiguration `sourceLocale`).                                                            |
