<a id="plain-html-apps"></a>
# 일반 HTML 앱

<a id="marking-html-for-translation"></a>
## 번역을 위한 HTML 마킹

일반 HTML 앱(마크업에 `t("…")` 호출 없음)의 경우 속성을 사용하여 번역 가능한 요소를 마크업하고 `extract`이 요소 자체에서 영어 텍스트를 캡처하도록 하세요. 중복 문자열 리터럴이 필요 없습니다.

기본 양식(속성에 값이 없음; 소스 텍스트는 요소에서 읽음)을 선호합니다:

- `data-i18n` — 키는 요소의 `textContent`입니다. 런타임에 `el.textContent = t(key)`를 설정합니다.
- `data-i18n-title` — 키는 요소의 `title`입니다. 런타임에 번역된 `title`를 설정합니다.
- `data-i18n-placeholder` — 키는 요소의 `placeholder`입니다.

기본 양식을 사용할 수 없는 경우에만 값 있는 양식 `data-i18n="Some key"`을 사용하세요. (자식 태그와 혼합된 텍스트) 혼합 콘텐츠 요소 또는 키가 표시 텍스트와 달라야 하는 경우입니다. `data-i18n-ignore`을 사용하여 요소를 (및 해당 하위 트리) 제외합니다.

제약 조건: 기본 `data-i18n`은 리프 텍스트 요소에만 해당됩니다(단일 텍스트 노드, 자식 요소 없음). `textContent`을 설정하면 자식이 대체되기 때문입니다. `Run <code>build</code> now.`와 같은 단락의 경우 각 텍스트 실행을 자체 마커로 래핑하세요:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

마커를 수동으로 추가하거나 `mark-html` 명령이 기본 마커를 대신 추가하도록 하세요. 기본적으로 드라이런입니다. 파일당 추가할 마커 수를 보고하고 수동 `<span data-i18n>`이 필요한 혼합 콘텐츠 요소 목록을 제공합니다. `--write`로만 쓰기합니다:

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html`은 멱등성이며 `data-i18n-ignore`을 존중하고 코드와 유사한 요소(`code`, `pre`, `kbd`, `samp`, `var`) 또는 비어 있거나 숫자만 있는 텍스트는 마크하지 않으며 값 있는 마커를 내보내지 않습니다. 마크업 후 보고된 혼합 콘텐츠 조각을 수동으로 래핑한 다음 `.html`을 `ui.uiExtractor.extensions`에 추가하여 `extract`이 문자열을 캡처하도록 하세요:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## 예시: 일반 HTML 앱 현지화 (번들 대시보드)

패키지 자체의 번역 대시보드(`src/dashboard-app`)는 이와 동일한 마커를 사용합니다. 이 대시보드의 `index.html`에는 다음과 같은 일반 마커가 포함됩니다.

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract`는 각 영어 원본 문자열을 카탈로그(`strings.json`)에 쓰고, `translate-ui`는 영어 원본 텍스트를 키로 사용하여 로케일별로 하나의 플랫 번들을 채웁니다. 일반적인 정적 HTML 앱의 경우 `ui.flatOutputDir`를 `public/locales/`와 같은 웹에서 제공되는 디렉터리로 지정할 수 있습니다.

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

런타임 시 활성 로캘의 번들을 로드하고 마크된 요소를 순회합니다. 키는 마커 값(있는 경우)에서 오고, 그렇지 않으면 요소 자체의 텍스트/제목/자리 표시자(추출기가 공백을 정규화하는 방식과 동일하게 정규화됨)에서 옵니다:

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

이 스니펫의 마커 탐색 부분은 [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js)에서 정확히 `applyStaticI18n`입니다. 영어 원문이 카탈로그 키이므로 번역되지 않은 문자열은 자동으로 영어로 대체됩니다.

번들 대시보드가 다른 점: Node 서버가 있기 때문에 정적 `/locales/{locale}.json`를 가져오지 않습니다. 클라이언트는 `GET /api/ui-i18n`를 호출하고, 서버는 활성 로케일(`--ui-lang` > `AI_I18N_LANG` > 구성 `uiLanguage` > 호스트 OS)을 확인하고 `{ locale, dir, bundle }`를 반환합니다. 그런 다음 클라이언트는 `applyStaticI18n`을 호출하기 전에 해당 응답에서 `document.documentElement` `lang`/`dir`을 설정합니다(`lang`를 읽어 로케일을 선택하는 대신). 번들 자체는 번역 대상 도구의 콘텐츠가 아닙니다. 번들은 대시보드 자체의 UI 문자열이며, `src/i18n/locales/{locale}.json`에 포함되어(`dist/i18n/locales`에 빌드 시 복사됨) [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts)의 `loadUiBundle`에 의해 서버 측에서 읽힙니다. 대시보드의 `t()`는 위의 최소 `t`와 달리 ```{{name}}``` 보간도 지원합니다.
