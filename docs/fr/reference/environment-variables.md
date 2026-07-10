<a id="environment-variables"></a>
# Variables d'environnement

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Clé API pour le fournisseur `openrouter` (requise lorsqu'il est actif). |
| Clés d'autres fournisseurs    | Chaque fournisseur lit sa propre variable d'environnement de clé : `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama n'en a pas besoin). Remplacez par fournisseur avec `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Remplace `providers.openrouter.baseUrl` (uniquement lorsque ce fournisseur est configuré). |
| `OLLAMA_BASE_URL`      | Remplace `providers.ollama.baseUrl` (uniquement lorsque ce fournisseur est configuré). |
| `AI_I18N_LANG`         | Langue de l'interface utilisateur de l'outil (aide CLI, journaux, tableau de bord). Remplacée par `-L` / `--ui-lang` ; remplace la configuration `uiLanguage`. Voir [Langue de l'interface utilisateur de l'outil](/fr/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Remplacer `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`   | Codes de langue séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL` | Niveau du journal (`debug`, `info`, `warn`, `error`). Les valeurs inconnues (y compris `silent`) sont remplacées par `info`. |
| `NO_COLOR`              | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.              |
| `I18N_LOG_SESSION_MAX`  | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |

Au démarrage, la CLI charge également automatiquement un fichier `.env` depuis le répertoire de travail actuel (via `process.loadEnvFile` de Node), de sorte que les clés d'API du fournisseur soient récupérées dans les shells non interactifs qui ne sourcent pas `.envrc` / `direnv`. Les variables déjà présentes dans l'environnement ne sont jamais remplacées, de sorte que les valeurs réelles de CI/production l'emportent toujours.
