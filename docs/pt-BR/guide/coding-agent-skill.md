<a id="coding-agent-skill"></a>
# Habilidade de agente de codificação

Uma instalação copia todas as habilidades de consumidor. A [habilidade compartilhada](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) ensina um agente a instalar e manter `ai-i18n-tools` com `sync`, e carrega apenas a referência que corresponde à tarefa. Cada fluxo de trabalho é um comando de barra separado, como `/ai-i18n-vitepress`.

A instalação do pacote npm ou do executável autônomo não registra as habilidades. Use um método de instalação para cada agente.

<a id="install-with-the-skills-cli"></a>
## Instalar com a CLI de habilidades

Esta é a instalação a ser usada quando o Node.js for 22.20 ou mais recente. A própria CLI deste pacote permite Node.js 22.16, que é muito antigo para a CLI de habilidades. Em 22.16 a 22.19, ou em uma máquina sem Node.js, use [Baixar o diretório de habilidades](#download-the-skill-directory).

No projeto em que você deseja que o agente trabalhe:

```bash
npx skills add wsj-br/ai-i18n-tools
```

O comando instala todos os diretórios em `skills/`, incluindo a habilidade compartilhada e cada comando de fluxo de trabalho. Ele não deixa um checkout deste repositório em seu projeto. O escopo padrão é o projeto atual. Adicione `-g` para instalar para seu usuário, em todos os projetos.

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` é a instalação em uma etapa: todas as habilidades, sem prompt. Sem `--all`, o instalador pergunta quais habilidades copiar. `--list` imprime as habilidades e não instala nada. `--skill` e `-a` ignoram os prompts para uma habilidade e um agente. `npx skills update` atualiza as habilidades instaladas desta forma. Execute `add` novamente para detectar uma habilidade que foi adicionada após a primeira instalação.

Para imprimir a habilidade como um prompt, ou para iniciar um agente compatível com ela, sem instalar:

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

A CLI detecta os agentes de codificação instalados na máquina. Os caminhos de instalação para cada agente estão na [lista de agentes da CLI de habilidades](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Essa lista muda. Esta página não a repete e não afirma que toda ferramenta de codificação lê uma pasta de habilidades.

A CLI de habilidades coleta dados de uso anônimos. Defina `DISABLE_TELEMETRY=1` ou `DO_NOT_TRACK=1` para desativar isso.

Após a instalação, inicie uma nova sessão de agente se esse produto exigir um recarregamento. Digite um comando de fluxo de trabalho como `/ai-i18n-vitepress`, ou peça ao agente para usar a habilidade `ai-i18n-tools`. A habilidade compartilhada é o fallback para uma solicitação que não nomeia um comando. Uma habilidade descoberta não é garantia de que o agente a invocará por conta própria.

<a id="slash-commands"></a>
## Comandos de barra

A habilidade compartilhada `ai-i18n-tools` permanece disponível para o agente. As outras habilidades são comandos explícitos. Cada um segue a habilidade compartilhada, então aplica apenas seu modelo e verificações.

| Comando | Fluxo de trabalho |
| --- | --- |
| `/ai-i18n-js` | UI de string de origem JavaScript ou TypeScript |
| `/ai-i18n-python` | Auxiliar Python gerado e catálogos JSON planos |
| `/ai-i18n-django` | Django, Flask-Babel ou gettext simples |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Documentos Astro Starlight |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Site Astro Vanilla |
| `/ai-i18n-plain-html` | Um arquivo HTML, trocado no navegador |
| `/ai-i18n-plain-html-docs` | Uma árvore HTML por localidade |
| `/ai-i18n-readme` | README e Markdown do repositório |
| `/ai-i18n-migrate-intlayer` | Migração única de Intlayer para chamadas `t()` |
| `/ai-i18n-translate-intlayer` | Preencher dicionários Intlayer no local |

As habilidades copiadas para `.agents/skills/` ou `.cursor/skills/` aparecem como estes comandos. Um bug atual do Cursor oculta as habilidades de plugin do marketplace que definem `disable-model-invocation` da paleta `/`. Claude Code, Codex e Copilot ainda mostram esses comandos. Use a instalação da CLI de habilidades quando quiser os comandos no Cursor. Uma solicitação em prosa ainda alcança a habilidade compartilhada.

<a id="download-the-skill-directory"></a>
## Baixar o diretório de habilidades

Use isso quando a CLI de habilidades não estiver disponível. Copie cada diretório de habilidades, não apenas `ai-i18n-tools/`. Cada comando de fluxo de trabalho é sua própria pasta com um `SKILL.md`. Um git clone e `npx degit` de um caminho de habilidade baixam o arquivo de origem do repositório, cerca de 50 MB.

Escolha um diretório de agente da [lista de agentes da CLI de habilidades](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Os exemplos abaixo usam `.agents/skills/`, que vários agentes leem. Inspecione esse destino antes de substituir uma cópia existente. Uma cópia por agente é suficiente. Uma segunda cópia em outra pasta de descoberta para o mesmo agente é uma duplicata.

O pacote npm já contém os diretórios. Quando o pacote é instalado:

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

Sem `node_modules`, baixe o tarball npm para a mesma versão que a CLI relata. `ai-i18n-tools --version` imprime a versão e, em seguida, o carimbo de data/hora da compilação. Use apenas o número da versão. O membro do tarball é `package/skills/`.

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

Substitua `1.12.0` pela versão que você instalou. Isso funciona para a versão atual. O executável autônomo não contém os arquivos de habilidade. Combine o tarball com `ai-i18n-tools --version`.

A partir da versão que o adiciona, o GitHub Releases também anexa `ai-i18n-tools-skill.zip`. Esse zip contém cada diretório de habilidade em seu nível superior. Descompacte-o na pasta de habilidades do agente para que o resultado inclua tanto `ai-i18n-tools/SKILL.md` quanto as pastas de fluxo de trabalho, como `ai-i18n-vitepress/SKILL.md`. As versões publicadas antes desse zip não o incluem. Zips mais antigos contêm apenas `ai-i18n-tools/`. Use o tarball npm para essas versões. A tag é `v` mais a versão da CLI, por exemplo `v1.12.0` assim que a versão dessa tag tiver o ativo.

<a id="agents-the-skills-cli-installs"></a>
## Agentes que a CLI de habilidades instala

Passe o ID para `-a` quando quiser um agente. Nada mais é necessário neste repositório para essas ferramentas.

Agentes CLI: Claude Code (`claude-code`), Codex CLI (`codex`), Gemini CLI (`gemini-cli`), Antigravity CLI (`antigravity-cli`), GitHub Copilot CLI (`github-copilot`), OpenCode (`opencode`), Goose (`goose`), Qwen Code (`qwen-code`), Kilo CLI (`kilo`), Grok Build (`grok`), Amp (`amp`), Crush (`crush`), Pi (`pi`), Kiro CLI (`kiro-cli`).

Editores e IDEs: Cursor (`cursor`), Windsurf (`windsurf`), Devin for Terminal (`devin`), Zed (`zed`), Antigravity (`antigravity`), Trae (`trae`), Junie (`junie`), Replit (`replit`), Cline (`cline`), Roo Code (`roo`), Kilo Code (`kilo`), Continue (`continue`), Augment (`augment`), Factory Droid (`droid`), Tabnine CLI (`tabnine-cli`). O GitHub Copilot em um editor usa o mesmo ID `github-copilot` que a CLI.

Dois detalhes de caminho fáceis de passar despercebidos:

- Cursor: uma instalação de projeto da CLI de habilidades vai para `.agents/skills/`. `-g` vai para `~/.cursor/skills/`. A própria documentação do Cursor também aceita `.cursor/skills/` em um projeto. Use um desses.
- GitHub Copilot: a CLI de habilidades escreve `.agents/skills/` no projeto e `~/.copilot/skills/` para `-g`. A documentação do agente de nuvem do GitHub também descreve `.github/skills/`. Essa pasta não é lida por todo chat do Copilot. Use apenas a pasta documentada para a superfície que você utiliza.

O agente padrão da CLI do Kiro carrega `.kiro/skills/` e `~/.kiro/skills/` sem configuração extra. Um agente Kiro personalizado precisa das habilidades instaladas listadas em `.kiro/agents/<agent>.json`:

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## Catálogos nativos

Alguns produtos também instalam as habilidades de um catálogo neste repositório. Use um canal para cada agente: o catálogo ou a CLI de habilidades. Uma atualização de pacote não atualiza uma habilidade que foi copiada manualmente. `npx skills update` atualiza uma instalação da CLI de habilidades. Instalações de catálogo seguem o comando de atualização desse produto.

- Cursor Marketplace, após a aprovação da listagem: instale `ai-i18n-tools` do Cursor Marketplace. Até que essa listagem exista, use a CLI de habilidades. [Diretório do Cursor](https://cursor.directory) é uma listagem de comunidade separada.
- Claude Code, de uma sessão do Claude Code:

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- CLI do GitHub Copilot:

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

Em seguida, instale o plugin `ai-i18n-tools` desse marketplace. O ID do plugin é `ai-i18n-tools@ai-i18n-tools`. A CLI do Copilot lê o mesmo arquivo de catálogo que o Claude Code usa.

- Codex:

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

Uma listagem de workspace do ChatGPT é publicada separadamente por um administrador de workspace. É uma instalação diferente deste comando.

<a id="agents-without-a-skills-install"></a>
## Agentes sem uma instalação de habilidades

Esses produtos não estão na lista de agentes da CLI de habilidades. Este repositório não envia uma pasta de habilidades separada para eles. Aponte o agente para o [contexto do consumidor](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) a partir de instruções de projeto como `AGENTS.md`:

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

Esse arquivo usa URLs de site de documentação e de repositório, então a instrução ainda funciona quando o agente não consegue ler este repositório. Para uma CLI mais antiga, abra o mesmo caminho na tag de lançamento correspondente. Projetos de consumidor usam este arquivo de contexto. O `AGENTS.md` do mantenedor se aplica ao alterar este repositório.

Produtos neste grupo: Aider, gptme, Amazon Q Developer CLI, DeepSeek Harness, JetBrains AI Assistant, Sourcegraph Cody, Qodo, o plugin Tabnine IDE, CodeGeeX e AskCodi. Junie é o agente JetBrains que aceita uma instalação da CLI de habilidades. A CLI do Tabnine também. AiderDesk é uma aplicação diferente de Aider.

CodeLayer e Superset não possuem um diretório de habilidades próprio. CodeLayer executa Claude Code, então instale a habilidade para Claude Code. Superset executa os agentes CLI que você configura, então instale a habilidade para esses agentes.

<a id="stay-on-the-same-version"></a>
## Mantenha a mesma versão

Mantenha a habilidade na mesma versão do comando `ai-i18n-tools`. Uma atualização do npm e um executável autônomo mais recente deixam uma habilidade copiada manualmente onde estava. Instale a habilidade novamente a partir da versão correspondente, ou execute `npx skills update` para uma instalação da CLI de habilidades.

A documentação online pode descrever uma versão mais recente do que o comando que você instalou. Prefira `ai-i18n-tools --help` para flags. Referências adicionais: [instalação](/pt-BR/guide/installation), [configuração](/pt-BR/reference/configuration), [provedores](/pt-BR/guide/providers-and-models), [referência da CLI](/pt-BR/reference/cli-commands/).
