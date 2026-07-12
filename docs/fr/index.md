---
layout: home
title: ai-i18n-tools
description: >-
  CLI et boîte à outils pour l'internationalisation d'applications et de sites
  de documentation JavaScript/TypeScript à l'aide de LLM.
hero:
  name: ai-i18n-tools
  text: Traduisez des applications et des documents avec n'importe quel LLM
  tagline: >-
    Un fichier de configuration, trois modes de traduction et le fournisseur de
    votre choix — OpenAI, Anthropic, Gemini, OpenRouter, Ollama ou toute API
    compatible OpenAI. Changez de modèle par projet ou par locale sans réécrire
    votre code.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: Logo ai-i18n-tools
  actions:
    - theme: brand
      text: Démarrer
      link: /fr/guide/quick-start
    - theme: alt
      text: Voir sur GitHub
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: Paquet npm
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: Interface utilisateur
    details: >-
      Extrayez les appels t() de JS, TS et Astro. Générez du JSON plat par
      locale pour i18next ou une recherche SSG statique.
  - icon: 📄
    title: Documents
    details: >-
      Traduisez les pages Markdown, MDX et Astro pour VitePress, Starlight,
      Docusaurus, Nextra, Fumadocs et les sites statiques simples.
  - icon: 📦
    title: Bundles JSON
    details: >-
      JSON de locale imbriqué lorsque le texte de l'interface utilisateur se
      trouve en dehors des appels t() source — étiquettes de thème, catalogues
      et remplacements d'application.
  - icon: 🔄
    title: Mise en cache intelligente
    details: >-
      Cache SQLite partagé sur chaque pipeline. Seuls les segments nouveaux ou
      modifiés sont envoyés au modèle lors des réexécutions.
  - icon: 🔌
    title: Indépendant du fournisseur
    details: >-
      Préréglages intégrés pour les principales API LLM, plus des points de
      terminaison personnalisés compatibles OpenAI. Remplacez le fournisseur
      actif avec -P.
  - icon: ⚡
    title: Une seule commande de synchronisation
    details: >-
      Exécutez extract, translate-ui, translate-svg, translate-docs et
      translate-json dans le bon ordre à partir d'une seule configuration.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Installation rapide

Le package publié est **ESM uniquement**. Node.js `>=22.16.0` est requis.

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

Consultez [Installation](/fr/guide/installation) pour [configurer la commande CLI de base](/fr/guide/installation#using-the-cli) (y compris le [développement de monorepo cloné](/fr/guide/installation#cloned-monorepo)) et [Démarrage rapide](/fr/guide/quick-start) pour les modèles de scaffolding.

<a id="which-pipeline-should-i-use"></a>
## Quel pipeline dois-je utiliser ?

| Votre contenu | Commande |
| --- | --- |
| Le code source utilise `t()` | **Chaînes d'interface utilisateur** — `extract` / `translate-ui` |
| Pages localisées ou sites de documentation | **Documents** — `translate-docs` |
| Fichiers de paramètres régionaux JSON imbriqués autonomes | **JSON** — `translate-json` |

Les illustrations SVG utilisent un chemin `translate-svg` distinct — pas `docs[].contentPaths`. Voir [Qu'est-ce que ai-i18n-tools ?](/fr/guide/what-is-ai-i18n-tools) pour une comparaison complète.

<a id="explore-the-documentation"></a>
## Explorer la documentation

- [**Guide**](/fr/guide/what-is-ai-i18n-tools) — modes de traduction, installation, démarrage rapide et intégrations de frameworks
- [**Intégrations**](/fr/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus et Astro
- [**Fournisseurs et modèles**](/fr/guide/providers-and-models) — préréglages, chaînes de secours et remplacements `-P`
- [**Référence CLI**](/fr/reference/cli-commands/) — chaque commande, indicateur et flux de travail
- [**Configuration**](/fr/reference/configuration) — schéma `ai-i18n-tools.config.json` complet
- [**Exemples**](/fr/examples) — neuf projets de démonstration exécutables avec `npx degit`
- [**Architecture**](/fr/reference/architecture) — composants internes, API programmatique et points d'extension

Pour le guide complet de style npm (tableau des fournisseurs, liste des commandes CLI, démarrages rapides des frameworks), consultez le [README du dépôt](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md). Vous intégrez le package dans votre propre projet ? Commencez par [Contexte de l'agent IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md).
