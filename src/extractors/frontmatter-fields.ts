/** Marker prefix for JSON-encoded front matter shell segments (non-translatable structure). */
export const FRONTMATTER_SHELL_PREFIX = "__I18N_FM_SHELL__\n";

export interface FrontmatterFieldRef {
  path: string;
  value: string;
}

/**
 * Dot-paths for user-facing prose in Starlight and Docusaurus doc front matter.
 * Array indices use numeric segments (e.g. `keywords.0`, `hero.actions.1.text`).
 */
export const DEFAULT_TRANSLATABLE_FRONTMATTER_PATHS: readonly string[] = [
  "title",
  "description",
  "sidebar.label",
  "sidebar_label",
  "pagination_label",
  "keywords",
  "hero.title",
  "hero.tagline",
  "hero.image.alt",
  "hero.actions.text",
  "prev",
  "prev.label",
  "next",
  "next.label",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function allowPath(path: string, allowed: ReadonlySet<string> | null): boolean {
  if (!allowed) {
    return true;
  }
  if (allowed.has(path)) {
    return true;
  }
  // `hero.actions.text` allows `hero.actions.0.text`, etc.
  if (path.includes(".")) {
    const normalized = path.replace(/\.\d+(?=\.|$)/g, "");
    return allowed.has(normalized);
  }
  return false;
}

function pushField(
  fields: FrontmatterFieldRef[],
  path: string,
  value: unknown,
  allowed: ReadonlySet<string> | null
): void {
  if (!allowPath(path, allowed) || !isNonEmptyString(value)) {
    return;
  }
  fields.push({ path, value });
}

function collectHeroImageAlt(
  data: Record<string, unknown>,
  fields: FrontmatterFieldRef[],
  allowed: ReadonlySet<string> | null
): void {
  const hero = data.hero;
  if (!isRecord(hero)) {
    return;
  }
  const image = hero.image;
  if (!isRecord(image)) {
    return;
  }
  pushField(fields, "hero.image.alt", image.alt, allowed);
}

function collectPrevNext(
  data: Record<string, unknown>,
  key: "prev" | "next",
  fields: FrontmatterFieldRef[],
  allowed: ReadonlySet<string> | null
): void {
  const value = data[key];
  if (isNonEmptyString(value)) {
    pushField(fields, key, value, allowed);
    return;
  }
  if (isRecord(value)) {
    pushField(fields, `${key}.label`, value.label, allowed);
  }
}

/** Collect translatable string values from parsed YAML front matter. */
export function collectTranslatableFrontmatterFields(
  data: Record<string, unknown>,
  allowedPaths?: readonly string[]
): FrontmatterFieldRef[] {
  const allowed = allowedPaths ? new Set(allowedPaths) : null;
  const fields: FrontmatterFieldRef[] = [];

  pushField(fields, "title", data.title, allowed);
  pushField(fields, "description", data.description, allowed);
  pushField(fields, "sidebar_label", data.sidebar_label, allowed);
  pushField(fields, "pagination_label", data.pagination_label, allowed);

  if (isRecord(data.sidebar)) {
    pushField(fields, "sidebar.label", data.sidebar.label, allowed);
  }

  if (allowPath("keywords", allowed) && Array.isArray(data.keywords)) {
    for (let i = 0; i < data.keywords.length; i++) {
      pushField(fields, `keywords.${i}`, data.keywords[i], allowed);
    }
  }

  if (isRecord(data.hero)) {
    pushField(fields, "hero.title", data.hero.title, allowed);
    pushField(fields, "hero.tagline", data.hero.tagline, allowed);
    collectHeroImageAlt(data, fields, allowed);

    if (allowPath("hero.actions.text", allowed) && Array.isArray(data.hero.actions)) {
      for (let i = 0; i < data.hero.actions.length; i++) {
        const action = data.hero.actions[i];
        if (isRecord(action)) {
          pushField(fields, `hero.actions.${i}.text`, action.text, allowed);
        }
      }
    }
  }

  collectPrevNext(data, "prev", fields, allowed);
  collectPrevNext(data, "next", fields, allowed);

  return fields;
}

/** Encode front matter object as a non-translatable shell segment body. */
export function encodeFrontmatterShell(data: Record<string, unknown>): string {
  return FRONTMATTER_SHELL_PREFIX + JSON.stringify(data);
}

/** Decode a shell segment body back to a front matter object. */
export function decodeFrontmatterShell(content: string): Record<string, unknown> {
  if (!content.startsWith(FRONTMATTER_SHELL_PREFIX)) {
    throw new Error("Invalid front matter shell segment");
  }
  const parsed: unknown = JSON.parse(content.slice(FRONTMATTER_SHELL_PREFIX.length));
  if (!isRecord(parsed)) {
    throw new Error("Front matter shell must decode to an object");
  }
  return parsed;
}

/** Apply translated field values onto a cloned front matter object (mutates `target`). */
export function applyFrontmatterFieldTranslations(
  target: Record<string, unknown>,
  fields: ReadonlyArray<{ path: string; value: string }>
): void {
  for (const field of fields) {
    setValueAtPath(target, field.path, field.value);
  }
}

function setValueAtPath(root: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split(".");
  let current: unknown = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (Array.isArray(current)) {
      current = current[Number(part)];
    } else if (isRecord(current)) {
      current = current[part];
    } else {
      return;
    }
  }
  const last = parts[parts.length - 1]!;
  if (Array.isArray(current)) {
    current[Number(last)] = value;
  } else if (isRecord(current)) {
    current[last] = value;
  }
}

/** Resolve config value to an allow-list, or `null` for built-in defaults. */
export function resolveFrontmatterFieldAllowList(
  config: boolean | string[] | undefined,
  defaultEnabled = true
): readonly string[] | null {
  if (config === undefined) {
    return defaultEnabled ? null : [];
  }
  if (config === false) {
    return [];
  }
  if (config === true) {
    return null;
  }
  return config;
}
