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

Gerar uma configuração a partir do Node.js. O quarto argumento é o preset integrado (`cwd` é o terceiro):

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'cheaperinference');
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
| `HtmlTemplateExtractor` | Extrair e remontar documentos HTML simples (texto e atributos traduzíveis; `src` / `href` permanecem no lugar). |
| `JsonExtractor` | Extrair de arquivos de rótulo JSON do Docusaurus (catálogos de interface, não corpo MDX). |
| `SvgExtractor` | Extrair de arquivos SVG. |
| `LlmClient` | Faz solicitações de tradução para o provedor LLM ativo (`OpenRouterClient` é um alias obsoleto). |
| `rankProviderModels` / `resolveSuggestionWeights` | Classifica o catálogo de chat do provedor de nível um com o perfil de qualidade ou preço usado por `suggest-models`. Não imprime nem grava a configuração. |
| `PlaceholderHandler` | Protege/restaura a sintaxe markdown ao redor da tradução (tags HTML, advertências, âncoras, comentários MDX/JSX/chaves, URLs, código embutido, ênfase). |
| `protectMdx` / `restoreMdx` | Protege/restaura comentários MDX, tags JSX, expressões entre chaves e atributos de string JSX (chamado por `PlaceholderHandler`; também exportado para uso direto). |
| `splitTranslatableIntoBatches` | Agrupar segmentos em lotes com tamanho adequado para LLMs. |
| `validateTranslation` | Verificações estruturais após a tradução (**assíncronas** — devem ser aguardadas). |
| `resolveDocumentationOutputPath` | Resolver o caminho do arquivo de saída para um documento traduzido. |
| `Glossary` / `GlossaryMatcher` | Carrega e aplica glossários de tradução, incluindo notas opcionais de `Context` de termos. |
| `loadTranslationContext` / `computeGuidanceFingerprint` | Carrega `glossary.contextFiles` e orientação de impressão digital para invalidação de cache. |
| `runTranslateUI` | Ponto de entrada programático para a interface de tradução. |
| `writeInitConfigFile` | Escreve um JSON de configuração inicial (`template`, `cwd` e um `providerKey` obrigatório). |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `translationModels` inicial por preset integrado usado por `init -P`. |
| `PROVIDER_PRESETS` | Mapa predefinido de provedor integrado (`baseUrl`, `apiKeyEnv`). |

<a id="python-runtime"></a>
## Runtime do Python (`i18n.py`)

`init -t ui-python`, `ui-python-gettext` e `ui-python-flask` gravam este módulo no projeto quando `i18n.py` está ausente. É um auxiliar da biblioteca padrão para Python 3.10 ou superior. Importe-o a partir desse arquivo. As funções abaixo são separadas das exportações do Node na tabela acima. Projetos Django mantêm o gettext do Django, portanto `ui-python-django` não grava `i18n.py`.

Formatos de chamada, f-strings inseguras e configuração de localidade por framework: [Aplicações Python](/pt-BR/guide/ui-strings/python).

| Função | Comportamento |
| --- | --- |
| `set_locale(locale)` | Define a localidade atual. Sublinhados no código são armazenados como hifens (`pt_BR` torna-se `pt-BR`). Retorna um token `ContextVar`. |
| `reset_locale(token)` | Restaura a localidade a partir desse token. Chame-a em `finally`, incluindo middleware de FastAPI e Flask. |
| `get_locale()` | Retorna a localidade atual. |
| `set_backend(backend)` | Seleciona `"auto"`, `"json"` ou `"gettext"`. |
| `get_ui_languages()` | Lê `ui-languages.json` próximo ao diretório JSON simples, ou o diretório gettext quando a saída simples está desativada. |
| `get_direction(locale=None)` | Retorna `"rtl"` ou `"ltr"` da linha do manifesto para essa localidade (localidade atual quando omitido). |
| `_(message)` | Procura um literal e, em seguida, retorna a string do catálogo ou a própria mensagem. |
| `t(template, *, plurals=False, count=None, **values)` | Procura o literal e, em seguida, interpola. `translate` é a mesma função. No Python 3.14, `translate(t"Hello, {name}!")` mantém o modelo e seus valores. Argumentos nomeados substituem valores obtidos de uma string de modelo. |
| `ngettext(singular, plural, n, **values)` | Procura plural e, em seguida, interpola. `count` está disponível para a string de formato. |
| `pgettext(context, message, **values)` | Procura contexto (`msgctxt`, ou `context` + U+0004 + a fonte em inglês em JSON simples) e, em seguida, interpola. |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Caixa de seleção do Streamlit. Grava `st.session_state.locale` e `st.query_params["lang"]`, chama `set_locale` e retorna o código escolhido. |
