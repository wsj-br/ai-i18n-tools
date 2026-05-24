---
sidebar_position: 1
title: Exemple de fonctionnalité de traduction
description: >-
  Un document de référence démontrant chaque élément Markdown que ai-i18n-tools
  sait traduire.
translation_last_updated: '2026-05-24T17:54:31.095Z'
source_file_mtime: '2026-05-04T21:42:57.361Z'
source_file_hash: fc1e59d495d99d93de4381fb9475734f0221307ceac660a82ac03cdc06acc320
translation_language: fr
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Cette page a pour but de montrer comment `ai-i18n-tools` gère chaque construction Markdown courante. Exécutez `sync` sur ce fichier et comparez la sortie dans chaque dossier de langue pour voir exactement ce qui est traduit et ce qui reste inchangé.

---

## Texte brut {#plain-text}

L'internationalisation va au-delà du simple remplacement de mots. Un bon pipeline de traduction préserve la structure du document, conserve les identifiants techniques intacts et envoie uniquement le texte lisible par l'humain au modèle linguistique.

`ai-i18n-tools` divise chaque document en **segments** avant de les envoyer au LLM. Chaque segment est traduit indépendamment, puis réassemblé, de sorte qu'une modification dans un paragraphe n'invalide pas les traductions mises en cache des autres parties du fichier.

---

## Mise en forme du texte {#text-formatting}

Le traducteur doit conserver toute la mise en forme en ligne sans modifier le balisage :

- **Texte en gras** indique l'importance et doit rester en gras après traduction.
- _Texte en italique_ est utilisé pour l'accent ou les titres ; le sens doit être préservé.
- ~~Barré~~ marque un contenu obsolète ou supprimé.
- `inline code` n'est **jamais** traduit — les identifiants, noms de fonctions et chemins de fichiers doivent rester inchangés.
- Un [lien hypertexte](https://github.com/wsj-br/ai-i18n-tools) conserve son URL d'origine ; seul le texte du lien est traduit.

---

## En-têtes à tous les niveaux {#headings-at-every-level}

### H3 — Configuration {#h3--configuration}

#### H4 — Répertoire de sortie {#h4--output-directory}

##### H5 — Nom des fichiers {#h5--file-naming}

###### H6 — Gestion des extensions {#h6--extension-handling}

Tous les niveaux de titres traduisent le texte mais laissent les identifiants d'ancre inchangés afin que les liens existants continuent de fonctionner.

---

## Tableaux {#tables}

Les tableaux sont une source fréquente d'erreurs de traduction. Chaque cellule est traduite individuellement ; les séparateurs de colonnes et la syntaxe d'alignement sont conservés.

| Fonctionnalité           | Statut          | Notes                                                             |
|--------------------------|-----------------|-------------------------------------------------------------------|
| Traduction Markdown      | ✅ Stable        | Segments mis en cache dans SQLite                                 |
| Extraction des chaînes d'interface | ✅ Stable | Lit les appels `t("…")` |
| Chaînes d'interface avec pluriel | ✅ Stable        | `t("…", { plurals: true, count })` ; suffixes de catalogue + JSON plat |
| Traduction des libellés JSON | ✅ Stable | JSON de la barre latérale/navigation Docusaurus |
| Traduction du texte SVG | ✅ Stable | Préserve la structure SVG |
| Application du glossaire | ✅ Stable | Glossaire CSV par projet |
| Concurrency par lot | ✅ Configurable | clé `batchConcurrency` |

### Prise en charge de gauche à droite et de droite à gauche {#left-to-right-and-right-to-left-support}

L'internationalisation moderne doit prendre en charge à la fois les langues lues de gauche à droite (LTR) et celles lues de droite à gauche (RTL). `ai-i18n-tools` garantit une gestion correcte de la direction du texte tout au long du processus de traduction :

- Le pipeline préserve automatiquement la directionnalité de chaque langue. Par exemple, l'arabe (`ar`) est affiché en RTL, tandis que l'anglais (`en-GB`), le portugais (`pt`) et d'autres restent en LTR.
- Lors de la traduction de tableaux Markdown, d'exemples de code ou de chaînes d'interface, les outils conservent l'alignement et la structure du contenu, de sorte que les tableaux et blocs formatés s'affichent naturellement dans les contextes LTR et RTL.
- Docusaurus et l'exemple d'application Next.js respectent tous deux la direction de la langue dans le navigateur, en modifiant la disposition et l'alignement du texte selon le cas.

| Directionnalité | Exemple de langue         | Affichage                |
|:--------------:|:--------------------------|:-------------------------|
|      LTR       | `en-GB`, `es`, `pt-BR` | Standard de gauche à droite |
|      RTL       | `ar`, `fa`, `he`       | Mise en page de droite à gauche   |

Cela garantit que les documents et interfaces s'affichent correctement, quelle que soit la langue ou la direction de lecture de l'utilisateur.

---

## Listes {#lists}

### Non ordonnées {#unordered}

- Le cache de traduction stocke un hachage de chaque segment source.
- Seuls les segments dont le hachage a changé depuis la dernière exécution sont envoyés au LLM.
- Cela rend les exécutions incrémentielles très rapides — généralement seulement quelques appels API pour de petites modifications.

### Ordonnées {#ordered}

1. Ajoutez `ai-i18n-tools` comme dépendance de développement.
2. Créez `ai-i18n-tools.config.json` à la racine de votre projet.
3. Exécutez `npx ai-i18n-tools sync` pour effectuer la première traduction complète.
4. Validez les fichiers de locale générés avec votre code source.
5. Lors des exécutions suivantes, seuls les segments modifiés sont retraduits.

### Imbriquées {#nested}

- **Pipeline de documents**
  - Source : tout fichier `.md` ou `.mdx`
  - Sortie : arborescence Docusaurus `i18n/` ou copies traduites plates
  - Cache : SQLite, indexé par chemin de fichier + hachage du segment
- **Pipeline des chaînes d'interface**
  - Source : fichiers JS/TS avec appels à `t("…")` (y compris les pluriels via `{ plurals: true, count }`)
  - Sortie : JSON plat par langue (`de.json`, `fr.json`, …) avec clés suffixées selon les catégories de pluriel le cas échéant
  - Cache : le catalogue maître `strings.json` lui-même

---

## Chaînes d'interface avec pluriel {#plural-ui-strings}

Les documents Markdown sur ce site illustrent la traduction de **document**. Le comportement en **pluriel** pour les textes d'interface est le plus facile à observer dans l'**exemple Next.js intégré** situé à côté de `docs-site/` dans `examples/nextjs-app/`.

La page d'accueil de cette application (`src/app/page.tsx`) inclut une section **démonstration de pluriels** et répète un message avec plusieurs nombres d'exemple afin que vous puissiez comparer la grammaire entre les locales (par exemple arabe vs anglais). Chaque ligne appelle :

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Utilisez `plurals: true` afin que `extract` enregistre un groupe pluriel dans `locales/strings.json` et que `translate-ui` remplisse les fichiers plats par langue situés sous `public/locales/`. Au moment de l'exécution, i18next résout la clé suffixée appropriée pour la `count` active ; l'exemple Next intègre des utilitaires dans `src/lib/i18n.ts`.

Pour des captures d'écran, des URL de langue et la structure des fichiers, consultez l'**exemple de pluriels** dans le [README de l'exemple Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Blocs de code {#code-blocks}

Les blocs de code ne sont **jamais** traduits. Le texte environnant est traduit, mais chaque caractère à l'intérieur du bloc délimité est conservé tel quel.

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

## Citations en bloc {#blockquotes}

> « La meilleure internationalisation est invisible pour l'utilisateur — ils voient simplement leur langue. »
>
> Une traduction correcte va au-delà du vocabulaire. Elle adapte le ton, les formats de date, la mise en forme des nombres et le sens de lecture afin de paraître naturelle dans chaque langue.

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

Les titres des encadrés Docusaurus sont traduits ; les délimiteurs `:::` et les mots-clés de type sont conservés.

:::note
Ce document contient intentionnellement de nombreuses fonctionnalités Markdown. Son objectif principal est de servir de support de test pour la traduction — exécutez `sync` et examinez la sortie pour vérifier que chaque élément est correctement traité.
:::

:::tip
Vous pouvez remplacer la traduction de n'importe quel segment en modifiant le fichier de sortie puis en relançant `sync`. L'outil détectera vos modifications et ajoutera automatiquement la formulation corrigée au glossaire du projet.
:::

:::warning
Ne commitez pas le répertoire `.translation-cache/` dans le contrôle de version. Le cache est spécifique à la machine et régénéré à chaque nouvel accès au dépôt.
:::

:::danger
Supprimer le répertoire de cache force la traduction complète de tous les segments. Cela peut être coûteux si vos documents sont volumineux. Utilisez `sync --no-cache-write` pour effectuer un test sans enregistrer les résultats.
:::

---

## Images et réécriture de chemins sensibles aux paramètres régionaux {#images-and-locale-aware-path-rewriting}

Le texte alternatif des images est traduit dans chaque langue. En outre, `ai-i18n-tools` peut également **réécrire les chemins des images** dans la sortie traduite via `postProcessing.regexAdjustments` — permettant ainsi à chaque langue d'afficher sa propre capture d'écran au lieu de toujours montrer la version anglaise.

Le document source (anglais) fait référence à :

```markdown
![The example Next.js app running in English](/img/screenshots/fr/screenshot.png)
```

L'entrée de configuration pour ce site de documentation inclut :

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/fr/",
    "replace": "screenshots/${translatedLocale}/"
  }
]
```

Après traduction, la sortie allemande devient :

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Voici la capture d'écran réelle de l'application Next.js — elle est en anglais par défaut, mais si vous lisez ceci dans une langue traduite, l'image ci-dessous devrait afficher l'application dans votre langue :

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/fr/screenshot.png)

---

## Règles horizontales et sauts de ligne {#horizontal-rules-and-line-breaks}

Une règle horizontale (`---`) est un élément structurel et n'est pas traduite.

Le contenu au-dessus et en dessous est traité comme des segments distincts, offrant ainsi des fenêtres de contexte plus propres au LLM.
