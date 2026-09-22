<a id="glossary"></a>
# Glossário

O glossário garante uma terminologia de produto consistente em todas as traduções. Os usuários podem definir a tradução de um termo em um ou mais idiomas, permitindo que o modelo de IA use essa tradução predefinida em vez de tentar adivinhar a melhor opção. Ele também pode ser usado para manter determinados termos, como nomes de produtos, inalterados durante a tradução para outros idiomas.

Dois tipos de orientação são enviados ao modelo:

- **Linhas de termos** em `glossary.userGlossary` (e, para alguns pipelines, traduções de UI existentes de `glossary.uiGlossary`). Uma linha só é incluída quando esse termo de origem aparece no texto que está sendo traduzido.
- **Arquivos de contexto do projeto** em `glossary.contextFiles`. O briefing completo é injetado em todos os prompts de UI, documentação, JSON, SVG e revisão. Essa seção está [abaixo](#project-context-files).

<a id="how-the-glossary-works"></a>
## Como o glossário funciona

<a id="where-terms-come-from"></a>
### De onde vêm os termos

| Fonte | Configuração | Usado por |
| --- | --- | --- |
| Catálogo de UI | `glossary.uiGlossary` — geralmente o mesmo caminho que `ui.stringsJson` | `translate-docs`, `translate-json`, `translate-svg` |
| CSV do usuário | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary` reutiliza traduções já armazenadas em `strings.json` como dicas, de modo que a documentação, o JSON e o SVG permaneçam alinhados com a UI. `translate-ui` e `proofread-ui` não leem `uiGlossary` — eles obtêm dicas apenas do CSV do usuário, para que uma tradução de UI ruim não seja realimentada como o termo preferido.

O CSV do usuário prevalece sobre o catálogo de UI. Uma linha cujo `locale` é um código específico substitui tanto a linha de `*` quanto a tradução do catálogo de UI para esse idioma. Um `locale` de `*` aplica a mesma tradução a toda entrada de `targetLocales` que ainda não tenha uma vinda do catálogo de UI.

Abreviações compactas de rótulos de UI (um ponto final como `Alm.`, ou uma compressão curta de token único como `Size` → `Tam`) permanecem disponíveis para tradução de UI. Os prompts de documentação as ignoram, para que não induzam os modelos a criar tokens <code v-pre>{{…}}</code> inventados em markdown ou MDX.

<a id="when-a-term-is-sent"></a>
### Quando um termo é enviado

A correspondência não diferencia maiúsculas de minúsculas e para em um limite de palavra (espaço em branco ou pontuação). Termos mais longos são preferidos, e correspondências sobrepostas são descartadas. Quando um termo corresponde ao lote atual, o prompt recebe uma dica como `"dashboard" → "Tableau"`. Se essa linha tiver uma anotação de **Contexto**, a anotação é adicionada apenas para essa correspondência.

**Contexto** é uma orientação de uso no idioma de origem (o que o termo significa ou como usá-lo). Não é uma tradução. Alterar uma anotação de **Contexto**, ou qualquer conteúdo de `glossary.contextFiles`, atualiza as traduções em cache do idioma afetado na próxima execução — você não precisa de `--force`. Alterar apenas a **Tradução** preferida mantém o cache existente até você passar `--force` ou `--force-update`. As linhas que você editou no dashboard permanecem como `user-edited`.

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
    "uiGlossary": "src/locales/strings.json",
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
    "uiGlossary": "src/locales/strings.json",
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
