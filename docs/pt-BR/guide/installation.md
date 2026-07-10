<a id="installation"></a>
# Instalação

O pacote publicado é apenas **ESM**. Use `import`/`import()` no Node.js ou no seu empacotador; não use `require('ai-i18n-tools')`. O pacote declara `engines.node` `>=22.16.0`; versões mais antigas do Node.js não são suportadas. O tarball do npm inclui apenas arquivos em inglês em `docs/`; cópias específicas de localidade em `translated-docs/` estão no [repositório do GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

O ai-i18n-tools inclui seu próprio extrator de strings. Se você anteriormente usava `i18next-scanner`, `babel-plugin-i18next-extract` ou ferramentas semelhantes, pode remover essas dependências de desenvolvimento após a migração.

<a id="using-the-cli"></a>
### Usando a CLI

Instale `ai-i18n-tools` como uma dependência ou devDependency em seu projeto (consulte [Instalação](#installation) acima). O pacote declara uma entrada `bin` que seu gerenciador de pacotes vincula a `node_modules/.bin/ai-i18n-tools`. Esse shim (`bin/ai-i18n-tools.mjs` dentro do pacote instalado) carrega a CLI compilada.

**Scripts `package.json` (recomendado)** — quando o npm ou pnpm executa um script, ele adiciona `node_modules/.bin` a `PATH`, então comandos como `pnpm run i18n:sync` invocam `ai-i18n-tools` sem um prefixo `npx` ou `pnpm exec`:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**Shell interativo** — a partir da raiz do seu projeto, após uma instalação local:

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**Para usar** `ai-i18n-tools` **no terminal** — para digitar o nome do comando diretamente em um shell interativo, adicione o diretório bin local a `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Com [**direnv**](https://direnv.net/), adicione `PATH_add node_modules/.bin` a um `.envrc` na raiz do projeto para que o comando puro esteja disponível após `cd` no projeto. Sem ajustar `PATH`, continue usando `npx ai-i18n-tools …` ou `pnpm exec ai-i18n-tools …`.

**Execução única sem instalação** — use `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>` (faz o download do pacote para aquela execução; sem entrada em `package.json`).

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Monorepo ai-i18n-tools clonado

Ao desenvolver o pacote ou executar **exemplos** de workspace a partir de um clone completo de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Exemplos de workspace** (`examples/console-app`, `examples/nextjs-app` e os outros pacotes listados em [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — execute `pnpm install` na raiz do repositório, depois `cd examples/<name>` e use `pnpm exec ai-i18n-tools …` ou os scripts `pnpm run i18n:*` do exemplo. [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) do workspace vincula `ai-i18n-tools` ao seu checkout local.
- **Raiz do repositório** — pnpm não vincula o próprio `bin` do pacote raiz em `node_modules/.bin`, e `npx ai-i18n-tools` na raiz executa o pacote **npm publicado**, não sua árvore de trabalho. Use `node bin/ai-i18n-tools.mjs …` ou scripts `pnpm i18n:*` da raiz em vez disso.
- **Fixtures autônomas** (`multi-provider`, `test-markdown`) — da pasta fixture, use `node ../../bin/ai-i18n-tools.mjs …`.

Execute `pnpm run build` na raiz do repositório após alterar a origem da CLI. Consulte o [Guia de Desenvolvimento](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para etapas de construção e soluções alternativas de instalação global opcionais.

No Linux, macOS e WSL, as instalações do registro definem automaticamente o bit executável no script CLI. No Windows, os gerenciadores de pacotes geram `.cmd` e `.ps1` shims que invocam o Node explicitamente.

Os comandos de tradução (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) exigem **configuração do provedor** em `ai-i18n-tools.config.json` e **uma chave de API** para o provedor ativo. Execute `ai-i18n-tools init` para gerar um bloco OpenRouter padrão; edite `provider` / `providers` para alternar predefinições ou modelos — consulte [Provedores e modelos LLM](/pt-BR/guide/providers-and-models). Ollama é a única predefinição integrada que não precisa de chave de API.

Defina sua chave de API do provedor (OpenRouter mostrado; use a variável de ambiente que corresponde ao seu provedor ativo — consulte a [tabela de predefinições](/pt-BR/guide/providers-and-models#built-in-providers)):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ou crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Idioma da interface do usuário da ferramenta

A CLI localiza seu próprio texto de ajuda, resumos de log e o Painel de Tradução independentemente das localidades que você traduz. Por padrão, ela segue a localidade do seu sistema operacional. Substitua com `-L pt-BR`, `export AI_I18N_LANG=es` ou `"uiLanguage"` na configuração. Consulte [Idioma da interface do usuário da ferramenta](/pt-BR/guide/tool-ui-language).
