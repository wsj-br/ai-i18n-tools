<a id="cli--dashboard--glossary"></a>
# CLI — Painel e glossário

<a id="dashboard"></a>
### `dashboard`

**Sinopse:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Inicie o Painel de Tradução (interface web local para segmentos de cache, `strings.json`, glossário, falhas, estatísticas e uso). Porta padrão **8675** (tenta a próxima porta se indisponível). Com `--no-open`, o navegador padrão não é aberto automaticamente. `dash` é um alias equivalente. O alias obsoleto `editor` ainda funciona, mas exibe um aviso.

**Opções principais:** `-p` / `--port`, `--no-open`

**Ver também:** [Painel de Tradução](/pt-BR/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Sinopse:** `ai-i18n-tools glossary-generate [-o <path>]`

Escreve um modelo `glossary-user.csv` vazio. Recusa-se a sobrescrever um arquivo existente (saída **1**).

**Opções principais:** `-o` / `--output`

`-o`: substitui o caminho de saída (padrão: `glossary.userGlossary` da configuração, ou `glossary-user.csv`).

**Veja também:** [Glossário](/pt-BR/guide/glossary), [Glossário do Painel](/pt-BR/guide/translation-dashboard/glossary)
