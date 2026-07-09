<a id="examples"></a>
# Exemplos

Projetos executáveis em [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) no GitHub — cada um com sua própria configuração, saídas de localidade confirmadas e README. Você pode explorar arquivos traduzidos sem uma chave de API; a reexecução da tradução requer uma chave de provedor ([Provedores e modelos](/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Executar de forma autônoma (`npx degit`)

Copie um exemplo sem clonar o repositório completo. Cada um declara `"ai-i18n-tools": "^1.7.2"` e instala a CLI do npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Se você clonou o repositório [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) **inteiro**, execute `pnpm install` e `pnpm run build` na raiz do repositório, depois `cd examples/<name>`.

<a id="list-of-examples"></a>
## Lista de Exemplos

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| Exemplo | Melhor para | Copiar com degit | Executar |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | Aplicativo funcional menor com strings de UI `t()` + tradução de README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurais + painel; docs Docusaurus + README simples + ativos SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (aplicativo `:3030`; `cd docs-site && pnpm start` para docs `:3040`) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Página de destino Astro: HTML de página inteira + híbrido `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Site de documentação Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Site de docs VitePress + tema JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Escolha ou compare um provedor LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Teste de regressão de markdown / tradução CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Cada nome de **Exemplo** se vincula ao seu README do GitHub com configuração completa, comandos e layout do projeto — ou navegue pelo [índice de exemplos no repositório](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).
