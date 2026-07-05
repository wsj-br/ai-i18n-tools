<a id="translation-dashboard"></a>
# Painel de Tradução

O Painel de Tradução é uma interface de usuário web local para inspecionar e editar os dados de tradução do seu projeto. Ele lê de três armazenamentos:

- **Cache SQLite** (`cacheDir`) — traduções de segmentos de documentação, registros de falhas, varreduras de problemas de markdown
- **`strings.json`** — catálogo de strings da UI (strings simples e grupos plurais)
- **CSV de glossário do usuário** (`glossary.userGlossary`) — dicas de terminologia para `translate-ui` e `proofread-ui`

Use-o após uma execução de tradução para encontrar problemas, substituir saídas ruins ou revisar a cobertura do cache — sem precisar vasculhar o SQLite ou JSON manualmente.

<a id="start-the-dashboard"></a>
## Iniciar o painel

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

A porta de escuta padrão é **8675**. Se essa porta estiver indisponível, o servidor tenta a próxima porta (até 1000 tentativas) e registra a porta escolhida. O alias obsoleto `editor` ainda funciona, mas exibe um aviso — prefira usar `dashboard`.

A interface do painel usa a mesma resolução de localidade que a CLI: `-L` / `--ui-lang` → `AI_I18N_LANG` → configuração `uiLanguage` → localidade do SO. Consulte [Idioma da UI da ferramenta](/reference/environment-variables#tool-ui-language).

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## Qual aba devo usar?

| Eu quero… | Aba | Guia |
| --- | --- | --- |
| Corrigir segmentos de documentos que falharam na tradução | **Falhas** | [Falhas](/guide/translation-dashboard/failures) |
| Corrigir o markdown de origem antes de traduzir | **Problemas de Markdown** | [Problemas de Markdown](/guide/translation-dashboard/markdown-issues) |
| Substituir uma tradução de documento em cache | **Documentação** | [Cache de documentação](/guide/translation-dashboard/documentation-cache) |
| Corrigir um rótulo da UI | **Strings da UI** | [Strings e plurais da UI](/guide/translation-dashboard/ui-strings) |
| Corrigir uma forma plural (`one`, `other`, …) | **Plurais da UI** | [Strings e plurais da UI](/guide/translation-dashboard/ui-strings) |
| Bloquear terminologia para tradução da UI | **Glossário** | [Glossário](/guide/translation-dashboard/glossary) |
| Ver cobertura de cache e uso do modelo | **Estatísticas** | [Estatísticas](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## Depois de editar

| Você editou… | Então execute… | Evite… |
| --- | --- | --- |
| Linha do cache de documentação | `sync --force-update` ou `translate-docs --force-update` | — |
| String ou plural da UI | `sync` ou `translate-ui` simples | `--force` (sobrescreve `user-edited` linhas) |
| Linha do glossário | próximo `translate-ui` ou `proofread-ui` | — |

Edições manuais são marcadas com o modelo `user-edited` no cache ou `strings.json`. A re-tradução de texto de origem inalterado ignora essas linhas, a menos que você use `--force`.

<a id="tips"></a>
## Dicas

- **Botões de link de log** (🔗 nas linhas da tabela) imprimem dicas de arquivo:linha no **terminal** onde `ai-i18n-tools dashboard` está sendo executado — útil para pular do navegador para o seu editor.
- **Fechar** (canto superior direito da barra de abas) desliga o servidor do painel de forma elegante.
- Se o servidor parar enquanto a aba do navegador ainda estiver aberta, uma sobreposição aparece; reinicie `ai-i18n-tools dashboard` para reconectar.
