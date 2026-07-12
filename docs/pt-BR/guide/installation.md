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

Para digitar o comando `ai-i18n-tools` em um shell interativo, configure uma das opções abaixo. Sem configuração, o shell não consegue encontrar o binário mesmo após uma instalação local.

**direnv** — adicione a um `.envrc` na raiz do projeto (bash/zsh; consulte [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Após `direnv allow`, o comando simples estará disponível sempre que você `cd` no projeto.

**PATH manual** — a partir da raiz do projeto em um shell interativo:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Instalação global** — instale a CLI uma vez e invoque-a de qualquer diretório:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Uma instalação global usa a versão globalmente fixada. Para fixação de versão por projeto, prefira direnv ou PATH manual para que `node_modules/.bin` seja resolvido para a dependência do projeto.

**Scripts `package.json`** — quando o npm ou pnpm executa um script, ele adiciona `node_modules/.bin` ao `PATH`, então o nome do comando simples funciona dentro dos scripts sem alterações no PATH do shell:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

Em seguida, execute, por exemplo, `pnpm run i18n:sync`.

**Alternativas** — se você preferir não ajustar `PATH`: `npx ai-i18n-tools …` (npm) ou `pnpm exec ai-i18n-tools …` (pnpm). Para uma execução única sem instalação e sem entrada `package.json`: `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Monorepo ai-i18n-tools clonado

Ao desenvolver o pacote ou executar **exemplos** de workspace a partir de um clone completo de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Exemplos de workspace** (`examples/console-app`, `examples/nextjs-app` e os outros pacotes listados em [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — execute `pnpm install` na raiz do repositório e, em seguida, `cd examples/<name>`. Use os scripts `pnpm run i18n:*` do exemplo ou configure o PATH (consulte [Usando a CLI](#using-the-cli)) e execute `ai-i18n-tools …` diretamente. O workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) vincula `ai-i18n-tools` ao seu checkout local.
- **Raiz do repositório** — o pnpm não vincula o próprio `bin` do pacote raiz em `node_modules/.bin`. Em vez disso, use `node bin/ai-i18n-tools.mjs …` ou scripts `pnpm i18n:*` raiz (ou um alias de shell / `pnpm add -g .` — consulte [Guia de Desenvolvimento](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Fixtures autônomas** (`multi-provider`, `test-markdown`) — na pasta da fixture, use `node ../../bin/ai-i18n-tools.mjs …`.

Execute `pnpm run build` na raiz do repositório após alterar a origem da CLI. Consulte o [Guia de Desenvolvimento](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para etapas de construção e soluções alternativas de instalação global opcionais.

No Linux, macOS e WSL, as instalações do registro definem automaticamente o bit executável no script CLI. No Windows, os gerenciadores de pacotes geram `.cmd` e `.ps1` shims que invocam o Node explicitamente.

Os comandos de tradução (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) exigem **configuração do provedor** em `ai-i18n-tools.config.json` e **uma chave de API** para o provedor ativo. Execute `ai-i18n-tools init [-P <provider>]` para criar um bloco de provedor padrão (`openrouter` quando omitido); edite `provider` / `providers` para alternar predefinições ou modelos — consulte [Provedores e modelos LLM](/pt-BR/guide/providers-and-models). Ollama é a única predefinição integrada que não precisa de chave de API.

Defina a chave de API que corresponde ao seu provedor ativo (consulte a [tabela de predefinições](/pt-BR/guide/providers-and-models#built-in-providers)):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Ou crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Idioma da interface do usuário da ferramenta

A CLI localiza seu próprio texto de ajuda, resumos de log e o Painel de Tradução independentemente das localidades que você traduz. Por padrão, ela segue a localidade do seu sistema operacional. Substitua com `-L pt-BR`, `export AI_I18N_LANG=es` ou `"uiLanguage"` na configuração. Consulte [Idioma da interface do usuário da ferramenta](/pt-BR/guide/tool-ui-language).
