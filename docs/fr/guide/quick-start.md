<a id="quick-start"></a>
# Démarrage rapide

Cette page guide un projet monolingue vers ses premiers fichiers traduits. Elle s'adresse à une application JS/TS, une application Python, un site web ou un site de documentation, ou un fichier README de dépôt et d'autres fichiers Markdown. Elle suppose :

- Node.js `>=22.16.0`, ou l'[exécutable autonome](/fr/guide/installation#standalone-executables) pour un projet Python.
- Une clé API pour un fournisseur de LLM, ou une installation locale d'Ollama.
- Le projet est sous contrôle de version, afin que vous puissiez examiner ce que l'outil écrit.

Deux choses diffèrent entre les projets : la façon dont l'outil trouve votre texte, et la façon dont votre application charge le résultat. [Choisissez votre chemin](#pick-your-path) ci-dessous vous envoie vers le bon guide pour cela.

<a id="runnable-examples"></a>
## Exemples exécutables

Vous préférez d'abord consulter un projet terminé ? Copiez-en un sans cloner le dépôt :

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

Remplacez `console-app` par tout autre exemple Node.js. Les exemples Python n'ont pas de `package.json` ; copiez-les de la même manière ou téléchargez `ai-i18n-tools-python-examples.zip` depuis la version GitHub. La liste complète, avec ce que chacun montre, se trouve sur la page [Exemples](/fr/examples).

<a id="install"></a>
## Installer

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` et `yarn add --dev ai-i18n-tools` fonctionnent aussi. Les projets Python installent l'exécutable autonome et n'ont pas besoin de Node.js. Linux et macOS : `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell : `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`. Autres options d'installation : [Installation](/fr/guide/installation).

<a id="provider-and-api-key"></a>
## Fournisseur et clé API

Chaque commande qui appelle un LLM (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg` et `sync`) nécessite ces deux éléments :

1. Au moins un fournisseur dans `ai-i18n-tools.config.json` : un bloc `providers.<name>` avec `translationModels`, et une clé `provider` de premier niveau lorsque plusieurs fournisseurs sont configurés. `init -P <provider>` génère ce préréglage. Pour ajouter des fournisseurs, consultez [Fournisseurs de LLM](/fr/guide/providers-and-models). Pour choisir la liste de modèles, consultez [Modèles d'IA](/fr/guide/ai-models).
2. La clé d'API correspondante dans votre environnement ou dans un fichier `.env` à la racine du projet. Chaque préréglage intégré lit une variable nommée depuis le [tableau des préréglages](/fr/guide/providers-and-models#built-in-providers), par exemple `OPENROUTER_API_KEY` avec `-P openrouter` ou `OPENAI_API_KEY` avec `-P openai`. Ollama utilise un point de terminaison local et ne nécessite aucune clé.

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`, `status` et les autres commandes qui n'appellent pas le LLM n'ont besoin d'aucun des deux. Plus d'informations sur les fichiers d'environnement et le PATH : [Installation](/fr/guide/installation#using-the-cli).

<a id="pick-your-path"></a>
## Choisissez votre chemin

Trouvez ce que vous avez, exécutez les commandes de son bloc, puis continuez dans le guide lié.

<a id="core-cli-commands"></a>

<a id="a-jsts-app"></a>
### Une application JS/TS

Vos boutons et messages sont encore en texte brut dans la source, l'outil n'a donc rien à trouver pour l'instant. Ils doivent d'abord être enveloppés dans `t()`, et l'application a besoin d'un petit fichier de configuration i18next.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

Suivez ensuite [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js). Il couvre l'étape d'encapsulation, avec une invite d'agent, avant `extract` et `translate-ui`.

<a id="a-python-app"></a>
### Une application Python

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

Utilisez `ui-python-gettext`, `ui-python-flask` ou `ui-python-django` pour ces configurations. Suivez ensuite [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).

<a id="a-website-or-documentation-site"></a>
### Un site web ou un site de documentation

Choisissez le modèle pour votre framework :

| Votre site | Modèle |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| Site web Astro simple | `ui-astro-website` |
| Pages HTML simples | `ui-plain-html` ou `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Votre framework doit d'abord avoir son propre routage i18n activé. Suivez ensuite [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website).

<a id="a-readme-or-markdown-docs"></a>
### Un README ou de la documentation Markdown

La plupart des dépôts souhaitent cela avec l'application : le modèle `ui-markdown` par défaut inclut déjà un bloc README plat. Pour tout autre modèle, ajoutez `--with-readme`. Un dépôt contenant uniquement du Markdown utilise `docs-markdown`.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

Suivez ensuite [Ajouter l'i18n à votre README et à votre documentation Markdown](/fr/guide/add-i18n-to-readme). Collez le marqueur de liste de langues dans `README.md` avant `sync`. Le chemin de l'application, si vous en avez un, est toujours [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) ou [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).

<a id="something-else"></a>
### Autre chose

- JSON i18next imbriqué qui reste tel quel : `ai-i18n-tools init -t ui-json-bundles -P openrouter`, puis [JSON](/fr/guide/json).
- Diagrammes SVG avec étiquettes de texte : [Traduction SVG](/fr/guide/svg-translation/).
- Abandonner Intlayer : [Migration depuis Intlayer](/fr/guide/migrating-from-intlayer).
- Conserver Intlayer et ne remplir que ses traductions : [Traduire Intlayer sur place](/fr/guide/translating-intlayer).

La liste complète des modèles, avec chaque option `init`, se trouve dans la [référence de configuration CLI](/fr/reference/cli-commands/setup).

<a id="run-and-check"></a>
## Exécuter et vérifier

Lorsque votre projet est prêt :

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` exécute chaque étape activée par votre configuration, dans l'ordre. `status` affiche ce qui est traduit par locale. Une première exécution sur un projet dont l'outil ne peut pas voir le texte se termine sans erreur et n'écrit rien d'utile, donc si `status` n'affiche aucune chaîne, revenez au guide correspondant à votre chemin.

`suggest-models` classe les modèles de chat du fournisseur actif à partir de benchmarks publiés. `suggest-models --apply` remplace `translationModels` et ne modifie pas `uiModels` et `localeModels`. Le même classement se trouve dans l'onglet **Modèles** du tableau de bord. Fonctionnement du classement et pourquoi la liste contient plusieurs modèles : [Modèles d'IA](/fr/guide/ai-models). Référence de la commande : [suggest-models](/fr/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `sync` chaque fois que le texte source change. Un cache SQLite signifie que seul le texte nouveau ou modifié est envoyé au modèle, donc les réexécutions sont peu coûteuses. L'exécution de `sync` en CI empêche les traductions de dériver. `ai-i18n-tools dashboard` ouvre le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) pour examiner et modifier les traductions mises en cache.

<a id="recommended-packagejson-scripts"></a>
### Scripts package.json recommandés

Avec le package installé localement, les scripts résolvent `ai-i18n-tools` depuis `node_modules/.bin` sans configuration de shell supplémentaire. Pour un shell interactif, configurez d'abord le PATH : consultez [Utilisation de la CLI](/fr/guide/installation#using-the-cli).

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

Préférez `sync` à l'enchaînement des scripts de traduction individuels. N'utilisez les scripts à étape unique que si vous avez besoin d'une seule étape de manière isolée.

Pour que la sortie de la CLI et le tableau de bord soient dans une autre langue, passez `-L <code>` ou définissez `AI_I18N_LANG` : consultez [Langue de l'interface utilisateur de l'outil](/fr/guide/tool-ui-language).

<a id="combined-sync"></a>

Vous traduisez plusieurs types de contenu, comme des chaînes d'application et un site de documentation ensemble ? Consultez [Combinaison de pipelines](/fr/guide/combining-pipelines).

Suivant : le guide correspondant à votre parcours sous [Choisissez votre parcours](#pick-your-path).
