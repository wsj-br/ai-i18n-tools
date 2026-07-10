<a id="anchor-links"></a>
# Anchor links

Jab `docsOutput.style = "flat"`, tai output mein **sāpak path** ko har locale ke liye (`guide.md` → `guide.de.md`) phir likha jāta hai. **Anchor links** — samān markdown inline form jisme path ke baad ek `#` hota hai — target file ke andar ek section tak jump karte hain:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Yahan link target `setup.md` hai, aur `#first-run` anchor hai: yeh us file ke andar sahi heading par scroll karna chahiye.

<a id="why-anchor-links-need-attention"></a>
## Anchor links ko dhyan ki zaroorat kyon hai

- `rewriteRelativeLinks` har locale ke liye **filename** ko fix karta hai (`setup.md` → `setup.de.md`).
- Bahut se renderers **visible heading text** se `#` slug derive karte hain. Anuvad ke baad, headings har locale mein alag hoti hain, isliye auto-generated slug badal sakti hai jabki rewritten link abhi bhi `#first-run` keh sakti hai — ya aapka English `#…` anchor ab slug se match nahi karta jo renderer ne translated heading se banaya hai.
- Natija: pathak sahi **file** par pahunchte hain lekin galat **line** par, ya browser ko koi matching heading nahi milti.

<a id="what-to-do"></a>
## Kya karein

1. Ap `ai-i18n-tools write-heading-ids` ko aapke source `.md` / `.mdx` par chalayein `translate-docs` se pehle (wahi `docs[]` / `contentPaths` jaise ki hamesha). Yah heading ke upar ki rekha par satah HTML anchors daalta hai taaki `id` ke mulya har anuvaadit prati ke saath saajha kiye jaayein. Heading ke naam badalne ke baad isey phir se chalayein taaki purane anchor ids ko vartaman shirshak ke anuroop taja kiya ja sake.
2. Apne markdown **anchor links** ko un sthir ids par nishit karein, jaise ki `[label](other.md#section-id)`, jahaan `section-id` tool dwara likhe gaye anchor ke anuroop hota hai — keval angrezi shabdon se anumaan lagaane ke bajaye.

<a id="example"></a>
## Udaharan

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` ke baad `write-heading-ids` (simplified):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

`translate-docs` ke baad, file paths aur `#…` anchors har locale file mein aligned rehte hain, jaise:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

Yeh `#tls-configuration` anchor sabhi locales mein same hai kyunki `id` source mein fixed hai; keval heading **text** aur link **label** ko translate kiya jata hai.

Yadi anuvad ke baad bhi links kaam nahi karte hain, to [Troubleshooting](/hi-Latn/guide/documents/troubleshooting) dekhein.
