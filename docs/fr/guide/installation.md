<a id="installation"></a>
# Installation

Le package publié est uniquement **ESM**. Utilisez `import`/`import()` dans Node.js ou votre outil de regroupement, et non `require('ai-i18n-tools')`. Le package déclare `engines.node` `>=22.16.0` ; les anciennes versions de Node.js ne sont pas prises en charge. L'archive tar de npm inclut uniquement les fichiers en anglais sous `docs/` ; les copies spécifiques aux paramètres régionaux situées sous `translated-docs/` se trouvent dans le [dépôt GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### Exécutables autonomes

Les versions GitHub incluent une build Node.js en exécutable unique. Les projets Python exécutent l'interface de ligne de commande (CLI) à partir de ce binaire, y compris `extract`, `translate-ui` et `suggest-models`, sans installation de Node.js.

| Plateforme | Asset |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

Chaque version inclut également `SHA256SUMS.txt` et `ai-i18n-tools-python-examples.zip` (les quatre exemples Python). L'archive npm et l'exécutable ne contiennent pas ces exemples. Ils restent également dans le dépôt.

1. Téléchargez l'asset correspondant à votre machine depuis la page [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases).
2. Vérifiez la somme de contrôle par rapport à `SHA256SUMS.txt`.
3. Sur Linux et macOS, exécutez `chmod +x` sur le fichier et déplacez-le vers `PATH` (ou appelez-le par son chemin d'accès).
4. Sur Windows, placez `ai-i18n-tools-win-x64.exe` dans `PATH`. Le renommer en `ai-i18n-tools.exe` permet de conserver le même nom de commande que sur les autres plateformes.

Les binaires ne sont ni notariés ni signés avec Authenticode. macOS peut vous demander d'approuver un programme non signé. Windows SmartScreen peut afficher un avertissement.

Définissez la clé API pour le fournisseur actif de la même manière qu'une installation npm (variable d'environnement ou fichier `.env` dans le répertoire de travail). La liste des modèles issue de `init` constitue un point de départ. `suggest-models` affiche une liste restreinte classée. `suggest-models --apply` l'écrit dans `translationModels`. Le même classement est disponible sur l'onglet [Models](/fr/guide/translation-dashboard/models).

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Procédure pas à pas : [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Référence des commandes : [suggest-models](/fr/reference/cli-commands/models#suggest-models).

ai-i18n-tools inclut son propre extracteur de chaînes. Si vous utilisiez précédemment `i18next-scanner`, `babel-plugin-i18next-extract` ou similaire, vous pouvez supprimer ces dépendances de développement après la migration. Les fichiers **JSON de namespace** i18next existants peuvent rester sur le [pipeline JSON](/fr/guide/json#i18next-namespace-files). Les dictionnaires Intlayer `.content.ts` peuvent être importés avec `migrate-intlayer` — voir [Migration depuis Intlayer](/fr/guide/migrating-from-intlayer).

<a id="using-the-cli"></a>
### Utilisation de l'interface en ligne de commande (CLI)

Installez `ai-i18n-tools` en tant que dépendance ou devDependency dans votre projet (voir [Installation](#installation) ci-dessus). Le package déclare une entrée `bin` que votre gestionnaire de packages lie à `node_modules/.bin/ai-i18n-tools`. Ce shim (`bin/ai-i18n-tools.mjs` à l'intérieur du package installé) charge l'interface de ligne de commande compilée.

Pour taper la commande simple `ai-i18n-tools` dans un shell interactif, configurez l'une des options ci-dessous. Sans configuration, le shell ne peut pas trouver le binaire même après une installation locale.

**direnv** — à ajouter à un `.envrc` à la racine du projet (bash/zsh ; voir [direnv.net](https://direnv.net/)) :

```bash
PATH_add node_modules/.bin
```

Après `direnv allow`, la commande simple est disponible chaque fois que vous `cd` dans le projet.

**Chemin d'accès manuel** — exécutez ces commandes depuis la **racine du projet** (le répertoire qui contient `node_modules/.bin`). Les sous-répertoires continuent de fonctionner par la suite tant que vous laissez cette entrée `PATH` en place ; relancer l'exportation depuis un dossier imbriqué échoue car `$PWD` ne pointe plus vers la racine du projet.

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Installation globale** — installez la CLI une fois et invoquez-la depuis n'importe quel répertoire :

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Avec pnpm, exécutez `pnpm setup` une fois par machine (et ouvrez un nouveau shell) si des commandes globales sont manquantes — pnpm nécessite son répertoire de binaires global sur `PATH`. Une installation globale utilise la version épinglée globalement. Pour l'épinglage de version par projet, préférez direnv ou le PATH manuel afin que `node_modules/.bin` se résolve à la dépendance du projet.

**`package.json` scripts** — lorsque npm ou pnpm exécute un script, il ajoute `node_modules/.bin` à `PATH`, de sorte que le nom de la commande fonctionne dans les scripts sans modifier le PATH du shell. Préférez `sync` plutôt que d'enchaîner manuellement les étapes de traduction — l'ordre et les indicateurs de fonctionnalité sont faciles à mal interpréter lorsqu'ils sont exécutés manuellement :

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Exécutez ensuite, par exemple, `pnpm run i18n:sync`. Consultez [Scripts `package.json` recommandés](/fr/guide/quick-start#recommended-packagejson-scripts) pour l'ensemble complet recommandé.

**Alternatives** — si vous préférez ne pas ajuster `PATH` : `npx ai-i18n-tools …` (npm) ou `pnpm exec ai-i18n-tools …` (pnpm). Pour une exécution unique sans installation et sans entrée `package.json` : `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Monorepo ai-i18n-tools cloné

Lors du développement du package ou de l'exécution des **exemples** de l'espace de travail à partir d'un clone complet de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) :

- **Exemples d'espace de travail** (`examples/console-app`, `examples/nextjs-app` et les autres paquets listés dans [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — exécutez `pnpm install` à la racine du dépôt, puis `cd examples/<name>`. Utilisez les scripts `pnpm run i18n:*` de l'exemple, ou configurez PATH (voir [Utilisation de la CLI](#using-the-cli)) et exécutez `ai-i18n-tools …` nu. Le lien [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) de l'espace de travail `ai-i18n-tools` vers votre copie locale.
- **Racine du dépôt** — pnpm ne lie pas les propres `bin` du paquet racine dans `node_modules/.bin`. Le `.envrc` de cette copie ajoute `bin/` à `PATH` afin que le wrapper `bin/ai-i18n-tools` commité (à côté du shim `bin/ai-i18n-tools.mjs` publié) fournisse la commande nue après `direnv allow`. Sans direnv, utilisez `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` ou les scripts `pnpm i18n:*` racine (ou un alias de shell / `pnpm add -g .` — voir [Guide de développement](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Fixtures autonomes** (`multi-provider`, `test-markdown`) — depuis le dossier de la fixture, utilisez `node ../../bin/ai-i18n-tools.mjs …`.

Exécutez `pnpm run build` à la racine du dépôt après avoir modifié la source de l'interface de ligne de commande. Consultez le [Guide de développement](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) pour les étapes de construction et les solutions de contournement facultatives pour l'installation globale.

Sous Linux, macOS et WSL, les installations depuis le registre définissent automatiquement le bit d'exécution sur le script CLI. Sous Windows, les gestionnaires de paquets génèrent des shim `.cmd` et `.ps1` qui invoquent explicitement Node.

Les commandes de traduction (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) nécessitent une **configuration du fournisseur** dans `ai-i18n-tools.config.json` et une **clé API** pour le fournisseur actif. Exécutez `ai-i18n-tools init -P <provider>` pour échafauder ce préréglage ; modifiez `provider` / `providers` pour ajouter des modèles — voir [Fournisseurs et modèles LLM](/fr/guide/providers-and-models). La liste des modèles de `init` est un point de départ. `ai-i18n-tools suggest-models` classe les modèles de chat du fournisseur actif, et `suggest-models --apply` remplace `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models). Référence de commande : [suggest-models](/fr/reference/cli-commands/models#suggest-models). Ollama est le seul préréglage intégré qui ne nécessite pas de clé API.

Définissez la clé API qui correspond au fournisseur que vous transmettez à `init` (voir le [tableau des préréglages](/fr/guide/providers-and-models#built-in-providers)) :

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Langue de l'interface utilisateur de l'outil

L'interface de ligne de commande (CLI) localise son propre texte d'aide, les résumés de journaux et le tableau de bord de traduction indépendamment des paramètres régionaux que vous traduisez. Par défaut, elle suit les paramètres régionaux de votre système d'exploitation. Vous pouvez les remplacer par `-L pt-BR`, `export AI_I18N_LANG=es` ou `"uiLanguage"` dans la configuration. Voir [Langue de l'interface utilisateur de l'outil](/fr/guide/tool-ui-language).
