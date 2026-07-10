<a id="cli--setup"></a>
# CLI — Configuration

<a id="version"></a>
### `version`

**Synopsis :** `ai-i18n-tools version`

Affiche la version de la CLI et l'horodatage de la compilation (les mêmes informations que `-V` / `--version` sur le programme racine).

---

<a id="init"></a>
### `init`

**Synopsis :** `ai-i18n-tools init [-t <template>] [-o <path>] [--with-translate-ignore]`

Écrivez un fichier de configuration de démarrage (inclut `provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `docs[].addFrontmatter`). Les commandes de traduction qui appellent un LLM nécessitent la clé API du fournisseur actif dans l'environnement ou `.env` (sauf Ollama) — voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).

**Options clés :** `-t` / `--template`, `-o` / `--output`, `--with-translate-ignore`

**Modèles (`-t`) :**

| Valeur | Échafaudages |
|-------|-----------|
| `ui-markdown` | Flux de travail des chaînes d'interface utilisateur Markdown |
| `ui-docusaurus` | Interface utilisateur Docusaurus + documents |
| `ui-starlight` | Documents Starlight |
| `ui-vitepress` | Documents VitePress (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` pour les chaînes de thème |
| `ui-nextra` | Documents Nextra (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` pour le dictionnaire de thème (la barre latérale `_meta.ts` est collectée automatiquement) |
| `ui-fumadocs` | Documents Fumadocs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` pour les remplacements d'interface utilisateur (la barre latérale `meta.json` est collectée automatiquement) |
| `ui-astro-website` | Chaînes d'interface utilisateur de site Web Astro |
| `ui-json-bundles` | JSON (`json[]` uniquement) |

`--with-translate-ignore` crée un `.translate-ignore` de démarrage.
