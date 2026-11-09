<a id="ai-models"></a>
# Modèles d'IA

Un modèle est un système nommé sur votre fournisseur, tel que `google/gemini-2.5-flash` ou `gpt-5-mini`. `init` écrit une liste `translationModels` de démarrage pour le fournisseur que vous avez choisi. Considérez cette liste comme un point de départ.

Choisissez la liste pour ce projet avec `suggest-models`, ou avec le même classement dans le tableau de bord de traduction sous **Modèles**. Les deux classent les modèles de chat du fournisseur actif à partir de benchmarks publiés et peuvent écrire le résultat dans `translationModels`. Configurez d'abord le fournisseur et sa clé d'API : [Fournisseurs de LLM](/fr/guide/providers-and-models).

<a id="start-with-a-ranked-list"></a>
## Commencer avec une liste classée

<a id="from-the-command-line"></a>
### Depuis la ligne de commande

`suggest-models` classe les modèles de chat que le fournisseur actif propose actuellement et affiche un tableau concis. La qualité est la valeur par défaut : l'indice est le ChrF de languagebench et le score Arena. Le prix est une colonne distincte et un ordre de tri, ne faisant pas partie de l'indice.

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

Les colonnes sont le rang, l'ID du modèle, l'index, le ChrF mesuré, l'Arena Score mesuré, le prix d'entrée, le prix de sortie, le prix combiné en USD par million de jetons, et le niveau de la frontière. Une mesure manquante est `—`. L'index est le score de qualité multiplié par 100. Un index plus élevé correspond mieux aux langues de ce projet. Un ID qui répète le ChrF, l'Arena Score et les prix des jetons d'une autre ligne est omis de ce tableau. `--list` l'affiche toujours.

Enregistrer cette liste dans la configuration lorsque le tableau semble correct :

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` remplace `providers.<active>.translationModels`. Il copie d'abord la configuration actuelle dans un `ai-i18n-tools.config.{timestamp}.backup.json` frère. `uiModels` et `localeModels` restent tels quels. `--top` (par défaut 8) est le nombre d'ID inclus dans le tableau et `--apply`. Le premier ID est celui que la traduction essaie en premier. Pour cette liste, ajoutez `--max-price` et `--min-delta`. Le plafond de prix empêche un modèle de secours de coûter plus cher que le budget, et l'écart d'index supprime un modèle qui n'est qu'à un petit pas de celui conservé au-dessus.

`--price` liste d'abord les modèles les moins chers sur la frontière qualité-prix et maintient un seuil de qualité, de sorte qu'un modèle bon marché sans mesure reste en dessous des modèles qui ont des scores. `--quality` est la valeur par défaut. Passer les deux drapeaux est une erreur.

<a id="from-the-dashboard"></a>
### Depuis le tableau de bord

L'onglet **Modèles** affiche le même classement, avec une case à cocher sur chaque ligne.

```bash
ai-i18n-tools dashboard
```

Ouvrez **Modèles**. Choisissez **Qualité** ou **Prix**. Cochez les lignes que vous souhaitez. Les lignes cochées, de haut en bas, définissent l'ordre que la traduction essaiera. **Mettre à jour la configuration** demande une confirmation, écrit le même type de sauvegarde et enregistre cet ordre dans `translationModels`. **Copier le JSON** place le fragment `{ "translationModels": [...] }` dans le presse-papiers si vous préférez le coller vous-même.

**Prix combiné maximal** et **Delta d'indice minimal** correspondent à `suggest-models --max-price` et `--min-delta`. Contrôles et colonnes : [onglet Modèles](/fr/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### Comment le classement est déterminé

La liste est un classement de référence du catalogue de chat en direct du fournisseur. La première exécution télécharge trois jeux de données publics et peut prendre un certain temps. Les exécutions ultérieures réutilisent le cache de 7 jours.

| Signal | Ce qu'il apporte | Source |
| --- | --- | --- |
| ChrF | Qualité de traduction pour les langues de votre projet | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | Préférence globale issue de comparaisons directes | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| USD par million de jetons | Prix d'entrée, de sortie et combiné `(3 × input + output) / 4` | Le catalogue du fournisseur lorsqu'il publie les tarifs, sinon [models.dev](https://models.dev/) (MIT) |

À partir de ces signaux, le classement dérive deux valeurs pour chaque modèle candidat : l'indice de qualité (combinant ChrF et Score Arena) et le niveau [frontière de Pareto](https://en.wikipedia.org/wiki/Pareto_frontier) (évaluant la qualité par rapport au prix du jeton combiné).

ChrF utilise les scores de traduction de languagebench pour vos `sourceLocale` et `targetLocales`. Les paramètres régionaux correspondent à un code de langue languagebench : la sous-étiquette principale, avec des alias tels que `pt-BR` pour `pt` et `zh-Hant` pour `zh`. Un modèle qui traduit bien ces langues surclasse celui qui n'obtient de bons scores qu'en général. Les modèles d'embeddings, d'image, de parole et autres modèles non-chat sont ignorés, tout comme les ID ayant dépassé leur date d'expiration.

L'indice est le ChrF et l'Arena Score. Le prix n'en fait pas partie. Le score pondère le ChrF (par défaut 55 %) et l'Arena Score (par défaut 45 %), chacun étant normalisé par rapport au score le plus élevé du catalogue de chat du fournisseur, arrondi à une décimale sur une échelle de 0 à 100. Des valeurs de substitution (`0.35` pour le ChrF, `0.45` pour l'Arena) s'appliquent uniquement lorsqu'une mesure est manquante ; le tableau affiche `—`.

Le seuil de qualité est un seuil ChrF minimum (par défaut 70 % du meilleur ChrF du pool de candidats pour la qualité, et 60 % pour le prix). Les modèles en dessous de ce seuil, y compris tout modèle sans mesure ChrF, sont triés après les modèles qui le dépassent et affichent `—` dans la colonne « frontière ». La qualité, le profil par défaut, trie par l'indice et départage les indices égaux avec le prix combiné le moins cher. Le prix classe les modèles par niveau de frontière (niveau 1 le moins cher en premier, puis niveau 2, et ainsi de suite). Les pondérations et seuils personnalisés facultatifs se trouvent dans [`modelSuggestion`](/fr/reference/configuration#modelsuggestion-optional).

Deux identifiants qui partagent le ChrF, l'Arena Score, le prix d'entrée et le prix de sortie sont des alias. Les suggestions conservent l'identifiant le plus court, et un identifiant sans date plutôt qu'un identifiant avec une date, comme `preview-06-05` ou `20241022`. Les autres identifiants restent dans le classement complet, de sorte que `--list` peut toujours afficher un alias configuré, et ils sont exclus du tableau, de `--json` et de `--apply`.

<a id="reading-the-frontier-column"></a>
#### Lire la colonne frontière

La colonne « frontière » est un niveau, pas un score. Un modèle est dominé lorsqu'un autre modèle ne coûte pas plus cher (prix combiné) et a au moins le même indice, et est strictement moins cher ou strictement plus élevé sur l'indice. Un `2` n'est pas deux fois pire qu'un `1`, et les numéros de niveau ne comparent pas la qualité entre les lignes : seul l'indice le fait. Deux lignes peuvent afficher `3` et `4` et rester à un point du modèle de niveau 1 qui les bat toutes les deux.

- `1` signifie qu'aucun autre modèle n'est à la fois moins cher et plus élevé sur l'indice. Sur `--price`, le niveau 1 va du moins cher au plus cher, et chaque étape coûte plus cher et a un indice plus élevé. `--min-delta` masque une étape qui n'ajoute qu'un petit gain.
- `2` signifie que le modèle est dominé, mais uniquement par des modèles de niveau 1. La ligne sous le tableau nomme le modèle de niveau 1 qui bat chaque ligne dominée. Passez la souris sur la valeur dans le tableau de bord pour voir le même modèle.
- `3` et les niveaux supérieurs suivent la même règle un cran plus bas. Plus le nombre est élevé, plus la chaîne est longue, et non plus l'indice est éloigné du meilleur modèle.
- `—` signifie que le modèle n'a pas de prix, qu'il est en dessous du seuil de qualité, ou qu'il est un alias d'une autre ligne. Il n'est pas comparé.

Le niveau 1 est un contrôle d'efficacité : rien d'autre n'est à la fois strictement moins cher et plus performant. Un niveau supérieur peut toujours figurer sur la liste. La diversité des fournisseurs, les limites de débit, la latence et la fenêtre contextuelle ne font pas partie de l'indice, et un mécanisme de repli vers un autre fournisseur reste utile lorsqu'un modèle de niveau 1 est soumis à des limites de débit ou rejette un lot. Un autre identifiant pour le même modèle n'aide pas à cela.

Une égalité exacte qui n'est pas un alias (le même prix combiné et le même indice, avec des prix de jetons ou des scores différents) partage le même niveau. L'indice est comparé tel qu'affiché dans le tableau, arrondi à une décimale.

Les niveaux sont calculés sur l'ensemble du catalogue, de sorte que `--max-price`, `--min-delta` et `--top` masquent des lignes sans les renuméroter. Un modèle qui est de niveau 1 dans la liste complète reste de niveau 1 après un plafonnement des prix. `--max-price` supprime les modèles au-dessus d'un budget. Il ne supprime pas toutes les lignes dominées sous le plafond. La colonne « frontière » et la ligne sous le tableau les affichent.

`--price` liste le niveau 1 du moins cher au plus cher, puis le niveau 2 de la même manière, et ainsi de suite. La qualité, par défaut, trie par l'indice et traite la colonne « frontière » comme une étiquette.

`suggest-models --refresh` retélécharge les jeux de données. Rechargez ensuite l'onglet **Modèles**.

Tous les indicateurs, y compris `--json`, `--list` et la formule de score : [suggest-models](/fr/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## Pourquoi la liste comporte plusieurs modèles

<a id="model-fallback-chain"></a>
### Chaîne de repli des modèles

`translationModels` est une liste ordonnée. L'interface en ligne de commande essaie le premier modèle. En cas d'échec d'une requête, d'une réponse qu'elle ne peut pas analyser ou d'un texte dans le mauvais système d'écriture, elle essaie l'ID suivant pour ce lot.

Un seul identifiant est un point de défaillance unique. Un modèle peut expirer, renvoyer du texte que cet outil rejette, ou traduire correctement une langue et mal une autre. Un cas courant est l'hindi romanisé où `hi` attend le devanagari. La sortie romanisée est rejetée pour les paramètres régionaux à script natif. Un paramètre régional qui doit rester romanisé nécessite un sous-tag `-Latn` explicite, tel que `hi-Latn`.

C'est pourquoi la liste contient plusieurs identifiants, les plus forts en premier. L'ordre dans la liste est l'ordre dans lequel la traduction est tentée.

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

Listes prédéfinies de `init`, et la référence de champ : [Configuration —](/fr/reference/configuration#provider-and-providers) `provider` [et](/fr/reference/configuration#provider-and-providers) `providers`.

<a id="check-list-and-benchmark"></a>
## Vérifier, lister et évaluer les performances

Une fois la liste dans la configuration, ces commandes l'inspectent. La traduction peut s'exécuter avant que vous ne les utilisiez.

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

Détails de la commande : [CLI — Modèles et langues](/fr/reference/cli-commands/models).

<a id="further-reference"></a>
## Références supplémentaires

- [Fournisseurs de LLM](/fr/guide/providers-and-models) — préréglages, clés API et changement de fournisseurs avec `-P`.
- [Onglet Modèles](/fr/guide/translation-dashboard/models) — le même classement dans le tableau de bord.
- [Configuration —](/fr/reference/configuration#provider-and-providers) `provider` [et](/fr/reference/configuration#provider-and-providers) `providers` — `translationModels`, `uiModels`, `localeModels`, délais d'expiration et taux de coût.
- [suggest-models](/fr/reference/cli-commands/models#suggest-models) — indicateurs, filtres et formule de score.

::: info Sources de référence externes
Les scores sont calculés à partir de sources de données externes :

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) sous licence CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) sous licence CC-BY-4.0, et
- les prix de [models.dev](https://models.dev/) sous licence MIT.
:::
