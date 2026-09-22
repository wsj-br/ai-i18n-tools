<a id="glossary"></a>
# Glossar

Das Glossar stellt eine konsistente Produktterminologie über alle Übersetzungen hinweg sicher. Benutzer können die Übersetzung eines Begriffs in einer oder mehreren Sprachen definieren, wodurch das KI-Modell diese vordefinierte Übersetzung verwenden kann, anstatt die beste Übersetzung zu erraten. Es kann auch verwendet werden, um bestimmte Begriffe, wie z. B. Produktnamen, bei der Übersetzung in andere Sprachen unverändert zu lassen.

Zwei Arten von Vorgaben werden an das Modell gesendet:

- **Begriffszeilen** in `glossary.userGlossary` (und bei einigen Pipelines vorhandene UI-Übersetzungen aus `glossary.uiGlossary`). Eine Zeile wird nur einbezogen, wenn der Quellbegriff im zu übersetzenden Text vorkommt.
- **Projektkontextdateien** in `glossary.contextFiles`. Das vollständige Briefing wird in jeden UI-, Dokumentations-, JSON-, SVG- und Korrekturlese-Prompt eingefügt. Dieser Abschnitt befindet sich [weiter unten](#project-context-files).

<a id="how-the-glossary-works"></a>
## Funktionsweise des Glossars

<a id="where-terms-come-from"></a>
### Herkunft der Begriffe

| Quelle | Konfiguration | Verwendet von |
| --- | --- | --- |
| UI-Katalog | `glossary.uiGlossary` — normalerweise derselbe Pfad wie `ui.stringsJson` | `translate-docs`, `translate-json`, `translate-svg` |
| Benutzer-CSV | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary` verwendet bereits in `strings.json` gespeicherte Übersetzungen als Hinweise, damit Dokumentation, JSON und SVG mit der Benutzeroberfläche übereinstimmen. `translate-ui` und `proofread-ui` lesen `uiGlossary` nicht – sie nutzen nur Hinweise aus der Benutzer-CSV, sodass eine fehlerhafte UI-Übersetzung nicht als bevorzugter Begriff zurückgespielt wird.

Die Benutzer-CSV hat Vorrang vor dem UI-Katalog. Eine Zeile, deren `locale` ein bestimmter Code ist, ersetzt sowohl die Zeile in `*` als auch die UI-Katalog-Übersetzung für dieses Gebietsschema. Ein `locale` von `*` wendet dieselbe Übersetzung auf jeden `targetLocales`-Eintrag an, der noch keine aus dem UI-Katalog hat.

Kompakte Abkürzungen für UI-Bezeichnungen (ein abschließender Punkt wie `Alm.` oder eine kurze Kompression in einem einzelnen Token wie `Size` → `Tam`) bleiben für die UI-Übersetzung verfügbar. Dokumentations-Prompts überspringen sie, damit sie Modelle nicht dazu verleiten, erfundene <code v-pre>{{…}}</code>-Tokens in Markdown oder MDX zu erzeugen.

<a id="when-a-term-is-sent"></a>
### Wann ein Begriff gesendet wird

Der Abgleich erfolgt ohne Berücksichtigung der Groß-/Kleinschreibung und endet an einer Wortgrenze (Leerzeichen oder Satzzeichen). Längere Begriffe werden bevorzugt, und überlappende Treffer werden verworfen. Wenn ein Begriff im aktuellen Batch übereinstimmt, erhält der Prompt einen Hinweis wie `"dashboard" → "Tableau"`. Enthält diese Zeile eine **Kontext**-Notiz, wird die Notiz nur für diesen Treffer angehängt.

**Kontext** enthält Hinweise zur Verwendung in der Ausgangssprache (was der Begriff bedeutet oder wie er verwendet wird). Es handelt sich nicht um eine Übersetzung. Das Ändern einer **Kontext**-Notiz oder eines beliebigen `glossary.contextFiles`-Inhalts aktualisiert beim nächsten Lauf die zwischengespeicherten Übersetzungen für das betroffene Gebietsschema – `--force` ist dafür nicht erforderlich. Wird nur die bevorzugte **Übersetzung** geändert, bleibt der vorhandene Cache erhalten, bis Sie `--force` oder `--force-update` übergeben. Im Dashboard bearbeitete Zeilen bleiben als `user-edited` erhalten.

<a id="force"></a>
### Force

Wenn **Force** auf `true`, `yes` oder `1` gesetzt ist, wird der Quellbegriff aus dem Text entfernt, bevor das Modell ihn sieht, und die bevorzugte Übersetzung wird anschließend zurückgeschrieben. Der Wortlaut ist exakt, keine Empfehlung. Dieselben Regeln für Wortgrenzen und die Bevorzugung des längsten Treffers gelten auch hier. Lassen Sie **Force** leer (oder `false`), wenn das Modell die Übersetzung bevorzugen, sie aber weiterhin flektieren können soll.

<a id="generate-a-glossary"></a>
## Ein Glossar erstellen

`glossary-generate` schreibt eine leere CSV-Datei mit der Standard-Kopfzeile. Dabei wird `glossary.userGlossary` aus der Konfiguration verwendet oder `glossary-user.csv`, wenn dieser Schlüssel nicht gesetzt ist. Eine bereits vorhandene Datei wird nicht überschrieben (Exit-Code **1**).

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

Verweisen Sie in der Konfiguration auf die Datei:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

Sie können die CSV-Glossardatei auch direkt über das Dashboard erstellen. Die erste **Hinzufügen**-Aktion auf der Registerkarte [Glossar](/de/guide/translation-dashboard/glossary) erstellt die Datei, wenn `glossary.userGlossary` angegeben ist und die Datei noch nicht vorhanden ist. Wenn `glossary.autoAddUserEditedToGlossary` auf `true` (die Standardeinstellung) gesetzt ist, kann das Korrigieren eines UI-Strings im Dashboard diese Änderung während des nächsten `translate-ui`-Durchlaufs zur CSV-Datei hinzufügen. Das Dashboard dient auch als Editor für das CSV-Glossar und ermöglicht es Ihnen, Zeilen innerhalb der Benutzeroberfläche hinzuzufügen, zu bearbeiten oder zu filtern.

<a id="csv-columns"></a>
## CSV-Spalten

Kopfzeile:

```text
Original language string,locale,Translation,Force,Context
```

`en` oder `English` wird anstelle von `Original language string` akzeptiert. `Notes` wird anstelle von `Context` akzeptiert.

| Spalte | Bedeutung |
| --- | --- |
| **Ausgangssprachlicher Begriff** | Quellbegriff oder -phrase in der Ausgangssprache |
| **locale** | Zielgebietsschema-Code oder `*` für jedes Ziel |
| **Übersetzung** | Bevorzugte Übersetzung |
| **Force** | `true`, `yes` oder `1`, um diesen Wortlaut zu erzwingen; andernfalls ein Hinweis |
| **Context** | Optionale Erklärung in der Ausgangssprache. Wird nur gesendet, wenn dieser Begriff übereinstimmt |

<a id="examples"></a>
## Beispiele

Ein Produktbegriff für jedes Gebietsschema, eine erzwungene deutsche Bezeichnung und eine französische Zeile, die ein Wort erklärt, das das Modell wörtlich nehmen könnte:

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

Kombiniert mit einer Projektübersicht:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

Feldreferenz: [`glossary` in Configuration](/de/reference/configuration#glossary). Befehlsreferenz: [`glossary-generate`](/de/reference/cli-commands/tools#glossary-generate).

<a id="project-context-files"></a>
## Projektkontextdateien

`glossary.contextFiles` ist für produktbezogene Anleitungen gedacht, die nicht in eine einzelne CSV-Zeile gehören: Was das Produkt ist, für wen es bestimmt ist, der Ton und Begriffe, die leicht falsch übersetzt werden können. Konfigurieren Sie eine oder mehrere cwd-relative `.md`- / `.txt`-Dateien; diese werden in der angegebenen Reihenfolge zusammengeführt und in jede UI-, Dokumentations-, JSON-, SVG- und Korrekturaufforderung eingefügt.

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

Verfassen Sie das Briefing im **Quellgebietsschema**, halten Sie es deutlich unter `glossary.contextMaxChars` (Standard `12000`) und speichern Sie es außerhalb von `docs[].contentPaths`, es sei denn, Sie möchten auch diese Datei übersetzen lassen. Siehe [`glossary` in der Konfiguration](/de/reference/configuration#glossary).

<a id="generate-a-context-file-with-an-ai-agent"></a>
### Kontextdatei mit einem KI-Agenten generieren

Bitten Sie einen Agenten (Cursor, Claude Code, Copilot und ähnliche), das Repository zu lesen und das Briefing zu verfassen. Fügen Sie eine Aufforderung wie diese ein:

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

Überprüfen Sie die Datei vor dem nächsten `sync`- / `translate-*`-Lauf. Das Ändern der Datei macht zwischengespeicherte Übersetzungen für jedes Gebietsschema in diesem Lauf ungültig. Halten Sie das Briefing daher stabil, sobald die Qualität gut ist.
