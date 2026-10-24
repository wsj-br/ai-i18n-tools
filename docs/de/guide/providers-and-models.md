<a id="llm-providers-and-models"></a>
# LLM-Anbieter und -Modelle

Jede Übersetzungspipeline – `translate-ui`, `translate-docs`, `translate-json` und `translate-svg` – sendet Text über denselben anbieterunabhängigen Client an ein LLM. Bevor einer dieser Befehle ausgeführt werden kann, konfigurieren Sie **mindestens einen Anbieter** in `ai-i18n-tools.config.json` und legen Sie den passenden **API-Schlüssel** in Ihrer Umgebung oder in `.env` fest (integrierte Voreinstellungen außer **Ollama**). `init` schreibt einen Startblock `provider` / `providers`; Sie müssen weiterhin Anmeldeinformationen für die aktive Voreinstellung angeben.

Sie konfigurieren einmal in der Konfiguration, **welchen API-Endpunkt aufgerufen werden soll** und **welche Modelle ausprobiert werden sollen**; alle Übersetzungsbefehle teilen sich diese Einrichtung und denselben SQLite-Cache.

Die CLI löst den aktiven Anbieter aus dem übergeordneten Schlüssel `provider` (oder dem einzigen Eintrag in `providers`, wenn nur einer konfiguriert ist). Jeder Anbieterblock listet eine geordnete `translationModels`-Fallback-Kette auf; integrierte Voreinstellungen erben `baseUrl` und die API-Schlüssel-Umgebungsvariable automatisch (überschreiben Sie diese bei Bedarf pro Anbieter).

<a id="built-in-providers"></a>
### Integrierte Anbieter

Voreingestellte Anbieterschlüssel benötigen nur `translationModels` – Basis-URL und API-Schlüssel-Umgebungsvariable werden automatisch ausgefüllt:

<div class="provider-presets">

| Anbieter | Basis-URL | API-Schlüssel-Umgebungsvariable |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (keine) |

</div>

Für jeden **nicht voreingestellten** Schlüssel legen Sie `baseUrl` und `apiKeyEnv` explizit in der Konfiguration fest.

Legen Sie den API-Schlüssel des aktiven Anbieters in Ihrer Umgebung oder in der Datei `.env` fest. Die CLI lädt `.env` automatisch aus dem Arbeitsverzeichnis, ohne bereits in der Shell festgelegte Variablen zu überschreiben. Siehe [Umgebungsvariablen](/de/reference/environment-variables).

<a id="cheaperinference-zero-data-retention"></a>
### Null-Datenaufbewahrung (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` ist optional und standardmäßig deaktiviert. Aktivieren Sie sie, wenn dieses Projekt Prompts nur über Anbieter senden soll, die diese nicht speichern.

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

Wenn das Flag aktiviert ist, enthält jede Chat-Anfrage `"zdr": true`, und `list-models`, `check-models` und `suggest-models` (einschließlich des Tabs „Modelle“ im Dashboard) lesen `GET /v1/models?zdr=true`. Dieser Katalog listet die Modelle auf, die eine Anfrage mit Null-Datenaufbewahrung zum Preis für Null-Datenaufbewahrung verwenden kann. `check-models` behandelt eine ID, die in diesem Katalog fehlt, als ungültig. Das Flag erstellt keine Route für ein Modell, das der Katalog nicht enthält. Entfernen Sie diese ID aus `translationModels`, `uiModels` oder `localeModels`.

Lassen Sie das Flag deaktiviert, wenn das Cheaper Inference-Konto keine Null-Datenaufbewahrung erfordert. Wenn [Datenschutz](https://platform.cheaperinference.com/dashboard/data-protection) für das Konto bereits aktiviert ist, lehnt Cheaper Inference ein Modell ohne Route für Null-Datenaufbewahrung weiterhin ab. Die Fehlermeldung nennt dieses Modell. Um die Kontorichtlinie beizubehalten, setzen Sie `zeroDataRetention` auf `true` und wechseln Sie zu einem Modell aus dem Katalog für Null-Datenaufbewahrung. Um das abgelehnte Modell beizubehalten, deaktivieren Sie die Null-Datenaufbewahrung auf dieser Seite. Die Fallback-Kette versucht dann das nächste konfigurierte Modell.

<a id="model-fallback-chain"></a>
### Modell-Fallback-Kette

`translationModels` ist eine **geordnete Liste**, keine Einzelwahl. Die CLI versucht das erste Modell; bei Anforderung, Analyse oder Fehlern bei falschen Skripten wechselt sie zum nächsten Eintrag. Konfigurieren Sie mehrere Modelle, damit ein vorübergehender Ausfall oder ein Modell, das mit einer Sprache Schwierigkeiten hat (z. B. romanisiertes Hindi anstelle von Devanagari), den gesamten Lauf nicht blockiert. Romanisierte Ausgabe wird für Sprachen mit nativer Schrift abgelehnt; eine Sprache, die romanisiert bleiben soll, muss mit einem expliziten `-Latn`-Untertag (z. B. `hi-Latn`) konfiguriert werden.

**Auflösungsstufen** (dedupliziert, Reihenfolge beibehalten):

| Pipeline | Reihenfolge |
| --- | --- |
| UI (`translate-ui`, Pluralformen, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Dokumente, JSON, SVG | `localeModels(locale)` → `translationModels` |

Die optionale `providers.<active>.uiModels` ist eine reine UI-Liste, die nach jeder passenden pro-lokalen Überschreibung und vor der globalen `translationModels`-Kette versucht wird. Die optionale `providers.<active>.localeModels` ordnet einem BCP-47-Gebietsschema Modelle zu, die **zuerst** für dieses Gebietsschema in jeder Pipeline versucht werden (`pt-br` entspricht `pt-BR`). Wenn kein `localeModels`-Eintrag übereinstimmt, gelten nur die pipelinespezifischen Stufen.

Verschiedene Anbieter und Modelle unterscheiden sich in Kosten, Geschwindigkeit und Qualität sprachübergreifend. Betrachten Sie die Modellliste aus `npx ai-i18n-tools init -P <provider>` als Ausgangspunkt – erweitern Sie sie, wenn ein Gebietsschema durchweg schlechte Ergebnisse liefert, oder fügen Sie einen `localeModels`-Eintrag für dieses Gebietsschema hinzu. Voreingestellte Listen und Begründung: [Konfiguration – `provider` und `providers`](/de/reference/configuration#provider-and-providers).

**UI-Strings:** Optionale `uiModels` ermöglicht es Ihnen, `translate-ui`, Pluralgenerierung und `proofread-ui` über Premium-Modelle zu leiten, bevor die globale `translationModels`-Kette greift – nützlich, da UI-Texte kurz, aber benutzerorientiert sind.

**Asiatische Locales:** Optionale `localeModels`-Einträge für `ja`, `ko`, `zh-Hans` und `zh-Hant` werden in jeder Pipeline zuerst getestet; Modelle wie `z-ai/glm-5.3` und `minimax/minimax-m2.7` liefern bei CJK-Schriften oft bessere Ergebnisse als allgemeine Fallbacks.

Beispielkonfiguration (OpenRouter). `translationModels` und `uiModels` sind die Listen, die dieses Repository in `ai-i18n-tools.config.json` verwendet. `localeModels` ist eine optionale, empfohlene Erweiterung für CJK-Locales; dieses Repository definiert sie nicht.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### Modelle validieren und vergleichen

Bevor Sie `translationModels` ändern, bestätigen Sie, dass jede ID noch beim aktiven Anbieter verfügbar ist:

```bash
npx ai-i18n-tools check-models
```

`check-models` ruft den `GET /models`-Endpunkt des Anbieters auf, validiert jede ID aus `translationModels`, `uiModels` und `localeModels`, meldet IDs, die fehlen oder älter als `expiration_date` sind, und beendet sich mit einem von Null verschiedenen Wert, wenn eine konfigurierte ID ungültig ist. Wenn der Anbieter Preise zurückgibt (OpenRouter und Cheaper Inference tun dies), zeigt es auch USD pro 1 Million Tokens an. Wenn [`zeroDataRetention`](/de/guide/providers-and-models#cheaperinference-zero-data-retention) aktiviert ist, verwenden `check-models` und `list-models` `GET /models?zdr=true`.

Durchsuchen Sie den vollständigen Katalog, der von einem Anbieter beworben wird:

```bash
npx ai-i18n-tools list-models
```

Konfigurieren Sie Modelle anhand eines echten Übersetzungsbeispiels – jede eindeutige ID von `translationModels`, `uiModels` und `localeModels` wird isoliert ausgeführt, sodass Sie die tatsächliche Zeit, die Token-Nutzung und die Kosten vergleichen können:

```bash
npx ai-i18n-tools bench-models
```

Fragen Sie eine sortierte engere Auswahl ab (standardmäßig nach Qualität oder `--price`) und schreiben Sie optional die Top-IDs in `translationModels`. Der [Models-Tab](/de/guide/translation-dashboard/models) zeigt dieselbe Rangfolge, Filter und Konfigurationsaktualisierung.

```bash
npx ai-i18n-tools suggest-models
npx ai-i18n-tools suggest-models --list
npx ai-i18n-tools suggest-models --max-output-price 2 --min-delta 2
npx ai-i18n-tools suggest-models --price --top 8 --json
npx ai-i18n-tools suggest-models --apply
npx ai-i18n-tools suggest-models --refresh
```

Die Tabellenspalten sind Rang, Modell-ID, Index, gemessenes ChrF, gemessener Arena Score und Eingabe-/Ausgabe-USD pro 1 Million Tokens. Eine fehlende Messung ist `—`. `--list` gibt diese Spalten für die Modelle aus, die bereits in `translationModels` sind. `--max-output-price` behält Modelle, deren Ausgabe-USD pro 1 Million Tokens diesen Wert nicht überschreiten, und lässt ein Modell ohne Ausgabepreis weg. `--min-delta` behält ein Modell nur, wenn sein Index mindestens so viele Punkte unter dem des zuvor behaltenen Modells liegt. `--top` (Standard 8) begrenzt die Tabelle, `--json` und `--apply` nach diesen Filtern. `--apply` ersetzt nur `translationModels`. `--refresh` lädt den 7-Tage-Benchmark-Cache erneut herunter. Optionale Gewichte sind [`modelSuggestion`](/de/reference/configuration#modelsuggestion). Siehe [suggest-models](/de/reference/cli-commands/models#suggest-models).

Überschreiben Sie den Beispieltext, die Gebietsschemas oder die Modellliste:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Befehlsdetails: [CLI-Referenz](/de/reference/cli-commands/).

<a id="multiple-providers"></a>
### Mehrere Anbieter

Wenn mehr als ein Anbieter konfiguriert ist, legen Sie den übergeordneten Schlüssel `provider` fest, um den Standard auszuwählen. Wechseln Sie pro Lauf, ohne die Konfiguration zu bearbeiten:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Jeder Provider-Block kann seine eigenen `translationModels`, optionalen `uiModels` und `localeModels`, `maxTokens`, `temperature` und `requestTimeout` (Sekunden) oder `requestTimeoutMs` definieren. Ein Timeout für den Provider überschreibt das übergeordnete `requestTimeout` / `requestTimeoutMs`. Ein veralteter übergeordneter `openrouter`-Block wird weiterhin akzeptiert und beim Laden automatisch zu `providers.openrouter` migriert.

Optionale `pricing` und `modelPricing` legen die USD pro 1.000.000 Token (`inputPerMTokens` und `outputPerMTokens`) fest, wenn der Anbieter `usage.cost` weglässt. `pricing` ist der anbieterweite Standard; ein `modelPricing`-Eintrag überschreibt diesen für eine einzelne Modell-ID. OpenRouter und Cheaper Inference geben bereits pro Aufruf Kosten zurück, lassen Sie daher bei diesen Anbietern beide Werte ungesetzt. Ein vom Anbieter gemeldeter Preis wird unverändert übernommen. Der Betrag wird in der Übersetzungszusammenfassung, [`usage`](/de/reference/cli-commands/workflows#usage) und unter [Usage & costs](/de/guide/translation-dashboard/usage) einbezogen.

Ausführbares Beispiel mit vier Anbietern für dasselbe Dokument, inklusive Beispieltarifen: [`examples/multi-provider`](/de/examples#multi-provider).

<a id="further-reference"></a>
### Weitere Referenzen

- [Konfiguration — `provider` und `providers`](/de/reference/configuration#provider-and-providers) — Voreinstellungstabelle, benutzerdefinierte Endpunkte, Anfrage-Timeouts, Kostenraten, Cheaper Inference Null-Datenaufbewahrung, OpenRouter-spezifisches Verhalten.
- [Architektur — LLM-Client](/de/reference/architecture) — wie Modell-Fallback, Batching und Kostenberichterstattung intern funktionieren.
- [Umgebungsvariablen](/de/reference/environment-variables) — API-Schlüssel-Umgebungsvariablen und Basis-URL-Überschreibungen.
