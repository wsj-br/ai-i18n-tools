# dotnet-console

xUnit checks for the shipped `I18n.cs` helper: embedded locale JSON, culture fallback, whitespace, `{0}` formatting, plurals, the GNU plural-form table, and `Configure` replacing `FlatDirectory` while a null `Locales` array keeps the current list.

This directory is not an app to translate. It does not need an API key.

```bash
dotnet test
```

From the ai-i18n-tools repository root, `pnpm test:dotnet` runs the same command and exits 0 when `dotnet` is not installed.

The helper source is `../../assets/dotnet/I18n.cs`. `init -t ui-dotnet` copies that file into a real app. See [Add i18n to a .NET app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-dotnet).

This directory is not an npm package and it is not inside the `ai-i18n-tools` tarball or the standalone executable. A copy, with `examples/dotnet-resx` and `assets/dotnet`, is attached to GitHub Releases as `ai-i18n-tools-dotnet-examples.zip`. Releases published before that zip do not include it.
