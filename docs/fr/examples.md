<a id="examples"></a>
# Exemples

Projets exécutables sous [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) sur GitHub — chacun avec sa propre configuration, ses sorties de paramètres régionaux validées et son fichier README. Vous pouvez explorer les fichiers traduits sans clé API ; la réexécution de la traduction nécessite une clé de fournisseur ([Fournisseurs et modèles](/fr/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Exécuter de manière autonome (`npx degit`)

Copiez un exemple sans cloner l'intégralité du dépôt.

<a id="nodejs-examples"></a>
### Exemples Node.js

Chaque exemple Node.js déclare une plage de versions caret `ai-i18n-tools` correspondant à la version actuelle du paquet et installe l'interface de ligne de commande (CLI) depuis npm :

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Exemples Python

`python-streamlit`, `python-flask`, `python-fastapi` et `python-gettext` n'ont pas de `package.json`. Les commandes `degit` dans le tableau ci-dessous sont valides. Vous pouvez également télécharger `ai-i18n-tools-python-examples.zip` depuis la [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases). Ce fichier zip contient les quatre mêmes répertoires. Il ne fait pas partie du paquet npm et ne se trouve pas à l'intérieur de l'exécutable autonome.

`python-streamlit`, `python-flask` et `python-fastapi` utilisent un virtualenv et `pip install -r requirements.txt`. `python-gettext` utilise uniquement la bibliothèque standard. Traduisez avec l'[exécutable autonome](/fr/guide/installation#standalone-executables).

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Sous Windows, activez `.venv\Scripts\activate`.

Si vous avez cloné l'**intégralité** du dépôt [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools), exécutez `pnpm install` et `pnpm run build` à la racine du dépôt, puis `cd examples/<name>`. Les exemples d'espace de travail (Node.js) utilisent la CLI locale via leurs scripts `pnpm run i18n:*`, ou `ai-i18n-tools …` directement après la [configuration du PATH](/fr/guide/installation#using-the-cli). Les exemples Python dans ce checkout se traduisent avec `node ../../bin/ai-i18n-tools.mjs` après la compilation. Voir [Installation — Dépôt cloné](/fr/guide/installation#cloned-monorepo).

<a id="net-examples"></a>
### Exemples .NET

`dotnet-console` et `dotnet-resx` n'ont pas de `package.json`. Les commandes `degit` du tableau ci-dessous sont valides. Vous pouvez également télécharger `ai-i18n-tools-dotnet-examples.zip` depuis la [version GitHub](https://github.com/wsj-br/ai-i18n-tools/releases). Ce fichier zip contient les deux mêmes répertoires et `assets/dotnet`, que les projets compilent via `../../assets/dotnet`. Il ne fait pas partie du package npm et n'est pas inclus dans l'exécutable autonome. Les versions publiées avant ce fichier zip ne l'incluent pas.

Les deux sont des projets xUnit. `dotnet-console` vérifie `I18n.cs`. `dotnet-resx` vérifie `I18nResx.cs` et les satellites `.resx`. Aucun n'appelle d'API de traduction. Exécutez `dotnet test` dans le répertoire. À partir d'un clone complet, `pnpm test:dotnet` à la racine du dépôt exécute les deux et ignore si `dotnet` n'est pas sur `PATH`.

Décompressez `ai-i18n-tools-dotnet-examples.zip`, puis exécutez les vérifications depuis le répertoire d'exemple. L'archive conserve `examples/` et `assets/dotnet` côte à côte, ce qui est le chemin que les projets compilent :

```bash
cd examples/dotnet-console
dotnet test
```

`degit` copie un répertoire et n'inclut pas `assets/dotnet`. Ces liens de compilation se résolvent dans un clone complet, ou après avoir décompressé le fichier zip.

<a id="which-example-matches-my-project"></a>
## Quel exemple correspond à mon projet ?

- Une application JS/TS : [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) (la plus petite) ou [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md). Guide : [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js).
- Une application Python : python-streamlit, python-flask, ou python-fastapi. Guide : [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python).
- Une application Django ou GNU gettext : python-gettext (un outil de ligne de commande gettext ; il n'y a pas de répertoire d'exemple Django). Guide : [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext).
- Un utilitaire .NET : dotnet-console (`I18n.cs`) ou dotnet-resx (`I18nResx.cs` et les satellites `.resx`). Guides : [Ajouter l'i18n à une application .NET](/fr/guide/add-i18n-to-dotnet) et [Ajouter l'i18n à une application .NET ResourceManager](/fr/guide/add-i18n-to-dotnet-resourcemanager).
- Un site web ou un site de documentation : docusaurus-docs, vitepress-docs, astro-docs, nextra-docs, fumadocs-docs, astro-website, plain-html, ou plain-html-docs. Guide : [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website).
- Un fichier README de dépôt à côté d'une application : [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) ou [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) (l'exemple nextjs a également un site de documentation). Guide : [Ajouter l'i18n à votre README et à vos documents Markdown](/fr/guide/add-i18n-to-readme).
- Autre chose : multi-provider, test-markdown, et intlayer-migration.

<a id="list-of-examples"></a>
## Liste des exemples

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="intlayer-translate"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>
<a id="dotnet-console"></a>
<a id="dotnet-resx"></a>

| Exemple | Idéal pour | Copier avec degit | Exécuter |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | La plus petite application fonctionnelle avec des chaînes d'interface utilisateur `t()` + traduction du README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + pluriels + tableau de bord ; documentation Docusaurus imbriquée + fichier README plat + ressources SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (application `:3030` ; `cd docs-site && pnpm start` pour la documentation `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Site de documentation Docusaurus uniquement (préréglage `docusaurus`) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100` ; compilation + service, le menu des paramètres régionaux fonctionne) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Page de destination Astro : HTML pleine page + hybride `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Site de documentation Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Site de documentation VitePress + thème JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / squelette de dictionnaire `.ts`, plus un composant serveur `t()` (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / catalogue d'interface utilisateur (`pt`, `zh`, analyseur de points) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | HTML simple + marqueurs `data-i18n*` ; JSON de paramètres régionaux statiques (interface utilisateur de type tableau de bord) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | HTML simple comme documents : une page par locale, images localisées, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Choisir ou évaluer un fournisseur LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Test de régression de la traduction Markdown / CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, réinitialisation + rapport d'agent IA) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**intlayer-translate**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate/README.md) | Conserver Intlayer, remplir les locales manquantes sur place (`translate-intlayer` ; `en` + `pt-BR` livrés, `es` + `zh-Hans` manquants) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate` | `pnpm reset && pnpm translate` (`pnpm dev` `:3093`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Tableau de bord Streamlit, `t()` / `_()`, JSON de chaînes source | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, JSON de chaînes source | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, locale ContextVar, `t()` / `_()`, JSON de chaînes source | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | CLI GNU gettext existante ; `extract` / `translate-ui` actualise `.po` et `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |
| [**dotnet-console**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console/README.md) | Vérifications xUnit de `I18n.cs` : JSON intégré, repli de culture, `{0}`, pluriels, et `Configure` | `npx degit wsj-br/ai-i18n-tools/examples/dotnet-console dotnet-console` | `dotnet test` |
| [**dotnet-resx**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx/README.md) | Vérifications xUnit de `I18nResx.cs` et des satellites `.resx` de chaînes source | `npx degit wsj-br/ai-i18n-tools/examples/dotnet-resx dotnet-resx` | `dotnet test` |

Chaque nom d'**exemple** renvoie à son fichier README GitHub avec la configuration complète, les commandes et la disposition du projet — ou parcourez l'[index des exemples dans le référentiel](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).

Les exemples Node.js installent la CLI depuis npm après `pnpm install`. Les quatre exemples Python utilisent `venv` et `pip` (`python-gettext` utilise uniquement la bibliothèque standard) et l'[exécutable autonome](/fr/guide/installation#standalone-executables) pour la traduction. Les deux exemples .NET sont des projets xUnit. Exécutez-les avec `dotnet test`. Ils se trouvent également dans `ai-i18n-tools-dotnet-examples.zip` sur la version GitHub.

<br/>

::: tip Avis de non-responsabilité
Les noms de produits et les icônes appartiennent à leurs propriétaires respectifs et sont utilisés uniquement à des fins d'identification. Ce logiciel n'est ni affilié ni approuvé par ces marques.
:::
