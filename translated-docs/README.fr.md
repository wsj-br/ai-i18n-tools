<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduisez votre application et votre documentation avec le modèle d'IA de votre choix — sans verrouillage, sans réécriture.**

CLI et boîte à outils pour l'internationalisation des applications JavaScript/TypeScript et des sites de documentation (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, Markdown/MDX simple). Utilisez les préréglages intégrés pour OpenAI, Anthropic, Gemini, OpenRouter, Ollama, et plus encore — ou toute API compatible OpenAI. Changez de fournisseur ou de modèle par projet ou par locale sans modifier votre base de code.

## Fonctionnalités

| | |
| --- | --- |
| **Chaînes d'interface utilisateur** | Extrayez `t("…")` de JS/TS/Astro (et `data-i18n*` en HTML) → JSON plat par locale |
| **Documents** | Traduisez les pages Markdown, MDX et `.astro` pour les principaux frameworks de documentation |
| **JSON** | Traduisez les bundles de locales imbriqués lorsque le contenu se trouve en dehors des appels `t()` |
| **SVG** | Traduisez les étiquettes SVG illustrées via `translate-svg` |
| **Cache intelligent** | Cache SQLite partagé — seuls les segments nouveaux ou modifiés atteignent le modèle |
| **Un seul `sync`** | Exécute l'extraction → UI → SVG → docs → JSON dans le bon ordre à partir d'une seule configuration |

## Quel pipeline ?

| Votre contenu | Commande |
| --- | --- |
| La source utilise `t()` ou des marqueurs HTML | **Chaînes d'interface utilisateur** — `extract` / `translate-ui` |
| Pages localisées ou sites de documentation | **Documents** — `translate-docs` |
| Fichiers de paramètres régionaux JSON imbriqués autonomes | **JSON** — `translate-json` |

Voir [Qu'est-ce que ai-i18n-tools ?](../docs/guide/what-is-ai-i18n-tools.md) pour une comparaison complète.

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

Configurez la commande `ai-i18n-tools` de base (direnv, PATH, scripts `package.json`, ou `npx`) — voir [Installation](../docs/guide/installation.md).

## Démarrage rapide

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Scaffolds orientés documentation : `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, ou `ui-json-bundles`.

Préférez `sync` à l'enchaînement des commandes de traduction individuelles. Procédure complète : [Démarrage rapide](../docs/guide/quick-start.md).

## Documentation

- [Site de documentation](https://wsj-br.github.io/ai-i18n-tools/) — guides, intégrations et référence
- [Installation](../docs/guide/installation.md) · [Démarrage rapide](../docs/guide/quick-start.md) · [Fournisseurs et modèles](../docs/guide/providers-and-models.md)
- [Chaînes d'interface utilisateur](../docs/guide/ui-strings/) · [Documents](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [Intégrations](../docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [Référence CLI](../docs/reference/cli-commands/) · [Configuration](../docs/reference/configuration.md) · [Aides d'exécution](../docs/guide/runtime-helpers.md)
- [Exemples](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — démos exécutables (`npx degit …`)
- [Contexte de l'agent IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — guide d'intégration pour les assistants dans les dépôts clients

## Contribuer

Les problèmes et les requêtes de tirage sont les bienvenus. Flux de travail du mainteneur pour ce dépôt : [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) et [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

## Licence

MIT — voir [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.
