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

El mismo patrón funciona fuera de React (Node.js, componentes del servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Reglas:**

- Solo se extraen estas formas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clave debe ser una **cadena literal** — no se permiten variables ni expresiones como clave.
- No uses literales de plantilla para la clave: <code>{'t(`Hello ${name}`)'}</code> no es extraíble.

<a id="interpolation"></a>
## Interpolación

Utilice la interpolación nativa del segundo argumento de i18next para los marcadores de posición <code v-pre>{{var}}</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El comando extract analiza el **segundo argumento** cuando es un objeto literal plano y lee banderas solo para herramientas como `plurals: true` y `zeroDigit` (véase **Plurales cardinales** más abajo). Para cadenas normales, solo se usa la clave literal para el hash; las opciones de interpolación aún se pasan a i18next en tiempo de ejecución.

Si su proyecto utiliza una utilidad de interpolación personalizada (por ejemplo, llamando a `t('key')` y luego pasando el resultado a través de una función de plantilla como <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), `setupKeyAsDefaultT` (a través de `wrapI18nWithKeyTrim`) lo hace innecesario — aplica la interpolación <code v-pre>{{var}}</code> incluso cuando la configuración regional de origen devuelve la clave sin procesar. Migre los sitios de llamada a <code v-pre>t('Hello {{name}}', { name })</code> y elimine la utilidad personalizada.

<a id="cardinal-plurals-plurals-true"></a>
## Plurales cardinales (`plurals: true`)

**No escriba las formas plurales a mano.** En el código fuente, escriba el mensaje una vez y pase dos cosas en el segundo argumento:

1. **`plurals: true`** — indica a extract y a `translate-ui` que esta llamada es un grupo plural cardinal.
2. **`count`** — el número que i18next utiliza en tiempo de ejecución para elegir la forma correcta.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Eso es todo lo que necesita en el sitio de la llamada. **No** defina `_zero`, `_one`, `_other` ni ningún otro sufijo de clave usted mismo.

Cuando ejecuta `translate-ui`, **ai-i18n-tools llama a un LLM** para generar cada categoría cardinal requerida para cada configuración regional de destino (`zero`, `one`, `two`, `few`, `many`, `other` — la que `Intl.PluralRules` requiera para ese idioma). El modelo recibe su literal original más las variantes plurales del idioma de origen, luego devuelve las formas traducidas. Las herramientas las escriben en `strings.json` y emiten JSON plano de i18next (`<groupId>_zero`, `<groupId>_one`, …) para que la resolución plural en tiempo de ejecución funcione sin configuración adicional por su parte.

- `zeroDigit` (opcional) — solo para herramientas; **no** lo lee i18next. Cuando `true`, el mensaje del LLM prefiere un literal árabe `0` en la cadena `_zero` para cada configuración regional donde exista esa forma; cuando `false` u omitido, se utiliza la frase natural de cero. Elimine estas claves antes de llamar a `i18next.t` (consulte `wrapT` a continuación).

**Validación:** Si el mensaje contiene **dos o más** marcadores de posición <code v-pre>{{…}}</code> distintos, **uno de ellos debe ser** <code v-pre>{{count}}</code> (el eje plural). De lo contrario, `extract` **fallará** con un mensaje claro de archivo/línea.

**Dos conteos independientes** (por ejemplo, secciones y páginas) no pueden compartir un mismo mensaje plural — usa **dos** llamadas a `t()` (cada una con `plurals: true` y su propio `count`) y concaténalas en la interfaz.

**No incluido en v1:** plurales ordinales (`_ordinal_*`, `ordinal: true`), plurales de intervalo, pipelines exclusivos de ICU.

<a id="how-plurals-are-stored-and-emitted"></a>
## Cómo se almacenan y emiten los plurales

**En** `strings.json` los grupos plurales usan **una fila por hash** con `"plural": true`, el literal original en `source` y `translated[locale]` como un objeto que asigna categorías cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) a cadenas para esa configuración regional.

**JSON plano de configuración regional:** Las filas no plurales permanecen como **oración fuente → traducción**. Las filas plurales se emiten como `<groupId>_original` (igual a `source`, para referencia) y `<groupId>_<form>` para cada sufijo, de modo que i18next resuelva los plurales de forma nativa. `translate-ui` también escribe `{sourceLocale}.json` que contiene **solo** claves planas plurales (cargue este paquete para el idioma fuente para que las claves con sufijo se resuelvan; las cadenas simples siguen usando la clave como valor por defecto). Para cada configuración regional de destino, las claves de sufijo emitidas coinciden con `Intl.PluralRules` para esa configuración regional (`requiredCldrPluralForms`): si `strings.json` omitió una categoría porque coincidía con otra tras la compactación (por ejemplo, el `many` árabe igual que `other`), `translate-ui` aún escribe todos los sufijos requeridos en el archivo plano copiándolos desde una cadena de respaldo, para que la búsqueda en tiempo de ejecución nunca falte una clave.

Tiempo de ejecución (`ai-i18n-tools/runtime`): **Llame** a `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ejecuta `wrapI18nWithKeyTrim`, registra el paquete plural opcional `translate-ui` `{sourceLocale}.json`, luego `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` elimina `plurals` / `zeroDigit`, reescribe la clave al ID del grupo cuando es necesario y reenvía `count` (opcional: si hay un solo marcador de posición que no sea <code v-pre>{{count}}</code>, `count` se copia de esa opción numérica). Consulte [Wire i18next](/guide/ui-strings/i18next-runtime) y [Runtime helpers](/guide/runtime-helpers).

**Entornos antiguos:** `Intl.PluralRules` es necesario para las herramientas y para un comportamiento consistente; use polyfill si su objetivo son navegadores muy antiguos.
