import fs from "fs";
import { parse } from "@babel/parser";
import type { MemberExpression, Node } from "@babel/types";
import chalk from "chalk";
import type { ThemeCatalog } from "../extractors/vitepress-theme-extractor.js";
import { t } from "../i18n/index.js";

const THEME_CATALOG_IDENTIFIERS = new Set(["t", "theme", "enTheme"]);

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

function memberExpressionPath(
  node: MemberExpression,
  catalogIdentifiers: Set<string>
): string | null {
  const parts: string[] = [];
  let cur: Node = node;
  while (cur.type === "MemberExpression") {
    const prop = cur.property;
    if (prop.type === "Identifier") {
      parts.unshift(prop.name);
    } else if (prop.type === "StringLiteral") {
      parts.unshift(prop.value);
    } else {
      return null;
    }
    cur = cur.object;
  }
  if (cur.type === "Identifier" && catalogIdentifiers.has(cur.name)) {
    return parts.join(".");
  }
  return null;
}

function collectThemeConfigForParamNames(ast: Node): Set<string> {
  const names = new Set<string>();
  walkAst(ast, (node) => {
    if (
      node.type === "FunctionDeclaration" &&
      node.id?.type === "Identifier" &&
      node.id.name === "themeConfigFor"
    ) {
      const param = node.params[0];
      if (param?.type === "Identifier") {
        names.add(param.name);
      }
      return;
    }
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "Identifier" &&
      node.id.name === "themeConfigFor"
    ) {
      const init = node.init;
      if (
        init &&
        (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression") &&
        init.params[0]?.type === "Identifier"
      ) {
        names.add(init.params[0].name);
      }
    }
  });
  return names;
}

export function listCatalogStringLeafPaths(catalog: ThemeCatalog, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(catalog)) {
    const dotPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      paths.push(dotPath);
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths.push(...listCatalogStringLeafPaths(value as ThemeCatalog, dotPath));
    }
  }
  return paths;
}

export function extractCatalogReferencesFromConfig(
  configContent: string,
  filepath: string
): Set<string> {
  let ast: Node;
  try {
    ast = parse(configContent, {
      sourceType: "module",
      errorRecovery: true,
      plugins: ["typescript"],
    }) as Node;
  } catch (e) {
    throw new Error(
      `Failed to parse VitePress config ${filepath}: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const catalogIdentifiers = new Set(THEME_CATALOG_IDENTIFIERS);
  for (const name of collectThemeConfigForParamNames(ast)) {
    catalogIdentifiers.add(name);
  }

  const refs = new Set<string>();
  walkAst(ast, (node) => {
    if (node.type !== "MemberExpression") {
      return;
    }
    const dotPath = memberExpressionPath(node, catalogIdentifiers);
    if (dotPath) {
      refs.add(dotPath);
    }
  });
  return keepMaximalDotPaths(refs);
}

function keepMaximalDotPaths(paths: Set<string>): Set<string> {
  const maximal = new Set<string>();
  for (const path of paths) {
    const hasExtension = [...paths].some((other) => other !== path && other.startsWith(`${path}.`));
    if (!hasExtension) {
      maximal.add(path);
    }
  }
  return maximal;
}

export function findUnusedVitepressCatalogKeys(
  catalog: ThemeCatalog,
  configContent: string,
  configRelPath: string
): string[] {
  const leafPaths = listCatalogStringLeafPaths(catalog);
  const refs = extractCatalogReferencesFromConfig(configContent, configRelPath);
  return leafPaths.filter((leaf) => !refs.has(leaf)).sort();
}

export function warnUnusedVitepressCatalogKeys(
  catalogAbs: string,
  configAbs: string,
  catalogRel: string,
  configRel: string,
  _opts: { verbose?: boolean }
): string[] {
  if (!fs.existsSync(catalogAbs) || !fs.existsSync(configAbs)) {
    return [];
  }

  let catalog: ThemeCatalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogAbs, "utf8")) as ThemeCatalog;
  } catch {
    return [];
  }

  const configContent = fs.readFileSync(configAbs, "utf8");
  const unused = findUnusedVitepressCatalogKeys(catalog, configContent, configRel);
  if (unused.length === 0) {
    return [];
  }

  for (const key of unused) {
    console.log(
      chalk.yellow(
        t(
          '⚠️  VitePress theme catalog key "{{key}}" in {{catalogPath}} is not referenced in {{configPath}} (wire it in themeConfigFor or remove it).',
          { key, catalogPath: catalogRel, configPath: configRel }
        )
      )
    );
  }

  return unused;
}
