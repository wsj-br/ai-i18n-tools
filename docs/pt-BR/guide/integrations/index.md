<a id="integrations"></a>
# Integrações

Guias específicos de framework para integrar as ferramentas ai-i18n-tools em sites de documentação e projetos Astro. Cada integração usa o pipeline [Documentos](/pt-BR/guide/documents/) (`translate-docs` / `sync`) para o conteúdo da página; strings de shell (navegação, barra lateral, tema) são tratadas dentro do mesmo pipeline, onde indicado — não através do pipeline [JSON](/pt-BR/guide/json) separado.

<a id="which-guide-to-read"></a>
## Qual guia ler

| Seu site | Modelo de inicialização | Comece aqui |
| --- | --- | --- |
| Astro Starlight ou Astro puro | `ui-starlight` / strings de UI híbridas | [Astro](/pt-BR/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/pt-BR/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/pt-BR/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/pt-BR/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/pt-BR/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Conceitos compartilhados

Todas as integrações de framework de documentação compartilham o mesmo modelo de bloco `docs[]` descrito em [Documentos](/pt-BR/guide/documents/). Defina `docsOutput.style` para corresponder ao seu framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` ou `"astro-starlight"`). Para o layout da pasta de saída e o comportamento de reescrita de links, consulte [Layouts de saída](/pt-BR/guide/documents/output-layouts) e [Reescrita de links](/pt-BR/guide/documents/link-rewriting).

Cada modelo `init -t ui-*` estrutura um bloco de provedor LLM padrão (`openrouter`, a menos que você passe `-P <provider>`). Antes de `translate-docs` ou `sync`, configure `provider` / `providers`, se necessário, e defina a chave de API correspondente — consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).

Consulte [Tradução do shell do framework](#framework-shell-translation) para uma comparação entre frameworks. Cada guia vinculada abaixo aborda a configuração para esse framework.

<a id="framework-shell-translation"></a>
## Tradução do shell do framework

| Framework | Strings do shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de tema/navegação/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Rótulos da barra lateral `_meta.ts` | Documentos — automático quando `style: "nextra"` + `translate-docs` |
| Nextra | Dicionário de tema `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Rótulos da barra lateral `meta.json` | Documentos — automático quando `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catálogo de substituições de UI | Documentos — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Strings de UI integradas (muitas localidades); sem pipeline de shell adicional | Documentos — `translate-docs` (somente páginas) |

**Não** coloque strings de shell/tema do framework em `json[]` — esse pipeline é para pacotes de localização de aplicativos não relacionados. Os detalhes de configuração por framework estão nos guias vinculados em [Qual guia ler](#which-guide-to-read).

<a id="runnable-examples"></a>
## Exemplos executáveis

| Framework | Repositório de exemplo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Site Astro puro | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
