<a id="anchor-links"></a>
# Enlaces de anclaje

Cuando `docsOutput.style = "flat"`, la salida reescribe **rutas relativas** entre páginas para cada configuración regional (`guide.md` → `guide.de.md`). Los **enlaces de anclaje** — la forma habitual en línea de markdown con un `#` después de la ruta — saltan a una sección dentro del archivo de destino:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Aquí, el destino del enlace es `setup.md`, y `#first-run` es el anclaje: debería desplazarse al encabezado correcto dentro de ese archivo.

<a id="why-anchor-links-need-attention"></a>
## Por qué los enlaces de anclaje necesitan atención

- `rewriteRelativeLinks` fija el **nombre de archivo** para cada idioma (`setup.md` → `setup.de.md`).
- Muchos renderizadores derivan el slug de `#` del **texto visible del encabezado**. Después de la traducción, los encabezados varían por idioma, por lo que un slug generado automáticamente puede cambiar mientras que el enlace reescrito aún diga `#first-run` — o su anclaje en inglés `#…` ya no coincida con el slug que el renderizador construye a partir del encabezado traducido.
- Resultado: los lectores llegan al **archivo** correcto pero a la **línea incorrecta**, o el navegador no encuentra ningún encabezado coincidente.

<a id="what-to-do"></a>
## Qué hacer

<a id="docusaurus-sites-preferred"></a>
### Sitios Docusaurus (preferido)

En la documentación de [Docusaurus](/es/guide/integrations/docusaurus) (`docsOutput.style = "docusaurus"`), prefiere los ID de encabezado nativos de Docusaurus en lugar de los anclajes HTML de `ai-i18n-tools write-heading-ids`:

1. Añada un id explícito en la línea del encabezado con el sufijo clásico `{#…}` de Docusaurus (CommonMark) o el comentario MDX `{/* #… */}` (preferido para `.mdx`), por ejemplo, `## TLS configuration {#tls-configuration}` o `## TLS configuration {/* #tls-configuration */}`. Durante `translate-docs`, solo el texto visible del encabezado se envía al modelo: el sufijo del id se elimina primero y se vuelve a fijar al **final** de la línea del encabezado traducido (Docusaurus ignora un `{/* #id */}` que cae en medio del título).
2. Ejecute `docusaurus write-heading-ids` desde la raíz de su proyecto de Docusaurus (a menudo `pnpm run write-heading-ids` cuando se configura en `package.json`) para añadir o actualizar los id en los encabezados que carecen de ellos; use `--syntax mdx-comment` para la forma `{/* #… */}`. Alternativamente, ejecute `ai-i18n-tools write-heading-ids --slug-style mdx-comment` en el mismo `docs[]` / `contentPaths`. Ese comando también reposiciona los mismos id en inglés en los archivos traducidos existentes (no genera un slug para el título traducido) y actualiza el segmento en caché coincidente cuando los recuentos de segmentos coinciden, para que un `sync --force-update` posterior conserve el id reparado. Vuelva a ejecutarlo después de cambiar el nombre de los encabezados para que los id obsoletos coincidan con los títulos actuales.

Dirige tus **enlaces de anclaje** de markdown a esos ID estables, por ejemplo, `[label](other.md#tls-configuration)`, donde el fragmento coincide con el ID `{#…}` o `{/* #… */}`, no con un slug adivinado solo a partir de palabras en inglés. Consulta [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) para ver documentos confirmados que utilizan este patrón.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### Otros diseños (plano, Starlight, VitePress, etc.)

Cuando no estés en Docusaurus, o necesites anclajes HTML en lugar de sufijos `{#…}` / `{/* #… */}`:

1. Ejecute `ai-i18n-tools write-heading-ids` en su `.md` / `.mdx` de origen antes de `translate-docs` (mismo `docs[]` / `contentPaths` que de costumbre). Inserta anclajes HTML explícitos en la línea anterior a cada encabezado para que los valores de `id` sean compartidos por cada copia traducida, y copia esos mismos id en inglés en los archivos traducidos existentes. Cuando los recuentos de segmentos coinciden, el segmento en caché coincidente también se actualiza, por lo que un `sync --force-update` posterior conserva el id reparado. Vuelva a ejecutarlo después de cambiar el nombre de los encabezados para que los id de anclaje obsoletos se actualicen y coincidan con el título actual.
2. Dirija sus **enlaces de anclaje** de markdown a esos id estables, por ejemplo, `[label](other.md#section-id)`, donde `section-id` coincide con el anclaje que escribió la herramienta, no con una suposición basada solo en palabras en inglés.

<a id="example"></a>
## Ejemplo

<a id="docusaurus------suffix"></a>
### Sufijo Docusaurus `{#…}` / `{/* #… */}`

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (fuente en inglés, clásica):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

O el formato de comentario preferido de MDX:

```markdown
## TLS configuration {/* #tls-configuration */}

Your CA and cert steps…
```

Después de `translate-docs`, el fragmento del enlace permanece `#tls-configuration` en cada configuración regional; solo cambian el texto del encabezado y la etiqueta del enlace:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### Anclas HTML (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` después de `write-heading-ids` (simplificado):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

Después de `translate-docs`, las rutas de archivo y los anclajes `#…` permanecen alineados en cada archivo de idioma, por ejemplo:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

El anclaje `#tls-configuration` es el mismo en todos los idiomas porque el `id` está fijo en el origen; solo se traducen el **texto** del encabezado y la **etiqueta** del enlace.

Si los enlaces siguen fallando después de la traducción, consulta [Solución de problemas](/es/guide/documents/troubleshooting).
