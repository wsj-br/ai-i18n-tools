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
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## Udaharan: ek sadharan HTML app (bundled dashboard) ka sthanikaran

Package ka Translation Dashboard (`src/dashboard-app`) yahi markers istemaal karta hai. Iska `index.html` aise bare markers rakhta hai:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` har English source string ko catalog (`strings.json`) mein likhta hai, aur `translate-ui` har locale ke liye ek flat bundle bharta hai, jiska key English source text hota hai. Ek typical static HTML app ke liye aap `ui.flatOutputDir` ko web-served directory jaise `public/locales/` par point karenge:

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

Runtime par, sakriya locale ke liye bundle load karen aur marked elements ko walk karen. Key marker value se aati hai jab maujood ho, anyatha element ke apne text / title / placeholder se (usi tarah normalize kiya gaya jaise extractor whitespace normalize karta hai):

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

Is snippet ka marker-walking aadha hissa [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js) mein bilkul `applyStaticI18n` hai. Kyunki angrezi mool paath catalog key hai, anuvaadit string swatah angrezi mein wapas aa jaati hain.

Bundled dashboard kaise alag hai: kyunki ismein ek Node server hai, yah ek static `/locales/{locale}.json` fetch nahin karta hai. Client `GET /api/ui-i18n` ko call karta hai, aur server active locale (`--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > host OS) ko resolve karta hai aur `{ locale, dir, bundle }` wapas karta hai. Client phir `document.documentElement` `lang`/`dir` ko us response se set karta hai (locale chunne ke liye `lang` padhne ke bajaye) `applyStaticI18n` ko call karne se pehle. Bundles khud tool ki anuvaad ke antargat content nahin hain — ve dashboard ki apni UI strings hain, jo `src/i18n/locales/{locale}.json` mein bheji jaati hain (build par `dist/i18n/locales` mein copy ki jaati hain) aur server-side par `loadUiBundle` dwara [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts) mein padhi jaati hain. Dashboard ka `t()` bhi ```{{name}}``` interpolation ka samarthan karta hai, upar diye gaye minimal `t` ke vipreet.
