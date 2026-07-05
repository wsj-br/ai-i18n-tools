<a id="translation-dashboard"></a>
# Anuvaad Dashboard

Chalao:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Default listen port **8675** hai. Agar vah port unavailable hai, to server agla port try karta hai (1000 attempts tak) aur us port ko log karta hai jise usne chuna. Deprecated alias `editor` abhi bhi kaam karta hai lekin ek warning print karta hai — `dashboard` ko prefer karein.

Yah aapke configured `cacheDir` SQLite database dwara backed ek local web UI shuru karta hai — wahi folder jise CLI documentation segments, logs, aur related metadata ke liye use karta hai. Ismein **Documentation** (cached doc segments), **UI strings**, **UI plurals**, **Glossary**, **Failures**, **Markdown issues**, aur **Statistics** tabs shamil hain.

![Translation Dashboard](/translation-dashboard.png)

Agar aap is app mein **cache rows edit karte hain** (jaise documentation segments), to `sync --force-update` ya equivalent translate command ko `--force-update` ke saath chalaayein taaki on-disk outputs cache se match karein; agar repo mein **source text** baad mein badalta hai, to segment hashes badal jaate hain aur purane text ke liye manual edits supersede ho jaate hain.

<a id="failures-document-translation"></a>
### Failures (document translation)

**Failures** tab kewal **documentation** translation ke liye hai. Yah un failure records ko padhta hai jo SQLite mein likhe jaate hain jab ek segment ko kisi locale ke liye safaltapoorvak translate nahi kiya ja saka — jaise empty ya invalid model output, post-translation validation errors (`AST mismatch`, placeholder leaks, aur is tarah ke **quality** checks), ya ek **fatal** condition jisne progress ko roka. Yah aapko jawab dene mein madad karta hai: *kaun sa source segment tuta, kis locale aur model ke liye, aur kya error text record kiya gaya?*

<a id="when-to-use-it"></a>
#### Ise kab use karein

- `translate-docs` ya `sync` errors, partial locales, ya confusing logs ke saath khatam hone ke baad — aap terminal output ko akela scroll karne ke bajaye failures ko sort aur filter kar sakte hain.
- Jab aap **rework ko prioritise karna chahte hain**: **# Failures** dwara sort karein taaki jo segments retries mein baar-baar fail hue hain, ve pehle dikhein; ve source markdown mein **simplify ya reformat** karne ke liye strong candidates hain taaki future runs safal hon.
- Jab aapko **exact segment** chahiye — filepath, line hint, source hash, aur full source text — apne repo mein sahi paragraph ko edit karne ke liye.

<a id="why-source-edits-matter"></a>
#### Source edits kyon mahatva rakhte hain

Dense inline markup (**bold** `` `code` `` ke saath mila hua, nested emphasis, kai spans ke saath lambe vakya) models ke liye aise translations wapas karna mushkil bana deta hai jo abhi bhi structural checks paas karte hain. **Multiple recorded failures** wale segments aam taur par source ko **rewriting ya splitting** (ya examples ko fenced code blocks mein le jaane) se zyada sudharte hain, bajaye unchanged text par translation ko dobara chalane ke. Yah [Complex Markdown and failed quality checks](#complex-markdown-and-failed-quality-checks) ke saath align karta hai.

<a id="how-to-use-the-tab"></a>
#### Tab ka upyog kaise karein

1. Dashboard mein **Failures** kholein (usi browser session mein jaisa ki [Translation Dashboard](#translation-dashboard) mein hai).
2. **Summary** strip padhein (kisi bhi failure wale segments, plus **1**, **2**, ya **3+** failure records wale segments ke liye counts).
3. Partial **filename**, **locale**, **model**, **quality error** (values aapke cache se aate hain), **fatal only**, aur optional **source hash**, **source text**, ya **error message** substring dwara filter karein—phir **Apply** par click karein.
4. **Sort: # Failures** (default) ya **Sort: filepath + line #** chunein.
5. Table ke upar ya neeche pagination ka upyog karein. Poora source text toggle karne ke liye **ek row par click karein**. Row mein link control (jab enable ho) server process ko `ai-i18n-tools dashboard` chal rahe **terminal** par file/line hints log karne ke liye kehta hai—browser se apne editor mein jump karne ke liye upyogi hai.
6. Apne project mein **source file** theek karein, phir se `translate-docs` ya `sync` chalayein. Agar safal run ke baad list **out of date** lagti hai, toh `ai-i18n-tools sync --force-update` chalayein aur dashboard ko reload karein (Failures panel wahi hint dikhata hai).

UI ke saath file-based debugging ke liye, aap abhi bhi retries ke dauran `cacheDir` ke tahat `FAILED-TRANSLATION` detail likhne ke liye `translate-docs --debug-failed` ka upyog kar sakte hain—[Cache behaviour aur `translate-docs` flags](#cache-behaviour-and-translate-docs-flags) dekhein.

<a id="markdown-issues-static-checks"></a>
### Markdown issues (static checks)

**Markdown issues** tab `markdown_source_issues` SQLite table se rows list karta hai. Har row ek **pre-translation** khoj hai: jaise delimiter runs jo kabhi bhi CommonMark-style rules ke tahat emphasis/strikethrough ke roop mein pair nahi karte hain jinhe `translate-docs` masking ke liye upyog karta hai, ek inline code span jo backticks ke saath khola gaya hai lekin kabhi band nahi kiya gaya hai, ya `STRONG_OUTSIDE_LINK` jab `**` / `__` ek `[text](url)` link ko wrap karte hain (bold ko kewal link text ke andar rakhein). Yeh **Failures** ke samaan **nahi** hai, jo per-locale model output aur post-translation validation problems (`AST mismatch`, placeholder leaks, aur is tarah ke) record karta hai.

Is tab ka upyog tab karein jab aap tokens kharch karne se pehle **source markdown** theek karna chahte hain—khaaskar jab quality checks structure par fail hote rehte hain. Filepath (cache key ke khilaaf partial match, jismein `doc-block:{index}:` prefixes shamil hain), **issue code**, ya **source hash** dwara filter karein; filepath + line ya newest scan time dwara sort karein. Link button terminal par file/line hints log karta hai jahan `ai-i18n-tools dashboard` chal raha hai (Documentation tab ke samaan idea).

**Panktiyon ko refresh karna:** `ai-i18n-tools check-markdown` chalaen (vaikalpik `-p` / `--path` scope, SQLite ko chhodne ke liye `--no-cache`, stderr par manav panktiyon ke saath stdout par machine-readable output ke liye `--json`). Default roop se har `translate-docs` markdown file run us file ke liye panktiyon ko bhi rescans aur replace karta hai jab `docs[].warnMarkdownSourceIssues` ko `false` par set nahin kiya jaata hai. Cache filepath ke liye sabhi translations ko clear karne se us filepath ke liye markdown issue panktiyan hat jaati hain, jo failures ke samaan cleanup path ka hissa hai. `cleanup` un markdown issue panktiyon ko atirikt roop se prunes karta hai jinka resolved source path disk par gayab hai, isliye delete kiye gaye ya rename kiye gaye files ke liye diagnostics (yahan tak ki ve jo kewal `check-markdown` dwara scan kiye gaye the, kabhi translate nahin kiye gaye) bane nahin rahte.
