<a id="t-calls--plurals"></a>
# t() calls & plurals

<a id="using-t-in-source-code"></a>
## Using `t()` in source code

Call `t()` with a **literal string** so the extract script can find it:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

The same pattern works outside React (Node.js, server components, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Rules:**

- Only these forms are extracted: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- The key must be a **literal string** — no variables or expressions as the key.
- Do not use template literals for the key: <code>{'t(`Hello ${name}`)'}</code> is not extractable.

<a id="interpolation"></a>
## Interpolation

Use i18next's native second-argument interpolation for <code v-pre>{{var}}</code> placeholders:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

The extract command parses the **second argument** when it is a plain object literal and reads tooling-only flags such as `plurals: true` and `zeroDigit` (see **Cardinal plurals** below). For ordinary strings, only the literal key is used for hashing; interpolation options are still passed through to i18next at runtime.

If your project uses a custom interpolation utility (e.g. calling `t('key')` then piping the result through a template function like <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) makes that unnecessary — it applies <code v-pre>{{var}}</code> interpolation even when the source locale returns the raw key. Migrate call sites to <code v-pre>t('Hello {{name}}', { name })</code> and remove the custom utility.

<a id="cardinal-plurals-plurals-true"></a>
## Cardinal plurals (`plurals: true`)

**You do not write plural forms by hand.** In source code, write the message once and pass two things in the second argument:

1. **`plurals: true`** — tells extract and `translate-ui` that this call is a cardinal plural group.
2. **`count`** — the number i18next uses at runtime to pick the right form.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

That is all you need at the call site. You do **not** define `_zero`, `_one`, `_other`, or any other suffix keys yourself.

When you run `translate-ui`, **ai-i18n-tools calls an LLM** to generate every required cardinal category for each target locale (`zero`, `one`, `two`, `few`, `many`, `other` — whichever `Intl.PluralRules` requires for that language). The model receives your original literal plus the source-language plural variants, then returns the translated forms. Tooling writes those into `strings.json` and emits flat i18next JSON (`<groupId>_zero`, `<groupId>_one`, …) so runtime plural resolution works without extra setup on your side.

- `zeroDigit` (optional) — tooling-only; **not** read by i18next. When `true`, the LLM prompt prefers a literal Arabic `0` in the `_zero` string for each locale where that form exists; when `false` or omitted, natural zero phrasing is used. Strip these keys before calling `i18next.t` (see `wrapT` below).

**Validation:** If the message contains **two or more** distinct <code v-pre>{{…}}</code> placeholders, **one of them must be** <code v-pre>{{count}}</code> (the plural axis). Otherwise `extract` **fails** with a clear file/line message.

**Two independent counts** (e.g. sections and pages) cannot share one plural message — use **two** `t()` calls (each with `plurals: true` and its own `count`) and concatenate in the UI.

**Not in v1:** ordinal plurals (`_ordinal_*`, `ordinal: true`), interval plurals, ICU-only pipelines.

<a id="how-plurals-are-stored-and-emitted"></a>
## How plurals are stored and emitted

**In** `strings.json` plural groups use **one row per hash** with `"plural": true`, the original literal in `source`, and `translated[locale]` as an object mapping cardinal categories (`zero`, `one`, `two`, `few`, `many`, `other`) to strings for that locale.

**Flat locale JSON:** Non-plural rows stay **source sentence → translation**. Plural rows are emitted as `<groupId>_original` (equals `source`, for reference) and `<groupId>_<form>` for each suffix so i18next resolves plurals natively. `translate-ui` also writes `{sourceLocale}.json` containing **only** plural flat keys (load this bundle for the source language so suffixed keys resolve; plain strings still use key-as-default). For each target locale, emitted suffix keys match `Intl.PluralRules` for that locale (`requiredCldrPluralForms`): if `strings.json` omitted a category because it matched another after compaction (e.g. Arabic `many` same as `other`), `translate-ui` still writes every required suffix into the flat file by copying from a fallback sibling string so runtime lookup never misses a key.

Runtime (`ai-i18n-tools/runtime`): **Call** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — it runs `wrapI18nWithKeyTrim`, registers the optional `translate-ui` `{sourceLocale}.json` plural bundle, then `wrapT` using `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` strips `plurals` / `zeroDigit`, rewrites the key to the group id when needed, and forwards `count` (optional: if there is a single non-<code v-pre>{{count}}</code> placeholder, `count` is copied from that numeric option). See [Wire i18next](/guide/ui-strings/i18next-runtime) and [Runtime helpers](/guide/runtime-helpers).

**Older environments:** `Intl.PluralRules` is required for tooling and for consistent behaviour; polyfill if you target very old browsers.
