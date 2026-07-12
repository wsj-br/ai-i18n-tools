<a id="json"></a>
# JSON

Conçu pour les projets qui conservent le texte de l'interface utilisateur dans des **fichiers JSON imbriqués par paramètres régionaux** (par exemple `src/i18n/en/translation.json`) au lieu de `t("…")` dans le code source. L'interface de ligne de commande parcourt les valeurs de chaîne dans ces fichiers, les traduit via le fournisseur LLM actif et écrit les sorties par paramètres régionaux à l'aide de `json[].outputPathTemplate`. Elle utilise le même cache SQLite que `translate-docs` et `translate-svg` (`cacheDir`).

Ce pipeline n'exécute **pas** `extract` — il n'y a pas de catalogue `strings.json`. Activez-le avec `features.translateJson` et une ou plusieurs entrées dans le `json[]` de niveau supérieur.

<a id="per-locale-model-overrides"></a>
### Substitutions de modèle par locale

`translate-json` résout les modèles **par locale cible** : `localeModels(locale)` en premier lorsqu'il est configuré, puis `translationModels`. Utilisez ceci pour les bundles JSON imbriqués où certaines locales bénéficient de modèles dédiés — par exemple les fichiers de thème `zh-Hans` / `zh-Hant`. Voir [Fournisseurs et modèles](/fr/guide/providers-and-models#model-fallback-chain).

<a id="step-1-initialise-for-nested-json"></a>
### Étape 1 : Initialiser pour JSON imbriqué

```bash
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
```

Ce modèle définit `features.translateJson: true`, désactive l'extraction de l'interface utilisateur et la traduction de documents, et échafaude un seul bloc `json[]` pointant vers `src/i18n/en/translation.json` avec la sortie `src/i18n/{llocale}/translation.json`. Il inclut également un bloc `provider` / `providers` par défaut (`openrouter` sauf si vous passez `-P <provider>`) — définissez la clé API correspondante (ou utilisez Ollama local) avant d'exécuter `translate-json` ou `sync` ; voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key). Modifiez `sourceLocale`, `targetLocales`, `contentPaths` et `outputPathTemplate` pour la disposition de votre dépôt.

<a id="step-2-configure-json"></a>
### Étape 2 : Configurer `json[]`

Chaque bloc `json[]` décrit un pipeline :

- `contentPaths` — un ou plusieurs fichiers `.json`, répertoires ou motifs génériques (par exemple `"src/i18n/en/translation.json"` ou `"src/i18n/en/overrides/*.json"`). Les chemins sont résolus à partir de la racine du projet.
- `outputPathTemplate` — obligatoire. Emplacement où écrire chaque fichier de langue cible. Variables disponibles : `{locale}`, `{LOCALE}`, `{llocale}` (code langue en minuscules, utile pour les dossiers de routes Astro), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (facultatif) — sous-ensemble spécifique à ce bloc uniquement ; sinon, le `targetLocales` racine s'applique.
- `keyPolicy` — indique quelles clés JSON contiennent du texte traduisible par rapport aux identifiants stables (voir ci-dessous).
- `description` (facultatif) — affiché dans les en-têtes CLI et dans la sortie `status`.

Exemple (plusieurs fichiers sources, dossiers de langue en minuscules) :

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Comportement |
|-------------|-----------|
| `allowlist` | Seules les clés correspondant à `translateKeys` (chemins avec points ; motifs minimatch) sont traduites. |
| `denylist`  | Traduit toutes les valeurs de type chaîne, sauf les clés correspondant à `skipKeys`. |
| `both`      | Applique d'abord `translateKeys`, puis retire les correspondances de `skipKeys`. |

Les chemins utilisent la notation par points (`nav.home.label`). Un nom simple comme `slug` correspond au segment final de la clé, à n'importe quelle profondeur.

<a id="step-3-translate-json-bundles"></a>
### Étape 3 : Traduire les bundles JSON

```bash
ai-i18n-tools translate-json
```

Options facultatives (mêmes principes que `translate-docs`) : `-l` / `--locale` pour un sous-ensemble de cibles, `-p` / `--path` pour limiter les fichiers, `--dry-run`, `--force` (efface le suivi des fichiers et le cache de segments pour les fichiers correspondants), `--force-update` (re-traite si le hachage du fichier correspond ; le cache de segments s'applique toujours), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Les projets uniquement JSON peuvent exécuter :

```bash
ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Lorsque l'interface ou la documentation sont également activées, `sync` exécute **translate-json après translate-docs** (sauf si `--no-json`). Ignorez la traduction JSON avec `--no-json`.

Vérifiez la couverture par fichier et par langue :

```bash
ai-i18n-tools status
```

Lorsque `translateJson` est activé, `status` affiche une section `json[]` (✓ à jour, ● périmée ou manquante).

<a id="json-vs-other-pipelines"></a>
### JSON vs autres pipelines

| Situation | Utilisation |
|-----------|-------------|
| Chaînes d'interface utilisateur dans `t("…")` / `i18n.t("…")` en JS/TS/Astro | [Chaînes d'interface utilisateur](/fr/guide/ui-strings/) — `extract` + `translate-ui` |
| Catalogue Docusaurus `write-translations` (`{ "key": { "message": "…", "description": "…" } }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs`, **pas** `json[]` |
| Chaînes de thème/nav/barre latérale VitePress | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs`; **n'utilisez pas** `json[]` — voir [Intégration VitePress](/fr/guide/integrations/vitepress) |
| Étiquettes Nextra `_meta.ts` et dictionnaire de thème `.ts` | Documents — `translate-docs` (auto `_meta` lorsque `style: "nextra"`, facultatif `nextraDictionaryPath`); **n'utilisez pas** `json[]` — voir [Intégration Nextra](/fr/guide/integrations/nextra) |
| Étiquettes Fumadocs `meta.json` et catalogue de substitutions d'interface | Documents — `translate-docs` (auto `meta.json` lorsque `style: "fumadocs"`, facultatif `fumadocsUiCatalog`); **n'utilisez pas** `json[]` — voir [Intégration Fumadocs](/fr/guide/integrations/fumadocs) |
| JSON de locale imbriquée autonome (arborescences `translation.json` de style ZenBrowser) | JSON — `json[]` + `translate-json` |
| Fichiers `.svg` illustrés avec `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](/fr/reference/configuration#svg) + `translate-svg` (facultatif ; pas l'un des trois pipelines principaux) |

Référence de champ : [`json`](#json) dans [Référence de configuration](/fr/reference/configuration#json). Les clés de cache pour le nettoyage utilisent `json-block:{blockIndex}:{projectRelPath}` dans `file_tracking`.
