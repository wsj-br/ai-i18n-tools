import { parse } from "@babel/parser";
import type { Node, ObjectExpression, ObjectProperty, StringLiteral } from "@babel/types";

const TRANSLATABLE_KEYS = new Set([
  "text",
  "title",
  "label",
  "message",
  "copyright",
  "placeholder",
  "description",
  "prev",
  "next",
]);

export type ThemeCatalog = Record<string, unknown>;

function isAstNode(x: unknown): x is Node {
  return (
    typeof x === "object" &&
    x !== null &&
    "type" in x &&
    typeof (x as { type: unknown }).type === "string"
  );
}

function walkAst(node: Node, visitor: (n: Node) => void): void {
  visitor(node);
  for (const key of Object.keys(node) as (keyof Node)[]) {
    const child = node[key];
    if (child === null || child === undefined) {
      continue;
    }
    if (Array.isArray(child)) {
      for (const c of child) {
        if (isAstNode(c)) {
          walkAst(c, visitor);
        }
      }
    } else if (isAstNode(child)) {
      walkAst(child, visitor);
    }
  }
}

function propertyKeyName(prop: ObjectProperty): string | null {
  const key = prop.key;
  if (key.type === "Identifier") {
    return key.name;
  }
  if (key.type === "StringLiteral") {
    return key.value;
  }
  return null;
}

function isStringLiteralValue(value: ObjectProperty["value"]): value is StringLiteral {
  return value.type === "StringLiteral";
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

function setNested(obj: ThemeCatalog, dotPath: string, value: string): void {
  const parts = dotPath.split(".");
  let cur: ThemeCatalog = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    const next = cur[p];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p] as ThemeCatalog;
  }
  cur[parts[parts.length - 1]!] = value;
}

function collectThemeStrings(
  obj: ObjectExpression,
  prefix: string,
  out: Map<string, string>
): void {
  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") {
      continue;
    }
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const keyName = propertyKeyName(prop);
    if (!keyName) {
      continue;
    }
    const dotPath = prefix ? `${prefix}.${keyName}` : keyName;

    if (prop.value.type === "ObjectExpression") {
      collectThemeStrings(prop.value, dotPath, out);
      continue;
    }

    if (prop.value.type === "ArrayExpression") {
      prop.value.elements.forEach((el, index) => {
        if (!el || el.type !== "ObjectExpression") {
          return;
        }
        collectThemeStrings(el, `${dotPath}.${index}`, out);
      });
      continue;
    }

    if (!isStringLiteralValue(prop.value)) {
      continue;
    }

    const value = prop.value.value;
    if (!value.trim() || looksLikeUrl(value)) {
      continue;
    }

    if (TRANSLATABLE_KEYS.has(keyName) || (!prefix && (keyName === "title" || keyName === "description"))) {
      out.set(dotPath, value);
    }
  }
}

function findDefineConfigObject(ast: Node): ObjectExpression | null {
  let found: ObjectExpression | null = null;
  walkAst(ast, (node) => {
    if (node.type !== "CallExpression") {
      return;
    }
    const callee = node.callee;
    if (callee.type !== "Identifier" || callee.name !== "defineConfig") {
      return;
    }
    const arg = node.arguments[0];
    if (arg?.type === "ObjectExpression") {
      found = arg;
    }
  });
  return found;
}

/**
 * Extract translatable theme strings from a VitePress config module into nested catalog JSON.
 */
export function extractVitepressThemeCatalog(content: string, filepath: string): ThemeCatalog {
  let ast: Node;
  try {
    ast = parse(content, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript"],
    }) as Node;
  } catch (e) {
    throw new Error(
      `Failed to parse VitePress config ${filepath}: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const root = findDefineConfigObject(ast);
  const leaves = new Map<string, string>();
  if (root) {
    collectThemeStrings(root, "", leaves);
  }

  const catalog: ThemeCatalog = {};
  for (const [path, value] of leaves) {
    setNested(catalog, path, value);
  }
  return catalog;
}

export function mergeThemeCatalogs(
  existing: ThemeCatalog,
  extracted: ThemeCatalog
): ThemeCatalog {
  if (Object.keys(extracted).length === 0) {
    return existing;
  }
  return deepMergeCatalog(existing, extracted);
}

function deepMergeCatalog(base: ThemeCatalog, patch: ThemeCatalog): ThemeCatalog {
  const out: ThemeCatalog = { ...base };
  for (const [key, val] of Object.entries(patch)) {
    if (
      typeof val === "object" &&
      val !== null &&
      !Array.isArray(val) &&
      typeof out[key] === "object" &&
      out[key] !== null &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeCatalog(out[key] as ThemeCatalog, val as ThemeCatalog);
    } else {
      out[key] = val;
    }
  }
  return out;
}
