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

A interface do painel usa a mesma resolução de localidade que a CLI: `-L` / `--ui-lang` → `AI_I18N_LANG` → configuração `uiLanguage` → localidade do SO. Consulte [Idioma da interface da ferramenta](/guide/tool-ui-language).

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

**Documentação (cache SQLite)** — Edições manuais são marcadas com o modelo `user-edited` no cache. Reexecutar `translate-docs` ou `sync` em uma fonte inalterada reutiliza a tradução em cache (sem chamada LLM). Execute `sync --force-update` ou `translate-docs --force-update` para atualizar o markdown em disco a partir do cache. Use `--force` somente se quiser ignorar o cache e re-traduzir do LLM (sobrescrevendo correções manuais).

**Strings da UI (`strings.json`)** — Edições manuais são marcadas com `user-edited` em `models[locale]`. Reexecutar `translate-ui` ou `sync` ignora entradas que já possuem uma tradução. Use `--force` nos comandos da UI para re-traduzir e sobrescrever correções manuais.

<a id="tips"></a>
## Dicas

- **Botões de link de log** (🔗 nas linhas da tabela) imprimem dicas de arquivo:linha no **terminal** onde `ai-i18n-tools dashboard` está sendo executado — útil para pular do navegador para o seu editor. Se você estiver usando um IDE derivado do VS Code (como Cursor, Antigravity, ...), você pode clicar com o `CTRL` no link arquivo:linha na janela do Terminal para abrir o arquivo na linha indicada.
- **Fechar** (canto superior direito da barra de abas) desliga o servidor do painel de forma graciosa.
- Se o servidor parar enquanto a aba do navegador ainda estiver aberta, uma sobreposição aparecerá. Reinicie `ai-i18n-tools dashboard` para reconectar, ou feche a janela se você terminou com o painel.
