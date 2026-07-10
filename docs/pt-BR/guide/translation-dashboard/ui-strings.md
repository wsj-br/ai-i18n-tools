<a id="ui-strings--plurals"></a>
# Strings e plurais da UI

As abas **UI strings** e **UI plurals** editam linhas no seu catálogo `strings.json`. As alterações no Dashboard são gravadas diretamente nesse arquivo — não no cache de documentação do SQLite.

Use essas abas quando um rótulo de UI ou forma plural precisar de uma correção manual após `translate-ui` ou `sync`.

<a id="ui-strings-tab"></a>
## Aba UI strings

Lista entradas não plurais de `strings.json` — uma linha por ID de string e localidade.

<a id="filters"></a>
### Filtros

| Filtro | Finalidade |
| --- | --- |
| **Id / hash** | ID da string ou hash |
| **Filename (partial)** / **Select filepath** | Escopo do arquivo de origem |
| **Source contains** / **Translated contains** | Substring de texto |
| **Locale** | Localidade única ou todas |
| **Model** | Modelo que produziu a tradução |

<a id="edit"></a>
### Editar

1. Clique no ícone de edição em uma linha.
2. Altere o texto traduzido e salve.

O `models[locale]` da entrada é definido como `user-edited`. Execute `sync` ou `translate-ui` simples para atualizar os arquivos de localidade simples (`de.json`, etc.). **Não** use `--force` — ele retraduz cada entrada e pode sobrescrever correções manuais.

Quando `glossary.autoAddUserEditedToGlossary` é `true` (padrão), o próximo `translate-ui` ou `sync` pode anexar sua edição ao CSV do glossário do usuário automaticamente — consulte [Configuração](/pt-BR/reference/configuration#glossary).

<a id="delete"></a>
### Excluir

- **Ícone de exclusão de linha** — remove um bucket de localidade de uma entrada.
- **Delete filtered** — exclusão em massa de todos os buckets de localidade que correspondem aos filtros atuais.

<a id="log-links"></a>
### Links de log

O controle 🔗 imprime as localizações de arquivo:linha de origem do array `locations` da entrada no terminal.

<a id="ui-plurals-tab"></a>
## Aba UI plurals

Lista entradas de grupo plural (`"plural": true` em `strings.json`). Cada linha mostra as formas cardinais de um local (`one`, `other` e formas específicas do local).

<a id="filters-1"></a>
### Filtros

O mesmo que a guia de strings da UI, mais:

| Filtro | Finalidade |
| --- | --- |
| **Completo / Incompleto** | Se todas as formas CLDR necessárias estão presentes para o local selecionado |

Linhas incompletas estão faltando uma ou mais formas necessárias para aquele local.

<a id="edit-1"></a>
### Editar

1. Clique no ícone de edição em uma linha.
2. Edite cada formulário CLDR no modal (uma área de texto por formulário).
3. Salvar — strings de formulário vazias são removidas ao salvar.

O `models[locale]` da entrada é definido como `user-edited`. Execute `sync` ou `translate-ui` simples depois (não `--force`).

<a id="other-columns"></a>
### Outras colunas

- **Formas** — exibe `one: "…"`, `other: "…"`, etc.
- **Crachá `zeroDigit`** — indicador somente leitura quando a fonte usa um padrão plural de dígito zero.

As formas necessárias vêm das regras CLDR por local (`requiredPluralFormsByLocale`).

<a id="delete-1"></a>
### Excluir

O mesmo que strings da UI: exclusão por local ou ação em massa **Excluir filtrados**.
