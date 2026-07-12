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

Échafauder une configuration à partir de Node.js (le quatrième argument facultatif sélectionne le préréglage intégré ; la valeur par défaut est `openrouter`) :

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
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
| `JsonExtractor` | Extraire des fichiers d'étiquettes JSON Docusaurus (catalogues d'interface, pas le corps MDX). |
| `SvgExtractor` | Extraire depuis les fichiers SVG. |
| `LlmClient` | Effectuer des requêtes de traduction auprès du fournisseur LLM actif (`OpenRouterClient` est un alias obsolète). |
| `PlaceholderHandler` | Protéger et restaurer la syntaxe markdown autour de la traduction (balises HTML, encadrés, ancres, commentaires MDX/JSX/accolades, URL, code en ligne, emphase). |
| `protectMdx` / `restoreMdx` | Protéger et restaurer les commentaires MDX, les balises JSX, les expressions entre accolades et les attributs de chaîne JSX (appelé par `PlaceholderHandler` ; également exporté pour une utilisation directe). |
| `splitTranslatableIntoBatches` | Regrouper les segments en lots de taille adaptée aux LLM. |
| `validateTranslation` | Vérifications structurelles après la traduction (**asynchrone** — doit être attendue). |
| `resolveDocumentationOutputPath` | Résoudre le chemin du fichier de sortie pour un document traduit. |
| `Glossary` / `GlossaryMatcher` | Charger et appliquer les glossaires de traduction. |
| `runTranslateUI` | Point d'entrée programmatique pour l'interface de traduction. |
| `writeInitConfigFile` | Écrit un JSON de configuration de démarrage (`template`, `providerKey` facultatif avec une valeur par défaut de `openrouter`). |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `translationModels` de démarrage par préréglage intégré utilisé par `init -P`. |
| `PROVIDER_PRESETS` | Mappage prédéfini du fournisseur intégré (`baseUrl`, `apiKeyEnv`). |
