<a id="programmatic-api"></a>
# API programmatique

Tous les types et classes publics sont exportés depuis la racine du package. Exemple : exécuter l'étape de traduction d'interface depuis Node.js sans l'interface en ligne de commande :

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Générer une configuration à partir de Node.js. Le quatrième argument est le préréglage intégré (`cwd` est le troisième). Un cinquième argument facultatif `{ withReadme: true }` ajoute le bloc de documentation README au format plat si le modèle ne contient pas déjà `README.md`, et indique si ce bloc a été ajouté :

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
```

Exportations clés (couramment utilisées — voir `src/index.ts` pour la surface publique complète) :

| Export | Description |
|---|---|
| `loadI18nConfigFromFile` | Charge, fusionne et valide la configuration à partir d'un fichier JSON. |
| `parseI18nConfig` | Valide un objet de configuration brut. |
| `TranslationCache` | Cache SQLite - instancier avec un chemin `cacheDir`. |
| `UIStringExtractor` | Extraire les chaînes `t("…")` depuis la source JS/TS. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Analyse / insère des marqueurs `data-i18n*` dans le HTML (alimente `extract` pour `.html` et la commande `mark-html`). |
| `MarkdownExtractor` | Extraire les segments traduisibles depuis le markdown. |
| `HtmlTemplateExtractor` | Extraire et réassembler les documents HTML simples (texte et attributs traduisibles ; `src` / `href` restent en place). |
| `JsonExtractor` | Extraire des fichiers d'étiquettes JSON Docusaurus (catalogues d'interface, pas le corps MDX). |
| `SvgExtractor` | Extraire depuis les fichiers SVG. |
| `LlmClient` | Effectuer des requêtes de traduction auprès du fournisseur LLM actif (`OpenRouterClient` est un alias obsolète). |
| `rankProviderModels` / `resolveSuggestionWeights` | Classe le catalogue de chat du fournisseur de rang un selon le profil de qualité ou de prix utilisé par `suggest-models`. N'imprime ni n'écrit la configuration. |
| `PlaceholderHandler` | Protéger et restaurer la syntaxe markdown autour de la traduction (balises HTML, encadrés, ancres, commentaires MDX/JSX/accolades, URL, code en ligne, emphase). |
| `protectMdx` / `restoreMdx` | Protéger et restaurer les commentaires MDX, les balises JSX, les expressions entre accolades et les attributs de chaîne JSX (appelé par `PlaceholderHandler` ; également exporté pour une utilisation directe). |
| `splitTranslatableIntoBatches` | Regrouper les segments en lots de taille adaptée aux LLM. |
| `validateTranslation` | Vérifications structurelles après la traduction (**asynchrone** — doit être attendue). |
| `resolveDocumentationOutputPath` | Résoudre le chemin du fichier de sortie pour un document traduit. |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer les glossaires de traduction, y compris les notes de `Context` de terme facultatives. |
| `loadTranslationContext` / `computeGuidanceFingerprint` | Charger les `glossary.contextFiles` et les directives d'empreinte pour l'invalidation du cache. |
| `runTranslateUI` | Point d'entrée programmatique pour l'interface de traduction. |
| `writeInitConfigFile` | Écrit un fichier JSON de configuration de démarrage (`template`, `cwd`, un `providerKey` requis, et un `{ withReadme }` facultatif). Renvoie `{ readmeBlockAdded, hasReadmeBlock }`. |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `translationModels` de démarrage par préréglage intégré utilisé par `init -P`. |
| `PROVIDER_PRESETS` | Mappage prédéfini du fournisseur intégré (`baseUrl`, `apiKeyEnv`). |

<a id="python-runtime-i18npy"></a>
## Environnement d'exécution Python (`i18n.py`)

`init -t ui-python`, `ui-python-gettext` et `ui-python-flask` écrivent ce module dans le projet lorsque `i18n.py` est manquant. Il s'agit d'un utilitaire de la bibliothèque standard pour Python 3.10 ou version ultérieure. Importez-le depuis ce fichier. Les fonctions ci-dessous sont distinctes des exports Node du tableau ci-dessus. Les projets Django conservent le gettext de Django, donc `ui-python-django` n'écrit pas `i18n.py`.

Formes d'appel, f-strings non sécurisées et configuration des paramètres régionaux par framework : [Applications Python](/fr/guide/ui-strings/python).

| Fonction | Comportement |
| --- | --- |
| `set_locale(locale)` | Définit les paramètres régionaux actuels. Les traits de soulignement dans le code sont stockés sous forme de traits d'union (`pt_BR` devient `pt-BR`). Renvoie un jeton `ContextVar`. |
| `reset_locale(token)` | Restaure les paramètres régionaux à partir de ce jeton. Appelez-la dans `finally`, y compris dans les middlewares FastAPI et Flask. |
| `get_locale()` | Renvoie les paramètres régionaux actuels. |
| `set_backend(backend)` | Sélectionne `"auto"`, `"json"` ou `"gettext"`. |
| `get_ui_languages()` | Lit `ui-languages.json` à côté du répertoire JSON plat, ou le répertoire gettext lorsque la sortie plate est désactivée. |
| `get_direction(locale=None)` | Renvoie `"rtl"` ou `"ltr"` à partir de la ligne du manifeste pour ces paramètres régionaux (paramètres régionaux actuels si omis). |
| `_(message)` | Recherche un littéral, puis renvoie la chaîne du catalogue ou le message lui-même. |
| `t(template, *, plurals=False, count=None, **values)` | Recherche le littéral, puis effectue l'interpolation. `translate` est la même fonction. Sur Python 3.14, `translate(t"Hello, {name}!")` conserve le modèle et ses valeurs. Les arguments nommés remplacent les valeurs extraites d'une chaîne de modèle. |
| `ngettext(singular, plural, n, **values)` | Recherche au pluriel, puis effectue l'interpolation. `count` est disponible pour la chaîne de formatage. |
| `pgettext(context, message, **values)` | Recherche de contexte (`msgctxt`, ou `context` + U+0004 + la chaîne de caractères en langue source au format JSON plat), puis interpoler. |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Zone de sélection Streamlit. Écrit `st.session_state.locale` et `st.query_params["lang"]`, appelle `set_locale` et renvoie le code choisi. |
