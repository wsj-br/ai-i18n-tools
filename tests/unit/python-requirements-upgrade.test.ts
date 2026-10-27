import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compareVersions,
  discoverPythonExamples,
  extraVerifyPackages,
  declaredMinimumPythonFromPyproject,
  floorsToRecord,
  newestCompatibleRelease,
  parsePyprojectDependencies,
  pythonSatisfies,
  parseRequirementsText,
  rewritePyprojectText,
  rewriteRequirementsText,
} from "../../scripts/lib/python-requirements.mjs";
import { parseArgs } from "../../scripts/upgrade-python-requirements.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("Python requirement floors", () => {
  it("parses requirement lines and ignores comments", () => {
    const parsed = parseRequirementsText(
      "# Standard library only.\nstreamlit>=1.35.0\n\nfastapi>=0.115.0  # web\n"
    );
    expect(parsed).toEqual([
      { name: "streamlit", operator: ">=", version: "1.35.0" },
      { name: "fastapi", operator: ">=", version: "0.115.0" },
    ]);
  });

  it("parses a one-line pyproject dependencies array", () => {
    const parsed = parsePyprojectDependencies(
      'dependencies = ["fastapi>=0.115.0", "uvicorn>=0.30.0"]\n'
    );
    expect(parsed.map((pkg) => `${pkg.name}${pkg.operator}${pkg.version}`)).toEqual([
      "fastapi>=0.115.0",
      "uvicorn>=0.30.0",
    ]);
  });

  it("compares stable versions and rejects pre-releases", () => {
    expect(compareVersions("1.35.0", "1.40.2")).toBe(-1);
    expect(compareVersions("3.1.2", "3.1.2")).toBe(0);
    expect(compareVersions("1.2.3.post1", "1.2.3")).toBe(1);
    expect(compareVersions("1.0.0rc1", "1.0.0")).toBeNull();
  });

  it("records a different compatible release, including one older than an unsatisfiable floor", () => {
    expect(
      floorsToRecord(
        [
          { name: "flask", version: "3.0.0" },
          { name: "uvicorn", version: "0.30.0" },
        ],
        { flask: "3.1.2", uvicorn: "0.30.0" }
      )
    ).toEqual([{ name: "flask", from: "3.0.0", to: "3.1.2" }]);
    expect(
      floorsToRecord([{ name: "streamlit", version: "1.66.1" }], { streamlit: "1.65.0" })
    ).toEqual([{ name: "streamlit", from: "1.66.1", to: "1.65.0" }]);
  });

  it("picks the newest release that still installs on the example's minimum Python", () => {
    expect(declaredMinimumPythonFromPyproject('requires-python = ">=3.10"\n')).toBe("3.10");
    expect(pythonSatisfies(">=3.11", "3.10")).toBe(false);
    expect(pythonSatisfies(">=3.10", "3.10")).toBe(true);
    expect(pythonSatisfies(">=3.9,<3.11", "3.10")).toBe(true);
    const releases = {
      "1.66.1": [{ yanked: false, packagetype: "bdist_wheel", requires_python: ">=3.11" }],
      "1.65.0": [{ yanked: false, packagetype: "bdist_wheel", requires_python: ">=3.10" }],
      "1.66.0rc1": [{ yanked: false, packagetype: "bdist_wheel", requires_python: ">=3.10" }],
      "1.64.0": [{ yanked: true, packagetype: "bdist_wheel", requires_python: ">=3.10" }],
    };
    expect(newestCompatibleRelease(releases, "3.10")).toBe("1.65.0");
  });

  it("rewrites requirement and pyproject floors without touching comments", () => {
    const requirements = rewriteRequirementsText("# keep\nflask>=3.0.0\nuvicorn>=0.30.0\n", [
      { name: "flask", from: "3.0.0", to: "3.1.2" },
    ]);
    expect(requirements).toBe("# keep\nflask>=3.1.2\nuvicorn>=0.30.0\n");

    const pyproject = rewritePyprojectText(
      'requires-python = ">=3.10"\ndependencies = ["flask>=3.0.0"]\n',
      [{ name: "flask", from: "3.0.0", to: "3.1.2" }]
    );
    expect(pyproject).toBe('requires-python = ">=3.10"\ndependencies = ["flask>=3.1.2"]\n');
  });

  it("adds httpx for TestClient smokes that do not already depend on it", () => {
    expect(extraVerifyPackages("from fastapi.testclient import TestClient\n", ["fastapi"])).toEqual(
      ["httpx"]
    );
    expect(extraVerifyPackages("from flask import Flask\n", ["flask"])).toEqual([]);
    expect(extraVerifyPackages("import httpx\n", ["httpx"])).toEqual([]);
  });

  it("keeps each Python example's requirements.txt aligned with pyproject.toml", () => {
    const examples = discoverPythonExamples(root);
    expect(examples.map((example) => example.name)).toEqual([
      "python-fastapi",
      "python-flask",
      "python-gettext",
      "python-streamlit",
    ]);
    for (const example of examples) {
      expect(
        example.pyprojectPackages.map((pkg) => `${pkg.name}${pkg.operator}${pkg.version}`)
      ).toEqual(example.packages.map((pkg) => `${pkg.name}${pkg.operator}${pkg.version}`));
    }
    const gettext = examples.find((example) => example.name === "python-gettext");
    expect(gettext?.packages).toEqual([]);
    expect(gettext?.smokePath).toBeNull();
  });

  it("parses the upgrade CLI flags", () => {
    expect(parseArgs(["--apply", "--repo-root", "/tmp/repo"])).toEqual({
      apply: true,
      repoRoot: "/tmp/repo",
    });
  });
});
