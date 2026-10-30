<a id="cli--getting-started"></a>
# CLI — Primeiros passos

<a id="version"></a>
### `version`

**Sinopse:** `ai-i18n-tools version`

Exibe a versão da CLI e o carimbo de data/hora da compilação (mesmas informações que `-V` / `--version` no programa raiz).

---

<a id="init"></a>
### `init`

**Sinopse:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Escreva um arquivo de configuração inicial (inclui `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `docs[].addFrontmatter`). Os comandos de tradução que chamam um LLM exigem a chave de API do provedor ativo no ambiente ou `.env` (Ollama, exceto) — consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).

**Opções principais:** `-P` / `--provider` (obrigatório), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` é obrigatório. Ele seleciona qual **predefinição integrada** estruturar. Deve ser um dos seguintes: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`.

**Modelos (`-t`):**

| Valor | Estruturas geradas |
|-------|-----------|
| `ui-markdown` | Strings da IU e README (saída simples, lista de idiomas) |
| `ui-docusaurus` | UI Docusaurus + docs |
| `ui-starlight` | Docs Starlight |
| `ui-vitepress` | Docs VitePress (`docsOutput.style: "vitepress"`) mais `vitepressThemeCatalog` para strings de tema |
| `ui-nextra` | Docs Nextra (`docsOutput.style: "nextra"`) mais `nextraDictionaryPath` para o dicionário de tema (barra lateral `_meta.ts` é coletada automaticamente) |
| `ui-fumadocs` | Docs Fumadocs (`docsOutput.style: "fumadocs"`) mais `fumadocsUiCatalog` para substituições de UI (barra lateral `meta.json` é coletada automaticamente) |
| `ui-astro-website` | Strings de UI do site Astro |
| `ui-plain-html` | Catálogo HTML simples (marcadores `data-i18n*`, JSON de localidade plano) |
| `docs-plain-html` | Documentos HTML simples (um arquivo por localidade, lista de idiomas, hreflang) |
| `docs-markdown` | Documentos Markdown: arquivos README e `.md`, saída simples, lista de idiomas |
| `ui-json-bundles` | JSON (somente `json[]`) |
| `ui-python` | Strings da IU em Python, JSON simples com chaves da string do idioma de origem e `i18n.py` |
| `ui-python-gettext` | Strings de interface em Python com JSON simples e `.po` / `.mo` do GNU, além de `i18n.py` |
| `ui-python-django` | Catálogos `gettext` / `{% blocktrans %}` do Django (`flatOutput: false`, domínio `django`, sem `i18n.py`) |
| `ui-python-flask` | Catálogos Flask / Jinja em `translations/` (`flatOutput: false`) além de `i18n.py` |

`--with-readme` adiciona um bloco de documentos `README.md` (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, um `languageListBlock`) e define `features.translateDocs` como true. Ele não faz nada quando um bloco de documentos já lista `README.md`, que é o caso de `ui-markdown` e `docs-markdown`. Ele grava apenas a configuração. Ele imprime a linha do marcador para colar em `README.md` e avisa quando esse arquivo está ausente. Guia: [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` cria um `.translate-ignore` inicial (incluindo virtualenv Python e diretórios de cache).

`ui-python`, `ui-python-gettext` e `ui-python-flask` também escrevem `i18n.py` quando esse arquivo está ausente. Projetos Django mantêm o próprio runtime gettext do Django, portanto `ui-python-django` não escreve `i18n.py`.

`migrate-python-i18n` reescreve chamadas pré-avaliadas inseguras (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) para chamadas de busca antes da formatação. O padrão é uma simulação (dry run). Use `--write` para editar arquivos e leia `migrate-python-i18n-report.md` para notas de revisão. Arquivos `i18n.py` gerados são ignorados.

---

<a id="doctor"></a>
### `doctor`

**Sinopse:** `ai-i18n-tools doctor [--local] [--strict] [--json]`

Verifica se o projeto está pronto para tradução. O relatório abrange a sintaxe e o esquema de configuração, regras de negócio, a versão instalada, caminhos de origem e de saída, arquivos de catálogo da UI, estatísticas de cache, provedores configurados, variáveis de ambiente suportadas que estão definidas e IDs de modelo.

Por padrão, `doctor` também verifica os IDs de modelo configurados em relação ao catálogo do provedor ativo e compara a versão instalada com a última versão do GitHub. `--local` ignora ambas as chamadas de rede. Uma versão mais recente, ou uma solicitação do GitHub que falha, é um aviso. Um ID de modelo ausente ou expirado faz com que o comando falhe. `--strict` sai com um erro quando qualquer verificação emite um aviso.

Os valores das chaves de API nunca são impressos. Uma chave definida é exibida como `NAME (set)`.

Caminhos de entrada ausentes causam falha. Diretórios de saída ausentes são uma observação, porque a primeira execução de tradução os cria. `doctor` não reescreve a configuração, não cria diretórios, nem envia texto de origem para um modelo.

**Opções principais:** `--local`, `--strict`, `--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**Sinopse:** `ai-i18n-tools help [command]`

Exibe a ajuda para um subcomando (mesma saída que `ai-i18n-tools <command> --help`).
