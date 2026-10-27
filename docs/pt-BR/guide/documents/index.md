<a id="documents"></a>
# Documentos

Referência para `translate-docs`, o pipeline para páginas em Markdown, MDX, `.astro` e HTML simples listadas nos blocos de configuração `docs[]`. O campo `contentPaths` de cada bloco lista os arquivos ou pastas a serem traduzidos. Esses arquivos são escritos em `sourceLocale`, que pode ser qualquer idioma. O inglês nos exemplos é apenas uma amostra. Adicionando idiomas a um site pela primeira vez? Comece em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website). Um README de repositório e outros arquivos Markdown, geralmente ao lado de um aplicativo: [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme). Páginas HTML simples (um arquivo por localidade) são descritas em [Páginas HTML](/pt-BR/guide/documents/html-pages).

As strings do shell do framework (barra de navegação, barra lateral, tema) são traduzidas na mesma execução, não por um pipeline separado. Os guias do framework na tabela abaixo dizem como cada um faz isso: `docusaurusCatalogDir` para Docusaurus, `docsOutput.vitepressThemeCatalog` para VitePress, `docs[].nextraDictionaryPath` para Nextra, `docsOutput.fumadocsUiCatalog` para Fumadocs. Os rótulos da barra lateral do Nextra `_meta.ts` e do Fumadocs `meta.json` são coletados automaticamente. O Astro Starlight vem com strings de UI integradas para muitas localidades, e substituições (overrides) opcionais podem usar `jsonPathTemplate` em um bloco `docs[]`.

Para PNG e outras imagens raster incorporadas em markdown, consulte [Imagens e Capturas de Tela](/pt-BR/guide/images-and-screenshots/). `translate-docs` traduz apenas o texto alternativo; ele não copia arquivos raster.

Para um bloco opcional de **troca de idioma** no README ou na documentação, defina `docsOutput.style` como `"flat"` - veja [Troca de idioma](/pt-BR/guide/documents/language-switcher).

Arquivos [SVG](/pt-BR/guide/svg-translation/) são traduzidos via [`translate-svg`](/pt-BR/reference/cli-commands/content#translate-svg) quando `features.translateSVG` está habilitado - não através de `docs[]` / `contentPaths`.

Pacotes JSON de UI aninhados arbitrários não relacionados às strings de shell/tema de um framework de documentação pertencem ao pipeline [JSON](/pt-BR/guide/json), não ao `docs[]`.

Cada bloco de UI inclui seu `strings.json` como dicas de glossário para documentação por padrão (`uiGlossary`, padrão `true`). `translate-docs` reutiliza essas traduções como dicas em prompts de LLM quando termos correspondentes aparecem em um segmento. Defina `uiGlossary` como `false` em um catálogo que não deve ser incluído nos prompts de documentos. `glossary.userGlossary` opcional adiciona substituições em CSV para termos do produto (compartilhadas com `translate-ui` e `proofread-ui`). As abreviações compactas de rótulos de UI usadas para caber em colunas estreitas (por exemplo, `Size` → `Tam`) permanecem disponíveis para a tradução da UI, mas são omitidas das dicas do glossário de documentos. Gere um CSV inicial com `glossary-generate`, edite as linhas na aba [Glossário](/pt-BR/guide/translation-dashboard/glossary) do Painel de Tradução ou consulte [Configuração — `glossary`](/pt-BR/reference/configuration#glossary) e [Glossário](/pt-BR/guide/glossary).

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

`translate-docs` e a etapa de docs de `sync` resolvem modelos **por localidade de destino**: primeiro `localeModels(locale)` quando configurado, depois a cadeia `translationModels` global do provedor. Use isso quando um idioma específico precisar de um modelo diferente da sua lista de fallback padrão. Por exemplo, preferir o Gemini para a documentação em `pt-BR` quando a cadeia global tiver dificuldades com o português. Consulte [Modelos de IA](/pt-BR/guide/ai-models#model-fallback-chain) e [Configuração - `localeModels`](/pt-BR/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Qual guia ler

| Sua configuração | Comece aqui |
| --- | --- |
| Site Docusaurus | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/pt-BR/guide/integrations/docusaurus) |
| Site VitePress | `init -t ui-vitepress` + `vitepressThemeCatalog` para tema - [VitePress](/pt-BR/guide/integrations/vitepress) |
| Site Nextra | `init -t ui-nextra` + `nextraDictionaryPath` para dicionário (barra lateral `_meta.ts` é automática) - [Nextra](/pt-BR/guide/integrations/nextra) |
| Site Fumadocs | `init -t ui-fumadocs` + `fumadocsUiCatalog` para UI (barra lateral `meta.json` é automática) - [Fumadocs](/pt-BR/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/pt-BR/guide/integrations/astro#astro-starlight) |
| Páginas HTML puras | `init -t docs-plain-html` - [Páginas HTML](/pt-BR/guide/documents/html-pages) |
| Documentos simples (README, changelogs, etc.) | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) — `init -t docs-markdown` ou `--with-readme`. Layout: [Layouts de saída](/pt-BR/guide/documents/output-layouts), [seletor de idioma](/pt-BR/guide/documents/language-switcher) |
| Onde os arquivos traduzidos são salvos | [Layouts de saída](/pt-BR/guide/documents/output-layouts) |
| Links `#anchor` entre páginas | [Links de âncora](/pt-BR/guide/documents/anchor-links) |
| Reescrita de URL de link e ativo (`regexAdjustments`) | [Reescrita de link](/pt-BR/guide/documents/link-rewriting) |
| Capturas de tela na documentação | [Imagens e Capturas de Tela](/pt-BR/guide/images-and-screenshots/) |
| Terminologia do produto e consistência entre IU e documentação | [Configuração — `glossary`](/pt-BR/reference/configuration#glossary), [Glossário](/pt-BR/guide/glossary) |
| Sinalizadores e cache `translate-docs` | [Opções da CLI](/pt-BR/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Passo 1: Inicializar para documentação

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
```

Para sites de documentação Astro Starlight:

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
```

Para sites de documentação VitePress:

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
```

Defina `docsOutput.vitepressThemeCatalog` para strings de navegação/barra lateral/rodapé - veja [Integração VitePress](/pt-BR/guide/integrations/vitepress).

Para sites de documentação Nextra:

```bash
ai-i18n-tools init -t ui-nextra -P gemini
```

Defina `docs[].nextraDictionaryPath` para strings de dicionário de tema - veja [Integração Nextra](/pt-BR/guide/integrations/nextra). Os rótulos da barra lateral `_meta.ts` são coletados automaticamente.

Para sites de documentação Fumadocs:

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
```

Defina `docsOutput.fumadocsUiCatalog` para substituições de UI - veja [Integração Fumadocs](/pt-BR/guide/integrations/fumadocs). Os rótulos da barra lateral `meta.json` são coletados automaticamente.

Para interface de site Astro simples (sem Starlight):

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
```

Esse template habilita apenas a extração de UI. Para a tradução do HTML da página, defina também `features.translateDocs` e adicione um bloco `docs[]` (consulte [Páginas de site Astro (analisar e substituir)](/pt-BR/guide/ui-strings/astro-website#pages-parse-and-replace)). A configuração [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) mostra ambos os pipelines juntos.

Edite o `ai-i18n-tools.config.json` gerado:

- `provider` e `providers` — `init -P <provider>` gera a estrutura dessa predefinição; defina a chave de API dele antes de `translate-docs` ou `sync` (Ollama não precisa de chave). Consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key), [Provedores de LLM](/pt-BR/guide/providers-and-models) e [Modelos de IA](/pt-BR/guide/ai-models).
- `sourceLocale` - idioma de origem (deve corresponder a `defaultLocale` em `docusaurus.config.js`).
- `targetLocales` - array de códigos de localidade BCP-47 (ex.: `["de", "fr", "es"]`).
- `cacheDir` - diretório de cache SQLite compartilhado para todos os pipelines (e diretório de log padrão para `--write-logs`).
- `docs` - array de blocos de documentação. Cada bloco tem `description` opcional, `contentPaths` (string ou array; arquivo, diretório ou glob), `outputDir`, `docusaurusCatalogDir` opcional, `docsOutput`, `segmentSplitting` opcional, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - nota curta opcional para mantenedores. Quando definida, ela aparece no título `translate-docs` e nos cabeçalhos de seção `status`.
- `docs[].contentPaths` - fontes markdown/MDX/`.astro` (e `docusaurusCatalogDir` opcional para JSON de shell Docusaurus).
- `docs[].outputDir` - raiz de saída traduzida para esse bloco.
- `docs[].docsOutput.style` - `"nested"` (padrão), `"flat"`, `"doc-system"` ou aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (consulte [Layouts de saída](/pt-BR/guide/documents/output-layouts)).
- `ui[].uiGlossary` - quando `true` (o padrão), o `strings.json` desse bloco fornece dicas de terminologia para segmentos de documentos (consulte [Configuração — `ui`](/pt-BR/reference/configuration#ui)).
- `glossary.userGlossary` - CSV opcional para traduções fixas de termos do produto; também utilizado por pipelines de UI e editável na aba [Glossário](/pt-BR/guide/translation-dashboard/glossary) do painel.

**Primário vs complementar:** Foque em `contentPaths` para páginas localizadas. Defina `docusaurusCatalogDir` quando também precisar do JSON do shell Docusaurus de `write-translations`. Omita `docusaurusCatalogDir` se estiver traduzindo apenas páginas.

<a id="step-2-translate-documents"></a>
## Passo 2: Traduzir documentos

```bash
ai-i18n-tools translate-docs
```

Isso traduz todos os arquivos em cada `docs[]` do bloco `contentPaths` (e o JSON do catálogo Docusaurus quando `docusaurusCatalogDir` é definido) para todos os locais de documentação efetivos. Segmentos já traduzidos são servidos do cache SQLite - apenas segmentos novos ou alterados são enviados para o LLM.

Para traduzir um único idioma:

```bash
ai-i18n-tools translate-docs --locale de
```

Para verificar o que precisa ser traduzido:

```bash
ai-i18n-tools status
```

Para sinalizadores, comportamento de cache e formato de prompt em lote, consulte [opções da CLI](/pt-BR/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Markdown complexo e falhas nas verificações de qualidade

`translate-docs` verifica se cada segmento traduzido preserva a estrutura Markdown (incluindo a ênfase analisada do documento) e se os tokens de espaço reservado internos são restaurados de forma limpa. Parágrafos que empilham muitos spans `bold` em torno de `` `inline code` ``, aninham crases dentro de negrito (por exemplo, literais de modelo como `` `fetch(\`/locales/${code}.json\`)` ``), ou entrelaçam negrito e código em uma frase longa são frágeis: alguns locais precisam de uma ordem de palavras diferente, o que pode mudar como `**` e `` ` `` se alinham após a tradução e acionar erros de CLI como `AST mismatch`.

Após a restauração, o `translate-docs` também rejeita segmentos onde os placeholders de tags HTML foram reutilizados ou descartados (de modo que as tags restauradas não correspondem mais ao mapa de origem) ou onde o modelo inventou tokens de chaves duplas restantes que não estavam na origem (por exemplo, um token de estilo de glossário inventado). As verificações pré-restauração exigem o mesmo multiconjunto de tokens <code v-pre>{{…}}</code> e a mesma subsequência ordenada de tokens estruturais (<code v-pre>{{HTM_N}}</code>, marcadores de advertência); tokens de conteúdo como <code v-pre>{{ILC_N}}</code>, <code v-pre>{{URL_N}}</code> e marcadores de ênfase como <code v-pre>{{SE}}</code> podem se mover com a ordem natural das palavras quando cada ID/contagem de tipo ainda corresponde. Essas falhas usam o mesmo caminho de fallback do modelo que os tokens internos oficiais restantes.

**Se você encontrar esse tipo de falha de validação, prefira simplificar o texto no idioma de origem** - divida o parágrafo, mova um exemplo para um bloco de código cercado ou descreva a mesma ideia com menos pares de negrito/código em camadas - em vez de esperar que cada modelo e local reproduza a marcação densa em linha perfeitamente.

Quando todos os modelos configurados falharem com um `AST mismatch` no mesmo segmento, o `translate-docs` pode dividir automaticamente esse segmento em partes menores (primeiro o ponto médio da lista, depois itens individuais da lista ou trechos menores de parágrafo), tentar novamente cada parte a partir do primeiro modelo e reunir o resultado sob a chave original do cache do segmento. Isso está ativado por padrão (`segmentSplitting.qualityRetrySplit`); defina como `false` para interromper após esgotar os modelos. O resumo da execução relata `Quality split retries` quando esse recurso de contingência é acionado.

Para ver **quais segmentos falharam**, com que frequência e as **mensagens de qualidade/erro** armazenadas, use a guia **Falhas** do Painel de Tradução ([Painel de Tradução → Falhas](/pt-BR/guide/translation-dashboard/failures#failures-document-translation)).
