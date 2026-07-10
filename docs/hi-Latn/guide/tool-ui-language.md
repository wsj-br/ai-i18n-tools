<a id="tool-ui-language"></a>
# Tool UI bhasha

Tool apne user interface ko sthaniya banata hai — CLI help text, high-traffic log/summary/error messages, aur Translation Dashboard — aapke project ke `sourceLocale` / `targetLocales` se svatantra roop se. Kisi configuration ki avashyakta nahi hai: default roop se tool aapke OS locale ka palan karta hai.

<a id="locale-resolution"></a>
## Locale resolution

UI locale in sroton se resolve kiya jata hai, uchchatam prathamikta ke saath:

1. `-L` / `--ui-lang <code>` global flag (e.g. `-L pt-BR`).
2. `AI_I18N_LANG` environment variable (e.g. `export AI_I18N_LANG=es`).
3. `ai-i18n-tools.config.json` mein `uiLanguage` config key (BCP-47 string).
4. Host OS locale (`Intl.DateTimeFormat().resolvedOptions().locale` ke through).

<a id="matching-and-fallback"></a>
## Matching aur fallback

Anurodh kiya gaya locale shipped UI bhashaon ke khilaaf ya sabse qareebi variation dwara match kiya jaata hai (udaharan ke liye `pt-PT` `pt-BR` mein resolve hota hai, aur `en-US` `en-GB` mein resolve hota hai); jab kuchh bhi match nahin hota hai to yah source locale (`en-GB`) par fallback ho jaata hai. Jab UI bhasha spasht roop se anurodh ki jaati hai (flag, env var, ya `uiLanguage` ke dwara) lekin koi shipped bundle match nahin hota hai, to CLI ek-baar ka warning print karta hai ki default locale ka upayog kiya jaayega; keval host OS se anumaanit locale kabhi warning nahin deta hai.

<a id="shipped-ui-languages"></a>
## Shipped UI bhashayen

`en-GB` (srot) aur `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, aur `zh-Hant`.

<a id="translation-dashboard"></a>
## Translation Dashboard

Translation Dashboard resolve kiye gaye locale, layout direction, aur translation bundle ko `GET /api/ui-i18n` se padhta hai aur unhe load hone par lagu karta hai (yah `<html lang>` / `dir` set karta hai aur `data-i18n*` attributes ke madhyam se static markup ko sthaniya banata hai).

<a id="related"></a>
## Sambandhit

- [`AI_I18N_LANG`](/reference/environment-variables) — environment variable override
- [`uiLanguage`](/reference/configuration#uilanguage-optional) — config key override
- [`-L` / `--ui-lang`](/reference/cli-commands/) — CLI flag override (uchchatam prathamikta)
