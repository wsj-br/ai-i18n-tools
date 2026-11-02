<a id="dotnet-applications"></a>
# .NET applications

`ai-i18n-tools` extracts UI strings from C#, Razor, cshtml, XAML, and AXAML, then writes flat JSON keyed by the source-language string. `sourceLocale` can be any language. The runtime helper is `I18n.cs` (.NET 6 or newer, no NuGet packages). Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor, and console apps call that helper. .NET Framework 4.8 needs the `System.Text.Json` package before the file will compile.

Adding locales to an existing single-language app: [Add i18n to a .NET app](/guide/add-i18n-to-dotnet).

<a id="scaffold"></a>
## Scaffold

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` writes `ai-i18n-tools.config.json` and, when `I18n.cs` is missing, copies [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) into the project. `--namespace` sets the C# namespace. When it is omitted and the directory contains one `.csproj`, `init` uses that file's `RootNamespace`, or the project file name. Otherwise the namespace is `AiI18n`.

`init` does not edit the project file. Add the locale JSON to the assembly:

```xml
<EmbeddedResource Include="locales/*.json" />
```

The scan skips directories named `bin`, `obj`, `.vs`, `TestResults`, and `packages`. The template also sets `uiExtractor.exclude` to `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**`, and `**/TrExtension.cs`.

<a id="calls-that-translate"></a>
## Calls that translate

Look up the catalog entry first, then pass the result to `string.Format`. The default names are `T`, `Tn`, `Tp`, `N`, `Tr`, and `Loc`. A receiver such as `I18n.T` matches because the last name is `T`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` returns its argument and is only there so a static field, enum label, or attribute can hold a literal the extractor can see. Show it later with `T(label)`.

`Tn` treats `{0}` as the count. Extra arguments follow it (`{1}`, `{2}`). The singular can write that count as a literal (`1 sample`) while the plural keeps `{0}`. Translation keeps `{0}` on the plural categories and leaves the literal number on the singular.

`Tp` stores the context and the source string under one key (context, U+0004, source), the same separator flat JSON already uses. Use it when the same short word means different things (`Open` the window and `Open` the file).

XAML and AXAML use a markup extension whose type name is in `funcNames`. The prefix is ignored:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}`, and `{x:Static}` are not extracted. Text written as element content (`<TextBlock>Hello</TextBlock>`) is not extracted. A literal that contains an apostrophe is written with the argument in `&quot;` so the XML attribute can stay in double quotes: `Content="{loc:Tr &quot;Don't&quot;}"`.

These are extracted and then rejected, because the catalog would not match what the program looks up:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

Pass a literal, and use `{0}` rather than `{name}`. `string.Format` throws on a named item. `extract` prints a warning for the first three and stops on `{name}`.

A literal with leading or trailing whitespace is still catalogued. `I18n.T` trims the key, looks it up, and puts that whitespace back on the result. Prefer `T("Updated: {0}", value)` so translators see the separator.

<a id="placeholders"></a>
## Placeholders

`ui-dotnet` sets `uiExtractor.placeholderStyle` to `dotnet`. That style keeps `{0}`, `{0,-10}`, `{0:C}`, and `{0,-10:C}`. `%` is ordinary text, so a translation such as `10% e 20%` is not treated as a printf token. Doubled braces (<code v-pre>{{</code> and `}}`) are literal braces and must be copied unchanged. `{name}` is an error at extract time.

The default style, used by JavaScript and Python, is unchanged.

<a id="runtime"></a>
## Runtime

`I18n.SetLocale("pt-BR")` walks `CultureInfo.Parent` until a catalog opens. `OpenLocale` is used when it is set. Otherwise a configured `FlatDirectory` is the only source: a missing file there does not fall through to embedded JSON. Embedded resources are used only when neither `OpenLocale` nor `FlatDirectory` is set. A missing key returns the source string. `I18n.Strict = true` throws instead, which is useful in tests. `string.Format` is called on the translated template. An invalid format can throw `FormatException`. A dropped `{0}` can omit the argument. There is no fallback to the source template after a format error.

`I18n.SupportedLocales` starts as the list stamped at init (`BuiltInLocales`: native name and English name). The language menu does not read that stamp. Before the first `T()`, search upward from `AppContext.BaseDirectory`, then from the current directory, at most 8 directories each, for `locales/ui-languages.json`. The first file wins. Map `code`, `label`, and `englishName` to `LocaleInfo` (`label` is the native name) and pass them to `Configure` as `Locales`, with `FlatDirectory` set to that `locales` directory in the same call. Every `Configure` call replaces `Strict`, `FlatDirectory`, and `OpenLocale`. A later call that only sets `Locales` clears `FlatDirectory`. A null `Locales` array leaves the current list in place and does not restore `BuiltInLocales`. If the manifest is missing, pass a one-element list for the source language and do not set `FlatDirectory`. The menu is then the source language only, and catalogs stay embedded. Development reads the files `sync` just wrote. An installer that should follow `sync` ships `ui-languages.json` and the locale JSON next to the app.

`I18n.IsRightToLeft` reads `CultureInfo.TextInfo`. The app sets `CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture` itself, and persists the locale code. `string.Format` uses the current UI culture, so `{0:C}` follows that culture.

`LocaleChanged` fires inside `SetLocale`. Set `CurrentUICulture` and `CurrentCulture` first so a refresh handler formats with the new culture. View-model properties that call `T` should raise `PropertyChanged` from that event. For Avalonia, WPF, and MAUI, the markup extension returns `I18n.T(Text)` and sets that property again on `LocaleChanged`, then unsubscribes when the control leaves the visual tree. The catalog and current locale are static. That is safe for a desktop process. It is not a per-request locale for a multi-user server. Keep `IStringLocalizer` or `ResourceManager` there. Setting `CurrentUICulture` does not give each request its own map.

To refresh a copied helper, scaffold the same template in a disposable directory and copy only the generated file you intend to replace. Do not rerun `init` in the app to upgrade the helper.

The file starts with `ai-i18n-tools-i18n-cs:` so `extract` skips it.

<a id="desktop-recipe"></a>
## Desktop recipe

Avalonia, WPF, and MAUI each have their own markup-extension base class. The helper does not reference those assemblies. `ProvideValue` returns `I18n.T(Text)` and sets that property again on `LocaleChanged`. Unsubscribe when the control leaves the visual tree. Add `**/TrExtension.cs` to `ui.uiExtractor.exclude` so `T(Text)` is not reported as a non-literal. The XAML literals are already extracted through `Tr`. `{loc:Tr}` can only call `T`. Two meanings of one short word are set in code with `Tp`.

One Avalonia shape (`IProvideValueTarget` is in `Avalonia.Metadata`):

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

WPF and MAUI use the same idea with their own property types. Avalonia only: ignore `SelectionChanged` unless `e.Source` is the control that owns the handler. Do not assign `ItemsSource` or `SelectedItem` inside that handler, or inside a `LocaleChanged` that this combo's `SetLocale` raised. Post the refresh with `Dispatcher.UIThread.Post`, and guard the handler while code sets `SelectedItem`. A parent `TabControl` that assigns `ItemsSource` again from the bubbled event crashes the process (exit code 139, empty `crash.log`).

Formatted sentences stay in C# (`T("Cursor {0}", value)`), which keeps the extractor on a single literal. `StringFormat` on a binding is invisible. The same call works from a view model, a tray tooltip, and a dialog. An enum combo keeps the enum, returns `T("Light")` from its caption, and rebuilds the items on `LocaleChanged`. A tray item uses `Tp("tray", "Open")` and a stable `CommandParameter`. Match the parameter, not the header. A service stores the English error sentence, and the display site maps known sentences through `T`. Linux `.desktop` `Name=` and `Comment=` stay in the source language. Duration tokens that are compared (`2d`, `7h 47m`) stay untranslated. Translate `T("now")` and `T("in {0}", duration)` at the display site. A leading or trailing space on a literal is still an extract warning. Move it into the format string or the layout. `Tn` may correct a source sentence that was always plural (`1 samples`).

<a id="migrate"></a>
## Rewrite unsafe calls

`migrate-dotnet-i18n` is a dry run until you pass `--write`. It rewrites arguments of `T`, `Tn`, and `Tp` that are built before lookup:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

become `T("Saved to {0}", path)`, `T("Last synced {0}", date)`, and `T("Hello {0}", name)`. A repeated simple name stays one argument. A cast such as `(int)status` keeps its own index. The report `migrate-dotnet-i18n-report.md` lists anything left in place: `await`, a raw `$$"""` string, a `? :` hole, `ref` or `out`, a concatenation with no literal, an `IFormatProvider` passed to `string.Format`, and a phrase that looks like a plural (`{0} samples` should be `Tn`).

`--wrap` also marks unmarked XAML `Text`, `Header`, `Content`, and the other label attributes as `{loc:Tr '...'}`, and C# assignments whose name ends in `Text`, `Title`, `Message`, and the other high-confidence suffixes, plus `MessageBox.Show` and `ConfirmDialog.Show`. Without `--write` that is an audit. It does not edit logs, attributes, `nameof`, comparisons, or `Path` calls. A second run changes nothing.

When `extract` ingests a neutral `.resx`, the same report gains a Named resource keys section. A line such as `Resources.LoginButton` is listed as `T("Sign in")`. Those lines are suggestions. The command does not edit them.
