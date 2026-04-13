# Exemple d'application Next.js

Cet exemple montre comment utiliser `ai-i18n-tools` avec une application **TypeScript** [Next.js](https://nextjs.org/) et **pnpm**. L'interface utilisateur correspond à l'[exemple d'application console](../../console-app/), utilisant les mêmes clés de chaîne et un sélecteur de langue alimenté par `locales/ui-languages.json` (locale source `en-GB` en premier, suivi des cibles de traduction).

Niché sous ce dossier se trouve un petit site **[Docusaurus](https://docusaurus.io/)** ([`docs-site/`](../docs-site/)) avec des copies des documents principaux du projet pour une navigation locale.

<small>**Lire dans d'autres langues :** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [pt-BR](./README.pt-BR.md)</small>

## Capture d'écran

![screenshot](../images/screenshots/fr/screenshot.png)

## Exigences

- Node.js >= 18
- [pnpm](https://pnpm.io/)
- Une clé API [OpenRouter](https://openrouter.ai) (pour générer des traductions)

## Installation

Depuis la **racine du dépôt**, exécutez :

```bash
pnpm install
```

Le fichier racine `pnpm-workspace.yaml` inclut la bibliothèque et cet exemple, donc pnpm lie `ai-i18n-tools` via `"ai-i18n-tools": "workspace:^"` dans `package.json`. Aucune étape de construction ou de liaison séparée n'est nécessaire — après avoir modifié les sources de la bibliothèque, exécutez `pnpm run build` à la racine du dépôt et l'exemple prendra automatiquement en compte le `dist/` mis à jour.

## Utilisation

### Application Next.js (port 3030)

Serveur de développement :

```bash
pnpm dev
```

Construction et démarrage en production :

```bash
pnpm build
pnpm start
```

Ouvrez [http://localhost:3030](http://localhost:3030). Utilisez le menu déroulant **Locale** pour changer de langue (ID de locale / nom en anglais / étiquette native).

La page d'accueil montre également un **SVG de démonstration** en bas. L'URL de l'image suit `public/assets/translation_demo_svg.<locale>.svg` (mise en page plate du bloc `svg` dans `ai-i18n-tools.config.json`). Après avoir exécuté `translate-svg`, chaque fichier de locale contient le contenu traduit de `<text>`, `<title>`, et `<desc>` ; jusqu'à ce moment, les copies engagées peuvent sembler identiques à travers les locales.

### Site de documentation (port 3040)

```bash
cd docs-site
pnpm install
pnpm start
```

Ouvrez [http://localhost:3040](http://localhost:3040) (anglais). En **développement**, Docusaurus sert **une locale à la fois** : des chemins tels que `/es/getting-started` **404** à moins que vous n'exécutiez `pnpm run start:es` (ou `start:fr`, `start:de`, `start:pt-BR`). Après `pnpm build && pnpm serve`, toutes les locales sont disponibles. Voir [`docs-site/README.md`](../README.md).

## Langues prises en charge

| Code     | Langue               |
| -------- | -------------------- |
| `en-GB`  | Anglais (R.-U.) par défaut |
| `es`     | Espagnol             |
| `fr`     | Français             |
| `de`     | Allemand             |
| `pt-BR`  | Portugais (Brésil)   |

## Flux de travail

### 1. Extraire les chaînes UI

Scanne `src/` pour les appels `t()` et met à jour `locales/strings.json` :

```bash
pnpm run i18n:extract
```

### 2. Traduire

Définissez `OPENROUTER_API_KEY`, puis exécutez les scripts de traduction :

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate-ui
pnpm run i18n:translate-svg
pnpm run i18n:translate-docs
```

### Commande de synchronisation

La commande de synchronisation exécute l'extraction et toutes les étapes de traduction en séquence :

```bash
pnpm run i18n:sync
```

ou

```bash
ai-i18n-tools sync
```

Les étapes s'exécutent dans l'ordre :

1. **`ai-i18n-tools extract`** — extrait les chaînes UI et met à jour `locales/strings.json`.
2. **`ai-i18n-tools translate-ui`** — écrit le JSON de locale plate sous `public/locales/` à partir de `locales/strings.json`.
3. **`ai-i18n-tools translate-svg`** — traduit les actifs SVG de `images/` vers `public/assets/` selon le bloc `svg` dans `ai-i18n-tools.config.json` (cet exemple utilise des noms plats : `translation_demo_svg.<locale>.svg`).
4. **`ai-i18n-tools translate-docs`** — traduit le markdown Docusaurus sous `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (voir **Flux de travail 2** dans `docs/GETTING_STARTED.md` à la racine du dépôt).

Vous pouvez exécuter n'importe quelle étape individuellement (par exemple `ai-i18n-tools translate-svg`) lorsque seules les sources de ce flux de travail ont changé.

Si les journaux montrent de nombreux sauts et peu d'écritures, l'outil réutilise les **sorties existantes** et le **cache SQLite** dans `.translation-cache/`. Pour forcer la retraduction, passez `--force` ou `--force-update` sur la commande concernée où cela est pris en charge, ou exécutez `pnpm run i18n:clean` et traduisez à nouveau.

Cet exemple de configuration inclut `svg`, donc **`i18n:sync` exécute la même étape SVG que `translate-svg`**. Vous pouvez toujours appeler `ai-i18n-tools translate-svg` seul pour cette étape, ou utiliser `pnpm run i18n:translate` pour l'ordre fixe UI → SVG → docs **sans** exécuter **extract**.

### 3. Nettoyer le cache et retraduire

Après des modifications de l'UI ou de la documentation, certaines entrées de cache peuvent être obsolètes ou orphelines (par exemple, si un document a été supprimé ou renommé). `i18n:cleanup` exécute d'abord `sync --force-update`, puis supprime les entrées obsolètes :

```bash
pnpm run i18n:cleanup
```

Pour forcer la retraduction de l'UI, des documents ou des SVG, utilisez `--force`. Cela ignore le cache et retraduit en utilisant des modèles AI.

Pour retraduire l'ensemble du projet (UI, documents, SVG) :

```bash
pnpm run i18n:sync --force
```

Pour retraduire une seule locale :

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Pour retraduire uniquement les chaînes UI pour une locale spécifique :

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Édits manuels (Éditeur de cache)

Vous pouvez lancer une interface web locale pour examiner et modifier manuellement les traductions dans le cache, les chaînes d'interface utilisateur et le glossaire :

```bash
pnpm run i18n:editor
```

> **Important :** Si vous modifiez manuellement une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` (par exemple, `pnpm run i18n:sync --force-update`) pour réécrire les fichiers plats générés ou les fichiers markdown avec la traduction mise à jour. Notez également que si le texte source original change à l'avenir, votre modification manuelle sera perdue puisque l'outil génère un nouveau hash pour le nouveau texte source.

## Structure du projet

```
nextjs-app/
├── ai-i18n-tools.config.json # `svg` block: images/ → public/assets/ (translate-svg)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── i18n.ts
├── images/
│   └── translation_demo_svg.svg   # Source SVG for translate-svg
├── locales/
│   ├── ui-languages.json
│   └── strings.json          # Generated string catalogue (extract)
├── public/locales/           # Flat per-locale JSON (committed; regenerate with translate-ui)
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   └── pt-BR.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # Source (English)
    └── i18n/                 # Translated docs (Docusaurus layout; committed in git)
```

Les sources de documents en anglais sous `docs-site/docs/` peuvent être synchronisées depuis la racine du dépôt avec `pnpm run sync-docs`, ce qui ajoute des ancres de titre `{#slug}` et reflète `docusaurus write-heading-ids` ; voir l'en-tête du script dans `scripts/sync-docs-to-nextjs-example.mjs`.

Les chaînes d'interface utilisateur traduites, les SVG de démonstration et les pages Docusaurus sont déjà engagés sous `public/locales/`, `public/assets/`, `locales/strings.json`, et `docs-site/i18n/`. Après avoir modifié les sources et exécuté `i18n:translate`, redémarrez les serveurs de développement Next.js et Docusaurus si nécessaire ; les locales Docusaurus sont listées dans `docs-site/docusaurus.config.js`.
