<a id="dotnet-applications"></a>
# .NET 应用程序

`ai-i18n-tools` 从 C#、Razor、cshtml、XAML 和 AXAML 中提取 UI 字符串，然后以源语言字符串为键写入扁平化的 JSON。`sourceLocale` 可以是任何语言。运行时帮助程序是 `I18n.cs`（.NET 6 或更高版本，无需 NuGet 包）。Avalonia、WPF、MAUI、WinForms、ASP.NET、Blazor 和控制台应用都会调用该帮助程序。.NET Framework 4.8 需要 `System.Text.Json` 包才能编译文件。

将区域设置添加到现有的单语言应用：[向 .NET 应用添加 i18n](/zh-Hans/guide/add-i18n-to-dotnet)。

<a id="scaffold"></a>
## 脚手架

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` 会写入 `ai-i18n-tools.config.json`，并且在缺少 `I18n.cs` 时，会将 [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) 复制到项目中。`--namespace` 用于设置 C# 命名空间。如果省略该项，并且目录中包含一个 `.csproj` 文件，`init` 会使用该文件的 `RootNamespace` 或项目文件名。否则，命名空间为 `AiI18n`。

`init` 不会编辑项目文件。将区域设置 JSON 添加到程序集：

```xml
<EmbeddedResource Include="locales/*.json" />
```

扫描会跳过名为 `bin`、`obj`、`.vs`、`TestResults` 和 `packages` 的目录。模板还会将 `uiExtractor.exclude` 设置为 `**/bin/**`、`**/obj/**`、`**/Tests/**` 和 `**/*.Tests/**`。

<a id="calls-that-translate"></a>
## 获取翻译文本的调用

首先查找目录条目，然后将结果传递给 `string.Format`。默认名称为 `T`、`Tn`、`Tp`、`N`、`Tr` 和 `Loc`。像 `I18n.T` 这样的接收器会匹配，因为最后一个名称是 `T`。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` 会返回其参数，它的存在只是为了让静态字段、枚举标签或特性可以包含一个提取器能看到的字面量。稍后使用 `T(label)` 显示它。

`Tn` 将 `{0}` 视为计数。额外的参数跟在它后面（`{1}`、`{2}`）。

`Tp` 将上下文和源字符串存储在同一个键下（上下文、U+0004、源），这与扁平化 JSON 已使用的分隔符相同。当同一个简短词语有不同含义时（例如 `Open` 窗口和 `Open` 文件），请使用它。

XAML 和 AXAML 使用一个标记扩展，其类型名称在 `funcNames` 中。前缀会被忽略：

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`、`{DynamicResource}`、`{StaticResource}`、`{TemplateBinding}` 和 `{x:Static}` 不会被提取。作为元素内容写入的文本（`<TextBlock>Hello</TextBlock>`）不会被提取。包含撇号的字面量会使用 `&quot;` 中的参数写入，以便 XML 特性可以保留在双引号中：`Content="{loc:Tr &quot;Don't&quot;}"`。

这些内容会被提取，然后被拒绝，因为目录与程序查找的内容不匹配：

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

传递一个字面量，并使用 `{0}` 而不是 `{name}`。`string.Format` 会在遇到命名项时抛出异常。`extract` 会为前三项打印警告，并在遇到 `{name}` 时停止。

带有前导或尾随空格的字面量仍会被编入目录。`I18n.T` 会修剪键，查找它，然后将该空格重新加到结果上。建议使用 `T("Updated: {0}", value)`，以便翻译人员能看到分隔符。

<a id="placeholders"></a>
## 占位符

`ui-dotnet` 将 `uiExtractor.placeholderStyle` 设置为 `dotnet`。该样式会保留 `{0}`、`{0,-10}`、`{0:C}` 和 `{0,-10:C}`。`%` 是普通文本，因此像 `10% e 20%` 这样的翻译不会被视为 printf 标记。双大括号（<code v-pre>{{</code> 和 `}}`）是字面大括号，必须原样复制。`{name}` 在提取时会报错。

由 JavaScript 和 Python 使用的默认样式保持不变。

<a id="runtime"></a>
## 运行时

`I18n.SetLocale("pt-BR")` 遍历 `CultureInfo.Parent` 直到目录打开。设置 `OpenLocale` 后会使用它。否则，配置的 `FlatDirectory` 是唯一来源：其中缺失的文件不会回退到嵌入式 JSON。仅当既未设置 `OpenLocale` 也未设置 `FlatDirectory` 时才使用嵌入式资源。缺失的键会返回源字符串。`I18n.Strict = true` 则会抛出异常，这在测试中很有用。`string.Format` 会在翻译后的模板上调用。无效格式可能会抛出 `FormatException`。丢弃的 `{0}` 可以省略参数。格式错误后不会回退到源模板。

`I18n.SupportedLocales` 是在初始化时确定的列表（本地名称和英文名称）。`I18n.IsRightToLeft` 读取 `CultureInfo.TextInfo`。应用自行设置 `CultureInfo.CurrentUICulture` 和 `CultureInfo.CurrentCulture`。`string.Format` 使用当前的 UI 区域性，因此 `{0:C}` 遵循该区域性。

`LocaleChanged` 在 `SetLocale` 内部触发。请先设置 `CurrentUICulture` 和 `CurrentCulture`，以便刷新处理程序使用新的区域性进行格式化。调用 `T` 的视图模型属性应从该事件中引发 `PropertyChanged`。返回纯字符串的标记扩展会在下次构建视图时更新。目录和当前区域设置是静态的。这对于桌面进程是安全的。它不是多用户服务器的每个请求区域设置。请将 `IStringLocalizer` 或 `ResourceManager` 保留在那里。设置 `CurrentUICulture` 不会为每个请求提供其自己的映射。

要刷新复制的帮助程序，请在可丢弃的目录中搭建相同的模板，并仅复制您打算替换的生成文件。请勿在应用程序中重新运行 `init` 以升级帮助程序。

文件以 `ai-i18n-tools-i18n-cs:` 开头，因此 `extract` 会跳过它。

<a id="desktop-recipe"></a>
## 桌面方案

Avalonia、WPF 和 MAUI 各自都有自己的标记扩展基类。助手不引用这些程序集。一种 Avalonia 形式：

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

格式化的句子保留在 C# (`T("Cursor {0}", value)`) 中，这使得提取器保持在一个单一的字面量上。相同的调用适用于视图模型、托盘工具提示和对话框。

<a id="migrate"></a>
## 重写不安全的调用

`migrate-dotnet-i18n` 是一个空运行，直到您传递 `--write`。它重写在查找之前构建的 `T`、`Tn` 和 `Tp` 的参数：

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

变为 `T("Saved to {0}", path)`、`T("Last synced {0}", date)` 和 `T("Hello {0}", name)`。重复的简单名称仍为一个参数。像 `(int)status` 这样的类型转换保留其自己的索引。报告 `migrate-dotnet-i18n-report.md` 列出了所有保留的内容：`await`、一个原始的 `$$"""` 字符串、一个 `? :` 占位符、`ref` 或 `out`、一个没有字面量的连接、一个传递给 `string.Format` 的 `IFormatProvider`，以及一个看起来像复数的短语 (`{0} samples` 应该是 `Tn`)。

`--wrap` 还会将未标记的 XAML `Text`、`Header`、`Content` 和其他标签属性标记为 `{loc:Tr '...'}`，以及名称以 `Text`、`Title`、`Message` 和其他高置信度后缀结尾的 C# 赋值，以及 `MessageBox.Show` 和 `ConfirmDialog.Show`。如果没有 `--write`，那是一次审计。它不编辑日志、属性、`nameof`、比较或 `Path` 调用。第二次运行不会改变任何内容。

当 `extract` 摄取一个中性的 `.resx` 时，相同的报告会增加一个“命名资源键”部分。像 `Resources.LoginButton` 这样的行被列为 `T("Sign in")`。这些行是建议。该命令不会编辑它们。
