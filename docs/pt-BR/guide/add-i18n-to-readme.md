<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Adicione i18n ao seu README e aos seus documentos Markdown

Esta página é para um repositório no GitHub, GitLab, Bitbucket ou qualquer outro host cujos leitores começam pelo `README.md` e por alguns outros arquivos Markdown. Não há nenhum framework de site de documentação para configurar. O projeto comum também tem um aplicativo ou uma CLI, e o README deve usar os mesmos idiomas e os mesmos termos de produto que esse aplicativo. Uma biblioteca ou um repositório somente de documentação, sem strings de interface do usuário, é o outro caso, abordado abaixo.

A ferramenta mantém o `README.md` no lugar e grava um arquivo de localidade por idioma, por exemplo, `translated-docs/README.de.md`. Uma linha de idiomas dentro do README conecta esses arquivos.

<a id="install-and-choose-a-provider"></a>
## Qual é a sua configuração?

| Você tem | Scaffold | Então |
| --- | --- | --- |
| Um aplicativo JS/TS mais um README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, o padrão) | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) para o `t()` e esta página para o README |
| Um aplicativo Python mais um README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) para o aplicativo e esta página para o README |
| Qualquer outro template, mais um README | adicione `--with-readme` a esse comando `init` | Esta página para o bloco do README |
| Somente README e Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | Esta página |

`--with-readme` não tem efeito em `ui-markdown` e `docs-markdown`, porque esses templates já incluem o bloco do README.

<a id="initialise-the-project"></a>
## O que você obtém

- O `README.md` permanece como o arquivo de origem. Os hosts continuam a renderizá-lo como a página inicial do repositório.
- Cada localidade de destino é um arquivo no mesmo nível, como `translated-docs/README.de.md`.
- A linha de idiomas na origem e em cada tradução lista todas as localidades, com links que funcionam a partir do arquivo que o leitor está visualizando.

Adicione `CONTRIBUTING.md`, `CHANGELOG.md` ou uma pasta `docs/` ao mesmo bloco quando esses arquivos também devem ser traduzidos. Consulte [Mais do que o README](#step-3-more-than-the-readme).

<a id="run-the-agent-prompt"></a>
## Instalar

Instale a CLI ([Instalação](/pt-BR/guide/installation)) e defina a chave de API para o seu provedor ([Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key)). O Ollama não precisa de chave.

Um repositório com um `package.json` instala o pacote como uma dependência de desenvolvimento. Um repositório sem um projeto Node.js pode executar o `npx ai-i18n-tools` ou usar o [executável autônomo](/pt-BR/guide/installation#standalone-executables).

<a id="review-the-result"></a>
## Scaffold

Aplicativo JS/TS e README (um comando; `ui-markdown` é o template padrão):

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, HTML puro, VitePress, Docusaurus ou outro template, com o mesmo bloco do README adicionado:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

Somente arquivos README e Markdown:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

`init` grava apenas o `ai-i18n-tools.config.json`. Ele não edita o `README.md`. Quando a configuração inclui um bloco do README, ele imprime a linha marcadora para colar e avisa se o `README.md` estiver ausente. Uma configuração existente não é alterada: adicione o bloco manualmente, conforme [Adicionar o bloco a uma configuração que você já tem](#add-the-block-to-a-config-you-already-have).

<a id="choose-models-and-translate"></a>
## Configurar

Quatro chaves são importantes:

- `sourceLocale`: o idioma em que o README foi escrito. Qualquer idioma é válido. O inglês é um exemplo comum neste guia.
- `targetLocales`: os idiomas a serem adicionados.
- `features.translateDocs`: deve ser verdadeiro. Uma configuração híbrida também define `features.translateUIStrings`.
- `docs[].contentPaths`: os arquivos e as pastas Markdown a serem traduzidos. O scaffold lista `README.md`.

<details>
<summary>Híbrido: strings da interface do usuário e o README</summary>

`ui-markdown` grava este formato. `ui` é o catálogo do aplicativo. A entrada `docs` é o README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>Somente README e Markdown</summary>

`docs-markdown` desativa as strings da interface do usuário e mantém o mesmo bloco do README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

As configurações da lista de idiomas são as mesmas do exemplo híbrido. Elas foram omitidas aqui apenas para manter o snippet curto. `init -t docs-markdown` as grava.

</details>

<a id="check-one-language"></a>
### Adicionar o bloco a uma configuração que você já tem

Anexe o objeto `docs` do exemplo híbrido e defina `features.translateDocs` como `true`. Se a configuração já tiver um array `docs` (um site VitePress ou Docusaurus, por exemplo), anexe o objeto README como uma segunda entrada. `sync` executa todos os blocos. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) faz isso: um bloco para o site de documentação, um bloco simples para `README.md`.

<a id="keep-it-translated"></a>
## Adicionar a lista de idiomas

Coloque esta linha em `README.md`, onde os leitores devem ver os outros idiomas. Um rótulo curto na linha acima é prosa normal e será traduzido.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

A linha pode estar vazia. `translate-docs` substitui tudo, do marcador de abertura ao marcador de fechamento, por um link por localidade. Marcadores dentro de blocos de código delimitados são ignorados, portanto, uma amostra de configuração no mesmo arquivo não corresponde. Detalhes: [Seletor de idiomas](/pt-BR/guide/documents/language-switcher).

<a id="hybrid-tips"></a>
## Traduzir

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` executa as etapas ativadas em ordem: `extract` e `translate-ui` quando as strings da interface do usuário estão ativadas, depois `translate-docs`. Um cache é compartilhado, portanto, uma frase já traduzida para o aplicativo é reutilizada quando aparece no README. Os catálogos da interface do usuário também são passados para a tradução de documentos como dicas de glossário (`ui[].uiGlossary`, ativado por padrão), o que mantém os nomes de botões e recursos consistentes. Consulte [Glossário](/pt-BR/guide/glossary).

Os nomes dos idiomas na linha vêm de `ui-languages.json`, que `extract` grava ao lado do catálogo da interface do usuário. Uma configuração somente de README não tem catálogo de interface do usuário, portanto, a linha usa a lista de idiomas incluída. Os rótulos ainda são os nomes nativos. Execute `generate-ui-languages` somente quando quiser um manifesto de projeto próprio.

Faça o commit de `translated-docs/` e abra o README traduzido no host. Os links relativos entre o README de origem e `translated-docs/README.de.md` são reescritos para cada arquivo.

<a id="say-that-the-translation-is-automatic"></a>
## Dicas para o modo híbrido

- Traduza o README para menos idiomas que o aplicativo com `docs[].targetLocales`. Consulte [Menos localidades para documentos](/pt-BR/guide/combining-pipelines#fewer-locales-for-documents).
- Coloque os termos do produto em `glossary.userGlossary`. O mesmo CSV é usado para as strings da interface do usuário e para o README.
- Execute apenas um lado com `ai-i18n-tools sync --no-docs` ou `ai-i18n-tools sync --no-ui`.

<a id="do-it-by-hand"></a>
## Mais do que o README

Adicione caminhos a `contentPaths`. `flatPreserveRelativeDir` mantém as pastas, então `docs/guide.md` se torna `translated-docs/docs/guide.de.md` em vez de colidir com outro `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Um arquivo `.translate-ignore` ignora os caminhos que você não quer que sejam traduzidos. `init --with-translate-ignore` grava um arquivo inicial. Delimitadores de código, URLs e âncoras de cabeçalho não são traduzidos. Consulte [Layouts de saída](/pt-BR/guide/documents/output-layouts), [Links de âncora](/pt-BR/guide/documents/anchor-links) e [Reescrita de links](/pt-BR/guide/documents/link-rewriting).

Capturas de tela que diferem por idioma: [Imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/).

<a id="step-1-configure-the-docs-block"></a>
## Links no host

Links para outros arquivos no repositório são reescritos para o arquivo de localidade. Links para um site de documentação publicado não são reescritos. Este repositório adiciona um prefixo de localidade aos URLs do site de documentação usando `regexAdjustments`:

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

O reescritor de links simples é executado primeiro, depois estas substituições. Consulte [Reescrita de links](/pt-BR/guide/documents/link-rewriting).

<a id="add-the-block-to-a-config-you-already-have"></a>
## Mantenha traduzido

Reexecute `sync` depois que o README de origem ou as strings do aplicativo mudarem. O cache envia apenas o texto novo ou alterado para o modelo. Faça o commit dos arquivos atualizados em `translated-docs/`.

O workflow abaixo é um exemplo, não uma action publicada. Ele instala a CLI e executa `sync` quando `README.md` muda. Armazene a chave do provedor como um secret do repositório. Revise o diff de `translated-docs/` e faça o commit, ou faça o push para um branch e abra um pull request.

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Use a variável de ambiente para o provedor que você configurou. Ollama não se aplica em um runner hospedado, a menos que você o instale lá.

<a id="step-2-add-the-language-list"></a>
## Informar que a tradução é automática

As traduções de IA podem estar incorretas. Uma nota curta no final do README, como a que está no [README deste repositório](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informa aos leitores que os outros idiomas foram traduzidos por máquina e devem ser verificados antes de você confiar neles.

<a id="step-3-more-than-the-readme"></a>
## Não é o seu caso?

| Se você tem | Leia |
| --- | --- |
| Strings de UI do aplicativo e nenhum README para traduzir | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Um site VitePress, Docusaurus, Starlight, Nextra, Fumadocs ou Astro | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website). Adicione `--with-readme` quando o README do repositório também precisar ser traduzido |
| Um arquivo HTML por localidade | [Páginas HTML](/pt-BR/guide/documents/html-pages) |
| A referência completa de `translate-docs` | [Documentos](/pt-BR/guide/documents/) |

<a id="step-4-links-on-the-host"></a>
## Exemplos

| Projeto | O que ele mostra |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | Um pequeno aplicativo Node mais um bloco de README simples |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | Strings de UI, um site de documentação e um bloco de README simples separado |
| Este repositório | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): bloco de README simples, depois o site VitePress |

<a id="not-your-case"></a>
## Prompt do agente

Copie isto no Cursor ou em outro agente de codificação. Ele prepara o repositório. Ele não traduz o README.

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
