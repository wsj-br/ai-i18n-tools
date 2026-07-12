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
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app"></a>
## 작업 예시: 일반 HTML 앱 지역화

[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) 작업 공간 예제는 이러한 마커를 종단 간 활용하는 실행 가능한 정적 앱입니다. `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html`로 복제하고, `pnpm install`와 `pnpm dev`를 실행한 다음, 포르투갈어(브라질)를 보려면 [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR)를 여세요.

해당 `public/index.html`은 다음과 같은裸 마커를 포함합니다:

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json`은 `public/`에서 추출을 지정하고 정적 파일 옆에 플랫 번들을 작성합니다:

```jsonc
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

`extract`은 각 영어 소스 문자열을 카탈로그(`public/strings.json`)에 작성하고, `translate-ui`는 영어 소스 텍스트를 키로 사용하여 로케일당 하나의 플랫 번들을 채웁니다:

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

실행 시 `public/app.js`은 로케일 메타데이터를 위해 `/locales/ui-languages.json`을 로드하고, 활성 로케일을 확인하며(`?locale=` → `localStorage` → browser → `en`), `/locales/{locale}.json`를 가져온 다음(영어의 경우 건너뜀) 마크된 요소를 순회합니다. 키는 마커 값이 있으면 거기서 가져오고, 없으면 요소 자체의 텍스트/제목/플레이스홀더에서 가져옵니다(추출기가 공백을 정규화하는 방식과 동일하게 정규화됨):

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText`은 [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts)의 `normalizeI18nText`과 동일하게 유지되어야 합니다. 영어 소스 텍스트가 카탈로그 키이므로 번역되지 않은 문자열은 자동으로 영어로 대체됩니다.

번들과 함께 제공되는 [Translation Dashboard](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app)는 HTML 마커에 동일한 `applyStaticI18n` 알고리즘을 사용하지만 정적 `/locales/{locale}.json` 파일 대신 `GET /api/ui-i18n`에서 로케일 번들을 제공합니다. 전체 워크플로, 프로젝트 레이아웃, 비교표를 보려면 예제의 [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md)를 참조하세요.
