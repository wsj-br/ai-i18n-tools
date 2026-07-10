<a id="shared-raster"></a>
# Saajha raster

Iska upyog tab karein jab ek hi image sabhi locales mein saajha ki jaati hai (prati-locale variant nahi). Jab `docsOutput.style = "flat"`, flat link rewriter har output file ke liye depth prefix ki ganna karta hai, isliye source file ke bagal mein ek asset (jaise `docs/figure.png` ko `docs/page.md` se `figure.png` ke roop mein sandarbhit kiya gaya hai) har anuvadit output mein sahi dhang se hal ho jaata hai — kisi `postProcessing.regexAdjustments` niyam ki avashyakta nahi hai.

Udaaharan: ek project `docs/guide/quick-start.md` ko `translated-docs/docs/guide/quick-start.<locale>.md` mein anuvaad karta hai. Ek sibling image `docs/translation-dashboard.png` ko `quick-start.md` se `../translation-dashboard.png` ke roop mein sandarbhit kiya gaya hai. Rewriter output file ki directory se source directory (`../../docs/`) tak prat-file prefix ki ganana karta hai, jisse `../../docs/translation-dashboard.png` utpann hota hai. `translated-docs/docs/guide/` se, yah sahi tarike se `docs/translation-dashboard.png` par wapas resolve hota hai.

Ek `postProcessing` niyam ki abhi bhi avashyakta hai jab:
- Asset ko ek absolute URL (jaise `/img/figure.png`) ke madhyam se sandarbhit kiya gaya hai — rewriter kewal relative paths ko handle karta hai
- Aap anya kaaranon se asset URL badalna chahte hain (jaise CDN par switch karna)

<a id="implementation-example"></a>
### Karyavanayan udaharan

Is repository ke apne docs shared images ke absolute-URL variant ka upyog karte hain: [Translation Dashboard guide](/hi-Latn/guide/translation-dashboard/) apne screenshot ko `![Translation Dashboard](/translation-dashboard.png)` ke roop mein sandarbhit karta hai — ek absolute, site-root path jo [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) se serve kiya gaya hai. Kyunki URL har locale ke liye ek jaisa hai, kisi `postProcessing.regexAdjustments` niyam ki aavashyakta nahin hai; jab dashboard UI badalta hai to [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) ke saath PNG ko refresh karein.
