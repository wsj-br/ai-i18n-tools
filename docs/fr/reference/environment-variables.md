<a id="environment-variables"></a>
# Variables d'environnement

<a id="provider-api-keys"></a>
## Clés d'API des fournisseurs

`init -P <provider>` sélectionne ce préréglage intégré et la clé API dans le tableau ci-dessous. Remplacez le nom de la variable pour un fournisseur par `providers.<name>.apiKeyEnv`. Ollama n'a pas de clé API.

| Variable | Fournisseur |
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

La clé est requise lorsque ce fournisseur est actif. Pour `apikeyfan`, l'`APIFUN_API_KEY` hérité est accepté lorsque `APIKEYFAN_API_KEY` n'est pas défini ou est vide. Un `apiKeyEnv` personnalisé désactive ce mécanisme de repli. URL prédéfinies : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers).

<a id="provider-base-urls"></a>
## URL de base des fournisseurs

Ces deux variables remplacent `baseUrl` pour un fournisseur configuré. Tous les autres préréglages modifient leur URL dans la configuration (`providers.<name>.baseUrl`), et non via une variable d'environnement.

| Variable | Remplace |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (uniquement lorsque ce fournisseur est configuré) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (uniquement lorsque ce fournisseur est configuré) |

<a id="tool-and-run"></a>
## Outil et exécution

| Variable | Description |
| --- | --- |
| `AI_I18N_LANG` | Langue de l'interface utilisateur de l'outil (aide de la CLI, journaux, tableau de bord). Remplacée par `-L` / `--ui-lang` ; remplace la configuration `uiLanguage`. Voir [Langue de l'interface de l'outil](/fr/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Remplacer `sourceLocale` au moment de l'exécution.                        |
| `I18N_TARGET_LOCALES`   | Codes de langue séparés par des virgules pour remplacer `targetLocales`.  |
| `I18N_LOG_LEVEL` | Niveau du journal (`debug`, `info`, `warn`, `error`). Les valeurs inconnues (y compris `silent`) sont remplacées par `info`. |
| `NO_COLOR`              | Lorsque `1`, désactiver les couleurs ANSI dans la sortie du journal.              |
| `I18N_LOG_SESSION_MAX`  | Nombre maximal de lignes conservées par session de journal (par défaut `5000`).           |

Lorsqu'aucune clé API de fournisseur n'est définie, la CLI et `doctor` lisent `.env` et `.env.local` depuis le répertoire qui contient `ai-i18n-tools.config.json`. Seules les variables des tableaux ci-dessus (plus un `providers.*.apiKeyEnv` personnalisé) sont copiées, et uniquement lorsque cette variable n'est pas définie. `.env.local` l'emporte lorsque les deux fichiers définissent le même nom. Un avertissement nomme le fichier et les variables qui ont été lues. `doctor` le répète dans la section Environnement. Si une clé API de fournisseur possède déjà une valeur, aucun des deux fichiers n'est lu.
