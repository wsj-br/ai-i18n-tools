# Exemple d'application Next.js

Cet exemple montre comment utiliser `ai-i18n-tools` avec une application [Next.js](https://nextjs.org/) en **TypeScript** et **pnpm**. L'interface correspond à l'exemple d'application console [console app example](../../console-app/), en utilisant les mêmes clés de chaîne et un sélecteur de langue piloté par `locales/ui-languages.json` (la langue source `en-GB` en premier, suivie des langues cibles). `[src/lib/i18n.ts](../src/lib/i18n.ts)` génère `**localeLoaders`** à partir de ce manifeste (tous les `code` sauf `SOURCE_LOCALE`), comme l'application console ; les bundles sont chargés avec `**fetch**` vers `**public/locales/<locale>.json**`.

Dans un sous-dossier se trouve un petit site **[Docusaurus](https://docusaurus.io/)** (`[docs-site/](../docs-site/)`) contenant un sous-ensemble sélectionné de la documentation du projet principal, destiné à une consultation locale.

**Lire dans d'autres langues :**
[Anglais](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

## Capture d'écran

capture d'écran

## Prérequis

- Node.js >= 22.16 (correspond au champ `engines` du dépôt)
- [pnpm](https://pnpm.io/) >= 10.33 (voir le `package.json` `packageManager` / `engines` à la racine)
- Une clé API [OpenRouter](https://openrouter.ai) (pour générer les traductions)

## Installation

Depuis la **racine du dépôt**, exécutez :

```bash
pnpm install
```

Le `pnpm-workspace.yaml` à la racine inclut la bibliothèque et cet exemple, donc pnpm lie `ai-i18n-tools` via `"ai-i18n-tools": "workspace:^"` dans `package.json`. Aucune étape de construction ou de liaison séparée n'est nécessaire — après modification des sources de la bibliothèque, exécutez `pnpm run build` à la racine du dépôt et l'exemple utilisera automatiquement la version mise à jour de `dist/`.

**Répertoire de travail :** Exécutez l'application Next.js et toutes les commandes `pnpm run i18n:*` depuis `**examples/nextjs-app`** (là où se trouve `ai-i18n-tools.config.json`), ou passez `--config` / définissez le répertoire de travail afin que l'interface en ligne de commande trouve cette configuration.

## Utilisation

### Application Next.js (port 3030)

Depuis la racine du dépôt après `pnpm install` :

```bash
cd examples/nextjs-app
```

Serveur de développement :

```bash
pnpm dev
```

Construction en production et démarrage :

```bash
pnpm build
pnpm start
```

Ouvrez [http://localhost:3030](http://localhost:3030). Utilisez le menu déroulant **Locale** pour changer de langue (ID de langue / nom en anglais / libellé natif). Vous pouvez également accéder directement à une langue via la chaîne de requête `**?locale=<code>`** (par exemple `[?locale=ar](http://localhost:3030/?locale=ar)`) ; la page maintient le menu déroulant et l'URL synchronisés.

### Exemple de pluriels cardinaux

La page d'accueil inclut une **démonstration des pluriels** (« Pluriels : exemple d'utilisation de la génération automatique ») qui montre comment les chaînes d'interface utilisateur en **pluriel cardinal** sont intégrées de bout en bout :

- **Rendu :** Le même message est répété pour plusieurs nombres d'exemples définis dans `**PLURAL_DEMO_COUNTS`** dans `[src/app/page.tsx](../src/app/page.tsx)` (par défaut **1**, **2**, **5** et **50**) afin que vous puissiez comparer le comportement des pluriels selon les langues (y compris celles ayant plusieurs formes de pluriel, comme l'arabe).
- **API :** Chaque ligne utilise `t("This page has {{count}} sections", { plurals: true, count })`. Passez `**plurals: true`** pour que l'extraction et la traduction traitent la clé comme un groupe de pluriels ; `**count**` sélectionne la forme de pluriel active au moment de l'exécution.
- **Exécution :** Les formes de pluriel sont résolues au moment de l'exécution via les utilitaires configurés dans `[src/lib/i18n.ts](../src/lib/i18n.ts)` ; consultez la documentation **runtime** du package (`ai-i18n-tools/runtime`) pour une vue d'ensemble complète.
- **Sorties :** Les langues cibles utilisent des entrées suffixées dans `public/locales/<locale>.json` ; la langue source conserve les bundles de pluriels dans `**public/locales/en-GB.json`** aux côtés des entrées plates habituelles.

La démonstration affiche également un petit **bloc de code gris** avec l'extrait JSX au-dessus des exemples en direct, pour référence rapide.

La page d'accueil affiche également une **image SVG de démonstration** en bas. L'URL de l'image suit `public/assets/translation_demo_svg.<locale>.svg` (organisation plate issue du bloc `svg` dans `ai-i18n-tools.config.json`). Après avoir exécuté `translate-svg`, chaque fichier de langue contient les contenus traduits `<text>`, `<title>` et `<desc>` ; jusqu'à ce moment, les copies validées peuvent sembler identiques entre les langues.

### Site de documentation (port 3040)

```bash
cd examples/nextjs-app/docs-site
pnpm install
pnpm build
pnpm start
```

Si elle ne s'ouvre pas automatiquement, ouvrez votre navigateur et rendez-vous sur [http://localhost:3040](http://localhost:3040).

## Langues prises en charge

| Code    | Langue               |
| ------- | -------------------- |
| `ar`    | Arabe                |
| `en-GB` | Anglais (Royaume-Uni), par défaut |
| `fr`     | Français                |
| `de`     | Allemand                |
| `pt-BR`  | Portugais (Brésil)     |
| `es`     | Espagnol                |

## Flux de travail

### 1. Extraire les chaînes d'interface

Analyse `src/` à la recherche d'appels `t()` et met à jour `locales/strings.json` :

```bash
pnpm run i18n:extract
```

### 2. Traduire

Définissez `OPENROUTER_API_KEY`, puis depuis `**examples/nextjs-app**` exécutez toutes les étapes de traduction (JSON plat de l'interface → ressources SVG → documentation) dans l'ordre :

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate
```

Pour exécuter une seule étape, utilisez l'interface en ligne de commande (même répertoire de travail) :

```bash
ai-i18n-tools translate-ui
ai-i18n-tools translate-svg
ai-i18n-tools translate-docs
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

Les étapes s'exécutent dans l'ordre suivant :

1. `**ai-i18n-tools extract**` — extrait les chaînes de l'interface et met à jour `locales/strings.json`.
2. `**ai-i18n-tools translate-ui**` — écrit le JSON des langues plates dans `public/locales/` à partir de `locales/strings.json`.
3. `**ai-i18n-tools translate-svg**` — traduit les ressources SVG de `images/` vers `public/assets/` lorsque `features.translateSVG` est vrai et que le bloc `svg` est défini dans `ai-i18n-tools.config.json` (cet exemple utilise des noms plats : `translation_demo_svg.<locale>.svg`).
4. `**ai-i18n-tools translate-docs**` — traduit le markdown Docusaurus et les fichiers JSON associés dans `docs-site/i18n/` (selon `documentations[]` dans `ai-i18n-tools.config.json` ; voir **Workflow 2** dans `docs/GETTING_STARTED.md` à la racine du dépôt).

Vous pouvez exécuter chaque étape individuellement (par exemple `ai-i18n-tools translate-svg`) lorsque seules les sources de cette étape ont changé.

Si les journaux affichent de nombreux sauts et peu d'écritures, l'outil réutilise les **sorties existantes** et le **cache SQLite** dans `.translation-cache/`. Pour forcer une retraduction, passez `--force` ou `--force-update` sur la commande concernée si pris en charge, ou exécutez `**pnpm run i18n:clean`** (supprime **uniquement** `.translation-cache/` dans ce dossier) puis traduisez à nouveau.

Cet exemple contient `features.translateSVG` et un bloc `svg`, donc `**i18n:sync` exécute la même étape SVG que `translate-svg`**. Vous pouvez tout de même appeler `ai-i18n-tools translate-svg` seul pour cette étape, ou utiliser `pnpm run i18n:translate` pour l'ordre fixe interface → SVG → documentation **sans** exécuter **extract**.

### 3. Nettoyer le cache et relancer la traduction

Après des modifications de l'interface utilisateur ou de la documentation, certaines entrées du cache peuvent être obsolètes ou orphelines (par exemple, si un document a été supprimé ou renommé). `i18n:cleanup` exécute d'abord `sync --force-update`, puis supprime les entrées obsolètes :

```bash
pnpm run i18n:cleanup
```

Pour forcer la retraduction de l'interface utilisateur, des documents ou des SVG, utilisez `--force`. Cela ignore le cache et relance la traduction à l'aide des modèles d'IA.

Pour retraduire l'intégralité du projet (interface utilisateur, documents, SVG) :

```bash
pnpm run i18n:sync --force
```

Pour retraduire une seule locale :

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Pour retraduire uniquement les chaînes d'interface utilisateur pour une locale spécifique :

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Modifications manuelles (éditeur de cache)

Vous pouvez lancer une interface web locale pour examiner et modifier manuellement les traductions dans le cache, les chaînes d'interface et le glossaire (depuis `**examples/nextjs-app**`) :

```bash
pnpm run i18n:editor
```

Depuis `**docs-site/**`, `**pnpm run i18n:editor**` fait la même chose (il `cd` vers ce dossier et exécute l'interface en ligne de commande).

> **Important :** Si vous modifiez manuellement une entrée dans l'éditeur de cache, vous devez exécuter un `sync --force-update` (par exemple `pnpm run i18n:sync --force-update`) pour réécrire les fichiers plats générés ou les fichiers Markdown avec la traduction mise à jour. Notez également que si le texte source original change à l'avenir, votre modification manuelle sera perdue, car l'outil génère un nouveau hachage pour le nouveau texte source.

## Structure du projet

```text
nextjs-app/
├── ai-i18n-tools.config.json # UI, docs, svg, glossary; `cacheDir`: .translation-cache/
├── glossary-user.csv         # Optional user glossary (see config `glossary.userGlossary`)
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
│   ├── en-GB.json            # Source locale bundle (includes plural keys)
│   ├── ui-languages.json     # Copied/served for runtime if needed
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   ├── pt-BR.json
│   └── ar.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
├── translated-docs/          # README translations (flat markdown; second `documentations` block)
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # English sources for this example (curated subset)
    ├── docusaurus.config.mjs
    └── i18n/                 # Translated docs + Docusaurus JSON catalogs (committed in git)
```

Le markdown en anglais pour le site exemple se trouve dans `**docs-site/docs/**`. Il n'y a pas de synchronisation automatisée depuis la racine du dépôt `**docs/**` ; mettez à jour ces fichiers directement lors du rafraîchissement du contenu. Pour des ancres de titres stables, utilisez `**write-heading-ids**` de Docusaurus depuis `**docs-site/**` (voir `**pnpm run write-heading-ids**` dans `[docs-site/package.json](../docs-site/package.json)`).

Les chaînes de l'interface traduites, les SVG de démonstration, les traductions de la racine `README`, ainsi que les sorties de Docusaurus sont validées dans `public/locales/`, `public/assets/`, `locales/strings.json`, `translated-docs/` et `docs-site/i18n/`. Après avoir modifié les sources et exécuté `**pnpm run i18n:translate**` ou `**pnpm run i18n:sync**`, redémarrez les serveurs de développement Next.js et Docusaurus selon les besoins. Le routage par langue et `**localeConfigs**` sont définis dans `**docs-site/docusaurus.config.mjs**`.
