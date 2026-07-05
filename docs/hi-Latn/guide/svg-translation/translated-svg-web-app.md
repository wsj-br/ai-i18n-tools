<a id="translated-svg-with-svgstyle--flat"></a>
# `svg.style = "flat"` ke saath anuvaadit SVG

Tab upyog karein jab ek web app locale-specific SVG illustrations ya diagrams ko embed karta hai aur runtime par unhe locale code dwara refer karta hai.

<a id="config"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` `images/` ke neeche har `.svg` ko padhta hai aur har locale ke liye ek file likhta hai:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### App reference

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Source layout ki sifarish

Source SVGs ko output directory se alag rakhein. `sourcePath: "images"` aur `outputDir: "public/assets"` ke saath dono directories alag-alag hain. Kabhi bhi dono ko ek hi directory par set na karein.

<a id="implementation-example"></a>
### Karyavanayan udaharan

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — `svg` block [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`) mein; source [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) ke antargat prati-locale outputs (jaise `translation_demo_svg.de.svg`); [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`) mein runtime URL.

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
