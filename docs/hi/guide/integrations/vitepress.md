<a id="vitepress-integration"></a>
# VitePress एकीकरण

[VitePress](https://vitepress.dev/) दस्तावेज़ साइटों के लिए `init -t ui-vitepress` और `docsOutput.style: "vitepress"` का उपयोग करें। प्रीसेट एक खाली `localeSubpath` और BCP-47 लोकेल फ़ोल्डर नामों के साथ `doc-system` के लिए एक उपनाम है (`localePathLowercase` डिफ़ॉल्ट रूप से `false` है, इसलिए फ़ोल्डर `pt-BR`, `zh-Hans`, आदि रहते हैं)।

[दस्तावेज़](/hi/guide/documents/) और चलाने योग्य [उदाहरण/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) डेमो भी देखें। `docs/` के तहत इस रिपॉजिटरी की अपनी दस्तावेज़ साइट एक पूर्ण VitePress + ai-i18n-tools संदर्भ है (नौ लोकेल, थीम कैटलॉग, GitHub पेज)।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

जब आप एक `sync` रन में पृष्ठ सामग्री और VitePress क्रोम स्ट्रिंग का अनुवाद करते हैं तो `features.translateDocs` सक्षम करें।

<a id="page-layout"></a>
## पेज लेआउट

अंग्रेजी मार्कडाउन VitePress सामग्री रूट (आमतौर पर `docs/`) पर रहता है। अनुवादित प्रतियां स्रोत ट्री के बगल में लिखी जाती हैं:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

एक `docs[]` ब्लॉक कॉन्फ़िगर करें:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

अपने अंग्रेजी `.md` फ़ाइलों और निर्देशिकाओं पर `contentPaths` इंगित करें। `docsRoot` को उसी फ़ोल्डर पर सेट करें जिसे VitePress अपनी सामग्री रूट के रूप में उपयोग करता है।

VitePress [अंतर्राष्ट्रीयकरण](https://vitepress.dev/guide/i18n) को वायर करें: `root` पर अंग्रेजी, `locales[code].link` के तहत प्रत्येक लक्ष्य लोकेल (उदाहरण के लिए `/pt-BR/`)। `ai-i18n-tools.config.json` में `targetLocales` को `.vitepress/config.mts` में `locales` कुंजियों के साथ संरेखित रखें।

<a id="theme-strings"></a>
## थीम स्ट्रिंग्स

VitePress नेविगेशन, साइडबार, फुटर, खोज प्लेसहोल्डर और अन्य `themeConfig` लेबल मार्कडाउन से निकाले नहीं जाते हैं। **`docsOutput.vitepressThemeCatalog`** को कॉन्फ़िगर करें ताकि **`translate-docs`** `.vitepress/config.mts` से अंग्रेजी कैटलॉग को बूटस्ट्रैप करे (जब स्ट्रिंग इनलाइन हों) और लोकेल थीम JSON फ़ाइलों का अनुवाद करे:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — जेनरेट किया गया अंग्रेजी नेस्टेड JSON (बूटस्ट्रैप आउटपुट)। लेखक इस फ़ाइल को हाथ से तब तक बनाए नहीं रखते हैं जब तक अंग्रेजी `config.mts` में रहती है; इसे रीफ्रेश करने के लिए `sync` को फिर से चलाएं।
- **`outputPathTemplate`** (वैकल्पिक) — प्रति-लोकेल आउटपुट; डिफ़ॉल्ट: `theme.{locale}.json` के साथ `catalogPath` के समान निर्देशिका।

`init -t ui-vitepress` स्टार्टर `docs/.vitepress/config.mts` और `docs/.vitepress/i18n/theme.en.json` को भी स्कैफोल्ड करता है जब वे फ़ाइलें अभी तक मौजूद नहीं होती हैं। कॉन्फ़िग `loadTheme()` के माध्यम से कैटलॉग लोड करता है और `themeConfigFor()` में मानक VitePress i18n लेबल (`langMenuLabel` सहित) को वायर करता है।

`.vitepress/config.mts` में प्रति-लोकेल फ़ाइल को `loadTheme()` के माध्यम से लोड करें और अनुवादित JSON से `locales[code].themeConfig` बनाएं। [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) देखें।

**भाषा मेनू स्ट्रिंग:** `locales[code].label` ड्रॉपडाउन में प्रत्येक भाषा का दृश्यमान नाम है (उदाहरण के लिए `Português (Brasil)`)। `themeConfig.langMenuLabel` भाषा-स्विचर बटन पर **aria-label** है (VitePress डिफ़ॉल्ट: `Change language`)। `langMenuLabel` को थीम कैटलॉग में रखें और `themeConfigFor()` के अंदर `langMenuLabel: t.langMenuLabel` को वायर करें — इसे प्रति-लोकेल `label` स्ट्रिंग के साथ भ्रमित न करें।

`sync` / `translate-docs` के दौरान, ai-i18n-tools चेतावनी देता है जब `theme.en.json` में एक कैटलॉग कुंजी `config.mts` से संदर्भित नहीं होती है (उदाहरण के लिए `themeConfigFor()` में एक गुम `t.langMenuLabel`)।

VitePress थीम स्ट्रिंग के लिए `json[]` का उपयोग **न करें** — वह पैटर्न केवल असंबंधित ऐप लोकेल बंडलों के लिए है।

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## config.mts को जेनरेटेड थीम JSON से वायर करें (एक बार)

`vitepressThemeCatalog` के साथ पहले सफल `i18n:sync` / `translate-docs` रन के बाद, रेपो ने `theme.en.json` और `theme.{locale}.json` जेनरेट किए हैं, लेकिन एक **मौजूदा** साइट में अभी भी `config.mts` में हार्डकोडेड `text:` / `message:` स्ट्रिंग हो सकती हैं। VitePress अनुवादित JSON का उपयोग तब तक नहीं करेगा जब तक कॉन्फ़िग इसे `loadTheme()` के माध्यम से लोड नहीं करता।

**टूल स्कोप में नहीं:** स्वचालित कोडमॉड। प्रति प्रोजेक्ट एक बार नीचे दिए गए प्रॉम्प्ट का उपयोग करें (या उदाहरण कॉन्फ़िग का उपयोग करके मैन्युअल रूप से रीफैक्टर करें)।

1. **कब** — पहले सिंक ने `catalogPath` और लोकेल थीम फ़ाइलें बनाईं; dev/build में अनुवादित नेविगेशन/साइडबार की अपेक्षा करने से पहले।
2. **अपरिवर्तित रखें** — रूट लिंक (`/guide/…`), लोकेल कुंजी, `defineConfig` संरचना, गैर-स्ट्रिंग विकल्प (खोज प्रदाता, ढह गए फ़्लैग)।
3. **संदर्भ** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) और जेनरेटेड `theme.en.json` आकार।
4. **सत्यापित करें** — `pnpm docs:dev`, नेविगेशन में लोकेल स्विच करें, साइडबार/फुटर/खोज प्लेसहोल्डर का अनुवाद करें; `pnpm docs:build` पास होता है।

**उदाहरण AI एजेंट प्रॉम्प्ट** (कर्सर या किसी अन्य कोडिंग एजेंट में कॉपी करें):

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="example-project"></a>
## उदाहरण प्रोजेक्ट

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — `docs/` पर अंग्रेजी स्रोत, प्रतिबद्ध `pt-BR` और `zh-Hans` पृष्ठ ट्री, साथ ही `theme.pt-BR.json` / `theme.zh-Hans.json`। पोर्ट 3060 पर `pnpm run docs:dev` चलाएं।

<a id="readme-and-the-docs-homepage"></a>
## README और डॉक्स होमपेज

डाउनस्ट्रीम प्रोजेक्ट कभी-कभी `README.md` को VitePress साइट में `docs/index.md` के रूप में कॉपी करते हैं (एक बिल्ड स्क्रिप्ट या मैन्युअल सिंक के माध्यम से)। वह पैटर्न GitHub और डॉक्यूमेंटेशन साइट के बीच एक फ़ाइल साझा करता है, लेकिन लिंक नियम भिन्न होते हैं:

| लिंक प्रकार | GitHub पर काम करता है | VitePress पर काम करता है |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | हाँ | नहीं — साइट रूट का उपयोग करें या सिंक के दौरान नॉर्मलाइज़र को फिर से लिखने दें |
| `./LICENSE`, `examples/demo/` | हाँ (रेपो-रिलेटिव) | नहीं — **पूर्ण URL** का उपयोग करें |
| `/guide/foo` | नहीं | हाँ |

**सिंक्ड README → इंडेक्स के लिए अनुशंसा:** `README.md` में, VitePress सामग्री ट्री (`LICENSE`, `examples/`, कॉन्फ़िग फ़ाइलें, एजेंट संदर्भ फ़ाइलें) के बाहर किसी भी चीज़ के लिए और `translated-docs/` के तहत अनुवादित README प्रतियों के लिए **पूर्ण URL** का उपयोग करें। इन-साइट डॉक्यूमेंटेशन लिंक के लिए `docs/guide/…` पाथ (या `docs/` के तहत अंग्रेजी डॉक्स में साइट रूट) का उपयोग करें; एक सिंक स्क्रिप्ट या `rewriteVitepressLinks` नॉर्मलाइज़र उन्हें `/guide/…` रूट में बदल सकता है।

**यह रिपॉजिटरी** `README.md` और `docs/index.md` को **स्वतंत्र फ़ाइलों** के रूप में रखती है: README एक संक्षिप्त GitHub/npm लैंडिंग पेज है; `docs/index.md` डॉक्स-साइट एंट्री पॉइंट है जो `/guide/` और `/reference/` से लिंक करता है। विस्तृत गाइड `docs/` के अंतर्गत रहते हैं — README में लंबी संदर्भ सामग्री को डुप्लिकेट न करें। साझा तथ्य बदलने पर प्रत्येक को उसके दर्शकों के अनुसार अपडेट करें।

किसी अन्य प्रोजेक्ट में सिंक्ड README के लिए उदाहरण लिंक:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/hi/guide/quick-start)
```

<a id="link-conventions"></a>
## लिंक कन्वेंशन

VitePress सामग्री रूट से अंग्रेजी पृष्ठों और `docs/<locale>/…` से स्थानीय प्रतियों को परोसता है, लेकिन **इन-पेज लिंक को साइट रूट का उपयोग करना चाहिए** (`/guide/quick-start`, `/reference/configuration`) — `docs/guide/quick-start.md` या `../guide/quick-start.md` जैसे रेपो-रिलेटिव पाथ नहीं। वे README-शैली के पाथ GitHub में काम करते हैं लेकिन VitePress के अंदर टूट जाते हैं (देव में और GitHub पेजों पर 404)।

बिल्ट-इन नॉर्मलाइज़र को सक्षम करें ताकि `translate-docs` हर अनुवादित फ़ाइल में लिंक को स्वचालित रूप से ठीक कर दे:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` डिफ़ॉल्ट रूप से सक्षम होता है जब `style` `"vitepress"` होता है।

| अंग्रेजी स्रोत में लेखक | नॉर्मलाइज़र के बाद (अंग्रेजी रूट आउटपुट) | नॉर्मलाइज़र के बाद (अनुवादित `docs/<locale>/` आउटपुट) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/hi/guide/json)` | `[JSON](/hi/guide/json)` | `[JSON](/pt-BR/guide/json)` (स्थानीय उपसर्ग फ़ोल्डर से मेल खाता है) |
| बॉडी में `[Quick start](/hi/guide/quick-start)` या `hero.actions[].link` | अपरिवर्तित (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| स्थानीय इंडेक्स पर `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | अपरिवर्तित | अपरिवर्तित (साझा `docs/public/` एसेट) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | अपरिवर्तित (पूर्ण URL) | अपरिवर्तित (पूर्ण URL) |

`docs/` के तहत अंग्रेजी रूट स्रोत **स्थानीय-तटस्थ** साइट रूट (`/guide/…`) रखते हैं। `docs/<locale>/…` में लिखी गई फ़ाइलों को आंतरिक सामग्री रूट पर स्वचालित रूप से स्थानीय उपसर्ग मिलता है — जिसमें **होम लेआउट फ्रंटमैटर** (`hero.actions[].link`, `features[].link`, `prev`/`next`) शामिल हैं। `/ai-i18n-tools_logo.svg` और `/translation-dashboard.png` जैसी साझा सार्वजनिक संपत्तियां हर स्थानीय पर बिना उपसर्ग के रहती हैं।

<a id="theme-navsidebar-links"></a>
### थीम नेविगेशन/साइडबार लिंक

`translate-docs` `.vitepress/config.mts` में लिंक को फिर से **नहीं** लिखता है। नेविगेशन बार और साइडबार `link` मान TypeScript में एक बार लिखे जाते हैं और कॉन्फ़िग बिल्ड समय पर प्रति स्थानीय उपसर्ग होना चाहिए।

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) केवल **स्थानीय स्विचर** को नियंत्रित करता है (जब उपयोगकर्ता कोई अन्य भाषा चुनता है तो समतुल्य पृष्ठ को मैप करता है)। यह वर्तमान स्थानीय पृष्ठ पर स्थिर `nav` / `sidebar` hrefs को फिर से **नहीं** लिखता है।

`ai-i18n-tools` से `prefixVitepressThemeConfigLinks` का उपयोग करें (मार्कडाउन लिंक फिर से लिखने के समान उपसर्ग नियम):

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

नेविगेशन हाइलाइटिंग स्थानीय मार्गों पर काम करे, इसके लिए **`activeMatch`** के साथ **`link`** को उपसर्ग करें (`/pt-BR/guide/` न कि `/guide/`)। बाहरी URL और साझा सार्वजनिक संपत्तियाँ अपरिवर्तित रहती हैं।

VitePress प्रोजेक्ट में `ai-i18n-tools` को एक **devDependency** के रूप में जोड़ें (देखें `examples/vitepress-docs/package.json`) ताकि `config.mts`, `prefixVitepressThemeConfigLinks` को आयात कर सके। मुख्य ai-i18n-tools दस्तावेज़ साइट सीधे `src/processors/…` से आयात करती है क्योंकि यह मोनोरिपो चेकआउट का उपयोग करती है; स्टैंडअलोन प्रतियां (degit) npm पैकेज का उपयोग करना चाहिए।

**लेखन नियम**

- क्रॉस-पेज डॉक लिंक: `docs/` के तहत अंग्रेजी मार्कडाउन में **साइट रूट** (`/guide/…`, `/reference/…`) का उपयोग करें, या किसी अन्य प्रोजेक्ट में `docs/index.md` में सिंक होने वाली README को लिखते समय `docs/guide/…` पाथ का उपयोग करें।
- चलाने योग्य डेमो, `LICENSE`, और अन्य रेपो फ़ाइलें: `README.md` और डॉक्स में **पूर्ण GitHub URL** का उपयोग करें ([README और डॉक्स होमपेज](#readme-as-the-docs-homepage) देखें)।
- `docs/<locale>/` में लिंक को मैन्युअल रूप से संपादित **न करें** — `sync` / `translate-docs` के साथ पुन: उत्पन्न करें।

यह भी देखें [लिंक पुनर्लेखन](/hi/guide/images-and-screenshots/link-rewriting) (फ्लैट बनाम VitePress) और [कॉन्फ़िगरेशन — `docsOutput`](/hi/reference/configuration#docsoutput)।
