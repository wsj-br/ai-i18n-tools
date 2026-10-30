<a id="cli--cache-maintenance"></a>
# CLI — 缓存维护

<a id="cleanup"></a>
### `cleanup`

**概要：** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

清空整个 `markdown_source_issues` 表，然后运行 `sync --force-update`（提取、UI、SVG、文档，以及在启用时运行的 `translate-json`），以便为当前配置的文档重新填充 Markdown 问题。接着它会：

- 移除过时的段行（`last_hit_at` 为空 / 文件路径为空）；
- 删除其解析的源路径在磁盘上缺失的 `file_tracking` 行；
- 移除其 `filepath` 元数据指向缺失文件的翻译行；
- 清理孤立的 `translation_failures` 行；
- 删除配置中不存在的语言环境的缓存行（`sourceLocale`、根 `targetLocales`，以及任何每个块的 `docs[]` / `json[]` `targetLocales`）。

仅针对已停用语言环境的缓存——生成的文档、平面 UI 文件和 `strings.json` 条目保持不变（使用 [`purge-locale`](#purge-locale) 来移除这些）。同步后记录清理计数（过时段、孤立的 `file_tracking`、孤立的翻译、孤立的失败、未配置的语言环境），加上预先的 Markdown 问题清除计数。

**关键选项：** `--dry-run`, `--backup`

`--backup <path>` 在修改前将 SQLite 备份写入该路径（除非设置了此标志，否则不进行备份）。

---

<a id="clean-temp"></a>
### `clean-temp`

**概要：** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

无需配置。遍历目录树（默认：cwd）以查找 `*.log`、`*.tmp` 和 `cache.db.backup*.sqlite`，打印如 `find -print` 的 `./…` 路径。有匹配项时：除非 `-f` / `--force`（无需提示直接删除），否则提示 `Delete these files? (y/n)`。无匹配项时：无需提示直接退出。`--dry-run`：仅列出，不提示或删除（覆盖 `--force`）。

**关键选项：** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**概要：** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

从 `translations`、`file_tracking` 和 `translation_failures` 中删除给定语言环境的所有缓存行，以及该语言环境的生成工件：翻译文档（从 `docs[]` 解析的 `.md` / `.mdx` / `.astro` 输出，包括源已删除的孤立输出——通过扫描每个块的输出树找到，除非配置了自定义 `pathTemplate`），每个语言环境的平面 UI 文件（`<flatOutputDir>/<locale>.json`），以及该语言环境在 `strings.json` 中的条目。

语言环境通过可重复的 `-l` / `--locale` 传递（标准化为 BCP-47）。打印每个语言环境的计数（缓存行、文档、`strings.json` 条目、平面文件）；对没有可清除内容的语言环境发出警告（不报错）。除非 `-y` / `--yes` / `-f` / `--force`，否则会提示确认。`--dry-run`：报告计数和将要删除的文件，不执行删除。`--keep-files`：仅清除 SQLite 缓存，不触及生成的文件和 `strings.json`。除非传递 `--backup <path>`，否则不创建 SQLite 备份，传递后会在删除前将备份写入该路径。

**关键选项：** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
