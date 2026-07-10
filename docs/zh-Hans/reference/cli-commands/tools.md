<a id="cli--tools"></a>
# CLI — 工具

<a id="dashboard"></a>
### `dashboard`

**概要：** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

启动翻译仪表板（用于缓存片段、`strings.json`、术语表、失败项和统计信息的本地 Web UI）。默认端口 **8675**（如不可用则重试下一个端口）。使用 `--no-open` 时，不会自动打开默认浏览器。已弃用的别名 `editor` 仍然可用，但会打印警告。

**主要选项：** `-p` / `--port`, `--no-open`

**另请参阅：** [翻译仪表板](/zh-Hans/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**概要：** `ai-i18n-tools glossary-generate [-o <path>]`

写入一个空的 `glossary-user.csv` 模板。拒绝覆盖已有文件（退出码 **1**）。

**主要选项：** `-o` / `--output`

`-o`：覆盖输出路径（默认值：来自配置的 `glossary.userGlossary`，或 `glossary-user.csv`）。

**另请参阅：** [仪表板术语表](/zh-Hans/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**概要：** `ai-i18n-tools help [command]`

显示子命令的帮助信息（输出与 `ai-i18n-tools <command> --help` 相同）。
