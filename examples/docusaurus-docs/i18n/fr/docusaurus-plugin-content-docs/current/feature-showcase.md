---
sidebar_position: 1
title: Présentation des fonctionnalités de traduction
description: >-
  Un document de référence présentant tous les éléments Markdown que
  ai-i18n-tools sait traduire.
translation_last_updated: '2026-09-03T22:52:20.423Z'
source_file_mtime: '2026-07-12T19:44:59.019Z'
source_file_hash: ad61e5d62a39cb332852533980c1de8417791746e8053814b32c4d3785e41215
translation_language: fr
source_file_path: docs/feature-showcase.md
translation_models:
  - google/gemini-2.5-flash
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Cette page a pour but de montrer comment `ai-i18n-tools` gère toutes les constructions Markdown courantes. Exécutez `sync` dessus et comparez la sortie dans chaque dossier de locale pour voir exactement ce qui est traduit et ce qui reste intact.

---

## Texte brut {#plain-text}

L'internationalisation est plus qu'un simple échange de mots. Un bon pipeline de traduction préserve la structure du document, maintient les identifiants techniques intacts et n'envoie que le texte lisible par l'homme au modèle linguistique.

`ai-i18n-tools` divise chaque document en **segments** avant de les envoyer au LLM. Chaque segment est traduit indépendamment puis réassemblé, de sorte qu'une modification d'un paragraphe n'invalide pas les traductions mises en cache du reste du fichier.

---

## Formatage du texte {#text-formatting}

Le traducteur doit conserver tout le formatage en ligne sans modifier le balisage :

- Le **texte en gras** signale l'importance et doit rester en gras après la traduction.
- Le _texte en italique_ est utilisé pour l'emphase ou les titres ; le sens doit être préservé.
- Le ~~barré~~ marque le contenu obsolète ou supprimé.
- `inline code` n'est **jamais** traduit — les identifiants, les noms de fonctions et les chemins de fichiers doivent rester tels quels.
- Un [lien hypertexte](https://github.com/wsj-br/ai-i18n-tools) conserve son URL d'origine ; seul le libellé de l'ancre est traduit.

---

## Titres à tous les niveaux {#headings-at-every-level}

### H3 — Configuration {#h3--configuration}

#### H4 — Répertoire de sortie {#h4--output-directory}

##### H5 — Nommage des fichiers {#h5--file-naming}

###### H6 — Gestion des extensions {#h6--extension-handling}

Tous les niveaux de titre traduisent le texte mais laissent les identifiants d'ancre inchangés afin que les liens d'ancre existants continuent de fonctionner.

---

## Tableaux {#tables}

Les tableaux sont une source courante d'erreurs de traduction. Chaque cellule est traduite individuellement ; les séparateurs de colonnes et la syntaxe d'alignement sont préservés.

| Fonctionnalité             | Statut         | Notes                                                            |
|----------------------------|----------------|------------------------------------------------------------------|
| Traduction Markdown        | ✅ Stable       | Segments mis en cache dans SQLite                                |
| Extraction de chaînes d'interface utilisateur | ✅ Stable       | Lit les appels `t("…")`                                             |
| Chaînes d'interface utilisateur plurielles | ✅ Stable | `t("…", { plurals: true, count })` ; catalogue + suffixes JSON plats |
| Traduction d'étiquettes JSON | ✅ Stable | JSON de la barre latérale/de navigation Docusaurus |
| Traduction de texte SVG | ✅ Stable | Préserve la structure SVG |
| Application du glossaire | ✅ Stable | Glossaire CSV par projet |
| Concurrence par lots | ✅ Configurable | Clé `batchConcurrency` |

### Prise en charge de la lecture de gauche à droite et de droite à gauche {#left-to-right-and-right-to-left-support}

L'internationalisation moderne doit prendre en charge les langues de gauche à droite (LTR) et de droite à gauche (RTL). `ai-i18n-tools` assure une gestion correcte de la direction du texte tout au long du flux de travail de traduction :

- Le pipeline préserve automatiquement la directionnalité de chaque locale. Par exemple, l'arabe (`ar`) est rendu en RTL, tandis que l'anglais (`en-GB`), le portugais (`pt`) et d'autres restent en LTR.
- Lors de la traduction de tableaux Markdown, d'exemples de code ou de chaînes d'interface utilisateur, les outils maintiennent l'alignement et la structure du contenu, de sorte que les tableaux et les blocs formatés s'affichent naturellement dans les contextes LTR et RTL.
- Docusaurus et l'application Next.js d'exemple respectent tous deux la direction de la locale dans le navigateur, en adaptant la mise en page et l'alignement du texte selon les besoins.

| Directionnalité | Exemple de locale | Affichage |
|:--------------:|:-----------------------|:-----------------------|
| LTR | `en-GB`, `es`, `pt-BR` | Standard de gauche à droite |
| RTL | `ar`, `fa`, `he` | Disposition de droite à gauche |

Cela garantit que les documents et les interfaces s'affichent correctement, quelle que soit la langue de l'utilisateur ou le sens de lecture.

---

## Listes {#lists}

### Non ordonnées {#unordered}

- Le cache de traduction stocke un hachage de chaque segment source.
- Seuls les segments dont le hachage a changé depuis la dernière exécution sont envoyés au LLM.
- Cela rend les exécutions incrémentielles très rapides — généralement seulement quelques appels d'API pour de petites modifications.

### Ordonnées {#ordered}

1. Ajoutez `ai-i18n-tools` en tant que dépendance de développement.
2. Créez `ai-i18n-tools.config.json` à la racine de votre projet.
3. Exécutez `npx ai-i18n-tools sync` pour effectuer la première traduction complète.
4. Validez les fichiers de locale générés avec votre source.
5. Lors des exécutions ultérieures, seuls les segments modifiés sont retraduits.

### Imbriquées {#nested}

- **Pipeline de documents**
  - Source : tout fichier `.md` ou `.mdx`
  - Sortie : arborescence Docusaurus `i18n/` ou copies traduites plates
  - Cache : SQLite, indexé par chemin de fichier + hachage de segment
- **Pipeline de chaînes d'interface utilisateur**
  - Source : fichiers JS/TS avec appels `t("…")` (y compris les pluriels via `{ plurals: true, count }`)
  - Sortie : JSON plat par locale (`de.json`, `fr.json`, …) avec des clés suffixées pour les catégories de pluriels le cas échéant
  - Cache : le catalogue maître `strings.json` lui-même

---

## Chaînes d'interface utilisateur au pluriel {#plural-ui-strings}

Les documents Markdown de ce site présentent la traduction de **documents**. Le comportement au **pluriel** pour le texte d'interface utilisateur est plus facile à voir dans l'[exemple Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (`examples/nextjs-app/`), qui combine une application React avec ce même modèle de contenu Docusaurus.

La page d'accueil de cette application (`src/app/page.tsx`) comprend une section de **démonstration des pluriels** et répète un message avec plusieurs nombres d'exemples afin que vous puissiez comparer la grammaire entre les paramètres régionaux (par exemple, l'arabe et l'anglais). Chaque ligne appelle :

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Utilisez `plurals: true` pour que `extract` enregistre un groupe au pluriel dans `locales/strings.json` et que `translate-ui` remplisse les fichiers plats par paramètre régional sous `public/locales/`. Lors de l'exécution, i18next résout la bonne clé suffixée pour le `count` actif ; l'exemple Next connecte les assistants dans `src/lib/i18n.ts`.

Pour les captures d'écran, les URL de paramètres régionaux et la disposition des fichiers, consultez **Exemple de pluriels** dans le [README de l'exemple Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Blocs de code {#code-blocks}

Les blocs de code ne sont **jamais** traduits. Le texte environnant est traduit, mais chaque caractère à l'intérieur du bloc délimité est transmis tel quel.

### Shell {#shell}

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### Configuration JSON {#json-configuration}

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "es", "fr", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": { "style": "docusaurus", "docsRoot": "docs-site/docs" }
    }
  ]
}
```

### TypeScript {#typescript}

```typescript
import { createI18nConfig } from 'ai-i18n-tools/runtime';

const config = createI18nConfig({
  defaultLocale: 'en-GB',
  supportedLocales: ['de', 'es', 'fr', 'pt-BR'],
  fallback: 'en-GB',
});

export default config;
```

---

## Citations {#blockquotes}

> « La meilleure internationalisation est invisible pour l'utilisateur — il voit simplement sa langue. »
>
> Une traduction appropriée va au-delà du vocabulaire. Elle adapte le ton, les formats de date, le formatage des nombres et le sens de lecture pour se sentir native dans chaque paramètre régional.

---

## Onglets (Docusaurus) {#tabs-docusaurus}

<Tabs>
  <TabItem value="apple" label="Pomme" default>
    Ceci est une pomme 🍎
  </TabItem>
  <TabItem value="orange" label="Orange">
    Ceci est une orange 🍊
  </TabItem>
  <TabItem value="banana" label="Banane">
    Ceci est une banane 🍌
  </TabItem>
</Tabs>

---

## Avertissements (Docusaurus) {#admonitions-docusaurus}

Les titres des avertissements Docusaurus sont traduits ; les délimiteurs `:::` et les mots-clés de type sont conservés.

:::note
Ce document est intentionnellement riche en fonctionnalités Markdown. Son objectif principal est de servir de banc d'essai de traduction — exécutez `sync` et inspectez la sortie pour vérifier que chaque élément est géré correctement.
:::

:::tip
Vous pouvez remplacer la formulation traduite de n'importe quel segment en modifiant le fichier de sortie et en exécutant à nouveau `sync`. L'outil détectera vos modifications et ajoutera automatiquement la formulation corrigée au glossaire du projet.
:::

:::warning
Ne commettez pas le répertoire `.translation-cache/` dans le contrôle de version. Le cache est spécifique à la machine et est régénéré à chaque nouvelle extraction.
:::

:::danger
La suppression du répertoire de cache force la retraduction de chaque segment à partir de zéro. Cela peut être coûteux si vos documents sont volumineux. Utilisez `sync --no-cache-write` pour effectuer une simulation sans persister les résultats.
:::

---

## Images et réécriture de chemin sensible à la locale {#images-and-locale-aware-path-rewriting}

Le texte alternatif des images est traduit dans chaque locale. Au-delà de cela, `ai-i18n-tools` peut également **réécrire les chemins d'image** dans la sortie traduite via `postProcessing.regexAdjustments` — ainsi chaque locale peut pointer vers sa propre capture d'écran plutôt que de toujours afficher la version anglaise.

Le document source (anglais) fait référence à :

```markdown
![The example Next.js app running in English](/img/screenshots/fr/screenshot.png)
```

L'entrée de configuration pour ce site de documentation inclut :

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/fr/]+/",
    "replace": "screenshots/fr/"
  }
]
```

Après traduction, la sortie allemande devient :

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/fr/screenshot.png)
```

Voici la capture d'écran réelle de l'application Next.js — elle est en anglais par défaut, mais si vous lisez ceci dans une locale traduite, l'image ci-dessous devrait montrer l'application dans votre langue :

![L'exemple d'application Next.js — chaînes d'interface utilisateur et cette page traduites par ai-i18n-tools](/img/screenshots/fr/screenshot.png)

---

## Règles horizontales et sauts de ligne {#horizontal-rules-and-line-breaks}

Une règle horizontale (`---`) est un élément structurel et n'est pas traduite.

Le contenu au-dessus et en dessous est traité comme des segments distincts, offrant au LLM des fenêtres contextuelles plus claires.
