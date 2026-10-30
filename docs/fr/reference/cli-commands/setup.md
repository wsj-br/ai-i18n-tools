<a id="cli--getting-started"></a>
# CLI — Premiers pas

<a id="version"></a>
### `version`

**Synopsis :** `ai-i18n-tools version`

Affiche la version de la CLI et l'horodatage de la compilation (les mêmes informations que `-V` / `--version` sur le programme racine).

---

<a id="init"></a>
### `init`

**Synopsis :** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Écrivez un fichier de configuration de démarrage (inclut `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `docs[].addFrontmatter`). Les commandes de traduction qui appellent un LLM nécessitent la clé API du fournisseur actif dans l'environnement ou `.env` (sauf Ollama) — voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).

**Options clés :** `-P` / `--provider` (obligatoire), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` est obligatoire. Il sélectionne le **préréglage intégré** à échafauder. Doit être l'un des suivants : `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`.

**Modèles (`-t`) :**

| Valeur | Génère |
|-------|-----------|
| `ui-markdown` | Chaînes d'IU plus README (sortie à plat, liste de langues) |
| `ui-docusaurus` | Interface utilisateur Docusaurus + documents |
| `ui-starlight` | Documents Starlight |
| `ui-vitepress` | Documents VitePress (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` pour les chaînes de thème |
| `ui-nextra` | Documents Nextra (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` pour le dictionnaire de thème (la barre latérale `_meta.ts` est collectée automatiquement) |
| `ui-fumadocs` | Documents Fumadocs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` pour les remplacements d'interface utilisateur (la barre latérale `meta.json` est collectée automatiquement) |
| `ui-astro-website` | Chaînes d'interface utilisateur de site Web Astro |
| `ui-plain-html` | Catalogue HTML simple (marqueurs `data-i18n*`, JSON plat des locales) |
| `docs-plain-html` | Documents HTML simples (un fichier par locale, liste des langues, hreflang) |
| `docs-markdown` | Documentation Markdown : fichiers README et `.md`, sortie à plat, liste de langues |
| `ui-json-bundles` | JSON (`json[]` uniquement) |
| `ui-python` | Chaînes d'IU Python, JSON à plat indexé par la chaîne de la langue source, et `i18n.py` |
| `ui-python-gettext` | Chaînes d'interface utilisateur Python avec JSON plat et `.po` / `.mo` GNU, plus `i18n.py` |
| `ui-python-django` | Catalogues `gettext` / `{% blocktrans %}` Django (`flatOutput: false`, domaine `django`, sans `i18n.py`) |
| `ui-python-flask` | Catalogues Flask / Jinja sous `translations/` (`flatOutput: false`) plus `i18n.py` |

`--with-readme` ajoute un bloc de documentation `README.md` (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, un `languageListBlock`) et définit `features.translateDocs` à true. Il ne fait rien si un bloc de documentation liste déjà `README.md`, ce qui est le cas pour `ui-markdown` et `docs-markdown`. Il écrit uniquement la configuration. Il affiche la ligne de marqueur à coller dans `README.md` et avertit si ce fichier est manquant. Guide : [Ajouter l'i18n à vos fichiers README et documentation Markdown](/fr/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` crée un `.translate-ignore` de démarrage (incluant les répertoires virtualenv Python et de cache).

`ui-python`, `ui-python-gettext` et `ui-python-flask` écrivent également `i18n.py` lorsque ce fichier est manquant. Les projets Django conservent le runtime gettext propre à Django, donc `ui-python-django` n'écrit pas `i18n.py`.

`migrate-python-i18n` réécrit les appels pré-évalués non sécurisés (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) en appels de recherche avant formatage. Le comportement par défaut est une simulation (dry run). Passez `--write` pour modifier les fichiers, et consultez `migrate-python-i18n-report.md` pour les notes de révision. Les fichiers `i18n.py` générés sont ignorés.

---

<a id="doctor"></a>
### `help`

**Synopsis :** `ai-i18n-tools help [command]`

Affiche l'aide pour une sous-commande (même sortie que `ai-i18n-tools <command> --help`).
