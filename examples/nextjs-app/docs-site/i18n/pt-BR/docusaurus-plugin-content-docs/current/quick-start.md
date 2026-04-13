---
sidebar_position: 2
title: Primeiros Passos
description: >-
  Obtenha seu primeiro documento traduzido em menos de cinco minutos usando o
  ai-i18n-tools com este projeto de exemplo Next.js.
translation_last_updated: '2026-04-13T19:05:59.655Z'
source_file_mtime: '2026-04-13T12:37:25.386Z'
source_file_hash: f28037e8c747358d722aeab10f171799df8f1dc59513a8295af098c8c30f9fa5
translation_language: pt-BR
source_file_path: docs-site/docs/quick-start.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Primeiros Passos

Siga os passos abaixo para executar sua primeira tradução com o `ai-i18n-tools`. Este guia utiliza o projeto de exemplo Next.js que você já está lendo — todos os comandos devem ser executados no diretório `examples/nextjs-app/`.

---

## Pré-requisitos

Antes de começar, certifique-se de ter o seguinte:

- **Node.js 18+** — verifique com `node --version`
- **Uma chave de API do OpenRouter** — cadastre-se em [openrouter.ai](https://openrouter.ai) e copie sua chave no painel
- **npm ou pnpm** — qualquer gerenciador de pacotes funciona

---

## Etapa 1 — Instalar as dependências

```bash
cd examples/nextjs-app
npm install
```

Isso instala o `ai-i18n-tools` junto com os pacotes Next.js e Docusaurus usados por este exemplo.

---

## Etapa 2 — Defina sua chave de API

Crie um arquivo `.env` no diretório `examples/nextjs-app/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

O `ai-i18n-tools` lê essa variável automaticamente. Nunca confirme o `.env` no controle de versão.

---

## Etapa 3 — Revise a configuração

Abra o arquivo `ai-i18n-tools.config.json`. A seção relevante para a tradução da documentação é esta:

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

O array `contentPaths` informa à ferramenta quais diretórios (ou arquivos individuais) devem ser traduzidos. O `outputDir` é o local onde os arquivos traduzidos são gravados.

---

## Etapa 4 — Execute a sincronização

Traduza apenas a documentação (pule as strings da interface e SVGs por enquanto):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

Você verá uma saída semelhante a esta:

```
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

Na segunda execução, a maioria dos segmentos será **acertos no cache** e a tradução será concluída em menos de um segundo.

---

## Etapa 5 — Inspecione a saída

Os arquivos traduzidos são gravados em `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Abra um deles para comparar com o original:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Principais itens para verificar:

- Blocos de código são **idênticos** ao original — nenhum código foi traduzido.
- Valores do front matter (`title`, `description`) são traduzidos.
- Trechos de código em linha `code spans` dentro do texto são preservados exatamente como estão.
- Links mantêm seu `href` original; apenas o texto do link é alterado.

---

## Etapa 6 — Iniciar o Docusaurus

```bash
cd docs-site
npm run start -- --locale de
```

Isso inicia o servidor de desenvolvimento do Docusaurus em alemão. Abra [http://localhost:3000/de/](http://localhost:3000/de/) no seu navegador para navegar pelos documentos traduzidos.

---

## O que explorar a seguir

- Leia o [Exemplo de Recursos de Tradução](./feature-showcase) para ver todos os elementos Markdown que o `ai-i18n-tools` pode processar.
- Edite uma frase em `docs-site/docs/feature-showcase.md` e execute novamente o comando `sync` — apenas esse segmento será enviado ao LLM; o restante será fornecido a partir do cache.
- Adicione um termo ao arquivo `glossary-user.csv` para garantir a consistência terminológica em todos os idiomas.
- Habilite o pipeline de strings da interface definindo `"translateUIStrings": true` e execute o `sync` sem a flag `--no-ui`.
