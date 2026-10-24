<a id="examples"></a>
# Exemplos

Projetos executáveis em [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) no GitHub — cada um com sua própria configuração, saídas de localidade confirmadas e README. Você pode explorar arquivos traduzidos sem uma chave de API; a reexecução da tradução requer uma chave de provedor ([Provedores e modelos](/pt-BR/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Executar de forma autônoma (`npx degit`)

Copie um exemplo sem clonar o repositório completo.

<a id="node-examples"></a>
### Exemplos em Node.js

Cada exemplo em Node.js declara um intervalo de versão (caret range) publicado de `ai-i18n-tools` que corresponde à versão atual do pacote e instala a CLI a partir do npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Exemplos em Python

`python-streamlit`, `python-flask`, `python-fastapi` e `python-gettext` não possuem `package.json`. Os comandos `degit` na tabela abaixo são válidos. Você também pode baixar `ai-i18n-tools-python-examples.zip` a partir do [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases). Esse arquivo zip contém os mesmos quatro diretórios. Ele não faz parte do pacote npm e não está dentro do executável independente.

`python-streamlit`, `python-flask` e `python-fastapi` usam um virtualenv e `pip install -r requirements.txt`. `python-gettext` usa apenas a biblioteca padrão. Traduza com o [executável independente](/pt-BR/guide/installation#standalone-executables).

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

No Windows, ative `.venv\Scripts\activate`.

Se você clonou o repositório **inteiro** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools), execute `pnpm install` e `pnpm run build` na raiz do repositório e, em seguida, `cd examples/<name>`. Os exemplos de Workspace (Node.js) usam a CLI local por meio de seus scripts `pnpm run i18n:*`, ou o `ai-i18n-tools …` puro após a [configuração do PATH](/pt-BR/guide/installation#using-the-cli). Os exemplos em Python nesse checkout traduzem com `node ../../bin/ai-i18n-tools.mjs` após a compilação. Consulte [Instalação — Monorepo clonado](/pt-BR/guide/installation#cloned-monorepo).

<a id="list-of-examples"></a>
## Lista de Exemplos

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

| Exemplo | Melhor para | Copiar com degit | Executar |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | Aplicativo funcional menor com strings de UI `t()` + tradução de README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurais + painel; documentos Docusaurus aninhados + README simples + ativos SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (aplicativo `:3030`; `cd docs-site && pnpm start` para documentos `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Somente site de documentação Docusaurus (predefinição `docusaurus`) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; compilação + serviço, menu de localidade funciona) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Página de destino Astro: HTML de página inteira + híbrido `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Site de documentação Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Site de docs VitePress + tema JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / shell de dicionário `.ts` (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / catálogo de interface do usuário (`pt`, `zh`, analisador de ponto) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | HTML simples + marcadores `data-i18n*`; JSON de localidade estática (UI estilo painel) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | HTML puro como documentos: uma página por localidade, imagens localizadas, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Escolha ou compare um provedor LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Teste de regressão de markdown / tradução CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, redefinição + relatório do agente de IA) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Dashboard Streamlit, `t()` / `_()`, JSON com chaves em inglês | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, JSON com chaves em inglês | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, localidade ContextVar, `t()` / `_()`, JSON com chaves em inglês | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | CLI GNU gettext existente; `extract` / `translate-ui` atualiza `.po` e `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

Cada nome de **Exemplo** se vincula ao seu README do GitHub com configuração completa, comandos e layout do projeto — ou navegue pelo [índice de exemplos no repositório](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).

Os exemplos em Node.js instalam a CLI a partir do npm após `pnpm install`. Os quatro exemplos em Python usam `venv` e `pip` (`python-gettext` usa apenas a biblioteca padrão) e o [executável independente](/pt-BR/guide/installation#standalone-executables) para tradução.

<br/>

::: tip Aviso
Os nomes e ícones dos produtos pertencem aos seus respectivos proprietários e são usados apenas para fins de identificação. Este software não é afiliado nem endossado por essas marcas.
:::
