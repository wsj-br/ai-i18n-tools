import { parse } from "@babel/parser";
import type {
  CallExpression,
  Expression,
  Node,
  ObjectExpression,
  ObjectProperty,
} from "@babel/types";

/**
 * One locale string to add (or overwrite) inside a single Intlayer `t({ … })` leaf,
 * addressed by its dictionary dot-path (e.g. `ui.save`, `navigation.helpFor`).
 */
export interface IntlayerLeafLocaleUpdate {
  dotPath: string;
  /** Locale key to write, exactly as it should appear in the `t({ … })` object (e.g. `de`, `pt-BR`). */
  localeKey: string;
  /** Translated text (already placeholder-converted to the dictionary's `{token}` form). */
  text: string;
}

export interface WriteIntlayerContentResult {
  /** Rewritten file content (unchanged when no update applied). */
  output: string;
  /** True when at least one locale key was inserted or replaced. */
  changed: boolean;
  /** Dot-paths that were updated (insert or overwrite), in file order. */
  appliedDotPaths: string[];
  /** Dot-paths requested but not found as a plain `t({ … })` leaf in this file. */
  missingDotPaths: string[];
}

interface LeafCall {
  dotPath: string;
  call: CallExpression;
  object: ObjectExpression;
}

function isAstNode(x: unknown): x is Node {
  return (
    typeof x === "object" &&
    x !== null &&
    "type" in x &&
    typeof (x as { type: unknown }).type === "string"
  );
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

function findDefaultExportObject(ast: Node): ObjectExpression | null {
  let found: ObjectExpression | null = null;
  const stack: Node[] = [ast];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.type === "ExportDefaultDeclaration") {
      const inner = unwrapTs(node.declaration as Expression);
      if (inner.type === "ObjectExpression") {
        found = inner;
      }
    }
    for (const key of Object.keys(node) as (keyof Node)[]) {
      const child = node[key];
      if (child === null || child === undefined) {
        continue;
      }
      if (Array.isArray(child)) {
        for (const c of child) {
          if (isAstNode(c)) {
            stack.push(c);
          }
        }
      } else if (isAstNode(child)) {
        stack.push(child);
      }
    }
  }
  return found;
}

function isIntlayerTCall(expr: Expression): expr is CallExpression {
  if (expr.type !== "CallExpression") {
    return false;
  }
  const callee = expr.callee;
  if (callee.type === "Identifier" && callee.name === "t") {
    return true;
  }
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "t" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "intlayer"
  );
}

function collectLeafCalls(obj: ObjectExpression, prefix: string, out: LeafCall[]): void {
  for (const prop of obj.properties) {
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const keyName = propertyKeyName(prop);
    const dotPath = keyName ? (prefix ? `${prefix}.${keyName}` : keyName) : prefix;
    const value = unwrapTs(prop.value as Expression);
    if (value.type === "ObjectExpression") {
      collectLeafCalls(value, dotPath, out);
      continue;
    }
    if (isIntlayerTCall(value)) {
      const arg0 = value.arguments[0];
      if (arg0 && arg0.type === "ObjectExpression") {
        out.push({ dotPath, call: value, object: arg0 });
      }
    }
  }
}

/**
 * Render a locale value as a double-quoted JS string literal. Matches the quoting
 * `translate-ui` uses for flat JSON and keeps the file valid regardless of the
 * surrounding style (the user can reformat with their own Prettier afterwards).
 */
function quoteLiteral(text: string): string {
  return JSON.stringify(text);
}

/** `"pt-BR"` needs quoting; `de` does not. Matches how Intlayer dictionaries are written. */
function renderLocaleKey(localeKey: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(localeKey) ? localeKey : JSON.stringify(localeKey);
}

interface Edit {
  start: number;
  end: number;
  replacement: string;
}

/**
 * Build the text to insert a new `localeKey: "text"` property inside a `t({ … })` object,
 * reusing the indentation and comma style of the last existing property.
 */
function buildInsertion(source: string, object: ObjectExpression, prop: string): Edit | null {
  const props = object.properties.filter((p): p is ObjectProperty => p.type === "ObjectProperty");
  const last = props[props.length - 1];
  if (last === undefined) {
    return null;
  }
  const objStart = object.start;
  const lastStart = last.start;
  const lastEnd = last.end;
  if (
    objStart === null ||
    objStart === undefined ||
    lastStart === null ||
    lastStart === undefined ||
    lastEnd === null ||
    lastEnd === undefined
  ) {
    return null;
  }

  // Multiline = the object's opening brace and its last property are on different lines.
  const objText = source.slice(objStart, lastEnd);
  const multiline = objText.includes("\n");

  // Indentation = whitespace from the start of the last property's line.
  const lineStart = source.lastIndexOf("\n", lastStart - 1) + 1;
  const indent = source.slice(lineStart, lastStart).match(/^[ \t]*/)?.[0] ?? "";

  // Detect whether a trailing comma already follows the last property.
  const afterLast = source.slice(lastEnd);
  const trailingCommaMatch = afterLast.match(/^\s*,/);

  if (trailingCommaMatch) {
    const insertAt = lastEnd + trailingCommaMatch[0].length;
    const sep = multiline ? `\n${indent}` : " ";
    return { start: insertAt, end: insertAt, replacement: `${sep}${prop},` };
  }
  // No trailing comma: append ",\n<indent>prop" (multiline) or ", prop" (single line).
  const replacement = multiline ? `,\n${indent}${prop}` : `, ${prop}`;
  return { start: lastEnd, end: lastEnd, replacement };
}

/** An `insert("…")` / `intlayer.insert("…")` call expression, if `expr` is one. */
function asInsertCall(expr: Expression): CallExpression | null {
  if (expr.type !== "CallExpression" || expr.arguments.length !== 1) {
    return null;
  }
  const callee = expr.callee;
  const isInsert =
    (callee.type === "Identifier" && callee.name === "insert") ||
    (callee.type === "MemberExpression" &&
      !callee.computed &&
      callee.property.type === "Identifier" &&
      callee.property.name === "insert" &&
      callee.object.type === "Identifier" &&
      callee.object.name === "intlayer");
  return isInsert ? expr : null;
}

/**
 * Callee source text (e.g. `insert`) when any locale value of the leaf is an Intlayer
 * `insert("…")` node, so new locale values can be wrapped the same way.
 */
function leafInsertCallee(source: string, object: ObjectExpression): string | null {
  for (const prop of object.properties) {
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const call = asInsertCall(unwrapTs(prop.value as Expression));
    const start = call?.callee.start;
    const end = call?.callee.end;
    if (call && typeof start === "number" && typeof end === "number") {
      return source.slice(start, end);
    }
  }
  return null;
}

function wrapIfInsertion(source: string, object: ObjectExpression, literal: string): string {
  const callee = leafInsertCallee(source, object);
  return callee ? `${callee}(${literal})` : literal;
}

/** Replace an existing property's value (keeping its key) with a new literal. */
function buildOverwrite(prop: ObjectProperty, literal: string): Edit | null {
  const insertCall = asInsertCall(unwrapTs(prop.value as Expression));
  const arg = insertCall?.arguments[0];
  const value =
    arg && arg.type !== "SpreadElement" && arg.type !== "ArgumentPlaceholder" ? arg : prop.value;
  const start = value.start;
  const end = value.end;
  if (start === null || start === undefined || end === null || end === undefined) {
    return null;
  }
  return { start, end, replacement: literal };
}

/**
 * Insert or overwrite per-locale leaves inside the `t({ … })` calls of an Intlayer
 * `*.content.ts` file, preserving all surrounding formatting via source-offset splicing.
 */
export function writeIntlayerContentFile(
  source: string,
  updates: IntlayerLeafLocaleUpdate[]
): WriteIntlayerContentResult {
  const empty: WriteIntlayerContentResult = {
    output: source,
    changed: false,
    appliedDotPaths: [],
    missingDotPaths: updates.map((u) => u.dotPath),
  };
  if (updates.length === 0) {
    return { ...empty, missingDotPaths: [] };
  }

  let ast: Node;
  try {
    ast = parse(source, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
  } catch {
    return empty;
  }

  const root = findDefaultExportObject(ast);
  if (!root) {
    return empty;
  }

  const contentProp = objectProp(root, "content");
  if (!contentProp) {
    return empty;
  }
  const contentExpr = unwrapTs(contentProp.value as Expression);
  if (contentExpr.type !== "ObjectExpression") {
    return empty;
  }

  const leaves: LeafCall[] = [];
  collectLeafCalls(contentExpr, "", leaves);
  const leafByPath = new Map<string, LeafCall>();
  for (const leaf of leaves) {
    if (!leafByPath.has(leaf.dotPath)) {
      leafByPath.set(leaf.dotPath, leaf);
    }
  }

  const edits: Edit[] = [];
  const applied = new Set<string>();
  const missing: string[] = [];

  for (const update of updates) {
    const leaf = leafByPath.get(update.dotPath);
    if (!leaf) {
      missing.push(update.dotPath);
      continue;
    }
    const literal = quoteLiteral(update.text);
    const existing = objectProp(leaf.object, update.localeKey);
    if (existing) {
      const wrapped = asInsertCall(unwrapTs(existing.value as Expression))
        ? literal
        : wrapIfInsertion(source, leaf.object, literal);
      const edit = buildOverwrite(existing, wrapped);
      if (edit) {
        edits.push(edit);
        applied.add(update.dotPath);
      }
      continue;
    }
    const prop = `${renderLocaleKey(update.localeKey)}: ${wrapIfInsertion(source, leaf.object, literal)}`;
    const edit = buildInsertion(source, leaf.object, prop);
    if (edit) {
      edits.push(edit);
      applied.add(update.dotPath);
    }
  }

  if (edits.length === 0) {
    return { output: source, changed: false, appliedDotPaths: [], missingDotPaths: missing };
  }

  // Apply edits from the end of the file backwards so earlier offsets stay valid.
  edits.sort((a, b) => b.start - a.start);
  let output = source;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
  }

  return {
    output,
    changed: true,
    appliedDotPaths: [...applied],
    missingDotPaths: missing,
  };
}
