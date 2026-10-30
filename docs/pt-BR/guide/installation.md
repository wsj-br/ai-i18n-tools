<a id="installation"></a>
# Instalação

Esta página explica como instalar a CLI e colocar o comando `ai-i18n-tools` para funcionar. Já o instalou? Acesse o [Início rápido](/pt-BR/guide/quick-start).

O pacote publicado é somente ESM. Use `import` ou `import()` no Node.js ou no seu bundler; não use `require('ai-i18n-tools')`. O pacote declara `engines.node` `>=22.16.0`; versões mais antigas do Node.js não são compatíveis. O tarball do npm inclui arquivos em inglês apenas em `docs/`; cópias específicas da localidade em `translated-docs/` estão no [repositório do GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### Executáveis independentes

As versões do GitHub incluem um build de executável único do Node.js. Projetos Python executam a CLI a partir desse binário, incluindo `extract`, `translate-ui` e `suggest-models`, sem a necessidade de instalar o Node.js.

Linux e macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

O instalador detecta o sistema, baixa o executável correspondente, verifica o `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` (`ai-i18n-tools.exe` no Windows) e adiciona o diretório de instalação a `PATH`. O diretório padrão é `~/.local/bin`. Abra um novo terminal se o comando ainda não for encontrado. Defina `AI_I18N_VERSION` (por exemplo, `v1.11.0`) para fixar uma versão ou `AI_I18N_INSTALL_DIR` para escolher outro diretório.

Os binários não são autenticados (notarized) nem assinados com Authenticode. O macOS pode pedir que você aprove um programa não assinado. O SmartScreen do Windows pode exibir um aviso. O instalador do macOS limpa a flag de quarentena depois que o checksum corresponde.

Cada versão também anexa `SHA256SUMS.txt`, `install.sh`, `install.ps1` e `ai-i18n-tools-python-examples.zip` (os quatro exemplos em Python). O tarball do npm e o executável não contêm esses exemplos. Eles também permanecem no repositório.

<details>
<summary>Instruções para instalar manualmente o executável <code>ai-i18n-tools</code></summary>

| Plataforma | Ativo |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. Baixe o recurso (asset) que corresponde à sua máquina e o `SHA256SUMS.txt` na página de [versões do GitHub](https://github.com/wsj-br/ai-i18n-tools/releases).
2. Verifique o checksum. No Linux, `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (use o nome do recurso que você baixou). No macOS, a mesma linha com `shasum -a 256 -c -`. No Windows, `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` e compare-o com o hash em `SHA256SUMS.txt`.
3. Renomeie o arquivo baixado para `ai-i18n-tools` e coloque esse diretório em `PATH`.

Linux e macOS, usando o recurso do Linux x64 como exemplo (substitua pelo recurso que você baixou):

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

Se `$HOME/.local/bin` ainda não estiver em `PATH`, adicione isto ao perfil do seu shell (`.bashrc`, `.bash_profile`, `.profile` ou `.zshrc`) e abra um novo terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell), renomeando `ai-i18n-tools-win-x64.exe` para `ai-i18n-tools.exe`:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

Abra um novo terminal e execute `ai-i18n-tools --version`. O nome do comando é `ai-i18n-tools` em todas as plataformas.

</details>

Defina a chave de API para o provedor ativo da mesma forma que em uma instalação com npm (veja abaixo). Depois:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Passo a passo: [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python). Referência de comando: [suggest-models](/pt-BR/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### Definir a chave de API

Os comandos de tradução (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) exigem a configuração do provedor em `ai-i18n-tools.config.json` e uma chave de API para o provedor ativo. Execute `ai-i18n-tools init -P <provider>` para gerar essa predefinição. Predefinições de provedor e chaves de API: [Provedores de LLM](/pt-BR/guide/providers-and-models). A lista de modelos de `init` é um ponto de partida. Substitua-a por modelos de [Modelos de IA](/pt-BR/guide/ai-models) usando `suggest-models` ou a aba **Modelos** do painel. Ollama é a única predefinição integrada que não precisa de chave de API.

Defina a chave que corresponde ao provedor que você passa para `init` (consulte a [tabela de predefinições](/pt-BR/guide/providers-and-models#built-in-providers)):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

Ou crie um arquivo `.env` na raiz do projeto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="using-the-cli"></a>
### Usando a CLI

Instale `ai-i18n-tools` como uma dependência (dependency) ou dependência de desenvolvimento (devDependency) no seu projeto (veja o início desta página). O pacote declara uma entrada `bin` que seu gerenciador de pacotes vincula a `node_modules/.bin/ai-i18n-tools`. Esse shim (`bin/ai-i18n-tools.mjs` dentro do pacote instalado) carrega a CLI compilada.

Para digitar o comando `ai-i18n-tools` em um shell interativo, configure uma das opções abaixo. Sem configuração, o shell não consegue encontrar o binário mesmo após uma instalação local.

direnv — adicione a um `.envrc` na raiz do projeto (bash/zsh; consulte [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Após `direnv allow`, o comando simples estará disponível sempre que você `cd` no projeto.

PATH manual — execute estes comandos na raiz do projeto (o diretório que contém `node_modules/.bin`). Os subdiretórios continuarão funcionando desde que você mantenha essa entrada `PATH`; executar novamente a exportação de uma pasta aninhada falhará porque `$PWD` não apontará mais para a raiz do projeto.

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Instalação global — instale a CLI uma vez e chame-a de qualquer diretório:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Com pnpm, execute `pnpm setup` uma vez por máquina (e abra um novo shell) se os comandos globais estiverem faltando — pnpm requer seu diretório bin global em `PATH`. Uma instalação global usa a versão globalmente fixada. Para fixação de versão por projeto, prefira direnv ou PATH manual para que `node_modules/.bin` seja resolvido para a dependência do projeto.

Scripts do package.json — quando o npm ou pnpm executa um script, ele anexa `node_modules/.bin` ao início de `PATH`, de modo que o nome simples do comando funcione dentro dos scripts sem alterações no PATH do shell:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Em seguida, execute, por exemplo, `pnpm run i18n:sync`. Consulte [Scripts recomendados para package.json](/pt-BR/guide/quick-start#recommended-packagejson-scripts) para ver o conjunto completo recomendado.

Alternativas — se você preferir não ajustar o `PATH`: `npx ai-i18n-tools …` (npm) ou `pnpm exec ai-i18n-tools …` (pnpm). Para uma execução única sem instalação e sem entrada no `package.json`: `npx ai-i18n-tools <cmd>` ou `pnpm dlx ai-i18n-tools <cmd>`.

<a id="coding-agent-skill"></a>
### Monorepo clonado

Ao desenvolver o pacote ou executar exemplos do workspace a partir de um clone completo de [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- Exemplos do workspace (`examples/console-app`, `examples/nextjs-app` e os outros pacotes listados em [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — execute `pnpm install` na raiz do repositório e, em seguida, `cd examples/<name>`. Use os scripts `pnpm run i18n:*` do exemplo ou configure o PATH (consulte [Como usar a CLI](#using-the-cli)) e execute o `ai-i18n-tools …` diretamente. Os [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) do workspace vinculam o `ai-i18n-tools` ao seu checkout local.
- Raiz do repositório — o pnpm não vincula o `bin` do próprio pacote raiz ao `node_modules/.bin`. O `.envrc` deste checkout adiciona `bin/` ao `PATH` para que o wrapper `bin/ai-i18n-tools` comitado (ao lado do shim `bin/ai-i18n-tools.mjs` publicado) forneça o comando diretamente após `direnv allow`. Sem o direnv, use `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` ou os scripts `pnpm i18n:*` da raiz (ou um alias de shell / `pnpm add -g .`).
- Fixtures independentes (`multi-provider`, `test-markdown`) — na pasta do fixture, use `node ../../bin/ai-i18n-tools.mjs …`.

Execute `pnpm run build` na raiz do repositório após alterar a origem da CLI. Consulte o [Guia de Desenvolvimento](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) para etapas de construção e soluções alternativas de instalação global opcionais.

No Linux, macOS e WSL, as instalações do registro definem automaticamente o bit executável no script CLI. No Windows, os gerenciadores de pacotes geram `.cmd` e `.ps1` shims que invocam o Node explicitamente.

A seguir: [Início rápido](/pt-BR/guide/quick-start).
