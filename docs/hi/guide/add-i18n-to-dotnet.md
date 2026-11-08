<a id="add-i18n-to-a-net-app"></a>
# एक .NET ऐप में i18n जोड़ें

यह पृष्ठ एक .NET ऐप (Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET, या एक कंसोल टूल) लेता है जिसमें एक ही भाषा है और ai-i18n-tools के साथ स्थानीय भाषाएँ जोड़ता है। यह एक ही पथ का अनुसरण करता है: `ui-dotnet` टेम्पलेट, एक छोटा `I18n.cs` हेल्पर, और अनुवादों की JSON फ़ाइलें। `extract` UI स्ट्रिंग को तभी रिकॉर्ड करता है जब वह `T()`, `Tn`, `Tp`, `N`, या XAML `{loc:Tr '…'}` के अंदर एक स्ट्रिंग लिटरल हो, इसलिए सादे स्रोत टेक्स्ट की एक कैटलॉग खाली होगी।

सबसे तेज़ तरीका यह है कि इस पृष्ठ पर कोडिंग एजेंट को प्रॉम्प्ट दिया जाए। यह हेल्पर को रखता है, लोकल JSON को एम्बेड करता है, आपकी स्ट्रिंग्स को रैप करता है, और एक भाषा स्विच जोड़ सकता है। आप CLI को स्वयं इंस्टॉल करते हैं, प्रदाता चुनते हैं, और प्रोजेक्ट को स्वयं इनिशियलाइज़ करते हैं, क्योंकि इसके लिए आपकी API कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि यह आपके खाते पर पैसे खर्च करता है।

एक ऐप जो पहले से ही `ResourceManager` या ASP.NET `IStringLocalizer` के साथ स्ट्रिंग्स लोड करता है, वह [Add i18n to a .NET ResourceManager app](/hi/guide/add-i18n-to-dotnet-resourcemanager) का उपयोग करता है। वह पथ लोडर को रखता है और `.resx` सैटेलाइट लिखता है। निश्चित नहीं हैं कि कौन सा लागू होता है? अंत में [Not your case?](#not-your-case) देखें।

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

आप इसे प्रॉम्प्ट से पहले, एक बार चलाते हैं। यह कॉन्फ़िग और `I18n.cs` लिखता है, और यह आपके द्वारा ऊपर चुने गए प्रदाता का उपयोग करता है।

यह पृष्ठ एक टेम्पलेट, `ui-dotnet` का उपयोग करता है। यह कॉन्फ़िग, `I18n.cs` हेल्पर, और JSON कैटलॉग लिखता है। यह इन ऐप्स के लिए उपयुक्त है:

| आपका ऐप | नोट्स |
| --- | --- |
| Avalonia, WPF, MAUI | XAML में लेबल को एक मार्कअप एक्सटेंशन की आवश्यकता होती है। हेल्पर उन असेंबलियों को संदर्भित नहीं करता है |
| WinForms | जब स्थानीय भाषा बदलती है तो दृश्यमान टेक्स्ट को फिर से बनाएँ |
| Blazor और एक एकल-उपयोगकर्ता ASP.NET ऐप | हेल्पर का कैटलॉग स्थिर है, जो एक समय में एक उपयोगकर्ता के लिए पर्याप्त है |
| एक बहु-उपयोगकर्ता सर्वर | `IStringLocalizer` या `ResourceManager` रखें। [ResourceManager page](/hi/guide/add-i18n-to-dotnet-resourcemanager) का उपयोग करें |
| कंसोल उपकरण | एक `--lang` विकल्प, एक विजेट नहीं |

आपके द्वारा चुने गए प्रदाता (इस उदाहरण में OpenRouter) के साथ init चलाएँ:

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

जब प्रोजेक्ट नेमस्पेस वह न हो जिसे `init` `I18n.cs` में प्रिंट करता है, तो `--namespace` पास करें। डायरेक्टरी में एक `.csproj` और कोई `--namespace` न होने पर, `init` उस फ़ाइल के `RootNamespace`, या प्रोजेक्ट फ़ाइल नाम का उपयोग करता है। अन्यथा नेमस्पेस `AiI18n` है।

फिर `ai-i18n-tools.config.json` में `sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` स्रोत में स्ट्रिंग की भाषा है। कोई भी BCP-47 भाषा मान्य है; स्केफोल्ड `en` का उपयोग करता है। `init` उस सूची को `I18n.cs` में `BuiltInLocales` के रूप में, `ai-i18n-tools-locales` मार्करों के बीच, स्टैंप करता है, और `SourceLocale` एक कॉन्स्ट है। वह स्टैंप भाषा मेनू नहीं है। `extract` कॉन्फ़िग से `locales/ui-languages.json` को फिर से लिखता है, और ऐप स्टार्टअप पर उस फ़ाइल को पढ़ता है। हेल्पर को रीफ़्रेश करने के लिए ऐप में `init` को फिर से न चलाएँ।

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने पर आपके द्वारा किए गए संपादन हट जाते हैं। यदि `I18n.cs` में पहले से ही मार्कर `ai-i18n-tools-i18n-cs` है, तो प्रोजेक्ट पहले से ही इनिशियलाइज़ हो चुका है: इस चरण को छोड़ दें। `init` मौजूदा `I18n.cs` को ओवरराइट नहीं करता है, और यह `.csproj` को संपादित नहीं करता है।

`init` `ui.sourceRoots` को `"."` पर सेट करता है, इसलिए `extract` पूरे रिपॉजिटरी को स्कैन करेगा। प्रॉम्प्ट इसे आपके एप्लिकेशन कोड तक सीमित करता है (मैन्युअल रूप से, यानी [चरण 1](#step-1-place-the-helper-and-embed-the-catalogs))। स्कैन पहले से ही `bin`, `obj`, `.vs`, `TestResults`, और `packages` नाम की डायरेक्टरी को छोड़ देता है, और टेम्पलेट `**/Tests/**`, `**/*.Tests/**`, और `**/TrExtension.cs` को बाहर करता है।

कॉल आकार: [.NET applications](/hi/guide/ui-strings/dotnet)। हर दूसरी कॉन्फ़िग कुंजी: [Configuration](/hi/reference/configuration)।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (कर्सर, क्लाउड कोड, कोपायलट, या इसी तरह के) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही आरंभ किया गया होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि आप कुछ छोड़ना चाहते हैं, उदाहरण के लिए कोई भाषा स्विच नहीं, तो उसी संदेश में ऐसा कहें।

एजेंट सबसे पहले यह जांचता है कि CLI, कॉन्फ़िग, और `I18n.cs` मौजूद हैं, और यदि कोई गुम है तो निर्देशों के साथ रुक जाता है। फिर यह तीन भागों में काम करता है:

- भाग 1 `I18n.cs` और `locales/` को वहाँ रखता है जहाँ प्रोजेक्ट अपना कोड रखता है, JSON को एम्बेड करता है, और कॉन्फ़िग को उन पर इंगित करता है।
- भाग 2 उपयोगकर्ता-सामने वाली स्ट्रिंग्स को `T()`, `Tn`, `Tp`, `N`, और `{loc:Tr '…'}` में लपेटता है, फिर `migrate-dotnet-i18n` के साथ असुरक्षित कॉलों की जाँच करता है।
- भाग 3 एक भाषा स्विच, या एक CLI भाषा विकल्प जोड़ता है।

यह कुछ भी इंस्टॉल या इनिशियलाइज़ नहीं करता है, आपकी API कुंजी नहीं पढ़ता है, या अनुवाद नहीं करता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

````markdown
# Add languages to this .NET app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists with a `ui` block, and that an `I18n.cs`
containing `ai-i18n-tools-i18n-cs` exists. If any of them is missing, stop now
and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-dotnet -P <provider>`, then run this prompt again.
Pass `--namespace` when the printed namespace is wrong. Do not install or
initialise anything yourself. Do not overwrite an existing config or an
existing `I18n.cs`.

If the app already loads strings with `ResourceManager` or
`IStringLocalizer`, stop and tell the user to use the `ui-dotnet-resx`
template instead. Do not add `I18n.cs` beside that loader.

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
- Do not run `translate-ui`, `suggest-models`, `sync`, or `glossary-generate`.
  The first three call the translation API and cost money. `glossary-generate`
  only writes an empty CSV and does not call the translator. The user runs
  them after reviewing your work, and fills `glossary-user.csv` before the
  first `translate-ui`. Do not read `.env` or the environment to fill it.
- Do not translate, reword, or rename source text. Do not edit `I18n.cs`
  except `SourceLocale` and the `BuiltInLocales` array between the
  `ai-i18n-tools-locales` markers, and only when `sourceLocale` drifted after
  init. That stamp is not the language menu. Loading
  `locales/ui-languages.json` does not require editing the helper. Do not edit
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`,
  `.resx`). Do not add another helper module.
- Follow that project's changelog and user-doc rules in the same session when
  visible behaviour changes.
- Do not introduce semantic keys (`LoginButton`, `nav.home`). The literal in
  `T("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and embed the catalogs

Skip this part when `I18n.cs` and `locales/` already sit with the code that
uses them, the config points at them, and the project embeds `locales/*.json`.

1. Move `I18n.cs` and `locales/` together into the application project. A
   single-project repo can leave them where `init` wrote them. `I18n.cs` loads
   embedded JSON by resource name. Do not edit paths inside it.
2. Add `<EmbeddedResource Include="locales/*.json" />` to that project's
   `.csproj`. The path is relative to the project file. Do not rewrite the
   rest of the project file. .NET Framework 4.8 also needs the
   `System.Text.Json` package before `I18n.cs` will compile.
3. In `ai-i18n-tools.config.json`, point `ui.stringsJson` and
   `ui.flatOutputDir` at the new `locales/`. Set `ui.sourceRoots` to the
   application project instead of `"."`.
4. Add `global using static <Namespace>.I18n;` in that project, or call
   `I18n.T` at each site. The namespace is the one already in `I18n.cs`.
5. `BuiltInLocales`, between the `ai-i18n-tools-locales` markers, is only the
   list stamped at init. It is not the language menu. If `sourceLocale`
   drifted after init, update the `SourceLocale` const so it matches the
   config. Leave the rest of the helper alone. Part 3 loads the menu from
   `locales/ui-languages.json`.
6. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `T("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. The
exception is `Tn`: it may correct a sentence that was always plural
(`1 samples` becomes the singular form). Text that is already wrapped needs
no change.

- Call shapes: `T("Sign in")`, `T("Saved to {0}", path)`,
  `Tn("1 sample", "{0} samples", count)`, `Tp("menu", "Open")`, `N("Light")`.
  `{0}` is the count in `Tn`. Extra arguments follow it (`{1}`, `{2}`).
  `Tp` is for one short word with two meanings (`Open` the window and `Open`
  the file). `N` returns its argument so a static field can hold a literal
  `extract` can see. Show it later with `T(label)`. `T(label)` is valid only
  when `label` comes from `N("literal")`.
- Placeholders are `{0}`, `{0,-10}`, `{0:C}`, and `{0,-10:C}`. `%` is ordinary
  text. Doubled braces (`{{` and `}}`) are literal braces and must be copied
  unchanged. `{name}` is an error: `extract` stops.
  `string.Format` throws on a named item.
- Look up first, then format. Never `T($"…")`, `T("a" + b)`, or
  `T(string.Format(…))`. The argument must be a string literal, so
  `T(variable)` is invisible apart from a warning.
- XAML and AXAML: `{loc:Tr 'Sign in'}`. The prefix does not matter. The type
  name must be `Tr`. `{Binding}`, `{DynamicResource}`, `{StaticResource}`,
  `{TemplateBinding}`, and `{x:Static}` stay as they are. Element content
  (`<TextBlock>Hello</TextBlock>`) is not extracted. Move it onto an attribute.
  A literal that contains an apostrophe uses `&quot;` so the XML attribute can
  stay in double quotes: `Content="{loc:Tr &quot;Don't&quot;}"`.
- Avalonia, WPF, and MAUI each have their own markup-extension base class. Add
  a `TrExtension` in the app. Do not reference those UI assemblies from
  `I18n.cs`. `ProvideValue` returns `I18n.T(Text)` and sets that same property
  again on `LocaleChanged`, so a screen that is already open updates.
  Unsubscribe when the control leaves the visual tree. Add `**/TrExtension.cs`
  to `ui.uiExtractor.exclude`. `extract` otherwise warns that `T(Text)` is not
  a literal. The XAML literals are already extracted through `Tr`. `{loc:Tr}`
  can only call `T`. When one short word has two meanings, set those controls
  in code with `Tp`.
- Wrap text a person sees: labels, titles, captions, messages, validation
  text that is shown, progress, accessibility names, dialogs. Also review
  returned labels, dictionaries, variable-backed captions, and XAML element
  content. Leave logs, JSON keys, file names, `nameof`, attribute arguments,
  comparisons, `Path` calls, and exception text that is not shown.
- A stored option keeps its source value. Translate the caption when the
  control is shown. Do not fill a static dictionary with `T(…)` at startup.
  `T()` at startup runs once and freezes.

```csharp
const string PresetLast12 = "Last 12 months";

string PresetCaption() => T("Last 12 months");
```

- `StringFormat` on a binding (`StringFormat='Cursor {0}'`) is invisible to
  `extract`. Move it to the view model as `T("Cursor {0}", value)`, and raise
  `PropertyChanged` from `LocaleChanged`.
- A combo bound to an enum (`System`, `Light`, `Dark`) shows `ToString()`.
  Keep the stored enum. Return `T("Light")` from the caption, and rebuild the
  item list on `LocaleChanged` so the old caption is not cached.
- Tray or menu items use `Tp("tray", "Open")` and a stable `CommandParameter`.
  Match the parameter, not the translated header.
- An error built in a service and shown later stays in the source language
  until the display site. Store the English sentence. The display site maps
  known sentences through `T`, so a later `LocaleChanged` can translate them.
  `T()` at the moment of the failure freezes that sentence.
- Linux `.desktop` `Name=` and `Comment=` are launcher metadata. Leave them in
  the source language. Translating `Name=` replaces the desktop file's default
  name.
- Compact durations that are compared before display (`2d`, `7h 47m`) stay as
  tokens. Translate `T("now")` and `T("in {0}", duration)` at the display
  site. Do not translate the tokens inside the comparison.
- A literal with leading or trailing spaces (`Updated: `) is an extract
  warning. Move the space into the format string (`T("Updated: {0}", value)`)
  or into the layout. The helper trims the catalog key and puts the spaces
  back. Clear the warning anyway.
- Text sent to a model stays in the source locale even when it is built from
  labels. Build that text before any user-locale `SetLocale`, or format it
  from the source strings. Do not change the static locale around asynchronous
  work. The catalog and the current locale are static. Setting
  `CurrentUICulture` does not give each request its own map. A multi-user
  server keeps `IStringLocalizer` or `ResourceManager`.

Work in passes: list string literals that are not passed to `T`, `Tn`, `Tp`,
or `N`, wrap the user-facing ones, then list again. Treat any bulk rewrite as
a draft and review its diff.

Then run `ai-i18n-tools extract`. Fix every warning. A literal that contains
`{name}` stops the run. Run `ai-i18n-tools migrate-dotnet-i18n` without
`--write` and read `migrate-dotnet-i18n-report.md`. It rewrites `T($"…")`,
concatenation, and `string.Format` inside `T` into `T("…{0}…", arg)`. Apply
`--write` only after reading the edits, run `extract` again, and repeat until
the dry run lists nothing you still need to fix. `--wrap` is an audit of
unmarked XAML label attributes and high-confidence C# sinks (`Text`, `Title`,
`Message`, `MessageBox.Show`). It does not edit logs, attributes, `nameof`,
comparisons, or `Path` calls. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

A phrase that looks like a plural (`{0} samples`) should be `Tn`, not `T`.
`Tn` may change the source-locale sentence when the old text was always
plural (`1 samples`).

Lines the command leaves in place (`await`, a raw `$$"""` string, a `? :`
hole, `ref` or `out`, a concatenation with no literal) are fixed by hand.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app still gets this
part: `--lang <code>` (and `-L` when that name is free), not a widget. Do not
read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Goal: one chosen language applies to every `T()` in that process, and a screen
can remember the choice. Persist the locale code, not the native name.

Load the language menu from `locales/ui-languages.json` on disk at startup,
before the first `T()`. Search upward from `AppContext.BaseDirectory`, then
from the current directory, at most 8 directories each. The first
`locales/ui-languages.json` wins. Map `code`, `label`, and `englishName` to
`LocaleInfo` (`label` is `NativeName`) and pass that array to `I18n.Configure`
as `Locales`. When the file is found, set `FlatDirectory` to that `locales`
directory in the same call. `Configure` replaces `Strict`, `FlatDirectory`,
and `OpenLocale` on every call, even when the caller only set `Locales`. A
later call that sets the language list clears a `FlatDirectory` set earlier.
`Locales: null` does not restore the previous list.

If `ui-languages.json` is missing, pass a one-element `Locales` array for the
source language and do not set `FlatDirectory`. The menu is the source
language only. Do not show `BuiltInLocales`. In development, `FlatDirectory`
is the `locales` folder that contained the manifest, so `sync` updates
sentences without a rebuild. A published build with no manifest nearby uses
the embedded catalogs and shows the source language only. An installer that
should follow `sync` must ship `ui-languages.json` and the locale JSON next
to the app.

Accept only codes from the list just passed. Set
`CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture`, then call
`I18n.SetLocale`, before the first `T()`. `SetLocale` raises `LocaleChanged`
immediately, so the cultures have to be set first. `string.Format` uses the
current UI culture, so `{0:C}` follows it. Restore the saved code the same
way at startup.

Add a control labelled `T("Language")` whose options are that list (`Code`,
`NativeName`). On change, set both cultures, then call `SetLocale`, and
persist the code.

On `LocaleChanged`, refresh view-model properties that call `T`. WinForms and
other toolkits that copy text into controls rebuild those properties in the
handler. For Avalonia, WPF, and MAUI, `TrExtension` returns `I18n.T(Text)` and
updates the target property on `LocaleChanged`. Exclude `TrExtension.cs` from
extraction. When the framework has a flow direction, set it from
`I18n.IsRightToLeft(code)`.

Avalonia only: ignore `SelectionChanged` unless `e.Source` is the control that
owns the handler. Do not assign `ItemsSource`, `SelectedItem`, or other combo
state inside a `SelectionChanged` handler, including from `LocaleChanged` if
that event was raised by the combo. Post the refresh with
`Dispatcher.UIThread.Post` so it runs after the selection event returns. Guard
the language handler with a flag while the code itself sets `SelectedItem`,
or the refresh will set the locale again. Avalonia will crash (exit code 139,
`SIGSEGV`, no managed stack in `crash.log`) if a parent `TabControl` handles
a child combo's `SelectionChanged` by setting `ItemsSource` again.

Do not use this helper as a per-user selector in a multi-user server. Keep
`IStringLocalizer` or `ResourceManager` for that case.

## Verify and report

The project's build and tests pass. `extract` writes a non-empty catalog of
the sentences you wrapped, with no warnings. With the source locale, the
output is unchanged, except a `Tn` singular that corrects a sentence that was
always plural. A missing key returns the source string unless `Strict` is
set. A bad format in a translation can throw `FormatException`. A dropped
`{0}` can omit the value. `string.Format` does not fall back to the source
template.

`I18n` and the two cultures are process-global. xUnit runs test classes in
parallel by default. When a test calls `SetLocale`, turn assembly
parallelization off and restore `CurrentCulture`, `CurrentUICulture`, the
locale, and the previous `Locales` array before the test returns. `Configure`
with `Locales: null` does not restore the list. With a locale file present,
one test sets a target locale and asserts that a validation message and a
caption change, while the stored option value stays in the source language,
then restores that static state. Do not add a test that only checks the menu
against `ui-languages.json` unless the user asks. If `dotnet` is not
installed, say the runtime check was skipped.

Report the files changed, each string you skipped with file, line, surface,
and reason, the same word used with different meanings, sentences built from
translated pieces, plurals left as one string, and any `T()` that runs at
startup.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools glossary-generate`
when `glossary-user.csv` is missing, then fill that file,
`ai-i18n-tools translate-ui`, then restart the app. With `FlatDirectory`
pointed at the `locales` folder, a restart picks up new sentences. A rebuild
is needed only when the manifest was not found and the app is still reading
embedded JSON. Also list these checks, and do not perform them: change
`targetLocales`, run `sync`, and launch with no further code edit (the menu
matches `ui-languages.json` and the sentences match the new locale file);
hide `ui-languages.json` and launch again (the menu is the source language
only); switch language from a combo inside a `TabControl` with that page
already open (the process stays up and the open labels change).
````

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- अंतर। रैप किया गया टेक्स्ट पहले जैसा ही पढ़ा जाना चाहिए, जिसमें कोई असंबद्ध रीफ़ॉर्मेटिंग न हो। `git diff --stat` दिखाता है कि कितना बदला है। हेल्पर प्लेसमेंट, `EmbeddedResource` आइटम, रैप किए गए कॉल और भाषा स्विच अपेक्षित संपादन हैं।
- जेनरेट किए गए कैटलॉग (`strings.json`, प्रति-स्थानिक JSON, `ui-languages.json`) को छोड़कर `extract` ने जो लिखा है, उसे छुआ नहीं गया है। `I18n.cs` को छोड़कर `SourceLocale` स्टैंप को छुआ नहीं गया है जब वह कॉन्स्ट बदल गया था। मेनू `ui-languages.json` से लोड किया जाता है। एक `Configure` कॉल `Locales` और `FlatDirectory` को एक साथ सेट करता है जब वह फ़ाइल मिली थी। `TrExtension` को एक्सट्रैक्शन से बाहर रखा गया है और `LocaleChanged` पर खुले दृश्य को अपडेट करता है।
- `ai-i18n-tools extract` साफ चलता है, और `strings.json` उन वाक्यों को सूचीबद्ध करता है जिनकी आप अपेक्षा करते हैं। कोई चेतावनी नहीं रहती है, और कोई भी लिटरल अभी भी `{name}` को शामिल नहीं करता है।
- `migrate-dotnet-i18n` का ड्राई रन कुछ भी नहीं सूचीबद्ध करता है जिसे ठीक करना बाकी है। एक साफ रिपोर्ट यह साबित नहीं करती कि हर वाक्य रैप किया गया था। एजेंट की रिपोर्ट में छोड़ी गई स्ट्रिंग उस जांच का बाकी हिस्सा हैं।
- आपके परीक्षण पास हो जाते हैं, और ऐप स्रोत भाषा में वैसा ही दिखता है।
- कोई भी बेकार स्क्रिप्ट या `migrate-dotnet-i18n-report.md` पीछे नहीं छोड़ा गया था।
- `I18n.cs` में `SourceLocale` कॉन्फ़िग में `sourceLocale` के बराबर है, अक्षर-दर-अक्षर। भाषा मेनू `BuiltInLocales` को नहीं पढ़ता है।

एजेंट द्वारा छोड़ी गई स्ट्रिंग बाद में मूल भाषा में रहने वाले टेक्स्ट के रूप में दिखाई देती हैं।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है और आपके खाते पर पैसे खर्च करता है।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। वही रैंकिंग `ai-i18n-tools dashboard` के [मॉडल](/hi/guide/translation-dashboard/models) टैब पर है।

पहले `translate-ui` से पहले शब्दकोश भरें। `init` `glossary.userGlossary` को `glossary-user.csv` पर इंगित करता है और फ़ाइल नहीं बनाता है। यदि फ़ाइल गायब है, तो `ai-i18n-tools glossary-generate` चलाएँ, फिर डोमेन शब्द जोड़ें। उन नामों के लिए **बल** का उपयोग करें जिन्हें अपरिवर्तित कॉपी किया जाना चाहिए। एक अपरिवर्तित स्ट्रिंग का दूसरा `translate-ui` अलग शब्दों में वापस आ सकता है। शब्दकोश ही है जो दोनों रनों को सहमत कराता है।

फिर निकालें और अनुवाद करें:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` `strings.json` और `ui-languages.json` लिखता है। `translate-ui` `ui.flatOutputDir` के अंतर्गत प्रति लक्ष्य भाषा के लिए एक JSON फ़ाइल लिखता है। उन उत्पन्न फ़ाइलों को असंपादित छोड़ दें। `sync` `extract` और `translate-ui` को एक साथ चलाता है जब `features.translateUIStrings` चालू होता है।

`T()` लोकेल JSON में स्रोत वाक्य को खोजता है। `strings.json` में आईडी लुकअप कुंजी नहीं है। एक गायब फ़ाइल या गायब कुंजी स्रोत वाक्य लौटाती है, जब तक कि `I18n.Strict` सेट न हो। `string.Format` फिर अनुवादित टेम्पलेट पर चलता है। एक अमान्य प्रारूप `FormatException` फेंक सकता है। एक गिरा हुआ `{0}` तर्क को छोड़ सकता है। प्रारूप त्रुटि के बाद स्रोत टेम्पलेट पर कोई फ़ॉलबैक नहीं है।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

ऐप को पुनरारंभ करें, एक लक्ष्य भाषा पर स्विच करें, और कुछ लिपटे स्ट्रिंग वाली स्क्रीन खोलें। एजेंट द्वारा जोड़े गए भाषा स्विच का उपयोग करें, या दोनों संस्कृतियों को सेट करें और स्वयं `I18n.SetLocale` को कॉल करें। वह टेक्स्ट जो अभी भी स्रोत भाषा में है, लपेटा नहीं गया था, `SetLocale` से पहले किसी नियंत्रण में कॉपी किया गया था, या लोकेल JSON में कोई प्रविष्टि नहीं है। कोड पर संदेह करने से पहले वाक्य के लिए JSON की जाँच करें।

`SetLocale` `CultureInfo.Parent` को तब तक चलता है जब तक कोई कैटलॉग नहीं खुलता (`pt-BR` `pt.json` लोड कर सकता है)। एम्बेडेड संसाधनों का उपयोग तब किया जाता है जब न तो `OpenLocale` और न ही `FlatDirectory` सेट होता है। एक कॉन्फ़िगर किया गया `FlatDirectory` फ़ाइल गायब होने पर एम्बेडेड JSON पर फ़ॉलबैक नहीं करता है।

जब स्टार्टअप को `locales/ui-languages.json` मिला, तो `FlatDirectory` वह डायरेक्टरी है, इसलिए जो वाक्य आप देखते हैं वे वे फ़ाइलें हैं जिन्हें `sync` ने अभी लिखा है। उस मैनिफेस्ट को छिपाएँ और फिर से शुरू करें: मेनू केवल स्रोत भाषा प्रदान करता है, और स्ट्रिंग अंतिम बिल्ड में बेक किए गए एम्बेडेड संसाधनों से आती हैं। एक स्थापित बिल्ड जिसे `sync` का पालन करना चाहिए, उसे `ui-languages.json` और ऐप के बगल में स्थानीय JSON शिप करना होगा।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `ai-i18n-tools sync` (या `extract` फिर `translate-ui`) को फिर से चलाएँ। कैश का मतलब है कि केवल नई या बदली हुई स्ट्रिंग मॉडल में जाती हैं। इसे CI में चलाएँ ताकि अनुवादों में बदलाव न हो। `FlatDirectory` को `locales` फ़ोल्डर की ओर इंगित करके, ऐप को पुनरारंभ करें। रीबिल्ड की आवश्यकता तभी होती है जब मैनिफेस्ट नहीं मिला था और ऐप अभी भी एम्बेडेड JSON पढ़ रहा है। `ai-i18n-tools dashboard` अनुवादों की समीक्षा करने के लिए [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

एक कॉपी किए गए `I18n.cs` को ताज़ा करने के लिए, एक डिस्पोजेबल निर्देशिका में उसी टेम्पलेट को स्कैफोल्ड करें और केवल उस उत्पन्न फ़ाइल को कॉपी करें जिसे आप बदलना चाहते हैं। हेल्पर को अपग्रेड करने के लिए ऐप में `init` को पुनः न चलाएँ।

`README.md` को उसी रन में अनुवाद करने के लिए, `--with-readme` के साथ स्कैफोल्ड करें (या किसी मौजूदा कॉन्फ़िग में ब्लॉक जोड़ें)। देखें [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है, तो इन चरणों का पालन करें। प्रत्येक चरण प्रॉम्प्ट के एक भाग से मेल खाता है। आप अंत में अभी भी [CLI इंस्टॉल करें](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करें](#initialise-the-project), और [अनुवाद करें](#choose-models-and-translate)।

1. [हेल्पर रखें और कैटलॉग एम्बेड करें](#step-1-place-the-helper-and-embed-the-catalogs)।
2. [स्ट्रिंग लपेटें](#step-2-wrap-strings) `T()`, `Tn`, `Tp`, `N`, या `{loc:Tr '…'}` में।
3. [लिपटे कॉल की जाँच करें](#step-3-check-wrapped-calls) `migrate-dotnet-i18n` के साथ।
4. [भाषा स्विच जोड़ें](#step-4-add-a-language-switch)।

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## चरण 1: हेल्पर रखें और कैटलॉग एम्बेड करें

`init` इन्हें रिपॉजिटरी रूट पर लिखता है:

| फ़ाइल | यह क्या है | इसे संपादित करें? |
| --- | --- | --- |
| `I18n.cs` | हेल्पर जिसे आपका कोड कॉल करता है (`T`, `Tn`, `Tp`, `SetLocale`) | नहीं। यह उत्पन्न होता है। `init` इसे अधिलेखित नहीं करेगा |
| `locales/strings.json` | निष्कर्षण कैश। ऐप इसे कभी नहीं पढ़ता | नहीं। `extract` इसे लिखता है |
| `locales/<code>.json` | अनुवाद जिन्हें ऐप लोड करता है, प्रति भाषा एक फ़ाइल | नहीं। `translate-ui` उन्हें लिखता है |
| `locales/ui-languages.json` | भाषा मेनू। ऐप स्टार्टअप पर `code`, `label`, और `englishName` पढ़ता है | नहीं। `extract` इसे लिखता है |

`I18n.cs` और `locales/` को एप्लिकेशन प्रोजेक्ट में ले जाएँ। उस `.csproj` में एम्बेड जोड़ें और बाकी फ़ाइल को अकेला छोड़ दें:

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

शामिल पथ प्रोजेक्ट फ़ाइल के सापेक्ष है। .NET Framework 4.8 को `System.Text.Json` पैकेज की भी आवश्यकता है। .NET 6 या नए में यह पहले से ही है।

कॉन्फ़िग को नई जगह पर अपडेट करें, और `sourceRoots` को एप्लिकेशन प्रोजेक्ट पर इंगित करें ताकि टेस्ट और बिल्ड आउटपुट कैटलॉग से बाहर रहें:

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

`global using static MyApp.I18n;` जोड़ें (`I18n.cs` में मुद्रित नेमस्पेस का उपयोग करें), या प्रत्येक साइट पर `I18n.T` को कॉल करें।

हेल्पर में `SourceLocale` कॉन्फ़िग में `sourceLocale` के बराबर होना चाहिए। `ai-i18n-tools-locales` मार्करों के बीच `BuiltInLocales`, वह सूची है जिसे `init` ने स्टैंप किया है। यह मेनू नहीं है। `targetLocales` बदलने के बाद, `extract` `ui-languages.json` को फिर से लिखता है, और ऐप उस फ़ाइल को पढ़ता है। जब आपको एक नए हेल्पर की आवश्यकता हो तो एक डिस्पोजेबल डायरेक्टरी को स्केफोल्ड करें। यहाँ `init` को फिर से न चलाएँ।

`ai-i18n-tools extract` से पुष्टि करें। कैटलॉग नए `locales/` फ़ोल्डर में दिखना चाहिए। जब तक कुछ रैप नहीं किया जाता, तब तक 0 स्ट्रिंग की अपेक्षा करें।

<a id="step-2-wrap-strings"></a>
## चरण 2: स्ट्रिंग्स को रैप करें

`extract` एक स्ट्रिंग तभी रिकॉर्ड करता है जब वह `T()`, `Tn`, `Tp`, `N`, या `{loc:Tr '…'}` को पास किया गया एक लिटरल हो। `I18n.T` जैसा एक रिसीवर मेल खाता है क्योंकि अंतिम नाम `T` है।

पहले कैटलॉग एंट्री देखें, फिर परिणाम को `string.Format` को पास करें:

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

इन्हें निकाला जाता है और फिर अस्वीकार कर दिया जाता है, क्योंकि कैटलॉग उस चीज़ से मेल नहीं खाएगा जिसे प्रोग्राम देखता है:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` पहले तीन के लिए एक चेतावनी प्रिंट करता है और `{name}` पर रुक जाता है। [अगला चरण](#step-3-check-wrapped-calls) पहले तीन को फिर से लिखता है।

प्लेसहोल्डर .NET फ़ॉर्म में रहते हैं: `{0}`, `{0,-10}`, `{0:C}`। `%` सामान्य टेक्स्ट है, इसलिए `10% off` जैसा अनुवाद printf टोकन नहीं है। दोहरे ब्रेसेस (<code v-pre>{{</code> और `}}`) लिटरल ब्रेसेस हैं और उन्हें अपरिवर्तित कॉपी किया जाना चाहिए। अधिक कॉल आकार: [कॉल जो अनुवाद करते हैं](/hi/guide/ui-strings/dotnet#calls-that-translate)।

XAML और AXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

उपसर्ग को अनदेखा किया जाता है। `{Binding}` और `{StaticResource}` को अकेला छोड़ दिया जाता है। एलिमेंट कंटेंट के रूप में लिखा गया टेक्स्ट निकाला नहीं जाता है। एक लिटरल जिसमें एक एपोस्ट्रोफी होता है, उसे `&quot;` के साथ लिखा जाता है ताकि एट्रीब्यूट डबल कोट्स में रह सके।

Avalonia, WPF, और MAUI प्रत्येक अपनी `MarkupExtension` बेस क्लास प्रदान करते हैं। हेल्पर उन असेंबलियों को संदर्भित नहीं करता है। `ProvideValue` `I18n.T(Text)` लौटाता है और `LocaleChanged` पर उस प्रॉपर्टी को फिर से सेट करता है, फिर जब कंट्रोल विज़ुअल ट्री छोड़ता है तो सदस्यता रद्द कर देता है। एक Avalonia आकार (`IProvideValueTarget` `Avalonia.Metadata` में है):

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }

    public override object ProvideValue(IServiceProvider serviceProvider)
    {
        var text = I18n.T(Text);
        if (serviceProvider.GetService(typeof(IProvideValueTarget)) is IProvideValueTarget target
            && target.TargetObject is AvaloniaObject control
            && target.TargetProperty is AvaloniaProperty property)
        {
            void Refresh() => control.SetValue(property, I18n.T(Text));
            I18n.LocaleChanged += Refresh;
            if (control is StyledElement element)
            {
                element.DetachedFromVisualTree += (_, _) => I18n.LocaleChanged -= Refresh;
            }
        }
        return text;
    }
}
```

WPF और MAUI अपनी स्वयं की प्रॉपर्टी प्रकारों के साथ ऐसा ही करते हैं। `**/TrExtension.cs` को `ui.uiExtractor.exclude` में जोड़ें। `T(Text)` एक लिटरल नहीं है, और XAML लिटरल पहले ही `Tr` के माध्यम से निकाले जा चुके हैं। `{loc:Tr}` केवल `T` को कॉल कर सकता है। एक छोटे शब्द के दो अर्थ कोड में `Tp` के साथ सेट किए जाते हैं।

स्वरूपित वाक्य C# (`T("Cursor {0}", value)`) में रहते हैं, जो एक्सट्रैक्टर को एक ही लिटरल पर रखता है। बाइंडिंग पर `StringFormat` `extract` के लिए अदृश्य है। वही कॉल एक व्यू मॉडल, एक ट्रे टूलटिप और एक डायलॉग से काम करता है। व्यू-मॉडल स्ट्रिंग के लिए `LocaleChanged` से `PropertyChanged` को बढ़ाएँ।

एक मान जो संग्रहीत और प्रदर्शित दोनों होता है, संग्रहीत मान को स्रोत भाषा में रखता है। एक एनम कॉम्बो एनम को रखता है और अपने कैप्शन से `T("Light")` लौटाता है, फिर `LocaleChanged` पर आइटमों को फिर से बनाता है। `N("Last 12 months")` मौजूद है ताकि एक स्टैटिक फ़ील्ड एक लिटरल को रख सके जिसे एक्सट्रैक्टर देखता है। एक स्टैटिक डिक्शनरी में `T()` एक बार चलता है, पहले टाइप लोड पर, और उसी भाषा पर रहता है। एक सेवा अंग्रेजी त्रुटि वाक्य को संग्रहीत करती है। डिस्प्ले साइट ज्ञात वाक्यों को `T` के माध्यम से मैप करती है, ताकि बाद में स्थानीय भाषा बदलने पर उनका अनुवाद किया जा सके। विफलता पर `T()` उस वाक्य को स्थिर कर देता है।

एक ट्रे आइटम `Tp("tray", "Open")` और एक स्थिर `CommandParameter` का उपयोग करता है। पैरामीटर से मिलान करें, हेडर से नहीं। Linux `.desktop` `Name=` और `Comment=` स्रोत भाषा में रहते हैं। अवधि टोकन जिनकी तुलना की जाती है (`2d`, `7h 47m`) अपरिवर्तित रहते हैं। `T("now")` और `T("in {0}", duration)` का अनुवाद करें जहाँ टेक्स्ट दिखाया गया है। एक अग्रणी या अनुगामी स्थान वाला लिटरल (`Updated: `) अभी भी एक एक्सट्रैक्ट चेतावनी है। स्थान को फ़ॉर्मेट स्ट्रिंग या लेआउट में ले जाएँ। `Tn` एक स्रोत वाक्य को बदल सकता है जो हमेशा बहुवचन था (`1 samples`)।

इन्हें अकेला छोड़ दें: लॉग, JSON प्रॉपर्टी नाम, फ़ाइल नाम, `nameof`, एट्रीब्यूट आर्ग्यूमेंट्स, आइडेंटिफ़ायर के रूप में उपयोग की जाने वाली ऑब्जेक्ट कुंजियाँ, और एक्सेप्शन टेक्स्ट जिसे प्रोग्राम दिखाता नहीं बल्कि मैच करता है।

`ai-i18n-tools extract` को फिर से चलाएँ। कैटलॉग में अब आपके द्वारा रैप किए गए वाक्य सूचीबद्ध होने चाहिए।

<a id="step-3-check-wrapped-calls"></a>
## चरण 3: रैप किए गए कॉल की जाँच करें

इस चरण का उपयोग करें जब एक कॉल कैटलॉग लुकअप से पहले स्ट्रिंग को स्वरूपित करता है:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` उन्हें एक लुकअप में फिर से लिखता है जो पहले होता है। दूसरी बार चलाने से कुछ नहीं बदलता।

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

कमांड एक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह `migrate-dotnet-i18n-report.md` लिखता है। उस रिपोर्ट को पढ़ें। जब संपादन सही दिखें:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

ड्राई रन फिर से चलाएँ। जब यह कोई संपादन सूचीबद्ध न करे, तो रुकें, फिर प्रोजेक्ट के परीक्षण चलाएँ। जगह पर छोड़ी गई लाइनें (`await`, एक रॉ इंटरपोलेटेड रॉ स्ट्रिंग, एक कंडीशनल होल, `ref` या `out`, बिना लिटरल के एक कॉन्कैटिनेशन, `string.Format` को पास किया गया एक `IFormatProvider`) हाथ से ठीक की जाती हैं। एक वाक्यांश जो बहुवचन जैसा दिखता है, वह `Tn` में आता है, जो एक स्रोत वाक्य को सही कर सकता है जो हमेशा बहुवचन था। जनरेट किया गया `I18n.cs` छोड़ दिया जाता है। रिपोर्ट को हटा दें या उसे git-ignore करें।

`--wrap` बिना चिह्नित XAML `Text`, `Header`, `Content`, और अन्य लेबल एट्रीब्यूट्स को `{loc:Tr '…'}` के रूप में भी चिह्नित करता है, साथ ही C# असाइनमेंट जिनके नाम `Text`, `Title`, या `Message` में समाप्त होते हैं, और `MessageBox.Show`। `--write` के बिना यह एक ऑडिट है। यह लॉग, एट्रीब्यूट्स, `nameof`, तुलनाओं, या `Path` कॉल्स को संपादित नहीं करता है।

बिना किसी संपादन वाली रिपोर्ट का मतलब है कि रैप किए गए कॉल सुरक्षित हैं। इसका मतलब यह नहीं है कि हर उपयोगकर्ता-सामने वाला वाक्य रैप किया गया था। सीधे लेबल, लौटाई गई स्ट्रिंग और एलिमेंट सामग्री इसके लिए अदृश्य हैं। विवरण: [असुरक्षित कॉल को फिर से लिखें](/hi/guide/ui-strings/dotnet#rewrite-unsafe-calls)।

<a id="step-4-add-a-language-switch"></a>
## चरण 4: भाषा स्विच जोड़ें

पहले `T()` से पहले, `locales/ui-languages.json` खोजें। `AppContext.BaseDirectory` से ऊपर की ओर खोजें, फिर वर्तमान डायरेक्टरी से, प्रत्येक में अधिकतम 8 डायरेक्टरी तक। पहली फ़ाइल जीतती है। `code`, `label`, और `englishName` को `LocaleInfo` में पार्स करें (`label` `NativeName` है)। उस ऐरे को `Locales` के रूप में और `FlatDirectory` को उस `locales` डायरेक्टरी पर सेट करके `Configure` को एक बार कॉल करें जिसमें फ़ाइल थी। `Configure` हर कॉल पर `Strict`, `FlatDirectory`, और `OpenLocale` को बदल देता है। एक बाद की कॉल जो केवल `Locales` सेट करती है, `FlatDirectory` को साफ़ कर देती है। `Locales: null` पिछली सूची को पुनर्स्थापित नहीं करता है।

यदि फ़ाइल गुम है, तो स्रोत भाषा के लिए एक-एलिमेंट `Locales` ऐरे पास करें और `FlatDirectory` सेट न करें। मेनू केवल स्रोत भाषा में है। `BuiltInLocales` न दिखाएँ। डेवलपमेंट तब कैटलॉग `sync` को पढ़ता है जो अभी लिखे गए थे। आस-पास कोई मैनिफ़ेस्ट न होने वाला प्रकाशित बिल्ड एम्बेडेड कैटलॉग रखता है। एक इंस्टॉलर जिसे `sync` का पालन करना चाहिए, वह `ui-languages.json` और locale JSON को ऐप के बगल में भेजता है।

स्थानीय कोड को बनाए रखें, मूल नाम को नहीं। `SetLocale` से पहले दोनों कल्चर सेट करें, क्योंकि `LocaleChanged` उस कॉल के अंदर सक्रिय होता है:

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

कंट्रोल को `T("Language")` से लेबल करें। आपके द्वारा पास की गई सूची से केवल कोड स्वीकार करें। `LocaleChanged` पर, व्यू-मॉडल स्ट्रिंग के लिए `PropertyChanged` बढ़ाएँ, या उन कंट्रोल्स को फिर से बनाएँ जिन्होंने अपना टेक्स्ट कॉपी किया था। `TrExtension` खुले हुए व्यू को अपडेट करता है, जैसा कि [चरण 2](#step-2-wrap-strings) में है। जब फ़्रेमवर्क में फ़्लो डायरेक्शन हो, तो उसे `I18n.IsRightToLeft(code)` से सेट करें।

Avalonia: `SelectionChanged` को अनदेखा करें जब तक कि `e.Source` वह कंट्रोल न हो जो हैंडलर का मालिक है। उस हैंडलर के अंदर, या एक `LocaleChanged` के अंदर `ItemsSource` या `SelectedItem` असाइन न करें जिसे इस कॉम्बो के `SetLocale` ने उठाया था। रिफ्रेश को `Dispatcher.UIThread.Post` के साथ पोस्ट करें। हैंडलर को तब तक सुरक्षित रखें जब तक कोड `SelectedItem` सेट करता है। एक पैरेंट `TabControl` जो बबल्ड इवेंट को टैब परिवर्तन के रूप में मानता है और `ItemsSource` को फिर से असाइन करता है, प्रक्रिया को क्रैश कर देता है (एग्जिट कोड 139, खाली `crash.log`)।

एक कंसोल प्रोग्राम में कोई विजेट नहीं होता है। `--lang <code>` जोड़ें (और `-L` जब वह नाम खाली हो)। ऊपर लोड की गई सूची से केवल कोड स्वीकार करें। `AI_I18N_LANG` न पढ़ें। वह वेरिएबल केवल ai-i18n-tools CLI के लिए है।

इस चरण को छोड़ दें जब प्रोग्राम कोई ऐसा टेक्स्ट न दिखाए जिसे कोई व्यक्ति पढ़ता हो।

कैटलॉग और वर्तमान लोकले स्थिर हैं। यह एक डेस्कटॉप प्रक्रिया के लिए सुरक्षित है। यह एक बहु-उपयोगकर्ता सर्वर के लिए प्रति-अनुरोध लोकले नहीं है। वहाँ `IStringLocalizer` या `ResourceManager` रखें, और [एक .NET ResourceManager ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-dotnet-resourcemanager) का पालन करें। `CurrentUICulture` सेट करने से प्रत्येक अनुरोध को उसका अपना मैप नहीं मिलता है।

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate) पर जारी रखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपका आज का कोड | पढ़ें |
| --- | --- |
| `ResourceManager`, `.resx` सैटेलाइट, या ASP.NET `IStringLocalizer` | [एक .NET ResourceManager ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-dotnet-resourcemanager) |
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
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `I18n.cs` के xUnit चेक: एम्बेडेड JSON, कल्चर फ़ॉलबैक, `{0}`, बहुवचन, और `Configure` |

ये डायरेक्टरीज़ हेल्पर की जाँच करती हैं। ये अनुवाद करने के लिए ऐप्स नहीं हैं, और इन्हें API कुंजी की आवश्यकता नहीं है। उस डायरेक्टरी में `dotnet test` जाँचें चलाता है। एक वास्तविक ऐप इस पृष्ठ पर `init` से शुरू होता है। `npx degit` के साथ एक कॉपी करें, या GitHub रिलीज़ से `ai-i18n-tools-dotnet-examples.zip` डाउनलोड करें। उस ज़िप में `assets/dotnet` भी शामिल है, जिसे प्रोजेक्ट संकलित करता है। कमांड्स: [उदाहरण](/hi/examples#net-examples)।
