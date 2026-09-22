<a id="migrating-from-intlayer"></a>
# Migrando do Intlayer

Migrando do [Intlayer](https://intlayer.org/)? Este comando importa seus dicionários de tradução existentes e o uso mais simples de tradução do seu aplicativo para o ai-i18n-tools. Ele aplica atualizações seguras automaticamente e, em seguida, gera um relatório claro sobre qualquer item que ainda precise da sua atenção. Isso permite que você faça a migração gradualmente, sem precisar entender todas as diferenças de antemão.

Já está usando arquivos de tradução JSON do i18next? Você não precisa deste comando de migração; use o [pipeline JSON](/pt-BR/guide/json#i18next-namespace-files) em vez disso.

<a id="what-migrate-intlayer-does"></a>
## O que `migrate-intlayer` faz

1. Analisa as exportações padrão de `*.content.ts` (`key` + `content` + `t({ locale: '…' })` folhas).
2. Popula `ui.stringsJson` e arquivos por localidade em `ui.flatOutputDir` a partir do texto da localidade de origem e de quaisquer traduções que já estejam no dicionário. As linhas importadas não têm o campo `models` (não foram traduzidas automaticamente nesta execução).
3. Reescreve os pontos de chamada **seguros**:
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. Deixa todo o resto (chaves dinâmicas, spreads de JSX, `.replace().replace()` encadeados, desestruturação) intacto. O relatório lista cada um desses pontos com a expressão exata, uma substituição concreta de `t()` ou JSX e a linha `import { t } from '…';` a ser adicionada.
5. Execução de teste por padrão. Passe `--write` para aplicar a população do catálogo e as reescritas seguras. O relatório é sempre gerado. Ele também lista os arquivos de dicionário e o uso restante de `useIntlayer` / `IntlayerProvider` a serem excluídos após as reescritas manuais, as chaves de catálogo que ainda precisam de `extract` e depois `translate-ui`, e um bootstrap de runtime para colar sobre o módulo i18n do aplicativo.

<a id="migrate-your-project"></a>
## Migre seu projeto

1. Instale o `ai-i18n-tools` (consulte [Instalação](/pt-BR/guide/installation)). Se o seu projeto ainda não tiver um `ai-i18n-tools.config.json`, inicialize um:

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

Edite `sourceLocale` e `targetLocales` para corresponder aos locales já presentes nos seus dicionários do Intlayer, e defina `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir` para apontar para o código-fonte do seu aplicativo e os caminhos de catálogo desejados — as mesmas chaves que `translate-ui` usa, consulte [Strings de UI — Passo 1: Inicializar](/pt-BR/guide/ui-strings/#step-1-initialise).
2. Faça uma execução simulada primeiro: `ai-i18n-tools migrate-intlayer` (sem `--write`). Leia `migrate-intlayer-report.md` para ver o que ele encontra e quais pontos de chamada precisam de revisão manual antes de qualquer alteração nos arquivos.
3. `ai-i18n-tools migrate-intlayer --write` para popular `ui.stringsJson` / `ui.flatOutputDir` e reescrever os pontos de chamada seguros.
4. Forneça o relatório regenerado `migrate-intlayer-report.md` a um agente de codificação de IA (recomendado) ou processe-o você mesmo seguindo as etapas:

- O relatório termina com um **TODO passo a passo**: conclua cada ponto de revisão manual com o `t('…')`/JSX concreto mostrado lá, adicione a linha `import { t } from '…';` e, em seguida, exclua os arquivos `*.content.ts` restantes e o uso de `useIntlayer` / `IntlayerProvider` listados no relatório.
   - Cole o bootstrap de runtime do relatório sobre o módulo i18n do seu aplicativo. No controle de locale, chame `loadLocale(next)` e depois `i18n.changeLanguage(next)` — `loadLocale` apenas registra o bundle flat e não altera o idioma ativo.
   - Execute `ai-i18n-tools extract` e depois `ai-i18n-tools translate-ui` (ou `sync`) para quaisquer strings de origem que o relatório marcar como novas. `extract` também grava `ui-languages.json`, que o bootstrap importa, então execute-o antes de iniciar o aplicativo, mesmo quando nenhuma nova string for adicionada. Não edite manualmente `strings.json`, os arquivos de locale flat ou `ui-languages.json` — esses comandos os gerenciam.
   - Assim que a lista de limpeza do relatório estiver concluída e o aplicativo estiver executando em ai-i18n-tools, remova as dependências `intlayer` / `react-intlayer` e os arquivos de dicionário.

<a id="run-the-example"></a>
## Execute o exemplo

Os passos acima se aplicam a qualquer projeto Intlayer. O exemplo [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) percorre esses passos em um pequeno aplicativo Vite + React com casos básicos (reescrita automática) e complexos (revisão manual), para que você possa ver o relatório e o bootstrap de tempo de execução antes de testar no seu próprio código. `intlayer-pristine/` nunca é modificado; `src/` é a cópia de trabalho.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

Entregue `migrate-intlayer-report.md` a um agente de codificação de IA (ou edite você mesmo os arquivos sinalizados). O relatório inclui o módulo de runtime para colar sobre `src/i18n.ts`. No controle de localidade, chame `loadLocale(next)` e depois `i18n.changeLanguage(next)`. `loadLocale` registra apenas o pacote plano.

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` executa `extract` primeiro, que grava `ui-languages.json`. O bootstrap importa esse arquivo, portanto, inicie o aplicativo somente após a extração. Não edite `strings.json`, os arquivos de localidade planos ou `ui-languages.json` manualmente.

`pnpm reset` copia `intlayer-pristine/` de volta para `src/` e limpa os catálogos gerados para que você possa começar de novo.

Passo a passo completo: [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md).

<a id="command"></a>
## Comando

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

Requer `ui.stringsJson` e `ui.flatOutputDir` na configuração (o mesmo que `translate-ui`). Não chama um LLM.

| Opção | Significado |
| --- | --- |
| `[paths...]` | Arquivos/diretórios/globs para escanear (padrão: `ui.sourceRoots`) |
| `--write` | Preenche o catálogo e reescreve chamadas seguras (padrão: execução simulada) |
| `--report <path>` | Caminho do relatório (padrão: `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | Padrão glob de nome de arquivo do dicionário (padrão: `**/*.content.ts`) |
| `--t-import <specifier>` | Especificador de importação para `t()` gerado (padrão: `./i18n` relativo se `src/i18n.ts` existir, caso contrário `i18next`) |

Após `--write`, conclua a revisão manual dos sites do relatório, exclua os arquivos `*.content.ts` não utilizados e o wrapper `IntlayerProvider` que ele lista, cole o bootstrap de tempo de execução e chame `i18n.changeLanguage` a partir do controle de localidade. Execute `extract` e depois `translate-ui` (ou `sync`) para as strings de origem que o relatório marca como novas. `extract` também grava `ui-languages.json`, que o bootstrap importa. Não edite `strings.json`, os arquivos de localidade planos ou `ui-languages.json` manualmente.

**Veja também:** [CLI — Strings de UI](/pt-BR/reference/cli-commands/ui-strings#migrate-intlayer), [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime)
