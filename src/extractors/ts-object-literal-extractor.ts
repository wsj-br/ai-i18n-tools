import { parse } from "@babel/parser";
import type {
  ExportDefaultDeclaration,
  Node,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
} from "@babel/types";
import { computeSegmentHash } from "../utils/hash.js";
import type { Segment } from "../core/types.js";

export type TsObjectLiteralPolicy = "meta" | "dictionary";

export interface TsLiteralSpan {
  start: number;
  end: number;
  value: string;
  path: string;
}

export interface TsObjectLiteralExtractResult {
  segments: Segment[];
  spans: TsLiteralSpan[];
}

const DEFAULT_META_TRANSLATABLE_KEYS = new Set(["title", "display", "breadcrumb"]);
const META_SKIP_VALUE_KEYS = new Set(["type", "href", "theme"]);

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

function shouldExtractMetaString(
  keyName: string | null,
  parentKey: string | null,
  value: string,
  translatableKeys: Set<string>
): boolean {
  if (!value.trim()) {
    return false;
  }
  if (looksLikeUrl(value)) {
    return false;
  }
  if (keyName && META_SKIP_VALUE_KEYS.has(keyName)) {
    return false;
  }
  if (keyName && translatableKeys.has(keyName)) {
    return true;
  }
  if (parentKey === null && keyName !== null) {
    return true;
  }
  return false;
}

function shouldExtractDictionaryString(value: string): boolean {
  return value.trim().length > 0 && !looksLikeUrl(value);
}

function collectFromObject(
  obj: ObjectExpression,
  prefix: string,
  policy: TsObjectLiteralPolicy,
  translatableKeys: Set<string>,
  spans: TsLiteralSpan[],
  segments: Segment[],
  segmentIndex: { n: number }
): void {
  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") {
      continue;
    }
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const keyName = propertyKeyName(prop);
    const dotPath = keyName ? (prefix ? `${prefix}.${keyName}` : keyName) : prefix;

    if (prop.value.type === "ObjectExpression") {
      collectFromObject(
        prop.value,
        dotPath,
        policy,
        translatableKeys,
        spans,
        segments,
        segmentIndex
      );
      continue;
    }

    if (!isStringLiteralValue(prop.value)) {
      continue;
    }

    const literal = prop.value;
    const value = literal.value;
    const start = literal.start;
    const end = literal.end;
    if (start == null || end == null) {
      continue;
    }

    const extract =
      policy === "dictionary"
        ? shouldExtractDictionaryString(value)
        : shouldExtractMetaString(
            keyName,
            prefix ? (prefix.split(".").pop() ?? null) : null,
            value,
            translatableKeys
          );

    if (!extract) {
      continue;
    }

    const path = dotPath || keyName || "value";
    spans.push({ start, end, value, path });
    const hash = computeSegmentHash(value);
    segments.push({
      id: `ts-obj-${segmentIndex.n++}`,
      type: "json",
      content: value,
      hash,
      translatable: true,
      startLine: literal.loc?.start.line ?? 1,
      jsonKey: path,
    });
  }
}

function findDefaultExportObject(ast: Node): ObjectExpression | null {
  let found: ObjectExpression | null = null;
  walkAst(ast, (node) => {
    if (node.type !== "ExportDefaultDeclaration") {
      return;
    }
    const decl = node as ExportDefaultDeclaration;
    if (decl.declaration.type === "ObjectExpression") {
      found = decl.declaration;
    }
  });
  return found;
}

export function extractTsObjectLiteralStrings(
  content: string,
  filepath: string,
  policy: TsObjectLiteralPolicy,
  options?: { metaTranslatableKeys?: string[] }
): TsObjectLiteralExtractResult {
  const translatableKeys = new Set(
    options?.metaTranslatableKeys ?? [...DEFAULT_META_TRANSLATABLE_KEYS]
  );
  let ast: Node;
  try {
    ast = parse(content, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
  } catch (e) {
    throw new Error(
      `Failed to parse TypeScript module ${filepath}: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const root = findDefaultExportObject(ast);
  const spans: TsLiteralSpan[] = [];
  const segments: Segment[] = [];
  const segmentIndex = { n: 0 };

  if (root) {
    collectFromObject(root, "", policy, translatableKeys, spans, segments, segmentIndex);
  }

  return { segments, spans };
}

export function applyTsLiteralTranslations(
  source: string,
  spans: TsLiteralSpan[],
  translations: Map<string, string>
): string {
  const sorted = [...spans].sort((a, b) => b.start - a.start);
  let out = source;
  for (const span of sorted) {
    const hash = computeSegmentHash(span.value);
    const translated = translations.get(hash);
    if (translated === undefined) {
      continue;
    }
    const quote = source[span.start];
    const usesDouble = quote === '"';
    const escaped = usesDouble
      ? translated.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      : translated.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const wrapped = usesDouble ? `"${escaped}"` : `'${escaped}'`;
    out = out.slice(0, span.start) + wrapped + out.slice(span.end);
  }
  return out;
}
