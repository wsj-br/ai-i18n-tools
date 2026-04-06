#!/usr/bin/env node
/**
 * Smoke script: run `extract` then `translate --dry-run` using the built CLI from the repo root.
 * Usage (from repository root): npm run example:react-ui
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const cli = path.join(repoRoot, "dist/cli/index.js");

if (!fs.existsSync(cli)) {
  console.error("Missing dist/cli/index.js. From the repository root run: npm run build");
  process.exit(1);
}

function run(args) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0 && r.status !== null) {
    process.exit(r.status);
  }
}

run(["extract"]);
run(["translate", "--dry-run"]);
