<a id="documentation-cache"></a>
# Documentation cache

**Documentation** tab aapke configured `cacheDir` ke tahat SQLite mein store kiye gaye cached documentation segment translations ko list karta hai. Har row ek source segment (filepath, line hint, aur source hash dwara identify kiya gaya) hai jo ek target locale mein translate kiya gaya hai.

Is tab ka upyog tab karein jab aap poori pipeline ko phir se chalaye bina cached doc translations ko **review, override, ya clean up** karna chahte hain.

<a id="filters"></a>
## Filters

| Filter | Uddeshya |
| --- | --- |
| **Select filepath** / **Filename (partial)** | Ek file ya ek path substring tak seemit karein |
| **All locales** | Target locale |
| **All models** | Model jisne translation banaya |
| **Source hash** | Exact segment hash |
| **Source text search** / **Translated text search** | Substring match |
| **All entries** | **Stale** (banane ke baad kabhi upyog nahi kiya gaya) ya **Active** (ek `last_hit_at` timestamp hai) |

Filters badalne ke baad **Apply** par click karein. **Clear** sabhi filter fields ko reset karta hai.

<a id="edit-a-translation"></a>
## Ek translation edit karein

1. Ek row par edit icon par click karein.
2. Modal mein translated text badlein aur save karein.

Cache us row ke liye model `user-edited` store karta hai. `sync --force-update` ya `translate-docs --force-update` chalayein taki on-disk markdown outputs cache se match karein.

Agar aapke repo mein **source text** baad mein badalta hai, to segment hash badal jata hai aur purane text ke liye manual edits agle translation run par supersede ho jate hain.

<a id="delete-rows"></a>
## Rows delete karein

- **Row delete icon** — ek cache entry (ek source hash ke liye ek locale) ko hatata hai.
- **Delete filtered** — current filters se match karne wali sabhi rows ko hatata hai (confirmation ki zaroorat hai).
- **Delete all for filepath** — selected filepath ke liye har cached translation ko hatata hai, jismein us file ke liye related failure aur markdown issue rows shamil hain.

Bulk deletes ke baad, missing translations ko regenerate karne ke liye `translate-docs` ya `sync` chalayein.

<a id="table-columns"></a>
## Table columns

| Column | Matlab |
| --- | --- |
| **Filepath** | Source file ke liye Cache key |
| **Line #** | Source file mein line hint |
| **Source hash** | Source segment text ka hash |
| **Source text** | Mool segment (source locale) |
| **Locale** | Target locale |
| **Translated text** | Cached translation |
| **Model** | Model jisne translation banaya (ya `user-edited`) |
| **Created** | Jab row pehli baar likhi gayi |
| **Last hit** | Aakhri baar jab yeh cache entry phir se use ki gayi (red dash = stale) |

Pagination default roop se 50 rows prati page par set hota hai (25 ya 100 bhi upalabdh hain).

<a id="log-links"></a>
## Log links

Ek row mein 🔗 control server se dashboard chalne wale terminal par file:line hints print karne ke liye kehta hai. Iska upyog apne editor mein sahi source location kholne ke liye karein.
