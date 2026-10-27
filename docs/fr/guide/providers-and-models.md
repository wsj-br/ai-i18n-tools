<a id="llm-providers-and-models"></a>
# Fournisseurs de LLM

Chaque pipeline de traduction — `translate-ui`, `translate-docs`, `translate-json` et `translate-svg` — envoie du texte à un LLM via le même client indépendant du fournisseur. Avant que l'une de ces commandes ne puisse s'exécuter, configurez **au moins un fournisseur** dans `ai-i18n-tools.config.json` et définissez la **clé API** correspondante dans votre environnement ou `.env` (préréglages intégrés sauf **Ollama**). `init` écrit un bloc de démarrage `provider` / `providers` ; vous devez toujours fournir les informations d'identification pour le préréglage actif.

Vous configurez **quel point de terminaison d'API appeler** une seule fois dans la configuration ; toutes les commandes de traduction partagent cette configuration et le même cache SQLite. Le choix des modèles que ce fournisseur essaie est une étape distincte : [Modèles d'IA](/fr/guide/ai-models).

La CLI résout le fournisseur actif à partir de la clé `provider` de niveau supérieur (ou de la seule entrée dans `providers` lorsqu'un seul est configuré). Chaque bloc de fournisseur répertorie une chaîne de secours `translationModels` ordonnée ; les préréglages intégrés héritent automatiquement de `baseUrl` et de la variable d'environnement de clé API (les remplacer par fournisseur si nécessaire).

<a id="built-in-providers"></a>
### Fournisseurs intégrés

Les clés de fournisseur prédéfinies n'ont besoin que de `translationModels` — l'URL de base et la variable d'environnement de clé API sont renseignées automatiquement :

<div class="provider-presets">

| Fournisseur | URL de base | Variable d'environnement de la clé API |
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
| `ollama` | `http://localhost:11434/v1` | (aucun) |

</div>

Pour toute clé **non prédéfinie**, définissez explicitement `baseUrl` et `apiKeyEnv` dans la configuration.

Définissez la clé API du fournisseur actif dans votre environnement ou votre fichier `.env`. La CLI charge automatiquement `.env` depuis le répertoire de travail sans écraser les variables déjà définies dans le shell. Voir [Variables d'environnement](/fr/reference/environment-variables).

<a id="cheaperinference-zero-data-retention"></a>
### Rétention nulle des données (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` est facultatif et désactivé par défaut. Activez-le lorsque ce projet doit envoyer des invites uniquement via des fournisseurs qui ne les conservent pas.

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

Lorsque l'indicateur est activé, chaque requête de chat inclut `"zdr": true`, et `list-models`, `check-models` et `suggest-models` (y compris l'onglet Modèles du tableau de bord) lisent `GET /v1/models?zdr=true`. Ce catalogue répertorie les modèles qu'une requête de rétention nulle des données peut utiliser, au prix de la rétention nulle des données. `check-models` considère un ID manquant dans ce catalogue comme non valide. L'indicateur ne crée pas de route pour un modèle que le catalogue omet. Supprimez cet ID de `translationModels`, `uiModels` ou `localeModels`.

Laissez l'indicateur désactivé lorsque le compte Cheaper Inference ne nécessite pas de rétention nulle des données. Si [Protection des données](https://platform.cheaperinference.com/dashboard/data-protection) est déjà activée pour le compte, Cheaper Inference refuse toujours un modèle sans route de rétention nulle des données. L'erreur nomme ce modèle. Pour conserver la politique du compte, définissez `zeroDataRetention` sur `true` et passez à un modèle du catalogue de rétention nulle des données. Pour conserver le modèle refusé, désactivez la rétention nulle des données sur cette page. La chaîne de secours essaie alors le modèle configuré suivant.

<a id="model-fallback-chain"></a>
<a id="validate-and-compare-models"></a>
### Modèles

Le choix des modèles, la liste de repli, ainsi que `suggest-models`, `check-models`, `list-models` et `bench-models` sont décrits dans la section [Modèles d'IA](/fr/guide/ai-models).

<a id="multiple-providers"></a>
### Plusieurs fournisseurs

Lorsque plusieurs fournisseurs sont configurés, définissez la clé `provider` de niveau supérieur pour sélectionner le fournisseur par défaut. Changez par exécution sans modifier la configuration :

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Chaque bloc de fournisseur peut définir son propre `translationModels`, ses `uiModels` et `localeModels` facultatifs, ses `maxTokens`, ses `temperature` et ses `requestTimeout` (secondes) ou `requestTimeoutMs`. Un délai d'attente sur le fournisseur remplace le `requestTimeout` / `requestTimeoutMs` de niveau supérieur. Un bloc `openrouter` de niveau supérieur hérité est toujours accepté et migré automatiquement vers `providers.openrouter` lors du chargement.

Les options `pricing` et `modelPricing` définissent le coût en USD pour 1 000 000 de jetons (`inputPerMTokens` et `outputPerMTokens`) lorsque le fournisseur omet `usage.cost`. `pricing` est la valeur par défaut pour l'ensemble du fournisseur ; une entrée `modelPricing` remplace cette valeur pour un id de modèle spécifique. OpenRouter et Cheaper Inference renvoyant déjà un coût par appel, laissez ces deux options non définies pour ces fournisseurs. Un coût rapporté par le fournisseur est conservé tel quel. Le montant est inclus dans le résumé de la traduction, [`usage`](/fr/reference/cli-commands/workflows#usage), et [Usage & costs](/fr/guide/translation-dashboard/usage).

Exemple exécutable avec quatre fournisseurs sur le même document, incluant des exemples de tarifs : [`examples/multi-provider`](/fr/examples#multi-provider).

<a id="further-reference"></a>
### Références supplémentaires

- [Modèles d'IA](/fr/guide/ai-models) — liste restreinte classée, liste de repli et commandes de modèle.
- [Configuration — `provider` et `providers`](/fr/reference/configuration#provider-and-providers) — tableau de préréglages, points de terminaison personnalisés, délais d'expiration des requêtes, tarifs, conservation nulle des données pour Cheaper Inference, comportement spécifique à OpenRouter.
- [Architecture — Client LLM](/fr/reference/architecture) — fonctionnement interne du repli de modèle, du traitement par lots et du rapport de coûts.
- [Variables d'environnement](/fr/reference/environment-variables) — variables d'environnement de clé d'API et substitutions d'URL de base.
