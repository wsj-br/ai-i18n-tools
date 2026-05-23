---
sidebar_position: 2
title: Démarrage rapide
description: >-
  Obtenez votre premier document traduit en moins de cinq minutes en utilisant
  ai-i18n-tools avec ce projet exemple Next.js.
translation_last_updated: '2026-05-23T15:50:15.684Z'
source_file_mtime: '2026-05-04T22:22:41.551Z'
source_file_hash: bfe5380d21559e2ebd12913020cd7a9e50b1e85a76bc4436c438e90e9c09e1cf
translation_language: fr
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Suivez les étapes ci-dessous pour effectuer votre première traduction avec `ai-i18n-tools`. Ce guide utilise le projet exemple Next.js que vous êtes en train de lire — chaque commande doit être exécutée depuis le répertoire `examples/nextjs-app/`.

---

## Prérequis {#prerequisites}

Avant de commencer, assurez-vous de disposer des éléments suivants :

- **Node.js 22.16+** — vérifiez avec `node --version`
- **Une clé API OpenRouter** — inscrivez-vous sur [openrouter.ai](https://openrouter.ai) et copiez votre clé depuis le tableau de bord
- **pnpm 10.33+** — vérifiez avec `pnpm --version`

---

## Étape 1 — Installer les dépendances {#step-1--install-dependencies}

```bash
cd examples/nextjs-app
pnpm install
```

Cela installe `ai-i18n-tools` ainsi que les paquets Next.js et Docusaurus utilisés par cet exemple.

---

## Étape 2 — Définir votre clé API {#step-2--set-your-api-key}

Créez un fichier `.env` dans le répertoire `examples/nextjs-app/` :

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lit automatiquement cette variable. Ne commitez jamais `.env` dans le contrôle de version.

---

## Étape 3 — Examiner la configuration {#step-3--review-the-configuration}

Ouvrez `ai-i18n-tools.config.json`. La section pertinente pour la traduction de la documentation ressemble à ceci :

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
    "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true,
    "translateSVG": true
  },
  "glossary": {
    "uiGlossary": "locales/strings.json",
    "userGlossary": "glossary-user.csv",
    "autoAddUserEditedToGlossary": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in docs-site static assets",
              "search": "screenshots/fr/",
              "replace": "screenshots/${translatedLocale}/"
            }
          ]
        }
      }
    },
    {
      "description": "Root README only (flat markdown output)",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders under translated-docs",
              "search": "images/screenshots/[^/]+/",
              "replace": "images/screenshots/${translatedLocale}/"
            }
          ],
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ],
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Le tableau `contentPaths` indique à l'outil quels répertoires (ou fichiers individuels) traduire. Le répertoire `outputDir` est l'emplacement où les fichiers traduits sont écrits.

---

## Étape 4 — Exécuter la synchronisation {#step-4--run-the-sync}

Traduisez uniquement la documentation (ignorez pour l'instant les chaînes d'interface et les fichiers SVG) :

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Vous verrez une sortie similaire à ceci :

```text
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Lors du deuxième passage, la plupart des segments seront des **succès de cache** et la traduction s'achèvera en moins d'une seconde.

---

## Étape 5 — Vérifier la sortie {#step-5--inspect-the-output}

Les fichiers traduits sont écrits dans `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Ouvrez-en un pour le comparer avec la source :

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Points clés à vérifier :

- Les blocs de code sont **identiques** à la source — aucun code n’a été traduit.
- Les valeurs du front matter (`title`, `description`) sont traduites.
- Les éléments `code spans` en ligne dans le texte sont conservés tels quels.
- Les liens conservent leur `href` d’origine ; seul le texte d’ancre est traduit.

---

## Étape 6 — Démarrer Docusaurus {#step-6--start-docusaurus}

```bash
cd docs-site
pnpm start -- --locale de
```

Cela démarre le serveur de développement Docusaurus en allemand. Ouvrez [http://localhost:3040/de/](http://localhost:3040/de/) dans votre navigateur pour parcourir la documentation traduite.

---

## Étape 7 — Explorer la démo Next.js (locale + pluriels cardinaux) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

La traduction de la documentation dans ce tutoriel utilise uniquement le **Markdown**. Le même dépôt exemple inclut également une interface **Next.js** sur le port **3030**, où vous pouvez voir les appels `t()`, les URL `?locale=` et une démonstration des **pluriels cardinaux**.

Depuis `examples/nextjs-app/` :

```bash
pnpm dev
```

Ensuite, ouvrez [http://localhost:3030](http://localhost:3030).

- Changez de langue à l’aide du menu déroulant **Locale**, ou ajoutez `?locale=<code>` (par exemple `http://localhost:3030/?locale=ar`). L’interface synchronise automatiquement la chaîne de requête et le menu déroulant.
- Faites défiler jusqu’à **Pluriels : exemple d'utilisation de la génération automatique**. La page répète « Cette page contient … sections » pour des nombres d’échantillons fixes (**1**, **2**, **5**, **50**) afin que vous puissiez comparer les règles de pluriel entre les locales (y compris les langues ayant plusieurs formes de pluriel).
- Les appels utilisent `t("…", { plurals: true, count })`. Avec `extract` / `translate-ui`, cette clé devient un groupe de pluriels dans `locales/strings.json` ; les fichiers plats `public/locales/*.json` contiennent les formes suffixées. La configuration à l’exécution se trouve dans `src/lib/i18n.ts` — consultez la section **Exemple de pluriels cardinaux** dans le [README de l'exemple](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) pour une présentation concise.

---

## Que découvrir ensuite {#what-to-explore-next}

- Consultez le [Translation Feature Showcase](./feature-showcase) pour découvrir tous les éléments Markdown que `ai-i18n-tools` peut traiter — notamment la manière dont les **chaînes d’interface de pluriels cardinaux** s’intègrent à ce pipeline de documentation.
- Modifiez une phrase dans `docs-site/docs/feature-showcase.md` et relancez `sync` — seul ce segment sera envoyé au LLM ; les autres seront servis depuis le cache.
- Ajoutez un terme à `glossary-user.csv` pour garantir une terminologie cohérente dans toutes les locales.
- Activez le pipeline des chaînes d’interface en définissant `"translateUIStrings": true` et en exécutant `sync` sans l’indicateur `--no-ui`.
