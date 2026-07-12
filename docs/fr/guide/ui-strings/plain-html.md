<a id="plain-html-apps"></a>
# Applications HTML simples

<a id="marking-html-for-translation"></a>
## Marquer le HTML pour la traduction

Pour les applications HTML simples (sans appels `t("…")` dans le balisage), marquez les éléments traduisibles avec des attributs et laissez `extract` capturer le texte anglais de l'élément lui-même — pas de littéraux de chaîne dupliqués.

Préférez la forme nue (l'attribut n'a pas de valeur ; le texte source est lu à partir de l'élément) :

- `data-i18n` — la clé est le `textContent` de l'élément ; à l'exécution, vous définissez `el.textContent = t(key)`.
- `data-i18n-title` — la clé est le `title` de l'élément ; à l'exécution, vous définissez le `title` traduit.
- `data-i18n-placeholder` — la clé est le `placeholder` de l'élément.

Utilisez la forme avec valeur `data-i18n="Some key"` uniquement lorsque la forme nue ne peut pas fonctionner : éléments à contenu mixte (texte entrelacé avec des balises enfants), ou lorsque la clé doit différer du texte visible. Excluez un élément (et son sous-arbre) avec `data-i18n-ignore`.

Contrainte : la forme nue `data-i18n` est réservée aux éléments de texte feuilles uniquement (un seul nœud de texte, aucun élément enfant), car la définition de `textContent` remplace les enfants. Pour un paragraphe comme `Run <code>build</code> now.`, encapsulez chaque segment de texte dans son propre marqueur à la place :

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Ajoutez les marqueurs manuellement, ou laissez la commande `mark-html` insérer les marqueurs nus pour vous. Elle s'exécute en mode simulation par défaut — elle indique combien de marqueurs elle ajouterait par fichier et liste les éléments à contenu mixte qui nécessitent un `<span data-i18n>` manuel — et n'écrit qu'avec `--write` :

```bash
# Preview (no changes written)
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
```

`mark-html` est idempotent, respecte `data-i18n-ignore`, ne marque jamais les éléments de type code (`code`, `pre`, `kbd`, `samp`, `var`) ni le texte vide / uniquement numérique, et n'émet jamais de marqueur avec valeur. Après le marquage, encapsulez manuellement tous les fragments à contenu mixte signalés, puis ajoutez `.html` à `ui.uiExtractor.extensions` afin que `extract` capture les chaînes :

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app"></a>
## Exemple pratique : localisation d'une application HTML simple

L'exemple d'espace de travail [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) est une application statique exécutable qui utilise ces marqueurs de bout en bout. Clonez-le avec `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html`, exécutez `pnpm install` et `pnpm dev`, puis ouvrez [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) pour le portugais (Brésil).

Son `public/index.html` contient des marqueurs bruts comme :

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

`ai-i18n-tools.config.json` dirige l'extraction vers `public/` et écrit des bundles plats à côté des fichiers statiques :

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

`extract` écrit chaque chaîne source anglaise dans le catalogue (`public/strings.json`), et `translate-ui` remplit un bundle plat par locale, indexé par le texte source anglais :

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

Au moment de l'exécution, `public/app.js` charge `/locales/ui-languages.json` pour les métadonnées de la locale, résout la locale active (`?locale=` → `localStorage` → navigateur → `en`), récupère `/locales/{locale}.json` (ignoré pour l'anglais), puis parcourt les éléments marqués. La clé provient de la valeur du marqueur lorsqu'elle est présente, sinon du propre texte / titre / placeholder de l'élément (normalisé de la même manière que l'extracteur normalise les espaces blancs) :

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

`normalizeI18nText` doit rester identique à `normalizeI18nText` dans [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts). Étant donné que le texte source anglais est la clé du catalogue, les chaînes non traduites reviennent automatiquement à l'anglais.

Le [tableau de bord de traduction](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) intégré utilise le même algorithme `applyStaticI18n` pour ses marqueurs HTML, mais sert les bundles de locale à partir de `GET /api/ui-i18n` au lieu de fichiers statiques `/locales/{locale}.json`. Consultez le [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) de l'exemple pour le workflow complet, la structure du projet et le tableau de comparaison.
