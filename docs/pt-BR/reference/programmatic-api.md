<a id="programmatic-api"></a>
# API Programática

Todos os tipos e classes públicos são exportados da raiz do pacote. Exemplo: executar a etapa translate-UI no Node.js sem a CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Exportações principais (comumente usadas — consulte `src/index.ts` para a superfície pública completa):

| Exportação | Descrição |
|---|---|
| `loadI18nConfigFromFile` | Carrega, mescla e valida a configuração a partir de um arquivo JSON. |
| `parseI18nConfig` | Valida um objeto de configuração bruto. |
| `TranslationCache` | Cache SQLite - instanciar com um caminho `cacheDir`. |
| `UIStringExtractor` | Extrair strings `t("…")` do código-fonte JS/TS. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Escaneia / insere marcadores `data-i18n*` em HTML (alimenta `extract` para `.html` e o comando `mark-html`). |
| `MarkdownExtractor` | Extrair segmentos traduzíveis do markdown. |
| `JsonExtractor` | Extrair de arquivos de rótulo JSON do Docusaurus (catálogos de interface, não corpo MDX). |
| `SvgExtractor` | Extrair de arquivos SVG. |
| `LlmClient` | Faz solicitações de tradução para o provedor LLM ativo (`OpenRouterClient` é um alias obsoleto). |
| `PlaceholderHandler` | Protege/restaura a sintaxe markdown ao redor da tradução (tags HTML, advertências, âncoras, comentários MDX/JSX/chaves, URLs, código embutido, ênfase). |
| `protectMdx` / `restoreMdx` | Protege/restaura comentários MDX, tags JSX, expressões entre chaves e atributos de string JSX (chamado por `PlaceholderHandler`; também exportado para uso direto). |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes com tamanho adequado para LLMs. |
| `validateTranslation` | Verificações estruturais após a tradução (**assíncronas** — devem ser aguardadas). |
| `resolveDocumentationOutputPath` | Resolver o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carregar e aplicar glossários de tradução. |
| `runTranslateUI` | Ponto de entrada programático para a interface de tradução. |
| `PROVIDER_PRESETS` | Mapa predefinido de provedor integrado (`baseUrl`, `apiKeyEnv`). |
