<a id="cli--other-content"></a>
# CLI — Outro conteúdo

<a id="translate-json"></a>
### `translate-json`

**Sinopse:** `ai-i18n-tools translate-json [options]`

Traduz JSON aninhado por `json[]` (requer `features.translateJson`). Cache SQLite compartilhado.

**Opções principais:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**Ver também:** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**Sinopse:** `ai-i18n-tools translate-svg [options]`

Traduz arquivos SVG configurados em `config.svg` (separado da documentação). Requer `features.translateSVG`. Mesmas ideias de cache da documentação; suporta `--no-cache` para pular leituras/gravações SQLite para aquela execução.

**Opções principais:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**Ver também:** [Tradução SVG](/guide/svg-translation/)
