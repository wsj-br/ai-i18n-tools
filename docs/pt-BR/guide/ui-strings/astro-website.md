<a id="astro-website"></a>
# Site Astro

Para sites de marketing ou aplicativos Astro estáticos (Astro puro, não Starlight), combine [o roteamento i18n integrado do Astro](https://docs.astro.build/en/guides/internationalization/) com ai-i18n-tools. Consulte também [a integração do Astro](/pt-BR/guide/integrations/astro).

A implementação de referência é [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (veja também seu [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)): inglês em `/`, nove localidades de destino em `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Pipelines híbridos

A maioria das equipes usa um modelo **híbrido** com os dois pipelines (eles não entram em conflito):

| Pipeline | Uso para | Comandos | Saída |
|----------|---------|----------|--------|
| **HTML da página** | Cabeçalhos, parágrafos, rótulos de navegação, arrays embutidos no corpo do template | `translate-docs` | `src/pages/{locale}/index.astro` por localidade |
| **Strings de IU (`t()`)** | Dados do frontmatter, rótulos de abas de screenshots, arrays compartilhados | `extract` → `translate-ui` | `public/locales/{locale}.json` (fonte em inglês como chave) |

Mantenha três listas alinhadas ao adicionar ou remover um idioma: `targetLocales` em `ai-i18n-tools.config.json`, `i18n.locales` em `astro.config.mjs` (Astro usa códigos de rota em **minúsculas**, como `pt-br`) e `ui-languages.json` (via `generate-ui-languages`). Os **nomes de arquivo** do pacote simples usam a capitalização da configuração (`pt-BR.json`); mapeie a rota `pt-br` do Astro para esse arquivo por meio do campo `code` do seu manifesto (veja `examples/astro-website/src/i18n/locale.ts`).

Exemplos de scripts `package.json` (do projeto de referência):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## Strings de UI (SSG)

Estruture a extração da UI com `init -t ui-astro-website`, depois mescle em um bloco `docs[]` quando você também traduzir o HTML da página (veja [Analisar e substituir páginas](#astro-website-pages-parse-and-replace)). Envolva o texto em `t('…')` em módulos TypeScript e frontmatter `.astro` (e blocos de modelo `{expression}` quando você preferir strings de UI em vez de páginas de localidade duplicadas):

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Defina `sourceLocale` para corresponder a `i18n.defaultLocale` em `astro.config.mjs`. Grave os pacotes planos em um diretório que o Astro possa importar no momento da compilação (o modelo usa `public/locales/`). Resolva `t('…')` no **momento da compilação** buscando o literal em inglês como chave (veja `examples/astro-website/src/i18n/t.ts`; `strings.json` é o cache de extração, não o pacote em tempo de execução). Você **não** precisa de `ai-i18n-tools/runtime` ou i18next para um site estático, a menos que adicione "ilhas" no cliente que alterem o idioma após o carregamento.

Conecte todas as páginas que chamam `t()` (página raiz em inglês e cada cópia `src/pages/{locale}/`):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Helpers de suporte no exemplo: `src/i18n/utils.ts`, `src/i18n/locale.ts` e `ui-languages.json` para rótulos, direção e códigos BCP-47. Execute `generate-ui-languages` após alterar `targetLocales` (opcionalmente defina `languagesManifestPath` para que o manifesto fique ao lado dos seus helpers, por exemplo, `src/i18n/ui-languages.json`). `MainLayout.astro` define `<html lang>` e `<html dir>` a partir de `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` usa `getRelativeLocaleUrl` de `astro:i18n`.

<a id="pages-parse-and-replace"></a>
## Páginas (analisar e substituir)

Para páginas de marketing com HTML embutido em arquivos `.astro`, permita que `translate-docs` extraia nós de texto e atributos (`alt`, `title`, `aria-label`, `placeholder`), traduza-os com o cache de documento e grave cópias específicas por localidade na sua árvore de páginas. Você **não** precisa de `t()` para a maioria dos textos visíveis.

Os valores de atributos estruturais e chaves **não** são traduzidos por padrão: a proteção integrada cobre atributos JSX/HTML como `class`, `id`, `style`, `src`, `href`, `data-*` e a maioria dos `aria-*`, além de chaves de objeto como `class`, `key` e `id` dentro de blocos de modelo `{expression}`. Use `docs[].protectAttributes` e `docs[].protectKeys` para estender essas listas quando você usar atributos personalizados (por exemplo, `variant` do Tailwind ou campos `slug` do CMS). As mesmas opções se aplicam ao JSX MDX durante a tradução de markdown (veja [protectAttributes / protectKeys](/pt-BR/reference/configuration#protectattributes-protectkeys)).

Habilite `features.translateDocs` e adicione um bloco `docs[]`, por exemplo:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Execute `npx ai-i18n-tools translate-docs` (ou `pnpm i18n:translate` em [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)). A fonte em inglês permanece em `src/pages/index.astro`; cada localidade de destino recebe `src/pages/{locale}/index.astro` com importações ajustadas para o nível de diretório extra (por exemplo, `../layouts/` → `../../layouts/`).

Dentro do **corpo do modelo**, literais de string em blocos `{expression}` (arrays inline, campos de objeto `title`/`desc`) são traduzidos quando são voltados para o usuário; valores entre aspas em atributos/chaves protegidos, literais dentro de `t('…')`, `<script>` e `<style>` são deixados inalterados. **O TypeScript do frontmatter não é traduzido** por este caminho — mantenha o frontmatter compartilhado (incluindo importações `t()` e arrays de dados) idêntico nas páginas em inglês e nas páginas de localidade, ou execute novamente `translate-docs` após editar a página em inglês para que as cópias de localidade recebam as alterações do frontmatter. Para texto apenas no frontmatter, use o [pipeline de strings de UI](#astro-website-ui-strings-ssg) em vez disso.

Veja [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) para a página de destino híbrida completa (HTML via `translate-docs`, rótulos das abas de captura de tela via `t()` + `translate-ui`).
