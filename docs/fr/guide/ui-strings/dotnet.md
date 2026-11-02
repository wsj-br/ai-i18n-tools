<a id="net-applications"></a>
# Applications .NET

`ai-i18n-tools` extrait les chaînes d'interface utilisateur de C#, Razor, cshtml, XAML et AXAML, puis écrit un JSON plat dont les clés sont les chaînes de la langue source. `sourceLocale` peut être n'importe quelle langue. La fonction d'aide à l'exécution est `I18n.cs` (.NET 6 ou version ultérieure, sans packages NuGet). Les applications Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor et les applications console appellent cette fonction d'aide. .NET Framework 4.8 nécessite le package `System.Text.Json` avant que le fichier ne puisse être compilé.

Ajout de locales à une application existante en une seule langue : [Ajouter l'i18n à une application .NET](/fr/guide/add-i18n-to-dotnet).

Les copies exécutables se trouvent dans `examples/dotnet-console` et `examples/dotnet-resx`. Ce sont des projets xUnit, pas des applications à traduire. L'archive de publication `ai-i18n-tools-dotnet-examples.zip` contient ces deux répertoires et `assets/dotnet`, que les projets compilent. Le tarball npm et l'exécutable autonome ne l'incluent pas. Les versions publiées avant ce zip ne l'incluent pas.

<a id="scaffold"></a>
## Génération

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` écrit `ai-i18n-tools.config.json` et, lorsque `I18n.cs` est manquant, copie [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) dans le projet. `--namespace` définit l'espace de noms C#. Lorsqu'il est omis et que le répertoire contient un `.csproj`, `init` utilise le `RootNamespace` de ce fichier, ou le nom du fichier projet. Sinon, l'espace de noms est `AiI18n`.

`init` ne modifie pas le fichier projet. Ajoutez le JSON de la locale à l'assembly :

```xml
<EmbeddedResource Include="locales/*.json" />
```

L'analyse ignore les répertoires nommés `bin`, `obj`, `.vs`, `TestResults` et `packages`. Le modèle définit également `uiExtractor.exclude` sur `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**` et `**/TrExtension.cs`.

<a id="calls-that-translate"></a>
## Appels de traduction

Recherchez d'abord l'entrée du catalogue, puis passez le résultat à `string.Format`. Les noms par défaut sont `T`, `Tn`, `Tp`, `N`, `Tr` et `Loc`. Un récepteur tel que `I18n.T` correspond car le dernier nom est `T`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` renvoie son argument et n'est là que pour qu'un champ statique, une étiquette d'énumération ou un attribut puisse contenir un littéral que l'extracteur peut voir. Affichez-le plus tard avec `T(label)`.

`Tn` traite `{0}` comme le nombre. Des arguments supplémentaires le suivent (`{1}`, `{2}`). Le singulier peut écrire ce nombre comme un littéral (`1 sample`) tandis que le pluriel conserve `{0}`. La traduction conserve `{0}` sur les catégories plurielles et laisse le nombre littéral au singulier.

`Tp` stocke le contexte et la chaîne source sous une seule clé (contexte, U+0004, source), le même séparateur que le JSON plat utilise déjà. Utilisez-le lorsque le même mot court a des significations différentes (`Open` la fenêtre et `Open` le fichier).

XAML et AXAML utilisent une extension de balisage dont le nom de type est dans `funcNames`. Le préfixe est ignoré :

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}` et `{x:Static}` ne sont pas extraits. Le texte écrit comme contenu d'élément (`<TextBlock>Hello</TextBlock>`) n'est pas extrait. Un littéral qui contient une apostrophe est écrit avec l'argument dans `&quot;` afin que l'attribut XML puisse rester entre guillemets doubles : `Content="{loc:Tr &quot;Don't&quot;}"`.

Ceux-ci sont extraits puis rejetés, car le catalogue ne correspondrait pas à ce que le programme recherche :

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

Passez un littéral, et utilisez `{0}` plutôt que `{name}`. `string.Format` lève une exception sur un élément nommé. `extract` affiche un avertissement pour les trois premiers et s'arrête sur `{name}`.

Un littéral avec des espaces de début ou de fin est toujours catalogué. `I18n.T` supprime les espaces de la clé, la recherche et replace ces espaces sur le résultat. Préférez `T("Updated: {0}", value)` pour que les traducteurs voient le séparateur.

<a id="placeholders"></a>
## Espaces réservés

`ui-dotnet` définit `uiExtractor.placeholderStyle` à `dotnet`. Ce style conserve `{0}`, `{0,-10}`, `{0:C}` et `{0,-10:C}`. `%` est du texte ordinaire, donc une traduction telle que `10% e 20%` n'est pas traitée comme un jeton printf. Les accolades doubles (<code v-pre>{{</code> et `}}`) sont des accolades littérales et doivent être copiées telles quelles. `{name}` est une erreur au moment de l'extraction.

Le style par défaut, utilisé par JavaScript et Python, reste inchangé.

<a id="runtime"></a>
## Exécution

`I18n.SetLocale("pt-BR")` parcourt `CultureInfo.Parent` jusqu'à l'ouverture d'un catalogue. `OpenLocale` est utilisé lorsqu'il est défini. Sinon, un `FlatDirectory` configuré est la seule source : un fichier manquant à cet endroit ne se rabat pas sur le JSON intégré. Les ressources intégrées ne sont utilisées que si ni `OpenLocale` ni `FlatDirectory` n'est défini. Une clé manquante renvoie la chaîne source. `I18n.Strict = true` lève une exception à la place, ce qui est utile dans les tests. `string.Format` est appelée sur le modèle traduit. Un format invalide peut lever `FormatException`. Un `{0}` omis peut omettre l'argument. Il n'y a pas de retour au modèle source après une erreur de format.

`I18n.SupportedLocales` commence comme la liste estampillée à l'initialisation (`BuiltInLocales` : nom natif et nom anglais). Le menu de langue ne lit pas cet estampillage. Avant le premier `T()`, recherchez vers le haut à partir de `AppContext.BaseDirectory`, puis à partir du répertoire actuel, au maximum 8 répertoires chacun, pour `locales/ui-languages.json`. Le premier fichier l'emporte. Mappez `code`, `label` et `englishName` à `LocaleInfo` (`label` est le nom natif) et transmettez-les à `Configure` en tant que `Locales`, avec `FlatDirectory` défini sur ce répertoire `locales` dans le même appel. Chaque appel `Configure` remplace `Strict`, `FlatDirectory` et `OpenLocale`. Un appel ultérieur qui ne définit que `Locales` efface `FlatDirectory`. Un tableau `Locales` nul laisse la liste actuelle en place et ne restaure pas `BuiltInLocales`. Si le manifeste est manquant, passez une liste à un élément pour la langue source et ne définissez pas `FlatDirectory`. Le menu est alors uniquement en langue source, et les catalogues restent intégrés. Le développement lit les fichiers que `sync` vient d'écrire. Un programme d'installation qui devrait suivre `sync` livre `ui-languages.json` et le JSON de locale à côté de l'application.

`I18n.IsRightToLeft` lit `CultureInfo.TextInfo`. L'application définit elle-même `CultureInfo.CurrentUICulture` et `CultureInfo.CurrentCulture`, et persiste le code de locale. `string.Format` utilise la culture d'interface utilisateur actuelle, donc `{0:C}` suit cette culture.

`LocaleChanged` se déclenche à l'intérieur de `SetLocale`. Définissez d'abord `CurrentUICulture` et `CurrentCulture` afin qu'un gestionnaire d'actualisation formate avec la nouvelle culture. Les propriétés du modèle de vue qui appellent `T` doivent déclencher `PropertyChanged` à partir de cet événement. Pour Avalonia, WPF et MAUI, l'extension de balisage renvoie `I18n.T(Text)` et définit à nouveau cette propriété sur `LocaleChanged`, puis se désabonne lorsque le contrôle quitte l'arborescence visuelle. Le catalogue et la locale actuelle sont statiques. C'est sûr pour un processus de bureau. Ce n'est pas une locale par requête pour un serveur multi-utilisateur. Gardez `IStringLocalizer` ou `ResourceManager` là. Définir `CurrentUICulture` ne donne pas à chaque requête sa propre carte.

Pour actualiser un helper copié, générez le même modèle dans un répertoire temporaire et copiez uniquement le fichier généré que vous avez l'intention de remplacer. Ne réexécutez pas `init` dans l'application pour mettre à niveau le helper.

Le fichier commence par `ai-i18n-tools-i18n-cs:`, donc `extract` l'ignore.

<a id="desktop-recipe"></a>
## Recette pour applications de bureau

Avalonia, WPF et MAUI ont chacun leur propre classe de base d'extension de balisage. L'aide ne référence pas ces assemblages. `ProvideValue` renvoie `I18n.T(Text)` et définit à nouveau cette propriété sur `LocaleChanged`. Désabonnez-vous lorsque le contrôle quitte l'arborescence visuelle. Ajoutez `**/TrExtension.cs` à `ui.uiExtractor.exclude` afin que `T(Text)` ne soit pas signalé comme non-littéral. Les littéraux XAML sont déjà extraits via `Tr`. `{loc:Tr}` ne peut appeler que `T`. Deux significations d'un mot court sont définies dans le code avec `Tp`.

Une forme Avalonia (`IProvideValueTarget` est dans `Avalonia.Metadata`) :

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

WPF et MAUI utilisent la même idée avec leurs propres types de propriétés. Avalonia uniquement : ignorez `SelectionChanged` à moins que `e.Source` ne soit le contrôle qui possède le gestionnaire. N'affectez pas `ItemsSource` ou `SelectedItem` à l'intérieur de ce gestionnaire, ou à l'intérieur d'un `LocaleChanged` que le `SetLocale` de ce combo a déclenché. Publiez l'actualisation avec `Dispatcher.UIThread.Post`, et protégez le gestionnaire pendant que le code définit `SelectedItem`. Un parent `TabControl` qui affecte à nouveau `ItemsSource` à partir de l'événement propagé fait planter le processus (code de sortie 139, `crash.log` vide).

Les phrases formatées restent en C# (`T("Cursor {0}", value)`), ce qui maintient l'extracteur sur un seul littéral. `StringFormat` sur une liaison est invisible. Le même appel fonctionne à partir d'un modèle de vue, d'une info-bulle de barre d'état système et d'une boîte de dialogue. Une liste déroulante d'énumération conserve l'énumération, renvoie `T("Light")` de sa légende et reconstruit les éléments sur `LocaleChanged`. Un élément de barre d'état système utilise `Tp("tray", "Open")` et un `CommandParameter` stable. Faites correspondre le paramètre, pas l'en-tête. Un service stocke la phrase d'erreur en anglais, et le site d'affichage mappe les phrases connues via `T`. Linux `.desktop` `Name=` et `Comment=` restent dans la langue source. Les jetons de durée qui sont comparés (`2d`, `7h 47m`) restent non traduits. Traduisez `T("now")` et `T("in {0}", duration)` sur le site d'affichage. Un espace de début ou de fin sur un littéral est toujours un avertissement d'extraction. Déplacez-le dans la chaîne de format ou la mise en page. `Tn` peut corriger une phrase source qui était toujours au pluriel (`1 samples`).

<a id="rewrite-unsafe-calls"></a>
## Réécrire les appels non sécurisés

`migrate-dotnet-i18n` est une exécution à blanc jusqu'à ce que vous passiez `--write`. Il réécrit les arguments de `T`, `Tn` et `Tp` qui sont construits avant la recherche :

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

deviennent `T("Saved to {0}", path)`, `T("Last synced {0}", date)` et `T("Hello {0}", name)`. Un nom simple répété reste un seul argument. Un cast tel que `(int)status` conserve son propre index. Le rapport `migrate-dotnet-i18n-report.md` liste tout ce qui reste en place : `await`, une chaîne `$$"""` brute, un trou `? :`, `ref` ou `out`, une concaténation sans littéral, un `IFormatProvider` passé à `string.Format`, et une phrase qui ressemble à un pluriel (`{0} samples` devrait être `Tn`).

`--wrap` marque également les `Text`, `Header`, `Content` XAML non marqués et les autres attributs d'étiquette comme `{loc:Tr '...'}`, ainsi que les affectations C# dont le nom se termine par `Text`, `Title`, `Message` et les autres suffixes à haute confiance, plus `MessageBox.Show` et `ConfirmDialog.Show`. Sans `--write`, c'est un audit. Il ne modifie pas les journaux, les attributs, `nameof`, les comparaisons ou les appels `Path`. Une deuxième exécution ne change rien.

Lorsque `extract` ingère un `.resx` neutre, le même rapport gagne une section Clés de ressources nommées. Une ligne telle que `Resources.LoginButton` est listée comme `T("Sign in")`. Ces lignes sont des suggestions. La commande ne les modifie pas.
