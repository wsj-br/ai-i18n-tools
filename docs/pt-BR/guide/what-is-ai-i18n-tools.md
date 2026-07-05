<a id="what-is-ai-i18n-tools"></a>
# O que é ai-i18n-tools?

O pacote `ai-i18n-tools` oferece três superfícies de tradução:

- **Strings da UI**: extraia chamadas `t("…")` de qualquer fonte JS/TS, traduza-as através do [provedor LLM](/guide/providers-and-models) ativo e grave arquivos JSON planos por localidade prontos para i18next.
- **Documentos**: traduza **páginas markdown, MDX e `.astro`** listadas em `docs[].contentPaths` via `translate-docs`, com cache inteligente. O **JSON de catálogo do Docusaurus** opcional (`docs[].docusaurusCatalogDir`, de `docusaurus write-translations`) é traduzido no mesmo comando quando `features.translateDocs` está habilitado — chrome do site (barra de navegação, rodapé, strings de tema), não prosa em `docs/`. Os corpos das páginas do **VitePress** usam o mesmo pipeline `docs[]`; os rótulos de navegação/barra lateral/rodapé usam JSON (`json[]` / `translate-json`) — consulte [integração do VitePress](/guide/vitepress-integration).
- **JSON**: traduza pacotes JSON aninhados arbitrários (por exemplo, `src/i18n/en/translation.json`) via `json[]`, `features.translateJson` e `translate-json` de nível superior — para sites que mantêm cópias da UI em arquivos JSON por localidade em vez de `t()` na fonte.
- **UI da ferramenta (incorporada)** — a ajuda da CLI, os logs e o Painel de Tradução são fornecidos em vários idiomas; isso é separado da tradução das strings da UI ou da documentação **do seu** aplicativo.

Os ativos **SVG** usam `features.translateSVG`, o bloco `svg` de nível superior e `translate-svg` (consulte [referência da CLI](/reference/cli-commands)).

**Qual devo usar?**

- Strings voltadas para o usuário na fonte via `t()` → Strings da UI (`extract` / `translate-ui`).
- Páginas localizadas, JSON de shell do Docusaurus ou markdown do VitePress → Documentos (`translate-docs`).
- JSON de tema do VitePress ou outros arquivos de localidade aninhados autônomos → JSON (`translate-json`).

Todos os três usam o provedor LLM ativo (consulte [Provedores e modelos](/guide/providers-and-models)) e compartilham um único arquivo de configuração.

<a id="next-steps"></a>
## Próximas etapas

1. [Instalação](/guide/installation) — instale o pacote e defina sua chave de API do provedor.
2. [Início rápido](/guide/quick-start) — crie uma configuração e execute sua primeira tradução.
3. [Provedores e modelos](/guide/providers-and-models) — escolha um provedor, cadeia de fallback de modelo e substituição `-P`.
