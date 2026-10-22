<a id="cli--models--languages"></a>
# CLI — Modèles et langues

<a id="check-models"></a>
### `check-models`

**Synopsis :** `ai-i18n-tools check-models`

Valide chaque ID de modèle configuré par rapport à la liste `GET /models` du fournisseur actif (appartenance et `expiration_date`). Nécessite la clé API de ce fournisseur (aucune pour les fournisseurs sans clé comme Ollama). Quitte avec un code d'erreur si un ID configuré est manquant ou expiré, et respecte le délai d'attente de la requête résolu (`requestTimeout` ou `requestTimeoutMs` sur le fournisseur, sinon la valeur de niveau supérieur). Lorsque le fournisseur renvoie des informations de tarification (par exemple, OpenRouter), affiche également le coût en USD par million de jetons pour l'invite/la complétion.

**Voir aussi :** [Fournisseurs LLM](/fr/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Synopsis :** `ai-i18n-tools list-models`

Liste tous les modèles annoncés par le fournisseur actif via sa liste `GET /models` (triés par ID ; le fournisseur actif suit la clé de configuration `provider`, à remplacer par `-P` / `--provider`). Nécessite la clé API de ce fournisseur (aucune pour les fournisseurs sans clé comme Ollama). Lorsque le fournisseur renvoie des prix (par exemple OpenRouter), affiche également le coût en USD par million de jetons pour l'invite/la complétion, et marque les entrées au-delà de `expiration_date`.

**Options clés :** `-P` / `--provider`

**Voir aussi :** [Fournisseurs LLM](/fr/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**Synopsis :** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

Classe les modèles de chat du fournisseur actif et affiche les meilleurs (5 par défaut). Les colonnes du tableau sont, dans l'ordre : le rang, l'identifiant du modèle, l'index (score pondéré multiplié par 100, avec une décimale), le ChrF mesuré par languagebench, le score Arena mesuré, ainsi que le prix d'entrée et de sortie en USD pour 1 million de jetons. Une mesure manquante est indiquée par `—`. La commande nécessite la clé API du fournisseur (aucune pour les fournisseurs sans clé comme Ollama). Le fournisseur actif suit la configuration `provider` ; remplacez-la avec `-P` / `--provider`.

Les candidats proviennent de la liste `GET /models` du fournisseur. Les lignes expirées et les lignes hors chat (embeddings, parole, image, vidéo, modération, rerankers) sont exclues. Si cette requête de catalogue échoue, la commande se termine avec le code 1.

`--quality` est la valeur par défaut. Il pondère le ChrF et le score Arena au-dessus du prix. `--price` pondère le prix au-dessus de ces scores tout en conservant un seuil de qualité, afin qu'un modèle bon marché non mesuré ne se retrouve pas en tête de liste. Passer les deux drapeaux est une erreur. Ne passer aucun des deux privilégie la qualité. Les poids optionnels `modelSuggestion` dans la configuration remplacent l'un ou l'autre profil. Voir [Configuration](/fr/reference/configuration#modelsuggestion). Les mêmes poids sont utilisés par l'[onglet Modèles du tableau de bord](/fr/guide/translation-dashboard/models).

Le ChrF est la moyenne des lignes `translation_from` et `translation_to` de languagebench dont la métrique est `chrf`, limitée aux `sourceLocale` et `targetLocales` de ce projet. Les paramètres régionaux correspondent à un code de langue languagebench (le sous-tag principal, avec quelques alias tels que `pt-BR` vers `pt` et `zh-Hant` vers `zh` et `yue`). Un ensemble vide utilise `en`. Arena correspond au score Arena global de LMArena, et non au score Elo. Le prix de classement est de `(3 × input + output) / 4` USD pour 1 million de jetons. La source du prix est un tarif de catalogue non nul, puis les tarifs d'entrée et de sortie models.dev, puis le chiffre de coût unique de languagebench. Un prix de catalogue de `0` signifie non tarifé, et non gratuit. Un prix inconnu est neutre sur le profil de qualité et le pire sur le profil de prix. Un ChrF manquant est classé en dessous du seuil de qualité. Les valeurs de remplacement `0.35` et `0.45` utilisées pour un ChrF ou un score Arena manquant n'affectent que l'index ; le tableau affiche `—` à la place.

Les lignes qui dépassent le seuil apparaissent en premier, suivies par un index plus élevé, puis par un prix mixte moins cher. `--top` (par défaut `5`, un entier d'au moins 1) limite le tableau, le fragment `--json` et `--apply` ensemble, après les filtres ci-dessous.

`--list` affiche les mêmes colonnes pour les `translationModels` configurés du fournisseur actif, dans cet ordre, et ignore `--top`. La colonne de rang correspond toujours à la place de chaque modèle dans le classement complet. Un identifiant configuré manquant dans le catalogue, expiré ou qui n'est pas un modèle de chat est toujours listé, avec `—` pour les mesures. `--list` ne peut pas être combiné avec `--apply`.

`--max-output-price` conserve les modèles dont le prix de sortie par million de jetons est inférieur ou égal à ce montant en USD. Un modèle sans prix de sortie est exclu. `--min-delta` parcourt ensuite les lignes restantes et ne conserve un modèle que lorsque son index est inférieur d'au moins ce nombre de points au modèle conservé précédent. Le premier modèle restant est toujours conservé. Un delta de `0` ne supprime pas de lignes. Les lignes sans index sont exclues lorsque le delta est supérieur à `0`. Les numéros de rang restent ceux de la liste complète. Avec `--list`, le parcours suit l'ordre `translationModels`. Les deux filtres s'appliquent également à `--json` et `--apply`. L'[onglet Modèles](/fr/guide/translation-dashboard/models) dispose des deux mêmes contrôles.

`--json` écrit cet objet sur stdout (à coller dans le bloc fournisseur) et envoie le tableau ainsi que le pied de page d'attribution sur stderr :

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` remplace `providers.<active>.translationModels` par ces identifiants. `uiModels` et `localeModels` restent inchangés. Les scores ne sont pas écrits dans le fichier de configuration.

Les données de référence sont mises en cache dans `<cacheDir>/benchmark-scores.json` (généralement `.translation-cache/benchmark-scores.json`) pendant 7 jours. Les jeux de données bruts sont téléchargés lors de l'exécution et ne sont pas inclus dans le package. `--refresh` retélécharge languagebench, Arena et models.dev. Une source qui échoue pendant `--refresh` n'est pas remplie à partir du cache précédent. Sans `--refresh`, un téléchargement ayant échoué réutilise la tranche mise en cache. Si l'un des éléments languagebench ou Arena échoue, la commande effectue le classement avec l'autre et indique quelle source a échoué. Si les deux échouent, elle se termine avec le code 1. Une défaillance de models.dev conserve les prix du catalogue en place. Le tableau de bord ne dispose pas de contrôle d'actualisation ; exécutez `--refresh` depuis l'interface de ligne de commande (CLI), puis rechargez l'onglet Modèles.

Le pied de page attribue languagebench (CC BY-SA 4.0), l'Arena Score de LMArena (CC BY 4.0) et models.dev (MIT).

**Options clés :** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**Voir aussi :** [Fournisseurs LLM](/fr/guide/providers-and-models), [Onglet Modèles](/fr/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**Synopsis :** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Évalue chaque modèle configuré en traduisant un échantillon de manière isolée (client à modèle unique, pas de chaîne de secours). Affiche un tableau avec l'ID du modèle, les jetons d'entrée/sortie, le temps de traduction réel, et le coût en USD (`—` pour les fournisseurs qui ne signalent pas le coût), ainsi qu'une ligne de totaux et les échecs par modèle.

Les modèles sont par défaut l'union des ID `translationModels`, `uiModels` et `localeModels` du fournisseur actif (à remplacer par `--model`) ; l'échantillon est par défaut un bloc Markdown anglais intégré (à remplacer par `--text` / `--file`) ; la source/cible sont par défaut la configuration `sourceLocale` et la première locale cible `docs[]`, en revenant à la locale `targetLocales` de niveau supérieur (à remplacer par `--source` / `--target`). Exécute les modèles en parallèle, limité par la configuration `concurrency` (par défaut 4) ; chaque modèle est toujours chronométré individuellement. Nécessite la clé API du fournisseur actif.

**Options clés :** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**Synopsis :** `ai-i18n-tools list-languages [search]`

Liste le catalogue des langues d'interface utilisateur (`data/ui-languages-complete.json`) sous forme de tableau lisible (code, direction du texte, nom anglais, nom natif). Ne nécessite aucune configuration ni clé API. Passez un terme `search` facultatif pour ne conserver que les entrées dont le code, le nom natif, le nom anglais ou la direction le contiennent (insensible à la casse), par exemple `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
