<a id="dotnet-applications"></a>
# Aplicaciones .NET

`ai-i18n-tools` extrae cadenas de la interfaz de usuario de C#, Razor, cshtml, XAML y AXAML, luego escribe JSON plano con claves basadas en la cadena del idioma de origen. `sourceLocale` puede ser cualquier idioma. El asistente en tiempo de ejecución es `I18n.cs` (.NET 6 o posterior, sin paquetes NuGet). Las aplicaciones Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor y de consola llaman a ese asistente. .NET Framework 4.8 necesita el paquete `System.Text.Json` antes de que el archivo compile.

Agregar localizaciones a una aplicación existente de un solo idioma: [Agregar i18n a una aplicación .NET](/es/guide/add-i18n-to-dotnet).

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

El escaneo omite los directorios llamados `bin`, `obj`, `.vs`, `TestResults` y `packages`. La plantilla también establece `uiExtractor.exclude` en `**/bin/**`, `**/obj/**`, `**/Tests/**` y `**/*.Tests/**`.

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

`Tn` trata a `{0}` como el recuento. Los argumentos adicionales lo siguen (`{1}`, `{2}`).

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

`I18n.SupportedLocales` es la lista establecida en la inicialización (nombre nativo y nombre en inglés). `I18n.IsRightToLeft` lee `CultureInfo.TextInfo`. La aplicación establece `CultureInfo.CurrentUICulture` y `CultureInfo.CurrentCulture` por sí misma. `string.Format` utiliza la cultura de interfaz de usuario actual, por lo que `{0:C}` sigue esa cultura.

`LocaleChanged` se dispara dentro de `SetLocale`. Configure `CurrentUICulture` y `CurrentCulture` primero para que un controlador de actualización formatee con la nueva referencia cultural. Las propiedades del modelo de vista que llaman a `T` deberían generar `PropertyChanged` desde ese evento. Una extensión de marcado que devuelve una cadena de texto sin formato se actualiza la próxima vez que se compila la vista. El catálogo y la configuración regional actual son estáticos. Eso es seguro para un proceso de escritorio. No es una configuración regional por solicitud para un servidor multiusuario. Mantenga `IStringLocalizer` o `ResourceManager` allí. Establecer `CurrentUICulture` no proporciona a cada solicitud su propio mapa.

Para actualizar un ayudante copiado, genere la misma plantilla en un directorio desechable y copie solo el archivo generado que desea reemplazar. No vuelva a ejecutar `init` en la aplicación para actualizar el ayudante.

El archivo comienza con `ai-i18n-tools-i18n-cs:`, por lo que `extract` lo omite.

<a id="desktop-recipe"></a>
## Receta de escritorio

Avalonia, WPF y MAUI tienen cada uno su propia clase base de extensión de marcado. El asistente no hace referencia a esos ensamblados. Una forma de Avalonia:

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

Las frases formateadas permanecen en C# (`T("Cursor {0}", value)`), lo que mantiene el extractor en un solo literal. La misma llamada funciona desde un modelo de vista, una información sobre herramientas de la bandeja y un cuadro de diálogo.

<a id="migrate"></a>
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
