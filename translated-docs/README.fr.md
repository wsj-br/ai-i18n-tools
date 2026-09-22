<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduisez votre application et votre documentation avec le modèle d'IA de votre choix — sans verrouillage, sans réécriture.**

CLI et boîte à outils pour internationaliser les applications JavaScript/TypeScript et les sites de documentation. Extrayez les chaînes `t()`, traduisez les pages Markdown/MDX, les bundles JSON et les libellés SVG — le tout depuis une configuration unique, avec des préréglages intégrés pour OpenAI, Anthropic, Gemini, OpenRouter, Ollama et toute API compatible OpenAI. Changez de fournisseur ou de modèle par projet ou par locale sans modifier votre base de code.

Fonctionne avec [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/) et le [Markdown](https://commonmark.org/) standard. Conserve vos catalogues [i18next](https://www.i18next.com/) existants (JSON d'espaces de noms ou chaînes source `t()`) et migre les projets [Intlayer](https://intlayer.org/) avec `migrate-intlayer`.

<a id="features"></a>
## Fonctionnalités

| | |
| --- | --- |
| **Chaînes d'interface utilisateur** | Extrayez `t("…")` de JS/TS/Astro (et `data-i18n*` en HTML) → JSON plat par locale |
| **Documents** | Traduisez les pages Markdown, MDX et `.astro` pour les principaux frameworks de documentation |
| **JSON** | Traduisez les bundles de locales imbriqués lorsque le contenu se trouve en dehors des appels `t()` |
| **SVG** | Traduisez les étiquettes SVG illustrées via `translate-svg` |
| **Cache intelligent** | Cache SQLite partagé — seuls les segments nouveaux ou modifiés atteignent le modèle |
| **Un seul `sync`** | Exécute l'extraction → UI → SVG → docs → JSON dans le bon ordre à partir d'une seule configuration |

<a id="which-pipeline"></a>
## Quel pipeline ?

| Votre contenu | Commande |
| --- | --- |
| La source utilise `t()` ou des marqueurs HTML | **Chaînes d'interface utilisateur** — `extract` / `translate-ui` |
| Pages localisées ou sites de documentation | **Documents** — `translate-docs` |
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

Définissez une clé API pour votre fournisseur (par défaut, `init` utilise OpenRouter ; Ollama n'en a pas besoin) :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Configurez la commande `ai-i18n-tools` seule (direnv, PATH, scripts `package.json` ou `npx`) — consultez [Installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation).

<a id="quick-start"></a>
## Démarrage rapide

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Scaffolds orientés documentation : `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, ou `ui-json-bundles`.

Privilégiez `sync` plutôt que de chaîner des commandes de traduction individuelles. Guide complet : [Démarrage rapide](https://wsj-br.github.io/ai-i18n-tools/fr/guide/quick-start).

<a id="documentation"></a>
## Documentation

- [Site de documentation](https://wsj-br.github.io/ai-i18n-tools/fr/) — guides, intégrations et référence
- [Installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation) · [Démarrage rapide](https://wsj-br.github.io/ai-i18n-tools/fr/guide/quick-start) · [Fournisseurs et modèles](https://wsj-br.github.io/ai-i18n-tools/fr/guide/providers-and-models)
- [Chaînes d'interface utilisateur](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/) · [Documents](https://wsj-br.github.io/ai-i18n-tools/fr/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/fr/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/fr/guide/svg-translation/)
- [Intégrations](https://wsj-br.github.io/ai-i18n-tools/fr/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [Référence de la CLI](https://wsj-br.github.io/ai-i18n-tools/fr/reference/cli-commands/) · [Configuration](https://wsj-br.github.io/ai-i18n-tools/fr/reference/configuration) · [Utilitaires d'exécution](https://wsj-br.github.io/ai-i18n-tools/fr/guide/runtime-helpers)
- [Exemples](https://wsj-br.github.io/ai-i18n-tools/fr/examples) — démos exécutables (`npx degit …`)
- [Contexte de l'agent IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guide d'intégration pour les assistants dans les dépôts consommateurs

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
