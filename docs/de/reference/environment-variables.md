<a id="environment-variables"></a>
# Umgebungsvariablen

<a id="provider-api-keys"></a>
## Provider-API-Schlüssel

`init -P <provider>` wählt dieses integrierte Preset und den API-Schlüssel in der Tabelle unten aus. Überschreiben Sie den Variablennamen für einen Provider mit `providers.<name>.apiKeyEnv`. Ollama hat keinen API-Schlüssel.

| Variable | Anbieter |
| --- | --- |
| `OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_API_KEY` | `openai` |
| `ANTHROPIC_API_KEY` | `anthropic` |
| `GOOGLE_API_KEY` | `gemini` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `CEREBRAS_API_KEY` | `cerebras` |
| `GROQ_API_KEY` | `groq` |
| `MISTRAL_API_KEY` | `mistral` |
| `XAI_API_KEY` | `xai` |
| `NVIDIA_API_KEY` | `nvidia` |
| `ALIBABA_API_KEY` | `alibaba` |
| `APIFUN_API_KEY` | `apifun` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

Der Schlüssel ist erforderlich, wenn dieser Anbieter aktiv ist. Preset-URLs: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers).

<a id="provider-base-urls"></a>
## Provider-Basis-URLs

Diese beiden Variablen überschreiben `baseUrl` für einen konfigurierten Anbieter. Jedes andere Preset ändert seine URL in der Konfiguration (`providers.<name>.baseUrl`), nicht über eine Umgebungsvariable.

| Variable | Überschreibt |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (nur wenn dieser Anbieter konfiguriert ist) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (nur wenn dieser Anbieter konfiguriert ist) |

<a id="tool-and-run"></a>
## Tool und Ausführung

| Variable | Beschreibung |
| --- | --- |
| `AI_I18N_LANG` | Sprache für die Benutzeroberfläche des Tools (CLI-Hilfe, Protokolle, Dashboard). Wird durch `-L` / `--ui-lang` überschrieben; überschreibt die Konfiguration `uiLanguage`. Siehe [Sprache der Tool-Benutzeroberfläche](/de/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Überschreibt `sourceLocale` zur Laufzeit.                        |
| `I18N_TARGET_LOCALES`   | Durch Komma getrennte Gebietsschemacodes zur Überschreibung von `targetLocales`.  |
| `I18N_LOG_LEVEL` | Logger-Level (`debug`, `info`, `warn`, `error`). Unbekannte Werte (einschließlich `silent`) fallen auf `info` zurück. |
| `NO_COLOR`              | Wenn `1`, werden ANSI-Farben in der Protokollaufgabe deaktiviert.              |
| `I18N_LOG_SESSION_MAX`  | Maximale Anzahl an Zeilen pro Protokollsitzung (Standard `5000`).           |

Beim Start lädt die CLI auch automatisch eine `.env`-Datei aus dem aktuellen Arbeitsverzeichnis (über Node's `process.loadEnvFile`), sodass API-Schlüssel von Anbietern in nicht interaktiven Shells aufgenommen werden, die `.envrc` / `direnv` nicht ausführen. Variablen, die bereits in der Umgebung vorhanden sind, werden nie überschrieben, sodass reale CI/Produktionswerte immer Vorrang haben.
