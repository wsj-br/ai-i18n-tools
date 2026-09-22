<a id="cli--workflows--reporting"></a>
# CLI — Fluxos de trabalho e relatórios

<a id="sync"></a>
### `sync`

**Sinopse:** `ai-i18n-tools sync [options]`

Extrai (se ativado), depois tradução da IU, depois `translate-svg` quando `features.translateSVG` e `config.svg` são definidos, depois tradução da documentação, depois `translate-json` quando `features.translateJson` e `json[]` são definidos — a menos que seja ignorado com `--no-ui`, `--no-svg`, `--no-docs` ou `--no-json`.

**Opções principais:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` é encaminhado para as etapas de UI e SVG, bem como para docs/JSON; `--force-update` se aplica a docs, JSON e SVG (não UI). `--check-cache` é encaminhado para docs, JSON e SVG: ele revalida segmentos em cache para localidades com um script nativo imposto, mesmo quando o rastreamento de arquivos seria ignorado. A fase de docs também encaminha `--emphasis-placeholders` (mesmo significado que `translate-docs`). O `--debug-failed` global grava logs de `FAILED-TRANSLATION` em `cacheDir` para cada tentativa de modelo descartada (incluindo fallbacks de script SVG/docs), não apenas quando todos os modelos na cadeia falham. `--prompt-format` não é um sinalizador `sync`; as etapas de docs e JSON usam o padrão integrado (`json-array`).

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

**Veja também:** [Estatísticas do painel](/pt-BR/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**Sinopse:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

Imprime estatísticas de chamadas de API de modelo registradas (chamadas, tokens e um único custo em USD). O custo é o `usage.cost` do provedor, quando presente, caso contrário, o valor de `providers.<name>.modelPricing` ou o padrão `providers.<name>.pricing` de todo o provedor (armazenado em novas chamadas; aplicado no momento do relatório para linhas mais antigas que não têm custo armazenado). Os mesmos agregados do Painel de Tradução → Uso e custos. Linhas de detalhes com mais de sete dias corridos UTC são agrupadas em `api_totals` mensais; os relatórios combinam ambas as tabelas. `--since` aceita `YYYY-MM-DD`, uma duração (`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`), ou uma janela de mês calendário (`1mo`, `2mo`, `3mo`). `--clear` exclui linhas de detalhes e totais mensais (`--older-than` é `1mo`, `2mo`, `3mo`, `6mo`, `1y`, ou `all`; `--dry-run` relata a contagem sem excluir).

**Opções principais:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**Ver também:** [Uso e custos do painel](/pt-BR/guide/translation-dashboard/usage)
