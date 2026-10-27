<a id="ui-strings"></a>
# Chaînes d'interface utilisateur

Référence pour `extract` et `translate-ui`, le pipeline qui transforme les appels `t()` en catalogues par locale. Vous ajoutez l'i18n à une application pour la première fois ? Commencez par [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Ils couvrent l'étape d'encapsulation, puis vous renvoient ici pour les étapes 2 à 4.

Ce pipeline prend en charge les projets JS/TS (composants client et serveur React, Next.js, services Node.js, HTML simple, sites web Astro et outils CLI) et les applications Python. JS/TS recherche les chaînes avec i18next après que la source appelle `t()`. Python appelle `t()` ou gettext via un `i18n.py` généré (Django conserve le gettext de Django).

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre application | Lire ensuite |
| --- | --- |
| JS/TS avec des chaînes de caractères codées en dur, pas encore de `t()` | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) |
| React / Next.js / Node, `t()` déjà dans le code source | [Connecter i18next](/fr/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Applications Python](/fr/guide/ui-strings/python). Initialisation : `ui-python`, `ui-python-gettext`, `ui-python-flask` ou `ui-python-django`. Assistant : `i18n.py`. Pour ajouter des locales à une application existante, consultez [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). |
| HTML simple (pas de `t()` dans le balisage) | [Applications HTML simples](/fr/guide/ui-strings/plain-html) |
| Site marketing Astro (hybride) | [Site web Astro](/fr/guide/ui-strings/astro-website) |
| Règles `t()`, interpolation, pluriels | [Appels t() et pluriels](/fr/guide/ui-strings/t-calls-and-plurals) |
| Sélecteur de langue / RTL | [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher) |
| Signatures d'API d'exécution | [Aides d'exécution](/fr/guide/runtime-helpers) |
| Dictionnaires Intlayer `.content.ts`, migration d'Intlayer | [Migration depuis Intlayer](/fr/guide/migrating-from-intlayer) |
| Dictionnaires Intlayer `.content.ts`, conserver Intlayer | [Traduire Intlayer sur place](/fr/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## Étape 1 : Initialiser

```bash
ai-i18n-tools init -P openrouter
```

Ceci écrit `ai-i18n-tools.config.json` avec le modèle `ui-markdown` (y compris le bloc `provider` / `providers` pour ce préréglage). Ce modèle active également la traduction de documents pour `README.md`, écrits sous forme de fichiers plats sous `translated-docs/`. Les dépôts contenant uniquement un README utilisent `init -t docs-markdown` à la place. Voir [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme). Avant d'exécuter `translate-ui` ou `sync`, définissez la clé API de ce fournisseur dans l'environnement ou `.env` — sauf Ollama ; voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key). Quatre clés sont importantes pour les chaînes d'interface utilisateur :

- `sourceLocale` : le code BCP-47 de la langue dans laquelle votre texte source est écrit. Toute langue est valide ; `"en-GB"` n'est qu'un exemple. Il doit correspondre à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n d'exécution (`src/i18n.ts` / `src/i18n.js`). La chaîne à l'intérieur de `t()` est cette langue source, et les fichiers de locale plats l'utilisent comme clé.
- `targetLocales` : codes BCP-47 pour vos langues cibles (par exemple `["de", "fr", "pt-BR"]`). Exécutez `generate-ui-languages` pour créer le manifeste `ui-languages.json` à partir de cette liste.
- `ui.sourceRoots` : répertoires ou motifs glob à analyser pour les appels `t("…")` (par exemple `["src/"]`).
- `ui.stringsJson` et `ui.flatOutputDir` : où le catalogue maître et les fichiers par locale (`de.json`, `pt-BR.json`) sont écrits.

Toutes les autres clés, y compris `providers.<active>.uiModels`, se trouvent dans [Configuration](/fr/reference/configuration).

<a id="step-2-extract-strings"></a>
## Étape 2 : Extraire les chaînes

`extract` ne fait rien d'utile tant que ces appels `t()` / `i18n.t()` n'existent pas. Encapsulez d'abord le texte codé en dur : [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js).

```bash
ai-i18n-tools extract
```

Analyse les fichiers sous `ui.sourceRoots` pour les appels `t("literal")` et `i18n.t("literal")`. Écrit (ou fusionne dans) `ui.stringsJson`.

Le scanner est configurable : ajoutez des noms de fonctions personnalisés via `ui.uiExtractor.funcNames` (ou l'ancien `ui.reactExtractor.funcNames`). Pour les pages et composants Astro, ajoutez `.astro` à `ui.uiExtractor.extensions`. Pour le HTML simple, voir [Applications HTML simples](/fr/guide/ui-strings/plain-html).

<a id="what-extract-scans"></a>
### Qu'est-ce que les scans d'extraction

- Les extensions par défaut sont uniquement `.js`, `.jsx`, `.ts` et `.tsx`. `.mjs`, `.cjs`, `.mts` et `.cts` ne sont incluses que si vous les ajoutez à `ui.uiExtractor.extensions`.
- Une clé non littérale telle que `t(variable)` ou un littéral de gabarit est ignorée sans avertissement.
- `package.json` `description` est inclus par défaut (`ui.uiExtractor.includePackageDescription`).
- Les composants monofichiers Vue et Svelte ne sont pas pris en charge. L'ajout de `.vue` ou `.svelte` à `extensions` n'extrait pas le texte du modèle. Il n'y a pas d'analyseur SFC.

<a id="step-3-translate-ui-strings"></a>
## Étape 3 : Traduire les chaînes de l'interface utilisateur

```bash
ai-i18n-tools translate-ui
```

Lit `strings.json`, envoie des lots aux modèles sur le fournisseur LLM actif pour chaque locale cible et écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`. La sélection du modèle utilise la chaîne d'interface utilisateur : `localeModels(locale)` → `uiModels` → `translationModels` (voir [Modèles d'IA](/fr/guide/ai-models#model-fallback-chain)). Au sein d'une locale, jusqu'à `uiBatchConcurrency` lots s'exécutent en même temps (valeur par défaut : **2** ; voir [Configuration — uiBatchConcurrency](/fr/reference/configuration#uibatchconcurrency-optional)). `-j` ne parallélise toujours que les locales cibles.

<a id="translations-database-stringsjson"></a>
### Base de données des traductions (`strings.json`)

Pour chaque entrée, `translate-ui` stocke l'**ID du modèle du fournisseur actif** qui a traduit avec succès chaque locale dans un objet `models` facultatif (mêmes clés de locale que `translated`). Les chaînes éditées dans le tableau de bord de traduction sont marquées avec la valeur sentinelle `user-edited` dans `models` pour cette locale. Les fichiers plats par locale sous `ui.flatOutputDir` restent uniquement **chaîne source → traduction** ; ils n'incluent pas `models` (ainsi les bundles d'exécution restent inchangés).

> **Remarque :** Les modifications du tableau de bord apportées aux chaînes d'interface utilisateur se trouvent dans `strings.json`, et non dans le cache de documentation SQLite. Exécutez `sync` ou `translate-ui` (sans indicateur spécial) pour réécrire les fichiers de locale plats à partir du catalogue — `--force-update` n'est **pas** transmis à l'étape de l'interface utilisateur. Évitez `--force` sur les commandes d'interface utilisateur après des modifications manuelles : cela retraduit chaque entrée et peut écraser vos lignes `user-edited`. Les lignes de catalogue dont la traduction stockée échoue à la vérification du système d'écriture de la locale (par exemple, l'hindi romanisé pour `hi`) sont traitées comme manquantes et retraduites sans `--force`.

<a id="step-4-use-the-output-in-your-app"></a>
## Étape 4 : Utiliser la sortie dans votre application

`translate-ui` écrit uniquement des fichiers. L'application doit les charger.

- JS/TS : connecter i18next avec les assistants d'exécution, charger le fichier de locale choisi par l'utilisateur et ajouter un sélecteur de langue. Voir [Connecter i18next](/fr/guide/ui-strings/i18next-runtime) et [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher).
- Python : utiliser le `i18n.py` généré ou vos catalogues gettext. Voir [Applications Python](/fr/guide/ui-strings/python).
- HTML simple : charger le script d'exécution à côté de la page. Voir [Applications HTML simples](/fr/guide/ui-strings/plain-html).
- Astro : voir [Site web Astro](/fr/guide/ui-strings/astro-website).

<a id="optional"></a>
## Facultatif

<a id="per-locale-model-overrides"></a>
### Substitutions de modèle par locale

Certains modèles traduisent mieux certaines langues que d'autres. Par exemple, les modèles qwen et z-ai ont tendance à bien fonctionner avec les langues asiatiques. Ajoutez des entrées `providers.<active>.localeModels` pour fournir une liste de modèles prioritaire pour chaque locale BCP-47. Ces listes sont essayées avant `uiModels` et `translationModels` pour cette locale. Les balises de locale correspondent sans distinction de casse (`zh-cn` et `ZH-CN` sont équivalentes). S'il n'y a pas d'entrée correspondante, l'outil utilise l'ordre par défaut de `uiModels` et `translationModels`. Le même mécanisme de `localeModels` s'applique à la traduction de documents, JSON et SVG.

<a id="exporting-to-xliff-20"></a>
### Exportation vers XLIFF 2.0

Pour transmettre les chaînes d'interface à un prestataire de traduction, un système de gestion de la traduction (TMS) ou un outil CAT, exportez le catalogue au format **XLIFF 2.0** (un fichier par langue cible). Cette commande est **en lecture seule** : elle ne modifie pas `strings.json` ni n'appelle aucune API.

```bash
ai-i18n-tools export-ui-xliff
```

Par défaut, les fichiers sont écrits à côté de `ui.stringsJson`, avec des noms comme `strings.de.xliff`, `strings.pt-BR.xliff` (nom de base de votre catalogue + langue + `.xliff`). Utilisez `-o` / `--output-dir` pour écrire ailleurs. Les traductions existantes provenant de `strings.json` apparaissent dans `<target>` ; les langues manquantes utilisent `state="initial"` sans `<target>`, afin que les outils puissent les compléter. Utilisez `--untranslated-only` pour n'exporter que les unités nécessitant encore une traduction pour chaque langue (pratique pour les lots envoyés aux prestataires). `--dry-run` affiche les chemins sans écrire les fichiers.
