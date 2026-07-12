<a id="cli-reference"></a>
# Referência da CLI

Execute `ai-i18n-tools <command> --help` para cada flag em um comando. As páginas abaixo adicionam contexto, opções-chave e links para guias de tópicos.

<a id="command-overview"></a>
## Visão geral do comando

<a id="setupsetup"></a>
### [Configuração](setup)

| Comando | Resumo |
|---------|---------|
| [`version`](setup#version) | Imprime a versão da CLI e o carimbo de data/hora da compilação. |
| [`init`](setup#init) | Grava uma configuração inicial; `-t` seleciona um modelo de scaffold. |

<a id="models--catalogmodels"></a>
### [Modelos e catálogo](models)

| Comando | Resumo |
|---------|---------|
| [`check-models`](models#check-models) | Valida os IDs de modelo configurados em relação ao provedor ativo. |
| [`list-models`](models#list-models) | Lista os modelos anunciados pelo provedor ativo. |
| [`bench-models`](models#bench-models) | Avalia modelos configurados em uma tradução de amostra. |
| [`list-languages`](models#list-languages) | Lista o catálogo de idiomas da UI incluído. |

<a id="ui-stringsui-strings"></a>
### [Strings da UI](ui-strings)

| Comando | Resumo |
|---------|---------|
| [`extract`](ui-strings#extract) | Atualiza `strings.json` a partir de literais de origem e marcadores HTML. |
| [`mark-html`](ui-strings#mark-html) | Insere marcadores `data-i18n*` em arquivos HTML. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | Grava `ui-languages.json` a partir de localidades de configuração. |
| [`translate-ui`](ui-strings#translate-ui) | Traduz strings da UI (`strings.json` → JSON de localidade). |
| [`sync-ui`](ui-strings#sync-ui) | Extrai e, em seguida, traduz strings da UI. |
| [`proofread-ui`](ui-strings#proofread-ui) | Extrai e, em seguida, revisa strings da UI de localidade de origem com LLM. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | Exporta `strings.json` para XLIFF 2.0. |

<a id="documentsdocuments"></a>
### [Documentos](documents)

| Comando | Resumo |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Traduz markdown, MDX, `.astro` e catálogos de framework. |
| [`write-heading-ids`](documents#write-heading-ids) | Insere linhas de âncora HTML antes dos títulos ATX. |
| [`check-markdown`](documents#check-markdown) | Escaneia markdown/MDX em busca de problemas de delimitador e ênfase. |

<a id="other-contentcontent"></a>
### [Outro conteúdo](content)

| Comando | Resumo |
|---------|---------|
| [`translate-json`](content#translate-json) | Traduz JSON aninhado por blocos de configuração `json[]`. |
| [`translate-svg`](content#translate-svg) | Traduz arquivos SVG configurados em `config.svg`. |

<a id="workflows--statusworkflows"></a>
### [Fluxos de trabalho e status](workflows)

| Comando | Resumo |
|---------|---------|
| [`sync`](workflows#sync) | Executa extração + UI + SVG + docs + JSON em um pipeline. |
| [`status`](workflows#status) | Imprime a cobertura de tradução da UI, da documentação e do JSON. |
| [`statistics`](workflows#statistics) | Imprime estatísticas de cache e `strings.json`. |

<a id="cache--maintenancemaintenance"></a>
### [Cache e manutenção](maintenance)

| Comando | Resumo |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | Remove linhas de cache obsoletas e repopula problemas de markdown. |
| [`clean-temp`](maintenance#clean-temp) | Encontra e exclui backups de `*.log`, `*.tmp` e cache. |
| [`purge-locale`](maintenance#purge-locale) | Remove linhas de cache e artefatos gerados para o(s) idioma(s). |

<a id="toolstools"></a>
### [Ferramentas](tools)

| Comando | Resumo |
|---------|---------|
| [`dashboard`](tools#dashboard) | Inicia a interface web do Painel de Tradução. |
| [`glossary-generate`](tools#glossary-generate) | Grava um modelo `glossary-user.csv` vazio. |
| [`help`](tools#help) | Exibe ajuda para um subcomando. |

<a id="synopsis"></a>
## Sinopse

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### Opções raiz e globais

| Opção                        | Escopo        | Descrição                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Programa raiz | Exibe o número da versão e o carimbo de data da compilação (mesmas informações do subcomando `version`). |
| `-h` / `--help`              | Programa raiz | Exibe ajuda para o programa raiz ou para um subcomando quando usado com um nome de comando.      |
| `-c` / `--config <path>`     | Todos os comandos | Caminho do arquivo de configuração (padrão: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Todos os comandos | Registro detalhado (verbose logging).                                                                          |
| `-P` / `--provider <name>`   | Todo comando | Provedor de LLM ativo para esta execução; substitui a chave `provider` da configuração. Deve ser configurado em `providers`. |
| `-L` / `--ui-lang <code>` | Todos os comandos | Idioma da própria interface do usuário da ferramenta (ajuda da CLI, logs/resumos, painel); fonte de maior prioridade. Consulte [Idioma da interface do usuário da ferramenta](/pt-BR/guide/tool-ui-language). |
| `-w` / `--write-logs [path]` | Comandos selecionados | Redireciona a saída do console para um arquivo `.log` (caminho padrão: sob a raiz `cacheDir`). Conectado apenas para `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync` e `cleanup`. |

<a id="per-command-help"></a>
### Ajuda por comando

| Uso                            | Descrição                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Todas as opções para esse comando.      |
| `ai-i18n-tools help <command>`   | Saída idêntica à de `<command> --help`. |

<a id="target-locales--l----locale"></a>
### Localidades de destino (`-l` / `--locale`)

| Comandos | Comportamento |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — códigos BCP-47 de destino separados por vírgulas (por exemplo, `de,fr,pt-BR`). Quando omitido, os padrões vêm da configuração (blocos `json[]` também podem definir `targetLocales` por bloco; as etapas da UI usam `targetLocales` menos `sourceLocale`). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — local de origem único para revisar (padrão: configuração `sourceLocale`).                                                            |
