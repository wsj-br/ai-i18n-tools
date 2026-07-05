<a id="environment-variables"></a>
# Umgebungsvariablen

| Variable               | Beschreibung                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | API-Schlüssel für den `openrouter`-Anbieter (erforderlich, wenn dieser aktiv ist). |
| Andere Anbieter-Schlüssel    | Jeder Anbieter liest seine eigene Schlüssel-Umgebungsvariable: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama benötigt keinen). Überschreiben pro Anbieter mit `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Überschreibt `providers.openrouter.baseUrl` (nur wenn dieser Anbieter konfiguriert ist). |
| `OLLAMA_BASE_URL`      | Überschreibt `providers.ollama.baseUrl` (nur wenn dieser Anbieter konfiguriert ist). |
| `AI_I18N_LANG`         | Sprache für die Benutzeroberfläche des Tools (CLI-Hilfe, Log-Nachrichten, Dashboard). Wird durch `-L` / `--ui-lang` überschrieben; überschreibt Konfiguration `uiLanguage`. Siehe [Benutzeroberflächensprache des Tools](#tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Überschreibt `sourceLocale` zur Laufzeit.                        |
| `I18N_TARGET_LOCALES`   | Durch Komma getrennte Gebietsschemacodes zur Überschreibung von `targetLocales`.  |
| `I18N_LOG_LEVEL` | Logger-Level (`debug`, `info`, `warn`, `error`). Unbekannte Werte (einschließlich `silent`) fallen auf `info` zurück. |
| `NO_COLOR`              | Wenn `1`, werden ANSI-Farben in der Protokollaufgabe deaktiviert.              |
| `I18N_LOG_SESSION_MAX`  | Maximale Anzahl an Zeilen pro Protokollsitzung (Standard `5000`).           |

Beim Start lädt die CLI auch automatisch eine `.env`-Datei aus dem aktuellen Arbeitsverzeichnis (über Node's `process.loadEnvFile`), sodass API-Schlüssel von Anbietern in nicht interaktiven Shells aufgenommen werden, die `.envrc` / `direnv` nicht ausführen. Variablen, die bereits in der Umgebung vorhanden sind, werden nie überschrieben, sodass reale CI/Produktionswerte immer Vorrang haben.

<a id="tool-ui-language"></a>
## Benutzeroberflächensprache des Tools

Das Tool lokalisiert seine eigene Benutzeroberfläche – CLI-Hilfetext, häufige Log-/Zusammenfassungs-/Fehlermeldungen und das Übersetzungs-Dashboard – unabhängig von der `sourceLocale` / `targetLocales` Ihres Projekts. Die Benutzeroberflächen-Lokale wird aus diesen Quellen aufgelöst, beginnend mit der höchsten Priorität:

1. `-L` / `--ui-lang <code>` globale Flagge (z. B. `-L pt-BR`).
2. `AI_I18N_LANG` Umgebungsvariable (z. B. `export AI_I18N_LANG=es`).
3. Der `uiLanguage` Konfigurationsschlüssel in `ai-i18n-tools.config.json` (BCP-47-String).
4. Das Host-Betriebssystem-Locale (über `Intl.DateTimeFormat().resolvedOptions().locale`).

Die angeforderte Lokale wird genau oder durch die nächste Variation (z. B. `pt-PT` wird zu `pt-BR`, und `en-US` wird zu `en-GB`) mit den mitgelieferten Benutzeroberflächen-Sprachen abgeglichen; wenn nichts übereinstimmt, wird auf die Quellsprachlocale (`en-GB`) zurückgegriffen. Wenn eine Benutzeroberflächen-Sprache explizit angefordert wird (über die Flag, Umgebungsvariable oder `uiLanguage`), aber kein mitgeliefertes Paket übereinstimmt, gibt die CLI eine einmalige Warnung aus, dass die Standard-Lokale verwendet wird; eine Lokale, die nur aus dem Host-Betriebssystem abgeleitet wird, warnt nie.

Mitgelieferte Benutzeroberflächen-Sprachen: `en-GB` (Quelle) plus `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` und `zh-Hant`. Das Übersetzungs-Dashboard liest die aufgelöste Lokale, die Layout-Richtung und das Übersetzungs-Paket aus `GET /api/ui-i18n` und wendet sie beim Laden an (es setzt `<html lang>` / `dir` und lokalisiert statische Markierungen über `data-i18n*`-Attribute). Diese Funktion erfordert keine Konfiguration – standardmäßig folgt das Tool der Betriebssystem-Lokale.
