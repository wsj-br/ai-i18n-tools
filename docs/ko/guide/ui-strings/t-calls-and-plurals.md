<a id="t-calls--plurals"></a>
# t() 호출 및 복수형

<a id="using-t-in-source-code"></a>
## 소스 코드에서 `t()` 사용

추출 스크립트가 이를 찾을 수 있도록 **리터럴 문자열**로 `t()`을 호출하세요:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

동일한 패턴은 React 외부(Node.js, 서버 컴포넌트, CLI)에서도 작동합니다:

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**규칙:**

- 다음 형식만 추출됩니다: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- 키는 **리터럴 문자열**이어야 하며, 변수나 표현식은 키로 사용할 수 없습니다.
- 키에 템플릿 리터럴 사용 금지: <code>{'t(`Hello ${name}`)'}</code>은 추출할 수 없습니다.

<a id="interpolation"></a>
## 보간

<code v-pre>{{var}}</code> 플레이스홀더에 i18next의 기본 두 번째 인수 보간을 사용하세요.

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

추출 명령은 일반 객체 리터럴일 때 **두 번째 인수**를 구문 분석하고 `plurals: true` 및 `zeroDigit`과 같은 도구 전용 플래그를 읽습니다(아래 **카디널 복수형** 참조). 일반 문자열의 경우 해싱에는 리터럴 키만 사용되며, 보간 옵션은 여전히 런타임에 i18next로 전달됩니다.

프로젝트에서 사용자 지정 보간 유틸리티(예: `t('key')`를 호출한 다음 결과를 <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>와 같은 템플릿 함수를 통해 파이프하는 경우)를 사용하는 경우, `setupKeyAsDefaultT`(`wrapI18nWithKeyTrim`를 통해)는 이를 불필요하게 만듭니다. 소스 로케일이 원시 키를 반환하는 경우에도 <code v-pre>{{var}}</code> 보간을 적용합니다. 호출 사이트를 <code v-pre>t('Hello {{name}}', { name })</code>로 마이그레이션하고 사용자 지정 유틸리티를 제거하세요.

<a id="cardinal-plurals-plurals-true"></a>
## 기수 복수형 (`plurals: true`)

**복수형을 직접 작성하지 마세요.** 소스 코드에서는 메시지를 한 번 작성하고 두 번째 인수에 두 가지를 전달합니다.

1. **`plurals: true`** — 이 호출이 기수 복수 그룹임을 추출 및 `translate-ui`에 알립니다.
2. **`count`** — i18next가 런타임에 올바른 형식을 선택하는 데 사용하는 숫자입니다.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

호출 사이트에서 필요한 것은 이것뿐입니다. `_zero`, `_one`, `_other` 또는 다른 접미사 키를 직접 정의**하지 마세요.**

`translate-ui`를 실행하면 **ai-i18n-tools가 LLM을 호출하여** 각 대상 로케일에 필요한 모든 기수 범주(`zero`, `one`, `two`, `few`, `many`, `other` — 해당 언어에 `Intl.PluralRules`가 요구하는 모든 것)를 생성합니다. 모델은 원본 리터럴과 소스 언어 복수형 변형을 수신한 다음 번역된 형식을 반환합니다. 도구는 이를 `strings.json`에 작성하고 플랫 i18next JSON(`<groupId>_zero`, `<groupId>_one`, …)을 내보내므로 런타임 복수형 해결이 사용자 측에서 추가 설정 없이 작동합니다.

- `zeroDigit` (선택 사항) — 도구 전용; i18next에서 **읽지 않습니다.** `true`일 때, LLM 프롬프트는 해당 형식이 존재하는 각 로케일에 대해 `0` 문자열에 리터럴 아랍어 `_zero`를 선호합니다. `false`이거나 생략된 경우, 자연스러운 0 표현이 사용됩니다. `i18next.t`를 호출하기 전에 이 키들을 제거하세요 (아래 `wrapT` 참조).

**유효성 검사:** 메시지에 **두 개 이상**의 고유한 <code v-pre>{{…}}</code> 플레이스홀더가 포함된 경우, **그 중 하나는** <code v-pre>{{count}}</code>(복수 축)여야 합니다. 그렇지 않으면 `extract`가 명확한 파일/줄 메시지와 함께 **실패합니다.**

**두 개의 독립적인 수치**(예: 섹션 및 페이지)는 하나의 복수형 메시지를 공유할 수 없습니다. UI에서 연결하여 사용하려면 각각 `plurals: true`과 자체 `count`를 가진 **두 개**의 `t()` 호출을 사용해야 합니다.

**v1에는 없음:** 서수 복수형(`_ordinal_*`, `ordinal: true`), 구간 복수형, ICU 전용 파이프라인.

<a id="how-plurals-are-stored-and-emitted"></a>
## 복수형이 저장되고 내보내지는 방식

**복수 그룹은** `strings.json`에서 **해시당 한 행**을 사용하며, `"plural": true`, 원본 리터럴은 `source`에, 그리고 `translated[locale]`은 기수 범주(`zero`, `one`, `two`, `few`, `many`, `other`)를 해당 로케일의 문자열에 매핑하는 객체로 표현됩니다.

**평탄화된 로케일 JSON:** 단수형 행은 **원문 문장 → 번역문** 형태를 유지함. 복수형 행은 i18next가 복수형을 네이티브로 해석할 수 있도록, `<groupId>_original` (참조용으로 `source`과 동일함)과 각 접미사에 대한 `<groupId>_<form>`로 출력됨. `translate-ui`는 또한 **복수형 평탄화 키만** 포함하는 `{sourceLocale}.json`를 작성함 (소스 언어용 번들을 로드하여 접미사 키가 해석되도록 함; 일반 문자열은 여전히 키를 기본값으로 사용함). 각 대상 로케일에 대해 출력된 접미사 키는 해당 로케일의 `Intl.PluralRules` (`requiredCldrPluralForms`)와 일치함: `strings.json`이 압축 후 다른 범주와 동일하여 범주를 생략한 경우(예: 아랍어 `many`이 `other`과 동일한 경우), `translate-ui`는 여전히 대체 문자열에서 복사하여 필요한 모든 접미사를 평탄화 파일에 기록하므로 런타임 조회 시 키 누락이 발생하지 않음.

런타임(`ai-i18n-tools/runtime`): **호출** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — `wrapI18nWithKeyTrim`를 실행하고, 선택적 `translate-ui` `{sourceLocale}.json` 복수형 번들을 등록한 다음, `buildPluralIndexFromStringsJson(stringsJson)`를 사용하여 `wrapT`합니다. `wrapT`는 `plurals` / `zeroDigit`를 제거하고, 필요한 경우 키를 그룹 ID로 다시 작성하며, `count`를 전달합니다 (선택 사항: 단일 비-<code v-pre>{{count}}</code> 플레이스홀더가 있는 경우, `count`는 해당 숫자 옵션에서 복사됩니다). [i18next 연결](/guide/ui-strings/i18next-runtime) 및 [런타임 도우미](/guide/runtime-helpers)를 참조하세요.

**이전 환경:** 도구 및 일관된 동작을 위해 `Intl.PluralRules`이 필요합니다. 매우 오래된 브라우저를 대상으로 할 경우 폴리필을 사용하세요.
