<a id="llm-providers-and-models"></a>
# LLM-Anbieter

Jede Übersetzungspipeline – `translate-ui`, `translate-docs`, `translate-json` und `translate-svg` – sendet Text über denselben anbieterunabhängigen Client an ein LLM. Bevor einer dieser Befehle ausgeführt werden kann, konfigurieren Sie **mindestens einen Anbieter** in `ai-i18n-tools.config.json` und legen Sie den passenden **API-Schlüssel** in Ihrer Umgebung oder in `.env` fest (integrierte Voreinstellungen außer **Ollama**). `init` schreibt einen Startblock `provider` / `providers`; Sie müssen weiterhin Anmeldeinformationen für die aktive Voreinstellung angeben.

Sie legen einmal in der Konfiguration fest, **welcher API-Endpunkt aufgerufen werden soll**. Alle Übersetzungsbefehle nutzen diese Einrichtung und denselben SQLite-Cache gemeinsam. Welche Modelle der Anbieter ausprobiert, ist ein separater Schritt: [KI-Modelle](/de/guide/ai-models).

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
<a id="validate-and-compare-models"></a>
### Modelle

Die Auswahl der Modelle, die Fallback-Liste und `suggest-models`, `check-models`, `list-models` und `bench-models` finden Sie unter [KI-Modelle](/de/guide/ai-models).

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

- [KI-Modelle](/de/guide/ai-models) — priorisierte Auswahlliste, Fallback-Liste und die Modellbefehle.
- [Konfiguration — `provider` und `providers`](/de/reference/configuration#provider-and-providers) — vordefinierte Tabelle, benutzerdefinierte Endpunkte, Request-Timeouts, Kostensätze, Null-Datenaufbewahrung bei Cheaper Inference, OpenRouter-spezifisches Verhalten.
- [Architektur — LLM-Client](/de/reference/architecture) — interne Funktionsweise von Modell-Fallback, Batch-Verarbeitung und Kostenberichterstattung.
- [Umgebungsvariablen](/de/reference/environment-variables) — Umgebungsvariablen für API-Schlüssel und Überschreibungen der Basis-URL.
