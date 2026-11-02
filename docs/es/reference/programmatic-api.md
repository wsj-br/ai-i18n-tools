<a id="programmatic-api"></a>
# API programática

Todos los tipos y clases públicos se exportan desde la raíz del paquete. Ejemplo: ejecutar el paso translate-ui desde Node.js sin la CLI:

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

Generar una configuración desde Node.js. El cuarto argumento es el preajuste integrado (`cwd` es el tercero). Un quinto argumento opcional `{ withReadme: true }` añade el bloque de documentación README plano cuando la plantilla aún no lista `README.md`, y devuelve si ese bloque fue añadido:

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
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
| `HtmlTemplateExtractor` | Extraer y reensamblar documentos HTML simples (texto y atributos traducibles; `src` / `href` permanecen en su lugar). |
| `JsonExtractor` | Extraer de archivos JSON de etiquetas de Docusaurus (catálogos de interfaz de usuario, no del cuerpo MDX). |
| `SvgExtractor` | Extraer de archivos SVG. |
| `LlmClient` | Realiza solicitudes de traducción al proveedor LLM activo (`OpenRouterClient` es un alias obsoleto). |
| `rankProviderModels` / `resolveSuggestionWeights` | Clasifica el catálogo de chat del proveedor de rango uno con el perfil de calidad o precio utilizado por `suggest-models`. No imprime ni escribe la configuración. |
| `PlaceholderHandler` | Protege/restaura la sintaxis de markdown alrededor de la traducción (etiquetas HTML, advertencias, anclajes, comentarios/JSX/llaves MDX, URLs, código en línea, énfasis). |
| `protectMdx` / `restoreMdx` | Protege/restaura comentarios MDX, etiquetas JSX, expresiones entre llaves y atributos de cadena JSX (llamado por `PlaceholderHandler`; también exportado para uso directo). |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño adecuado para los LLM. |
| `validateTranslation` | Comprobaciones estructurales después de la traducción (**asíncronas**: deben esperarse). |
| `resolveDocumentationOutputPath` | Resolver la ruta del archivo de salida para un documento traducido. |
| `Glossary` / `GlossaryMatcher` | Carga y aplica glosarios de traducción, incluyendo notas opcionales de `Context` de términos. |
| `loadTranslationContext` / `computeGuidanceFingerprint` | Carga `glossary.contextFiles` y la guía de huellas digitales para la invalidación de la caché. |
| `runTranslateUI` | Punto de entrada programático de translate-ui. |
| `writeInitConfigFile` | Escribe un JSON de configuración inicial (`template`, `cwd`, un `providerKey` requerido y un `{ withReadme }` opcional). Devuelve `{ readmeBlockAdded, hasReadmeBlock }`. |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `translationModels` inicial por preajuste integrado utilizado por `init -P`. |
| `PROVIDER_PRESETS` | Mapa preestablecido de proveedor integrado (`baseUrl`, `apiKeyEnv`). |

<a id="python-runtime-i18npy"></a>
## Entorno de ejecución de Python (`i18n.py`)

`init -t ui-python`, `ui-python-gettext` y `ui-python-flask` escriben este módulo en el proyecto cuando falta `i18n.py`. Es un asistente de la biblioteca estándar para Python 3.10 o versiones posteriores. Impórtelo desde ese archivo. Las funciones a continuación son independientes de las exportaciones de Node en la tabla anterior. Los proyectos de Django conservan el gettext de Django, por lo que `ui-python-django` no escribe `i18n.py`.

Formas de llamada, f-strings no seguras y configuración de configuración regional por framework: [Aplicaciones de Python](/es/guide/ui-strings/python).

| Función | Comportamiento |
| --- | --- |
| `set_locale(locale)` | Establece la configuración regional actual. Los guiones bajos en el código se almacenan como guiones (`pt_BR` se convierte en `pt-BR`). Devuelve un token `ContextVar`. |
| `reset_locale(token)` | Restaura la configuración regional a partir de ese token. Llámela en `finally`, incluyendo el middleware de FastAPI y Flask. |
| `get_locale()` | Devuelve la configuración regional actual. |
| `set_backend(backend)` | Selecciona `"auto"`, `"json"` o `"gettext"`. |
| `get_ui_languages()` | Lee `ui-languages.json` junto al directorio JSON plano, o el directorio gettext cuando la salida plana está desactivada. |
| `get_direction(locale=None)` | Devuelve `"rtl"` o `"ltr"` de la fila del manifiesto para esa configuración regional (la configuración regional actual cuando se omite). |
| `_(message)` | Busca un literal y, a continuación, devuelve la cadena del catálogo o el propio mensaje. |
| `t(template, *, plurals=False, count=None, **values)` | Busca el literal y, a continuación, interpola. `translate` es la misma función. En Python 3.14, `translate(t"Hello, {name}!")` conserva la plantilla y sus valores. Los argumentos de palabra clave anulan los valores tomados de una cadena de plantilla. |
| `ngettext(singular, plural, n, **values)` | Búsqueda de plurales y, a continuación, interpolación. `count` está disponible para la cadena de formato. |
| `pgettext(context, message, **values)` | Búsqueda de contexto (`msgctxt`, o `context` + U+0004 + la cadena del idioma de origen en JSON plano), luego interpolar. |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Cuadro de selección de Streamlit. Escribe `st.session_state.locale` y `st.query_params["lang"]`, llama a `set_locale` y devuelve el código elegido. |

<a id="dotnet-runtime-i18ncs"></a>
## runtime de .NET (`I18n.cs`)

`init -t ui-dotnet` copia `assets/dotnet/I18n.cs` en el proyecto cuando falta `I18n.cs`. Es un asistente sin dependencias para .NET 6 o posterior. Los miembros siguientes están separados de las exportaciones de Node en la tabla anterior. Formas de llamada y marcado XAML: [Aplicaciones .NET](/es/guide/ui-strings/dotnet).

| Miembro | Comportamiento |
| --- | --- |
| `SetLocale(locale)` | Carga el JSON plano de esa configuración regional, recorriendo `CultureInfo.Parent` cuando falta el archivo exacto. Genera `LocaleChanged`. |
| `T(source, args)` | Busca el literal recortado, formatea con `string.Format` y restaura los espacios en blanco iniciales y finales del origen. |
| `Tn(singular, plural, count, args)` | Búsqueda de plurales. `{0}` es el recuento. La clave del catálogo es el MD5-8 del singular recortado más `_` y la forma CLDR. |
| `Tp(context, source, args)` | Busca contexto + U+0004 + origen, y luego formatea. |
| `N(source)` | Devuelve `source`. Extraído para que las etiquetas estáticas puedan catalogarse. |
| `Loc[source]` | Indizador que llama a `T`. `Loc` es un campo estático de tipo `StringSourceLocalizer`. |
| `Configure(options)` | Establece la configuración regional de origen cuando `SourceLocale` no está vacío. Cada llamada reemplaza `Strict`, `FlatDirectory` y `OpenLocale` (null borra el directorio y el cargador de flujo). `Locales` reemplaza la lista de idiomas solo cuando la matriz no es nula. |
| `SupportedLocales` | `BuiltInLocales` hasta que se pase una matriz `Locales` no nula. Nombre nativo y nombre en inglés. Una matriz `Locales` nula no restaura la marca. |
| `IsRightToLeft(locale)` | `CultureInfo.TextInfo.IsRightToLeft`. |
| `PluralForm(locale, n)` | Nombre de la forma CLDR de las mismas reglas GNU que los archivos `.po`. |

`init -t ui-dotnet-resx` copia `I18nResx.cs` en su lugar. `T`, `Tn` y `Tp` llaman a `ResourceManager` con las mismas claves de cadena de origen. `SetLocale` establece `CurrentUICulture` y `CurrentCulture`. Detalles: [Agregar i18n a una aplicación ResourceManager de .NET](/es/guide/add-i18n-to-dotnet-resourcemanager).
