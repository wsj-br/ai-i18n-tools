<a id="plain-html-apps"></a>
# Applications HTML simples

Utilisez cette approche pour une page interactive qui reste dans un seul fichier HTML. `extract` lit les marqueurs `data-i18n*` dans `strings.json`, `translate-ui` écrit un bundle JSON plat par locale, et un script de navigateur applique les chaînes. Le même script peut ajouter un suffixe aux noms de fichiers image et conserver les liens sur la page actuelle.

Pour un site statique qui doit générer un fichier HTML traduit par locale (sans environnement d'exécution, avec des liens inter-pages réécrits), utilisez plutôt les [pages HTML](/fr/guide/documents/html-pages). Un fichier est associé à une seule approche.

<a id="quick-start"></a>
## Démarrage rapide

1. Générez le projet avec `ai-i18n-tools init -t ui-plain-html`, ou ajoutez la configuration ci-dessous.
2. Balisez le HTML source (ou laissez `mark-html` le faire).
3. Pointez `ui.sourceRoots` et `ui.uiExtractor.extensions` vers ces fichiers.
4. Exécutez `extract`, puis `translate-ui` (ou exécutez les deux avec `sync-ui`).
5. Copiez `i18n.js` à côté de la page et chargez-le avant votre propre script.
6. Servez le dossier via HTTP. `file://` ne peut pas `fetch` le JSON de la locale.

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

Exemple de `ai-i18n-tools.config.json` :

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

Le scaffold ajoute également la [configuration du fournisseur](/fr/guide/providers-and-models) de LLM utilisée par `translate-ui` ; elle est omise ci-dessus pour garder les paramètres spécifiques au HTML visibles.

`extract` gère `strings.json` et écrit `ui-languages.json` ; `translate-ui` gère les fichiers JSON de la locale cible. Ne modifiez pas manuellement ces fichiers générés.

`flatOutputDir` est l'emplacement où se trouvent les fichiers de locale générés. Le `data-locales-base` du script doit pointer vers ce répertoire sous forme d'URL relative à `i18n.js` (et non à la page). Une base de `./locales` sur `public/i18n.js` charge `public/locales/pt-BR.json`. Utilisez une base relative pour que le site fonctionne toujours sous un sous-chemin de déploiement.

<a id="obtain-the-runtime"></a>
## Obtenir l'environnement d'exécution

`i18n.js` est un script classique (pas un module). Copiez l'un de ceux-ci ; il s'agit du même fichier :

- `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` après avoir installé le paquet
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- la liste sous [Source de l'environnement d'exécution](#runtime-source)

Chargez-le à la fin de `<body>`, puis votre propre script. Appliquez `class="i18n-pending"` sur `<html>` et masquez le corps (body) pendant que cette classe est définie afin que la langue source ne clignote pas :

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

Ajustez les attributs du script selon vos besoins :

| Attribut | Valeur par défaut | Rôle |
| --- | --- | --- |
| `data-source-locale` | `en` | Locale qui conserve le HTML en anglais et ignore la récupération du bundle |
| `data-locales-base` | `./locales` | Répertoire de `ui-languages.json` et `{locale}.json`, résolu par rapport à l'URL du script |
| `data-storage-key` | `ai-i18n-locale` | Clé `localStorage` |
| `data-locale-select` | (aucun) | Sélecteur CSS d'un `<select>` à remplir à partir du manifeste |
| `data-locale-list` | (aucun) | Sélecteur CSS d'un élément à remplir avec des liens de langue |
| `data-label-mode` | `native` | `native` (`label` du manifeste), `english` (`englishName`), ou `both` (`englishName / label` lorsqu'ils diffèrent) |

`window.i18n` expose `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)` et `ready` (une promesse). Attendez `ready` avant que votre propre script ne dépende de la locale résolue ou des valeurs traduites. Appelez `apply()` après avoir inséré de nouveaux éléments balisés.

<a id="marking-html-for-translation"></a>
## Marquer le HTML pour la traduction

Préférez les marqueurs nus. Le texte source en anglais reste sur l'élément, et ce texte est la clé du catalogue. `extract` le lit ; l'environnement d'exécution réécrit la traduction sur la même propriété.

- `data-i18n` — la clé est `textContent`. L'environnement d'exécution définit `textContent`.
- `data-i18n-title` — la clé est `title`.
- `data-i18n-placeholder` — la clé est `placeholder`.
- `data-i18n-alt` — la clé est `alt`.
- `data-i18n-aria-label` — la clé est `aria-label`.

Un élément peut en comporter plusieurs. Chaque marqueur constitue une entrée distincte du catalogue.

<a id="text"></a>
### Texte

Placez `data-i18n` sur un élément dont le contenu est uniquement du texte :

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

L'environnement d'exécution définit également `document.title` à partir de l'élément `<title>`. Ne placez pas `data-i18n` sur un conteneur à contenu mixte : l'environnement d'exécution assigne `textContent`, ce qui supprimerait ses éléments enfants.

<a id="tooltip"></a>
### Info-bulle

```html
<select title="Filter by locale" data-i18n-title></select>
```

Un contrôle peut traduire son libellé et son info-bulle sous forme de deux clés :

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

<a id="placeholder"></a>
### Texte de remplacement

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

Texte de remplacement et info-bulle sur le même champ :

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
### Texte alternatif

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

<a id="accessible-name"></a>
### Nom accessible

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

Le libellé du bouton `×` n'a pas de `data-i18n`, il reste donc tel quel. Le nom accessible est la chaîne qui est traduite.

<a id="mixed-content"></a>
### Contenu mixte

`data-i18n` lit l'intégralité du `textContent` de l'élément. Lorsqu'une phrase partage son parent avec un autre élément, encapsulez chaque segment de texte :

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
### Langue source uniquement

`data-i18n-ignore` ignore cet élément et ses descendants à la fois pour `mark-html` et pour les chaînes d'interface utilisateur `extract`. Utilisez-le pour les lignes d'exemple, les identifiants et les noms de marque :

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
### Une clé de catalogue différente

Un marqueur valué nomme la clé de catalogue. L'environnement d'exécution écrit tout de même la traduction sur l'élément (ou sur l'attribut nommé) :

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html` insère les marqueurs nus ci-dessus. Il s'agit d'un essai à blanc à moins que vous ne passiez `--write`. Il ignore les sous-arbres `data-i18n-ignore`, les éléments de type code (`code`, `pre`, `kbd`, `samp`, `var`) et le texte vide ou purement numérique. Il signale les parents à contenu mixte et vous laisse les encapsuler dans `<span data-i18n>`. Il n'écrit jamais de marqueur valué.

L'environnement d'exécution enregistre chaque clé source sur un attribut `data-i18n-source` interne lors de sa première exécution, afin qu'un changement ultérieur de locale recherche toujours la chaîne en anglais. Ces attributs ne sont pas extraits.

<a id="locale-specific-images-and-links"></a>
## Images et liens spécifiques aux paramètres régionaux

Ces marqueurs ne sont jamais envoyés au traducteur. `mark-html` ne les ajoute pas.

- `data-i18n-locale-src` — nu : `chart.png` devient `chart-pt-BR.png` (le code de locale est inséré avant l'extension). Valuée : la valeur est un modèle. [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) utilise `chart_{locale}.png`, qui devient `chart_pt-BR.png`.
- `data-i18n-locale-href` — ajoute `?locale=` pour que le lien reste sur le même fichier HTML.

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

La locale source conserve l'URL d'origine. Pour un `data-i18n-locale-src` nu, les URL absolues, les URL relatives au protocole, les URL `data:` et les fragments `#` sont laissés intacts ; les chaînes de requête et les fragments restent en place. Un marqueur valué utilise son modèle pour chaque locale autre que la locale source et remplace uniquement `{locale}`. Si l'image localisée génère une erreur 404, l'environnement d'exécution restaure l'`src` d'origine une seule fois. Vous devez fournir vous-même `chart_pt-BR.png` ; le script ne le crée pas.

`data-i18n-locale-href` est destiné à ce modèle de catalogue. Un lien vers `about.pt-BR.html` appartient au pipeline des [pages HTML](/fr/guide/documents/html-pages).

<a id="language-selector"></a>
## Sélecteur de langue

Dirigez `data-locale-select` vers un `<select>` vide. L'environnement d'exécution remplit un `<option>` par ligne de `ui-languages.json` (`code`, `label`, `englishName`, `direction`). La modification de la sélection appelle `setLocale`, qui stocke le choix, met à jour `?locale=` avec `history.pushState` (sans rechargement), récupère le bundle, réapplique chaque marqueur, et définit `<html lang>` et `dir`. Le bouton Retour réapplique la locale dans l'URL.

`data-locale-list` fait de même avec les liens (`lang`, `hreflang` et `aria-current` sur celui qui est actif). Ces liens changent la page du catalogue ; ce ne sont pas les liens par fichier écrits par le pipeline de documents. Une seule balise de script peut définir les deux sélecteurs :

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

Laissez les deux contrôles vides. Pour ce manifeste, `data-label-mode="native"` désigne le portugais comme `Português (Brasil)`. `english` le désigne comme `Portuguese (Brazil)`. `both` le désigne comme `Portuguese (Brazil) / Português (Brasil)`, car les deux noms diffèrent, voir l'extrait ci-dessous de `ui-languages.json` :

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

Avec `?locale=pt-BR`, l'environnement d'exécution remplace les options de la liste déroulante et les enfants de la liste. Les attributs que vous définissez sur ces éléments sont conservés :

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

Une ligne `"direction": "rtl"` définit `dir="rtl"` sur `<html>` lorsque cette locale est active.

N'ajoutez pas de redirection automatique par `navigator.language` par-dessus. L'environnement d'exécution utilise déjà la langue du navigateur uniquement lorsque l'URL et `localStorage` n'ont pas de choix. Une redirection qui ignore l'URL rend difficile le partage d'une locale et l'exploration de la page.

`ui-languages.json` est écrit par `extract` ou `generate-ui-languages` dans `languagesManifestPath` (par défaut `{ui.flatOutputDir}/ui-languages.json`). Voir [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher).

<a id="troubleshooting"></a>
## Dépannage

| Symptôme | Vérifications à effectuer |
| --- | --- |
| Les fichiers de locale ne se chargent pas | Ouvrez le site avec un serveur local. `file://` bloque `fetch` ; l'environnement d'exécution revient au texte source. |
| Erreur 404 sur `ui-languages.json` | `data-locales-base` est relatif à `i18n.js`. Il doit correspondre à `flatOutputDir`. |
| Erreur 404 sur `{locale}.json` | Exécutez `translate-ui` pour cette locale et vérifiez que le code de locale correspond exactement à son nom de fichier. |
| Les chaînes restent en anglais sous `/docs/` | Même problème de chemin de base. Évitez un `/` au début, sauf si le répertoire des locales se trouve à la racine de l'hôte. |
| L'anglais s'affiche brièvement, puis se traduit | Ajoutez `class="i18n-pending"` sur `<html>` et la règle de visibilité ci-dessus. |
| Le deuxième changement affiche la chaîne traduite comme clé | Chargez le `i18n.js` déployé. Il stocke `data-i18n-source` avant de remplacer le texte. |
| La mise en page RTL ne s'inverse pas | La ligne du manifeste nécessite `"direction": "rtl"`. L'environnement d'exécution définit `dir` sur `<html>` uniquement. |
| Les nouveaux nœuds DOM restent en anglais | Appelez `window.i18n.apply()` après les avoir insérés. |
| L'image reste `chart.png` en portugais | L'élément a besoin de `data-i18n-locale-src` et la locale ne doit pas être la locale source. |

`normalizeI18nText` dans le runtime correspond à `normalizeI18nText` dans [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) : supprimer les espaces aux extrémités, puis réduire les espaces. Comme le texte source en anglais est la clé du catalogue, une traduction manquante bascule sur l'anglais.

La démonstration exécutable est [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). `pnpm dev` la sert à l'adresse [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR).

<a id="runtime-source"></a>
## Source du runtime

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
