<a id="integrations"></a>
# Integrações

Guias específicos de framework para integrar as ferramentas ai-i18n-tools em sites de documentação e projetos Astro. Cada integração usa o pipeline [Documentos](/guide/documents/) (`translate-docs` / `sync`) para o conteúdo da página; strings de shell (navegação, barra lateral, tema) são tratadas dentro do mesmo pipeline, onde indicado — não através do pipeline [JSON](/guide/json) separado.

<a id="which-guide-to-read"></a>
## Qual guia ler

| Seu site | Modelo de inicialização | Comece aqui |
| --- | --- | --- |
| Astro Starlight ou Astro puro | `ui-starlight` / strings de UI híbridas | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Conceitos compartilhados

Todas as integrações de framework de documentação compartilham o mesmo modelo de bloco `docs[]` descrito em [Documentos](/guide/documents/). Defina `docsOutput.style` para corresponder ao seu framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` ou `"astro-starlight"`). Para o layout da pasta de saída e o comportamento de reescrita de links, consulte [Layouts de saída](/guide/documents/output-layouts) e [Reescrita de links](/guide/documents/link-rewriting).

**Não** coloque strings de shell ou tema do framework em `json[]` — esse pipeline é para pacotes de localidade de aplicativos não relacionados. Cada página de integração explica quais caminhos de catálogo e flags da CLI cobrem rótulos de navegação, barra lateral e tema para aquele framework.

<a id="examples"></a>
## Exemplos executáveis

| Framework | Repositório de exemplo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Site Astro puro | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
