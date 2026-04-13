# Exemplo de Aplicativo Next.js

Este exemplo mostra como usar `ai-i18n-tools` com um aplicativo **TypeScript** [Next.js](https://nextjs.org/) e **pnpm**. A interface corresponde ao [exemplo do aplicativo de console](../../console-app/), usando as mesmas chaves de string e um seletor de localidade controlado por `locales/ui-languages.json` (localidade de origem `en-GB` primeiro, seguida pelos alvos de tradução).

Aninhado sob esta pasta está um pequeno site **[Docusaurus](https://docusaurus.io/)** ([`docs-site/`](../docs-site/)) com cópias da documentação principal do projeto para navegação local.

<small>**Leia em outros idiomas:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [pt-BR](./README.pt-BR.md)</small>

## Captura de Tela

![screenshot](../images/screenshots/pt-BR/screenshot.png)

## Requisitos

- Node.js >= 18
- [pnpm](https://pnpm.io/)
- Uma chave de API [OpenRouter](https://openrouter.ai) (para gerar traduções)

## Instalação

Do **diretório raiz do repositório**, execute:

```bash
pnpm install
```

O arquivo `pnpm-workspace.yaml` raiz inclui a biblioteca e este exemplo, então o pnpm vincula `ai-i18n-tools` via `"ai-i18n-tools": "workspace:^"` em `package.json`. Nenhuma etapa de construção ou vinculação separada é necessária — após alterar as fontes da biblioteca, execute `pnpm run build` na raiz do repositório e o exemplo irá pegar o `dist/` atualizado automaticamente.

## Uso

### Aplicativo Next.js (porta 3030)

Servidor de desenvolvimento:

```bash
pnpm dev
```

Construção e início de produção:

```bash
pnpm build
pnpm start
```

Abra [http://localhost:3030](http://localhost:3030). Use o dropdown de **Localidade** para mudar o idioma (ID da localidade / nome em inglês / rótulo nativo).

A página inicial também mostra um **SVG de demonstração** na parte inferior. A URL da imagem segue `public/assets/translation_demo_svg.<locale>.svg` (layout plano do bloco `svg` em `ai-i18n-tools.config.json`). Após executar `translate-svg`, cada arquivo de localidade contém `<text>`, `<title>` e `<desc>` traduzidos; até então, cópias comprometidas podem parecer idênticas entre as localidades.

### Site de Documentação (porta 3040)

```bash
cd docs-site
pnpm install
pnpm start
```

Abra [http://localhost:3040](http://localhost:3040) (Inglês). Em **desenvolvimento**, o Docusaurus serve **uma localidade por vez**: caminhos como `/es/getting-started` **404** a menos que você execute `pnpm run start:es` (ou `start:fr`, `start:de`, `start:pt-BR`). Após `pnpm build && pnpm serve`, todas as localidades estão disponíveis. Veja [`docs-site/README.md`](../README.md).

## Idiomas Suportados

| Código   | Idioma               |
| -------- | -------------------- |
| `en-GB`  | Inglês (Reino Unido) padrão |
| `es`     | Espanhol             |
| `fr`     | Francês              |
| `de`     | Alemão               |
| `pt-BR`  | Português (Brasil)   |

## Fluxo de Trabalho

### 1. Extrair strings da UI

Escaneia `src/` em busca de chamadas `t()` e atualiza `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Traduzir

Defina `OPENROUTER_API_KEY`, e então execute os scripts de tradução:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate-ui
pnpm run i18n:translate-svg
pnpm run i18n:translate-docs
```

### Comando de sincronização

O comando de sincronização executa a extração e todas as etapas de tradução em sequência:

```bash
pnpm run i18n:sync
```

ou

```bash
ai-i18n-tools sync
```

As etapas são executadas na ordem:

1. **`ai-i18n-tools extract`** — extrai strings da UI e atualiza `locales/strings.json`.
2. **`ai-i18n-tools translate-ui`** — escreve JSON de localidade plano em `public/locales/` a partir de `locales/strings.json`.
3. **`ai-i18n-tools translate-svg`** — traduz ativos SVG de `images/` para `public/assets/` conforme o bloco `svg` em `ai-i18n-tools.config.json` (este exemplo usa nomes planos: `translation_demo_svg.<locale>.svg`).
4. **`ai-i18n-tools translate-docs`** — traduz markdown do Docusaurus em `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (veja **Fluxo de Trabalho 2** em `docs/GETTING_STARTED.md` na raiz do repositório).

Você pode executar qualquer etapa individualmente (por exemplo, `ai-i18n-tools translate-svg`) quando apenas as fontes para aquele fluxo de trabalho mudaram.

Se os logs mostrarem muitos pulos e poucas gravações, a ferramenta está reutilizando **saídas existentes** e o **cache SQLite** em `.translation-cache/`. Para forçar a re-tradução, passe `--force` ou `--force-update` no comando relevante onde suportado, ou execute `pnpm run i18n:clean` e traduza novamente.

Este exemplo de configuração inclui `svg`, então **`i18n:sync` executa a mesma etapa SVG que `translate-svg`**. Você ainda pode chamar `ai-i18n-tools translate-svg` sozinho para essa etapa, ou usar `pnpm run i18n:translate` para a ordem fixa UI → SVG → docs **sem** executar **extract**.

### 3. Limpar cache e re-traduzir

Após alterações na UI ou na documentação, algumas entradas de cache podem estar desatualizadas ou órfãs (por exemplo, se um documento foi removido ou renomeado). `i18n:cleanup` executa `sync --force-update` primeiro, e então remove entradas desatualizadas:

```bash
pnpm run i18n:cleanup
```

Para forçar a re-tradução da UI, documentos ou SVGs, use `--force`. Isso ignora o cache e re-traduz usando modelos de IA.

Para re-traduzir todo o projeto (UI, documentos, SVGs):

```bash
pnpm run i18n:sync --force
```

Para re-traduzir uma única localidade:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Para re-traduzir apenas as strings da UI para uma localidade específica:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Edições Manuais (Editor de Cache)

Você pode iniciar uma interface web local para revisar e editar manualmente traduções no cache, strings da interface e glossário:

```bash
pnpm run i18n:editor
```

> **Importante:** Se você editar manualmente uma entrada no editor de cache, precisará executar um `sync --force-update` (por exemplo, `pnpm run i18n:sync --force-update`) para reescrever os arquivos planos gerados ou arquivos markdown com a tradução atualizada. Também observe que, se o texto fonte original mudar no futuro, sua edição manual será perdida, pois a ferramenta gera um novo hash para o novo texto fonte.

## Estrutura do Projeto

```
nextjs-app/
├── ai-i18n-tools.config.json # `svg` block: images/ → public/assets/ (translate-svg)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── i18n.ts
├── images/
│   └── translation_demo_svg.svg   # Source SVG for translate-svg
├── locales/
│   ├── ui-languages.json
│   └── strings.json          # Generated string catalogue (extract)
├── public/locales/           # Flat per-locale JSON (committed; regenerate with translate-ui)
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   └── pt-BR.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # Source (English)
    └── i18n/                 # Translated docs (Docusaurus layout; committed in git)
```

Fontes de documentos em inglês sob `docs-site/docs/` podem ser sincronizadas a partir da raiz do repositório com `pnpm run sync-docs`, que adiciona âncoras de cabeçalho `{#slug}` e espelha `docusaurus write-heading-ids`; veja o cabeçalho do script em `scripts/sync-docs-to-nextjs-example.mjs`.

Strings da interface traduzidas, SVGs de demonstração e páginas do Docusaurus já estão comprometidos sob `public/locales/`, `public/assets/`, `locales/strings.json`, e `docs-site/i18n/`. Após alterar fontes e executar `i18n:translate`, reinicie os servidores de desenvolvimento do Next.js e Docusaurus conforme necessário; os locais do Docusaurus estão listados em `docs-site/docusaurus.config.js`.
