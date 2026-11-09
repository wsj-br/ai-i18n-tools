<a id="ai-models"></a>
# KI-Modelle

Ein Modell ist ein benanntes System bei Ihrem Anbieter, wie z. B. `google/gemini-2.5-flash` oder `gpt-5-mini`. `init` schreibt eine anfängliche `translationModels`-Liste für den von Ihnen ausgewählten Anbieter. Betrachten Sie diese Liste als Ausgangspunkt.

Wählen Sie die Liste für dieses Projekt mit `suggest-models` aus oder mit derselben Rangliste im Translation-Dashboard unter **Modelle**. Beide erstellen eine Rangliste der Chat-Modelle des aktiven Anbieters anhand veröffentlichter Benchmarks und können das Ergebnis in `translationModels` schreiben. Richten Sie zuerst den Anbieter und seinen API-Schlüssel ein: [LLM-Anbieter](/de/guide/providers-and-models).

<a id="start-with-a-ranked-list"></a>
## Beginnen Sie mit einer Rangliste

<a id="from-the-command-line"></a>
### Über die Befehlszeile

`suggest-models` ordnet die Chat-Modelle, die der aktive Anbieter aktuell anbietet, und gibt eine kurze Tabelle aus. Qualität ist die Standardeinstellung: Der Index ist languagebench ChrF und Arena Score. Preis ist eine separate Spalte und eine Sortierreihenfolge, kein Bestandteil des Index.

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

Die Spalten sind Rang, Modell-ID, Index, gemessenes ChrF, gemessener Arena Score, Eingabepreis, Ausgabepreis, Mischpreis in USD pro 1 Mio. Tokens und Frontier-Stufe. Eine fehlende Messung ist `—`. Der Index ist der Qualitätsscore mal 100. Ein höherer Index bedeutet eine bessere Übereinstimmung für die Sprachen dieses Projekts. Eine ID, die ChrF, Arena Score und Token-Preise einer anderen Zeile wiederholt, wird in dieser Tabelle weggelassen. `--list` gibt sie trotzdem aus.

Tragen Sie diese Liste in die Konfiguration ein, wenn die Tabelle korrekt aussieht:

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` ersetzt `providers.<active>.translationModels`. Es kopiert zuerst die aktuelle Konfiguration in ein gleichrangiges `ai-i18n-tools.config.{timestamp}.backup.json`. `uiModels` und `localeModels` bleiben, wie sie sind. `--top` (Standard 8) gibt an, wie viele IDs die Tabelle und `--apply` enthalten. Die erste ID ist die, die die Übersetzung zuerst versucht. Für diese Liste fügen Sie `--max-price` und `--min-delta` hinzu. Die Preisobergrenze verhindert, dass ein Fallback mehr als das Budget kostet, und die Indexlücke verwirft ein Modell, das nur einen kleinen Schritt von dem darüber liegenden Modell entfernt ist.

`--price` listet zuerst die günstigsten Modelle an der Qualitäts-Preis-Frontier auf und behält dennoch eine Qualitätsuntergrenze bei, sodass ein günstiges Modell ohne Messung unter Modellen bleibt, die Scores haben. `--quality` ist die Standardeinstellung. Das Übergeben beider Flags ist ein Fehler.

<a id="from-the-dashboard"></a>
### Über das Dashboard

Der Tab **Modelle** zeigt dieselbe Rangliste mit einem Kontrollkästchen in jeder Zeile.

```bash
ai-i18n-tools dashboard
```

Öffnen Sie **Modelle**. Wählen Sie **Qualität** oder **Preis**. Aktivieren Sie die gewünschten Zeilen. Die aktivierten Zeilen bestimmen von oben nach unten die Reihenfolge, die bei der Übersetzung versucht wird. **Konfiguration aktualisieren** fordert eine Bestätigung an, schreibt dieselbe Art von Backup und speichert diese Reihenfolge in `translationModels`. **JSON kopieren** legt das `{ "translationModels": [...] }`-Fragment in die Zwischenablage, wenn Sie es lieber selbst einfügen möchten.

**Max. kombinierter Preis** und **Min. Index-Delta** entsprechen `suggest-models --max-price` und `--min-delta`. Steuerelemente und Spalten: [Registerkarte „Modelle“](/de/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### Wie die Rangfolge bestimmt wird

Die Liste ist ein Benchmark-Ranking des Live-Chat-Katalogs des Anbieters. Der erste Durchlauf lädt drei öffentliche Datensätze herunter und kann eine Weile dauern. Spätere Durchläufe verwenden den 7-Tage-Cache wieder.

| Signal | Beitrag | Quelle |
| --- | --- | --- |
| ChrF | Übersetzungsqualität für die Sprachen Ihres Projekts | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | Gesamtpräferenz aus Kopf-an-Kopf-Vergleichen | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| USD pro 1 Mio. Tokens | Eingabe-, Ausgabe- und kombinierter Preis `(3 × input + output) / 4` | Der Katalog des Anbieters, wenn er Tarife veröffentlicht, andernfalls [models.dev](https://models.dev/) (MIT) |

Aus diesen Signalen leitet das Ranking zwei Werte für jedes Kandidatenmodell ab: den Qualitätsindex (der ChrF und Arena Score kombiniert) und die [Pareto-Front-Stufe](https://en.wikipedia.org/wiki/Pareto_frontier) (die die Qualität im Verhältnis zum gemischten Token-Preis bewertet).

ChrF verwendet die Übersetzungs-Scores von languagebench für Ihre `sourceLocale` und `targetLocales`. Locales werden einem languagebench-Sprachcode zugeordnet: dem primären Subtag, mit Aliasen wie `pt-BR` für `pt` und `zh-Hant` für `zh`. Ein Modell, das diese Sprachen gut übersetzt, rangiert höher als eines, das nur allgemein gut abschneidet. Embedding-, Bild-, Sprach- und andere Nicht-Chat-Modelle werden übersprungen, ebenso wie IDs, deren Ablaufdatum überschritten ist.

Der Index ist ChrF und Arena Score. Der Preis ist nicht Teil davon. Der Score gewichtet ChrF (Standard 55 %) und Arena Score (Standard 45 %), jeweils normalisiert auf den höchsten Score im Chat-Katalog des Anbieters, gerundet auf eine Dezimalstelle auf einer Skala von 0–100. Platzhalterwerte (`0.35` für ChrF, `0.45` für Arena) gelten nur, wenn eine Messung fehlt; die Tabelle gibt `—` aus.

Die Qualitätsuntergrenze ist ein minimaler ChrF-Schwellenwert (standardmäßig 70 % des besten ChrF des Kandidatenpools für Qualität und 60 % für den Preis). Modelle unterhalb dieser Untergrenze, einschließlich aller Modelle ohne ChrF-Messung, werden nach Modellen sortiert, die diese Untergrenze überschreiten, und zeigen `—` in der Spalte 'Frontier'. Qualität, das Standardprofil, sortiert nach dem Index und löst gleiche Indizes mit dem günstigeren Blended Price auf. Preis ordnet Modelle nach Frontier-Stufe (Stufe 1 am günstigsten zuerst, dann Stufe 2 usw.). Optionale benutzerdefinierte Gewichtungen und Untergrenzen finden Sie unter [`modelSuggestion`](/de/reference/configuration#modelsuggestion-optional).

Zwei IDs, die ChrF, Arena Score, Eingabepreis und Ausgabepreis teilen, sind Aliase. Vorschläge behalten die kürzere ID und eine ID ohne Datum gegenüber einer mit Datum, wie z. B. `preview-06-05` oder `20241022`. Die anderen IDs bleiben in der vollständigen Rangliste, sodass `--list` weiterhin einen konfigurierten Alias anzeigen kann, und sie werden aus der Tabelle, `--json` und `--apply` weggelassen.

<a id="reading-the-frontier-column"></a>
#### Lesen der Spalte „Frontier“

Die Spalte 'Frontier' ist eine Stufe, kein Score. Ein Modell wird dominiert, wenn ein anderes Modell nicht mehr kostet (Blended Price) und mindestens den gleichen Index hat und entweder streng günstiger oder streng höher im Index ist. Eine `2` ist nicht doppelt so schlecht wie eine `1`, und Stufennummern vergleichen nicht die Qualität zwischen Zeilen: Das tut nur der Index. Zwei Zeilen können `3` und `4` anzeigen und trotzdem innerhalb eines Punktes des Stufe-1-Modells liegen, das beide schlägt.

- `1` bedeutet, dass kein anderes Modell sowohl günstiger als auch höher im Index ist. Auf `--price` läuft Stufe 1 vom günstigsten zum teuersten, und jeder Schritt kostet mehr und hat einen höheren Index. `--min-delta` verbirgt einen Schritt, der nur einen geringen Gewinn bringt.
- `2` bedeutet, dass das Modell dominiert wird, aber nur von Stufe-1-Modellen. Die Zeile unter der Tabelle nennt das Stufe-1-Modell, das jede dominierte Zeile schlägt. Bewegen Sie den Mauszeiger über den Wert im Dashboard, um dasselbe Modell anzuzeigen.
- `3` und höhere folgen der gleichen Regel einen Schritt weiter unten. Je höher die Zahl, desto länger die Kette, nicht desto weiter ist der Index vom besten Modell entfernt.
- `—` bedeutet, dass das Modell keinen Preis hat, es unter der Qualitätsuntergrenze liegt oder es ein Alias einer anderen Zeile ist. Es wird nicht verglichen.

Stufe 1 ist eine Effizienzprüfung: Nichts anderes ist sowohl streng günstiger als auch höher bewertet. Eine höhere Stufe kann immer noch auf der Liste stehen. Anbieterdiversität, Ratenbegrenzungen, Latenz und Kontextfenster liegen außerhalb des Index, und ein Fallback von einem anderen Anbieter hilft immer noch, wenn ein Stufe-1-Modell ratenbegrenzt ist oder einen Batch ablehnt. Eine andere ID für dasselbe Modell hilft dabei nicht.

Ein exakter Gleichstand, der kein Alias ist (der gleiche Blended Price und der gleiche Index, mit unterschiedlichen Token-Preisen oder unterschiedlichen Scores), teilt sich die Stufe. Der Index wird wie in der Tabelle gezeigt verglichen, auf eine Dezimalstelle gerundet.

Stufen werden über den gesamten Katalog berechnet, sodass `--max-price`, `--min-delta` und `--top` Zeilen ausblenden, ohne sie neu zu nummerieren. Ein Modell, das in der vollständigen Liste Stufe 1 ist, bleibt nach einer Preisobergrenze Stufe 1. `--max-price` entfernt Modelle, die über einem Budget liegen. Es entfernt nicht jede dominierte Zeile unter der Obergrenze. Die Spalte 'Frontier' und die Zeile unter der Tabelle zeigen diese an.

`--price` listet Stufe 1 vom günstigsten zum teuersten auf, dann Stufe 2 auf die gleiche Weise usw. Qualität, der Standard, sortiert nach dem Index und behandelt die Spalte 'Frontier' als Bezeichnung.

`suggest-models --refresh` lädt die Datensätze erneut herunter. Laden Sie danach den Tab **Modelle** neu.

Jedes Flag, einschließlich `--json`, `--list` und die Bewertungsformel: [Modelle vorschlagen](/de/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## Warum die Liste mehrere Modelle enthält

<a id="model-fallback-chain"></a>
### Modell-Fallback-Kette

`translationModels` ist eine geordnete Liste. Die CLI versucht das erste Modell. Bei einer fehlgeschlagenen Anfrage, einer Antwort, die sie nicht parsen kann, oder Text in einem falschen Schriftsystem, versucht sie die nächste ID für diesen Batch.

Eine ID ist ein Single Point of Failure. Ein Modell kann ein Timeout haben, Text zurückgeben, den dieses Tool ablehnt, oder eine Sprache gut und eine andere schlecht übersetzen. Ein häufiger Fall ist romanisiertes Hindi, wo `hi` Devanagari erwartet. Romanisierte Ausgabe wird für Gebietsschemas mit nativer Schrift abgelehnt. Ein Gebietsschema, das romanisiert bleiben soll, benötigt einen expliziten `-Latn`-Untertag, wie zum Beispiel `hi-Latn`.

Deshalb enthält die Liste mehrere IDs, die stärksten zuerst. Die Reihenfolge in der Liste ist die Reihenfolge, in der die Übersetzung versucht wird.

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

Voreingestellte Listen aus `init` und die Feldreferenz: [Konfiguration —](/de/reference/configuration#provider-and-providers) `provider` [und](/de/reference/configuration#provider-and-providers) `providers`.

<a id="check-list-and-benchmark"></a>
## Prüfen, auflisten und bewerten

Sobald die Liste in der Konfiguration ist, prüfen diese Befehle sie. Die Übersetzung kann ausgeführt werden, bevor Sie sie verwenden.

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

Details zum Befehl: [CLI – Modelle und Sprachen](/de/reference/cli-commands/models).

<a id="further-reference"></a>
## Weiterführende Informationen

- [LLM-Anbieter](/de/guide/providers-and-models) — Voreinstellungen, API-Schlüssel und Wechseln der Anbieter mit `-P`.
- [Registerkarte „Modelle“](/de/guide/translation-dashboard/models) — die gleiche Rangliste im Dashboard.
- [Konfiguration —](/de/reference/configuration#provider-and-providers) `provider` [und](/de/reference/configuration#provider-and-providers) `providers` — `translationModels`, `uiModels`, `localeModels`, Timeouts und Kostenraten.
- [suggest-models](/de/reference/cli-commands/models#suggest-models) — Flags, Filter und die Bewertungsformel.

::: info Externe Benchmark-Quellen
Die Scores werden aus externen Datenquellen berechnet:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) lizenziert unter CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) lizenziert unter CC-BY-4.0, und
- [models.dev](https://models.dev/) Preise lizenziert unter MIT.
:::
