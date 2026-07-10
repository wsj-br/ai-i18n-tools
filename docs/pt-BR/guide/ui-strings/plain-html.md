<a id="plain-html-apps"></a>
# Aplicativos HTML simples

<a id="marking-html-for-translation"></a>
## Marcando HTML para tradução

Para aplicativos HTML simples (sem chamadas `t("…")` no markup), marque elementos traduzíveis com atributos e deixe o `extract` capturar o texto em inglês do próprio elemento — sem literais de string duplicados.

Prefira a forma básica (o atributo não tem valor; o texto fonte é lido do elemento):

- `data-i18n` — a chave é o `textContent` do elemento; em tempo de execução, você define o `el.textContent = t(key)`.
- `data-i18n-title` — a chave é o `title` do elemento; em tempo de execução, você define o `title` traduzido.
- `data-i18n-placeholder` — a chave é o `placeholder` do elemento.

Use a forma com valor `data-i18n="Some key"` apenas quando a forma básica não puder funcionar: elementos de conteúdo misto (texto intercalado com tags filhas) ou quando a chave precisar ser diferente do texto visível. Desative um elemento (e sua subárvore) com `data-i18n-ignore`.

Restrição: a forma básica `data-i18n` é apenas para elementos de texto folha (um único nó de texto, sem elementos filhos), pois a definição de `textContent` substitui quaisquer filhos. Para um parágrafo como `Run <code>build</code> now.`, envolva cada trecho de texto em seu próprio marcador:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Adicione os marcadores manualmente ou deixe o comando `mark-html` inserir os marcadores básicos para você. Por padrão, ele é uma simulação — relata quantos marcadores adicionaria por arquivo e lista quaisquer elementos de conteúdo misto que precisam de um `<span data-i18n>` manual — e só grava com `--write`:

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html` é idempotente, respeita `data-i18n-ignore`, nunca marca elementos semelhantes a código (`code`, `pre`, `kbd`, `samp`, `var`) ou texto vazio/apenas numérico, e nunca emite um marcador com valor. Após a marcação, envolva manualmente quaisquer fragmentos de conteúdo misto relatados, em seguida, adicione `.html` a `ui.uiExtractor.extensions` para que `extract` capture as strings:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## Exemplo prático: localizando um aplicativo HTML simples (o painel incluído)

O Painel de Tradução do próprio pacote (`src/dashboard-app`) usa esses mesmos marcadores. Seu `index.html` carrega marcadores brutos como:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` escreve cada string de origem em inglês no catálogo (`strings.json`), e `translate-ui` preenche um pacote plano por localidade, com chaves do texto de origem em inglês. Para um aplicativo HTML estático típico, você apontaria `ui.flatOutputDir` para um diretório servido pela web, como `public/locales/`:

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

Em tempo de execução, carregue o pacote da localidade ativa e percorra os elementos marcados. A chave vem do valor do marcador quando presente, caso contrário, do próprio texto/título/placeholder do elemento (normalizado da mesma forma que o extrator normaliza espaços em branco):

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

A parte de "marker-walking" deste trecho é exatamente `applyStaticI18n` em [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js). Como o texto de origem em inglês é a chave do catálogo, as strings não traduzidas automaticamente retornam para o inglês.

Para uma **contraparte estática executável** (sem servidor Node — `fetch('/locales/{locale}.json')` em vez de `/api/ui-i18n`), consulte o exemplo de workspace [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). Ele usa os mesmos padrões de marcador com uma UI estilo painel simplificada; experimente Português (Brasil) em `http://localhost:3090/?locale=pt-BR` após `pnpm dev`.

Como o painel incluído difere: como ele tem um servidor Node, ele não busca um `/locales/{locale}.json` estático. O cliente chama `GET /api/ui-i18n`, e o servidor resolve o local ativo (`--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > sistema operacional do host) e retorna `{ locale, dir, bundle }`. O cliente então define `document.documentElement` `lang`/`dir` a partir dessa resposta (em vez de ler `lang` para escolher o local) antes de chamar `applyStaticI18n`. Os pacotes em si não são o conteúdo da ferramenta em tradução — são as próprias strings da interface do usuário do painel, enviadas em `src/i18n/locales/{locale}.json` (copiadas para `dist/i18n/locales` na compilação) e lidas no lado do servidor por `loadUiBundle` em [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts). O `t()` do painel também suporta interpolação ```{{name}}```, ao contrário do `t` mínimo acima.
