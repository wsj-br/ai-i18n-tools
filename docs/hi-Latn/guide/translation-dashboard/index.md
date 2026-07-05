<a id="translation-dashboard"></a>
# Anuvaad Dashboard

Translation Dashboard aapke project ke translation data ko jaanchne aur edit karne ke liye ek local web UI hai. Yeh teen stores se padhta hai:

- **SQLite cache** (`cacheDir`) — documentation segment translations, failure records, markdown issue scans
- **`strings.json`** — UI string catalog (plain strings aur plural groups)
- **User glossary CSV** (`glossary.userGlossary`) — `translate-ui` aur `proofread-ui` ke liye terminology hints

Translation run ke baad iska upyog samasyao ko khojne, galat output ko override karne, ya cache coverage ki review karne ke liye karein — bina SQLite ya JSON ko haath se khodne ke.

<a id="start-the-dashboard"></a>
## Dashboard shuru karein

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Default listen port **8675** hai. Agar vah port unavailable hai, to server agla port try karta hai (1000 attempts tak) aur us port ko log karta hai jise usne chuna. Deprecated alias `editor` abhi bhi kaam karta hai lekin ek warning print karta hai — `dashboard` ko prefer karein.

Dashboard UI wahi locale resolution ka upyog karta hai jo CLI karta hai: `-L` / `--ui-lang` → `AI_I18N_LANG` → config `uiLanguage` → OS locale. [Tool UI language](/reference/environment-variables#tool-ui-language) dekhein.

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## Mujhe kaun sa tab upyog karna chahiye?

| Main chahta hoon… | Tab | Guide |
| --- | --- | --- |
| Doc segments ko theek karein jo translation mein fail ho gaye | **Failures** | [Failures](/guide/translation-dashboard/failures) |
| Translate karne se pehle source markdown ko theek karein | **Markdown issues** | [Markdown issues](/guide/translation-dashboard/markdown-issues) |
| Cached doc translation ko override karein | **Documentation** | [Documentation cache](/guide/translation-dashboard/documentation-cache) |
| Ek UI label ko theek karein | **UI strings** | [UI strings & plurals](/guide/translation-dashboard/ui-strings) |
| Ek plural form ko theek karein (`one`, `other`, …) | **UI plurals** | [UI strings & plurals](/guide/translation-dashboard/ui-strings) |
| UI translation ke liye terminology lock karein | **Glossary** | [Glossary](/guide/translation-dashboard/glossary) |
| Cache coverage aur model usage dekhein | **Statistics** | [Statistics](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## Edit karne ke baad

| Aapne edit kiya… | Phir run karein… | Bachche… |
| --- | --- | --- |
| Documentation cache row | `sync --force-update` ya `translate-docs --force-update` | — |
| UI string ya plural | plain `sync` ya `translate-ui` | `--force` (`user-edited` rows ko overwrite karta hai) |
| Glossary row | next `translate-ui` ya `proofread-ui` | — |

Manual edits ko cache ya `strings.json` mein model `user-edited` ke saath tag kiya jaata hai. Unchanged source text ko re-translate karne se un rows ko skip kiya jaata hai jab tak aap `--force` ka upyog na karein.

<a id="tips"></a>
## Tips

- **Log-link buttons** (table rows mein 🔗) **terminal** mein file:line hints print karte hain jahan `ai-i18n-tools dashboard` chal raha hai — browser se apne editor mein jump karne ke liye upyogi hai.
- **Close** (tab bar ke top-right) dashboard server ko gracefully band kar deta hai.
- Agar server band ho jaata hai jabki browser tab abhi bhi khula hai, to ek overlay dikhai deta hai; reconnect karne ke liye `ai-i18n-tools dashboard` ko restart karein.
