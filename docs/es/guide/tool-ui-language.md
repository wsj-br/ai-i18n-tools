<a id="tool-ui-language"></a>
# Idioma de la interfaz de usuario de la herramienta

La herramienta localiza su propia interfaz de usuario —texto de ayuda de la CLI, mensajes de registro/resumen/error de alto tráfico y el Panel de traducción— independientemente del `sourceLocale` / `targetLocales` de su proyecto. No se requiere configuración: de forma predeterminada, la herramienta sigue la configuración regional de su sistema operativo.

<a id="locale-resolution"></a>
## Resolución de la configuración regional

La configuración regional de la interfaz de usuario se resuelve a partir de estas fuentes, de mayor a menor prioridad:

1. Indicador global `-L` / `--ui-lang <code>` (por ejemplo, `-L pt-BR`).
2. Variable de entorno `AI_I18N_LANG` (por ejemplo, `export AI_I18N_LANG=es`).
3. La clave de configuración `uiLanguage` en `ai-i18n-tools.config.json` (cadena BCP-47).
4. La locale del sistema operativo anfitrión (a través de `Intl.DateTimeFormat().resolvedOptions().locale`).

<a id="matching-and-fallback"></a>
## Coincidencia y reserva

La configuración regional solicitada se compara exactamente con los idiomas de interfaz de usuario distribuidos o por la variación más cercana (por ejemplo, `pt-PT` se resuelve en `pt-BR`, y `en-US` se resuelve en `en-GB`); cuando nada coincide, recurre a la configuración regional de origen (`en-GB`). Cuando se solicita explícitamente un idioma de interfaz de usuario (a través del indicador, la variable de entorno o `uiLanguage`) pero no coincide ningún paquete distribuido, la CLI imprime una advertencia única de que se utilizará la configuración regional predeterminada; una configuración regional inferida solo del sistema operativo anfitrión nunca advierte.

<a id="shipped-ui-languages"></a>
## Idiomas de la interfaz de usuario enviados

`en-GB` (fuente) más `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` y `zh-Hant`.

<a id="translation-dashboard"></a>
## Panel de traducción

El Panel de traducción lee la configuración regional resuelta, la dirección del diseño y el paquete de traducción de `GET /api/ui-i18n` y los aplica al cargar (establece `<html lang>` / `dir` y localiza el marcado estático a través de los atributos `data-i18n*`).

<a id="related"></a>
## Relacionado

- [`AI_I18N_LANG`](/reference/environment-variables) — anulación de la variable de entorno
- [`uiLanguage`](/reference/configuration#uilanguage-optional) — anulación de la clave de configuración
- [`-L` / `--ui-lang`](/reference/cli-commands/) — anulación de la bandera de la CLI (la más alta prioridad)
