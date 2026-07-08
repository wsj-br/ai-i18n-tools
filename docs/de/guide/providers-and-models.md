<a id="llm-providers-and-models"></a>
# LLM-Anbieter und -Modelle

Jede Übersetzungspipeline – `translate-ui`, `translate-docs`, `translate-json` und `translate-svg` – sendet Text über denselben anbieterunabhängigen Client an ein LLM. Sie konfigurieren **welchen API-Endpunkt aufgerufen werden soll** und **welche Modelle ausprobiert werden sollen** einmal in `ai-i18n-tools.config.json`; alle Befehle teilen sich diese Einrichtung und denselben SQLite-Cache.

Die CLI löst den aktiven Anbieter aus dem übergeordneten Schlüssel `provider` (oder dem einzigen Eintrag in `providers`, wenn nur einer konfiguriert ist). Jeder Anbieterblock listet eine geordnete `translationModels`-Fallback-Kette auf; integrierte Voreinstellungen erben `baseUrl` und die API-Schlüssel-Umgebungsvariable automatisch (überschreiben Sie diese bei Bedarf pro Anbieter).

<a id="built-in-providers"></a>
### Integrierte Anbieter

Voreingestellte Anbieterschlüssel benötigen nur `translationModels` – Basis-URL und API-Schlüssel-Umgebungsvariable werden automatisch ausgefüllt:

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
| `ollama` | `http://localhost:11434/v1` | (keine) |

Für jeden **nicht voreingestellten** Schlüssel legen Sie `baseUrl` und `apiKeyEnv` explizit in der Konfiguration fest.

Legen Sie den API-Schlüssel des aktiven Anbieters in Ihrer Umgebung oder in der Datei `.env` fest. Die CLI lädt `.env` automatisch aus dem Arbeitsverzeichnis, ohne bereits in der Shell festgelegte Variablen zu überschreiben. Siehe [Umgebungsvariablen](/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Modell-Fallback-Kette

`translationModels` ist eine **geordnete Liste**, keine einzelne Auswahl. Die CLI versucht das erste Modell; bei Anforderungs- oder Analysefehler wechselt sie zum nächsten Eintrag. Konfigurieren Sie mehrere Modelle, damit ein vorübergehender Ausfall oder ein Modell, das mit einem Gebietsschema Schwierigkeiten hat, den gesamten Lauf nicht blockiert.

**Auflösungsstufen** (dedupliziert, Reihenfolge beibehalten):

| Pipeline | Reihenfolge |
| --- | --- |
| UI (`translate-ui`, Pluralformen, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Dokumente, JSON, SVG | `localeModels(locale)` → `translationModels` |

Die optionale `providers.<active>.uiModels` ist eine reine UI-Liste, die nach jeder passenden pro-lokalen Überschreibung und vor der globalen `translationModels`-Kette versucht wird. Die optionale `providers.<active>.localeModels` ordnet einem BCP-47-Gebietsschema Modelle zu, die **zuerst** für dieses Gebietsschema in jeder Pipeline versucht werden (`pt-br` entspricht `pt-BR`). Wenn kein `localeModels`-Eintrag übereinstimmt, gelten nur die pipelinespezifischen Stufen.

Verschiedene Anbieter und Modelle variieren in Kosten, Geschwindigkeit und Qualität über Sprachen hinweg. Betrachten Sie die Standardliste von `npx ai-i18n-tools init` als Ausgangspunkt – erweitern Sie sie, wenn ein Gebietsschema durchweg schlechte Ergebnisse liefert, oder fügen Sie einen `localeModels`-Eintrag für dieses Gebietsschema hinzu. Vollständige Standardwerte und Begründung: [Konfiguration – `provider` und `providers`](/reference/configuration#provider-and-providers).

Beispiel für eine minimale Konfiguration (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest"
      ],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
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

`check-models` ruft den `GET /models`-Endpunkt des Anbieters auf, validiert jede ID von `translationModels`, `uiModels` und `localeModels`, meldet fehlende oder über `expiration_date` liegende IDs und beendet den Vorgang mit einem von Null verschiedenen Wert, wenn eine konfigurierte ID ungültig ist. Wenn der Anbieter Preise zurückgibt (OpenRouter tut dies), zeigt er auch geschätzte USD pro 1 Million Token an.

Durchsuchen Sie den vollständigen Katalog, der von einem Anbieter beworben wird:

```bash
npx ai-i18n-tools list-models
```

Konfigurieren Sie Modelle anhand eines echten Übersetzungsbeispiels – jede eindeutige ID von `translationModels`, `uiModels` und `localeModels` wird isoliert ausgeführt, sodass Sie die tatsächliche Zeit, die Token-Nutzung und die Kosten vergleichen können:

```bash
npx ai-i18n-tools bench-models
```

Überschreiben Sie den Beispieltext, die Gebietsschemas oder die Modellliste:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Befehlsdetails: [CLI-Referenz](/reference/cli-commands).

<a id="multiple-providers"></a>
### Mehrere Anbieter

Wenn mehr als ein Anbieter konfiguriert ist, legen Sie den übergeordneten Schlüssel `provider` fest, um den Standard auszuwählen. Wechseln Sie pro Lauf, ohne die Konfiguration zu bearbeiten:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Jeder Anbieterblock kann seine eigenen `translationModels`, optionalen `uiModels` und `localeModels`, `maxTokens`, `temperature` und `requestTimeoutMs` definieren. Ein veralteter Top-Level-Block `openrouter` wird weiterhin akzeptiert und beim Laden automatisch zu `providers.openrouter` migriert.

Ausführbares Beispiel mit vier Anbietern im selben Dokument: [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### Weitere Referenzen

- [Konfiguration – `provider` und `providers`](/reference/configuration#provider-and-providers) – voreingestellte Tabelle, benutzerdefinierte Endpunkte, Anforderungs-Timeouts, OpenRouter-spezifisches Verhalten.
- [Architektur – LLM-Client](/reference/architecture) – wie Modell-Fallback, Batching und Kostenberichterstattung intern funktionieren.
- [Umgebungsvariablen](/reference/environment-variables) – API-Schlüssel-Umgebungsvariablen und Basis-URL-Überschreibungen.
