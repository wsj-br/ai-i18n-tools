<a id="add-i18n-to-a-dotnet-app"></a>
# 為 .NET 應用程式新增國際化功能

本頁介紹如何將 .NET 應用程式 (Avalonia、WPF、MAUI、WinForms、Blazor、ASP.NET 或主控台工具) 該應用程式目前只有單一語言，並使用 ai-i18n-tools 新增地區設定。它遵循一條路徑：`ui-dotnet` 範本、一個小型 `I18n.cs` 輔助程式以及翻譯的 JSON 檔案。`extract` 僅在 UI 字串是 `T()`、`Tn`、`Tp`、`N` 或 XAML `{loc:Tr '…'}` 內的字串常值時才記錄它，因此，純原始文字的目錄將會是空的。

最快的方法是將本頁上的提示提供給程式碼代理程式。它會放置輔助程式、嵌入地區設定 JSON、包裝您的字串，並可新增語言切換功能。您需要自行安裝 CLI、選擇提供者並初始化專案，因為這需要您的 API 金鑰和您的選擇。您也需要自行執行翻譯，因為這會花費您帳戶中的費用。

已經使用 `ResourceManager` 或 ASP.NET `IStringLocalizer` 載入字串的應用程式，請使用[將 i18n 新增至 .NET ResourceManager 應用程式](/zh-Hant/guide/add-i18n-to-dotnet-resourcemanager)。該路徑會保留載入器並寫入 `.resx` 附屬組件。不確定哪種情況適用？請參閱末尾的[不適用於您的情況？](#not-your-case)。

流程：

1. [安裝 CLI 並選擇提供者](#install-and-choose-a-provider)。
2. 使用 `init`[初始化專案](#initialise-the-project)。
3. [執行代理程式提示](#run-the-agent-prompt)。
4. [檢閱結果](#review-the-result)。
5. [選擇模型並翻譯](#choose-models-and-translate)，然後檢查一種語言。
6. [保持翻譯](#keep-it-translated)。

偏好自行進行變更，或想知道提示的作用？[手動操作](#do-it-by-hand) 會逐步引導您完成相同的步驟。

<a id="install-and-choose-a-provider"></a>
## 安裝並選擇提供者

這部分由您執行，而不是代理程式。安裝程式會變更您的機器，而 API 金鑰是屬於您 shell 的機密，不應出現在提示中。

當機器已安裝 Node.js `>=22.16.0` 時，請使用 npm 套件 ([安裝](/zh-Hant/guide/installation))。對於 .NET 專案，請安裝獨立可執行檔 (無需 Node.js)。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安裝程式會檢查 `SHA256SUMS.txt`，將指令安裝為 `ai-i18n-tools`，並將其新增至 `PATH`。這些二進位檔未經公證或 Authenticode 簽署。手動步驟和資產名稱：[獨立可執行檔](/zh-Hant/guide/installation#standalone-executables)。

檢查安裝：

```bash
ai-i18n-tools --version
```

然後選擇提供者，並在其將執行翻譯的 shell 中設定其 API 金鑰。例如，OpenRouter：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama 不需要金鑰。其他預設值：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。請記下提供者名稱，因為您會在下一步將其傳遞給 `init`。代理程式永遠不需要金鑰：它只執行不進行模型呼叫的命令。您稍後在[翻譯](#choose-models-and-translate)時會使用該金鑰。

<a id="initialise-the-project"></a>
## 初始化專案

您在提示之前執行此操作一次。它會寫入組態和 `I18n.cs`，並使用您在上方選擇的提供者。

本頁使用一個範本，即 `ui-dotnet`。它會寫入組態、`I18n.cs` 輔助程式和 JSON 目錄。它適用於以下應用程式：

| 您的應用程式 | 備註 |
| --- | --- |
| Avalonia、WPF、MAUI | XAML 中的標籤需要標記延伸。輔助程式不會參考這些組件 |
| WinForms | 當地區設定變更時，重新建置可見文字 |
| Blazor 和單一使用者 ASP.NET 應用程式 | 輔助程式的目錄是靜態的，這足以供單一使用者同時使用 |
| 多使用者伺服器 | 保留 `IStringLocalizer` 或 `ResourceManager`。使用[ResourceManager 頁面](/zh-Hant/guide/add-i18n-to-dotnet-resourcemanager) |
| 主控台工具 | `--lang` 選項，而非小工具 |

使用您選擇的提供者執行 init (此範例中為 OpenRouter)：

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

當專案命名空間不是 `init` 列印到 `I18n.cs` 中的命名空間時，請傳遞 `--namespace`。如果目錄中有一個 `.csproj` 且沒有 `--namespace`，則 `init` 會使用該檔案的 `RootNamespace`，或專案檔案名稱。否則命名空間為 `AiI18n`。

然後編輯 `sourceLocale` 和 `targetLocales` 於 `ai-i18n-tools.config.json` 中。`sourceLocale` 是來源字串的語言。任何 BCP-47 語言都有效；腳手架使用 `en`。`init` 將該列表作為 `BuiltInLocales` 蓋印到 `I18n.cs` 中，位於 `ai-i18n-tools-locales` 標記之間，而 `SourceLocale` 是一個常數。該蓋印並非語言選單。`extract` 從設定中重寫 `locales/ui-languages.json`，且應用程式在啟動時讀取該檔案。請勿在應用程式中重新執行 `init` 以重新整理輔助程式。

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。如果 `I18n.cs` 已包含標記 `ai-i18n-tools-i18n-cs`，則專案已初始化：請跳過此步驟。`init` 不會覆寫現有的 `I18n.cs`，也不會編輯 `.csproj`。

`init` 將 `ui.sourceRoots` 設定為 `"."`，因此 `extract` 將會掃描整個儲存庫。提示將其範圍縮小到您的應用程式碼（手動操作，即 [步驟 1](#step-1-place-the-helper-and-embed-the-catalogs))。掃描已跳過名為 `bin`、`obj`、`.vs`、`TestResults` 和 `packages` 的目錄，且範本排除了 `**/Tests/**`、`**/*.Tests/**` 和 `**/TrExtension.cs`。

呼叫形式：[.NET 應用程式](/zh-Hant/guide/ui-strings/dotnet)。所有其他組態金鑰：[組態](/zh-Hant/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的編碼代理程式（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，然後貼上以下提示。專案必須已經初始化。無需編輯。如果您想省略某些內容，例如不使用語言切換，請在同一訊息中說明。

代理程式會先檢查 CLI、組態和 `I18n.cs` 是否存在，如果缺少任何一個，則會停止並提供指示。然後它分為三個部分：

- 第 1 部分將 `I18n.cs` 和 `locales/` 放置在專案儲存程式碼的位置，嵌入 JSON，並將組態指向它們。
- 第 2 部分將使用者介面字串包裝在 `T()`、`Tn`、`Tp`、`N` 和 `{loc:Tr '…'}` 中，然後使用 `migrate-dotnet-i18n` 檢查不安全的呼叫。
- 第 3 部分新增語言切換功能，或 CLI 語言選項。

它不會安裝或初始化任何東西，讀取您的 API 金鑰，或進行翻譯。翻譯是審查之後的步驟，由您執行。

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
## 審查結果

代理程式結束時會產生一份報告。在翻譯之前檢查它：

- 差異。包裝的文字應與之前相同，沒有不相關的重新格式化。`git diff --stat` 顯示了多少變更。輔助程式的位置、`EmbeddedResource` 項目、包裝的呼叫以及語言切換是預期的編輯。
- 生成的目錄（`strings.json`、每個語言環境的 JSON、`ui-languages.json`）除了 `extract` 寫入的內容外，均未被觸動。`I18n.cs` 除了當該常數發生漂移時的 `SourceLocale` 蓋印外，均未被觸動。選單從 `ui-languages.json` 載入。當找到該檔案時，一個 `Configure` 呼叫會同時設定 `Locales` 和 `FlatDirectory`。`TrExtension` 被排除在提取之外，並更新 `LocaleChanged` 上的開啟視圖。
- `ai-i18n-tools extract` 執行乾淨，且 `strings.json` 列出您預期的句子。沒有警告殘留，也沒有任何字面值仍包含 `{name}`。
- `migrate-dotnet-i18n` 的試執行沒有列出任何需要修復的內容。一份乾淨的報告並不能證明每個句子都已包裝。代理程式報告中跳過的字串是該檢查的其餘部分。
- 您的測試通過，且應用程式在來源語言中看起來相同。
- 沒有留下任何一次性指令碼或 `migrate-dotnet-i18n-report.md`。
- `I18n.cs` 中的 `SourceLocale` 與設定中的 `sourceLocale` 逐字相同。語言選單不讀取 `BuiltInLocales`。

代理程式遺漏的字串稍後會顯示為保留在原始語言中的文字。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

由您執行此部分。它使用您的 API 金鑰並在您的帳戶上花費金錢。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。相同的排名位於 `ai-i18n-tools dashboard` 的[模型](/zh-Hant/guide/translation-dashboard/models)分頁上。

在第一個 `translate-ui` 之前填寫詞彙表。`init` 將 `glossary.userGlossary` 指向 `glossary-user.csv`，且不建立檔案。如果檔案遺失，請執行 `ai-i18n-tools glossary-generate`，然後新增領域術語。對於必須不變更地複製的名稱，請使用 **Force**。未變更字串的第二次 `translate-ui` 可能會以不同的措辭返回。詞彙表是使兩次執行一致的原因。

然後提取並翻譯：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` 寫入 `strings.json` 和 `ui-languages.json`。`translate-ui` 在 `ui.flatOutputDir` 下為每個目標語言寫入一個 JSON 檔案。請勿編輯這些產生的檔案。當 `features.translateUIStrings` 開啟時，`sync` 會同時執行 `extract` 和 `translate-ui`。

`T()` 在地區設定 JSON 中查找來源句子。`strings.json` 中的 ID 不是查找鍵。除非設定了 `I18n.Strict`，否則遺失的檔案或遺失的鍵會返回來源句子。`string.Format` 然後在翻譯的範本上執行。無效的格式可能會拋出 `FormatException`。遺漏的 `{0}` 可能會省略引數。格式錯誤後，沒有回退到來源範本。

<a id="check-one-language"></a>
### 檢查一種語言

重新啟動應用程式，切換到一個目標語言，然後開啟一個包含一些包裝字串的畫面。使用代理程式新增的語言切換，或自行設定兩種文化並呼叫 `I18n.SetLocale`。仍為原始語言的文字未經包裝，在 `SetLocale` 之前已複製到控制項中，或在地區設定 JSON 中沒有條目。在懷疑程式碼之前，請檢查 JSON 中的句子。

`SetLocale` 遍歷 `CultureInfo.Parent` 直到目錄開啟 (`pt-BR` 可以載入 `pt.json`)。當 `OpenLocale` 和 `FlatDirectory` 都未設定時，會使用內嵌資源。當檔案遺失時，已設定的 `FlatDirectory` 不會回退到內嵌 JSON。

當啟動時找到 `locales/ui-languages.json`，`FlatDirectory` 就是該目錄，因此您看到的句子是 `sync` 剛寫入的檔案。隱藏該清單並重新開始：選單僅提供來源語言，且字串來自上次建置中嵌入的資源。應遵循 `sync` 的已安裝建置必須隨應用程式一起發佈 `ui-languages.json` 和語言環境 JSON。

<a id="keep-it-translated"></a>
## 保持翻譯更新

變更來源文字後，重新執行 `ai-i18n-tools sync`（或先執行 `extract` 再執行 `translate-ui`）。快取表示只有新增或變更的字串才會進入模型。在 CI 中執行它，以避免翻譯漂移。將 `FlatDirectory` 指向 `locales` 資料夾後，重新啟動應用程式。僅當未找到清單且應用程式仍在讀取嵌入式 JSON 時才需要重建。`ai-i18n-tools dashboard` 開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以審查翻譯。

若要重新整理複製的 `I18n.cs`，請在一次性目錄中搭建相同的範本，並僅複製您打算替換的產生檔案。請勿在應用程式中重新執行 `init` 以升級輔助程式。

若要在同一次執行中翻譯 `README.md`，請使用 `--with-readme` 建立架構 (或將該區塊新增至現有設定檔)。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或想了解提示的作用，請按照這些步驟操作。每個步驟都與提示的一部分相符。最後，您仍然需要[安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 和[翻譯](#choose-models-and-translate)。

1. [放置輔助程式並嵌入目錄](#step-1-place-the-helper-and-embed-the-catalogs)。
2. 在 `T()`、`Tn`、`Tp`、`N` 或 `{loc:Tr '…'}` 中[包裝字串](#step-2-wrap-strings)。
3. 使用 `migrate-dotnet-i18n`[檢查包裝的呼叫](#step-3-check-wrapped-calls)。
4. [新增語言切換](#step-4-add-a-language-switch)。

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## 步驟 1：放置輔助程式並嵌入目錄

`init` 在儲存庫根目錄中寫入這些內容：

| 檔案 | 這是什麼 | 編輯它嗎？ |
| --- | --- | --- |
| `I18n.cs` | 您的程式碼呼叫的輔助程式 (`T`、`Tn`、`Tp`、`SetLocale`) | 否。它是產生的。`init` 不會覆寫它 |
| `locales/strings.json` | 擷取快取。應用程式從不讀取它 | 否。`extract` 寫入它 |
| `locales/<code>.json` | 應用程式載入的翻譯，每個語言一個檔案 | 否。`translate-ui` 寫入它們 |
| `locales/ui-languages.json` | 語言選單。應用程式在啟動時讀取 `code`、`label` 和 `englishName` | 否。`extract` 寫入它 |

將 `I18n.cs` 和 `locales/` 移至應用程式專案中。將嵌入新增到該 `.csproj` 中，並保留檔案的其餘部分不變：

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

包含路徑是相對於專案檔案的。.NET Framework 4.8 也需要 `System.Text.Json` 套件。.NET 6 或更新版本已包含它。

更新設定到新位置，並將 `sourceRoots` 指向應用程式專案，以便測試和建置輸出不會進入目錄：

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

新增 `global using static MyApp.I18n;`（使用在 `I18n.cs` 中列印的命名空間），或在每個站點呼叫 `I18n.T`。

輔助程式中的 `SourceLocale` 必須等於設定中的 `sourceLocale`。`BuiltInLocales`，位於 `ai-i18n-tools-locales` 標記之間，是 `init` 蓋印的列表。它不是選單。在您變更 `targetLocales` 後，`extract` 會重寫 `ui-languages.json`，且應用程式會讀取該檔案。當您需要一個新的輔助程式時，請搭建一個一次性目錄。請勿在此處重新執行 `init`。

使用 `ai-i18n-tools extract` 確認。目錄應該會出現在新的 `locales/` 資料夾中。在有內容被包裝之前，預計會有 0 個字串。

<a id="step-2-wrap-strings"></a>
## 步驟 2：包裝字串

`extract` 僅在字串是傳遞給 `T()`、`Tn`、`Tp`、`N` 或 `{loc:Tr '…'}` 的常值時才記錄。像 `I18n.T` 這樣的接收器匹配，因為最後一個名稱是 `T`。

首先查詢目錄條目，然後將結果傳遞給 `string.Format`：

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

這些會被提取然後拒絕，因為目錄與程式查閱的內容不符：

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` 會對前三個列印警告，並在 `{name}` 處停止。[下一步](#step-3-check-wrapped-calls) 會重寫前三個。

佔位符保持 .NET 形式：`{0}`、`{0,-10}`、`{0:C}`。`%` 是普通文字，因此像 `10% off` 這樣的翻譯不是 printf 標記。雙大括號 (<code v-pre>{{</code> 和 `}}`) 是常值大括號，必須保持不變地複製。更多呼叫形式：[可翻譯的呼叫](/zh-Hant/guide/ui-strings/dotnet#calls-that-translate)。

XAML 和 AXAML：

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

前綴被忽略。`{Binding}` 和 `{StaticResource}` 不變。作為元素內容寫入的文字不會被提取。包含撇號的常值會用 `&quot;` 寫入，以便屬性可以保留在雙引號中。

Avalonia、WPF 和 MAUI 各自提供自己的 `MarkupExtension` 基底類別。輔助程式不參考這些組件。`ProvideValue` 返回 `I18n.T(Text)` 並在 `LocaleChanged` 上再次設定該屬性，然後當控制項離開視覺樹時取消訂閱。一個 Avalonia 形狀（`IProvideValueTarget` 位於 `Avalonia.Metadata` 中）：

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

WPF 和 MAUI 使用自己的屬性類型執行相同的操作。將 `**/TrExtension.cs` 新增到 `ui.uiExtractor.exclude`。`T(Text)` 不是字面值，且 XAML 字面值已透過 `Tr` 提取。`{loc:Tr}` 只能呼叫 `T`。一個短詞的兩種含義在程式碼中透過 `Tp` 設定。

格式化的句子保留在 C# (`T("Cursor {0}", value)`) 中，這使得提取器保持在單一字面值上。繫結上的 `StringFormat` 對於 `extract` 是不可見的。相同的呼叫適用於視圖模型、托盤工具提示和對話方塊。從 `LocaleChanged` 引發 `PropertyChanged` 以用於視圖模型字串。

儲存並顯示的值會將儲存的值保留在原始語言中。列舉組合會保留列舉，並從其標題傳回 `T("Light")`，然後在 `LocaleChanged` 上重建項目。`N("Last 12 months")` 存在，以便靜態欄位可以保留擷取器看到的常值。靜態字典中的 `T()` 會在第一次類型載入時執行一次，並保留在該語言中。服務會儲存英文錯誤句子。顯示網站會透過 `T` 對應已知句子，以便稍後的地區設定變更可以翻譯它們。失敗時的 `T()` 會凍結該句子。

托盤項目使用 `Tp("tray", "Open")` 和穩定的 `CommandParameter`。匹配參數，而不是標頭。Linux `.desktop` `Name=` 和 `Comment=` 保留在原始語言中。進行比較的持續時間權杖 (`2d`、`7h 47m`) 保持不翻譯。在顯示文字的地方翻譯 `T("now")` 和 `T("in {0}", duration)`。帶有前導或尾隨空格的常值 (`Updated: `) 仍然是擷取警告。將空格移至格式字串或版面配置中。`Tn` 可能會更改始終為複數的原始句子 (`1 samples`)。

這些請勿動：日誌、JSON 屬性名稱、檔案名稱、`nameof`、屬性引數、用作識別碼的物件鍵，以及程式匹配而非顯示的例外文字。

再次執行 `ai-i18n-tools extract`。目錄現在應該會列出您包裝的句子。

<a id="step-3-check-wrapped-calls"></a>
## 步驟 3：檢查包裝呼叫

當呼叫在目錄查詢之前格式化字串時，請使用此步驟：

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` 會將這些重寫為優先發生的查詢。第二次執行不會改變任何內容。

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

在您傳遞 `--write` 之前，此命令是試運行。它會寫入 `migrate-dotnet-i18n-report.md`。閱讀該報告。當編輯看起來正確時：

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

再次執行試運行。當它沒有列出任何編輯時停止，然後執行專案的測試。留在原位的行 (`await`、原始內插原始字串、條件孔、`ref` 或 `out`、沒有常值的串聯、傳遞給 `string.Format` 的 `IFormatProvider`) 需手動修正。看起來像複數的詞組屬於 `Tn`，這可能會修正始終為複數的原始句子。產生的 `I18n.cs` 會被跳過。刪除報告或將其 git-ignore。

`--wrap` 也將未標記的 XAML `Text`、`Header`、`Content` 和其他標籤屬性標記為 `{loc:Tr '…'}`，加上名稱以 `Text`、`Title` 或 `Message` 結尾的 C# 賦值，以及 `MessageBox.Show`。沒有 `--write`，這是一個審核。它不會編輯日誌、屬性、`nameof`、比較或 `Path` 呼叫。

沒有編輯的報告表示包裝的呼叫是安全的。這不表示每個面向使用者的句子都已包裝。裸標籤、返回的字串和元素內容對它來說是不可見的。詳細資訊：[重寫不安全的呼叫](/zh-Hant/guide/ui-strings/dotnet#migrate)。

<a id="step-4-add-a-language-switch"></a>
## 步驟 4：新增語言切換功能

在第一個 `T()` 之前，找到 `locales/ui-languages.json`。從 `AppContext.BaseDirectory` 向上搜尋，然後從目前目錄向上搜尋，每個最多 8 個目錄。第一個檔案獲勝。將 `code`、`label` 和 `englishName` 解析為 `LocaleInfo` (`label` 是 `NativeName`)。使用該陣列作為 `Locales` 並將 `FlatDirectory` 設定為包含該檔案的 `locales` 目錄，呼叫 `Configure` 一次。`Configure` 在每次呼叫時都會取代 `Strict`、`FlatDirectory` 和 `OpenLocale`。稍後只設定 `Locales` 的呼叫會清除 `FlatDirectory`。`Locales: null` 不會還原先前的清單。

如果檔案遺失，請為原始語言傳遞一個單元素 `Locales` 陣列，並且不要設定 `FlatDirectory`。選單僅為原始語言。不要顯示 `BuiltInLocales`。開發人員隨後會讀取 `sync` 剛寫入的目錄。附近沒有資訊清單的已發佈組建會保留嵌入的目錄。應遵循 `sync` 的安裝程式會將 `ui-languages.json` 和地區設定 JSON 隨應用程式一起發佈。

持久化地區設定代碼，而不是原生名稱。在 `SetLocale` 之前設定兩種文化，因為 `LocaleChanged` 會在該呼叫內部觸發：

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

使用 `T("Language")` 標記控制項。僅接受您傳遞的清單中的代碼。在 `LocaleChanged` 上，為檢視模型字串引發 `PropertyChanged`，或重建複製其文字的控制項。`TrExtension` 會更新開啟的檢視，如 [步驟 2](#step-2-wrap-strings) 中所示。當框架具有流向時，從 `I18n.IsRightToLeft(code)` 設定它。

Avalonia：忽略 `SelectionChanged`，除非 `e.Source` 是擁有處理常式的控制項。請勿在該處理常式內部，或在此組合的 `SetLocale` 引發的 `LocaleChanged` 內部，指派 `ItemsSource` 或 `SelectedItem`。使用 `Dispatcher.UIThread.Post` 發佈重新整理。在程式碼設定 `SelectedItem` 時保護處理常式。將冒泡事件視為分頁變更並再次指派 `ItemsSource` 的父級 `TabControl` 會導致程序崩潰 (結束代碼 139，空的 `crash.log`)。

主控台程式沒有小工具。新增 `--lang <code>` (以及當該名稱可用時的 `-L`)。僅接受從上方載入的清單中的代碼。不要讀取 `AI_I18N_LANG`。該變數僅適用於 ai-i18n-tools CLI。

當程式未顯示任何供人閱讀的文字時，請跳過此步驟。

目錄和目前的地區設定是靜態的。這對於桌面程序來說是安全的。這不是多使用者伺服器的每個請求地區設定。將`IStringLocalizer`或`ResourceManager`保留在那裡，並遵循[將i18n新增至.NET ResourceManager應用程式](/zh-Hant/guide/add-i18n-to-dotnet-resourcemanager)。設定`CurrentUICulture`不會為每個請求提供其自己的對應。

這是最後一個手動步驟。請繼續閱讀 [選擇模型並翻譯](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 情況不同？

| 您目前的程式碼 | 閱讀 |
| --- | --- |
| `ResourceManager`、`.resx`附屬組件，或ASP.NET `IStringLocalizer` | [將i18n新增至.NET ResourceManager應用程式](/zh-Hant/guide/add-i18n-to-dotnet-resourcemanager) |
| 已使用原始語言句子`T("…")` | [UI 字串](/zh-Hant/guide/ui-strings/)步驟2–3，和[.NET 應用程式](/zh-Hant/guide/ui-strings/dotnet) |
| JS/TS 應用程式 | [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) |
| Python 應用程式 | [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) |
| Django、Flask-Babel 目錄，或GNU gettext | [將i18n新增至Django / Python gettext應用程式](/zh-Hant/guide/add-i18n-to-django-gettext) |
| 網站或文件網站 | [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website) |
| 儲存庫 README 或其他 Markdown 檔案 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 範例

| 範例 | 顯示內容 |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `I18n.cs` 的 xUnit 檢查：嵌入式 JSON、文化回退、`{0}`、複數和 `Configure` |

這些目錄會檢查輔助程式。它們不是要翻譯的應用程式，而且它們不需要API金鑰。該目錄中的`dotnet test`會執行檢查。實際應用程式從本頁的`init`開始。
