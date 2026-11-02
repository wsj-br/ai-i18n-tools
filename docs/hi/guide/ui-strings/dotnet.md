<a id="dotnet-applications"></a>
# .NET एप्लिकेशन

`ai-i18n-tools` C#, Razor, cshtml, XAML और AXAML से UI स्ट्रिंग निकालता है, फिर स्रोत-भाषा स्ट्रिंग द्वारा कुंजीबद्ध फ़्लैट JSON लिखता है। `sourceLocale` कोई भी भाषा हो सकती है। रनटाइम हेल्पर `I18n.cs` (.NET 6 या नया, कोई NuGet पैकेज नहीं) है। Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor और कंसोल ऐप उस हेल्पर को कॉल करते हैं। .NET Framework 4.8 को फ़ाइल संकलित होने से पहले `System.Text.Json` पैकेज की आवश्यकता होती है।

मौजूदा एकल-भाषा ऐप में स्थानीय भाषाएँ जोड़ना: [.NET ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-dotnet)।

<a id="scaffold"></a>
## स्काफ़ोल्ड

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` `ai-i18n-tools.config.json` लिखता है और, जब `I18n.cs` अनुपस्थित होता है, तो [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) को प्रोजेक्ट में कॉपी करता है। `--namespace` C# नेमस्पेस सेट करता है। जब इसे छोड़ा जाता है और डायरेक्टरी में एक `.csproj` होता है, तो `init` उस फ़ाइल के `RootNamespace` का उपयोग करता है, या प्रोजेक्ट फ़ाइल नाम का। अन्यथा नेमस्पेस `AiI18n` होता है।

`init` प्रोजेक्ट फ़ाइल को संपादित नहीं करता है। असेंबली में स्थानीय JSON जोड़ें:

```xml
<EmbeddedResource Include="locales/*.json" />
```

स्कैन `bin`, `obj`, `.vs`, `TestResults`, और `packages` नामक निर्देशिकाओं को छोड़ देता है। टेम्पलेट `uiExtractor.exclude` को `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**`, और `**/TrExtension.cs` पर भी सेट करता है।

<a id="calls-that-translate"></a>
## अनुवाद करने वाले कॉल

पहले कैटलॉग एंट्री देखें, फिर परिणाम को `string.Format` पर पास करें। डिफ़ॉल्ट नाम `T`, `Tn`, `Tp`, `N`, `Tr`, और `Loc` हैं। `I18n.T` जैसा रिसीवर मेल खाता है क्योंकि अंतिम नाम `T` है।

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` अपने तर्क को लौटाता है और केवल इसलिए है ताकि एक स्टैटिक फ़ील्ड, एनम लेबल, या एट्रिब्यूट एक लिटरल को पकड़ सके जिसे एक्सट्रैक्टर देख सके। इसे बाद में `T(label)` के साथ दिखाएँ।

`Tn`, `{0}` को गणना के रूप में मानता है। इसके बाद अतिरिक्त तर्क (`{1}`, `{2}`) आते हैं। एकवचन उस गणना को एक लिटरल (`1 sample`) के रूप में लिख सकता है, जबकि बहुवचन `{0}` को रखता है। अनुवाद बहुवचन श्रेणियों पर `{0}` को रखता है और एकवचन पर शाब्दिक संख्या को छोड़ देता है।

`Tp` संदर्भ और स्रोत स्ट्रिंग को एक कुंजी (संदर्भ, U+0004, स्रोत) के तहत संग्रहीत करता है, वही विभाजक जो फ़्लैट JSON पहले से उपयोग करता है। इसका उपयोग तब करें जब एक ही छोटा शब्द अलग-अलग चीज़ों का मतलब हो (विंडो को `Open` करें और फ़ाइल को `Open` करें)।

XAML और AXAML एक मार्कअप एक्सटेंशन का उपयोग करते हैं जिसका प्रकार नाम `funcNames` में है। उपसर्ग को अनदेखा किया जाता है:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}`, और `{x:Static}` को निकाला नहीं जाता है। एलिमेंट सामग्री के रूप में लिखा गया टेक्स्ट (`<TextBlock>Hello</TextBlock>`) को निकाला नहीं जाता है। एक लिटरल जिसमें एपोस्ट्रोफी होता है, उसे `&quot;` में तर्क के साथ लिखा जाता है ताकि XML एट्रिब्यूट डबल कोट्स में रह सके: `Content="{loc:Tr &quot;Don't&quot;}"`।

इन्हें निकाला जाता है और फिर अस्वीकार कर दिया जाता है, क्योंकि कैटलॉग उस चीज़ से मेल नहीं खाएगा जिसे प्रोग्राम देखता है:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

एक लिटरल पास करें, और `{name}` के बजाय `{0}` का उपयोग करें। `string.Format` एक नामित आइटम पर त्रुटि देता है। `extract` पहले तीन के लिए एक चेतावनी प्रिंट करता है और `{name}` पर रुक जाता है।

अग्रणी या अनुगामी व्हाइटस्पेस वाला एक लिटरल अभी भी कैटलॉग किया जाता है। `I18n.T` कुंजी को ट्रिम करता है, उसे देखता है, और उस व्हाइटस्पेस को परिणाम पर वापस रखता है। `T("Updated: {0}", value)` को प्राथमिकता दें ताकि अनुवादक विभाजक देख सकें।

<a id="placeholders"></a>
## प्लेसहोल्डर

`ui-dotnet` `uiExtractor.placeholderStyle` को `dotnet` पर सेट करता है। वह शैली `{0}`, `{0,-10}`, `{0:C}`, और `{0,-10:C}` को रखती है। `%` सामान्य टेक्स्ट है, इसलिए `10% e 20%` जैसा अनुवाद printf टोकन के रूप में नहीं माना जाता है। दोहरे ब्रेसेस (<code v-pre>{{</code> और `}}`) लिटरल ब्रेसेस हैं और उन्हें अपरिवर्तित कॉपी किया जाना चाहिए। `{name}` एक्सट्रैक्ट समय पर एक त्रुटि है।

डिफ़ॉल्ट शैली, जिसका उपयोग JavaScript और Python द्वारा किया जाता है, अपरिवर्तित है।

<a id="runtime"></a>
## रनटाइम

`I18n.SetLocale("pt-BR")` `CultureInfo.Parent` में तब तक चलता है जब तक कोई कैटलॉग नहीं खुल जाता। `OpenLocale` का उपयोग तब किया जाता है जब इसे सेट किया जाता है। अन्यथा एक कॉन्फ़िगर किया गया `FlatDirectory` एकमात्र स्रोत होता है: वहाँ एक गुम हुई फ़ाइल एम्बेडेड JSON तक नहीं पहुँचती है। एम्बेडेड संसाधनों का उपयोग तभी किया जाता है जब न तो `OpenLocale` और न ही `FlatDirectory` सेट किया गया हो। एक गुम हुई कुंजी स्रोत स्ट्रिंग लौटाती है। `I18n.Strict = true` इसके बजाय त्रुटि देता है, जो परीक्षणों में उपयोगी है। `string.Format` को अनुवादित टेम्पलेट पर कॉल किया जाता है। एक अमान्य प्रारूप `FormatException` त्रुटि दे सकता है। एक छोड़ा गया `{0}` तर्क को छोड़ सकता है। प्रारूप त्रुटि के बाद स्रोत टेम्पलेट पर कोई फ़ॉलबैक नहीं होता है।

`I18n.SupportedLocales` init पर स्टैम्प की गई सूची के रूप में शुरू होता है (`BuiltInLocales`: मूल नाम और अंग्रेज़ी नाम)। भाषा मेनू उस स्टैम्प को नहीं पढ़ता। पहले `T()` से पहले, `AppContext.BaseDirectory` से ऊपर की ओर खोजें, फिर वर्तमान निर्देशिका से, प्रत्येक में अधिकतम 8 निर्देशिकाएँ, `locales/ui-languages.json` के लिए। पहली फ़ाइल जीतती है। `code`, `label`, और `englishName` को `LocaleInfo` पर मैप करें (`label` मूल नाम है) और उन्हें `Configure` को `Locales` के रूप में पास करें, उसी कॉल में `FlatDirectory` को उस `locales` निर्देशिका पर सेट करके। हर `Configure` कॉल `Strict`, `FlatDirectory`, और `OpenLocale` को बदल देता है। बाद में केवल `Locales` सेट करने वाला कॉल `FlatDirectory` को साफ़ कर देता है। एक null `Locales` सरणी वर्तमान सूची को यथावत छोड़ देती है और `BuiltInLocales` को पुनर्स्थापित नहीं करती। यदि मैनिफ़ेस्ट गायब है, तो स्रोत भाषा के लिए एक-तत्व सूची पास करें और `FlatDirectory` सेट न करें। मेनू तब केवल स्रोत भाषा होता है, और कैटलॉग एम्बेडेड रहते हैं। विकास उन फ़ाइलों को पढ़ता है जो `sync` ने अभी लिखी थीं। एक इंस्टॉलर जो `sync` का पालन करना चाहिए, ऐप के बगल में `ui-languages.json` और लोकेल JSON भेजता है।

`I18n.IsRightToLeft` `CultureInfo.TextInfo` पढ़ता है। ऐप `CultureInfo.CurrentUICulture` और `CultureInfo.CurrentCulture` स्वयं सेट करता है, और लोकेल कोड को बनाए रखता है। `string.Format` वर्तमान UI संस्कृति का उपयोग करता है, इसलिए `{0:C}` उस संस्कृति का अनुसरण करता है।

`LocaleChanged` `SetLocale` के अंदर फायर होता है। पहले `CurrentUICulture` और `CurrentCulture` सेट करें ताकि एक रीफ़्रेश हैंडलर नई संस्कृति के साथ फ़ॉर्मेट करे। `T` को कॉल करने वाले व्यू-मॉडल गुणों को उस ईवेंट से `PropertyChanged` उठाना चाहिए। Avalonia, WPF और MAUI के लिए, मार्कअप एक्सटेंशन `I18n.T(Text)` लौटाता है और `LocaleChanged` पर उस गुण को फिर से सेट करता है, फिर जब नियंत्रण विज़ुअल ट्री छोड़ता है तो अनसब्सक्राइब करता है। कैटलॉग और वर्तमान लोकेल स्थिर हैं। यह डेस्कटॉप प्रक्रिया के लिए सुरक्षित है। यह बहु-उपयोगकर्ता सर्वर के लिए प्रति-अनुरोध लोकेल नहीं है। वहाँ `IStringLocalizer` या `ResourceManager` रखें। `CurrentUICulture` सेट करने से प्रत्येक अनुरोध को अपना नक्शा नहीं मिलता।

कॉपी किए गए हेल्पर को रीफ़्रेश करने के लिए, उसी टेम्पलेट को एक डिस्पोज़ेबल डायरेक्टरी में स्कैफ़ोल्ड करें और केवल जेनरेट की गई फ़ाइल को कॉपी करें जिसे आप बदलना चाहते हैं। हेल्पर को अपग्रेड करने के लिए ऐप में `init` को फिर से न चलाएँ।

फ़ाइल `ai-i18n-tools-i18n-cs:` से शुरू होती है, इसलिए `extract` इसे छोड़ देता है।

<a id="desktop-recipe"></a>
## डेस्कटॉप रेसिपी

Avalonia, WPF और MAUI में प्रत्येक का अपना मार्कअप-एक्सटेंशन बेस क्लास है। हेल्पर उन असेंबलियों को संदर्भित नहीं करता। `ProvideValue` `I18n.T(Text)` लौटाता है और `LocaleChanged` पर उस गुण को फिर से सेट करता है। जब नियंत्रण विज़ुअल ट्री छोड़ता है तो अनसब्सक्राइब करें। `**/TrExtension.cs` को `ui.uiExtractor.exclude` में जोड़ें ताकि `T(Text)` को गैर-शाब्दिक के रूप में रिपोर्ट न किया जाए। XAML शाब्दिक पहले से ही `Tr` के माध्यम से निकाले गए हैं। `{loc:Tr}` केवल `T` को कॉल कर सकता है। एक छोटे शब्द के दो अर्थ `Tp` के साथ कोड में सेट किए गए हैं।

एक Avalonia आकृति (`IProvideValueTarget` `Avalonia.Metadata` में है):

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

WPF और MAUI अपने स्वयं के गुण प्रकारों के साथ समान विचार का उपयोग करते हैं। केवल Avalonia: `SelectionChanged` को अनदेखा करें जब तक कि `e.Source` वह नियंत्रण न हो जो हैंडलर का मालिक है। उस हैंडलर के अंदर, या उस `LocaleChanged` के अंदर `ItemsSource` या `SelectedItem` असाइन न करें जिसे इस कॉम्बो के `SetLocale` ने उठाया था। `Dispatcher.UIThread.Post` के साथ रीफ़्रेश पोस्ट करें, और कोड `SelectedItem` सेट करते समय हैंडलर को गार्ड करें। एक पैरेंट `TabControl` जो बबल्ड ईवेंट से `ItemsSource` को फिर से असाइन करता है, प्रक्रिया को क्रैश कर देता है (एग्ज़िट कोड 139, खाली `crash.log`)।

फ़ॉर्मेटेड वाक्य C# में रहते हैं (`T("Cursor {0}", value)`), जो एक्सट्रैक्टर को एकल शाब्दिक पर रखता है। बाइंडिंग पर `StringFormat` अदृश्य है। वही कॉल व्यू मॉडल, ट्रे टूलटिप और डायलॉग से काम करता है। एक एनम कॉम्बो एनम रखता है, उसके कैप्शन से `T("Light")` लौटाता है, और `LocaleChanged` पर आइटम फिर से बनाता है। एक ट्रे आइटम `Tp("tray", "Open")` और एक स्थिर `CommandParameter` का उपयोग करता है। पैरामीटर का मिलान करें, हेडर का नहीं। एक सेवा अंग्रेज़ी त्रुटि वाक्य संग्रहीत करती है, और प्रदर्शन साइट `T` के माध्यम से ज्ञात वाक्यों को मैप करती है। Linux `.desktop` `Name=` और `Comment=` स्रोत भाषा में रहते हैं। तुलना किए गए अवधि टोकन (`2d`, `7h 47m`) अनुवादित नहीं रहते। `T("now")` और `T("in {0}", duration)` का प्रदर्शन साइट पर अनुवाद करें। शाब्दिक पर अग्रणी या अनुगामी स्थान अभी भी एक निष्कर्षण चेतावनी है। इसे फ़ॉर्मेट स्ट्रिंग या लेआउट में ले जाएँ। `Tn` एक स्रोत वाक्य को सही कर सकता है जो हमेशा बहुवचन था (`1 samples`)।

<a id="migrate"></a>
## असुरक्षित कॉलों को फिर से लिखें

`migrate-dotnet-i18n` तब तक एक ड्राई रन है जब तक आप `--write` पास नहीं करते। यह `T`, `Tn` और `Tp` के उन आर्गुमेंट को फिर से लिखता है जो लुकअप से पहले बनाए जाते हैं:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`T("Saved to {0}", path)`, `T("Last synced {0}", date)` और `T("Hello {0}", name)` बन जाते हैं। एक दोहराया गया साधारण नाम एक आर्गुमेंट रहता है। `(int)status` जैसा एक कास्ट अपना खुद का इंडेक्स रखता है। रिपोर्ट `migrate-dotnet-i18n-report.md` उन सभी चीज़ों को सूचीबद्ध करती है जो अपनी जगह पर बची हैं: `await`, एक कच्ची `$$"""` स्ट्रिंग, एक `? :` होल, `ref` या `out`, बिना लिटरल वाला एक संयोजन, `string.Format` को पास किया गया एक `IFormatProvider`, और एक वाक्यांश जो बहुवचन जैसा दिखता है (`{0} samples` को `Tn` होना चाहिए)।

`--wrap` बिना चिह्नित XAML `Text`, `Header`, `Content` और अन्य लेबल एट्रिब्यूट को `{loc:Tr '...'}` के रूप में भी चिह्नित करता है, और C# असाइनमेंट जिनके नाम `Text`, `Title`, `Message` और अन्य उच्च-विश्वास वाले सफिक्स में समाप्त होते हैं, साथ ही `MessageBox.Show` और `ConfirmDialog.Show` को भी। `--write` के बिना यह एक ऑडिट है। यह लॉग, एट्रिब्यूट, `nameof`, तुलना या `Path` कॉलों को संपादित नहीं करता है। दूसरा रन कुछ भी नहीं बदलता है।

जब `extract` एक न्यूट्रल `.resx` को ग्रहण करता है, तो वही रिपोर्ट एक Named resource keys सेक्शन प्राप्त करती है। `Resources.LoginButton` जैसी एक लाइन को `T("Sign in")` के रूप में सूचीबद्ध किया जाता है। वे लाइनें सुझाव हैं। कमांड उन्हें संपादित नहीं करता है।
