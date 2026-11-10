<a id="cli--getting-started"></a>
# CLI — Primeiros passos

<a id="version"></a>
### `version`

**Sinopse:** `ai-i18n-tools version`

Exibe a versão da CLI e o carimbo de data/hora da compilação (mesmas informações que `-V` / `--version` no programa raiz).

---

<a id="upgrade"></a>
### `upgrade`

**Sinopse:** `ai-i18n-tools upgrade [--yes]`

Atualiza a instalação em execução para a versão publicada mais recente. O comando exibe a versão instalada e a nova versão, então aguarda por `y`. `--yes` responde ao prompt, inclusive quando o stdin não é um terminal. Qualquer outra resposta deixa a instalação inalterada. Um stdin não interativo sem `--yes` sai com um erro e não altera nada. Quando a instalação já está atualizada, ou é mais recente que a versão publicada, o comando exibe isso e não solicita confirmação.

Uma instalação Node.js lê a dist-tag `latest` do registro npm. Uma dependência de projeto é atualizada em `package.json` (o `^` existente, `~`, ou operador exato é mantido) e instalada com npm, pnpm, yarn ou bun, escolhida a partir do campo `packageManager` ou do lockfile. Uma instalação global do Node.js executa a instalação global desse gerenciador de pacotes e não edita um `package.json` no diretório atual. `workspace:`, `file:`, `link:` e especificadores git são deixados inalterados e o comando para. Um checkout de código-fonte deste repositório é recusado.

Um executável autônomo lê a versão mais recente do GitHub, baixa o arquivo gzip para o sistema operacional e arquitetura atuais, verifica `SHA256SUMS.txt` e substitui o arquivo em execução. Os arquivos publicados são Linux x64, Linux arm64, macOS arm64, macOS x64 e Windows x64.

```bash
ai-i18n-tools upgrade
ai-i18n-tools upgrade --yes
```

---

<a id="init"></a>
### `init`

**Sinopse:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

Escreva um arquivo de configuração inicial (inclui `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` e `docs[].addFrontmatter`). Os comandos de tradução que chamam um LLM exigem a chave de API do provedor ativo no ambiente ou `.env` (Ollama, exceto) — consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).

**Opções principais:** `-P` / `--provider` (obrigatório), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` é obrigatório. Ele seleciona qual **predefinição integrada** para gerar. Deve ser um dos seguintes: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`.

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
| `ui-dotnet` | Strings de UI do .NET, JSON plano com chaves baseadas na string do idioma de origem, e `I18n.cs` |
| `ui-dotnet-resx` | Strings de UI do .NET como `.resx` satélites (`flatOutput: false`) e `I18nResx.cs` |

`--with-readme` adiciona um bloco de documentos `README.md` (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, um `languageListBlock`) e define `features.translateDocs` como true. Ele não faz nada quando um bloco de documentos já lista `README.md`, que é o caso de `ui-markdown` e `docs-markdown`. Ele grava apenas a configuração. Ele imprime a linha do marcador para colar em `README.md` e avisa quando esse arquivo está ausente. Guia: [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` cria um `.translate-ignore` inicial (incluindo virtualenv Python e diretórios de cache).

`init` também cria `.gitignore` no diretório de trabalho, ou anexa a ele. As linhas adicionadas são `.translation-cache/*`, `!.translation-cache/cache.db`, `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` e `*.backup.*`, cada uma sob um breve comentário. As linhas já presentes são mantidas como estão, e uma segunda execução não as duplica.

`ui-python`, `ui-python-gettext` e `ui-python-flask` também escrevem `i18n.py` quando esse arquivo está ausente. Projetos Django mantêm o próprio runtime gettext do Django, portanto `ui-python-django` não escreve `i18n.py`. `ui-dotnet` escreve `I18n.cs` quando esse arquivo está ausente e imprime o item `EmbeddedResource` para adicionar ao `.csproj`. `ui-dotnet-resx` escreve `I18nResx.cs` em vez disso e aponta `ui.resx` para `Resources/SharedResource.<culture>.resx`. `--namespace` sobrescreve o namespace C#. Guia: [aplicativos .NET](/pt-BR/guide/ui-strings/dotnet) e [Adicionar i18n a um aplicativo .NET ResourceManager](/pt-BR/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n` reescreve chamadas pré-avaliadas inseguras (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) em chamadas de pesquisa-antes-da-formatação. O padrão é uma execução de teste. Passe `--write` para editar arquivos e leia `migrate-python-i18n-report.md` para notas de revisão. Uma expressão complexa é nomeada a partir da expressão quando esta é estável (`start.isoformat()` torna-se `{start}`, `len(rows)` torna-se `{rows_count}`). Um `{value_1}` remanescente é relatado para que possa ser renomeado. Arquivos `i18n.py` gerados são ignorados. Um relatório limpo não significa que f-strings não encapsuladas foram cobertas.

`migrate-dotnet-i18n` faz o mesmo para `T($"...")`, concatenação e `string.Format` dentro de `T()`. `--wrap` também marca rótulos XAML não marcados e sinks C# de alta confiança; sem `--write`, isso é uma auditoria. O relatório é `migrate-dotnet-i18n-report.md`. `I18n.cs` e `I18nResx.cs` gerados são ignorados. Guia: [aplicativos .NET](/pt-BR/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**Sinopse:** `ai-i18n-tools doctor [--local] [--strict] [--json] [--fix-gitignore]`

Verifique se o projeto está pronto para traduzir. O relatório abrange sintaxe e esquema de configuração, regras de negócio, a versão instalada, caminhos de origem e saída, arquivos de catálogo da UI, incompatibilidades de placeholder nesses catálogos, estatísticas de cache, provedores configurados, variáveis de ambiente suportadas que estão definidas e IDs de modelo. Um catálogo com um placeholder renomeado, descartado ou reescrito é um aviso e nomeia um exemplo.

Por padrão, `doctor` também verifica os IDs de modelo configurados em relação ao catálogo do provedor ativo e compara a versão instalada com a última versão do GitHub. `--local` ignora ambas as chamadas de rede. Uma versão mais recente, ou uma solicitação do GitHub que falha, é um aviso. Um ID de modelo ausente ou expirado faz com que o comando falhe. `--strict` sai com um erro quando qualquer verificação emite um aviso.

Os valores das chaves de API nunca são impressos. As variáveis definidas são listadas em ordem alfabética como `Configured variables: NAME, ...`. Uma variável que não é uma chave de API inclui seu valor.

Caminhos de entrada ausentes falham. Diretórios de saída ausentes são uma observação, porque a primeira execução de tradução os cria. `doctor` não reescreve a configuração, cria diretórios ou envia texto de origem para um modelo. `--fix-gitignore` anexa linhas `.gitignore` ausentes e deixa todos os outros arquivos intactos.

`doctor` avisa quando `.gitignore` ao lado da configuração está faltando um padrão necessário. O aviso informa para executar `ai-i18n-tools doctor --fix-gitignore`. Quando `.gitignore` já existe, ele anexa uma linha em branco, o comentário `# ai-i18n-tools doctor fix` e apenas as linhas ausentes. Ele não duplica linhas já presentes. Um arquivo ausente é criado com o mesmo bloco que `init` escreve. Os dois padrões de cache seguem a `cacheDir` configurada, então `.i18n-cache` precisa de `.i18n-cache/*` e `!.i18n-cache/cache.db` em vez das linhas `.translation-cache` padrão. Os outros padrões são `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp` e `*.backup.*`. Uma linha que ignora o próprio diretório de cache, como `.i18n-cache/`, também é um aviso, porque o Git não rastreará `cache.db` em um diretório ignorado. `--fix-gitignore` não remove essa linha. O aviso falha o comando apenas com `--strict`.

**Opções principais:** `--local`, `--strict`, `--json`, `--fix-gitignore`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
ai-i18n-tools doctor --fix-gitignore
```

---

<a id="help"></a>
### `help`

**Sinopse:** `ai-i18n-tools help [command]`

Exibe a ajuda para um subcomando (mesma saída que `ai-i18n-tools <command> --help`).
