---
sidebar_position: 2
title: Quick Start
description: >-
  Get your first translated document in under five minutes using ai-i18n-tools
  with this Next.js example project.
translation_last_updated: '2026-05-04T21:43:23.952Z'
source_file_mtime: '2026-05-04T21:42:57.361Z'
source_file_hash: 3781b3b6f01b12a0aa8b7f15cc792f0282715729066828ccf371d959d933a447
translation_language: pt-BR
source_file_path: docs-site/docs/quick-start.backup.2026-05-04T21-42-57-363Z.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Siga os passos abaixo para executar sua primeira tradução com `ai-i18n-tools`. Este guia utiliza o projeto de exemplo em Next.js que você já está lendo — todos os comandos devem ser executados no diretório `examples/nextjs-app/`.

---

## Pré-requisitos {#prerequisites}

Antes de começar, certifique-se de ter o seguinte:

- **Node.js 22.16+** — verifique com `node --version`
- **Uma chave de API do OpenRouter** — inscreva-se em [openrouter.ai](https://openrouter.ai) e copie sua chave no painel
- **pnpm 10.33+** — verifique com `pnpm --version`

---

## Etapa 1 — Instalar as dependências {#step-1--install-dependencies}

```bash
cd examples/nextjs-app
npm install
```

Isso instala `ai-i18n-tools` junto com os pacotes Next.js e Docusaurus usados por este exemplo.

---

## Etapa 2 — Defina sua chave de API {#step-2--set-your-api-key}

Crie um arquivo `.env` no diretório `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lê essa variável automaticamente. Nunca confirme `.env` no controle de versão.

---

## Etapa 3 — Revise a configuração {#step-3--review-the-configuration}

Abra `ai-i18n-tools.config.json`. A seção relevante para a tradução da documentação é esta:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

O array `contentPaths` informa à ferramenta quais diretórios (ou arquivos individuais) devem ser traduzidos. O `outputDir` é o local onde os arquivos traduzidos são salvos.

---

## Etapa 4 — Execute a sincronização {#step-4--run-the-sync}

Traduza apenas a documentação (por enquanto, ignore strings da interface e SVGs):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Você verá uma saída semelhante a esta:

```text
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Na segunda execução, a maioria dos segmentos será **acertos no cache** e a tradução será concluída em menos de um segundo.

---

## Etapa 5 — Inspecione a saída {#step-5--inspect-the-output}

Os arquivos traduzidos são salvos em `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Abra um deles para comparar com o original:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Itens importantes para verificar:

- Os blocos de código são **idênticos** ao original — nenhum código foi traduzido.
- Os valores do front matter (`title`, `description`) são traduzidos.
- Os `code spans` embutidos no texto são preservados literalmente.
- Os links mantêm seu `href` original; apenas o texto âncora é alterado.

---

## Etapa 6 — Inicie o Docusaurus {#step-6--start-docusaurus}

```bash
cd docs-site
npm run start -- --locale de
```

Isso inicia o servidor de desenvolvimento do Docusaurus em alemão. Abra [http://localhost:3000/de/](http://localhost:3000/de/) no seu navegador para navegar pelos documentos traduzidos.

---

## Etapa 7 — Explore o demo do Next.js (pluralidade + localidade) {#step-7--explore-the-nextjs-demo-locale--cardinal-plurals}

A tradução da documentação neste tutorial usa apenas **Markdown**. O mesmo repositório de exemplo também inclui uma interface **Next.js** na porta **3030**, onde você pode ver chamadas **`t()`**, URLs **`?locale=`** e uma demonstração de **plurais cardinais**.

De `examples/nextjs-app/`:

```bash
npm run dev
```

Em seguida, abra [http://localhost:3030](http://localhost:3030).

- Alterne os idiomas com o menu suspenso **Locale**, ou acrescente **`?locale=<code>`** (por exemplo, `http://localhost:3030/?locale=ar`). A interface mantém a string de consulta e o menu em sincronia.
- Role até **Plurais: exemplo de uso da geração automática**. A página repete “This page has … sections” para contagens fixas de exemplo (**1**, **2**, **5**, **50**) para que você possa comparar as regras de plural entre localidades (incluindo idiomas com múltiplas formas plurais).
- As chamadas usam **`t("…", { plurals: true, count })`**. Com **`extract`** / **`translate-ui`**, essa chave se torna um grupo plural em `locales/strings.json`; arquivos **`public/locales/*.json`** planos contêm as formas com sufixo. A integração em tempo de execução está em **`src/lib/i18n.ts`** — veja a seção **Cardinal plurals example** no [exemplo README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md) para um guia rápido.

---

## O que explorar a seguir {#what-to-explore-next}

- Leia o [Translation Feature Showcase](./feature-showcase) para ver todos os elementos Markdown que o `ai-i18n-tools` pode processar — incluindo como **cadeias de texto de plurais cardinais** se relacionam com este pipeline de documentação.
- Edite uma frase em `docs-site/docs/feature-showcase.md` e execute novamente `sync` — apenas esse segmento será enviado ao LLM; o restante será servido do cache.
- Adicione um termo a `glossary-user.csv` para garantir terminologia consistente em todos os idiomas.
- Habilite o pipeline de cadeias de interface definindo `"translateUIStrings": true` e executando `sync` sem a flag `--no-ui`.
