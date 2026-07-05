<a id="ui-strings"></a>
# Chaînes d'interface utilisateur

Conçu pour tout projet JS/TS utilisant i18next : applications React, Next.js (composants client et serveur), services Node.js, outils CLI.

<a id="which-guide-to-read"></a>
## Quel guide lire

| Votre application | Lire la suite |
| --- | --- |
| React / Next.js / Node + i18next | [Connecter i18next](/guide/ui-strings/i18next-runtime) (Étape 4) |
| HTML simple (pas de `t()` dans le balisage) | [Applications HTML simples](/guide/ui-strings/plain-html) |
| Site marketing Astro (hybride) | [Site web Astro](/guide/ui-strings/astro-website) |
| Règles `t()`, interpolation, pluriels | [Appels t() et pluriels](/guide/ui-strings/t-calls-and-plurals) |
| Sélecteur de langue / RTL | [Sélecteur de langue et RTL](/guide/ui-strings/language-switcher) |
| Signatures d'API d'exécution | [Aides d'exécution](/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Étape 1 : Initialiser

```bash
npx ai-i18n-tools init
```

Cela écrit `ai-i18n-tools.config.json` avec le modèle `ui-markdown`. Modifiez-le pour définir :

- `sourceLocale` - code BCP-47 de votre langue source (par exemple `"en-GB"`). **Doit correspondre** à `SOURCE_LOCALE` exporté depuis votre fichier de configuration i18n au moment de l'exécution (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - tableau de codes BCP-47 pour vos langues cibles (par exemple `["de", "fr", "pt-BR"]`). Exécutez `generate-ui-languages` pour créer le manifeste `ui-languages.json` à partir de cette liste.
- `ui.sourceRoots` - répertoires ou motifs glob à analyser pour les appels `t("…")` (par exemple `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - emplacement où écrire le catalogue principal (par exemple `"src/locales/strings.json"`).
- `ui.flatOutputDir` - où écrire `de.json`, `pt-BR.json`, etc. (par ex. `"src/locales/"`).
- `ui.preferredModel` (facultatif) - ID de modèle à essayer **en premier** uniquement pour `translate-ui` ; en cas d'échec, la CLI continue avec la liste `translationModels` du fournisseur actif dans l'ordre, en ignorant les doublons.

<a id="step-2-extract-strings"></a>
## Étape 2 : Extraire les chaînes

```bash
npx ai-i18n-tools extract
```

Analyse tous les fichiers JS/TS situés dans `ui.sourceRoots` à la recherche des appels `t("literal")` et `i18n.t("literal")`. Écrit (ou fusionne dans) `ui.stringsJson`.

Le scanner est configurable : ajoutez des noms de fonctions personnalisés via `ui.uiExtractor.funcNames` (ou l'ancien `ui.reactExtractor.funcNames`). Pour les pages et composants Astro, ajoutez `.astro` à `ui.uiExtractor.extensions`. Pour le HTML simple, voir [Applications HTML simples](/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Étape 3 : Traduire les chaînes de l'interface utilisateur

```bash
npx ai-i18n-tools translate-ui
```

Lit `strings.json`, envoie des lots au fournisseur LLM actif pour chaque locale cible, écrit des fichiers JSON plats (`de.json`, `fr.json`, etc.) dans `ui.flatOutputDir`. Lorsque `ui.preferredModel` est défini, ce modèle est tenté avant la liste `translationModels` du fournisseur (la traduction de documents et d'autres commandes utilisent uniquement la liste du fournisseur).

Pour chaque entrée, `translate-ui` stocke l'**ID du modèle du fournisseur actif** qui a traduit avec succès chaque locale dans un objet `models` facultatif (mêmes clés de locale que `translated`). Les chaînes éditées dans le tableau de bord de traduction sont marquées avec la valeur sentinelle `user-edited` dans `models` pour cette locale. Les fichiers plats par locale sous `ui.flatOutputDir` restent uniquement **chaîne source → traduction** ; ils n'incluent pas `models` (ainsi les bundles d'exécution restent inchangés).

> **Remarque :** Les modifications du tableau de bord apportées aux chaînes de l'interface utilisateur se trouvent dans `strings.json`, et non dans le cache de documentation SQLite. Exécutez simplement `sync` ou `translate-ui` (sans indicateur spécial) pour réécrire les fichiers de locale plats à partir du catalogue — `--force-update` n'est **pas** transmis à l'étape de l'interface utilisateur. Évitez `--force` sur les commandes de l'interface utilisateur après des modifications manuelles : cela retraduit chaque entrée et peut écraser vos lignes `user-edited`.

Ensuite, connectez i18next à l'exécution — [Connecter i18next](/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exportation vers XLIFF 2.0 (facultatif)

Pour transmettre les chaînes d'interface à un prestataire de traduction, un système de gestion de la traduction (TMS) ou un outil CAT, exportez le catalogue au format **XLIFF 2.0** (un fichier par langue cible). Cette commande est **en lecture seule** : elle ne modifie pas `strings.json` ni n'appelle aucune API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Par défaut, les fichiers sont écrits à côté de `ui.stringsJson`, avec des noms comme `strings.de.xliff`, `strings.pt-BR.xliff` (nom de base de votre catalogue + langue + `.xliff`). Utilisez `-o` / `--output-dir` pour écrire ailleurs. Les traductions existantes provenant de `strings.json` apparaissent dans `<target>` ; les langues manquantes utilisent `state="initial"` sans `<target>`, afin que les outils puissent les compléter. Utilisez `--untranslated-only` pour n'exporter que les unités nécessitant encore une traduction pour chaque langue (pratique pour les lots envoyés aux prestataires). `--dry-run` affiche les chemins sans écrire les fichiers.
