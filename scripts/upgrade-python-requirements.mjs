/**
 * Raise examples/python-* requirement floors to the newest PyPI release that
 * still supports the example's requires-python, after smoke_framework.py
 * passes against that exact version.
 *
 *   node scripts/upgrade-python-requirements.mjs --apply --repo-root .
 *
 * Without --apply, prints the floors a fresh install would record and does
 * not write. UPGRADE_SKIP_PYTHON=1 exits 0 immediately. UPGRADE_PYTHON
 * selects the interpreter used to create the venv (default: python3, then
 * python).
 *
 * Exit 0 when every example with third-party requirements passed smoke (floors
 * may already match the installed version). Exit 1 when smoke fails, Python
 * is missing, or a requirements file could not be installed. Examples with
 * no third-party requirements (python-gettext) are skipped.
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  declaredMinimumPythonFromPyproject,
  discoverPythonExamples,
  extraVerifyPackages,
  floorsToRecord,
  newestCompatibleRelease,
  rewritePyprojectText,
  rewriteRequirementsText,
} from "./lib/python-requirements.mjs";

const PIP_TIMEOUT_MS = 10 * 60 * 1000;
const SMOKE_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * @param {string[]} argv
 * @returns {{ apply: boolean, repoRoot: string }}
 */
export function parseArgs(argv) {
  let apply = false;
  let repoRoot = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--repo-root") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("--repo-root needs a path");
      }
      repoRoot = next;
      i++;
      continue;
    }
    throw new Error(`unknown argument: ${arg ?? ""}`);
  }
  return { apply, repoRoot: path.resolve(repoRoot) };
}

/**
 * @returns {string | null}
 */
export function resolveSystemPython() {
  const fromEnv = process.env.UPGRADE_PYTHON;
  if (fromEnv) {
    return fromEnv;
  }
  for (const bin of ["python3", "python"]) {
    const result = spawnSync(bin, ["--version"], { encoding: "utf8" });
    if (result.status === 0) {
      return bin;
    }
  }
  return null;
}

/**
 * @param {string} venvDir
 * @returns {string}
 */
function venvPython(venvDir) {
  return process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd: string, timeout: number, silent?: boolean }} options
 * @returns {Promise<string>}
 */
function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: ["ignore", "pipe", "pipe"] });
    let combined = "";
    let settled = false;
    const finish = (fn) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const onData = (chunk) => {
      const text = String(chunk);
      combined += text;
      if (!options.silent) {
        process.stdout.write(text);
      }
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(() => {
        reject(new Error(`${command} ${args.join(" ")} timed out after ${options.timeout}ms`));
      });
    }, options.timeout);
    child.on("error", (error) => {
      finish(() => {
        reject(error);
      });
    });
    child.on("close", (code) => {
      finish(() => {
        if (code === 0) {
          resolve(combined);
          return;
        }
        reject(new Error(`${command} ${args.join(" ")} exited ${code ?? "null"}`));
      });
    });
  });
}

/**
 * @param {string} python
 * @param {string[]} names
 * @param {string} cwd
 * @returns {Promise<Record<string, string>>}
 */
async function installedVersions(python, names, cwd) {
  if (names.length === 0) {
    return {};
  }
  const script = `
import importlib.metadata as metadata
import json, sys
names = json.loads(sys.argv[1])
found = {}
for name in names:
    try:
        found[name.lower()] = metadata.version(name)
    except metadata.PackageNotFoundError:
        pass
print(json.dumps(found))
`;
  const output = await run(python, ["-c", script, JSON.stringify(names)], {
    cwd,
    timeout: 30_000,
    silent: true,
  });
  const line = output
    .trim()
    .split(/\r?\n/)
    .find((row) => row.startsWith("{"));
  if (!line) {
    throw new Error("could not read installed distribution versions");
  }
  const parsed = JSON.parse(line);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("installed version report was not an object");
  }
  /** @type {Record<string, string>} */
  const versions = {};
  for (const [name, version] of Object.entries(parsed)) {
    if (typeof version === "string") {
      versions[name] = version;
    }
  }
  return versions;
}

/**
 * @param {string} name
 * @param {string} version
 * @returns {Promise<string[]>}
 */
async function osvIds(name, version) {
  const response = await fetch("https://api.osv.dev/v1/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      version,
      package: { name, ecosystem: "PyPI" },
    }),
  });
  if (!response.ok) {
    throw new Error(`OSV returned ${response.status} for ${name}@${version}`);
  }
  const body = await response.json();
  const vulns = body && Array.isArray(body.vulns) ? body.vulns : [];
  return vulns.flatMap((vuln) => (vuln && typeof vuln.id === "string" ? [vuln.id] : []));
}

/**
 * @param {string} label
 * @param {{ name: string, version: string }[]} packages
 * @param {Readonly<Record<string, string>>} installed
 */
async function reportAdvisories(label, packages, installed) {
  for (const pkg of packages) {
    const version = installed[pkg.name.toLowerCase()];
    if (!version) {
      continue;
    }
    try {
      const ids = await osvIds(pkg.name, version);
      if (ids.length > 0) {
        console.log(`[${label}] advisory: ${pkg.name}@${version} ${ids.join(", ")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[${label}] advisory check skipped for ${pkg.name}@${version}: ${message}`);
    }
  }
}

/**
 * @param {string} name
 * @param {string} minPython
 * @returns {Promise<string | null>}
 */
async function newestReleaseForPython(name, minPython) {
  const response = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
  if (!response.ok) {
    throw new Error(`PyPI returned ${response.status} for ${name}`);
  }
  const body = await response.json();
  const releases = body && body.releases && typeof body.releases === "object" ? body.releases : null;
  if (!releases || Array.isArray(releases)) {
    throw new Error(`PyPI JSON for ${name} has no releases object`);
  }
  return newestCompatibleRelease(releases, minPython);
}

/**
 * @param {ReturnType<typeof discoverPythonExamples>[number]} example
 * @param {string} systemPython
 * @param {boolean} apply
 * @returns {Promise<boolean>} false when smoke or install failed
 */
async function upgradeExample(example, systemPython, apply) {
  const label = `examples/${example.name}`;
  if (example.packages.length === 0 && example.pyprojectPackages.length === 0) {
    console.log(`[${label}] no third-party requirements`);
    return true;
  }
  if (!example.smokePath) {
    console.log(`[${label}] no smoke_framework.py; leaving requirement floors unchanged`);
    return false;
  }

  const smokeSource = fs.readFileSync(example.smokePath, "utf8");
  const extras = extraVerifyPackages(
    smokeSource,
    example.packages.map((pkg) => pkg.name),
  );
  const minPython = example.pyprojectPath
    ? declaredMinimumPythonFromPyproject(fs.readFileSync(example.pyprojectPath, "utf8"))
    : null;
  if (!minPython) {
    console.log(`[${label}] pyproject.toml has no requires-python >= floor; leaving requirements unchanged`);
    return false;
  }

  /** @type {Record<string, string>} */
  const targets = {};
  try {
    for (const pkg of example.packages) {
      const chosen = await newestReleaseForPython(pkg.name, minPython);
      if (!chosen) {
        console.log(`[${label}] no ${pkg.name} release supports Python >=${minPython}`);
        return false;
      }
      targets[pkg.name.toLowerCase()] = chosen;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[${label}] failed: ${message}`);
    return false;
  }

  const venvDir = fs.mkdtempSync(path.join(os.tmpdir(), `py-upgrade-${example.name}-`));
  try {
    const specs = example.packages.map((pkg) => `${pkg.name}==${targets[pkg.name.toLowerCase()]}`);
    console.log(
      `[${label}] creating a venv and installing ${specs.join(", ")} (Python >=${minPython})`,
    );
    await run(systemPython, ["-m", "venv", venvDir], { cwd: example.dir, timeout: PIP_TIMEOUT_MS });
    const python = venvPython(venvDir);
    await run(python, ["-m", "pip", "install", "--disable-pip-version-check", ...specs], {
      cwd: example.dir,
      timeout: PIP_TIMEOUT_MS,
    });
    if (extras.length > 0) {
      await run(python, ["-m", "pip", "install", "--disable-pip-version-check", ...extras], {
        cwd: example.dir,
        timeout: PIP_TIMEOUT_MS,
      });
    }
    console.log(`[${label}] smoke_framework.py`);
    await run(python, [example.smokePath], { cwd: example.dir, timeout: SMOKE_TIMEOUT_MS });

    const names = [
      ...example.packages.map((pkg) => pkg.name),
      ...example.pyprojectPackages.map((pkg) => pkg.name),
    ];
    const installed = await installedVersions(python, [...new Set(names)], example.dir);
    for (const pkg of example.packages) {
      const wanted = targets[pkg.name.toLowerCase()];
      if (installed[pkg.name.toLowerCase()] !== wanted) {
        console.log(
          `[${label}] ${pkg.name} installed ${installed[pkg.name.toLowerCase()] ?? "nothing"}, wanted ${wanted}`,
        );
        return false;
      }
    }
    const requirementBumps = floorsToRecord(example.packages, targets);
    const pyprojectBumps = floorsToRecord(example.pyprojectPackages, targets);

    const bumps = uniqueBumps([...requirementBumps, ...pyprojectBumps]);
    const support = `newest release that supports Python >=${minPython}`;
    if (bumps.length === 0) {
      console.log(`[${label}] floors already match the ${support}`);
    } else if (!apply) {
      for (const bump of bumps) {
        console.log(`[${label}] would set ${bump.name} ${bump.from} -> ${bump.to} (${support})`);
      }
    } else {
      if (requirementBumps.length > 0) {
        const text = fs.readFileSync(example.requirementsPath, "utf8");
        fs.writeFileSync(example.requirementsPath, rewriteRequirementsText(text, requirementBumps));
      }
      if (pyprojectBumps.length > 0 && example.pyprojectPath) {
        const text = fs.readFileSync(example.pyprojectPath, "utf8");
        fs.writeFileSync(example.pyprojectPath, rewritePyprojectText(text, pyprojectBumps));
      }
      for (const bump of bumps) {
        console.log(`[${label}] ${bump.name} ${bump.from} -> ${bump.to} (${support})`);
      }
    }

    await reportAdvisories(label, example.packages, installed);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[${label}] failed: ${message}`);
    return false;
  } finally {
    fs.rmSync(venvDir, { recursive: true, force: true });
  }
}

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function main(argv) {
  if (process.env.UPGRADE_SKIP_PYTHON) {
    console.log("Skipping Python example requirements (UPGRADE_SKIP_PYTHON=1).");
    return 0;
  }
  const { apply, repoRoot } = parseArgs(argv);
  const found = discoverPythonExamples(repoRoot);
  const examples = [];
  for (const example of found) {
    if (example.packages.length === 0 && example.pyprojectPackages.length === 0) {
      console.log(`[examples/${example.name}] no third-party requirements`);
      continue;
    }
    examples.push(example);
  }
  if (examples.length === 0) {
    return 0;
  }
  const systemPython = resolveSystemPython();
  if (!systemPython) {
    console.log("python3 not found; Python example requirement floors were left unchanged.");
    return 1;
  }
  let failed = false;
  for (const example of examples) {
    const ok = await upgradeExample(example, systemPython, apply);
    if (!ok) {
      failed = true;
    }
  }
  return failed ? 1 : 0;
}

/**
 * @param {{ name: string, from: string, to: string }[]} bumps
 * @returns {{ name: string, from: string, to: string }[]}
 */
function uniqueBumps(bumps) {
  /** @type {Map<string, { name: string, from: string, to: string }>} */
  const byName = new Map();
  for (const bump of bumps) {
    const key = `${bump.name.toLowerCase()}@${bump.from}->${bump.to}`;
    if (!byName.has(key)) {
      byName.set(key, bump);
    }
  }
  return [...byName.values()];
}

const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exit(code);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`error: ${message}`);
      process.exit(1);
    });
}
