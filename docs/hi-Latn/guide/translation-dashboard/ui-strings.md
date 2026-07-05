<a id="ui-strings--plurals"></a>
# UI strings aur plurals

**UI strings** aur **UI plurals** tabs aapke `strings.json` catalog mein rows ko edit karte hain. Dashboard mein kiye gaye badlav seedhe us file mein likhe jaate hain — SQLite documentation cache mein nahi.

In tabs ka upyog tab karein jab `translate-ui` ya `sync` ke baad kisi UI label ya plural form ko manual fix ki zaroorat ho.

<a id="ui-strings-tab"></a>
## UI strings tab

`strings.json` se non-plural entries ko list karta hai — har string id aur locale ke liye ek row.

<a id="filters"></a>
### Filters

| Filter | Uddeshya |
| --- | --- |
| **Id / hash** | String id ya hash |
| **Filename (partial)** / **Select filepath** | Source file scope |
| **Source contains** / **Translated contains** | Text substring |
| **Locale** | Single locale ya sabhi |
| **Model** | Model jisne translation banaya |

<a id="edit"></a>
### Edit karein

1. Ek row par edit icon par click karein.
2. Translated text badlein aur save karein.

Entry ka `models[locale]` `user-edited` par set hai. Flat locale files (`de.json`, aadi) ko refresh karne ke liye plain `sync` ya `translate-ui` chalayein. `--force` ka upyog **na** karein — yeh har entry ko phir se translate karta hai aur manual fixes ko overwrite kar sakta hai.

Jab `glossary.autoAddUserEditedToGlossary` `true` (default) hota hai, toh agla `translate-ui` ya `sync` aapke edit ko user glossary CSV mein automatically jod sakta hai — [Configuration](/reference/configuration#glossary) dekhein.

<a id="delete"></a>
### Delete karein

- **Row delete icon** — ek entry se ek locale bucket ko hatata hai.
- **Delete filtered** — current filters se milte-julte sabhi locale buckets ko bulk mein delete karta hai.

<a id="log-links"></a>
### Log links

🔗 control entry ke `locations` array se source file:line locations ko terminal par print karta hai.

<a id="ui-plurals-tab"></a>
## UI plurals tab

Plural-group entries (`"plural": true` in `strings.json`) ko list karta hai. Har row ek locale ke cardinal forms (`one`, `other`, aur locale-specific forms) ko dikhati hai.

<a id="filters-1"></a>
### Filters

UI strings tab jaisa hi, plus:

| Filter | Uddeshya |
| --- | --- |
| **Poora / Adhoora** | Kya chune gaye locale ke liye sabhi zaroori CLDR forms maujood hain |

Adhoori rows mein us locale ke liye ek ya ek se zyada zaroori forms gayab hain.

<a id="edit-1"></a>
### Edit

1. Ek row par edit icon par click karein.
2. Modal mein har CLDR form ko edit karein (har form ke liye ek textarea).
3. Save karein — khali form strings save karne par hata di jaati hain.

Entry ka `models[locale]` `user-edited` par set hai. Uske baad plain `sync` ya `translate-ui` chalaayein (`--force` nahi).

<a id="other-columns"></a>
### Anya columns

- **Forms** — `one: "…"`, `other: "…"`, aadi dikhata hai.
- **`zeroDigit` badge** — read-only indicator jab source digit-zero plural pattern ka upyog karta hai.

Zaroori forms har locale ke liye CLDR rules se aate hain (`requiredPluralFormsByLocale`).

<a id="delete-1"></a>
### Delete

UI strings jaisa hi: per-locale delete ya **Delete filtered** bulk action.
