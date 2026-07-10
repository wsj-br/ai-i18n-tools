<a id="t-calls--plurals"></a>
# t() calls aur bahuvachan

<a id="using-t-in-source-code"></a>
## Source code mein `t()` ka upyog karna

`t()` ko ek **literal string** ke saath call karein taaki extract script use dhoondh sake:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Yahi pattern React ke bahar bhi kaam karta hai (Node.js, server components, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Niyam:**

- Sirf ye forms extract kiye jaate hain: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- Key ek **literal string** honi chahiye — key ke roop mein koi variables ya expressions nahi.
- Key ke liye template literals ka upyog na karein: <code>{'t(`Hello ${name}`)'}</code> extract nahi kiya ja sakta.

<a id="interpolation"></a>
## Interpolation

<code v-pre>{{var}}</code> placeholders ke liye i18next ke native second-argument interpolation ka upyog karein:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Extract command **doosre argument** ko parse karta hai jab woh ek plain object literal hota hai aur tooling-only flags jaise ki `plurals: true` aur `zeroDigit` ko padhta hai (neeche **Cardinal plurals** dekhein). Sadharan strings ke liye, hashing ke liye sirf literal key ka upyog kiya jaata hai; interpolation options abhi bhi runtime par i18next ko pass kiye jaate hain.

Yadi aapka project ek custom interpolation utility ka upyog karta hai (jaise `t('key')` ko call karna phir result ko <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code> jaise template function ke madhyam se pipe karna), `setupKeyAsDefaultT` (`wrapI18nWithKeyTrim` ke madhyam se) ise anavashyak bana deta hai — yah <code v-pre>{{var}}</code> interpolation lagoo karta hai bhale hi source locale raw key wapas karta ho. Call sites ko <code v-pre>t('Hello {{name}}', { name })</code> mein migrate karein aur custom utility ko hata dein.

<a id="cardinal-plurals-plurals-true"></a>
## Cardinal plurals (`plurals: true`)

**Aap plural forms ko haath se nahi likhte hain.** Source code mein, message ko ek baar likhein aur do cheezein second argument mein pass karein:

1. **`plurals: true`** — extract aur `translate-ui` ko batata hai ki yah call ek cardinal plural group hai.
2. **`count`** — vah sankhya jise i18next runtime par sahi form chunne ke liye upyog karta hai.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Call site par aapko bas itna hi chahiye. Aap `_zero`, `_one`, `_other`, ya koi anya suffix keys khud define **nahi** karte hain.

Jab aap `translate-ui` chalate hain, **ai-i18n-tools ek LLM ko call karta hai** har target locale ke liye har avashyak cardinal category generate karne ke liye (`zero`, `one`, `two`, `few`, `many`, `other` — jo bhi `Intl.PluralRules` us bhasha ke liye avashyak ho). Model aapke original literal aur source-language plural variants prapt karta hai, phir translated forms wapas karta hai. Tooling unhe `strings.json` mein likhta hai aur flat i18next JSON (`<groupId>_zero`, `<groupId>_one`, …) emit karta hai taki runtime plural resolution aapki taraf se bina kisi atirikt setup ke kaam kare.

- `zeroDigit` (optional) — kewal tooling ke liye; i18next dwara **nahi** padha jata. Jab `true`, LLM prompt har locale ke liye `_zero` string mein ek literal Arabic `0` ko prefer karta hai jahan vah form maujood hai; jab `false` ya omit kiya jata hai, to natural zero phrasing ka upyog kiya jata hai. `i18next.t` ko call karne se pehle in keys ko strip karein (neeche `wrapT` dekhein).

**Validation:** Yadi message mein **do ya do se adhik** alag <code v-pre>{{…}}</code> placeholders hain, to **unmein se ek** <code v-pre>{{count}}</code> (plural axis) hona chahiye. Anyaatha `extract` ek spasht file/line message ke saath **fail** ho jata hai.

**Do swatantra counts** (jaise sections aur pages) ek plural message share nahi kar sakte — **do** `t()` calls ka upyog karein (har ek `plurals: true` aur uske apne `count` ke saath) aur UI mein concatenate karein.

**V1 mein nahi:** ordinal plurals (`_ordinal_*`, `ordinal: true`), interval plurals, ICU-only pipelines.

<a id="how-plurals-are-stored-and-emitted"></a>
## Plurals kaise store aur emit kiye jaate hain

**`strings.json` mein** plural groups `"plural": true` ke saath **prati hash ek row** ka upyog karte hain, `source` mein original literal, aur `translated[locale]` cardinal categories (`zero`, `one`, `two`, `few`, `many`, `other`) ko us locale ke liye strings se map karne wale object ke roop mein.

**Flat locale JSON:** Non-plural rows **source sentence → translation** rahte hain. Plural rows har suffix ke liye `<groupId>_original` (reference ke liye `source` ke barabar) aur `<groupId>_<form>` ke roop mein emit kiye jaate hain, taki i18next plurals ko natively resolve kar sake. `translate-ui` **sirf** plural flat keys wala `{sourceLocale}.json` bhi likhta hai (source language ke liye is bundle ko load karein taki suffixed keys resolve ho sakein; plain strings abhi bhi key-as-default ka upyog karte hain). Har target locale ke liye, emit kiye gaye suffix keys us locale ke liye `Intl.PluralRules` (`requiredCldrPluralForms`) se match karte hain: yadi `strings.json` ne compaction ke baad kisi category ko chhod diya tha kyunki vah kisi aur se match karti thi (jaise Arabic `many` `other` ke saman), `translate-ui` abhi bhi har avashyak suffix ko flat file mein fallback sibling string se copy karke likhta hai, taki runtime lookup kabhi bhi key ko miss na kare.

Runtime (`ai-i18n-tools/runtime`): **Call** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — yah `wrapI18nWithKeyTrim` chalata hai, optional `translate-ui` `{sourceLocale}.json` plural bundle register karta hai, phir `wrapT` ka upyog karke `buildPluralIndexFromStringsJson(stringsJson)` karta hai. `wrapT` `plurals` / `zeroDigit` ko strip karta hai, avashyakta padne par key ko group id mein rewrite karta hai, aur `count` ko forward karta hai (optional: yadi ek single non-<code v-pre>{{count}}</code> placeholder hai, to `count` us numeric option se copy kiya jata hai). [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime) aur [Runtime helpers](/hi-Latn/guide/runtime-helpers) dekhein.

**Purane environments:** Tooling aur consistent behaviour ke liye `Intl.PluralRules` ki avashyakta hai; agar aap bahut purane browsers ko target kar rahe hain to polyfill karein.
