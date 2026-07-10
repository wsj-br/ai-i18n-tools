<a id="environment-variables"></a>
# Umgebungsvariablen

| Variable               | Beschreibung                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | API-Schlüssel für den `openrouter`-Anbieter (erforderlich, wenn dieser aktiv ist). |
| Andere Anbieter-Schlüssel    | Jeder Anbieter liest seine eigene Schlüssel-Umgebungsvariable: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama benötigt keinen). Überschreiben pro Anbieter mit `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Überschreibt `providers.openrouter.baseUrl` (nur wenn dieser Anbieter konfiguriert ist). |
| `OLLAMA_BASE_URL`      | Überschreibt `providers.ollama.baseUrl` (nur wenn dieser Anbieter konfiguriert ist). |
| `AI_I18N_LANG`         | Sprache für die Benutzeroberfläche des Tools (CLI-Hilfe, Protokolle, Dashboard). Wird durch `-L` / `--ui-lang` überschrieben; überschreibt die Konfiguration `uiLanguage`. Siehe [Sprache der Tool-Benutzeroberfläche](/de/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Überschreibt `sourceLocale` zur Laufzeit.                        |
| `I18N_TARGET_LOCALES`   | Durch Komma getrennte Gebietsschemacodes zur Überschreibung von `targetLocales`.  |
| `I18N_LOG_LEVEL` | Logger-Level (`debug`, `info`, `warn`, `error`). Unbekannte Werte (einschließlich `silent`) fallen auf `info` zurück. |
| `NO_COLOR`              | Wenn `1`, werden ANSI-Farben in der Protokollaufgabe deaktiviert.              |
| `I18N_LOG_SESSION_MAX`  | Maximale Anzahl an Zeilen pro Protokollsitzung (Standard `5000`).           |

Beim Start lädt die CLI auch automatisch eine `.env`-Datei aus dem aktuellen Arbeitsverzeichnis (über Node's `process.loadEnvFile`), sodass API-Schlüssel von Anbietern in nicht interaktiven Shells aufgenommen werden, die `.envrc` / `direnv` nicht ausführen. Variablen, die bereits in der Umgebung vorhanden sind, werden nie überschrieben, sodass reale CI/Produktionswerte immer Vorrang haben.
