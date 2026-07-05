<a id="llm-providers-and-models"></a>
# Fournisseurs et modèles LLM

Chaque pipeline de traduction — `translate-ui`, `translate-docs`, `translate-json` et `translate-svg` — envoie du texte à un LLM via le même client agnostique du fournisseur. Vous configurez **quel point de terminaison d'API appeler** et **quels modèles essayer** une fois dans `ai-i18n-tools.config.json` ; toutes les commandes partagent cette configuration et le même cache SQLite.

La CLI résout le fournisseur actif à partir de la clé `provider` de niveau supérieur (ou de la seule entrée dans `providers` lorsqu'un seul est configuré). Chaque bloc de fournisseur répertorie une chaîne de secours `translationModels` ordonnée ; les préréglages intégrés héritent automatiquement de `baseUrl` et de la variable d'environnement de clé API (les remplacer par fournisseur si nécessaire).

<a id="built-in-providers"></a>
### Fournisseurs intégrés

Les clés de fournisseur prédéfinies n'ont besoin que de `translationModels` — l'URL de base et la variable d'environnement de clé API sont renseignées automatiquement :

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
| `ollama` | `http://localhost:11434/v1` | (aucun) |

Pour toute clé **non prédéfinie**, définissez explicitement `baseUrl` et `apiKeyEnv` dans la configuration.

Définissez la clé API du fournisseur actif dans votre environnement ou votre fichier `.env`. La CLI charge automatiquement `.env` depuis le répertoire de travail sans écraser les variables déjà définies dans le shell. Voir [Variables d'environnement](/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Chaîne de secours du modèle

`translationModels` est une **liste ordonnée**, pas un choix unique. La CLI essaie le premier modèle ; en cas d'échec de la requête ou de l'analyse, elle passe à l'entrée suivante. Configurez plusieurs modèles afin qu'une panne transitoire ou un modèle qui a des difficultés avec une locale ne bloque pas l'exécution complète.

Pour `translate-ui` uniquement, l'option `ui.preferredModel` est essayée **avant** la liste `translationModels` du fournisseur (dédupliquée).

Les différents fournisseurs et modèles varient en coût, en vitesse et en qualité selon les langues. Considérez la liste par défaut de `npx ai-i18n-tools init` comme un point de départ — étendez-la lorsqu'une locale produit constamment de mauvais résultats. Valeurs par défaut complètes et justification : [Configuration — `provider` et `providers`](/reference/configuration#provider-and-providers).

Exemple de configuration minimale (OpenRouter) :

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
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

`check-models` appelle le point de terminaison `GET /models` du fournisseur, signale les ID manquants ou dépassant `expiration_date`, et se termine avec un code d'erreur non nul si un ID configuré est invalide. Lorsque le fournisseur renvoie des informations de tarification (OpenRouter le fait), il affiche également le coût estimé en USD par million de jetons.

Parcourir le catalogue complet annoncé par un fournisseur :

```bash
npx ai-i18n-tools list-models
```

Évaluez les modèles configurés sur un échantillon de traduction réel — chaque modèle s'exécute de manière isolée afin que vous puissiez comparer le temps réel, l'utilisation des jetons et le coût :

```bash
npx ai-i18n-tools bench-models
```

Remplacez le texte de l'échantillon, les locales ou la liste de modèles :

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --models openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Détails de la commande : [Référence CLI](/reference/cli-commands).

<a id="multiple-providers"></a>
### Plusieurs fournisseurs

Lorsque plusieurs fournisseurs sont configurés, définissez la clé `provider` de niveau supérieur pour sélectionner le fournisseur par défaut. Changez par exécution sans modifier la configuration :

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Chaque bloc de fournisseur peut définir ses propres `translationModels`, `maxTokens`, `temperature` et `requestTimeoutMs`. Un bloc `openrouter` de niveau supérieur hérité est toujours accepté et migré automatiquement vers `providers.openrouter` lors du chargement.

Exemple exécutable avec quatre fournisseurs sur le même document : [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### Références supplémentaires

- [Configuration — `provider` et `providers`](/reference/configuration#provider-and-providers) — tableau prédéfini, points de terminaison personnalisés, délais d'attente des requêtes, comportement spécifique à OpenRouter.
- [Architecture — Client LLM](/reference/architecture) — fonctionnement interne du repli de modèle, du traitement par lots et du rapport de coûts.
- [Variables d'environnement](/reference/environment-variables) — variables d'environnement de clé API et remplacements d'URL de base.
