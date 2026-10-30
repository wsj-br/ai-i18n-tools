<a id="astro-integration"></a>
# Integración de Astro

Utilice ai-i18n-tools con [Astro](https://astro.build/) en dos configuraciones comunes: sitios de documentación de **Astro Starlight** y sitios de marketing o aplicaciones de **Astro simple**. Ambos utilizan Documentos (`translate-docs`) para el contenido de la página; los sitios de Astro simple a menudo combinan eso con cadenas de interfaz de usuario (`extract` / `translate-ui`) para cadenas `t()` en el frontmatter y datos compartidos.

Véase también [cadenas de interfaz de usuario](/es/guide/ui-strings/astro-website), [Documentos](/es/guide/documents/) y los ejemplos ejecutables a continuación.

<a id="astro-starlight"></a>
## Astro Starlight

Utilice `init -t ui-starlight` y `docsOutput.style: "astro-starlight"` para sitios de documentación de [Astro Starlight](https://starlight.astro.build/). El preajuste es un alias para `doc-system` con un `localeSubpath` vacío — las páginas traducidas se ubican bajo `src/content/docs/<locale>/` junto al árbol de la configuración regional de origen. `sourceLocale` puede ser cualquier idioma.

<a id="quick-start"></a>
### Inicio rápido

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Diseño de página

El markdown y MDX en inglés se encuentran en la raíz del contenido de Starlight (normalmente `src/content/docs/`). Las copias traducidas se escriben junto al árbol de origen:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Configure un bloque `docs[]`:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

Apunte `contentPaths` a los archivos y directorios `.md` / `.mdx` escritos en `sourceLocale`. Ese idioma puede ser cualquier idioma. Establezca `docsRoot` en la misma carpeta que Starlight utiliza como su raíz de contenido.

Las anulaciones de la interfaz de usuario de Starlight pueden usar `src/content/i18n/en.json` con `jsonPathTemplate` en un bloque `docs[]` separado cuando sea necesario; consulte [Documentos — inicializar para la documentación](/es/guide/documents/#step-1-initialise-for-documentation).

Starlight incluye cadenas de interfaz de usuario para muchas configuraciones regionales (etiquetas de navegación, marcador de posición de búsqueda, tabla de contenido, etc.). No hay una canalización de shell/tema separada para configurar; usa `translate-docs` solo para el contenido de la página. Para otros frameworks, consulta [Traducción de shell de framework](/es/guide/integrations/#framework-shell-translation).

Los `label` explícitos de la barra lateral, el `title` del sitio y `social[].label` en `astro.config.mjs` son literales en inglés que esta herramienta no traduce. Prefiera las entradas `slug` para que la etiqueta provenga del frontmatter traducido de la página (`title`). Un grupo o un enlace externo que necesite su propia redacción utiliza el mapa `translations` por configuración regional de Starlight (`label` para la configuración regional predeterminada, `translations['pt-BR']` para las demás). `social[].label` no tiene un campo de traducciones en el esquema actual de Starlight; permanece como está escrito. Consulte [barra lateral de Starlight](https://starlight.astro.build/guides/sidebar/#internationalization) y [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs), que utiliza entradas `slug`.

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n en un sitio existente

La configuración inicial utiliza la indicación en [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website#run-the-agent-prompt). La lista de verificación a continuación es el mismo trabajo manual.

- `locales` en la configuración de Starlight, incluyendo una entrada `root` cuando el inglés no debe tener prefijo (`label` y el `lang` requerido).
- `defaultLocale: 'root'` cuando el idioma predeterminado es esa configuración regional raíz. Omita `defaultLocale` solo si el valor predeterminado de Starlight ya coincide.
- Las páginas en inglés permanecen en `src/content/docs/`; `translate-docs` escribe `src/content/docs/<locale>/`.
- `targetLocales` alineado con las claves de configuración regional no raíz (tenga en cuenta las mayúsculas/minúsculas: las claves de directorio de Starlight suelen estar en minúsculas, como `pt-br`).

<a id="example-project"></a>
### Proyecto de ejemplo

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — Fuentes en inglés en `src/content/docs/`, traducciones confirmadas en `src/content/docs/<locale>/`, configuración regional RTL (`ar`) y traducción basada en glosario. Ejecute `pnpm dev` en el puerto 3050.

<a id="plain-astro-marketing-and-app-sites"></a>
## Astro simple (sitios de marketing y aplicaciones)

Para sitios de marketing o aplicaciones estáticos de Astro (no Starlight), combina [enrutamiento i18n integrado de Astro](https://docs.astro.build/en/guides/internationalization/) con ai-i18n-tools. La configuración inicial utiliza la indicación en [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website#run-the-agent-prompt). La implementación de referencia es [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website): inglés en `/`, locales de destino en `/{locale}/`.

La mayoría de los equipos utilizan un **híbrido** de dos pipelines en la misma página:

| Canalización | Uso para | Comandos | Salida |
|----------|---------|----------|--------|
| **HTML de página** | Encabezados, párrafos, etiquetas de navegación, matrices en línea en el cuerpo de la plantilla | `translate-docs` | `src/pages/{locale}/index.astro` por configuración regional |
| **Cadenas de interfaz de usuario (`t()`)** | Datos de frontmatter, etiquetas de pestaña, matrices compartidas | `extract` → `translate-ui` | `public/locales/{locale}.json` (cadena en el idioma de origen como clave) |

<a id="quick-start-1"></a>
### Inicio rápido

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Crear el andamiaje para la extracción de la IU con `init -t ui-astro-website -P ollama`, luego fusionar en un bloque `docs[]` cuando también traduzcas el HTML de la página:

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
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

Mantenga tres listas alineadas cuando agregue o elimine un idioma: `targetLocales` en `ai-i18n-tools.config.json`, `i18n.locales` en `astro.config.mjs` (Astro usa códigos de ruta en **minúsculas** como `pt-br`) y `ui-languages.json` (a través de `generate-ui-languages`). Los **nombres de archivo** del paquete plano usan la configuración de mayúsculas y minúsculas (`pt-BR.json`); asigne la ruta `pt-br` de Astro a ese archivo a través de su campo de manifiesto `code`.

Resuelva `t('…')` en **tiempo de compilación** buscando el literal del idioma de origen como clave — consulte `examples/astro-website/src/i18n/t.ts`. `sourceLocale` puede ser cualquier idioma. El ejemplo utiliza inglés. No necesita `ai-i18n-tools/runtime` ni i18next para un sitio estático a menos que añada islas de cliente que cambien de idioma después de la carga.

<a id="example-project-1"></a>
### Proyecto de ejemplo

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — página de aterrizaje híbrida con HTML a través de `translate-docs` y etiquetas de pestañas de captura de pantalla a través de `t()` + `translate-ui`.

<a id="example-projects"></a>
## Proyectos de ejemplo

| Proyecto | Caso de uso | Puerto |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Documentación de Starlight | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Sitio de marketing de Astro simple (HTML + híbrido `t()`) | (ver README) |

Compare [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) con [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — contenido de tutorial similar, estilo de salida de Docusaurus en lugar de Starlight.
