<a id="architecture"></a>
# Arquitetura

<a id="architecture-overview"></a>
## Visão geral da arquitetura

A base de código está organizada em quatro camadas. Use esta seção para o modelo mental; abra a [árvore de origem](#source-tree) quando precisar de detalhes em nível de arquivo.

<a id="how-a-sync-run-fits-together"></a>
### Como uma execução de `sync` se encaixa

`sync` (e os comandos de tradução individuais) executam recursos habilitados em ordem:

| Etapa | Comando | O que ele faz |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | Escanear fontes da UI → atualizar `strings.json` → preencher JSON de localidade plana (`de.json`, …) |
| 2 | `translate-svg` *(opcional)* | Traduzir texto SVG em `config.svg` |
| 3 | `translate-docs` | Traduzir páginas markdown, MDX, `.astro`; JSON de catálogo Docusaurus; `_meta` / dicionário `.ts` Nextra; catálogo de temas VitePress |
| 4 | `translate-json` *(opcional)* | Traduzir folhas JSON aninhadas em `json[]` |

Todo pipeline segue o mesmo loop principal: **extrair segmentos → proteger sintaxe → agrupar → pesquisa de cache ou chamada LLM → gravar saída**. Serviços compartilhados no meio — configuração, placeholders, cache, glossário, `LlmClient` — são descritos em [Infraestrutura compartilhada](#shared-infrastructure).

<a id="module-map"></a>
### Mapa de módulos

| Camada | Pasta | Função |
| --- | --- | --- |
| **Entrada** | `src/cli/` | Comandos CLI: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **Pipelines** | `src/extractors/` | Extração de segmentos de JS/TS, marcadores HTML, markdown, JSON, SVG, `.astro` |
| | `src/processors/` | Proteção de placeholder, agrupamento, validação, reescrita de link |
| **Compartilhado** | `src/core/` | Configuração, tipos, cache SQLite, prompts, caminhos de saída, utilitários de localidade |
| | `src/api/` | `LlmClient` — cliente de chat agnóstico de provedor (Vercel AI SDK) com fallback de modelo |
| | `src/glossary/` | Carregamento de glossário e dicas de termos para prompts |
| | `src/utils/` | Logger, hashing, analisador de ignorados, tabelas de largura de exibição, carregador `.env` |
| **Tempo de execução do seu aplicativo** | `src/runtime/` | Ajudantes i18next e utilitários de exibição — exportados como `'ai-i18n-tools/runtime'` ([Ajudantes de tempo de execução](/guide/runtime-helpers)) |
| **UI da ferramenta** *(dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Localiza o próprio CLI e Painel de Tradução deste pacote — separado do conteúdo do seu projeto ([Auto-localização](#self-localization-tool-ui)) |

Tudo o que se destina ao uso programático é reexportado de `src/index.ts` ([API Programática](/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### Resumos do pipeline

| Pipeline | Seção | Entrada → saída |
| --- | --- | --- |
| Strings da UI | [Internos das strings da UI](#ui-strings-internals) | Arquivos de origem → `strings.json` → `{locale}.json` plano |
| Documentos | [Internos dos documentos](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → arquivos por localidade em `docs[].outputDir` |
| Pacotes JSON | [Internos do JSON](#json-internals) | JSON aninhado em `json[]` → arquivos JSON por localidade |
| SVG | [Internos dos documentos — extratores](#extractors) | Arquivos SVG em `config.svg` → cópias SVG traduzidas |

---

<a id="ui-strings-internals"></a>
## Detalhes internos das strings da UI

| Etapa | Componente | Resultado |
| --- | --- | --- |
| 1 | Arquivos de origem (JS/TS; `.astro` / `.html` opcionais) | Arquivos em disco |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` via `ui-string-babel.ts`) | Segmentos chaveados por hash MD5 |
| 3 | `strings.json` | Catálogo mestre: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | Array JSON de strings de origem → traduções (+ ID do modelo por lote) |
| 5 | `de.json`, `pt-BR.json`, … | Mapas planos: string de origem → tradução (sem metadados do modelo) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utiliza o `i18next-scanner` do `Parser.parseFuncFromString` para localizar chamadas `t("literal")` e `i18n.t("literal")` em arquivos JS/TS. Para fontes `.astro` (quando listadas em `ui.uiExtractor.extensions`), o `ui-string-babel.ts` analisa o frontmatter e blocos de modelo `{expression}` com `@babel/parser` e aplica as mesmas regras de `funcNames`. Nomes de funções e extensões de arquivos são configuráveis por meio de `ui.uiExtractor` (`ui.reactExtractor` é um alias suportado). `extract` **também mescla entradas não provenientes do scanner no mesmo catálogo:** o `package.json` do projeto `description` quando `includePackageDescription` está habilitado (padrão), e cada `englishName` de `ui-languages.json` quando `includeUiLanguageEnglishNames` é `true` e `uiLanguagesPath` está definido (strings já encontradas no código-fonte têm precedência). Os hashes dos segmentos são os **primeiros 8 caracteres hexadecimais do MD5** da string-fonte recortada — esses tornam-se as chaves em `strings.json`.

Para fontes `.html` / `.htm` (quando listadas em `ui.uiExtractor.extensions`), `extract` em vez disso roteia o arquivo através de `html-i18n-marks.ts`, que escaneia atributos de marcador `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` (configurável via `ui.uiExtractor.htmlI18nAttributes`). Um marcador simples obtém seu texto de origem do próprio `textContent` / `title` / `placeholder` do elemento; um marcador com valor (`data-i18n="Key"`) usa o valor. O mesmo módulo alimenta o comando `mark-html`, que insere os marcadores simples automaticamente. Arquivos HTML nunca chegam às etapas do Babel / i18next-scanner.

Sites Astro SSG simples podem pular o i18next: carregar `{locale}.json` plano no tempo de compilação e resolver `t('English')` pela chave do texto de origem (consulte `examples/astro-website/src/i18n/t.ts` e [Strings da UI — site Astro](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)).

Aplicativos HTML simples seguem o mesmo modelo de catálogo com atributos de marcador em vez de chamadas `t()` — consulte [Marcação de HTML para tradução](/guide/ui-strings/plain-html#marking-html-for-translation).

<a id="stringsjson"></a>
### `strings.json`

O catálogo mestre tem a seguinte estrutura:

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (opcional) — por localidade, qual modelo produziu essa tradução após a última execução bem-sucedida do `translate-ui` para essa localidade (ou `user-edited` se o texto foi salvo no Painel de Tradução). `locations` (opcional) — onde o `extract` encontrou a string (scanner + linha de descrição do pacote; strings somente de manifesto `englishName` podem omitir `locations`).

`extract` adiciona novas chaves e preserva os dados existentes de `translated` / `models` para chaves ainda presentes na varredura (literais do scanner, descrição opcional, `englishName` opcional do manifesto). `translate-ui` preenche entradas `translated` ausentes, atualiza `models` para localidades que traduz e grava arquivos de localidade planos.

`ui-languages.json` **manifesto** — array JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, referência `englishName`, `"ltr"` ou `"rtl"`). Use `generate-ui-languages` para construir um arquivo de projeto a partir do `sourceLocale` + `targetLocales` e do `data/ui-languages-complete.json` mestre embutido.

<a id="flat-locale-files"></a>
### Arquivos de localidade planos

Cada localidade de destino recebe um arquivo JSON plano (`de.json`) mapeando string de origem → tradução (sem campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

O i18next carrega esses arquivos como pacotes de recursos e procura traduções pela string de origem (modelo de chave como padrão).

<a id="ui-translation-prompts"></a>
### Solicitações de tradução de interface

`buildUIPromptMessages` constrói mensagens de sistema e do usuário que:

- Identifique os idiomas de origem e destino (pelo nome exibido em `localeDisplayNames` ou `ui-languages.json`).
- Envie um array JSON de strings e solicite um array JSON de traduções em retorno.
- Inclua dicas de glossário quando disponíveis.

O `LlmClient.translateUIBatch` tenta cada modelo em ordem, recorrendo ao próximo em caso de erros de análise (parse) ou de rede. A CLI cria essa lista por localidade de destino a partir de `localeModels`, do opcional `uiModels` e de `translationModels` (consulte [Provedores e modelos](/guide/providers-and-models#model-fallback-chain)).

---

<a id="documents-internals"></a>
## Detalhes internos dos documentos

| Etapa | Componente | Resultado |
| --- | --- | --- |
| 1 | Arquivos Markdown / MDX / JSON / `.astro` (`translate-docs`) | Arquivos de origem |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — segmentos tipados com hash + conteúdo |
| 3 | `PlaceholderHandler` | Texto protegido — HTML, advertências, âncoras, MDX, URLs, código inline, ênfase mascarada como tokens |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — agrupado por contagem + limite de caracteres |
| 5 | Pesquisa `TranslationCache` | Cache hit → pular; miss → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | Texto final — placeholders restaurados |
| 7 | `resolveDocumentationOutputPath` | Arquivo de saída — layout Docusaurus ou layout plano |

<a id="extractors"></a>
### Extratores

Todos os extratores estendem `BaseExtractor` e implementam `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide o markdown em segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. O frontmatter YAML é classificado como **não traduzível** (`slug`, `id` e outras chaves de roteamento permanecem estáveis). Blocos `export ...` de nível superior (por exemplo, definições de componentes React) são classificados como segmentos `other` não traduzíveis, juntamente com o tratamento `import ...` existente. Blocos de várias linhas que começam com uma tag JSX maiúscula (por exemplo, um bloco `<Tabs>`) são classificados como parágrafos traduzíveis. Segmentos não traduzíveis (blocos de código, HTML bruto) são preservados literalmente.
- `AstroTemplateExtractor` - análise e substituição para páginas de marketing `.astro` (`translate-docs` via `translateAstroFile` em `doc-translate.ts`). Extrai nós de texto HTML visíveis para o usuário e atributos traduzíveis (`alt`, `title`, `aria-label`, `placeholder`), além de literais de string dentro de blocos de modelo `{expression}` quando visíveis para o usuário. Ignora TypeScript de frontmatter, `<script>`, `<style>`, valores de atributos/chaves protegidos e literais dentro de `t('…')`. A remontagem ajusta as importações relativas quando os caminhos de saída são mais profundos (por exemplo, `src/pages/de/index.astro`). Consulte [Páginas do site Astro](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace).
- `JsonExtractor` - extrai valores de string de arquivos de rótulos JSON do Docusaurus (catálogos de UI do Docusaurus, não corpo MDX).
- `SvgExtractor` - extrai conteúdo `<text>`, `<title>` e `<desc>` de SVG (usado por `translate-svg` para arquivos em `config.svg`, não por `translate-docs`).
- `html-i18n-marks.ts` - um scanner focado de tags HTML usado por `extract` para fontes `.html` / `.htm` e pelo comando `mark-html`. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` leem atributos de marcador `data-i18n*` (marcador simples → `textContent` / `title` / `placeholder` do elemento; marcador com valor → o valor), e `markHtmlContent` insere marcadores simples em texto folha / título / elementos de placeholder (idempotente, respeita `data-i18n-ignore`, pula elementos parecidos com código e de conteúdo misto). O helper compartilhado `normalizeI18nText` mantém as chaves de tempo de compilação idênticas ao runtime do navegador.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sites híbridos Astro (UI + HTML de página)

Aplicativos Astro simples geralmente habilitam **ambas** as strings da UI e os documentos em uma única configuração (referência: `examples/astro-website/`):

| Camada | Mecanismo | Saída |
| --- | --- | --- |
| HTML do modelo | `AstroTemplateExtractor` + `translate-docs` | `.astro` por localidade em `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plano (fonte em inglês como chave) |

O comando `sync` executa as etapas habilitadas em ordem: **extrair** e depois **traduzir-ui** (quando `features.translateUIStrings`) → **traduzir-svg** opcional → **traduzir-docs** → **traduzir-json** opcional (a menos que ignorado com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`). O modelo de inicialização `ui-astro-website` gera apenas strings da UI; adicione `docs[]` e `features.translateDocs` para HTML da página.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Inserção de âncoras de título (`write-heading-ids` CLI)

O comando `write-heading-ids` é um pré-processador **local, sem uso de LLM**, para arquivos markdown de documentação. Implementação: `src/cli/write-heading-ids.ts` coordena a descoberta de arquivos; `src/markdown/write-heading-ids-core.ts` analisa as linhas e insere âncoras.

Ele requer uma configuração válida com **pelo menos um bloco `docs[]`**. Para cada bloco, ele coleta arquivos `.md` / `.mdx` em `contentPaths`, aplica as regras `.translate-ignore` do projeto (mesma ideia da tradução de documentos) e, opcionalmente, restringe a uma subárvore com `--path` / `--file`. Cada arquivo é transformado com `applyHeadingAnchorsToMarkdown`: para cada **cabeçalho ATX simples** (`# …` a `###### …`) fora de blocos de código cercados, uma linha HTML vazia `<a id="slug"></a>` é inserida na linha acima quando ausente ou desatualizada. Os algoritmos de slug correspondem a ecossistemas comuns — `github` (padrão), `bitbucket`, `gitlab`, `pymdown` (sinalizadores opcionais de normalização Unicode / codificação de porcentagem), `azure-devops` — para que os IDs de âncora permaneçam consistentes com as ferramentas existentes (doctoc, PyMdown, etc.). `--dry-run` relata edições potenciais sem escrever.

Este comando **não** é executado dentro do `translate-docs` ou do `sync`; execute-o explicitamente quando desejar IDs de fragmento estáveis nos arquivos de origem antes da tradução ou publicação.

<a id="placeholder-protection"></a>
### Proteção de espaços reservados

Antes da tradução, a sintaxe sensível é substituída por tokens opacos para evitar corrupção pelo LLM, aplicado nesta ordem (a restauração é inversa):

1. **Tags e comentários HTML** (`<strong>`, `<!-- ... -->`, etc.) - tags HTML em minúsculas de uma lista de permissões conhecida são substituídas por tokens ```{{HTM_N}}```. Tags JSX capitalizadas (`<Highlight>`, `<Tabs>`, `</Tab>`) são tratadas separadamente pela camada MDX (etapa 4).
2. **Marcadores de advertência** (`:::note`, `:::`) - apenas o prefixo da diretiva na linha de abertura é substituído por ```{{ADM_OPEN_N}}```; qualquer título na mesma linha é deixado para o modelo traduzir. Restaurado com o texto original exato.
3. **Âncoras de documento** (HTML `<a id="…">`, cabeçalho Docusaurus `{#…}`) - preservadas literalmente.
4. **Construções apenas MDX** (`src/processors/mdx-placeholders.ts`):
   - **Comentários MDX** (`{/* … */}`, incluindo o formato de heading-id do Docusaurus `{/* #my-id */}`) substituídos por ```{{MDX_N}}```.
   - **Tags JSX com iniciais maiúsculas** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - preservadas como ```{{MDX_N}}``` com atributos de string traduzíveis (`label`, `tooltip`, `aria-label`) reescritos para ```{{JXA_N}}``` dentro da tag, a menos que o nome do atributo apareça em `docs[].protectAttributes`; `label:` dentro de literais de objeto `<Tabs values={[ { label: '…' } ]}>` (ignoráveis via `docs[].protectKeys`) e `<TabItem value="…">` (quando não existe o atributo `label`, ignorando valores em minúsculas semelhantes a slugs) também são extraídos. Anexados ao segmento como linhas `||JXA_N: …||`, mesclados de volta por `restoreMdx`.
   - **Expressões de chaves MDX** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) - correspondência sensível à profundidade, substituídas por ```{{MDX_N}}```.
5. **URLs Markdown** (`](url)`, `src="…"`) - restauradas de um mapa após a tradução.
6. **Trechos de código embutidos** (`` `code` ``) e **código embutido em negrito** (`**`code`**`) - preservados.
7. **Ênfase em markdown** (opcional, ativado automaticamente para localidades CJK/RTL) - delimitadores de ênfase mascarados.

A proteção de atributos/chaves compartilhados para modelos Astro e MDX JSX é implementada em `src/processors/expression-attribute-protection.ts` e controlada por bloco por `docs[].protectAttributes` e `docs[].protectKeys` (consulte [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

O banco de dados SQLite (via `node:sqlite`) armazena linhas indexadas por `(source_hash, locale)` com `translated_text`, `model`, `filepath`, `last_hit_at` e campos relacionados. O hash corresponde aos primeiros 16 caracteres hexadecimais SHA-256 do conteúdo normalizado (espaços em branco reduzidos).

A cada execução, os segmentos são pesquisados por hash × localidade. Apenas os erros de cache vão para o LLM. Após a tradução, `last_hit_at` é redefinido para as linhas de segmento no escopo de tradução atual que não foram atingidas. Os acertos de cache bem-sucedidos durante a tradução de documentos limpam as linhas `translation_failures` obsoletas para esse segmento. `cleanup` executa `sync --force-update` primeiro, depois remove as linhas de segmento obsoletas (`last_hit_at` nulo / caminho de arquivo vazio), remove as chaves `file_tracking` quando o caminho de origem resolvido está ausente no disco (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), remove as linhas de tradução cujo caminho de arquivo de metadados aponta para um arquivo ausente, remove as linhas `translation_failures` órfãs e remove as linhas `markdown_source_issues` órfãs cujo caminho de origem resolvido está ausente no disco; ele não faz backup de `cache.db` a menos que `--backup <path>` seja passado, o que grava um backup nesse caminho primeiro.

O comando `translate-docs` também usa **rastreamento de arquivos** para que fontes inalteradas com saídas existentes e atualizadas possam pular o trabalho completamente. `--force-update` executa novamente o processamento de arquivos enquanto ainda usa o cache de segmento; `--force` limpa o rastreamento de arquivos e ignora as leituras do cache de segmento para tradução de API. Quando cada modelo configurado falha na validação AST em um segmento markdown, `translate-docs` pode dividir progressivamente o segmento e tentar novamente partes menores (`docs[].segmentSplitting.qualityRetrySplit`, padrão ativado). Consulte [Documentos — comportamento do cache e sinalizadores](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) para a tabela completa de sinalizadores.

**Formato de prompt em lote:** `translate-docs --prompt-format` seleciona XML (`<seg>` / `<t>`) ou formatos de array/objeto JSON apenas para `LlmClient.translateDocumentBatch`; extração, placeholders e validação permanecem inalterados. Consulte [Formato de prompt em lote](/guide/documents/cli-options#batch-prompt-format).

<a id="output-path-resolution"></a>
### Resolução de caminho de saída

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapeia um caminho relativo à fonte para o caminho de saída:

- Estilo `nested` (padrão): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo `doc-system`: em `docsRoot`, as saídas usam `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; caminhos fora de `docsRoot` voltam para o layout aninhado. Aliases: `docusaurus` (padrão `localeSubpath` = caminho do plugin Docusaurus), `astro-starlight` (padrão vazio `localeSubpath`), `vitepress` (o mesmo que `doc-system` com `localeSubpath` vazio; preserva o uso de maiúsculas e minúsculas da pasta BCP-47).
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Quando `flatPreserveRelativeDir` é `true`, os subdiretórios de origem são mantidos em `outputDir`.
- **Personalizado** `pathTemplate`: qualquer layout markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: layout personalizado separado para arquivos de rótulos JSON, usando os mesmos espaços reservados.
- `linkRewriteDocsRoot` ajuda o reescritor de links planos a calcular os prefixos corretos quando a saída traduzida está localizada em outro lugar além da raiz padrão do projeto.

<a id="flat-link-rewriting"></a>
### Reescrita plana de links

Quando `docsOutput.style === "flat"`, os arquivos markdown traduzidos são colocados ao lado da fonte com sufixos de localidade. Links relativos entre páginas são reescritos para que `[Guide](./guide.md)` em `readme.de.md` aponte para `guide.de.md`. Controlado por `rewriteRelativeLinks` (ativado automaticamente para estilo plano sem um `pathTemplate` personalizado). A mesma passagem adiciona um prefixo de profundidade por arquivo a URLs de ativos não markdown antes que `postProcessing.regexAdjustments` seja executado — consulte [Reescritor de link plano](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow).

---

<a id="json-internals"></a>
## Detalhes internos do JSON

| Etapa | Componente | Resultado |
| --- | --- | --- |
| 1 | `json[].contentPaths` | Arquivos resolvidos (arquivo, diretório ou glob) |
| 2 | `NestedJsonExtractor` | Folhas de string selecionadas por `keyPolicy` (caminhos de ponto + minimatch) |
| 3 | `PlaceholderHandler` + lote + `TranslationCache` | Cache hit → pular; miss → `LlmClient.translateDocumentBatch` (SQLite compartilhado) |
| 4 | `NestedJsonExtractor.reassemble` | Arquivo de saída via `expandJsonBlockOutputPath(outputPathTemplate)` |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) percorre JSON aninhado arbitrário e emite um segmento por folha de string traduzível. `keyPolicy.mode` (`allowlist`, `denylist` ou `both`) filtra caminhos com minimatch na notação de ponto (nomes simples como `slug` correspondem ao segmento de chave final).
- O rastreamento de arquivos de cache usa `json-block:{blockIndex}:{projectRelPath}` em `file_tracking` (o mesmo `cacheDir` que documentos e SVG).
- **Não** para catálogos `write-translations` do Docusaurus (formato `{ message, description }`) — estes usam Documentos (`docs[].docusaurusCatalogDir` + `JsonExtractor` dentro de `translate-docs`).
- **Não** para strings da UI `t()` — strings da UI (`strings.json` + pacotes planos).
- CLI: `translate-json`; orquestração em `src/cli/translate-json-run.ts`. Modelo init: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Infraestrutura compartilhada

<a id="llmclient"></a>
### `LlmClient`

Cliente de chat independente de provedor construído sobre o Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`). Ele resolve o provedor ativo a partir de `provider` / `providers`, constrói um cliente compatível com OpenAI (`createOpenAICompatible`) para o `baseUrl` + chave de API desse provedor e roteia todas as chamadas através de `generateText`. `OpenRouterClient` é mantido como um alias obsoleto. Comportamentos chave:

- **Fallback de modelo**: tenta cada modelo na lista resolvida em ordem; retorna em caso de falha de solicitação ou análise. Cada localidade de destino obtém sua própria cadeia resolvida: `localeModels(locale)` primeiro quando configurado, depois `uiModels` (somente pipelines de UI), depois `translationModels`. A tradução de Documentos, JSON e SVG cria um cliente por localidade com a cadeia não-UI. O comando `bench-models` em vez disso, constrói um único cliente de modelo por ID configurado (união de `translationModels`, `uiModels` e `localeModels`; `translationModels: [id]`, sem fallback) para que possa cronometrar e precificar cada modelo independentemente.
- **Tempo limite da solicitação**: o `requestTimeoutMs` do provedor ativo (padrão 30 segundos) anula cada solicitação via `AbortSignal.timeout`. O mesmo valor se aplica a `GET /models` quando a CLI carrega a lista de modelos de um provedor para `check-models` (qualquer provedor). O filtro de pré-voo opcional que descarta IDs de modelo desconhecidos é executado apenas quando o provedor ativo é o OpenRouter.
- **Extras do OpenRouter** (somente quando `openrouter` está ativo): roteamento de throughput via campo de solicitação `provider`, cabeçalhos `HTTP-Referer` / `X-Title` e custo exato em USD lido de `usage.cost`. O uso de token é relatado para cada provedor; o custo exato somente quando o provedor o retorna.
- **Log de tráfego de depuração**: se `debugTrafficFilePath` estiver definido, anexa JSON de solicitação e resposta a um arquivo.

<a id="config-loading"></a>
### Carregamento de configuração

Pipeline `loadI18nConfigFromFile(configPath, cwd)`:

1. Ler e analisar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - mesclar profundamente com `defaultI18nConfigPartial`, e mesclar quaisquer entradas `docs[].sourceFiles` em `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - se `targetLocales` for um caminho de arquivo, carregar o manifesto e expandir para códigos de localidade; definir `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - o mesmo para cada entrada `docs[].targetLocales`.
5. `expandJsonTargetLocalesInRawInput` - o mesmo para cada entrada `json[].targetLocales`.
6. `parseI18nConfig` - validação Zod + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` - quando `-P` / `--provider` é passado na CLI.
8. `applyEnvOverrides` - aplica `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE` e `I18N_TARGET_LOCALES` quando definidos (as chaves de API são resolvidas separadamente por provedor dentro de `LlmClient`).
9. `augmentConfigWithUiLanguagesMaster` - anexa nomes de exibição de manifesto do catálogo mestre empacotado.
10. `assertEffectiveLocalesInUiLanguagesMaster` - valida códigos de localidade em relação ao catálogo mestre quando aplicável.

`init` escreve configurações iniciais de `initConfigTemplates`: `ui-markdown` (UI + markdown de aplicativo opcional), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (documentos VitePress + `vitepressThemeCatalog`), `ui-nextra` (documentos Nextra + `nextraDictionaryPath`), `ui-astro-website` (UI Astro simples; adicione `docs[]` para tradução de página `.astro`), `ui-json-bundles` (somente `json[]` JSON). Consulte [Início rápido — Inicializar](/guide/quick-start#step-1-initialise).

<a id="logger"></a>
### Registrador de eventos (Logger)

`Logger` suporta níveis `debug`, `info`, `warn`, `error` com saída de cores ANSI. O modo detalhado (`-v`) habilita `debug`. Quando `logFilePath` está definido, as linhas de log também são gravadas nesse arquivo.

<a id="self-localization-tool-ui"></a>
### Auto-localização (interface do usuário da ferramenta)

A ferramenta localiza sua própria interface — ajuda da CLI, mensagens de log/resumo/erro de alto tráfego e o Painel de Tradução — separadamente do conteúdo que ela traduz para você.

- **Resolução de localidade** (`resolveUiLocale` em `src/core/ui-locale.ts`): escolhe a localidade da UI de `-L` / `--ui-lang` > `AI_I18N_LANG` > configuração `uiLanguage` > localidade do SO host (`Intl.DateTimeFormat().resolvedOptions().locale`). O candidato é normalizado e comparado com o conjunto de pacotes enviados exatamente ou pela variação mais próxima (por exemplo, `pt-PT` → `pt-BR`, `en-US` → `en-GB`), retornando à localidade de origem (`en-GB`). A CLI resolve uma vez antes que a ajuda seja construída (verificação de argv pré-análise) e novamente após o carregamento da configuração para que `uiLanguage` se aplique (a flag e a variável de ambiente ainda prevalecem).
- **Tempo de execução** (`src/i18n/index.ts`): um `t(source, vars)` mínimo com interpolação ```{{name}}```, indexado pela string de origem em inglês em relação a pacotes planos por localidade em `src/i18n/locales/<code>.json` (copiado para `dist/i18n/locales` na compilação). Chaves ou pacotes ausentes retornam o texto de origem. Este é o mesmo modelo de chave como padrão que as strings da UI — não há pesquisa de hash.
- **Painel**: o servidor expõe `GET /api/ui-i18n` retornando `{ locale, dir, bundle }` para a localidade da UI resolvida; o frontend define `<html lang>` / `dir` e localiza a marcação estática via atributos `data-i18n*`.
- **Dogfooding**: os pacotes são produzidos executando o próprio pipeline de extração → `translate-ui` do pacote contra `ai-i18n-self.config.json` (`pnpm i18n:self`). As chaves do catálogo vêm de chamadas `t()` em `src/cli/` e `src/i18n/`, além dos marcadores `data-i18n*` do painel em `src/dashboard-app/index.html`.

---

<a id="extension-points"></a>
## Pontos de extensão

<a id="custom-function-names-ui-extraction"></a>
### Nomes personalizados de funções (extração da interface)

Adicione nomes não padrão de funções de tradução via configuração:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` é um alias totalmente suportado para `ui.uiExtractor`.)

Adicione `.html` / `.htm` a `extensions` para escanear atributos de marcador HTML durante `extract`. `ui.uiExtractor.htmlI18nAttributes` é opcional e usa o padrão `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`; `data-i18n` mapeia para o `textContent` do elemento e `data-i18n-<attr>` mapeia para o valor do atributo (por exemplo, `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### Extratores personalizados

Implemente `ContentExtractor` a partir do pacote:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Registre extratores personalizados estendendo as classes de extrator públicas exportadas de `'ai-i18n-tools'` (por exemplo, subclasse `MarkdownExtractor`). A CLI conecta extratores internos internamente; não há importação profunda suportada de `doc-translate.ts`.

<a id="custom-output-paths"></a>
### Caminhos de saída personalizados

Use `docsOutput.pathTemplate` para qualquer estrutura de arquivos:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## Árvore de origem

<details>
<summary>Layout completo de <code>src/</code> (referência em nível de arquivo)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
