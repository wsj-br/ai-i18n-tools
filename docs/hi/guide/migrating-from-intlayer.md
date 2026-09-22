<a id="migrating-from-intlayer"></a>
# इंटलेयर से माइग्रेट करना

[Intlayer](https://intlayer.org/) से माइग्रेट कर रहे हैं? यह कमांड आपके मौजूदा ट्रांसलेशन डिक्शनरीज़ और आपके ऐप में सबसे सरल ट्रांसलेशन उपयोग को ai-i18n-tools में लाती है। यह स्वचालित रूप से सुरक्षित अपडेट करती है, और फिर उन सभी चीज़ों के लिए एक स्पष्ट रिपोर्ट बनाती है जिन्हें अभी भी आपके ध्यान की आवश्यकता है। इससे आप शुरू में हर अंतर को समझे बिना धीरे-धीरे माइग्रेट कर सकते हैं।

क्या आप पहले से ही i18next JSON ट्रांसलेशन फ़ाइलों का उपयोग कर रहे हैं? आपको इस माइग्रेशन कमांड की आवश्यकता नहीं है; इसके बजाय [JSON pipeline](/hi/guide/json#i18next-namespace-files) का उपयोग करें।

<a id="what-migrate-intlayer-does"></a>
## `migrate-intlayer` क्या करता है

1. `*.content.ts` डिफ़ॉल्ट एक्सपोर्ट्स को पार्स करता है (`key` + `content` + `t({ locale: '…' })` लीव्स)।
2. स्रोत-लोकेल टेक्स्ट और डिक्शनरी में पहले से मौजूद किसी भी अनुवाद से `ui.flatOutputDir` के अंतर्गत `ui.stringsJson` और प्रति-लोकेल फ़ाइलों को सीड करता है। इम्पोर्ट की गई पंक्तियों में कोई `models` फ़ील्ड नहीं होता (वे इस रन द्वारा मशीन-अनुवादित नहीं की गई थीं)।
3. **सुरक्षित** कॉल साइट्स को पुनः लिखता है:
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. बाकी सब कुछ (डायनामिक कीज़, JSX स्प्रेड्स, चेन्ड `.replace().replace()`, डिस्ट्रक्चरिंग) को बिना छेड़े छोड़ देता है। रिपोर्ट में सटीक एक्सप्रेशन, एक ठोस `t()` या JSX रिप्लेसमेंट, और जोड़ने के लिए `import { t } from '…';` लाइन के साथ उनमें से प्रत्येक साइट की सूची दी गई है।
5. डिफ़ॉल्ट रूप से ड्राई रन। कैटलोग सीडिंग और सुरक्षित रिराइट्स लागू करने के लिए `--write` पास करें। रिपोर्ट हमेशा लिखी जाती है। यह डिक्शनरी फ़ाइलों और मैनुअल रिराइट्स के बाद डिलीट करने के लिए बचे हुए `useIntlayer` / `IntlayerProvider` उपयोग, कैटलोग कीज़ जिन्हें अभी भी `extract` और फिर `translate-ui` की आवश्यकता है, और ऐप के i18n मॉड्यूल पर पेस्ट करने के लिए रनटाइम बूटस्ट्रैप की सूची भी देता है।

<a id="migrate-your-project"></a>
## अपना प्रोजेक्ट माइग्रेट करें

1. `ai-i18n-tools` इंस्टॉल करें ([इंस्टॉलेशन](/hi/guide/installation) देखें)। यदि आपके प्रोजेक्ट में अभी तक कोई `ai-i18n-tools.config.json` नहीं है, तो एक स्केफोल्ड करें:

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

`sourceLocale` और `targetLocales` को संपादित करें ताकि वे आपके Intlayer शब्दकोशों में पहले से मौजूद लोकेल्स से मेल खाएं, और `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir` को अपने ऐप के स्रोत और वांछित कैटलॉग पथ की ओर इंगित करने के लिए सेट करें — वही कुंजियाँ जिनका उपयोग `translate-ui` करता है, देखें [UI स्ट्रिंग्स — चरण 1: प्रारंभ करें](/hi/guide/ui-strings/#step-1-initialise)।
2. पहले ड्राई रन करें: `ai-i18n-tools migrate-intlayer` (कोई `--write` नहीं)। यह देखने के लिए `migrate-intlayer-report.md` पढ़ें कि यह क्या खोजता है और किसी भी फ़ाइल परिवर्तन से पहले किन कॉल साइट्स को मैन्युअल समीक्षा की आवश्यकता है।
3. `ui.stringsJson` / `ui.flatOutputDir` को सीड करने और सुरक्षित कॉल साइट्स को फिर से लिखने के लिए `ai-i18n-tools migrate-intlayer --write` चलाएँ।
4. पुनर्जनित रिपोर्ट `migrate-intlayer-report.md` को एक AI कोडिंग एजेंट को दें (अनुशंसित), या निम्नलिखित चरणों का पालन करके इसे स्वयं पूरा करें:

- रिपोर्ट एक **चरण-दर-चरण TODO** के साथ समाप्त होती है: प्रत्येक मैन्युअल-समीक्षा साइट को वहां दिखाए गए विशिष्ट `t('…')`/JSX के साथ पूरा करें, `import { t } from '…';` लाइन जोड़ें, फिर बची हुई `*.content.ts` फ़ाइलों और रिपोर्ट में सूचीबद्ध `useIntlayer` / `IntlayerProvider` उपयोग को हटा दें।
   - रिपोर्ट के रनटाइम बूटस्ट्रैप को अपने ऐप के i18n मॉड्यूल पर पेस्ट करें। लोकेल नियंत्रण में, `loadLocale(next)` और फिर `i18n.changeLanguage(next)` को कॉल करें — `loadLocale` केवल फ्लैट बंडल को पंजीकृत करता है और सक्रिय भाषा को स्विच नहीं करता है।
   - रिपोर्ट द्वारा नई के रूप में चिह्नित किसी भी स्रोत स्ट्रिंग के लिए `ai-i18n-tools extract` और फिर `ai-i18n-tools translate-ui` (या `sync`) चलाएँ। `extract` `ui-languages.json` भी लिखता है, जिसे बूटस्ट्रैप आयात करता है, इसलिए ऐप शुरू करने से पहले इसे चलाएँ, भले ही कोई नई स्ट्रिंग न जोड़ी गई हो। `strings.json`, फ्लैट लोकेल फ़ाइलों, या `ui-languages.json` को मैन्युअल रूप से संपादित न करें — ये कमांड्स उन्हें प्रबंधित करते हैं।
   - एक बार जब रिपोर्ट की क्लीनअप सूची पूरी हो जाती है और ऐप ai-i18n-tools पर चलने लगता है, तो `intlayer` / `react-intlayer` निर्भरताओं और शब्दकोश फ़ाइलों को हटा दें।

<a id="run-the-example"></a>
## उदाहरण चलाएँ

उपरोक्त चरण किसी भी Intlayer प्रोजेक्ट पर लागू होते हैं। [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) उदाहरण एक छोटे Vite + React ऐप पर बुनियादी (ऑटो-रिराइट करने योग्य) और जटिल (मैन्युअल-समीक्षा) मामलों के साथ इन्हें समझाता है, ताकि आप अपने स्वयं के कोड पर इसे आज़माने से पहले रिपोर्ट और रनटाइम बूटस्ट्रैप देख सकें। `intlayer-pristine/` को कभी भी संशोधित नहीं किया जाता है; `src/` वर्किंग कॉपी है।

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

`migrate-intlayer-report.md` को किसी AI कोडिंग एजेंट को सौंपें (या फ़्लैग की गई फ़ाइलों को स्वयं एडिट करें)। रिपोर्ट में `src/i18n.ts` पर पेस्ट करने के लिए रनटाइम मॉड्यूल शामिल है। लोकेल कंट्रोल में, `loadLocale(next)` और फिर `i18n.changeLanguage(next)` को कॉल करें। `loadLocale` केवल फ़्लैट बंडल को रजिस्टर करता है।

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` पहले `extract` चलाता है, जो `ui-languages.json` लिखता है। बूटस्ट्रैप उस फ़ाइल को आयात करता है, इसलिए एक्सट्रैक्ट करने के बाद ही ऐप शुरू करें। `strings.json`, फ्लैट लोकेल फ़ाइलों, या `ui-languages.json` को मैन्युअल रूप से संपादित न करें।

`pnpm reset` `intlayer-pristine/` को `src/` पर वापस कॉपी करता है और जेनरेट किए गए कैटलॉग को साफ़ करता है ताकि आप फिर से शुरू कर सकें।

पूर्ण वॉकथ्रू: [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md)।

<a id="command"></a>
## कमांड

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

कॉन्फ़िग में `ui.stringsJson` और `ui.flatOutputDir` की आवश्यकता है (`translate-ui` के समान)। LLM को कॉल नहीं करता है।

| विकल्प | अर्थ |
| --- | --- |
| `[paths...]` | स्कैन करने के लिए फ़ाइलें/डिर/ग्लोब (डिफ़ॉल्ट: `ui.sourceRoots`) |
| `--write` | कैटलॉग को सीड करें और सुरक्षित कॉल साइट्स को फिर से लिखें (डिफ़ॉल्ट: ड्राई रन) |
| `--report <path>` | रिपोर्ट पाथ (डिफ़ॉल्ट: `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | शब्दकोश फ़ाइलनाम ग्लोब (डिफ़ॉल्ट: `**/*.content.ts`) |
| `--t-import <specifier>` | जेनरेट किए गए `t()` के लिए इंपोर्ट स्पेसिफ़ायर (डिफ़ॉल्ट: यदि `src/i18n.ts` मौजूद है तो सापेक्ष `./i18n`, अन्यथा `i18next`) |

`--write` के बाद, रिपोर्ट से मैन्युअल-समीक्षा साइटों का कार्य पूरा करें, इसके द्वारा सूचीबद्ध अप्रयुक्त `*.content.ts` फ़ाइलों और `IntlayerProvider` रैपर को हटाएं, रनटाइम बूटस्ट्रैप पेस्ट करें, और लोकेल नियंत्रण से `i18n.changeLanguage` को कॉल करें। रिपोर्ट द्वारा नए के रूप में चिह्नित स्रोत स्ट्रिंग्स के लिए `extract` और फिर `translate-ui` (या `sync`) चलाएं। `extract` `ui-languages.json` भी लिखता है, जिसे बूटस्ट्रैप आयात करता है। `strings.json`, फ्लैट लोकेल फ़ाइलों, या `ui-languages.json` को मैन्युअल रूप से संपादित न करें।

**यह भी देखें:** [CLI — UI स्ट्रिंग्स](/hi/reference/cli-commands/ui-strings#migrate-intlayer), [वायर i18next](/hi/guide/ui-strings/i18next-runtime)
