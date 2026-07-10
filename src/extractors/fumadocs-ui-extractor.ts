import { parse } from "@babel/parser";
import type {
  CallExpression,
  Node,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
} from "@babel/types";

export type FumadocsUiCatalog = Record<string, string>;

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

function collectFlatStringMap(obj: ObjectExpression, out: Map<string, string>): void {
  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") {
      continue;
    }
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const keyName = propertyKeyName(prop);
    if (!keyName || !isStringLiteralValue(prop.value)) {
      continue;
    }
    const value = prop.value.value;
    if (!value.trim() || looksLikeUrl(value)) {
      continue;
    }
    out.set(keyName, value);
  }
}

function calleeEndsWith(call: CallExpression, name: string): boolean {
  const callee = call.callee;
  if (callee.type === "Identifier") {
    return callee.name === name;
  }
  if (callee.type === "MemberExpression" && !callee.computed) {
    if (callee.property.type === "Identifier") {
      return callee.property.name === name;
    }
  }
  return false;
}

function findEnBlockInAddArg(arg: ObjectExpression): ObjectExpression | null {
  for (const prop of arg.properties) {
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const keyName = propertyKeyName(prop);
    if (keyName === "en" && prop.value.type === "ObjectExpression") {
      return prop.value;
    }
  }
  return null;
}

function extractFromAddCall(call: CallExpression, out: Map<string, string>): void {
  const arg = call.arguments[0];
  if (!arg || arg.type !== "ObjectExpression") {
    return;
  }
  const enBlock = findEnBlockInAddArg(arg);
  if (enBlock) {
    collectFlatStringMap(enBlock, out);
    return;
  }
  collectFlatStringMap(arg, out);
}

function isTranslationChainStart(call: CallExpression): boolean {
  const callee = call.callee;
  if (callee.type === "Identifier") {
    return callee.name === "defineTranslations";
  }
  if (callee.type === "MemberExpression" && !callee.computed) {
    if (callee.property.type === "Identifier" && callee.property.name === "translations") {
      return true;
    }
  }
  return false;
}

function walkTranslationChain(node: Node, out: Map<string, string>): void {
  walkAst(node, (n) => {
    if (n.type !== "CallExpression") {
      return;
    }
    if (calleeEndsWith(n, "add")) {
      extractFromAddCall(n, out);
    }
    if (isTranslationChainStart(n)) {
      for (const arg of n.arguments) {
        if (isAstNode(arg)) {
          walkTranslationChain(arg, out);
        }
      }
    }
  });
}

/**
 * Extract English UI override strings from a Fumadocs `layout.shared.ts` module.
 * Supports `defineTranslations().extend(...).add({ ... })` and `i18n.translations().extend(...).add({ en: { ... } })`.
 */
export function extractFumadocsUiCatalog(content: string, filepath: string): FumadocsUiCatalog {
  let ast: Node;
  try {
    ast = parse(content, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript"],
    }) as Node;
  } catch (e) {
    throw new Error(
      `Failed to parse Fumadocs UI source ${filepath}: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const leaves = new Map<string, string>();
  walkTranslationChain(ast, leaves);

  const catalog: FumadocsUiCatalog = {};
  for (const [key, value] of leaves) {
    catalog[key] = value;
  }
  return catalog;
}

export function mergeFumadocsUiCatalogs(
  existing: FumadocsUiCatalog,
  extracted: FumadocsUiCatalog
): FumadocsUiCatalog {
  if (Object.keys(extracted).length === 0) {
    return existing;
  }
  return { ...existing, ...extracted };
}
