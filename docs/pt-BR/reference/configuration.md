<a id="configuration-reference"></a>
# Referência de configuração

<a id="sourcelocale"></a>
### `sourceLocale`

Código BCP-47 para o idioma de origem (por exemplo, `"en-GB"`, `"en"`, `"pt-BR"`). Nenhum arquivo de tradução é gerado para este locale — a própria string da chave é o texto de origem.

**Deve coincidir** com o `SOURCE_LOCALE` exportado do seu arquivo de configuração de i18n em tempo de execução (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Matriz de códigos de locale BCP-47 para os quais traduzir (por exemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` é a lista principal de locales para tradução da interface e a lista padrão de locales para blocos de documentação. Use `generate-ui-languages` para gerar o manifesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

<a id="uilanguage-optional"></a>
### `uiLanguage` (opcional)

Código BCP-47 para o idioma da interface do usuário da ferramenta (ajuda da CLI, logs/resumos e o Painel de Tradução). É independente de `sourceLocale` / `targetLocales` e é substituído pelo sinalizador `-L` / `--ui-lang` e pela variável de ambiente `AI_I18N_LANG`. Valores desconhecidos são degradados graciosamente para o local de origem (`en-GB`) — não há validação estrita. Consulte [Idioma da interface do usuário da ferramenta](/reference/environment-variables#tool-ui-language).

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (opcional)

Caminho para o manifesto `ui-languages.json` usado para nomes exibidos, filtragem de locale e pós-processamento da lista de idiomas. Quando omitido, a CLI procura o manifesto em `ui.flatOutputDir/ui-languages.json`.

Use isso quando:

- O manifesto está fora de `ui.flatOutputDir` e você precisa apontar a CLI para ele explicitamente.
- Você deseja [pós-processamento do seletor de idioma](#language-switcher-languagelistblock) (`languageListBlock`) para construir rótulos de localidade a partir do manifesto.
- `extract` deve mesclar entradas `englishName` do manifesto em `strings.json` (requer `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (opcional)

Número máximo de **locales de destino** traduzidos simultaneamente (`translate-ui`, `translate-docs`, `translate-svg` e as etapas correspondentes dentro de `sync`). Se omitido, a CLI usa **4** para tradução de interface e **3** para tradução de documentação (padrões embutidos). Substitua por execução com `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (opcional)

**translate-docs**, **translate-svg** e **translate-json** (e as etapas correspondentes dentro de `sync`): solicitações **em lote** de LLM paralelas máximas por arquivo (cada lote pode conter muitos segmentos). Padrão **4** quando omitido. Ignorado por `translate-ui`. Substitua por `-b` / `--batch-concurrency`.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (opcional)

Número máximo de arquivos processados simultaneamente **dentro de um único idioma** durante `translate-docs` e `sync`. Quando definido como um valor maior que **1**, os arquivos dentro do mesmo idioma são processados em paralelo usando um semáforo para controlar o uso de memória. O valor padrão é **1** (processamento sequencial) quando omitido. Valores mais altos podem melhorar significativamente o desempenho em operações limitadas por E/S, especialmente quando todos os segmentos já estão em cache (sem chamadas à API necessárias).

**Exemplo:**

```json
{
  "fileConcurrency": 4
}
```

**Caso de uso:** Defina isso como `2-4` ao executar `sync --force-update` com 100% de acertos no cache para reduzir o tempo total de processamento. A melhoria é mais perceptível com muitos arquivos pequenos.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (opcional)

Agrupamento de segmentos para **translate-docs**, **translate-svg** e **translate-json**: quantos segmentos por solicitação de API e um limite de caracteres. Padrões: **20** segmentos, **4096** caracteres (quando omitido).

<a id="provider-and-providers"></a>
### `provider` e `providers`

`provider` (nível superior, opcional) seleciona a chave do provedor ativo de `providers`. É opcional quando exatamente um provedor é configurado; obrigatório quando mais de um é configurado.

`providers` (nível superior) mapeia uma chave de provedor para seu bloco. As chaves internas (consulte a tabela de predefinições abaixo) precisam apenas de `translationModels`; qualquer outra chave define um endpoint personalizado compatível com OpenAI e requer `baseUrl` (mais `apiKeyEnv`, a menos que o endpoint não precise de chave).

Cada bloco `providers.<name>` aceita:

- `translationModels`
  Lista ordenada preferencial de IDs de modelo (IDs puros do upstream, sem o prefixo `provider/`; IDs do OpenRouter mantêm sua forma nativa `vendor/model`). O primeiro é tentado primeiro; as entradas posteriores são fallbacks em caso de erro. Esta é a cadeia padrão global para cada pipeline quando nenhum nível mais específico se aplica.
- `uiModels` (opcional)
  Lista de modelos ordenada apenas para UI para `translate-ui`, geração de plurais (Etapa 0 e Passagem B) e `proofread-ui`. Tentada após qualquer entrada correspondente em `localeModels` para a localidade de destino, antes de `translationModels`.
- `localeModels` (opcional)
  Substituições por localidade para **todos** os pipelines de tradução. Array de objetos `{ "locale": "<BCP-47>", "models": ["…"] }`. As tags de localidade são comparadas sem distinção entre maiúsculas e minúsculas (`pt-br` = `pt-BR`). A lista de cada localidade é tentada primeiro apenas para aquela localidade, seguida pelos níveis específicos do pipeline (`uiModels` para UI) e `translationModels`. Chaves de localidade normalizadas duplicadas são rejeitadas no carregamento da configuração.
- `baseUrl`
  URL base compatível com OpenAI. Substitui a URL base predefinida; obrigatório para um provedor não predefinido.
- `apiKeyEnv`
  Variável de ambiente que contém a chave da API. Substitui a variável de ambiente predefinida.
- `headers`
  Cabeçalhos HTTP extras enviados com cada solicitação para este provedor.
- `maxTokens`
  Máximo de tokens de conclusão por solicitação. Padrão: `8192`.
- `temperature`
  Temperatura de amostragem. Padrão: `0.2`.
- `requestTimeoutMs`
  Tempo máximo em milissegundos para aguardar por cada solicitação. Padrão: `30000` (30 segundos).

Presets de provedores integrados (chave — URL base — variável de ambiente da chave de API):

| Provedor | URL Base | Variável de ambiente da chave de API |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (nenhum) |

Um bloco `openrouter` legado de nível superior (com `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) ainda é aceito e é migrado automaticamente para `providers.openrouter` (com `provider: "openrouter"`) ao carregar; `defaultModel` / `fallbackModel` são incorporados em `translationModels`.

Para um exemplo executável que configura vários provedores em uma configuração e alterna entre eles com `-P`, consulte [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (`openai`, `anthropic`, `nvidia` e `deepseek` no mesmo documento).

**Por que usar vários modelos:** Diferentes provedores e modelos têm custos variados e oferecem diferentes níveis de qualidade entre idiomas e localidades. Configure `translationModels` **como uma cadeia de fallback ordenada** (em vez de um único modelo) para que a CLI possa tentar o próximo modelo se uma solicitação falhar.

Considere a lista abaixo como uma **linha de base** que você pode expandir: se a tradução para um local específico for ruim ou malsucedida, pesquise quais modelos suportam esse idioma ou script de forma eficaz (consulte recursos online ou a documentação do seu provedor) e adicione esses IDs de modelo como outras alternativas.

Esta lista foi **testada quanto à ampla cobertura de localidades** em um grande projeto de documentação com 36 localidades de destino; serve como um padrão prático, mas não há garantia de bom desempenho para todas as localidades.

Exemplo de `translationModels` (mesmos padrões do `npx ai-i18n-tools init`):

<details>
<summary>Lista padrão de fallback para translationModels</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

Defina a variável de ambiente da chave de API do provedor ativo (por exemplo, `OPENROUTER_API_KEY`) em seu ambiente ou arquivo `.env`.

Antes de alterar as listas de modelos, execute `npx ai-i18n-tools check-models`. Para qualquer provedor, ele verifica cada ID de modelo configurado (`translationModels`, `uiModels` e todas as entradas de `localeModels`) em relação à lista de modelos ativos desse provedor (`GET /models`), relata IDs que estão ausentes ou após o `expiration_date`, lista os modelos válidos e encerra com código diferente de zero quando qualquer ID configurado é inválido. Quando o provedor retorna preços (por exemplo, OpenRouter), ele também mostra os preços estimados de entrada/saída (USD por 1 milhão de tokens).

Para comparar os modelos configurados em um trabalho de tradução real, execute `npx ai-i18n-tools bench-models`. Ele compara cada ID de modelo exclusivo de `translationModels`, `uiModels` e `localeModels` traduzindo uma amostra por meio de cada um isoladamente (em paralelo, limitado por `concurrency`) e imprime tokens de entrada/saída por modelo, tempo de execução e custo em USD, para que você possa pesar a velocidade em relação ao preço antes de definir as listas de modelos.

<a id="features"></a>
### `features`

| Campo                | Pipeline | Descrição                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | Extrair `t("…")` / `i18n.t("…")` para `strings.json`, então traduzir entradas e escrever JSON plano por localidade (a extração é executada automaticamente; use `extract` autônomo para atualizar apenas o catálogo). |
| `translateDocs` | 2 | Traduzir páginas `.md` / `.mdx` / `.astro`; JSON shell do Docusaurus quando `docs[].docusaurusCatalogDir` está definido; `_meta` / dicionário Nextra quando configurado; tema VitePress quando `docsOutput.vitepressThemeCatalog` está definido. |
| `translateJson`      | 3        | JSON aninhado arbitrário sob `json[]` (`translate-json`).                                                                                                           |
| `translateSVG`       | —        | Traduzir arquivos `.svg` (requer o bloco `svg` no nível superior).                                                                                                       |

**Traduz** arquivos SVG com `translate-svg` quando `features.translateSVG` é verdadeiro e um bloco `svg` de nível superior está configurado. O comando `sync` executa essa etapa quando ambos estiverem definidos (a menos que `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Diretórios ou padrões glob (relativos ao diretório de trabalho atual) verificados para chamadas `t("…")`. Suporta padrões como `src/` ou `["src/**/*.ts"]`.
- `stringsJson`  
  Caminho para o arquivo de catálogo mestre. Atualizado por `extract`.
- `flatOutputDir`  
  Diretório onde os arquivos JSON por localidade são gravados (`de.json`, etc.).
- `uiExtractor.funcNames` (ou legado `reactExtractor.funcNames`)  
  Nomes de funções adicionais para verificar (padrão: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (ou legado `reactExtractor.extensions`)  
  Extensões de arquivo a serem incluídas (padrão: `[".js", ".jsx", ".ts", ".tsx"]`). Adicione `.astro` para frontmatter do Astro e expressões de template.
- `uiExtractor.includePackageDescription` (ou legado `reactExtractor.includePackageDescription`)  
  Quando `true` (padrão), `extract` também inclui `package.json` `description` como uma string de UI quando presente.
- `uiExtractor.packageJsonPath` (ou legado `reactExtractor.packageJsonPath`)  
  Caminho personalizado para o arquivo `package.json` usado para essa extração de descrição opcional.
- `uiExtractor.includeUiLanguageEnglishNames` (ou legado `reactExtractor.includeUiLanguageEnglishNames`)

Quando `true` (padrão `false`), `extract` também adiciona cada `englishName` do catálogo mestre de idiomas da interface do usuário (construído a partir de `sourceLocale` + `targetLocales`) a `strings.json` quando ainda não presente na varredura da fonte (mesmas chaves hash). Não lê `uiLanguagesPath`.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Diretório de cache SQLite (compartilhado por todos os blocos `docs`). Padrão `.translation-cache`. Reutilize entre execuções. Se você estiver migrando de um cache de tradução de documentos personalizado, arquive-o ou exclua-o — `cacheDir` cria seu próprio banco de dados SQLite e não é compatível com outros esquemas.

<a id="best-practice-for-git-exclusions"></a>
#### Melhor prática para exclusões no git:

- Exclua o conteúdo da pasta de cache de tradução (por exemplo, usando `.gitignore` ou `.git/info/exclude`) para evitar o commit de artefatos temporários de cache.
- Mantenha `cache.db` (não exclua rotineiramente), pois preservar o cache SQLite evita a re-tradução de segmentos inalterados. Isso economiza tempo de execução e custos de API ao atualizar ou modificar software que usa `ai-i18n-tools`.
- Exclua arquivos temporários e de log para evitar o commit de arquivos de backup e depuração.

<br/>

**Exemplo:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Array de blocos de pipeline de documentação. `translate-docs` e a fase de documentos de `sync` **processam cada** bloco em ordem. Chaves legadas ainda são aceitas no momento do carregamento e reescritas quando o arquivo de configuração é gravável; prefira os nomes atuais em novas configurações.

| Chave legada | Chave/comportamento atual |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| `openrouter` de nível superior | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | removido (use `docs[].docusaurusCatalogDir` ou `json[]`) |
| `features.extractUIStrings` | removido (`extract` é executado antes da tradução da interface do usuário) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (alias ainda aceito) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**Fontes de conteúdo**

- `description`
Nota opcional legível por humanos para este bloco (não usada para tradução). É prefixada no título do `translate-docs` `🌐` quando definida; também exibida nos cabeçalhos das seções `status`.
- `contentPaths`
Corpos de páginas em Markdown/MDX e modelos `.astro` a serem traduzidos (`translate-docs` examina estes por `.md`, `.mdx` e `.astro`). Suporta **caminhos de diretório ou padrões glob** (por exemplo, `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). É daí que vem o conteúdo textual da documentação localizada.
- `sourceFiles`
Alias opcional mesclado em `contentPaths` no carregamento.
- `targetLocales`
Subconjunto opcional de localidades apenas para este bloco (caso contrário, usa a `targetLocales` raiz). As localidades efetivas de documentação são a união entre todos os blocos.
- `docusaurusCatalogDir`
Opcional. Diretório de origem para catálogos de rótulos JSON do Docusaurus para este bloco (por exemplo, `"i18n/en"` de `docusaurus write-translations`). Os corpos das páginas sempre vêm de `contentPaths`; `docusaurusCatalogDir` apenas fornece JSON de shell/UI, não MDX.
- `nextraMetaGlob`
Glob(s) opcionais para `_meta.ts` / `_meta.tsx` / `_meta.js` do Nextra em `docsRoot`. Quando `docsOutput.style` é `"nextra"` e isso é omitido, todos os arquivos `_meta` em `docsRoot` são coletados automaticamente.
- `nextraMetaTranslatableKeys`
Nomes de propriedades opcionais cujos valores de string são traduzidos em objetos `_meta` do Nextra (padrão: `title`, `display`, `breadcrumb`).
- `nextraDictionaryPath`
Módulo de dicionário de tema Nextra em inglês opcional (por exemplo, `"app/_dictionaries/en.ts"`). Traduzido para `{dir}/{locale}.ts` durante `translate-docs`.
- `nextraDictionaryOutputTemplate`
Modelo de saída opcional para módulos de dicionário de localidade (padrão: `{dir}/{locale}.ts` em relação ao diretório do dicionário).

**Layout de saída**

- `outputDir`
Diretório raiz para a saída traduzida para este bloco.
- `docsOutput.style`
`"nested"` (padrão), `"flat"`, `"doc-system"`, ou aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`.
- `docsOutput.localeSubpath`
Segmento de caminho entre `{locale}/` e `{relativeToDocsRoot}` para `doc-system` (obrigatório ao usar `style: "doc-system"` diretamente; predefinido ao usar um alias). Use `""` para pastas de localidade no estilo Starlight.
- `docsOutput.docsRoot`
Raiz dos documentos de origem para o layout do Docusaurus (por exemplo, `"docs"`). Padrão `"docs"` quando omitido.
- `docsOutput.pathTemplate`
Caminho de saída de markdown personalizado. Espaços reservados: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Caminho de saída JSON personalizado para arquivos de rótulo. Suporta os mesmos espaços reservados que `pathTemplate`.
- `docsOutput.localePathLowercase`
Quando `true`, layouts de saída integrados (`nested`, `flat`, `doc-system` sem `pathTemplate`) usam segmentos de localidade em minúsculas nos caminhos. Padrão `false`; `astro-starlight` e `doc-system` com `localeSubpath` vazio padronizam para `true` no carregamento da configuração.
- `docsOutput.flatPreserveRelativeDir`
Quando `docsOutput.style = "flat"`, mantenha os subdiretórios de origem para que arquivos com o mesmo nome base não colidam. Padrão `false`.
- `docsOutput.rewriteRelativeLinks`
Reescrever links relativos após a tradução (ativado automaticamente quando `docsOutput.style = "flat"` e sem `pathTemplate` personalizado).
- `docsOutput.linkRewriteDocsRoot`
Raiz do repositório usada ao calcular prefixos de reescrita de link plano. Geralmente, deixe como `"."`, a menos que seus documentos traduzidos estejam em uma raiz de projeto diferente.
- `docsOutput.rewriteVitepressLinks`
Quando `true`, execute o normalizador de links do VitePress após a tradução. O padrão é ativado quando `docsOutput.style` é `"vitepress"`. Use com qualquer layout `doc-system` onde as pastas de localidade ficam ao lado do inglês em `docsRoot`. Reescreve caminhos `docs/guide/…` no estilo README para rotas do site (`/guide/…`) e links `../guide/…` relativos à localidade. Para links para arquivos do repositório fora da árvore do VitePress (`LICENSE`, `examples/`), use URLs completas na fonte em inglês — consulte [Integração do VitePress — README como a página inicial da documentação](/guide/vitepress-integration#readme-as-homepage).
- `docsOutput.rewriteNextraLinks`
Quando `true`, execute o normalizador de links do Nextra após a tradução. O padrão é ativado quando `docsOutput.style` é `"nextra"`. Reescreve `content/en/…` e caminhos `.mdx` relativos para rotas de site neutras em relação à localidade (`/guide/…`) para Next.js `i18n`. Consulte [Integração do Nextra — Convenções de links](/guide/nextra-integration#link-conventions).
- `docsOutput.vitepressThemeCatalog`
Opcional. Bootstrap do catálogo de tema/navegação/barra lateral do VitePress + tradução dentro de `translate-docs`. Campos: `configPath` (configuração do VitePress com strings de tema), `catalogPath` (JSON aninhado em inglês gerado), `outputPathTemplate` opcional (padrão: `theme.{locale}.json` ao lado de `catalogPath`).

**Pós-processamento**

- `docsOutput.postProcessing`
Transformações opcionais no **corpo do markdown** traduzido (chaves YAML e valores de front matter não-prosa são preservados). Executa após a remontagem do segmento e a reescrita de links (simples ou VitePress), e antes de `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Lista ordenada de `{ "description"?, "search", "replace" }`. `search` é um padrão de regex (string simples usa a flag `g`, ou `/pattern/flags`). `replace` suporta placeholders como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regenera uma linha de link delimitada "ler em outros idiomas" no markdown original e traduzido. Requer `uiLanguagesPath` (ou um manifesto em `ui.flatOutputDir/ui-languages.json`) para rótulos de endônimos quando `label: "local"`.

**Comportamento e metadados**

- `translateFrontmatterFields`
Mesmo nível que `docsOutput` (por bloco `docs[]`). Padrão `true`: traduzir prosa YAML voltada para o usuário para Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`). Defina `false` para manter todo o bloco de front matter inalterado; passe um array de strings para restringir a caminhos de ponto específicos.
- `segmentSplitting`
Mesmo nível que `docsOutput` (por bloco `docs[]`). Segmentos mais granulares opcionais para extração `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Quando `enabled` é `true` (padrão quando `segmentSplitting` é omitido), parágrafos densos, tabelas GFM (o primeiro chunk inclui cabeçalho, separador e primeira linha de dados) e listas longas são divididos; as subpartes se unem com novas linhas únicas (`tightJoinPrevious`). Defina `"enabled": false` para usar um segmento por bloco de corpo delimitado por linha em branco apenas. Quando `qualityRetrySplit` é `true` (padrão), segmentos markdown que falham na validação AST após todos os modelos serem esgotados são divididos progressivamente e tentados novamente a partir do primeiro modelo; `maxQualityRetrySplitDepth` (padrão `3`) limita as divisões recursivas.
- `warnMarkdownSourceIssues`
Quando `true` (padrão quando omitido), cada execução de `translate-docs` verifica novamente os segmentos markdown em busca de delimitadores arriscados / código inline não fechado, imprime avisos no terminal e substitui as linhas `markdown_source_issues` para o caminho do arquivo de cache desse arquivo. Defina `false` para ignorar avisos e atualizações do SQLite para este bloco.
- `addFrontmatter`
Quando `true` (padrão quando omitido), os arquivos markdown traduzidos incluem as chaves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, e quando pelo menos um segmento tem metadados de modelo, `translation_models` (lista ordenada de IDs de modelo do provedor ativo). Defina como `false` para ignorar.
- `emphasisPlaceholders`
Por bloco `docs[]`. Quando `true`, mascara os delimitadores de ênfase do markdown como placeholders antes da tradução. O padrão é `true` para localidades CJK (`zh`, `ja`, `ko`) e para localidades listadas em `rtlLocales`; caso contrário, o padrão é `false`. Pode ser substituído via CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`.
- `rtlLocales`
Array opcional de códigos BCP-47 tratados como RTL para padrões de placeholder de ênfase (mesclado com detecção RTL incorporada).

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Opcional. Nomes adicionais de atributos JSX/HTML cujos **valores entre aspas** não devem ser enviados ao tradutor. Mesclados com os padrões integrados (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, a maioria dos `aria-*`, etc.). Não diferencia maiúsculas de minúsculas. Aplica-se a:

- Extração por análise e substituição `.astro` (etiquetas HTML estáticas e literais de string após `attr=` dentro de blocos `{expression}`).
  - Extração de espaços reservados MDX durante a tradução de segmentos markdown/Astro (`label`, `tooltip` e `aria-label` em tags JSX com letras maiúsculas, além de `TabItem` `value` quando aplicável).

Exemplo: `"protectAttributes": ["variant", "size"]` mantém `variant="primary"` dentro de `{items.map(...)}` inalterado entre os idiomas.

Você também pode listar atributos normalmente traduzíveis (por exemplo, `"title"` ou `"aria-label"`) quando desejar que esses valores sejam copiados textualmente do inglês.

- `protectKeys`
Opcional. Nomes adicionais de **propriedades de objeto** cujos valores em string entre aspas não devem ser traduzidos dentro de blocos modelo `{expression}` e literais de objeto MDX (por exemplo, `label:` dentro de `<Tabs values={[ … ]}>`). Mesclado com os padrões integrados (`class`, `key`, `id`, `href`, `src`, etc.). Não diferencia maiúsculas de minúsculas.

Exemplo: `"protectKeys": ["slug", "code"]` ignora `{ slug: 'getting-started', title: 'Getting started' }` → apenas `title` é traduzido quando `slug` está protegido.

<br/>

**Exemplo (`docsOutput.style = "flat"` — caminhos de capturas de tela + invólucro opcional com lista de idiomas):**

<details>
<summary>Exemplo de pós-processamento com layout plano (capturas de tela + bloco languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Matriz de nível superior de pipelines de tradução JSON aninhados. Usado apenas quando `features.translateJson` é verdadeiro (`translate-json` ou a etapa JSON de `sync`). Consulte [JSON](/guide/json).

| Campo | Descrição |
|-------|-------------|
| `description` | Nota opcional para CLI / `status` (não traduzida). |
| `contentPaths` | Arquivos, diretórios ou globs de origem `.json` sob a raiz do projeto. |
| `outputPathTemplate` | Caminho de saída obrigatório por localidade de destino. Substituições: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Subconjunto opcional para este bloco; caso contrário, usa a raiz `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist` ou `both`. |
| `keyPolicy.translateKeys` | Caminhos com ponto / padrões glob a incluir quando o modo for `allowlist` ou `both`. |
| `keyPolicy.skipKeys` | Caminhos com ponto / padrões glob a excluir (a lista de negação padrão inclui `id`, `slug`, `href`, `url`, `key`, `code`). |

<a id="svg"></a>
### `svg`

Caminhos e estrutura de nível superior para arquivos SVG. A tradução é executada apenas quando `features.translateSVG` é verdadeiro (via `translate-svg` ou o estágio SVG de `sync`).

| Campo            | Descrição                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Um ou mais diretórios **ou padrões glob** (por exemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Os padrões são resolvidos em relação à raiz do projeto e escaneados recursivamente em busca de arquivos `.svg`.                                                                         |
| `outputDir`                   | Diretório raiz para a saída de SVG traduzido.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` ou `"nested"` quando `pathTemplate` não estiver definido.                                                                                                                                                                                                                               |
| `pathTemplate`   | Caminho de saída personalizado para SVG. Substituições: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Quando `true`, os layouts integrados de SVG `flat` / `nested` usam segmentos de idioma em letras minúsculas. Valores personalizados de `pathTemplate` permanecem inalterados; use `{llocale}` para segmentos em minúsculas. |
| `forceLowercase` | Texto traduzido em letras minúsculas na remontagem SVG. Útil para designs que dependem de rótulos totalmente em letras minúsculas.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Campo          | Descrição                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Caminho para `strings.json` - gera automaticamente um glossário a partir das traduções existentes.                                                                                                 |
| `userGlossary` | Caminho para um CSV com colunas `Original language string` (ou `en`), `locale`, `Translation` - uma linha por termo de origem e localidade de destino (`locale` pode ser `*` para todos os destinos). |
| `autoAddUserEditedToGlossary` | Quando `true`, as edições do painel para strings da UI podem ser anexadas automaticamente ao glossário do usuário. |

**Gere um arquivo CSV de glossário vazio:**

```bash
npx ai-i18n-tools glossary-generate
```
