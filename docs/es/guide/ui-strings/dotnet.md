<a id="net-applications"></a>
# Aplicaciones .NET

`ai-i18n-tools` extrae cadenas de la interfaz de usuario de C#, Razor, cshtml, XAML y AXAML, luego escribe JSON plano con claves basadas en la cadena del idioma de origen. `sourceLocale` puede ser cualquier idioma. El asistente en tiempo de ejecución es `I18n.cs` (.NET 6 o posterior, sin paquetes NuGet). Las aplicaciones Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor y de consola llaman a ese asistente. .NET Framework 4.8 necesita el paquete `System.Text.Json` antes de que el archivo compile.

Agregar localizaciones a una aplicación existente de un solo idioma: [Agregar i18n a una aplicación .NET](/es/guide/add-i18n-to-dotnet).

Las copias ejecutables residen en `examples/dotnet-console` y `examples/dotnet-resx`. Son proyectos xUnit, no aplicaciones para traducir. El archivo de lanzamiento `ai-i18n-tools-dotnet-examples.zip` contiene esos dos directorios y `assets/dotnet`, que los proyectos compilan. El tarball de npm y el ejecutable independiente no lo hacen. Las versiones publicadas antes de ese zip no lo incluyen.

<a id="scaffold"></a>
## Generador

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` escribe `ai-i18n-tools.config.json` y, cuando falta `I18n.cs`, copia [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) en el proyecto. `--namespace` establece el espacio de nombres de C#. Cuando se omite y el directorio contiene un `.csproj`, `init` usa el `RootNamespace` de ese archivo o el nombre del archivo del proyecto. De lo contrario, el espacio de nombres es `AiI18n`.

`init` no edita el archivo del proyecto. Agregue el JSON de localización al ensamblado:

```xml
<EmbeddedResource Include="locales/*.json" />
```

El escaneo omite los directorios llamados `bin`, `obj`, `.vs`, `TestResults` y `packages`. La plantilla también establece `uiExtractor.exclude` en `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**` y `**/TrExtension.cs`.

<a id="calls-that-translate"></a>
## Llamadas que se traducen

Busque primero la entrada del catálogo, luego pase el resultado a `string.Format`. Los nombres predeterminados son `T`, `Tn`, `Tp`, `N`, `Tr` y `Loc`. Un receptor como `I18n.T` coincide porque el último nombre es `T`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` devuelve su argumento y solo está ahí para que un campo estático, una etiqueta de enumeración o un atributo puedan contener un literal que el extractor pueda ver. Muéstrelo más tarde con `T(label)`.

`Tn` trata `{0}` como el conteo. Argumentos adicionales lo siguen (`{1}`, `{2}`). El singular puede escribir ese conteo como un literal (`1 sample`) mientras que el plural mantiene `{0}`. La traducción mantiene `{0}` en las categorías plurales y deja el número literal en el singular.

`Tp` almacena el contexto y la cadena de origen bajo una clave (contexto, U+0004, origen), el mismo separador que ya usa el JSON plano. Úselo cuando la misma palabra corta signifique cosas diferentes (`Open` la ventana y `Open` el archivo).

XAML y AXAML usan una extensión de marcado cuyo nombre de tipo está en `funcNames`. El prefijo se ignora:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}` y `{x:Static}` no se extraen. El texto escrito como contenido de elemento (`<TextBlock>Hello</TextBlock>`) no se extrae. Un literal que contiene un apóstrofo se escribe con el argumento en `&quot;` para que el atributo XML pueda permanecer entre comillas dobles: `Content="{loc:Tr &quot;Don't&quot;}"`.

Estos se extraen y luego se rechazan, porque el catálogo no coincidiría con lo que el programa busca:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

Pase un literal y use `{0}` en lugar de `{name}`. `string.Format` lanza una excepción en un elemento con nombre. `extract` imprime una advertencia para los tres primeros y se detiene en `{name}`.

Un literal con espacios en blanco iniciales o finales todavía se cataloga. `I18n.T` recorta la clave, la busca y vuelve a colocar esos espacios en blanco en el resultado. Prefiera `T("Updated: {0}", value)` para que los traductores vean el separador.

<a id="placeholders"></a>
## Marcadores de posición

`ui-dotnet` establece `uiExtractor.placeholderStyle` en `dotnet`. Ese estilo mantiene `{0}`, `{0,-10}`, `{0:C}` y `{0,-10:C}`. `%` es texto ordinario, por lo que una traducción como `10% e 20%` no se trata como un token printf. Las llaves dobles (<code v-pre>{{</code> y `}}`) son llaves literales y deben copiarse sin cambios. `{name}` es un error en el momento de la extracción.

El estilo predeterminado, utilizado por JavaScript y Python, no se modifica.

<a id="runtime"></a>
## Tiempo de ejecución

`I18n.SetLocale("pt-BR")` recorre `CultureInfo.Parent` hasta que se abre un catálogo. `OpenLocale` se usa cuando está establecido. De lo contrario, un `FlatDirectory` configurado es la única fuente: un archivo faltante allí no recurre al JSON incrustado. Los recursos incrustados se usan solo cuando ni `OpenLocale` ni `FlatDirectory` están establecidos. Una clave faltante devuelve la cadena de origen. `I18n.Strict = true` lanza una excepción en su lugar, lo cual es útil en pruebas. `string.Format` se invoca en la plantilla traducida. Un formato no válido puede lanzar `FormatException`. Un `{0}` omitido puede prescindir del argumento. No hay recurso a la plantilla de origen después de un error de formato.

`I18n.SupportedLocales` comienza como la lista marcada en la inicialización (`BuiltInLocales`: nombre nativo y nombre en inglés). El menú de idioma no lee esa marca. Antes del primer `T()`, busca hacia arriba desde `AppContext.BaseDirectory`, luego desde el directorio actual, como máximo 8 directorios cada uno, para `locales/ui-languages.json`. El primer archivo es el que prevalece. Asigna `code`, `label` y `englishName` a `LocaleInfo` (`label` es el nombre nativo) y pásalos a `Configure` como `Locales`, con `FlatDirectory` establecido en ese directorio `locales` en la misma llamada. Cada llamada a `Configure` reemplaza `Strict`, `FlatDirectory` y `OpenLocale`. Una llamada posterior que solo establece `Locales` borra `FlatDirectory`. Una matriz `Locales` nula deja la lista actual en su lugar y no restaura `BuiltInLocales`. Si falta el manifiesto, pasa una lista de un elemento para el idioma de origen y no establezcas `FlatDirectory`. El menú es entonces solo el idioma de origen, y los catálogos permanecen incrustados. El desarrollo lee los archivos que `sync` acaba de escribir. Un instalador que debe seguir `sync` envía `ui-languages.json` y el JSON de la configuración regional junto a la aplicación.

`I18n.IsRightToLeft` lee `CultureInfo.TextInfo`. La aplicación establece `CultureInfo.CurrentUICulture` y `CultureInfo.CurrentCulture` por sí misma, y persiste el código de configuración regional. `string.Format` utiliza la cultura de interfaz de usuario actual, por lo que `{0:C}` sigue esa cultura.

`LocaleChanged` se activa dentro de `SetLocale`. Establece `CurrentUICulture` y `CurrentCulture` primero para que un controlador de actualización formatee con la nueva cultura. Las propiedades del modelo de vista que llaman a `T` deben generar `PropertyChanged` desde ese evento. Para Avalonia, WPF y MAUI, la extensión de marcado devuelve `I18n.T(Text)` y vuelve a establecer esa propiedad en `LocaleChanged`, luego se desuscribe cuando el control sale del árbol visual. El catálogo y la configuración regional actual son estáticos. Eso es seguro para un proceso de escritorio. No es una configuración regional por solicitud para un servidor multiusuario. Mantén `IStringLocalizer` o `ResourceManager` allí. Establecer `CurrentUICulture` no le da a cada solicitud su propio mapa.

Para actualizar un ayudante copiado, genere la misma plantilla en un directorio desechable y copie solo el archivo generado que desea reemplazar. No vuelva a ejecutar `init` en la aplicación para actualizar el ayudante.

El archivo comienza con `ai-i18n-tools-i18n-cs:`, por lo que `extract` lo omite.

<a id="desktop-recipe"></a>
## Receta de escritorio

Avalonia, WPF y MAUI tienen cada uno su propia clase base de extensión de marcado. El asistente no hace referencia a esos ensamblados. `ProvideValue` devuelve `I18n.T(Text)` y vuelve a establecer esa propiedad en `LocaleChanged`. Anula la suscripción cuando el control sale del árbol visual. Agrega `**/TrExtension.cs` a `ui.uiExtractor.exclude` para que `T(Text)` no se informe como no literal. Los literales XAML ya se extraen a través de `Tr`. `{loc:Tr}` solo puede llamar a `T`. Dos significados de una palabra corta se establecen en el código con `Tp`.

Una forma de Avalonia (`IProvideValueTarget` está en `Avalonia.Metadata`):

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

WPF y MAUI utilizan la misma idea con sus propios tipos de propiedad. Solo Avalonia: ignora `SelectionChanged` a menos que `e.Source` sea el control propietario del controlador. No asignes `ItemsSource` o `SelectedItem` dentro de ese controlador, o dentro de un `LocaleChanged` que haya generado el `SetLocale` de este combo. Publica la actualización con `Dispatcher.UIThread.Post` y protege el controlador mientras el código establece `SelectedItem`. Un `TabControl` padre que asigna `ItemsSource` de nuevo desde el evento burbujeado bloquea el proceso (código de salida 139, `crash.log` vacío).

Las oraciones formateadas permanecen en C# (`T("Cursor {0}", value)`), lo que mantiene el extractor en un solo literal. `StringFormat` en un enlace es invisible. La misma llamada funciona desde un modelo de vista, una información sobre herramientas de la bandeja y un cuadro de diálogo. Un combo de enumeración mantiene la enumeración, devuelve `T("Light")` de su título y reconstruye los elementos en `LocaleChanged`. Un elemento de la bandeja utiliza `Tp("tray", "Open")` y un `CommandParameter` estable. Coincide con el parámetro, no con el encabezado. Un servicio almacena la oración de error en inglés, y el sitio de visualización mapea las oraciones conocidas a través de `T`. Linux `.desktop` `Name=` y `Comment=` permanecen en el idioma de origen. Los tokens de duración que se comparan (`2d`, `7h 47m`) permanecen sin traducir. Traduce `T("now")` y `T("in {0}", duration)` en el sitio de visualización. Un espacio inicial o final en un literal sigue siendo una advertencia de extracción. Muévelo a la cadena de formato o al diseño. `Tn` puede corregir una oración de origen que siempre fue plural (`1 samples`).

<a id="rewrite-unsafe-calls"></a>
## Reescribir llamadas inseguras

`migrate-dotnet-i18n` es una ejecución de prueba hasta que pase `--write`. Reescribe los argumentos de `T`, `Tn` y `Tp` que se construyen antes de la búsqueda:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

se convierten en `T("Saved to {0}", path)`, `T("Last synced {0}", date)` y `T("Hello {0}", name)`. Un nombre simple repetido permanece como un solo argumento. Una conversión como `(int)status` mantiene su propio índice. El informe `migrate-dotnet-i18n-report.md` enumera todo lo que queda en su lugar: `await`, una cadena `$$"""` sin procesar, un hueco `? :`, `ref` o `out`, una concatenación sin literal, un `IFormatProvider` pasado a `string.Format` y una frase que parece un plural (`{0} samples` debería ser `Tn`).

`--wrap` también marca los atributos de etiqueta XAML sin marcar `Text`, `Header`, `Content` y los demás como `{loc:Tr '...'}`, y las asignaciones de C# cuyo nombre termina en `Text`, `Title`, `Message` y los otros sufijos de alta confianza, además de `MessageBox.Show` y `ConfirmDialog.Show`. Sin `--write`, eso es una auditoría. No edita registros, atributos, `nameof`, comparaciones o llamadas a `Path`. Una segunda ejecución no cambia nada.

Cuando `extract` ingiere un `.resx` neutro, el mismo informe obtiene una sección de claves de recursos con nombre. Una línea como `Resources.LoginButton` se lista como `T("Sign in")`. Esas líneas son sugerencias. El comando no las edita.
