<a id="ai-models"></a>
# Modèles d'IA

Un modèle est un système nommé sur votre fournisseur, tel que `google/gemini-2.5-flash` ou `gpt-5-mini`. `init` écrit une liste `translationModels` de démarrage pour le fournisseur que vous avez choisi. Considérez cette liste comme un point de départ.

Choisissez la liste pour ce projet avec `suggest-models`, ou avec le même classement dans le tableau de bord de traduction sous **Modèles**. Les deux classent les modèles de chat du fournisseur actif à partir de benchmarks publiés et peuvent écrire le résultat dans `translationModels`. Configurez d'abord le fournisseur et sa clé d'API : [Fournisseurs de LLM](/fr/guide/providers-and-models).

<a id="start-with-a-ranked-shortlist"></a>
## Commencer par une liste restreinte classée

<a id="from-the-command-line"></a>
### Depuis la ligne de commande

`suggest-models` classe les modèles de chat que le fournisseur actif propose actuellement et affiche un tableau succinct. La qualité est la valeur par défaut : les mesures de traduction et un score de préférence général comptent plus que le prix.

```bash
ai-i18n-tools suggest-models
```

Les colonnes sont le rang, l'ID du modèle, l'indice, le ChrF mesuré, le score Arena mesuré, et le prix d'entrée et de sortie en USD par million de jetons. Une mesure manquante est `—`. L'indice est le score pondéré multiplié par 100. Dans le classement par qualité, un indice plus élevé correspond à une meilleure adéquation pour ce projet.

Écrivez cette liste restreinte dans la configuration lorsque le tableau vous semble correct :

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` remplace `providers.<active>.translationModels`. Il copie d'abord la configuration actuelle dans un fichier `ai-i18n-tools.config.{timestamp}.backup.json` au même niveau. `uiModels` et `localeModels` restent inchangés. `--top` (8 par défaut) correspond au nombre d'ID que le tableau et `--apply` incluent. Le premier ID est celui que la traduction essaie en premier.

`--price` privilégie un tarif plus bas tout en maintenant un plancher de qualité, de sorte qu'un modèle bon marché sans mesure reste en dessous des modèles qui ont des scores. `--quality` est la valeur par défaut. Passer les deux indicateurs est une erreur.

<a id="from-the-dashboard"></a>
### Depuis le tableau de bord

L'onglet **Modèles** affiche le même classement, avec une case à cocher sur chaque ligne.

```bash
ai-i18n-tools dashboard
```

Ouvrez **Modèles**. Choisissez **Qualité** ou **Prix**. Cochez les lignes que vous souhaitez. Les lignes cochées, de haut en bas, définissent l'ordre que la traduction essaiera. **Mettre à jour la configuration** demande une confirmation, écrit le même type de sauvegarde et enregistre cet ordre dans `translationModels`. **Copier le JSON** place le fragment `{ "translationModels": [...] }` dans le presse-papiers si vous préférez le coller vous-même.

**Prix de sortie max.** et **Delta d'indice min.** correspondent à `suggest-models --max-output-price` et `--min-delta`. Contrôles et colonnes : [Onglet Modèles](/fr/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### Fonctionnement du classement

La liste restreinte est un classement de benchmark du catalogue de chat en direct du fournisseur. La première exécution télécharge trois jeux de données publics et peut prendre un certain temps. Les exécutions ultérieures réutilisent le cache de 7 jours à l'emplacement `<cacheDir>/benchmark-scores.json` (généralement `.translation-cache/benchmark-scores.json`).

| Signal | Ce qu'il apporte | Source |
| --- | --- | --- |
| ChrF | Qualité de la traduction pour les langues de votre projet | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Score Arena | Préférence globale issue de comparaisons directes | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| USD par million de jetons | Prix d'entrée et de sortie | Le catalogue du fournisseur lorsqu'il publie les tarifs, sinon [models.dev](https://models.dev/) (MIT) |

ChrF utilise les scores de traduction de languagebench pour vos `sourceLocale` et `targetLocales`. Les paramètres régionaux correspondent à un code de langue languagebench : la sous-étiquette principale, avec des alias tels que `pt-BR` pour `pt` et `zh-Hant` pour `zh`. Un modèle qui traduit bien ces langues surclasse celui qui n'obtient de bons scores qu'en général. Les modèles d'embeddings, d'image, de parole et autres modèles non-chat sont ignorés, tout comme les ID ayant dépassé leur date d'expiration.

Qualité, le profil par défaut, accorde plus d'importance au score ChrF et à l'Arena Score qu'au prix. Prix inverse cette priorité et conserve le seuil de qualité décrit ci-dessus. Les pondérations facultatives sont [`modelSuggestion`](/fr/reference/configuration#modelsuggestion-optional).

`suggest-models --refresh` retélécharge les jeux de données. Rechargez ensuite l'onglet **Modèles**.

Tous les indicateurs, y compris `--json`, `--list` et la formule de score : [suggest-models](/fr/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## Pourquoi la liste contient plusieurs modèles

<a id="model-fallback-chain"></a>
### Chaîne de secours du modèle

`translationModels` est une liste ordonnée. L'interface en ligne de commande essaie le premier modèle. En cas d'échec d'une requête, d'une réponse qu'elle ne peut pas analyser ou d'un texte dans le mauvais système d'écriture, elle essaie l'ID suivant pour ce lot.

Un seul ID constitue un point de défaillance unique. Un modèle peut expirer, renvoyer un texte que cet outil rejette, ou bien traduire une langue et en traduire mal une autre. Un cas courant est l'hindi romanisé, alors que `hi` attend l'écriture devanagari. Le résultat romanisé est rejeté pour les paramètres régionaux à script natif. Un paramètre régional qui doit rester romanisé nécessite une sous-étiquette `-Latn` explicite, telle que `hi-Latn`.

C'est pourquoi la liste restreinte contient plusieurs ID, les plus performants en premier. L'ordre de la liste correspond à l'ordre dans lequel la traduction est tentée.

**Niveaux de résolution** (dédupliqués, ordre préservé) :

| Pipeline | Ordre |
| --- | --- |
| UI (`translate-ui`, pluriels, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documents, JSON, SVG | `localeModels(locale)` → `translationModels` |

La plupart des projets ne définissent que `translationModels`. Les deux autres listes sont utilisées lorsqu'un type de texte ou une langue doit essayer d'autres modèles en premier.

**Chaînes de l'interface utilisateur.** Le paramètre facultatif `uiModels` est essayé après toute substitution correspondante par paramètre régional et avant `translationModels`. Le texte de l'interface utilisateur est court et visible, l'utilisation d'un modèle plus performant dans cette chaîne est donc une division courante. `suggest-models --apply` n'écrit que `translationModels`.

**Un seul paramètre régional.** Le paramètre facultatif `localeModels` mappe une étiquette BCP-47 sur des modèles essayés en premier pour ce paramètre régional dans chaque pipeline (`pt-br` correspond à `pt-BR`). Le japonais, le coréen et le chinois donnent souvent de meilleurs résultats avec des modèles adaptés à ces écritures, tels que `z-ai/glm-5.3` et `minimax/minimax-m2.7`, qu'avec un modèle de secours générique. Lorsqu'aucune entrée ne correspond, seuls les niveaux de pipeline supérieurs s'appliquent.

Exemple (OpenRouter). Les ID montrent la forme des trois listes. Prenez `translationModels` dans `suggest-models` ou dans l'onglet **Modèles**. Ajoutez `uiModels` ou `localeModels` lorsque le texte de l'interface utilisateur ou un paramètre régional a besoin de sa propre chaîne.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

Listes prédéfinies de `init` et référence des champs : [Configuration — `provider` and `providers`](/fr/reference/configuration#provider-and-providers).

<a id="check-list-and-benchmark"></a>
## Vérifier, lister et benchmarker

Une fois la liste restreinte configurée, ces commandes permettent de l'inspecter. La traduction peut s'exécuter avant que vous ne les utilisiez.

<a id="check-models"></a>
### `check-models`

Confirme que chaque ID configuré est toujours proposé par le fournisseur actif.

```bash
ai-i18n-tools check-models
```

Elle appelle le point de terminaison `GET /models` du fournisseur, vérifie chaque ID dans `translationModels`, `uiModels` et `localeModels`, signale les ID manquants ou ayant dépassé `expiration_date`, et se termine avec un code de sortie non nul si un ID configuré est non valide. Lorsque le fournisseur publie les prix (ce que font OpenRouter et Cheaper Inference), elle affiche également le prix en USD par million de jetons.

<a id="list-models"></a>
### `list-models`

Affiche le catalogue complet annoncé par le fournisseur, trié par ID. Utilisez cette commande pour rechercher un ID que le classement a omis.

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

Traduit un échantillon via chaque modèle configuré individuellement, et affiche les jetons d'entrée et de sortie, le temps d'horloge et le coût en USD. `suggest-models` utilise les scores publiés ci-dessus. `bench-models` appelle les modèles, elle consomme donc du crédit d'API et affiche la latence et le prix sur votre compte.

```bash
ai-i18n-tools bench-models
```

Chaque ID unique de `translationModels`, `uiModels` et `localeModels` s'exécute sans solution de secours. Remplacez l'échantillon ou les ID pour une comparaison spécifique :

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

Lorsque la [conservation nulle des données](/fr/guide/providers-and-models#cheaperinference-zero-data-retention) est activée pour Cheaper Inference, `check-models`, `list-models` et `suggest-models` lisent `GET /models?zdr=true`.

Détails de la commande : [CLI — Modèles et langues](/fr/reference/cli-commands/models).

<a id="further-reference"></a>
## Références supplémentaires

- [Fournisseurs de LLM](/fr/guide/providers-and-models) — préréglages, clés d'API et changement de fournisseur avec `-P`.
- [Onglet Modèles](/fr/guide/translation-dashboard/models) — le même classement dans le tableau de bord.
- [Configuration — `provider` et `providers`](/fr/reference/configuration#provider-and-providers) — `translationModels`, `uiModels`, `localeModels`, délais d'expiration et tarifs.
- [suggest-models](/fr/reference/cli-commands/models#suggest-models) — indicateurs, filtres et formule de score.
