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

**Scripts `package.json` (recommandé)** — lorsque npm ou pnpm exécute un script, il ajoute `node_modules/.bin` à `PATH`, de sorte que des commandes comme `pnpm run i18n:sync` invoquent `ai-i18n-tools` sans préfixe `npx` ou `pnpm exec` :

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**Shell interactif** — depuis la racine de votre projet, après une installation locale :

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**Nu** `ai-i18n-tools` **dans le terminal** — pour taper le nom de la commande directement dans un shell interactif, ajoutez le répertoire bin local à `PATH` :

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Avec [**direnv**](https://direnv.net/), ajoutez `PATH_add node_modules/.bin` à un `.envrc` à la racine du projet afin que la commande nue soit disponible après `cd` dans le projet. Sans ajuster `PATH`, continuez à utiliser `npx ai-i18n-tools …` ou `pnpm exec ai-i18n-tools …`.

**Exécution unique sans installation** — `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (télécharge le package pour cet appel ; aucune entrée dans `package.json`).

Sous Linux, macOS et WSL, les installations depuis le registre définissent automatiquement le bit d'exécution sur le script CLI. Sous Windows, les gestionnaires de paquets génèrent des shim `.cmd` et `.ps1` qui invoquent explicitement Node.

Définissez votre clé API de fournisseur (OpenRouter est affiché ; utilisez la variable d'environnement qui correspond à votre fournisseur actif — voir le [tableau des préréglages](/guide/providers-and-models#built-in-providers)) :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou créez un fichier `.env` à la racine du projet :

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Langue de l'interface utilisateur de l'outil

L'interface de ligne de commande (CLI) localise son propre texte d'aide, ses résumés de journaux et son tableau de bord de traduction indépendamment des paramètres régionaux que vous traduisez. Par défaut, elle suit les paramètres régionaux de votre système d'exploitation. Remplacez-les par `-L pt-BR`, `export AI_I18N_LANG=es` ou `"uiLanguage"` dans la configuration. Voir [Langue de l'interface utilisateur de l'outil](/reference/environment-variables#tool-ui-language).
