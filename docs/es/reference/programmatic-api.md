<a id="programmatic-api"></a>
# API programática

Todos los tipos y clases públicos se exportan desde la raíz del paquete. Ejemplo: ejecutar el paso de traducción de interfaz desde Node.js sin la CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Cree una configuración a partir de Node.js (el cuarto argumento opcional selecciona el preajuste integrado; el valor predeterminado es `openrouter`):

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
```

Exportaciones clave (de uso común; consulte `src/index.ts` para ver la superficie pública completa):

| Exportación | Descripción |
|---|---|
| `loadI18nConfigFromFile` | Carga, combina y valida la configuración desde un archivo JSON. |
| `parseI18nConfig` | Valida un objeto de configuración sin procesar. |
| `TranslationCache` | Caché SQLite: instanciar con una ruta `cacheDir`. |
| `UIStringExtractor` | Extraer cadenas `t("…")` del código fuente JS/TS. |
| `collectHtmlI18nStrings` / `markHtmlContent` | Escanea / inserta marcadores `data-i18n*` en HTML (potencia `extract` para `.html` y el comando `mark-html`). |
| `MarkdownExtractor` | Extraer segmentos traducibles del markdown. |
| `JsonExtractor` | Extraer de archivos JSON de etiquetas de Docusaurus (catálogos de interfaz de usuario, no del cuerpo MDX). |
| `SvgExtractor` | Extraer de archivos SVG. |
| `LlmClient` | Realiza solicitudes de traducción al proveedor LLM activo (`OpenRouterClient` es un alias obsoleto). |
| `PlaceholderHandler` | Protege/restaura la sintaxis de markdown alrededor de la traducción (etiquetas HTML, advertencias, anclajes, comentarios/JSX/llaves MDX, URLs, código en línea, énfasis). |
| `protectMdx` / `restoreMdx` | Protege/restaura comentarios MDX, etiquetas JSX, expresiones entre llaves y atributos de cadena JSX (llamado por `PlaceholderHandler`; también exportado para uso directo). |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño adecuado para los LLM. |
| `validateTranslation` | Comprobaciones estructurales después de la traducción (**asíncronas**: deben esperarse). |
| `resolveDocumentationOutputPath` | Resolver la ruta del archivo de salida para un documento traducido. |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar glosarios de traducción. |
| `runTranslateUI` | Punto de entrada programático para la interfaz de traducción. |
| `writeInitConfigFile` | Escriba un JSON de configuración inicial (`template`, `providerKey` opcional con valor predeterminado `openrouter`). |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `translationModels` inicial por preajuste integrado utilizado por `init -P`. |
| `PROVIDER_PRESETS` | Mapa preestablecido de proveedor integrado (`baseUrl`, `apiKeyEnv`). |
