<a id="add-i18n-to-a-net-app"></a>
# 为 .NET 应用添加 i18n

此页面介绍如何使用 ai-i18n-tools 为具有单一语言的 .NET 应用程序（Avalonia、WPF、MAUI、WinForms、Blazor、ASP.NET 或控制台工具）添加区域设置。它遵循一条路径：`ui-dotnet` 模板、一个小型 `I18n.cs` 帮助程序和 JSON 翻译文件。`extract` 仅在 UI 字符串是 `T()`、`Tn`、`Tp`、`N` 或 XAML `{loc:Tr '…'}` 中的字符串字面量时才记录它，因此纯源文本目录将为空。

最快的方法是向编码代理提供此页面上的提示。它会放置帮助程序，嵌入区域设置 JSON，包装您的字符串，并可以添加语言切换。您需要自行安装 CLI、选择提供商并初始化项目，因为这需要您的 API 密钥和您的选择。您还需要自行运行翻译，因为它会花费您账户中的资金。

已使用 `ResourceManager` 或 ASP.NET `IStringLocalizer` 加载字符串的应用程序使用[向 .NET ResourceManager 应用程序添加 i18n](/zh-Hans/guide/add-i18n-to-dotnet-resourcemanager)。该路径保留加载器并写入 `.resx` 附属程序集。不确定哪个适用？请参阅末尾的[不适用于您的情况？](#not-your-case)。

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

您在提示之前运行此命令一次。它会写入配置和 `I18n.cs`，并使用您上面选择的提供商。

此页面使用一个模板，即 `ui-dotnet`。它会写入配置、`I18n.cs` 帮助程序和 JSON 目录。它适用于以下应用程序：

| 您的应用程序 | 备注 |
| --- | --- |
| Avalonia、WPF、MAUI | XAML 中的标签需要标记扩展。帮助程序不引用这些程序集 |
| WinForms | 区域设置更改时重建可见文本 |
| Blazor 和单用户 ASP.NET 应用程序 | 帮助程序的目录是静态的，这足以满足一次一个用户的需求 |
| 多用户服务器 | 保留 `IStringLocalizer` 或 `ResourceManager`。使用[ResourceManager 页面](/zh-Hans/guide/add-i18n-to-dotnet-resourcemanager) |
| 控制台工具 | 一个 `--lang` 选项，而不是一个小部件 |

使用您选择的提供商（本例中为 OpenRouter）运行 init：

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

当项目命名空间不是 `init` 打印到 `I18n.cs` 中的命名空间时，传递 `--namespace`。如果目录中有一个 `.csproj` 且没有 `--namespace`，则 `init` 使用该文件的 `RootNamespace` 或项目文件名。否则，命名空间为 `AiI18n`。

然后编辑 `sourceLocale` 和 `targetLocales` 在 `ai-i18n-tools.config.json` 中。`sourceLocale` 是源中字符串的语言。任何 BCP-47 语言都有效；脚手架使用 `en`。`init` 将该列表作为 `BuiltInLocales` 标记到 `I18n.cs` 中，位于 `ai-i18n-tools-locales` 标记之间，而 `SourceLocale` 是一个常量。该标记不是语言菜单。`extract` 根据配置重写 `locales/ui-languages.json`，并且应用在启动时读取该文件。不要在应用中重新运行 `init` 来刷新帮助程序。

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。如果 `I18n.cs` 已包含标记 `ai-i18n-tools-i18n-cs`，则项目已初始化：跳过此步骤。`init` 不会覆盖现有的 `I18n.cs`，也不会编辑 `.csproj`。

`init` 将 `ui.sourceRoots` 设置为 `"."`，因此 `extract` 将扫描整个存储库。提示将其范围缩小到您的应用程序代码（手动操作，即 [步骤 1](#step-1-place-the-helper-and-embed-the-catalogs))。扫描已跳过名为 `bin`、`obj`、`.vs`、`TestResults` 和 `packages` 的目录，并且模板排除了 `**/Tests/**`、`**/*.Tests/**` 和 `**/TrExtension.cs`。

调用形式：[.NET 应用程序](/zh-Hans/guide/ui-strings/dotnet)。所有其他配置键：[配置](/zh-Hans/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新聊天，然后粘贴以下提示。项目必须已初始化。无需编辑。如果您想排除某些内容，例如不进行语言切换，请在同一消息中说明。

代理首先检查 CLI、配置和 `I18n.cs` 是否存在，如果缺少其中任何一个，则会停止并给出说明。然后它分三部分工作：

- 第 1 部分将 `I18n.cs` 和 `locales/` 放置在项目代码所在的位置，嵌入 JSON，并将配置指向它们。
- 第 2 部分将面向用户的字符串包装在 `T()`、`Tn`、`Tp`、`N` 和 `{loc:Tr '…'}` 中，然后使用 `migrate-dotnet-i18n` 检查不安全的调用。
- 第 3 部分添加语言切换或 CLI 语言选项。

它不安装或初始化任何东西，不读取您的 API 密钥，也不进行翻译。翻译是审查之后的步骤，由您运行。

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
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。包装的文本应与之前相同，没有不相关的重新格式化。`git diff --stat` 显示了更改了多少。帮助程序的位置、`EmbeddedResource` 项、包装的调用和语言切换是预期的编辑。
- 生成的目录（`strings.json`，每个区域设置的 JSON，`ui-languages.json`）除了 `extract` 写入的内容外，均未触及。`I18n.cs` 除了当该常量发生偏移时的一个 `SourceLocale` 标记外，均未触及。菜单从 `ui-languages.json` 加载。当找到该文件时，一个 `Configure` 调用会同时设置 `Locales` 和 `FlatDirectory`。`TrExtension` 被排除在提取之外，并更新 `LocaleChanged` 上的打开视图。
- `ai-i18n-tools extract` 运行正常，`strings.json` 列出了您期望的句子。没有警告，也没有字面量仍然包含 `{name}`。
- `migrate-dotnet-i18n` 的空运行没有列出任何需要修复的内容。一份干净的报告并不能证明每个句子都已包装。代理报告中跳过的字符串是该检查的其余部分。
- 您的测试通过，并且应用在源语言中看起来相同。
- 没有留下一次性脚本或 `migrate-dotnet-i18n-report.md`。
- `I18n.cs` 中的 `SourceLocale` 与配置中的 `sourceLocale` 逐字相等。语言菜单不读取 `BuiltInLocales`。

代理遗漏的字符串稍后会显示为保留在源语言中的文本。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥并在您的账户上花费资金。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于 `ai-i18n-tools dashboard` 的[模型](/zh-Hans/guide/translation-dashboard/models)选项卡上。

在第一个 `translate-ui` 之前填写词汇表。`init` 将 `glossary.userGlossary` 指向 `glossary-user.csv` 并且不创建文件。如果文件缺失，请运行 `ai-i18n-tools glossary-generate`，然后添加领域术语。对于必须保持不变的名称，请使用 **Force**。对未更改字符串的第二次 `translate-ui` 可能会以不同的措辞返回。词汇表是使两次运行一致的原因。

然后提取并翻译：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` 写入 `strings.json` 和 `ui-languages.json`。`translate-ui` 在 `ui.flatOutputDir` 下为每种目标语言写入一个 JSON 文件。不要编辑这些生成的文件。当 `features.translateUIStrings` 开启时，`sync` 会同时运行 `extract` 和 `translate-ui`。

`T()` 在区域设置 JSON 中查找源句子。`strings.json` 中的 ID 不是查找键。缺失文件或缺失键会返回源句子，除非设置了 `I18n.Strict`。`string.Format` 然后在翻译后的模板上运行。无效格式可能会抛出 `FormatException`。遗漏的 `{0}` 可能会省略参数。格式错误后，没有回退到源模板。

<a id="check-one-language"></a>
### 检查一种语言

重启应用，切换到一种目标语言，并打开一个包含一些包装字符串的屏幕。使用代理添加的语言切换器，或者设置两种文化并自行调用 `I18n.SetLocale`。仍然是源语言的文本未被包装，在 `SetLocale` 之前被复制到控件中，或者在区域设置 JSON 中没有条目。在怀疑代码之前，请检查 JSON 中的句子。

`SetLocale` 遍历 `CultureInfo.Parent` 直到目录打开（`pt-BR` 可以加载 `pt.json`）。当 `OpenLocale` 和 `FlatDirectory` 都未设置时，使用嵌入式资源。配置的 `FlatDirectory` 在文件缺失时不会回退到嵌入式 JSON。

当启动找到 `locales/ui-languages.json` 时，`FlatDirectory` 就是那个目录，因此您看到的句子是 `sync` 刚刚写入的文件。隐藏该清单并重新开始：菜单仅提供源语言，字符串来自上次构建中嵌入的资源。应该遵循 `sync` 的已安装构建必须将 `ui-languages.json` 和区域设置 JSON 与应用一起发布。

<a id="keep-it-translated"></a>
## 保持翻译更新

更改源文本后，重新运行 `ai-i18n-tools sync`（或 `extract` 然后 `translate-ui`）。缓存意味着只有新的或更改的字符串才会进入模型。在 CI 中运行它，以防止翻译偏离。将 `FlatDirectory` 指向 `locales` 文件夹后，重新启动应用。仅当未找到清单且应用仍在读取嵌入式 JSON 时才需要重新构建。`ai-i18n-tools dashboard` 打开 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审阅翻译。

要刷新复制的 `I18n.cs`，请在一次性目录中搭建相同的模板，并仅复制你打算替换的生成文件。不要在应用中重新运行 `init` 来升级助手。

要在同一次运行中翻译 `README.md`，请使用 `--with-readme` 搭建脚手架（或将该块添加到现有配置中）。请参阅 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手动操作

如果您更喜欢自己进行更改，或者想了解提示的作用，请完成这些步骤。每个步骤都与提示的一部分相对应。最后，您仍然需要[安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project) 和[翻译](#choose-models-and-translate)。

1. [放置助手并嵌入目录](#step-1-place-the-helper-and-embed-the-catalogs)。
2. 在 `T()`、`Tn`、`Tp`、`N` 或 `{loc:Tr '…'}` 中[包装字符串](#step-2-wrap-strings)。
3. 使用 `migrate-dotnet-i18n`[检查包装的调用](#step-3-check-wrapped-calls)。
4. [添加语言切换器](#step-4-add-a-language-switch)。

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## 步骤 1：放置助手并嵌入目录

`init` 将这些写入存储库根目录：

| 文件 | 它是何物 | 编辑它吗？ |
| --- | --- | --- |
| `I18n.cs` | 你的代码调用的助手（`T`、`Tn`、`Tp`、`SetLocale`） | 不。它是生成的。`init` 不会覆盖它 |
| `locales/strings.json` | 提取缓存。应用从不读取它 | 不。`extract` 写入它 |
| `locales/<code>.json` | 应用程序加载的翻译，每种语言一个文件 | 否。`translate-ui` 写入它们 |
| `locales/ui-languages.json` | 语言菜单。应用在启动时读取 `code`、`label` 和 `englishName` | 否。`extract` 写入它 |

将 `I18n.cs` 和 `locales/` 移到应用程序项目中。将嵌入添加到该 `.csproj`，文件的其余部分保持不变：

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

包含路径是相对于项目文件的。.NET Framework 4.8 还需要 `System.Text.Json` 包。.NET 6 或更高版本已包含它。

更新配置到新位置，并将 `sourceRoots` 指向应用程序项目，以使测试和构建输出不包含在目录中：

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

添加 `global using static MyApp.I18n;`（使用在 `I18n.cs` 中打印的命名空间），或在每个站点调用 `I18n.T`。

帮助程序中的 `SourceLocale` 必须等于配置中的 `sourceLocale`。`BuiltInLocales`，位于 `ai-i18n-tools-locales` 标记之间，是 `init` 标记的列表。它不是菜单。更改 `targetLocales` 后，`extract` 会重写 `ui-languages.json`，并且应用会读取该文件。当您需要新的帮助程序时，搭建一个可丢弃的目录。不在此处重新运行 `init`。

使用 `ai-i18n-tools extract` 确认。目录应出现在新的 `locales/` 文件夹中。在有内容被包装之前，预计字符串数量为 0。

<a id="step-2-wrap-strings"></a>
## 步骤 2：包装字符串

`extract` 仅当字符串作为字面量传递给 `T()`、`Tn`、`Tp`、`N` 或 `{loc:Tr '…'}` 时才记录它。像 `I18n.T` 这样的接收器匹配，因为其最后一个名称是 `T`。

首先查找目录条目，然后将结果传递给 `string.Format`：

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

这些内容会被提取，然后被拒绝，因为目录与程序查找的内容不匹配：

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` 会为前三个打印警告，并在 `{name}` 处停止。[下一步](#step-3-check-wrapped-calls) 会重写前三个。

占位符保持 .NET 形式：`{0}`、`{0,-10}`、`{0:C}`。`%` 是普通文本，因此像 `10% off` 这样的翻译不是 printf 令牌。双大括号 (<code v-pre>{{</code> 和 `}}`) 是字面量大括号，必须原样复制。更多调用形式：[可翻译的调用](/zh-Hans/guide/ui-strings/dotnet#calls-that-translate)。

XAML 和 AXAML：

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

前缀被忽略。`{Binding}` 和 `{StaticResource}` 不受影响。作为元素内容编写的文本不会被提取。包含撇号的字面量用 `&quot;` 编写，以便属性可以保留在双引号中。

Avalonia、WPF 和 MAUI 各自提供自己的 `MarkupExtension` 基类。帮助程序不引用这些程序集。`ProvideValue` 返回 `I18n.T(Text)` 并在 `LocaleChanged` 上再次设置该属性，然后当控件离开可视化树时取消订阅。一种 Avalonia 形状（`IProvideValueTarget` 在 `Avalonia.Metadata` 中）：

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

WPF 和 MAUI 使用它们自己的属性类型执行相同的操作。将 `**/TrExtension.cs` 添加到 `ui.uiExtractor.exclude`。`T(Text)` 不是字面量，并且 XAML 字面量已通过 `Tr` 提取。`{loc:Tr}` 只能调用 `T`。一个短词的两个含义在代码中通过 `Tp` 设置。

格式化句子保留在 C# (`T("Cursor {0}", value)`) 中，这使得提取器保持在一个字面量上。绑定上的 `StringFormat` 对 `extract` 不可见。相同的调用适用于视图模型、托盘工具提示和对话框。从 `LocaleChanged` 提升 `PropertyChanged` 以获取视图模型字符串。

存储和显示的值都保留源语言中的存储值。枚举组合框保留枚举，并从其标题返回 `T("Light")`，然后在 `LocaleChanged` 上重建项目。存在 `N("Last 12 months")` 是为了让静态字段可以保存提取器看到的字面量。静态字典中的 `T()` 在首次类型加载时运行一次，并保持在该语言。服务存储英文错误语句。显示站点通过 `T` 映射已知语句，以便后续的区域设置更改可以翻译它们。失败时的 `T()` 会冻结该语句。

托盘项使用 `Tp("tray", "Open")` 和稳定的 `CommandParameter`。匹配参数，而不是标头。Linux `.desktop` `Name=` 和 `Comment=` 保留在源语言中。比较的持续时间令牌 (`2d`、`7h 47m`) 保持不翻译。在显示文本的地方翻译 `T("now")` 和 `T("in {0}", duration)`。带有前导或尾随空格 (`Updated: `) 的字面量仍然是提取警告。将空格移到格式字符串或布局中。`Tn` 可能会更改始终为复数的源语句 (`1 samples`)。

不要动这些：日志、JSON 属性名称、文件名、`nameof`、属性参数、用作标识符的对象键，以及程序匹配而非显示的异常文本。

再次运行 `ai-i18n-tools extract`。目录现在应该列出您包装的句子。

<a id="step-3-check-wrapped-calls"></a>
## 步骤 3：检查包装的调用

当调用在目录查找之前格式化字符串时，使用此步骤：

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` 将这些重写为首先发生的查找。第二次运行不会改变任何内容。

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

该命令是空运行，直到您传递 `--write`。它会写入 `migrate-dotnet-i18n-report.md`。阅读该报告。当编辑看起来正确时：

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

再次运行空运行。当它不列出任何编辑时停止，然后运行项目的测试。留在原地的行 (`await`、原始内插原始字符串、条件空洞、`ref` 或 `out`、没有字面量的连接、传递给 `string.Format` 的 `IFormatProvider`) 需要手动修复。看起来像复数的短语属于 `Tn`，这可能会纠正始终为复数的源语句。生成的 `I18n.cs` 被跳过。删除报告或将其添加到 git-ignore。

`--wrap` 还会将未标记的 XAML `Text`、`Header`、`Content` 和其他标签属性标记为 `{loc:Tr '…'}`，加上名称以 `Text`、`Title` 或 `Message` 结尾的 C# 赋值，以及 `MessageBox.Show`。没有 `--write`，这是一次审计。它不会编辑日志、属性、`nameof`、比较或 `Path` 调用。

一份没有编辑的报告意味着包装的调用是安全的。这不意味着每个面向用户的句子都已包装。裸标签、返回的字符串和元素内容对它来说是不可见的。详情：[重写不安全的调用](/zh-Hans/guide/ui-strings/dotnet#rewrite-unsafe-calls)。

<a id="step-4-add-a-language-switch"></a>
## 步骤 4：添加语言切换功能

在第一个 `T()` 之前，找到 `locales/ui-languages.json`。从 `AppContext.BaseDirectory` 向上搜索，然后从当前目录向上搜索，每个最多 8 个目录。第一个文件获胜。将 `code`、`label` 和 `englishName` 解析为 `LocaleInfo` (`label` 是 `NativeName`)。调用 `Configure` 一次，将该数组作为 `Locales`，并将 `FlatDirectory` 设置为包含该文件的 `locales` 目录。`Configure` 在每次调用时替换 `Strict`、`FlatDirectory` 和 `OpenLocale`。稍后只设置 `Locales` 的调用会清除 `FlatDirectory`。`Locales: null` 不会恢复之前的列表。

如果文件缺失，则为源语言传递一个单元素 `Locales` 数组，并且不要设置 `FlatDirectory`。菜单仅为源语言。不要显示 `BuiltInLocales`。开发人员随后读取 `sync` 刚刚写入的目录。附近没有清单的已发布版本会保留嵌入式目录。应遵循 `sync` 的安装程序会将 `ui-languages.json` 和区域设置 JSON 随应用程序一起发布。

持久化区域设置代码，而不是本地名称。在 `SetLocale` 之前设置两种文化，因为 `LocaleChanged` 在该调用内部触发：

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

使用 `T("Language")` 标记控件。仅接受您传递的列表中的代码。在 `LocaleChanged` 上，为视图模型字符串引发 `PropertyChanged`，或重建复制其文本的控件。`TrExtension` 更新打开的视图，如 [步骤 2](#step-2-wrap-strings) 中所示。当框架具有流向时，从 `I18n.IsRightToLeft(code)` 设置它。

Avalonia：忽略 `SelectionChanged`，除非 `e.Source` 是拥有处理程序的控件。不要在该处理程序内部，或在该组合框的 `SetLocale` 引发的 `LocaleChanged` 内部，分配 `ItemsSource` 或 `SelectedItem`。使用 `Dispatcher.UIThread.Post` 发布刷新。在代码设置 `SelectedItem` 时保护处理程序。将冒泡事件视为选项卡更改并再次分配 `ItemsSource` 的父 `TabControl` 会导致进程崩溃（退出代码 139，空的 `crash.log`）。

控制台程序没有小部件。添加 `--lang <code>`（如果该名称空闲，则添加 `-L`）。仅接受上面加载列表中的代码。不要读取 `AI_I18N_LANG`。该变量仅用于 ai-i18n-tools CLI。

如果程序不显示供人阅读的文本，请跳过此步骤。

目录和当前区域设置是静态的。这对于桌面进程是安全的。它不是多用户服务器的每个请求区域设置。在那里保留 `IStringLocalizer` 或 `ResourceManager`，并遵循 [将 i18n 添加到 .NET ResourceManager 应用](/zh-Hans/guide/add-i18n-to-dotnet-resourcemanager)。设置 `CurrentUICulture` 不会为每个请求提供其自己的映射。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 不是您的情况？

| 您当前的代码 | 阅读 |
| --- | --- |
| `ResourceManager`、`.resx` 附属程序集或 ASP.NET `IStringLocalizer` | [将 i18n 添加到 .NET ResourceManager 应用](/zh-Hans/guide/add-i18n-to-dotnet-resourcemanager) |
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
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `I18n.cs` 的 xUnit 检查：嵌入式 JSON、文化回退、`{0}`、复数和 `Configure` |

这些目录用于检查辅助程序。它们不是需要翻译的应用程序，也不需要 API 密钥。该目录中的 `dotnet test` 运行检查。真正的应用程序从本页的 `init` 开始。使用 `npx degit` 复制一个，或从 GitHub 发布下载 `ai-i18n-tools-dotnet-examples.zip`。该 zip 文件还包含项目编译的 `assets/dotnet`。命令：[示例](/zh-Hans/examples#net-examples)。
