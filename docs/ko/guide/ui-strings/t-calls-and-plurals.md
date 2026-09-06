<a id="t-calls--plurals"></a>
# t() 호출 및 복수형

<a id="using-t-in-source-code"></a>
## 소스 코드에서 `t()` 사용

추출 스크립트가 찾을 수 있도록 **리터럴 문자열**과 함께 `t()`를 호출하세요:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

동일한 패턴이 React 외부(Node.js, 서버 컴포넌트, CLI)에서도 작동합니다:

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**규칙:**

- 다음 형식만 추출됩니다: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- 키는 **리터럴 문자열**이어야 합니다 — 변수나 표현식을 키로 사용할 수 없습니다.
- 키에 템플릿 리터럴을 사용하지 마세요: <code>{'t(`Hello ${name}`)'}</code>은(는) 추출할 수 없습니다.

<a id="interpolation"></a>
## 보간

<code v-pre>{{var}}</code> 플레이스홀더에 i18next의 기본 두 번째 인수 보간을 사용하세요:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

추출 명령은 **두 번째 인수**가 일반 객체 리터럴일 때 이를 파싱하고 `plurals: true` 및 `zeroDigit`과 같은 도구 전용 플래그를 읽습니다 (아래의 **기수 복수형** 참조). 일반 문자열의 경우 리터럴 키만 해싱에 사용되며, 보간 옵션은 런타임에 i18next로 전달됩니다.

프로젝트에서 사용자 지정 보간 유틸리티를 사용하는 경우(예: `t('key')`를 호출한 후 <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>과 같은 템플릿 함수로 결과를 파이핑), `setupKeyAsDefaultT`(`wrapI18nWithKeyTrim`를 통해)을 사용하면 이러한 작업이 불필요해집니다. 소스 로케일이 원시 키를 반환하는 경우에도 <code v-pre>{{var}}</code> 보간을 적용합니다. 호출 사이트를 <code v-pre>t('Hello {{name}}', { name })</code>로 마이그레이션하고 사용자 지정 유틸리티를 제거하세요.

<a id="cardinal-plurals-plurals-true"></a>
## 기수 복수형 (`plurals: true`)

**복수형을 직접 작성하지 않습니다.** 소스 코드에서 메시지를 한 번 작성하고 두 번째 인수에 두 가지를 전달합니다:

1. **`plurals: true`** — 이 호출이 기수 복수형 그룹임을 추출 및 `translate-ui`에 알립니다.
2. **`count`** — 런타임에 i18next가 올바른 형식을 선택하는 데 사용하는 숫자입니다.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

이것이 호출 사이트에 필요한 전부입니다. `_zero`, `_one`, `_other` 또는 기타 접미사 키를 직접 정의하지 **않습니다**.

`translate-ui`을(를) 실행하면 **ai-i18n-tools가 LLM을 호출**하여 각 대상 로케일(`zero`, `one`, `two`, `few`, `many`, `other` — 해당 언어에 `Intl.PluralRules`이(가) 필요로 하는 형식)에 필요한 모든 기수 카테고리를 생성합니다. 모델은 원래 리터럴과 소스 언어 복수형 변형을 받은 다음 번역된 형식을 반환합니다. 도구는 이를 `strings.json`에 기록하고 플랫 i18next JSON(`<groupId>_zero`, `<groupId>_one`, …)을 내보내므로 런타임 복수형 확인이 추가 설정 없이 작동합니다.

- `zeroDigit` (선택 사항) — 도구 전용; i18next에서 읽지 **않습니다**. `true`인 경우, LLM 프롬프트는 해당 형식이 존재하는 각 로케일의 `_zero` 문자열에서 리터럴 아랍어 `0`를 선호합니다; `false`이거나 생략된 경우, 자연스러운 0 표현이 사용됩니다. `i18next.t`를 호출하기 전에 이 키를 제거하세요 (아래의 `wrapT` 참조).

**유효성 검사:** 메시지에 **두 개 이상의** 고유한 <code v-pre>{{…}}</code> 플레이스홀더가 포함된 경우, **그중 하나는** <code v-pre>{{count}}</code> (복수형 축)이어야 합니다. 그렇지 않으면 `extract`이(가) 명확한 파일/라인 메시지와 함께 **실패**합니다.

LLM이 CLDR 형식을 반환한 후, `translate-ui`은(는) 각 형식을 **원래 개발자 리터럴**과 대조하여 검사합니다: 모든 소스 플레이스홀더는 모든 카테고리(`one` 포함)에 나타나야 하며, 형식은 새로운 <code v-pre>{{…}}</code> / `%d` / `{n}` 토큰을 만들어내지 않아야 하고, 명사 전용 소스(<code v-pre>{{count}}</code> 및 숫자 없음, 예: `Minutes`와 같은 단위 라벨)는 명사 전용으로 유지되어야 합니다. 불일치가 발생하면 해당 모델의 응답을 폐기하고 폴백 목록의 다음 모델을 재시도합니다.

**두 개의 독립적인 카운트** (예: 섹션 및 페이지)는 하나의 복수형 메시지를 공유할 수 없습니다 — **두 개의** `t()` 호출(각각 `plurals: true` 및 자체 `count` 포함)을 사용하고 UI에서 연결하세요.

**v1에 없는 기능:** 서수 복수형 (`_ordinal_*`, `ordinal: true`), 구간 복수형, ICU 전용 파이프라인.

<a id="how-plurals-are-stored-and-emitted"></a>
## 복수형 저장 및 출력 방식

**에서** `strings.json` 복수형 그룹은 `"plural": true`과 함께 **해시당 한 행**을 사용하며, `source`에 원본 리터럴을, `translated[locale]`에는 해당 로케일의 문자열에 카디널 카테고리(`zero`, `one`, `two`, `few`, `many`, `other`)를 매핑하는 객체를 사용합니다.

**플랫 로케일 JSON:** 비복수형 행은 **원본 문장 → 번역**을 유지합니다. 복수형 행은 `<groupId>_original`(참고용으로 `source`과 동일) 및 각 접미사에 대해 `<groupId>_<form>`로 출력되어 i18next가 복수형을 기본적으로 해결할 수 있도록 합니다. `translate-ui`는 또한 **오직** 복수형 플랫 키만 포함된 `{sourceLocale}.json`를 작성합니다(접미사가 붙은 키가 해결되도록 소스 언어에 대해 이 번들을 로드하십시오; 일반 문자열은 여전히 키를 기본값으로 사용합니다). 각 대상 로케일에 대해, 출력된 접미사 키는 해당 로케일의 `Intl.PluralRules`(`requiredCldrPluralForms`)와 일치합니다: 만약 `strings.json`이 압축 후 다른 카테고리와 일치하여 생략된 경우(예: 아랍어 `many`이 `other`와 동일), `translate-ui`은 폴백 형제 문자열에서 복사하여 필요한 모든 접미사를 플랫 파일에 작성하므로 런타임 조회 시 키를 놓치는 일이 없습니다.

런타임(`ai-i18n-tools/runtime`): `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`을 **호출**합니다 — 이는 `wrapI18nWithKeyTrim`를 실행하고, 선택적 `translate-ui` `{sourceLocale}.json` 복수형 번들을 등록한 다음, `buildPluralIndexFromStringsJson(stringsJson)`를 사용하여 `wrapT`합니다. `wrapT`은 `plurals` / `zeroDigit`를 제거하고, 필요할 때 키를 그룹 ID로 다시 작성하며, `count`을 전달합니다(선택 사항: <code v-pre>{{count}}</code>이 아닌 단일 플레이스홀더가 있는 경우 `count`은 해당 숫자 옵션에서 복사됩니다). [i18next 연결](/ko/guide/ui-strings/i18next-runtime) 및 [런타임 헬퍼](/ko/guide/runtime-helpers)를 참조하십시오.
