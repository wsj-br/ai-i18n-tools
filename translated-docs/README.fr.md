<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduisez votre application et votre documentation avec le modèle d'IA de votre choix — sans verrouillage, sans réécriture.**

CLI et boîte à outils pour l'internationalisation d'applications JavaScript/TypeScript, d'applications Python et de sites de documentation. Extrayez les chaînes `t()`, traduisez des pages Markdown, MDX et HTML, des bundles JSON et des étiquettes SVG — le tout à partir d'une seule configuration, avec des préréglages intégrés pour OpenAI, Anthropic, Gemini, OpenRouter, Ollama et toute API compatible avec OpenAI. Changez de fournisseur ou de modèle par projet ou par locale sans modifier votre base de code.

Fonctionne avec [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), le Markdown brut et le HTML brut. Les applications Python utilisent `t()` / `_()` ou GNU gettext (Streamlit, FastAPI, Flask, Django et boîtes à outils de bureau). Conserve vos catalogues [i18next](https://www.i18next.com/) existants (JSON d'espace de noms ou chaînes sources `t()`) et migre les projets [Intlayer](https://intlayer.org/) avec `migrate-intlayer`.

<a id="features"></a>
## Fonctionnalités

| | |
| --- | --- |
| **Chaînes d'interface utilisateur** | Extrayez `t("…")` / `_()` depuis JS/TS/Astro et Python, ou `data-i18n*` dans un fichier HTML → JSON plat par locale ou GNU gettext |
| **Documents** | Traduisez les pages Markdown, MDX, `.astro` et HTML (un fichier par locale) |
| **JSON** | Traduisez les bundles de locales imbriqués lorsque le contenu se trouve en dehors des appels `t()` |
| **SVG** | Traduisez les étiquettes SVG illustrées via `translate-svg` |
| **Cache intelligent** | Cache SQLite partagé — seuls les segments nouveaux ou modifiés atteignent le modèle |
| **Un seul `sync`** | Exécute l'extraction → UI → SVG → docs → JSON dans le bon ordre à partir d'une seule configuration |
| **Python** | Exécutable autonome sur chaque GitHub Release — le CLI s'exécute sans installation de Node.js |
| **Modèles classés** | `suggest-models` classe les modèles de chat du fournisseur actif et peut écrire `translationModels` |

<a id="which-pipeline"></a>
## Quel pipeline ?

| Votre contenu | Commande |
| --- | --- |
| La source utilise `t()` ou `_()` (JavaScript, TypeScript ou Python), gettext, ou un fichier HTML avec des marqueurs `data-i18n*` | **Chaînes d'interface utilisateur** — `extract` / `translate-ui` |
| Pages localisées, sites de documentation ou un fichier HTML par locale | **Documents** — `translate-docs` |
| Fichiers de paramètres régionaux JSON imbriqués autonomes | **JSON** — `translate-json` |
| Diagrammes ou illustrations avec libellés en SVG | **SVG** — `translate-svg` |

Consultez [Qu'est-ce que ai-i18n-tools ?](https://wsj-br.github.io/ai-i18n-tools/fr/guide/what-is-ai-i18n-tools) pour une comparaison complète.

<a id="install"></a>
## Installer

ESM uniquement. Nécessite Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Définissez une clé API pour le fournisseur que vous transmettez à `init` (Ollama n'en a pas besoin) :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configurez la commande `ai-i18n-tools` seule (direnv, PATH, scripts `package.json` ou `npx`) — consultez [Installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation).

<a id="python-no-nodejs"></a>
### Python, sans Node.js

Téléchargez l'asset correspondant depuis la [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases) : `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` ou `ai-i18n-tools-win-x64.exe`. Vérifiez `SHA256SUMS.txt`, exécutez `chmod +x` sur Unix et placez le fichier sur `PATH`. Les binaires ne sont pas notariés ni signés avec Authenticode. Les quatre exemples Python se trouvent dans le dépôt et dans `ai-i18n-tools-python-examples.zip` sur la release. Ils ne sont pas inclus dans le tarball npm ou l'exécutable. Étapes complètes : [Exécutables autonomes](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation#standalone-executables).

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

La liste issue de `init` est un point de départ. `suggest-models` classe les modèles de chat du fournisseur actif. `--apply` remplace `translationModels`. Le même classement se trouve sur l'onglet [Modèles](https://wsj-br.github.io/ai-i18n-tools/fr/guide/translation-dashboard/models). Référence des commandes : [suggest-models](https://wsj-br.github.io/ai-i18n-tools/fr/reference/cli-commands/models#suggest-models).

Autres modèles : `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, `docs-plain-html`, `ui-json-bundles`, `ui-python`, `ui-python-gettext`, `ui-python-django` ou `ui-python-flask`.

Préférez `sync` au chaînage de commandes de traduction individuelles. Procédure complète : [Démarrage rapide](https://wsj-br.github.io/ai-i18n-tools/fr/guide/quick-start). Python : [Ajouter l'i18n à une application Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-python).

<a id="documentation"></a>
## Documentation

- [Site de documentation](https://wsj-br.github.io/ai-i18n-tools/fr/) — guides, intégrations et référence
- [Installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation) · [Démarrage rapide](https://wsj-br.github.io/ai-i18n-tools/fr/guide/quick-start) · [Fournisseurs et modèles](https://wsj-br.github.io/ai-i18n-tools/fr/guide/providers-and-models)
- [Chaînes d'interface utilisateur](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/) · [HTML brut](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/python) · [Documents](https://wsj-br.github.io/ai-i18n-tools/fr/guide/documents/) · [Pages HTML](https://wsj-br.github.io/ai-i18n-tools/fr/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/fr/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/fr/guide/svg-translation/)
- [Intégrations](https://wsj-br.github.io/ai-i18n-tools/fr/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro et [Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/integrations/python)
- [Ajouter l'i18n à une application Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-python)
- [Référence CLI](https://wsj-br.github.io/ai-i18n-tools/fr/reference/cli-commands/) · [Configuration](https://wsj-br.github.io/ai-i18n-tools/fr/reference/configuration) · [Assistants d'exécution](https://wsj-br.github.io/ai-i18n-tools/fr/guide/runtime-helpers)
- [Exemples](https://wsj-br.github.io/ai-i18n-tools/fr/examples) — démos exécutables (`npx degit …`)
- [Contexte d'agent IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guide d'intégration pour les assistants dans les dépôts grand public

<a id="contributing"></a>
## Contribuer

Les problèmes et les requêtes de tirage sont les bienvenus. Flux de travail du mainteneur pour ce dépôt : [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) et [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## Licence

MIT — voir [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

Les noms de produits et les icônes appartiennent à leurs propriétaires respectifs et sont utilisés uniquement à des fins d'identification. Ce logiciel n'est ni affilié à ces marques, ni approuvé par celles-ci.

<small>

> **Remarque sur les traductions de l'interface utilisateur et de la documentation :** Toutes les langues de l'interface et de la documentation, à l'exception de l'anglais (Royaume-Uni), ont été traduites par IA à l'aide de ce package (ai-i18n-tools) ; la formulation peut être imprécise ou contenir des erreurs.

</small>
