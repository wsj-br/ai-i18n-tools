<a id="environment-variables"></a>
# Variables d'environnement

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Clé API pour le fournisseur `openrouter` (requise lorsqu'il est actif). |
| Clés d'autres fournisseurs    | Chaque fournisseur lit sa propre variable d'environnement de clé : `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama n'en a pas besoin). Remplacez par fournisseur avec `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Remplace `providers.openrouter.baseUrl` (uniquement lorsque ce fournisseur est configuré). |
| `OLLAMA_BASE_URL`      | Remplace `providers.ollama.baseUrl` (uniquement lorsque ce fournisseur est configuré). |
| `AI_I18N_LANG`         | Langue de l'interface utilisateur de l'outil (aide CLI, journaux, tableau de bord). Remplacé par `-L` / `--ui-lang` ; remplace la configuration `uiLanguage`. Voir [Langue de l'interface utilisateur de l'outil](#tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Remplacer `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`   | Codes de langue séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL` | Niveau du journal (`debug`, `info`, `warn`, `error`). Les valeurs inconnues (y compris `silent`) sont remplacées par `info`. |
| `NO_COLOR`              | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.              |
| `I18N_LOG_SESSION_MAX`  | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |

Au démarrage, la CLI charge également automatiquement un fichier `.env` depuis le répertoire de travail actuel (via `process.loadEnvFile` de Node), de sorte que les clés d'API du fournisseur soient récupérées dans les shells non interactifs qui ne sourcent pas `.envrc` / `direnv`. Les variables déjà présentes dans l'environnement ne sont jamais remplacées, de sorte que les valeurs réelles de CI/production l'emportent toujours.

<a id="tool-ui-language"></a>
## Langue de l'interface utilisateur de l'outil

L'outil localise sa propre interface utilisateur — texte d'aide CLI, messages de journal/résumé/erreur à fort trafic, et le tableau de bord de traduction — indépendamment de `sourceLocale` / `targetLocales` de votre projet. La locale de l'interface utilisateur est résolue à partir des sources suivantes, par priorité la plus élevée :

1. Indicateur global `-L` / `--ui-lang <code>` (par ex. `-L pt-BR`).
2. Variable d'environnement `AI_I18N_LANG` (par ex. `export AI_I18N_LANG=es`).
3. La clé de configuration `uiLanguage` dans `ai-i18n-tools.config.json` (chaîne BCP-47).
4. La locale du système d'exploitation hôte (via `Intl.DateTimeFormat().resolvedOptions().locale`).

La locale demandée est comparée exactement aux langues d'interface utilisateur fournies ou à la variation la plus proche (par exemple, `pt-PT` se résout en `pt-BR`, et `en-US` se résout en `en-GB`) ; lorsqu'il n'y a pas de correspondance, elle se rabat sur la locale source (`en-GB`). Lorsqu'une langue d'interface utilisateur est demandée explicitement (via le drapeau, la variable d'environnement ou `uiLanguage`) mais qu'aucun bundle fourni ne correspond, la CLI affiche un avertissement unique indiquant que la locale par défaut sera utilisée ; une locale déduite uniquement du système d'exploitation hôte n'émet jamais d'avertissement.

Langues d'interface utilisateur fournies : `en-GB` (source) plus `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, et `zh-Hant`. Le tableau de bord de traduction lit la locale résolue, la direction de la mise en page et le bundle de traduction à partir de `GET /api/ui-i18n` et les applique au chargement (il définit `<html lang>` / `dir` et localise le balisage statique via les attributs `data-i18n*`). Cette fonctionnalité ne nécessite aucune configuration — par défaut, l'outil suit la locale de votre système d'exploitation.
