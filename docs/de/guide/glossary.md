<a id="glossary"></a>
# Glossar

Das Glossar gewährleistet eine konsistente Produktterminologie über alle Übersetzungen hinweg. Benutzer können die Übersetzung eines Begriffs in einer oder mehreren Sprachen definieren, wodurch das KI-Modell diese vordefinierte Übersetzung verwenden kann, anstatt selbst eine auszuwählen. Es kann auch verwendet werden, um bestimmte Begriffe, wie Produktnamen, bei der Übersetzung in andere Sprachen unverändert beizubehalten.

Zwei Arten von Vorgaben werden an das Modell gesendet:

- **Begriffszeilen** in `glossary.userGlossary` (und für Dokumentation, JSON und SVG vorhandene UI-Übersetzungen aus jedem `ui`-Block, bei dem `uiGlossary` aktiviert ist). Eine Zeile wird nur dann aufgenommen, wenn der entsprechende Quellbegriff im zu übersetzenden Text vorkommt.
- **Projektkontextdateien** in `glossary.contextFiles`. Das vollständige Briefing wird in jeden UI-, Dokumentations-, JSON-, SVG- und Korrekturlese-Prompt eingefügt. Dieser Abschnitt folgt [unten](#project-context-files).

<a id="how-the-glossary-works"></a>
## Funktionsweise des Glossars

<a id="where-terms-come-from"></a>
### Herkunft der Begriffe

| Quelle | Konfiguration | Verwendet von |
| --- | --- | --- |
| UI-Kataloge | `ui[].uiGlossary` (boolesch, Standard `true`) — `stringsJson` dieses Blocks | `translate-docs`, `translate-json`, `translate-svg` |
| Benutzer-CSV | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`init` verweist `glossary.userGlossary` auf `glossary-user.csv` und erstellt diese Datei nicht. Führen Sie `glossary-generate` aus, wenn sie fehlt, und tragen Sie Domänenbegriffe darin ein, vor dem ersten `translate-ui`. Eine zweite Übersetzung einer unveränderten Zeichenfolge kann anders formuliert sein. Das Glossar sorgt dafür, dass die beiden Durchläufe übereinstimmen.

Ein Block mit `uiGlossary: true` verwendet die bereits in seinem `strings.json` gespeicherten Übersetzungen als Hinweise, damit Dokumentation, JSON und SVG mit der UI synchron bleiben. `translate-ui` und `proofread-ui` lesen diese Kataloge nicht — sie beziehen Hinweise ausschließlich aus der Benutzer-CSV, damit eine fehlerhafte UI-Übersetzung nicht als bevorzugter Begriff zurück in den Prozess gelangt. Setzen Sie `uiGlossary` auf `false` für einen Block, der andere Pipelines nicht beeinflussen soll. Wenn mehrere Blöcke denselben Quellbegriff verwenden, füllt der erste Block eine Locale auf, und nachfolgende Blöcke ergänzen nur die noch fehlenden Locales. Die Benutzer-CSV hat stets Vorrang vor allen UI-Katalogen. Eine Zeile, deren `locale` ein spezifischer Code ist, ersetzt sowohl die `*`-Zeile als auch die Übersetzung aus dem UI-Katalog für diese Locale. Ein `locale` von `*` wendet dieselbe Übersetzung auf alle Ziel-Locales an, für die noch keine Übersetzung aus einem UI-Katalog vorliegt.

Kompakte Abkürzungen für UI-Bezeichnungen (ein abschließender Punkt wie `Alm.` oder eine kurze Kompression in einem einzelnen Token wie `Size` → `Tam`) bleiben für die UI-Übersetzung verfügbar. Dokumentations-Prompts überspringen sie, damit sie Modelle nicht dazu verleiten, erfundene <code v-pre>{{…}}</code>-Tokens in Markdown oder MDX zu erzeugen.

Ein mehrteiliges Präfix, das von zwei oder mehr Katalogschlüsseln gemeinsam genutzt wird, wird als eigener Begriff hinzugefügt, wenn dieses Präfix nicht bereits ein Schlüssel ist. Für jedes Gebietsschema ist die Übersetzung der gemeinsame Anfang dieser Katalogübersetzungen, an einer Wortgrenze abgeschnitten, und nur wenn dieser gemeinsame Anfang mindestens vier Zeichen lang ist. `Cursor Models run out` und `Cursor Models at renewal` können `Cursor Models` ergeben, wenn beide deutschen Zeichenfolgen mit `Cursor-Modelle` beginnen. Eine Benutzer-CSV-Zeile für dieselbe Quelle ersetzt diese vorab generierte Übersetzung.

<a id="when-a-term-is-sent"></a>
### Wann ein Begriff gesendet wird

Der Abgleich erfolgt ohne Berücksichtigung der Groß-/Kleinschreibung und endet an einer Wortgrenze (Leerzeichen oder Satzzeichen). Längere Begriffe werden bevorzugt, und überlappende Treffer werden verworfen. Wenn ein Begriff im aktuellen Batch übereinstimmt, erhält der Prompt einen Hinweis wie `"dashboard" → "Tableau"`. Enthält diese Zeile eine **Kontext**-Notiz, wird die Notiz nur für diesen Treffer angehängt.

**Kontext** sind Nutzungshinweise in der Ausgangssprache (was der Begriff bedeutet oder wie er zu verwenden ist). Es ist keine Übersetzung. Das Ändern einer **Kontext**-Notiz oder jeglichen `glossary.contextFiles`-Inhalts aktualisiert zwischengespeicherte Übersetzungen für das betroffene Gebietsschema beim nächsten Durchlauf – Sie benötigen `--force` nicht. Das Ändern nur der bevorzugten **Übersetzung** in einer Zeile, die nicht **Erzwingen** ist, behält den vorhandenen Cache bei, bis Sie `--force` oder `--force-update` übergeben. Eine **Erzwingen**-Zeile (neu, bearbeitet oder gelöscht) führt nur für Segmente, deren Quelle diesen Begriff enthält, zu einem Cache-Miss, und nur wenn der gespeicherte Text die erzwungene Übersetzung noch nicht enthält. Lassen Sie **Kontext** in dieser Zeile für diese eingeschränkte Aktualisierung leer; eine Kontext-Notiz aktualisiert weiterhin das gesamte Gebietsschema. Zeilen, die Sie im Dashboard bearbeitet haben, bleiben als `user-edited`.

Die Markdown-Übersetzung lehnt auch ein Segment ab, wenn einem übereinstimmenden UI-Label von zwei bis fünf Wörtern seine Katalog- oder vorab generierte Präfix-Übersetzung fehlt. Ein-Wort-Hinweise können weiterhin flektiert werden. Ein Benutzer-CSV-Hinweis, der nicht auch ein UI-Label ist, bleibt ein Hinweis. Die Prüfung versucht es mit dem nächsten Modell erneut und teilt das Segment nicht. Zwischengespeichertes Markdown wird erneut geprüft, wenn die Datei verarbeitet wird (`--force-update`); eine Datei, die die Dateiverfolgung überspringt, bleibt unverändert, bis ein **Erzwingen**-Begriff in dieser Datei in der Ausgabe fehlt. Eine Katalogübersetzung, die von der Quelle abweicht, ist überall dort erforderlich, wo dieses Label erscheint, einschließlich eines übersetzten Produktnamens. Behalten Sie die Quellschreibweise mit einer **Erzwingen**-Zeile bei, deren Übersetzung der Quelle entspricht.

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
