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
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app"></a>
## Exemplo prático: localização de um aplicativo HTML simples

O exemplo de espaço de trabalho [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) é um aplicativo estático executável que usa esses marcadores de ponta a ponta. Clone-o com `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html`, execute `pnpm install` e `pnpm dev`, e então abra [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) para Português (Brasil).

Seu `public/index.html` contém marcadores simples como:

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json` direciona a extração para `public/` e grava pacotes simples ao lado dos arquivos estáticos:

```jsonc
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

`extract` grava cada string de origem em inglês no catálogo (`public/strings.json`), e `translate-ui` preenche um pacote simples por localidade, usando o texto de origem em inglês como chave:

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

Em tempo de execução, `public/app.js` carrega `/locales/ui-languages.json` para metadados de localidade, resolve a localidade ativa (`?locale=` → `localStorage` → navegador → `en`), busca `/locales/{locale}.json` (ignorado para inglês), e então percorre os elementos marcados. A chave vem do valor do marcador quando presente, caso contrário, do próprio texto / título / placeholder do elemento (normalizado da mesma forma que o extrator normaliza o espaço em branco):

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText` deve permanecer idêntico a `normalizeI18nText` em [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts). Como o texto de origem em inglês é a chave do catálogo, as strings não traduzidas automaticamente retornam ao inglês.

O [Painel de Tradução](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) empacotado usa o mesmo algoritmo `applyStaticI18n` para seus marcadores HTML, mas serve pacotes de localidade de `GET /api/ui-i18n` em vez de arquivos estáticos `/locales/{locale}.json`. Consulte o [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) do exemplo para o fluxo de trabalho completo, layout do projeto e tabela de comparação.
