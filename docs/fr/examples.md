<a id="examples"></a>
# Exemples

Projets exécutables sous [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) sur GitHub — chacun avec sa propre configuration, ses sorties de paramètres régionaux validées et son fichier README. Vous pouvez explorer les fichiers traduits sans clé API ; la réexécution de la traduction nécessite une clé de fournisseur ([Fournisseurs et modèles](/guide/providers-and-models)).

<a id="run-standalone"></a>
## Exécuter de manière autonome (`npx degit`)

Copiez un exemple sans cloner le référentiel complet. Chacun déclare `"ai-i18n-tools": "^1.7.2"` et installe l'interface de ligne de commande à partir de npm :

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Si vous avez cloné le dépôt [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) **en entier**, exécutez `pnpm install` et `pnpm run build` à la racine du dépôt, puis `cd examples/<name>`.

## Liste des exemples

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| Exemple | Idéal pour | Copier avec degit | Exécuter |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | La plus petite application fonctionnelle avec des chaînes d'interface utilisateur `t()` + traduction du README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + pluriels + tableau de bord ; documentation Docusaurus + README plat + ressources SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (application `:3030` ; `cd docs-site && pnpm start` pour la documentation `:3040`) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Page de destination Astro : HTML pleine page + hybride `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Site de documentation Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Site de documentation VitePress + thème JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Choisir ou évaluer un fournisseur LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Test de régression de la traduction Markdown / CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Chaque nom d'**exemple** renvoie à son fichier README GitHub avec la configuration complète, les commandes et la disposition du projet — ou parcourez l'[index des exemples dans le référentiel](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).
