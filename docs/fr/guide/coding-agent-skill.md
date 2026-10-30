<a id="coding-agent-skill"></a>
# Compétence d'agent de codage

Une seule installation copie toutes les compétences du consommateur. La [compétence partagée](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) enseigne à un agent comment installer et maintenir `ai-i18n-tools` avec `sync`, et ne charge que la référence qui correspond à la tâche. Chaque workflow est une commande slash distincte, telle que `/ai-i18n-vitepress`.

L'installation du package npm ou de l'exécutable autonome n'enregistre pas les compétences. Utilisez une méthode d'installation pour chaque agent.

<a id="install-with-the-skills-cli"></a>
## Installer avec la CLI des compétences

C'est l'installation à utiliser lorsque Node.js est en version 22.20 ou plus récente. La propre CLI de ce package prend en charge Node.js 22.16, ce qui est trop ancien pour la CLI des compétences. Sur les versions 22.16 à 22.19, ou sur une machine sans Node.js, utilisez [Télécharger le répertoire des compétences](#download-the-skill-directory).

Depuis le projet dans lequel vous souhaitez que l'agent travaille :

```bash
npx skills add wsj-br/ai-i18n-tools
```

La commande installe chaque répertoire sous `skills/`, y compris la compétence partagée et chaque commande de workflow. Elle ne laisse pas de copie de ce dépôt dans votre projet. La portée par défaut est le projet actuel. Ajoutez `-g` pour installer pour votre utilisateur, sur tous les projets.

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` est l'installation en une étape : toutes les compétences, sans invite. Sans `--all`, l'installateur demande quelles compétences copier. `--list` affiche les compétences et n'installe rien. `--skill` et `-a` ignorent les invites pour une compétence et un agent. `npx skills update` actualise les compétences installées de cette manière. Exécutez `add` à nouveau pour prendre en compte une compétence qui a été ajoutée après la première installation.

Pour afficher la compétence comme une invite, ou pour lancer un agent pris en charge avec elle, sans installer :

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

La CLI détecte les agents de codage installés sur la machine. Les chemins d'installation pour chaque agent se trouvent dans la [liste des agents de la CLI des compétences](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Cette liste change. Cette page ne la répète pas et n'affirme pas que chaque outil de codage lit un dossier de compétences.

La CLI des compétences collecte des données d'utilisation anonymes. Définissez `DISABLE_TELEMETRY=1` ou `DO_NOT_TRACK=1` pour désactiver cela.

Après l'installation, démarrez une nouvelle session d'agent si ce produit nécessite un rechargement. Saisissez une commande de workflow telle que `/ai-i18n-vitepress`, ou demandez à l'agent d'utiliser la compétence `ai-i18n-tools`. La compétence partagée est la solution de repli pour une requête qui ne nomme pas de commande. Une compétence découverte ne garantit pas que l'agent l'invoquera de lui-même.

<a id="slash-commands"></a>
## Commandes slash

La compétence partagée `ai-i18n-tools` reste disponible pour l'agent. Les autres compétences sont des commandes explicites. Chacune suit la compétence partagée, puis applique uniquement son modèle et ses vérifications.

| Commande | Workflow |
| --- | --- |
| `/ai-i18n-js` | Interface utilisateur de chaînes sources JavaScript ou TypeScript |
| `/ai-i18n-python` | Assistant Python généré et catalogues JSON plats |
| `/ai-i18n-django` | Django, Flask-Babel, ou gettext simple |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Documentation Astro Starlight |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Site web Astro simple |
| `/ai-i18n-plain-html` | Un seul fichier HTML, basculé dans le navigateur |
| `/ai-i18n-plain-html-docs` | Une arborescence HTML par locale |
| `/ai-i18n-readme` | README et Markdown du dépôt |
| `/ai-i18n-migrate-intlayer` | Migration unique d'Intlayer vers les appels `t()` |
| `/ai-i18n-translate-intlayer` | Remplir les dictionnaires Intlayer sur place |

Les compétences copiées dans `.agents/skills/` ou `.cursor/skills/` apparaissent comme ces commandes. Un bug actuel de Cursor masque les compétences de plugin de marketplace qui définissent `disable-model-invocation` de la palette `/`. Claude Code, Codex et Copilot affichent toujours ces commandes. Utilisez l'installation CLI des compétences lorsque vous voulez les commandes dans Cursor. Une requête en langage naturel atteint toujours la compétence partagée.

<a id="download-the-skill-directory"></a>
## Télécharger le répertoire de compétences

Utilisez ceci lorsque la CLI skills n'est pas disponible. Copiez chaque répertoire skill, pas seulement `ai-i18n-tools/`. Chaque commande workflow est son propre dossier avec un `SKILL.md`. Un git clone et `npx degit` d'un chemin skill téléchargent tous deux l'archive source du dépôt, environ 50 Mo.

Choisissez un répertoire d'agent dans la [liste des agents CLI de compétences](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Les exemples ci-dessous utilisent `.agents/skills/`, que plusieurs agents lisent. Inspectez cette destination avant de remplacer une copie existante. Une copie par agent est suffisante. Une deuxième copie dans un autre dossier de découverte pour le même agent est un doublon.

Le paquet npm contient déjà les répertoires. Lorsque le paquet est installé :

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

Sans `node_modules`, téléchargez le tarball npm pour la même version que celle rapportée par la CLI. `ai-i18n-tools --version` affiche la version, puis l'horodatage de la construction. Utilisez uniquement le numéro de version. Le membre du tarball est `package/skills/`.

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

Remplacez `1.12.0` par la version que vous avez installée. Cela fonctionne pour la version actuelle. L'exécutable autonome ne contient pas les fichiers de compétences. Faites correspondre le tarball à `ai-i18n-tools --version`.

À partir de la version qui l'ajoute, les versions GitHub (GitHub Releases) joignent également `ai-i18n-tools-skill.zip`. Ce fichier zip contient chaque répertoire de compétences à son niveau supérieur. Décompressez-le dans le dossier des compétences de l'agent afin que le résultat inclue à la fois `ai-i18n-tools/SKILL.md` et les dossiers de workflow, tels que `ai-i18n-vitepress/SKILL.md`. Les versions publiées avant ce zip ne l'incluent pas. Les anciens zips ne contiennent que `ai-i18n-tools/`. Utilisez le tarball npm pour ces versions. Le tag est `v` plus la version de la CLI, par exemple `v1.12.0` une fois que la version de ce tag contient l'actif.

<a id="agents-the-skills-cli-installs"></a>
## Agents installés par la CLI des compétences

Passez l'ID à `-a` lorsque vous voulez un agent. Rien d'autre n'est requis dans ce dépôt pour ces outils.

Agents CLI : Claude Code (`claude-code`), Codex CLI (`codex`), Gemini CLI (`gemini-cli`), Antigravity CLI (`antigravity-cli`), GitHub Copilot CLI (`github-copilot`), OpenCode (`opencode`), Goose (`goose`), Qwen Code (`qwen-code`), Kilo CLI (`kilo`), Grok Build (`grok`), Amp (`amp`), Crush (`crush`), Pi (`pi`), Kiro CLI (`kiro-cli`).

Éditeurs et IDE : Cursor (`cursor`), Windsurf (`windsurf`), Devin for Terminal (`devin`), Zed (`zed`), Antigravity (`antigravity`), Trae (`trae`), Junie (`junie`), Replit (`replit`), Cline (`cline`), Roo Code (`roo`), Kilo Code (`kilo`), Continue (`continue`), Augment (`augment`), Factory Droid (`droid`), Tabnine CLI (`tabnine-cli`). GitHub Copilot dans un éditeur utilise le même ID `github-copilot` que la CLI.

Deux détails de chemin faciles à manquer :

- Cursor : une installation de projet depuis la CLI des compétences est placée dans `.agents/skills/`. `-g` est placé dans `~/.cursor/skills/`. La propre documentation de Cursor accepte également `.cursor/skills/` dans un projet. Utilisez l'une de ces options.
- GitHub Copilot : la CLI des compétences écrit `.agents/skills/` dans le projet et `~/.copilot/skills/` pour `-g`. La documentation de l'agent cloud de GitHub décrit également `.github/skills/`. Ce dossier n'est pas lu par tous les chats Copilot. Utilisez uniquement le dossier documenté pour l'interface que vous utilisez.

L'agent par défaut de la CLI Kiro charge `.kiro/skills/` et `~/.kiro/skills/` sans configuration supplémentaire. Un agent Kiro personnalisé nécessite que les compétences installées soient listées dans `.kiro/agents/<agent>.json` :

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## Catalogues natifs

Certains produits installent également les compétences à partir d'un catalogue dans ce dépôt. Utilisez un seul canal pour chaque agent : le catalogue ou la CLI des compétences. Une mise à niveau de paquet ne rafraîchit pas une compétence qui a été copiée manuellement. `npx skills update` rafraîchit une installation de la CLI des compétences. Les installations de catalogue suivent la commande de mise à jour de ce produit.

- Cursor Marketplace, après l'approbation de l'annonce : installez `ai-i18n-tools` depuis le Cursor Marketplace. Tant que cette annonce n'existe pas, utilisez la CLI des compétences. [Cursor Directory](https://cursor.directory) est une liste communautaire distincte.
- Claude Code, à partir d'une session Claude Code :

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- CLI GitHub Copilot :

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

Installez ensuite le plugin `ai-i18n-tools` depuis ce marketplace. L'ID du plugin est `ai-i18n-tools@ai-i18n-tools`. La CLI Copilot lit le même fichier de catalogue que Claude Code utilise.

- Codex :

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

Une annonce d'espace de travail ChatGPT est publiée séparément par un administrateur d'espace de travail. C'est une installation différente de cette commande.

<a id="agents-without-a-skills-install"></a>
## Agents sans installation de compétences

Ces produits ne figurent pas dans la liste des agents de la CLI des compétences. Ce dépôt ne fournit pas de dossier de compétences séparé pour eux. Pointez l'agent vers le [contexte consommateur](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) à partir d'instructions de projet telles que `AGENTS.md` :

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

Ce fichier utilise des URL de sites de documentation et de dépôts, donc l'instruction fonctionne toujours lorsque l'agent ne peut pas lire ce dépôt. Pour une CLI plus ancienne, ouvrez le même chemin sur l'étiquette de version correspondante. Les projets consommateurs utilisent ce fichier de contexte. Le mainteneur `AGENTS.md` s'applique lors de la modification de ce dépôt.

Produits de ce groupe : Aider, gptme, Amazon Q Developer CLI, DeepSeek Harness, JetBrains AI Assistant, Sourcegraph Cody, Qodo, le plugin Tabnine IDE, CodeGeeX et AskCodi. Junie est l'agent JetBrains qui prend en charge une installation de la CLI des compétences. La CLI Tabnine aussi. AiderDesk est une application différente d'Aider.

CodeLayer et Superset n'ont pas de répertoire de compétences propre. CodeLayer exécute Claude Code, donc installez la compétence pour Claude Code. Superset exécute les agents CLI que vous configurez, donc installez la compétence pour ces agents.

<a id="stay-on-the-same-version"></a>
## Restez sur la même version

Maintenez la compétence sur la même version que la commande `ai-i18n-tools`. Une mise à niveau npm, et un exécutable autonome plus récent, laissent une compétence copiée manuellement là où elle était. Installez à nouveau la compétence à partir de la version correspondante, ou exécutez `npx skills update` pour une installation de la CLI des compétences.

La documentation en ligne peut décrire une version plus récente que la commande que vous avez installée. Préférez `ai-i18n-tools --help` pour les options. Références supplémentaires : [installation](/fr/guide/installation), [configuration](/fr/reference/configuration), [fournisseurs](/fr/guide/providers-and-models), [référence CLI](/fr/reference/cli-commands/).
