<a id="dotnet-applications"></a>
# Aplicativos .NET

`ai-i18n-tools` extrai strings de UI de C#, Razor, cshtml, XAML e AXAML, e então escreve JSON plano com chaves baseadas na string do idioma de origem. `sourceLocale` pode ser qualquer idioma. O helper de runtime é `I18n.cs` (.NET 6 ou mais recente, sem pacotes NuGet). Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor e aplicativos de console chamam esse helper. O .NET Framework 4.8 precisa do pacote `System.Text.Json` antes que o arquivo compile.

Adicionando localidades a um aplicativo existente de idioma único: [Adicionar i18n a um aplicativo .NET](/pt-BR/guide/add-i18n-to-dotnet).

<a id="scaffold"></a>
## Scaffold

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet` escreve `ai-i18n-tools.config.json` e, quando `I18n.cs` está faltando, copia [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs) para o projeto. `--namespace` define o namespace C#. Quando é omitido e o diretório contém um `.csproj`, `init` usa o `RootNamespace` desse arquivo, ou o nome do arquivo do projeto. Caso contrário, o namespace é `AiI18n`.

`init` não edita o arquivo de projeto. Adicione o JSON de localidade ao assembly:

```xml
<EmbeddedResource Include="locales/*.json" />
```

A varredura ignora os diretórios nomeados `bin`, `obj`, `.vs`, `TestResults`, e `packages`. O modelo também define `uiExtractor.exclude` para `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**`, e `**/TrExtension.cs`.

<a id="calls-that-translate"></a>
## Chamadas que traduzem

Procure a entrada do catálogo primeiro, então passe o resultado para `string.Format`. Os nomes padrão são `T`, `Tn`, `Tp`, `N`, `Tr` e `Loc`. Um receptor como `I18n.T` corresponde porque o último nome é `T`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N` retorna seu argumento e está lá apenas para que um campo estático, rótulo de enumeração ou atributo possa conter um literal que o extrator possa ver. Mostre-o mais tarde com `T(label)`.

`Tn` trata `{0}` como o número. Argumentos extras o seguem (`{1}`, `{2}`). O singular pode escrever esse número como um literal (`1 sample`), enquanto o plural mantém `{0}`. A tradução mantém `{0}` nas categorias de plural e deixa o número literal no singular.

`Tp` armazena o contexto e a string de origem sob uma chave (contexto, U+0004, origem), o mesmo separador que o JSON plano já usa. Use-o quando a mesma palavra curta significa coisas diferentes (`Open` a janela e `Open` o arquivo).

XAML e AXAML usam uma extensão de marcação cujo nome de tipo está em `funcNames`. O prefixo é ignorado:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}` e `{x:Static}` não são extraídos. Texto escrito como conteúdo de elemento (`<TextBlock>Hello</TextBlock>`) não é extraído. Um literal que contém um apóstrofo é escrito com o argumento em `&quot;` para que o atributo XML possa permanecer entre aspas duplas: `Content="{loc:Tr &quot;Don't&quot;}"`.

Estes são extraídos e então rejeitados, porque o catálogo não corresponderia ao que o programa procura:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

Passe um literal, e use `{0}` em vez de `{name}`. `string.Format` lança uma exceção em um item nomeado. `extract` imprime um aviso para os três primeiros e para em `{name}`.

Um literal com espaços em branco iniciais ou finais ainda é catalogado. `I18n.T` remove os espaços em branco da chave, a procura e recoloca esses espaços em branco no resultado. Prefira `T("Updated: {0}", value)` para que os tradutores vejam o separador.

<a id="placeholders"></a>
## Espaços Reservados

`ui-dotnet` define `uiExtractor.placeholderStyle` como `dotnet`. Esse estilo mantém `{0}`, `{0,-10}`, `{0:C}` e `{0,-10:C}`. `%` é texto comum, então uma tradução como `10% e 20%` não é tratada como um token printf. Chaves duplas (<code v-pre>{{</code> e `}}`) são chaves literais e devem ser copiadas sem alterações. `{name}` é um erro no momento da extração.

O estilo padrão, usado por JavaScript e Python, permanece inalterado.

<a id="runtime"></a>
## Runtime

`I18n.SetLocale("pt-BR")` percorre `CultureInfo.Parent` até que um catálogo seja aberto. `OpenLocale` é usado quando definido. Caso contrário, um `FlatDirectory` configurado é a única fonte: um arquivo ausente lá não recorre ao JSON incorporado. Recursos incorporados são usados apenas quando nem `OpenLocale` nem `FlatDirectory` estão definidos. Uma chave ausente retorna a string de origem. `I18n.Strict = true` lança uma exceção em vez disso, o que é útil em testes. `string.Format` é chamado no modelo traduzido. Um formato inválido pode lançar `FormatException`. Um `{0}` descartado pode omitir o argumento. Não há fallback para o modelo de origem após um erro de formato.

`I18n.SupportedLocales` começa como a lista carimbada na inicialização (`BuiltInLocales`: nome nativo e nome em inglês). O menu de idioma não lê esse carimbo. Antes do primeiro `T()`, procure para cima a partir de `AppContext.BaseDirectory`, depois a partir do diretório atual, no máximo 8 diretórios cada, por `locales/ui-languages.json`. O primeiro arquivo vence. Mapeie `code`, `label`, e `englishName` para `LocaleInfo` (`label` é o nome nativo) e passe-os para `Configure` como `Locales`, com `FlatDirectory` definido para esse diretório `locales` na mesma chamada. Cada chamada de `Configure` substitui `Strict`, `FlatDirectory`, e `OpenLocale`. Uma chamada posterior que apenas define `Locales` limpa `FlatDirectory`. Um array `Locales` nulo mantém a lista atual no lugar e não restaura `BuiltInLocales`. Se o manifesto estiver ausente, passe uma lista de um elemento para o idioma de origem e não defina `FlatDirectory`. O menu é então apenas o idioma de origem, e os catálogos permanecem incorporados. O desenvolvimento lê os arquivos que `sync` acabou de escrever. Um instalador que deve seguir `sync` envia `ui-languages.json` e o JSON de localidade ao lado do aplicativo.

`I18n.IsRightToLeft` lê `CultureInfo.TextInfo`. O aplicativo define `CultureInfo.CurrentUICulture` e `CultureInfo.CurrentCulture` por si mesmo, e persiste o código de localidade. `string.Format` usa a cultura da UI atual, então `{0:C}` segue essa cultura.

`LocaleChanged` é acionado dentro de `SetLocale`. Defina `CurrentUICulture` e `CurrentCulture` primeiro para que um manipulador de atualização formate com a nova cultura. Propriedades do view-model que chamam `T` devem levantar `PropertyChanged` a partir desse evento. Para Avalonia, WPF e MAUI, a extensão de marcação retorna `I18n.T(Text)` e define essa propriedade novamente em `LocaleChanged`, então cancela a inscrição quando o controle sai da árvore visual. O catálogo e a localidade atual são estáticos. Isso é seguro para um processo de desktop. Não é uma localidade por solicitação para um servidor multiusuário. Mantenha `IStringLocalizer` ou `ResourceManager` lá. Definir `CurrentUICulture` não dá a cada solicitação seu próprio mapa.

Para atualizar um auxiliar copiado, gere o mesmo modelo em um diretório descartável e copie apenas o arquivo gerado que você pretende substituir. Não execute novamente `init` no aplicativo para atualizar o auxiliar.

O arquivo começa com `ai-i18n-tools-i18n-cs:`, então `extract` o ignora.

<a id="desktop-recipe"></a>
## Receita para desktop

Avalonia, WPF e MAUI cada um tem sua própria classe base de extensão de marcação. O auxiliar não referencia esses assemblies. `ProvideValue` retorna `I18n.T(Text)` e define essa propriedade novamente em `LocaleChanged`. Cancele a inscrição quando o controle sair da árvore visual. Adicione `**/TrExtension.cs` a `ui.uiExtractor.exclude` para que `T(Text)` não seja relatado como um não-literal. Os literais XAML já são extraídos através de `Tr`. `{loc:Tr}` só pode chamar `T`. Dois significados de uma palavra curta são definidos no código com `Tp`.

Uma forma de Avalonia (`IProvideValueTarget` está em `Avalonia.Metadata`):

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

WPF e MAUI usam a mesma ideia com seus próprios tipos de propriedade. Somente Avalonia: ignore `SelectionChanged` a menos que `e.Source` seja o controle que possui o manipulador. Não atribua `ItemsSource` ou `SelectedItem` dentro desse manipulador, ou dentro de um `LocaleChanged` que o `SetLocale` deste combo levantou. Publique a atualização com `Dispatcher.UIThread.Post`, e proteja o manipulador enquanto o código define `SelectedItem`. Um `TabControl` pai que atribui `ItemsSource` novamente do evento borbulhado trava o processo (código de saída 139, `crash.log` vazio).

Frases formatadas permanecem em C# (`T("Cursor {0}", value)`), o que mantém o extrator em um único literal. `StringFormat` em uma ligação é invisível. A mesma chamada funciona a partir de um view model, uma dica de ferramenta da bandeja e um diálogo. Um combo de enumeração mantém a enumeração, retorna `T("Light")` de sua legenda e reconstrói os itens em `LocaleChanged`. Um item da bandeja usa `Tp("tray", "Open")` e um `CommandParameter` estável. Corresponda ao parâmetro, não ao cabeçalho. Um serviço armazena a frase de erro em inglês, e o local de exibição mapeia frases conhecidas através de `T`. Linux `.desktop` `Name=` e `Comment=` permanecem no idioma de origem. Tokens de duração que são comparados (`2d`, `7h 47m`) permanecem não traduzidos. Traduza `T("now")` e `T("in {0}", duration)` no local de exibição. Um espaço inicial ou final em um literal ainda é um aviso de extração. Mova-o para a string de formato ou para o layout. `Tn` pode corrigir uma frase de origem que sempre foi plural (`1 samples`).

<a id="migrate"></a>
## Reescrever chamadas não seguras

`migrate-dotnet-i18n` é uma execução de teste até que você passe `--write`. Ele reescreve argumentos de `T`, `Tn` e `Tp` que são construídos antes da pesquisa:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

tornam-se `T("Saved to {0}", path)`, `T("Last synced {0}", date)` e `T("Hello {0}", name)`. Um nome simples repetido permanece um argumento. Um cast como `(int)status` mantém seu próprio índice. O relatório `migrate-dotnet-i18n-report.md` lista tudo o que foi deixado no lugar: `await`, uma string `$$"""` bruta, um buraco `? :`, `ref` ou `out`, uma concatenação sem literal, um `IFormatProvider` passado para `string.Format` e uma frase que parece um plural (`{0} samples` deveria ser `Tn`).

`--wrap` também marca XAML não marcado `Text`, `Header`, `Content` e os outros atributos de rótulo como `{loc:Tr '...'}`, e atribuições C# cujo nome termina em `Text`, `Title`, `Message` e os outros sufixos de alta confiança, além de `MessageBox.Show` e `ConfirmDialog.Show`. Sem `--write`, isso é uma auditoria. Ele não edita logs, atributos, `nameof`, comparações ou chamadas `Path`. Uma segunda execução não muda nada.

Quando `extract` ingere um `.resx` neutro, o mesmo relatório ganha uma seção de Chaves de recurso nomeadas. Uma linha como `Resources.LoginButton` é listada como `T("Sign in")`. Essas linhas são sugestões. O comando não as edita.
