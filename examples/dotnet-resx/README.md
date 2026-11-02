# dotnet-resx

xUnit checks for `I18nResx.cs` and real `ResourceManager` satellites. The `.resx` files use source strings as keys, including spaces, quotes, ampersands, a newline, a context separator, and plural forms.

```bash
dotnet test
```

From the ai-i18n-tools repository root, `pnpm test:dotnet` runs this project and `dotnet-console`. It skips when `dotnet` is not installed.

`init -t ui-dotnet-resx` writes `I18nResx.cs` and a config that emits `Resources/SharedResource.<culture>.resx`. See [Add i18n to a .NET ResourceManager app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-dotnet-resourcemanager).

This directory is not an npm package and it is not inside the `ai-i18n-tools` tarball or the standalone executable. A copy, with `examples/dotnet-console` and `assets/dotnet`, is attached to GitHub Releases as `ai-i18n-tools-dotnet-examples.zip`. Releases published before that zip do not include it.
