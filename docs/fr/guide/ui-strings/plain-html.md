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
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## Exemple pratique : localisation d'une application HTML simple (le tableau de bord fourni)

Le tableau de bord de traduction du package lui-même (`src/dashboard-app`) utilise ces mêmes marqueurs. Son `index.html` contient des marqueurs bruts comme :

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` écrit chaque chaîne source anglaise dans le catalogue (`strings.json`), et `translate-ui` remplit un bundle plat par locale, indexé par le texte source anglais. Pour une application HTML statique typique, vous pointeriez `ui.flatOutputDir` vers un répertoire servi sur le Web tel que `public/locales/` :

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

À l'exécution, chargez le bundle pour la locale active et parcourez les éléments marqués. La clé provient de la valeur du marqueur lorsqu'elle est présente, sinon du texte / titre / placeholder de l'élément lui-même (normalisé de la même manière que l'extracteur normalise les espaces blancs) :

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

La moitié de ce fragment qui parcourt les marqueurs est exactement `applyStaticI18n` dans [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js). Étant donné que le texte source anglais est la clé du catalogue, les chaînes non traduites reviennent automatiquement à l'anglais.

Pour un **équivalent statique exécutable** (pas de serveur Node — `fetch('/locales/{locale}.json')` au lieu de `/api/ui-i18n`), consultez l'exemple d'espace de travail [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). Il utilise les mêmes modèles de marqueurs avec une interface utilisateur de style tableau de bord épurée ; essayez le portugais (Brésil) à `http://localhost:3090/?locale=pt-BR` après `pnpm dev`.

En quoi le tableau de bord fourni diffère : comme il dispose d'un serveur Node, il ne récupère pas de `/locales/{locale}.json` statique. Le client appelle `GET /api/ui-i18n`, et le serveur résout la locale active (`--ui-lang` > `AI_I18N_LANG` > configuration `uiLanguage` > système d'exploitation hôte) et renvoie `{ locale, dir, bundle }`. Le client définit ensuite `document.documentElement` `lang`/`dir` à partir de cette réponse (plutôt que de lire `lang` pour choisir la locale) avant d'appeler `applyStaticI18n`. Les bundles eux-mêmes ne sont pas le contenu de l'outil en cours de traduction — ce sont les chaînes d'interface utilisateur propres au tableau de bord, livrées dans `src/i18n/locales/{locale}.json` (copiées dans `dist/i18n/locales` lors de la construction) et lues côté serveur par `loadUiBundle` dans [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts). Le `t()` du tableau de bord prend également en charge l'interpolation ```{{name}}```, contrairement au `t` minimal ci-dessus.
