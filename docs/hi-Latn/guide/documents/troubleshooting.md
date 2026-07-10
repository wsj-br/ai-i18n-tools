<a id="troubleshooting"></a>
# Samasya ka nivaran

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## Anuvadit dastavezon mein section anchor link kaam nahi karte hain

`[label](other.md#section-id)` jaisa link sahi anuvadit file khol sakta hai lekin nirdharit heading tak scroll karne mein vifal ho sakta hai — ya galat section par jump kar sakta hai. `#…` fragment ab us locale mein kisi bhi heading `id` se mel nahi khata hai.

Aam kaaran:

- Source headings mein kabhi bhi explicit anchor IDs nahi the; site visible heading text se slugs nikaalti hai, jo translation ke baad badal jaate hain.
- Aapne source mein ek heading ka naam badal diya hai lekin pichli `<a id="…"></a>` line gayab hai ya abhi bhi usmein purana ID hai.
- Anchor links English shabdon se anumaanit `#…` fragment ka upyog karte hain, na ki us ID ka jo `write-heading-ids` generate karega.

**Theek karein**

1. Apne **source** `ai-i18n-tools write-heading-ids` / `.md` par `.mdx` chalayein (vahi `docs[]` / `contentPaths` jaisa `translate-docs`). Yeh har ATX heading se pehle `<a id="slug"></a>` daalta hai, ya maujooda anchor ko refresh karta hai jab heading text ab current slug se mail nahi khata.
2. Anchor links ko un ids par point karein — jaise `[setup](guide.md#first-run)` jahan `#first-run` target heading ke upar wale anchor line se mail khata hai, na ki sirf English title se anumaanit slug se.
3. `translate-docs` (ya `sync --force-update`) ko phir se chalayein taaki har locale copy mein updated anchor lines shamil hon.

Parivartanon ka purvavalokan karne ke liye pahle `--dry-run` ko `write-heading-ids` par upyog karein. Poore pattern ke liye [Anchor links](/hi-Latn/guide/documents/anchor-links) dekhein.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Anuvaadit docs mein image ya asset links 404

Ek markdown link ya `![alt](url)` English mein kaam karta hai lekin anuvaadit copies mein 404 return karta hai — aksar isliye kyuki URL abhi bhi source-locale folder ya English-only static path par point karta hai.

**Theek karein**

1. Pustak karein ki aapka asset layout aapke `docsOutput.style` (flat vs doc-system) se mel khata hai. [Link rewriting](/hi-Latn/guide/documents/link-rewriting) aur [Images & Screenshots](/hi-Latn/guide/images-and-screenshots/) dekhein.
2. Locale segments ko swap karne ya absolute `/img/…` paths ko bridge karne ke liye `docsOutput.postProcessing.regexAdjustments` jodein ya adjust karein. Flat layout ke liye, yaad rakhein ki flat link rewriter `regexAdjustments` se **pehle** chalta hai — pehle se prefixed URL ke khilaaf patterns ka milaan karein.
3. Sunishchit karein ki locale-specific asset files un paths par maujood hain jinhe rewritten markdown references karta hai (`translate-docs` URLs ko rewrite karta hai lekin raster files ko copy nahi karta).
