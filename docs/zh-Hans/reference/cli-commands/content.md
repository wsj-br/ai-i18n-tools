<a id="cli--other-content"></a>
# CLI — 其他内容

<a id="translate-json"></a>
### `translate-json`

**概要：** `ai-i18n-tools translate-json [options]`

根据 `json[]` 翻译嵌套 JSON（需要 `features.translateJson`）。共享 SQLite 缓存。

**关键选项：** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**另请参阅：** [JSON](/zh-Hans/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**概要：** `ai-i18n-tools translate-svg [options]`

翻译在 `config.svg` 中配置的 SVG 文件（与文档分开）。需要 `features.translateSVG`。与文档使用相同的缓存机制；支持 `--no-cache` 以在该次运行中跳过 SQLite 读写。

**关键选项：** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**另请参阅：** [SVG 翻译](/zh-Hans/guide/svg-translation/)
