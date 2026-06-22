---
title: Démarrage rapide
description: >-
  Obtenez votre premier document traduit en moins de cinq minutes en utilisant
  ai-i18n-tools avec cet exemple Astro Starlight.
sidebar:
  order: 2
translation_last_updated: '2026-06-22T19:38:48.384Z'
source_file_mtime: '2026-05-22T21:44:09.987Z'
source_file_hash: 2e7e3283a7dc1df486ce3088aa4f1bec3dac1bbce14d43f8d513a52fb0cd1cd9
translation_language: fr
source_file_path: src/content/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Suivez les étapes ci-dessous pour exécuter votre première traduction avec `ai-i18n-tools`. Ce guide utilise l'exemple Starlight que vous êtes en train de lire — chaque commande doit être exécutée depuis le répertoire `examples/astro-docs/`.

---

<a id="prerequisites"></a>

## Prérequis
Avant de commencer, assurez-vous de disposer des éléments suivants :

- **Node.js 22.16 ou supérieur** — vérifiez avec `node --version`
- **Une clé API OpenRouter** — inscrivez-vous sur [openrouter.ai](https://openrouter.ai) et copiez votre clé depuis le tableau de bord
- **pnpm 10.33 ou supérieur** — vérifiez avec `pnpm --version`

---

<a id="step-1--install-dependencies"></a>

## Étape 1 — Installer les dépendances

```bash
cd examples/astro-docs
pnpm install
```

Cela installe `ai-i18n-tools` (via l’espace de travail) ainsi qu’Astro et Starlight.

---

<a id="step-2--set-your-api-key"></a>

## Étape 2 — Définir votre clé API
Créez un fichier `.env` dans le répertoire `examples/astro-docs/` :

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lit automatiquement cette variable. Ne commitez jamais `.env` dans le contrôle de version.

---

<a id="step-3--review-the-configuration"></a>

## Étape 3 — Vérifier la configuration
Ouvrez `ai-i18n-tools.config.json`. La section pertinente pour la traduction de la documentation ressemble à ceci :

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": false
  },
  "documentations": [
    {
      "description": "Starlight docs under src/content/docs",
      "contentPaths": [
        "src/content/docs/quick-start.md",
        "src/content/docs/feature-showcase.mdx"
      ],
      "outputDir": "src/content/docs",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "astro-starlight",
        "docsRoot": "src/content/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in public assets",
              "search": "screenshots/fr/",
              "replace": "screenshots/fr/"
            }
          ]
        }
      }
    }
  ]
}
```

Le tableau `contentPaths` indique à l’outil quels fichiers traduire. Les copies traduites sont écrites dans `src/content/docs/<locale>/` (les dossiers de langue de Starlight).

---

<a id="step-4--run-the-sync"></a>

## Étape 4 — Exécuter la synchronisation
Traduisez la documentation :

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Vous verrez une sortie similaire à celle-ci :

```text
[docs] Scanning src/content/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.mdx — segments translated (5 locales)
[docs] quick-start.md — segments translated (5 locales)
```

Au deuxième passage, la plupart des segments seront des **hits de cache** et la traduction s’achèvera rapidement.

---

<a id="step-5--inspect-the-output"></a>

## Étape 5 — Vérifier la sortie
Les fichiers traduits sont écrits dans `src/content/docs/<locale>/`. Ouvrez-en un pour le comparer avec la source :

```bash
# Compare Spanish translation with English source
diff src/content/docs/quick-start.md \
     src/content/docs/es/quick-start.mdx
```

Points clés à vérifier :

- Les blocs de code sont **identiques** à la source — aucun code n’a été traduit.
- Les valeurs du front matter (`title`, `description`) sont traduites.
- Les éléments `code spans` en ligne dans le texte sont conservés tels quels.
- Les liens conservent leur `href` d’origine ; seul le texte d’ancrage est modifié.

---

<a id="step-6--start-starlight"></a>

## Étape 6 — Démarrer Starlight

```bash
pnpm dev
```

Ouvrez [http://localhost:3050/de/quick-start](http://localhost:3050/de/quick-start) (ou choisissez une langue dans le sélecteur de langue) pour parcourir la documentation traduite.

---

<a id="step-7--explore-the-nextjs-demo-locale--cardinal-plurals"></a>

## Étape 7 — Explorer la démo Next.js (locale + pluriels cardinaux)
La traduction de la documentation dans ce tutoriel utilise uniquement le **Markdown**. Le dépôt inclut également une interface **Next.js** sous `examples/nextjs-app/` sur le port **3030**, où vous pouvez observer les appels `t()`, les URL `?locale=` et une démonstration des **pluriels cardinaux**.

```bash
cd ../nextjs-app
pnpm dev
```

Ensuite, ouvrez [http://localhost:3030](http://localhost:3030).

- Changez de langue avec le menu déroulant **Locale**, ou ajoutez `?locale=<code>` (par exemple `http://localhost:3030/?locale=ar`).
- Faites défiler jusqu’à **Plurals: automatic generation usage example** et comparez les règles de pluriel entre les locales.
- Consultez la section **Cardinal plurals example** dans le [README de l’exemple Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

<a id="what-to-explore-next"></a>

## Prochaines étapes
- Lisez le [Translation Feature Showcase](./feature-showcase) pour découvrir tous les éléments Markdown que `ai-i18n-tools` peut gérer.
- Modifiez une phrase dans `src/content/docs/feature-showcase.mdx` et relancez `sync` — seul ce segment sera envoyé au LLM.
- Ajoutez un terme à `glossary-user.csv` pour garantir une terminologie cohérente dans toutes les locales.
- Comparez ce site Starlight avec la démo Docusaurus à l’adresse `examples/nextjs-app/docs-site/` (même contenu, `style: "docusaurus"` contre `style: "astro-starlight"`).
