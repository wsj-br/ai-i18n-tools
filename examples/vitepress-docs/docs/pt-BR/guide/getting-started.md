# Começando

## Pré-requisitos

- Node.js ≥ 22.16
- pnpm ≥ 11
- Chave da API OpenRouter (apenas ao reexecutar a tradução)

## Experimente este exemplo de forma independente

```bash
npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs
cd vitepress-docs
pnpm install
pnpm run docs:dev
```

Abra [http://localhost:3060/](http://localhost:3060/) e mude o idioma na barra de navegação (`pt-BR`, `zh-Hans`).

## Traduzir

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Configuração: [`ai-i18n-tools.config.json`](../ai-i18n-tools.config.json).

## Layout

Fontes em inglês:

```text
docs/
├── index.md
└── guide/getting-started.md
```

Após `translate-docs`:

```text
docs/
├── pt-BR/
│   ├── index.md
│   └── guide/getting-started.md
└── zh-Hans/
    ├── index.md
    └── guide/getting-started.md
```

O preset `vitepress` mantém a capitalização da pasta BCP-47 (`pt-BR`, não `pt-br`).
