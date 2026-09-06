<a id="glossary"></a>
# Glossário

A aba **Glossário** edita seu CSV de glossário de usuário (`glossary.userGlossary` na configuração). As entradas aqui são dicas de terminologia para `translate-ui`, `proofread-ui` e `translate-docs` (através do glossário compartilhado). Abreviações compactas de rótulos de UI (por exemplo, `Size` → `Tam` / `Tam.`) são mantidas para a tradução da UI, mas ignoradas ao construir prompts de documento, para que não direcionem os modelos para tokens <code v-pre>{{…}}</code> inventados em markdown/MDX.

A aba fica oculta quando `glossary.userGlossary` não está configurado.

<a id="csv-columns"></a>
## Colunas CSV

| Coluna | Significado |
| --- | --- |
| **Cadeia de caracteres do idioma original** | Termo ou frase de origem |
| **locale** | Localidade de destino, ou `*` para todas as localidades |
| **Tradução** | Tradução preferencial |
| **Forçar** | Quando marcada, o termo deve ser traduzido exatamente como fornecido |

<a id="add-a-row"></a>
## Adicionar uma linha

Use o formulário na parte superior da aba:

1. Insira **Original**, **localidade** (`*` ou um código de localidade de destino) e **Tradução**.
2. Opcionalmente, marque **Forçar**.
3. Clique em **Adicionar**.

O arquivo CSV é criado na primeira adição, se ainda não existir.

<a id="edit-or-delete"></a>
## Editar ou excluir

- **Edição em linha** — altere os campos diretamente na tabela e clique em **Salvar** nessa linha.
- **Excluir** — remova uma linha com o controle de exclusão.

As alterações entram em vigor na próxima execução de `translate-ui`, `proofread-ui`, `translate-docs` ou `sync`.

<a id="filters"></a>
## Filtros

Filtre por **texto original**, **localidade** (incluindo `*`) ou substring de **texto de tradução** e, em seguida, clique em **Aplicar**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Edições do painel e adição automática de glossário

Quando você corrige uma cadeia de caracteres da interface do usuário na aba **Cadeias de caracteres da interface do usuário** ou **Plurais da interface do usuário**, a próxima execução de `translate-ui` pode anexar essa correção ao glossário automaticamente se `glossary.autoAddUserEditedToGlossary` for `true`. Use a aba Glossário para revisar, ajustar ou remover essas linhas adicionadas automaticamente.
