/**
 * Parse and rewrite Python example requirement floors.
 *
 * examples/python-* declare minimums (`streamlit>=1.35.0`) in requirements.txt
 * and the same spec in pyproject.toml. `pip install` already resolves the
 * newest release that satisfies the floor, so "keeping them updated" means
 * raising that floor to the version a fresh install just verified.
 */

import fs from "node:fs";
import path from "node:path";

const REQUIREMENT_RE =
  /^([A-Za-z0-9][A-Za-z0-9._-]*)\s*(>=|==|~=)\s*([0-9][^\s#]*?)\s*(?:#.*)?$/;

const STABLE_RE = /^(\d+(?:\.\d+){1,3})(?:\.post(\d+))?$/;

/**
 * @param {string} line
 * @returns {{ name: string, operator: string, version: string } | null}
 */
export function parseRequirementLine(line) {
  const match = REQUIREMENT_RE.exec(line.trim());
  if (!match?.[1] || !match[2] || !match[3]) {
    return null;
  }
  return { name: match[1], operator: match[2], version: match[3] };
}

/**
 * @param {string} text
 * @returns {{ name: string, operator: string, version: string }[]}
 */
export function parseRequirementsText(text) {
  const packages = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const parsed = parseRequirementLine(trimmed);
    if (parsed) {
      packages.push(parsed);
    }
  }
  return packages;
}

/**
 * @param {string} text
 * @returns {{ name: string, operator: string, version: string }[]}
 */
export function parsePyprojectDependencies(text) {
  const match = text.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
  if (!match?.[1]) {
    return [];
  }
  const packages = [];
  for (const quoted of match[1].matchAll(/"([^"]+)"|'([^']+)'/g)) {
    const spec = quoted[1] ?? quoted[2];
    if (!spec) {
      continue;
    }
    const parsed = parseRequirementLine(spec);
    if (parsed) {
      packages.push(parsed);
    }
  }
  return packages;
}

/**
 * Numeric release plus an optional PEP 440 post segment.
 * Pre-releases (`rc`, `a`, `b`, `dev`) return null.
 *
 * @param {string} version
 * @returns {number[] | null}
 */
export function parseStableVersion(version) {
  const match = STABLE_RE.exec(version);
  if (!match?.[1]) {
    return null;
  }
  const parts = match[1].split(".").map((part) => Number(part));
  while (parts.length < 4) {
    parts.push(0);
  }
  parts.push(match[2] == null ? 0 : Number(match[2]));
  return parts;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1 | null}
 */
export function compareVersions(a, b) {
  const left = parseStableVersion(a);
  const right = parseStableVersion(b);
  if (!left || !right) {
    return null;
  }
  for (let i = 0; i < left.length; i++) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (l !== r) {
      return l > r ? 1 : -1;
    }
  }
  return 0;
}

/**
 * @param {{ name: string, version: string }[]} declared
 * @param {Readonly<Record<string, string>>} targets lower-case distribution name → version to record
 * @returns {{ name: string, from: string, to: string }[]}
 */
export function floorsToRecord(declared, targets) {
  const changes = [];
  for (const pkg of declared) {
    const next = targets[pkg.name.toLowerCase()];
    if (!next || next === pkg.version || compareVersions(next, pkg.version) === null) {
      continue;
    }
    changes.push({ name: pkg.name, from: pkg.version, to: next });
  }
  return changes;
}

/**
 * Lower bound of a `requires-python` specifier. `>=3.10` yields `3.10`.
 *
 * @param {string | null | undefined} requiresPython
 * @returns {string | null}
 */
export function declaredMinimumPython(requiresPython) {
  const match = />=\s*(\d+(?:\.\d+)*)/.exec(requiresPython ?? "");
  return match?.[1] ?? null;
}

/**
 * @param {string} pyprojectText
 * @returns {string | null}
 */
export function declaredMinimumPythonFromPyproject(pyprojectText) {
  const match = pyprojectText.match(/requires-python\s*=\s*"([^"]+)"/);
  return declaredMinimumPython(match?.[1]);
}

/**
 * True when `version` (for example `3.10`) satisfies a PyPI `requires_python`
 * specifier. An empty specifier matches. Specifiers other than the common
 * comparison operators do not match, so those releases are left out.
 *
 * @param {string | null | undefined} requiresPython
 * @param {string} version
 * @returns {boolean}
 */
export function pythonSatisfies(requiresPython, version) {
  const spec = (requiresPython ?? "").trim();
  if (!spec) {
    return true;
  }
  if (!parseStableVersion(version)) {
    return false;
  }
  for (const clause of spec.split(",")) {
    const trimmed = clause.trim();
    if (!trimmed) {
      continue;
    }
    const match = /^(>=|<=|!=|==|>|<)\s*(\d+(?:\.\d+)*)$/.exec(trimmed);
    if (!match?.[1] || !match[2] || !parseStableVersion(match[2])) {
      return false;
    }
    const order = compareVersions(version, match[2]);
    if (order === null || !compareHolds(match[1], order)) {
      return false;
    }
  }
  return true;
}

/**
 * Newest stable, non-yanked release whose `requires_python` admits `minPython`.
 * `releases` is the PyPI JSON `releases` object.
 *
 * @param {Readonly<Record<string, readonly { yanked?: boolean, requires_python?: string | null, packagetype?: string }[]>>} releases
 * @param {string} minPython
 * @returns {string | null}
 */
export function newestCompatibleRelease(releases, minPython) {
  let best = null;
  for (const [version, files] of Object.entries(releases)) {
    if (!parseStableVersion(version)) {
      continue;
    }
    const live = (files ?? []).filter((file) => file && !file.yanked);
    if (live.length === 0) {
      continue;
    }
    const wheel = live.find((file) => file.packagetype === "bdist_wheel" && file.requires_python);
    const marked = live.find((file) => file.requires_python);
    const spec = wheel?.requires_python ?? marked?.requires_python ?? "";
    if (!pythonSatisfies(spec, minPython)) {
      continue;
    }
    if (!best || compareVersions(version, best) === 1) {
      best = version;
    }
  }
  return best;
}

/**
 * @param {string} operator
 * @param {-1 | 0 | 1} order result of compareVersions(actual, bound)
 * @returns {boolean}
 */
function compareHolds(operator, order) {
  switch (operator) {
    case ">=":
      return order >= 0;
    case ">":
      return order > 0;
    case "<=":
      return order <= 0;
    case "<":
      return order < 0;
    case "==":
      return order === 0;
    case "!=":
      return order !== 0;
    default: {
      const unexpected = operator;
      throw new Error(`unexpected operator ${unexpected}`);
    }
  }
}

/**
 * @param {string} text
 * @param {{ name: string, from: string, to: string }[]} bumps
 * @returns {string}
 */
export function rewriteRequirementsText(text, bumps) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const endsWithNl = text.endsWith("\n");
  const lines = text.split(/\r?\n/);
  if (endsWithNl) {
    lines.pop();
  }
  const next = lines.map((line) => rewriteRequirementLine(line, bumps));
  return next.join(eol) + (endsWithNl ? eol : "");
}

/**
 * @param {string} text
 * @param {{ name: string, from: string, to: string }[]} bumps
 * @returns {string}
 */
export function rewritePyprojectText(text, bumps) {
  return text.replace(/dependencies\s*=\s*\[[\s\S]*?\]/, (block) => {
    let next = block;
    for (const bump of bumps) {
      const pattern = new RegExp(
        `(["'])${escapeRegExp(bump.name)}\\s*(>=|==|~=)\\s*${escapeRegExp(bump.from)}\\1`,
        "g",
      );
      next = next.replace(pattern, `$1${bump.name}$2${bump.to}$1`);
    }
    return next;
  });
}

/**
 * Starlette's TestClient imports httpx. The FastAPI example installs it in CI
 * and does not declare it as a runtime dependency.
 *
 * @param {string} smokeSource
 * @param {readonly string[]} declaredNames
 * @returns {string[]}
 */
export function extraVerifyPackages(smokeSource, declaredNames) {
  if (!/\bTestClient\b|\bhttpx\b/.test(smokeSource)) {
    return [];
  }
  const declared = new Set(declaredNames.map((name) => name.toLowerCase()));
  return declared.has("httpx") ? [] : ["httpx"];
}

/**
 * @param {string} repoRoot
 * @returns {{
 *   name: string,
 *   dir: string,
 *   requirementsPath: string,
 *   pyprojectPath: string | null,
 *   packages: { name: string, operator: string, version: string }[],
 *   pyprojectPackages: { name: string, operator: string, version: string }[],
 *   smokePath: string | null,
 * }[]}
 */
export function discoverPythonExamples(repoRoot) {
  const examplesDir = path.join(repoRoot, "examples");
  if (!fs.existsSync(examplesDir)) {
    return [];
  }
  const names = fs
    .readdirSync(examplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("python-"))
    .map((entry) => entry.name)
    .sort();

  const found = [];
  for (const name of names) {
    const dir = path.join(examplesDir, name);
    const requirementsPath = path.join(dir, "requirements.txt");
    if (!fs.existsSync(requirementsPath)) {
      continue;
    }
    const requirementsText = fs.readFileSync(requirementsPath, "utf8");
    const pyprojectPath = path.join(dir, "pyproject.toml");
    const hasPyproject = fs.existsSync(pyprojectPath);
    const pyprojectText = hasPyproject ? fs.readFileSync(pyprojectPath, "utf8") : "";
    const smokePath = path.join(dir, "smoke_framework.py");
    found.push({
      name,
      dir,
      requirementsPath,
      pyprojectPath: hasPyproject ? pyprojectPath : null,
      packages: parseRequirementsText(requirementsText),
      pyprojectPackages: hasPyproject ? parsePyprojectDependencies(pyprojectText) : [],
      smokePath: fs.existsSync(smokePath) ? smokePath : null,
    });
  }
  return found;
}

/**
 * @param {string} line
 * @param {{ name: string, from: string, to: string }[]} bumps
 * @returns {string}
 */
function rewriteRequirementLine(line, bumps) {
  const parsed = parseRequirementLine(line);
  if (!parsed) {
    return line;
  }
  const bump = bumps.find((item) => item.name.toLowerCase() === parsed.name.toLowerCase());
  if (!bump || bump.from !== parsed.version) {
    return line;
  }
  const pattern = new RegExp(
    `^(${escapeRegExp(parsed.name)}\\s*(?:>=|==|~=)\\s*)${escapeRegExp(parsed.version)}`,
  );
  return line.replace(pattern, `$1${bump.to}`);
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
