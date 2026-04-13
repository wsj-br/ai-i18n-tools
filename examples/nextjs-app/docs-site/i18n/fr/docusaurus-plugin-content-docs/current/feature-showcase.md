---
sidebar_position: 1
title: Exemple de fonctionnalités de traduction
description: >-
  Un document de référence démontrant chaque élément Markdown que ai-i18n-tools
  sait traduire.
translation_last_updated: '2026-04-13T17:23:06.179Z'
source_file_mtime: '2026-04-13T12:49:18.347Z'
source_file_hash: 60c92aa8b547462c58ec49a6b0d6830f7245d618f2052c5ab961e2a4e80a0234
translation_language: fr
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Exemple de fonctionnalités de traduction

Cette page a pour but de montrer comment `ai-i18n-tools` gère chaque construction Markdown courante. Exécutez `sync` sur ce fichier et comparez la sortie dans chaque dossier de langue pour voir exactement ce qui est traduit et ce qui reste inchangé.

---

## Prose simple

L'internationalisation va au-delà du simple remplacement de mots. Un bon pipeline de traduction préserve la structure du document, conserve les identifiants techniques intacts, et envoie uniquement le texte lisible par l'humain au modèle linguistique.

`ai-i18n-tools` divise chaque document en **segments** avant de les envoyer au LLM. Chaque segment est traduit indépendamment, puis réassemblé, de sorte qu'une modification d'un paragraphe n'invalide pas les traductions mises en cache du reste du fichier.

---

## Mise en forme en ligne

Le traducteur doit conserver toute la mise en forme en ligne sans modifier le balisage :

- **Texte en gras** indique une importance et doit rester en gras après traduction.
- _Texte en italique_ est utilisé pour l'accent ou les titres ; le sens doit être préservé.
- ~~Barré~~ marque un contenu obsolète ou supprimé.
- `inline code` est **jamais** traduit — les identifiants, noms de fonctions et chemins de fichiers doivent rester inchangés.
- Un [hyperlien](https://github.com/your-org/ai-i18n-tools) conserve son URL d'origine ; seul le libellé de l'ancre est traduit.

---

## Titres à tous les niveaux

### H3 — Configuration

#### H4 — Répertoire de sortie

##### H5 — Nom des fichiers

###### H6 — Gestion des extensions

Tous les niveaux de titres traduisent le texte mais laissent les identifiants d'ancre inchangés afin que les liens profonds existants continuent de fonctionner.

---

## Tableaux

Les tableaux sont une source fréquente d'erreurs de traduction. Chaque cellule est traduite individuellement ; les séparateurs de colonnes et la syntaxe d'alignement sont préservés.

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Traduction Markdown | ✅ Stable | Segments mis en cache dans SQLite |
| Extraction des chaînes d'interface | ✅ Stable | Lit les appels `t("…")` |
| Traduction des libellés JSON | ✅ Stable | JSON de la barre latérale/navbar Docusaurus |
| Traduction du texte SVG | ✅ Stable | Préserve la structure SVG |
| Application du glossaire | ✅ Stable | Glossaire CSV par projet |
| Concurrency par lot | ✅ Configurable | Clé `batchConcurrency` |

### Variantes d'alignement

| Aligné à gauche | Centré | Aligné à droite |
|:---|:---:|---:|
| Langue source | `en-GB` | requis |
| Langues cibles | jusqu'à 20 | recommandé |
| Concurrency | 4 | par défaut |

---

## Listes

### Non ordonnées

- Le cache de traduction stocke un hachage de chaque segment source.
- Seuls les segments dont le hachage a changé depuis la dernière exécution sont envoyés au LLM.
- Cela rend les exécutions incrémentielles très rapides — généralement seulement quelques appels API pour de petites modifications.

### Ordonnées

1. Ajoutez `ai-i18n-tools` comme dépendance de développement.
2. Créez `ai-i18n-tools.config.json` à la racine de votre projet.
3. Exécutez `npx ai-i18n-tools sync` pour effectuer la première traduction complète.
4. Validez les fichiers de langue générés aux côtés de votre code source.
5. Lors des exécutions suivantes, seuls les segments modifiés sont retraduits.

### Imbriquées

- **Pipeline Documents**
  - Source : tout fichier `.md` ou `.mdx`
  - Sortie : arborescence `i18n/` de Docusaurus ou copies traduites plates
  - Cache : SQLite, indexé par chemin de fichier + hachage du segment
- **Pipeline chaînes d'interface**
  - Source : fichiers JS/TS avec appels `t("…")`
  - Sortie : JSON plat par langue (`de.json`, `fr.json`, …)
  - Cache : le catalogue maître `strings.json` lui-même

---

## Blocs de code

Les blocs de code ne sont **jamais** traduits. Le texte environnant est traduit, mais chaque caractère à l’intérieur du bloc délimité est transmis tel quel.

### Shell

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### Configuration JSON

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

### TypeScript

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

## Citations

> « La meilleure internationalisation est invisible pour l’utilisateur — ils voient simplement leur langue. »
>
> Une traduction correcte va au-delà du vocabulaire. Elle adapte le ton, les formats de date, la mise en forme des nombres et le sens de lecture pour paraître naturelle dans chaque langue.

---

## Encadrés (Docusaurus)

Les titres des encadrés Docusaurus sont traduits ; les délimiteurs `:::` et les mots-clés de type sont conservés.

:::note
Ce document contient intentionnellement de nombreuses fonctionnalités Markdown. Son objectif principal est de servir de support de test de traduction — exécutez `sync` et examinez la sortie pour vérifier que chaque élément est correctement traité.
:::

:::tip
Vous pouvez remplacer la formulation traduite de n’importe quel segment en modifiant le fichier de sortie puis en relançant `sync`. L’outil détectera vos modifications et ajoutera automatiquement la formulation corrigée au glossaire du projet.
:::

:::warning
Ne validez pas le répertoire `.translation-cache/` dans le contrôle de version. Le cache est spécifique à la machine et régénéré à chaque nouvel accès au dépôt.
:::

:::danger
Supprimer le répertoire du cache force la retraduction de tous les segments depuis le début. Cela peut être coûteux si vos documents sont volumineux. Utilisez `sync --no-cache-write` pour effectuer un test sans enregistrer les résultats.
:::

---

## Images et réécriture de chemins sensible aux paramètres régionaux

Le texte alternatif des images est traduit dans chaque paramètre régional. En outre, `ai-i18n-tools` peut également **réécrire les chemins des images** dans la sortie traduite via `postProcessing.regexAdjustments` — afin que chaque paramètre régional puisse pointer vers sa propre capture d'écran plutôt que d'afficher systématiquement la version anglaise.

Le document source (anglais) fait référence à :

```markdown
![The example Next.js app running in English](/img/screenshots/fr/screenshot.png)
```

L'entrée de configuration pour ce site de documentation inclut :

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/fr/",
    "replace": "screenshots/${translatedLocale}/"
  }
]
```

Après traduction, la sortie allemande devient :

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Voici la capture d'écran anglaise réelle — si vous lisez ceci dans un paramètre régional traduit, l'image ci-dessous devrait afficher l'application dans votre langue :

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/fr/screenshot.png)

---

## Règles horizontales et sauts de ligne

Une règle horizontale (`---`) est un élément structurel et n'est pas traduite.

Le contenu au-dessus et en dessous est traité comme des segments séparés, offrant ainsi au modèle linguistique des fenêtres de contexte plus claires.
