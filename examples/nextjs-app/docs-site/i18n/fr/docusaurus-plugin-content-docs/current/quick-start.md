---
sidebar_position: 2
title: Démarrage rapide
description: >-
  Obtenez votre premier document traduit en moins de cinq minutes à l’aide de
  ai-i18n-tools avec ce projet exemple Next.js.
translation_last_updated: '2026-04-13T15:45:39.063Z'
source_file_mtime: '2026-04-13T12:37:25.386Z'
source_file_hash: f28037e8c747358d722aeab10f171799df8f1dc59513a8295af098c8c30f9fa5
translation_language: fr
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Démarrage rapide

Suivez les étapes ci-dessous pour effectuer votre première traduction avec `ai-i18n-tools`. Ce guide utilise le projet exemple Next.js que vous êtes en train de lire — chaque commande doit être exécutée depuis le répertoire `examples/nextjs-app/`.

---

## Prérequis

Avant de commencer, assurez-vous de disposer des éléments suivants :

- **Node.js 18+** — vérifiez avec `node --version`
- **Une clé API OpenRouter** — inscrivez-vous sur [openrouter.ai](https://openrouter.ai) et copiez votre clé depuis le tableau de bord
- **npm ou pnpm** — les deux gestionnaires de paquets fonctionnent

---

## Étape 1 — Installer les dépendances

```bash
cd examples/nextjs-app
npm install
```

Cela installe `ai-i18n-tools` ainsi que les paquets Next.js et Docusaurus utilisés par cet exemple.

---

## Étape 2 — Définir votre clé API

Créez un fichier `.env` dans le répertoire `examples/nextjs-app/` :

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lit automatiquement cette variable. Ne commitez jamais `.env` dans le contrôle de version.

---

## Étape 3 — Vérifier la configuration

Ouvrez `ai-i18n-tools.config.json`. La section pertinente pour la traduction de la documentation ressemble à ceci :

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

Le tableau `contentPaths` indique à l’outil quels répertoires (ou fichiers individuels) traduire. `outputDir` est l’emplacement où les fichiers traduits sont écrits.

---

## Étape 4 — Exécuter la synchronisation

Traduisez uniquement la documentation (ignorez les chaînes d’interface et les fichiers SVG pour l’instant) :

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Vous verrez une sortie similaire à celle-ci :

```
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Lors du deuxième passage, la plupart des segments seront des **succès de cache** et la traduction sera terminée en moins d’une seconde.

---

## Étape 5 — Examiner la sortie

Les fichiers traduits sont écrits dans `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Ouvrez-en un pour le comparer avec la source :

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Éléments clés à vérifier :

- Les blocs de code sont **identiques** à la source — aucun code n'a été traduit.
- Les valeurs du front matter (`title`, `description`) sont traduites.
- Les `plages de code en ligne` à l'intérieur du texte sont conservées telles quelles.
- Les liens conservent leur `href` d'origine ; seul le texte d'ancrage est traduit.

---

## Étape 6 — Démarrer Docusaurus

```bash
cd docs-site
npm run start -- --locale de
```

Cela démarre le serveur de développement Docusaurus en allemand. Ouvrez [http://localhost:3000/de/](http://localhost:3000/de/) dans votre navigateur pour parcourir la documentation traduite.

---

## Que faire ensuite

- Lisez le [Translation Feature Showcase](./feature-showcase) pour découvrir chaque élément Markdown que `ai-i18n-tools` peut gérer.
- Modifiez une phrase dans `docs-site/docs/feature-showcase.md` puis relancez `sync` — seul ce segment sera envoyé au LLM ; les autres seront servis depuis le cache.
- Ajoutez un terme à `glossary-user.csv` pour imposer une terminologie cohérente dans toutes les langues.
- Activez le pipeline des chaînes d'interface en définissant `"translateUIStrings": true` et en exécutant `sync` sans l'indicateur `--no-ui`.
