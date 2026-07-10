<a id="cli--cache--maintenance"></a>
# CLI — 缓存与维护

<a id="cleanup"></a>
### `cleanup`

**概要：** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

清空整个 `markdown_source_issues` 表，然后运行 `sync --force-update`（提取、UI、SVG、文档，以及启用时的 `translate-json`），以便为当前配置的文档重新填充 markdown 问题；然后移除过期的分段行（null `last_hit_at` / 空文件路径）；丢弃在磁盘上找不到已解析源路径的 `file_tracking` 行；移除其 `filepath` 元数据指向缺失文件的翻译行；清理孤立的 `translation_failures` 行。在同步后记录四个清理计数（过期分段、孤立 `file_tracking`、孤立翻译、孤立失败）以及预先清除的 markdown 问题计数。

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

从 `translations`、`file_tracking` 和 `translation_failures` 中删除给定区域设置的所有缓存行，以及该区域设置的生成工件：翻译文档（从 `docs[]` 解析的 `.md` / `.mdx` / `.astro` 输出，包括源已被移除的孤立输出——通过扫描每个块的输出树找到，除非配置了自定义 `pathTemplate`）、每个区域设置的扁平 UI 文件 (`<flatOutputDir>/<locale>.json`)，以及该区域设置在 `strings.json` 中的条目。

区域设置通过可重复的 `-l` / `--locale` 传递（标准化为 BCP-47）。打印每个区域设置的计数（缓存行、文档、`strings.json` 条目、扁平文件）；对于没有可清除内容的区域设置发出警告（不报错）。除非 `-y` / `--yes` / `-f` / `--force`，否则提示确认。`--dry-run`：报告计数和将要移除的文件，不删除任何内容。`--keep-files`：仅清除 SQLite 缓存，保留生成的文件和 `strings.json` 不变。除非传递了 `--backup <path>`，否则不进行 SQLite 备份，该参数会在删除前将备份写入该路径。

**关键选项：** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
