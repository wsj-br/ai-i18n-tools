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
| `APIKEYFAN_API_KEY` | `apikeyfan` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

Der Schlüssel ist erforderlich, wenn dieser Anbieter aktiv ist. Für `apikeyfan` wird der Legacy-`APIFUN_API_KEY` akzeptiert, wenn `APIKEYFAN_API_KEY` nicht gesetzt oder leer ist. Eine benutzerdefinierte `apiKeyEnv` deaktiviert diesen Fallback. Voreingestellte URLs: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers).

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

Wenn kein Anbieter-API-Schlüssel festgelegt ist, lesen die CLI und `doctor` die `.env` und `.env.local` aus dem Verzeichnis, das `ai-i18n-tools.config.json` enthält. Nur die Variablen in den obigen Tabellen (sowie ein benutzerdefiniertes `providers.*.apiKeyEnv`) werden kopiert, und nur, wenn diese Variable nicht gesetzt ist. `.env.local` hat Vorrang, wenn beide Dateien denselben Namen festlegen. Eine Warnung benennt die Datei und die Variablen, die gelesen wurden. `doctor` wiederholt eine Warnung pro Datei im Abschnitt "Umgebung" und zählt jede in der Zusammenfassung. Diese Warnung beendet den Vorgang mit Exit-Code 0, es sei denn, `--strict` ist gesetzt, was zu einem Exit-Code 1 führt. Ein Fehler beendet den Vorgang mit Exit-Code 2. Wenn ein Anbieter-API-Schlüssel bereits einen Wert hat, wird keine der beiden Dateien gelesen.
