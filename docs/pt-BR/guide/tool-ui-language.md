<a id="tool-ui-language"></a>
# Idioma da IU da ferramenta

A ferramenta localiza sua própria interface de usuário — texto de ajuda da CLI, mensagens de log/resumo/erro de alto tráfego e o Painel de Tradução — independentemente do `sourceLocale` / `targetLocales` do seu projeto. Nenhuma configuração é necessária: por padrão, a ferramenta segue a localidade do seu sistema operacional.

<a id="locale-resolution"></a>
## Resolução de localidade

A localidade da IU é resolvida a partir destas fontes, da mais alta prioridade para a mais baixa:

1. Flag global `-L` / `--ui-lang <code>` (ex: `-L pt-BR`).
2. Variável de ambiente `AI_I18N_LANG` (ex: `export AI_I18N_LANG=es`).
3. A chave de configuração `uiLanguage` em `ai-i18n-tools.config.json` (string BCP-47).
4. O local do sistema operacional do host (via `Intl.DateTimeFormat().resolvedOptions().locale`).

<a id="matching-and-fallback"></a>
## Correspondência e fallback

A localidade solicitada é comparada exatamente com os idiomas de interface do usuário fornecidos ou por variação mais próxima (por exemplo, `pt-PT` resolve para `pt-BR`, e `en-US` resolve para `en-GB`); quando nada corresponde, ele volta para a localidade de origem (`en-GB`). Quando um idioma de interface do usuário é solicitado explicitamente (via sinalizador, variável de ambiente ou `uiLanguage`) mas nenhum pacote fornecido corresponde, a CLI exibe um aviso único de que a localidade padrão será usada; uma localidade inferida apenas do sistema operacional do host nunca gera aviso.

<a id="shipped-ui-languages"></a>
## Idiomas de IU enviados

`en-GB` (fonte) mais `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` e `zh-Hant`.

<a id="translation-dashboard"></a>
## Painel de Tradução

O Painel de Tradução lê a localidade resolvida, a direção do layout e o pacote de tradução de `GET /api/ui-i18n` e os aplica no carregamento (ele define `<html lang>` / `dir` e localiza a marcação estática via atributos `data-i18n*`).

<a id="related"></a>
## Relacionado

- [`AI_I18N_LANG`](/reference/environment-variables) — substituição de variável de ambiente
- [`uiLanguage`](/reference/configuration#uilanguage-optional) — substituição de chave de configuração
- [`-L` / `--ui-lang`](/reference/cli-commands/) — substituição de flag da CLI (prioridade mais alta)
