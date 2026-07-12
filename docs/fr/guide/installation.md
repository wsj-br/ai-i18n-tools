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

ai-i18n-tools inclut son propre extracteur de chaînes. Si vous avez précédemment utilisé `i18next-scanner`, `babel-plugin-i18next-extract` ou des outils similaires, vous pouvez supprimer ces dépendances de développement après la migration.

<a id="using-the-cli"></a>
### Utilisation de l'interface en ligne de commande (CLI)

Installez `ai-i18n-tools` en tant que dépendance ou devDependency dans votre projet (voir [Installation](#installation) ci-dessus). Le package déclare une entrée `bin` que votre gestionnaire de packages lie à `node_modules/.bin/ai-i18n-tools`. Ce shim (`bin/ai-i18n-tools.mjs` à l'intérieur du package installé) charge l'interface de ligne de commande compilée.

Pour taper la commande simple `ai-i18n-tools` dans un shell interactif, configurez l'une des options ci-dessous. Sans configuration, le shell ne peut pas trouver le binaire même après une installation locale.

**direnv** — à ajouter à un `.envrc` à la racine du projet (bash/zsh ; voir [direnv.net](https://direnv.net/)) :

```bash
PATH_add node_modules/.bin
```

Après `direnv allow`, la commande simple est disponible chaque fois que vous `cd` dans le projet.

**PATH manuel** — depuis la racine du projet dans un shell interactif :

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Installation globale** — installez la CLI une fois et invoquez-la depuis n'importe quel répertoire :

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Une installation globale utilise la version épinglée globalement. Pour un épinglage de version par projet, préférez direnv ou PATH manuel afin que `node_modules/.bin` se résolve en dépendance du projet.

**Scripts `package.json`** — lorsque npm ou pnpm exécute un script, il ajoute `node_modules/.bin` à `PATH`, de sorte que le nom de la commande simple fonctionne dans les scripts sans modifications du PATH du shell :

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

Exécutez ensuite, par exemple, `pnpm run i18n:sync`.

**Alternatives** — si vous préférez ne pas ajuster `PATH` : `npx ai-i18n-tools …` (npm) ou `pnpm exec ai-i18n-tools …` (pnpm). Pour une exécution unique sans installation et sans entrée `package.json` : `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Monorepo ai-i18n-tools cloné

Lors du développement du package ou de l'exécution des **exemples** de l'espace de travail à partir d'un clone complet de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) :

- **Exemples d'espaces de travail** (`examples/console-app`, `examples/nextjs-app` et les autres paquets listés dans [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — exécutez `pnpm install` à la racine du dépôt, puis `cd examples/<name>`. Utilisez les scripts `pnpm run i18n:*` de l'exemple, ou configurez PATH (voir [Utilisation de la CLI](#using-the-cli)) et exécutez `ai-i18n-tools …` directement. Les liens [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) de l'espace de travail `ai-i18n-tools` vers votre copie locale.
- **Racine du dépôt** — pnpm ne lie pas les propres `bin` du paquet racine dans `node_modules/.bin`. Utilisez plutôt `node bin/ai-i18n-tools.mjs …` ou les scripts `pnpm i18n:*` de la racine (ou un alias de shell / `pnpm add -g .` — voir [Guide de développement](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Fixtures autonomes** (`multi-provider`, `test-markdown`) — depuis le dossier de la fixture, utilisez `node ../../bin/ai-i18n-tools.mjs …`.

Exécutez `pnpm run build` à la racine du dépôt après avoir modifié la source de l'interface de ligne de commande. Consultez le [Guide de développement](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) pour les étapes de construction et les solutions de contournement facultatives pour l'installation globale.

Sous Linux, macOS et WSL, les installations depuis le registre définissent automatiquement le bit d'exécution sur le script CLI. Sous Windows, les gestionnaires de paquets génèrent des shim `.cmd` et `.ps1` qui invoquent explicitement Node.

Les commandes de traduction (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) nécessitent une **configuration de fournisseur** dans `ai-i18n-tools.config.json` et **une clé API** pour le fournisseur actif. Exécutez `ai-i18n-tools init [-P <provider>]` pour échafauder un bloc de fournisseur par défaut (`openrouter` si omis) ; modifiez `provider` / `providers` pour changer les préréglages ou les modèles — voir [Fournisseurs et modèles LLM](/fr/guide/providers-and-models). Ollama est le seul préréglage intégré qui ne nécessite pas de clé API.

Définissez la clé API qui correspond à votre fournisseur actif (voir le [tableau des préréglages](/fr/guide/providers-and-models#built-in-providers)) :

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Langue de l'interface utilisateur de l'outil

L'interface de ligne de commande (CLI) localise son propre texte d'aide, les résumés de journaux et le tableau de bord de traduction indépendamment des paramètres régionaux que vous traduisez. Par défaut, elle suit les paramètres régionaux de votre système d'exploitation. Vous pouvez les remplacer par `-L pt-BR`, `export AI_I18N_LANG=es` ou `"uiLanguage"` dans la configuration. Voir [Langue de l'interface utilisateur de l'outil](/fr/guide/tool-ui-language).
