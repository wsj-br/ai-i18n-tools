import { parse } from "@babel/parser";
import type { CallExpression, Expression, Node, ObjectExpression } from "@babel/types";

export interface UiExtractedCall {
  literal: string;
  line: number;
  file: string;
  plurals?: boolean;
  zeroDigit?: boolean;
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

/** Match configured func names like `t` or `i18n.t`. */
export function calleeMatchesTranslatedFunc(callee: Expression, funcNames: string[]): boolean {
  for (const fn of funcNames) {
    const chain = fn.split(".");
    if (chain.length === 1) {
      if (callee.type === "Identifier" && callee.name === chain[0]) {
        return true;
      }
      continue;
    }
    let node: Expression = callee;
    let matched = true;
    for (let idx = chain.length - 1; idx >= 0; idx--) {
      const name = chain[idx]!;
      if (idx === 0) {
        matched = node.type === "Identifier" && node.name === name;
        break;
      }
      if (node.type !== "MemberExpression") {
        matched = false;
        break;
      }
      if (node.property.type !== "Identifier" || node.property.name !== name || node.computed) {
        matched = false;
        break;
      }
      node = node.object as Expression;
    }
    if (matched) {
      return true;
    }
  }
  return false;
}

function readBoolPropsFromObject(obj: ObjectExpression): {
  plurals?: boolean;
  zeroDigit?: boolean;
} {
  let plurals: boolean | undefined;
  let zeroDigit: boolean | undefined;
  for (const prop of obj.properties) {
    if (prop.type === "SpreadElement") {
      continue;
    }
    if (prop.type !== "ObjectProperty") {
      continue;
    }
    const op = prop;
    const key = op.key;
    let propName: string | undefined;
    if (key.type === "Identifier") {
      propName = key.name;
    } else if (key.type === "StringLiteral") {
      propName = key.value;
    }
    if (propName !== "plurals" && propName !== "zeroDigit") {
      continue;
    }
    const val = op.value;
    if (val.type === "BooleanLiteral") {
      if (propName === "plurals") {
        plurals = val.value;
      }
      if (propName === "zeroDigit") {
        zeroDigit = val.value;
      }
    }
  }
  return { plurals, zeroDigit };
}

function extractOptionsFromCallArgs(args: CallExpression["arguments"]): {
  plurals?: boolean;
  zeroDigit?: boolean;
} {
  if (args.length < 2) {
    return {};
  }
  const second = args[1];
  if (!second) {
    return {};
  }
  if (second.type === "SpreadElement") {
    return {};
  }
  if (second.type !== "ObjectExpression") {
    return {};
  }
  return readBoolPropsFromObject(second);
}

function firstArgStringLiteral(call: CallExpression): string | undefined {
  const arg0 = call.arguments[0];
  if (!arg0 || arg0.type === "SpreadElement") {
    return undefined;
  }
  if (arg0.type !== "StringLiteral") {
    return undefined;
  }
  return arg0.value;
}

/**
 * Collect `t('literal', { plurals })` calls from one source file via Babel AST.
 */
export function extractUiCallsFromSource(
  content: string,
  relPath: string,
  funcNames: string[]
): UiExtractedCall[] {
  let ast;
  try {
    ast = parse(content, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    });
  } catch {
    return [];
  }

  const out: UiExtractedCall[] = [];

  walkAst(ast as unknown as Node, (node) => {
    if (node.type !== "CallExpression") {
      return;
    }
    const call = node as CallExpression;
    if (!calleeMatchesTranslatedFunc(call.callee as Expression, funcNames)) {
      return;
    }
    const literal = firstArgStringLiteral(call);
    if (literal === undefined) {
      return;
    }
    const opts = extractOptionsFromCallArgs(call.arguments);
    const line = call.loc?.start.line ?? 1;
    out.push({
      literal,
      line,
      file: relPath,
      ...(opts.plurals === true ? { plurals: true } : {}),
      ...(opts.zeroDigit === true ? { zeroDigit: true } : {}),
    });
  });

  return out;
}

/** Placeholder names inside `{{ ... }}` (trimmed). */
export function extractInterpolationNames(message: string): string[] {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(message)) !== null) {
    const inner = m[1]?.trim() ?? "";
    if (inner) {
      names.push(inner);
    }
  }
  return names;
}

export function pluralMultiPlaceholderMissingCount(message: string): boolean {
  const names = extractInterpolationNames(message);
  const distinct = [...new Set(names)];
  if (distinct.length < 2) {
    return false;
  }
  return !distinct.includes("count");
}
