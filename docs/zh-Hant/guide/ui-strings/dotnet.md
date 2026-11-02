<a id="dotnet-applications"></a>
# .NET 應用程式

`ai-i18n-tools` 會從 C#、Razor、cshtml、XAML 和 AXAML 提取 UI 字串，然後寫入以原始語言字串為鍵的扁平 JSON。`sourceLocale` 可以是任何語言。執行階段輔助程式是 `I18n.cs`（.NET 6 或更新版本，無需 NuGet 套件）。Avalonia、WPF、MAUI、WinForms、ASP.NET、Blazor 和主控台應用程式都會呼叫該輔助程式。.NET Framework 4.8 需要 `System.Text.Json` 套件，檔案才能編譯。

將地區設定新增至現有的單一語言應用程式：[將 i18n 新增至 .NET 應用程式](/zh-Hant/guide/add-i18n-to-dotnet)。

<a id="scaffold"></a>
## 鷹架

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` 寫入 `ai-i18n-tools.config.json`，並且，當缺少 `I18n.cs` 時，會將 [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) 複製到專案中。`--namespace` 設定 C# 命名空間。當其省略且目錄包含一個 `.csproj` 時，`init` 會使用該檔案的 `RootNamespace`，或專案檔案名稱。否則，命名空間為 `AiI18n`。

`init` 不會編輯專案檔。將地區設定 JSON 新增至組件：

```xml
<EmbeddedResource Include="locales/*.json" />
```

掃描會跳過名為 `bin`、`obj`、`.vs`、`TestResults` 和 `packages` 的目錄。範本也會將 `uiExtractor.exclude` 設定為 `**/bin/**`、`**/obj/**`、`**/Tests/**` 和 `**/*.Tests/**`。

<a id="calls-that-translate"></a>
## 翻譯呼叫

首先查閱目錄項目，然後將結果傳遞給 `string.Format`。預設名稱為 `T`、`Tn`、`Tp`、`N`、`Tr` 和 `Loc`。像 `I18n.T` 這樣的接收器會匹配，因為最後一個名稱是 `T`。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` 會傳回其引數，並且僅用於讓靜態欄位、列舉標籤或屬性可以保存提取器可見的常值。稍後使用 `T(label)` 顯示它。

`Tn` 將 `{0}` 視為計數。額外引數會跟隨其後（`{1}`、`{2}`）。

`Tp` 將上下文和原始字串儲存在一個鍵下（上下文，U+0004，原始字串），這是扁平 JSON 已使用的相同分隔符。當同一個簡短的詞語表示不同的事物時使用它（`Open` 視窗和 `Open` 檔案）。

XAML 和 AXAML 使用一個標記延伸，其類型名稱位於 `funcNames` 中。前綴會被忽略：

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`、`{DynamicResource}`、`{StaticResource}`、`{TemplateBinding}` 和 `{x:Static}` 不會被提取。寫為元素內容的文字（`<TextBlock>Hello</TextBlock>`）不會被提取。包含撇號的常值會以 `&quot;` 中的引數寫入，以便 XML 屬性可以保留在雙引號中：`Content="{loc:Tr &quot;Don't&quot;}"`。

這些會被提取然後拒絕，因為目錄與程式查閱的內容不符：

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

傳遞一個常值，並使用 `{0}` 而不是 `{name}`。`string.Format` 會在具名項目上拋出錯誤。`extract` 會為前三個列印警告，並在 `{name}` 上停止。

帶有前導或尾隨空白字元的常值仍會被編目。`I18n.T` 會修剪鍵、查閱它，然後將該空白字元放回結果中。建議使用 `T("Updated: {0}", value)`，以便翻譯人員看到分隔符。

<a id="placeholders"></a>
## 預留位置

`ui-dotnet` 將 `uiExtractor.placeholderStyle` 設定為 `dotnet`。該樣式會保留 `{0}`、`{0,-10}`、`{0:C}` 和 `{0,-10:C}`。`%` 是普通文字，因此像 `10% e 20%` 這樣的翻譯不會被視為 printf 權杖。雙大括號（<code v-pre>{{</code> 和 `}}`）是常值大括號，必須保持不變地複製。`{name}` 在提取時會產生錯誤。

JavaScript 和 Python 使用的預設樣式保持不變。

<a id="runtime"></a>
## 執行階段

`I18n.SetLocale("pt-BR")` 遍歷 `CultureInfo.Parent` 直到目錄開啟。當 `OpenLocale` 設定時，就會使用它。否則，已設定的 `FlatDirectory` 是唯一來源：其中遺失的檔案不會遞補至內嵌 JSON。僅當 `OpenLocale` 和 `FlatDirectory` 都未設定時，才會使用內嵌資源。遺失的鍵會傳回來源字串。`I18n.Strict = true` 會改為擲回錯誤，這在測試中很有用。`string.Format` 會在翻譯後的範本上呼叫。無效格式可能會擲回 `FormatException`。捨棄的 `{0}` 可以省略引數。格式錯誤後，不會遞補至來源範本。

`I18n.SupportedLocales` 是初始化時記錄的清單（原生名稱和英文名稱）。`I18n.IsRightToLeft` 讀取 `CultureInfo.TextInfo`。應用程式會自行設定 `CultureInfo.CurrentUICulture` 和 `CultureInfo.CurrentCulture`。`string.Format` 使用目前的 UI 文化特性，因此 `{0:C}` 會遵循該文化特性。

`LocaleChanged` 在 `SetLocale` 內部觸發。請先設定 `CurrentUICulture` 和 `CurrentCulture`，以便重新整理處理常式使用新文化進行格式化。呼叫 `T` 的檢視模型屬性應從該事件引發 `PropertyChanged`。傳回純字串的標記延伸會在下次建置檢視時更新。目錄和目前地區設定是靜態的。這對桌面處理程序而言是安全的。它不是多使用者伺服器的每個要求地區設定。將 `IStringLocalizer` 或 `ResourceManager` 保留在那裡。設定 `CurrentUICulture` 不會為每個要求提供自己的對應。

若要重新整理複製的協助程式，請在可捨棄的目錄中搭建相同的範本，並僅複製您打算取代的產生檔案。請勿在應用程式中重新執行 `init` 以升級協助程式。

檔案以 `ai-i18n-tools-i18n-cs:` 開頭，所以 `extract` 會跳過它。

<a id="desktop-recipe"></a>
## 桌面應用程式指南

Avalonia、WPF 和 MAUI 各有其標記延伸基底類別。此輔助程式不會參考這些組件。一個 Avalonia 形式：

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

格式化字串保留在 C# (`T("Cursor {0}", value)`) 中，這使得提取器能處理單一字面值。相同的呼叫可從檢視模型、系統匣工具提示和對話方塊運作。

<a id="migrate"></a>
## 重寫不安全的呼叫

`migrate-dotnet-i18n` 是一個試運行，直到您傳遞 `--write` 為止。它會重寫在查詢前建構的 `T`、`Tn` 和 `Tp` 的參數：

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

成為 `T("Saved to {0}", path)`、`T("Last synced {0}", date)` 及 `T("Hello {0}", name)`。重複的簡單名稱仍是一個引數。像 `(int)status` 這樣的型別轉換會保留其自身的索引。報告 `migrate-dotnet-i18n-report.md` 列出任何保留在原處的項目：`await`、原始的 `$$"""` 字串、一個 `? :` 洞、`ref` 或 `out`、沒有常值的串聯、傳遞給 `string.Format` 的 `IFormatProvider`，及一個看起來像複數的詞組 (`{0} samples` 應該是 `Tn`)。

`--wrap` 也會將未標記的 XAML `Text`、`Header`、`Content` 和其他標籤屬性標記為 `{loc:Tr '...'}`，以及名稱以 `Text`、`Title`、`Message` 和其他高信賴度後綴結尾的 C# 指派，加上 `MessageBox.Show` 和 `ConfirmDialog.Show`。如果沒有 `--write`，這就是一次稽核。它不會編輯記錄、屬性、`nameof`、比較或 `Path` 呼叫。第二次執行不會改變任何東西。

當 `extract` 擷取中性的 `.resx` 時，相同的報告會新增「具名資源金鑰」區段。諸如 `Resources.LoginButton` 的行會列為 `T("Sign in")`。這些行是建議。該命令不會編輯它們。
