#!/usr/bin/env node
/**
 * Build a Node.js Single Executable for the current platform.
 *
 * Pipeline: esbuild (CJS) → node --experimental-sea-config → postject.
 * Public binaries are not notarized or Authenticode-signed. macOS builds
 * receive an ad-hoc signature so the injected blob can run locally.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { inject } from "postject";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist-sea");
const SENTINEL_FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(abs));
    } else if (entry.isFile()) {
      out.push(abs);
    }
  }
  return out;
}

function addTree(assets, keyPrefix, dir) {
  for (const abs of walkFiles(dir)) {
    const rel = path.relative(dir, abs).split(path.sep).join("/");
    const key = `${keyPrefix}/${rel}`;
    assets[key] = path.relative(root, abs).split(path.sep).join("/");
  }
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", ...options });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited ${result.status}`);
  }
}

function binaryName() {
  const platform =
    process.platform === "linux"
      ? "linux"
      : process.platform === "darwin"
        ? "macos"
        : process.platform === "win32"
          ? "win"
          : process.platform;
  const arch = process.arch === "x64" ? "x64" : process.arch;
  const ext = process.platform === "win32" ? ".exe" : "";
  return `ai-i18n-tools-${platform}-${arch}${ext}`;
}

function smoke(binary, args, cwd) {
  const result = spawnSync(binary, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    throw new Error(`${path.basename(binary)} ${args.join(" ")} failed:\n${detail}`);
  }
  return result.stdout ?? "";
}

const buildInfo = spawnSync(process.execPath, ["scripts/write-build-info.mjs"], {
  cwd: root,
  stdio: "inherit",
});
if (buildInfo.status !== 0) {
  process.exit(buildInfo.status ?? 1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["src/cli/index.ts"],
  outfile: "dist-sea/cli.cjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["node:*"],
  banner: {
    js: 'const __sea_import_meta_url = require("node:url").pathToFileURL(__filename).href;',
  },
  define: {
    "import.meta.url": "__sea_import_meta_url",
  },
  logLevel: "info",
});

const assets = {
  "data/ui-languages-complete.json": "data/ui-languages-complete.json",
};
addTree(assets, "i18n/locales", path.join(root, "src", "i18n", "locales"));
addTree(assets, "dashboard-app", path.join(root, "src", "dashboard-app"));
addTree(assets, "html-runtime", path.join(root, "src", "html-runtime"));

const seaConfig = {
  main: "dist-sea/cli.cjs",
  output: "dist-sea/sea-prep.blob",
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
  assets,
};
fs.writeFileSync(path.join(outDir, "sea-config.json"), `${JSON.stringify(seaConfig, null, 2)}\n`);

run(process.execPath, ["--experimental-sea-config", "dist-sea/sea-config.json"]);

const binary = path.join(outDir, binaryName());
fs.copyFileSync(process.execPath, binary);
if (process.platform !== "win32") {
  fs.chmodSync(binary, 0o755);
}
if (process.platform === "darwin") {
  run("codesign", ["--remove-signature", binary]);
}

const blob = fs.readFileSync(path.join(outDir, "sea-prep.blob"));
await inject(binary, "NODE_SEA_BLOB", blob, {
  sentinelFuse: SENTINEL_FUSE,
  ...(process.platform === "darwin" ? { machoSegmentName: "NODE_SEA" } : {}),
});

if (process.platform === "darwin") {
  run("codesign", ["--sign", "-", binary]);
}

const version = smoke(binary, ["--version"], root).trim();
if (!version) {
  throw new Error("binary --version printed nothing");
}
smoke(binary, ["list-languages"], root);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-sea-"));
try {
  smoke(binary, ["init", "-t", "ui-python", "-o", "ai-i18n-tools.config.json"], temp);
  smoke(binary, ["status"], temp);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log(`SEA binary ready: ${path.relative(root, binary)}`);
console.log("This binary is not notarized or Authenticode-signed.");
