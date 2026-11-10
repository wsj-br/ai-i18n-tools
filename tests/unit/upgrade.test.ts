import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  binaryAssetBaseName,
  classifyInstall,
  commandForPlatform,
  globalInstallArgs,
  parseSha256Sums,
  projectInstallArgs,
  releaseDownloadUrl,
  replaceExecutable,
  rewriteDependencySpecifier,
  rewriteManifestSource,
  runUpgrade,
  sha256Hex,
  type RunUpgradeOptions,
} from "../../src/cli/upgrade.js";

const dirs: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  dirs.length = 0;
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "upgrade-"));
  dirs.push(dir);
  return dir;
}

function write(file: string, contents: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function installScript(root: string, nestedPnpm = false): string {
  const script = nestedPnpm
    ? path.join(
        root,
        "node_modules",
        ".pnpm",
        "ai-i18n-tools@1.14.0",
        "node_modules",
        "ai-i18n-tools",
        "bin",
        "ai-i18n-tools.mjs"
      )
    : path.join(root, "node_modules", "ai-i18n-tools", "bin", "ai-i18n-tools.mjs");
  write(script, "#!/usr/bin/env node\n");
  write(
    path.join(path.dirname(script), "..", "package.json"),
    JSON.stringify({ name: "ai-i18n-tools", version: "1.14.0" })
  );
  return script;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function bytesResponse(bytes: Buffer, status = 200): Response {
  return new Response(new Uint8Array(bytes), { status });
}

describe("rewriteDependencySpecifier", () => {
  it("keeps the range operator and replaces the version", () => {
    expect(rewriteDependencySpecifier("^1.14.0", "1.15.0")).toBe("^1.15.0");
    expect(rewriteDependencySpecifier("~1.14.0", "1.15.0")).toBe("~1.15.0");
    expect(rewriteDependencySpecifier("1.14.0", "1.15.0")).toBe("1.15.0");
    expect(rewriteDependencySpecifier(">=1.14.0", "1.15.0")).toBe(">=1.15.0");
  });

  it("refuses specs the package manager must keep as they are", () => {
    expect(rewriteDependencySpecifier("workspace:*", "1.15.0")).toBeNull();
    expect(rewriteDependencySpecifier("file:../ai-i18n-tools", "1.15.0")).toBeNull();
    expect(rewriteDependencySpecifier("link:../ai-i18n-tools", "1.15.0")).toBeNull();
    expect(rewriteDependencySpecifier("latest", "1.15.0")).toBeNull();
    expect(rewriteDependencySpecifier("*", "1.15.0")).toBeNull();
    expect(
      rewriteDependencySpecifier("git+https://github.com/wsj-br/ai-i18n-tools.git", "1.15.0")
    ).toBeNull();
  });
});

describe("rewriteManifestSource", () => {
  it("rewrites dependency and devDependency entries without reformatting the file", () => {
    const raw = `{
  "name": "app",
  "dependencies": {
    "ai-i18n-tools": "^1.14.0"
  },
  "devDependencies": {
    "ai-i18n-tools": "~1.14.0",
    "zod": "^4.0.0"
  }
}
`;
    const result = rewriteManifestSource(raw, "1.15.0");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }
    expect(result.next).toBe(`{
  "name": "app",
  "dependencies": {
    "ai-i18n-tools": "^1.15.0"
  },
  "devDependencies": {
    "ai-i18n-tools": "~1.15.0",
    "zod": "^4.0.0"
  }
}
`);
  });

  it("refuses a workspace specifier", () => {
    const raw = JSON.stringify({ devDependencies: { "ai-i18n-tools": "workspace:*" } });
    expect(rewriteManifestSource(raw, "1.15.0")).toEqual({
      status: "unrewritable",
      specifier: "workspace:*",
    });
  });
});

describe("binary assets", () => {
  it("names the published archive for each supported platform", () => {
    expect(binaryAssetBaseName("linux", "x64")).toBe("ai-i18n-tools-linux-x64");
    expect(binaryAssetBaseName("linux", "arm64")).toBe("ai-i18n-tools-linux-arm64");
    expect(binaryAssetBaseName("darwin", "arm64")).toBe("ai-i18n-tools-macos-arm64");
    expect(binaryAssetBaseName("win32", "x64")).toBe("ai-i18n-tools-win-x64.exe");
    expect(binaryAssetBaseName("win32", "arm64")).toBeNull();
    expect(binaryAssetBaseName("linux", "ia32")).toBeNull();
  });

  it("builds a release download URL from the tag and file name", () => {
    expect(releaseDownloadUrl("v1.15.0", "SHA256SUMS.txt")).toBe(
      "https://github.com/wsj-br/ai-i18n-tools/releases/download/v1.15.0/SHA256SUMS.txt"
    );
    expect(releaseDownloadUrl("1.15.0", "ai-i18n-tools-linux-x64.gz")).toBe(
      "https://github.com/wsj-br/ai-i18n-tools/releases/download/v1.15.0/ai-i18n-tools-linux-x64.gz"
    );
  });

  it("reads the checksum for one archive", () => {
    const text = [
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  other.gz",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb  ai-i18n-tools-linux-x64.gz",
    ].join("\n");
    expect(parseSha256Sums(text, "ai-i18n-tools-linux-x64.gz")).toBe("b".repeat(64));
    expect(parseSha256Sums(text, "missing.gz")).toBeNull();
  });
});

describe("package manager commands", () => {
  it("selects the global and project install arguments", () => {
    expect(globalInstallArgs("npm", "1.15.0")).toEqual({
      cmd: "npm",
      args: ["install", "-g", "ai-i18n-tools@1.15.0"],
    });
    expect(globalInstallArgs("pnpm", "1.15.0").args).toEqual(["add", "-g", "ai-i18n-tools@1.15.0"]);
    expect(globalInstallArgs("yarn", "1.15.0").args).toEqual([
      "global",
      "add",
      "ai-i18n-tools@1.15.0",
    ]);
    expect(globalInstallArgs("bun", "1.15.0").args).toEqual(["add", "-g", "ai-i18n-tools@1.15.0"]);
    expect(projectInstallArgs("pnpm")).toEqual({ cmd: "pnpm", args: ["install"] });
    expect(commandForPlatform("npm", "win32")).toBe("npm.cmd");
    expect(commandForPlatform("npm", "linux")).toBe("npm");
  });
});

describe("classifyInstall", () => {
  it("selects a project dependency and the lockfile directory", () => {
    const root = tempDir();
    write(
      path.join(root, "package.json"),
      JSON.stringify({
        name: "app",
        packageManager: "pnpm@12.0.0",
        devDependencies: { "ai-i18n-tools": "^1.14.0" },
      })
    );
    write(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
    const script = installScript(root, true);
    const kind = classifyInstall({
      scriptPath: script,
      cwd: root,
      sea: false,
      execPath: script,
    });
    expect(kind).toMatchObject({
      kind: "project",
      manifestPath: path.join(root, "package.json"),
      installDir: root,
      manager: "pnpm",
      specifier: "^1.14.0",
    });
  });

  it("uses the lockfile when package.json has no packageManager field", () => {
    const root = tempDir();
    write(
      path.join(root, "package.json"),
      JSON.stringify({ dependencies: { "ai-i18n-tools": "1.14.0" } })
    );
    write(path.join(root, "package-lock.json"), "{}\n");
    const script = installScript(root);
    const kind = classifyInstall({ scriptPath: script, cwd: root, sea: false, execPath: script });
    expect(kind).toMatchObject({ kind: "project", manager: "npm", installDir: root });
  });

  it("finds the one workspace member that declares the dependency", () => {
    const root = tempDir();
    write(
      path.join(root, "package.json"),
      JSON.stringify({
        name: "mono",
        private: true,
        packageManager: "pnpm@12.0.0",
        workspaces: ["packages/*"],
      })
    );
    write(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
    const member = path.join(root, "packages", "app");
    write(
      path.join(member, "package.json"),
      JSON.stringify({ name: "app", devDependencies: { "ai-i18n-tools": "^1.2.3" } })
    );
    const script = installScript(root, true);
    const kind = classifyInstall({ scriptPath: script, cwd: root, sea: false, execPath: script });
    expect(kind).toMatchObject({
      kind: "project",
      manifestPath: path.join(member, "package.json"),
      installDir: root,
      manager: "pnpm",
      specifier: "^1.2.3",
    });
  });

  it("asks for the workspace package when more than one member depends on the tool", () => {
    const root = tempDir();
    write(
      path.join(root, "package.json"),
      JSON.stringify({ name: "mono", workspaces: ["packages/*"] })
    );
    for (const name of ["app", "web"]) {
      write(
        path.join(root, "packages", name, "package.json"),
        JSON.stringify({ name, devDependencies: { "ai-i18n-tools": "^1.2.3" } })
      );
    }
    const script = installScript(root, true);
    expect(
      classifyInstall({ scriptPath: script, cwd: root, sea: false, execPath: script }).kind
    ).toBe("ambiguous");
    const kind = classifyInstall({
      scriptPath: script,
      cwd: path.join(root, "packages", "web"),
      sea: false,
      execPath: script,
    });
    expect(kind).toMatchObject({
      manifestPath: path.join(root, "packages", "web", "package.json"),
    });
  });

  it("keeps a global npm install when the current directory also depends on the package", () => {
    const root = tempDir();
    const project = path.join(root, "project");
    write(
      path.join(project, "package.json"),
      JSON.stringify({ devDependencies: { "ai-i18n-tools": "^1.14.0" } })
    );
    const script = path.join(
      root,
      "prefix",
      "lib",
      "node_modules",
      "ai-i18n-tools",
      "bin",
      "ai-i18n-tools.mjs"
    );
    write(script, "");
    write(
      path.join(path.dirname(script), "..", "package.json"),
      JSON.stringify({ name: "ai-i18n-tools", version: "1.14.0" })
    );
    const kind = classifyInstall({
      scriptPath: script,
      cwd: project,
      sea: false,
      execPath: script,
      userAgent: "pnpm/9.0.0 npm/? node/v22.0.0",
    });
    expect(kind).toEqual({ kind: "global", manager: "npm" });
  });

  it("treats a pnpm global prefix as a global install", () => {
    const root = tempDir();
    const script = path.join(
      root,
      "pnpm",
      "global",
      "5",
      "node_modules",
      "ai-i18n-tools",
      "bin",
      "ai-i18n-tools.mjs"
    );
    write(script, "");
    write(
      path.join(root, "pnpm", "global", "5", "package.json"),
      JSON.stringify({
        dependencies: { "ai-i18n-tools": "1.14.0" },
      })
    );
    const kind = classifyInstall({ scriptPath: script, cwd: root, sea: false, execPath: script });
    expect(kind).toEqual({ kind: "global", manager: "pnpm" });
  });

  it("refuses a source checkout", () => {
    const root = tempDir();
    const script = path.join(root, "bin", "ai-i18n-tools.mjs");
    write(script, "");
    write(
      path.join(root, "package.json"),
      JSON.stringify({ name: "ai-i18n-tools", version: "1.14.0" })
    );
    expect(
      classifyInstall({ scriptPath: script, cwd: root, sea: false, execPath: script }).kind
    ).toBe("source");
  });

  it("refuses an npx cache", () => {
    const root = tempDir();
    const script = path.join(
      root,
      ".npm",
      "_npx",
      "hash",
      "node_modules",
      "ai-i18n-tools",
      "bin",
      "ai-i18n-tools.mjs"
    );
    write(script, "");
    write(
      path.join(root, ".npm", "_npx", "hash", "package.json"),
      JSON.stringify({ dependencies: { "ai-i18n-tools": "1.14.0" } })
    );
    expect(
      classifyInstall({ scriptPath: script, cwd: root, sea: false, execPath: script }).kind
    ).toBe("ephemeral");
  });

  it("reports a standalone executable without reading the script path", () => {
    expect(
      classifyInstall({
        scriptPath: "/missing",
        cwd: "/",
        sea: true,
        execPath: "/usr/local/bin/ai-i18n-tools",
      })
    ).toEqual({ kind: "sea", execPath: "/usr/local/bin/ai-i18n-tools" });
  });
});

describe("replaceExecutable", () => {
  it("renames a Windows executable aside before putting the new bytes in place", async () => {
    const root = tempDir();
    const execPath = path.join(root, "ai-i18n-tools.exe");
    fs.writeFileSync(execPath, "old");
    await replaceExecutable(execPath, Buffer.from("new"), "win32");
    expect(fs.readFileSync(execPath, "utf8")).toBe("new");
    expect(fs.readFileSync(`${execPath}.old`, "utf8")).toBe("old");
  });
});

describe("runUpgrade", () => {
  function npmFetch(version: string): typeof fetch {
    return async () => jsonResponse({ version });
  }

  function baseOptions(
    root: string,
    script: string,
    extra: Partial<RunUpgradeOptions> = {}
  ): RunUpgradeOptions {
    return {
      cwd: root,
      scriptPath: script,
      sea: false,
      execPath: script,
      platform: "linux",
      arch: "x64",
      installedVersion: "1.14.0",
      yes: false,
      stdinIsTTY: true,
      fetchImpl: npmFetch("1.15.0"),
      prompt: async () => "y",
      spawnImpl: async () => 0,
      ...extra,
    };
  }

  it("prints the current version when the install is already current", async () => {
    const root = tempDir();
    const script = installScript(root);
    write(
      path.join(root, "package.json"),
      JSON.stringify({ devDependencies: { "ai-i18n-tools": "^1.14.0" } })
    );
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message: unknown) => {
      logs.push(String(message));
    });
    const prompt = vi.fn(async () => "y");
    const code = await runUpgrade(
      baseOptions(root, script, {
        fetchImpl: npmFetch("1.14.0"),
        prompt,
        installedVersion: "1.14.0",
      })
    );
    expect(code).toBe(0);
    expect(prompt).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain("Already on the latest version 1.14.0");
  });

  it("does not prompt when the installed version is newer than the registry", async () => {
    const root = tempDir();
    const script = installScript(root);
    write(
      path.join(root, "package.json"),
      JSON.stringify({ devDependencies: { "ai-i18n-tools": "^1.16.0" } })
    );
    const prompt = vi.fn(async () => "y");
    const code = await runUpgrade(
      baseOptions(root, script, {
        fetchImpl: npmFetch("1.15.0"),
        prompt,
        installedVersion: "1.16.0",
      })
    );
    expect(code).toBe(0);
    expect(prompt).not.toHaveBeenCalled();
  });

  it("refuses a non-interactive terminal unless --yes is set", async () => {
    const root = tempDir();
    const script = installScript(root);
    const manifest = path.join(root, "package.json");
    const raw = JSON.stringify({ devDependencies: { "ai-i18n-tools": "^1.14.0" } }, null, 2);
    write(manifest, raw);
    const prompt = vi.fn(async () => "y");
    const spawnImpl = vi.fn(async () => 0);
    const code = await runUpgrade(
      baseOptions(root, script, { stdinIsTTY: false, yes: false, prompt, spawnImpl })
    );
    expect(code).toBe(1);
    expect(prompt).not.toHaveBeenCalled();
    expect(spawnImpl).not.toHaveBeenCalled();
    expect(fs.readFileSync(manifest, "utf8")).toBe(raw);
  });

  it("leaves the manifest unchanged when the answer is not y", async () => {
    const root = tempDir();
    const script = installScript(root);
    const manifest = path.join(root, "package.json");
    const raw = `{
  "devDependencies": {
    "ai-i18n-tools": "^1.14.0"
  }
}
`;
    write(manifest, raw);
    const spawnImpl = vi.fn(async () => 0);
    const code = await runUpgrade(
      baseOptions(root, script, { prompt: async () => "n", spawnImpl })
    );
    expect(code).toBe(0);
    expect(spawnImpl).not.toHaveBeenCalled();
    expect(fs.readFileSync(manifest, "utf8")).toBe(raw);
  });

  it("rewrites the project manifest and installs with the lockfile's package manager", async () => {
    const root = tempDir();
    const script = installScript(root, true);
    const manifest = path.join(root, "package.json");
    write(
      manifest,
      `{
  "name": "app",
  "packageManager": "pnpm@12.0.0",
  "devDependencies": {
    "ai-i18n-tools": "^1.14.0"
  }
}
`
    );
    write(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
    const calls: { cmd: string; args: string[]; cwd: string }[] = [];
    const code = await runUpgrade(
      baseOptions(root, script, {
        yes: true,
        stdinIsTTY: false,
        spawnImpl: async (cmd, args, cwd) => {
          calls.push({ cmd, args, cwd });
          return 0;
        },
      })
    );
    expect(code).toBe(0);
    expect(fs.readFileSync(manifest, "utf8")).toContain('"ai-i18n-tools": "^1.15.0"');
    expect(calls).toEqual([{ cmd: "pnpm", args: ["install"], cwd: root }]);
  });

  it("restores package.json when the install fails", async () => {
    const root = tempDir();
    const script = installScript(root);
    const manifest = path.join(root, "package.json");
    const raw = `{
  "devDependencies": {
    "ai-i18n-tools": "^1.14.0"
  }
}
`;
    write(manifest, raw);
    write(path.join(root, "package-lock.json"), "{}\n");
    let calls = 0;
    const code = await runUpgrade(
      baseOptions(root, script, {
        yes: true,
        spawnImpl: async () => {
          calls += 1;
          return calls === 1 ? 1 : 0;
        },
      })
    );
    expect(code).toBe(1);
    expect(calls).toBe(2);
    expect(fs.readFileSync(manifest, "utf8")).toBe(raw);
  });

  it("upgrades a global install without editing the project manifest", async () => {
    const root = tempDir();
    const project = path.join(root, "project");
    const manifest = path.join(project, "package.json");
    const raw = JSON.stringify({ devDependencies: { "ai-i18n-tools": "^1.14.0" } });
    write(manifest, raw);
    const script = path.join(
      root,
      "prefix",
      "lib",
      "node_modules",
      "ai-i18n-tools",
      "bin",
      "ai-i18n-tools.mjs"
    );
    write(script, "");
    write(
      path.join(path.dirname(script), "..", "package.json"),
      JSON.stringify({ name: "ai-i18n-tools", version: "1.14.0" })
    );
    const calls: { cmd: string; args: string[]; cwd: string }[] = [];
    const code = await runUpgrade(
      baseOptions(project, script, {
        yes: true,
        cwd: project,
        spawnImpl: async (cmd, args, cwd) => {
          calls.push({ cmd, args, cwd });
          return 0;
        },
      })
    );
    expect(code).toBe(0);
    expect(fs.readFileSync(manifest, "utf8")).toBe(raw);
    expect(calls).toEqual([
      { cmd: "npm", args: ["install", "-g", "ai-i18n-tools@1.15.0"], cwd: project },
    ]);
  });

  it("does not contact the registry for a source checkout", async () => {
    const root = tempDir();
    const script = path.join(root, "bin", "ai-i18n-tools.mjs");
    write(script, "");
    write(
      path.join(root, "package.json"),
      JSON.stringify({ name: "ai-i18n-tools", version: "1.14.0" })
    );
    const fetchImpl = vi.fn(async () => jsonResponse({ version: "9.9.9" }));
    const code = await runUpgrade(baseOptions(root, script, { fetchImpl, yes: true }));
    expect(code).toBe(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("leaves the executable in place when the checksum does not match", async () => {
    const root = tempDir();
    const execPath = path.join(root, "ai-i18n-tools");
    fs.writeFileSync(execPath, "old-binary");
    const payload = zlib.gzipSync(Buffer.from("new-binary"));
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("api.github.com")) {
        return jsonResponse({ tag_name: "v1.15.0" });
      }
      if (url.endsWith("SHA256SUMS.txt")) {
        return bytesResponse(Buffer.from(`${"a".repeat(64)}  ai-i18n-tools-linux-x64.gz\n`));
      }
      return bytesResponse(payload);
    };
    const spawnImpl = vi.fn(async () => 0);
    const code = await runUpgrade(
      baseOptions(root, execPath, {
        sea: true,
        execPath,
        yes: true,
        fetchImpl,
        spawnImpl,
      })
    );
    expect(code).toBe(1);
    expect(fs.readFileSync(execPath, "utf8")).toBe("old-binary");
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it("replaces the standalone executable after the checksum matches", async () => {
    const root = tempDir();
    const execPath = path.join(root, "ai-i18n-tools");
    fs.writeFileSync(execPath, "old-binary");
    const unpacked = Buffer.from("#!/bin/sh\necho 1.15.0\n");
    const payload = zlib.gzipSync(unpacked);
    const hash = sha256Hex(payload);
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("api.github.com")) {
        return jsonResponse({ tag_name: "v1.15.0" });
      }
      if (url.endsWith("SHA256SUMS.txt")) {
        return bytesResponse(Buffer.from(`${hash}  ai-i18n-tools-linux-x64.gz\n`));
      }
      if (url.endsWith("ai-i18n-tools-linux-x64.gz")) {
        return bytesResponse(payload);
      }
      return new Response("missing", { status: 404 });
    };
    const calls: { cmd: string; args: string[] }[] = [];
    const code = await runUpgrade(
      baseOptions(root, execPath, {
        sea: true,
        execPath,
        yes: true,
        fetchImpl,
        spawnImpl: async (cmd, args) => {
          calls.push({ cmd, args });
          return 0;
        },
      })
    );
    expect(code).toBe(0);
    expect(fs.readFileSync(execPath)).toEqual(unpacked);
    expect(calls).toEqual([{ cmd: execPath, args: ["--version"] }]);
  });

  it("reports an unsupported executable platform after showing the new version", async () => {
    const root = tempDir();
    const execPath = path.join(root, "ai-i18n-tools");
    fs.writeFileSync(execPath, "old");
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message: unknown) => {
      logs.push(String(message));
    });
    const fetchImpl: typeof fetch = async () => jsonResponse({ tag_name: "v1.15.0" });
    const code = await runUpgrade(
      baseOptions(root, execPath, {
        sea: true,
        execPath,
        platform: "linux",
        arch: "ia32",
        yes: true,
        fetchImpl,
      })
    );
    expect(code).toBe(1);
    expect(logs.join("\n")).toContain("1.14.0 → 1.15.0");
    expect(fs.readFileSync(execPath, "utf8")).toBe("old");
  });
});
