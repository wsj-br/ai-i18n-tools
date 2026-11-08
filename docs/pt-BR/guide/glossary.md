<a id="glossary"></a>
# Glossário

O glossário garante uma terminologia consistente do produto em todas as traduções. Os usuários podem definir a tradução de um termo em um ou vários idiomas, permitindo que o modelo de IA use esta tradução predefinida em vez de escolher uma por conta própria. Ele também pode ser usado para manter certos termos, como nomes de produtos, inalterados durante a tradução para outros idiomas.

Dois tipos de orientação são enviados ao modelo:

- **Linhas de termos** em `glossary.userGlossary` (e, para documentação, JSON e SVG, traduções de UI existentes de cada bloco `ui` com `uiGlossary` habilitado). Uma linha é incluída apenas quando esse termo de origem aparece no texto sendo traduzido.
- **Arquivos de contexto do projeto** em `glossary.contextFiles`. O briefing completo é injetado em cada prompt de UI, documentação, JSON, SVG e revisão. Essa seção está [abaixo](#project-context-files).

<a id="how-the-glossary-works"></a>
## Como o glossário funciona

<a id="where-terms-come-from"></a>
### De onde vêm os termos

| Fonte | Configuração | Usado por |
| --- | --- | --- |
| Catálogos de UI | `ui[].uiGlossary` (booleano, padrão `true`) — `stringsJson` desse bloco | `translate-docs`, `translate-json`, `translate-svg` |
| CSV do usuário | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`init` aponta `glossary.userGlossary` para `glossary-user.csv` e não cria esse arquivo. Execute `glossary-generate` quando ele estiver faltando e coloque termos de domínio nele antes do primeiro `translate-ui`. Uma segunda tradução de uma string inalterada pode retornar com uma redação diferente. O glossário é o que faz as duas execuções concordarem.

Um bloco com `uiGlossary: true` reutiliza traduções já armazenadas em seu `strings.json` como sugestões, para que a documentação, o JSON e o SVG permaneçam alinhados com a UI. `translate-ui` e `proofread-ui` não leem esses catálogos — eles aceitam sugestões apenas do CSV do usuário, para que uma tradução de UI ruim não seja reinserida como o termo preferencial. Defina `uiGlossary` como `false` em um bloco que não deve orientar outros pipelines. Quando vários blocos compartilham um termo de origem, o bloco anterior preenche uma localidade e os blocos posteriores adicionam apenas as localidades que ainda estão faltando. O CSV do usuário prevalece sobre qualquer catálogo de UI. Uma linha cujo `locale` é um código específico substitui tanto a linha `*` quanto a tradução do catálogo de UI para essa localidade. Um `locale` de `*` aplica a mesma tradução a todas as localidades de destino que ainda não possuem uma tradução do catálogo de UI.

Abreviações compactas de rótulos de UI (um ponto final como `Alm.`, ou uma compressão curta de token único como `Size` → `Tam`) permanecem disponíveis para tradução de UI. Os prompts de documentação as ignoram, para que não induzam os modelos a criar tokens <code v-pre>{{…}}</code> inventados em markdown ou MDX.

Um prefixo de várias palavras compartilhado por duas ou mais chaves de catálogo é adicionado como seu próprio termo quando esse prefixo ainda não é uma chave. Para cada localidade, a tradução é o início compartilhado dessas traduções de catálogo, cortado em um limite de palavra, e somente quando esse início compartilhado tiver pelo menos quatro caracteres. `Cursor Models run out` e `Cursor Models at renewal` podem gerar `Cursor Models` quando ambas as strings em alemão começam com `Cursor-Modelle`. Uma linha CSV de usuário para a mesma fonte substitui essa tradução inicial.

<a id="when-a-term-is-sent"></a>
### Quando um termo é enviado

A correspondência não diferencia maiúsculas de minúsculas e para em um limite de palavra (espaço em branco ou pontuação). Termos mais longos são preferidos, e correspondências sobrepostas são descartadas. Quando um termo corresponde ao lote atual, o prompt recebe uma dica como `"dashboard" → "Tableau"`. Se essa linha tiver uma anotação de **Contexto**, a anotação é adicionada apenas para essa correspondência.

**Contexto** é uma orientação de uso na língua de origem (o que o termo significa ou como usá-lo). Não é uma tradução. Alterar uma nota de **Contexto**, ou qualquer conteúdo `glossary.contextFiles`, atualiza as traduções em cache para a localidade afetada na próxima execução — você não precisa de `--force`. Alterar apenas a **Tradução** preferida em uma linha que não é **Forçar** mantém o cache existente até que você passe `--force` ou `--force-update`. Uma linha **Forçar** (nova, editada ou limpa) perde o cache apenas para segmentos cuja fonte contém esse termo, e somente quando o texto armazenado ainda não inclui a tradução forçada. Deixe **Contexto** vazio nessa linha para esta atualização restrita; uma nota de Contexto ainda atualiza a localidade inteira. As linhas que você editou no painel permanecem como `user-edited`.

A tradução de Markdown verifica um rótulo de UI de duas a cinco palavras quando a fonte o cita como o trecho inteiro em negrito ou código inline, em um cabeçalho, ou em uma linha que contém apenas esse rótulo. Uma frase mais longa em negrito que contém o termo é uma dica, então `**Ask for target language**` não exige a forma de catálogo de `Target language`. Dicas de uma única palavra ainda podem ser flexionadas. Uma dica de CSV do usuário que não é também um rótulo de UI permanece uma dica. A verificação ignora a capitalização e procura a redação do catálogo como uma substring, então uma forma flexionada ainda pode falhar. Ele tenta o próximo modelo até que o mesmo erro de qualidade tenha ocorrido três vezes ou a lista de modelos se esgote, e não divide o segmento por uma falha de rótulo. Se essas tentativas falharem apenas nessa verificação, a execução mantém a tentativa com o menor número de falhas, escreve o documento e armazena em cache o segmento com um aviso de rótulo de glossário. O resumo lista esses avisos, e `cacheDir` recebe `glossary-review-*.md`, um prompt que você pode colar em uma IA para marcar cada falha como um falso positivo ou uma falha real. O código de saída permanece 0 quando o único problema é esse aviso.

Um falso positivo pode ser ignorado com `glossary.labelCheckSkips` na configuração do projeto (a guia Glossário do painel edita a mesma lista). Cada entrada nomeia o `term` em inglês, o `locales` a ser ignorado (`*` significa cada localidade) e globs `files` opcionais. O termo permanece uma dica de prompt. `--recheck-glossary-warnings` traduz segmentos sinalizados novamente e limpa a sinalização quando a verificação agora é aprovada. `--force` os retraduz com todos os outros segmentos. Markdown em cache é verificado novamente quando o arquivo é processado (`--force-update`); um arquivo que o rastreamento de arquivos ignora é deixado como está até que um termo **Force** nesse arquivo esteja faltando na saída, ou até que `--recheck-glossary-warnings` abra um arquivo que tenha um segmento sinalizado. Uma tradução de catálogo que difere da fonte é exigida onde quer que esse rótulo seja citado, incluindo um nome de produto traduzido. Mantenha a grafia da fonte com uma linha **Force** cuja tradução seja igual à fonte.

<a id="force"></a>
### Forçar

Quando **Forçar** é `true`, `yes` ou `1`, o termo de origem é removido do texto antes que o modelo o veja, e a tradução preferida é escrita de volta em seguida. O texto é exato, não uma sugestão. As mesmas regras de limite de palavra e correspondência mais longa se aplicam. Deixe **Forçar** vazio (ou `false`) quando o modelo deve preferir a tradução, mas ainda pode flexioná-la.

<a id="generate-a-glossary"></a>
## Gerar um glossário

`glossary-generate` grava um CSV vazio com o cabeçalho padrão. Ele usa `glossary.userGlossary` da configuração, ou `glossary-user.csv` quando essa chave não está definida. Ele se recusa a sobrescrever um arquivo já existente (código de saída **1**).

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

Aponte a configuração para o arquivo:

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv"
  }
}
```

Você também pode criar o arquivo de glossário CSV diretamente no painel. A primeira ação **Adicionar** na aba [Glossário](/pt-BR/guide/translation-dashboard/glossary) criará o arquivo se `glossary.userGlossary` for especificado e o arquivo ainda não existir. Quando `glossary.autoAddUserEditedToGlossary` for `true` (o padrão), corrigir uma string de UI no painel pode adicionar essa alteração ao CSV durante a próxima execução de `translate-ui`. O painel também atua como um editor para o glossário CSV, permitindo que você adicione, edite ou filtre linhas na UI.

<a id="csv-columns"></a>
## Colunas CSV

Linha de cabeçalho:

```text
Original language string,locale,Translation,Force,Context
```

`en` ou `English` é aceito em vez de `Original language string`. `Notes` é aceito em vez de `Context`.

| Coluna | Significado |
| --- | --- |
| **String no idioma original** | Termo ou frase de origem, no idioma de origem |
| **locale** | Código do idioma de destino, ou `*` para todos os destinos |
| **Tradução** | Tradução preferencial |
| **Force** | `true`, `yes` ou `1` para exigir esse texto; caso contrário, uma sugestão |
| **Context** | Explicação opcional no idioma de origem. Enviada apenas quando esse termo corresponde |

<a id="examples"></a>
## Exemplos

Um termo de produto para cada idioma, um rótulo em alemão forçado e uma linha em francês que explica uma palavra que o modelo pode interpretar literalmente:

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

Combinado com um briefing de projeto:

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

Referência de campo: [`glossary` em Configuration](/pt-BR/reference/configuration#glossary). Referência de comando: [`glossary-generate`](/pt-BR/reference/cli-commands/tools#glossary-generate).

<a id="project-context-files"></a>
## Arquivos de contexto do projeto

`glossary.contextFiles` é para orientação em nível de produto que não pertence a uma única linha CSV: o que o produto é, para quem ele é, tom e termos que são fáceis de traduzir incorretamente. Aponte a configuração para um ou mais arquivos `.md` / `.txt` relativos ao diretório de trabalho atual; eles são concatenados na ordem listada e injetados em cada UI, documentos, JSON, SVG e prompt de revisão.

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

Escreva o resumo no **idioma de origem**, mantenha-o bem abaixo de `glossary.contextMaxChars` (padrão `12000`) e armazene-o fora de `docs[].contentPaths`, a menos que você também queira que esse arquivo seja traduzido. Consulte [`glossary` em Configuração](/pt-BR/reference/configuration#glossary).

<a id="generate-a-context-file-with-an-ai-agent"></a>
### Gerar um arquivo de contexto com um agente de IA

Peça a um agente (Cursor, Claude Code, Copilot e similares) para ler o repositório e escrever o resumo. Cole um prompt como este:

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

Revise o arquivo antes da próxima execução de `sync` / `translate-*`. Alterar o arquivo invalida as traduções em cache para cada localidade nessa execução, portanto, mantenha o resumo estável assim que a qualidade for boa.
