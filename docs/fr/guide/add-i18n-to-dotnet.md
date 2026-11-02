<a id="add-i18n-to-a-dotnet-app"></a>
# Ajouter l'i18n à une application .NET

Cette page prend une application .NET (Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET ou un outil console) qui a une seule langue et y ajoute des paramètres régionaux avec ai-i18n-tools. Elle suit un chemin unique : le modèle `ui-dotnet`, un petit utilitaire `I18n.cs` et des fichiers JSON de traductions. `extract` enregistre une chaîne d’interface utilisateur uniquement lorsqu’il s’agit d’un littéral de chaîne à l’intérieur de `T()`, `Tn`, `Tp`, `N` ou d’un `{loc:Tr '…'}` XAML, de sorte qu’un catalogue de texte source simple serait vide.

Le moyen le plus rapide est de donner à un agent de codage l’invite de cette page. Il place l’utilitaire, intègre le JSON des paramètres régionaux, enveloppe vos chaînes et peut ajouter un sélecteur de langue. Vous installez l’interface de ligne de commande, choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela dépense de l’argent sur votre compte.

Une application qui charge déjà des chaînes avec `ResourceManager` ou ASP.NET `IStringLocalizer` utilise [Ajouter l’i18n à une application .NET ResourceManager](/fr/guide/add-i18n-to-dotnet-resourcemanager). Ce chemin conserve le chargeur et écrit des satellites `.resx`. Vous ne savez pas lequel s’applique ? Voir [Ce n’est pas votre cas ?](#not-your-case) à la fin.

Le flux :

1. [Installer la CLI et choisir un fournisseur](#install-and-choose-a-provider).
2. [Initialiser le projet](#initialise-the-project) avec `init`.
3. [Exécuter l'invite de l'agent](#run-the-agent-prompt).
4. [Examiner le résultat](#review-the-result).
5. [Choisir les modèles et traduire](#choose-models-and-translate), puis vérifier une langue.
6. [Maintenir la traduction](#keep-it-translated).

Vous préférez effectuer les modifications vous-même, ou vous voulez savoir ce que fait l'invite ? [Faites-le manuellement](#do-it-by-hand) parcourt les mêmes étapes une par une.

<a id="install-and-choose-a-provider"></a>
## Installer et choisir un fournisseur

Vous faites cette partie, pas l'agent. L'installateur modifie votre machine, et la clé API est un secret qui doit rester dans votre shell, pas dans une invite.

Utilisez le package npm lorsque la machine dispose déjà de Node.js `>=22.16.0` ([Installation](/fr/guide/installation)). Pour un projet .NET, installez l’exécutable autonome (pas de Node.js).

Linux et macOS :

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell) :

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

L'installateur vérifie `SHA256SUMS.txt`, installe la commande sous le nom `ai-i18n-tools` et l'ajoute à `PATH`. Les binaires ne sont pas notarisés ni signés Authenticode. Étapes manuelles et noms des ressources : [Exécutables autonomes](/fr/guide/installation#standalone-executables).

Vérifier l'installation :

```bash
ai-i18n-tools --version
```

Ensuite, choisissez un fournisseur et définissez sa clé API dans le shell qui exécutera la traduction. Par exemple, OpenRouter :

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama n'a pas besoin de clé. Autres préréglages : [Fournisseurs intégrés](/fr/guide/providers-and-models#built-in-providers). Notez le nom du fournisseur, car vous le passerez à `init` à l'étape suivante. L'agent n'a jamais besoin de la clé : il exécute uniquement des commandes qui n'effectuent aucun appel de modèle. Vous utiliserez la clé plus tard, lorsque vous [traduirez](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Initialiser le projet

Vous exécutez ceci une fois, avant l’invite. Il écrit la configuration et `I18n.cs`, et il utilise le fournisseur que vous avez choisi ci-dessus.

Cette page utilise un modèle, `ui-dotnet`. Il écrit la configuration, l’utilitaire `I18n.cs` et les catalogues JSON. Il convient à ces applications :

| Votre application | Remarques |
| --- | --- |
| Avalonia, WPF, MAUI | Les étiquettes en XAML nécessitent une extension de balisage. L’utilitaire ne référence pas ces assemblys |
| WinForms | Reconstruire le texte visible lorsque les paramètres régionaux changent |
| Blazor et une application ASP.NET mono-utilisateur | Le catalogue de l’utilitaire est statique, ce qui est suffisant pour un seul utilisateur à la fois |
| Un serveur multi-utilisateur | Conservez `IStringLocalizer` ou `ResourceManager`. Utilisez la [page ResourceManager](/fr/guide/add-i18n-to-dotnet-resourcemanager) |
| Outils console | Une option `--lang`, pas un widget |

Exécutez init avec le fournisseur que vous avez choisi (OpenRouter dans cet exemple) :

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

Passez `--namespace` lorsque l’espace de noms du projet n’est pas celui que `init` imprime dans `I18n.cs`. Avec un `.csproj` dans le répertoire et aucun `--namespace`, `init` utilise le `RootNamespace` de ce fichier, ou le nom du fichier projet. Sinon, l’espace de noms est `AiI18n`.

Ensuite, modifiez `sourceLocale` et `targetLocales` dans `ai-i18n-tools.config.json`. `sourceLocale` est la langue des chaînes dans la source. Toute langue BCP-47 est valide ; l’échafaudage utilise `en`. La même liste est estampillée dans `I18n.cs` en tant que `BuiltInLocales`, entre les marqueurs `ai-i18n-tools-locales`, et `SourceLocale` est une constante. `SupportedLocales` lit ce tableau. Après avoir modifié la configuration, mettez à jour l’estampille ou passez un nouveau tableau `Locales` à `I18n.Configure`. Ne réexécutez pas `init` dans l’application pour actualiser l’utilitaire.

Exécutez `init` une fois. Il réécrit `ai-i18n-tools.config.json` à chaque fois, donc une deuxième exécution annule les modifications que vous avez apportées. Si `I18n.cs` contient déjà le marqueur `ai-i18n-tools-i18n-cs`, le projet est déjà initialisé : ignorez cette étape. `init` n’écrase pas un `I18n.cs` existant et ne modifie pas le `.csproj`.

`init` définit `ui.sourceRoots` sur `"."`, de sorte que `extract` analyserait l’ensemble du dépôt. L’invite le restreint au code de votre application (manuellement, c’est l’[Étape 1](#step-1-place-the-helper-and-embed-the-catalogs)). L’analyse ignore déjà les répertoires nommés `bin`, `obj`, `.vs`, `TestResults` et `packages`, et le modèle exclut `**/Tests/**` et `**/*.Tests/**`.

Formes d’appel : [Applications .NET](/fr/guide/ui-strings/dotnet). Toutes les autres clés de configuration : [Configuration](/fr/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot ou similaire), démarrez une nouvelle conversation et collez l'invite ci-dessous. Le projet doit déjà être initialisé. Il n'y a rien à modifier. Si vous voulez omettre quelque chose, par exemple pas de sélecteur de langue, précisez-le dans le même message.

L’agent vérifie d’abord que l’interface de ligne de commande, la configuration et `I18n.cs` existent, et s’arrête avec des instructions si l’un d’eux est manquant. Ensuite, il fonctionne en trois parties :

- La partie 1 place `I18n.cs` et `locales/` là où le projet conserve son code, intègre le JSON et y pointe la configuration.
- La partie 2 enveloppe les chaînes destinées à l’utilisateur dans `T()`, `Tn`, `Tp`, `N` et `{loc:Tr '…'}`, puis vérifie les appels non sécurisés avec `migrate-dotnet-i18n`.
- La partie 3 ajoute un sélecteur de langue ou une option de langue CLI.

Il n'installe ni n'initialise rien, ne lit pas votre clé API et ne traduit pas. La traduction est l'étape après la révision, et c'est vous qui l'exécutez.

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
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `I18n.cs`
  except `SourceLocale` and the `BuiltInLocales` array between the
  `ai-i18n-tools-locales` markers, and only when `sourceLocale` or
  `targetLocales` changed after init. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`, `.resx`). Do not add
  another helper module.
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
5. `BuiltInLocales` inside `I18n.cs`, between the `ai-i18n-tools-locales`
   markers, is the list stamped at init. `SupportedLocales` reads it. If
   `sourceLocale` or `targetLocales` was edited after that, update
   `SourceLocale` and that array, or call `I18n.Configure` with a new
   `Locales` array. Do not rewrite the rest of the helper.
6. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `T("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

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
  a `TrExtension` in the app. `ProvideValue` returns `I18n.T(Text)`. Do not
  reference those UI assemblies from `I18n.cs`.
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

- Tray or menu items found by their header should use `Tp` and a stable tag,
  not the translated header.
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
Lines the command leaves in place (`await`, a raw `$$"""` string, a `? :`
hole, `ref` or `out`, a concatenation with no literal) are fixed by hand.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app still gets this
part: `--lang <code>` (and `-L` when that name is free), not a widget. Do not
read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Goal: one chosen language applies to every `T()` in that process, and a screen
can remember the choice. Accept only codes from `I18n.SupportedLocales`
(`Code`, `NativeName`).

- Restore the saved locale at startup, before the first `T`. Set
  `CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture` to that
  culture, then call `I18n.SetLocale`. `SetLocale` raises `LocaleChanged`
  immediately, so the cultures have to be set first. `string.Format` uses the
  current UI culture, so `{0:C}` follows it.
- Add a control labelled `T("Language")` whose options come from
  `SupportedLocales`. On change, set both cultures, then call `SetLocale`, and
  persist the choice.
- Refresh visible text from `LocaleChanged`. View-model properties that call
  `T` raise `PropertyChanged` from that event. WinForms and other toolkits
  that copy text into controls rebuild those properties in the handler. A
  markup extension that returns a plain string updates the next time the view
  is built.
- When the framework has a flow direction, set it from
  `I18n.IsRightToLeft(code)`.
- Do not use this helper as a per-user selector in a multi-user server. Keep
  `IStringLocalizer` or `ResourceManager` for that case.

## Verify and report

The project's build and tests pass. `extract` writes a non-empty catalog of
the sentences you wrapped, with no warnings. With the source locale, the
output is unchanged. A missing key returns the source string unless `Strict`
is set. A bad format in a translation can throw `FormatException`. A dropped
`{0}` can omit the value. `string.Format` does not fall back to the source
template.

Report the files changed, each string you skipped with file, line, surface,
and reason, the same word used with different meanings, sentences built from
translated pieces, plurals left as one string, and any `T()` that runs at
startup. With a locale file present, one test sets a target locale and asserts
that a validation message and a caption change, while the stored option value
stays in the source language. If `dotnet` is not installed, say the runtime
check was skipped.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools translate-ui`, then
restart the app. Remind the user to fill `glossary-user.csv` before the first
translation.
````

<a id="review-the-result"></a>
## Réviser le résultat

L'agent termine avec un rapport. Vérifiez-le avant de traduire :

- La diff. Le texte enveloppé doit se lire comme avant, sans reformatage non lié. `git diff --stat` montre combien a changé. Le placement de l'assistant, l'élément `EmbeddedResource`, les appels enveloppés et le changement de langue sont les modifications attendues.
- Les catalogues générés (`strings.json`, JSON par langue, `ui-languages.json`) ne sont pas touchés, sauf ce que `extract` a écrit. `I18n.cs` n'est pas touché, à l'exception d'un code de langue que vous avez demandé de rafraîchir.
- `ai-i18n-tools extract` s'exécute proprement, et `strings.json` liste les phrases attendues. Aucun avertissement ne subsiste, et aucun littéral ne contient encore `{name}`.
- L'exécution à sec de `migrate-dotnet-i18n` ne liste rien à corriger. Un rapport propre ne prouve pas que chaque phrase a été enveloppée. Les chaînes ignorées dans le rapport de l'agent sont le reste de cette vérification.
- Vos tests passent, et l'application a la même apparence dans la langue source.
- Aucun script jetable ou `migrate-dotnet-i18n-report.md` n'a été laissé.
- `SourceLocale` dans `I18n.cs` est égal à `sourceLocale` dans la configuration, caractère par caractère. `BuiltInLocales` liste les mêmes langues que la configuration.

Les chaînes que l'agent a manquées apparaissent comme du texte qui reste dans la langue source par la suite.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

C'est vous qui exécutez cette partie. Elle utilise votre clé API et dépense de l'argent sur votre compte.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ne remplace que `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Remplissez le glossaire avant la première `translate-ui`. `init` pointe `glossary.userGlossary` vers `glossary-user.csv` et ne crée pas le fichier. Si le fichier est manquant, exécutez `ai-i18n-tools glossary-generate`, puis ajoutez les termes du domaine. Utilisez **Force** pour les noms qui doivent être copiés inchangés. Une deuxième `translate-ui` d'une chaîne inchangée peut revenir formulée différemment. Le glossaire est ce qui fait que les deux exécutions concordent.

Ensuite, extrayez et traduisez :

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` écrit `strings.json` et `ui-languages.json`. `translate-ui` écrit un fichier JSON par langue cible sous `ui.flatOutputDir`. Laissez ces fichiers générés non modifiés. `sync` exécute `extract` et `translate-ui` ensemble lorsque `features.translateUIStrings` est activé.

`T()` recherche la phrase source dans le JSON de la langue. L'identifiant dans `strings.json` n'est pas la clé de recherche. Un fichier manquant ou une clé manquante renvoie la phrase source, sauf si `I18n.Strict` est défini. `string.Format` s'exécute ensuite sur le modèle traduit. Un format invalide peut lever `FormatException`. Un `{0}` supprimé peut omettre l'argument. Il n'y a pas de repli sur le modèle source après une erreur de format.

<a id="check-one-language"></a>
### Vérifier une langue

Redémarrez l'application, passez à une langue cible et ouvrez un écran contenant quelques chaînes enveloppées. Utilisez le changement de langue ajouté par l'agent, ou définissez les deux cultures et appelez `I18n.SetLocale` vous-même. Le texte qui est encore dans la langue source n'a pas été enveloppé, a été copié dans un contrôle avant `SetLocale`, ou n'a pas d'entrée dans le JSON de la langue. Vérifiez le JSON pour la phrase avant de suspecter le code.

`SetLocale` parcourt `CultureInfo.Parent` jusqu'à ce qu'un catalogue s'ouvre (`pt-BR` peut charger `pt.json`). Les ressources intégrées sont utilisées lorsque ni `OpenLocale` ni `FlatDirectory` n'est défini. Un `FlatDirectory` configuré ne passe pas au JSON intégré lorsqu'un fichier est manquant.

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` (ou `extract` puis `translate-ui`) après avoir modifié le texte source. Le cache fait que seules les chaînes nouvelles ou modifiées vont au modèle. Exécutez-le dans l'intégration continue pour que les traductions ne dérivent pas. Reconstruisez ou redémarrez l'application après une exécution de traduction pour que le JSON intégré soit pris en compte. `ai-i18n-tools dashboard` ouvre le [Tableau de bord des traductions](/fr/guide/translation-dashboard/) pour réviser les traductions.

Pour rafraîchir un `I18n.cs` copié, créez le même modèle dans un répertoire jetable et copiez uniquement le fichier généré que vous souhaitez remplacer. Ne réexécutez pas `init` dans l'application pour mettre à niveau l'assistant.

Pour traduire `README.md` dans la même exécution, générez avec `--with-readme` (ou ajoutez le bloc à une configuration existante). Consultez [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faire manuellement

Suivez ces étapes si vous préférez effectuer les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Chaque étape correspond à une partie de l'invite. Vous [installez toujours la CLI](#install-and-choose-a-provider), [initialisez le projet](#initialise-the-project) et [traduisez](#choose-models-and-translate) à la fin.

1. [Placer l'assistant et intégrer les catalogues](#step-1-place-the-helper-and-embed-the-catalogs).
2. [Envelopper les chaînes](#step-2-wrap-strings) dans `T()`, `Tn`, `Tp`, `N` ou `{loc:Tr '…'}`.
3. [Vérifier les appels enveloppés](#step-3-check-wrapped-calls) avec `migrate-dotnet-i18n`.
4. [Ajouter un changement de langue](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## Étape 1 : Placer l'assistant et intégrer les catalogues

`init` écrit ceci à la racine du dépôt :

| Fichier | Ce qu'il est | Le modifier ? |
| --- | --- | --- |
| `I18n.cs` | L'assistant que votre code appelle (`T`, `Tn`, `Tp`, `SetLocale`) | Non. Il est généré. `init` ne l'écrasera pas |
| `locales/strings.json` | Le cache d'extraction. L'application ne le lit jamais | Non. `extract` l'écrit |
| `locales/<code>.json` | Les traductions que l'application charge, un fichier par langue | Non. `translate-ui` les écrit |
| `locales/ui-languages.json` | La liste des langues pour l'outil. L'assistant utilise `BuiltInLocales` dans `I18n.cs` | Non. `extract` l'écrit |

Déplacez `I18n.cs` et `locales/` dans le projet d'application. Ajoutez l'intégration à ce `.csproj` et laissez le reste du fichier inchangé :

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

Le chemin d'inclusion est relatif au fichier projet. .NET Framework 4.8 nécessite également le package `System.Text.Json`. .NET 6 ou plus récent l'a déjà.

Mettez à jour la configuration vers le nouvel emplacement, et pointez `sourceRoots` vers le projet d'application afin que les tests et la sortie de build restent en dehors du catalogue :

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

Ajoutez `global using static MyApp.I18n;` (utilisez l'espace de noms affiché dans `I18n.cs`), ou appelez `I18n.T` sur chaque site.

`SourceLocale` dans l'aide doit être égal à `sourceLocale` dans la configuration. `BuiltInLocales`, entre les marqueurs `ai-i18n-tools-locales`, est la liste `init` estampillée. `SupportedLocales` la lit. Après avoir modifié `targetLocales`, mettez à jour ce tableau ou passez un nouveau tableau `Locales` à `I18n.Configure`. Créez un répertoire jetable lorsque vous avez besoin d'une nouvelle aide. Ne réexécutez pas `init` ici.

Confirmez avec `ai-i18n-tools extract`. Le catalogue devrait apparaître dans le nouveau dossier `locales/`. Attendez-vous à 0 chaînes tant que rien n'est encapsulé.

<a id="step-2-wrap-strings"></a>
## Étape 2 : Encapsuler les chaînes

`extract` enregistre une chaîne uniquement lorsqu'il s'agit d'un littéral passé à `T()`, `Tn`, `Tp`, `N` ou `{loc:Tr '…'}`. Un récepteur tel que `I18n.T` correspond car le dernier nom est `T`.

Recherchez d'abord l'entrée du catalogue, puis passez le résultat à `string.Format` :

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

Ceux-ci sont extraits puis rejetés, car le catalogue ne correspondrait pas à ce que le programme recherche :

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` affiche un avertissement pour les trois premiers et s'arrête sur `{name}`. L'[étape suivante](#step-3-check-wrapped-calls) réécrit les trois premiers.

Les espaces réservés restent au format .NET : `{0}`, `{0,-10}`, `{0:C}`. `%` est du texte ordinaire, donc une traduction telle que `10% off` n'est pas un jeton printf. Les accolades doubles (<code v-pre>{{</code> et `}}`) sont des accolades littérales et doivent être copiées telles quelles. Plus de formes d'appel : [Appels qui traduisent](/fr/guide/ui-strings/dotnet#calls-that-translate).

XAML et AXAML :

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

Le préfixe est ignoré. `{Binding}` et `{StaticResource}` sont laissés tels quels. Le texte écrit comme contenu d'élément n'est pas extrait. Un littéral qui contient une apostrophe est écrit avec `&quot;` afin que l'attribut puisse rester entre guillemets doubles.

Avalonia, WPF et MAUI fournissent chacun leur propre classe de base `MarkupExtension`. Une forme, dans le projet d'application :

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

Les phrases formatées restent en C# (`T("Saved to {0}", path)`), ce qui maintient l'extracteur sur un seul littéral. Le même appel fonctionne à partir d'un modèle de vue, d'une info-bulle de barre d'état système et d'un dialogue.

Une valeur qui est à la fois stockée et affichée conserve la valeur stockée dans la langue source. Traduisez la légende lorsque le contrôle est construit. `N("Last 12 months")` existe afin qu'un champ statique puisse contenir un littéral que l'extracteur voit. `T()` dans un dictionnaire statique s'exécute une fois, lors du premier chargement de type, et reste sur cette langue.

Laissez ceux-ci tels quels : les journaux, les noms de propriétés JSON, les noms de fichiers, `nameof`, les arguments d'attribut, les clés d'objet utilisées comme identificateurs, et le texte d'exception que le programme fait correspondre plutôt que d'afficher.

Exécutez `ai-i18n-tools extract` à nouveau. Le catalogue devrait maintenant lister les phrases que vous avez enveloppées.

<a id="step-3-check-wrapped-calls"></a>
## Étape 3 : Vérifier les appels encapsulés

Utilisez cette étape lorsqu'un appel formate la chaîne avant la recherche dans le catalogue :

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` les réécrit en une recherche qui se produit en premier. Une deuxième exécution ne change rien.

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

La commande est une exécution à blanc tant que vous ne passez pas `--write`. Elle écrit `migrate-dotnet-i18n-report.md`. Lisez ce rapport. Lorsque les modifications semblent correctes :

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Exécutez à nouveau l'exécution à blanc. Arrêtez-vous lorsqu'il n'y a plus de modifications, puis exécutez les tests du projet. Les lignes laissées en place (`await`, une chaîne brute interpolée brute, un trou conditionnel, `ref` ou `out`, une concaténation sans littéral, un `IFormatProvider` passé à `string.Format`) sont corrigées à la main. Une phrase qui ressemble à un pluriel appartient à `Tn`. Le `I18n.cs` généré est ignoré. Supprimez le rapport ou ignorez-le avec git.

`--wrap` marque également les attributs XAML non marqués `Text`, `Header`, `Content` et les autres attributs d'étiquette comme `{loc:Tr '…'}`, ainsi que les affectations C# dont le nom se termine par `Text`, `Title` ou `Message`, et `MessageBox.Show`. Sans `--write`, il s'agit d'un audit. Il ne modifie pas les journaux, les attributs, `nameof`, les comparaisons ou les appels `Path`.

Un rapport sans modifications signifie que les appels encapsulés sont sûrs. Cela ne signifie pas que chaque phrase destinée à l'utilisateur a été encapsulée. Les étiquettes nues, les chaînes renvoyées et le contenu des éléments lui sont invisibles. Détails : [Réécrire les appels non sûrs](/fr/guide/ui-strings/dotnet#migrate).

<a id="step-4-add-a-language-switch"></a>
## Étape 4 : Ajouter un sélecteur de langue

Définissez les cultures avant `SetLocale`, car `LocaleChanged` se déclenche à l'intérieur de cet appel :

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

Créez les options à partir de `I18n.SupportedLocales`. Chaque ligne contient `Code`, `NativeName` et `EnglishName`. Étiquetez le contrôle avec `T("Language")`. Persistez le choix et restaurez-le au démarrage, avant le premier `T`. Sur `LocaleChanged`, déclenchez `PropertyChanged` pour les chaînes du modèle-vue, ou reconstruisez les contrôles qui ont copié leur texte. Lorsque le framework a une direction de flux, définissez-la à partir de `I18n.IsRightToLeft(code)`.

Un programme console n'a pas de widget. Ajoutez `--lang <code>` (et `-L` lorsque ce nom est libre). Acceptez uniquement les codes listés dans `SupportedLocales`. Ne lisez pas `AI_I18N_LANG`. Cette variable est uniquement destinée à l'interface de ligne de commande ai-i18n-tools.

Ignorez cette étape lorsque le programme n'affiche aucun texte lisible par une personne.

Le catalogue et les paramètres régionaux actuels sont statiques. C'est sûr pour un processus de bureau. Ce n'est pas un paramètre régional par requête pour un serveur multi-utilisateur. Gardez `IStringLocalizer` ou `ResourceManager` là, et suivez [Ajouter l'i18n à une application .NET ResourceManager](/fr/guide/add-i18n-to-dotnet-resourcemanager). La définition de `CurrentUICulture` ne donne pas à chaque requête sa propre carte.

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#choose-models-and-translate).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Votre code aujourd'hui | Lire |
| --- | --- |
| `ResourceManager`, satellites `.resx`, ou ASP.NET `IStringLocalizer` | [Ajouter l'i18n à une application .NET ResourceManager](/fr/guide/add-i18n-to-dotnet-resourcemanager) |
| Déjà `T("…")` avec la phrase en langue source | [Chaînes d'interface utilisateur](/fr/guide/ui-strings/) étapes 2–3, et [.NET applications](/fr/guide/ui-strings/dotnet) |
| Une application JS/TS | [Ajouter l'i18n à une application JS/TS](/fr/guide/add-i18n-to-js) |
| Une application Python | [Ajouter l'i18n à une application Python](/fr/guide/add-i18n-to-python) |
| Catalogues Django, Flask-Babel, ou GNU gettext | [Ajouter l'i18n à une application Django / Python gettext](/fr/guide/add-i18n-to-django-gettext) |
| Un site web ou un site de documentation | [Ajouter l'i18n à un site web ou un site de documentation](/fr/guide/add-i18n-to-website) |
| Un fichier README de dépôt ou d'autres fichiers Markdown | [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Exemples

| Exemple | Ce qu'il montre |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | Vérifications xUnit de `I18n.cs` : JSON intégré, repli culturel, `{0}`, pluriels |

Ces répertoires vérifient le helper. Ce ne sont pas des applications à traduire, et elles n'ont pas besoin de clé API. `dotnet test` dans ce répertoire exécute les vérifications. Une vraie application commence à partir de `init` sur cette page.
