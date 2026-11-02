<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# 为 .NET ResourceManager 应用程序添加国际化

此页面适用于已使用 `ResourceManager` 或 ASP.NET `IStringLocalizer` 加载字符串的 .NET 应用程序，或将要加载字符串的应用程序。您保留该加载器。ai-i18n-tools 读取 `T("…")` 和 `{loc:Tr '…'}`，翻译消息，并写入以这些源字符串为键的 `.resx` 附属程序集。帮助程序是 `I18nResx.cs`，由 `init -t ui-dotnet-resx` 复制。

最快的方法是向编码代理提供此页面上的提示。它将配置指向您的资源，包装您的字符串，检查结果，并可以添加语言切换。您自己安装 CLI，选择提供商，并初始化项目，因为这需要您的 API 密钥和您的选择。您也自己运行翻译，因为它会花费您账户上的资金并重写您的 `.resx` 文件。

尚未有资源文件的新 Avalonia、WPF、MAUI、WinForms 或控制台应用使用[将 i18n 添加到 .NET 应用](/zh-Hans/guide/add-i18n-to-dotnet)。该路径添加 `I18n.cs` 和嵌入式 JSON。不确定哪个适用？请参阅末尾的[不适用于您的情况？](#not-your-case)。

流程：

1. [安装 CLI 并选择提供商](#install-and-choose-a-provider)。
2. 使用 `init`[初始化项目](#initialise-the-project)。
3. [运行代理提示](#run-the-agent-prompt)。
4. [查看结果](#review-the-result)。
5. [选择模型并翻译](#choose-models-and-translate)，然后检查一种语言。
6. [保持翻译](#keep-it-translated)。

倾向于自行更改，或者想知道提示的作用？[手动操作](#do-it-by-hand) 会逐步完成相同的步骤。

<a id="install-and-choose-a-provider"></a>
## 安装并选择提供商

这部分由您完成，而不是代理。安装程序会更改您的机器，API 密钥是属于您 shell 的秘密，不应出现在提示中。

如果机器已安装 Node.js `>=22.16.0`，请使用 npm 包（[安装](/zh-Hans/guide/installation))。对于 .NET 项目，请安装独立可执行文件（无需 Node.js）。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安装程序会检查 `SHA256SUMS.txt`，将命令安装为 `ai-i18n-tools`，并将其添加到 `PATH`。这些二进制文件未经公证或 Authenticode 签名。手动步骤和资产名称：[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。

检查安装：

```bash
ai-i18n-tools --version
```

然后选择一个提供商，并在将运行翻译的 shell 中设置其 API 密钥。例如，OpenRouter：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama 不需要密钥。其他预设：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。记下提供商名称，因为您将在下一步将其传递给 `init`。代理从不需要密钥：它只运行不进行模型调用的命令。您稍后在[翻译](#choose-models-and-translate)时会使用该密钥。

<a id="initialise-the-project"></a>
## 初始化项目

您在提示之前运行此命令一次。它会写入配置和 `I18nResx.cs`，并使用您在上面选择的提供商。

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

当项目命名空间不是 `init` 打印到 `I18nResx.cs` 中的命名空间时，传递 `--namespace`。如果目录中有一个 `.csproj` 且没有 `--namespace`，则 `init` 使用该文件的 `RootNamespace`，或项目文件名。否则，命名空间为 `AiI18n`。

模板将 `ui.flatOutput` 设置为 false，并将 `ui.resx` 设置为：

| 字段 | 默认值 |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true，因此 `SharedResource.resx` 包含源文本 |
| `localeFormat` | `bcp47`，因此德语文件是 `SharedResource.de.resx`，巴西葡萄牙语是 `SharedResource.pt-BR.resx` |
| `ingestExistingResx` | true |

当 `I18nResx.cs` 文件缺失时，`init` 会写入它。`ResourceBaseName` 是命名空间、输出文件夹和用点连接的基本名称 (`MyApp.Resources.SharedResource`)。当文件位于该文件夹中时，SDK 会在该清单名称下嵌入一个 resx。如果您移动文件，请更改 `ResourceBaseName` 以匹配。`init` 不会编辑 `.csproj`。附属程序集在构建时从 `*.{culture}.resx` 生成。将这些附属程序集部署到应用程序旁边。

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。如果 `I18nResx.cs` 已包含标记 `ai-i18n-tools-i18n-cs`，则项目已初始化：跳过此步骤。`init` 不会覆盖现有帮助程序。

然后编辑 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是源中字符串的语言。任何 BCP-47 语言都有效；脚手架使用 `en`。将 `ui.resx` 指向您的应用程序已加载的文件夹和基本名称（手动操作，即[步骤 1](#step-1-point-the-config-at-your-resources))。`neutralFile` 是一个中性 resx，它将 `LoginButton` 等旧名称映射到其源文本。如果省略，则在文件存在时使用 `{outputDir}/{baseName}.resx`。

相同的 `ui` 块也可以写入平面 JSON。将 `flatOutput` 设置回 true。两种输出共享一个目录。此模板将 `flatOutput` 设为 false，因此只写入 `.resx`。

调用形状和 JSON 帮助程序：[.NET 应用程序](/zh-Hans/guide/ui-strings/dotnet)。所有其他配置键：[配置](/zh-Hans/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新聊天，然后粘贴以下提示。项目必须已初始化。无需编辑。如果您想排除某些内容，例如不进行语言切换，请在同一消息中说明。

代理首先检查 CLI、配置和 `I18nResx.cs` 是否存在，如果缺少任何一个，则停止并给出说明。然后它分三部分工作：

- 第 1 部分将 `ui.resx` 指向应用程序已加载的目录，并检查 `ResourceBaseName`。
- 第 2 部分将面向用户的字符串包装在 `T()` 和 `{loc:Tr '…'}` 中，并手动应用命名键建议。
- 第 3 部分添加一个语言切换，该切换保持在 `ResourceManager` 或 `IStringLocalizer` 上。

它不安装或初始化任何东西，不读取您的 API 密钥，也不进行翻译。它不重写 `.resx` 文件。翻译是审查之后的步骤，由您运行。

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
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。包装的调用、配置、如果文件移动了的 `ResourceBaseName` 以及语言切换应该已经改变。您的 `.resx` 文件在您翻译之前应该保持不变。
- `ai-i18n-tools.config.json`：`resx.outputDir` 和 `baseName` 指向您的应用程序加载的目录，`sourceRoots` 涵盖应用程序项目。
- `ResourceBaseName` 与 SDK 将嵌入的清单名称匹配。
- `ai-i18n-tools extract` 列出新消息并保留附属程序集中已有的翻译。
- `migrate-dotnet-i18n` 的试运行没有列出任何待修复项，除了您选择推迟的命名键建议。在您编辑这些行之前，它们仍然是 `Resources.LoginButton`。
- 您的测试通过，并且应用在源语言中看起来一样。
- 没有留下任何一次性脚本或 `migrate-dotnet-i18n-report.md`。

提交此状态。`translate-ui` 会重写您的 `.resx` 文件，因此您会希望有一个干净的差异可供审查。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥，在您的账户上花费资金，并重写您的 `.resx` 文件，因此请先提交。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于 `ai-i18n-tools dashboard` 的[模型](/zh-Hans/guide/translation-dashboard/models)选项卡上。

在第一次 `translate-ui` 之前填写术语表。`init` 将 `glossary.userGlossary` 指向 `glossary-user.csv`，但不会创建文件。如果文件缺失，请运行 `ai-i18n-tools glossary-generate`，然后添加领域术语。对于必须保持不变的名称，请使用 **Force**。

然后提取并翻译：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` 写入中性文件和每个目标语言一个附属文件。键是源字符串。`<comment>` 记录上下文和第一个源位置。对附属文件进行的手动编辑只有在下一次翻译之前 `extract` 摄取了它才会保留，这与 `.po` 文件是相同的约定。从现在开始，请勿编辑生成的文件，因为下一次运行会重新生成它们。在提交之前审查第一个差异。

带有 `type` 或 `mimetype`（图像和其他二进制文件）的条目会被跳过。当该文化没有条目时，`ResourceManager.GetString` 返回中性值。

重建，以便 SDK 嵌入新的附属文件，然后重启应用。

<a id="check-one-language"></a>
### 检查一种语言

切换到一种目标语言，并打开一个包含一些已包装字符串的屏幕。仍然是源语言的文本表示它未被包装，或者仍然使用未应用的命名键，或者附属文件未被重建。丢弃 `{0}` 或重命名它的翻译可能会抛出 `FormatException` 或省略该值。`string.Format` 不会回退到源模板。在怀疑代码之前，请检查该句的附属文件。

<a id="keep-it-translated"></a>
## 保持翻译更新

更改源文本后，重新运行 `ai-i18n-tools sync`（或先运行 `extract` 再运行 `translate-ui`）。缓存意味着只有新增或更改的字符串才会进入模型。在 CI 中运行它，以防止翻译偏离。翻译运行后重建，以便附属文件再次嵌入。`ai-i18n-tools dashboard` 打开 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审查翻译。

`purge-locale` 删除 `SharedResource.<culture>.resx` 并保留 `SharedResource.resx`。

要刷新复制的 `I18nResx.cs`，请在一次性目录中搭建相同的模板，并只复制您打算替换的生成文件。不要在应用中重新运行 `init` 来升级帮助程序。

要在同一次运行中翻译 `README.md`，请使用 `--with-readme` 搭建脚手架（或将该块添加到现有配置中）。请参阅 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手动操作

如果您更喜欢自己进行更改，或者想了解提示的作用，请完成这些步骤。每个步骤都与提示的一部分相对应。最后，您仍然需要[安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project) 和[翻译](#choose-models-and-translate)。

1. [将配置指向您的资源](#step-1-point-the-config-at-your-resources)。
2. 在 `T()` 或 `{loc:Tr '…'}` 中[包装字符串](#step-2-wrap-strings)。
3. [应用命名资源键](#step-3-apply-named-resource-keys)。
4. [在运行时切换语言](#step-4-switch-language-at-runtime)。

<a id="step-1-point-the-config-at-your-resources"></a>
## 步骤 1：将配置指向您的资源

模板写入此形状。将文件夹和基本名称更改为您的应用已加载的目录：

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

根据您的项目检查以下四项：

- `outputDir` 和 `baseName` 是中性文件和附属文件已存在的位置。德语是 `SharedResource.de.resx`。当 `localeFormat` 是 `bcp47` 时，巴西葡萄牙语是 `SharedResource.pt-BR.resx`。
- 当该中性文件不是 `{outputDir}/{baseName}.resx` 时，`neutralFile` 被设置。摄取通过中性值 (`Sign in`) 映射旧名称 (`LoginButton`)。德语 `LoginButton` 值随后存储在源字符串 `Sign in` 下。
- `I18nResx.cs` 中的 `ResourceBaseName` 是命名空间、输出文件夹和用点连接的基本名称。当文件移动时，移动常量。不要动帮助程序的其余部分。
- `sourceRoots` 是应用程序项目，而不是 `"."`。

普通字符串的 resx 名称是源文本：`Sign in`、`Saved to {0}`，一个包含引号或和号的值。上下文在上下文和源之间使用 U+2404。resx 没有复数形式。每个 CLDR 形式都是其自己的条目，名为 `{singular}[{form}]`。`Tn` 按照与 `.po` 写入器相同的规则选择形式。您无需键入分隔符或复数后缀。

用 `ai-i18n-tools extract` 确认。目录应列出从中性文件摄取的字符串。

<a id="step-2-wrap-strings"></a>
## 步骤 2：包装字符串

`extract` 仅在字符串作为字面量传递给 `T()`、`Tn`、`Tp`、`N` 或 `{loc:Tr '…'}` 时记录它。[JSON 帮助程序](/zh-Hans/guide/add-i18n-to-dotnet#step-2-wrap-strings) 的相同形状也适用。占位符是 `{0}`，而不是 `{name}`。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` 会查找您传入的任何名称，并在资源缺失时返回该名称。默认提取器名称为 `T`、`Tn`、`Tp`、`N`、`Tr` 和 `Loc`。诸如 `_localizer["Sign in"]` 的调用是不可见的，直到将 `_localizer` 添加到 `ui.uiExtractor.funcNames`。调用 `T("Sign in")` 或 `I18nResx.T("Sign in")` 不需要额外的名称。

XAML 使用 `{loc:Tr '…'}`。元素内容不会被提取。请勿改动 `{Binding}` 和 `{StaticResource}`。

保留日志、JSON 键、文件名、`nameof` 以及未显示的异常文本。存储的值保留源语言。翻译控件上的标题。

不安全调用（`T($"…")`、字符串连接、`string.Format` 在 `T` 中）是下一步的报告，以及诸如 `Resources.LoginButton` 的旧名称。

<a id="step-3-apply-named-resource-keys"></a>
## 步骤 3：应用命名资源键

`migrate-dotnet-i18n` 是一个空运行，直到您传入 `--write`。它会重写在查找之前构建的 `T` 的参数，与[检查包装调用](/zh-Hans/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls) 中的编辑相同。

当 `extract` 摄取了中性 `.resx` 时，报告还会增加一个命名键部分：

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

该列表供您应用。该命令不会编辑这些行。`--write` 也不会。在您将调用更改为 `T("Sign in")` 后，再次运行 `extract`。

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

阅读 `migrate-dotnet-i18n-report.md`。当不安全调用编辑看起来正确时：

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

再次运行空运行。当它不再列出不安全调用编辑时停止。您尚未应用的命名键会保留在建议列表中。删除报告或将其添加到 Git 忽略。在此步骤中，请勿编辑 `.resx` 文件。

<a id="step-4-switch-language-at-runtime"></a>
## 步骤 4：在运行时切换语言

`T` 读取 `CultureInfo.CurrentUICulture`。`I18nResx.SetLocale` 设置该区域性和 `CurrentCulture`，然后引发 `LocaleChanged`。它为 `Tn` 存储的区域设置是静态的，因此处理并发请求的服务器不应将 `SetLocale` 用作每个用户的开关。

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` 是请求本地的。将其指向工具写入的 resx 文件。空类只是类型参数。清单基名称必须与 `ResourceBaseName` 匹配。

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

在 Razor 页面或服务中，调用 `T` 以便 `extract` 看到字面量。如果调用站点已在使用 `IStringLocalizer<SharedResource>`，请保留它。如果查找保留在索引器上，请将该接收器的名称添加到 `ui.uiExtractor.funcNames`。

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` 没有复数或上下文参数。扩展可以调用 `I18nResx`，它读取相同的附属程序集。将其放入 ASP.NET 项目中。`I18nResx.cs` 不引用 `Microsoft.Extensions.Localization`，因此控制台或桌面项目不需要该包。

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

按此顺序选择请求区域性：访问者的明确选择（`?lang=` 或表单提交）、记住它的 cookie、`Accept-Language` 标头，然后是源区域设置。忽略不在 `sourceLocale` 或 `targetLocales` 中的代码。`pt-BR` 是附属程序集名称。发送 `pt-br` 的标头在您分配 `CurrentUICulture` 之前仍必须与该名称匹配。

<a id="desktop-and-console"></a>
### 桌面和控制台

在窗口构建之前恢复保存的区域性，调用 `I18nResx.SetLocale`，并从 `LocaleChanged` 刷新可见文本。从 `sourceLocale` 和 `targetLocales` 构建菜单。将其标记为 `T("Language")`。流向来自 `CultureInfo.TextInfo.IsRightToLeft`。此帮助程序上没有 `SupportedLocales` 列表。

控制台程序没有小部件。添加 `--lang <code>`（如果该名称可用，则添加 `-L`），然后在第一个 `T` 之前调用 `SetLocale`。不要读取 `AI_I18N_LANG`。

如果程序不显示供人阅读的文本，请跳过此步骤。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 不是您的情况？

| 您今天的代码 | 阅读 |
| --- | --- |
| 尚无 `.resx` 和 `IStringLocalizer` | [将 i18n 添加到 .NET 应用](/zh-Hans/guide/add-i18n-to-dotnet) |
| 已使用源语言句子 `T("…")` | [UI 字符串](/zh-Hans/guide/ui-strings/) 步骤 2–3，以及 [.NET 应用程序](/zh-Hans/guide/ui-strings/dotnet) |
| JS/TS 应用程序 | [将 i18n 添加到 JS/TS 应用程序](/zh-Hans/guide/add-i18n-to-js) |
| Python 应用 | [向 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) |
| Django、Flask-Babel 目录或 GNU gettext | [将 i18n 添加到 Django / Python gettext 应用](/zh-Hans/guide/add-i18n-to-django-gettext) |
| 一个网站或文档站点 | [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website) |
| 一个仓库 README 或其他 Markdown 文件 | [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 示例

| 示例 | 显示内容 |
| --- | --- |
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | xUnit 检查 `I18nResx.cs`：源字符串键、引号、上下文、复数、真实卫星程序集 |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | JSON 助手，适用于不在 `ResourceManager` 上的应用 |

这些目录检查助手。它们不是要翻译的应用，也不需要 API 密钥。`dotnet test` 在 `dotnet-resx` 中运行卫星程序集检查。一个真实的应用从本页的 `init` 开始。
