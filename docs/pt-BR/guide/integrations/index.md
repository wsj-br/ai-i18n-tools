<a id="integrations"></a>
# Integrações

Referência das integrações de framework: o que elas compartilham e como suas strings de shell diferem. Para adicionar idiomas a um site, comece em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website). Para um app, comece em [Adicionar i18n a um app JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um app Python](/pt-BR/guide/add-i18n-to-python). Para um README de repositório e outros arquivos Markdown, comece em [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

As integrações de documentação usam o pipeline de [Documentos](/pt-BR/guide/documents/) (`translate-docs` / `sync`) para o conteúdo da página; as strings de shell (navegação, barra lateral, tema) são tratadas dentro desse mesmo pipeline, onde indicado — e não através do pipeline de [JSON](/pt-BR/guide/json) separado. As aplicações Python usam o pipeline de [strings de UI](/pt-BR/guide/ui-strings/python) (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Qual guia ler

A tabela de seleção, com templates de inicialização e prompts de agente por framework, está em [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website#initialise-the-project). Frameworks Python: [Python](/pt-BR/guide/integrations/python).

<a id="shared-concepts"></a>
## Conceitos compartilhados

As integrações de framework de documentação compartilham o mesmo modelo de bloco `docs[]` descrito em [Documents](/pt-BR/guide/documents/). Defina `docsOutput.style` para corresponder ao seu framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` ou `"astro-starlight"`). Para o layout da pasta de saída e o comportamento de reescrita de links, consulte [Output layouts](/pt-BR/guide/documents/output-layouts) e [Link rewriting](/pt-BR/guide/documents/link-rewriting). A configuração do Python é separada: [Python](/pt-BR/guide/integrations/python).

Cada `init -t ui-* -P <provider>` scaffold gera o bloco do provedor LLM desse preset. Antes de `translate-docs` ou `sync`, defina a chave de API correspondente — consulte [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
