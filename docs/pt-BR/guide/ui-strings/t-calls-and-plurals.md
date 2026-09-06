<a id="t-calls--plurals"></a>
# Chamadas t() e plurais

<a id="using-t-in-source-code"></a>
## Usando `t()` no código-fonte

Chame `t()` com uma **string literal** para que o script de extração possa encontrá-la:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

O mesmo padrão funciona fora do React (Node.js, componentes de servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regras:**

- Apenas estas formas são extraídas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- A chave deve ser uma **string literal** — sem variáveis ou expressões como chave.
- Não use literais de template para a chave: <code>{'t(`Hello ${name}`)'}</code> não é extraível.

<a id="interpolation"></a>
## Interpolação

Use a interpolação nativa de segundo argumento do i18next para placeholders <code v-pre>{{var}}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O comando de extração analisa o **segundo argumento** quando ele é um objeto literal simples e lê flags apenas para ferramentas, como `plurals: true` e `zeroDigit` (veja **Plurais cardinais** abaixo). Para strings comuns, apenas a chave literal é usada para hashing; as opções de interpolação ainda são passadas para o i18next em tempo de execução.

Se o seu projeto usa um utilitário de interpolação personalizado (por exemplo, chamando `t('key')` e depois passando o resultado por uma função de template como <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) torna isso desnecessário — ele aplica a interpolação <code v-pre>{{var}}</code> mesmo quando a localidade de origem retorna a chave bruta. Migre os locais de chamada para <code v-pre>t('Hello {{name}}', { name })</code> e remova o utilitário personalizado.

<a id="cardinal-plurals-plurals-true"></a>
## Plurais cardinais (`plurals: true`)

**Você não escreve formas plurais manualmente.** No código-fonte, escreva a mensagem uma vez e passe duas coisas no segundo argumento:

1. **`plurals: true`** — informa ao extrator e ao `translate-ui` que esta chamada é um grupo plural cardinal.
2. **`count`** — o número que o i18next usa em tempo de execução para escolher a forma correta.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Isso é tudo o que você precisa no local da chamada. Você **não** define `_zero`, `_one`, `_other` ou quaisquer outras chaves de sufixo por conta própria.

Quando você executa `translate-ui`, o **ai-i18n-tools chama um LLM** para gerar todas as categorias cardinais necessárias para cada localidade de destino (`zero`, `one`, `two`, `few`, `many`, `other` — o que `Intl.PluralRules` exigir para aquele idioma). O modelo recebe seu literal original mais as variantes plurais do idioma de origem, então retorna as formas traduzidas. A ferramenta as escreve em `strings.json` e emite JSON i18next plano (`<groupId>_zero`, `<groupId>_one`, …) para que a resolução plural em tempo de execução funcione sem configuração extra do seu lado.

- `zeroDigit` (opcional) — apenas para ferramentas; **não** lido pelo i18next. Quando `true`, o prompt do LLM prefere um `0` árabe literal na string `_zero` para cada localidade onde essa forma existe; quando `false` ou omitido, é usada a frase natural de zero. Remova essas chaves antes de chamar `i18next.t` (veja `wrapT` abaixo).

**Validação:** Se a mensagem contiver **dois ou mais** placeholders <code v-pre>{{…}}</code> distintos, **um deles deve ser** <code v-pre>{{count}}</code> (o eixo plural). Caso contrário, `extract` **falha** com uma mensagem clara de arquivo/linha.

Depois que o LLM retorna as formas CLDR, `translate-ui` também verifica cada forma em relação ao **literal original do desenvolvedor**: cada placeholder de origem deve aparecer em todas as categorias (incluindo `one`), as formas não devem inventar novos tokens <code v-pre>{{…}}</code> / `%d` / `{n}`, e as fontes apenas de substantivos (sem <code v-pre>{{count}}</code> e sem dígitos, por exemplo, rótulos de unidades como `Minutes`) devem permanecer apenas de substantivos. Incompatibilidades descartam a resposta desse modelo e tentam o próximo modelo na lista de fallback.

**Duas contagens independentes** (por exemplo, seções e páginas) não podem compartilhar uma mensagem plural — use **duas** chamadas `t()` (cada uma com `plurals: true` e seu próprio `count`) e concatene na UI.

**Não na v1:** plurais ordinais (`_ordinal_*`, `ordinal: true`), plurais de intervalo, pipelines apenas ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
## Como os plurais são armazenados e emitidos

**Em** `strings.json`, os grupos de plurais usam **uma linha por hash** com `"plural": true`, o literal original em `source` e `translated[locale]` como um objeto que mapeia categorias cardinais (`zero`, `one`, `two`, `few`, `many`, `other`) para strings para aquela localidade.

**JSON de localidade simples:** As linhas não plurais permanecem **frase de origem → tradução**. As linhas plurais são emitidas como `<groupId>_original` (igual a `source`, para referência) e `<groupId>_<form>` para cada sufixo, para que o i18next resolva os plurais nativamente. `translate-ui` também escreve `{sourceLocale}.json` contendo **apenas** chaves simples plurais (carregue este pacote para o idioma de origem para que as chaves sufixadas sejam resolvidas; strings simples ainda usam chave como padrão). Para cada localidade de destino, as chaves de sufixo emitidas correspondem a `Intl.PluralRules` para aquela localidade (`requiredCldrPluralForms`): se `strings.json` omitiu uma categoria porque ela correspondia a outra após a compactação (por exemplo, árabe `many` igual a `other`), `translate-ui` ainda escreve cada sufixo necessário no arquivo simples, copiando de uma string irmã de fallback para que a pesquisa em tempo de execução nunca perca uma chave.

Tempo de execução (`ai-i18n-tools/runtime`): **Chame** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ele executa `wrapI18nWithKeyTrim`, registra o pacote plural opcional `translate-ui` `{sourceLocale}.json`, então `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` remove `plurals` / `zeroDigit`, reescreve a chave para o ID do grupo quando necessário e encaminha `count` (opcional: se houver um único espaço reservado não-<code v-pre>{{count}}</code>, `count` é copiado dessa opção numérica). Consulte [Conectar i18next](/pt-BR/guide/ui-strings/i18next-runtime) e [Auxiliares de tempo de execução](/pt-BR/guide/runtime-helpers).
