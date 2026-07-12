---
sidebar_position: 2
title: Início Rápido
description: >-
  Obtenha seu primeiro documento traduzido em menos de cinco minutos usando
  ai-i18n-tools com este projeto de exemplo do Docusaurus.
translation_last_updated: '2026-07-12T01:33:45.253Z'
source_file_mtime: '2026-07-10T22:50:38.005Z'
source_file_hash: bb346aef23ab36ff210d39e8af7bbe4359fe6fcc88ad584942ebe6504f2a0f7f
translation_language: pt-BR
source_file_path: docs/quick-start.md
translation_models:
  - google/gemini-2.5-flash
---



Siga os passos abaixo para executar sua primeira tradução com `ai-i18n-tools`. Este guia usa o exemplo do Docusaurus que você já está lendo — cada comando deve ser executado a partir do diretório `examples/docusaurus-docs/`.

---

## Pré-requisitos {#prerequisites}

Antes de começar, certifique-se de ter o seguinte:

- **Node.js 22.16+** — verifique com `node --version`
- **Uma chave de API OpenRouter** — cadastre-se em [openrouter.ai](https://openrouter.ai) e copie sua chave do painel
- **pnpm 10.33+** — verifique com `pnpm --version`

---

## Passo 1 — Instalar dependências {#step-1--install-dependencies}

```bash
cd examples/docusaurus-docs
pnpm install
```

Isso instala `ai-i18n-tools` junto com os pacotes Docusaurus usados por este exemplo.

---

## Passo 2 — Defina sua chave de API {#step-2--set-your-api-key}

Crie um arquivo `.env` no diretório `examples/docusaurus-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lê esta variável automaticamente. Nunca envie `.env` para controle de versão.

---

## Passo 3 — Revise a configuração {#step-3--review-the-configuration}

Abra `ai-i18n-tools.config.json`. A seção relevante para a tradução da documentação se parece com isto:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus docs and shell JSON catalogs",
      "contentPaths": ["docs/"],
      "outputDir": "i18n",
      "docusaurusCatalogDir": "i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in static assets",
              "search": "screenshots/pt-BR/]+/",
              "replace": "screenshots/pt-BR/"
            }
          ]
        }
      }
    }
  ]
}
```

O array `contentPaths` informa à ferramenta quais diretórios (ou arquivos individuais) traduzir. O `outputDir` é onde os arquivos traduzidos são gravados.

---

## Passo 4 — Execute a sincronização {#step-4--run-the-sync}

Traduza a documentação e o JSON do shell Docusaurus:

```bash
pnpm run i18n:sync
```

Você verá uma saída semelhante a:

```text
[docs] Scanning docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Na segunda execução, a maioria dos segmentos serão **acertos de cache** e a tradução será concluída em menos de um segundo.

---

## Passo 5 — Inspecione a saída {#step-5--inspect-the-output}

Os arquivos traduzidos são gravados em `i18n/<locale>/docusaurus-plugin-content-docs/current/`. Abra um para compará-lo com a fonte:

```bash
# Compare Spanish translation with English source
diff docs/quick-start.md \
     i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Principais pontos a verificar:

- Blocos de código são **idênticos** à fonte — nenhum código foi traduzido.
- Os valores de front matter (`title`, `description`) são traduzidos.
- `code spans` inline dentro do texto são preservados literalmente.
- Links mantêm seus `href` originais; apenas o texto âncora muda.

---

## Passo 6 — Iniciar o Docusaurus {#step-6--start-docusaurus}

```bash
pnpm start
```

Isso compila todos os locais e serve o site para que o menu de idiomas da barra de navegação funcione. Abra [http://localhost:3100/quick-start](http://localhost:3100/quick-start), depois mude para Português (Brasil) — por exemplo [http://localhost:3100/pt-BR/feature-showcase](http://localhost:3100/pt-BR/feature-showcase).

Ao editar fontes em inglês, `pnpm dev` oferece recarregamento instantâneo apenas para o local padrão; execute novamente `pnpm start` para atualizar todos os locais após as alterações.

---

## O que explorar a seguir {#what-to-explore-next}

- Leia o [Recursos de Tradução em Destaque](./feature-showcase) para ver todos os elementos Markdown que o `ai-i18n-tools` pode manipular.
- Edite uma frase em `docs/feature-showcase.md` e execute novamente `pnpm run i18n:sync` — apenas esse segmento será enviado ao LLM; o restante será servido do cache.
- Adicione um termo a `glossary-user.csv` para garantir terminologia consistente em todas as localidades.
- Para strings de UI, plurais cardinais, tradução SVG e um README simples no mesmo repositório, consulte o [exemplo Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) combinado.
