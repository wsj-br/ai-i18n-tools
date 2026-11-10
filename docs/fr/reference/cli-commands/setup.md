<a id="cli--getting-started"></a>
# CLI — Premiers pas

<a id="version"></a>
### `version`

**Synopsis :** `ai-i18n-tools version`

Affiche la version de la CLI et l'horodatage de la compilation (les mêmes informations que `-V` / `--version` sur le programme racine).

---

<a id="upgrade"></a>
### `upgrade`

**Synopsis :** `ai-i18n-tools upgrade [--yes]`

Met à niveau l'installation en cours d'exécution vers la dernière version publiée. La commande affiche la version installée et la nouvelle version, puis attend `y`. `--yes` répond à l'invite, y compris lorsque l'entrée standard n'est pas un terminal. Toute autre réponse laisse l'installation inchangée. Une entrée standard non interactive sans `--yes` se termine par une erreur et ne modifie rien. Lorsque l'installation est déjà à jour, ou plus récente que la version publiée, la commande l'affiche et ne demande pas de confirmation.

Une installation Node.js lit le dist-tag `latest` depuis le registre npm. Une dépendance de projet est mise à jour dans `package.json` (l'opérateur existant `^`, `~`, ou exact est conservé) et installée avec npm, pnpm, yarn ou bun, choisi à partir du champ `packageManager` ou du fichier de verrouillage. Une installation globale de Node.js exécute l'installation globale de ce gestionnaire de paquets et ne modifie pas de `package.json` dans le répertoire actuel. `workspace:`, `file:`, `link:` et les spécificateurs git sont laissés inchangés et la commande s'arrête. Un checkout de la source de ce dépôt est refusé.

Un exécutable autonome lit la dernière version GitHub, télécharge l'archive gzip pour le système d'exploitation et l'architecture actuels, vérifie `SHA256SUMS.txt` et remplace le fichier en cours d'exécution. Les archives publiées sont Linux x64, Linux arm64, macOS arm64, macOS x64 et Windows x64.

```bash
ai-i18n-tools upgrade
ai-i18n-tools upgrade --yes
```

---

<a id="init"></a>
### `init`

**Synopsis :** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Écrivez un fichier de configuration de démarrage (inclut `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` et `docs[].addFrontmatter`). Les commandes de traduction qui appellent un LLM nécessitent la clé API du fournisseur actif dans l'environnement ou `.env` (sauf Ollama) — voir [Fournisseur et clé API](/fr/guide/quick-start#provider-and-api-key).

**Options clés :** `-P` / `--provider` (obligatoire), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` est requis. Il sélectionne le **préréglage intégré** à générer. Doit être l'une des valeurs suivantes : `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`.

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
| `ui-dotnet` | Chaînes d'IU .NET, JSON plat indexé par la chaîne de la langue source, et `I18n.cs` |
| `ui-dotnet-resx` | Chaînes d'IU .NET en tant que satellites `.resx` (`flatOutput: false`) et `I18nResx.cs` |

`--with-readme` ajoute un bloc de documentation `README.md` (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, un `languageListBlock`) et définit `features.translateDocs` à true. Il ne fait rien si un bloc de documentation liste déjà `README.md`, ce qui est le cas pour `ui-markdown` et `docs-markdown`. Il écrit uniquement la configuration. Il affiche la ligne de marqueur à coller dans `README.md` et avertit si ce fichier est manquant. Guide : [Ajouter l'i18n à vos fichiers README et documentation Markdown](/fr/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` crée un `.translate-ignore` de démarrage (incluant les répertoires virtualenv Python et de cache).

`init` crée également `.gitignore` dans le répertoire de travail, ou y ajoute du contenu. Les lignes ajoutées sont `.translation-cache/*`, `!.translation-cache/cache.db`, `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` et `*.backup.*`, chacune sous un court commentaire. Les lignes déjà présentes sont laissées telles quelles, et une deuxième exécution ne les duplique pas.

`ui-python`, `ui-python-gettext` et `ui-python-flask` écrivent également `i18n.py` lorsque ce fichier est manquant. Les projets Django conservent leur propre environnement d'exécution gettext de Django, donc `ui-python-django` n'écrit pas `i18n.py`. `ui-dotnet` écrit `I18n.cs` lorsque ce fichier est manquant et affiche l'élément `EmbeddedResource` à ajouter au `.csproj`. `ui-dotnet-resx` écrit `I18nResx.cs` à la place et pointe `ui.resx` vers `Resources/SharedResource.<culture>.resx`. `--namespace` outrepasse l'espace de noms C#. Guide : [Applications .NET](/fr/guide/ui-strings/dotnet) et [Ajouter l'i18n à une application .NET ResourceManager](/fr/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n` réécrit les appels pré-évalués non sécurisés (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) en appels de recherche avant formatage. La valeur par défaut est une exécution à blanc. Passez `--write` pour modifier les fichiers, et lisez `migrate-python-i18n-report.md` pour les notes de révision. Une expression complexe est nommée d'après l'expression lorsqu'elle est stable (`start.isoformat()` devient `{start}`, `len(rows)` devient `{rows_count}`). Un `{value_1}` restant est signalé afin qu'il puisse être renommé. Les fichiers `i18n.py` générés sont ignorés. Un rapport propre ne signifie pas que les f-strings non encapsulées ont été couvertes.

`migrate-dotnet-i18n` fait de même pour `T($"...")`, la concaténation et `string.Format` à l'intérieur de `T()`. `--wrap` marque également les étiquettes XAML non marquées et les puits C# à haute confiance ; sans `--write`, cela constitue un audit. Le rapport est `migrate-dotnet-i18n-report.md`. Les `I18n.cs` et `I18nResx.cs` générés sont ignorés. Guide : [Applications .NET](/fr/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**Synopsis :** `ai-i18n-tools doctor [--local] [--strict] [--json] [--fix-gitignore]`

Vérifiez que le projet est prêt à être traduit. Le rapport couvre la syntaxe et le schéma de configuration, les règles métier, la version installée, les chemins source et de sortie, les fichiers de catalogue d'IU, les incohérences de marqueurs de position dans ces catalogues, les statistiques de cache, les fournisseurs configurés, les variables d'environnement prises en charge qui sont définies, et les ID de modèle. Un catalogue avec un marqueur de position renommé, supprimé ou réécrit est un avertissement et cite un exemple.

Par défaut, `doctor` vérifie également les identifiants de modèle configurés par rapport au catalogue du fournisseur actif et compare la version installée avec la dernière version de GitHub. `--local` ignore les deux appels réseau. Une version plus récente, ou une requête GitHub qui échoue, est un avertissement. Un identifiant de modèle manquant ou expiré fait échouer la commande. `--strict` se termine par une erreur lorsqu'une vérification émet un avertissement.

Les valeurs des clés API ne sont jamais affichées. Les variables définies sont listées par ordre alphabétique comme `Configured variables: NAME, ...`. Une variable qui n'est pas une clé API inclut sa valeur.

Les chemins d'entrée manquants échouent. Les répertoires de sortie manquants sont une remarque, car la première exécution de la traduction les crée. `doctor` ne réécrit pas la configuration, ne crée pas de répertoires et n'envoie pas le texte source à un modèle. `--fix-gitignore` ajoute les lignes `.gitignore` manquantes et laisse tous les autres fichiers intacts.

`doctor` avertit lorsque `.gitignore` à côté de la configuration ne contient pas un modèle requis. L'avertissement vous indique d'exécuter `ai-i18n-tools doctor --fix-gitignore`. Lorsque `.gitignore` existe déjà, cela ajoute une ligne vide, le commentaire `# ai-i18n-tools doctor fix`, et uniquement les lignes manquantes. Cela ne duplique pas les lignes déjà présentes. Un fichier manquant est créé avec le même bloc que `init` écrit. Les deux modèles de cache suivent la `cacheDir` configurée, donc `.i18n-cache` a besoin de `.i18n-cache/*` et `!.i18n-cache/cache.db` plutôt que des lignes `.translation-cache` par défaut. Les autres modèles sont `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` et `*.backup.*`. Une ligne qui ignore le répertoire de cache lui-même, telle que `.i18n-cache/`, est également un avertissement, car Git ne suivra pas `cache.db` sous un répertoire ignoré. `--fix-gitignore` ne supprime pas cette ligne. L'avertissement fait échouer la commande uniquement avec `--strict`.

**Options clés :** `--local`, `--strict`, `--json`, `--fix-gitignore`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
ai-i18n-tools doctor --fix-gitignore
```

---

<a id="help"></a>
### `help`

**Synopsis :** `ai-i18n-tools help [command]`

Affiche l'aide pour une sous-commande (même sortie que `ai-i18n-tools <command> --help`).
