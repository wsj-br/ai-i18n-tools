<a id="cli--getting-started"></a>
# CLI — Erste Schritte

<a id="version"></a>
### `version`

**Synopsis:** `ai-i18n-tools version`

Gibt die CLI-Version und den Build-Zeitstempel aus (dieselbe Information wie `-V` / `--version` im Stammprogramm).

---

<a id="init"></a>
### `init`

**Zusammenfassung:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Schreiben Sie eine Starter-Konfigurationsdatei (enthält `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `docs[].addFrontmatter`). Übersetzungsbefehle, die ein LLM aufrufen, erfordern den API-Schlüssel des aktiven Anbieters in der Umgebung oder `.env` (Ollama ausgenommen) – siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key).

**Wichtige Optionen:** `-P` / `--provider` (erforderlich), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` ist erforderlich. Es wählt aus, welches **integrierte Preset** gescaffoldet werden soll. Muss einer der folgenden Werte sein: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`.

**Vorlagen (`-t`):**

| Wert | Vorlagen |
|-------|-----------|
| `ui-markdown` | UI-Strings plus README (flache Ausgabe, Sprachliste) |
| `ui-docusaurus` | Docusaurus UI + Docs |
| `ui-starlight` | Starlight Docs |
| `ui-vitepress` | VitePress Docs (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` für Theme-Strings |
| `ui-nextra` | Nextra Docs (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` für das Theme-Wörterbuch (Sidebar `_meta.ts` wird automatisch gesammelt) |
| `ui-fumadocs` | Fumadocs Docs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` für UI-Overrides (Sidebar `meta.json` wird automatisch gesammelt) |
| `ui-astro-website` | Astro Website UI-Strings |
| `ui-plain-html` | Einfacher HTML-Katalog (`data-i18n*`-Marker, flaches Locale-JSON) |
| `docs-plain-html` | Einfache HTML-Dokumente (eine Datei pro Locale, Sprachliste, hreflang) |
| `docs-markdown` | Markdown-Dokumente: README- und `.md`-Dateien, flache Ausgabe, Sprachliste |
| `ui-json-bundles` | JSON (nur `json[]`) |
| `ui-python` | Python-UI-Strings, flaches JSON, das nach dem Quellsprachen-String geschlüsselt ist, und `i18n.py` |
| `ui-python-gettext` | Python-UI-Strings mit flachem JSON und GNU `.po` / `.mo` sowie `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}`-Kataloge (`flatOutput: false`, Domain `django`, kein `i18n.py`) |
| `ui-python-flask` | Flask- / Jinja-Kataloge unter `translations/` (`flatOutput: false`) sowie `i18n.py` |

`--with-readme` fügt einen `README.md`-Dokumentationsblock (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, ein `languageListBlock`) hinzu und setzt `features.translateDocs` auf true. Es tut nichts, wenn ein Dokumentationsblock bereits `README.md` auflistet, was bei `ui-markdown` und `docs-markdown` der Fall ist. Es schreibt nur die Konfiguration. Es gibt die Markerzeile aus, die in `README.md` eingefügt werden soll, und warnt, wenn diese Datei fehlt. Anleitung: [i18n zu Ihren README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` erstellt ein Starter-`.translate-ignore` (einschließlich Python-Virtualenv- und Cache-Verzeichnissen).

`ui-python`, `ui-python-gettext` und `ui-python-flask` schreiben außerdem `i18n.py`, wenn diese Datei fehlt. Django-Projekte behalten die eigene gettext-Laufzeitumgebung von Django bei, daher schreibt `ui-python-django` kein `i18n.py`.

`migrate-python-i18n` schreibt unsichere, vorab ausgewertete Aufrufe (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) in „Lookup-before-format“-Aufrufe um. Standardmäßig erfolgt ein Probelauf (Dry Run). Übergeben Sie `--write`, um Dateien zu bearbeiten, und lesen Sie `migrate-python-i18n-report.md` für Überprüfungshinweise. Generierte `i18n.py`-Dateien werden übersprungen.

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Zeigt die Hilfe für einen Unterbefehl an (gleiche Ausgabe wie `ai-i18n-tools <command> --help`).
