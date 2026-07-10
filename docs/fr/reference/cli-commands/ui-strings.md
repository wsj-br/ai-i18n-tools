<a id="cli--ui-strings"></a>
# CLI — Chaînes d'interface utilisateur

<a id="extract"></a>
### `extract`

**Synopsis :** `ai-i18n-tools extract`

Met à jour `strings.json` à partir de littéraux `t("…")` / `i18n.t("…")`, d'une description `package.json` facultative et d'entrées `englishName` groupées facultatives lorsque `includeUiLanguageEnglishNames` est activé (voir `ui.uiExtractor` ; ne lit pas `languagesManifestPath`). Régénère également `ui-languages.json` à `languagesManifestPath`. Lorsque `.html` / `.htm` sont répertoriés dans `ui.uiExtractor.extensions`, capture également les chaînes de marqueur `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` à partir du HTML. Nécessite un `ui.sourceRoots` non vide. N'appelle pas de LLM.

**Voir aussi :** [Présentation des chaînes d'interface utilisateur](/fr/guide/ui-strings/), [Applications HTML simples](/fr/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**Synopsis :** `ai-i18n-tools mark-html [paths...] [--write]`

Insère des marqueurs `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` bruts dans le HTML afin que le texte source soit écrit une seule fois (sur l'élément lui-même). Analyse les fichiers/répertoires/globs donnés (par défaut : `.html` / `.htm` sous `ui.sourceRoots`). Exécution à blanc par défaut (signale le nombre d'ajouts par fichier et les éléments à contenu mixte qui nécessitent un `<span data-i18n>` manuel) ; `--write` applique les modifications. Idempotent, respecte `data-i18n-ignore` (ignore l'élément et son sous-arbre), ne touche jamais les éléments de type code (`code`, `pre`, `kbd`, `samp`, `var`) ou le texte vide/numérique uniquement, et n'émet jamais de marqueur valorisé. N'appelle pas de LLM.

**Options clés :** `--write`

**Voir aussi :** [Marquage HTML pour la traduction](/fr/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**Synopsis :** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

Écrit `ui-languages.json` dans `languagesManifestPath` (par défaut `{ui.flatOutputDir}/ui-languages.json`) en utilisant `sourceLocale` + `targetLocales` et le `data/ui-languages-complete.json` groupé (ou `--master`). Avertit et émet des espaces réservés `TODO` pour les locales manquantes dans le fichier maître. Si vous avez un manifeste existant avec des valeurs `label` ou `englishName` personnalisées, elles seront remplacées par les valeurs par défaut du catalogue maître — examinez et ajustez le fichier généré par la suite.

**Options clés :** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**Synopsis :** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Traduit uniquement les chaînes d'interface utilisateur (`strings.json` → JSON de locale). Nécessite `features.translateUIStrings`.

**Options clés :** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale` : locales cibles séparées par des virgules (par défaut : config `targetLocales` moins `sourceLocale`). `--force` : retraduit toutes les entrées par locale (ignore les traductions existantes). `--dry-run` : pas d'écritures, pas d'appels API.

---

<a id="sync-ui"></a>
### `sync-ui`

**Synopsis :** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

Extrait, puis traduit les chaînes d’interface utilisateur (nécessite `features.translateUIStrings`). Interface utilisateur uniquement — pas de documentation, de SVG ou de `json[]`. Mêmes options `-l`, `--force`, `--dry-run` et `-j` que `translate-ui`.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**Synopsis :** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

Exécute d’abord `extract` (nécessite `features.translateUIStrings`) pour que `strings.json` corresponde à la source, puis une révision LLM des chaînes d’interface utilisateur de la locale source (orthographe, grammaire). Les indications terminologiques proviennent uniquement du CSV `glossary.userGlossary` (même portée que `translate-ui` — pas `strings.json` / `uiGlossary`, donc une mauvaise copie n’est pas renforcée en tant que glossaire). Utilise le fournisseur LLM actif (sa variable d’environnement de clé API).

Quitte avec le code **1** en cas d’échec (indicateur de fonctionnalité manquant, échec d’extraction, catalogue manquant/non valide, clé API manquante ou échec de tous les lots) ; quitte avec le code **0** lorsque l’exécution se termine avec succès (les résultats sont consultatifs). Écrit `proofread-ui-results_<timestamp>.log` sous `cacheDir` en tant que rapport lisible par l’homme (résumé, problèmes et lignes OK par chaîne) ; le terminal n’imprime que les totaux récapitulatifs et les problèmes (pas de lignes `[ok]` par chaîne). Imprime le nom du fichier journal sur la dernière ligne. Avec `--json`, la sortie de style humain va vers stderr. Les liens utilisent `path:line` comme le bouton de lien des chaînes d’interface utilisateur du tableau de bord.

**Options clés :** `-l` / `--locale`, `--chunk` (par défaut **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**Synopsis :** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

Exporte `strings.json` vers XLIFF 2.0 (un `.xliff` par locale cible). Lecture seule ; pas d’API.

**Options clés :** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir` : répertoire de sortie (par défaut : même dossier que le catalogue). `--untranslated-only` : uniquement les unités pour lesquelles il manque une traduction pour cette locale.
