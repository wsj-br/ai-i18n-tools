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

<a id="docusaurus-sites-preferred"></a>
### Docusaurus sites (pasandida)

[Docusaurus](/hi-Latn/guide/integrations/docusaurus) documentation (`docsOutput.style = "docusaurus"`) par, Docusaurus ke native heading IDs ko `ai-i18n-tools write-heading-ids` ke bajay pasand karein:

1. Docusaurus ke `{#…}` suffix ke saath heading line par ek explicit id jodein, jaise `## TLS configuration {#tls-configuration}`. `translate-docs` ke dauran, keval dikhne wala heading text translate hota hai — `{#tls-configuration}` suffix har locale mein surakshit rehta hai.
2. Apne Docusaurus project root se `docusaurus write-heading-ids` chalayein (aksar `pnpm run write-heading-ids` jab `package.json` mein wired ho) un headings par `{#…}` suffixes jodne ya refresh karne ke liye jinmein ve nahi hain. Headings ka naam badalne ke baad phir se chalayein taaki stale ids vartaman titles se mel kha sakein.

Apne markdown **anchor links** ko un stable ids par point karein, jaise `[label](other.md#tls-configuration)`, jahan fragment `{#…}` suffix se mel khata hai — na ki sirf English shabdon se anumanit slug. Is pattern ka upyog karne wale committed docs ke liye [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) dekhein.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### Anya layout (flat, Starlight, VitePress, aadi)

Jab aap Docusaurus par nahi hain, ya aapko `{#…}` suffixes ke bajay HTML anchors ki zaroorat hai:

1. Ap `ai-i18n-tools write-heading-ids` ko aapke source `.md` / `.mdx` par chalayein `translate-docs` se pehle (wahi `docs[]` / `contentPaths` jaise ki hamesha). Yah heading ke upar ki rekha par satah HTML anchors daalta hai taaki `id` ke mulya har anuvaadit prati ke saath saajha kiye jaayein. Heading ke naam badalne ke baad isey phir se chalayein taaki purane anchor ids ko vartaman shirshak ke anuroop taja kiya ja sake.
2. Apne markdown **anchor links** ko un sthir ids par nishit karein, jaise ki `[label](other.md#section-id)`, jahaan `section-id` tool dwara likhe gaye anchor ke anuroop hota hai — keval angrezi shabdon se anumaan lagaane ke bajaye.

<a id="example"></a>
## Udaharan

<a id="example-docusaurus"></a>
### Docusaurus `{#…}` suffix

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (English source):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

`translate-docs` ke baad, link fragment har locale mein `#tls-configuration` rehta hai; keval heading text aur link label badalte hain:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML anchors (`write-heading-ids`)

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
