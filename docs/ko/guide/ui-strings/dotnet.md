<a id="dotnet-applications"></a>
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

스캔은 `bin`, `obj`, `.vs`, `TestResults` 및 `packages`라는 이름의 디렉터리를 건너뜁니다. 템플릿은 또한 `uiExtractor.exclude`을(를) `**/bin/**`, `**/obj/**`, `**/Tests/**` 및 `**/*.Tests/**`(으)로 설정합니다.

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

`Tn`은(는) `{0}`을(를) 개수로 처리합니다. 추가 인수는 그 뒤에 옵니다(`{1}`, `{2}`).

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

`I18n.SupportedLocales`는 초기화 시 각인된 목록입니다(기본 이름 및 영어 이름). `I18n.IsRightToLeft`는 `CultureInfo.TextInfo`를 읽습니다. 앱은 `CultureInfo.CurrentUICulture` 및 `CultureInfo.CurrentCulture`를 자체적으로 설정합니다. `string.Format`는 현재 UI 문화권을 사용하므로 `{0:C}`는 해당 문화권을 따릅니다.

`LocaleChanged`은(는) `SetLocale` 내부에서 발생합니다. 먼저 `CurrentUICulture`와 `CurrentCulture`을(를) 설정하여 새로 고침 핸들러가 새 문화권으로 형식을 지정하도록 하십시오. `T`를 호출하는 뷰 모델 속성은 해당 이벤트에서 `PropertyChanged`를 발생시켜야 합니다. 일반 문자열을 반환하는 마크업 확장은 뷰가 다음에 빌드될 때 업데이트됩니다. 카탈로그와 현재 로캘은 정적입니다. 이는 데스크톱 프로세스에 안전합니다. 다중 사용자 서버의 경우 요청별 로캘이 아닙니다. 그곳에 `IStringLocalizer` 또는 `ResourceManager`을(를) 유지하십시오. `CurrentUICulture`을(를) 설정해도 각 요청에 자체 맵이 제공되지 않습니다.

복사된 헬퍼를 새로 고치려면, 일회용 디렉터리에 동일한 템플릿을 스캐폴드하고 교체하려는 생성된 파일만 복사하십시오. 헬퍼를 업그레이드하기 위해 앱에서 `init`을(를) 다시 실행하지 마십시오.

파일은 `ai-i18n-tools-i18n-cs:`로 시작하므로 `extract`는 이를 건너뜁니다.

<a id="desktop-recipe"></a>
## 데스크톱 레시피

Avalonia, WPF, MAUI는 각각 고유한 마크업 확장 기본 클래스를 가집니다. 헬퍼는 해당 어셈블리를 참조하지 않습니다. Avalonia 형태 중 하나:

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

서식 있는 문장은 C#(`T("Cursor {0}", value)`)에 유지되며, 이는 추출기가 단일 리터럴에 머무르게 합니다. 동일한 호출은 뷰 모델, 트레이 툴팁 및 대화 상자에서 작동합니다.

<a id="migrate"></a>
## 안전하지 않은 호출 다시 작성

`migrate-dotnet-i18n`는 `--write`를 전달할 때까지는 드라이 런(시험 실행)입니다. 조회 전에 빌드되는 `T`, `Tn`, `Tp`의 인수를 다시 작성합니다.

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`T("Saved to {0}", path)`, `T("Last synced {0}", date)`, `T("Hello {0}", name)`가 됩니다. 반복되는 단순 이름은 하나의 인수로 유지됩니다. `(int)status`와 같은 캐스트는 자체 인덱스를 유지합니다. `migrate-dotnet-i18n-report.md` 보고서는 제자리에 남아 있는 모든 것을 나열합니다. `await`, 원시 `$$"""` 문자열, `? :` 구멍, `ref` 또는 `out`, 리터럴이 없는 연결, `string.Format`에 전달된 `IFormatProvider`, 그리고 복수형처럼 보이는 구문(`{0} samples`는 `Tn`여야 함)입니다.

`--wrap`는 또한 표시되지 않은 XAML `Text`, `Header`, `Content` 및 기타 레이블 속성을 `{loc:Tr '...'}`로 표시하고, 이름이 `Text`, `Title`, `Message` 및 기타 높은 신뢰도 접미사로 끝나는 C# 할당, 그리고 `MessageBox.Show` 및 `ConfirmDialog.Show`도 표시합니다. `--write`가 없으면 이는 감사입니다. 로그, 속성, `nameof`, 비교 또는 `Path` 호출을 편집하지 않습니다. 두 번째 실행은 아무것도 변경하지 않습니다.

`extract`가 중립 `.resx`을 수집할 때, 동일한 보고서에 '명명된 리소스 키' 섹션이 추가됩니다. `Resources.LoginButton`와 같은 줄은 `T("Sign in")`로 나열됩니다. 이 줄들은 제안입니다. 이 명령은 이들을 편집하지 않습니다.
