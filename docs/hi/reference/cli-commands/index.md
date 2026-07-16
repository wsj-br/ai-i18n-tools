<a id="cli-reference"></a>
# सीएलआई संदर्भ

किसी कमांड पर हर फ़्लैग के लिए `ai-i18n-tools <command> --help` चलाएँ। नीचे दिए गए समूह पृष्ठ संदर्भ, मुख्य विकल्प और विषय गाइड के लिंक जोड़ते हैं।

<a id="command-overview"></a>
## कमांड अवलोकन

<a id="setupsetup"></a>
### [सेटअप](setup)

| कमांड | सारांश |
|---------|---------|
| [`version`](setup#version) | सीएलआई संस्करण और बिल्ड टाइमस्टैम्प प्रिंट करें। |
| [`init`](setup#init) | एक स्टार्टर कॉन्फ़िग लिखें; `-t` एक स्कैफ़ोल्ड टेम्पलेट का चयन करता है। |

<a id="models--catalogmodels"></a>
### [मॉडल और कैटलॉग](models)

| कमांड | सारांश |
|---------|---------|
| [`check-models`](models#check-models) | सक्रिय प्रदाता के विरुद्ध कॉन्फ़िगर किए गए मॉडल आईडी को मान्य करें। |
| [`list-models`](models#list-models) | सक्रिय प्रदाता द्वारा विज्ञापित मॉडल सूचीबद्ध करें। |
| [`bench-models`](models#bench-models) | एक नमूना अनुवाद पर कॉन्फ़िगर किए गए मॉडल का बेंचमार्क करें। |
| [`list-languages`](models#list-languages) | बंडल किए गए यूआई भाषाओं के कैटलॉग को सूचीबद्ध करें। |

<a id="ui-stringsui-strings"></a>
### [यूआई स्ट्रिंग्स](ui-strings)

| कमांड | सारांश |
|---------|---------|
| [`extract`](ui-strings#extract) | स्रोत शाब्दिक और एचटीएमएल मार्कर से `strings.json` अपडेट करें। |
| [`mark-html`](ui-strings#mark-html) | एचटीएमएल फ़ाइलों में `data-i18n*` मार्कर डालें। |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | कॉन्फ़िग लोकेल से `ui-languages.json` लिखें। |
| [`translate-ui`](ui-strings#translate-ui) | यूआई स्ट्रिंग्स का अनुवाद करें (`strings.json` → लोकेल जेएसओएन)। |
| [`sync-ui`](ui-strings#sync-ui) | यूआई स्ट्रिंग्स निकालें, फिर अनुवाद करें। |
| [`proofread-ui`](ui-strings#proofread-ui) | स्रोत-लोकेल यूआई स्ट्रिंग्स निकालें, फिर एलएलएम-समीक्षा करें। |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | `strings.json` को एक्सएलआईएफएफ 2.0 में निर्यात करें। |

<a id="documentsdocuments"></a>
### [दस्तावेज़](documents)

| कमांड | सारांश |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | मार्कडाउन, एमडीएक्स, `.astro` और फ़्रेमवर्क कैटलॉग का अनुवाद करें। |
| [`write-heading-ids`](documents#write-heading-ids) | एटीएक्स शीर्षकों से पहले एचटीएमएल एंकर लाइनें डालें। |
| [`check-markdown`](documents#check-markdown) | सीमांकक और जोर के मुद्दों के लिए मार्कडाउन/एमडीएक्स को स्कैन करें। |

<a id="other-contentcontent"></a>
### [अन्य सामग्री](content)

| कमांड | सारांश |
|---------|---------|
| [`translate-json`](content#translate-json) | `json[]` कॉन्फ़िग ब्लॉक के अनुसार नेस्टेड JSON का अनुवाद करें। |
| [`translate-svg`](content#translate-svg) | `config.svg` में कॉन्फ़िगर की गई एसवीजी फ़ाइलों का अनुवाद करें। |

<a id="workflows--statusworkflows"></a>
### [कार्यप्रवाह और स्थिति](workflows)

| कमांड | सारांश |
|---------|---------|
| [`sync`](workflows#sync) | एक पाइपलाइन में एक्सट्रैक्ट + यूआई + एसवीजी + डॉक्स + JSON चलाएँ। |
| [`status`](workflows#status) | यूआई, दस्तावेज़ और JSON अनुवाद कवरेज प्रिंट करें। |
| [`statistics`](workflows#statistics) | कैश और `strings.json` आँकड़े प्रिंट करें। |

<a id="cache--maintenancemaintenance"></a>
### [कैश और रखरखाव](maintenance)

| कमांड | सारांश |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | बासी/अनाथ/अनकॉन्फ़िगर-स्थानिक कैश पंक्तियों को हटाएँ और मार्कडाउन समस्याओं को फिर से भरें। |
| [`clean-temp`](maintenance#clean-temp) | `*.log`, `*.tmp` और कैश बैकअप ढूँढें और हटाएँ। |
| [`purge-locale`](maintenance#purge-locale) | लोकेल के लिए कैश पंक्तियों और जेनरेट किए गए आर्टिफैक्ट्स को हटाएँ। |

<a id="toolstools"></a>
### [उपकरण](tools)

| कमांड | सारांश |
|---------|---------|
| [`dashboard`](tools#dashboard) | अनुवाद डैशबोर्ड वेब यूआई लॉन्च करें। |
| [`glossary-generate`](tools#glossary-generate) | एक खाली `glossary-user.csv` टेम्पलेट लिखें। |
| [`help`](tools#help) | एक सबकमांड के लिए सहायता प्रदर्शित करें। |

<a id="synopsis"></a>
## सारांश

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### रूट और वैश्विक विकल्प

| विकल्प                       | दायरा         | विवरण                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | रूट प्रोग्राम  | आउटपुट संस्करण संख्या और बिल्ड टाइमस्टैम्प (`version` सबकमांड के समान जानकारी)। |
| `-h` / `--help`              | रूट प्रोग्राम  | रूट प्रोग्राम या सबकमांड के लिए कमांड नाम के साथ उपयोग किए जाने पर सहायता प्रदर्शित करें।      |
| `-c` / `--config <path>`     | हर कमांड | कॉन्फ़िग फ़ाइल पाथ (डिफ़ॉल्ट: `ai-i18n-tools.config.json`)।                                  |
| `-v` / `--verbose`           | हर कमांड | वर्बोस लॉगिंग।                                                                          |
| `-P` / `--provider <name>`   | हर कमांड | इस रन के लिए सक्रिय LLM प्रदाता; कॉन्फ़िग `provider` कुंजी को ओवरराइड करता है। `providers` के तहत कॉन्फ़िगर किया जाना चाहिए। |
| `-L` / `--ui-lang <code>`    | हर कमांड | टूल के अपने UI (CLI सहायता, लॉग/सारांश, डैशबोर्ड) के लिए भाषा; उच्चतम-प्राथमिकता स्रोत। [टूल UI भाषा](/hi/guide/tool-ui-language) देखें। |
| `-w` / `--write-logs [path]` | चयनित कमांड | कंसोल आउटपुट को `.log` फ़ाइल में टी करें (डिफ़ॉल्ट पाथ: रूट `cacheDir` के तहत)। केवल `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, और `cleanup` के लिए वायर्ड।                |

<a id="per-command-help"></a>
### प्रति-कमांड सहायता

| उपयोग                            | विवरण                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | उस कमांड के लिए सभी विकल्प।      |
| `ai-i18n-tools help <command>`   | `<command> --help` के समान आउटपुट। |

<a id="target-locales--l----locale"></a>
### लक्ष्य स्थानीय (`-l` / `--locale`)

| कमांड                                                                                | व्यवहार                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — अल्पविराम से अलग किए गए लक्ष्य BCP-47 कोड (जैसे `de,fr,pt-BR`)। जब छोड़ा जाता है, तो डिफ़ॉल्ट कॉन्फ़िग से आते हैं (`json[]` ब्लॉक प्रति-ब्लॉक `targetLocales` भी सेट कर सकते हैं; UI चरण `targetLocales` माइनस `sourceLocale` का उपयोग करते हैं)। |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — समीक्षा करने के लिए एकल स्रोत स्थानीय (डिफ़ॉल्ट: कॉन्फ़िग `sourceLocale`)।                                                            |
