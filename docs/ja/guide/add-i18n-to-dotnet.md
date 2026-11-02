<a id="add-i18n-to-a-net-app"></a>
# .NET アプリに i18n を追加する

このページでは、単一言語の.NETアプリ（Avalonia、WPF、MAUI、WinForms、Blazor、ASP.NET、またはコンソールツール）にai-i18n-toolsでロケールを追加します。これは1つのパスに従います。`ui-dotnet`テンプレート、小さな`I18n.cs`ヘルパー、および翻訳のJSONファイルです。`extract`は、`T()`、`Tn`、`Tp`、`N`、またはXAML `{loc:Tr '…'}`内の文字列リテラルである場合にのみUI文字列を記録するため、プレーンなソーステキストのカタログは空になります。

最も手っ取り早い方法は、このページのプロンプトをコーディングエージェントに与えることです。これにより、ヘルパーが配置され、ロケールJSONが埋め込まれ、文字列がラップされ、言語切り替えを追加できます。CLIのインストール、プロバイダーの選択、プロジェクトの初期化はご自身で行ってください。これにはAPIキーと選択が必要なためです。翻訳もご自身で実行してください。これはあなたのアカウントで費用が発生するためです。

既に`ResourceManager`またはASP.NET `IStringLocalizer`で文字列をロードしているアプリは、[Add i18n to a .NET ResourceManager app](/ja/guide/add-i18n-to-dotnet-resourcemanager)を使用します。このパスはローダーを保持し、`.resx`サテライトを書き込みます。どちらが適用されるか不明ですか？最後に[あなたのケースではありませんか？](#not-your-case)を参照してください。

流れ:

1. [CLIをインストールしてプロバイダーを選択する](#install-and-choose-a-provider)。
2. `init`で[プロジェクトを初期化する](#initialise-the-project)。
3. [エージェントプロンプトを実行する](#run-the-agent-prompt)。
4. [結果を確認する](#review-the-result)。
5. [モデルを選択して翻訳する](#choose-models-and-translate)後、1つの言語を確認します。
6. [翻訳を維持する](#keep-it-translated)。

変更をご自身で行いたい場合、またはプロンプトが何をするのか知りたいですか？[手動で行う](#do-it-by-hand)では、同じ手順を一つずつ説明します。

<a id="install-and-choose-a-provider"></a>
## プロバイダーのインストールと選択

この部分はエージェントではなく、ご自身で行います。インストーラーはマシンを変更し、APIキーはプロンプトではなくシェルに属する秘密情報です。

マシンにNode.js `>=22.16.0`が既にインストールされている場合は、npmパッケージを使用します（[インストール](/ja/guide/installation)）。.NETプロジェクトの場合は、スタンドアロン実行可能ファイル（Node.jsなし）をインストールします。

LinuxおよびmacOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーは `SHA256SUMS.txt` をチェックし、コマンドを `ai-i18n-tools` としてインストールし、`PATH` に追加します。バイナリは公証されておらず、Authenticode 署名もされていません。手動の手順とアセット名：[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)。

インストールを確認します:

```bash
ai-i18n-tools --version
```

次に、プロバイダーを選択し、翻訳を実行するシェルでそのAPIキーを設定します。例: OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollamaはキーを必要としません。その他のプリセット: [組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)。プロバイダー名をメモしておいてください。次のステップで`init`に渡すためです。エージェントはキーを必要としません。モデル呼び出しを行わないコマンドのみを実行するためです。キーは後で[翻訳する](#choose-models-and-translate)ときに使用します。

<a id="initialise-the-project"></a>
## プロジェクトの初期化

これをプロンプトの前に一度実行します。設定と`I18n.cs`を書き込み、上で選択したプロバイダーを使用します。

このページでは1つのテンプレート、`ui-dotnet`を使用します。設定、`I18n.cs`ヘルパー、およびJSONカタログを書き込みます。これらのアプリに適しています。

| あなたのアプリ | 注意事項 |
| --- | --- |
| Avalonia, WPF, MAUI | XAMLのラベルにはマークアップ拡張が必要です。ヘルパーはそれらのアセンブリを参照しません |
| WinForms | ロケールが変更されたときに表示テキストを再構築します |
| BlazorおよびシングルユーザーASP.NETアプリ | ヘルパーのカタログは静的であり、一度に1人のユーザーには十分です |
| マルチユーザーサーバー | `IStringLocalizer`または`ResourceManager`を保持します。[ResourceManagerページ](/ja/guide/add-i18n-to-dotnet-resourcemanager)を使用してください |
| コンソールツール | ウィジェットではなく、`--lang`オプションです |

選択したプロバイダー（この例ではOpenRouter）でinitを実行します。

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

プロジェクトの名前空間が`init`が`I18n.cs`に出力するものと異なる場合は、`--namespace`を渡します。ディレクトリに1つの`.csproj`があり、`--namespace`がない場合、`init`はそのファイルの`RootNamespace`、またはプロジェクトファイル名を使用します。それ以外の場合、名前空間は`AiI18n`です。

次に、`ai-i18n-tools.config.json` 内の `sourceLocale` と `targetLocales` を編集します。`sourceLocale` はソース内の文字列の言語です。任意の BCP-47 言語が有効です。スキャフォールドは `en` を使用します。`init` はそのリストを `ai-i18n-tools-locales` マーカーの間に `BuiltInLocales` として `I18n.cs` にスタンプし、`SourceLocale` は定数です。そのスタンプは言語メニューではありません。`extract` は設定から `locales/ui-languages.json` を書き換え、アプリは起動時にそのファイルを読み込みます。ヘルパーを更新するために、アプリで `init` を再実行しないでください。

`init`を一度実行します。これは毎回`ai-i18n-tools.config.json`を書き換えるため、2回目の実行では行った編集が失われます。`I18n.cs`に既にマーカー`ai-i18n-tools-i18n-cs`が含まれている場合、プロジェクトは既に初期化されています。このステップをスキップしてください。`init`は既存の`I18n.cs`を上書きせず、`.csproj`を編集しません。

`init` は `ui.sourceRoots` を `"."` に設定するため、`extract` はリポジトリ全体をスキャンします。プロンプトはそれをアプリケーションコードに絞り込みます（手動で、つまり[ステップ 1](#step-1-place-the-helper-and-embed-the-catalogs)）。スキャンはすでに `bin`、`obj`、`.vs`、`TestResults`、および `packages` という名前のディレクトリをスキップし、テンプレートは `**/Tests/**`、`**/*.Tests/**`、および `**/TrExtension.cs` を除外します。

呼び出しの形式：[.NETアプリケーション](/ja/guide/ui-strings/dotnet)。その他のすべての設定キー：[設定](/ja/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント（Cursor、Claude Code、Copilotなど）でプロジェクトを開き、新しいチャットを開始し、以下のプロンプトを貼り付けます。プロジェクトはすでに初期化されている必要があります。編集するものは何もありません。例えば言語切り替えを不要にするなど、何か除外したい場合は、同じメッセージでその旨を伝えてください。

エージェントはまず、CLI、設定、および`I18n.cs`が存在することを確認し、いずれかが不足している場合は指示を出して停止します。その後、3つの部分に分かれて動作します。

- パート1では、プロジェクトがコードを保持する場所に`I18n.cs`と`locales/`を配置し、JSONを埋め込み、それらを設定に指定します。
- パート2では、ユーザー向け文字列を`T()`、`Tn`、`Tp`、`N`、および`{loc:Tr '…'}`でラップし、その後、`migrate-dotnet-i18n`で安全でない呼び出しをチェックします。
- パート3では、言語切り替えまたはCLI言語オプションを追加します。

何もインストールしたり初期化したりせず、APIキーを読み取ったり、翻訳したりすることもありません。翻訳はレビュー後のステップであり、ユーザーが実行します。

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
## 結果をレビューする

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。ラップされたテキストは、無関係な再フォーマットなしで、以前と同じように読めるはずです。`git diff --stat` は変更量を示します。ヘルパーの配置、`EmbeddedResource` アイテム、ラップされた呼び出し、および言語切り替えが期待される編集です。
- 生成されたカタログ（`strings.json`、ロケールごとの JSON、`ui-languages.json`）は、`extract` が書き込んだもの以外は変更されていません。`I18n.cs` は、その定数がずれていた場合の `SourceLocale` スタンプ以外は変更されていません。メニューは `ui-languages.json` から読み込まれます。そのファイルが見つかった場合、1つの `Configure` 呼び出しが `Locales` と `FlatDirectory` をまとめて設定します。`TrExtension` は抽出から除外され、`LocaleChanged` の開いているビューを更新します。
- `ai-i18n-tools extract` はクリーンに実行され、`strings.json` は期待する文をリストします。警告は残っておらず、リテラルに `{name}` が含まれているものもありません。
- `migrate-dotnet-i18n` のドライランでは、修正すべきものは何もリストされません。クリーンなレポートは、すべての文がラップされたことを証明するものではありません。エージェントのレポートにあるスキップされた文字列は、そのチェックの残りの部分です。
- テストはパスし、アプリはソース言語で同じように見えます。
- 使い捨てのスクリプトや `migrate-dotnet-i18n-report.md` は残されていません。
- `I18n.cs` 内の `SourceLocale` は、設定内の `sourceLocale` と文字通り一致します。言語メニューは `BuiltInLocales` を読み込みません。

エージェントが見落とした文字列は、後でソース言語のままのテキストとして表示されます。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はユーザーが実行します。これはユーザーのAPIキーを使用し、アカウントに費用が発生します。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`は`translationModels`のみを置き換えます。同じランキングが`ai-i18n-tools dashboard`の[モデル](/ja/guide/translation-dashboard/models)タブにあります。

グロッサリを最初の`translate-ui`の前に記入します。`init`は`glossary.userGlossary`を`glossary-user.csv`に向け、ファイルを作成しません。ファイルがない場合は、`ai-i18n-tools glossary-generate`を実行してからドメイン用語を追加してください。変更せずにコピーする必要がある名前には**Force**を使用します。変更されていない文字列の2回目の`translate-ui`は、異なる表現で返される可能性があります。グロッサリによって、2回の実行が一致するようになります。

その後、抽出して翻訳します。

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract`は`strings.json`と`ui-languages.json`を書き込みます。`translate-ui`は`ui.flatOutputDir`の下にターゲット言語ごとに1つのJSONファイルを書き込みます。これらの生成されたファイルは編集しないでください。`sync`は`features.translateUIStrings`がオンの場合に`extract`と`translate-ui`を一緒に実行します。

`T()`はロケールJSONでソース文を検索します。`strings.json`のIDは検索キーではありません。ファイルが見つからないかキーが見つからない場合、`I18n.Strict`が設定されていない限り、ソース文が返されます。その後、`string.Format`は翻訳されたテンプレートで実行されます。無効なフォーマットは`FormatException`をスローする可能性があります。欠落した`{0}`は引数を省略する可能性があります。フォーマットエラーの後、ソーステンプレートへのフォールバックはありません。

<a id="check-one-language"></a>
### 1つの言語を確認する

アプリを再起動し、ターゲット言語の1つに切り替え、ラップされた文字列がいくつかある画面を開きます。エージェントが追加した言語切り替えを使用するか、両方のカルチャを設定し、自分で`I18n.SetLocale`を呼び出します。ソース言語のままのテキストはラップされていないか、`SetLocale`の前にコントロールにコピーされたか、ロケールJSONにエントリがありません。コードを疑う前に、その文のJSONを確認してください。

`SetLocale`はカタログが開くまで`CultureInfo.Parent`をたどります（`pt-BR`は`pt.json`をロードできます）。`OpenLocale`も`FlatDirectory`も設定されていない場合、埋め込みリソースが使用されます。ファイルが見つからない場合、設定された`FlatDirectory`は埋め込みJSONにフォールバックしません。

起動時に `locales/ui-languages.json` が見つかった場合、`FlatDirectory` はそのディレクトリであり、表示される文は `sync` が書き込んだばかりのファイルです。そのマニフェストを非表示にして再起動してください。メニューにはソース言語のみが表示され、文字列は最後のビルドに組み込まれた埋め込みリソースから取得されます。`sync` に従うべきインストールされたビルドは、`ui-languages.json` とロケール JSON をアプリの隣に同梱する必要があります。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストを変更した後、`ai-i18n-tools sync`（または `extract` の後に `translate-ui`）を再実行します。キャッシュにより、新規または変更された文字列のみがモデルに送られます。翻訳がずれないように CI で実行します。`FlatDirectory` を `locales` フォルダーに向けて、アプリを再起動します。マニフェストが見つからず、アプリがまだ埋め込み JSON を読み込んでいる場合にのみ、リビルドが必要です。`ai-i18n-tools dashboard` は[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開いて翻訳を確認します。

コピーされた`I18n.cs`を更新するには、使い捨てディレクトリに同じテンプレートをスキャフォールドし、置換する生成ファイルのみをコピーします。ヘルパーをアップグレードするためにアプリで`init`を再実行しないでください。

同じ実行で`README.md`を翻訳するには、`--with-readme`でスキャフォールドします（または既存の設定にブロックを追加します）。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="do-it-by-hand"></a>
## 手動で実行する

変更を自分で加えたい場合、またはプロンプトが何をするのか知りたい場合は、これらの手順を実行してください。各ステップはプロンプトの一部に対応しています。最終的には、[CLIをインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#choose-models-and-translate)します。

1. [ヘルパーを配置し、カタログを埋め込む](#step-1-place-the-helper-and-embed-the-catalogs)。
2. `T()`、`Tn`、`Tp`、`N`、または`{loc:Tr '…'}`で[文字列をラップする](#step-2-wrap-strings)。
3. `migrate-dotnet-i18n`で[ラップされた呼び出しを確認する](#step-3-check-wrapped-calls)。
4. [言語切り替えを追加する](#step-4-add-a-language-switch)。

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## ステップ1: ヘルパーを配置し、カタログを埋め込む

`init`はこれらをリポジトリのルートに書き込みます。

| ファイル | 内容 | 編集するか？ |
| --- | --- | --- |
| `I18n.cs` | コードが呼び出すヘルパー（`T`、`Tn`、`Tp`、`SetLocale`） | いいえ。生成されます。`init`は上書きしません |
| `locales/strings.json` | 抽出キャッシュ。アプリはこれを読み込みません | いいえ。`extract`が書き込みます |
| `locales/<code>.json` | アプリがロードする翻訳。言語ごとに1ファイル | いいえ。`translate-ui`が書き込みます |
| `locales/ui-languages.json` | 言語メニュー。アプリは起動時に `code`、`label`、および `englishName` を読み込みます | いいえ。`extract` が書き込みます |

`I18n.cs`と`locales/`をアプリケーションプロジェクトに移動します。その`.csproj`に埋め込みを追加し、ファイルの残りの部分はそのままにします。

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

インクルードパスはプロジェクトファイルからの相対パスです。.NET Framework 4.8には`System.Text.Json`パッケージも必要です。.NET 6以降にはすでに含まれています。

設定を新しい場所に更新し、テストとビルド出力がカタログに含まれないように`sourceRoots`をアプリケーションプロジェクトに向けます。

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

`global using static MyApp.I18n;`を追加します（`I18n.cs`に表示される名前空間を使用してください）。または、各サイトで`I18n.T`を呼び出します。

ヘルパー内の `SourceLocale` は、設定内の `sourceLocale` と等しくなければなりません。`ai-i18n-tools-locales` マーカーの間にある `BuiltInLocales` は、`init` がスタンプしたリストです。それはメニューではありません。`targetLocales` を変更すると、`extract` が `ui-languages.json` を書き換え、アプリはそのファイルを読み込みます。新しいヘルパーが必要な場合は、使い捨てのディレクトリをスキャフォールドします。ここで `init` を再実行しないでください。

`ai-i18n-tools extract`で確認します。カタログは新しい`locales/`フォルダーに表示されるはずです。何かがラップされるまでは0個の文字列を想定してください。

<a id="step-2-wrap-strings"></a>
## ステップ2: 文字列をラップする

`extract`は、`T()`、`Tn`、`Tp`、`N`、または`{loc:Tr '…'}`に渡されるリテラルである場合にのみ文字列を記録します。`I18n.T`のようなレシーバーは、最後の名前が`T`であるため一致します。

まずカタログエントリを検索し、その結果を`string.Format`に渡します。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

これらは抽出されますが、その後拒否されます。なぜなら、カタログがプログラムが検索するものと一致しないからです:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract`は最初の3つに対して警告を出力し、`{name}`で停止します。[次のステップ](#step-3-check-wrapped-calls)で最初の3つを書き換えます。

プレースホルダーは.NET形式のままです: `{0}`、`{0,-10}`、`{0:C}`。`%`は通常のテキストなので、`10% off`のような翻訳はprintfトークンではありません。二重の中括弧（<code v-pre>{{</code>および`}}`）はリテラルの中括弧であり、変更せずにコピーする必要があります。その他の呼び出し形式: [翻訳される呼び出し](/ja/guide/ui-strings/dotnet#calls-that-translate)。

XAMLとAXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

プレフィックスは無視されます。`{Binding}`と`{StaticResource}`はそのまま残されます。要素コンテンツとして記述されたテキストは抽出されません。アポストロフィを含むリテラルは、属性が二重引用符のままでいられるように`&quot;`で記述されます。

Avalonia、WPF、および MAUI はそれぞれ独自の `MarkupExtension` 基底クラスを提供します。ヘルパーはそれらのアセンブリを参照しません。`ProvideValue` は `I18n.T(Text)` を返し、`LocaleChanged` でそのプロパティを再度設定し、コントロールがビジュアルツリーを離れると購読を解除します。1つの Avalonia の形状（`IProvideValueTarget` は `Avalonia.Metadata` にあります）：

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

WPF と MAUI は、独自のプロパティ型で同じことを行います。`ui.uiExtractor.exclude` に `**/TrExtension.cs` を追加します。`T(Text)` はリテラルではなく、XAML リテラルはすでに `Tr` を介して抽出されています。`{loc:Tr}` は `T` のみを呼び出すことができます。1つの短い単語の2つの意味は、`Tp` を使用してコードで設定されます。

フォーマットされた文は C# (`T("Cursor {0}", value)`) に残り、これによりエクストラクタは単一のリテラルに留まります。バインディング上の `StringFormat` は `extract` には見えません。同じ呼び出しは、ビューモデル、トレイツールチップ、およびダイアログから機能します。ビューモデルの文字列には、`LocaleChanged` から `PropertyChanged` を発生させます。

保存され表示される値は、保存された値をソース言語で保持します。列挙型コンボは列挙型を保持し、そのキャプションから`T("Light")`を返し、その後`LocaleChanged`で項目を再構築します。抽出ツールが認識するリテラルを静的フィールドが保持できるように、`N("Last 12 months")`が存在します。静的辞書内の`T()`は、最初の型ロード時に一度実行され、その言語に留まります。サービスは英語のエラー文を保存します。表示サイトは、既知の文を`T`を介してマッピングするため、後のロケール変更でそれらを翻訳できます。失敗時の`T()`はその文を固定します。

トレイ項目は`Tp("tray", "Open")`と安定した`CommandParameter`を使用します。ヘッダーではなく、パラメーターに一致させてください。Linuxの`.desktop`、`Name=`、および`Comment=`はソース言語のままです。比較される期間トークン（`2d`、`7h 47m`）は翻訳されません。テキストが表示される場所で`T("now")`と`T("in {0}", duration)`を翻訳してください。先頭または末尾にスペースがあるリテラル（`Updated: `）は、依然として抽出警告です。スペースをフォーマット文字列またはレイアウトに移動してください。`Tn`は、常に複数形であったソース文（`1 samples`）を変更する可能性があります。

これらはそのままにしておきます: ログ、JSONプロパティ名、ファイル名、`nameof`、属性引数、識別子として使用されるオブジェクトキー、およびプログラムが表示するのではなく照合する例外テキスト。

もう一度`ai-i18n-tools extract`を実行してください。カタログには、ラップした文がリストされているはずです。

<a id="step-3-check-wrapped-calls"></a>
## ステップ3: ラップされた呼び出しを確認する

呼び出しがカタログ検索の前に文字列をフォーマットする場合に、このステップを使用します。

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n`はそれらを、最初に発生するルックアップに書き換えます。2回目の実行では何も変更されません。

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

`--write`を渡すまでは、このコマンドはドライランです。`migrate-dotnet-i18n-report.md`を書き込みます。そのレポートを読んでください。編集が正しいように見える場合:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

ドライランを再度実行します。編集がリストされなくなったら停止し、その後プロジェクトのテストを実行します。そのまま残された行（`await`、生の補間された生文字列、条件付きの穴、`ref`または`out`、リテラルのない連結、`string.Format`に渡された`IFormatProvider`）は手動で修正されます。複数形のように見えるフレーズは`Tn`に属し、常に複数形であったソース文を修正する可能性があります。生成された`I18n.cs`はスキップされます。レポートを削除するか、git-ignoreしてください。

`--wrap`は、マークされていないXAMLの`Text`、`Header`、`Content`、およびその他のラベル属性を`{loc:Tr '…'}`としてマークし、さらに、名前が`Text`、`Title`、または`Message`で終わるC#の代入と`MessageBox.Show`もマークします。`--write`がない場合、それは監査です。ログ、属性、`nameof`、比較、または`Path`呼び出しは編集しません。

編集なしのレポートは、ラップされた呼び出しが安全であることを意味します。それは、すべてのユーザー向け文言がラップされたことを意味するものではありません。生のラベル、返された文字列、および要素のコンテンツは、それからは見えません。詳細: [安全でない呼び出しを書き換える](/ja/guide/ui-strings/dotnet#rewrite-unsafe-calls)。

<a id="step-4-add-a-language-switch"></a>
## ステップ4: 言語切り替えを追加する

最初の`T()`の前に、`locales/ui-languages.json`を見つけます。`AppContext.BaseDirectory`から上方向に、次に現在のディレクトリから、それぞれ最大8つのディレクトリを検索します。最初に見つかったファイルが優先されます。`code`、`label`、および`englishName`を`LocaleInfo`に解析します（`label`は`NativeName`です）。その配列を`Locales`として、また`FlatDirectory`をファイルが格納されていた`locales`ディレクトリに設定して、`Configure`を一度呼び出します。`Configure`は、呼び出しごとに`Strict`、`FlatDirectory`、および`OpenLocale`を置き換えます。`Locales`のみを設定する後の呼び出しは、`FlatDirectory`をクリアします。`Locales: null`は以前のリストを復元しません。

ファイルが見つからない場合、ソース言語用に1要素の`Locales`配列を渡し、`FlatDirectory`を設定しないでください。メニューはソース言語のみです。`BuiltInLocales`を表示しないでください。開発は、`sync`が書き込んだばかりのカタログを読み取ります。マニフェストが近くにない公開ビルドは、埋め込みカタログを保持します。`sync`に従うべきインストーラーは、`ui-languages.json`とロケールJSONをアプリの隣に同梱します。

ネイティブ名ではなく、ロケールコードを永続化します。`SetLocale`の前に両方のカルチャを設定してください。なぜなら、その呼び出し内で`LocaleChanged`が発火するからです。

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

コントロールに`T("Language")`のラベルを付けます。渡したリストからのコードのみを受け入れます。`LocaleChanged`で、ビューモデル文字列に対して`PropertyChanged`を発生させるか、テキストをコピーしたコントロールを再構築します。`TrExtension`は、[ステップ2](#step-2-wrap-strings)のように、開いているビューを更新します。フレームワークにフロー方向がある場合、`I18n.IsRightToLeft(code)`から設定します。

Avalonia: `e.Source`がハンドラーを所有するコントロールでない限り、`SelectionChanged`を無視します。そのハンドラー内、またはこのコンボの`SetLocale`が引き起こした`LocaleChanged`内で、`ItemsSource`または`SelectedItem`を割り当てないでください。`Dispatcher.UIThread.Post`で更新を投稿します。コードが`SelectedItem`を設定している間、ハンドラーを保護します。バブルされたイベントをタブ変更として扱い、再度`ItemsSource`を割り当てる親の`TabControl`は、プロセスをクラッシュさせます（終了コード139、空の`crash.log`）。

コンソールプログラムにはウィジェットがありません。`--lang <code>`を追加します（その名前が空いている場合は`-L`も）。上記でロードされたリストからのコードのみを受け入れます。`AI_I18N_LANG`を読み取らないでください。その変数はai-i18n-tools CLI専用です。

プログラムが人が読むテキストを表示しない場合は、このステップをスキップしてください。

カタログと現在のロケールは静的です。これはデスクトッププロセスでは安全です。これはマルチユーザーサーバーの要求ごとのロケールではありません。そこに `IStringLocalizer` または `ResourceManager` を保持し、[.NET ResourceManager アプリに i18n を追加する](/ja/guide/add-i18n-to-dotnet-resourcemanager) に従ってください。`CurrentUICulture` を設定しても、各リクエストに独自のマップが与えられるわけではありません。

これが最後の手動ステップです。[モデルを選択して翻訳する](#choose-models-and-translate)に進んでください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| 現在のコード | 参照 |
| --- | --- |
| `ResourceManager`、`.resx` サテライト、または ASP.NET `IStringLocalizer` | [.NET ResourceManager アプリに i18n を追加する](/ja/guide/add-i18n-to-dotnet-resourcemanager) |
| ソース言語の文で既に `T("…")` | [UI 文字列](/ja/guide/ui-strings/) の手順 2～3、および [.NET アプリケーション](/ja/guide/ui-strings/dotnet) |
| JS/TS アプリ | [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) |
| Pythonアプリ | [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| Django、Flask-Babel カタログ、または GNU gettext | [Django / Python gettext アプリに i18n を追加する](/ja/guide/add-i18n-to-django-gettext) |
| ウェブサイトまたはドキュメントサイト | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website) |
| リポジトリのREADMEまたはその他のMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 例

| 例 | 表示内容 |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `I18n.cs`のxUnitチェック: 埋め込みJSON、カルチャフォールバック、`{0}`、複数形、および`Configure` |

これらのディレクトリはヘルパーをチェックします。これらは翻訳するアプリではなく、APIキーも必要ありません。そのディレクトリ内の`dotnet test`がチェックを実行します。実際のアプリは、このページの`init`から始まります。`npx degit`でコピーするか、GitHubリリースから`ai-i18n-tools-dotnet-examples.zip`をダウンロードしてください。そのzipファイルには、プロジェクトがコンパイルする`assets/dotnet`も含まれています。コマンド：[例](/ja/examples#net-examples)。
