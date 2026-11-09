<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# एक .NET ResourceManager ऐप में i18n जोड़ें

यह पृष्ठ एक .NET एप्लिकेशन के लिए है जो पहले से ही `ResourceManager` या ASP.NET `IStringLocalizer` के साथ स्ट्रिंग लोड करता है, या ऐसा एप्लिकेशन जो करेगा। आप उस लोडर को बनाए रखते हैं। ai-i18n-tools `T("…")` और `{loc:Tr '…'}` पढ़ता है, संदेशों का अनुवाद करता है, और `.resx` सैटेलाइट लिखता है जिनकी कुंजियाँ वे स्रोत स्ट्रिंग हैं। हेल्पर `I18nResx.cs` है, जिसे `init -t ui-dotnet-resx` द्वारा कॉपी किया गया है।

सबसे तेज़ तरीका इस पृष्ठ पर दिए गए प्रॉम्प्ट को कोडिंग एजेंट को देना है। यह कॉन्फ़िग को आपके संसाधनों पर इंगित करता है, आपकी स्ट्रिंग को रैप करता है, परिणाम की जाँच करता है, और एक भाषा स्विच जोड़ सकता है। आप CLI इंस्टॉल करते हैं, प्रदाता चुनते हैं, और प्रोजेक्ट को स्वयं इनिशियलाइज़ करते हैं, क्योंकि इसके लिए आपकी API कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि यह आपके खाते पर पैसे खर्च करता है और आपकी `.resx` फ़ाइलों को फिर से लिखता है।

एक नया Avalonia, WPF, MAUI, WinForms, या कंसोल ऐप जिसमें अभी तक कोई संसाधन फ़ाइल नहीं है, [Add i18n to a .NET app](/hi/guide/add-i18n-to-dotnet) का उपयोग करता है। वह पाथ `I18n.cs` और एम्बेडेड JSON जोड़ता है। निश्चित नहीं हैं कि कौन सा लागू होता है? अंत में [Not your case?](#not-your-case) देखें।

प्रवाह:

1. [CLI स्थापित करें और एक प्रदाता चुनें](#install-and-choose-a-provider)।
2. `init` के साथ [परियोजना को आरंभ करें](#initialise-the-project)।
3. [एजेंट प्रॉम्प्ट चलाएँ](#run-the-agent-prompt)।
4. [परिणाम की समीक्षा करें](#review-the-result)।
5. [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate), फिर एक भाषा की जाँच करें।
6. [इसे अनुवादित रखें](#keep-it-translated)।

परिवर्तन स्वयं करना पसंद करते हैं, या जानना चाहते हैं कि प्रॉम्प्ट क्या करता है? [इसे हाथ से करें](#do-it-by-hand) उन्हीं चरणों को एक-एक करके बताता है।

<a id="install-and-choose-a-provider"></a>
## स्थापित करें और एक प्रदाता चुनें

आप यह हिस्सा करते हैं, एजेंट नहीं। इंस्टॉलर आपकी मशीन को बदलता है, और API कुंजी एक रहस्य है जो आपके शेल में होनी चाहिए, प्रॉम्प्ट में नहीं।

जब मशीन में पहले से ही Node.js `>=22.16.0` ([Installation](/hi/guide/installation)) हो, तो npm पैकेज का उपयोग करें। .NET प्रोजेक्ट के लिए, स्टैंडअलोन निष्पादन योग्य (कोई Node.js नहीं) इंस्टॉल करें।

Linux और macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

इंस्टॉलर `SHA256SUMS.txt` की जाँच करता है, कमांड को `ai-i18n-tools` के रूप में इंस्टॉल करता है, और इसे `PATH` में जोड़ता है। बाइनरीज़ नोटराइज़्ड या Authenticode-हस्ताक्षरित नहीं हैं। मैन्युअल चरण और एसेट नाम: [स्टैंडअलोन निष्पादन योग्य](/hi/guide/installation#standalone-executables)।

स्थापना की जाँच करें:

```bash
ai-i18n-tools --version
```

फिर एक प्रदाता चुनें और उसकी API कुंजी उस शेल में सेट करें जो अनुवाद चलाएगा। उदाहरण के लिए, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [अंतर्निहित प्रदाता](/hi/guide/providers-and-models#built-in-providers)। प्रदाता का नाम नोट करें, क्योंकि आप इसे अगले चरण में `init` को पास करते हैं। एजेंट को कभी कुंजी की आवश्यकता नहीं होती है: यह केवल उन कमांड को चलाता है जो कोई मॉडल कॉल नहीं करते हैं। आप कुंजी का उपयोग बाद में करते हैं, जब आप [अनुवाद करते हैं](#choose-models-and-translate)।

<a id="initialise-the-project"></a>
## परियोजना को आरंभ करें

आप इसे प्रॉम्प्ट से पहले, एक बार चलाते हैं। यह कॉन्फ़िग और `I18nResx.cs` लिखता है, और यह आपके द्वारा ऊपर चुने गए प्रदाता का उपयोग करता है।

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

`--namespace` पास करें जब प्रोजेक्ट नेमस्पेस वह न हो जिसे `init` `I18nResx.cs` में प्रिंट करता है। डायरेक्टरी में एक `.csproj` और कोई `--namespace` न होने पर, `init` उस फ़ाइल के `RootNamespace` का, या प्रोजेक्ट फ़ाइल नाम का उपयोग करता है। अन्यथा नेमस्पेस `AiI18n` है।

टेम्पलेट `ui.flatOutput` को false पर और `ui.resx` को इस पर सेट करता है:

| फ़ील्ड | डिफ़ॉल्ट |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true, ताकि `SharedResource.resx` स्रोत टेक्स्ट को धारण करे |
| `localeFormat` | `bcp47`, ताकि जर्मन फ़ाइल `SharedResource.de.resx` हो और ब्राज़ीलियाई पुर्तगाली `SharedResource.pt-BR.resx` हो |
| `ingestExistingResx` | true |

`init` `I18nResx.cs` लिखता है जब वह फ़ाइल गायब होती है। `ResourceBaseName` नेमस्पेस, आउटपुट फ़ोल्डर और बेस नाम है जो डॉट्स (`MyApp.Resources.SharedResource`) से जुड़ा है। SDK उस मैनिफ़ेस्ट नाम के तहत एक resx एम्बेड करता है जब फ़ाइल उस फ़ोल्डर में होती है। यदि आप फ़ाइलों को स्थानांतरित करते हैं, तो मिलान करने के लिए `ResourceBaseName` बदलें। `init` `.csproj` को संपादित नहीं करता है। सैटेलाइट असेंबली बिल्ड पर `*.{culture}.resx` से उत्पन्न होती हैं। उन सैटेलाइट्स को ऐप के बगल में डिप्लॉय करें।

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने पर आपके द्वारा किए गए संपादन हट जाते हैं। यदि `I18nResx.cs` में पहले से ही मार्कर `ai-i18n-tools-i18n-cs` है, तो प्रोजेक्ट पहले से ही इनिशियलाइज़ हो चुका है: इस चरण को छोड़ दें। `init` किसी मौजूदा हेल्पर को अधिलेखित नहीं करता है।

फिर `sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` स्रोत में स्ट्रिंग की भाषा है। कोई भी BCP-47 भाषा मान्य है; स्कैफ़ोल्ड `en` का उपयोग करता है। `ui.resx` को उस फ़ोल्डर और बेस नाम पर इंगित करें जिसे आपका ऐप पहले से लोड करता है (मैन्युअल रूप से, यानी [Step 1](#step-1-point-the-config-at-your-resources))। `neutralFile` वह न्यूट्रल resx है जो `LoginButton` जैसे लेगेसी नाम को उसके स्रोत टेक्स्ट से मैप करता है। जब इसे छोड़ा जाता है, तो `{outputDir}/{baseName}.resx` का उपयोग तब किया जाता है जब वह फ़ाइल मौजूद होती है।

वही `ui` ब्लॉक फ़्लैट JSON भी लिख सकता है। `flatOutput` को वापस true पर सेट करें। दोनों आउटपुट एक कैटलॉग साझा करते हैं। यह टेम्पलेट `flatOutput` को false छोड़ देता है ताकि केवल `.resx` लिखा जाए।

कॉल आकार और JSON हेल्पर: [.NET applications](/hi/guide/ui-strings/dotnet)। हर दूसरी कॉन्फ़िग कुंजी: [Configuration](/hi/reference/configuration)।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (कर्सर, क्लाउड कोड, कोपायलट, या इसी तरह के) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही आरंभ किया गया होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि आप कुछ छोड़ना चाहते हैं, उदाहरण के लिए कोई भाषा स्विच नहीं, तो उसी संदेश में ऐसा कहें।

एजेंट सबसे पहले जाँचता है कि CLI, कॉन्फ़िग और `I18nResx.cs` मौजूद हैं, और यदि कोई अनुपस्थित है तो निर्देशों के साथ रुक जाता है। फिर यह तीन भागों में काम करता है:

- भाग 1 `ui.resx` को उन कैटलॉग पर इंगित करता है जिन्हें ऐप पहले से लोड करता है, और `ResourceBaseName` की जाँच करता है।
- भाग 2 उपयोगकर्ता-सामने वाली स्ट्रिंग को `T()` और `{loc:Tr '…'}` में रैप करता है, और मैन्युअल रूप से नामित-कुंजी सुझावों को लागू करता है।
- भाग 3 एक भाषा स्विच जोड़ता है जो `ResourceManager` या `IStringLocalizer` पर रहता है।

यह कुछ भी इंस्टॉल या इनिशियलाइज़ नहीं करता है, आपकी API कुंजी नहीं पढ़ता है, या अनुवाद नहीं करता है। यह `.resx` फ़ाइलों को फिर से नहीं लिखता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

````markdown
# Add languages to this .NET ResourceManager app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists with a `ui.resx` block, and that an
`I18nResx.cs` containing `ai-i18n-tools-i18n-cs` exists. If any of them is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-dotnet-resx -P <provider>`, then run this prompt
again. Do not install or initialise anything yourself. Do not overwrite an
existing config or an existing `I18nResx.cs`.

An app with no `.resx` and no `IStringLocalizer` belongs on the `ui-dotnet`
template (`I18n.cs` and embedded JSON). Stop and say so. Do not add both
helpers unless the user asked for both outputs.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- `init` already adds `.gitignore` patterns for the default `cacheDir`
  `.translation-cache`: `.translation-cache/*`, `!.translation-cache/cache.db`,
  `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, and
  `*.backup.*`. Do not replace those lines. Do not ignore the cache directory
  itself (`<cacheDir>/` drops `cache.db`). If `cacheDir` is not
  `.translation-cache`, the two cache lines must use that directory
  (`<cacheDir>/*` and `!<cacheDir>/cache.db`). If `doctor` reports a missing
  pattern, run `ai-i18n-tools doctor --fix-gitignore`. That appends a blank
  line, `# ai-i18n-tools doctor fix`, and only the missing lines. Keep the
  negation so `cache.db` stays tracked.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API, cost money, and `translate-ui` rewrites the `.resx` files.
  The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.resx`,
  `strings.json`, or per-locale JSON. Do not edit `I18nResx.cs` except
  `ResourceBaseName` when the files move.
- Do not introduce new semantic keys. The literal in `T("…")` is the source
  sentence and the resx name. Existing names such as `LoginButton` are
  migrated by hand from the report. Do not let the tool rewrite those lines.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Point the config at your resources

Skip a piece of this part when it is already done.

1. Make `ui.resx.outputDir` and `ui.resx.baseName` match the folder and the
   file stem the app already loads. `localeFormat` stays `bcp47` unless the
   satellites use `pt_BR` names, in which case set `posix`.
2. Set `neutralFile` when the neutral resx is not `{outputDir}/{baseName}.resx`.
   Leave `ingestExistingResx` and `writeNeutral` on so `extract` keeps
   translations that are already in the satellites and `ResourceManager` can
   fall back to the source text.
3. `ResourceBaseName` in `I18nResx.cs` is the namespace, the output folder, and
   the base name joined with dots. The SDK embeds a resx under that manifest
   name when the file sits in that folder. Change the constant when you move
   the files. Change nothing else in the helper.
4. Set `ui.sourceRoots` to the application project instead of `"."`. Point
   `ui.stringsJson` and `ui.flatOutputDir` at the resources folder.
5. Add `global using static <Namespace>.I18nResx;` or call `I18nResx.T` at
   each site. The namespace is the one already in `I18nResx.cs`.
6. `init` does not edit the `.csproj`. Satellite assemblies come from
   `*.{culture}.resx` on build. Do not add an `EmbeddedResource` item for
   JSON unless the user also turned `flatOutput` on.

## Part 2 — Wrap strings

Keep the loader. The new calls use the source sentence as the key. With the
source locale active, the app must behave exactly as before.

- Call shapes: `T("Sign in")`, `T("Saved to {0}", path)`,
  `Tn("1 sample", "{0} samples", count)`, `Tp("menu", "Open")`, `N("Light")`.
  Placeholders are `{0}`, `{0,-10}`, and `{0:C}`. `{name}` stops `extract`.
  Look up first. Never `T($"…")`, `T("a" + b)`, or `T(string.Format(…))`.
- XAML and AXAML: `{loc:Tr 'Sign in'}`. Leave `{Binding}` and
  `{StaticResource}` alone. Element content is not extracted. A literal that
  contains an apostrophe uses `&quot;`.
- `IStringLocalizer` already treats the name you pass as the key and returns
  that name when the resource is missing. `extract` records `T`, `Tn`, `Tp`,
  `N`, `Tr`, and `Loc`. A field named `_localizer` is invisible until that
  name is added to `ui.uiExtractor.funcNames`. Prefer `T("Sign in")` or
  `I18nResx.T("Sign in")` so the default names match.
- Do not rewrite `Resources.LoginButton` yourself in bulk. After `extract`,
  `migrate-dotnet-i18n-report.md` lists those sites as suggestions, for
  example `Resources.LoginButton` → `T("Sign in")`. Apply that list by hand.
  The command does not edit those lines.
- Wrap text a person sees. Leave logs, JSON keys, file names, `nameof`,
  attribute arguments, and exception text that is not shown. A stored option
  keeps its source value. Translate the caption when it is shown. Do not fill
  a static dictionary with `T(…)` at startup.
- resx has no plural forms. Each CLDR form is its own entry, named
  `{singular}[{form}]`, for example `1 sample[one]`. `Tn` selects the form.
  You do not type the plural suffix yourself. Context uses U+2404 between the
  context and the source, because U+0004 is illegal in XML. `Tp("menu", "Open")`
  looks that key up. You do not type the separator.

Work in passes: wrap, run `ai-i18n-tools extract`, read the named-key
suggestions, apply them by hand, then run `extract` again.

Then run `ai-i18n-tools migrate-dotnet-i18n` without `--write` and read the
report. Apply `--write` only for the unsafe `T($"…")` and concatenation
edits, after reading them. Never expect `--write` to rewrite
`Resources.LoginButton`. `--wrap` audits unmarked XAML and high-confidence C#
sinks. A clean report is not coverage. Do not commit the report. Do not edit
`.resx` files. `translate-ui` regenerates the neutral file and every satellite.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app gets `--lang <code>`
(and `-L` when that name is free), not a widget. Do not read `AI_I18N_LANG`.

`T` looks up with `CultureInfo.CurrentUICulture`, so a framework that sets the
UI culture for the request or the window gets the right satellite.
`I18nResx.SetLocale` sets `CurrentUICulture` and `CurrentCulture` together, then
raises `LocaleChanged`. It also stores one locale in a static field, and `Tn`
reads that field when it picks a plural form. Do not call `SetLocale` as a
per-user switch while other requests are in flight. A multi-user server keeps
`IStringLocalizer` and the request culture for ordinary strings.

- ASP.NET Core: `AddLocalization` with `ResourcesPath` set to the resx folder.
  An empty `SharedResource` class is the type argument of
  `IStringLocalizer<SharedResource>`. Its manifest name must equal
  `ResourceBaseName`. Set the request culture from the explicit choice, then
  the cookie, then `Accept-Language`, then the source locale. Accept only
  `sourceLocale` and `targetLocales`.
- Desktop: restore the saved culture before the first `T`, call
  `I18nResx.SetLocale`, and refresh visible text from `LocaleChanged`. Build
  the menu from the configured cultures. Label it `T("Language")`. When the
  framework has a flow direction, set it from `CultureInfo.TextInfo.IsRightToLeft`.
  `I18nResx` has no `SupportedLocales` list.
- `I18nResx.cs` does not reference `Microsoft.Extensions.Localization`. A
  console or desktop project does not take that dependency. Add the package
  only in the ASP.NET project, and put plural helpers there:

```csharp
public static LocalizedString Plural(
    this IStringLocalizer localizer,
    string singular,
    string plural,
    int count)
{
    return new LocalizedString(singular, I18nResx.Tn(singular, plural, count), false);
}
```

## Verify and report

The project's build and tests pass. `extract` writes a catalog of the
sentences you wrapped and keeps values ingested from the existing resx. With
the source locale, the output is unchanged. Your `.resx` files are untouched.

Report the files changed, each string you skipped with file, line, surface,
and reason, named keys you did not apply, one word with two meanings, and
plurals left as one string. With a satellite present, one test sets a target
culture and asserts that a shown validation message and a caption change,
while the stored value stays in the source language. If `dotnet` is not
installed, say the runtime check was skipped.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools translate-ui`, then
rebuild so the satellites are embedded. Remind the user to commit first,
because `translate-ui` rewrites the `.resx` files, and to fill
`glossary-user.csv` before that run.
````

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- अंतर। रैप्ड कॉल, कॉन्फ़िग, `ResourceBaseName` यदि फ़ाइलें स्थानांतरित हुई हैं, और भाषा स्विच बदल जाना चाहिए। आपकी `.resx` फ़ाइलें तब तक अछूती रहनी चाहिए जब तक आप अनुवाद नहीं करते।
- `ai-i18n-tools.config.json`: `resx.outputDir` और `baseName` उन कैटलॉग पर इंगित करते हैं जिन्हें आपका ऐप लोड करता है, और `sourceRoots` एप्लिकेशन प्रोजेक्ट को कवर करता है।
- `ResourceBaseName` उस मैनिफ़ेस्ट नाम से मेल खाता है जिसे SDK एम्बेड करेगा।
- `ai-i18n-tools extract` नए संदेशों को सूचीबद्ध करता है और सैटेलाइट्स में पहले से मौजूद अनुवादों को रखता है।
- `migrate-dotnet-i18n` का ड्राई रन उन नाम-कुंजी सुझावों को छोड़कर कुछ भी ठीक करने के लिए नहीं दिखाता है जिन्हें आपने स्थगित करना चुना था। जब तक आप उन्हें संपादित नहीं करते, तब तक वे लाइनें अभी भी `Resources.LoginButton` हैं।
- आपके परीक्षण पास हो जाते हैं, और ऐप स्रोत भाषा में वैसा ही दिखता है।
- कोई भी थ्रोअवे स्क्रिप्ट या `migrate-dotnet-i18n-report.md` पीछे नहीं छोड़ी गई थी।

इस स्थिति को कमिट करें। `translate-ui` आपकी `.resx` फ़ाइलों को फिर से लिखता है, इसलिए आप समीक्षा के लिए एक स्वच्छ अंतर चाहेंगे।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है, आपके खाते पर पैसे खर्च करता है, और आपकी `.resx` फ़ाइलों को फिर से लिखता है, इसलिए पहले कमिट करें।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। उन मॉडलों को बाहर करने के लिए `--max-price` का उपयोग करें जिनकी मिश्रित कीमत एक सीमा से अधिक है। यदि आप GUI पसंद करते हैं, तो [मॉडल](/hi/guide/translation-dashboard/models) चुनने के लिए `ai-i18n-tools dashboard` का उपयोग करें।

पहले `translate-ui` से पहले शब्दावली भरें। `init` `glossary.userGlossary` को `glossary-user.csv` पर इंगित करता है और फ़ाइल नहीं बनाता है। यदि फ़ाइल गायब है, तो `ai-i18n-tools glossary-generate` चलाएँ, फिर डोमेन शब्द जोड़ें। उन नामों के लिए **Force** का उपयोग करें जिन्हें अपरिवर्तित कॉपी किया जाना चाहिए।

फिर निकालें और अनुवाद करें:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` तटस्थ फ़ाइल और प्रति लक्ष्य भाषा एक सैटेलाइट लिखता है। कुंजियाँ स्रोत स्ट्रिंग हैं। `<comment>` संदर्भ और पहले स्रोत स्थान को रिकॉर्ड करता है। सैटेलाइट में एक हाथ से किया गया संपादन तभी रखा जाता है जब `extract` इसे अगले अनुवाद से पहले ग्रहण करता है, वही अनुबंध जो `.po` फ़ाइलों का है। अब से जेनरेट की गई फ़ाइलों को बिना संपादित किए छोड़ दें, क्योंकि अगला रन उन्हें फिर से जेनरेट करेगा। कमिट करने से पहले पहले अंतर की समीक्षा करें।

`type` या `mimetype` (छवियाँ और अन्य बाइनरी) वाली प्रविष्टियों को छोड़ दिया जाता है। जब उस संस्कृति में कोई प्रविष्टि नहीं होती है तो `ResourceManager.GetString` तटस्थ मान लौटाता है।

पुनर्निर्माण करें ताकि SDK नए सैटेलाइट्स को एम्बेड कर सके, फिर ऐप को पुनरारंभ करें।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

एक लक्ष्य भाषा पर स्विच करें और कुछ रैप्ड स्ट्रिंग वाली स्क्रीन खोलें। जो टेक्स्ट अभी भी स्रोत भाषा में है वह रैप नहीं किया गया था, अभी भी एक नामित कुंजी का उपयोग करता है जिसे लागू नहीं किया गया था, या सैटेलाइट का पुनर्निर्माण नहीं किया गया था। एक अनुवाद जो `{0}` को छोड़ देता है या उसका नाम बदल देता है, वह `FormatException` फेंक सकता है या मान छोड़ सकता है। `string.Format` स्रोत टेम्पलेट पर वापस नहीं आता है। कोड पर संदेह करने से पहले उस वाक्य के लिए सैटेलाइट की जाँच करें।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `ai-i18n-tools sync` (या `extract` फिर `translate-ui`) को फिर से चलाएँ। कैश का मतलब है कि केवल नई या बदली हुई स्ट्रिंग मॉडल में जाती हैं। इसे CI में चलाएँ ताकि अनुवादों में बदलाव न हो। सैटेलाइट्स को फिर से एम्बेड करने के लिए अनुवाद रन के बाद पुनर्निर्माण करें। `ai-i18n-tools dashboard` अनुवादों की समीक्षा करने के लिए [Translation Dashboard](/hi/guide/translation-dashboard/) खोलता है।

`purge-locale` `SharedResource.<culture>.resx` को हटाता है और `SharedResource.resx` को छोड़ देता है।

कॉपी की गई `I18nResx.cs` को ताज़ा करने के लिए, एक डिस्पोजेबल डायरेक्टरी में उसी टेम्पलेट को स्केफोल्ड करें और केवल जेनरेट की गई फ़ाइल को कॉपी करें जिसे आप बदलना चाहते हैं। हेल्पर को अपग्रेड करने के लिए ऐप में `init` को फिर से न चलाएँ।

`README.md` को उसी रन में अनुवाद करने के लिए, `--with-readme` के साथ स्कैफोल्ड करें (या किसी मौजूदा कॉन्फ़िग में ब्लॉक जोड़ें)। देखें [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है, तो इन चरणों का पालन करें। प्रत्येक चरण प्रॉम्प्ट के एक भाग से मेल खाता है। आप अंत में अभी भी [CLI इंस्टॉल करें](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करें](#initialise-the-project), और [अनुवाद करें](#choose-models-and-translate)।

1. [कॉन्फ़िग को अपने संसाधनों पर इंगित करें](#step-1-point-the-config-at-your-resources)।
2. `T()` या `{loc:Tr '…'}` में [स्ट्रिंग को रैप करें](#step-2-wrap-strings)।
3. [नामित संसाधन कुंजियाँ लागू करें](#step-3-apply-named-resource-keys)।
4. [रनटाइम पर भाषा स्विच करें](#step-4-switch-language-at-runtime)।

<a id="step-1-point-the-config-at-your-resources"></a>
## चरण 1: कॉन्फ़िग को अपने संसाधनों पर इंगित करें

टेम्पलेट यह आकार लिखता है। फ़ोल्डर और आधार नाम को उन कैटलॉग में बदलें जिन्हें आपका ऐप पहले से लोड करता है:

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "Resources/strings.json",
    "flatOutputDir": "Resources",
    "flatOutput": false,
    "resx": {
      "outputDir": "Resources",
      "baseName": "SharedResource",
      "writeNeutral": true,
      "ingestExistingResx": true,
      "localeFormat": "bcp47"
    }
  }
}
```

अपने प्रोजेक्ट के विरुद्ध चार चीज़ों की जाँच करें:

- `outputDir` और `baseName` वह जगह है जहाँ तटस्थ फ़ाइल और सैटेलाइट पहले से रहते हैं। जर्मन `SharedResource.de.resx` है। ब्राज़ीलियाई पुर्तगाली `SharedResource.pt-BR.resx` है जब `localeFormat` `bcp47` है।
- `neutralFile` तब सेट होता है जब वह तटस्थ फ़ाइल `{outputDir}/{baseName}.resx` नहीं होती है। इनजेशन एक लेगेसी नाम (`LoginButton`) को तटस्थ मान (`Sign in`) के माध्यम से मैप करता है। जर्मन `LoginButton` मान फिर स्रोत स्ट्रिंग `Sign in` के तहत संग्रहीत किया जाता है।
- `ResourceBaseName` में `I18nResx.cs` नेमस्पेस, आउटपुट फ़ोल्डर और आधार नाम है जो डॉट्स के साथ जुड़ा हुआ है। जब फ़ाइलें चलती हैं तो स्थिरांक को स्थानांतरित करें। हेल्पर के बाकी हिस्सों को अकेला छोड़ दें।
- `sourceRoots` एप्लिकेशन प्रोजेक्ट है, `"."` नहीं।

एक सादे स्ट्रिंग का resx नाम स्रोत टेक्स्ट है: `Sign in`, `Saved to {0}`, एक मान जिसमें एक उद्धरण या एक एम्परसेंड होता है। संदर्भ, संदर्भ और स्रोत के बीच U+2404 का उपयोग करता है। resx में कोई बहुवचन रूप नहीं होते हैं। प्रत्येक CLDR रूप अपनी स्वयं की प्रविष्टि है, जिसका नाम `{singular}[{form}]` है। `Tn` `.po` लेखक के समान नियमों के साथ रूप का चयन करता है। आप विभाजक या बहुवचन प्रत्यय टाइप नहीं करते हैं।

`ai-i18n-tools extract` से पुष्टि करें। कैटलॉग में तटस्थ फ़ाइल से ली गई स्ट्रिंग सूचीबद्ध होनी चाहिए।

<a id="step-2-wrap-strings"></a>
## चरण 2: स्ट्रिंग्स को रैप करें

`extract` एक स्ट्रिंग को तभी रिकॉर्ड करता है जब वह `T()`, `Tn`, `Tp`, `N`, या `{loc:Tr '…'}` को पास किया गया एक शाब्दिक हो। [JSON helper](/hi/guide/add-i18n-to-dotnet#step-2-wrap-strings) के समान आकार लागू होते हैं। प्लेसहोल्डर `{0}` हैं, `{name}` नहीं।

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` आपके द्वारा पास किए गए किसी भी नाम को देखता है और संसाधन के अनुपलब्ध होने पर वह नाम लौटाता है। डिफ़ॉल्ट एक्सट्रैक्टर नाम `T`, `Tn`, `Tp`, `N`, `Tr`, और `Loc` हैं। `_localizer["Sign in"]` जैसा कॉल तब तक अदृश्य रहता है जब तक `_localizer` को `ui.uiExtractor.funcNames` में नहीं जोड़ा जाता। `T("Sign in")` या `I18nResx.T("Sign in")` को कॉल करने के लिए किसी अतिरिक्त नाम की आवश्यकता नहीं होती।

XAML `{loc:Tr '…'}` का उपयोग करता है। एलिमेंट सामग्री निकाली नहीं जाती है। `{Binding}` और `{StaticResource}` को वैसे ही छोड़ दें।

लॉग, JSON कुंजियाँ, फ़ाइल नाम, `nameof`, और अपवाद टेक्स्ट जो नहीं दिखाया गया है, उन्हें वैसे ही छोड़ दें। एक संग्रहीत मान स्रोत भाषा में रहता है। नियंत्रण पर कैप्शन का अनुवाद करें।

असुरक्षित कॉल (`T($"…")`, संयोजन, `T` के अंदर `string.Format`) अगले चरण की रिपोर्ट हैं, साथ ही `Resources.LoginButton` जैसे पुराने नाम भी।

<a id="step-3-apply-named-resource-keys"></a>
## चरण 3: नामित संसाधन कुंजियाँ लागू करें

`migrate-dotnet-i18n` एक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह `T` के उन तर्कों को फिर से लिखता है जो लुकअप से पहले बनाए गए थे, [रैप्ड कॉल की जाँच करें](/hi/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls) के समान संपादन।

जब `extract` ने एक तटस्थ `.resx` को ग्रहण कर लिया है, तो रिपोर्ट में एक नामित-कुंजी अनुभाग भी जुड़ जाता है:

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

वह सूची आपके लागू करने के लिए है। कमांड उन पंक्तियों को संपादित नहीं करता है। `--write` भी नहीं करता। `T("Sign in")` पर कॉल बदलने के बाद, `extract` को फिर से चलाएँ।

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

`migrate-dotnet-i18n-report.md` पढ़ें। जब असुरक्षित-कॉल संपादन सही लगें:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

ड्राई रन को फिर से चलाएँ। तब रुकें जब यह कोई असुरक्षित-कॉल संपादन सूचीबद्ध न करे। जिन नामित कुंजियों को आपने अभी तक लागू नहीं किया है, वे सुझाव सूची में रहती हैं। रिपोर्ट को हटा दें या उसे git-ignore करें। इस चरण में `.resx` फ़ाइलों को संपादित न करें।

<a id="step-4-switch-language-at-runtime"></a>
## चरण 4: रनटाइम पर भाषा बदलें

`T` `CultureInfo.CurrentUICulture` को पढ़ता है। `I18nResx.SetLocale` उस कल्चर और `CurrentCulture` को सेट करता है, फिर `LocaleChanged` को बढ़ाता है। यह `Tn` के लिए जो लोकले संग्रहीत करता है वह स्थिर है, इसलिए एक सर्वर जो समवर्ती अनुरोधों को संभालता है, उसे प्रति-उपयोगकर्ता स्विच के रूप में `SetLocale` का उपयोग नहीं करना चाहिए।

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` अनुरोध-स्थानीय है। इसे उस resx पर इंगित करें जिसे टूल लिखता है। खाली क्लास केवल टाइप आर्ग्यूमेंट है। मैनिफेस्ट बेस नाम `ResourceBaseName` से मेल खाना चाहिए।

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

रेज़र पेज या सेवा में, `T` को कॉल करें ताकि `extract` शाब्दिक को देख सके। यदि कोई कॉल साइट पहले से इसका उपयोग करती है तो मौजूदा `IStringLocalizer<SharedResource>` को रखें। यदि लुकअप इंडेक्सर पर रहता है तो उस रिसीवर का नाम `ui.uiExtractor.funcNames` में जोड़ें।

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` में कोई बहुवचन या संदर्भ पैरामीटर नहीं है। एक एक्सटेंशन `I18nResx` को कॉल कर सकता है, जो समान उपग्रहों को पढ़ता है। इसे ASP.NET प्रोजेक्ट में रखें। `I18nResx.cs` `Microsoft.Extensions.Localization` को संदर्भित नहीं करता है, इसलिए एक कंसोल या डेस्कटॉप प्रोजेक्ट उस पैकेज को नहीं लेता है।

```csharp
public static LocalizedString Plural(
    this IStringLocalizer localizer,
    string singular,
    string plural,
    int count)
{
    return new LocalizedString(singular, I18nResx.Tn(singular, plural, count), false);
}
```

अनुरोध संस्कृति को इस क्रम में चुनें: आगंतुक की स्पष्ट पसंद (`?lang=` या एक फॉर्म पोस्ट), वह कुकी जो इसे याद रखती है, `Accept-Language` हेडर, फिर स्रोत लोकले। उन कोडों को अनदेखा करें जो `sourceLocale` या `targetLocales` में नहीं हैं। `pt-BR` उपग्रह का नाम है। एक हेडर जो `pt-br` भेजता है, उसे `CurrentUICulture` असाइन करने से पहले उस नाम से मेल खाना चाहिए।

<a id="desktop-and-console"></a>
### डेस्कटॉप और कंसोल

विंडो बनने से पहले सहेजी गई संस्कृति को पुनर्स्थापित करें, `I18nResx.SetLocale` को कॉल करें, और `LocaleChanged` से दृश्यमान टेक्स्ट को रीफ़्रेश करें। `sourceLocale` और `targetLocales` से मेनू बनाएँ। इसे `T("Language")` लेबल करें। प्रवाह दिशा `CultureInfo.TextInfo.IsRightToLeft` से आती है। इस हेल्पर पर कोई `SupportedLocales` सूची नहीं है।

एक कंसोल प्रोग्राम में कोई विजेट नहीं होता है। `--lang <code>` (और `-L` जब वह नाम खाली हो) जोड़ें, फिर पहले `T` से पहले `SetLocale` को कॉल करें। `AI_I18N_LANG` को न पढ़ें।

इस चरण को छोड़ दें जब प्रोग्राम कोई ऐसा टेक्स्ट न दिखाए जिसे कोई व्यक्ति पढ़ता हो।

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate) पर जारी रखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपका आज का कोड | पढ़ें |
| --- | --- |
| अभी तक कोई `.resx` और कोई `IStringLocalizer` नहीं | [.NET ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-dotnet) |
| स्रोत-भाषा वाक्य के साथ पहले से ही `T("…")` | [UI स्ट्रिंग](/hi/guide/ui-strings/) चरण 2–3, और [.NET एप्लिकेशन](/hi/guide/ui-strings/dotnet) |
| एक JS/TS ऐप | [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) |
| एक पायथन ऐप | [एक पायथन ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| Django, Flask-Babel कैटलॉग, या GNU gettext | [एक Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext) |
| एक वेबसाइट या डॉक्स साइट | [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) |
| एक रिपॉजिटरी README या अन्य मार्कडाउन फ़ाइलें | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |

<a id="examples"></a>
## उदाहरण

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | xUnit `I18nResx.cs` की जाँचें: स्रोत-स्ट्रिंग कुंजियाँ, उद्धरण, संदर्भ, बहुवचन, वास्तविक उपग्रह |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | JSON हेल्पर, ऐसे ऐप के लिए जो `ResourceManager` पर नहीं है |

ये डायरेक्टरी हेल्परों की जाँच करती हैं। ये अनुवाद करने के लिए ऐप नहीं हैं, और इन्हें API कुंजी की आवश्यकता नहीं है। `dotnet test` `dotnet-resx` में सैटेलाइट जाँच चलाता है। इस पृष्ठ पर एक वास्तविक ऐप `init` से शुरू होता है। `npx degit` के साथ एक कॉपी करें, या GitHub रिलीज़ से `ai-i18n-tools-dotnet-examples.zip` डाउनलोड करें। उस ज़िप में `assets/dotnet` भी शामिल है, जिसे प्रोजेक्ट संकलित करता है। कमांड्स: [उदाहरण](/hi/examples#net-examples)।
