<a id="net-applications"></a>
# .NET 應用程式

`ai-i18n-tools` 會從 C#、Razor、cshtml、XAML 和 AXAML 提取 UI 字串，然後寫入以原始語言字串為鍵的扁平 JSON。`sourceLocale` 可以是任何語言。執行階段輔助程式是 `I18n.cs`（.NET 6 或更新版本，無需 NuGet 套件）。Avalonia、WPF、MAUI、WinForms、ASP.NET、Blazor 和主控台應用程式都會呼叫該輔助程式。.NET Framework 4.8 需要 `System.Text.Json` 套件，檔案才能編譯。

將地區設定新增至現有的單一語言應用程式：[將 i18n 新增至 .NET 應用程式](/zh-Hant/guide/add-i18n-to-dotnet)。

可執行副本位於 `examples/dotnet-console` 和 `examples/dotnet-resx` 中。它們是 xUnit 專案，而不是需要翻譯的應用程式。發行封存檔 `ai-i18n-tools-dotnet-examples.zip` 包含那兩個目錄以及 `assets/dotnet`，後者是專案編譯的目標。npm tarball 和獨立可執行檔則不包含。在該 zip 檔之前發佈的版本不包含它。

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

掃描會跳過名為 `bin`、`obj`、`.vs`、`TestResults` 和 `packages` 的目錄。範本也會將 `uiExtractor.exclude` 設定為 `**/bin/**`、`**/obj/**`、`**/Tests/**`、`**/*.Tests/**` 和 `**/TrExtension.cs`。

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

`Tn` 將 `{0}` 視為計數。額外引數（`{1}`、`{2}`）跟隨其後。單數形式可將該計數寫為字面值（`1 sample`），而複數形式則保留 `{0}`。翻譯在複數類別上保留 `{0}`，並將字面數字保留在單數形式上。

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

`I18n.SupportedLocales` 始於初始化時標記的清單 (`BuiltInLocales`：原生名稱和英文名稱)。語言選單不會讀取該標記。在第一個 `T()` 之前，從 `AppContext.BaseDirectory` 向上搜尋，然後從目前目錄向上搜尋，每個最多 8 個目錄，尋找 `locales/ui-languages.json`。第一個找到的檔案優先。將 `code`、`label` 和 `englishName` 對應到 `LocaleInfo` (`label` 是原生名稱)，並在同一個呼叫中將它們作為 `Locales` 傳遞給 `Configure`，同時將 `FlatDirectory` 設定為該 `locales` 目錄。每個 `Configure` 呼叫都會取代 `Strict`、`FlatDirectory` 和 `OpenLocale`。稍後只設定 `Locales` 的呼叫會清除 `FlatDirectory`。空的 `Locales` 陣列會保留目前的清單，且不會還原 `BuiltInLocales`。如果資訊清單遺失，則傳遞一個包含原始語言的單元素清單，且不設定 `FlatDirectory`。屆時選單將僅顯示原始語言，且目錄會保持內嵌。開發人員會讀取 `sync` 剛寫入的檔案。應遵循 `sync` 的安裝程式會將 `ui-languages.json` 和地區設定 JSON 檔案與應用程式一同發佈。

`I18n.IsRightToLeft` 讀取 `CultureInfo.TextInfo`。應用程式會自行設定 `CultureInfo.CurrentUICulture` 和 `CultureInfo.CurrentCulture`，並保留地區設定代碼。`string.Format` 使用目前的 UI 文化特性，因此 `{0:C}` 會遵循該文化特性。

`LocaleChanged` 在 `SetLocale` 內部觸發。請先設定 `CurrentUICulture` 和 `CurrentCulture`，以便重新整理處理常式能以新的文化特性進行格式化。呼叫 `T` 的檢視模型屬性應從該事件引發 `PropertyChanged`。對於 Avalonia、WPF 和 MAUI，標記延伸會傳回 `I18n.T(Text)` 並在 `LocaleChanged` 上再次設定該屬性，然後在控制項離開視覺樹狀結構時取消訂閱。目錄和目前的地區設定是靜態的。這對於桌面處理程序是安全的。它不是多使用者伺服器的每個請求地區設定。將 `IStringLocalizer` 或 `ResourceManager` 保留在該處。設定 `CurrentUICulture` 不會為每個請求提供其自己的對應。

若要重新整理複製的協助程式，請在可捨棄的目錄中搭建相同的範本，並僅複製您打算取代的產生檔案。請勿在應用程式中重新執行 `init` 以升級協助程式。

檔案以 `ai-i18n-tools-i18n-cs:` 開頭，所以 `extract` 會跳過它。

<a id="desktop-recipe"></a>
## 桌面應用程式指南

Avalonia、WPF 和 MAUI 各有其自己的標記延伸基底類別。協助程式不會參考這些組件。`ProvideValue` 會傳回 `I18n.T(Text)` 並在 `LocaleChanged` 上再次設定該屬性。當控制項離開視覺樹狀結構時取消訂閱。將 `**/TrExtension.cs` 新增至 `ui.uiExtractor.exclude`，這樣 `T(Text)` 就不會被報告為非文字。XAML 文字已透過 `Tr` 提取。`{loc:Tr}` 只能呼叫 `T`。一個簡短單字的兩種含義在程式碼中透過 `Tp` 設定。

一種 Avalonia 形狀 (`IProvideValueTarget` 位於 `Avalonia.Metadata`)：

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

WPF 和 MAUI 使用相同的概念，但有其自己的屬性類型。僅限 Avalonia：忽略 `SelectionChanged`，除非 `e.Source` 是擁有處理常式的控制項。請勿在該處理常式內部，或在此組合的 `SetLocale` 引發的 `LocaleChanged` 內部指派 `ItemsSource` 或 `SelectedItem`。使用 `Dispatcher.UIThread.Post` 發佈重新整理，並在程式碼設定 `SelectedItem` 時保護處理常式。從冒泡事件再次指派 `ItemsSource` 的父 `TabControl` 會導致處理程序崩潰 (結束代碼 139，空的 `crash.log`)。

格式化的句子保留在 C# (`T("Cursor {0}", value)`) 中，這會使提取器保持在單一文字上。繫結上的 `StringFormat` 是不可見的。相同的呼叫適用於檢視模型、系統匣工具提示和對話方塊。列舉組合會保留列舉，從其標題傳回 `T("Light")`，並在 `LocaleChanged` 上重建項目。系統匣項目使用 `Tp("tray", "Open")` 和穩定的 `CommandParameter`。匹配參數，而不是標頭。服務儲存英文錯誤句子，顯示網站透過 `T` 對應已知句子。Linux `.desktop`、`Name=` 和 `Comment=` 保留在原始語言中。進行比較的持續時間權杖 (`2d`、`7h 47m`) 保持不翻譯。在顯示網站翻譯 `T("now")` 和 `T("in {0}", duration)`。文字上的前導或尾隨空格仍然是提取警告。將其移至格式字串或版面配置中。`Tn` 可能會更正始終為複數的原始句子 (`1 samples`)。

<a id="rewrite-unsafe-calls"></a>
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
