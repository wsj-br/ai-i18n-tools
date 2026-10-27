<a id="installation"></a>
# Installation

Cette page installe l'interface de ligne de commande (CLI) et fait fonctionner la commande `ai-i18n-tools` de base. Déjà installé ? Accédez au [Démarrage rapide](/fr/guide/quick-start).

Le package publié est uniquement ESM. Utilisez `import` ou `import()` dans Node.js ou votre bundler ; n'utilisez pas `require('ai-i18n-tools')`. Le package déclare `engines.node` `>=22.16.0` ; les versions plus anciennes de Node.js ne sont pas prises en charge. Le tarball npm inclut uniquement les fichiers anglais sous `docs/` ; les copies spécifiques à la locale sous `translated-docs/` se trouvent dans le [référentiel GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

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

Linux et macOS :

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell) :

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

L'installateur détecte le système, télécharge l'exécutable correspondant, vérifie `SHA256SUMS.txt`, installe la commande en tant que `ai-i18n-tools` (`ai-i18n-tools.exe` sur Windows) et ajoute le répertoire d'installation à `PATH`. Le répertoire par défaut est `~/.local/bin`. Ouvrez un nouveau terminal si la commande n'est pas encore trouvée. Définissez `AI_I18N_VERSION` (par exemple `v1.11.0`) pour épingler une version, ou `AI_I18N_INSTALL_DIR` pour choisir un autre répertoire.

Les binaires ne sont pas notarisés ou signés Authenticode. macOS peut vous demander d'approuver un programme non signé. Windows SmartScreen peut afficher un avertissement. L'installateur macOS efface l'indicateur de quarantaine après que la somme de contrôle corresponde.

Chaque version joint également `SHA256SUMS.txt`, `install.sh`, `install.ps1` et `ai-i18n-tools-python-examples.zip` (les quatre exemples Python). Le tarball npm et l'exécutable ne contiennent pas ces exemples. Ils restent également dans le référentiel.

<details>
<summary>Instructions manuelles pour installer l'exécutable <code>ai-i18n-tools</code></summary>

| Plateforme | Asset |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. Téléchargez l'actif qui correspond à la machine, et `SHA256SUMS.txt`, depuis la page [Versions GitHub](https://github.com/wsj-br/ai-i18n-tools/releases).
2. Vérifiez la somme de contrôle. Sous Linux, `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (utilisez le nom de l'actif que vous avez téléchargé). Sous macOS, la même ligne avec `shasum -a 256 -c -`. Sous Windows, `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` et comparez-le avec le hachage dans `SHA256SUMS.txt`.
3. Renommez le fichier téléchargé en `ai-i18n-tools` et placez ce répertoire sur `PATH`.

Linux et macOS, en utilisant l'actif Linux x64 comme exemple (substituez l'actif que vous avez téléchargé) :

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

Si `$HOME/.local/bin` n'est pas déjà sur `PATH`, ajoutez ceci au profil shell (`.bashrc`, `.bash_profile`, `.profile` ou `.zshrc`) et ouvrez un nouveau terminal :

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell), en renommant `ai-i18n-tools-win-x64.exe` en `ai-i18n-tools.exe` :

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

Ouvrez un nouveau terminal et exécutez `ai-i18n-tools --version`. Le nom de la commande est `ai-i18n-tools` sur toutes les plateformes.

</details>

Définissez la clé API pour le fournisseur actif de la même manière qu'une installation npm (voir ci-dessous). Ensuite :

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Procédure pas à pas : [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python). Référence des commandes : [suggest-models](/fr/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### Définir la clé API

Les commandes de traduction (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) nécessitent une configuration de fournisseur dans `ai-i18n-tools.config.json` et une clé d'API pour le fournisseur actif. Exécutez `ai-i18n-tools init -P <provider>` pour générer la structure de ce préréglage. Préréglages de fournisseur et clés d'API : [Fournisseurs de LLM](/fr/guide/providers-and-models). La liste de modèles de `init` est un point de départ. Remplacez-la à partir de [Modèles d'IA](/fr/guide/ai-models) avec `suggest-models` ou l'onglet **Modèles** du tableau de bord. Ollama est le seul préréglage intégré qui ne nécessite aucune clé d'API.

Définissez la clé qui correspond au fournisseur que vous passez à `init` (voir le [tableau des préréglages](/fr/guide/providers-and-models#built-in-providers)) :

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

<a id="using-the-cli"></a>
### Utilisation de l'interface en ligne de commande (CLI)

Installez `ai-i18n-tools` en tant que dépendance ou devDependency dans votre projet (voir le haut de cette page). Le package déclare une entrée `bin` que votre gestionnaire de packages lie à `node_modules/.bin/ai-i18n-tools`. Ce shim (`bin/ai-i18n-tools.mjs` à l'intérieur du package installé) charge l'interface de ligne de commande compilée.

Pour taper la commande simple `ai-i18n-tools` dans un shell interactif, configurez l'une des options ci-dessous. Sans configuration, le shell ne peut pas trouver le binaire même après une installation locale.

direnv — ajoutez à un `.envrc` à la racine du projet (bash/zsh ; voir [direnv.net](https://direnv.net/)) :

```bash
PATH_add node_modules/.bin
```

Après `direnv allow`, la commande simple est disponible chaque fois que vous `cd` dans le projet.

PATH manuel — exécutez ces commandes depuis la racine du projet (le répertoire qui contient `node_modules/.bin`). Les sous-répertoires continuent de fonctionner par la suite tant que vous laissez cette entrée `PATH` en place ; relancer l'exportation depuis un dossier imbriqué échoue car `$PWD` ne pointe plus vers la racine du projet.

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

Installation globale — installez l'interface de ligne de commande une fois et invoquez-la depuis n'importe quel répertoire :

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Avec pnpm, exécutez `pnpm setup` une fois par machine (et ouvrez un nouveau shell) si des commandes globales sont manquantes — pnpm nécessite son répertoire de binaires global sur `PATH`. Une installation globale utilise la version épinglée globalement. Pour l'épinglage de version par projet, préférez direnv ou le PATH manuel afin que `node_modules/.bin` se résolve à la dépendance du projet.

Scripts package.json — lorsque npm ou pnpm exécute un script, il préfixe `node_modules/.bin` à `PATH`, de sorte que le nom de commande de base fonctionne à l'intérieur des scripts sans modifications du PATH du shell :

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Exécutez ensuite par exemple `pnpm run i18n:sync`. Consultez [Scripts package.json recommandés](/fr/guide/quick-start#recommended-packagejson-scripts) pour l'ensemble complet recommandé.

Alternatives — si vous préférez ne pas modifier `PATH` : `npx ai-i18n-tools …` (npm) ou `pnpm exec ai-i18n-tools …` (pnpm). Pour une exécution unique sans installation et sans entrée `package.json` : `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-monorepo"></a>
### Monorepo cloné

Lors du développement du package ou de l'exécution des exemples d'espace de travail à partir d'un clone complet de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) :

- Exemples d'espace de travail (`examples/console-app`, `examples/nextjs-app` et les autres packages listés dans [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — exécutez `pnpm install` à la racine du dépôt, puis `cd examples/<name>`. Utilisez les scripts `pnpm run i18n:*` de l'exemple, ou configurez le PATH (voir [Utilisation de la CLI](#using-the-cli)) et exécutez `ai-i18n-tools …` directement. Le [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) de l'espace de travail lie `ai-i18n-tools` à votre copie locale.
- Racine du dépôt — pnpm ne lie pas le propre `bin` du package racine dans `node_modules/.bin`. Le `.envrc` de cette copie ajoute `bin/` au `PATH` afin que le wrapper `bin/ai-i18n-tools` commité (à côté du shim `bin/ai-i18n-tools.mjs` publié) fournisse la commande directe après `direnv allow`. Sans direnv, utilisez `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` ou les scripts `pnpm i18n:*` à la racine (ou un alias de shell / `pnpm add -g .`).
- Fixtures autonomes (`multi-provider`, `test-markdown`) — depuis le dossier de la fixture, utilisez `node ../../bin/ai-i18n-tools.mjs …`.

Exécutez `pnpm run build` à la racine du dépôt après avoir modifié la source de l'interface de ligne de commande. Consultez le [Guide de développement](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) pour les étapes de construction et les solutions de contournement facultatives pour l'installation globale.

Sous Linux, macOS et WSL, les installations depuis le registre définissent automatiquement le bit d'exécution sur le script CLI. Sous Windows, les gestionnaires de paquets génèrent des shim `.cmd` et `.ps1` qui invoquent explicitement Node.

Suivant : [Démarrage rapide](/fr/guide/quick-start).
