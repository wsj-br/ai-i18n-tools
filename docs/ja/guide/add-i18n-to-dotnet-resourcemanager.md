<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# .NET ResourceManager アプリに i18n を追加する

このページは、`ResourceManager` または ASP.NET `IStringLocalizer` を使用して既に文字列を読み込んでいる、または今後読み込む予定の .NET アプリケーション向けです。そのローダーはそのまま使用します。ai-i18n-tools は `T("…")` と `{loc:Tr '…'}` を読み込み、メッセージを翻訳し、それらのソース文字列をキーとする `.resx` サテライトを書き込みます。ヘルパーは `I18nResx.cs` で、`init -t ui-dotnet-resx` によってコピーされます。

最も手っ取り早い方法は、このページのプロンプトをコーディングエージェントに与えることです。それは構成をリソースに向け、文字列をラップし、結果を確認し、言語切り替えを追加できます。CLI をインストールし、プロバイダーを選択し、プロジェクトを自分で初期化します。これは、API キーと選択が必要なためです。また、翻訳も自分で実行します。これは、アカウントにお金がかかり、`.resx` ファイルが書き換えられるためです。

リソースファイルがまだない新しい Avalonia、WPF、MAUI、WinForms、またはコンソールアプリは、[Add i18n to a .NET app](/ja/guide/add-i18n-to-dotnet) を使用します。そのパスは `I18n.cs` と埋め込み JSON を追加します。どちらが適用されるか不明ですか？最後に [Not your case?](#not-your-case) を参照してください。

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

これはプロンプトの前に一度実行します。これによって構成と `I18nResx.cs` が書き込まれ、上記で選択したプロバイダーが使用されます。

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

プロジェクトの名前空間が `init` が `I18nResx.cs` に出力するものと異なる場合は、`--namespace` を渡します。ディレクトリに `.csproj` が 1 つあり、`--namespace` がない場合、`init` はそのファイルの `RootNamespace` またはプロジェクトファイル名を使用します。それ以外の場合、名前空間は `AiI18n` です。

テンプレートは`ui.flatOutput`をfalseに、`ui.resx`を次のように設定します。

| フィールド | デフォルト |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true。そのため、`SharedResource.resx`にはソーステキストが保持されます。 |
| `localeFormat` | `bcp47`。そのため、ドイツ語ファイルは`SharedResource.de.resx`、ブラジルポルトガル語は`SharedResource.pt-BR.resx`です。 |
| `ingestExistingResx` | true |

そのファイルがない場合、`init` は `I18nResx.cs` を書き込みます。`ResourceBaseName` は、名前空間、出力フォルダー、およびドットで結合されたベース名です (`MyApp.Resources.SharedResource`)。ファイルがそのフォルダーにある場合、SDK はそのマニフェスト名で resx を埋め込みます。ファイルを移動する場合は、`ResourceBaseName` を一致するように変更します。`init` は `.csproj` を編集しません。サテライトアセンブリはビルド時に `*.{culture}.resx` から生成されます。これらのサテライトをアプリの隣にデプロイします。

`init` を一度実行します。これは毎回 `ai-i18n-tools.config.json` を書き換えるため、2回目の実行では行った編集が失われます。`I18nResx.cs` に既にマーカー `ai-i18n-tools-i18n-cs` が含まれている場合、プロジェクトは既に初期化されています。この手順はスキップしてください。`init` は既存のヘルパーを上書きしません。

次に、`sourceLocale` と `targetLocales` を編集します。`sourceLocale` はソース内の文字列の言語です。任意の BCP-47 言語が有効です。スキャフォールドは `en` を使用します。`ui.resx` を、アプリが既に読み込んでいるフォルダーとベース名に向けます (手動で、つまり [ステップ 1](#step-1-point-the-config-at-your-resources) です)。`neutralFile` は、`LoginButton` のようなレガシー名をそのソーステキストにマッピングするニュートラルな resx です。省略された場合、そのファイルが存在すれば `{outputDir}/{baseName}.resx` が使用されます。

同じ `ui` ブロックはフラット JSON も書き込むことができます。`flatOutput` を true に戻します。両方の出力は1つのカタログを共有します。このテンプレートは `flatOutput` を false のままにするため、`.resx` のみが書き込まれます。

呼び出しの形式と JSON ヘルパー: [.NET アプリケーション](/ja/guide/ui-strings/dotnet)。その他のすべての構成キー: [構成](/ja/reference/configuration)。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント（Cursor、Claude Code、Copilotなど）でプロジェクトを開き、新しいチャットを開始し、以下のプロンプトを貼り付けます。プロジェクトはすでに初期化されている必要があります。編集するものは何もありません。例えば言語切り替えを不要にするなど、何か除外したい場合は、同じメッセージでその旨を伝えてください。

エージェントはまず、CLI、構成、および `I18nResx.cs` が存在することを確認し、いずれかが欠落している場合は指示を出して停止します。その後、3つの部分で動作します。

- パート1では、`ui.resx` をアプリが既に読み込んでいるカタログに向け、`ResourceBaseName` をチェックします。
- パート2では、ユーザー向け文字列を `T()` と `{loc:Tr '…'}` でラップし、名前付きキーの提案を手動で適用します。
- パート3では、`ResourceManager` または `IStringLocalizer` に留まる言語切り替えを追加します。

これは何もインストールまたは初期化せず、API キーを読み取ったり、翻訳したりしません。`.resx` ファイルを書き換えません。翻訳はレビュー後のステップであり、あなたが実行します。

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
## 結果をレビューする

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。ラップされた呼び出し、構成、ファイルが移動した場合は `ResourceBaseName`、および言語切り替えが変更されているはずです。翻訳するまで、`.resx` ファイルは変更されないはずです。
- `ai-i18n-tools.config.json`: `resx.outputDir` と `baseName` はアプリが読み込むカタログを指し、`sourceRoots` はアプリケーションプロジェクトをカバーします。
- `ResourceBaseName` は SDK が埋め込むマニフェスト名と一致します。
- `ai-i18n-tools extract` は新しいメッセージをリストし、既にサテライトにある翻訳を保持します。
- `migrate-dotnet-i18n`のドライランでは、延期することを選択した名前付きキーの提案を除いて、修正すべきものは何も残っていません。それらの行は、編集するまで`Resources.LoginButton`のままです。
- テストはパスし、アプリはソース言語で同じように見えます。
- 使い捨てのスクリプトや`migrate-dotnet-i18n-report.md`は残されていませんでした。

この状態をコミットしてください。`translate-ui`は`.resx`ファイルを書き換えるため、レビューのためにクリーンな差分が必要になります。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はあなたが実行します。これはあなたのAPIキーを使用し、あなたのアカウントで費用が発生し、`.resx`ファイルを書き換えるため、まずコミットしてください。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` は `translationModels` のみを置換します。ブレンド価格が制限を超えるモデルを除外するには、`--max-price` を使用します。GUI をお好みの場合は、`ai-i18n-tools dashboard` を使用して [モデル](/ja/guide/translation-dashboard/models) を選択します。

最初の`translate-ui`の前に用語集を埋めてください。`init`は`glossary.userGlossary`を`glossary-user.csv`にポイントし、ファイルは作成しません。ファイルが見つからない場合は、`ai-i18n-tools glossary-generate`を実行してから、ドメイン用語を追加してください。変更せずにコピーする必要がある名前には、**Force**を使用してください。

その後、抽出して翻訳します。

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui`は、ニュートラルファイルとターゲット言語ごとに1つのサテライトを書き込みます。キーはソース文字列です。`<comment>`はコンテキストと最初のソースロケーションを記録します。サテライトでの手動編集は、次の翻訳の前に`extract`がそれを取り込む場合にのみ保持されます。これは`.po`ファイルと同じ契約です。次の実行で再生成されるため、生成されたファイルは今後編集しないでください。コミットする前に最初の差分を確認してください。

`type`または`mimetype`（画像やその他のバイナリ）を持つエントリはスキップされます。そのカルチャにエントリがない場合、`ResourceManager.GetString`はニュートラル値を返します。

SDKが新しいサテライトを埋め込むようにリビルドし、その後、アプリを再起動してください。

<a id="check-one-language"></a>
### 1つの言語を確認する

ターゲット言語のいずれかに切り替えて、いくつかのラップされた文字列を含む画面を開きます。ソース言語のままのテキストは、ラップされていないか、適用されていない名前付きキーをまだ使用しているか、またはサテライトがリビルドされていませんでした。`{0}`を削除したり名前を変更したりする翻訳は、`FormatException`をスローしたり、値を省略したりする可能性があります。`string.Format`はソーステンプレートにフォールバックしません。コードを疑う前に、その文のサテライトを確認してください。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストを変更した後、`ai-i18n-tools sync`（または`extract`の後に`translate-ui`）を再実行してください。キャッシュにより、新規または変更された文字列のみがモデルに送られます。翻訳がずれないようにCIで実行してください。翻訳実行後にリビルドして、サテライトが再度埋め込まれるようにしてください。`ai-i18n-tools dashboard`は、翻訳を確認するために[Translation Dashboard](/ja/guide/translation-dashboard/)を開きます。

`purge-locale`は`SharedResource.<culture>.resx`を削除し、`SharedResource.resx`を残します。

コピーされた`I18nResx.cs`を更新するには、使い捨てのディレクトリに同じテンプレートをスキャフォールドし、置き換える予定の生成されたファイルのみをコピーしてください。ヘルパーをアップグレードするために、アプリで`init`を再実行しないでください。

同じ実行で`README.md`を翻訳するには、`--with-readme`でスキャフォールドします（または既存の設定にブロックを追加します）。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="do-it-by-hand"></a>
## 手動で実行する

変更を自分で加えたい場合、またはプロンプトが何をするのか知りたい場合は、これらの手順を実行してください。各ステップはプロンプトの一部に対応しています。最終的には、[CLIをインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#choose-models-and-translate)します。

1. [設定をリソースにポイントする](#step-1-point-the-config-at-your-resources)。
2. `T()`または`{loc:Tr '…'}`で[文字列をラップする](#step-2-wrap-strings)。
3. [名前付きリソースキーを適用する](#step-3-apply-named-resource-keys)。
4. [実行時に言語を切り替える](#step-4-switch-language-at-runtime)。

<a id="step-1-point-the-config-at-your-resources"></a>
## ステップ1: 設定をリソースにポイントする

テンプレートはこの形式を書き込みます。フォルダとベース名を、アプリが既にロードしているカタログに変更してください。

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

プロジェクトに対して4つのことを確認してください。

- `outputDir`と`baseName`は、ニュートラルファイルとサテライトが既に存在する場所です。ドイツ語は`SharedResource.de.resx`です。`localeFormat`が`bcp47`の場合、ブラジルポルトガル語は`SharedResource.pt-BR.resx`です。
- そのニュートラルファイルが`{outputDir}/{baseName}.resx`ではない場合、`neutralFile`が設定されます。取り込みは、レガシー名（`LoginButton`）をニュートラル値（`Sign in`）を介してマッピングします。ドイツ語の`LoginButton`値は、ソース文字列`Sign in`の下に保存されます。
- `I18nResx.cs`内の`ResourceBaseName`は、名前空間、出力フォルダ、およびドットで結合されたベース名です。ファイルが移動したら、定数を移動してください。ヘルパーの残りの部分はそのままにしてください。
- `sourceRoots`はアプリケーションプロジェクトであり、`"."`ではありません。

プレーン文字列のresx名はソーステキストです。`Sign in`、`Saved to {0}`、引用符またはアンパサンドを含む値。コンテキストは、コンテキストとソースの間にU+2404を使用します。resxには複数形がありません。各CLDR形式は、`{singular}[{form}]`という名前の独自のエントリです。`Tn`は、`.po`ライターと同じルールで形式を選択します。区切り文字や複数形接尾辞は入力しません。

`ai-i18n-tools extract`で確認してください。カタログには、ニュートラルファイルから取り込まれた文字列がリストされているはずです。

<a id="step-2-wrap-strings"></a>
## ステップ2: 文字列をラップする

`extract`は、`T()`、`Tn`、`Tp`、`N`、または`{loc:Tr '…'}`に渡されるリテラルである場合にのみ文字列を記録します。[JSONヘルパー](/ja/guide/add-i18n-to-dotnet#step-2-wrap-strings)と同じ形式が適用されます。プレースホルダーは`{0}`であり、`{name}`ではありません。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` は、渡された名前を検索し、リソースが見つからない場合はその名前を返します。デフォルトのエクストラクター名は `T`、`Tn`、`Tp`、`N`、`Tr`、および `Loc` です。`_localizer["Sign in"]` のような呼び出しは、`ui.uiExtractor.funcNames` に `_localizer` が追加されるまで表示されません。`T("Sign in")` または `I18nResx.T("Sign in")` を呼び出すのに、追加の名前は必要ありません。

XAML は `{loc:Tr '…'}` を使用します。要素のコンテンツは抽出されません。`{Binding}` と `{StaticResource}` はそのままにしてください。

ログ、JSON キー、ファイル名、`nameof`、および表示されない例外テキストはそのままにしてください。保存された値はソース言語のままです。コントロールのキャプションを翻訳してください。

安全でない呼び出し (`T($"…")`、連結、`T` 内の `string.Format`) は、`Resources.LoginButton` のようなレガシー名とともに、次のステップのレポートに含まれます。

<a id="step-3-apply-named-resource-keys"></a>
## ステップ 3: 名前付きリソースキーを適用する

`--write` を渡すまで、`migrate-dotnet-i18n` はドライランです。これは、検索前に構築された `T` の引数を書き換えます。これは、[ラップされた呼び出しの確認](/ja/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls) と同じ編集です。

`extract` がニュートラルな `.resx` を取り込むと、レポートには名前付きキーセクションも追加されます。

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

そのリストはあなたが適用するためのものです。コマンドはそれらの行を編集しません。`--write` も編集しません。`T("Sign in")` への呼び出しを変更した後、`extract` を再度実行してください。

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

`migrate-dotnet-i18n-report.md` を読みます。安全でない呼び出しの編集が正しいように見える場合：

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

ドライランを再度実行します。安全でない呼び出しの編集がリストされなくなったら停止します。まだ適用していない名前付きキーは提案リストに残ります。レポートを削除するか、git-ignore してください。このステップでは `.resx` ファイルを編集しないでください。

<a id="step-4-switch-language-at-runtime"></a>
## ステップ 4: 実行時に言語を切り替える

`T` は `CultureInfo.CurrentUICulture` を読み取ります。`I18nResx.SetLocale` はそのカルチャと `CurrentCulture` を設定し、`LocaleChanged` を発生させます。`Tn` のために格納するロケールは静的であるため、同時リクエストを処理するサーバーは `SetLocale` をユーザーごとの切り替えとして使用すべきではありません。

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` はリクエストローカルです。ツールが書き込む resx を指すようにしてください。空のクラスは型引数のみです。マニフェストのベース名は `ResourceBaseName` と一致する必要があります。

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

Razor ページまたはサービスで、`extract` がリテラルを見るように `T` を呼び出します。呼び出しサイトがすでに使用している場合は、既存の `IStringLocalizer<SharedResource>` を保持します。検索がインデクサーに残る場合は、そのレシーバーの名前を `ui.uiExtractor.funcNames` に追加します。

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` には複数形またはコンテキストパラメーターがありません。拡張機能は `I18nResx` を呼び出すことができ、これは同じサテライトを読み取ります。それを ASP.NET プロジェクトに配置してください。`I18nResx.cs` は `Microsoft.Extensions.Localization` を参照しないため、コンソールまたはデスクトッププロジェクトはそのパッケージを取り込みません。

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

リクエストカルチャを次の順序で選択します: 訪問者の明示的な選択 (`?lang=` またはフォーム投稿)、それを記憶するクッキー、`Accept-Language` ヘッダー、そしてソースロケール。`sourceLocale` または `targetLocales` にないコードは無視します。`pt-BR` はサテライト名です。`pt-br` を送信するヘッダーは、`CurrentUICulture` を割り当てる前にその名前に一致させる必要があります。

<a id="desktop-and-console"></a>
### デスクトップとコンソール

ウィンドウが構築される前に保存されたカルチャを復元し、`I18nResx.SetLocale` を呼び出し、`LocaleChanged` から表示テキストを更新します。`sourceLocale` と `targetLocales` からメニューを構築します。それを `T("Language")` とラベル付けします。フローの方向は `CultureInfo.TextInfo.IsRightToLeft` から来ます。このヘルパーには `SupportedLocales` リストはありません。

コンソールプログラムにはウィジェットがありません。`--lang <code>` (およびその名前が空いている場合は `-L`) を追加し、最初の `T` の前に `SetLocale` を呼び出します。`AI_I18N_LANG` は読み取らないでください。

プログラムが人が読むテキストを表示しない場合は、このステップをスキップしてください。

これが最後の手動ステップです。[モデルを選択して翻訳する](#choose-models-and-translate)に進んでください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| 現在のコード | 参照 |
| --- | --- |
| まだ `.resx` も `IStringLocalizer` もない場合 | [.NET アプリに i18n を追加する](/ja/guide/add-i18n-to-dotnet) |
| ソース言語の文で既に `T("…")` | [UI 文字列](/ja/guide/ui-strings/) の手順 2～3、および [.NET アプリケーション](/ja/guide/ui-strings/dotnet) |
| JS/TS アプリ | [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) |
| Pythonアプリ | [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| Django、Flask-Babel カタログ、または GNU gettext | [Django / Python gettext アプリに i18n を追加する](/ja/guide/add-i18n-to-django-gettext) |
| ウェブサイトまたはドキュメントサイト | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website) |
| リポジトリのREADMEまたはその他のMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 例

| 例 | 内容 |
| --- | --- |
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | `I18nResx.cs`のxUnitチェック: ソース文字列キー、引用符、コンテキスト、複数形、実際のサテライト |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `ResourceManager`上にないアプリ用のJSONヘルパー |

これらのディレクトリはヘルパーをチェックします。これらは翻訳対象のアプリではなく、APIキーも不要です。`dotnet-resx` 内の `dotnet test` がサテライトチェックを実行します。実際のアプリは、このページの `init` から始まります。`npx degit` を使ってコピーするか、GitHubリリースから `ai-i18n-tools-dotnet-examples.zip` をダウンロードしてください。そのzipファイルには、プロジェクトがコンパイルする `assets/dotnet` も含まれています。コマンド: [例](/ja/examples#net-examples)。
