<a id="plain-html-apps"></a>
# Aplicativos HTML simples

Use este caminho para uma página interativa que permanece em um único arquivo HTML. `extract` lê os marcadores `data-i18n*` para `strings.json`, `translate-ui` grava um pacote JSON plano por localidade, e um script de navegador aplica as strings. O mesmo script pode adicionar sufixos aos nomes de arquivos de imagem e manter os links na página atual.

Para um site estático que deve emitir um arquivo HTML traduzido por localidade (sem tempo de execução, com links entre páginas reescritos), use [páginas HTML](/pt-BR/guide/documents/html-pages) em vez disso. Um arquivo pertence a um único caminho.

<a id="quick-start"></a>
## Início rápido

1. Crie a estrutura com `ai-i18n-tools init -t ui-plain-html` ou adicione a configuração abaixo.
2. Marque o HTML de origem (ou deixe o `mark-html` fazer isso).
3. Aponte `ui.sourceRoots` e `ui.uiExtractor.extensions` para esses arquivos.
4. Execute `extract`, depois `translate-ui` (ou execute ambos com `sync-ui`).
5. Copie `i18n.js` para ao lado da página e carregue-o antes do seu próprio script.
6. Sirva a pasta via HTTP. `file://` não pode `fetch` o JSON de localidade.

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

Exemplo de `ai-i18n-tools.config.json`:

```json
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

A estrutura inicial também adiciona a [configuração do provedor](/pt-BR/guide/providers-and-models) de LLM usada por `translate-ui`; ela foi omitida acima para manter as configurações específicas de HTML visíveis.

`extract` é responsável por `strings.json` e grava `ui-languages.json`; `translate-ui` é responsável pelos arquivos JSON de localidade de destino. Não edite esses arquivos gerados manualmente.

`flatOutputDir` é onde os arquivos de localidade gerados ficam. O `data-locales-base` do script deve apontar para esse diretório como uma URL relativa a `i18n.js` (não à página). Uma base `./locales` em `public/i18n.js` carrega `public/locales/pt-BR.json`. Use uma base relativa para que o site continue funcionando em um subcaminho de implantação.

<a id="obtain-the-runtime"></a>
## Obter o tempo de execução

`i18n.js` é um script clássico (não um módulo). Copie um destes; eles são o mesmo arquivo:

- `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` após instalar o pacote
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- a listagem em [Código-fonte do runtime](#runtime-source)

Carregue-o no final de `<body>` e, em seguida, o seu próprio script. Coloque `class="i18n-pending"` em `<html>` e oculte o corpo enquanto essa classe estiver definida para que o idioma de origem não pisque:

```html
<html lang="en" class="i18n-pending">
  <head>
    <style>
      html.i18n-pending body { visibility: hidden; }
    </style>
  </head>
  <body>
    <!-- page -->
    <script
      src="i18n.js"
      data-source-locale="en"
      data-locales-base="./locales"
      data-storage-key="ai-i18n-locale"
      data-locale-select="#locale-select"
      data-label-mode="native"
    ></script>
    <script src="app.js"></script>
  </body>
</html>
```

Ajuste os atributos do script conforme suas necessidades:

| Atributo | Padrão | Função |
| --- | --- | --- |
| `data-source-locale` | `en` | Localidade que mantém o HTML em inglês e ignora a busca do pacote |
| `data-locales-base` | `./locales` | Diretório de `ui-languages.json` e `{locale}.json`, resolvido em relação à URL do script |
| `data-storage-key` | `ai-i18n-locale` | Chave `localStorage` |
| `data-locale-select` | (nenhum) | Seletor CSS de um `<select>` a ser preenchido a partir do manifesto |
| `data-locale-list` | (nenhum) | Seletor CSS de um elemento a ser preenchido com links de idioma |
| `data-label-mode` | `native` | `native` (`label` do manifesto), `english` (`englishName`), ou `both` (`englishName / label` quando diferem) |

`window.i18n` expõe `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)` e `ready` (uma promise). Aguarde `ready` antes que seu próprio script dependa da localidade resolvida ou dos valores traduzidos. Chame `apply()` após inserir novos elementos marcados.

<a id="marking-html-for-translation"></a>
## Marcando HTML para tradução

Prefira marcadores simples. O texto de origem em inglês permanece no elemento, e esse texto é a chave do catálogo. `extract` o lê; o runtime grava a tradução de volta na mesma propriedade.

- `data-i18n` — a chave é `textContent`. O runtime define `textContent`.
- `data-i18n-title` — a chave é `title`.
- `data-i18n-placeholder` — a chave é `placeholder`.
- `data-i18n-alt` — a chave é `alt`.
- `data-i18n-aria-label` — a chave é `aria-label`.

Um elemento pode conter vários desses. Cada marcador é sua própria entrada de catálogo.

<a id="text"></a>
### Texto

Coloque `data-i18n` em um elemento cujo conteúdo seja apenas texto:

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

O runtime também define `document.title` a partir do elemento `<title>`. Não coloque `data-i18n` em um contêiner de conteúdo misto: o runtime atribui `textContent`, o que removeria seus elementos filhos.

<a id="tooltip"></a>
### Dica de ferramenta

```html
<select title="Filter by locale" data-i18n-title></select>
```

Um controle pode traduzir seu rótulo e seu tooltip como duas chaves:

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

<a id="placeholder"></a>
### Placeholder

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

Placeholder e tooltip no mesmo campo:

```html
<input
  type="text"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-placeholder
  data-i18n-title
/>
```

<a id="alt-text"></a>
### Texto alternativo

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

<a id="accessible-name"></a>
### Nome acessível

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

O rótulo do botão `×` não tem `data-i18n`, então permanece como escrito. O nome acessível é a string que é traduzida.

<a id="mixed-content"></a>
### Conteúdo misto

`data-i18n` lê todo o `textContent` do elemento. Quando uma frase compartilha seu pai com outro elemento, envolva cada sequência de texto:

```html
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers.</span>
</p>
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select"></select>
</label>
```

<a id="source-language-only"></a>
### Apenas idioma de origem

`data-i18n-ignore` ignora esse elemento e seus descendentes tanto para `mark-html` quanto para `extract` de strings de UI. Use-o para linhas de exemplo, identificadores e nomes de marcas:

```html
<a
  href="https://github.com/wsj-br/ai-i18n-tools"
  aria-label="wsj-br/ai-i18n-tools on GitHub"
  data-i18n-ignore
>
  <span>wsj-br/ai-i18n-tools</span>
</a>
<tbody data-i18n-ignore>
  <tr>
    <td>public/index.html</td>
    <td>pt-BR</td>
  </tr>
</tbody>
```

<a id="a-different-catalog-key"></a>
### Uma chave de catálogo diferente

Um marcador com valor nomeia a chave do catálogo. O runtime ainda grava a tradução no elemento (ou no atributo nomeado):

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html` insere os marcadores simples acima. É uma execução de teste, a menos que você passe `--write`. Ele ignora subárvores `data-i18n-ignore`, elementos semelhantes a código (`code`, `pre`, `kbd`, `samp`, `var`) e texto vazio ou apenas numérico. Ele relata pais com conteúdo misto e os deixa para você envolver em `<span data-i18n>`. Ele nunca grava um marcador com valor.

O runtime registra cada chave de origem em um atributo `data-i18n-source` interno na primeira execução, para que uma troca posterior de localidade ainda busque a string em inglês. Esses atributos não são extraídos.

<a id="locale-specific-images-and-links"></a>
## Imagens e links específicos da localidade

Esses marcadores nunca são enviados ao tradutor. `mark-html` não os adiciona.

- `data-i18n-locale-src` — simples: `chart.png` se torna `chart-pt-BR.png` (o código do idioma é inserido antes da extensão). Com valor: o valor é um template. [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) usa `chart_{locale}.png`, que se torna `chart_pt-BR.png`.
- `data-i18n-locale-href` — anexa `?locale=` para que o link permaneça no mesmo arquivo HTML.

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

A localidade de origem mantém a URL original. Para um `data-i18n-locale-src` simples, URLs absolutas, URLs relativas ao protocolo, URLs `data:` e fragmentos `#` são deixados como estão; strings de consulta e fragmentos permanecem no lugar. Um marcador com valor usa seu template para cada localidade que não seja a de origem e substitui apenas `{locale}`. Se a imagem localizada retornar 404, o runtime restaura o `src` original uma vez. Você mesmo disponibiliza o `chart_pt-BR.png`; o script não o cria.

`data-i18n-locale-href` é para este modelo de catálogo. Um link para `about.pt-BR.html` pertence ao pipeline de [páginas HTML](/pt-BR/guide/documents/html-pages).

<a id="language-selector"></a>
## Seletor de idioma

Aponte `data-locale-select` para um `<select>` vazio. O runtime preenche um `<option>` por linha de `ui-languages.json` (`code`, `label`, `englishName`, `direction`). Alterar a seleção chama `setLocale`, que armazena a escolha, atualiza `?locale=` com `history.pushState` (sem recarregar), busca o pacote, reaplica cada marcador e define `<html lang>` e `dir`. O botão Voltar reaplica a localidade na URL.

`data-locale-list` faz o mesmo com links (`lang`, `hreflang` e `aria-current` no ativo). Esses links trocam a página do catálogo; não são os links por arquivo gravados pelo pipeline de documentos. Uma tag de script pode definir ambos os seletores:

```html
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select" title="Switch UI language" data-i18n-title></select>
</label>
<nav id="locale-list"></nav>
<script
  src="i18n.js"
  data-source-locale="en"
  data-locales-base="./locales"
  data-locale-select="#locale-select"
  data-locale-list="#locale-list"
  data-label-mode="native"
></script>
```

Deixe ambos os controles vazios. Para este manifesto, `data-label-mode="native"` rotula o português como `Português (Brasil)`. `english` o rotula como `Portuguese (Brazil)`. `both` o rotula como `Portuguese (Brazil) / Português (Brasil)`; como os dois nomes diferem, veja o trecho abaixo de `ui-languages.json`:

```json
[
  {
    "code": "en",
    "label": "English",
    "englishName": "English",
    "direction": "ltr"
  },
  {
    "code": "pt-BR",
    "label": "Português (Brasil)",
    "englishName": "Portuguese (Brazil)",
    "direction": "ltr"
  }
]
```

Com `?locale=pt-BR`, o runtime substitui as opções do select e os filhos da lista. Os atributos que você definir nesses elementos permanecem:

```html
<select id="locale-select" title="Switch UI language" data-i18n-title>
  <option value="en" lang="en">English</option>
  <option value="pt-BR" lang="pt-BR" selected>Português (Brasil)</option>
</select>
<nav id="locale-list">
  <a href="#" lang="en" hreflang="en">English</a>
  <a href="#" lang="pt-BR" hreflang="pt-BR" aria-current="true">Português (Brasil)</a>
</nav>
```

Uma linha `"direction": "rtl"` define `dir="rtl"` em `<html>` quando essa localidade está ativa.

Não faça redirecionamento automático por `navigator.language` além disso. O runtime já usa o idioma do navegador apenas quando a URL e `localStorage` não têm escolha. Um redirecionamento que ignora a URL dificulta o compartilhamento de uma localidade e o rastreamento da página.

`ui-languages.json` é gravado por `extract` ou `generate-ui-languages` em `languagesManifestPath` (padrão `{ui.flatOutputDir}/ui-languages.json`). Consulte [Seletor de idioma e RTL](/pt-BR/guide/ui-strings/language-switcher).

<a id="troubleshooting"></a>
## Solução de problemas

| Sintoma | O que verificar |
| --- | --- |
| Arquivos de localidade não carregam | Abra o site com um servidor local. `file://` bloqueia `fetch`; o runtime retorna ao texto de origem. |
| 404 em `ui-languages.json` | `data-locales-base` é relativo a `i18n.js`. Deve corresponder a `flatOutputDir`. |
| 404 em `{locale}.json` | Execute `translate-ui` para essa localidade e verifique se o código da localidade corresponde exatamente ao seu nome de arquivo. |
| Strings permanecem em inglês sob `/docs/` | Mesmo problema de caminho base. Evite um `/` inicial, a menos que o diretório de localidades esteja na raiz do host. |
| Inglês pisca e depois traduz | Adicione `class="i18n-pending"` em `<html>` e a regra de visibilidade acima. |
| Segunda troca mostra a string traduzida como a chave | Carregue o `i18n.js` disponibilizado. Ele armazena `data-i18n-source` antes de substituir o texto. |
| Layout RTL não inverte | A linha do manifesto precisa de `"direction": "rtl"`. O runtime define `dir` apenas em `<html>`. |
| Novos nós DOM permanecem em inglês | Chame `window.i18n.apply()` após inseri-los. |
| A imagem permanece `chart.png` em português | O elemento precisa de `data-i18n-locale-src`, e a localidade não deve ser a localidade de origem. |

`normalizeI18nText` no tempo de execução corresponde a `normalizeI18nText` em [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts): remova os espaços em branco das extremidades e, em seguida, colapse os espaços em branco. Como o texto de origem em inglês é a chave do catálogo, uma tradução ausente reverte para o inglês.

A demonstração executável é [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). `pnpm dev` a serve em [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR).

<a id="runtime-source"></a>
## Fonte do tempo de execução

```javascript
/* global document, window, localStorage, fetch, URLSearchParams, URL, history, navigator, PopStateEvent */
/**
 * Drop-in catalog runtime for plain HTML.
 *
 * Classic script (not a module) so `document.currentScript` is available.
 * Configure with data-* attributes on the script tag:
 *   data-source-locale, data-locales-base, data-storage-key,
 *   data-locale-select, data-locale-list, data-label-mode
 *
 * `data-locales-base` resolves against this script's URL, not the page URL.
 * Put class="i18n-pending" on <html> and hide the body while that class is set
 * to avoid a flash of source-locale text.
 */
(function () {
  "use strict";

  var TEXT_SOURCE_ATTR = "data-i18n-source";

  function runtimeScript() {
    if (document.currentScript) return document.currentScript;
    var marked = document.querySelectorAll(
      "script[data-ai-i18n-runtime], script[data-source-locale], script[data-locales-base]"
    );
    return marked.length > 0 ? marked[marked.length - 1] : null;
  }

  var scriptEl = runtimeScript();

  function attr(name, fallback) {
    if (!scriptEl) return fallback;
    var value = scriptEl.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  var SOURCE_LOCALE = attr("data-source-locale", "en");
  var LOCALES_BASE_ATTR = attr("data-locales-base", "./locales");
  var STORAGE_KEY = attr("data-storage-key", "ai-i18n-locale");
  var SELECT_SEL = attr("data-locale-select", "");
  var LIST_SEL = attr("data-locale-list", "");
  var LABEL_MODE = attr("data-label-mode", "native");

  function resolveLocalesBase() {
    var baseUrl = scriptEl && scriptEl.src ? scriptEl.src : window.location.href;
    return new URL(LOCALES_BASE_ATTR, baseUrl).href.replace(/\/$/, "");
  }

  var LOCALES_BASE = resolveLocalesBase();
  var I18N = { locale: SOURCE_LOCALE, dir: "ltr", bundle: {} };
  var languages = [];
  var titleKey = "";
  var selectBound = false;

  /**
   * Collapse insignificant whitespace. MUST stay identical to `normalizeI18nText`
   * in `src/extractors/html-i18n-marks.ts` and `src/dashboard-app/app.js`.
   */
  function normalizeI18nText(s) {
    return s.trim().replace(/\s+/g, " ");
  }

  function normalizeLocaleCode(code) {
    if (!code) return "";
    var parts = String(code).split("-");
    if (parts.length === 1) return parts[0].toLowerCase();
    return parts[0].toLowerCase() + "-" + parts.slice(1).join("-");
  }

  function isSourceLocale(locale) {
    return normalizeLocaleCode(locale) === normalizeLocaleCode(SOURCE_LOCALE);
  }

  function t(key) {
    var raw = I18N.bundle[key];
    return typeof raw === "string" && raw.length > 0 ? raw : key;
  }

  function findLanguage(code) {
    var norm = normalizeLocaleCode(code);
    for (var i = 0; i < languages.length; i++) {
      if (normalizeLocaleCode(languages[i].code) === norm) return languages[i];
    }
    return undefined;
  }

  function resolveLocale() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("locale");
    if (fromUrl) return fromUrl;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* private mode */
    }
    var browser = navigator.language || (navigator.languages && navigator.languages[0]) || SOURCE_LOCALE;
    var match = findLanguage(browser);
    return match ? match.code : SOURCE_LOCALE;
  }

  function loadJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      return res.ok ? res.json() : null;
    });
  }

  function labelFor(row) {
    var native = row.label || row.code;
    var english = row.englishName || native;
    if (LABEL_MODE === "english") return english;
    if (LABEL_MODE === "both") return english === native ? english : english + " / " + native;
    return native;
  }

  function sourceAttrName(attrName) {
    return attrName ? TEXT_SOURCE_ATTR + "-" + attrName : TEXT_SOURCE_ATTR;
  }

  function rememberKey(el, attrName, marker) {
    var stored = el.getAttribute(sourceAttrName(attrName));
    if (stored) return stored;
    var valued = el.getAttribute(marker);
    var key = valued
      ? valued
      : attrName
        ? normalizeI18nText(el.getAttribute(attrName) || "")
        : normalizeI18nText(el.textContent || "");
    if (key) el.setAttribute(sourceAttrName(attrName), key);
    return key;
  }

  function applyTextMarkers(selector, attrName, write) {
    var marker = attrName ? "data-i18n-" + attrName : "data-i18n";
    document.querySelectorAll(selector).forEach(function (el) {
      var key = rememberKey(el, attrName, marker);
      if (key) write(el, t(key));
    });
  }

  function isSkippableUrl(url) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
  }

  function withLocaleSuffix(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var hash = url.indexOf("#");
    var fragment = hash >= 0 ? url.slice(hash) : "";
    var pathQuery = hash >= 0 ? url.slice(0, hash) : url;
    var q = pathQuery.indexOf("?");
    var path = q >= 0 ? pathQuery.slice(0, q) : pathQuery;
    var query = q >= 0 ? pathQuery.slice(q) : "";
    return path.replace(/(\.[^./]+)$/, "-" + locale + "$1") + query + fragment;
  }

  function applyLocaleTemplate(template, locale) {
    return template.split("{locale}").join(locale);
  }

  function withLocaleQuery(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var next = new URL(url, window.location.href);
    next.searchParams.set("locale", locale);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return next.href;
    return next.pathname + next.search + next.hash;
  }

  function applyLocaleSrc() {
    document.querySelectorAll("[data-i18n-locale-src]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-src-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("src") || "";
        el.setAttribute(baseAttr, raw);
      }
      var valued = el.getAttribute("data-i18n-locale-src") || "";
      var next = raw;
      if (!isSourceLocale(I18N.locale)) {
        next = valued ? applyLocaleTemplate(valued, I18N.locale) : withLocaleSuffix(raw, I18N.locale);
      }
      if (next) el.setAttribute("src", next);
      if (el.tagName === "IMG" && !el.hasAttribute("data-i18n-src-fallback-bound")) {
        el.setAttribute("data-i18n-src-fallback-bound", "");
        el.addEventListener("error", function onErr() {
          var original = el.getAttribute(baseAttr);
          if (original && el.getAttribute("src") !== original) el.setAttribute("src", original);
          el.removeEventListener("error", onErr);
        });
      }
    });
  }

  function applyLocaleHref() {
    document.querySelectorAll("[data-i18n-locale-href]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-href-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("href") || "";
        el.setAttribute(baseAttr, raw);
      }
      el.setAttribute("href", isSourceLocale(I18N.locale) ? raw : withLocaleQuery(raw, I18N.locale));
    });
  }

  function applyStaticI18n() {
    applyTextMarkers("[data-i18n]", "", function (el, text) {
      el.textContent = text;
    });
    applyTextMarkers("[data-i18n-title]", "title", function (el, text) {
      el.setAttribute("title", text);
    });
    applyTextMarkers("[data-i18n-placeholder]", "placeholder", function (el, text) {
      el.setAttribute("placeholder", text);
    });
    applyTextMarkers("[data-i18n-alt]", "alt", function (el, text) {
      el.setAttribute("alt", text);
    });
    applyTextMarkers("[data-i18n-aria-label]", "aria-label", function (el, text) {
      el.setAttribute("aria-label", text);
    });
    applyLocaleSrc();
    applyLocaleHref();
    if (titleKey) document.title = t(titleKey);
  }

  function fillSelect(select) {
    var previous = select.value;
    select.replaceChildren();
    languages.forEach(function (row) {
      var opt = document.createElement("option");
      opt.value = row.code;
      opt.textContent = labelFor(row);
      opt.lang = row.code;
      if (normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale)) opt.selected = true;
      select.appendChild(opt);
    });
    if (!select.value && previous) select.value = previous;
    if (!selectBound) {
      selectBound = true;
      select.addEventListener("change", function () {
        void setLocale(select.value);
      });
    }
  }

  function fillList(list) {
    list.replaceChildren();
    languages.forEach(function (row) {
      var link = document.createElement("a");
      link.href = "#";
      link.textContent = labelFor(row);
      link.lang = row.code;
      link.hreflang = row.code;
      var active = normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale);
      if (active) link.setAttribute("aria-current", "true");
      link.addEventListener("click", function (event) {
        event.preventDefault();
        void setLocale(row.code);
      });
      list.appendChild(link);
    });
  }

  function renderSelectors() {
    if (SELECT_SEL) {
      var select = document.querySelector(SELECT_SEL);
      if (select) fillSelect(select);
    }
    if (LIST_SEL) {
      var list = document.querySelector(LIST_SEL);
      if (list) fillList(list);
    }
  }

  function syncUrl(locale) {
    var url = new URL(window.location.href);
    if (isSourceLocale(locale)) url.searchParams.delete("locale");
    else url.searchParams.set("locale", locale);
    history.pushState({ locale: locale }, "", url.pathname + url.search + url.hash);
  }

  function setLocale(code, opts) {
    var push = !opts || opts.push !== false;
    I18N.locale = code;
    var langRow = findLanguage(code);
    I18N.dir = langRow && langRow.direction === "rtl" ? "rtl" : "ltr";
    var bundlePromise = isSourceLocale(code)
      ? Promise.resolve(null)
      : loadJson(LOCALES_BASE + "/" + encodeURIComponent(code) + ".json");
    return bundlePromise.then(function (bundle) {
      I18N.bundle = bundle && typeof bundle === "object" && !Array.isArray(bundle) ? bundle : {};
      document.documentElement.setAttribute("lang", (langRow && langRow.code) || code);
      document.documentElement.setAttribute("dir", I18N.dir);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* private mode */
      }
      applyStaticI18n();
      renderSelectors();
      if (push) syncUrl(code);
      document.documentElement.classList.remove("i18n-pending");
    });
  }

  function onPopState() {
    var params = new URLSearchParams(window.location.search);
    void setLocale(params.get("locale") || SOURCE_LOCALE, { push: false });
  }

  if (window.__aiI18nPop) window.removeEventListener("popstate", window.__aiI18nPop);
  window.__aiI18nPop = onPopState;
  window.addEventListener("popstate", onPopState);

  function captureTitleKey() {
    var titleEl = document.querySelector("title");
    if (!titleEl) {
      titleKey = normalizeI18nText(document.title || "");
      return;
    }
    titleKey =
      titleEl.getAttribute(TEXT_SOURCE_ATTR) ||
      titleEl.getAttribute("data-i18n") ||
      normalizeI18nText(titleEl.textContent || "");
    if (titleKey) titleEl.setAttribute(TEXT_SOURCE_ATTR, titleKey);
  }

  function initI18n() {
    document.documentElement.classList.add("i18n-pending");
    captureTitleKey();
    return loadJson(LOCALES_BASE + "/ui-languages.json").then(function (manifest) {
      languages = Array.isArray(manifest) ? manifest : [];
      return setLocale(resolveLocale(), { push: false });
    });
  }

  var ready = initI18n().catch(function () {
    applyStaticI18n();
    document.documentElement.classList.remove("i18n-pending");
  });

  window.i18n = {
    t: t,
    get locale() {
      return I18N.locale;
    },
    get dir() {
      return I18N.dir;
    },
    apply: applyStaticI18n,
    setLocale: function (code) {
      return setLocale(code);
    },
    ready: ready,
  };
})();
```
