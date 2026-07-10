<a id="cli--tools"></a>
# CLI — Ferramentas

<a id="dashboard"></a>
### `dashboard`

**Sinopse:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Inicia o Painel de Tradução (interface de usuário web local para segmentos de cache, `strings.json`, glossário, falhas e estatísticas). Porta padrão **8675** (tenta a próxima porta se indisponível). Com `--no-open`, o navegador padrão não é aberto automaticamente. O alias obsoleto `editor` ainda funciona, mas exibe um aviso.

**Opções principais:** `-p` / `--port`, `--no-open`

**Ver também:** [Painel de Tradução](/pt-BR/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Sinopse:** `ai-i18n-tools glossary-generate [-o <path>]`

Escreve um modelo `glossary-user.csv` vazio. Recusa-se a sobrescrever um arquivo existente (saída **1**).

**Opções principais:** `-o` / `--output`

`-o`: substitui o caminho de saída (padrão: `glossary.userGlossary` da configuração, ou `glossary-user.csv`).

**Ver também:** [Glossário do Painel](/pt-BR/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**Sinopse:** `ai-i18n-tools help [command]`

Exibe a ajuda para um subcomando (mesma saída que `ai-i18n-tools <command> --help`).
