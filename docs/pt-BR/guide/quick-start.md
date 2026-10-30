<a id="quick-start"></a>
# Início rápido

Esta página aborda como levar um projeto de um único idioma aos seus primeiros arquivos traduzidos. Ela se destina a um app JS/TS, um app Python, um site ou site de documentação, ou um README de repositório e outros arquivos Markdown. Ela pressupõe:

- Node.js `>=22.16.0` ou o [executável autônomo](/pt-BR/guide/installation#standalone-executables) para um projeto Python.
- Uma chave de API para um provedor de LLM ou uma instalação local do Ollama.
- O projeto está sob controle de versão, para que você possa revisar o que a ferramenta escreve.

Duas coisas diferem entre os projetos: como a ferramenta encontra seu texto e como seu app carrega o resultado. A seção [Escolha seu caminho](#pick-your-path) abaixo direciona você para o guia certo para isso.

<a id="runnable-examples"></a>
## Exemplos executáveis

Prefere ver um projeto finalizado primeiro? Copie um sem clonar o repositório:

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

Substitua `console-app` por qualquer outro exemplo de Node.js. Os exemplos em Python não têm `package.json`; copie-os da mesma forma ou baixe `ai-i18n-tools-python-examples.zip` do Release do GitHub. A lista completa, com o que cada um demonstra, está na página [Exemplos](/pt-BR/examples).

<a id="install"></a>
## Instalar

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` e `yarn add --dev ai-i18n-tools` também funcionam. Projetos em Python instalam o executável autônomo e não precisam do Node.js. Linux e macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`. Outras opções de instalação: [Instalação](/pt-BR/guide/installation).

<a id="provider-and-api-key"></a>
## Provedor e chave de API

Todo comando que chama um LLM (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg` e `sync`) precisa de ambos:

1. Pelo menos um provedor em `ai-i18n-tools.config.json`: um bloco `providers.<name>` com `translationModels` e uma chave `provider` de nível superior quando mais de um provedor estiver configurado. `init -P <provider>` estrutura essa predefinição. Para adicionar provedores, consulte [Provedores de LLM](/pt-BR/guide/providers-and-models). Para escolher a lista de modelos, consulte [Modelos de IA](/pt-BR/guide/ai-models).
2. A chave de API correspondente no seu ambiente ou em um arquivo `.env` na raiz do projeto. Cada predefinição integrada lê uma variável nomeada da [tabela de predefinições](/pt-BR/guide/providers-and-models#built-in-providers), por exemplo, `OPENROUTER_API_KEY` com `-P openrouter` ou `OPENAI_API_KEY` com `-P openai`. O Ollama usa um endpoint local e não precisa de chave.

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`, `status` e outros comandos que não chamam o LLM não precisam de nenhum dos dois. Mais sobre arquivos de ambiente e PATH: [Instalação](/pt-BR/guide/installation#using-the-cli).

<a id="pick-your-path"></a>
## Escolha seu caminho

Identifique o que você tem, execute os comandos no bloco correspondente e depois continue no guia vinculado.

<a id="a-jsts-app"></a>
### Um app JS/TS

Seus botões e mensagens ainda são texto simples no código-fonte, então a ferramenta ainda não tem o que encontrar. Eles precisam primeiro ser envolvidos em `t()`, e o app precisa de um pequeno arquivo de configuração do i18next.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

Depois, siga o guia [Adicionar i18n a um app JS/TS](/pt-BR/guide/add-i18n-to-js). Ele aborda a etapa de envolvimento, com um prompt de agente, antes de `extract` e `translate-ui`.

<a id="a-python-app"></a>
### Um app Python

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

Use `ui-python-gettext`, `ui-python-flask` ou `ui-python-django` para essas configurações. Depois, siga o guia [Adicionar i18n a um app Python](/pt-BR/guide/add-i18n-to-python).

<a id="a-website-or-documentation-site"></a>
### Um site ou site de documentação

Escolha o template para seu framework:

| Seu site | Template |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| Site Astro simples | `ui-astro-website` |
| Páginas HTML simples | `ui-plain-html` ou `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Seu framework deve ter o próprio roteamento i18n ativado primeiro. Depois, siga [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website).

<a id="a-readme-or-markdown-docs"></a>
### Um README ou documentos Markdown

A maioria dos repositórios quer isso junto com o aplicativo: o template padrão `ui-markdown` já inclui um bloco README simples. Para qualquer outro template, adicione `--with-readme`. Um repositório apenas com Markdown usa `docs-markdown`.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

Depois, siga [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme). Cole o marcador da lista de idiomas em `README.md` antes de `sync`. O caminho do aplicativo, quando você tiver um, ainda é [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python).

<a id="something-else"></a>
### Outros

- JSON i18next aninhado que permanece como está: `ai-i18n-tools init -t ui-json-bundles -P openrouter`, depois [JSON](/pt-BR/guide/json).
- Diagramas SVG com rótulos de texto: [Tradução de SVG](/pt-BR/guide/svg-translation/).
- Saindo do Intlayer: [Migrando do Intlayer](/pt-BR/guide/migrating-from-intlayer).
- Mantendo o Intlayer e apenas preenchendo suas traduções: [Traduzindo o Intlayer no local](/pt-BR/guide/translating-intlayer).

A lista completa de templates, com todas as opções de `init`, está na [Referência de configuração da CLI](/pt-BR/reference/cli-commands/setup).

<a id="run-and-check"></a>
## Executar e verificar

Quando seu projeto estiver pronto:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` executa cada etapa que sua configuração habilita, em ordem. `status` mostra o que é traduzido por localidade. Uma primeira execução em um projeto no qual a ferramenta não consegue ver texto termina sem erros e não escreve nada útil, então se `status` não mostrar nenhuma string, volte para o guia do seu caminho.

`suggest-models` classifica os modelos de chat do provedor ativo com base em benchmarks publicados. `suggest-models --apply` substitui `translationModels` e não altera `uiModels` e `localeModels`. A mesma classificação está na guia **Modelos** do painel. Como a classificação funciona e por que a lista contém mais de um modelo: [Modelos de IA](/pt-BR/guide/ai-models). Referência de comando: [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## Mantenha traduzido

Reexecute `sync` sempre que o texto de origem mudar. Um cache SQLite significa que apenas o texto novo ou alterado vai para o modelo, então as reexecuções são baratas. Executar `sync` em CI evita que as traduções se desalinhem. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar e editar as traduções em cache.

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados para package.json

Com o pacote instalado localmente, os scripts resolvem `ai-i18n-tools` de `node_modules/.bin` sem configuração extra do shell. Para um shell interativo, configure o PATH primeiro: consulte [Como usar a CLI](/pt-BR/guide/installation#using-the-cli).

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

Prefira `sync` em vez de encadear os scripts de tradução individuais. Use os scripts de etapa única apenas quando precisar de uma etapa isoladamente.

Para ter a saída da CLI e o painel em outro idioma, passe `-L <code>` ou defina `AI_I18N_LANG`: consulte [Idioma da interface da ferramenta](/pt-BR/guide/tool-ui-language).

<a id="combined-sync"></a>

Traduzindo mais de um tipo de conteúdo, como strings de aplicativos e um site de documentação juntos? Consulte [Como combinar pipelines](/pt-BR/guide/combining-pipelines).

A seguir: o guia para o seu caminho em [Escolha seu caminho](#pick-your-path).
