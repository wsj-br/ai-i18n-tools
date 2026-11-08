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

`-P` / `--provider` ist erforderlich. Es wählt das zu gerüstende **integrierte Preset** aus. Muss einer der folgenden Werte sein: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`.

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
| `ui-dotnet` | .NET UI-Strings, flaches JSON, das mit dem Quellsprachen-String als Schlüssel versehen ist, und `I18n.cs` |
| `ui-dotnet-resx` | .NET UI-Strings als `.resx`-Satelliten (`flatOutput: false`) und `I18nResx.cs` |

`--with-readme` fügt einen `README.md`-Dokumentationsblock (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, ein `languageListBlock`) hinzu und setzt `features.translateDocs` auf true. Es tut nichts, wenn ein Dokumentationsblock bereits `README.md` auflistet, was bei `ui-markdown` und `docs-markdown` der Fall ist. Es schreibt nur die Konfiguration. Es gibt die Markerzeile aus, die in `README.md` eingefügt werden soll, und warnt, wenn diese Datei fehlt. Anleitung: [i18n zu Ihren README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` erstellt ein Starter-`.translate-ignore` (einschließlich Python-Virtualenv- und Cache-Verzeichnissen).

`init` erstellt auch `.gitignore` im Arbeitsverzeichnis oder hängt sie daran an. Die hinzugefügten Zeilen sind `.translation-cache/*`, `!.translation-cache/cache.db`, `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` und `*.backup.*`, jeweils unter einem kurzen Kommentar. Bereits vorhandene Zeilen bleiben unverändert, und ein zweiter Durchlauf dupliziert sie nicht.

`ui-python`, `ui-python-gettext` und `ui-python-flask` schreiben auch `i18n.py`, wenn diese Datei fehlt. Django-Projekte behalten Djangos eigene gettext-Laufzeitumgebung bei, daher schreibt `ui-python-django` nicht `i18n.py`. `ui-dotnet` schreibt `I18n.cs`, wenn diese Datei fehlt, und gibt das `EmbeddedResource`-Element aus, das zu `.csproj` hinzugefügt werden soll. `ui-dotnet-resx` schreibt stattdessen `I18nResx.cs` und verweist `ui.resx` auf `Resources/SharedResource.<culture>.resx`. `--namespace` überschreibt den C#-Namespace. Anleitung: [.NET-Anwendungen](/de/guide/ui-strings/dotnet) und [i18n zu einer .NET ResourceManager-App hinzufügen](/de/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n` schreibt unsichere vorab ausgewertete Aufrufe (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) in Lookup-vor-Format-Aufrufe um. Standardmäßig wird ein Probelauf durchgeführt. Übergeben Sie `--write`, um Dateien zu bearbeiten, und lesen Sie `migrate-python-i18n-report.md` für Überprüfungshinweise. Ein komplexer Ausdruck wird nach dem Ausdruck benannt, wenn dieser stabil ist (`start.isoformat()` wird zu `{start}`, `len(rows)` wird zu `{rows_count}`). Ein übrig gebliebener `{value_1}` wird gemeldet, damit er umbenannt werden kann. Generierte `i18n.py`-Dateien werden übersprungen. Ein sauberer Bericht bedeutet nicht, dass nicht umbrochene f-Strings abgedeckt wurden.

`migrate-dotnet-i18n` macht dasselbe für `T($"...")`, Verkettung und `string.Format` innerhalb von `T()`. `--wrap` markiert auch unmarkierte XAML-Labels und C#-Sinks mit hoher Konfidenz; ohne `--write` ist das ein Audit. Der Bericht ist `migrate-dotnet-i18n-report.md`. Generierte `I18n.cs` und `I18nResx.cs` werden übersprungen. Leitfaden: [.NET-Anwendungen](/de/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**Zusammenfassung:** `ai-i18n-tools doctor [--local] [--strict] [--json] [--fix-gitignore]`

Überprüfen Sie, ob das Projekt zur Übersetzung bereit ist. Der Bericht umfasst Konfigurationssyntax und -schema, Geschäftsregeln, die installierte Version, Quell- und Ausgabepfade, UI-Katalogdateien, Platzhalter-Fehlpaarungen in diesen Katalogen, Cache-Statistiken, konfigurierte Anbieter, unterstützte Umgebungsvariablen, die gesetzt sind, und Modell-IDs. Ein Katalog mit einem umbenannten, gelöschten oder umgeschriebenen Platzhalter ist eine Warnung und nennt ein Beispiel.

Standardmäßig prüft `doctor` auch konfigurierte Modell-IDs anhand des Katalogs des aktiven Providers und vergleicht die installierte Version mit dem neuesten GitHub-Release. `--local` überspringt beide Netzwerkaufrufe. Ein neueres Release oder eine fehlgeschlagene GitHub-Anfrage ist eine Warnung. Eine fehlende oder abgelaufene Modell-ID führt zum Fehlschlagen des Befehls. `--strict` beendet den Vorgang mit einem Fehler, wenn eine Prüfung eine Warnung ausgibt.

API-Schlüsselwerte werden niemals ausgegeben. Gesetzte Variablen werden in alphabetischer Reihenfolge als `Configured variables: NAME, ...` aufgelistet. Eine Variable, die kein API-Schlüssel ist, enthält ihren Wert.

Fehlende Eingabepfade schlagen fehl. Fehlende Ausgabeverzeichnisse sind ein Hinweis, da der erste Übersetzungsdurchlauf sie erstellt. `doctor` schreibt die Konfiguration nicht neu, erstellt keine Verzeichnisse und sendet keinen Quelltext an ein Modell. `--fix-gitignore` fügt fehlende `.gitignore`-Zeilen hinzu und lässt jede andere Datei unverändert.

`doctor` warnt, wenn `.gitignore` neben der Konfiguration ein erforderliches Muster fehlt. Die Warnung weist Sie an, `ai-i18n-tools doctor --fix-gitignore` auszuführen. Wenn `.gitignore` bereits existiert, fügt dies eine leere Zeile, den Kommentar `# ai-i18n-tools doctor fix` und nur die fehlenden Zeilen hinzu. Es dupliziert keine bereits vorhandenen Zeilen. Eine fehlende Datei wird mit demselben Block erstellt, den `init` schreibt. Die beiden Cache-Muster folgen der konfigurierten `cacheDir`, sodass `.i18n-cache` `.i18n-cache/*` und `!.i18n-cache/cache.db` benötigt, anstatt der standardmäßigen `.translation-cache`-Zeilen. Die anderen Muster sind `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` und `*.backup.*`. Eine Zeile, die das Cache-Verzeichnis selbst ignoriert, wie z.B. `.i18n-cache/`, ist ebenfalls eine Warnung, da Git `cache.db` unter einem ignorierten Verzeichnis nicht verfolgen wird. `--fix-gitignore` entfernt diese Zeile nicht. Die Warnung lässt den Befehl nur mit `--strict` fehlschlagen.

**Wichtige Optionen:** `--local`, `--strict`, `--json`, `--fix-gitignore`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
ai-i18n-tools doctor --fix-gitignore
```

---

<a id="help"></a>
### `help`

**Synopsis:** `ai-i18n-tools help [command]`

Zeigt die Hilfe für einen Unterbefehl an (gleiche Ausgabe wie `ai-i18n-tools <command> --help`).
