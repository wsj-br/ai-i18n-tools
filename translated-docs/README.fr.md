<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**Traduisez votre application, votre site web et votre documentation avec les modèles de votre choix sur n'importe quel fournisseur de LLM. Une seule configuration, des réexécutions en cache.**

Interface de ligne de commande (CLI) et boîte à outils qui ajoute des langues aux applications JavaScript/TypeScript, aux applications Python et aux sites de documentation. La langue de départ est `sourceLocale`, et elle peut être n'importe quelle langue. Il trouve le texte, le traduit et écrit les fichiers que votre projet charge. Les préréglages intégrés couvrent OpenAI, Anthropic, Gemini, OpenRouter, Ollama et toute API compatible OpenAI. Changez de fournisseur ou de modèle par projet ou par locale.

Fonctionne avec [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [Markdown simple](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-readme) (un fichier README de dépôt et d'autres fichiers `.md`), et HTML simple. Les applications Python utilisent `t()` / `_()` ou GNU gettext (Streamlit, FastAPI, Flask, Django et boîtes à outils de bureau). Conserve vos catalogues [i18next](https://www.i18next.com/) existants (JSON d'espace de noms ou chaînes source `t()`). Fonctionne avec [Intlayer](https://intlayer.org/) de deux manières : conserver Intlayer et remplir ses dictionnaires avec `translate-intlayer`, ou passer aux appels de chaînes source `t()` avec `migrate-intlayer`. Intlayer reste un bon choix pour les dictionnaires de contenu typés et les systèmes de gestion de traduction.

<a id="features"></a>
## Fonctionnalités

| | |
| --- | --- |
| **Chaînes d'interface utilisateur** | Extrayez `t("…")` / `_()` depuis JS/TS/Astro et Python, ou `data-i18n*` dans un fichier HTML → JSON plat par locale ou GNU gettext |
| **Documents** | Traduisez les pages Markdown, MDX, `.astro` et HTML (un fichier par locale) |
| **JSON** | Traduisez les bundles de locales imbriqués lorsque le contenu se trouve en dehors des appels `t()` |
| **SVG** | Traduisez les étiquettes SVG illustrées via `translate-svg` |
| **Cache intelligent** | Cache SQLite partagé — seuls les segments nouveaux ou modifiés atteignent le modèle |
| **Un seul `sync`** | Exécute l'extraction → UI → SVG → docs → JSON dans le bon ordre à partir d'une seule configuration |
| **Python** | Exécutable autonome sur chaque GitHub Release — le CLI s'exécute sans installation de Node.js |
| **Modèles classés** | `suggest-models` classe les modèles de chat du fournisseur actif et peut écrire `translationModels` |

<a id="where-do-i-start"></a>
## Par où commencer ?

| Vous avez | Commencez ici |
| --- | --- |
| Une application JS/TS (React, Next.js, Node, CLI) avec du texte brut dans la source | [Ajouter l'i18n à une application JS/TS](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-js) |
| Une application Python (Streamlit, FastAPI, Flask, applications de bureau, scripts) | [Ajouter l'i18n à une application Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-python) |
| Une application Django, des catalogues Flask-Babel ou une application qui utilise déjà GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-django-gettext) |
| Un site web ou un site de documentation (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, HTML simple) | [Ajouter l'i18n à un site web ou un site de documentation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-website) |
| Un fichier README de dépôt et d'autres fichiers Markdown (avec ou sans application) | [Ajouter l'i18n à votre README et à vos documents Markdown](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-readme) |
| Du code qui appelle déjà `t()` ou `_()` | [Chaînes d'interface utilisateur](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/) |
| Des fichiers de locale JSON imbriqués autonomes | [JSON](https://wsj-br.github.io/ai-i18n-tools/fr/guide/json) |
| Des diagrammes SVG avec des étiquettes de texte | [Traduction SVG](https://wsj-br.github.io/ai-i18n-tools/fr/guide/svg-translation/) |
| Des dictionnaires Intlayer (conserver Intlayer, ou passer aux appels de chaînes source) | [Traduire Intlayer sur place](https://wsj-br.github.io/ai-i18n-tools/fr/guide/translating-intlayer) · [Migrer d'Intlayer vers les appels de chaînes source](https://wsj-br.github.io/ai-i18n-tools/fr/guide/migrating-from-intlayer) |

Voir [Qu'est-ce que ai-i18n-tools ?](https://wsj-br.github.io/ai-i18n-tools/fr/guide/what-is-ai-i18n-tools) pour comprendre comment les pipelines s'assemblent.

<a id="install"></a>
## Installer

ESM uniquement. Nécessite Node.js `>=22.16.0`.

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

Définissez une clé API pour le fournisseur que vous transmettez à `init` (Ollama n'en a pas besoin) :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configurez la commande `ai-i18n-tools` seule (direnv, PATH, scripts `package.json` ou `npx`) — consultez [Installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation).

<a id="python-no-nodejs"></a>
### Python, sans Node.js

Linux et macOS :

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell) :

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

L'installateur choisit l'exécutable pour cette machine, vérifie `SHA256SUMS.txt`, installe la commande en tant que `ai-i18n-tools`, et l'ajoute à `PATH`. Les binaires ne sont pas notarisés ou signés Authenticode. Étapes de téléchargement manuel : [Exécutables autonomes](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation#standalone-executables).

Les quatre exemples Python se trouvent dans le dépôt et dans `ai-i18n-tools-python-examples.zip` sur la version. Ils ne sont pas inclus dans l'archive tarball npm ou l'exécutable.

<a id="quick-start"></a>
## Démarrage rapide

Générez la configuration pour ce que vous avez, puis suivez le guide correspondant à votre chemin :

| Vous avez | Générer | Puis suivez |
| --- | --- | --- |
| Une application JS/TS | `ai-i18n-tools init -P openrouter` | [Ajouter l'i18n à une application JS/TS](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-js) |
| Une application Python | `ai-i18n-tools init -t ui-python -P openrouter` | [Ajouter l'i18n à une application Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-python) |
| Une application Django ou GNU gettext | `ai-i18n-tools init -t ui-python-django -P openrouter` (ou `ui-python-gettext`, `ui-python-flask`) | [Ajouter l'i18n à une application Django / Python gettext](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-django-gettext) |
| Un site web ou un site de documentation | `ai-i18n-tools init -t ui-vitepress -P openrouter` (remplacez le modèle par celui de votre framework) | [Ajouter l'i18n à un site web ou un site de documentation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-website) |
| Un fichier README, avec ou sans application | `ai-i18n-tools init -P openrouter` (application JS/TS + README) ou `init -t docs-markdown` | [Ajouter l'i18n à votre README et à vos documents Markdown](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-readme) |

Lorsque le projet est prêt, exécutez `ai-i18n-tools sync`, puis `ai-i18n-tools status` pour voir ce qui a été traduit.

Une application JS/TS doit d'abord encapsuler son texte dans `t()`. Exécuté sur du texte brut, `sync` se termine sans erreur et n'écrit rien d'utile. Votre framework de site doit également avoir son propre routage i18n activé avant `sync`.

Modèles pour sites web : `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, et `ui-plain-html` ou `docs-plain-html`. README et Markdown uniquement : `docs-markdown`. Ajoutez `--with-readme` à tout autre modèle pour inclure le bloc README. Applications Python gettext : `ui-python-django`, `ui-python-flask`, `ui-python-gettext`. JSON i18next imbriqué : `ui-json-bundles`. Liste complète : [Référence de configuration CLI](https://wsj-br.github.io/ai-i18n-tools/fr/reference/cli-commands/setup).

`suggest-models` classe les modèles de chat du fournisseur actif selon des benchmarks publiés, et `suggest-models --apply` remplace `translationModels`. Le même classement se trouve dans l'onglet [Models](https://wsj-br.github.io/ai-i18n-tools/fr/guide/translation-dashboard/models). Guide : [Modèles d'IA](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ai-models). Référence de la commande : [suggest-models](https://wsj-br.github.io/ai-i18n-tools/fr/reference/cli-commands/models#suggest-models).

Préférez `sync` à l'enchaînement de commandes de traduction individuelles. Guide complet : [Démarrage rapide](https://wsj-br.github.io/ai-i18n-tools/fr/guide/quick-start). Plus d'un type de contenu dans un seul projet : [Combinaison de pipelines](https://wsj-br.github.io/ai-i18n-tools/fr/guide/combining-pipelines).

<a id="documentation"></a>
## Documentation

- [Site de documentation](https://wsj-br.github.io/ai-i18n-tools/fr/) — guides, intégrations et référence
- [Installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/installation) · [Démarrage rapide](https://wsj-br.github.io/ai-i18n-tools/fr/guide/quick-start) · [Fournisseurs de LLM](https://wsj-br.github.io/ai-i18n-tools/fr/guide/providers-and-models) · [Modèles d'IA](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ai-models)
- [Chaînes de l'interface utilisateur](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/) · [HTML simple](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/ui-strings/python) · [Documents](https://wsj-br.github.io/ai-i18n-tools/fr/guide/documents/) · [Pages HTML](https://wsj-br.github.io/ai-i18n-tools/fr/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/fr/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/fr/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [traduire les dictionnaires sur place](https://wsj-br.github.io/ai-i18n-tools/fr/guide/translating-intlayer) · [passer aux appels avec chaîne source](https://wsj-br.github.io/ai-i18n-tools/fr/guide/migrating-from-intlayer)
- [Intégrations](https://wsj-br.github.io/ai-i18n-tools/fr/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, et [Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/integrations/python)
- [Ajouter l'i18n à votre projet](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-your-project) — [Application JS/TS](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-js) · [Application Python](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-python) · [Application Django / gettext](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-django-gettext) · [Site web ou site de documentation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-website) · [Documentation README et Markdown](https://wsj-br.github.io/ai-i18n-tools/fr/guide/add-i18n-to-readme) · [Combiner les pipelines](https://wsj-br.github.io/ai-i18n-tools/fr/guide/combining-pipelines)
- [Référence CLI](https://wsj-br.github.io/ai-i18n-tools/fr/reference/cli-commands/) · [Configuration](https://wsj-br.github.io/ai-i18n-tools/fr/reference/configuration) · [Aides à l'exécution](https://wsj-br.github.io/ai-i18n-tools/fr/guide/runtime-helpers)
- [Exemples](https://wsj-br.github.io/ai-i18n-tools/fr/examples) — démos exécutables (`npx degit …`)
- [Contexte d'agent IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — invite concise / point d'entrée `AGENTS.md` pour les projets grand public
- [Compétences d'agent portables](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills) — une seule installation, puis une commande slash par flux de travail : `npx skills add wsj-br/ai-i18n-tools --all -y` (Node.js 22.20+) ; [guide d'installation](https://wsj-br.github.io/ai-i18n-tools/fr/guide/coding-agent-skill)

<a id="contributing"></a>
## Contribuer

Les problèmes et les requêtes de tirage sont les bienvenus. Flux de travail du mainteneur pour ce dépôt : [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) et [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## Licence

MIT — voir [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

Les noms de produits et les icônes appartiennent à leurs propriétaires respectifs et sont utilisés uniquement à des fins d'identification. Ce logiciel n'est ni affilié à ces marques, ni approuvé par celles-ci.

<small>

> **Remarque sur les traductions de l'interface utilisateur et de la documentation :** Toutes les langues de l'interface et de la documentation, à l'exception de l'anglais (Royaume-Uni), ont été traduites par IA à l'aide de ce package (ai-i18n-tools) ; la formulation peut être imprécise ou contenir des erreurs.

</small>
