# ai-i18n-tools

Outil CLI et programmatique pour l'internationalisation des applications et des sites de documentation JavaScript/TypeScript. Extrait les chaînes d'interface utilisateur, les traduit avec des LLM via OpenRouter, et génère des fichiers JSON prêts pour les locales pour i18next, ainsi que des pipelines pour markdown, Docusaurus JSON, et (via `translate-svg`) des actifs SVG autonomes.

<small>**Lire dans d'autres langues :** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## Deux flux de travail principaux

**Flux de travail 1 - Traduction de l'UI** (React, Next.js, Node.js, tout projet i18next)

Analyse les fichiers source pour les appels `t("…")`, construit un catalogue maître (`strings.json` avec des métadonnées **`models`** optionnelles par locale), traduit les entrées manquantes par locale via OpenRouter, et écrit des fichiers JSON plats (`de.json`, `pt-BR.json`, …) prêts pour i18next.

**Flux de travail 2 - Traduction de documents** (Markdown, Docusaurus JSON)

Traduit les `.md` et `.mdx` de chaque bloc `documentations` `contentPaths` et les fichiers d'étiquettes JSON de la `jsonSource` de ce bloc lorsque cela est activé. Prend en charge les mises en page de style Docusaurus et les mises en page plates suffixées par locale par bloc (`documentations[].markdownOutput`). Le répertoire racine partagé `cacheDir` contient le cache SQLite afin que seuls les segments nouveaux ou modifiés soient envoyés au LLM. **SVG :** utilisez `translate-svg` avec un bloc `svg` de niveau supérieur (également exécuté depuis `sync` lorsque `svg` est défini).

Les deux flux de travail partagent un seul fichier `ai-i18n-tools.config.json` et peuvent être utilisés indépendamment ou ensemble. La traduction SVG autonome est configurée via le bloc `svg` de niveau supérieur et s'exécute via `translate-svg` (ou l'étape SVG à l'intérieur de `sync`).

---

## Installation

Le package publié est **uniquement ESM** (`"type": "module"`). Utilisez `import` depuis Node.js, des bundlers, ou `import()` — **`require('ai-i18n-tools')` n'est pas pris en charge.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Définissez votre clé API OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Démarrage rapide

### Flux de travail 1 - Chaînes UI

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Connectez i18next dans votre application en utilisant les helpers de `'ai-i18n-tools/runtime'` :

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### Flux de travail 2 - Documentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### Les deux flux de travail

```bash
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
```

---

## Helpers d'exécution

Exportés de `'ai-i18n-tools/runtime'` - fonctionnent dans n'importe quel environnement JS, aucune importation i18next requise :

| Helper | Description |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Options d'initialisation standard i18next pour les configurations clé-comme-par-défaut. |
| `wrapI18nWithKeyTrim(i18n)` | Enveloppe `i18n.t` afin que les clés soient tronquées avant la recherche. |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fabrique pour le chargement asynchrone de fichiers de locale. |
| `getTextDirection(lng)` | Renvoie `'ltr'` ou `'rtl'` pour un code BCP-47. |
| `applyDirection(lng, element?)` | Définit l'attribut `dir` sur `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Étiquette d'affichage pour une ligne de menu de langue (avec i18n). |
| `getUILanguageLabelNative(lang)` | Étiquette d'affichage sans appeler `t()` (style en-tête). |
| `interpolateTemplate(str, vars)` | Substitution de bas niveau `{{var}}` sur une chaîne simple (utilisé en interne ; le code de l'application doit utiliser `t()` à la place). |
| `flipUiArrowsForRtl(text, isRtl)` | Retourne `→` à `←` pour les mises en page RTL. |

---

## Commandes CLI

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Toutes les commandes acceptent `-c <config>` (par défaut : `ai-i18n-tools.config.json`), `-v` (verbose), et l'optionnel `-w` / `--write-logs [path]` pour ajouter la sortie de la console à un fichier journal (par défaut : sous le répertoire de cache de traduction).

---

## Documentation

- [Commencer](docs/GETTING_STARTED.fr.md) - guide complet de configuration pour les deux flux de travail, tous les drapeaux CLI et référence des champs de configuration.
- [Aperçu du package](docs/PACKAGE_OVERVIEW.fr.md) - architecture, internes, API programmatique et points d'extension.
- [Contexte de l'agent IA](../docs/ai-i18n-tools-context.md) - contexte de projet concis pour les agents et les mainteneurs effectuant des modifications de code ou de configuration.

---

## Licence

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
