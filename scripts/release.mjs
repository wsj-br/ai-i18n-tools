#!/usr/bin/env node
/**
 * Creates a GitHub release from local CLI using:
 * - tag/title: v<package.json version>
 * - notes file: release-notes/RELEASE_NOTES_<version>.md
 *
 * If the tag (or a GitHub release for it) already exists, it is removed and
 * the tag is recreated at the current HEAD, then pushed — so you can fix a
 * mistaken tag or re-run the release after new commits.
 *
 * Usage:
 *   node scripts/release.mjs
 *   node scripts/release.mjs --dry-run
 *   node scripts/release.mjs --verify-clean=false
 *   pnpm release:github
 *   pnpm release:github:dry
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let verifyClean = true;
let dryRun = false;

function printHelp() {
  console.log(`Usage: node scripts/release.mjs [--dry-run] [--verify-clean=true|false]

Options:
  --dry-run            Validate and print planned steps; no deletes, tag, push, or release.
  --verify-clean=true  Require clean git working tree (default).
  --verify-clean=false Skip clean-tree check.

If tag v<version> or a GitHub release for it already exists, they are removed
and the tag is recreated at HEAD, then pushed to origin.`);
}

for (const arg of process.argv.slice(2)) {
  switch (arg) {
    case "--verify-clean=false":
      verifyClean = false;
      break;
    case "--verify-clean=true":
      verifyClean = true;
      break;
    case "--dry-run":
      dryRun = true;
      break;
    case "-h":
    case "--help":
      printHelp();
      process.exit(0);
      break;
    default:
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
  }
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

/**
 * Run a command. Uses shell on Windows so `gh` / `git` resolve as `.cmd` shims.
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function run(command, args, options = {}) {
  const { inherit = false, allowFail = false } = options;
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    shell: process.platform === "win32",
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`failed to start ${command}: ${result.error.message}`);
  }

  const status = result.status ?? 1;
  if (status !== 0 && !allowFail) {
    const detail = (result.stderr || result.stdout || "").trim();
    if (detail && !inherit) {
      console.error(detail);
    }
    process.exit(status);
  }

  return {
    status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function requireCmd(command) {
  const result =
    process.platform === "win32"
      ? spawnSync("where", [command], {
          cwd: root,
          env: process.env,
          shell: true,
          stdio: "ignore",
        })
      : spawnSync("sh", ["-c", `command -v -- ${JSON.stringify(command)}`], {
          cwd: root,
          env: process.env,
          stdio: "ignore",
        });
  if (result.error || (result.status ?? 1) !== 0) {
    fail(`Missing required command: ${command}`);
  }
}

requireCmd("gh");
requireCmd("git");

{
  const inside = run("git", ["rev-parse", "--is-inside-work-tree"], { allowFail: true });
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    fail("Not inside a git repository.");
  }
}
{
  const auth = run("gh", ["auth", "status"], { allowFail: true });
  if (auth.status !== 0) {
    fail("GitHub CLI is not authenticated. Run: gh auth login");
  }
}

const packageJsonPath = path.join(root, "package.json");
if (!fs.existsSync(packageJsonPath)) {
  fail("package.json not found in repository root.");
}

let version;
try {
  version = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version;
} catch (error) {
  fail(`Could not read package.json version: ${error.message}`);
}
if (!version || typeof version !== "string") {
  fail("Could not read package.json version.");
}

const tag = `v${version}`;
const notesFile = `release-notes/RELEASE_NOTES_${version}.md`;
const notesPath = path.join(root, "release-notes", `RELEASE_NOTES_${version}.md`);

if (!fs.existsSync(notesPath)) {
  fail(`Release notes file not found: ${notesFile}`);
}

if (verifyClean) {
  const status = run("git", ["status", "--porcelain"]);
  if (status.stdout.trim()) {
    fail("Working tree is not clean. Commit/stash changes or run with --verify-clean=false");
  }
}

{
  const remote = run("git", ["remote", "get-url", "origin"], { allowFail: true });
  if (remote.status !== 0) {
    fail("Remote 'origin' not configured.");
  }
}

const headCommit = run("git", ["rev-parse", "HEAD"]).stdout.trim();

function remoteTagExists() {
  const result = run("git", ["ls-remote", "origin", `refs/tags/${tag}`], { allowFail: true });
  return result.status === 0 && result.stdout.trim().length > 0;
}

function localTagExists() {
  const result = run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], {
    allowFail: true,
  });
  return result.status === 0;
}

function releaseExists() {
  const result = run("gh", ["release", "view", tag], { allowFail: true });
  return result.status === 0;
}

function recreateTagAtHead() {
  if (dryRun) {
    console.log(`[dry-run] HEAD commit: ${headCommit}`);
    if (releaseExists()) {
      console.log(`[dry-run] Would delete GitHub release: ${tag}`);
    }
    if (remoteTagExists()) {
      console.log(`[dry-run] Would delete remote tag: origin ${tag}`);
    }
    if (localTagExists()) {
      console.log(`[dry-run] Would delete local tag: ${tag}`);
    }
    console.log(`[dry-run] Would create annotated tag ${tag} at HEAD and push to origin.`);
    return;
  }

  if (releaseExists()) {
    console.log(`Deleting existing GitHub release ${tag} (and its tag on the remote)...`);
    run("gh", ["release", "delete", tag, "--yes", "--cleanup-tag"], { inherit: true });
  } else if (remoteTagExists()) {
    console.log(`Deleting remote tag ${tag}...`);
    run("git", ["push", "origin", `:refs/tags/${tag}`], { inherit: true });
  }

  if (localTagExists()) {
    console.log(`Deleting local tag ${tag}...`);
    run("git", ["tag", "-d", tag], { inherit: true });
  }

  console.log(`Creating annotated tag ${tag} at HEAD (${headCommit})...`);
  run("git", ["tag", "-a", tag, "-m", `Release ${tag}`, "HEAD"], { inherit: true });

  console.log(`Pushing tag ${tag} to origin...`);
  run("git", ["push", "origin", `refs/tags/${tag}`], { inherit: true });
}

recreateTagAtHead();

const createArgs = ["release", "create", tag, "--title", tag, "--notes-file", notesFile];

console.log("Release inputs:");
console.log(`  Tag:        ${tag}`);
console.log(`  Title:      ${tag}`);
console.log(`  Notes file: ${notesFile}`);

if (dryRun) {
  console.log("[dry-run] Would run:");
  console.log(`  gh ${createArgs.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
  process.exit(0);
}

run("gh", createArgs, { inherit: true });
console.log(`Release created successfully: ${tag}`);
console.log("");
console.log("See the progress at the github repository https://github.com/wsj-br/ai-i18n-tools");
console.log("");
