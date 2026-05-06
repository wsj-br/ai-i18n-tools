# Exemplo de Aplicativo Next.js

Este exemplo mostra como usar `ai-i18n-tools` com um aplicativo **TypeScript** [Next.js](https://nextjs.org/) e pnpm. A interface corresponde ao [exemplo do aplicativo de console](../../console-app/), utilizando as mesmas chaves de texto e um seletor de localidade controlado por `locales/ui-languages.json` (localidade de origem `en-GB` primeiro, seguida pelos idiomas de tradução). `[src/lib/i18n.ts](../src/lib/i18n.ts)` gera `localeLoaders` a partir desse manifesto (todas as `code` exceto `SOURCE_LOCALE`), como no aplicativo de console; os pacotes são carregados com `fetch` para `public/locales/<locale>.json`.

Aninhado nesta pasta há um pequeno site [Docusaurus](https://docusaurus.io/) (`[docs-site/](../docs-site/)`) com um subconjunto selecionado da documentação do projeto principal para navegação local.

**Leia em outros idiomas:**
[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

## Captura de tela

captura de tela

## Requisitos

- Node.js >= 22.16 (compatível com o campo `engines` do repositório)
- [pnpm](https://pnpm.io/) >= 10.33 (veja o `package.json` `packageManager` / `engines` na raiz)
- Uma chave de API [OpenRouter](https://openrouter.ai) (para gerar traduções)

## Instalação

A partir da raiz do repositório, execute:

```bash
pnpm install
```

O `pnpm-workspace.yaml` na raiz inclui a biblioteca e este exemplo, portanto o pnpm vincula `ai-i18n-tools` via `"ai-i18n-tools": "workspace:^"` em `package.json`. Nenhuma etapa separada de build ou link é necessária — após alterar as fontes da biblioteca, execute `pnpm run build` na raiz do repositório e o exemplo usará automaticamente a `dist/` atualizada.

**Diretório de trabalho:** Execute o aplicativo Next.js e todos os comandos `pnpm run i18n:*` a partir de `examples/nextjs-app` (onde está localizado o `ai-i18n-tools.config.json`), ou passe `--config` / defina o diretório de trabalho para que a CLI localize essa configuração.

## Uso

### Aplicativo Next.js (porta 3030)

A partir da raiz do repositório após `pnpm install`:

```bash
cd examples/nextjs-app
```

Servidor de desenvolvimento:

```bash
pnpm dev
```

Build de produção e inicialização:

```bash
pnpm build
pnpm start
```

Abra [http://localhost:3030](http://localhost:3030). Use o menu suspenso Localidade para alternar o idioma (ID da localidade / nome em inglês / rótulo nativo). Você também pode acessar diretamente uma localidade usando a string de consulta `?locale=<code>` (por exemplo, `[?locale=ar](http://localhost:3030/?locale=ar)`); a página mantém o menu suspenso e a URL sincronizados.

### Exemplo de plurais cardinais

A página inicial inclui uma demonstração de plurais (“Plurais: exemplo de uso da geração automática”) que mostra como as mensagens de plural cardinal são conectadas de ponta a ponta:

- **Renderização:** A mesma mensagem é repetida para várias contagens de exemplo definidas em `PLURAL_DEMO_COUNTS` em `[src/app/page.tsx](../src/app/page.tsx)` (por padrão 1, 2, 5 e 50), permitindo comparar o comportamento de plural entre localidades (incluindo idiomas com múltiplas formas de plural, como o árabe).
- **API:** Cada linha usa `t("This page has {{count}} sections", { plurals: true, count })`. Passe `plurals: true` para que a extração e a tradução tratem a chave como um grupo de plurais; `count` seleciona a forma de plural ativa em tempo de execução.
- **Tempo de execução:** As formas de plural são resolvidas em tempo de execução por meio dos auxiliares configurados em `[src/lib/i18n.ts](../src/lib/i18n.ts)`; consulte a documentação de tempo de execução do pacote (`ai-i18n-tools/runtime`) para obter uma visão completa.
- **Saídas:** As localidades de destino usam entradas com sufixos em `public/locales/<locale>.json`; a localidade de origem mantém os pacotes de plurais em `public/locales/en-GB.json` ao lado das entradas planas habituais.

O exemplo também exibe um pequeno bloco de código cinza com o trecho JSX acima dos exemplos em execução para referência rápida.

A página inicial também exibe uma imagem SVG de demonstração na parte inferior. A URL da imagem segue `public/assets/translation_demo_svg.<locale>.svg` (layout plano do bloco `svg` em `ai-i18n-tools.config.json`). Após executar `translate-svg`, cada arquivo de localidade contém conteúdo traduzido `<text>`, `<title>` e `<desc>`; até então, as cópias confirmadas podem parecer idênticas entre localidades.

### Site de documentação (porta 3040)

```bash
cd examples/nextjs-app/docs-site
pnpm install
pnpm build
pnpm start
```

Se não abrir automaticamente, abra seu navegador e acesse [http://localhost:3040](http://localhost:3040).

## Idiomas suportados

| Código  | Idioma               |
| ------- | -------------------- |
| `ar`    | Árabe                |
| `en-GB` | Inglês (UK) padrão   |
| `fr`     | Francês                |
| `de`     | Alemão                 |
| `pt-BR`  | Português (Brasil)   |
| `es`     | Espanhol               |

## Fluxo de trabalho

### 1. Extrair strings da interface

Analisa `src/` em busca de chamadas `t()` e atualiza `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Traduzir

Defina `OPENROUTER_API_KEY`, depois execute a partir de ``examples/nextjs-app`` todos os passos de tradução (JSON plano da interface → arquivos SVG → documentos) em ordem:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate
```

Para executar apenas um estágio, use a CLI (mesmo diretório de trabalho):

```bash
ai-i18n-tools translate-ui
ai-i18n-tools translate-svg
ai-i18n-tools translate-docs
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

1. ``ai-i18n-tools extract`` — extrai as strings da interface e atualiza `locales/strings.json`.
2. ``ai-i18n-tools translate-ui`` — gera JSON plano de localidade em `public/locales/` a partir de `locales/strings.json`.
3. ``ai-i18n-tools translate-svg`` — traduz arquivos SVG de `images/` para `public/assets/` quando `features.translateSVG` é verdadeiro e o bloco `svg` está definido em `ai-i18n-tools.config.json` (este exemplo usa nomes planos: `translation_demo_svg.<locale>.svg`).
4. ``ai-i18n-tools translate-docs`` — traduz o **conteúdo das páginas** do Docusaurus (markdown/MDX em `docs-site/docs/`) para `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`, e quando `features.translateJSON` e `jsonSource` estão definidos, também traduz o **JSON do shell** de `docs-site/i18n/en/` (conforme `documentations[]` em `ai-i18n-tools.config.json`; veja o Fluxo de Trabalho 2 em `docs/GETTING_STARTED.md` na raiz do repositório).

Você pode executar qualquer etapa individualmente (por exemplo, `ai-i18n-tools translate-svg`) quando apenas as fontes dessa etapa forem alteradas.

Se os logs mostrarem muitos pulos e poucas gravações, a ferramenta está reutilizando saídas existentes e o cache SQLite em `.translation-cache/`. Para forçar a retradução, passe `--force` ou `--force-update` no comando relevante, quando suportado, ou execute `pnpm run i18n:clean` (exclui apenas `.translation-cache/` nesta pasta) e traduza novamente.

Este exemplo possui `features.translateSVG` e um bloco `svg`, portanto `i18n:sync` executa o mesmo passo SVG que `translate-svg`. Você ainda pode chamar `ai-i18n-tools translate-svg` isoladamente para essa etapa, ou usar `pnpm run i18n:translate` para a ordem fixa UI → SVG → docs sem executar `extract`.

### 3. Limpar o cache e re-traduzir

Após alterações na interface ou na documentação, algumas entradas de cache podem estar desatualizadas ou órfãs (por exemplo, se um documento foi removido ou renomeado). `i18n:cleanup` executa `sync --force-update` primeiro e depois remove entradas desatualizadas:

```bash
pnpm run i18n:cleanup
```

Para forçar a re-tradução da interface, documentos ou SVGs, use `--force`. Isso ignora o cache e re-traduz usando modelos de IA.

Para re-traduzir todo o projeto (UI, documentos, SVGs):

```bash
pnpm run i18n:sync --force
```

Para re-traduzir um único idioma:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Para re-traduzir apenas as strings da interface para um idioma específico:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Edições Manuais (Editor de Cache)

Você pode iniciar uma interface web local para revisar e editar manualmente traduções no cache, nas strings da interface e no glossário (a partir de ``examples/nextjs-app``):

```bash
pnpm run i18n:editor
```

A partir de ``docs-site/``, ``pnpm run i18n:editor`` faz o mesmo (ele `cd` para esta pasta e executa a CLI).

> **Importante:** Se você editar manualmente uma entrada no editor de cache, precisa executar um `sync --force-update` (por exemplo, `pnpm run i18n:sync --force-update`) para reescrever os arquivos planos gerados ou os arquivos markdown com a tradução atualizada. Observe também que, se o texto original for alterado no futuro, sua edição manual será perdida, pois a ferramenta gerará um novo hash para o novo texto de origem.

## Estrutura do Projeto

```text
nextjs-app/
├── ai-i18n-tools.config.json # UI, docs, svg, glossary; `cacheDir`: .translation-cache/
├── glossary-user.csv         # Optional user glossary (see config `glossary.userGlossary`)
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
│   ├── en-GB.json            # Source locale bundle (includes plural keys)
│   ├── ui-languages.json     # Copied/served for runtime if needed
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   ├── pt-BR.json
│   └── ar.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
├── translated-docs/          # README translations (flat markdown; second `documentations` block)
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # English sources for this example (curated subset)
    ├── docusaurus.config.mjs
    └── i18n/                 # Translated docs + Docusaurus JSON catalogs (committed in git)
```

O markdown em inglês para o site de exemplo está localizado em `docs-site/docs/`. Não há sincronização automática a partir da raiz do repositório `docs/`; atualize esses arquivos diretamente ao renovar o conteúdo. Para âncoras de títulos estáveis, use o ``write-heading-ids`` do Docusaurus a partir de ``docs-site/`` (veja ``pnpm run write-heading-ids`` em `[docs-site/package.json](../docs-site/package.json)`).

As traduções da interface do usuário, SVGs de demonstração, traduções raiz de `README`, e saídas do Docusaurus são confirmadas em `public/locales/`, `public/assets/`, `locales/strings.json`, `translated-docs/` e `docs-site/i18n/`. Após alterar as fontes e executar ``pnpm run i18n:translate`` ou ``pnpm run i18n:sync``, reinicie os servidores de desenvolvimento do Next.js e do Docusaurus conforme necessário. O roteamento por localidade e ``localeConfigs`` são definidos em `**docs-site/docusaurus.config.mjs**`.
