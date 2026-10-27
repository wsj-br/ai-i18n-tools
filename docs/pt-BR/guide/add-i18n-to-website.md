<a id="add-i18n-to-a-website-or-docs-site"></a>
# Adicionar i18n a um site ou site de documentação

Esta página é para um site de documentação (Markdown ou MDX) ou um site de marketing ou estático (um site Astro ou HTML puro) em um único idioma. A ferramenta traduz o conteúdo da sua página com os modelos do seu provedor de LLM e grava uma cópia localizada por idioma. O framework do seu site serve essas cópias e fornece o seletor de idiomas.

Para um aplicativo cujas strings de UI residem em chamadas `t()`, use [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) em vez disso.

<a id="what-do-you-have"></a>
## O que você tem?

| Seu site | Modelo de inicialização | Comece aqui |
| --- | --- | --- |
| Astro Starlight ou Astro puro | `ui-starlight` / strings de UI híbridas | [Astro](/pt-BR/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/pt-BR/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/pt-BR/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/pt-BR/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/pt-BR/guide/integrations/fumadocs) |
| Páginas HTML simples | `ui-plain-html` ou `docs-plain-html` | [Aplicativos HTML simples](/pt-BR/guide/ui-strings/plain-html) |
| Nenhum framework de site, apenas um README e arquivos Markdown | `docs-markdown`, ou qualquer template mais `--with-readme` | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>Prompts do agente</summary>

- Astro Starlight: apenas observações. Arquivos `t()` do Astro: [prompt de JS/TS](/pt-BR/guide/add-i18n-to-js#agent-prompt) (pule o i18next).
- Docusaurus: apenas observações (`<Translate>` é a própria API do Docusaurus).
- VitePress: [prompt de catálogo de temas](/pt-BR/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off).
- Nextra: [prompt de dicionário](/pt-BR/guide/integrations/nextra#agent-prompt-dictionary) e [prompt `t()` híbrido](/pt-BR/guide/integrations/nextra#optional-t-for-app-react-hybrid).
- Fumadocs: [prompt de catálogo de UI](/pt-BR/guide/integrations/fumadocs#agent-prompt).
- Arquivos README e Markdown: [prompt de README](/pt-BR/guide/add-i18n-to-readme#agent-prompt).

</details>

<a id="steps"></a>
## Etapas

A mesma estrutura funciona para todos os frameworks; os detalhes estão no guia do framework referenciado acima.

1. Instale a CLI e defina a chave de API: [Instalação](/pt-BR/guide/installation), [Provedor e chave de API](/pt-BR/guide/quick-start#provider-and-api-key).
2. Faça o scaffold: `ai-i18n-tools init -t <template> -P <provider>`.
3. Defina `sourceLocale`, `targetLocales` e `docs[].contentPaths` (as páginas e pastas escritas no seu idioma de origem). `sourceLocale` pode ser qualquer idioma. O guia do framework mostra o `docsOutput.style` correto.
4. Habilite o i18n do seu próprio framework para que ele sirva e vincule as páginas localizadas. Cada guia tem uma seção "Habilitar i18n em um site existente": [VitePress](/pt-BR/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [Docusaurus](/pt-BR/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [Nextra](/pt-BR/guide/integrations/nextra#enable-i18n-in-an-existing-site), [Fumadocs](/pt-BR/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [Astro](/pt-BR/guide/integrations/astro#enable-i18n-in-an-existing-site).
5. Execute `ai-i18n-tools sync` (ou `translate-docs`), depois compile o site.
6. Verifique uma rota localizada no navegador. O menu suspenso de localidade do próprio framework é o seletor. Para um arquivo markdown simples, como um README, adicione uma linha de links com [languageListBlock](/pt-BR/guide/documents/language-switcher).

<a id="what-gets-translated"></a>
## O que é traduzido

Os corpos das páginas sempre passam pelo pipeline de [Documentos](/pt-BR/guide/documents/). O chrome do framework (navegação, barra lateral, rótulos de tema) é tratado na mesma execução quando o framework oferece suporte, e não através do pipeline de [JSON](/pt-BR/guide/json) separado.

| Framework | Strings do shell e do tema | Como |
| --- | --- | --- |
| Docusaurus | catálogo `write-translations` (`{ message, description }`) | `docs[].docusaurusCatalogDir` mais `translate-docs` |
| VitePress | Catálogo de tema, navegação e barra lateral | `docsOutput.vitepressThemeCatalog` mais `translate-docs` |
| Nextra | Rótulos da barra lateral `_meta.ts` | Automático com `style: "nextra"` |
| Nextra | Dicionário de tema `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | Rótulos da barra lateral `meta.json` | Automático com `style: "fumadocs"` |
| Fumadocs | Catálogo de substituições da UI | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Strings de UI integradas em várias localidades | Apenas páginas |

Imagens e capturas de tela não são traduzidas por `translate-docs`. Para arquivos específicos da localidade, consulte [Imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/).

<a id="plain-html"></a>
## HTML simples

Duas opções, dependendo de como a página deve se comportar:

- Uma página que alterna o idioma no navegador: marque o texto com atributos `data-i18n*` e use o runtime de strings da UI (`ui-plain-html`). Consulte [Aplicativos HTML simples](/pt-BR/guide/ui-strings/plain-html).
- Um arquivo HTML traduzido por localidade: use o pipeline de documentos (`docs-plain-html`). Consulte [Páginas HTML](/pt-BR/guide/documents/html-pages).

Um arquivo pertence a um caminho.

<a id="not-your-case"></a>
## Não é o seu caso?

- Strings da UI do aplicativo: [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) ou [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python).
- Um README de repositório ao lado do site, ou arquivos Markdown sem um framework de site: [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme). `init … --with-readme` adiciona esse bloco ao lado de um modelo de site.
- JSON de localidade aninhado e independente: [JSON](/pt-BR/guide/json).
- Tradução de strings de um site e de um aplicativo: [Combinação de pipelines](/pt-BR/guide/combining-pipelines).

Referência para as opções compartilhadas e diferenças por framework: [Integrações](/pt-BR/guide/integrations/).
