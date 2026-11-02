<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# 將國際化新增至 .NET ResourceManager 應用程式

此頁面適用於已使用 `ResourceManager` 或 ASP.NET `IStringLocalizer` 載入字串，或將會這樣做的 .NET 應用程式。您保留該載入器。ai-i18n-tools 會讀取 `T("…")` 和 `{loc:Tr '…'}`，翻譯訊息，並寫入 `.resx` 附屬組件，其索引鍵為那些來源字串。輔助程式是 `I18nResx.cs`，由 `init -t ui-dotnet-resx` 複製。

最快的方法是將此頁面上的提示提供給程式碼代理程式。它會將組態指向您的資源、包裝您的字串、檢查結果，並可新增語言切換功能。您自行安裝 CLI、選擇提供者，並自行初始化專案，因為這需要您的 API 金鑰和您的選擇。您也自行執行翻譯，因為它會花費您帳戶中的資金並重寫您的 `.resx` 檔案。

尚未有資源檔的新 Avalonia、WPF、MAUI、WinForms 或主控台應用程式使用 [將 i18n 新增至 .NET 應用程式](/zh-Hant/guide/add-i18n-to-dotnet)。該路徑會新增 `I18n.cs` 和內嵌 JSON。不確定哪種適用？請參閱結尾的 [不適用於您的情況？](#not-your-case)。

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

您在提示之前執行此操作一次。它會寫入組態和 `I18nResx.cs`，並使用您在上方選擇的提供者。

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

當專案命名空間不是 `init` 列印到 `I18nResx.cs` 中的命名空間時，請傳遞 `--namespace`。如果目錄中有一個 `.csproj` 且沒有 `--namespace`，`init` 會使用該檔案的 `RootNamespace`，或專案檔案名稱。否則命名空間為 `AiI18n`。

範本會將 `ui.flatOutput` 設定為 false，並將 `ui.resx` 設定為：

| 欄位 | 預設值 |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true，因此 `SharedResource.resx` 包含原始文字 |
| `localeFormat` | `bcp47`，因此德文檔案是 `SharedResource.de.resx`，巴西葡萄牙文檔案是 `SharedResource.pt-BR.resx` |
| `ingestExistingResx` | true |

當該檔案遺失時，`init` 會寫入 `I18nResx.cs`。`ResourceBaseName` 是命名空間、輸出資料夾和以點連接的基底名稱 (`MyApp.Resources.SharedResource`)。當檔案位於該資料夾中時，SDK 會在該資訊清單名稱下嵌入一個 resx。如果您移動檔案，請變更 `ResourceBaseName` 以符合。`init` 不會編輯 `.csproj`。附屬組件會在建置時從 `*.{culture}.resx` 產生。將這些附屬組件部署到應用程式旁邊。

執行 `init` 一次。它每次都會重寫 `ai-i18n-tools.config.json`，因此第二次執行會捨棄您所做的編輯。如果 `I18nResx.cs` 已包含標記 `ai-i18n-tools-i18n-cs`，專案已初始化：請跳過此步驟。`init` 不會覆寫現有的輔助程式。

然後編輯 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是來源中字串的語言。任何 BCP-47 語言都有效；腳手架使用 `en`。將 `ui.resx` 指向您的應用程式已載入的資料夾和基底名稱 (手動操作，即 [步驟 1](#step-1-point-the-config-at-your-resources))。`neutralFile` 是中性 resx，它將 `LoginButton` 等舊版名稱對應到其來源文字。當省略時，如果該檔案存在，則使用 `{outputDir}/{baseName}.resx`。

相同的 `ui` 區塊也可以寫入平面 JSON。將 `flatOutput` 設定回 true。兩個輸出共用一個目錄。此範本將 `flatOutput` 設為 false，因此只會寫入 `.resx`。

呼叫形狀和 JSON 輔助程式：[.NET 應用程式](/zh-Hant/guide/ui-strings/dotnet)。所有其他組態金鑰：[組態](/zh-Hant/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## 執行代理程式提示

在您的編碼代理程式（Cursor、Claude Code、Copilot 或類似工具）中開啟專案，開始新的聊天，然後貼上以下提示。專案必須已經初始化。無需編輯。如果您想省略某些內容，例如不使用語言切換，請在同一訊息中說明。

代理程式首先檢查 CLI、組態和 `I18nResx.cs` 是否存在，如果缺少其中一個，則會停止並提供指示。然後它分三個部分運作：

- 第 1 部分將 `ui.resx` 指向應用程式已載入的目錄，並檢查 `ResourceBaseName`。
- 第 2 部分將使用者介面字串包裝在 `T()` 和 `{loc:Tr '…'}` 中，並手動應用命名索引鍵建議。
- 第 3 部分新增一個語言切換，該切換保持在 `ResourceManager` 或 `IStringLocalizer`。

它不會安裝或初始化任何東西、讀取您的 API 金鑰或翻譯。它不會重寫 `.resx` 檔案。翻譯是審查之後的步驟，由您執行。

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
## 審查結果

代理程式結束時會產生一份報告。在翻譯之前檢查它：

- 差異。包裝的呼叫、組態、如果檔案移動則為 `ResourceBaseName`，以及語言切換應該已變更。您的 `.resx` 檔案在您翻譯之前應該保持不變。
- `ai-i18n-tools.config.json`：`resx.outputDir` 和 `baseName` 指向您的應用程式載入的目錄，而 `sourceRoots` 涵蓋應用程式專案。
- `ResourceBaseName` 符合 SDK 將嵌入的資訊清單名稱。
- `ai-i18n-tools extract` 列出新訊息並保留已在附屬組件中的翻譯。
- `migrate-dotnet-i18n` 的試運行沒有列出任何需要修復的項目，除了您選擇推遲的命名鍵建議。在您編輯這些行之前，它們仍然是 `Resources.LoginButton`。
- 您的測試通過，且應用程式在原始語言中看起來一樣。
- 沒有留下任何臨時腳本或 `migrate-dotnet-i18n-report.md`。

提交此狀態。`translate-ui` 會重寫您的 `.resx` 檔案，因此您會需要一個乾淨的差異來審查。

<a id="choose-models-and-translate"></a>
## 選擇模型並翻譯

您運行這部分。它會使用您的 API 金鑰，花費您帳戶中的資金，並重寫您的 `.resx` 檔案，因此請先提交。

來自 `init` 的模型列表是一個起點。對目前啟用提供者的聊天模型進行排序，當候選清單看起來正確時，將其寫入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 僅替換 `translationModels`。相同的排名位於 `ai-i18n-tools dashboard` 的[模型](/zh-Hant/guide/translation-dashboard/models)分頁上。

在第一個 `translate-ui` 之前填寫詞彙表。`init` 會將 `glossary.userGlossary` 指向 `glossary-user.csv`，但不會建立檔案。如果檔案遺失，請運行 `ai-i18n-tools glossary-generate`，然後新增領域術語。對於必須不變地複製的名稱，請使用 **Force**。

然後提取並翻譯：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` 會寫入中性檔案，並為每個目標語言寫入一個衛星檔案。鍵是來源字串。`<comment>` 會記錄上下文和第一個來源位置。衛星檔案中的手動編輯僅在 `extract` 在下一次翻譯之前攝取它時才會保留，這與 `.po` 檔案的合約相同。從現在起，請勿編輯生成的檔案，因為下一次運行會重新生成它們。在您提交之前，請審查第一個差異。

帶有 `type` 或 `mimetype`（圖像和其他二進位檔案）的條目會被跳過。當該文化沒有條目時，`ResourceManager.GetString` 會返回中性值。

重建，以便 SDK 嵌入新的衛星檔案，然後重新啟動應用程式。

<a id="check-one-language"></a>
### 檢查一種語言

切換到一個目標語言，並打開一個包含一些已包裝字串的畫面。仍然是來源語言的文字表示它未被包裝，或者仍然使用未應用的命名鍵，或者衛星檔案未重建。丟棄 `{0}` 或重新命名它的翻譯可能會拋出 `FormatException` 或省略該值。`string.Format` 不會回退到來源模板。在您懷疑程式碼之前，請檢查該句子的衛星檔案。

<a id="keep-it-translated"></a>
## 保持翻譯更新

更改來源文字後，重新運行 `ai-i18n-tools sync`（或 `extract` 然後 `translate-ui`）。快取表示只有新增或更改的字串會進入模型。在 CI 中運行它，這樣翻譯就不會偏離。翻譯運行後重建，以便衛星檔案再次嵌入。`ai-i18n-tools dashboard` 會打開 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以審查翻譯。

`purge-locale` 會刪除 `SharedResource.<culture>.resx` 並保留 `SharedResource.resx`。

若要重新整理複製的 `I18nResx.cs`，請在一個可拋棄的目錄中搭建相同的模板，並只複製您打算替換的生成檔案。不要在應用程式中重新運行 `init` 來升級輔助程式。

若要在同一次執行中翻譯 `README.md`，請使用 `--with-readme` 建立架構 (或將該區塊新增至現有設定檔)。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手動操作

如果您偏好自行進行變更，或想了解提示的作用，請按照這些步驟操作。每個步驟都與提示的一部分相符。最後，您仍然需要[安裝 CLI](#install-and-choose-a-provider)、[初始化專案](#initialise-the-project) 和[翻譯](#choose-models-and-translate)。

1. [將設定指向您的資源](#step-1-point-the-config-at-your-resources)。
2. 在 `T()` 或 `{loc:Tr '…'}` 中[包裝字串](#step-2-wrap-strings)。
3. [應用命名資源鍵](#step-3-apply-named-resource-keys)。
4. [在運行時切換語言](#step-4-switch-language-at-runtime)。

<a id="step-1-point-the-config-at-your-resources"></a>
## 步驟 1：將設定指向您的資源

模板會寫入此形狀。將資料夾和基本名稱更改為您的應用程式已載入的目錄：

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

根據您的專案檢查四件事：

- `outputDir` 和 `baseName` 是中性檔案和衛星檔案已經存在的位置。德語是 `SharedResource.de.resx`。當 `localeFormat` 是 `bcp47` 時，巴西葡萄牙語是 `SharedResource.pt-BR.resx`。
- 當該中性檔案不是 `{outputDir}/{baseName}.resx` 時，會設定 `neutralFile`。攝取會透過中性值 (`Sign in`) 映射舊版名稱 (`LoginButton`)。德語 `LoginButton` 值隨後儲存在來源字串 `Sign in` 下。
- `ResourceBaseName` 在 `I18nResx.cs` 中是命名空間、輸出資料夾和以點連接的基本名稱。當檔案移動時移動常數。不要動輔助程式的其餘部分。
- `sourceRoots` 是應用程式專案，而不是 `"."`。

純字串的 resx 名稱是來源文字：`Sign in`、`Saved to {0}`，一個包含引號或和號的值。上下文在上下文和來源之間使用 U+2404。resx 沒有複數形式。每個 CLDR 形式都是它自己的條目，命名為 `{singular}[{form}]`。`Tn` 會選擇與 `.po` 寫入器相同規則的形式。您不需要輸入分隔符或複數後綴。

使用 `ai-i18n-tools extract` 確認。目錄應列出從中性檔案攝取的字串。

<a id="step-2-wrap-strings"></a>
## 步驟 2：包裝字串

`extract` 僅在字串是傳遞給 `T()`、`Tn`、`Tp`、`N` 或 `{loc:Tr '…'}` 的字面值時才記錄它。與 [JSON 輔助程式](/zh-Hant/guide/add-i18n-to-dotnet#step-2-wrap-strings) 相同的形狀適用。佔位符是 `{0}`，而不是 `{name}`。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` 查詢您傳遞的任何名稱，並在資源遺失時傳回該名稱。預設的提取器名稱是 `T`、`Tn`、`Tp`、`N`、`Tr` 和 `Loc`。諸如 `_localizer["Sign in"]` 的呼叫是不可見的，直到將 `_localizer` 加入到 `ui.uiExtractor.funcNames`。呼叫 `T("Sign in")` 或 `I18nResx.T("Sign in")` 不需要額外的名稱。

XAML 使用 `{loc:Tr '…'}`。元素內容不會被提取。請勿動 `{Binding}` 和 `{StaticResource}`。

保留日誌、JSON 鍵、檔案名稱、`nameof` 以及未顯示的例外文字。儲存的值保留原始語言。翻譯控制項上的標題。

不安全的呼叫（`T($"…")`、串聯、`string.Format` 在 `T` 內部）是下一步的報告，連同諸如 `Resources.LoginButton` 的舊版名稱。

<a id="step-3-apply-named-resource-keys"></a>
## 步驟 3：應用具名資源鍵

`migrate-dotnet-i18n` 是一個空執行，直到您傳遞 `--write`。它會重寫在查詢之前建構的 `T` 引數，與 [檢查包裝呼叫](/zh-Hant/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls) 的編輯相同。

當 `extract` 攝取了中性的 `.resx` 後，報告也會新增一個具名鍵區段：

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

該清單供您應用。該命令不會編輯這些行。`--write` 也不會。在您將呼叫變更為 `T("Sign in")` 後，請再次執行 `extract`。

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

閱讀 `migrate-dotnet-i18n-report.md`。當不安全呼叫的編輯看起來正確時：

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

再次執行空執行。當它沒有列出不安全呼叫編輯時停止。您尚未應用的具名鍵會保留在建議清單中。刪除報告或將其加入 git-ignore。在此步驟中，請勿編輯 `.resx` 檔案。

<a id="step-4-switch-language-at-runtime"></a>
## 步驟 4：在執行時切換語言

`T` 讀取 `CultureInfo.CurrentUICulture`。`I18nResx.SetLocale` 設定該文化特性和 `CurrentCulture`，然後引發 `LocaleChanged`。它為 `Tn` 儲存的地區設定是靜態的，因此處理並行請求的伺服器不應將 `SetLocale` 用作每個使用者的開關。

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` 是請求本地的。將它指向工具寫入的 resx。空類別只是類型引數。資訊清單基本名稱必須與 `ResourceBaseName` 匹配。

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

在 Razor 頁面或服務中，呼叫 `T` 以便 `extract` 看到字面值。當呼叫站點已使用現有的 `IStringLocalizer<SharedResource>` 時，請保留它。如果查詢停留在索引器上，請將該接收器的名稱新增到 `ui.uiExtractor.funcNames`。

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` 沒有複數或上下文參數。擴充功能可以呼叫 `I18nResx`，它讀取相同的附屬組件。將它放在 ASP.NET 專案中。`I18nResx.cs` 不參考 `Microsoft.Extensions.Localization`，因此控制台或桌面專案不應包含該套件。

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

依此順序選擇請求文化特性：訪客的明確選擇（`?lang=` 或表單提交）、記住它的 cookie、`Accept-Language` 標頭，然後是來源地區設定。忽略不在 `sourceLocale` 或 `targetLocales` 中的代碼。`pt-BR` 是附屬組件名稱。發送 `pt-br` 的標頭在您分配 `CurrentUICulture` 之前仍必須與該名稱匹配。

<a id="desktop-and-console"></a>
### 桌面和主控台

在視窗建置之前還原儲存的文化特性，呼叫 `I18nResx.SetLocale`，並從 `LocaleChanged` 重新整理可見文字。從 `sourceLocale` 和 `targetLocales` 建置選單。將其標記為 `T("Language")`。流向來自 `CultureInfo.TextInfo.IsRightToLeft`。此輔助程式上沒有 `SupportedLocales` 清單。

主控台程式沒有小工具。新增 `--lang <code>`（如果該名稱可用，則新增 `-L`），然後在第一個 `T` 之前呼叫 `SetLocale`。不要讀取 `AI_I18N_LANG`。

當程式未顯示任何供人閱讀的文字時，請跳過此步驟。

這是最後一個手動步驟。請繼續閱讀 [選擇模型並翻譯](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 情況不同？

| 您目前的程式碼 | 閱讀 |
| --- | --- |
| 尚未有 `.resx` 和 `IStringLocalizer` | [將 i18n 新增至 .NET 應用程式](/zh-Hant/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | xUnit 檢查 `I18nResx.cs` 的：原始字串金鑰、引號、內容、複數形式、實際附屬組件 |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | JSON 協助程式，適用於不在 `ResourceManager` 上的應用程式 |

這些目錄會檢查輔助程式。它們不是需要翻譯的應用程式，也不需要 API 金鑰。`dotnet-resx` 中的 `dotnet test` 會執行衛星檢查。真正的應用程式從本頁的 `init` 開始。使用 `npx degit` 複製一個，或從 GitHub 發行版下載 `ai-i18n-tools-dotnet-examples.zip`。該壓縮檔也包含專案編譯的 `assets/dotnet`。命令：[範例](/zh-Hant/examples#net-examples)。
