<a id="locale-assets-guide"></a>
# Guia de ativos de localidade

Este guia aborda como lidar com ativos específicos de localidade — capturas de tela (PNG, JPEG, WebP) e arquivos SVG ilustrados — em projetos que usam `ai-i18n-tools`. Explica cada padrão disponível, quando usá-lo e como configurar um projeto do zero para que a adição de mais localidades posteriormente não exija reestruturação.

Para referência de configuração de SVG, consulte a seção [`svg`](#svg) em [GETTING_STARTED.md](GETTING_STARTED.pt-BR.md). Para a opção `postProcessing.regexAdjustments`, consulte a [referência de configuração](GETTING_STARTED.pt-BR.md#configuration-reference).

| Caminho da configuração | Valor | Caso de uso | Observações |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | Arquivos README / USER-GUIDE com sufixo de localidade | Habilita o reescritor de links plano; combine com `flatPreserveRelativeDir` quando as fontes estiverem em subdiretórios |
| `docs[].docsOutput.style` | `"nested"` (padrão) | Subpastas simples de localidade sob `outputDir` | Sem reescritor de links plano |
| `docs[].docsOutput.style` | `"doc-system"` | Árvores de documentos com prefixo de localidade (geradores personalizados) | Defina `docsRoot` e `localeSubpath`; o reescritor de links plano não é executado |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | Layouts predefinidos `doc-system` | Aliases com valores padrão específicos do gerador para `localeSubpath` |
| `svg.style` | `"flat"` | Aplicativos web (`name.<locale>.svg` em `public/assets/`) | Separado do markdown `style`; usado por `translate-svg` |
| `svg.style` | `"nested"` | Saída SVG co-localizada no sistema de documentação | Frequentemente combinado com `pathTemplate` (Padrão E) |

Este guia utiliza exatamente as strings JSON da configuração — não apenas palavras em inglês — para que cópias traduzidas permaneçam inequívocas. Chaves legadas (`documentations`, `markdownOutput`) são aceitas no carregamento; prefira `docs` e `docsOutput` em novas configurações.

<small>**Leia em outros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [O que ai-i18n-tools faz (e não faz) com ativos](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [Projetar para i18n desde o início](#design-for-i18n-from-the-start)
  - [Markdown com `docsOutput.style = "flat"` (README, USER-GUIDE)](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [Sites de sistema de documentação (`docsOutput.style = "doc-system"`)](#doc-system-sites-docsoutputstyle--doc-system)
    - [Preset Docusaurus](#docusaurus-preset)
    - [Preset Astro/Starlight](#astrostarlight-preset)
  - [Aplicativos web (Next.js, Vite, etc.) com ativos SVG](#web-apps-nextjs-vite-etc-with-svg-assets)
- [Guia de decisão](#decision-guide)
- [Padrão A - Raster compartilhado](#pattern-a---shared-raster)
  - [Exemplo de implementação](#implementation-example)
- [Padrão B - Pasta por localidade (reescrever URL)](#pattern-b---per-locale-folder-url-rewriting)
  - [Estrutura de diretórios](#directory-layout)
  - [Contrato do script de captura de tela](#screenshot-script-contract)
  - [Configuração - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [Configuração - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [Preset - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [Preset - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [Padrão C - Raster colocado (`doc-system`)](#pattern-c---colocated-raster-doc-system)
  - [Estrutura de diretórios](#directory-layout-1)
  - [Contrato do script de captura de tela](#screenshot-script-contract-1)
  - [Configuração](#config)
  - [Pré-requisitos](#prerequisites)
  - [Exemplo de implementação](#implementation-example-1)
- [Padrão D - SVG traduzido com `svg.style = "flat"`](#pattern-d---translated-svg-with-svgstyle--flat)
  - [Configuração](#config-1)
  - [Referência do aplicativo](#app-reference)
  - [Recomendação de estrutura de origem](#source-layout-recommendation)
  - [Exemplo de implementação](#implementation-example-2)
- [Padrão E - SVG traduzido colocado (sistema de documentação)](#pattern-e---colocated-translated-svg-doc-system)
  - [Configuração](#config-2)
  - [Markdown de origem](#source-markdown)
  - [Localização do arquivo SVG de origem](#svg-source-location)
  - [Marcadores de posição `pathTemplate`](#pathtemplate-placeholders)
  - [Exemplo de implementação](#implementation-example-3)
- [O reescritor de links plano e o fluxo de duas etapas](#the-flat-link-rewriter-and-two-step-flow)
  - [Fluxo de duas etapas quando `docsOutput.style = "flat"`](#two-step-flow-when-docsoutputstyle--flat)
  - [Prefixo de profundidade por arquivo com `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` e `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [Erros comuns e solução de problemas](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## O que o ai-i18n-tools faz (e não faz) com ativos

`translate-docs` traduz conteúdo markdown/MDX — incluindo texto alternativo de imagens —, mas não copia, gera ou emite arquivos raster. Se uma página traduzida precisar de uma captura de tela específica da localidade, você deverá colocar esse arquivo no caminho que o markdown traduzido referenciará.

`translate-svg` é o único comando que emite arquivos binários específicos da localidade. Ele lê arquivos SVG de origem, traduz elementos de texto (`<text>`, `<title>`, `<desc>`) e grava um SVG de saída por localidade. Arquivos raster (PNG, JPEG, WebP, GIF) nunca são gravados pela ferramenta.

---

<a id="design-for-i18n-from-the-start"></a>
## Projetar para i18n desde o início

Escolher o layout de diretório correto antes que qualquer captura de tela exista é o fator mais importante para tornar os ativos específicos de localidade fáceis de gerenciar posteriormente. Adaptar o layout após dezenas de capturas de tela já terem sido confirmadas significa reestruturar caminhos e atualizar todas as referências em markdown.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown com `docsOutput.style = "flat"` (README, USER-GUIDE)

Armazene capturas de tela em um subdiretório codificado por localidade desde o início:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

Quando você adicionar i18n posteriormente, o seu script `take-screenshots` gravará em `images/screenshots/<locale>/` para cada localidade, e uma única regra `regexAdjustments` lidará com todas:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

O padrão genérico `[^/]+` corresponde a qualquer nome de pasta de localidade — não codifique rigidamente sua localidade de origem (por exemplo, `screenshots/en-GB/`), pois isso falhará se `sourceLocale` mudar algum dia.

Se você começar com caminhos que omitam o subdiretório de localidade (`images/screenshots/translate.png`), precisará reestruturar toda a árvore antes que o Padrão B possa funcionar.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Sites de sistema de documentação (`docsOutput.style = "doc-system"`)

Use para sites de documentação estática que armazenam páginas traduzidas em uma árvore com prefixo de localidade — Docusaurus i18n, Astro Starlight e geradores personalizados que seguem a mesma estrutura. Arquivos sob `docsRoot` são gravados em:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Defina `docs[].docsOutput.docsRoot` como a raiz da sua fonte em inglês (por exemplo, `"docs"` ou `"src/content/docs"`). Quando você definir `style: "doc-system"` diretamente, também deverá definir `localeSubpath` como o segmento de caminho que seu site usa entre `{locale}/` e o arquivo traduzido. Os aliases `"docusaurus"` e `"astro-starlight"` são layouts predefinidos `doc-system` com valores padrão `localeSubpath` (veja [Layouts de saída](GETTING_STARTED.pt-BR.md#output-layouts)).

| Alias predefinido | `localeSubpath` padrão | Saída de exemplo |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (vazio) | `src/content/docs/de/guide.md` |

O reescritor de links planos **não** é executado para `doc-system` (ao contrário de `"flat"`). `postProcessing.regexAdjustments` vê a URL original do Markdown de origem — normalmente um caminho absoluto ou relativo à raiz do site, como `/img/screenshots/en-GB/foo.png`.

**Padrão B** aplica-se quando as capturas de tela estão em uma árvore de URL estática compartilhada: use uma pasta codificada por localidade desde o início e uma regra genérica `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (veja [Configuração — sistema de documentação](#config---docsoutputstyle--doc-system)).

**Padrão C** aplica-se quando os ativos de cada localidade estão colocados ao lado do Markdown (sem reescrita de URL). Seu script de captura de tela deve gravar os PNGs em caminhos derivados de `{outputDir}`, `{locale}` e `{localeSubpath}` — o preset Docusaurus abaixo é o layout de referência.

<a id="docusaurus-preset"></a>
#### Preset Docusaurus

Dois hábitos na configuração do projeto eliminam toda a necessidade de expressões regulares posteriormente:

1. Crie um link simbólico `documentation/docs/assets → ../static/assets` antes de adicionar qualquer captura de tela. O webpack do Docusaurus segue links simbólicos por padrão, o que permite que os documentos de origem usem caminhos relativos que também serão usados pelos documentos traduzidos.

2. Coloque todos os ativos da documentação — PNGs e SVGs — em `static/assets/` (um único diretório). Não os separe entre `static/img/` (SVGs) e `static/assets/` (PNGs). Um local unificado significa que cada página de documento, em inglês ou traduzida, poderá referenciar o mesmo caminho relativo `../assets/name.ext`.

Referencie cada ativo com o caminho relativo estável `../assets/name.ext` no markdown de origem. Nunca use URLs absolutas `/img/` ou `/assets/` para ativos da documentação — essas URLs diferem entre a origem em inglês (servida de `static/`) e as localidades traduzidas (co-localizadas com os documentos traduzidos), o que obriga uma regra `regexAdjustments` a fazer a ponte entre elas.

Quando você adicionar i18n posteriormente, o script de captura de tela adota a divisão `getScreenshotDir` (veja [Padrão C](#pattern-c---colocated-raster-doc-system)) e `translate-svg` usa um `pathTemplate`. Nenhum ajuste de regex é necessário.

> **Observação:** `resolve.symlinks = false` em um `next.config.ts` desativa a resolução de symlinks apenas para a compilação webpack do aplicativo Next.js. Isso não afeta a compilação do site de documentação Docusaurus, que usa uma instância webpack separada.

<a id="astrostarlight-preset"></a>
#### Preset Astro/Starlight

Equivalente a `docsOutput.style = "doc-system"` com `localeSubpath: ""` — páginas traduzidas ficam diretamente sob `{outputDir}/{locale}/`.

Armazene capturas de tela em um caminho codificado por localidade desde o início:

```
public/img/screenshots/en-GB/screenshot.png
```

Use a expressão regular genérica em `regexAdjustments`:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Aplicativos web (Next.js, Vite, etc.) com ativos SVG

Mantenha os arquivos-fonte SVG em um diretório dedicado (por exemplo, `images/` ou `src/assets/`) e configure `svg.outputDir` para um diretório de serviço separado (por exemplo, `public/assets/`). Nunca misture SVGs de origem e arquivos de saída `translate-svg` na mesma pasta — torna-se impossível identificar quais arquivos são gerados.

Projete os SVGs para serem traduzíveis desde o início: use elementos `<text>`, `<title>` e `<desc>` para todos os rótulos legíveis por humanos. Evite incorporar texto como dados de caminho.

Habilite `forceLowercase: true` no bloco de configuração `svg` para evitar incompatibilidades de diferenciação de maiúsculas e minúsculas entre sistemas de arquivos e CDNs.

---

<a id="decision-guide"></a>
## Guia de decisão

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| Padrão | Tipo de ativo               | Tipo de site                                                              | Mecanismo da ferramenta                                      |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | Raster (compartilhado)      | documentos `docsOutput.style = "flat"`                                      | Reescritor de links por arquivo; geralmente sem regex        |
| B       | Raster (por localidade)     | `"flat"` ou `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`)    | Troca de segmento de localidade `regexAdjustments`         |
| C       | Raster (co-localizado)      | `"doc-system"` com ativos co-localizados (pré-definição Docusaurus)         | Script de captura posiciona arquivos; sem regex              |
| D       | SVG (traduzido)             | Aplicativo web                                                            | `translate-svg` com `svg.style = "flat"`                    |
| E       | SVG (traduzido, co-localizado)| `"doc-system"` com ativos co-localizados (pré-definição Docusaurus)         | `translate-svg` com `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## Padrão A - Raster compartilhado

Use quando uma única imagem for compartilhada entre todos os idiomas (sem variantes por idioma). Quando `docsOutput.style = "flat"`, o reescritor de links planos calcula o prefixo de profundidade para cada arquivo de saída, de modo que um ativo ao lado do arquivo de origem (por exemplo, `docs/figure.png` referenciado como `figure.png` a partir de `docs/page.md`) seja resolvido corretamente em todas as saídas traduzidas — nenhuma regra `postProcessing.regexAdjustments` é necessária.

Exemplo: este pacote traduz `docs/GETTING_STARTED.md` para `translated-docs/docs/GETTING_STARTED.<locale>.md`. A imagem irmã `docs/translation-dashboard.png` é referenciada como `translation-dashboard.png`. O reescritor calcula o prefixo por arquivo a partir do diretório do arquivo de saída até o diretório de origem (`../../docs/`), produzindo `../../docs/translation-dashboard.png`. A partir de `translated-docs/docs/`, isso é resolvido corretamente para `docs/translation-dashboard.png`.

Atualize o PNG com [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) quando a interface do painel mudar; a imagem não é por localidade.

Uma regra `postProcessing` ainda é necessária quando:
- O ativo é referenciado por meio de uma URL absoluta (por exemplo, `/img/figure.png`) — o reescritor trata apenas caminhos relativos
- Você deseja alterar a URL do ativo por outros motivos (por exemplo, mudar para uma CDN)

<a id="implementation-example"></a>
### Exemplo de implementação

Este repositório usa o Padrão A para a captura de tela do Painel de Tradução: [GETTING_STARTED.md](GETTING_STARTED.pt-BR.md#translation-dashboard) faz referência à imagem [translation-dashboard.png](../../docs/../docs/translation-dashboard.png) na mesma pasta. [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) define `docsOutput.style = "flat"` e `flatPreserveRelativeDir: true`; o prefixo de profundidade por arquivo resolve o caminho da imagem sem necessidade de `regexAdjustments` para a captura de tela.

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## Padrão B - Pasta por idioma (reescrita de URL)

Use para README/USER-GUIDE com `docsOutput.style = "flat"`, e para sites de sistemas de documentação (`docsOutput.style = "doc-system"` ou aliases `"docusaurus"` / `"astro-starlight"`) que servem capturas de tela a partir de uma árvore de URLs estáticos compartilhada.

<a id="directory-layout"></a>
### Estrutura de diretórios

<details>
<summary>Exemplo de árvore de diretórios de capturas de tela por localidade</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

O markdown de origem referencia o diretório da localidade de origem:

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Contrato do script de captura de tela

O script `take-screenshots` deve gravar arquivos para todas as localidades — não apenas a localidade de origem. O comando `translate-docs` reescreve caminhos, mas não cria arquivos. Um padrão comum:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Veja um exemplo simples de `bash` no [script de captura de tela em examples/nextjs-app](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh), ou um exemplo mais complexo em [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) no repositório do projeto [Transrewrt](https://github.com/wsj-br/transrewrt).

> **Observação:** As quatro subseções abaixo compartilham a mesma troca de segmento de idioma `regexAdjustments` (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Apenas o layout de saída e se o reescritor de links planos é executado primeiro diferem — vá para a subseção que corresponde ao seu `docsOutput.style`.

<a id="config---docsoutputstyle--flat"></a>
### Configuração - `docsOutput.style = "flat"`

O reescritor de links planos executa primeiro quando `docsOutput.style = "flat"` e acrescenta um prefixo de profundidade às URLs que não são de markdown. Para um `README.md` na raiz do repositório com `outputDir: "translated-docs/"`, ele adiciona `../`:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

A regra `regexAdjustments` substitui então o segmento de localidade dentro dessa URL já prefixada:

<details>
<summary>Exemplo de regexAdjustments para layout plano</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Resultado: `../images/screenshots/de/translate.png` — caminho relativo correto de `translated-docs/README.de.md` de volta à raiz do repositório.

A etapa `postProcessing` é executada após o reescritor de links planos. Escreva padrões `search` que correspondam ao segmento de localidade em qualquer lugar dentro da URL já prefixada — não é necessário incluir o prefixo `../` no padrão.

Exemplo de implementação (produção): [Transrewrt](https://github.com/wsj-br/transrewrt) — URLs de captura de tela em [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), reescrita de idioma em [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), script de captura [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) (veja o [contrato do script de captura de tela](#screenshot-script-contract) acima).

Exemplo de implementação (configuração de demonstração): [examples/nextjs-app](../../docs/../examples/nextjs-app/) — segundo bloco `docs[]` em [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); script auxiliar [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Configuração - `docsOutput.style = "doc-system"`

Padrão B genérico para qualquer site de sistema de documentação que referencie capturas de tela por meio de um prefixo de URL estático compartilhado. O reescritor de links simples não é executado; `postProcessing` reescreve o segmento de localidade na URL markdown original.

<details>
<summary>Exemplo de regexAdjustments para layout do sistema de documentação</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Defina `localeSubpath` para corresponder ao layout do seu gerador entre `{locale}/` e o arquivo traduzido, ou use um alias pré-definido (`"docusaurus"`, `"astro-starlight"`) em vez de `"doc-system"` quando os padrões forem adequados. O markdown de origem normalmente incorpora a localidade de origem na URL:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

Forneça arquivos PNG correspondentes no mesmo caminho para cada local de destino (por exemplo, `static/img/screenshots/de/screenshot.png`). Prefira `screenshots/[^/]+/` a codificar `screenshots/en-GB/` diretamente, para que a regra permaneça válida após uma mudança em `sourceLocale`.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Predefinição - `docsOutput.style = "docusaurus"`

Igual a `"doc-system"` com `localeSubpath = "docusaurus-plugin-content-docs/current"` padrão. O reescritor de links simples não é executado. `postProcessing` vê a URL markdown original. Páginas em inglês normalmente usam um caminho absoluto com a localidade de origem:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Exemplo de regexAdjustments para predefinição Docusaurus</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Forneça arquivos PNG correspondentes em `docs-site/static/img/screenshots/<locale>/screenshot.png`. Para configurações independentes da localidade de origem, prefira `screenshots/[^/]+/` em vez de `screenshots/en-GB/`.

Exemplo de implementação: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) com o primeiro bloco `docs[]` em [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Predefinição - `docsOutput.style = "astro-starlight"`

Igual a `"doc-system"` com `localeSubpath: ""` — páginas traduzidas ficam diretamente sob `{outputDir}/{locale}/`. Mesmo princípio do Padrão B da configuração genérica de sistema de documentação acima. O markdown de origem usa `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Exemplo de regexAdjustments para predefinição Astro Starlight</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Forneça PNGs em `public/img/screenshots/<locale>/screenshot.png`.

Exemplo de implementação: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) e [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## Padrão C - Raster colocalizado (`doc-system`)

Use quando um site `doc-system` colocaliza ativos específicos do idioma ao lado do markdown traduzido — nenhuma reescrita de URL é necessária. A predefinição do Docusaurus (`docsOutput.style = "docusaurus"`) é a implementação de referência; outros geradores que usam `"doc-system"` com um `localeSubpath` personalizado seguem a mesma ideia: ativos em inglês ficam em um caminho de idioma de origem, ativos traduzidos ficam em `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout-1"></a>
### Estrutura de diretórios

<details>
<summary>Exemplo de árvore de diretórios de ativos colocados juntos (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

Todos os documentos em todas as localidades usam o mesmo caminho relativo:

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

Para a localidade em inglês (`en-GB`), `../assets/` é resolvido através do link simbólico para `static/assets/`. Para localidades traduzidas, é resolvido diretamente para o próprio diretório `current/assets/` da localidade.

<a id="screenshot-script-contract-1"></a>
### Contrato do script de captura de tela

O script deve gravar os arquivos PNG no diretório correto para cada localidade. A função `getScreenshotDir` codifica a divisão:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Veja a implementação em produção em [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) no repositório [duplistatus](https://github.com/wsj-br/duplistatus) (cópia local de referência: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)).

<a id="config"></a>
### Configuração

Nenhuma regra `regexAdjustments` necessária para arquivos raster. `translate-docs` traduz o texto alternativo no markdown, mas a URL permanece inalterada:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Se o projeto também usar SVGs traduzidos, o Padrão E os trata e os coloca junto com os PNGs em `current/assets/` sem regex adicional.

<a id="prerequisites"></a>
### Pré-requisitos

- O link simbólico `docs/assets` deve existir: `ln -s ../static/assets documentation/docs/assets`
- O webpack do Docusaurus segue links simbólicos por padrão (`resolve.symlinks` tem como padrão `true` nas compilações do Docusaurus)
- O link simbólico precisa existir apenas para o idioma de origem — compilações traduzidas não o utilizam

<a id="implementation-example-1"></a>
### Exemplo de implementação

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` em [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts); documentos em inglês referenciam PNGs colocalizados (por exemplo, [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) com `../assets/screen-dashboard-summary.png`); sem `regexAdjustments` de PNG em [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json). Os SVGs do Padrão E do mesmo projeto são colocados nos mesmos diretórios `current/assets/` (veja abaixo).

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## Padrão D - SVG traduzido com `svg.style = "flat"`

Use quando um aplicativo web incorporar ilustrações ou diagramas SVG específicos do idioma e fizer referência a eles pelo código de idioma em tempo de execução.

<a id="config-1"></a>
### Configuração

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` lê todos os `.svg` dentro de `images/` e gera um arquivo por idioma:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### Referência do aplicativo

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Recomendação de estrutura de origem

Mantenha os SVGs de origem separados do diretório de saída. Com `sourcePath: "images"` e `outputDir: "public/assets"`, os dois diretórios são distintos. Nunca defina ambos como o mesmo diretório.

<a id="implementation-example-2"></a>
### Exemplo de implementação

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — bloco `svg` em [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); fonte [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); saídas por localidade em [public/assets/](../../docs/../examples/nextjs-app/public/assets/) (por exemplo, `translation_demo_svg.de.svg`); URL em tempo de execução em [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## Padrão E - SVG traduzido colocado junto (doc-system)

Use em sites de sistema de documentação onde ilustrações SVG traduzidas devem aparecer ao lado da documentação traduzida no diretório de conteúdo de cada localidade — o mesmo local dos screenshots raster do Padrão C. O preset do Docusaurus é o exemplo principal.

<a id="config-2"></a>
### Configuração

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` escreve um SVG por localidade no mesmo diretório `current/assets/` que o Padrão C usa para PNGs:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Markdown de origem

Todos os documentos em todas as localidades usam o mesmo caminho relativo:

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

Para a localidade em inglês, o link simbólico `docs/assets → ../static/assets` resolve isso. Para localidades traduzidas, ele resolve diretamente para `current/assets/`.

Nenhuma regra `regexAdjustments` é necessária porque os documentos de origem em inglês e os documentos de saída traduzidos usam caminhos idênticos.

<a id="svg-source-location"></a>
### Localização do código-fonte SVG

Recomendado: armazenar os SVGs de origem em `documentation/static/assets/` ao lado dos PNGs em en-GB. Isso mantém todos os ativos da documentação em um único local, e o mesmo link simbólico `docs/assets` cobre ambos. As entradas `svg.sourcePath` apontam então para `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### Espaços reservados `pathTemplate`

| Substituto               | Valor                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | Caminho absoluto resolvido de `svg.outputDir`              |
| `{locale}` | Código da localidade de destino |
| `{LOCALE}` | Código da localidade em maiúsculas |
| `{relPath}` | Caminho relativo da raiz `sourcePath` até o SVG de origem |
| `{stem}` | Nome do arquivo sem extensão |
| `{basename}` | Nome do arquivo com extensão |
| `{extension}` | Extensão incluindo o ponto |
| `{relativeToSourceRoot}` | Caminho relativo da raiz `sourcePath` mais próxima |

Referência completa na [tabela de configuração SVG](GETTING_STARTED.pt-BR.md#svg).

<a id="implementation-example-3"></a>
### Exemplo de implementação

[duplistatus](https://github.com/wsj-br/duplistatus) — bloco `svg` aninhado com `pathTemplate` em [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json); SVGs de origem listados em `documentation/static/img/` (por exemplo, [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` gera arquivos por localidade em `documentation/i18n/<locale>/…/current/assets/` ao lado dos PNGs do Padrão C; os documentos os incorporam hoje via `/img/duplistatus_*.svg` (por exemplo, [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)). Veja [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) para a migração planejada para caminhos `../assets/` e remoção da ponte SVG `regexAdjustments`.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## Reescrita de links plana e fluxo em duas etapas

Para `docsOutput.style = "flat"` (e a menos que `rewriteRelativeLinks: false` ou um `pathTemplate` personalizado seja definido), um reescritor integrado é executado antes de `postProcessing`. Ele trata links entre documentos (adicionando sufixos de localidade) e acrescenta um prefixo de profundidade às URLs de ativos não markdown.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Fluxo de duas etapas quando `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Exemplo com `outputDir: "translated-docs/"` e fonte `README.md` na raiz do repositório:

1. Reescritor de link plano: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (um `../` para `translated-docs/`)
2. Expressão regular `postProcessing` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Para `docsOutput.style = "doc-system"` (incluindo `"docusaurus"`, `"astro-starlight"` e `"nested"`), o reescritor de links planos não é executado. `postProcessing` recebe a URL original do markdown traduzido (normalmente um caminho absoluto como `/img/screenshots/en-GB/foo.png`).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Prefixo de profundidade por arquivo com `flatPreserveRelativeDir`

O prefixo de profundidade é calculado por arquivo de saída — não globalmente para todo o lote. Para cada arquivo de origem, o reescritor calcula o caminho relativo do diretório do arquivo de saída de volta ao diretório do arquivo de origem e usa esse caminho como prefixo.

Isso significa que com `flatPreserveRelativeDir: true`, arquivos de origem em subdiretórios recebem o prefixo correto automaticamente. Por exemplo, `docs/GETTING_STARTED.md` gera saída para `translated-docs/docs/GETTING_STARTED.<locale>.md`. O prefixo por arquivo é `../../docs/`, então um recurso `translation-dashboard.png` (relativo à origem) torna-se `../../docs/translation-dashboard.png` — o que é resolvido corretamente de `translated-docs/docs/` de volta para `docs/translation-dashboard.png`.

Nenhuma correção por expressão regular `postProcessing` é necessária para ativos com caminhos relativos localizados ao lado dos arquivos de origem.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` e `linkRewriteDocsRoot`

| Opção                                   | Efeito                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Habilita ou desabilita explicitamente o reescritor de links planos (substitui o padrão quando `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Diretório raiz a partir do qual `depthPrefix` é calculado (padrão `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Afeta o layout do caminho de saída, que o reescritor utiliza ao calcular os caminhos de destino para arquivos traduzidos conhecidos       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## Erros comuns e solução de problemas

**Diretório de localidade ausente nos caminhos de capturas de tela**
`images/screenshots/screenshot.png` — não é possível distinguir variantes de localidade e não pode ser reescrito. Restruture para `images/screenshots/<locale>/screenshot.png` antes de aplicar o Padrão B.

**Localidade de origem codificada diretamente na expressão regular**
`"search": "screenshots/en-GB/"` — falha silenciosamente se `sourceLocale` mudar. Use `"search": "screenshots/[^/]+/"` em vez disso.

**Arquivos SVG de origem e saída no mesmo diretório**
Se `svg.sourcePath` e `svg.outputDir` se sobrepuserem, arquivos gerados se misturam com arquivos de origem editados manualmente. Mantenha-os em diretórios separados.

**URLs estáticas absolutas do Docusaurus para SVGs co-localizados**
`/img/diagram.svg` (de `static/img/`) exige uma regra `regexAdjustments` para reescrever para `../assets/` na saída traduzida. Coloque os SVGs de origem em `static/assets/` e use `../assets/diagram.svg` relativo desde o início para evitar isso completamente.

**Link simbólico ausente `docs/assets` no Docusaurus**
Sem o link simbólico, documentos de origem em `docs/user-guide/` não podem referenciar PNGs ou SVGs em `static/assets/` por meio de um caminho relativo. Configure o link simbólico na criação do projeto: `ln -s ../static/assets documentation/docs/assets`.

**O script `take-screenshots` captura apenas a localidade de origem**
O Padrão B exige arquivos PNG para cada localidade. Se o script capturar apenas `en-GB`, os documentos traduzidos terão caminhos reescritos apontando para arquivos ausentes.
