---
layout: home
title: ai-i18n-tools
description: >-
  CLI et boîte à outils pour internationaliser les applications
  JavaScript/TypeScript, les applications Python et les sites de documentation
  avec le fournisseur LLM de votre choix.
hero:
  name: ai-i18n-tools
  text: Traduisez des applications et des documents avec n'importe quel LLM
  tagline: >-
    Extrayez les chaînes t() de JavaScript, TypeScript et Python. Traduisez des
    pages Markdown, MDX, HTML, des bundles JSON et des étiquettes SVG — le tout
    à partir d'une seule configuration, avec OpenAI, Anthropic, Gemini,
    OpenRouter, Ollama ou toute API compatible OpenAI. Changez de modèle par
    projet ou par locale sans réécrire votre base de code.
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
      Extrayez t() et _() de JavaScript, TypeScript, Astro et Python, ou les
      marqueurs data-i18n dans un fichier HTML. JSON plat par locale ou
      catalogues GNU gettext.
  - icon: 📄
    title: Documents
    details: >-
      Traduisez les pages Markdown, MDX, Astro et HTML pour VitePress,
      Starlight, Docusaurus, Nextra, Fumadocs et les sites statiques simples.
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
  - icon: 🐍
    title: Python, sans Node.js
    details: >-
      Un exécutable autonome sur chaque GitHub Release exécute la CLI pour les
      applications Python. Streamlit, FastAPI, Flask, Django et gettext inclus.
  - icon: 📊
    title: Liste des modèles classés
    details: >-
      suggest-models classe les modèles de chat du fournisseur actif et peut
      écrire translationModels. Le même classement se trouve sur l'onglet
      Modèles du tableau de bord.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Installation rapide

Le package publié est **ESM uniquement**. Node.js `>=22.16.0` est requis.

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` classe les modèles du fournisseur actif. Ajoutez `--apply` pour remplacer la liste `translationModels` générée. Consultez le [Démarrage rapide](/fr/guide/quick-start) et l'onglet [Modèles](/fr/guide/translation-dashboard/models).

<a id="python-no-nodejs"></a>
### Python, sans Node.js

Téléchargez le fichier correspondant depuis la [publication GitHub](https://github.com/wsj-br/ai-i18n-tools/releases) : `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64`, ou `ai-i18n-tools-win-x64.exe`. Vérifiez `SHA256SUMS.txt`, exécutez `chmod +x` sur Unix, et placez le fichier sur `PATH`. Les binaires ne sont pas signés. Étapes : [Exécutables autonomes](/fr/guide/installation#standalone-executables). Ensuite `ai-i18n-tools init -t ui-python -P cheaperinference`. Procédure pas à pas : [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).

Consultez [Installation](/fr/guide/installation) pour [configurer la commande CLI de base](/fr/guide/installation#using-the-cli) (y compris le [développement de monorepo cloné](/fr/guide/installation#cloned-monorepo)) et [Démarrage rapide](/fr/guide/quick-start) pour les modèles de scaffolding.

<a id="which-pipeline-should-i-use"></a>
## Quel pipeline dois-je utiliser ?

| Votre contenu | Commande |
| --- | --- |
| Le code source utilise `t()` ou `_()` (JavaScript, TypeScript ou Python), gettext, ou un fichier HTML avec des marqueurs | **Chaînes d'interface utilisateur** — `extract` / `translate-ui` |
| Pages localisées, sites de documentation ou un fichier HTML par locale | **Documents** — `translate-docs` |
| Fichiers de paramètres régionaux JSON imbriqués autonomes | **JSON** — `translate-json` |

Les illustrations SVG utilisent un chemin `translate-svg` distinct — pas `docs[].contentPaths`. Voir [Qu'est-ce que ai-i18n-tools ?](/fr/guide/what-is-ai-i18n-tools) pour une comparaison complète.

<a id="explore-the-documentation"></a>
## Explorer la documentation

- [**Guide**](/fr/guide/what-is-ai-i18n-tools) — modes de traduction, installation, démarrage rapide et intégrations de framework
- [**Intégrations**](/fr/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro et Python
- [**Fournisseurs et modèles**](/fr/guide/providers-and-models) — préréglages, chaînes de secours, suggestions classées (`suggest-models`) et remplacements `-P`
- [**Référence de la CLI**](/fr/reference/cli-commands/) — chaque commande, indicateur et flux de travail
- [**Configuration**](/fr/reference/configuration) — schéma complet `ai-i18n-tools.config.json`
- [**Exemples**](/fr/examples) — dix-sept projets de démonstration exécutables (`npx degit` ou le zip des exemples Python)
- [**Architecture**](/fr/reference/architecture) — fonctionnement interne, API programmatique et points d'extension

Vous intégrez le package dans votre propre projet ? Commencez par [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). Le [fichier README du dépôt](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) est une courte page de destination GitHub/npm qui renvoie ici pour plus de détails.

<br/>
<br/>

::: tip Avertissement
Les noms de produits et les icônes appartiennent à leurs propriétaires respectifs et sont utilisés uniquement à des fins d'identification. Ce logiciel n'est ni affilié à ces marques ni approuvé par elles.

Toutes les langues de l'interface et de la documentation, à l'exception de l'anglais (Royaume-Uni), ont été traduites par intelligence artificielle à l'aide de ce package (ai-i18n-tools) ; la formulation peut être imprécise ou contenir des erreurs.
:::

<br/>
