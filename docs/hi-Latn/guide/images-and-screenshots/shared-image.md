<a id="shared-raster"></a>
# Saajha raster

Tab istemal karein jab ek single image sabhi locales mein share ki jaati hai (prati-locale variant nahi).

- **`docsOutput.style = "flat"`** — flat link rewriter har output file ke liye depth prefix compute karta hai, isliye source file ke bagal mein ek relative asset (jaise `docs/figure.png` ko `docs/page.md` se `figure.png` ke roop mein reference kiya gaya hai) har translated output mein sahi dhang se resolve hota hai — kisi `postProcessing.regexAdjustments` rule ki zaroorat nahi hai. Jab source files subdirectories mein hote hain, to `flatPreserveRelativeDir: true` enable karein taaki output paths source tree ko preserve karein (dekhein [Per-file depth prefix](/hi-Latn/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)).
- **`docsOutput.style = "vitepress"`** (aur link normalizer ke saath anya doc-system presets) — site-root absolute paths jaise `/translation-dashboard.png` ko tab tak unchanged chhod diya jaata hai jab tak URL har locale mein identical ho — kisi `regexAdjustments` rule ki zaroorat nahi hai.

**Flat example:** ek project `docs/guide/quick-start.md` ko `translated-docs/docs/guide/quick-start.<locale>.md` mein translate karta hai. Yeh maanta hai ki `flatPreserveRelativeDir: true` hai taaki `docs/guide/quick-start.md` `translated-docs/docs/guide/quick-start.<locale>.md` mein output kare (na ki `translated-docs/quick-start.<locale>.md`). Ek sibling image `docs/translation-dashboard.png` ko `quick-start.md` se `../translation-dashboard.png` ke roop mein reference kiya gaya hai. Rewriter output file ki directory se source directory (`../../docs/`) tak per-file prefix compute karta hai, jisse `../../docs/translation-dashboard.png` banta hai. `translated-docs/docs/guide/` se, yeh sahi dhang se `docs/translation-dashboard.png` tak resolve hota hai.

Ek `postProcessing` rule ki abhi bhi zaroorat hai jab:
- Asset ko **`docsOutput.style = "flat"`** mein ek absolute URL ke madhyam se reference kiya gaya hai (jaise `/img/figure.png`) — flat rewriter kewal relative paths ko handle karta hai
- Aap anya kaaranon se asset URL ko badalna chahte hain (jaise CDN par switch karna)

<a id="implementation-example"></a>
### Karyavanayan udaharan

Is repository ke apne docs shared images ke absolute-URL variant ka upyog karte hain: [Translation Dashboard guide](/hi-Latn/guide/translation-dashboard/) apne screenshot ko `![Translation Dashboard](/translation-dashboard.png)` ke roop mein reference karta hai — ek absolute, site-root path jo [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) se serve kiya jaata hai. Kyunki URL har locale ke liye identical hai, isliye kisi `postProcessing.regexAdjustments` rule ki zaroorat nahi hai.
