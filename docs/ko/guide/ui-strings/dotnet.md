<a id="net-applications"></a>
# .NET 애플리케이션

`ai-i18n-tools`은(는) C#, Razor, cshtml, XAML 및 AXAML에서 UI 문자열을 추출한 다음, 원본 언어 문자열을 키로 하는 플랫 JSON을 작성합니다. `sourceLocale`은(는) 어떤 언어든 될 수 있습니다. 런타임 헬퍼는 `I18n.cs`입니다(.NET 6 이상, NuGet 패키지 없음). Avalonia, WPF, MAUI, WinForms, ASP.NET, Blazor 및 콘솔 앱은 해당 헬퍼를 호출합니다. .NET Framework 4.8은 파일이 컴파일되기 전에 `System.Text.Json` 패키지가 필요합니다.

기존 단일 언어 앱에 로케일 추가: [.NET 앱에 i18n 추가](/ko/guide/add-i18n-to-dotnet).

<a id="scaffold"></a>
## 스캐폴드

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
ai-i18n-tools init -t ui-dotnet -P openrouter --namespace CursorPace
```

`ui-dotnet`은(는) `ai-i18n-tools.config.json`을(를) 작성하고, `I18n.cs`이(가) 없으면 [assets/dotnet/I18n.cs](https://github.com/wsj-br/ai-i18n-tools/blob/main/assets/dotnet/I18n.cs)를 프로젝트에 복사합니다. `--namespace`은(는) C# 네임스페이스를 설정합니다. 생략되고 디렉터리에 `.csproj`이(가) 하나 포함되어 있으면 `init`은(는) 해당 파일의 `RootNamespace` 또는 프로젝트 파일 이름을 사용합니다. 그렇지 않으면 네임스페이스는 `AiI18n`입니다.

`init`은(는) 프로젝트 파일을 편집하지 않습니다. 어셈블리에 로케일 JSON을 추가합니다.

```xml
<EmbeddedResource Include="locales/*.json" />
```

스캔은 `bin`, `obj`, `.vs`, `TestResults`, `packages` 이름의 디렉터리를 건너뜁니다. 템플릿은 또한 `uiExtractor.exclude`를 `**/bin/**`, `**/obj/**`, `**/Tests/**`, `**/*.Tests/**`, `**/TrExtension.cs`으로 설정합니다.

<a id="calls-that-translate"></a>
## 번역 호출

먼저 카탈로그 항목을 찾은 다음 결과를 `string.Format`에 전달합니다. 기본 이름은 `T`, `Tn`, `Tp`, `N`, `Tr` 및 `Loc`입니다. `I18n.T`과(와) 같은 수신자는 마지막 이름이 `T`이므로 일치합니다.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
I18n.Loc["Show token"]
```

`N`은(는) 인수를 반환하며, 추출기가 볼 수 있는 리터럴을 정적 필드, 열거형 레이블 또는 특성이 보유할 수 있도록 존재합니다. 나중에 `T(label)`을(를) 사용하여 표시합니다.

`Tn`는 `{0}`을(를) 개수로 처리합니다. 그 뒤에 추가 인수(`{1}`, `{2}`)가 따릅니다. 단수형은 해당 개수를 리터럴(`1 sample`)로 작성할 수 있지만, 복수형은 `{0}`를 유지합니다. 번역은 복수형 범주에 `{0}`를 유지하고 단수형에는 리터럴 숫자를 남겨둡니다.

`Tp`은(는) 컨텍스트와 원본 문자열을 하나의 키(컨텍스트, U+0004, 원본) 아래에 저장하며, 이는 플랫 JSON이 이미 사용하는 것과 동일한 구분자입니다. 동일한 짧은 단어가 다른 의미를 가질 때 사용합니다(`Open` 창과 `Open` 파일).

XAML 및 AXAML은(는) 형식 이름이 `funcNames`에 있는 마크업 확장을 사용합니다. 접두사는 무시됩니다.

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
<TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
```

`{Binding}`, `{DynamicResource}`, `{StaticResource}`, `{TemplateBinding}` 및 `{x:Static}`은(는) 추출되지 않습니다. 요소 콘텐츠로 작성된 텍스트(`<TextBlock>Hello</TextBlock>`)는 추출되지 않습니다. 아포스트로피를 포함하는 리터럴은 XML 특성이 큰따옴표 안에 유지될 수 있도록 `&quot;`의 인수로 작성됩니다: `Content="{loc:Tr &quot;Don't&quot;}"`.

카탈로그가 프로그램이 찾는 것과 일치하지 않으므로, 이들은 추출된 다음 거부됩니다.

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

리터럴을 전달하고 `{name}` 대신 `{0}`을(를) 사용합니다. `string.Format`은(는) 명명된 항목에서 예외를 발생시킵니다. `extract`은(는) 처음 세 개에 대해 경고를 출력하고 `{name}`에서 중지합니다.

선행 또는 후행 공백이 있는 리터럴도 여전히 카탈로그에 등록됩니다. `I18n.T`은(는) 키를 다듬고, 찾아서, 해당 공백을 결과에 다시 추가합니다. 번역가가 구분자를 볼 수 있도록 `T("Updated: {0}", value)`을(를) 선호합니다.

<a id="placeholders"></a>
## 자리 표시자

`ui-dotnet`은(는) `uiExtractor.placeholderStyle`을(를) `dotnet`(으)로 설정합니다. 해당 스타일은 `{0}`, `{0,-10}`, `{0:C}` 및 `{0,-10:C}`을(를) 유지합니다. `%`은(는) 일반 텍스트이므로 `10% e 20%`과(와) 같은 번역은 printf 토큰으로 처리되지 않습니다. 이중 중괄호(<code v-pre>{{</code> 및 `}}`)는 리터럴 중괄호이며 변경 없이 복사해야 합니다. `{name}`은(는) 추출 시 오류입니다.

JavaScript 및 Python에서 사용되는 기본 스타일은 변경되지 않습니다.

<a id="runtime"></a>
## 런타임

`I18n.SetLocale("pt-BR")`은(는) `CultureInfo.Parent`을(를) 순회하여 카탈로그가 열릴 때까지 진행합니다. `OpenLocale`은(는) 설정된 경우 사용됩니다. 그렇지 않으면 구성된 `FlatDirectory`이(가) 유일한 소스입니다. 그곳에 파일이 없어도 내장된 JSON으로 대체되지 않습니다. 내장 리소스는 `OpenLocale`와 `FlatDirectory` 둘 다 설정되지 않은 경우에만 사용됩니다. 키가 없으면 소스 문자열을 반환합니다. `I18n.Strict = true`은(는) 대신 예외를 발생시키며, 이는 테스트에 유용합니다. `string.Format`은(는) 번역된 템플릿에서 호출됩니다. 잘못된 형식은 `FormatException` 예외를 발생시킬 수 있습니다. 생략된 `{0}`은(는) 인수를 생략할 수 있습니다. 형식 오류 발생 후에는 소스 템플릿으로 대체되지 않습니다.

`I18n.SupportedLocales`는 초기화 시 스탬프된 목록으로 시작합니다 (`BuiltInLocales`: 기본 이름 및 영어 이름). 언어 메뉴는 해당 스탬프를 읽지 않습니다. 첫 번째 `T()` 이전에, `AppContext.BaseDirectory`에서 위로, 그리고 현재 디렉터리에서 각각 최대 8개의 디렉터리까지 `locales/ui-languages.json`를 검색합니다. 첫 번째 파일이 우선합니다. `code`, `label`, `englishName`를 `LocaleInfo`에 매핑하고 (`label`는 기본 이름입니다) 동일한 호출에서 `FlatDirectory`를 해당 `locales` 디렉터리로 설정하여 `Locales`로 `Configure`에 전달합니다. 모든 `Configure` 호출은 `Strict`, `FlatDirectory`, `OpenLocale`를 대체합니다. `Locales`만 설정하는 후속 호출은 `FlatDirectory`를 지웁니다. null `Locales` 배열은 현재 목록을 그대로 두고 `BuiltInLocales`를 복원하지 않습니다. 매니페스트가 없으면, 소스 언어에 대해 한 요소 목록을 전달하고 `FlatDirectory`를 설정하지 마십시오. 그러면 메뉴는 소스 언어만 표시되고, 카탈로그는 내장된 상태로 유지됩니다. 개발은 `sync`이 방금 작성한 파일을 읽습니다. `sync`를 따라야 하는 설치 프로그램은 `ui-languages.json`와 로케일 JSON을 앱 옆에 함께 제공합니다.

`I18n.IsRightToLeft`는 `CultureInfo.TextInfo`을(를) 읽습니다. 앱은 `CultureInfo.CurrentUICulture`와 `CultureInfo.CurrentCulture`를 자체적으로 설정하고 로케일 코드를 유지합니다. `string.Format`는 현재 UI 문화를 사용하므로, `{0:C}`는 해당 문화를 따릅니다.

`LocaleChanged`는 `SetLocale` 내에서 발생합니다. 새로 고침 핸들러가 새 문화권으로 포맷하도록 `CurrentUICulture`와 `CurrentCulture`를 먼저 설정하십시오. `T`를 호출하는 뷰 모델 속성은 해당 이벤트에서 `PropertyChanged`를 발생시켜야 합니다. Avalonia, WPF, MAUI의 경우, 마크업 확장은 `I18n.T(Text)`을(를) 반환하고 `LocaleChanged`에서 해당 속성을 다시 설정한 다음, 컨트롤이 시각적 트리에서 벗어날 때 구독을 취소합니다. 카탈로그와 현재 로케일은 정적입니다. 이는 데스크톱 프로세스에 안전합니다. 다중 사용자 서버의 요청별 로케일이 아닙니다. `IStringLocalizer` 또는 `ResourceManager`를 거기에 유지하십시오. `CurrentUICulture`을(를) 설정해도 각 요청에 자체 맵이 제공되지 않습니다.

복사된 헬퍼를 새로 고치려면, 일회용 디렉터리에 동일한 템플릿을 스캐폴드하고 교체하려는 생성된 파일만 복사하십시오. 헬퍼를 업그레이드하기 위해 앱에서 `init`을(를) 다시 실행하지 마십시오.

파일은 `ai-i18n-tools-i18n-cs:`로 시작하므로 `extract`는 이를 건너뜁니다.

<a id="desktop-recipe"></a>
## 데스크톱 레시피

Avalonia, WPF, MAUI는 각각 고유한 마크업 확장 기본 클래스를 가집니다. 헬퍼는 해당 어셈블리를 참조하지 않습니다. `ProvideValue`는 `I18n.T(Text)`을(를) 반환하고 `LocaleChanged`에서 해당 속성을 다시 설정합니다. 컨트롤이 시각적 트리에서 벗어날 때 구독을 취소하십시오. `**/TrExtension.cs`를 `ui.uiExtractor.exclude`에 추가하여 `T(Text)`가 비리터럴로 보고되지 않도록 하십시오. XAML 리터럴은 이미 `Tr`을(를) 통해 추출되었습니다. `{loc:Tr}`는 `T`만 호출할 수 있습니다. 하나의 짧은 단어에 대한 두 가지 의미는 `Tp`를 사용하여 코드에 설정됩니다.

하나의 Avalonia 형태 (`IProvideValueTarget`는 `Avalonia.Metadata`에 있습니다):

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

WPF와 MAUI는 자체 속성 유형으로 동일한 아이디어를 사용합니다. Avalonia 전용: `e.Source`이 핸들러를 소유하는 컨트롤이 아닌 한 `SelectionChanged`를 무시하십시오. 해당 핸들러 내부 또는 이 콤보의 `SetLocale`가 발생시킨 `LocaleChanged` 내부에서 `ItemsSource` 또는 `SelectedItem`를 할당하지 마십시오. `Dispatcher.UIThread.Post`으로 새로 고침을 게시하고, 코드가 `SelectedItem`를 설정하는 동안 핸들러를 보호하십시오. 버블링된 이벤트에서 `ItemsSource`를 다시 할당하는 부모 `TabControl`는 프로세스를 충돌시킵니다 (종료 코드 139, 빈 `crash.log`).

포맷된 문장은 C# (`T("Cursor {0}", value)`)에 유지되며, 이는 추출기가 단일 리터럴에 머무르도록 합니다. 바인딩의 `StringFormat`은 보이지 않습니다. 동일한 호출이 뷰 모델, 트레이 툴팁 및 대화 상자에서 작동합니다. 열거형 콤보는 열거형을 유지하고, 캡션에서 `T("Light")`를 반환하며, `LocaleChanged`에서 항목을 다시 빌드합니다. 트레이 항목은 `Tp("tray", "Open")`와 안정적인 `CommandParameter`를 사용합니다. 헤더가 아닌 매개변수를 일치시키십시오. 서비스는 영어 오류 문장을 저장하고, 표시 사이트는 `T`을(를) 통해 알려진 문장을 매핑합니다. Linux `.desktop` `Name=` 및 `Comment=`는 소스 언어로 유지됩니다. 비교되는 기간 토큰 (`2d`, `7h 47m`)은 번역되지 않은 상태로 유지됩니다. 표시 사이트에서 `T("now")`와 `T("in {0}", duration)`를 번역하십시오. 리터럴의 선행 또는 후행 공백은 여전히 추출 경고입니다. 이를 포맷 문자열 또는 레이아웃으로 이동하십시오. `Tn`는 항상 복수형이었던 소스 문장 (`1 samples`)을 수정할 수 있습니다.

<a id="rewrite-unsafe-calls"></a>
## 안전하지 않은 호출 재작성

`migrate-dotnet-i18n`는 `--write`를 전달할 때까지는 드라이 런(시험 실행)입니다. 조회 전에 빌드되는 `T`, `Tn`, `Tp`의 인수를 다시 작성합니다.

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`T("Saved to {0}", path)`, `T("Last synced {0}", date)`, `T("Hello {0}", name)`가 됩니다. 반복되는 단순 이름은 하나의 인수로 유지됩니다. `(int)status`와 같은 캐스트는 자체 인덱스를 유지합니다. `migrate-dotnet-i18n-report.md` 보고서는 제자리에 남아 있는 모든 것을 나열합니다. `await`, 원시 `$$"""` 문자열, `? :` 구멍, `ref` 또는 `out`, 리터럴이 없는 연결, `string.Format`에 전달된 `IFormatProvider`, 그리고 복수형처럼 보이는 구문(`{0} samples`는 `Tn`여야 함)입니다.

`--wrap`는 또한 표시되지 않은 XAML `Text`, `Header`, `Content` 및 기타 레이블 속성을 `{loc:Tr '...'}`로 표시하고, 이름이 `Text`, `Title`, `Message` 및 기타 높은 신뢰도 접미사로 끝나는 C# 할당, 그리고 `MessageBox.Show` 및 `ConfirmDialog.Show`도 표시합니다. `--write`가 없으면 이는 감사입니다. 로그, 속성, `nameof`, 비교 또는 `Path` 호출을 편집하지 않습니다. 두 번째 실행은 아무것도 변경하지 않습니다.

`extract`가 중립 `.resx`을 수집할 때, 동일한 보고서에 '명명된 리소스 키' 섹션이 추가됩니다. `Resources.LoginButton`와 같은 줄은 `T("Sign in")`로 나열됩니다. 이 줄들은 제안입니다. 이 명령은 이들을 편집하지 않습니다.
