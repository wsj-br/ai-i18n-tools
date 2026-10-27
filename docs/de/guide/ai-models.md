<a id="ai-models"></a>
# KI-Modelle

Ein Modell ist ein benanntes System bei Ihrem Anbieter, wie z. B. `google/gemini-2.5-flash` oder `gpt-5-mini`. `init` schreibt eine anfängliche `translationModels`-Liste für den von Ihnen ausgewählten Anbieter. Betrachten Sie diese Liste als Ausgangspunkt.

Wählen Sie die Liste für dieses Projekt mit `suggest-models` aus oder mit derselben Rangliste im Translation-Dashboard unter **Modelle**. Beide erstellen eine Rangliste der Chat-Modelle des aktiven Anbieters anhand veröffentlichter Benchmarks und können das Ergebnis in `translationModels` schreiben. Richten Sie zuerst den Anbieter und seinen API-Schlüssel ein: [LLM-Anbieter](/de/guide/providers-and-models).

<a id="suggest-models"></a>
## Mit einer Ranglisten-Shortlist beginnen

<a id="suggest-models-cli"></a>
### Über die Befehlszeile

`suggest-models` erstellt eine Rangliste der Chat-Modelle, die der aktive Anbieter derzeit anbietet, und gibt eine kurze Tabelle aus. Qualität ist die Standardeinstellung: Übersetzungsmessungen und eine allgemeine Präferenzbewertung zählen mehr als der Preis.

```bash
ai-i18n-tools suggest-models
```

Die Spalten sind Rang, Modell-ID, Index, gemessener ChrF, gemessener Arena Score sowie Eingabe- und Ausgabepreis in USD pro 1 Mio. Token. Ein fehlender Messwert ist `—`. Der Index ist der gewichtete Score mal 100. In der Qualitätsrangliste bedeutet ein höherer Index eine bessere Übereinstimmung für dieses Projekt.

Schreiben Sie diese Shortlist in die Konfiguration, wenn die Tabelle korrekt aussieht:

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt `providers.<active>.translationModels`. Zuerst wird die aktuelle Konfiguration in eine nebengeordnete `ai-i18n-tools.config.{timestamp}.backup.json`-Datei kopiert. `uiModels` und `localeModels` bleiben unverändert. `--top` (Standard: 8) gibt an, wie viele IDs die Tabelle und `--apply` enthalten. Die erste ID ist diejenige, die bei der Übersetzung zuerst versucht wird.

`--price` priorisiert einen niedrigeren Preis und behält dennoch eine Qualitätsuntergrenze bei, sodass ein günstiges Modell ohne Messwert unter Modellen mit Scores bleibt. `--quality` ist die Standardeinstellung. Die Übergabe beider Flags ist ein Fehler.

<a id="suggest-models-dashboard"></a>
### Über das Dashboard

Der Tab **Modelle** zeigt dieselbe Rangliste mit einem Kontrollkästchen in jeder Zeile.

```bash
ai-i18n-tools dashboard
```

Öffnen Sie **Modelle**. Wählen Sie **Qualität** oder **Preis**. Aktivieren Sie die gewünschten Zeilen. Die aktivierten Zeilen bestimmen von oben nach unten die Reihenfolge, die bei der Übersetzung versucht wird. **Konfiguration aktualisieren** fordert eine Bestätigung an, schreibt dieselbe Art von Backup und speichert diese Reihenfolge in `translationModels`. **JSON kopieren** legt das `{ "translationModels": [...] }`-Fragment in die Zwischenablage, wenn Sie es lieber selbst einfügen möchten.

**Max. Ausgabepreis** und **Min. Index-Delta** entsprechen `suggest-models --max-output-price` und `--min-delta`. Steuerelemente und Spalten: [Tab „Modelle“](/de/guide/translation-dashboard/models).

<a id="how-models-are-ranked"></a>
### Wie die Rangliste auswählt

Die Shortlist ist eine Benchmark-Rangliste des Live-Chat-Katalogs des Anbieters. Beim ersten Durchlauf werden drei öffentliche Datensätze heruntergeladen, was eine Weile dauern kann. Spätere Durchläufe verwenden den 7-Tage-Cache unter `<cacheDir>/benchmark-scores.json` (normalerweise `.translation-cache/benchmark-scores.json`) wieder.

| Signal | Was es beiträgt | Quelle |
| --- | --- | --- |
| ChrF | Übersetzungsqualität für die Sprachen Ihres Projekts | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arena Score | Allgemeine Präferenz aus direkten Vergleichen | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| USD pro 1 Mio. Token | Eingabe- und Ausgabepreis | Katalog des Anbieters, wenn er Preise veröffentlicht, andernfalls [models.dev](https://models.dev/) (MIT) |

ChrF verwendet die Übersetzungs-Scores von languagebench für Ihre `sourceLocale` und `targetLocales`. Locales werden einem languagebench-Sprachcode zugeordnet: dem primären Subtag, mit Aliasen wie `pt-BR` für `pt` und `zh-Hant` für `zh`. Ein Modell, das diese Sprachen gut übersetzt, rangiert höher als eines, das nur allgemein gut abschneidet. Embedding-, Bild-, Sprach- und andere Nicht-Chat-Modelle werden übersprungen, ebenso wie IDs, deren Ablaufdatum überschritten ist.

Qualität, das Standardprofil, gewichtet ChrF und Arena Score höher als den Preis. Preis kehrt diese Gewichtung um und hält das oben beschriebene Qualitätsniveau ein. Optionale Gewichtungen sind [`modelSuggestion`](/de/reference/configuration#modelsuggestion).

`suggest-models --refresh` lädt die Datensätze erneut herunter. Laden Sie danach den Tab **Modelle** neu.

Jedes Flag, einschließlich `--json`, `--list` und die Bewertungsformel: [Modelle vorschlagen](/de/reference/cli-commands/models#suggest-models).

<a id="why-more-than-one-model"></a>
## Warum die Liste mehr als ein Modell enthält

<a id="model-fallback-chain"></a>
### Modell-Fallback-Kette

`translationModels` ist eine geordnete Liste. Die CLI versucht das erste Modell. Bei einer fehlgeschlagenen Anfrage, einer Antwort, die sie nicht parsen kann, oder Text in einem falschen Schriftsystem, versucht sie die nächste ID für diesen Batch.

Eine ID ist ein Single Point of Failure. Ein Modell kann eine Zeitüberschreitung haben, Text zurückgeben, den dieses Tool ablehnt, oder eine Sprache gut und eine andere schlecht übersetzen. Ein häufiger Fall ist romanisiertes Hindi, wo `hi` Devanagari erwartet. Romanisierte Ausgabe wird für Locales mit nativer Schrift abgelehnt. Ein Locale, das romanisiert bleiben soll, benötigt einen expliziten `-Latn`-Subtag, wie z.B. `hi-Latn`.

Deshalb enthält die Shortlist mehrere IDs, die stärkste zuerst. Die Reihenfolge in der Liste ist die Reihenfolge, in der die Übersetzung versucht wird.

**Auflösungsstufen** (dedupliziert, Reihenfolge beibehalten):

| Pipeline | Reihenfolge |
| --- | --- |
| UI (`translate-ui`, Pluralformen, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Dokumente, JSON, SVG | `localeModels(locale)` → `translationModels` |

Die meisten Projekte setzen nur `translationModels`. Die anderen beiden Listen sind vorhanden, wenn eine Textart oder eine Sprache zuerst verschiedene Modelle ausprobieren soll.

**UI-Strings.** Optionales `uiModels` wird nach jeder passenden pro-Locale-Überschreibung und vor `translationModels` versucht. UI-Text ist kurz und sichtbar, daher ist ein stärkeres Modell in dieser Kette eine übliche Aufteilung. `suggest-models --apply` schreibt nur `translationModels`.

**Ein Locale.** Optionales `localeModels` ordnet einen BCP-47-Tag Modellen zu, die zuerst für dieses Locale in jeder Pipeline versucht werden (`pt-br` entspricht `pt-BR`). Japanisch, Koreanisch und Chinesisch schneiden oft besser mit Modellen ab, die für diese Schriften optimiert sind, wie z.B. `z-ai/glm-5.3` und `minimax/minimax-m2.7`, als mit einem allgemeinen Fallback. Wenn kein Eintrag übereinstimmt, gelten nur die oben genannten Pipeline-Stufen.

Beispiel (OpenRouter). Die IDs zeigen die Struktur der drei Listen. Nehmen Sie `translationModels` von `suggest-models` oder dem Tab **Modelle**. Fügen Sie `uiModels` oder `localeModels` hinzu, wenn UI-Text oder ein Locale eine eigene Kette benötigt.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

Voreingestellte Listen von `init` und die Feldreferenz: [Konfiguration — `provider` und `providers`](/de/reference/configuration#provider-and-providers).

<a id="validate-and-compare-models"></a>
## Prüfen, auflisten und benchmarken

Sobald die Shortlist in der Konfiguration ist, prüfen diese Befehle sie. Die Übersetzung kann ausgeführt werden, bevor Sie sie verwenden.

<a id="check-models"></a>
### `check-models`

Bestätigt, dass jede konfigurierte ID noch vom aktiven Anbieter angeboten wird.

```bash
ai-i18n-tools check-models
```

Es ruft den `GET /models`-Endpunkt des Anbieters auf, prüft jede ID in `translationModels`, `uiModels` und `localeModels`, meldet fehlende oder über `expiration_date` liegende IDs und beendet den Vorgang mit einem Non-Zero-Exit-Code, wenn eine konfigurierte ID ungültig ist. Wenn der Anbieter Preise veröffentlicht (OpenRouter und Cheaper Inference tun dies), zeigt es auch USD pro 1 Million Token an.

<a id="list-models"></a>
### `list-models`

Druckt den vollständigen Katalog, den der Anbieter bewirbt, sortiert nach ID. Verwenden Sie dies, um eine ID nachzuschlagen, die das Ranking ausgelassen hat.

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

Übersetzt eine Stichprobe durch jedes konfigurierte Modell einzeln und gibt Eingabe- und Ausgabe-Token, die Echtzeit und die USD-Kosten aus. `suggest-models` verwendet die oben veröffentlichten Bewertungen. `bench-models` ruft die Modelle auf, verbraucht also API-Guthaben und zeigt Latenz und Preis in Ihrem Konto an.

```bash
ai-i18n-tools bench-models
```

Jede eindeutige ID von `translationModels`, `uiModels` und `localeModels` läuft ohne Fallback. Überschreiben Sie die Stichprobe oder die IDs für einen spezifischen Vergleich:

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

Wenn [Zero Data Retention](/de/guide/providers-and-models#cheaperinference-zero-data-retention) für Cheaper Inference aktiviert ist, lesen `check-models`, `list-models` und `suggest-models` `GET /models?zdr=true`.

Details zum Befehl: [CLI – Modelle und Sprachen](/de/reference/cli-commands/models).

<a id="further-reference"></a>
## Weiterführende Informationen

- [LLM-Anbieter](/de/guide/providers-and-models) – Voreinstellungen, API-Schlüssel und Anbieterwechsel mit `-P`.
- [Tab „Modelle“](/de/guide/translation-dashboard/models) – dasselbe Ranking im Dashboard.
- [Konfiguration – `provider` und `providers`](/de/reference/configuration#provider-and-providers) – `translationModels`, `uiModels`, `localeModels`, Timeouts und Kostensätze.
- [suggest-models](/de/reference/cli-commands/models#suggest-models) – Flags, Filter und die Bewertungsformel.
