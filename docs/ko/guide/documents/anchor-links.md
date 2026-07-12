<a id="anchor-links"></a>
# 앵커 링크

`docsOutput.style = "flat"`일 때 출력은 각 로케일에 대해 페이지 간 **상대 경로**를 다시 작성함(`guide.md` → `guide.de.md`). **앵커 링크** — 경로 뒤에 `#`가 오는 일반적인 마크다운 인라인 형식 — 는 대상 파일 내 섹션으로 이동함:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

여기서 링크 대상은 `setup.md`이며, `#first-run`은 앵커입니다. 해당 파일 내 적절한 제목으로 스크롤되어야 합니다.

<a id="why-anchor-links-need-attention"></a>
## 앵커 링크에 주의해야 하는 이유

- `rewriteRelativeLinks`은 각 로캘의 **파일명**을 고정합니다(`setup.md` → `setup.de.md`).
- 많은 렌더러는 **보이는 제목 텍스트**에서 `#` 슬러그를 유도합니다. 번역 후 제목은 로캘별로 달라지므로 자동 생성된 슬러그는 변경될 수 있지만, 다시 작성된 링크는 여전히 `#first-run`라고 표시될 수 있습니다. 또는 영어 `#…` 앵커가 번역된 제목에서 렌더러가 생성한 슬러그와 더 이상 일치하지 않을 수 있습니다.
- 결과: 독자는 올바른 **파일**에는 도달하지만 **잘못된 줄**에 도달하거나, 브라우저가 일치하는 제목을 찾지 못합니다.

<a id="what-to-do"></a>
## 수행할 작업

<a id="docusaurus-sites-preferred"></a>
### Docusaurus 사이트 (권장)

[Docusaurus](/ko/guide/integrations/docusaurus) 문서(`docsOutput.style = "docusaurus"`)에서는 `ai-i18n-tools write-heading-ids` 대신 Docusaurus의 기본 제목 ID를 사용하는 것을 권장합니다:

1. Docusaurus의 `{#…}` 접미사를 사용하여 제목 줄에 명시적 id를 추가하세요(예: `## TLS configuration {#tls-configuration}`). `translate-docs` 중에는 보이는 제목 텍스트만 번역되며, `{#tls-configuration}` 접미사는 모든 로캘에서 보존됩니다.
2. Docusaurus 프로젝트 루트(일반적으로 `package.json`에 연결된 `pnpm run write-heading-ids`)에서 `docusaurus write-heading-ids`를 실행하여 접미사가 없는 제목에 `{#…}` 접미사를 추가하거나 새로 고치세요. 제목을 변경한 후에는 오래된 id가 현재 제목과 일치하도록 다시 실행하세요.

마크다운 **앵커 링크**를 안정적인 id로 지정하세요(예: `[label](other.md#tls-configuration)`). 여기서 프래그먼트는 `{#…}` 접미사와 일치해야 하며, 영어 단어만으로 추측한 slug가 아니어야 합니다. 이 패턴을 사용하는 확정된 문서는 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/)를 참조하세요.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### 기타 레이아웃 (플랫, Starlight, VitePress 등)

Docusaurus를 사용하지 않거나 `{#…}` 접미사 대신 HTML 앵커가 필요한 경우:

1. `translate-docs` 전에 소스 `.md` / `.mdx`에서 `ai-i18n-tools write-heading-ids`을 실행하세요(일반적인 `docs[]` / `contentPaths`와 동일). 이 작업은 각 제목 바로 전 줄에 명시적인 HTML 앵커를 삽입하여 `id` 값이 모든 번역된 사본에서 공유되도록 합니다. 제목 이름을 변경한 후에는 이 도구를 다시 실행하여 오래된 앵커 ID가 현재 제목과 일치하도록 갱신하세요.
2. 마크다운 **앵커 링크**를 이러한 안정적인 ID를 가리키도록 설정하세요. 예: `[label](other.md#section-id)`, 여기서 `section-id`은 도구가 작성한 앵커와 일치해야 하며, 영어 단어만으로 추측한 것이 아니어야 합니다.

<a id="example"></a>
## 예시

<a id="example-docusaurus"></a>
### Docusaurus `{#…}` 접미사

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (영어 원본):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

`translate-docs` 후에도 링크 프래그먼트는 모든 로캘에서 `#tls-configuration`로 유지되며, 제목 텍스트와 링크 레이블만 변경됩니다:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML 앵커 (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` 후의 `docs/security.md` (간소화됨):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

`translate-docs` 후, 파일 경로와 `#…` 앵커는 모든 로캘 파일에서 일치하게 유지됩니다. 예를 들어:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` 앵커는 소스에서 `id`이 고정되어 있으므로 모든 로캘에서 동일합니다. 제목의 **텍스트**와 링크 **레이블**만 번역됩니다.

번역 후에도 링크가 계속 실패하면 [문제 해결](/ko/guide/documents/troubleshooting)을 참조하세요.
