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

1. Ejecuta `ai-i18n-tools write-heading-ids` en tu fuente `.md` / `.mdx` antes de `translate-docs` (mismo `docs[]` / `contentPaths` que de costumbre). Inserta anclajes HTML explícitos en la línea anterior a cada encabezado, de modo que los valores `id` sean compartidos por cada copia traducida. Vuelve a ejecutarlo tras renombrar encabezados para actualizar los IDs de anclaje obsoletos y que coincidan con el título actual.
2. Apunta tus **enlaces de anclaje** en markdown a esos IDs estables, por ejemplo `[label](other.md#section-id)`, donde `section-id` coincida con el anclaje escrito por la herramienta — no una suposición basada únicamente en palabras en inglés.

<a id="example"></a>
## Ejemplo

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

Si los enlaces siguen fallando después de la traducción, consulta [Solución de problemas](/guide/documents/troubleshooting).
