<a id="translated-svg-with-svgstyle--flat"></a>
# SVG traduit avec `svg.style = "flat"`

À utiliser lorsqu'une application web intègre des illustrations ou diagrammes SVG spécifiques à une langue et y fait référence par code de langue au moment de l'exécution.

<a id="config"></a>
### Configuration

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` lit chaque `.svg` situé sous `images/` et écrit un fichier par langue :

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### Référence dans l'application

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Recommandation d'organisation des sources

Gardez les SVG sources séparés du répertoire de sortie. Avec `sourcePath: "images"` et `outputDir: "public/assets"`, les deux répertoires sont distincts. Ne jamais définir les deux comme étant le même répertoire.

<a id="implementation-example"></a>
### Exemple de mise en œuvre

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — Bloc `svg` dans [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`) ; source [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg) ; sorties par locale sous [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) (par exemple `translation_demo_svg.de.svg`) ; URL d'exécution dans [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
