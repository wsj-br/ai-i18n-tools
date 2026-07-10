<a id="cli--workflows--status"></a>
# CLI — Fluxos de trabalho e status

<a id="sync"></a>
### `sync`

**Sinopse:** `ai-i18n-tools sync [options]`

Extrai (se ativado), depois tradução da IU, depois `translate-svg` quando `features.translateSVG` e `config.svg` são definidos, depois tradução da documentação, depois `translate-json` quando `features.translateJson` e `json[]` são definidos — a menos que seja ignorado com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`.

**Opções principais:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` é encaminhado para as etapas de IU e SVG, bem como para docs/JSON; `--force-update` se aplica a docs, JSON e SVG (não IU). A fase de docs também encaminha `--emphasis-placeholders` e `--debug-failed` (mesmo significado que `translate-docs`). `--prompt-format` não é um sinalizador `sync`; as etapas de docs e JSON usam o padrão integrado (`json-array`).

---

<a id="status"></a>
### `status`

**Sinopse:** `ai-i18n-tools status [--max-columns <n>]`

Quando `features.translateUIStrings` está ativado, imprime a cobertura da IU por localidade (`Translated` / `Missing` / `Total`). Em seguida, imprime o status da tradução markdown por arquivo × localidade (sem filtro `--locale`; as localidades vêm da configuração). Quando `features.translateJson` está ativado e `json[]` está configurado, também imprime o status do pacote JSON por bloco. Grandes listas de localidades são divididas em tabelas repetidas de até `n` colunas de localidade (padrão **9**) para que as linhas permaneçam estreitas no terminal.

**Opções principais:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**Sinopse:** `ai-i18n-tools statistics [--max-columns <n>]`

Imprime o cache da documentação e as estatísticas `strings.json` (mesmos agregados que Painel de Tradução → Estatísticas). `--max-columns`: máximo de colunas de localidade por tabela de modelo × localidade (padrão **6**).

**Opções principais:** `--max-columns`

**Ver também:** [Estatísticas do painel](/guide/translation-dashboard/statistics)
