<a id="tool-ui-language"></a>
# 工具 UI 语言

该工具会独立于项目的 `sourceLocale` / `targetLocales` 对其自身的用户界面进行本地化——包括 CLI 帮助文本、高频日志/摘要/错误消息以及翻译仪表板。无需配置：默认情况下，该工具会遵循操作系统的区域设置。

<a id="locale-resolution"></a>
## 区域设置解析

UI 区域设置从以下来源解析，优先级从高到低：

1. `-L` / `--ui-lang <code>` 全局标志（例如 `-L pt-BR`）。
2. `AI_I18N_LANG` 环境变量（例如 `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` 中的 `uiLanguage` 配置键（BCP-47 字符串）。
4. 主机操作系统区域设置（通过 `Intl.DateTimeFormat().resolvedOptions().locale`）。

<a id="matching-and-fallback"></a>
## 匹配与回退

请求的区域设置会与提供的 UI 语言进行精确匹配或按最接近的变体匹配（例如，`pt-PT` 解析为 `pt-BR`，`en-US` 解析为 `en-GB`）；当没有任何匹配项时，它会回退到源区域设置（`en-GB`）。当显式请求 UI 语言（通过标志、环境变量或 `uiLanguage`）但没有匹配的已提供程序集时，CLI 会发出一次性警告，告知将使用默认区域设置；仅从主机操作系统推断出的区域设置永远不会发出警告。

<a id="shipped-ui-languages"></a>
## 内置 UI 语言

`en-GB`（源语言）以及 `de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans` 和 `zh-Hant`。

<a id="translation-dashboard"></a>
## 翻译仪表板

翻译仪表板会从 `GET /api/ui-i18n` 读取解析后的区域设置、布局方向和翻译包，并在加载时应用它们（它会设置 `<html lang>` / `dir` 并通过 `data-i18n*` 属性对静态标记进行本地化）。

<a id="related"></a>
## 相关内容

- [`AI_I18N_LANG`](/reference/environment-variables) — 环境变量覆盖
- [`uiLanguage`](/reference/configuration#uilanguage-optional) — 配置键覆盖
- [`-L` / `--ui-lang`](/reference/cli-commands/) — CLI 标志覆盖（最高优先级）
