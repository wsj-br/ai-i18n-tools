# 开始使用

## 先决条件

- Node.js ≥ 22.16
- pnpm ≥ 11
- OpenRouter API 密钥（仅在重新运行翻译时需要）

## 单独尝试此示例

```bash
npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs
cd vitepress-docs
pnpm install
pnpm run docs:dev
```

打开 [http://localhost:3060/](http://localhost:3060/) 并在导航栏中切换语言（`pt-BR`, `zh-Hans`）。

## 翻译

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

配置: [`ai-i18n-tools.config.json`](../ai-i18n-tools.config.json)。

## 布局

英语源文件：

```text
docs/
├── index.md
└── guide/getting-started.md
```

在 `translate-docs` 之后：

```text
docs/
├── pt-BR/
│   ├── index.md
│   └── guide/getting-started.md
└── zh-Hans/
    ├── index.md
    └── guide/getting-started.md
```

`vitepress` 预设保持 BCP-47 文件夹大小写（`pt-BR`, 而不是 `pt-br`）。
