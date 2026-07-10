<a id="cli--models--catalog"></a>
# CLI — Modèles et catalogue

<a id="check-models"></a>
### `check-models`

**Synopsis :** `ai-i18n-tools check-models`

Valide chaque ID de modèle configuré par rapport à la liste `GET /models` du fournisseur actif (appartenance et `expiration_date`). Nécessite la clé API de ce fournisseur (aucune pour les fournisseurs sans clé comme Ollama). Quitte avec un code d'erreur non nul si un ID configuré est manquant ou expiré, et respecte le `requestTimeoutMs` du fournisseur. Lorsque le fournisseur renvoie des prix (par exemple OpenRouter), affiche également le coût en USD par million de jetons pour l'invite/la complétion.

**Voir aussi :** [Fournisseurs LLM](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Synopsis :** `ai-i18n-tools list-models`

Liste tous les modèles annoncés par le fournisseur actif via sa liste `GET /models` (triés par ID ; le fournisseur actif suit la clé de configuration `provider`, à remplacer par `-P` / `--provider`). Nécessite la clé API de ce fournisseur (aucune pour les fournisseurs sans clé comme Ollama). Lorsque le fournisseur renvoie des prix (par exemple OpenRouter), affiche également le coût en USD par million de jetons pour l'invite/la complétion, et marque les entrées au-delà de `expiration_date`.

**Options clés :** `-P` / `--provider`

**Voir aussi :** [Fournisseurs LLM](/guide/providers-and-models)

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
