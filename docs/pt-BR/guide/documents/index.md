<a id="documents"></a>
# Documentos

Projetado principalmente para **documentação em markdown, MDX e `.astro`** gerenciada por meio de blocos de configuração `docs[]`. O campo `contentPaths` de cada bloco lista os arquivos ou pastas a serem traduzidos.

Em sites Docusaurus, defina também `docusaurusCatalogDir` para sua pasta de catálogo `write-translations` (por exemplo, `docs-site/i18n/en`). Então `translate-docs` inclui JSON de shell também — navbar, rodapé e strings de tema.

Em sites [VitePress](/guide/vitepress-integration), os corpos das páginas usam o mesmo pipeline `docs[]`. Os rótulos de navegação, barra lateral e rodapé ficam em `docsOutput.vitepressThemeCatalog` — `translate-docs` inicializa o catálogo em inglês e o traduz junto com as páginas, sem um pipeline separado.

Em sites [Nextra](/guide/nextra-integration), os corpos das páginas usam o mesmo pipeline `docs[]` com `docsOutput.style: "nextra"`. Os rótulos da barra lateral `_meta.ts` são coletados e traduzidos automaticamente por `translate-docs`; as strings do dicionário do tema são traduzidas via `docs[].nextraDictionaryPath` no mesmo pipeline.

Nos sites [Fumadocs](/guide/fumadocs-integration), os corpos das páginas usam `docsOutput.style: "fumadocs"` com `fumadocsParser` `"dot"` (padrão) ou `"dir"`. Os rótulos da barra lateral `meta.json` são coletados automaticamente; as substituições da UI são traduzidas via `docsOutput.fumadocsUiCatalog`.

Para PNG e outras imagens raster incorporadas em markdown, consulte [Imagens e Capturas de Tela](/guide/images-and-screenshots/). `translate-docs` traduz apenas o texto alternativo; ele não copia arquivos raster.

Para um bloco opcional de **troca de idioma** no README ou na documentação, defina `docsOutput.style` como `"flat"` — consulte [Troca de idioma](/guide/documents/language-switcher).

Arquivos SVG são traduzidos via [`translate-svg`](/reference/cli-commands) quando `features.translateSVG` está habilitado — não através de `docs[]` / `contentPaths`.

Pacotes JSON de UI aninhados arbitrários não relacionados às strings de shell/tema de um framework de documentação pertencem ao pipeline [JSON](/guide/json), não ao `docs[]`.

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

O `translate-docs` e a etapa de documentação do `sync` resolvem modelos **por localidade de destino**: `localeModels(locale)` primeiro quando configurado, seguido pela cadeia global `translationModels` do provedor. Use isso quando um idioma específico exigir um modelo diferente da sua lista de fallback padrão — por exemplo, preferindo o Gemini para a documentação em `pt-BR` quando a cadeia global tiver dificuldades com o português. Consulte [Provedores e modelos](/guide/providers-and-models#model-fallback-chain) e [Configuração — `localeModels`](/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Qual guia ler

| Sua configuração | Comece aqui |
| --- | --- |
| Site Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` — [Passo 1](#step-1-initialise-for-documentation) |
| Site VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` para tema — [Integração VitePress](/guide/vitepress-integration) |
| Site Nextra | `init -t ui-nextra` + `nextraDictionaryPath` para dicionário (barra lateral `_meta.ts` é automática) — [Integração Nextra](/guide/nextra-integration) |
| Site Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` para UI (a `meta.json` da barra lateral é automática) — [Integração Fumadocs](/guide/fumadocs-integration) |
| Astro Starlight | `init -t ui-starlight` — [Passo 1](#step-1-initialise-for-documentation) |
| Documentos simples (README, changelogs, etc.) | `docsOutput.style = "flat"` — [Layouts de saída](/guide/documents/output-layouts), [seletor de idioma](/guide/documents/language-switcher) opcional |
| Onde os arquivos traduzidos são salvos | [Layouts de saída](/guide/documents/output-layouts) |
| Links `#anchor` entre páginas | [Links de âncora](/guide/documents/anchor-links) |
| Reescrita de URL de link e ativo (`regexAdjustments`) | [Reescrita de link](/guide/documents/link-rewriting) |
| Capturas de tela na documentação | [Imagens e Capturas de Tela](/guide/images-and-screenshots/) |
| Sinalizadores e cache `translate-docs` | [Opções da CLI](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Passo 1: Inicializar para documentação

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Para sites de documentação Astro Starlight:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Para sites de documentação VitePress:

```bash
npx ai-i18n-tools init -t ui-vitepress
```

Defina `docsOutput.vitepressThemeCatalog` para strings de navegação/barra lateral/rodapé — veja [Integração VitePress](/guide/vitepress-integration).

Para interface de site Astro simples (sem Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Esse modelo habilita apenas a extração da UI. Para a tradução de HTML de página, defina também `features.translateDocs` e adicione um bloco `docs[]` (consulte [Páginas do site Astro (analisar e substituir)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). A configuração [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) mostra ambos os pipelines juntos.

Edite o `ai-i18n-tools.config.json` gerado:

- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - array de códigos de localidade BCP-47 (por exemplo, `["de", "fr", "es"]`).
- `cacheDir` - diretório compartilhado de cache SQLite para todos os pipelines (e diretório padrão de logs para `--write-logs`).
- `docs` - array de blocos de documentação. Cada bloco tem `description`, `contentPaths` (string ou array; arquivo, diretório ou glob), `outputDir`, `docusaurusCatalogDir` opcional, `docsOutput`, `segmentSplitting` opcional, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - nota curta opcional para mantenedores. Quando definida, aparece no título `translate-docs` e nos cabeçalhos da seção `status`.
- `docs[].contentPaths` - fontes markdown/MDX/`.astro` (e `docusaurusCatalogDir` opcional para JSON de shell Docusaurus).
- `docs[].outputDir` - raiz de saída traduzida para esse bloco.
- `docs[].docsOutput.style` - `"nested"` (padrão), `"flat"`, `"doc-system"` ou aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (consulte [Layouts de saída](/guide/documents/output-layouts)).

**Primário vs complementar:** Foque em `contentPaths` para páginas localizadas. Defina `docusaurusCatalogDir` quando também precisar do JSON do shell Docusaurus de `write-translations`. Omita `docusaurusCatalogDir` se estiver traduzindo apenas páginas.

<a id="step-2-translate-documents"></a>
## Passo 2: Traduzir documentos

```bash
npx ai-i18n-tools translate-docs
```

Isso traduz todos os arquivos em cada `docs[]` do bloco `contentPaths` (e o JSON do catálogo Docusaurus quando `docusaurusCatalogDir` está definido) para todos os locais de documentação efetivos. Segmentos já traduzidos são servidos do cache SQLite — apenas segmentos novos ou alterados são enviados para o LLM.

Para traduzir um único idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para verificar o que precisa ser traduzido:

```bash
npx ai-i18n-tools status
```

Para sinalizadores, comportamento de cache e formato de prompt em lote, consulte [opções da CLI](/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Markdown complexo e falhas nas verificações de qualidade

`translate-docs` verifica se cada segmento traduzido preserva a estrutura do markdown (incluindo ênfases analisadas a partir do documento). Parágrafos que acumulam muitos spans `bold` em torno de `` `inline code` ``, aninham crases dentro de negrito (por exemplo, literais de modelo como `` `fetch(\`/locales/${code}.json\`)` ``), ou entrelaçam negrito e código em uma única frase longa são frágeis: alguns idiomas exigem ordem de palavras diferente, o que pode alterar como `**` e `` ` `` se alinham após a tradução e acionar erros na CLI como `AST mismatch`.

**Se você encontrar esse tipo de falha de validação, prefira simplificar o texto do idioma de origem** — divida o parágrafo, mova um exemplo para um bloco de código cercado ou descreva a mesma ideia com menos pares aninhados de negrito/código — em vez de esperar que cada modelo e local reproduza a marcação inline densa perfeitamente.

Quando todos os modelos configurados falharem com um `AST mismatch` no mesmo segmento, o `translate-docs` pode dividir automaticamente esse segmento em partes menores (primeiro o ponto médio da lista, depois itens individuais da lista ou trechos menores de parágrafo), tentar novamente cada parte a partir do primeiro modelo e reunir o resultado sob a chave original do cache do segmento. Isso está ativado por padrão (`segmentSplitting.qualityRetrySplit`); defina como `false` para interromper após esgotar os modelos. O resumo da execução relata `Quality split retries` quando esse recurso de contingência é acionado.

Para ver **quais segmentos falharam**, com que frequência e as **mensagens de qualidade/erro** armazenadas, use a guia **Falhas** do Painel de Tradução ([Painel de Tradução → Falhas](/guide/translation-dashboard/failures#failures-document-translation)).
