<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Adicione i18n ao seu README e aos seus documentos Markdown

Esta página pega um repositório no GitHub, GitLab, Bitbucket ou qualquer outro host cujos leitores começam de `README.md` e adiciona um arquivo por idioma. Não há um framework de site de documentação para configurar. O projeto usual também tem um aplicativo ou CLI, e o README deve usar os mesmos idiomas e os mesmos termos de produto que esse aplicativo. Um repositório de biblioteca ou apenas de documentação sem strings de UI é o outro caso, abordado abaixo.

<a id="what-you-get"></a>

A ferramenta deixa `README.md` no lugar. Os hosts continuam a renderizá-lo como a página inicial do repositório. Cada localidade de destino é um arquivo irmão, como `translated-docs/README.de.md`. Uma linha de idioma dentro do README conecta esses arquivos, e a mesma linha é escrita em todas as traduções, com links que funcionam a partir do arquivo que o leitor está visualizando. `translate-docs` preenche essa linha. Ele substitui tudo, desde o marcador de abertura até o marcador de fechamento, por um link por localidade. Adicione `CONTRIBUTING.md`, `CHANGELOG.md` ou uma pasta `docs/` ao mesmo bloco quando esses arquivos também precisarem ser traduzidos. Veja [Mais que o README](#step-3-more-than-the-readme).

A maneira mais rápida é dar a um agente de codificação o prompt desta página. Ele verifica a configuração e adiciona o marcador da lista de idiomas. Você instala a CLI, escolhe o provedor e inicializa o projeto por conta própria, porque isso requer sua chave de API e suas escolhas. Você também executa a tradução por conta própria, porque ela gasta dinheiro da sua conta.

Um site VitePress, Docusaurus, Starlight, Nextra, Fumadocs ou Astro usa [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website). Adicione `--with-readme` quando o README do repositório também precisar ser traduzido. Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

O fluxo:

1. [Instale o CLI e escolha um provedor](#install-and-choose-a-provider).
2. [Inicialize o projeto](#initialise-the-project) com `init`.
3. [Execute o prompt do agente](#run-the-agent-prompt).
4. [Revise o resultado](#review-the-result).
5. [Escolha modelos e traduza](#choose-models-and-translate), depois verifique um idioma.
6. [Mantenha-o traduzido](#keep-it-translated).

Prefere fazer as alterações você mesmo, ou quer saber o que o prompt faz? [Faça manualmente](#do-it-by-hand) percorre os mesmos passos um por um.

<a id="install-and-choose-a-provider"></a>
## Instalar e escolher um provedor

Você faz esta parte, não o agente. O instalador altera sua máquina, e a chave de API é um segredo que pertence ao seu shell, não a um prompt.

Um repositório com um `package.json` instala o pacote como uma dependência de desenvolvimento. Outras opções de instalação: [Instalação](/pt-BR/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` e `yarn add --dev ai-i18n-tools` também funcionam.

Um repositório sem projeto Node.js pode usar o executável autônomo. Linux e macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

O instalador verifica `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` e o adiciona a `PATH`. Os binários não são autenticados ou assinados com Authenticode. Etapas manuais e nomes de ativos: [Executáveis autônomos](/pt-BR/guide/installation#standalone-executables). `npx ai-i18n-tools` também funciona quando o Node.js está instalado e você não quer uma dependência de projeto.

Verifique a instalação:

```bash
ai-i18n-tools --version
```

Em seguida, escolha um provedor e defina sua chave de API no shell que executará a tradução. Por exemplo, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers). Anote o nome do provedor, porque você o passará para `init` na próxima etapa. O agente nunca precisa da chave: ele apenas executa comandos que não fazem chamadas de modelo. Você usa a chave mais tarde, quando [traduz](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar o projeto

Você executa isso uma vez, antes do prompt. Ele escreve a configuração e usa o provedor que você escolheu acima. Ele não edita `README.md`. Quando a configuração inclui um bloco README, ele imprime a linha do marcador para colar e avisa se `README.md` está faltando.

| Você tem | Scaffold | Então |
| --- | --- | --- |
| Um aplicativo JS/TS mais um README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, o padrão) | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) para o `t()` e esta página para o README |
| Um aplicativo Python mais um README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) para o aplicativo e esta página para o README |
| Qualquer outro template, mais um README | adicione `--with-readme` a esse comando `init` | Esta página para o bloco do README |
| Somente README e Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | Esta página |

`--with-readme` não tem efeito sobre `ui-markdown` e `docs-markdown`, porque esses modelos já incluem o bloco README.

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

Em seguida, edite `sourceLocale` e `targetLocales` em `ai-i18n-tools.config.json`. `sourceLocale` é o idioma em que o README está escrito. Qualquer idioma BCP-47 é válido. `features.translateDocs` deve ser verdadeiro. Uma configuração híbrida também define `features.translateUIStrings`. `docs[].contentPaths` lista os arquivos e pastas Markdown a serem traduzidos. O scaffold lista `README.md`.

Execute `init` uma vez. Ele reescreve `ai-i18n-tools.config.json` a cada execução, então uma segunda execução descarta as edições que você fez. Uma configuração existente é mantida quando você ignora `init`: o prompt anexa o bloco README, e [Etapa 1](#step-1-configure-the-docs-block) mostra a mesma edição manualmente.

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto em seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se outros arquivos Markdown precisarem ser traduzidos, nomeie-os na mesma mensagem.

O agente primeiro verifica se a CLI e a configuração existem e para com instruções se uma estiver faltando. Em seguida, ele funciona em duas partes:

- A Parte 1 anexa o bloco README simples quando a configuração ainda não lista `README.md`.
- A Parte 2 adiciona o marcador da lista de idiomas ao README de origem.

Ele não instala a CLI, inicializa a configuração, lê sua chave de API, preenche os links de idioma ou traduz. A tradução é a etapa após a revisão, e você a executa.

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
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
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## Revisar o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. Deve ser a configuração e o marcador. A prosa de origem deve ser a mesma de antes. `git diff --stat` mostra o quanto mudou.
- Nada em `translated-docs/` ou outra árvore de localidade gerada foi editado.
- `ai-i18n-tools.config.json` analisa, `features.translateDocs` é verdadeiro e exatamente um bloco de documentos lista `README.md`.
- O marcador está em `README.md` e não dentro de um bloco de código cercado. Uma amostra do marcador dentro de uma cerca está bem. O real está fora.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ela usa sua chave de API e gasta dinheiro em sua conta.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. O mesmo ranking está na aba [Modelos](/pt-BR/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Em seguida, traduza:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` executa as etapas ativadas em ordem: `extract` e `translate-ui` quando as strings da interface do usuário estão ativadas, depois `translate-docs`. Um cache é compartilhado, portanto, uma frase já traduzida para o aplicativo é reutilizada quando aparece no README. Os catálogos da interface do usuário também são passados para a tradução de documentos como dicas de glossário (`ui[].uiGlossary`, ativado por padrão), o que mantém os nomes de botões e recursos consistentes. Consulte [Glossário](/pt-BR/guide/glossary).

Os nomes dos idiomas na linha vêm de `ui-languages.json`, que `extract` grava ao lado do catálogo da interface do usuário. Uma configuração somente de README não tem catálogo de interface do usuário, portanto, a linha usa a lista de idiomas incluída. Os rótulos ainda são os nomes nativos. Execute `generate-ui-languages` somente quando quiser um manifesto de projeto próprio.

Faça o commit de `translated-docs/` e abra o README traduzido no host. Os links relativos entre o README de origem e `translated-docs/README.de.md` são reescritos para cada arquivo.

<a id="check-one-language"></a>
### Verificar um idioma

Abra `translated-docs/README.de.md` (ou qualquer código de destino que você escolheu) no host e no próprio arquivo. A linha de idioma deve listar todos os locais, com links que funcionem a partir do arquivo que você está visualizando. Uma frase que ainda estava no idioma de origem estava dentro de um bloco de código, uma URL ou uma âncora de cabeçalho, ou não estava em `contentPaths`.

<a id="keep-it-translated"></a>
## Mantenha traduzido

Execute `ai-i18n-tools sync` novamente após a alteração do README de origem ou das strings do aplicativo. O cache envia apenas texto novo ou alterado para o modelo. Confirme os arquivos atualizados em `translated-docs/`. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

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

<a id="hybrid-tips"></a>
### Dicas híbridas

- Traduza o README para menos idiomas que o aplicativo com `docs[].targetLocales`. Consulte [Menos localidades para documentos](/pt-BR/guide/combining-pipelines#fewer-locales-for-documents).
- Coloque os termos do produto em `glossary.userGlossary`. O mesmo CSV é usado para as strings da interface do usuário e para o README.
- Execute apenas um lado com `ai-i18n-tools sync --no-docs` ou `ai-i18n-tools sync --no-ui`.

<a id="say-that-the-translation-is-automatic"></a>
### Diga que a tradução é automática

As traduções de IA podem estar incorretas. Uma nota curta no final do README, como a que está no [README deste repositório](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informa aos leitores que os outros idiomas foram traduzidos por máquina e devem ser verificados antes de você confiar neles.

<a id="do-it-by-hand"></a>
## Faça isso manualmente

Siga estas etapas se preferir fazer as alterações você mesmo ou se quiser saber o que o prompt faz. As duas primeiras correspondem às partes do prompt. As duas últimas são para arquivos extras e para links que apontam para um site publicado. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#choose-models-and-translate) no final.

1. [Configure o bloco de documentação](#step-1-configure-the-docs-block).
2. [Adicione a lista de idiomas](#step-2-add-the-language-list).
3. [Mais do que o README](#step-3-more-than-the-readme).
4. [Links no host](#step-4-links-on-the-host).

<a id="step-1-configure-the-docs-block"></a>
## Etapa 1: Configure o bloco de documentação

Quatro chaves são importantes:

- `sourceLocale`: o idioma em que o README foi escrito. Qualquer idioma é válido. O inglês é um exemplo comum neste guia.
- `targetLocales`: os idiomas a serem adicionados.
- `features.translateDocs`: deve ser verdadeiro. Uma configuração híbrida também define `features.translateUIStrings`.
- `docs[].contentPaths`: os arquivos e as pastas Markdown a serem traduzidos. O scaffold lista `README.md`.

Pule esta etapa quando `init` já tiver escrito o bloco README. Use-o quando estiver editando uma configuração que já existe.

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

<a id="add-the-block-to-a-config-you-already-have"></a>
### Adicionar o bloco a uma configuração que você já tem

Anexe o objeto `docs` do exemplo híbrido e defina `features.translateDocs` como `true`. Se a configuração já tiver um array `docs` (um site VitePress ou Docusaurus, por exemplo), anexe o objeto README como uma segunda entrada. `sync` executa todos os blocos. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) faz isso: um bloco para o site de documentação, um bloco simples para `README.md`.

Não adicione um segundo bloco quando um já listar `README.md`.

<a id="step-2-add-the-language-list"></a>
## Etapa 2: Adicione a lista de idiomas

Coloque esta linha em `README.md`, onde os leitores devem ver os outros idiomas. Um rótulo curto na linha acima é prosa normal e será traduzido.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

A linha pode estar vazia. `translate-docs` substitui tudo, do marcador de abertura ao marcador de fechamento, por um link por localidade. Marcadores dentro de blocos de código delimitados são ignorados, portanto, uma amostra de configuração no mesmo arquivo não corresponde. Detalhes: [Seletor de idiomas](/pt-BR/guide/documents/language-switcher).

<a id="step-3-more-than-the-readme"></a>
## Etapa 3: Mais do que o README

Adicione caminhos a `contentPaths`. `flatPreserveRelativeDir` mantém as pastas, então `docs/guide.md` se torna `translated-docs/docs/guide.de.md` em vez de colidir com outro `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Um arquivo `.translate-ignore` ignora os caminhos que você não quer que sejam traduzidos. `init --with-translate-ignore` grava um arquivo inicial. Delimitadores de código, URLs e âncoras de cabeçalho não são traduzidos. Consulte [Layouts de saída](/pt-BR/guide/documents/output-layouts), [Links de âncora](/pt-BR/guide/documents/anchor-links) e [Reescrita de links](/pt-BR/guide/documents/link-rewriting).

Capturas de tela que diferem por idioma: [Imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/).

<a id="step-4-links-on-the-host"></a>
## Etapa 4: Links no host

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

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#choose-models-and-translate).

<a id="not-your-case"></a>
## Não é o seu caso?

| Se você tem | Leia |
| --- | --- |
| Strings de UI do aplicativo e nenhum README para traduzir | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Catálogos Django, Flask-Babel, ou um aplicativo que já usa GNU gettext | [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Um site VitePress, Docusaurus, Starlight, Nextra, Fumadocs ou Astro | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website). Adicione `--with-readme` quando o README do repositório também precisar ser traduzido |
| Um arquivo HTML por localidade | [Páginas HTML](/pt-BR/guide/documents/html-pages) |
| A referência completa de `translate-docs` | [Documentos](/pt-BR/guide/documents/) |

<a id="examples"></a>
## Exemplos

| Projeto | O que ele mostra |
| --- | --- |
| [console-app](/pt-BR/examples#console-app) | Um pequeno aplicativo Node mais um bloco README simples |
| [nextjs-app](/pt-BR/examples#nextjs-app) | Strings de UI, um site de documentação e um bloco README simples separado |
| Este repositório | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): bloco de README simples, depois o site VitePress |
