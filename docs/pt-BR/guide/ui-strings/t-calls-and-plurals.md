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

O mesmo padrão funciona fora do React (Node.js, componentes do servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regras:**

- Apenas esses formulários são extraídos: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- A chave deve ser uma **string literal** — nada de variáveis ou expressões como chave.
- Não use template literals para a chave: <code>{'t(`Hello ${name}`)'}</code> não é extraível.

<a id="interpolation"></a>
## Interpolação

Use a interpolação nativa do i18next de segundo argumento para placeholders <code v-pre>{{var}}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

O comando extract analisa o **segundo argumento** quando ele é um objeto literal simples e lê flags exclusivas para ferramentas, como `plurals: true` e `zeroDigit` (veja **Plurais cardinais** abaixo). Para strings comuns, apenas a chave literal é usada para gerar o hash; as opções de interpolação ainda são repassadas ao i18next em tempo de execução.

Se o seu projeto usa um utilitário de interpolação personalizado (por exemplo, chamando `t('key')` e depois passando o resultado por uma função de template como <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) torna isso desnecessário — ele aplica a interpolação <code v-pre>{{var}}</code> mesmo quando a localidade de origem retorna a chave bruta. Migre os locais de chamada para <code v-pre>t('Hello {{name}}', { name })</code> e remova o utilitário personalizado.

<a id="cardinal-plurals-plurals-true"></a>
## Plurais cardinais (`plurals: true`)

**Você não escreve formas plurais à mão.** No código-fonte, escreva a mensagem uma vez e passe duas coisas no segundo argumento:

1. **`plurals: true`** — informa ao extrator e ao `translate-ui` que esta chamada é um grupo plural cardinal.
2. **`count`** — o número que o i18next usa em tempo de execução para escolher a forma correta.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Isso é tudo o que você precisa no local da chamada. Você **não** define `_zero`, `_one`, `_other` ou quaisquer outras chaves de sufixo por conta própria.

Ao executar `translate-ui`, as **ferramentas ai-i18n chamam um LLM** para gerar cada categoria cardinal necessária para cada localidade de destino (`zero`, `one`, `two`, `few`, `many`, `other` — o que `Intl.PluralRules` exigir para aquele idioma). O modelo recebe seu literal original mais as variantes plurais do idioma de origem e, em seguida, retorna as formas traduzidas. A ferramenta as escreve em `strings.json` e emite JSON i18next plano (`<groupId>_zero`, `<groupId>_one`, …) para que a resolução plural em tempo de execução funcione sem configuração extra do seu lado.

- `zeroDigit` (opcional) — apenas para ferramentas; **não** lido pelo i18next. Quando `true`, o prompt do LLM prefere um literal árabe `0` na string `_zero` para cada localidade onde essa forma existe; quando `false` ou omitido, é usada a frase natural para zero. Remova essas chaves antes de chamar `i18next.t` (veja `wrapT` abaixo).

**Validação:** Se a mensagem contiver **dois ou mais** placeholders <code v-pre>{{…}}</code> distintos, **um deles deve ser** <code v-pre>{{count}}</code> (o eixo plural). Caso contrário, `extract` **falha** com uma mensagem clara de arquivo/linha.

**Dois contadores independentes** (por exemplo, seções e páginas) não podem compartilhar uma mesma mensagem no plural — use **duas** chamadas `t()` (cada uma com `plurals: true` e seu próprio `count`) e concatene na interface.

**Não disponível na v1:** plurais ordinais (`_ordinal_*`, `ordinal: true`), plurais por intervalo, pipelines exclusivos ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
## Como os plurais são armazenados e emitidos

**Em** grupos plurais `strings.json`, use **uma linha por hash** com `"plural": true`, o literal original em `source` e `translated[locale]` como um objeto mapeando categorias cardinais (`zero`, `one`, `two`, `few`, `many`, `other`) para strings nesse idioma.

**JSON plano por idioma:** Linhas não plurais permanecem como **frase de origem → tradução**. Linhas plurais são emitidas como `<groupId>_original` (igual a `source`, para referência) e `<groupId>_<form>` para cada sufixo, para que o i18next resolva plurais nativamente. `translate-ui` também gera `{sourceLocale}.json` contendo **apenas** chaves planas de plurais (carregue este pacote para o idioma de origem para que chaves com sufixo sejam resolvidas; strings simples ainda usam a chave como padrão). Para cada idioma de destino, as chaves com sufixo emitidas correspondem a `Intl.PluralRules` para aquele idioma (`requiredCldrPluralForms`): se `strings.json` omitiu uma categoria porque ela coincidiu com outra após compactação (por exemplo, `many` árabe igual a `other`), `translate-ui` ainda escreve todos os sufixos necessários no arquivo plano copiando de uma string alternativa de fallback, garantindo que a busca em tempo de execução nunca falhe por falta de chave.

Tempo de execução (`ai-i18n-tools/runtime`): **Chame** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ele executa `wrapI18nWithKeyTrim`, registra o pacote plural opcional `translate-ui` `{sourceLocale}.json`, então `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` remove `plurals` / `zeroDigit`, reescreve a chave para o ID do grupo quando necessário e encaminha `count` (opcional: se houver um único placeholder não-<code v-pre>{{count}}</code>, `count` é copiado dessa opção numérica). Veja [Wire i18next](/pt-BR/guide/ui-strings/i18next-runtime) e [Runtime helpers](/pt-BR/guide/runtime-helpers).
