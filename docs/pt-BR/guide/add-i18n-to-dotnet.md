<a id="add-i18n-to-a-net-app"></a>
# Adicionar i18n a um aplicativo .NET

Esta página pega um aplicativo .NET (Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET ou uma ferramenta de console) que tem um único idioma e adiciona localidades com ai-i18n-tools. Ela segue um caminho: o template `ui-dotnet`, um pequeno helper `I18n.cs` e arquivos JSON de traduções. `extract` registra uma string de UI apenas quando é um literal de string dentro de `T()`, `Tn`, `Tp`, `N` ou um `{loc:Tr '…'}` XAML, então um catálogo de texto-fonte simples estaria vazio.

A maneira mais rápida é dar a um agente de codificação o prompt nesta página. Ele coloca o helper, incorpora o JSON de localidade, envolve suas strings e pode adicionar um seletor de idioma. Você instala a CLI, escolhe o provedor e inicializa o projeto por conta própria, porque isso precisa da sua chave de API e de suas escolhas. Você também executa a tradução por conta própria, porque ela gasta dinheiro na sua conta.

Um aplicativo que já carrega strings com `ResourceManager` ou ASP.NET `IStringLocalizer` usa [Adicionar i18n a um aplicativo .NET ResourceManager](/pt-BR/guide/add-i18n-to-dotnet-resourcemanager). Esse caminho mantém o carregador e escreve satélites `.resx`. Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

O fluxo:

1. [Instale o CLI e escolha um provedor](#install-and-choose-a-provider).
2. [Inicialize o projeto](#initialise-the-project) com `init`.
3. [Execute o prompt do agente](#run-the-agent-prompt).
4. [Revise o resultado](#review-the-result).
5. [Escolha modelos e traduza](#choose-models-and-translate), depois verifique um idioma.
6. [Mantenha-o traduzido](#keep-it-translated).

Prefere fazer as alterações você mesmo, ou quer saber o que o prompt faz? [Faça manualmente](#do-it-by-hand) percorre os mesmos passos um por um.

<a id="install-and-choose-a-provider"></a>
## Instalar e escolher um provedor

Você faz esta parte, não o agente. O instalador altera sua máquina, e a chave de API é um segredo que pertence ao seu shell, não a um prompt.

Use o pacote npm quando a máquina já tiver Node.js `>=22.16.0` ([Instalação](/pt-BR/guide/installation)). Para um projeto .NET, instale o executável autônomo (sem Node.js).

Linux e macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

O instalador verifica `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` e o adiciona a `PATH`. Os binários não são autenticados (notarised) nem assinados com Authenticode. Etapas manuais e nomes de ativos: [Executáveis autônomos](/pt-BR/guide/installation#standalone-executables).

Verifique a instalação:

```bash
ai-i18n-tools --version
```

Em seguida, escolha um provedor e defina sua chave de API no shell que executará a tradução. Por exemplo, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers). Anote o nome do provedor, porque você o passará para `init` na próxima etapa. O agente nunca precisa da chave: ele apenas executa comandos que não fazem chamadas de modelo. Você usa a chave mais tarde, quando [traduz](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar o projeto

Você executa isso uma vez, antes do prompt. Ele escreve a configuração e o `I18n.cs`, e usa o provedor que você escolheu acima.

Esta página usa um template, `ui-dotnet`. Ele escreve a configuração, o helper `I18n.cs` e os catálogos JSON. Ele se encaixa nestes aplicativos:

| Seu aplicativo | Notas |
| --- | --- |
| Avalonia, WPF, MAUI | Rótulos em XAML precisam de uma extensão de marcação. O helper não referencia esses assemblies |
| WinForms | Reconstrua o texto visível quando a localidade mudar |
| Blazor e um aplicativo ASP.NET de usuário único | O catálogo do helper é estático, o que é suficiente para um usuário por vez |
| Um servidor multiusuário | Mantenha `IStringLocalizer` ou `ResourceManager`. Use a [página ResourceManager](/pt-BR/guide/add-i18n-to-dotnet-resourcemanager) |
| Ferramentas de console | Uma opção `--lang`, não um widget |

Execute init com o provedor que você escolheu (OpenRouter neste exemplo):

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

Passe `--namespace` quando o namespace do projeto não for o que `init` imprime em `I18n.cs`. Com um `.csproj` no diretório e nenhum `--namespace`, `init` usa o `RootNamespace` desse arquivo, ou o nome do arquivo do projeto. Caso contrário, o namespace é `AiI18n`.

Em seguida, edite `sourceLocale` e `targetLocales` em `ai-i18n-tools.config.json`. `sourceLocale` é o idioma das strings na origem. Qualquer idioma BCP-47 é válido; o scaffold usa `en`. `init` carimba essa lista em `I18n.cs` como `BuiltInLocales`, entre os marcadores `ai-i18n-tools-locales`, e `SourceLocale` é uma constante. Esse carimbo não é o menu de idiomas. `extract` reescreve `locales/ui-languages.json` da configuração, e o aplicativo lê esse arquivo na inicialização. Não execute novamente `init` no aplicativo para atualizar o helper.

Execute `init` uma vez. Ele reescreve `ai-i18n-tools.config.json` toda vez, então uma segunda execução descarta as edições que você fez. Se `I18n.cs` já contiver o marcador `ai-i18n-tools-i18n-cs`, o projeto já está inicializado: pule esta etapa. `init` não sobrescreve um `I18n.cs` existente e não edita o `.csproj`.

`init` define `ui.sourceRoots` como `"."`, então `extract` escanearia o repositório inteiro. O prompt o restringe ao código da sua aplicação (manualmente, ou seja, [Etapa 1](#step-1-place-the-helper-and-embed-the-catalogs)). A varredura já ignora diretórios nomeados `bin`, `obj`, `.vs`, `TestResults` e `packages`, e o template exclui `**/Tests/**`, `**/*.Tests/**` e `**/TrExtension.cs`.

Formas de chamada: [aplicativos .NET](/pt-BR/guide/ui-strings/dotnet). Todas as outras chaves de configuração: [Configuração](/pt-BR/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto em seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se você quiser que algo seja omitido, por exemplo, nenhuma troca de idioma, diga isso na mesma mensagem.

O agente primeiro verifica se a CLI, a configuração e `I18n.cs` existem, e para com instruções se um estiver faltando. Em seguida, ele trabalha em três partes:

- A Parte 1 coloca `I18n.cs` e `locales/` onde o projeto mantém seu código, incorpora o JSON e aponta a configuração para eles.
- A Parte 2 envolve as strings voltadas para o usuário em `T()`, `Tn`, `Tp`, `N` e `{loc:Tr '…'}`, então verifica chamadas inseguras com `migrate-dotnet-i18n`.
- A Parte 3 adiciona um seletor de idioma ou uma opção de idioma da CLI.

Ele não instala nem inicializa nada, lê sua chave de API, nem traduz. A tradução é a etapa após a revisão, e você a executa.

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
## Revisar o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. O texto encapsulado deve ser lido da mesma forma que antes, sem reformatação não relacionada. `git diff --stat` mostra o quanto mudou. O posicionamento do helper, o item `EmbeddedResource`, as chamadas encapsuladas e a troca de idioma são as edições esperadas.
- Catálogos gerados (`strings.json`, JSON por localidade, `ui-languages.json`) não são tocados, exceto pelo que `extract` escreveu. `I18n.cs` não é tocado, exceto por um carimbo `SourceLocale` quando essa constante havia se desviado. O menu é carregado de `ui-languages.json`. Uma chamada `Configure` define `Locales` e `FlatDirectory` juntos quando esse arquivo foi encontrado. `TrExtension` é excluído da extração e atualiza a visualização aberta em `LocaleChanged`.
- `ai-i18n-tools extract` executa limpo, e `strings.json` lista as frases que você espera. Nenhum aviso permanece, e nenhum literal ainda contém `{name}`.
- A execução de teste de `migrate-dotnet-i18n` não lista nada que precise ser corrigido. Um relatório limpo não prova que todas as frases foram encapsuladas. As strings ignoradas no relatório do agente são o restante dessa verificação.
- Seus testes passam, e o aplicativo parece o mesmo no idioma de origem.
- Nenhum script descartável ou `migrate-dotnet-i18n-report.md` foi deixado para trás.
- `SourceLocale` em `I18n.cs` é igual a `sourceLocale` na configuração, caractere por caractere. O menu de idiomas não lê `BuiltInLocales`.

Strings que o agente perdeu aparecem como texto que permanece no idioma de origem posteriormente.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ela usa sua chave de API e gasta dinheiro em sua conta.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. Use `--max-price` para excluir modelos cujo preço combinado excede um limite. Se você preferir uma GUI, use `ai-i18n-tools dashboard` para selecionar os [modelos](/pt-BR/guide/translation-dashboard/models).

Preencha o glossário antes do primeiro `translate-ui`. `init` aponta `glossary.userGlossary` para `glossary-user.csv` e não cria o arquivo. Se o arquivo estiver faltando, execute `ai-i18n-tools glossary-generate`, então adicione termos de domínio. Use **Forçar** para nomes que devem ser copiados sem alterações. Uma segunda `translate-ui` de uma string inalterada pode retornar com uma redação diferente. O glossário é o que faz as duas execuções concordarem.

Em seguida, extraia e traduza:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` escreve `strings.json` e `ui-languages.json`. `translate-ui` escreve um arquivo JSON por idioma de destino em `ui.flatOutputDir`. Deixe esses arquivos gerados sem edição. `sync` executa `extract` e `translate-ui` juntos quando `features.translateUIStrings` está ativado.

`T()` procura a frase de origem no JSON de localidade. O ID em `strings.json` não é a chave de pesquisa. Um arquivo ausente ou uma chave ausente retorna a frase de origem, a menos que `I18n.Strict` esteja definido. `string.Format` então é executado no modelo traduzido. Um formato inválido pode lançar `FormatException`. Um `{0}` omitido pode suprimir o argumento. Não há fallback para o modelo de origem após um erro de formato.

<a id="check-one-language"></a>
### Verificar um idioma

Reinicie o aplicativo, mude para um idioma de destino e abra uma tela com algumas strings encapsuladas. Use o seletor de idioma que o agente adicionou, ou defina ambas as culturas e chame `I18n.SetLocale` você mesmo. O texto que ainda está no idioma de origem não foi encapsulado, foi copiado para um controle antes de `SetLocale`, ou não tem uma entrada no JSON de localidade. Verifique o JSON para a frase antes de suspeitar do código.

`SetLocale` percorre `CultureInfo.Parent` até que um catálogo seja aberto (`pt-BR` pode carregar `pt.json`). Recursos incorporados são usados quando nem `OpenLocale` nem `FlatDirectory` estão definidos. Um `FlatDirectory` configurado não recorre ao JSON incorporado quando um arquivo está faltando.

Quando a inicialização encontrou `locales/ui-languages.json`, `FlatDirectory` é esse diretório, então as frases que você vê são os arquivos que `sync` acabou de escrever. Oculte esse manifesto e comece novamente: o menu oferece apenas o idioma de origem, e as strings vêm dos recursos incorporados na última compilação. Uma compilação instalada que deve seguir `sync` precisa enviar `ui-languages.json` e o JSON de localidade ao lado do aplicativo.

<a id="keep-it-translated"></a>
## Mantenha traduzido

Execute novamente `ai-i18n-tools sync` (ou `extract` e depois `translate-ui`) após alterar o texto de origem. O cache significa que apenas strings novas ou alteradas vão para o modelo. Execute-o na CI para que as traduções não se desviem. Com `FlatDirectory` apontado para a pasta `locales`, reinicie o aplicativo. Uma reconstrução é necessária apenas quando o manifesto não foi encontrado e o aplicativo ainda está lendo o JSON incorporado. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

Para atualizar um `I18n.cs` copiado, crie o mesmo modelo em um diretório descartável e copie apenas o arquivo gerado que você pretende substituir. Não execute novamente `init` no aplicativo para atualizar o helper.

Para traduzir `README.md` na mesma execução, faça o scaffold com `--with-readme` (ou adicione o bloco a uma configuração existente). Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faça isso manualmente

Siga estas etapas se preferir fazer as alterações você mesmo, ou se quiser saber o que o prompt faz. Cada etapa corresponde a uma parte do prompt. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#choose-models-and-translate) no final.

1. [Posicione o helper e incorpore os catálogos](#step-1-place-the-helper-and-embed-the-catalogs).
2. [Encapsule strings](#step-2-wrap-strings) em `T()`, `Tn`, `Tp`, `N` ou `{loc:Tr '…'}`.
3. [Verifique as chamadas encapsuladas](#step-3-check-wrapped-calls) com `migrate-dotnet-i18n`.
4. [Adicione um seletor de idioma](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## Etapa 1: Posicione o helper e incorpore os catálogos

`init` escreve estes na raiz do repositório:

| Arquivo | O que é | Editar? |
| --- | --- | --- |
| `I18n.cs` | O helper que seu código chama (`T`, `Tn`, `Tp`, `SetLocale`) | Não. Ele é gerado. `init` não o sobrescreverá |
| `locales/strings.json` | O cache de extração. O aplicativo nunca o lê | Não. `extract` o escreve |
| `locales/<code>.json` | As traduções que o aplicativo carrega, um arquivo por idioma | Não. `translate-ui` as escreve |
| `locales/ui-languages.json` | O menu de idiomas. O aplicativo lê `code`, `label` e `englishName` na inicialização | Não. `extract` o escreve |

Mova `I18n.cs` e `locales/` para o projeto do aplicativo. Adicione o incorporado a esse `.csproj` e deixe o restante do arquivo intocado:

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

O caminho de inclusão é relativo ao arquivo do projeto. O .NET Framework 4.8 também precisa do pacote `System.Text.Json`. O .NET 6 ou mais recente já o possui.

Atualize a configuração para o novo local e aponte `sourceRoots` para o projeto do aplicativo, para que os testes e a saída da compilação fiquem fora do catálogo:

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

Adicione `global using static MyApp.I18n;` (use o namespace impresso em `I18n.cs`) ou chame `I18n.T` em cada local.

`SourceLocale` no helper deve ser igual a `sourceLocale` na configuração. `BuiltInLocales`, entre os marcadores `ai-i18n-tools-locales`, é a lista que `init` carimbou. Não é o menu. Depois de alterar `targetLocales`, `extract` reescreve `ui-languages.json`, e o aplicativo lê esse arquivo. Crie um diretório descartável quando precisar de um helper novo. Não execute novamente `init` aqui.

Confirme com `ai-i18n-tools extract`. O catálogo deve aparecer na nova pasta `locales/`. Espere 0 strings até que algo seja encapsulado.

<a id="step-2-wrap-strings"></a>
## Etapa 2: Envolver strings

`extract` registra uma string apenas quando é um literal passado para `T()`, `Tn`, `Tp`, `N` ou `{loc:Tr '…'}`. Um receptor como `I18n.T` corresponde porque o último nome é `T`.

Procure a entrada do catálogo primeiro e depois passe o resultado para `string.Format`:

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

Estes são extraídos e então rejeitados, porque o catálogo não corresponderia ao que o programa procura:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` imprime um aviso para os três primeiros e para em `{name}`. A [próxima etapa](#step-3-check-wrapped-calls) reescreve os três primeiros.

Os placeholders permanecem no formato .NET: `{0}`, `{0,-10}`, `{0:C}`. `%` é texto comum, então uma tradução como `10% off` não é um token printf. Chaves duplas (<code v-pre>{{</code> e `}}`) são chaves literais e devem ser copiadas sem alterações. Mais formatos de chamada: [Chamadas que traduzem](/pt-BR/guide/ui-strings/dotnet#calls-that-translate).

XAML e AXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

O prefixo é ignorado. `{Binding}` e `{StaticResource}` são deixados como estão. O texto escrito como conteúdo de elemento não é extraído. Um literal que contém um apóstrofo é escrito com `&quot;` para que o atributo possa permanecer entre aspas duplas.

Avalonia, WPF e MAUI fornecem cada um sua própria classe base `MarkupExtension`. O helper não referencia esses assemblies. `ProvideValue` retorna `I18n.T(Text)` e define essa propriedade novamente em `LocaleChanged`, então cancela a inscrição quando o controle sai da árvore visual. Uma forma Avalonia (`IProvideValueTarget` está em `Avalonia.Metadata`):

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

WPF e MAUI fazem o mesmo com seus próprios tipos de propriedade. Adicione `**/TrExtension.cs` a `ui.uiExtractor.exclude`. `T(Text)` não é um literal, e os literais XAML já são extraídos através de `Tr`. `{loc:Tr}` só pode chamar `T`. Dois significados de uma palavra curta são definidos no código com `Tp`.

Frases formatadas permanecem em C# (`T("Cursor {0}", value)`), o que mantém o extrator em um único literal. `StringFormat` em uma ligação é invisível para `extract`. A mesma chamada funciona a partir de um view model, uma dica de ferramenta da bandeja e um diálogo. Acione `PropertyChanged` de `LocaleChanged` para strings de view model.

Um valor que é armazenado e exibido mantém o valor armazenado no idioma de origem. Uma caixa de combinação de enumeração mantém a enumeração e retorna `T("Light")` de sua legenda, então reconstrói os itens em `LocaleChanged`. `N("Last 12 months")` existe para que um campo estático possa conter um literal que o extrator vê. `T()` em um dicionário estático é executado uma vez, no primeiro carregamento do tipo, e permanece nesse idioma. Um serviço armazena a frase de erro em inglês. O local de exibição mapeia frases conhecidas através de `T`, para que uma alteração de localidade posterior possa traduzi-las. `T()` na falha congela essa frase.

Um item da bandeja usa `Tp("tray", "Open")` e um `CommandParameter` estável. Corresponda ao parâmetro, não ao cabeçalho. `.desktop` `Name=` e `Comment=` do Linux permanecem no idioma de origem. Tokens de duração que são comparados (`2d`, `7h 47m`) permanecem sem tradução. Traduza `T("now")` e `T("in {0}", duration)` onde o texto é exibido. Um literal com um espaço inicial ou final (`Updated: `) ainda é um aviso de extração. Mova o espaço para a string de formato ou para o layout. `Tn` pode alterar uma frase de origem que sempre foi plural (`1 samples`).

Deixe estes como estão: logs, nomes de propriedades JSON, nomes de arquivos, `nameof`, argumentos de atributo, chaves de objeto usadas como identificadores e texto de exceção que o programa corresponde em vez de exibir.

Execute `ai-i18n-tools extract` novamente. O catálogo agora deve listar as frases que você encapsulou.

<a id="step-3-check-wrapped-calls"></a>
## Etapa 3: Verificar chamadas envolvidas

Use esta etapa quando uma chamada formatar a string antes da pesquisa no catálogo:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` os reescreve em uma pesquisa que ocorre primeiro. Uma segunda execução não altera nada.

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

O comando é uma execução de teste (dry run) até que você passe `--write`. Ele escreve `migrate-dotnet-i18n-report.md`. Leia esse relatório. Quando as edições parecerem corretas:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Execute a simulação novamente. Pare quando não listar edições, então execute os testes do projeto. Linhas deixadas no lugar (`await`, uma string bruta interpolada, um buraco condicional, `ref` ou `out`, uma concatenação sem literal, um `IFormatProvider` passado para `string.Format`) são corrigidas manualmente. Uma frase que parece plural pertence a `Tn`, o que pode corrigir uma frase de origem que sempre foi plural. `I18n.cs` gerado é ignorado. Exclua o relatório ou ignore-o com git.

`--wrap` também marca XAML não marcado `Text`, `Header`, `Content` e os outros atributos de rótulo como `{loc:Tr '…'}`, além de atribuições C# cujo nome termina em `Text`, `Title` ou `Message`, e `MessageBox.Show`. Sem `--write`, isso é uma auditoria. Ele não edita logs, atributos, `nameof`, comparações ou chamadas `Path`.

Um relatório sem edições significa que as chamadas encapsuladas são seguras. Não significa que cada frase voltada para o usuário foi encapsulada. Rótulos simples, strings retornadas e conteúdo de elementos são invisíveis para ele. Detalhes: [Reescrever chamadas não seguras](/pt-BR/guide/ui-strings/dotnet#rewrite-unsafe-calls).

<a id="step-4-add-a-language-switch"></a>
## Passo 4: Adicionar um seletor de idioma

Antes do primeiro `T()`, encontre `locales/ui-languages.json`. Pesquise para cima a partir de `AppContext.BaseDirectory`, então a partir do diretório atual, no máximo 8 diretórios cada. O primeiro arquivo vence. Analise `code`, `label` e `englishName` em `LocaleInfo` (`label` é `NativeName`). Chame `Configure` uma vez com esse array como `Locales` e com `FlatDirectory` definido para o diretório `locales` que continha o arquivo. `Configure` substitui `Strict`, `FlatDirectory` e `OpenLocale` em cada chamada. Uma chamada posterior que apenas define `Locales` limpa `FlatDirectory`. `Locales: null` não restaura a lista anterior.

Se o arquivo estiver faltando, passe um array `Locales` de um elemento para o idioma de origem e não defina `FlatDirectory`. O menu está apenas no idioma de origem. Não mostre `BuiltInLocales`. O desenvolvimento então lê os catálogos que `sync` acabou de escrever. Uma compilação publicada sem um manifesto próximo mantém os catálogos incorporados. Um instalador que deve seguir `sync` envia `ui-languages.json` e o JSON de localidade ao lado do aplicativo.

Persista o código da localidade, não o nome nativo. Defina ambas as culturas antes de `SetLocale`, porque `LocaleChanged` é acionado dentro dessa chamada:

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

Rotule o controle com `T("Language")`. Aceite apenas códigos da lista que você passou. Em `LocaleChanged`, levante `PropertyChanged` para strings de view-model, ou reconstrua controles que copiaram seu texto. `TrExtension` atualiza a exibição aberta, como na [Etapa 2](#step-2-wrap-strings). Quando o framework tiver uma direção de fluxo, defina-a a partir de `I18n.IsRightToLeft(code)`.

Avalonia: ignore `SelectionChanged` a menos que `e.Source` seja o controle que possui o manipulador. Não atribua `ItemsSource` ou `SelectedItem` dentro desse manipulador, ou dentro de um `LocaleChanged` que o `SetLocale` desta caixa de combinação levantou. Publique a atualização com `Dispatcher.UIThread.Post`. Proteja o manipulador enquanto o código define `SelectedItem`. Um `TabControl` pai que trata o evento borbulhado como uma mudança de aba e atribui `ItemsSource` novamente trava o processo (código de saída 139, `crash.log` vazio).

Um programa de console não tem widget. Adicione `--lang <code>` (e `-L` quando esse nome estiver livre). Aceite apenas códigos da lista carregada acima. Não leia `AI_I18N_LANG`. Essa variável é apenas para o CLI ai-i18n-tools.

Pule esta etapa quando o programa não exibir texto que uma pessoa possa ler.

O catálogo e o locale atual são estáticos. Isso é seguro para um processo de desktop. Não é um locale por requisição para um servidor multiusuário. Mantenha `IStringLocalizer` ou `ResourceManager` lá, e siga [Adicionar i18n a um aplicativo .NET ResourceManager](/pt-BR/guide/add-i18n-to-dotnet-resourcemanager). Definir `CurrentUICulture` não dá a cada requisição seu próprio mapa.

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#choose-models-and-translate).

<a id="not-your-case"></a>
## Não é o seu caso?

| Seu código hoje | Leia |
| --- | --- |
| `ResourceManager`, satélites `.resx`, ou ASP.NET `IStringLocalizer` | [Adicionar i18n a um aplicativo .NET ResourceManager](/pt-BR/guide/add-i18n-to-dotnet-resourcemanager) |
| Já `T("…")` com a frase no idioma de origem | [Strings de UI](/pt-BR/guide/ui-strings/) etapas 2–3, e [aplicativos .NET](/pt-BR/guide/ui-strings/dotnet) |
| Um aplicativo JS/TS | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) |
| Um aplicativo Python | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Django, catálogos Flask-Babel, ou GNU gettext | [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Um site ou site de documentação | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website) |
| Um README de repositório ou outros arquivos Markdown | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Exemplos

| Exemplo | O que ele mostra |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | Verificações xUnit de `I18n.cs`: JSON incorporado, fallback de cultura, `{0}`, plurais e `Configure` |

Esses diretórios verificam o auxiliar. Eles não são aplicativos para traduzir e não precisam de uma chave de API. `dotnet test` nesse diretório executa as verificações. Um aplicativo real começa a partir de `init` nesta página. Copie um com `npx degit`, ou baixe `ai-i18n-tools-dotnet-examples.zip` do GitHub Release. Esse zip também contém `assets/dotnet`, que o projeto compila. Comandos: [Exemplos](/pt-BR/examples#net-examples).
