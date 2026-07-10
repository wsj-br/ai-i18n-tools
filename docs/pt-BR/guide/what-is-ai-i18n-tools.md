<a id="what-is-ai-i18n-tools"></a>
# O que é ai-i18n-tools?

ai-i18n-tools é uma ferramenta de linha de comando e um kit de ferramentas que ajuda você a traduzir seu aplicativo e documentação usando seu provedor LLM preferido. Você controla tudo a partir de um único arquivo de configuração, escolhendo quais recursos de tradução habilitar. Use o comando "sync" para executar os modos que você precisa de uma só vez.

<a id="translation-modes"></a>
## Modos de tradução

- **Strings da UI** — Extraia chamadas `t("…")` (e marcadores semelhantes) do código-fonte JS/TS e escreva arquivos JSON planos por localidade para i18next ou pesquisa estática. Comandos: `extract`, `translate-ui`. Guia: [Strings da UI](/pt-BR/guide/ui-strings/).
- **Documentos** — Traduza páginas Markdown, MDX e `.astro` listadas em `docs[].contentPaths`. Funciona com VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro e outros sites de documentação estática. Comando: `translate-docs`. Guia: [Documentos](/pt-BR/guide/documents/).
- **JSON** — Traduza pacotes de localidade JSON aninhados (rótulos de tema, substituições de i18n, cópia de aplicativo não no código-fonte) definidos no `json[]` de nível superior. Comando: `translate-json`. Guia: [JSON](/pt-BR/guide/json).
- **SVG** — Traduza o texto visível dentro das ilustrações SVG (`<text>`, `<title>`, `<desc>`) e escreva um arquivo de saída por localidade. Separado da tradução de documentos — `translate-docs` não modifica os ativos SVG. Comando: `translate-svg`. Guia: [Tradução de SVG](/pt-BR/guide/svg-translation/).

Todos os quatro modos usam o [provedor LLM](/pt-BR/guide/providers-and-models) ativo, compartilham o mesmo arquivo de configuração e reutilizam um cache SQLite para que as novas execuções enviem apenas texto novo ou alterado para o modelo.

<a id="which-should-i-use"></a>
## Qual devo usar?

| Seu conteúdo | Modo | Comando |
| --- | --- | --- |
| O código-fonte usa `t()` ou marcadores HTML `data-i18n` | Strings de UI | `extract` / `translate-ui` |
| Páginas localizadas ou sites de documentação | Documentos | `translate-docs` |
| Arquivos de localidade JSON aninhados autônomos | JSON | `translate-json` |
| Diagramas ou ilustrações com rótulos em SVG | SVG | `translate-svg` |

Muitos projetos combinam modos — por exemplo, strings de UI mais documentos para um site VitePress, ou documentos mais SVG para guias ilustrados. Consulte [Início rápido](/pt-BR/guide/quick-start) para modelos de scaffold e [Configuração](/pt-BR/reference/configuration) para o esquema de configuração completo.

<a id="examples"></a>
## Exemplos

O repositório contém projetos de exemplo executáveis em `examples/` — cada um com sua própria configuração, saídas de localidade confirmadas e README. Você pode explorar arquivos traduzidos sem uma chave de API; a reexecução da tradução requer uma chave de provedor (consulte [Provedores e modelos](/pt-BR/guide/providers-and-models)).

| Exemplo | O que ele mostra |
| --- | --- |
| [console-app](/pt-BR/examples#console-app) | Aplicativo de ponta a ponta menor: strings de UI `t()` mais tradução de README |
| [nextjs-app](/pt-BR/examples#nextjs-app) | UI do Next.js, plurais, SVG, site de documentos Docusaurus, painel |
| [astro-website](/pt-BR/examples#astro-website) | Site de marketing Astro: tradução de página inteira HTML mais strings `t()` |
| [astro-docs](/pt-BR/examples#astro-docs) | Site de documentação Astro Starlight |
| [vitepress-docs](/pt-BR/examples#vitepress-docs) | Documentos VitePress mais catálogo de temas |
| [nextra-docs](/pt-BR/examples#nextra-docs) | Documentos Nextra mais rótulos da barra lateral `_meta.ts` e dicionário de temas |
| [fumadocs-docs](/pt-BR/examples#fumadocs-docs) | Documentos Fumadocs mais rótulos da barra lateral `meta.json` e catálogo da UI |
| [multi-provider](/pt-BR/examples#multi-provider) | Compare provedores LLM no mesmo documento |
| [test-markdown](/pt-BR/examples#test-markdown) | Testes de estresse de pipeline Markdown (CJK, Devanagari, casos extremos) |

Consulte [Exemplos](/pt-BR/examples) para comandos de cópia `npx degit` e um guia de escolha.

<a id="next-steps"></a>
## Próximas etapas

1. [Instalação](/pt-BR/guide/installation) — instale o pacote e defina sua chave de API do provedor.
2. [Início rápido](/pt-BR/guide/quick-start) — crie uma configuração e execute sua primeira tradução.
3. [Provedores e modelos](/pt-BR/guide/providers-and-models) — escolha um provedor, cadeia de fallback de modelo e substituição `-P`.
