<a id="colocated-translated-svg-doc-system"></a>
# Colocated translated SVG (doc-system)

Doc-system sites ke liye upyog karein jahan anuvadit SVG illustrations har locale ki content directory mein anuvadit docs ke saath dikhne chahiye — [colocated screenshots](/hi-Latn/guide/images-and-screenshots/colocated-screenshots) ke samaan location par. Docusaurus preset mukhya udaharan hai.

<a id="config"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` har locale ke liye ek SVG ko usi `current/assets/` directory mein likhta hai jise colocated screenshots PNGs ke liye upyog karte hain:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Source markdown

Sabhi locales mein sabhi docs ek hi relative path ka upyog karte hain:

```markdown
![Diagram](../assets/diagram.svg)
```

English locale ke liye symlink `docs/assets → ../static/assets` ise resolve karta hai. Translated locales ke liye yeh seedhe `current/assets/` par resolve hota hai.

Koi `regexAdjustments` rule ki zaroorat nahi hai kyunki English source docs aur translated output docs ek jaise paths ka upyog karte hain.

<a id="svg-source-location"></a>
### SVG srot sthan

Anushansit: srot SVG ko `documentation/static/assets/` mein en-GB PNG ke saath store karein. Yah sabhi dastaavej sampattiyon ko ek jagah rakhta hai, aur vahi `docs/assets` symlink donon ko cover karta hai. Tab `svg.sourcePath` pravishtiyaan `documentation/static/assets/name.svg` ki or ishara karti hain.

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` pleesholdar

| Pleesholdar              | Maan                                                   |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` ka absolyut hal kiya gaya path              |
| `{locale}`               | Lakshay sthaaneey kod                                     |
| `{LOCALE}`               | Sthaaneey kod bade aksharon mein                                  |
| `{relPath}`              | `sourcePath` root se srot SVG tak saapeksh path |
| `{stem}`                 | Bina ekstension ke failnaam                             |
| `{basename}`             | Ekstension ke saath failnaam                                |
| `{extension}`            | Bindu sahit ekstension                                |
| `{relativeToSourceRoot}` | Nikatatam `sourcePath` root se saapeksh path       |

[svg configuration table](/hi-Latn/reference/configuration#svg) mein poora reference.

<a id="implementation-example"></a>
### Karyavanayan udaharan

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) mein `pathTemplate` ke saath nested `svg` block; `documentation/static/assets/` mein source SVGs (jaise [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/assets/duplistatus_toolbar.svg)); `translate-svg` colocated PNGs ke bagal mein `documentation/i18n/<locale>/…/current/assets/` mein har-locale files likhta hai; docs unhein `../assets/` paths (jaise [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)) ke maadhyam se embed karte hain, bina kisi `regexAdjustments` bridge ki zaroorat ke.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
