#!/usr/bin/env node
/**
 * Opt-in .NET helper tests. Exits 0 when `dotnet` is not on PATH.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const probe = spawnSync("dotnet", ["--version"], { encoding: "utf8" });
if (probe.status !== 0) {
  console.log("dotnet is not on PATH; skipping pnpm test:dotnet");
  process.exit(0);
}

for (const project of ["examples/dotnet-console", "examples/dotnet-resx"]) {
  const run = spawnSync("dotnet", ["test", project, "--nologo"], {
    cwd: root,
    stdio: "inherit",
  });
  if ((run.status ?? 1) !== 0) {
    process.exit(run.status ?? 1);
  }
}
