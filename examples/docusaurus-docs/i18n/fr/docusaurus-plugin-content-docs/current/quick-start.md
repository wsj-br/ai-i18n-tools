---
sidebar_position: 2
title: Démarrage rapide
description: >-
  Obtenez votre premier document traduit en moins de cinq minutes en utilisant
  ai-i18n-tools avec ce projet d'exemple Docusaurus.
translation_last_updated: '2026-09-03T22:52:20.514Z'
source_file_mtime: '2026-07-10T22:50:38.005Z'
source_file_hash: bb346aef23ab36ff210d39e8af7bbe4359fe6fcc88ad584942ebe6504f2a0f7f
translation_language: fr
source_file_path: docs/quick-start.md
translation_models:
  - google/gemini-2.5-flash
  - meta-llama/llama-3.3-70b-instruct
---



Suivez les étapes ci-dessous pour exécuter votre première traduction avec `ai-i18n-tools`. Ce guide utilise l'exemple Docusaurus que vous lisez actuellement — chaque commande doit être exécutée à partir du répertoire `examples/docusaurus-docs/`.

---

## Prérequis {#prerequisites}

Avant de commencer, assurez-vous d'avoir les éléments suivants :

- **Node.js 22.16+** — vérifiez avec `node --version`
- **Une clé d'API OpenRouter** — inscrivez-vous sur [openrouter.ai](https://openrouter.ai) et copiez votre clé depuis le tableau de bord
- **pnpm 10.33+** — vérifiez avec `pnpm --version`

---

## Étape 1 — Installer les dépendances {#step-1--install-dependencies}

```bash
cd examples/docusaurus-docs
pnpm install
```

Ceci installe `ai-i18n-tools` ainsi que les packages Docusaurus utilisés par cet exemple.

---

## Étape 2 — Définir votre clé d'API {#step-2--set-your-api-key}

Créez un fichier `.env` dans le répertoire `examples/docusaurus-docs/` :

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
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus docs and shell JSON catalogs",
      "contentPaths": ["docs/"],
      "outputDir": "i18n",
      "docusaurusCatalogDir": "i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in static assets",
              "search": "screenshots/fr/]+/",
              "replace": "screenshots/fr/"
            }
          ]
        }
      }
    }
  ]
}
```

Le tableau `contentPaths` indique à l'outil quels répertoires (ou fichiers individuels) traduire. Le `outputDir` est l'endroit où les fichiers traduits sont écrits.

---

## Étape 4 — Exécuter la synchronisation {#step-4--run-the-sync}

Traduisez la documentation et le shell JSON Docusaurus :

```bash
pnpm run i18n:sync
```

Vous verrez une sortie similaire à :

```text
[docs] Scanning docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Lors de la deuxième exécution, la plupart des segments seront des **touches de cache** et la traduction sera terminée en moins d'une seconde.

---

## Étape 5 — Inspecter la sortie {#step-5--inspect-the-output}

Les fichiers traduits sont écrits dans `i18n/<locale>/docusaurus-plugin-content-docs/current/`. Ouvrez-en un pour le comparer avec la source :

```bash
# Compare Spanish translation with English source
diff docs/quick-start.md \
     i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Points clés à vérifier :

- Les blocs de code sont **identiques** à la source — aucun code n'a été traduit.
- Les valeurs de l'en-tête (`title`, `description`) sont traduites.
- Les `code spans` en ligne dans le texte sont conservés tels quels.
- Les liens conservent leur `href` d'origine ; seul le texte d'ancrage change.

---

## Étape 6 — Démarrer Docusaurus {#step-6--start-docusaurus}

```bash
pnpm start
```

Ceci construit chaque locale et sert le site afin que le menu de langue de la barre de navigation fonctionne. Ouvrez [http://localhost:3100/quick-start](http://localhost:3100/quick-start), puis passez au portugais (Brésil) — par exemple [http://localhost:3100/pt-BR/feature-showcase](http://localhost:3100/pt-BR/feature-showcase).

Lors de l'édition des sources anglaises, `pnpm dev` permet le rechargement à chaud uniquement pour la locale par défaut ; réexécutez `pnpm start` pour rafraîchir toutes les locales après les modifications.

---

## Que faire ensuite {#what-to-explore-next}

- Lisez la [présentation des fonctionnalités de traduction](./feature-showcase) pour voir tous les éléments Markdown que `ai-i18n-tools` peut gérer.
- Modifiez une phrase dans `docs/feature-showcase.md` et réexécutez `pnpm run i18n:sync` — seul ce segment sera envoyé au LLM ; les autres sont servis à partir du cache.
- Ajoutez un terme à `glossary-user.csv` pour garantir une terminologie cohérente dans toutes les locales.
- Pour les chaînes d'interface utilisateur, les pluriels cardinaux, la traduction SVG et un fichier README plat dans le même dépôt, consultez l'[exemple Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) combiné.
