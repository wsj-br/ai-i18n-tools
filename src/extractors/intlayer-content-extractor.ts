import { parse } from "@babel/parser";
import type {
  CallExpression,
  ExportDefaultDeclaration,
  Expression,
  Node,
  ObjectExpression,
  ObjectProperty,
} from "@babel/types";
import { uiStringHash } from "./ui-string-locations.js";
import { normalizeLocale } from "../core/locale-utils.js";

export interface IntlayerLeaf {
  dictKey: string;
  dotPath: string;
  file: string;
  line: number;
  /** Locale key as written in the `t({ … })` object (e.g. `en`, `pt-BR`). */
  locales: Record<string, string>;
  sourceText: string;
  hash: string;
}

export interface UnsupportedIntlayerLeaf {
  dictKey: string;
  dotPath: string;
  file: string;
  line: number;
  reason: string;
}

export interface IntlayerDictionaryExtract {
  file: string;
  dictKey: string;
  leaves: IntlayerLeaf[];
  unsupported: UnsupportedIntlayerLeaf[];
}

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

function unwrapTs(expr: Expression): Expression {
  let node: Expression = expr;
  while (
    node.type === "TSSatisfiesExpression" ||
    node.type === "TSAsExpression" ||
    node.type === "TSTypeAssertion" ||
    node.type === "TSNonNullExpression"
  ) {
    node = node.expression;
  }
  return node;
}

function findDefaultExportObject(ast: Node): ObjectExpression | null {
  let found: ObjectExpression | null = null;
  walkAst(ast, (node) => {
    if (node.type !== "ExportDefaultDeclaration") {
      return;
    }
    const decl = node as ExportDefaultDeclaration;
    const inner = unwrapTs(decl.declaration as Expression);
    if (inner.type === "ObjectExpression") {
      found = inner;
    }
  });
  return found;
}

function objectProp(obj: ObjectExpression, name: string): ObjectProperty | null {
  for (const prop of obj.properties) {
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    if (propertyKeyName(prop) === name) {
      return prop;
    }
  }
  return null;
}

function readStringLiteral(expr: Expression): string | undefined {
  if (expr.type === "StringLiteral") {
    return expr.value;
  }
  if (
    expr.type === "TemplateLiteral" &&
    expr.expressions.length === 0 &&
    expr.quasis.length === 1
  ) {
    const cooked = expr.quasis[0]?.value.cooked;
    return typeof cooked === "string" ? cooked : undefined;
  }
  return undefined;
}

function isIntlayerTCall(expr: Expression): expr is CallExpression {
  if (expr.type !== "CallExpression") {
    return false;
  }
  const callee = expr.callee;
  if (callee.type === "Identifier" && callee.name === "t") {
    return true;
  }
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "t" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "intlayer"
  ) {
    return true;
  }
  return false;
}

function readLocaleMap(call: CallExpression): Record<string, string> | null {
  const arg0 = call.arguments[0];
  if (!arg0 || arg0.type !== "ObjectExpression") {
    return null;
  }
  const locales: Record<string, string> = {};
  for (const prop of arg0.properties) {
    if (prop.type !== "ObjectProperty") {
      return null;
    }
    const key = propertyKeyName(prop);
    if (!key) {
      return null;
    }
    const value = unwrapTs(prop.value as Expression);
    const text = readStringLiteral(value);
    if (text === undefined) {
      return null;
    }
    locales[key] = text;
  }
  return Object.keys(locales).length > 0 ? locales : null;
}

/**
 * Map config `sourceLocale` (`en-GB`) onto an Intlayer `t({ en, de, … })` key (`en`).
 */
export function pickIntlayerSourceText(
  locales: Record<string, string>,
  sourceLocale: string
): { key: string; text: string } | undefined {
  const keys = Object.keys(locales);
  const want = normalizeLocale(sourceLocale);
  const exact = keys.find((k) => normalizeLocale(k) === want);
  if (exact) {
    return { key: exact, text: locales[exact]! };
  }
  const lang = sourceLocale.split("-")[0] ?? sourceLocale;
  const langMatch = keys.find((k) => normalizeLocale(k) === normalizeLocale(lang));
  if (langMatch) {
    return { key: langMatch, text: locales[langMatch]! };
  }
  return undefined;
}

export function isIntlayerSourceLocaleKey(intlayerKey: string, sourceLocale: string): boolean {
  const picked = pickIntlayerSourceText({ [intlayerKey]: "x" }, sourceLocale);
  return picked !== undefined && normalizeLocale(picked.key) === normalizeLocale(intlayerKey);
}

/**
 * Map an Intlayer locale key onto a config `targetLocales` entry (BCP-47 form).
 * Returns `null` when the key is the source locale.
 */
export function mapIntlayerLocaleToConfig(
  intlayerKey: string,
  sourceLocale: string,
  targetLocales: string[]
): string | null {
  if (isIntlayerSourceLocaleKey(intlayerKey, sourceLocale)) {
    return null;
  }
  const want = normalizeLocale(intlayerKey);
  const match = targetLocales.find((l) => normalizeLocale(l) === want);
  return match ?? intlayerKey;
}

export function convertIntlayerPlaceholders(text: string, tokens: string[]): string {
  let out = text;
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!\\{)\\{${escaped}\\}(?!\\})`, "g");
    out = out.replace(re, `{{${token}}}`);
  }
  return out;
}

function collectLeaves(
  obj: ObjectExpression,
  prefix: string,
  dictKey: string,
  file: string,
  sourceLocale: string,
  leaves: IntlayerLeaf[],
  unsupported: UnsupportedIntlayerLeaf[]
): void {
  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") {
      unsupported.push({
        dictKey,
        dotPath: prefix || "(spread)",
        file,
        line: prop.loc?.start.line ?? 1,
        reason: "spread-in-content",
      });
      continue;
    }
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const keyName = propertyKeyName(prop);
    const dotPath = keyName ? (prefix ? `${prefix}.${keyName}` : keyName) : prefix;
    const value = unwrapTs(prop.value as Expression);
    const line = prop.loc?.start.line ?? 1;

    if (value.type === "ObjectExpression") {
      collectLeaves(value, dotPath, dictKey, file, sourceLocale, leaves, unsupported);
      continue;
    }

    if (isIntlayerTCall(value)) {
      const locales = readLocaleMap(value);
      if (!locales) {
        unsupported.push({
          dictKey,
          dotPath,
          file,
          line,
          reason: "non-literal-t-call",
        });
        continue;
      }
      const picked = pickIntlayerSourceText(locales, sourceLocale);
      if (!picked) {
        unsupported.push({
          dictKey,
          dotPath,
          file,
          line,
          reason: "missing-source-locale",
        });
        continue;
      }
      const sourceText = picked.text.trim();
      leaves.push({
        dictKey,
        dotPath,
        file,
        line,
        locales,
        sourceText,
        hash: uiStringHash(sourceText),
      });
      continue;
    }

    unsupported.push({
      dictKey,
      dotPath: dotPath || "(unknown)",
      file,
      line,
      reason: "unsupported-leaf",
    });
  }
}

/**
 * Parse one Intlayer `*.content.ts` dictionary into per-leaf locale maps.
 */
export function extractIntlayerContentFile(
  content: string,
  filepath: string,
  sourceLocale: string
): IntlayerDictionaryExtract {
  const empty: IntlayerDictionaryExtract = {
    file: filepath,
    dictKey: "",
    leaves: [],
    unsupported: [],
  };
  let ast: Node;
  try {
    ast = parse(content, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
  } catch (e) {
    return {
      ...empty,
      unsupported: [
        {
          dictKey: "",
          dotPath: "",
          file: filepath,
          line: 1,
          reason: `parse-error: ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
    };
  }

  const root = findDefaultExportObject(ast);
  if (!root) {
    return {
      ...empty,
      unsupported: [
        {
          dictKey: "",
          dotPath: "",
          file: filepath,
          line: 1,
          reason: "no-default-export-object",
        },
      ],
    };
  }

  const keyProp = objectProp(root, "key");
  let dictKey = "";
  if (keyProp) {
    const keyExpr = unwrapTs(keyProp.value as Expression);
    dictKey = readStringLiteral(keyExpr) ?? "";
  }
  if (!dictKey) {
    return {
      ...empty,
      unsupported: [
        {
          dictKey: "",
          dotPath: "",
          file: filepath,
          line: keyProp?.loc?.start.line ?? 1,
          reason: "missing-dict-key",
        },
      ],
    };
  }

  const contentProp = objectProp(root, "content");
  if (!contentProp) {
    return {
      file: filepath,
      dictKey,
      leaves: [],
      unsupported: [
        {
          dictKey,
          dotPath: "",
          file: filepath,
          line: 1,
          reason: "missing-content",
        },
      ],
    };
  }
  const contentExpr = unwrapTs(contentProp.value as Expression);
  if (contentExpr.type !== "ObjectExpression") {
    return {
      file: filepath,
      dictKey,
      leaves: [],
      unsupported: [
        {
          dictKey,
          dotPath: "content",
          file: filepath,
          line: contentProp.loc?.start.line ?? 1,
          reason: "content-not-object",
        },
      ],
    };
  }

  const leaves: IntlayerLeaf[] = [];
  const unsupported: UnsupportedIntlayerLeaf[] = [];
  collectLeaves(contentExpr, "", dictKey, filepath, sourceLocale, leaves, unsupported);
  return { file: filepath, dictKey, leaves, unsupported };
}
