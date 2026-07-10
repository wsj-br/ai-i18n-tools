<a id="cli-reference"></a>
# Référence de la CLI

Exécutez `ai-i18n-tools <command> --help` pour chaque indicateur de commande. Les pages de groupe ci-dessous ajoutent un contexte, des options clés et des liens vers des guides de sujet.

<a id="command-overview"></a>
## Présentation des commandes

<a id="setupsetup"></a>
### [Configuration](setup)

| Commande | Résumé |
|---------|---------|
| [`version`](setup#version) | Affiche la version et l'horodatage de construction de la CLI. |
| [`init`](setup#init) | Écrivez une configuration de démarrage ; `-t` sélectionne un modèle d'armature. |

<a id="models--catalogmodels"></a>
### [Modèles et catalogue](models)

| Commande | Résumé |
|---------|---------|
| [`check-models`](models#check-models) | Valide les identifiants de modèle configurés par rapport au fournisseur actif. |
| [`list-models`](models#list-models) | Liste les modèles annoncés par le fournisseur actif. |
| [`bench-models`](models#bench-models) | Benchmark des modèles configurés sur un échantillon de traduction. |
| [`list-languages`](models#list-languages) | Liste le catalogue des langues d'interface utilisateur intégrées. |

<a id="ui-stringsui-strings"></a>
### [Chaînes d'interface utilisateur](ui-strings)

| Commande | Résumé |
|---------|---------|
| [`extract`](ui-strings#extract) | Met à jour `strings.json` à partir de littéraux source et de marqueurs HTML. |
| [`mark-html`](ui-strings#mark-html) | Insère des marqueurs `data-i18n*` dans les fichiers HTML. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | Écrit `ui-languages.json` à partir de locales de configuration. |
| [`translate-ui`](ui-strings#translate-ui) | Traduit les chaînes d'interface utilisateur (`strings.json` → JSON de locale). |
| [`sync-ui`](ui-strings#sync-ui) | Extrait, puis traduit les chaînes d'interface utilisateur. |
| [`proofread-ui`](ui-strings#proofread-ui) | Extrait, puis examine les chaînes d'interface utilisateur de la locale source à l'aide d'un LLM. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | Exporte `strings.json` vers XLIFF 2.0. |

<a id="documentsdocuments"></a>
### [Documents](documents)

| Commande | Résumé |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Traduit le markdown, le MDX, `.astro` et les catalogues de framework. |
| [`write-heading-ids`](documents#write-heading-ids) | Insère des lignes d'ancre HTML avant les en-têtes ATX. |
| [`check-markdown`](documents#check-markdown) | Analyse le markdown/MDX pour les problèmes de délimiteur et d'accentuation. |

<a id="other-contentcontent"></a>
### [Autre contenu](content)

| Commande | Résumé |
|---------|---------|
| [`translate-json`](content#translate-json) | Traduit le JSON imbriqué par blocs de configuration `json[]`. |
| [`translate-svg`](content#translate-svg) | Traduit les fichiers SVG configurés dans `config.svg`. |

<a id="workflows--statusworkflows"></a>
### [Workflows et statut](workflows)

| Commande | Résumé |
|---------|---------|
| [`sync`](workflows#sync) | Exécute l'extraction + l'interface utilisateur + le SVG + les documents + le JSON dans un seul pipeline. |
| [`status`](workflows#status) | Affiche la couverture des traductions de l'interface utilisateur, de la documentation et du JSON. |
| [`statistics`](workflows#statistics) | Affiche les statistiques du cache et de `strings.json`. |

<a id="cache--maintenancemaintenance"></a>
### [Cache et maintenance](maintenance)

| Commande | Résumé |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | Élimine les lignes de cache obsolètes et repeuple les problèmes de markdown. |
| [`clean-temp`](maintenance#clean-temp) | Trouve et supprime les sauvegardes `*.log`, `*.tmp` et du cache. |
| [`purge-locale`](maintenance#purge-locale) | Supprime les lignes de cache et les artefacts générés pour les paramètres régionaux. |

<a id="toolstools"></a>
### [Outils](tools)

| Commande | Résumé |
|---------|---------|
| [`dashboard`](tools#dashboard) | Lance l'interface utilisateur web du tableau de bord de traduction. |
| [`glossary-generate`](tools#glossary-generate) | Écrit un modèle `glossary-user.csv` vide. |
| [`help`](tools#help) | Affiche l'aide pour une sous-commande. |

<a id="synopsis"></a>
## Synopsis

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### Options racine et globales

| Option                       | Portée         | Description                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Programme racine  | Affiche le numéro de version et l'horodatage de compilation (même information que la sous-commande `version`). |
| `-h` / `--help`              | Programme racine  | Affiche l'aide pour le programme racine ou pour une sous-commande lorsqu'utilisé avec un nom de commande.      |
| `-c` / `--config <path>`     | Chaque commande | Chemin du fichier de configuration (par défaut : `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Chaque commande | Journalisation détaillée.                                                                          |
| `-P` / `--provider <name>`   | Chaque commande | Fournisseur LLM actif pour cette exécution ; remplace la clé de configuration `provider`. Doit être configuré sous `providers`. |
| `-L` / `--ui-lang <code>` | Chaque commande | Langue de l'interface utilisateur de l'outil (aide CLI, journaux/résumés, tableau de bord) ; source la plus prioritaire. Voir [Langue de l'interface utilisateur de l'outil](/guide/tool-ui-language). |
| `-w` / `--write-logs [path]` | Commandes sélectionnées | Affiche la sortie de la console dans un fichier `.log` (chemin par défaut : sous la racine `cacheDir`). Câblé uniquement pour `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync` et `cleanup`. |

<a id="per-command-help"></a>
### Aide par commande

| Utilisation                            | Description                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Toutes les options pour cette commande.      |
| `ai-i18n-tools help <command>`   | Même sortie que `<command> --help`. |

<a id="target-locales--l----locale"></a>
### Paramètres régionaux cibles (`-l` / `--locale`)

| Commandes | Comportement |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — codes BCP-47 cibles séparés par des virgules (par exemple, `de,fr,pt-BR`). Si omis, les valeurs par défaut proviennent de la configuration (les blocs `json[]` peuvent également définir `targetLocales` par bloc ; les étapes de l’interface utilisateur utilisent `targetLocales` moins `sourceLocale`). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — locale source unique à examiner (par défaut : configuration `sourceLocale`).                                                            |
