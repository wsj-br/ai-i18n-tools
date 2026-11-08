<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# Adicionar i18n a um aplicativo .NET ResourceManager

Esta página é para um aplicativo .NET que já carrega strings com `ResourceManager` ou ASP.NET `IStringLocalizer`, ou que irá fazê-lo. Você mantém esse carregador. As ai-i18n-tools leem `T("…")` e `{loc:Tr '…'}`, traduzem as mensagens e escrevem satélites `.resx` cujas chaves são essas strings de origem. O auxiliar é `I18nResx.cs`, copiado por `init -t ui-dotnet-resx`.

A maneira mais rápida é dar a um agente de codificação o prompt desta página. Ele aponta a configuração para seus recursos, envolve suas strings, verifica o resultado e pode adicionar um seletor de idioma. Você instala a CLI, escolhe o provedor e inicializa o projeto por conta própria, porque isso requer sua chave de API e suas escolhas. Você também executa a tradução por conta própria, porque ela gasta dinheiro em sua conta e reescreve seus arquivos `.resx`.

Um novo aplicativo Avalonia, WPF, MAUI, WinForms ou de console sem arquivos de recurso ainda usa [Adicionar i18n a um aplicativo .NET](/pt-BR/guide/add-i18n-to-dotnet). Esse caminho adiciona `I18n.cs` e JSON incorporado. Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

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

Você executa isso uma vez, antes do prompt. Ele escreve a configuração e `I18nResx.cs`, e usa o provedor que você escolheu acima.

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

Passe `--namespace` quando o namespace do projeto não for o que `init` imprime em `I18nResx.cs`. Com um `.csproj` no diretório e nenhum `--namespace`, `init` usa o `RootNamespace` desse arquivo, ou o nome do arquivo do projeto. Caso contrário, o namespace é `AiI18n`.

O modelo define `ui.flatOutput` como false e `ui.resx` como:

| Campo | Padrão |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true, então `SharedResource.resx` contém o texto de origem |
| `localeFormat` | `bcp47`, então o arquivo alemão é `SharedResource.de.resx` e o português do Brasil é `SharedResource.pt-BR.resx` |
| `ingestExistingResx` | true |

`init` escreve `I18nResx.cs` quando esse arquivo está faltando. `ResourceBaseName` é o namespace, a pasta de saída e o nome base unidos por pontos (`MyApp.Resources.SharedResource`). O SDK incorpora um resx sob esse nome de manifesto quando o arquivo está nessa pasta. Se você mover os arquivos, altere `ResourceBaseName` para corresponder. `init` não edita o `.csproj`. Os assemblies satélite são produzidos a partir de `*.{culture}.resx` na compilação. Implante esses satélites ao lado do aplicativo.

Execute `init` uma vez. Ele reescreve `ai-i18n-tools.config.json` toda vez, então uma segunda execução descarta as edições que você fez. Se `I18nResx.cs` já contiver o marcador `ai-i18n-tools-i18n-cs`, o projeto já está inicializado: pule esta etapa. `init` não sobrescreve um auxiliar existente.

Em seguida, edite `sourceLocale` e `targetLocales`. `sourceLocale` é o idioma das strings na origem. Qualquer idioma BCP-47 é válido; o scaffold usa `en`. Aponte `ui.resx` para a pasta e o nome base que seu aplicativo já carrega (manualmente, ou seja, [Etapa 1](#step-1-point-the-config-at-your-resources)). `neutralFile` é o resx neutro que mapeia um nome legado como `LoginButton` para seu texto de origem. Quando omitido, `{outputDir}/{baseName}.resx` é usado se esse arquivo existir.

O mesmo bloco `ui` também pode escrever JSON plano. Defina `flatOutput` de volta para true. Ambas as saídas compartilham um catálogo. Este modelo deixa `flatOutput` como false para que apenas `.resx` seja escrito.

Formas de chamada e o auxiliar JSON: [aplicativos .NET](/pt-BR/guide/ui-strings/dotnet). Todas as outras chaves de configuração: [Configuração](/pt-BR/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto em seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se você quiser que algo seja omitido, por exemplo, nenhuma troca de idioma, diga isso na mesma mensagem.

O agente primeiro verifica se a CLI, a configuração e `I18nResx.cs` existem, e para com instruções se um estiver faltando. Em seguida, ele trabalha em três partes:

- A Parte 1 aponta `ui.resx` para os catálogos que o aplicativo já carrega e verifica `ResourceBaseName`.
- A Parte 2 envolve strings voltadas para o usuário em `T()` e `{loc:Tr '…'}` e aplica sugestões de chaves nomeadas manualmente.
- A Parte 3 adiciona um seletor de idioma que permanece em `ResourceManager` ou `IStringLocalizer`.

Ele não instala nem inicializa nada, não lê sua chave de API nem traduz. Ele não reescreve arquivos `.resx`. A tradução é a etapa após a revisão, e você a executa.

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
## Revisar o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. Chamadas encapsuladas, a configuração, `ResourceBaseName` se os arquivos foram movidos e o seletor de idioma devem ter mudado. Seus arquivos `.resx` devem permanecer intocados até você traduzir.
- `ai-i18n-tools.config.json`: `resx.outputDir` e `baseName` apontam para os catálogos que seu aplicativo carrega, e `sourceRoots` cobre o projeto do aplicativo.
- `ResourceBaseName` corresponde ao nome do manifesto que o SDK irá incorporar.
- `ai-i18n-tools extract` lista as novas mensagens e mantém as traduções já existentes nos satélites.
- A execução de teste (dry run) de `migrate-dotnet-i18n` não lista nada a ser corrigido, exceto as sugestões de chave nomeada que você optou por adiar. Essas linhas ainda são `Resources.LoginButton` até que você as edite.
- Seus testes passam e o aplicativo parece o mesmo no idioma de origem.
- Nenhum script descartável ou `migrate-dotnet-i18n-report.md` foi deixado para trás.

Confirme este estado. `translate-ui` reescreve seus arquivos `.resx`, então você vai querer uma diferença limpa para revisar.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ela usa sua chave de API, gasta dinheiro em sua conta e reescreve seus arquivos `.resx`, então faça o commit primeiro.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. O mesmo ranking está na aba [Modelos](/pt-BR/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Preencha o glossário antes do primeiro `translate-ui`. `init` aponta `glossary.userGlossary` para `glossary-user.csv` e não cria o arquivo. Se o arquivo estiver faltando, execute `ai-i18n-tools glossary-generate`, então adicione os termos de domínio. Use **Forçar** para nomes que devem ser copiados sem alterações.

Em seguida, extraia e traduza:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` escreve o arquivo neutro e um satélite por idioma de destino. As chaves são as strings de origem. O `<comment>` registra o contexto e a primeira localização da origem. Uma edição manual em um satélite é mantida apenas se `extract` a ingerir antes da próxima tradução, o mesmo contrato que os arquivos `.po`. Deixe os arquivos gerados sem edição a partir de agora, porque a próxima execução os regenerará. Revise a primeira diferença antes de fazer o commit.

Entradas com um `type` ou `mimetype` (imagens e outros binários) são ignoradas. `ResourceManager.GetString` retorna o valor neutro quando essa cultura não tem uma entrada.

Recompile para que o SDK incorpore os novos satélites e, em seguida, reinicie o aplicativo.

<a id="check-one-language"></a>
### Verificar um idioma

Mude para um idioma de destino e abra uma tela com algumas strings encapsuladas. O texto que ainda está no idioma de origem não foi encapsulado, ainda usa uma chave nomeada que não foi aplicada, ou o satélite não foi reconstruído. Uma tradução que descarta `{0}` ou a renomeia pode lançar `FormatException` ou omitir o valor. `string.Format` não retorna ao modelo de origem. Verifique o satélite para essa frase antes de suspeitar do código.

<a id="keep-it-translated"></a>
## Mantenha traduzido

Execute novamente `ai-i18n-tools sync` (ou `extract` e depois `translate-ui`) após alterar o texto de origem. O cache significa que apenas strings novas ou alteradas vão para o modelo. Execute-o na CI para que as traduções não se desviem. Recompile após uma execução de tradução para que os satélites sejam incorporados novamente. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

`purge-locale` exclui `SharedResource.<culture>.resx` e deixa `SharedResource.resx`.

Para atualizar um `I18nResx.cs` copiado, crie o mesmo modelo em um diretório descartável e copie apenas o arquivo gerado que você pretende substituir. Não execute novamente `init` no aplicativo para atualizar o auxiliar.

Para traduzir `README.md` na mesma execução, faça o scaffold com `--with-readme` (ou adicione o bloco a uma configuração existente). Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faça isso manualmente

Siga estas etapas se preferir fazer as alterações você mesmo, ou se quiser saber o que o prompt faz. Cada etapa corresponde a uma parte do prompt. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#choose-models-and-translate) no final.

1. [Aponte a configuração para seus recursos](#step-1-point-the-config-at-your-resources).
2. [Encapsule strings](#step-2-wrap-strings) em `T()` ou `{loc:Tr '…'}`.
3. [Aplique chaves de recurso nomeadas](#step-3-apply-named-resource-keys).
4. [Mude o idioma em tempo de execução](#step-4-switch-language-at-runtime).

<a id="step-1-point-the-config-at-your-resources"></a>
## Etapa 1: Aponte a configuração para seus recursos

O modelo escreve esta forma. Altere a pasta e o nome base para os catálogos que seu aplicativo já carrega:

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

Verifique quatro coisas no seu projeto:

- `outputDir` e `baseName` são onde o arquivo neutro e os satélites já residem. Alemão é `SharedResource.de.resx`. Português do Brasil é `SharedResource.pt-BR.resx` quando `localeFormat` é `bcp47`.
- `neutralFile` é definido quando esse arquivo neutro não é `{outputDir}/{baseName}.resx`. A ingestão mapeia um nome legado (`LoginButton`) através do valor neutro (`Sign in`). O valor alemão `LoginButton` é então armazenado sob a string de origem `Sign in`.
- `ResourceBaseName` em `I18nResx.cs` é o namespace, a pasta de saída e o nome base unidos por pontos. Mova a constante quando os arquivos se moverem. Deixe o resto do auxiliar em paz.
- `sourceRoots` é o projeto do aplicativo, não `"."`.

O nome resx de uma string simples é o texto de origem: `Sign in`, `Saved to {0}`, um valor que contém uma aspa ou um e comercial. O contexto usa U+2404 entre o contexto e a origem. resx não tem formas plurais. Cada forma CLDR é sua própria entrada, nomeada `{singular}[{form}]`. `Tn` seleciona a forma com as mesmas regras do gravador `.po`. Você não digita o separador ou o sufixo plural.

Confirme com `ai-i18n-tools extract`. O catálogo deve listar as strings ingeridas do arquivo neutro.

<a id="step-2-wrap-strings"></a>
## Etapa 2: Envolver strings

`extract` registra uma string apenas quando é um literal passado para `T()`, `Tn`, `Tp`, `N` ou `{loc:Tr '…'}`. As mesmas formas do [auxiliar JSON](/pt-BR/guide/add-i18n-to-dotnet#step-2-wrap-strings) se aplicam. Os placeholders são `{0}`, não `{name}`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` pesquisa o nome que você passa e retorna esse nome quando o recurso está ausente. Os nomes de extrator padrão são `T`, `Tn`, `Tp`, `N`, `Tr` e `Loc`. Uma chamada como `_localizer["Sign in"]` é invisível até que `_localizer` seja adicionado a `ui.uiExtractor.funcNames`. Chamar `T("Sign in")` ou `I18nResx.T("Sign in")` não precisa de nome extra.

XAML usa `{loc:Tr '…'}`. O conteúdo do elemento não é extraído. Deixe `{Binding}` e `{StaticResource}` como estão.

Deixe logs, chaves JSON, nomes de arquivo, `nameof` e texto de exceção que não é exibido. Um valor armazenado permanece no idioma de origem. Traduza a legenda no controle.

Chamadas não seguras (`T($"…")`, concatenação, `string.Format` dentro de `T`) são o relatório da próxima etapa, juntamente com nomes legados como `Resources.LoginButton`.

<a id="step-3-apply-named-resource-keys"></a>
## Etapa 3: Aplicar chaves de recurso nomeadas

`migrate-dotnet-i18n` é uma execução de teste até que você passe `--write`. Ele reescreve argumentos de `T` que foram construídos antes da pesquisa, as mesmas edições que [Verificar chamadas encapsuladas](/pt-BR/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls).

Quando `extract` tiver ingerido um `.resx` neutro, o relatório também ganhará uma seção de chaves nomeadas:

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

Essa lista é para você aplicar. O comando não edita essas linhas. `--write` também não. Depois de alterar uma chamada para `T("Sign in")`, execute `extract` novamente.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

Leia `migrate-dotnet-i18n-report.md`. Quando as edições de chamadas não seguras parecerem corretas:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Execute a execução de teste novamente. Pare quando não listar edições de chamadas não seguras. Chaves nomeadas que você ainda não aplicou permanecem na lista de sugestões. Exclua o relatório ou ignore-o com git. Não edite os arquivos `.resx` nesta etapa.

<a id="step-4-switch-language-at-runtime"></a>
## Passo 4: Trocar o idioma em tempo de execução

`T` lê `CultureInfo.CurrentUICulture`. `I18nResx.SetLocale` define essa cultura e `CurrentCulture`, então levanta `LocaleChanged`. A localidade que ele armazena para `Tn` é estática, então um servidor que lida com requisições concorrentes não deve usar `SetLocale` como o switch por usuário.

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` é local à requisição. Aponte-o para o resx que a ferramenta escreve. A classe vazia é apenas o argumento de tipo. O nome base do manifesto deve corresponder a `ResourceBaseName`.

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

Em uma página Razor ou um serviço, chame `T` para que `extract` veja o literal. Mantenha um `IStringLocalizer<SharedResource>` existente quando um local de chamada já o usar. Adicione o nome desse receptor a `ui.uiExtractor.funcNames` se a pesquisa permanecer no indexador.

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` não tem parâmetro plural ou de contexto. Uma extensão pode chamar `I18nResx`, que lê os mesmos satélites. Coloque-o no projeto ASP.NET. `I18nResx.cs` não referencia `Microsoft.Extensions.Localization`, então um projeto de console ou desktop não usa esse pacote.

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

Escolha a cultura da requisição nesta ordem: a escolha explícita do visitante (`?lang=` ou um envio de formulário), o cookie que a lembra, o cabeçalho `Accept-Language`, então a localidade de origem. Ignore códigos que não estão em `sourceLocale` ou `targetLocales`. `pt-BR` é o nome do satélite. Um cabeçalho que envia `pt-br` ainda precisa ser correspondido a esse nome antes de você atribuir `CurrentUICulture`.

<a id="desktop-and-console"></a>
### Desktop e console

Restaure a cultura salva antes que a janela seja construída, chame `I18nResx.SetLocale` e atualize o texto visível de `LocaleChanged`. Construa o menu a partir de `sourceLocale` e `targetLocales`. Rotule-o `T("Language")`. A direção do fluxo vem de `CultureInfo.TextInfo.IsRightToLeft`. Não há lista `SupportedLocales` neste auxiliar.

Um programa de console não tem widget. Adicione `--lang <code>` (e `-L` quando esse nome estiver livre), então chame `SetLocale` antes do primeiro `T`. Não leia `AI_I18N_LANG`.

Pule esta etapa quando o programa não exibir texto que uma pessoa possa ler.

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#choose-models-and-translate).

<a id="not-your-case"></a>
## Não é o seu caso?

| Seu código hoje | Leia |
| --- | --- |
| Sem `.resx` e sem `IStringLocalizer` ainda | [Adicionar i18n a um aplicativo .NET](/pt-BR/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | Verificações xUnit de `I18nResx.cs`: chaves de string de origem, aspas, contexto, plurais, satélites reais |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | O auxiliar JSON, para um aplicativo que não está em `ResourceManager` |

Esses diretórios verificam os auxiliares. Não são aplicativos para traduzir e não precisam de uma chave de API. `dotnet test` em `dotnet-resx` executa as verificações de satélite. Um aplicativo real começa a partir de `init` nesta página. Copie um com `npx degit`, ou baixe `ai-i18n-tools-dotnet-examples.zip` do GitHub Release. Esse zip também contém `assets/dotnet`, que o projeto compila. Comandos: [Exemplos](/pt-BR/examples#net-examples).
