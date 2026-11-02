<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# Ajouter l'i18n à une application .NET ResourceManager

Cette page est destinée à une application .NET qui charge déjà des chaînes avec `ResourceManager` ou ASP.NET `IStringLocalizer`, ou qui le fera. Vous conservez ce chargeur. ai-i18n-tools lit `T("…")` et `{loc:Tr '…'}`, traduit les messages et écrit des satellites `.resx` dont les clés sont ces chaînes source. L'aide est `I18nResx.cs`, copiée par `init -t ui-dotnet-resx`.

Le moyen le plus rapide est de donner à un agent de codage l'invite de cette page. Il configure les ressources, enveloppe vos chaînes, vérifie le résultat et peut ajouter un sélecteur de langue. Vous installez la CLI, choisissez le fournisseur et initialisez le projet vous-même, car cela nécessite votre clé API et vos choix. Vous exécutez également la traduction vous-même, car cela dépense de l'argent sur votre compte et réécrit vos fichiers `.resx`.

Une nouvelle application Avalonia, WPF, MAUI, WinForms ou console sans fichiers de ressources utilise [Ajouter l'i18n à une application .NET](/fr/guide/add-i18n-to-dotnet). Ce chemin ajoute `I18n.cs` et du JSON intégré. Vous ne savez pas lequel s'applique ? Voir [Pas votre cas ?](#not-your-case) à la fin.

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

Vous exécutez ceci une fois, avant l'invite. Il écrit la configuration et `I18nResx.cs`, et il utilise le fournisseur que vous avez choisi ci-dessus.

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

Passez `--namespace` lorsque l'espace de noms du projet n'est pas celui que `init` imprime dans `I18nResx.cs`. Avec un `.csproj` dans le répertoire et aucun `--namespace`, `init` utilise le `RootNamespace` de ce fichier, ou le nom du fichier projet. Sinon, l'espace de noms est `AiI18n`.

Le modèle définit `ui.flatOutput` sur false et `ui.resx` sur :

| Champ | Par défaut |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true, donc `SharedResource.resx` contient le texte source |
| `localeFormat` | `bcp47`, de sorte que le fichier allemand est `SharedResource.de.resx` et le portugais brésilien est `SharedResource.pt-BR.resx` |
| `ingestExistingResx` | true |

`init` écrit `I18nResx.cs` lorsque ce fichier est manquant. `ResourceBaseName` est l'espace de noms, le dossier de sortie et le nom de base joints par des points (`MyApp.Resources.SharedResource`). Le SDK intègre un resx sous ce nom de manifeste lorsque le fichier se trouve dans ce dossier. Si vous déplacez les fichiers, modifiez `ResourceBaseName` en conséquence. `init` ne modifie pas le `.csproj`. Les assemblys satellites sont produits à partir de `*.{culture}.resx` lors de la compilation. Déployez ces satellites à côté de l'application.

Exécutez `init` une fois. Il réécrit `ai-i18n-tools.config.json` à chaque fois, donc une deuxième exécution annule les modifications que vous avez apportées. Si `I18nResx.cs` contient déjà le marqueur `ai-i18n-tools-i18n-cs`, le projet est déjà initialisé : ignorez cette étape. `init` n'écrase pas un helper existant.

Ensuite, modifiez `sourceLocale` et `targetLocales`. `sourceLocale` est la langue des chaînes dans la source. Toute langue BCP-47 est valide ; l'échafaudage utilise `en`. Pointez `ui.resx` vers le dossier et le nom de base que votre application charge déjà (manuellement, c'est l'[Étape 1](#step-1-point-the-config-at-your-resources)). `neutralFile` est le resx neutre qui mappe un ancien nom tel que `LoginButton` à son texte source. S'il est omis, `{outputDir}/{baseName}.resx` est utilisé si ce fichier existe.

Le même bloc `ui` peut également écrire du JSON plat. Remettez `flatOutput` à true. Les deux sorties partagent un seul catalogue. Ce modèle laisse `flatOutput` à false afin que seul `.resx` soit écrit.

Formes d'appel et l'aide JSON : [Applications .NET](/fr/guide/ui-strings/dotnet). Toutes les autres clés de configuration : [Configuration](/fr/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Exécuter l'invite de l'agent

Ouvrez le projet dans votre agent de codage (Cursor, Claude Code, Copilot ou similaire), démarrez une nouvelle conversation et collez l'invite ci-dessous. Le projet doit déjà être initialisé. Il n'y a rien à modifier. Si vous voulez omettre quelque chose, par exemple pas de sélecteur de langue, précisez-le dans le même message.

L'agent vérifie d'abord que la CLI, la configuration et `I18nResx.cs` existent, et s'arrête avec des instructions si l'un d'eux est manquant. Ensuite, il travaille en trois parties :

- La partie 1 pointe `ui.resx` vers les catalogues que l'application charge déjà, et vérifie `ResourceBaseName`.
- La partie 2 enveloppe les chaînes visibles par l'utilisateur dans `T()` et `{loc:Tr '…'}`, et applique manuellement les suggestions de clés nommées.
- La partie 3 ajoute un sélecteur de langue qui reste sur `ResourceManager` ou `IStringLocalizer`.

Il n'installe ni n'initialise rien, ne lit pas votre clé API et ne traduit pas. Il ne réécrit pas les fichiers `.resx`. La traduction est l'étape après la révision, et c'est vous qui l'exécutez.

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
  pattern, append only that pattern. Keep the negation so `cache.db` stays
  tracked.
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
## Réviser le résultat

L'agent termine avec un rapport. Vérifiez-le avant de traduire :

- Le diff. Les appels enveloppés, la configuration, `ResourceBaseName` si les fichiers ont été déplacés, et le sélecteur de langue devraient avoir changé. Vos fichiers `.resx` devraient être intacts jusqu'à ce que vous traduisiez.
- `ai-i18n-tools.config.json` : `resx.outputDir` et `baseName` pointent vers les catalogues que votre application charge, et `sourceRoots` couvre le projet d'application.
- `ResourceBaseName` correspond au nom du manifeste que le SDK intégrera.
- `ai-i18n-tools extract` liste les nouveaux messages et conserve les traductions déjà présentes dans les satellites.
- L'exécution à blanc de `migrate-dotnet-i18n` ne liste rien à corriger, à l'exception des suggestions de clés nommées que vous avez choisi de reporter. Ces lignes restent `Resources.LoginButton` jusqu'à ce que vous les modifiiez.
- Vos tests passent et l'application a le même aspect dans la langue source.
- Aucun script jetable ou `migrate-dotnet-i18n-report.md` n'a été laissé.

Validez cet état. `translate-ui` réécrit vos fichiers `.resx`, vous voudrez donc un diff propre à examiner.

<a id="choose-models-and-translate"></a>
## Choisir les modèles et traduire

Vous exécutez cette partie. Elle utilise votre clé API, dépense de l'argent sur votre compte et réécrit vos fichiers `.resx`, alors validez d'abord.

La liste des modèles fournie par `init` constitue un point de départ. Classez les modèles de chat du fournisseur actif et, une fois la sélection finale validée, enregistrez-la dans `translationModels` :

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ne remplace que `translationModels`. Le même classement se trouve dans l'onglet [Modèles](/fr/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Remplissez le glossaire avant le premier `translate-ui`. `init` pointe `glossary.userGlossary` vers `glossary-user.csv` et ne crée pas le fichier. Si le fichier est manquant, exécutez `ai-i18n-tools glossary-generate`, puis ajoutez les termes du domaine. Utilisez **Forcer** pour les noms qui doivent être copiés sans modification.

Ensuite, extrayez et traduisez :

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` écrit le fichier neutre et un satellite par langue cible. Les clés sont les chaînes sources. Le `<comment>` enregistre le contexte et le premier emplacement source. Une modification manuelle dans un satellite n'est conservée que si `extract` l'ingère avant la prochaine traduction, le même contrat que les fichiers `.po`. Laissez les fichiers générés non modifiés à partir de maintenant, car la prochaine exécution les régénérera. Examinez le premier diff avant de le valider.

Les entrées avec un `type` ou `mimetype` (images et autres binaires) sont ignorées. `ResourceManager.GetString` renvoie la valeur neutre lorsque cette culture n'a pas d'entrée.

Reconstruisez pour que le SDK intègre les nouveaux satellites, puis redémarrez l'application.

<a id="check-one-language"></a>
### Vérifier une langue

Passez à une langue cible et ouvrez un écran avec quelques chaînes encapsulées. Le texte qui est toujours dans la langue source n'a pas été encapsulé, utilise toujours une clé nommée qui n'a pas été appliquée, ou le satellite n'a pas été reconstruit. Une traduction qui supprime `{0}` ou le renomme peut lever `FormatException` ou omettre la valeur. `string.Format` ne revient pas au modèle source. Vérifiez le satellite pour cette phrase avant de suspecter le code.

<a id="keep-it-translated"></a>
## Maintenir la traduction

Réexécutez `ai-i18n-tools sync` (ou `extract` puis `translate-ui`) après avoir modifié le texte source. Le cache signifie que seules les chaînes nouvelles ou modifiées sont envoyées au modèle. Exécutez-le en CI afin que les traductions ne dérivent pas. Reconstruisez après une exécution de traduction afin que les satellites soient à nouveau intégrés. `ai-i18n-tools dashboard` ouvre le [Tableau de bord de traduction](/fr/guide/translation-dashboard/) pour examiner les traductions.

`purge-locale` supprime `SharedResource.<culture>.resx` et laisse `SharedResource.resx`.

Pour actualiser un `I18nResx.cs` copié, échafaudez le même modèle dans un répertoire jetable et copiez uniquement le fichier généré que vous avez l'intention de remplacer. Ne réexécutez pas `init` dans l'application pour mettre à niveau l'aide.

Pour traduire `README.md` dans la même exécution, générez avec `--with-readme` (ou ajoutez le bloc à une configuration existante). Consultez [Ajouter l'i18n à vos documents README et Markdown](/fr/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faire manuellement

Suivez ces étapes si vous préférez effectuer les modifications vous-même, ou si vous voulez savoir ce que fait l'invite. Chaque étape correspond à une partie de l'invite. Vous [installez toujours la CLI](#install-and-choose-a-provider), [initialisez le projet](#initialise-the-project) et [traduisez](#choose-models-and-translate) à la fin.

1. [Pointez la configuration vers vos ressources](#step-1-point-the-config-at-your-resources).
2. [Encapsulez les chaînes](#step-2-wrap-strings) dans `T()` ou `{loc:Tr '…'}`.
3. [Appliquez les clés de ressource nommées](#step-3-apply-named-resource-keys).
4. [Changez de langue à l'exécution](#step-4-switch-language-at-runtime).

<a id="step-1-point-the-config-at-your-resources"></a>
## Étape 1 : Pointez la configuration vers vos ressources

Le modèle écrit cette forme. Changez le dossier et le nom de base pour les catalogues que votre application charge déjà :

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

Vérifiez quatre points par rapport à votre projet :

- `outputDir` et `baseName` sont l'endroit où résident déjà le fichier neutre et les satellites. L'allemand est `SharedResource.de.resx`. Le portugais brésilien est `SharedResource.pt-BR.resx` lorsque `localeFormat` est `bcp47`.
- `neutralFile` est défini lorsque ce fichier neutre n'est pas `{outputDir}/{baseName}.resx`. L'ingestion mappe un nom hérité (`LoginButton`) via la valeur neutre (`Sign in`). La valeur allemande `LoginButton` est ensuite stockée sous la chaîne source `Sign in`.
- `ResourceBaseName` dans `I18nResx.cs` est l'espace de noms, le dossier de sortie et le nom de base joints par des points. Déplacez la constante lorsque les fichiers sont déplacés. Laissez le reste de l'aide tel quel.
- `sourceRoots` est le projet d'application, pas `"."`.

Le nom resx d'une chaîne simple est le texte source : `Sign in`, `Saved to {0}`, une valeur qui contient une apostrophe ou une esperluette. Le contexte utilise U+2404 entre le contexte et la source. resx n'a pas de formes plurielles. Chaque forme CLDR est sa propre entrée, nommée `{singular}[{form}]`. `Tn` sélectionne la forme avec les mêmes règles que l'enregistreur `.po`. Vous ne tapez pas le séparateur ou le suffixe pluriel.

Confirmez avec `ai-i18n-tools extract`. Le catalogue devrait lister les chaînes ingérées à partir du fichier neutre.

<a id="step-2-wrap-strings"></a>
## Étape 2 : Encapsuler les chaînes

`extract` enregistre une chaîne uniquement lorsqu'il s'agit d'un littéral passé à `T()`, `Tn`, `Tp`, `N` ou `{loc:Tr '…'}`. Les mêmes formes que l'[aide JSON](/fr/guide/add-i18n-to-dotnet#step-2-wrap-strings) s'appliquent. Les espaces réservés sont `{0}`, pas `{name}`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` recherche le nom que vous lui passez et renvoie ce nom si la ressource est manquante. Les noms d'extracteurs par défaut sont `T`, `Tn`, `Tp`, `N`, `Tr` et `Loc`. Un appel tel que `_localizer["Sign in"]` est invisible tant que `_localizer` n'est pas ajouté à `ui.uiExtractor.funcNames`. L'appel de `T("Sign in")` ou `I18nResx.T("Sign in")` ne nécessite aucun nom supplémentaire.

XAML utilise `{loc:Tr '…'}`. Le contenu de l'élément n'est pas extrait. Ne touchez pas à `{Binding}` et `{StaticResource}`.

Laissez les journaux, les clés JSON, les noms de fichiers, `nameof` et le texte d'exception qui n'est pas affiché. Une valeur stockée reste dans la langue source. Traduisez la légende du contrôle.

Les appels non sécurisés (`T($"…")`, la concaténation, `string.Format` à l'intérieur de `T`) font partie du rapport de l'étape suivante, ainsi que les noms hérités tels que `Resources.LoginButton`.

<a id="step-3-apply-named-resource-keys"></a>
## Étape 3 : Appliquer les clés de ressource nommées

`migrate-dotnet-i18n` est une exécution à blanc tant que vous ne passez pas `--write`. Il réécrit les arguments de `T` qui ont été construits avant la recherche, les mêmes modifications que [Vérifier les appels encapsulés](/fr/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls).

Lorsque `extract` a ingéré un `.resx` neutre, le rapport gagne également une section de clés nommées :

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

C'est à vous d'appliquer cette liste. La commande ne modifie pas ces lignes. `--write` non plus. Après avoir modifié un appel à `T("Sign in")`, exécutez `extract` à nouveau.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

Lisez `migrate-dotnet-i18n-report.md`. Lorsque les modifications d'appels non sécurisés semblent correctes :

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Exécutez à nouveau l'exécution à blanc. Arrêtez-vous lorsqu'il ne répertorie aucune modification d'appel non sécurisé. Les clés nommées que vous n'avez pas encore appliquées restent dans la liste de suggestions. Supprimez le rapport ou ignorez-le avec Git. Ne modifiez pas les fichiers `.resx` à cette étape.

<a id="step-4-switch-language-at-runtime"></a>
## Étape 4 : Changer de langue à l'exécution

`T` lit `CultureInfo.CurrentUICulture`. `I18nResx.SetLocale` définit cette culture et `CurrentCulture`, puis déclenche `LocaleChanged`. Le paramètre régional qu'il stocke pour `Tn` est statique, donc un serveur qui gère des requêtes concurrentes ne doit pas utiliser `SetLocale` comme commutateur par utilisateur.

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` est local à la requête. Pointez-le vers le fichier .resx que l'outil écrit. La classe vide n'est que l'argument de type. Le nom de base du manifeste doit correspondre à `ResourceBaseName`.

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

Dans une page Razor ou un service, appelez `T` pour que `extract` voie le littéral. Conservez un `IStringLocalizer<SharedResource>` existant si un site d'appel l'utilise déjà. Ajoutez le nom de ce récepteur à `ui.uiExtractor.funcNames` si la recherche reste sur l'indexeur.

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` n'a pas de paramètre de pluriel ou de contexte. Une extension peut appeler `I18nResx`, qui lit les mêmes satellites. Placez-le dans le projet ASP.NET. `I18nResx.cs` ne référence pas `Microsoft.Extensions.Localization`, donc un projet de console ou de bureau ne prend pas ce package.

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

Choisissez la culture de la requête dans cet ordre : le choix explicite du visiteur (`?lang=` ou une publication de formulaire), le cookie qui s'en souvient, l'en-tête `Accept-Language`, puis le paramètre régional source. Ignorez les codes qui ne sont pas dans `sourceLocale` ou `targetLocales`. `pt-BR` est le nom du satellite. Un en-tête qui envoie `pt-br` doit toujours être mis en correspondance avec ce nom avant d'affecter `CurrentUICulture`.

<a id="desktop-and-console"></a>
### Bureau et console

Restaurez la culture enregistrée avant la construction de la fenêtre, appelez `I18nResx.SetLocale` et actualisez le texte visible à partir de `LocaleChanged`. Construisez le menu à partir de `sourceLocale` et `targetLocales`. Étiquetez-le `T("Language")`. La direction du flux provient de `CultureInfo.TextInfo.IsRightToLeft`. Il n'y a pas de liste `SupportedLocales` sur cet assistant.

Un programme console n'a pas de widget. Ajoutez `--lang <code>` (et `-L` si ce nom est libre), puis appelez `SetLocale` avant le premier `T`. Ne lisez pas `AI_I18N_LANG`.

Ignorez cette étape lorsque le programme n'affiche aucun texte lisible par une personne.

C'est la dernière étape manuelle. Continuez à [Choisir les modèles et traduire](#choose-models-and-translate).

<a id="not-your-case"></a>
## Ce n'est pas votre cas ?

| Votre code aujourd'hui | Lire |
| --- | --- |
| Pas de `.resx` et pas de `IStringLocalizer` encore | [Ajouter l'i18n à une application .NET](/fr/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | Vérifications xUnit de `I18nResx.cs` : clés de chaînes source, guillemets, contexte, pluriels, satellites réels |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | L'assistant JSON, pour une application qui n'est pas sur `ResourceManager` |

Ces répertoires vérifient les helpers. Ce ne sont pas des applications à traduire, et elles n'ont pas besoin de clé API. `dotnet test` dans `dotnet-resx` exécute les vérifications satellites. Une véritable application commence à partir de `init` sur cette page. Copiez-en une avec `npx degit`, ou téléchargez `ai-i18n-tools-dotnet-examples.zip` depuis la Release GitHub. Ce fichier zip contient également `assets/dotnet`, que le projet compile. Commandes : [Exemples](/fr/examples#net-examples).
