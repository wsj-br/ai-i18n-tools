---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  Rendez votre application, site web ou documentation de dépôt monolingue
  multilingue grâce à une configuration guidée, une traduction par IA et des
  réexécutions mises en cache. Commencez avec JavaScript, TypeScript, Python ou
  un fichier README.
hero:
  name: ai-i18n-tools
  text: Rendez votre projet monolingue multilingue.
  tagline: >-
    Ajoutez des langues à votre application, site web ou documentation de dépôt
    avec une configuration guidée et la traduction par IA. Choisissez votre
    fournisseur et vos modèles, et réutilisez les traductions mises en cache au
    fur et à mesure que votre projet se développe.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: Logo ai-i18n-tools
  actions:
    - theme: brand
      text: Choisissez votre projet
      link: '#start-here'
    - theme: alt
      text: Explorer les exemples
      link: /fr/examples
---



<a id="start-here"></a>
## Commencez avec votre projet existant

Un seul langage aujourd'hui ? Commencez ici. Ce langage peut être n'importe quel langage : définissez-le comme `sourceLocale`. L'anglais est un exemple courant dans ces guides. L'internationalisation (i18n) prépare votre projet à prendre en charge différentes langues ; ces guides vous mènent de la configuration à votre première expérience traduite, y compris le fichier README que votre dépôt affiche déjà sur GitHub, GitLab ou tout autre hébergeur.

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Application JavaScript ou TypeScript

Transformez les boutons, étiquettes et messages en texte brut en une interface utilisateur multilingue. Configurez votre environnement d'exécution, marquez le texte à traduire et activez le changement de langue. Inclut des invites d'agent de codage pour l'étape de préparation.

React · Next.js · Node.js · CLI

[Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Application Python

Enveloppez le texte destiné à l'utilisateur et chargez les messages traduits avec un assistant généré, ou conservez gettext natif. Exécutez la CLI de traduction à partir d'un exécutable autonome sans installation Node.js séparée.

Streamlit · FastAPI · Flask · Django · CLI

[Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Site web ou documentation

Publiez des pages localisées et connectez-les aux routes linguistiques de votre site. Suivez les étapes spécifiques au framework pour la navigation, les étiquettes de thème et le menu de langue.

VitePress · Starlight · Docusaurus · Astro

[Ajouter l'i18n à un site web ou de documentation](/fr/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Fichier README et documentation du dépôt

Traduisez `README.md` et les autres fichiers Markdown en un fichier par langue, avec une rangée de liens entre eux. Associez-le aux chaînes d'interface utilisateur de votre application, ou traduisez le README seul.

GitHub · GitLab · Bitbucket

[Ajouter l'i18n à vos fichiers README et documents Markdown](/fr/guide/add-i18n-to-readme)

</article>
</div>

Vous ne savez pas quel chemin choisir ? [Ajouter l'i18n à votre projet](/fr/guide/add-i18n-to-your-project) liste toutes les procédures pas à pas. [Découvrez ce que font les outils ai-i18n-tools](/fr/guide/what-is-ai-i18n-tools) pour comprendre comment les pipelines s'articulent.

## De la configuration à votre première nouvelle langue

<div class="home-steps">

1. **Préparez votre projet.** Choisissez vos langues, un fournisseur de traduction et les modèles à essayer. Pour les applications, marquez le texte visible par l'utilisateur et configurez l'environnement d'exécution de traduction. Pour les sites, activez le routage linguistique de votre framework. Les guides incluent des invites pour agent de codage lorsque des modifications de la source sont nécessaires.
2. **Traduisez dans des fichiers que vous pouvez utiliser.** Une fois la configuration prête, exécutez `sync`. Il extrait les chaînes d'application prises en charge, traduit le contenu que vous avez activé et écrit des fichiers de paramètres régionaux ou des pages localisées.
3. **Chargez, vérifiez et continuez.** Connectez la sortie à votre application ou site, configurez le changement de langue et vérifiez une langue cible. Réexécutez après des modifications de la source pour traduire le texte nouveau ou modifié.

</div>

Vous gérez la configuration du runtime et du routage, manuellement ou avec un agent de codage. La CLI gère l'extraction, la traduction, la validation et la génération de fichiers — pas la réécriture automatique de la source ni l'installation du sélecteur de langue. [Suivez le guide de démarrage rapide complet](/fr/guide/quick-start).

## Votre texte source. Prêt pour plus de langues.

Cet exemple JS/TS illustratif montre la forme du résultat après la configuration et la traduction à l'exécution. Le marquage de la chaîne source la rend détectable ; chaque fichier de paramètres régionaux généré mappe cette phrase à sa traduction.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

La phrase source reste lisible dans votre code. Votre application charge les fichiers de paramètres régionaux générés au runtime. Vous voulez voir le câblage complet ? [Explorez l'exemple Next.js fonctionnel](/fr/examples#nextjs-app). Les sites web suivent un chemin différent : [générez des pages localisées](/fr/guide/add-i18n-to-website) au lieu d'envelopper chaque paragraphe.

## Conçu aussi pour la prochaine mise à jour

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Choisissez votre fournisseur et vos modèles

Utilisez des fournisseurs pris en charge tels que OpenAI, Anthropic, OpenRouter, Gemini, Ollama en local, ou neuf autres options intégrées. Vous pouvez également utiliser n'importe quel fournisseur compatible avec OpenAI. La qualité de la traduction suit la liste des modèles (`translationModels`, plus les dérogations par langue). `suggest-models` construit cette liste à partir de benchmarks de traduction publiés, et le même classement est appliqué sous **Modèles** dans le tableau de bord.

[Fournisseurs de LLM](/fr/guide/providers-and-models) · [Modèles d'IA](/fr/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Réutiliser le travail déjà effectué

Les traductions mises en cache permettent aux réexécutions de se concentrer sur le texte nouveau ou modifié plutôt que de tout traduire à nouveau.

[Maintenir la traduction](/fr/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Examiner la sortie de l'IA localement

Inspectez les traductions, corrigez la formulation et gérez la terminologie dans le tableau de bord de traduction.

[Consulter le tableau de bord](/fr/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Conserver l'application et le contenu ensemble

Traduisez les messages d'application, la documentation, les fichiers JSON de locale imbriqués et les étiquettes de texte SVG à partir d'une seule configuration. Activez uniquement ce dont vous avez besoin.

[Combinaison de pipelines](/fr/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Traduire le README avec l'application

Un seul `sync` couvre les chaînes d'interface utilisateur et le Markdown du dépôt, et écrit une ligne de langue dans le README.

[Ajouter l'i18n à vos fichiers README et documents Markdown](/fr/guide/add-i18n-to-readme)

</article>
</div>

## Voir un projet fonctionnel d'abord

Ces exemples incluent la configuration et les fichiers traduits validés. Explorez le résultat sans clé API ; relancer la traduction nécessite un fournisseur configuré et généralement une clé. Ollama local n'a pas besoin de clé API.

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Une application multilingue

Découvrez les composants React, le câblage d'exécution, les pluriels et le changement de langue dans un projet Next.js fonctionnel.

[Explorer l'exemple Next.js](/fr/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Python en pratique

Découvrez comment une application Streamlit encapsule ses messages et utilise du JSON traduit sans ajouter d'environnement d'exécution JavaScript à l'application.

[Explorer l'exemple Streamlit](/fr/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

### Documentation en plusieurs langues

Découvrez les pages VitePress traduites ainsi que la navigation localisée et les étiquettes de thème.

[Explorer l'exemple VitePress](/fr/examples#vitepress-docs)

</article>
</div>

[Parcourir tous les exemples exécutables](/fr/examples), y compris le HTML simple, d'autres frameworks et les workflows i18n existants.

## Vous avez déjà de l'i18n ? Gardez ce qui fonctionne.

Vous n'avez pas à tout recommencer.

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Appels de chaînes source

Conserver les appels `t()` et gettext déjà présents dans le projet.

[Chaînes d'interface utilisateur JS/TS](/fr/guide/ui-strings/) · [Python et gettext](/fr/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Faisceaux JSON

Traduire les fichiers de locale imbriqués, y compris les espaces de noms i18next. La navigation du site et les catalogues de thèmes relèvent de [la traduction de documents](/fr/guide/add-i18n-to-website#what-gets-translated), pas de ce chemin.

[Traduire les bundles JSON](/fr/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

### Dictionnaires Intlayer

Conserver Intlayer et compléter les traductions manquantes, ou migrer l'application vers des appels de chaînes source.

[Traduire sur place](/fr/guide/translating-intlayer) · [Migrer vers des appels de chaînes sources](/fr/guide/migrating-from-intlayer)

</article>
</div>

Vous avez aussi des diagrammes ? [Traduisez les étiquettes de texte SVG](/fr/guide/svg-translation/) en même temps que votre application ou vos documents.

<a id="quick-install"></a>
## Prêt à ajouter votre première langue ?

<div class="home-cta">

[Choisissez votre projet](#start-here) pour le guide complet, ou [ouvrez le démarrage rapide](/fr/guide/quick-start) pour l'installation et la configuration.

Installez le [paquet npm](/fr/guide/installation) pour un projet Node.js.

<a id="python-no-nodejs"></a>

Pour Python, [téléchargez l'exécutable autonome](/fr/guide/installation#standalone-executables)—aucune installation Node.js séparée n'est requise.

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="explore-the-documentation"></a>
## Approfondissez si nécessaire

[Intégrations](/fr/guide/integrations/) · [Fournisseurs de LLM](/fr/guide/providers-and-models) · [Modèles d'IA](/fr/guide/ai-models) · [Configuration](/fr/reference/configuration) · [Référence de la CLI](/fr/reference/cli-commands/)

<br/>

<br/>

::: info À propos de ce site
L'interface et la documentation non-anglaises ont été traduites avec ai-i18n-tools. Les traductions IA peuvent contenir des erreurs.

Tous les noms de produits, logos et marques déposées sont la propriété de leurs propriétaires respectifs. Les icônes et les noms sont utilisés à des fins d'identification uniquement. Ce projet n'est pas affilié à ces marques ni approuvé par celles-ci.
:::
