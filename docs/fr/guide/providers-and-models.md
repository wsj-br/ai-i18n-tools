<a id="llm-providers-and-models"></a>
# Fournisseurs et modèles LLM

Chaque pipeline de traduction — `translate-ui`, `translate-docs`, `translate-json` et `translate-svg` — envoie du texte à un LLM via le même client indépendant du fournisseur. Avant que l'une de ces commandes ne puisse s'exécuter, configurez **au moins un fournisseur** dans `ai-i18n-tools.config.json` et définissez la **clé API** correspondante dans votre environnement ou `.env` (préréglages intégrés sauf **Ollama**). `init` écrit un bloc de démarrage `provider` / `providers` ; vous devez toujours fournir les informations d'identification pour le préréglage actif.

Vous configurez **quel point de terminaison d'API appeler** et **quels modèles essayer** une seule fois dans la configuration ; toutes les commandes de traduction partagent cette configuration et le même cache SQLite.

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
### Chaîne de secours du modèle

`translationModels` est une **liste ordonnée**, pas un choix unique. La CLI essaie le premier modèle ; en cas d’échec de la requête, de l’analyse ou du script, elle passe à l’entrée suivante. Configurez plusieurs modèles afin qu’une panne transitoire ou un modèle qui a des difficultés avec un paramètre régional (par exemple, l’hindi romanisé au lieu du devanagari) ne bloque pas l’exécution complète. La sortie romanisée est rejetée pour les paramètres régionaux de script natif ; un paramètre régional qui doit rester romanisé doit être configuré avec un sous-tag `-Latn` explicite (par exemple `hi-Latn`).

**Niveaux de résolution** (dédupliqués, ordre préservé) :

| Pipeline | Ordre |
| --- | --- |
| UI (`translate-ui`, pluriels, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documents, JSON, SVG | `localeModels(locale)` → `translationModels` |

La liste facultative `providers.<active>.uiModels` est une liste réservée à l'interface utilisateur, essayée après toute surcharge par locale correspondante et avant la chaîne globale `translationModels`. L'`providers.<active>.localeModels` facultatif mappe une locale BCP-47 aux modèles essayés **en premier** pour cette locale dans chaque pipeline (`pt-br` correspond à `pt-BR`). Lorsqu'aucune entrée `localeModels` ne correspond, seuls les niveaux spécifiques au pipeline s'appliquent.

Différents fournisseurs et modèles varient en termes de coût, de vitesse et de qualité selon les langues. Considérez la liste de modèles de `npx ai-i18n-tools init -P <provider>` comme un point de départ — développez-la lorsqu'une locale produit systématiquement de mauvais résultats, ou ajoutez une entrée `localeModels` pour cette locale. Listes prédéfinies et justification : [Configuration — `provider` et `providers`](/fr/reference/configuration#provider-and-providers).

**Chaînes d'interface utilisateur :** le `uiModels` facultatif vous permet d'acheminer le `translate-ui`, la génération au pluriel et le `proofread-ui` via des modèles premium avant la chaîne `translationModels` globale — utile car le texte de l'interface utilisateur est court mais destiné à l'utilisateur.

**Locales asiatiques :** les entrées `localeModels` facultatives pour `ja`, `ko`, `zh-Hans` et `zh-Hant` sont testées en premier dans chaque pipeline ; des modèles tels que `z-ai/glm-5.3` et `minimax/minimax-m2.7` offrent souvent de meilleures performances sur les écritures CJK que les solutions de repli généralistes.

Exemple de configuration (OpenRouter). `translationModels` et `uiModels` sont les listes utilisées par ce dépôt dans `ai-i18n-tools.config.json`. `localeModels` est un module complémentaire facultatif recommandé pour les locales CJK ; ce dépôt ne le définit pas.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### Valider et comparer les modèles

Avant de modifier `translationModels`, confirmez que chaque ID est toujours disponible sur le fournisseur actif :

```bash
npx ai-i18n-tools check-models
```

`check-models` appelle le point de terminaison `GET /models` du fournisseur, valide chaque ID de `translationModels`, `uiModels` et `localeModels`, signale les ID manquants ou obsolètes `expiration_date`, et se termine avec un code d'erreur non nul si un ID configuré est invalide. Lorsque le fournisseur renvoie les tarifs (OpenRouter et Cheaper Inference le font), il affiche également le coût en USD par million de jetons. Avec [`zeroDataRetention`](/fr/guide/providers-and-models#cheaperinference-zero-data-retention) activé, `check-models` et `list-models` utilisent `GET /models?zdr=true`.

Parcourir le catalogue complet annoncé par un fournisseur :

```bash
npx ai-i18n-tools list-models
```

Évaluez les modèles configurés sur un échantillon de traduction réel — chaque ID unique de `translationModels`, `uiModels` et `localeModels` s'exécute de manière isolée afin que vous puissiez comparer le temps réel, l'utilisation des jetons et le coût :

```bash
npx ai-i18n-tools bench-models
```

Demandez une liste restreinte classée (par qualité par défaut, ou `--price`) et écrivez éventuellement les meilleurs ids dans `translationModels`. L'[onglet Modèles](/fr/guide/translation-dashboard/models) affiche le même classement, les mêmes filtres et la même mise à jour de configuration.

```bash
npx ai-i18n-tools suggest-models
npx ai-i18n-tools suggest-models --list
npx ai-i18n-tools suggest-models --max-output-price 2 --min-delta 2
npx ai-i18n-tools suggest-models --price --top 8 --json
npx ai-i18n-tools suggest-models --apply
npx ai-i18n-tools suggest-models --refresh
```

Les colonnes du tableau sont le rang, l'ID de modèle, l'index, le ChrF mesuré, le Score Arena mesuré et les USD par million de jetons en entrée/sortie. Une mesure manquante est `—`. `--list` affiche ces colonnes pour les modèles déjà présents dans `translationModels`. `--max-output-price` conserve les modèles dont le prix de sortie est inférieur ou égal à ce nombre d'USD par million de jetons et exclut un modèle sans prix de sortie. `--min-delta` ne conserve un modèle que si son index est inférieur d'au moins autant de points à celui du modèle précédemment conservé. `--top` (par défaut 8) limite le tableau, `--json` et `--apply` après ces filtres. `--apply` remplace uniquement `translationModels`. `--refresh` retélécharge le cache de benchmark de 7 jours. Les poids optionnels sont [`modelSuggestion`](/fr/reference/configuration#modelsuggestion). Voir [suggest-models](/fr/reference/cli-commands/models#suggest-models).

Remplacez le texte de l'échantillon, les locales ou la liste de modèles :

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Détails de la commande : [Référence CLI](/fr/reference/cli-commands/).

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

- [Configuration — `provider` et `providers`](/fr/reference/configuration#provider-and-providers) — tableau de préréglages, points de terminaison personnalisés, délais d'attente des requêtes, taux de coût, rétention nulle des données de Cheaper Inference, comportement spécifique à OpenRouter.
- [Architecture — client LLM](/fr/reference/architecture) — comment le secours de modèle, le traitement par lots et le rapport de coûts fonctionnent en interne.
- [Variables d'environnement](/fr/reference/environment-variables) — variables d'environnement de clé API et remplacements d'URL de base.
