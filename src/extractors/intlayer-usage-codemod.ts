import { parse } from "@babel/parser";
import type {
  CallExpression,
  Expression,
  Identifier,
  ImportDeclaration,
  Node,
  VariableDeclarator,
} from "@babel/types";
import { convertIntlayerPlaceholders, type IntlayerLeaf } from "./intlayer-content-extractor.js";

export const DEFAULT_INTLAYER_HOOK_NAMES = ["useIntlayer", "getIntlayer"] as const;

export type ManualReviewReason =
  | "dynamic-member"
  | "spread"
  | "passed-as-value"
  | "chained-transform"
  | "destructuring"
  | "unresolved-path"
  | "no-value";

export interface IntlayerBinding {
  name: string;
  dictKey: string;
  hookName: string;
  /** Start/end of the VariableDeclarator (for removal). */
  start: number;
  end: number;
  /** Start/end of the enclosing VariableDeclaration when it has a single declarator. */
  declarationStart: number;
  declarationEnd: number;
  declaratorCount: number;
}

export interface SafeRewrite {
  file: string;
  line: number;
  start: number;
  end: number;
  dictKey: string;
  dotPath: string;
  kind: "simple" | "replace";
  sourceText: string;
  /** Replacement source text (`t('…')` or `t('…', { token: expr })`). */
  replacement: string;
  token?: string;
  snippet: string;
}

export interface ManualReviewSuggestion {
  /** Dictionary dot path this call replaces, when it maps to one leaf. */
  dotPath?: string;
  /** Short label for a sibling leaf (`ok`, `warn`). */
  label?: string;
  /** English source to pass to `t()`, after `{token}` → `{{token}}` when needed. */
  sourceText: string;
  /** Concrete call or JSX to write. */
  replacement: string;
  /** Interpolation arguments already rendered into `replacement`. */
  vars?: ReadonlyArray<{ token: string; expr: string }>;
}

export interface SpreadPropRead {
  /** Prop name the child reads (`ok`). */
  prop: string;
  /** Access after that prop (`value` for `props.ok.value`). Empty when the prop is used whole. */
  access: string;
}

export interface ManualReviewSite {
  file: string;
  line: number;
  dictKey: string;
  dotPath?: string;
  reason: ManualReviewReason;
  /** Exact expression text. Whitespace and line breaks are preserved. */
  snippet: string;
  sourceText?: string;
  /** Module specifier auto-rewrites in this file import `t` from. */
  tImportSpecifier?: string;
  suggestions: ManualReviewSuggestion[];
  /** JSX element that receives a dictionary spread (`StatusBadge`). */
  jsxElement?: string;
  /** Props that element reads off the spread object. */
  spreadProps?: SpreadPropRead[];
  /** Computed key: each sibling literal must be a direct `t('…')` argument. */
  requiresDirectLiteral?: boolean;
  /** One concrete expression to write when the site is not a list of sibling calls. */
  writeAs?: string;
}

export interface IntlayerLeftover {
  file: string;
  line: number;
  kind: "hook-import" | "provider";
  /** `useIntlayer`, `getIntlayer`, or `IntlayerProvider`. */
  name: string;
}

export interface CodemodFileResult {
  file: string;
  original: string;
  output: string;
  changed: boolean;
  rewrites: SafeRewrite[];
  reviews: ManualReviewSite[];
  removedBindings: string[];
  addedTImport: boolean;
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

function buildParentMap(root: Node): Map<Node, Node> {
  const parents = new Map<Node, Node>();
  walkAst(root, (n) => {
    for (const key of Object.keys(n) as (keyof Node)[]) {
      const child = n[key];
      if (isAstNode(child)) {
        parents.set(child, n);
      } else if (Array.isArray(child)) {
        for (const c of child) {
          if (isAstNode(c)) {
            parents.set(c, n);
          }
        }
      }
    }
  });
  return parents;
}

function snippetAround(source: string, start: number, end: number): string {
  const slice = source.slice(Math.max(0, start), Math.min(source.length, end));
  return slice.replace(/\s+/g, " ").trim().slice(0, 200);
}

function jsStringLiteral(s: string): string {
  if (!s.includes("'")) {
    return `'${s.replace(/\\/g, "\\\\")}'`;
  }
  if (!s.includes('"')) {
    return `"${s.replace(/\\/g, "\\\\")}"`;
  }
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function objectKeyLiteral(token: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(token) ? token : jsStringLiteral(token);
}

export function formatTCall(
  sourceText: string,
  vars?: { token: string; expr: string } | ReadonlyArray<{ token: string; expr: string }>
): string {
  const lit = jsStringLiteral(sourceText);
  const list = !vars ? [] : Array.isArray(vars) ? vars : [vars];
  if (list.length === 0) {
    return `t(${lit})`;
  }
  const fields = list.map((v) => `${objectKeyLiteral(v.token)}: ${v.expr}`).join(", ");
  return `t(${lit}, { ${fields} })`;
}

function exactSnippet(source: string, start: number, end: number): string {
  return source.slice(start, end);
}

interface ReplaceStep {
  token: string;
  expr: string;
}

function readReplaceStep(call: CallExpression, source: string): ReplaceStep | undefined {
  if (call.callee.type !== "MemberExpression" || call.callee.computed) {
    return undefined;
  }
  if (call.callee.property.type !== "Identifier" || call.callee.property.name !== "replace") {
    return undefined;
  }
  const arg0 = call.arguments[0];
  const arg1 = call.arguments[1];
  if (!arg0 || arg0.type !== "StringLiteral" || !arg1 || arg1.type === "SpreadElement") {
    return undefined;
  }
  if (arg1.start == null || arg1.end == null) {
    return undefined;
  }
  const token = arg0.value.replace(/^\{|\}$/g, "");
  if (!token) {
    return undefined;
  }
  return { token, expr: source.slice(arg1.start, arg1.end) };
}

/** Walk a call outward through `.replace()` / other chained calls and collect replace arguments. */
function expressionChain(
  start: Node,
  parents: Map<Node, Node>,
  source: string
): { start: number; end: number; steps: ReplaceStep[] } {
  let current = start;
  const steps: ReplaceStep[] = [];
  if (current.type === "CallExpression") {
    const step = readReplaceStep(current, source);
    if (step) {
      steps.push(step);
    }
  }
  while (current.start != null && current.end != null) {
    const parent = parents.get(current);
    if (!parent || parent.start == null || parent.end == null) {
      break;
    }
    if (parent.type === "MemberExpression" && parent.object === current) {
      current = parent;
      continue;
    }
    if (parent.type === "CallExpression" && parent.callee === current) {
      const step = readReplaceStep(parent, source);
      if (step) {
        steps.push(step);
      }
      current = parent;
      continue;
    }
    break;
  }
  return {
    start: start.start ?? 0,
    end: current.end ?? start.end ?? 0,
    steps,
  };
}

function nodeKeyName(key: Node | null | undefined): string | undefined {
  if (!key) {
    return undefined;
  }
  if (key.type === "Identifier") {
    return key.name;
  }
  if (key.type === "StringLiteral") {
    return key.value;
  }
  return undefined;
}

function siblingLeaves(leaves: IntlayerLeaf[], dictKey: string, prefix: string[]): IntlayerLeaf[] {
  const head = prefix.join(".");
  return leaves.filter((leaf) => {
    if (leaf.dictKey !== dictKey) {
      return false;
    }
    const rest = head
      ? leaf.dotPath.startsWith(`${head}.`)
        ? leaf.dotPath.slice(head.length + 1)
        : undefined
      : leaf.dotPath;
    return rest !== undefined && rest.length > 0 && !rest.includes(".");
  });
}

function suggestionForLeaf(leaf: IntlayerLeaf): ManualReviewSuggestion {
  const label = leaf.dotPath.split(".").pop() ?? leaf.dotPath;
  return {
    dotPath: leaf.dotPath,
    label,
    sourceText: leaf.sourceText,
    replacement: formatTCall(leaf.sourceText),
  };
}

function jsxOpeningName(opening: Node): string | undefined {
  if (opening.type !== "JSXOpeningElement") {
    return undefined;
  }
  const name = opening.name;
  if (name.type === "JSXIdentifier") {
    return name.name;
  }
  if (name.type === "JSXMemberExpression" && name.property.type === "JSXIdentifier") {
    return name.property.name;
  }
  return undefined;
}

function staticMemberPath(ident: Identifier, parents: Map<Node, Node>): string[] | undefined {
  const walked = walkMemberChain(ident, parents);
  if (!walked || walked.path.some((segment) => segment.kind === "computed")) {
    return undefined;
  }
  return walked.path.flatMap((segment) => (segment.kind === "static" ? [segment.name] : []));
}

function memberPathsOf(body: Node, local: string, parents: Map<Node, Node>): string[][] {
  const paths: string[][] = [];
  walkAst(body, (node) => {
    if (node.type !== "Identifier" || node.name !== local) {
      return;
    }
    if (!isBindingIdentifier(node, local, parents)) {
      return;
    }
    const memberPath = staticMemberPath(node, parents);
    if (memberPath) {
      paths.push(memberPath);
    }
  });
  return paths;
}

function propReadsFromTypeLiteral(typeNode: Node): SpreadPropRead[] {
  if (typeNode.type !== "TSTypeLiteral") {
    return [];
  }
  const reads: SpreadPropRead[] = [];
  for (const member of typeNode.members) {
    if (member.type !== "TSPropertySignature") {
      continue;
    }
    const prop = nodeKeyName(member.key);
    const annotation = member.typeAnnotation;
    if (!prop || !annotation || annotation.type !== "TSTypeAnnotation") {
      continue;
    }
    const inner = annotation.typeAnnotation;
    if (inner.type !== "TSTypeLiteral") {
      continue;
    }
    const hasValue = inner.members.some(
      (innerMember) =>
        innerMember.type === "TSPropertySignature" && nodeKeyName(innerMember.key) === "value"
    );
    if (hasValue) {
      reads.push({ prop, access: "value" });
    }
  }
  return reads;
}

function componentPropReads(
  ast: Node,
  componentName: string,
  parents: Map<Node, Node>
): SpreadPropRead[] {
  let params: Node[] | undefined;
  let body: Node | undefined;
  walkAst(ast, (node) => {
    if (body) {
      return;
    }
    if (
      node.type === "FunctionDeclaration" &&
      node.id?.type === "Identifier" &&
      node.id.name === componentName
    ) {
      params = node.params;
      body = node.body;
      return;
    }
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "Identifier" &&
      node.id.name === componentName &&
      node.init &&
      (node.init.type === "FunctionExpression" || node.init.type === "ArrowFunctionExpression")
    ) {
      params = node.init.params;
      body = node.init.body;
    }
  });
  if (!params || !body || params.length === 0) {
    return [];
  }
  const param = params[0]!;
  const seen = new Set<string>();
  const reads: SpreadPropRead[] = [];
  const push = (prop: string, access: string): void => {
    const key = `${prop}:${access}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    reads.push({ prop, access });
  };

  if (param.type === "ObjectPattern") {
    for (const property of param.properties) {
      if (property.type !== "ObjectProperty" || property.computed) {
        continue;
      }
      const prop = nodeKeyName(property.key);
      const local = property.value.type === "Identifier" ? property.value.name : prop;
      if (!prop || !local) {
        continue;
      }
      const paths = memberPathsOf(body, local, parents);
      if (paths.length === 0) {
        push(prop, "");
        continue;
      }
      for (const memberPath of paths) {
        push(prop, memberPath.join("."));
      }
    }
    return reads;
  }

  const propsName =
    param.type === "Identifier"
      ? param.name
      : param.type === "AssignmentPattern" && param.left.type === "Identifier"
        ? param.left.name
        : undefined;
  if (propsName) {
    for (const memberPath of memberPathsOf(body, propsName, parents)) {
      if (memberPath.length === 0) {
        continue;
      }
      const prop = memberPath[0]!;
      push(prop, memberPath.slice(1).join("."));
    }
  }
  if (reads.length > 0) {
    return reads;
  }
  if (param.type === "Identifier") {
    const annotation = param.typeAnnotation;
    if (annotation?.type === "TSTypeAnnotation") {
      return propReadsFromTypeLiteral(annotation.typeAnnotation);
    }
  }
  return reads;
}

/**
 * After a safe rewrite converts `{token}` → `{{token}}` on a leaf, keep manual
 * suggestions that still quoted the old source on the seeded catalog key.
 */
export function refreshReviewAfterLeafConversion(
  review: ManualReviewSite,
  dotPath: string,
  previousSource: string,
  nextSource: string
): void {
  let changed = false;
  for (const suggestion of review.suggestions) {
    if (suggestion.dotPath !== dotPath || suggestion.sourceText !== previousSource) {
      continue;
    }
    suggestion.sourceText = nextSource;
    suggestion.replacement = formatTCall(nextSource, suggestion.vars);
    changed = true;
  }
  if (!changed) {
    return;
  }
  if (review.suggestions.length === 1 && review.writeAs && !review.jsxElement) {
    review.writeAs = review.suggestions[0]?.replacement;
    return;
  }
  if (!review.jsxElement || !review.writeAs) {
    return;
  }
  review.writeAs = formatSpreadJsx(
    review.jsxElement,
    review.suggestions.map((suggestion) => ({
      prop: suggestion.label ?? suggestion.dotPath ?? "value",
      replacement: suggestion.replacement,
    })),
    review.writeAs.trimEnd().endsWith("/>")
  );
}

function formatSpreadJsx(
  element: string,
  pairs: ReadonlyArray<{ prop: string; replacement: string }>,
  selfClosing: boolean
): string {
  const attrs = pairs.map((pair) => `${pair.prop}={${pair.replacement}}`).join(" ");
  if (selfClosing) {
    return `<${element} ${attrs} />`;
  }
  return `<${element} ${attrs}>`;
}

function calleeName(callee: Expression): string | null {
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

function readFirstStringArg(call: CallExpression): string | undefined {
  const arg0 = call.arguments[0];
  if (!arg0 || arg0.type === "SpreadElement") {
    return undefined;
  }
  if (arg0.type === "StringLiteral") {
    return arg0.value;
  }
  if (
    arg0.type === "TemplateLiteral" &&
    arg0.expressions.length === 0 &&
    arg0.quasis.length === 1
  ) {
    const cooked = arg0.quasis[0]?.value.cooked;
    return typeof cooked === "string" ? cooked : undefined;
  }
  return undefined;
}

function isBindingIdentifier(
  node: Node,
  name: string,
  parents: Map<Node, Node>
): node is Identifier {
  if (node.type !== "Identifier" || node.name !== name) {
    return false;
  }
  const parent = parents.get(node);
  if (!parent) {
    return false;
  }
  if (parent.type === "VariableDeclarator" && parent.id === node) {
    return false;
  }
  if (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier") {
    return false;
  }
  if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) {
    return false;
  }
  if (parent.type === "ObjectProperty" && parent.key === node && !parent.computed) {
    return false;
  }
  if (parent.type === "LabeledStatement" && parent.label === node) {
    return false;
  }
  return true;
}

type PathSegment = { kind: "static"; name: string } | { kind: "computed" };

interface MemberWalk {
  node: Node;
  path: PathSegment[];
  start: number;
  end: number;
}

function walkMemberChain(ident: Identifier, parents: Map<Node, Node>): MemberWalk | null {
  if (ident.start == null || ident.end == null) {
    return null;
  }
  let node: Node = ident;
  const path: PathSegment[] = [];
  let start = ident.start;
  let end = ident.end;
  for (;;) {
    const parent = parents.get(node);
    if (!parent) {
      break;
    }
    if (parent.type === "MemberExpression" && parent.object === node) {
      if (parent.computed) {
        path.push({ kind: "computed" });
      } else if (parent.property.type === "Identifier") {
        path.push({ kind: "static", name: parent.property.name });
      } else {
        path.push({ kind: "computed" });
      }
      if (parent.start != null) {
        start = parent.start;
      }
      if (parent.end != null) {
        end = parent.end;
      }
      node = parent;
      continue;
    }
    break;
  }
  return { node, path, start, end };
}

function staticDotPath(path: PathSegment[]): string | undefined {
  if (path.some((p) => p.kind === "computed")) {
    return undefined;
  }
  return path
    .filter((p): p is { kind: "static"; name: string } => p.kind === "static")
    .map((p) => p.name)
    .join(".");
}

function leafFor(
  leaves: IntlayerLeaf[],
  dictKey: string,
  dotPath: string
): IntlayerLeaf | undefined {
  return leaves.find((l) => l.dictKey === dictKey && l.dotPath === dotPath);
}

function findBindings(ast: Node, hookNames: string[]): IntlayerBinding[] {
  const bindings: IntlayerBinding[] = [];
  walkAst(ast, (node) => {
    if (node.type !== "VariableDeclarator") {
      return;
    }
    const decl = node as VariableDeclarator;
    if (decl.id.type !== "Identifier") {
      return;
    }
    if (!decl.init || decl.init.type !== "CallExpression") {
      return;
    }
    const hook = calleeName(decl.init.callee as Expression);
    if (!hook || !hookNames.includes(hook)) {
      return;
    }
    const dictKey = readFirstStringArg(decl.init);
    if (!dictKey || decl.start == null || decl.end == null) {
      return;
    }
    bindings.push({
      name: decl.id.name,
      dictKey,
      hookName: hook,
      start: decl.start,
      end: decl.end,
      declarationStart: decl.start,
      declarationEnd: decl.end,
      declaratorCount: 1,
    });
  });
  return bindings;
}

function attachDeclarationSpans(bindings: IntlayerBinding[], ast: Node): void {
  walkAst(ast, (node) => {
    if (node.type !== "VariableDeclaration" || node.start == null || node.end == null) {
      return;
    }
    for (const d of node.declarations) {
      const b = bindings.find((x) => x.start === d.start && x.end === d.end);
      if (b) {
        b.declarationStart = node.start;
        b.declarationEnd = node.end;
        b.declaratorCount = node.declarations.length;
      }
    }
  });
}

function tAlreadyInScope(ast: Node): boolean {
  let found = false;
  walkAst(ast, (node) => {
    if (found) {
      return;
    }
    if (node.type === "ImportSpecifier" && node.imported.type === "Identifier") {
      if (node.imported.name === "t" || node.local.name === "t") {
        found = true;
      }
    }
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "Identifier" &&
      node.id.name === "t"
    ) {
      found = true;
    }
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "ObjectPattern" &&
      node.id.properties.some(
        (p) =>
          p.type === "ObjectProperty" &&
          ((p.key.type === "Identifier" && p.key.name === "t") ||
            (p.value.type === "Identifier" && p.value.name === "t"))
      )
    ) {
      found = true;
    }
  });
  return found;
}

function insertTImport(source: string, ast: Node, specifier: string): string {
  let lastImportEnd = 0;
  walkAst(ast, (node) => {
    if (node.type === "ImportDeclaration" && node.end != null && node.end > lastImportEnd) {
      lastImportEnd = node.end;
    }
  });
  const line = `import { t } from ${jsStringLiteral(specifier)};\n`;
  if (lastImportEnd <= 0) {
    return line + source;
  }
  const before = source.slice(0, lastImportEnd);
  const after = source.slice(lastImportEnd);
  const nl = after.startsWith("\n") ? "" : "\n";
  return `${before}${nl}${line}${after.startsWith("\n") ? after.slice(1) : after}`;
}

function identifierStillUsed(
  ast: Node,
  name: string,
  parents: Map<Node, Node>,
  skipStart: number,
  skipEnd: number
): boolean {
  let used = false;
  walkAst(ast, (node) => {
    if (used) {
      return;
    }
    if (node.start != null && node.end != null && node.start >= skipStart && node.end <= skipEnd) {
      return;
    }
    if (isBindingIdentifier(node, name, parents)) {
      used = true;
    }
  });
  return used;
}

function hookStillUsed(ast: Node, hookName: string, parents: Map<Node, Node>): boolean {
  let used = false;
  walkAst(ast, (node) => {
    if (used) {
      return;
    }
    if (node.type !== "Identifier" || node.name !== hookName) {
      return;
    }
    const parent = parents.get(node);
    if (parent?.type === "ImportSpecifier") {
      return;
    }
    if (parent?.type === "MemberExpression" && parent.property === node && !parent.computed) {
      return;
    }
    used = true;
  });
  return used;
}

function removeImportSpecifiers(source: string, ast: Node, unusedHooks: Set<string>): string {
  const edits: { start: number; end: number; text: string }[] = [];
  walkAst(ast, (node) => {
    if (node.type !== "ImportDeclaration" || node.start == null || node.end == null) {
      return;
    }
    const decl = node as ImportDeclaration;
    const declStart = node.start;
    const declEnd = node.end;
    const keep = decl.specifiers.filter((s) => {
      if (s.type !== "ImportSpecifier") {
        return true;
      }
      const imported = s.imported.type === "Identifier" ? s.imported.name : s.imported.value;
      return !unusedHooks.has(imported) && !unusedHooks.has(s.local.name);
    });
    if (keep.length === decl.specifiers.length) {
      return;
    }
    if (keep.length === 0) {
      let end = declEnd;
      if (source[end] === "\n") {
        end += 1;
      }
      edits.push({ start: declStart, end, text: "" });
      return;
    }
    const named = keep
      .filter((s): s is typeof s & { type: "ImportSpecifier" } => s.type === "ImportSpecifier")
      .map((s) => {
        const imported = s.imported.type === "Identifier" ? s.imported.name : s.imported.value;
        return imported === s.local.name ? imported : `${imported} as ${s.local.name}`;
      });
    const defaultSpec = keep.find((s) => s.type === "ImportDefaultSpecifier");
    const ns = keep.find((s) => s.type === "ImportNamespaceSpecifier");
    const parts: string[] = [];
    if (defaultSpec && defaultSpec.type === "ImportDefaultSpecifier") {
      parts.push(defaultSpec.local.name);
    }
    if (ns && ns.type === "ImportNamespaceSpecifier") {
      parts.push(`* as ${ns.local.name}`);
    }
    if (named.length > 0) {
      parts.push(`{ ${named.join(", ")} }`);
    }
    edits.push({
      start: declStart,
      end: declEnd,
      text: `import ${parts.join(", ")} from ${jsStringLiteral(decl.source.value)};`,
    });
  });
  return applyEdits(source, edits);
}

function applyEdits(source: string, edits: { start: number; end: number; text: string }[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let out = source;
  for (const e of sorted) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return out;
}

export interface CodemodOptions {
  file: string;
  source: string;
  leaves: IntlayerLeaf[];
  hookNames?: string[];
  tImportSpecifier?: string;
}

/**
 * Analyze and rewrite one source file. Returns the new source in `output` (never writes disk).
 */
export function codemodIntlayerUsages(opts: CodemodOptions): CodemodFileResult {
  const hookNames = opts.hookNames ?? [...DEFAULT_INTLAYER_HOOK_NAMES];
  const empty: CodemodFileResult = {
    file: opts.file,
    original: opts.source,
    output: opts.source,
    changed: false,
    rewrites: [],
    reviews: [],
    removedBindings: [],
    addedTImport: false,
  };

  let ast: Node;
  try {
    ast = parse(opts.source, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
  } catch {
    return empty;
  }

  const parents = buildParentMap(ast);
  const bindings = findBindings(ast, hookNames);
  attachDeclarationSpans(bindings, ast);
  if (bindings.length === 0) {
    return empty;
  }

  const rewrites: SafeRewrite[] = [];
  const reviews: ManualReviewSite[] = [];

  const pushReview = (
    site: Omit<ManualReviewSite, "suggestions" | "tImportSpecifier"> & {
      suggestions?: ManualReviewSuggestion[];
    }
  ): void => {
    reviews.push({
      ...site,
      suggestions: site.suggestions ?? [],
      tImportSpecifier: opts.tImportSpecifier,
    });
  };

  const classify = (binding: IntlayerBinding, ident: Identifier): void => {
    if (ident.start == null || ident.end == null) {
      return;
    }
    const parent = parents.get(ident);
    if (!parent) {
      return;
    }
    const line = ident.loc?.start.line ?? 1;

    if (parent.type === "SpreadElement" || parent.type === "JSXSpreadAttribute") {
      let snippetStart = parent.start ?? ident.start;
      let snippetEnd = parent.end ?? ident.end;
      let jsxElement: string | undefined;
      let selfClosing = true;
      if (parent.type === "JSXSpreadAttribute") {
        const opening = parents.get(parent);
        if (opening?.type === "JSXOpeningElement") {
          jsxElement = jsxOpeningName(opening);
          selfClosing = opening.selfClosing === true;
          const element = parents.get(opening);
          if (element?.type === "JSXElement" && element.start != null && element.end != null) {
            snippetStart = element.start;
            snippetEnd = element.end;
            const hasChildren = element.children.some((child) => {
              if (child.type === "JSXText") {
                return child.value.trim().length > 0;
              }
              return true;
            });
            selfClosing = !hasChildren;
          }
        }
      }
      const spreadProps = jsxElement ? componentPropReads(ast, jsxElement, parents) : [];
      const propNames =
        spreadProps.length > 0
          ? spreadProps.map((read) => read.prop)
          : siblingLeaves(opts.leaves, binding.dictKey, []).map((leaf) => leaf.dotPath);
      const suggestions: ManualReviewSuggestion[] = [];
      const seenProps = new Set<string>();
      for (const prop of propNames) {
        if (seenProps.has(prop)) {
          continue;
        }
        seenProps.add(prop);
        const propLeaf = leafFor(opts.leaves, binding.dictKey, prop);
        if (!propLeaf) {
          continue;
        }
        suggestions.push({ ...suggestionForLeaf(propLeaf), label: prop });
      }
      const writeAs =
        jsxElement && suggestions.length > 0
          ? formatSpreadJsx(
              jsxElement,
              suggestions.map((suggestion) => ({
                prop: suggestion.label ?? suggestion.dotPath ?? "value",
                replacement: suggestion.replacement,
              })),
              selfClosing
            )
          : undefined;
      pushReview({
        file: opts.file,
        line,
        dictKey: binding.dictKey,
        reason: "spread",
        snippet: exactSnippet(opts.source, snippetStart, snippetEnd),
        suggestions,
        jsxElement,
        spreadProps: spreadProps.length > 0 ? spreadProps : undefined,
        writeAs,
      });
      return;
    }

    if (
      parent.type === "VariableDeclarator" &&
      parent.init === ident &&
      (parent.id.type === "ObjectPattern" || parent.id.type === "ArrayPattern")
    ) {
      const suggestions: ManualReviewSuggestion[] = [];
      if (parent.id.type === "ObjectPattern") {
        for (const property of parent.id.properties) {
          if (property.type !== "ObjectProperty" || property.computed) {
            continue;
          }
          const key = nodeKeyName(property.key);
          const propLeaf = key ? leafFor(opts.leaves, binding.dictKey, key) : undefined;
          if (propLeaf) {
            suggestions.push(suggestionForLeaf(propLeaf));
          }
        }
      }
      pushReview({
        file: opts.file,
        line,
        dictKey: binding.dictKey,
        reason: "destructuring",
        snippet: exactSnippet(opts.source, parent.start ?? ident.start, parent.end ?? ident.end),
        suggestions,
      });
      return;
    }

    const walked = walkMemberChain(ident, parents);
    if (!walked) {
      return;
    }

    if (walked.path.length === 0) {
      pushReview({
        file: opts.file,
        line,
        dictKey: binding.dictKey,
        reason: "passed-as-value",
        snippet: exactSnippet(opts.source, ident.start, ident.end),
        suggestions: siblingLeaves(opts.leaves, binding.dictKey, []).map(suggestionForLeaf),
      });
      return;
    }

    if (walked.path.some((segment) => segment.kind === "computed")) {
      const prefix: string[] = [];
      for (const segment of walked.path) {
        if (segment.kind === "computed") {
          break;
        }
        if (segment.name !== "value") {
          prefix.push(segment.name);
        }
      }
      pushReview({
        file: opts.file,
        line,
        dictKey: binding.dictKey,
        reason: "dynamic-member",
        snippet: exactSnippet(opts.source, walked.start, walked.end),
        suggestions: siblingLeaves(opts.leaves, binding.dictKey, prefix).map(suggestionForLeaf),
        requiresDirectLiteral: true,
      });
      return;
    }

    const names = walked.path
      .filter((p): p is { kind: "static"; name: string } => p.kind === "static")
      .map((p) => p.name);

    const valueIdx = names.lastIndexOf("value");
    if (valueIdx === -1) {
      const after = staticDotPath(walked.path);
      const childLeaves = siblingLeaves(
        opts.leaves,
        binding.dictKey,
        names.filter((name) => name !== "value")
      );
      pushReview({
        file: opts.file,
        line,
        dictKey: binding.dictKey,
        dotPath: after,
        reason: "no-value",
        snippet: exactSnippet(opts.source, walked.start, walked.end),
        suggestions: childLeaves.map(suggestionForLeaf),
      });
      return;
    }

    const afterValue = names.slice(valueIdx + 1);
    const dotPath = names.slice(0, valueIdx).join(".");
    const leaf = leafFor(opts.leaves, binding.dictKey, dotPath);

    const chainedReview = (chainStart: Node): void => {
      const chain = expressionChain(chainStart, parents, opts.source);
      const tokens = chain.steps.map((step) => step.token);
      const nextSource = leaf ? convertIntlayerPlaceholders(leaf.sourceText, tokens) : undefined;
      const replacement =
        nextSource && chain.steps.length > 0 ? formatTCall(nextSource, chain.steps) : undefined;
      pushReview({
        file: opts.file,
        line,
        dictKey: binding.dictKey,
        dotPath,
        reason: "chained-transform",
        snippet: exactSnippet(opts.source, chain.start, chain.end),
        sourceText: leaf?.sourceText,
        suggestions:
          nextSource && replacement
            ? [
                {
                  dotPath,
                  label: dotPath,
                  sourceText: nextSource,
                  replacement,
                  vars: chain.steps,
                },
              ]
            : [],
        writeAs: replacement,
      });
    };

    const tryReplaceCall = (replaceMember: Node): boolean => {
      const call = parents.get(replaceMember);
      if (!call || call.type !== "CallExpression" || call.callee !== replaceMember) {
        return false;
      }
      const chain = expressionChain(call, parents, opts.source);
      const arg0 = call.arguments[0];
      const arg1 = call.arguments[1];
      const token =
        arg0 && arg0.type === "StringLiteral" ? arg0.value.replace(/^\{|\}$/g, "") : undefined;
      const callStart = call.start;
      const callEnd = call.end;
      const single =
        chain.steps.length === 1 &&
        chain.end === callEnd &&
        call.arguments.length >= 2 &&
        arg0?.type === "StringLiteral" &&
        arg1 &&
        arg1.type !== "SpreadElement" &&
        token &&
        callStart != null &&
        callEnd != null &&
        leaf;
      if (single && leaf && callStart != null && callEnd != null && token) {
        const expr = opts.source.slice(arg1.start ?? 0, arg1.end ?? 0);
        const sourceText = leaf.sourceText.includes(`{{${token}}}`)
          ? leaf.sourceText
          : leaf.sourceText.includes(`{${token}}`)
            ? leaf.sourceText.replace(`{${token}}`, `{{${token}}}`)
            : leaf.sourceText;
        rewrites.push({
          file: opts.file,
          line,
          start: callStart,
          end: callEnd,
          dictKey: binding.dictKey,
          dotPath,
          kind: "replace",
          sourceText,
          replacement: formatTCall(sourceText, { token, expr }),
          token,
          snippet: snippetAround(opts.source, callStart, callEnd),
        });
        return true;
      }
      chainedReview(call);
      return true;
    };

    if (afterValue.length === 1 && afterValue[0] === "replace") {
      if (tryReplaceCall(walked.node)) {
        return;
      }
    }

    if (afterValue.length === 0) {
      const next = parents.get(walked.node);
      if (
        next &&
        next.type === "MemberExpression" &&
        next.object === walked.node &&
        !next.computed &&
        next.property.type === "Identifier" &&
        next.property.name === "replace"
      ) {
        if (tryReplaceCall(next)) {
          return;
        }
      }

      if (!leaf) {
        pushReview({
          file: opts.file,
          line,
          dictKey: binding.dictKey,
          dotPath,
          reason: "unresolved-path",
          snippet: exactSnippet(opts.source, walked.start, walked.end),
          suggestions: [],
        });
        return;
      }
      rewrites.push({
        file: opts.file,
        line,
        start: walked.start,
        end: walked.end,
        dictKey: binding.dictKey,
        dotPath,
        kind: "simple",
        sourceText: leaf.sourceText,
        replacement: formatTCall(leaf.sourceText),
        snippet: snippetAround(opts.source, walked.start, walked.end),
      });
      return;
    }

    chainedReview(walked.node);
  };

  for (const binding of bindings) {
    walkAst(ast, (node) => {
      if (!isBindingIdentifier(node, binding.name, parents)) {
        return;
      }
      classify(binding, node);
    });
  }

  const edits: { start: number; end: number; text: string }[] = rewrites.map((r) => ({
    start: r.start,
    end: r.end,
    text: r.replacement,
  }));

  let output = applyEdits(opts.source, edits);
  let addedTImport = false;

  if (rewrites.length > 0 && opts.tImportSpecifier && !tAlreadyInScope(ast)) {
    let ast2: Node;
    try {
      ast2 = parse(output, {
        sourceType: "module",
        errorRecovery: true,
        plugins: ["typescript", "jsx"],
      }) as Node;
    } catch {
      ast2 = ast;
    }
    if (!tAlreadyInScope(ast2)) {
      output = insertTImport(output, ast2, opts.tImportSpecifier);
      addedTImport = true;
    }
  }

  // Re-parse to drop unused bindings / imports after rewrites.
  const removedBindings: string[] = [];
  try {
    const ast3 = parse(output, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
    const parents3 = buildParentMap(ast3);
    const bindings3 = findBindings(ast3, hookNames);
    attachDeclarationSpans(bindings3, ast3);
    const removeEdits: { start: number; end: number; text: string }[] = [];
    for (const b of bindings3) {
      if (identifierStillUsed(ast3, b.name, parents3, b.start, b.end)) {
        continue;
      }
      const start = b.declaratorCount === 1 ? b.declarationStart : b.start;
      let end = b.declaratorCount === 1 ? b.declarationEnd : b.end;
      if (b.declaratorCount === 1 && output[end] === "\n") {
        end += 1;
      }
      removeEdits.push({ start, end, text: "" });
      removedBindings.push(b.name);
    }
    output = applyEdits(output, removeEdits);

    const ast4 = parse(output, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
    const parents4 = buildParentMap(ast4);
    const unusedHooks = new Set<string>();
    for (const hook of hookNames) {
      if (!hookStillUsed(ast4, hook, parents4)) {
        unusedHooks.add(hook);
      }
    }
    if (unusedHooks.size > 0) {
      output = removeImportSpecifiers(output, ast4, unusedHooks);
    }
  } catch {
    /* leave output as rewrite-only if cleanup parse fails */
  }

  return {
    file: opts.file,
    original: opts.source,
    output,
    changed: output !== opts.source,
    rewrites,
    reviews,
    removedBindings,
    addedTImport,
  };
}

const LEFTOVER_HOOKS = new Set(["useIntlayer", "getIntlayer"]);

/**
 * Imports and JSX wrappers that `migrate-intlayer` does not rewrite.
 * Function declarations named `useIntlayer` (a local shim) are ignored.
 */
export function findIntlayerLeftovers(file: string, source: string): IntlayerLeftover[] {
  let ast: Node;
  try {
    ast = parse(source, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript", "jsx"],
    }) as Node;
  } catch {
    return [];
  }
  const found: IntlayerLeftover[] = [];
  walkAst(ast, (node) => {
    if (node.type === "ImportSpecifier") {
      const imported =
        node.imported.type === "Identifier"
          ? node.imported.name
          : node.imported.type === "StringLiteral"
            ? node.imported.value
            : undefined;
      if (!imported) {
        return;
      }
      if (LEFTOVER_HOOKS.has(imported)) {
        found.push({
          file,
          line: node.loc?.start.line ?? 1,
          kind: "hook-import",
          name: imported,
        });
        return;
      }
      if (imported === "IntlayerProvider") {
        found.push({
          file,
          line: node.loc?.start.line ?? 1,
          kind: "provider",
          name: imported,
        });
      }
      return;
    }
    if (node.type === "JSXOpeningElement" && jsxOpeningName(node) === "IntlayerProvider") {
      found.push({
        file,
        line: node.loc?.start.line ?? 1,
        kind: "provider",
        name: "IntlayerProvider",
      });
    }
  });
  return found;
}

export function relativeTImport(fromFile: string, toFile: string): string {
  const fromParts = fromFile.replace(/\\/g, "/").split("/");
  const toParts = toFile.replace(/\\/g, "/").split("/");
  fromParts.pop();
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  const up = fromParts.map(() => "..").join("/");
  const down = toParts.join("/");
  const combined = [up, down].filter(Boolean).join("/");
  const noExt = combined.replace(/\.(tsx?|jsx?)$/, "");
  return noExt.startsWith(".") ? noExt : `./${noExt}`;
}
