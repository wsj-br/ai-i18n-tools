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

Parivartanon ka purvavalokan karne ke liye pahle `--dry-run` ko `write-heading-ids` par upyog karein. Poore pattern ke liye [Anchor links](/guide/documents/anchor-links) dekhein.
