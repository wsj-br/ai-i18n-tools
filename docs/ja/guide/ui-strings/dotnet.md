<a id="dotnet-applications"></a>
# .NET アプリケーション

`ai-i18n-tools` は C#、Razor、cshtml、XAML、および AXAML から UI 文字列を抽出し、ソース言語の文字列をキーとするフラットな JSON を書き込みます。`sourceLocale` は任意の言語にすることができます。ランタイムヘルパーは `I18n.cs` (.NET 6 以降、NuGet パッケージなし) です。Avalonia、WPF、MAUI、WinForms、ASP.NET、Blazor、およびコンソールアプリはそのヘルパーを呼び出します。.NET Framework 4.8 は、ファイルがコンパイルされる前に `System.Text.Json` パッケージを必要とします。

既存の単一言語アプリにロケールを追加する: [.NET アプリに i18n を追加する](/ja/guide/add-i18n-to-dotnet)。

<a id="scaffold"></a>
## スキャフォールド

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` は `ai-i18n-tools.config.json` を書き込み、`I18n.cs` がない場合、[assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) をプロジェクトにコピーします。`--namespace` は C# の名前空間を設定します。それが省略され、ディレクトリに `.csproj` が 1 つ含まれている場合、`init` はそのファイルの `RootNamespace`、またはプロジェクトファイル名を使用します。それ以外の場合、名前空間は `AiI18n` です。

`init` はプロジェクトファイルを編集しません。ロケール JSON をアセンブリに追加します:

```xml
<EmbeddedResource Include="locales/*.json" />
```

スキャンは、`bin`、`obj`、`.vs`、`TestResults`、および`packages`という名前のディレクトリをスキップします。テンプレートはまた、`uiExtractor.exclude`を`**/bin/**`、`**/obj/**`、`**/Tests/**`、`**/*.Tests/**`、および`**/TrExtension.cs`に設定します。

<a id="calls-that-translate"></a>
## 翻訳用の呼び出し

まずカタログエントリを検索し、その結果を `string.Format` に渡します。デフォルトの名前は `T`、`Tn`、`Tp`、`N`、`Tr`、および `Loc` です。`I18n.T` のようなレシーバーは、最後の名前が `T` なので一致します。

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` はその引数を返し、静的フィールド、列挙型ラベル、または属性がエクストラクターが認識できるリテラルを保持できるように、そこにのみ存在します。後で `T(label)` を使って表示します。

`Tn` は `{0}` をカウントとして扱います。その後に（`{1}`、`{2}`）のような追加の引数が続きます。単数形ではそのカウントをリテラル（`1 sample`）として記述できますが、複数形では`{0}`を保持します。翻訳では、複数形のカテゴリには`{0}`を保持し、単数形にはリテラル数を残します。

`Tp` はコンテキストとソース文字列を 1 つのキー (context, U+0004, source) の下に格納します。これはフラット JSON がすでに使用しているのと同じ区切り文字です。同じ短い単語が異なる意味を持つ場合 (ウィンドウを `Open` し、ファイルを `Open` するなど) に使用します。

XAML および AXAML は、型名が `funcNames` にあるマークアップ拡張機能を使用します。プレフィックスは無視されます:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`、`{DynamicResource}`、`{StaticResource}`、`{TemplateBinding}`、および `{x:Static}` は抽出されません。要素コンテンツとして記述されたテキスト (`<TextBlock>Hello</TextBlock>`) は抽出されません。アポストロフィを含むリテラルは、引数を `&quot;` にして記述されます。これにより XML 属性を二重引用符のままにできます: `Content="{loc:Tr &quot;Don't&quot;}"`。

これらは抽出されますが、その後拒否されます。なぜなら、カタログがプログラムが検索するものと一致しないからです:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

リテラルを渡し、`{name}` ではなく `{0}` を使用します。`string.Format` は名前付き項目で例外をスローします。`extract` は最初の 3 つに対して警告を出力し、`{name}` で停止します。

先頭または末尾に空白があるリテラルもカタログ化されます。`I18n.T` はキーをトリムし、検索し、その空白を結果に戻します。翻訳者が区切り文字を認識できるように `T("Updated: {0}", value)` を推奨します。

<a id="placeholders"></a>
## プレースホルダー

`ui-dotnet` は `uiExtractor.placeholderStyle` を `dotnet` に設定します。そのスタイルは `{0}`、`{0,-10}`、`{0:C}`、および `{0,-10:C}` を保持します。`%` は通常のテキストであるため、`10% e 20%` のような翻訳は printf トークンとして扱われません。二重の中括弧 (<code v-pre>{{</code> および `}}`) はリテラルの中括弧であり、変更せずにコピーする必要があります。`{name}` は抽出時のエラーです。

JavaScript および Python で使用されるデフォルトのスタイルは変更されません。

<a id="runtime"></a>
## ランタイム

`I18n.SetLocale("pt-BR")` はカタログが開かれるまで `CultureInfo.Parent` を辿ります。`OpenLocale` は設定されている場合に使用されます。それ以外の場合、構成された `FlatDirectory` が唯一のソースとなります。そこにあるファイルが見つからない場合でも、埋め込みJSONにはフォールバックしません。埋め込みリソースは、`OpenLocale` も `FlatDirectory` も設定されていない場合にのみ使用されます。キーが見つからない場合はソース文字列を返します。`I18n.Strict = true` は代わりにスローし、これはテストで役立ちます。`string.Format` は翻訳されたテンプレートで呼び出されます。無効な形式は `FormatException` をスローする可能性があります。省略された `{0}` は引数を省略できます。フォーマットエラーの後、ソーステンプレートへのフォールバックはありません。

`I18n.SupportedLocales` は、初期化時にスタンプされたリスト（`BuiltInLocales`: ネイティブ名と英語名）として開始します。言語メニューはそのスタンプを読み込みません。最初の`T()`の前に、`AppContext.BaseDirectory`から、次に現在のディレクトリから、それぞれ最大8つのディレクトリを上方向に`locales/ui-languages.json`を検索します。最初に見つかったファイルが優先されます。`code`、`label`、および`englishName`を`LocaleInfo`（`label`はネイティブ名）にマッピングし、それらを`Configure`に`Locales`として渡します。その際、同じ呼び出しで`FlatDirectory`をその`locales`ディレクトリに設定します。`Configure`の呼び出しごとに、`Strict`、`FlatDirectory`、および`OpenLocale`が置き換えられます。後続の呼び出しで`Locales`のみを設定した場合、`FlatDirectory`はクリアされます。nullの`Locales`配列は、現在のリストをそのままにし、`BuiltInLocales`を復元しません。マニフェストが見つからない場合、ソース言語の1要素リストを渡し、`FlatDirectory`を設定しません。その場合、メニューはソース言語のみとなり、カタログは埋め込まれたままになります。開発は、`sync`が書き込んだばかりのファイルを読み込みます。`sync`に従うべきインストーラーは、`ui-languages.json`とロケールJSONをアプリの隣に同梱します。

`I18n.IsRightToLeft` は `CultureInfo.TextInfo` を読み込みます。アプリは `CultureInfo.CurrentUICulture` と `CultureInfo.CurrentCulture` を自身で設定し、ロケールコードを永続化します。`string.Format` は現在のUIカルチャを使用するため、`{0:C}` はそのカルチャに従います。

`LocaleChanged` は `SetLocale` の内部で発生します。リフレッシュハンドラーが新しいカルチャでフォーマットするように、最初に`CurrentUICulture`と`CurrentCulture`を設定します。`T`を呼び出すビューモデルプロパティは、そのイベントから`PropertyChanged`を発生させる必要があります。Avalonia、WPF、およびMAUIの場合、マークアップ拡張は`I18n.T(Text)`を返し、そのプロパティを`LocaleChanged`で再度設定し、コントロールがビジュアルツリーを離れるときに購読を解除します。カタログと現在のロケールは静的です。これはデスクトッププロセスでは安全です。これはマルチユーザーサーバーの要求ごとのロケールではありません。そこに`IStringLocalizer`または`ResourceManager`を保持してください。`CurrentUICulture`を設定しても、各要求に独自のマップが与えられるわけではありません。

コピーされたヘルパーをリフレッシュするには、一時的なディレクトリに同じテンプレートをスキャフォールドし、置換する予定の生成されたファイルのみをコピーします。ヘルパーをアップグレードするために、アプリで `init` を再実行しないでください。

ファイルは `ai-i18n-tools-i18n-cs:` で始まるため、`extract` はそれをスキップします。

<a id="desktop-recipe"></a>
## デスクトップレシピ

Avalonia、WPF、およびMAUIはそれぞれ独自のマークアップ拡張基底クラスを持っています。ヘルパーはそれらのアセンブリを参照しません。`ProvideValue` は `I18n.T(Text)` を返し、そのプロパティを`LocaleChanged`で再度設定します。コントロールがビジュアルツリーを離れるときに購読を解除します。`**/TrExtension.cs`を`ui.uiExtractor.exclude`に追加して、`T(Text)`が非リテラルとして報告されないようにします。XAMLリテラルは`Tr`を通じて既に抽出されています。`{loc:Tr}` は `T` のみを呼び出すことができます。1つの短い単語の2つの意味は、`Tp`を使用してコードで設定されます。

1つのAvaloniaの形式（`IProvideValueTarget` は `Avalonia.Metadata` にあります）:

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

WPFとMAUIは、独自のプロパティ型で同じ考え方を使用します。Avaloniaのみ: `e.Source`がハンドラーを所有するコントロールでない限り、`SelectionChanged`を無視します。そのハンドラー内、またはこのコンボの`SetLocale`が発生させた`LocaleChanged`内で、`ItemsSource`または`SelectedItem`を割り当てないでください。`Dispatcher.UIThread.Post`でリフレッシュをポストし、コードが`SelectedItem`を設定している間はハンドラーを保護します。バブルされたイベントから`ItemsSource`を再度割り当てる親`TabControl`は、プロセスをクラッシュさせます（終了コード139、空の`crash.log`）。

フォーマットされた文はC#（`T("Cursor {0}", value)`）に残され、これにより抽出器は単一のリテラルに留まります。バインディング上の`StringFormat`は非表示です。同じ呼び出しが、ビューモデル、トレイツールチップ、およびダイアログから機能します。列挙型コンボは列挙型を保持し、そのキャプションから`T("Light")`を返し、`LocaleChanged`で項目を再構築します。トレイ項目は`Tp("tray", "Open")`と安定した`CommandParameter`を使用します。ヘッダーではなく、パラメーターを一致させます。サービスは英語のエラー文を保存し、表示サイトは既知の文を`T`を通じてマッピングします。Linuxの`.desktop`、`Name=`、および`Comment=`はソース言語のままです。比較される期間トークン（`2d`、`7h 47m`）は翻訳されません。`T("now")`と`T("in {0}", duration)`は表示サイトで翻訳します。リテラルの先頭または末尾のスペースは、依然として抽出警告です。それをフォーマット文字列またはレイアウトに移動してください。`Tn` は、常に複数形であったソース文（`1 samples`）を修正する場合があります。

<a id="migrate"></a>
## 安全でない呼び出しを書き換える

`migrate-dotnet-i18n` は `--write` を渡すまではドライランです。これは、検索前に構築される `T`、`Tn`、および `Tp` の引数を書き換えます。

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`T("Saved to {0}", path)`、`T("Last synced {0}", date)`、および `T("Hello {0}", name)` になります。繰り返される単純な名前は1つの引数に留まります。`(int)status` のようなキャストは独自のインデックスを保持します。レポート `migrate-dotnet-i18n-report.md` は、残されたものをすべてリストします: `await`、生の `$$"""` 文字列、`? :` ホール、`ref` または `out`、リテラルのない連結、`string.Format` に渡される `IFormatProvider`、および複数形のように見えるフレーズ（`{0} samples` は `Tn` であるべきです）。

`--wrap` は、未マークの XAML `Text`、`Header`、`Content`、およびその他のラベル属性を `{loc:Tr '...'}` としてマークし、名前が `Text`、`Title`、`Message`、およびその他の高信頼度サフィックスで終わる C# の代入、さらに `MessageBox.Show` と `ConfirmDialog.Show` もマークします。`--write` がなければ、それは監査です。ログ、属性、`nameof`、比較、または `Path` の呼び出しは編集しません。2回目の実行では何も変更されません。

`extract` がニュートラルな `.resx` を取り込むと、同じレポートに「名前付きリソースキー」セクションが追加されます。`Resources.LoginButton` のような行は `T("Sign in")` としてリストされます。これらの行は提案です。コマンドはそれらを編集しません。
