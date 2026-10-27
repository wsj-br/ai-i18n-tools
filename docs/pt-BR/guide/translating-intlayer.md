<a id="translating-intlayer-in-place"></a>
# Traduzindo o Intlayer no local

O [Intlayer](https://intlayer.org/) é uma boa solução para aplicações que mantêm traduções em dicionários de conteúdo tipados ou que usam um sistema de gerenciamento de tradução e tradução humana. O `translate-intlayer` é para esse público. Ele preenche as folhas de localidade ausentes e desatualizadas dentro dos seus dicionários `*.content.ts`, in-place. Os dicionários permanecem como a fonte da verdade, o Intlayer permanece em tempo de execução e o ai-i18n-tools atua como o mecanismo de tradução (seleção de provedor, glossário, contexto de tradução e fallback de modelo).

<a id="keep-intlayer-or-move-to-source-string-calls"></a>
## Manter o Intlayer ou migrar para chamadas de string de origem?

| Seu público | Comando | Guia |
| --- | --- | --- |
| Dicionários de conteúdo tipados, um sistema de gerenciamento de tradução ou tradução humana. O Intlayer permanece em tempo de execução. | `translate-intlayer` | esta página |
| Chamadas de string de origem, `t('…')`, com o texto no idioma de origem mantido junto com o código que o utiliza. O idioma de origem pode ser qualquer idioma. | `migrate-intlayer` | [Migrando do Intlayer para chamadas de string de origem](/pt-BR/guide/migrating-from-intlayer) |

`translate-intlayer` é uma tarefa contínua que você executa novamente sempre que adiciona strings de origem ou edita as existentes. `migrate-intlayer` é uma migração única para o outro público. Cada chamada reescrita carrega a string do idioma de origem junto com o código que a utiliza, o que simplifica a manutenção e reduz a complexidade desse código. Esse idioma é o `sourceLocale` e pode ser qualquer idioma.

<a id="what-translate-intlayer-does"></a>
## O que o `translate-intlayer` faz

1. Analisa as exportações padrão de `*.content.ts` e coleta cada folha `t({ locale: '…' })`. Os valores de localidade podem ser strings simples ou nós de inserção `insert('…')` do Intlayer.
2. Preenche o `ui.stringsJson` do bloco de UI com o texto de origem e, em seguida, executa o mesmo mecanismo que o [`translate-ui`](/pt-BR/reference/cli-commands/ui-strings#translate-ui) para as localidades ausentes e desatualizadas.
3. Grava as novas strings por localidade de volta em cada objeto `t({ … })`. As edições são cirúrgicas: apenas as linhas de localidade ausentes ou desatualizadas são alteradas, para que sua formatação, ordem de chaves e comentários sejam preservados. As traduções existentes são mantidas como estão. Quando uma folha usa `insert('…')`, os novos valores de localidade também são encapsulados em `insert(…)`, para que a folha permaneça chamável em tempo de execução.
4. Preserva placeholders. A sintaxe de inserção do Intlayer <code v-pre>{{token}}</code> é passada sem alterações. Placeholders de chaves simples `{token}` também são compatíveis: eles se tornam <code v-pre>{{token}}</code> para tradução e retornam a `{token}` na gravação.
5. Execução de teste (dry run) com `--dry-run`: ele relata as contagens de ausentes/desatualizados sem chamar um LLM ou gravar nada.

<a id="missing-vs-stale"></a>
## Ausente vs. desatualizado

Uma folha + localidade é traduzida quando:

- A localidade está ausente na folha (ausente), ou
- O texto da localidade de origem mudou desde a última execução para essa localidade (desatualizado). O idioma de origem é `sourceLocale` e pode ser qualquer idioma.

O estado de desatualização é rastreado por folha em `cacheDir`, portanto, editar uma string em inglês retraduz apenas essa folha na próxima execução; todo o resto permanece em cache. Uma tradução que já estava desatualizada na primeira execução é aceita como atual — apenas edições posteriores a marcam como desatualizada.

<a id="translate-your-project"></a>
## Traduza seu projeto

1. Instale o `ai-i18n-tools` (consulte [Instalação](/pt-BR/guide/installation)). Se o seu projeto ainda não tiver um `ai-i18n-tools.config.json`, inicialize um:

   ```bash
   ai-i18n-tools init -P gemini
   ```

Defina `sourceLocale` e `targetLocales` para as localidades que seus dicionários usam e aponte `ui.sourceRoots`, `ui.stringsJson` e `ui.flatOutputDir` para sua origem e um caminho de catálogo — as mesmas chaves que `translate-ui` usa, consulte [Strings de UI — Etapa 1: Inicializar](/pt-BR/guide/ui-strings/#step-1-initialise). O catálogo pode ficar em um diretório temporário (por exemplo, `.i18n/`); ele é usado como o cache de tradução e você nunca deve editá-lo manualmente.
2. Primeiro, faça uma execução de teste (dry run) para ver o que seria preenchido:

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. Aplique (requer uma chave de API do provedor):

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. Execute novamente sempre que adicionar uma nova string ou editar uma em inglês. Apenas as folhas novas ou alteradas são traduzidas. Limite uma execução com `-l de,fr` ou `--ui-block` quando necessário.

<a id="run-the-example"></a>
## Execute o exemplo

O exemplo [intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) é um pequeno aplicativo Vite + React cujos dicionários vêm com inglês e português do Brasil; espanhol e chinês simplificado estão ausentes propositalmente. `pristine/` é uma referência somente leitura; `src/` é a cópia de trabalho. `pnpm reset` retorna `src/` para esse estado inicial (e limpa o catálogo e o cache) para que você possa repetir o exercício.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

O `pnpm dev` executa o aplicativo em [http://localhost:3093](http://localhost:3093). Alterne a localidade para `es` ou `zh-Hans` antes de traduzir, e as strings usarão o inglês como fallback; após `pnpm translate`, as traduções preenchidas aparecem. Edite uma string em inglês e execute novamente o `pnpm translate` para ver apenas essa folha ser atualizada.

Passo a passo completo: [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md).

<a id="command"></a>
## Comando

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

Requer `features.translateUIStrings` e o `ui.stringsJson` do bloco de UI (o mesmo que `translate-ui`). O `--dry-run` não chama um LLM.

| Opção | Significado |
| --- | --- |
| `[paths...]` | Arquivos/diretórios/globs para escanear (padrão: `ui.sourceRoots`) |
| `-l`, `--locale <codes>` | Localidades de destino separadas por vírgula para preencher (padrão: o `targetLocales` do bloco) |
| `--ui-block <selector>` | Bloco de UI: índice baseado em zero, descrição ou caminho `stringsJson` (padrão: bloco 0) |
| `--dry-run` | Relatar apenas contagens ausentes/desatualizadas; sem chamada de LLM, sem operações de escrita |
| `-j`, `--concurrency <n>` | Máximo de localidades de destino paralelas (padrão: config `concurrency` ou 4) |

**Veja também:** [CLI — Strings de UI](/pt-BR/reference/cli-commands/ui-strings#translate-intlayer), [Como migrar do Intlayer para chamadas de string de origem](/pt-BR/guide/migrating-from-intlayer)
