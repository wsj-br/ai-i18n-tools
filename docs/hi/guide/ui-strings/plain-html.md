<a id="plain-html-apps"></a>
# सामान्य HTML ऐप

<a id="marking-html-for-translation"></a>
## अनुवाद के लिए HTML को चिह्नित करना

सामान्य HTML ऐप्स के लिए (मार्कअप में कोई `t("…")` कॉल नहीं), अनुवाद योग्य तत्वों को एट्रिब्यूट के साथ चिह्नित करें और `extract` को तत्व से अंग्रेजी टेक्स्ट कैप्चर करने दें — कोई डुप्लिकेट स्ट्रिंग लिटरल नहीं।

नंगे रूप को प्राथमिकता दें (एट्रिब्यूट का कोई मान नहीं है; स्रोत टेक्स्ट तत्व से पढ़ा जाता है):

- `data-i18n` — कुंजी तत्व का `textContent` है; रनटाइम पर आप `el.textContent = t(key)` सेट करते हैं।
- `data-i18n-title` — कुंजी तत्व का `title` है; रनटाइम पर आप अनुवादित `title` सेट करते हैं।
- `data-i18n-placeholder` — कुंजी तत्व का `placeholder` है।

मान वाले फ़ॉर्म `data-i18n="Some key"` का उपयोग तभी करें जब नंगे फ़ॉर्म काम न कर सके: मिश्रित-सामग्री वाले तत्व (चाइल्ड टैग के साथ टेक्स्ट इंटरलीव्ड), या जब कुंजी दृश्यमान टेक्स्ट से भिन्न होनी चाहिए। `data-i18n-ignore` के साथ एक तत्व (और उसके सबट्री) को ऑप्ट आउट करें।

बाधा: नंगे `data-i18n` केवल लीफ टेक्स्ट तत्वों के लिए है (एक एकल टेक्स्ट नोड, कोई चाइल्ड तत्व नहीं), क्योंकि `textContent` सेट करने से कोई भी चाइल्ड बदल जाता है। `Run <code>build</code> now.` जैसे पैराग्राफ के लिए, प्रत्येक टेक्स्ट रन को उसके अपने मार्कर में लपेटें:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

मार्कर हाथ से जोड़ें, या `mark-html` कमांड को आपके लिए नंगे मार्कर डालने दें। यह डिफ़ॉल्ट रूप से एक ड्राई रन है — यह रिपोर्ट करता है कि यह प्रति फ़ाइल कितने मार्कर जोड़ेगा और किसी भी मिश्रित-सामग्री वाले तत्वों को सूचीबद्ध करता है जिन्हें मैन्युअल `<span data-i18n>` की आवश्यकता है — और केवल `--write` के साथ लिखता है:

```bash
# Preview (no changes written)
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
```

`mark-html` आइडम्पोटेंट है, `data-i18n-ignore` का सम्मान करता है, कभी भी कोड-जैसे तत्वों (`code`, `pre`, `kbd`, `samp`, `var`) या खाली / केवल-संख्यात्मक टेक्स्ट को चिह्नित नहीं करता है, और कभी भी मान वाला मार्कर उत्सर्जित नहीं करता है। चिह्नित करने के बाद, किसी भी रिपोर्ट किए गए मिश्रित-सामग्री वाले टुकड़ों को हाथ से लपेटें, फिर `.html` को `ui.uiExtractor.extensions` में जोड़ें ताकि `extract` स्ट्रिंग को कैप्चर कर सके:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app"></a>
## किया गया उदाहरण: एक सामान्य HTML ऐप का स्थानीयकरण करना

[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) वर्कस्पेस उदाहरण एक चलाने योग्य स्टैटिक ऐप है जो इन मार्करों का एंड-टू-एंड उपयोग करता है। इसे `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` के साथ क्लोन करें, `pnpm install` और `pnpm dev` चलाएं, फिर पुर्तगाली (ब्राजील) के लिए [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) खोलें।

इसका `public/index.html` नंगे मार्कर रखता है जैसे:

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

`ai-i18n-tools.config.json` `public/` पर निष्कर्षण को इंगित करता है और स्टैटिक फ़ाइलों के बगल में फ्लैट बंडल लिखता है:

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

`extract` प्रत्येक अंग्रेजी स्रोत स्ट्रिंग को कैटलॉग (`public/strings.json`) में लिखता है, और `translate-ui` प्रति लोकेल एक फ्लैट बंडल भरता है, जिसे अंग्रेजी स्रोत टेक्स्ट द्वारा कुंजीबद्ध किया जाता है:

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

रनटाइम पर, `public/app.js` लोकेल मेटाडेटा के लिए `/locales/ui-languages.json` लोड करता है, सक्रिय लोकेल (`?locale=` → `localStorage` → ब्राउज़र → `en`) को हल करता है, `/locales/{locale}.json` (अंग्रेजी के लिए छोड़ दिया गया) प्राप्त करता है, फिर चिह्नित तत्वों को चलता है। कुंजी मार्कर मान से आती है जब मौजूद हो, अन्यथा तत्व के अपने टेक्स्ट / शीर्षक / प्लेसहोल्डर से (उसी तरह सामान्यीकृत किया जाता है जैसे एक्सट्रैक्टर व्हाइटस्पेस को सामान्यीकृत करता है):

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

[`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) में `normalizeI18nText` `normalizeI18nText` के समान रहना चाहिए। क्योंकि अंग्रेजी स्रोत टेक्स्ट कैटलॉग कुंजी है, अनूदित स्ट्रिंग स्वचालित रूप से अंग्रेजी में वापस आ जाती हैं।

बंडल किया गया [अनुवाद डैशबोर्ड](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) अपने HTML मार्करों के लिए समान `applyStaticI18n` एल्गोरिथम का उपयोग करता है, लेकिन स्टैटिक `/locales/{locale}.json` फ़ाइलों के बजाय `GET /api/ui-i18n` से लोकेल बंडल प्रदान करता है। पूर्ण वर्कफ़्लो, प्रोजेक्ट लेआउट और तुलना तालिका के लिए उदाहरण का [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) देखें।
