/**
 * `upgrade` — move the running install to the latest published release.
 *
 * A project dependency is rewritten in package.json and reinstalled. A global
 * Node install uses that package manager's global install. A standalone
 * executable is replaced from the GitHub Release for this OS and architecture.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import zlib from "node:zlib";
import chalk from "chalk";
import { z } from "zod";
import { compareRelease } from "./doctor.js";
import { t } from "../i18n/index.js";

const PACKAGE_NAME = "ai-i18n-tools";
const NPM_LATEST_URL = "https://registry.npmjs.org/ai-i18n-tools/latest";
const GITHUB_RELEASES_LATEST = "https://api.github.com/repos/wsj-br/ai-i18n-tools/releases/latest";
const GITHUB_DOWNLOAD_BASE = "https://github.com/wsj-br/ai-i18n-tools/releases/download";
const FETCH_TIMEOUT_MS = 10_000;

const npmLatestSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
});

const githubLatestSchema = z.object({
  tag_name: z.string().min(1),
});

const SIMPLE_SPECIFIER = /^(>=|<=|>|<|=|\^|~)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface ManifestHit {
  manifestPath: string;
  dir: string;
  specifier: string;
}

export type InstallKind =
  | {
      kind: "project";
      manifestPath: string;
      installDir: string;
      manager: PackageManager;
      specifier: string;
    }
  | { kind: "global"; manager: PackageManager }
  | { kind: "sea"; execPath: string }
  | { kind: "source" }
  | { kind: "ephemeral" }
  | { kind: "ambiguous" };

export interface ClassifyInput {
  scriptPath: string;
  cwd: string;
  sea: boolean;
  execPath: string;
  userAgent?: string;
}

export interface RunUpgradeOptions {
  cwd: string;
  scriptPath: string;
  sea: boolean;
  execPath: string;
  platform: NodeJS.Platform;
  arch: string;
  installedVersion: string;
  yes: boolean;
  stdinIsTTY: boolean;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  prompt?: (question: string) => Promise<string>;
  spawnImpl?: (cmd: string, args: string[], cwd: string) => Promise<number>;
}

export type RewriteManifestResult =
  | { status: "ok"; next: string }
  | { status: "missing" | "invalid-json" }
  | { status: "unrewritable"; specifier: string };

interface PackageJson {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  workspaces?: string[] | { packages?: unknown };
}

type RemoteVersion =
  { status: "ok"; version: string; tag: string } | { status: "error"; message: string };

type FetchJsonResult =
  | { status: "ok"; json: unknown }
  | { status: "http"; code: number }
  | { status: "error"; message: string };

type FetchBytesResult =
  | { status: "ok"; bytes: Buffer }
  | { status: "http"; code: number }
  | { status: "error"; message: string };

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Keep the existing range operator and swap in `version`. Complex specs are refused. */
export function rewriteDependencySpecifier(current: string, version: string): string | null {
  const spec = current.trim();
  if (spec === "" || spec === "*" || spec.toLowerCase() === "latest") {
    return null;
  }
  if (/workspace:|file:|link:|portal:|git\+|git:|github:|npm:|https?:/i.test(spec)) {
    return null;
  }
  const match = SIMPLE_SPECIFIER.exec(spec);
  if (!match) {
    return null;
  }
  const op = match[1] ?? "";
  return `${op}${version}`;
}

/** Rewrite every `ai-i18n-tools` dependency specifier in a package.json document. */
export function rewriteManifestSource(raw: string, version: string): RewriteManifestResult {
  let parsed: PackageJson;
  try {
    parsed = JSON.parse(raw) as PackageJson;
  } catch {
    return { status: "invalid-json" };
  }
  const specs = declaredSpecifiers(parsed);
  if (specs.length === 0) {
    return { status: "missing" };
  }
  for (const spec of specs) {
    if (rewriteDependencySpecifier(spec, version) === null) {
      return { status: "unrewritable", specifier: spec };
    }
  }
  let replaced = 0;
  const next = raw.replace(/("ai-i18n-tools"\s*:\s*")([^"]+)(")/g, (full, open, spec, close) => {
    const rewritten = rewriteDependencySpecifier(String(spec), version);
    if (rewritten === null) {
      return String(full);
    }
    replaced += 1;
    return `${open}${rewritten}${close}`;
  });
  if (replaced < specs.length) {
    return { status: "unrewritable", specifier: specs[0] ?? "" };
  }
  return { status: "ok", next };
}

function declaredSpecifiers(pkg: PackageJson): string[] {
  const specs: string[] = [];
  for (const field of ["dependencies", "devDependencies"] as const) {
    const block = pkg[field];
    if (!block) {
      continue;
    }
    const spec = block[PACKAGE_NAME];
    if (typeof spec === "string") {
      specs.push(spec);
    }
  }
  return specs;
}

export function parsePackageManagerField(value: string | undefined): PackageManager | null {
  if (!value) {
    return null;
  }
  const name = value.split("@")[0]?.trim() ?? "";
  if (name === "npm" || name === "pnpm" || name === "yarn" || name === "bun") {
    return name;
  }
  return null;
}

export function globalInstallArgs(
  manager: PackageManager,
  version: string
): { cmd: string; args: string[] } {
  const spec = `${PACKAGE_NAME}@${version}`;
  switch (manager) {
    case "npm":
      return { cmd: "npm", args: ["install", "-g", spec] };
    case "pnpm":
      return { cmd: "pnpm", args: ["add", "-g", spec] };
    case "yarn":
      return { cmd: "yarn", args: ["global", "add", spec] };
    case "bun":
      return { cmd: "bun", args: ["add", "-g", spec] };
    default: {
      const unreachable: never = manager;
      return unreachable;
    }
  }
}

export function projectInstallArgs(manager: PackageManager): { cmd: string; args: string[] } {
  switch (manager) {
    case "npm":
      return { cmd: "npm", args: ["install"] };
    case "pnpm":
      return { cmd: "pnpm", args: ["install"] };
    case "yarn":
      return { cmd: "yarn", args: ["install"] };
    case "bun":
      return { cmd: "bun", args: ["install"] };
    default: {
      const unreachable: never = manager;
      return unreachable;
    }
  }
}

export function commandForPlatform(cmd: string, platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return `${cmd}.cmd`;
  }
  return cmd;
}

/** Asset basename published by the release workflow, before `.gz`. */
export function binaryAssetBaseName(platform: NodeJS.Platform, arch: string): string | null {
  const os =
    platform === "linux"
      ? "linux"
      : platform === "darwin"
        ? "macos"
        : platform === "win32"
          ? "win"
          : null;
  if (!os) {
    return null;
  }
  if (arch !== "x64" && arch !== "arm64") {
    return null;
  }
  if (platform === "win32" && arch !== "x64") {
    return null;
  }
  const ext = platform === "win32" ? ".exe" : "";
  return `ai-i18n-tools-${os}-${arch}${ext}`;
}

export function releaseDownloadUrl(tag: string, file: string): string {
  const normalized = tag.startsWith("v") || tag.startsWith("V") ? tag : `v${tag}`;
  return `${GITHUB_DOWNLOAD_BASE}/${normalized}/${file}`;
}

/** Hash from a `SHA256SUMS.txt` line for `fileName`, or null when the line is absent. */
export function parseSha256Sums(text: string, fileName: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const parts = trimmed.split(/\s+/);
    const hash = parts[0]?.toLowerCase();
    let name = parts[1] ?? "";
    if (name.startsWith("*")) {
      name = name.slice(1);
    }
    if (name === fileName && hash && /^[0-9a-f]{64}$/.test(hash)) {
      return hash;
    }
  }
  return null;
}

export function sha256Hex(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function walkUp(startDir: string): string[] {
  const dirs: string[] = [];
  let dir = path.resolve(startDir);
  for (;;) {
    dirs.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return dirs;
}

function readManifest(dir: string): { manifestPath: string; json: PackageJson } | null {
  const manifestPath = path.join(dir, "package.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PackageJson;
    return { manifestPath, json };
  } catch {
    return null;
  }
}

function primarySpecifier(pkg: PackageJson): string | null {
  const deps = pkg.dependencies?.[PACKAGE_NAME];
  if (typeof deps === "string") {
    return deps;
  }
  const dev = pkg.devDependencies?.[PACKAGE_NAME];
  if (typeof dev === "string") {
    return dev;
  }
  return null;
}

function findDeclaringManifest(startDir: string): ManifestHit | null {
  for (const dir of walkUp(startDir)) {
    const manifest = readManifest(dir);
    if (!manifest) {
      continue;
    }
    const specifier = primarySpecifier(manifest.json);
    if (!specifier) {
      continue;
    }
    return { manifestPath: manifest.manifestPath, dir, specifier };
  }
  return null;
}

function pathSegments(filePath: string): string[] {
  return filePath.split(path.sep).filter((part) => part !== "");
}

function hasEphemeralSegment(filePath: string): boolean {
  const parts = pathSegments(filePath);
  return parts.includes("_npx") || parts.includes("dlx");
}

function isKnownGlobalPrefix(filePath: string): boolean {
  const parts = pathSegments(filePath);
  for (let i = 0; i < parts.length - 1; i++) {
    const current = parts[i];
    const next = parts[i + 1];
    if (current === "pnpm" && next === "global") {
      return true;
    }
    if ((current === "yarn" || current === ".yarn") && next === "global") {
      return true;
    }
    if (current === "bun" && next === "install" && parts[i + 2] === "global") {
      return true;
    }
  }
  return false;
}

/** npm's global layout is `{prefix}/lib/node_modules` or `{prefix}/npm/node_modules` on Windows. */
function isNpmGlobalLayout(scriptPath: string): boolean {
  const parts = pathSegments(scriptPath);
  if (parts.includes(".pnpm")) {
    return false;
  }
  const idx = parts.lastIndexOf("node_modules");
  if (idx <= 0 || parts[idx + 1] !== PACKAGE_NAME) {
    return false;
  }
  const parent = parts[idx - 1];
  return parent === "lib" || parent === "npm";
}

function isPackageInstallPath(scriptPath: string): boolean {
  const parts = pathSegments(scriptPath);
  const idx = parts.lastIndexOf("node_modules");
  return idx >= 0 && parts[idx + 1] === PACKAGE_NAME;
}

function isSourceCheckout(scriptPath: string): boolean {
  if (path.basename(path.dirname(scriptPath)) !== "bin") {
    return false;
  }
  const base = path.basename(scriptPath);
  if (base !== "ai-i18n-tools.mjs" && base !== "ai-i18n-tools") {
    return false;
  }
  const manifest = readManifest(path.dirname(path.dirname(scriptPath)));
  return manifest?.json.name === PACKAGE_NAME;
}

export function detectGlobalPackageManager(filePath: string, userAgent?: string): PackageManager {
  const parts = pathSegments(filePath);
  if (parts.includes("pnpm")) {
    return "pnpm";
  }
  if (parts.includes("yarn") || parts.includes(".yarn")) {
    return "yarn";
  }
  if (parts.includes("bun")) {
    return "bun";
  }
  // `{prefix}/lib/node_modules` and the Windows npm prefix are npm even when
  // the current shell's user agent names another package manager.
  if (isNpmGlobalLayout(filePath)) {
    return "npm";
  }
  const agent = userAgent ?? "";
  if (agent.startsWith("pnpm/")) {
    return "pnpm";
  }
  if (agent.startsWith("yarn/")) {
    return "yarn";
  }
  if (agent.startsWith("bun/")) {
    return "bun";
  }
  return "npm";
}

const LOCKFILES: { file: string; manager: PackageManager }[] = [
  { file: "pnpm-lock.yaml", manager: "pnpm" },
  { file: "yarn.lock", manager: "yarn" },
  { file: "package-lock.json", manager: "npm" },
  { file: "bun.lock", manager: "bun" },
  { file: "bun.lockb", manager: "bun" },
];

function findInstallRoot(manifestDir: string): { installDir: string; manager: PackageManager } {
  let managerFromField: PackageManager | null = null;
  let fieldDir: string | null = null;
  let lockDir: string | null = null;
  let lockManager: PackageManager | null = null;

  for (const dir of walkUp(manifestDir)) {
    if (!managerFromField) {
      const manifest = readManifest(dir);
      const parsed = manifest ? parsePackageManagerField(manifest.json.packageManager) : null;
      if (parsed) {
        managerFromField = parsed;
        fieldDir = dir;
      }
    }
    if (!lockDir) {
      for (const lock of LOCKFILES) {
        if (fs.existsSync(path.join(dir, lock.file))) {
          lockDir = dir;
          lockManager = lock.manager;
          break;
        }
      }
    }
    if (managerFromField && lockDir) {
      break;
    }
  }

  return {
    manager: managerFromField ?? lockManager ?? "npm",
    installDir: lockDir ?? fieldDir ?? manifestDir,
  };
}

function nodeModulesParents(scriptPath: string): string[] {
  const parts = scriptPath.split(path.sep);
  const parents: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== "node_modules") {
      continue;
    }
    const parent = parts.slice(0, i).join(path.sep);
    parents.push(parent === "" ? path.sep : parent);
  }
  return parents;
}

function workspacePatterns(pkg: PackageJson): string[] {
  const workspaces = pkg.workspaces;
  if (Array.isArray(workspaces)) {
    return workspaces.filter((item): item is string => typeof item === "string");
  }
  if (workspaces && typeof workspaces === "object" && Array.isArray(workspaces.packages)) {
    return workspaces.packages.filter((item): item is string => typeof item === "string");
  }
  return [];
}

function workspaceMemberDirs(root: string, patterns: string[]): string[] {
  const dirs: string[] = [];
  for (const pattern of patterns) {
    const normalized = pattern.replace(/\\/g, "/").replace(/^\.\//, "");
    if (normalized.includes("**") || normalized.includes("{")) {
      continue;
    }
    if (normalized.endsWith("/*")) {
      const parent = path.join(root, normalized.slice(0, -2));
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(parent, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        if (ent.name === "node_modules" || !ent.isDirectory()) {
          continue;
        }
        dirs.push(path.join(parent, ent.name));
      }
      continue;
    }
    dirs.push(path.join(root, normalized));
  }
  return dirs;
}

function workspaceHits(root: string): ManifestHit[] {
  const manifest = readManifest(root);
  if (!manifest) {
    return [];
  }
  const hits: ManifestHit[] = [];
  for (const dir of workspaceMemberDirs(root, workspacePatterns(manifest.json))) {
    const member = readManifest(dir);
    if (!member) {
      continue;
    }
    const specifier = primarySpecifier(member.json);
    if (!specifier) {
      continue;
    }
    hits.push({ manifestPath: member.manifestPath, dir, specifier });
  }
  return hits;
}

/**
 * Workspace members are not ancestors of a hoisted `node_modules/.pnpm` path.
 * One `packages/*`-style level is enough for the layouts this tool documents.
 */
function findWorkspaceProject(scriptPath: string, cwd: string): ManifestHit | "ambiguous" | null {
  const cwdAbs = path.resolve(cwd);
  for (const parent of nodeModulesParents(scriptPath)) {
    const members = workspaceHits(parent);
    if (members.length === 0) {
      continue;
    }
    const nearest = members
      .filter((member) => cwdAbs === member.dir || cwdAbs.startsWith(member.dir + path.sep))
      .sort((a, b) => b.dir.length - a.dir.length)[0];
    if (nearest) {
      return nearest;
    }
    if (members.length === 1) {
      return members[0];
    }
    return "ambiguous";
  }
  return null;
}

function projectKind(hit: ManifestHit): InstallKind {
  const rooted = findInstallRoot(hit.dir);
  return {
    kind: "project",
    manifestPath: hit.manifestPath,
    installDir: rooted.installDir,
    manager: rooted.manager,
    specifier: hit.specifier,
  };
}

export function classifyInstall(input: ClassifyInput): InstallKind {
  if (input.sea) {
    return { kind: "sea", execPath: input.execPath };
  }
  const scriptPath = fs.realpathSync(input.scriptPath);
  const unresolved = path.resolve(input.scriptPath);
  if (hasEphemeralSegment(scriptPath) || hasEphemeralSegment(unresolved)) {
    return { kind: "ephemeral" };
  }
  if (!isPackageInstallPath(scriptPath)) {
    if (isSourceCheckout(scriptPath)) {
      return { kind: "source" };
    }
    return { kind: "ephemeral" };
  }
  if (isKnownGlobalPrefix(scriptPath)) {
    return { kind: "global", manager: detectGlobalPackageManager(scriptPath, input.userAgent) };
  }
  const fromScript = findDeclaringManifest(path.dirname(scriptPath));
  if (fromScript) {
    return projectKind(fromScript);
  }
  if (!isNpmGlobalLayout(scriptPath)) {
    const fromCwd = findDeclaringManifest(input.cwd);
    if (fromCwd && !isKnownGlobalPrefix(fromCwd.dir)) {
      return projectKind(fromCwd);
    }
    const workspace = findWorkspaceProject(scriptPath, input.cwd);
    if (workspace === "ambiguous") {
      return { kind: "ambiguous" };
    }
    if (workspace) {
      return projectKind(workspace);
    }
  }
  return { kind: "global", manager: detectGlobalPackageManager(scriptPath, input.userAgent) };
}

function requestHeaders(accept: string): Record<string, string> {
  return {
    Accept: accept,
    "User-Agent": "ai-i18n-tools",
  };
}

async function fetchJson(
  fetchImpl: typeof fetch,
  url: string,
  accept: string
): Promise<FetchJsonResult> {
  try {
    const response = await fetchImpl(url, {
      headers: requestHeaders(accept),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const raw = await response.text();
    if (!response.ok) {
      return { status: "http", code: response.status };
    }
    try {
      return { status: "ok", json: JSON.parse(raw) as unknown };
    } catch (e) {
      return { status: "error", message: errorMessage(e) };
    }
  } catch (e) {
    return { status: "error", message: errorMessage(e) };
  }
}

async function fetchBytes(fetchImpl: typeof fetch, url: string): Promise<FetchBytesResult> {
  try {
    const response = await fetchImpl(url, {
      headers: requestHeaders("application/octet-stream"),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { status: "http", code: response.status };
    }
    return { status: "ok", bytes: Buffer.from(await response.arrayBuffer()) };
  } catch (e) {
    return { status: "error", message: errorMessage(e) };
  }
}

async function fetchNpmLatest(fetchImpl: typeof fetch): Promise<RemoteVersion> {
  const result = await fetchJson(fetchImpl, NPM_LATEST_URL, "application/json");
  if (result.status === "http") {
    return {
      status: "error",
      message: t("Could not read the latest npm version (HTTP {{status}})", {
        status: result.code,
      }),
    };
  }
  if (result.status === "error") {
    return {
      status: "error",
      message: t("Could not read the latest npm version: {{message}}", { message: result.message }),
    };
  }
  const parsed = npmLatestSchema.safeParse(result.json);
  if (!parsed.success) {
    return { status: "error", message: t("npm registry response did not include a version") };
  }
  return { status: "ok", version: parsed.data.version, tag: `v${parsed.data.version}` };
}

async function fetchGithubLatest(fetchImpl: typeof fetch): Promise<RemoteVersion> {
  const result = await fetchJson(fetchImpl, GITHUB_RELEASES_LATEST, "application/vnd.github+json");
  if (result.status === "http") {
    return {
      status: "error",
      message: t("Could not read the latest GitHub release (HTTP {{status}})", {
        status: result.code,
      }),
    };
  }
  if (result.status === "error") {
    return {
      status: "error",
      message: t("Could not read the latest GitHub release: {{message}}", {
        message: result.message,
      }),
    };
  }
  const parsed = githubLatestSchema.safeParse(result.json);
  if (!parsed.success || parsed.data.tag_name.trim() === "") {
    return { status: "error", message: t("GitHub releases response did not include a tag") };
  }
  const tag = parsed.data.tag_name.trim();
  return { status: "ok", version: tag.replace(/^v/i, ""), tag };
}

async function defaultPrompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(chalk.cyan(question));
  } finally {
    rl.close();
  }
}

function defaultSpawn(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function runCommand(
  spawnImpl: (cmd: string, args: string[], cwd: string) => Promise<number>,
  cmd: string,
  args: string[],
  cwd: string
): Promise<number> {
  try {
    return await spawnImpl(cmd, args, cwd);
  } catch (e) {
    console.error(chalk.red(errorMessage(e)));
    return 1;
  }
}

type ConfirmResult = "yes" | "no" | "noninteractive";

async function confirmUpgrade(options: RunUpgradeOptions): Promise<ConfirmResult> {
  if (options.yes) {
    return "yes";
  }
  if (!options.stdinIsTTY) {
    return "noninteractive";
  }
  const prompt = options.prompt ?? defaultPrompt;
  const answer = await prompt(t("Upgrade now? (y/n) "));
  return answer === "y" ? "yes" : "no";
}

function describeTarget(kind: InstallKind): string | null {
  switch (kind.kind) {
    case "project":
      return t("Update {{path}} with {{manager}}", {
        path: kind.manifestPath,
        manager: kind.manager,
      });
    case "global":
      return t("Global {{manager}} install", { manager: kind.manager });
    case "sea":
      return t("Replace {{path}}", { path: kind.execPath });
    case "source":
    case "ephemeral":
    case "ambiguous":
      return null;
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

async function upgradeProject(
  kind: Extract<InstallKind, { kind: "project" }>,
  version: string,
  options: RunUpgradeOptions,
  spawnImpl: (cmd: string, args: string[], cwd: string) => Promise<number>
): Promise<number> {
  const original = fs.readFileSync(kind.manifestPath, "utf8");
  const rewritten = rewriteManifestSource(original, version);
  if (rewritten.status !== "ok") {
    if (rewritten.status === "unrewritable") {
      console.error(
        chalk.red(
          t("Dependency specifier {{specifier}} cannot be rewritten", {
            specifier: rewritten.specifier,
          })
        )
      );
    } else {
      console.error(
        chalk.red(t("{{path}} does not depend on ai-i18n-tools", { path: kind.manifestPath }))
      );
    }
    return 1;
  }
  fs.writeFileSync(kind.manifestPath, rewritten.next);
  const install = projectInstallArgs(kind.manager);
  const cmd = commandForPlatform(install.cmd, options.platform);
  console.log(t("Running {{command}}", { command: [cmd, ...install.args].join(" ") }));
  const code = await runCommand(spawnImpl, cmd, install.args, kind.installDir);
  if (code === 0) {
    console.log(t("Updated {{path}} to {{version}}", { path: kind.manifestPath, version }));
    return 0;
  }
  fs.writeFileSync(kind.manifestPath, original);
  const restore = await runCommand(spawnImpl, cmd, install.args, kind.installDir);
  console.error(chalk.red(t("Install failed. Restored {{path}}", { path: kind.manifestPath })));
  if (restore !== 0) {
    console.error(chalk.red(t("The install that restores the lockfile also failed")));
  }
  return 1;
}

async function upgradeGlobal(
  kind: Extract<InstallKind, { kind: "global" }>,
  version: string,
  options: RunUpgradeOptions,
  spawnImpl: (cmd: string, args: string[], cwd: string) => Promise<number>
): Promise<number> {
  const install = globalInstallArgs(kind.manager, version);
  const cmd = commandForPlatform(install.cmd, options.platform);
  console.log(t("Running {{command}}", { command: [cmd, ...install.args].join(" ") }));
  const code = await runCommand(spawnImpl, cmd, install.args, options.cwd);
  if (code !== 0) {
    console.error(
      chalk.red(t("{{command}} failed", { command: [cmd, ...install.args].join(" ") }))
    );
    return 1;
  }
  console.log(
    t("Upgraded the global {{manager}} install to {{version}}", { manager: kind.manager, version })
  );
  return 0;
}

/** Put `bytes` at `execPath`. On Windows the running executable is renamed aside first. */
export async function replaceExecutable(
  execPath: string,
  bytes: Buffer,
  platform: NodeJS.Platform
): Promise<void> {
  const dir = path.dirname(execPath);
  const tmp = path.join(dir, `.ai-i18n-tools.${process.pid}.tmp`);
  const aside = `${execPath}.old`;
  await fs.promises.writeFile(tmp, bytes, { mode: 0o755 });
  try {
    if (platform === "win32") {
      await fs.promises.rm(aside, { force: true });
      await fs.promises.rename(execPath, aside);
      try {
        await fs.promises.rename(tmp, execPath);
      } catch (e) {
        try {
          await fs.promises.rename(aside, execPath);
        } catch (restoreError) {
          throw new Error(`${errorMessage(e)}; ${errorMessage(restoreError)}`);
        }
        throw e;
      }
      return;
    }
    await fs.promises.rename(tmp, execPath);
    await fs.promises.chmod(execPath, 0o755);
  } catch (e) {
    await fs.promises.rm(tmp, { force: true });
    throw e;
  }
}

async function clearMacQuarantine(
  execPath: string,
  spawnImpl: (cmd: string, args: string[], cwd: string) => Promise<number>
): Promise<void> {
  try {
    await spawnImpl("xattr", ["-d", "com.apple.quarantine", execPath], path.dirname(execPath));
  } catch (e) {
    // xattr is optional. The download already matched SHA256SUMS.txt, so a missing
    // xattr binary or a cleared quarantine attribute does not undo the replacement.
    if (!(e instanceof Error)) {
      throw e;
    }
  }
}

async function upgradeBinary(
  execPath: string,
  remote: Extract<RemoteVersion, { status: "ok" }>,
  options: RunUpgradeOptions,
  fetchImpl: typeof fetch,
  spawnImpl: (cmd: string, args: string[], cwd: string) => Promise<number>
): Promise<number> {
  const base = binaryAssetBaseName(options.platform, options.arch);
  if (!base) {
    console.error(
      chalk.red(
        t("Unsupported platform {{platform}} {{arch}}", {
          platform: options.platform,
          arch: options.arch,
        })
      )
    );
    return 1;
  }
  const archive = `${base}.gz`;
  console.log(t("Downloading {{file}}", { file: archive }));
  const archiveResult = await fetchBytes(fetchImpl, releaseDownloadUrl(remote.tag, archive));
  const sumsResult = await fetchBytes(fetchImpl, releaseDownloadUrl(remote.tag, "SHA256SUMS.txt"));
  if (archiveResult.status !== "ok") {
    const message =
      archiveResult.status === "http" ? `HTTP ${archiveResult.code}` : archiveResult.message;
    console.error(
      chalk.red(t("Could not download {{file}}: {{message}}", { file: archive, message }))
    );
    return 1;
  }
  if (sumsResult.status !== "ok") {
    const message = sumsResult.status === "http" ? `HTTP ${sumsResult.code}` : sumsResult.message;
    console.error(
      chalk.red(t("Could not download {{file}}: {{message}}", { file: "SHA256SUMS.txt", message }))
    );
    return 1;
  }
  const expected = parseSha256Sums(sumsResult.bytes.toString("utf8"), archive);
  if (!expected) {
    console.error(chalk.red(t("SHA256SUMS.txt has no checksum for {{file}}", { file: archive })));
    return 1;
  }
  const actual = sha256Hex(archiveResult.bytes);
  if (actual !== expected) {
    console.error(chalk.red(t("Checksum mismatch for {{file}}", { file: archive })));
    return 1;
  }
  console.log(t("Checksum verified"));
  let unpacked: Buffer;
  try {
    unpacked = zlib.gunzipSync(archiveResult.bytes);
  } catch (e) {
    console.error(
      chalk.red(
        t("Could not decompress {{file}}: {{message}}", { file: archive, message: errorMessage(e) })
      )
    );
    return 1;
  }
  try {
    await replaceExecutable(execPath, unpacked, options.platform);
  } catch (e) {
    console.error(
      chalk.red(
        t("Could not replace {{path}}: {{message}}", { path: execPath, message: errorMessage(e) })
      )
    );
    return 1;
  }
  if (options.platform === "darwin") {
    await clearMacQuarantine(execPath, spawnImpl);
  }
  const versionCode = await runCommand(spawnImpl, execPath, ["--version"], path.dirname(execPath));
  if (versionCode !== 0) {
    if (options.platform === "win32") {
      const aside = `${execPath}.old`;
      try {
        await fs.promises.rm(execPath, { force: true });
        await fs.promises.rename(aside, execPath);
      } catch (e) {
        console.error(chalk.red(errorMessage(e)));
      }
    }
    console.error(
      chalk.red(t("The upgraded executable failed to run: {{path}}", { path: execPath }))
    );
    return 1;
  }
  if (options.platform === "win32") {
    await fs.promises.rm(`${execPath}.old`, { force: true });
  }
  console.log(t("Replaced {{path}}", { path: execPath }));
  return 0;
}

function refuseKind(kind: InstallKind): string | null {
  switch (kind.kind) {
    case "source":
      return t("This is a source checkout of ai-i18n-tools. Upgrade it with git.");
    case "ephemeral":
      return t(
        "Install ai-i18n-tools in a project, globally, or as a standalone executable before upgrading."
      );
    case "ambiguous":
      return t(
        "More than one workspace package depends on ai-i18n-tools. Run the command from that package."
      );
    case "project":
    case "global":
    case "sea":
      return null;
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export async function runUpgrade(options: RunUpgradeOptions): Promise<number> {
  let kind: InstallKind;
  try {
    kind = classifyInstall({
      scriptPath: options.scriptPath,
      cwd: options.cwd,
      sea: options.sea,
      execPath: options.execPath,
      ...(options.userAgent !== undefined ? { userAgent: options.userAgent } : {}),
    });
  } catch (e) {
    console.error(
      chalk.red(
        t("Could not resolve the running install: {{message}}", { message: errorMessage(e) })
      )
    );
    return 1;
  }

  const refused = refuseKind(kind);
  if (refused) {
    console.error(chalk.red(refused));
    return 1;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const remote =
    kind.kind === "sea" ? await fetchGithubLatest(fetchImpl) : await fetchNpmLatest(fetchImpl);
  if (remote.status !== "ok") {
    console.error(chalk.red(remote.message));
    return 1;
  }

  const compared = compareRelease(options.installedVersion, remote.version);
  if (compared === null) {
    console.error(
      chalk.red(
        t("Could not compare installed version {{installed}} with {{tag}}", {
          installed: options.installedVersion,
          tag: remote.version,
        })
      )
    );
    return 1;
  }
  if (compared === 0) {
    console.log(
      t("Already on the latest version {{version}}", { version: options.installedVersion })
    );
    return 0;
  }
  if (compared > 0) {
    console.log(
      t("installed {{installed}} is newer than the latest release {{tag}}", {
        installed: options.installedVersion,
        tag: remote.version,
      })
    );
    return 0;
  }

  console.log(
    t("Upgrade available: {{installed}} → {{latest}}", {
      installed: options.installedVersion,
      latest: remote.version,
    })
  );
  const target = describeTarget(kind);
  if (target) {
    console.log(target);
  }

  if (kind.kind === "sea" && binaryAssetBaseName(options.platform, options.arch) === null) {
    console.error(
      chalk.red(
        t("Unsupported platform {{platform}} {{arch}}", {
          platform: options.platform,
          arch: options.arch,
        })
      )
    );
    return 1;
  }
  if (kind.kind === "project") {
    const preview = rewriteManifestSource(
      fs.readFileSync(kind.manifestPath, "utf8"),
      remote.version
    );
    if (preview.status !== "ok") {
      if (preview.status === "unrewritable") {
        console.error(
          chalk.red(
            t("Dependency specifier {{specifier}} cannot be rewritten", {
              specifier: preview.specifier,
            })
          )
        );
      } else {
        console.error(
          chalk.red(t("{{path}} does not depend on ai-i18n-tools", { path: kind.manifestPath }))
        );
      }
      return 1;
    }
  }

  const answer = await confirmUpgrade(options);
  if (answer === "noninteractive") {
    console.error(chalk.red(t("Pass --yes to upgrade when stdin is not a terminal")));
    return 1;
  }
  if (answer === "no") {
    console.log(t("Upgrade cancelled"));
    return 0;
  }

  const spawnImpl = options.spawnImpl ?? defaultSpawn;
  switch (kind.kind) {
    case "project":
      return upgradeProject(kind, remote.version, options, spawnImpl);
    case "global":
      return upgradeGlobal(kind, remote.version, options, spawnImpl);
    case "sea":
      return upgradeBinary(kind.execPath, remote, options, fetchImpl, spawnImpl);
    case "source":
    case "ephemeral":
    case "ambiguous":
      return 1;
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}
