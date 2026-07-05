<a id="failures-document-translation"></a>
# Asafaltaen (dastaavez anuvaad)

**Asafaltaen** tab keval **dastaavez** anuvaad ke liye hai. Yah un asafalta record ko padhta hai jo SQLite mein likhe gaye the jab ek segment ko kisi locale ke liye safaltapoorvak anuvaad nahin kiya ja saka tha — udaaharan ke liye khaali ya avaidd model output, anuvaad ke baad ke pramaanikaran trutiyan (`AST mismatch`, placeholder leaks, aur samaan **gunavatta** jaanch), ya ek **ghatak** sthiti jisne pragati ko avruddh kar diya.

Yah aapko jawaab dene mein madad karta hai: *kaun sa srot segment toot gaya, kis locale aur model ke liye, aur kya truti paath record kiya gaya tha?*

<a id="when-to-use-it"></a>
## Iska upyog kab karen

- Jab `translate-docs` ya `sync` trutiyon, aashik locale, ya bhramit logs ke saath samaapt hota hai — keval terminal output ko scroll karne ke bajaay asafaltaon ko sort aur filter karen.
- Jab aap **punah kaam ko praathamikta dena** chahte hain: **# Asafaltaen** dwara sort karen taaki ve segment jo kai baar punah prayason mein asafal rahe, pehle dikhai den; ve srot markdown mein **saral banane ya punah format karne** ke liye majboot ummeedvaar hain.
- Jab aapko **sateek segment** ki aavashyakta ho — filepath, line hint, srot hash, aur poora srot paath — apne repo mein sahi paragraph ko edit karne ke liye.

<a id="why-source-edits-matter"></a>
## Srot sampadan kyon mahatvapurna hain

Ghanatvapoorn inline markup (**bold** `` `code` `` ke saath mila hua, nested emphasis, kai spans ke saath lambe vaakya) model ke liye aise anuvaad laana mushkil bana deta hai jo abhi bhi sanrachnatmak jaanch paas karte hain. **Kai record ki gayi asafaltaon** wale segment aam taur par srot ko **phir se likhne ya vibhajit karne** (ya udaaharanon ko fenced code blocks mein le jaane) se zyada sudharte hain, bajaye iske ki aparivartit paath par anuvaad ko phir se chalaya jaaye. Yah [Complex Markdown and failed quality checks](/guide/documents/#complex-markdown-and-failed-quality-checks) ke anuroop hai.

<a id="how-to-use-the-tab"></a>
## Tab ka upyog kaise karen

1. Dashboard mein **Asafaltaen** kholein.
2. **Saraansh** strip padhen — kisi bhi asafalta wale segment, plus **1**, **2**, ya **3+** asafalta record wale segment ke liye ginti.
3. Aashik **filename**, **locale**, **model**, **quality error** (maan aapke cache se aate hain), **keval ghatak**, aur vaikalpik **source hash**, **source text**, ya **error message** substring dwara filter karen — phir **Apply** par click karen.
4. **Sort: # Asafaltaen** (default) ya **Sort: filepath + line #** chunein.
5. Table ke sheersh ya neeche pagination ka upyog karen. Poora srot paath vistaar karne ke liye **ek row par click karen**. **Model** column asafalta model dikhata hai aur, jab uplabdh ho, baad ke safal cache entry se model dikhata hai.
6. 🔗 link control logs file/line hints ko **terminal** mein jahan `ai-i18n-tools dashboard` chal raha hai, karta hai.
7. Apne project mein **srot file** ko theek karen, phir `translate-docs` ya `sync` ko phir se chalaen. Yadi safal run ke baad soochi **purani** lagti hai, to `ai-i18n-tools sync --force-update` chalaen aur dashboard ko phir se load karen.

UI ke saath file-based debugging ke liye, retries ke dauraan `cacheDir` ke tahat `FAILED-TRANSLATION` detail likhne ke liye `translate-docs --debug-failed` ka upyog karen — [Cache behaviour and `translate-docs` flags](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) dekhen.

<a id="failures-vs-markdown-issues"></a>
## Asafaltaen vs Markdown samasyaen

| | **Asafaltaen** | **Markdown samasyaen** |
| --- | --- | --- |
| Kab record ki gayi | Anuvaad ke dauraan (prati locale) | Anuvaad se pehle (srot scan) |
| Aam kaaran | Kharab model output, pramaanikaran trutiyan | Anpaired emphasis, unclosed code spans, links ke bahar bold |
| Theek karen | Srot sampadit karen aur phir se anuvaad karen | Srot markdown theek karen, phir phir se anuvaad karen |

Pre-translation static checks ke liye [Markdown issues](/guide/translation-dashboard/markdown-issues) dekhen.
