<a id="astro-website"></a>
# Sitio web de Astro

Para sitios de marketing o aplicaciones estáticas de Astro (Astro simple, no Starlight), combine [el enrutamiento i18n integrado de Astro](https://docs.astro.build/en/guides/internationalization/) con ai-i18n-tools. Consulte también la [integración de Astro](/guide/integrations/astro).

La implementación de referencia es [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (consulte también su [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)): inglés en `/`, nueve configuraciones regionales de destino en `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Pipelines híbridos

La mayoría de los equipos usan una **hibridación** de dos canalizaciones (no entran en conflicto):

| Canalización | Uso para | Comandos | Salida |
|----------|---------|----------|--------|
| **HTML de página** | Encabezados, párrafos, etiquetas de navegación, matrices en línea en el cuerpo de la plantilla | `translate-docs` | `src/pages/{locale}/index.astro` por configuración regional |
| **Cadenas de IU (`t()`)** | Datos de frontmatter, etiquetas de pestañas de capturas de pantalla, matrices compartidas | `extract` → `translate-ui` | `public/locales/{locale}.json` (fuente en inglés como clave) |

Mantenga tres listas alineadas cuando agregue o elimine un idioma: `targetLocales` en `ai-i18n-tools.config.json`, `i18n.locales` en `astro.config.mjs` (Astro usa códigos de ruta en **minúsculas** como `pt-br`) y `ui-languages.json` (a través de `generate-ui-languages`). Los **nombres de archivo** de los paquetes planos usan la carcasa de configuración (`pt-BR.json`); asigne la ruta `pt-br` de Astro a ese archivo a través de su campo de manifiesto `code` (consulte `examples/astro-website/src/i18n/locale.ts`).

Ejemplos de scripts `package.json` (del proyecto de referencia):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## Cadenas de interfaz de usuario (SSG)

Andamie la extracción de la interfaz de usuario con `init -t ui-astro-website`, luego fusione en un bloque `docs[]` cuando también traduzca el HTML de la página (consulte [Analizar y reemplazar páginas](#astro-website-pages-parse-and-replace)). Envuelva la copia en `t('…')` en módulos TypeScript y frontmatter `.astro` (y bloques de plantilla `{expression}` cuando prefiera cadenas de interfaz de usuario en lugar de páginas de configuración regional duplicadas):

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Establece `sourceLocale` para que coincida con `i18n.defaultLocale` en `astro.config.mjs`. Escribe paquetes planos en un directorio que Astro pueda importar durante la compilación (la plantilla usa `public/locales/`). Resuelve `t('…')` en **tiempo de compilación** buscando el literal fuente en inglés como clave (consulta `examples/astro-website/src/i18n/t.ts`; `strings.json` es la caché de extracción, no el paquete en tiempo de ejecución). **No** necesitas `ai-i18n-tools/runtime` ni i18next para un sitio estático a menos que añadas islas del cliente que cambien de idioma después de la carga.

Conecte cada página que llame a `t()` (página raíz en inglés y cada copia `src/pages/{locale}/`):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Helpers de soporte en el ejemplo: `src/i18n/utils.ts`, `src/i18n/locale.ts` y `ui-languages.json` para etiquetas, dirección y códigos BCP-47. Ejecute `generate-ui-languages` después de cambiar `targetLocales` (opcionalmente, configure `languagesManifestPath` para que el manifiesto se encuentre junto a sus helpers, por ejemplo, `src/i18n/ui-languages.json`). `MainLayout.astro` establece `<html lang>` y `<html dir>` desde `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` usa `getRelativeLocaleUrl` desde `astro:i18n`.

<a id="pages-parse-and-replace"></a>
## Páginas (analizar y reemplazar)

Para páginas de marketing con HTML codificado en archivos `.astro`, permite que `translate-docs` extraiga nodos de texto y atributos (`alt`, `title`, `aria-label`, `placeholder`), los traduzca mediante la caché del documento y escriba copias específicas del idioma en tu árbol de páginas. **No** necesitas `t()` para la mayoría de los textos visibles.

Los valores de atributos y claves estructurales **no** se traducen de forma predeterminada: la protección integrada cubre atributos JSX/HTML como `class`, `id`, `style`, `src`, `href`, `data-*` y la mayoría de los `aria-*`, además de claves de objeto como `class`, `key` y `id` dentro de los bloques de plantilla `{expression}`. Use `docs[].protectAttributes` y `docs[].protectKeys` para extender esas listas cuando use atributos personalizados (por ejemplo, `variant` de Tailwind o campos `slug` de CMS). Las mismas opciones se aplican a MDX JSX durante la traducción de markdown (consulte [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

Habilite `features.translateDocs` y agregue un bloque `docs[]`, por ejemplo:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Ejecute `npx ai-i18n-tools translate-docs` (o `pnpm i18n:translate` en [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)). La fuente en inglés permanece en `src/pages/index.astro`; cada configuración regional de destino obtiene `src/pages/{locale}/index.astro` con las importaciones ajustadas para el nivel de directorio adicional (por ejemplo, `../layouts/` → `../../layouts/`).

Dentro del **cuerpo de la plantilla**, los literales de cadena en los bloques `{expression}` (matrices en línea, campos de objeto `title`/`desc`) se traducen cuando están orientados al usuario; los valores entre comillas en atributos/claves protegidos, los literales dentro de `t('…')`, `<script>` y `<style>` se dejan sin cambios. **El TypeScript de frontmatter no se traduce** por esta ruta; mantenga el frontmatter compartido (incluidas las importaciones `t()` y las matrices de datos) idéntico en las páginas en inglés y en las páginas de configuración regional, o vuelva a ejecutar `translate-docs` después de editar la página en inglés para que las copias de configuración regional recojan los cambios de frontmatter. Para copias solo de frontmatter, use el [pipeline de cadenas de interfaz de usuario](#astro-website-ui-strings-ssg) en su lugar.

Consulte [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) para ver la página de destino híbrida completa (HTML a través de `translate-docs`, etiquetas de pestañas de captura de pantalla a través de `t()` + `translate-ui`).
