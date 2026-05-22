---
title: Início Rápido
description: >-
  Obtenha seu primeiro documento traduzido em menos de cinco minutos usando o
  ai-i18n-tools com este exemplo do Astro Starlight.
sidebar:
  order: 2
translation_last_updated: '2026-05-22T22:38:15.109Z'
source_file_mtime: '2026-05-22T21:44:09.987Z'
source_file_hash: 2e7e3283a7dc1df486ce3088aa4f1bec3dac1bbce14d43f8d513a52fb0cd1cd9
translation_language: pt-BR
source_file_path: src/content/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



Siga os passos abaixo para executar sua primeira tradução com `ai-i18n-tools`. Este guia utiliza o exemplo Starlight que você está lendo — cada comando deve ser executado a partir do diretório `examples/astro-docs/`.

---

<a id="prerequisites"></a>

## Pré-requisitos
Antes de começar, certifique-se de ter o seguinte:

- **Node.js 22.16+** — verifique com `node --version`
- **Uma chave de API do OpenRouter** — inscreva-se em [openrouter.ai](https://openrouter.ai) e copie sua chave no painel
- **pnpm 10.33+** — verifique com `pnpm --version`

---

<a id="step-1--install-dependencies"></a>

## Etapa 1 — Instalar dependências

```bash
cd examples/astro-docs
pnpm install
```

Isso instala `ai-i18n-tools` (por meio do workspace) junto com Astro e Starlight.

---

<a id="step-2--set-your-api-key"></a>

## Etapa 2 — Defina sua chave de API
Crie um arquivo `.env` no diretório `examples/astro-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` lê essa variável automaticamente. Nunca confirme `.env` no controle de versão.

---

<a id="step-3--review-the-configuration"></a>

## Etapa 3 — Revise a configuração
Abra `ai-i18n-tools.config.json`. A seção relevante para tradução da documentação é semelhante a esta:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": false
  },
  "documentations": [
    {
      "description": "Starlight docs under src/content/docs",
      "contentPaths": [
        "src/content/docs/quick-start.md",
        "src/content/docs/feature-showcase.mdx"
      ],
      "outputDir": "src/content/docs",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "astro-starlight",
        "docsRoot": "src/content/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in public assets",
              "search": "screenshots/pt-BR/",
              "replace": "screenshots/${translatedLocale}/"
            }
          ]
        }
      }
    }
  ]
}
```

O array `contentPaths` informa à ferramenta quais arquivos traduzir. Cópias traduzidas são gravadas em `src/content/docs/<locale>/` (pastas de idiomas do Starlight).

---

<a id="step-4--run-the-sync"></a>

## Etapa 4 — Execute a sincronização
Traduza a documentação:

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Você verá uma saída semelhante a esta:

```text
[docs] Scanning src/content/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.mdx — segments translated (5 locales)
[docs] quick-start.md — segments translated (5 locales)
```

Na segunda execução, a maioria dos segmentos serão **acertos no cache** e a tradução será concluída rapidamente.

---

<a id="step-5--inspect-the-output"></a>

## Etapa 5 — Inspecione a saída
Arquivos traduzidos são gravados em `src/content/docs/<locale>/`. Abra um deles para comparar com o original:

```bash
# Compare Spanish translation with English source
diff src/content/docs/quick-start.md \
     src/content/docs/es/quick-start.mdx
```

Principais pontos para verificar:

- Os blocos de código são **idênticos** ao código-fonte — nenhum código foi traduzido.
- Os valores do front matter (`title`, `description`) são traduzidos.
- Os elementos `code spans` embutidos no texto são preservados exatamente como estão.
- Os links mantêm seu `href` original; somente o texto âncora é alterado.

---

<a id="step-6--start-starlight"></a>

## Etapa 6 — Iniciar o Starlight

```bash
pnpm dev
```

Abra [http://localhost:3050/de/quick-start](http://localhost:3050/de/quick-start) (ou escolha um idioma no seletor de idiomas) para navegar pelos documentos traduzidos.

---

<a id="step-7--explore-the-nextjs-demo-locale--cardinal-plurals"></a>

## Etapa 7 — Explorar o demo do Next.js (idioma + plurais cardinais)
A tradução da documentação neste tutorial usa apenas **Markdown**. O repositório também inclui uma interface do **Next.js** em `examples/nextjs-app/` na porta **3030**, onde é possível ver chamadas `t()`, URLs `?locale=` e um demo de **plural cardinal**.

```bash
cd ../nextjs-app
pnpm dev
```

Em seguida, abra [http://localhost:3030](http://localhost:3030).

- Alterne os idiomas usando o menu suspenso **Locale**, ou acrescente `?locale=<code>` (por exemplo, `http://localhost:3030/?locale=ar`).
- Role até **Plurals: automatic generation usage example** e compare as regras de plural entre os idiomas.
- Veja a seção **Cardinal plurals example** no [README do exemplo Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

<a id="what-to-explore-next"></a>

## O que explorar a seguir
- Leia o [Translation Feature Showcase](./feature-showcase) para ver todos os elementos Markdown que o `ai-i18n-tools` pode processar.
- Edite uma frase em `src/content/docs/feature-showcase.mdx` e execute novamente `sync` — apenas esse segmento será enviado ao LLM.
- Adicione um termo a `glossary-user.csv` para garantir a consistência terminológica em todos os idiomas.
- Compare este site Starlight com o demo do Docusaurus em `examples/nextjs-app/docs-site/` (mesmo conteúdo, `style: "docusaurus"` vs `style: "astro-starlight"`).
