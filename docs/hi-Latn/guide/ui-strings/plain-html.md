<a id="plain-html-apps"></a>
# Sadharan HTML apps

<a id="marking-html-for-translation"></a>
## Anuvaad ke liye HTML ko chihnit karna

Sadharan HTML apps ke liye (markup mein `t("…")` calls ke bina), anuvaad yogya elements ko attributes se chinhit karen aur `extract` ko element se hi Angrezi text capture karne den — koi duplicate string literal nahin.

Sadharan roop ko tarjeeh den (attribute ka koi value nahin hota; source text element se padha jaata hai):

- `data-i18n` — key element ka `textContent` hai; runtime par aap `el.textContent = t(key)` set karte hain.
- `data-i18n-title` — key element ka `title` hai; runtime par aap anuvaadit `title` set karte hain.
- `data-i18n-placeholder` — key element ka `placeholder` hai.

Valued roop `data-i18n="Some key"` ka upyog kewal tab karen jab sadharan roop kaam na kar sake: mishrit-content elements (child tags ke saath interleave kiya gaya text), ya jab key dikhne wale text se alag honi chahiye. `data-i18n-ignore` ke saath kisi element (aur uske subtree) ko opt out karen.

Badhyata: sadharan `data-i18n` kewal leaf text elements ke liye hai (ek akela text node, koi child element nahin), kyunki `textContent` set karne se koi bhi children replace ho jaate hain. `Run <code>build</code> now.` jaise paragraph ke liye, har text run ko uske apne marker mein wrap karen:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Markers ko haath se joden, ya `mark-html` command ko sadharan markers aapke liye insert karne den. Yah default roop se ek dry run hai — yah batata hai ki yah prati file kitne markers jodega aur mishrit-content elements ki soochi deta hai jinhe manual `<span data-i18n>` ki zaroorat hai — aur kewal `--write` ke saath likhta hai:

```bash
# Preview (no changes written)
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
```

`mark-html` idempotent hai, `data-i18n-ignore` ka sammaan karta hai, kabhi bhi code-jaise elements (`code`, `pre`, `kbd`, `samp`, `var`) ya khali / kewal sankhyatmak text ko mark nahin karta hai, aur kabhi bhi valued marker emit nahin karta hai. Marking ke baad, haath se report kiye gaye mishrit-content fragments ko wrap karen, phir `.html` ko `ui.uiExtractor.extensions` mein joden taaki `extract` strings capture kar sake:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app"></a>
## Ek udaharan: ek saadhaaran HTML app ko sthaaneeya banaana

`examples/plain-html` (https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) workspace udaharan ek chalne yogya static app hai jo in markers ka ant tak upyog karta hai. Ise `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` ke saath clone karein, `pnpm install` aur `pnpm dev` chalaayein, phir Portuguese (Brazil) ke liye [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) kholein.

Iska `public/index.html` is tarah ke nange markers rakhta hai:

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json` `public/` par extraction nirdeshit karta hai aur static files ke bagal mein flat bundles likhta hai:

```jsonc
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

`extract` har English source string ko catalog (`public/strings.json`) mein likhta hai, aur `translate-ui` har locale ke liye ek flat bundle bharta hai, jise English source text dwara key kiya jaata hai:

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

Runtime par, `public/app.js` locale metadata ke liye `/locales/ui-languages.json` load karta hai, active locale (`?locale=` → `localStorage` → browser → `en`) ko resolve karta hai, `/locales/{locale}.json` fetch karta hai (English ke liye chhoda gaya), phir marked elements ko walk karta hai. Key marker value se aati hai jab maujood ho, anyatha element ke apne text / title / placeholder se (usi tarah normalize kiya gaya jaise extractor whitespace ko normalize karta hai):

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText` [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) mein `normalizeI18nText` ke samaan rehna chahiye. Kyunki English source text catalog key hai, anuvaadit strings swatah English mein wapas aa jaati hain.

Bundled [Translation Dashboard](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) apne HTML markers ke liye wahi `applyStaticI18n` algorithm ka upyog karta hai, lekin static `/locales/{locale}.json` files ke bajaye `GET /api/ui-i18n` se locale bundles serve karta hai. Poore workflow, project layout, aur tulna talika ke liye udaharan ka [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) dekhein.
