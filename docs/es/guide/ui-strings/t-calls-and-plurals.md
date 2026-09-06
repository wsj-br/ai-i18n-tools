<a id="t-calls--plurals"></a>
# Llamadas a t() y plurales

<a id="using-t-in-source-code"></a>
## Uso de `t()` en el código fuente

Llama a `t()` con una **cadena literal** para que el script de extracción pueda encontrarla:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

El mismo patrón funciona fuera de React (Node.js, componentes de servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Reglas:**

- Solo se extraen estas formas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clave debe ser una **cadena literal**, sin variables ni expresiones como clave.
- No uses literales de plantilla para la clave: <code>{'t(`Hello ${name}`)'}</code> no es extraíble.

<a id="interpolation"></a>
## Interpolación

Usa la interpolación de segundo argumento nativa de i18next para los marcadores de posición <code v-pre>{{var}}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El comando de extracción analiza el **segundo argumento** cuando es un objeto literal simple y lee las banderas solo para herramientas como `plurals: true` y `zeroDigit` (consulta **Plurales cardinales** a continuación). Para cadenas ordinarias, solo se usa la clave literal para el hash; las opciones de interpolación se siguen pasando a i18next en tiempo de ejecución.

Si tu proyecto utiliza una utilidad de interpolación personalizada (por ejemplo, llamando a `t('key')` y luego pasando el resultado a través de una función de plantilla como <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (a través de `wrapI18nWithKeyTrim`) lo hace innecesario, ya que aplica la interpolación <code v-pre>{{var}}</code> incluso cuando la configuración regional de origen devuelve la clave sin procesar. Migra los sitios de llamada a <code v-pre>t('Hello {{name}}', { name })</code> y elimina la utilidad personalizada.

<a id="cardinal-plurals-plurals-true"></a>
## Plurales cardinales (`plurals: true`)

**No escribas las formas plurales a mano.** En el código fuente, escribe el mensaje una vez y pasa dos cosas en el segundo argumento:

1. **`plurals: true`** — le dice a extract y a `translate-ui` que esta llamada es un grupo plural cardinal.
2. **`count`** — el número que i18next usa en tiempo de ejecución para elegir la forma correcta.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Eso es todo lo que necesitas en el sitio de la llamada. **No** defines `_zero`, `_one`, `_other` ni ninguna otra clave de sufijo tú mismo.

Cuando ejecutas `translate-ui`, **ai-i18n-tools llama a un LLM** para generar cada categoría cardinal requerida para cada configuración regional de destino (`zero`, `one`, `two`, `few`, `many`, `other`, lo que `Intl.PluralRules` requiera para ese idioma). El modelo recibe tu literal original más las variantes plurales del idioma de origen, luego devuelve las formas traducidas. La herramienta las escribe en `strings.json` y emite JSON de i18next plano (`<groupId>_zero`, `<groupId>_one`, …) para que la resolución plural en tiempo de ejecución funcione sin configuración adicional por tu parte.

- `zeroDigit` (opcional) — solo para herramientas; **no** lo lee i18next. Cuando `true`, el prompt de LLM prefiere un `0` árabe literal en la cadena `_zero` para cada configuración regional donde exista esa forma; cuando `false` u omitido, se usa la frase cero natural. Elimina estas claves antes de llamar a `i18next.t` (consulta `wrapT` a continuación).

**Validación:** Si el mensaje contiene **dos o más** marcadores de posición <code v-pre>{{…}}</code> distintos, **uno de ellos debe ser** <code v-pre>{{count}}</code> (el eje plural). De lo contrario, `extract` **fallará** con un mensaje claro de archivo/línea.

Después de que el LLM devuelve las formas CLDR, `translate-ui` también verifica cada forma con el **literal original del desarrollador**: cada marcador de posición de origen debe aparecer en cada categoría (incluido `one`), las formas no deben inventar nuevos tokens <code v-pre>{{…}}</code> / `%d` / `{n}`, y las fuentes solo de sustantivos (sin <code v-pre>{{count}}</code> y sin dígitos, por ejemplo, etiquetas de unidad como `Minutes`) deben permanecer solo de sustantivos. Las discrepancias descartan la respuesta de ese modelo y reintentan el siguiente modelo en la lista de reserva.

**Dos recuentos independientes** (por ejemplo, secciones y páginas) no pueden compartir un mensaje plural; usa **dos** llamadas a `t()` (cada una con `plurals: true` y su propio `count`) y concaténalas en la interfaz de usuario.

**No en v1:** plurales ordinales (`_ordinal_*`, `ordinal: true`), plurales de intervalo, pipelines solo de ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
## Cómo se almacenan y emiten los plurales

**En** `strings.json`, los grupos plurales usan **una fila por hash** con `"plural": true`, el literal original en `source`, y `translated[locale]` como un objeto que mapea categorías cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) a cadenas para esa configuración regional.

**JSON de configuración regional plana:** Las filas no plurales mantienen **oración de origen → traducción**. Las filas plurales se emiten como `<groupId>_original` (igual a `source`, para referencia) y `<groupId>_<form>` para cada sufijo, de modo que i18next resuelva los plurales de forma nativa. `translate-ui` también escribe `{sourceLocale}.json` que contiene **solo** claves planas plurales (cargue este paquete para el idioma de origen para que las claves con sufijo se resuelvan; las cadenas simples aún usan la clave como predeterminada). Para cada configuración regional de destino, las claves de sufijo emitidas coinciden con `Intl.PluralRules` para esa configuración regional (`requiredCldrPluralForms`): si `strings.json` omitió una categoría porque coincidía con otra después de la compactación (por ejemplo, árabe `many` igual que `other`), `translate-ui` aún escribe cada sufijo requerido en el archivo plano copiando de una cadena hermana de reserva para que la búsqueda en tiempo de ejecución nunca pierda una clave.

Tiempo de ejecución (`ai-i18n-tools/runtime`): **Llame a** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ejecuta `wrapI18nWithKeyTrim`, registra el paquete plural opcional `translate-ui` `{sourceLocale}.json`, luego `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` elimina `plurals` / `zeroDigit`, reescribe la clave al ID de grupo cuando es necesario y reenvía `count` (opcional: si hay un solo marcador de posición que no sea <code v-pre>{{count}}</code>, `count` se copia de esa opción numérica). Consulte [Wire i18next](/es/guide/ui-strings/i18next-runtime) y [Runtime helpers](/es/guide/runtime-helpers).
