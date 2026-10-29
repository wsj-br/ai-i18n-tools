import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const installSh = path.join(repoRoot, "install.sh");
const installPs1 = path.join(repoRoot, "install.ps1");

const defaultPathLine = 'export PATH="$HOME/.local/bin:$PATH"';
const fishPathLine = 'set -gx PATH "$HOME/.local/bin" $PATH';
const installerComment = "# Added by the ai-i18n-tools installer";

const versionScript = `#!/bin/sh
if [ "\${1:-}" = "--version" ]; then
  printf '9.9.9-test\\n'
  exit 0
fi
printf 'unexpected args\\n' >&2
exit 2
`;

interface InstallResult {
  status: number;
  stdout: string;
  stderr: string;
}

function releaseAssetName(): string {
  const kernel = execFileSync("uname", ["-s"], { encoding: "utf8" }).trim();
  let machine = execFileSync("uname", ["-m"], { encoding: "utf8" }).trim();
  const osName = kernel === "Linux" ? "linux" : kernel === "Darwin" ? "macos" : "";
  if (!osName) {
    throw new Error(`unsupported kernel ${kernel}`);
  }
  if (osName === "macos") {
    const hw = spawnSync("sysctl", ["-n", "hw.optional.arm64"], { encoding: "utf8" });
    if (hw.status === 0 && hw.stdout.trim() === "1") {
      machine = "arm64";
    }
  }
  const arch =
    machine === "x86_64" || machine === "amd64"
      ? "x64"
      : machine === "aarch64" || machine === "arm64"
        ? "arm64"
        : "";
  if (!arch) {
    throw new Error(`unsupported machine ${machine}`);
  }
  return `ai-i18n-tools-${osName}-${arch}`;
}

function writeRelease(dir: string, asset: string, body: string, checksum?: string): void {
  fs.writeFileSync(path.join(dir, asset), body, { mode: 0o755 });
  const hash = checksum ?? createHash("sha256").update(body).digest("hex");
  const sums = [`${"a".repeat(64)}  ai-i18n-tools-other`, `${hash}  ${asset}`, ""].join("\n");
  fs.writeFileSync(path.join(dir, "SHA256SUMS.txt"), sums);
}

function runInstall(
  home: string,
  baseUrl: string,
  options?: { pipe?: boolean; env?: NodeJS.ProcessEnv }
): InstallResult {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: home,
    AI_I18N_BASE_URL: baseUrl,
    ...options?.env,
  };
  if (!options?.env || !("AI_I18N_INSTALL_DIR" in options.env)) {
    delete env.AI_I18N_INSTALL_DIR;
  }
  if (!options?.env || !("AI_I18N_VERSION" in options.env)) {
    delete env.AI_I18N_VERSION;
  }
  const result = options?.pipe
    ? spawnSync("sh", [], {
        input: fs.readFileSync(installSh),
        encoding: "utf8",
        env,
      })
    : spawnSync("sh", [installSh], { encoding: "utf8", env });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: `${result.stderr ?? ""}${result.error ? `\n${result.error.message}` : ""}`,
  };
}

function countExactLines(file: string, line: string): number {
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((entry) => entry === line).length;
}

function withTempDirs(run: (home: string, release: string) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-install-"));
  const home = path.join(root, "home");
  const release = path.join(root, "release");
  fs.mkdirSync(home);
  fs.mkdirSync(release);
  try {
    run(home, release);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe("install scripts", () => {
  it("install.sh is a POSIX script and stays in the repository", () => {
    const source = fs.readFileSync(installSh, "utf8");
    const syntax = spawnSync("sh", ["-n", installSh], { encoding: "utf8" });
    expect(syntax.status, syntax.stderr).toBe(0);
    expect(fs.statSync(installSh).mode & 0o111).not.toBe(0);
    expect(source).toContain("hw.optional.arm64");
    expect(source).toContain("MINGW*");
    expect(source).toContain("install.ps1");
    expect(source).toContain("SHA256SUMS.txt");
    expect(source).toContain('export PATH="$HOME/.local/bin:$PATH"');
    const workflow = fs.readFileSync(
      path.join(repoRoot, ".github/workflows/release-binaries.yml"),
      "utf8"
    );
    expect(workflow).toContain("install.sh and install.ps1 stay in the repository");
    expect(workflow).toContain("ai-i18n-tools-*");
    expect(workflow).toContain("SHA256SUMS.txt");
    expect(workflow).not.toContain('"$GITHUB_WORKSPACE/install.sh"');
    expect(workflow).not.toContain('"$GITHUB_WORKSPACE/install.ps1"');
  });

  it("install.ps1 verifies the checksum and installs ai-i18n-tools.exe", () => {
    const source = fs.readFileSync(installPs1, "utf8");
    expect(source).toContain("Get-FileHash -Algorithm SHA256");
    expect(source).toContain("ai-i18n-tools-win-x64.exe");
    expect(source).toContain('Join-Path $installDir "ai-i18n-tools.exe"');
    expect(source).toContain("SHA256SUMS.txt");
    expect(source).toContain("Unblock-File");
    expect(source).toContain('SetEnvironmentVariable("Path"');
    expect(source).toContain("SilentlyContinue");
    expect(source).toContain("AI_I18N_BASE_URL");
    expect(source).toContain("AI_I18N_VERSION");
    expect(source).toContain("AI_I18N_INSTALL_DIR");
    expect(source).toContain("releases/latest/download");
    expect(source).toContain("releases/download/");
    expect(source).toContain("ARM64");
    expect(source).not.toContain("com.apple.quarantine");
  });
});

describe.skipIf(process.platform === "win32")("install.sh", () => {
  it("installs ai-i18n-tools, verifies the checksum, and updates existing shell profiles once", () => {
    withTempDirs((home, release) => {
      const asset = releaseAssetName();
      writeRelease(release, asset, versionScript);
      for (const name of [".bashrc", ".bash_profile", ".profile", ".zshrc"]) {
        fs.writeFileSync(path.join(home, name), "# existing\n");
      }
      fs.mkdirSync(path.join(home, ".config", "fish"), { recursive: true });
      fs.writeFileSync(path.join(home, ".config", "fish", "config.fish"), "# fish\n");

      const baseUrl = `file://${release}`;
      const first = runInstall(home, baseUrl, { env: { AI_I18N_VERSION: "v0.0.0-ignored" } });
      expect(first.status, `${first.stdout}\n${first.stderr}`).toBe(0);
      expect(first.stdout).toContain("checksum verified");
      expect(first.stdout).toContain("9.9.9-test");
      expect(first.stdout).toContain("open a new terminal");

      const dest = path.join(home, ".local", "bin", "ai-i18n-tools");
      expect(fs.readFileSync(dest, "utf8")).toBe(versionScript);
      expect(fs.statSync(dest).mode & 0o777).toBe(0o755);
      expect(fs.existsSync(path.join(home, ".local", "bin", asset))).toBe(false);

      const piped = runInstall(home, baseUrl, { pipe: true });
      expect(piped.status, `${piped.stdout}\n${piped.stderr}`).toBe(0);
      expect(piped.stdout).toContain("already add the install directory to PATH");

      for (const name of [".bashrc", ".bash_profile", ".profile", ".zshrc"]) {
        const file = path.join(home, name);
        expect(countExactLines(file, defaultPathLine)).toBe(1);
        expect(fs.readFileSync(file, "utf8")).toContain(installerComment);
        expect(fs.readFileSync(file, "utf8").startsWith("# existing\n")).toBe(true);
      }
      const fish = path.join(home, ".config", "fish", "config.fish");
      expect(countExactLines(fish, fishPathLine)).toBe(1);
    });
  });

  it("creates .profile when no shell startup file exists", () => {
    withTempDirs((home, release) => {
      writeRelease(release, releaseAssetName(), versionScript);
      const result = runInstall(home, `file://${release}`);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(fs.existsSync(path.join(home, ".profile"))).toBe(true);
      expect(fs.existsSync(path.join(home, ".bashrc"))).toBe(false);
      expect(fs.existsSync(path.join(home, ".zshrc"))).toBe(false);
      expect(countExactLines(path.join(home, ".profile"), defaultPathLine)).toBe(1);
    });
  });

  it("leaves a profile unchanged when it already adds the install directory", () => {
    withTempDirs((home, release) => {
      writeRelease(release, releaseAssetName(), versionScript);
      const bashrc = path.join(home, ".bashrc");
      fs.writeFileSync(bashrc, `${defaultPathLine}\n`);
      const result = runInstall(home, `file://${release}`);
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(countExactLines(bashrc, defaultPathLine)).toBe(1);
      expect(fs.readFileSync(bashrc, "utf8")).not.toContain(installerComment);
    });
  });

  it("installs into AI_I18N_INSTALL_DIR and records that directory", () => {
    withTempDirs((home, release) => {
      writeRelease(release, releaseAssetName(), versionScript);
      const installDir = path.join(home, "custom-bin");
      fs.writeFileSync(path.join(home, ".zshrc"), "# existing\n");
      const result = runInstall(home, `file://${release}`, {
        env: { AI_I18N_INSTALL_DIR: installDir, PATH: `${installDir}:${process.env.PATH ?? ""}` },
      });
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      expect(fs.existsSync(path.join(installDir, "ai-i18n-tools"))).toBe(true);
      expect(fs.existsSync(path.join(home, ".local", "bin", "ai-i18n-tools"))).toBe(false);
      expect(result.stdout).toContain("command is available in this shell");
      const zshrc = fs.readFileSync(path.join(home, ".zshrc"), "utf8");
      expect(zshrc).toContain(`export PATH="${installDir}:$PATH"`);
    });
  });

  it("rejects an install directory that would break a shell profile", () => {
    withTempDirs((home) => {
      const result = runInstall(home, "file:///missing-release", {
        env: { AI_I18N_INSTALL_DIR: path.join(home, "has space") },
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/cannot be written into a shell profile/);
      expect(fs.existsSync(path.join(home, ".profile"))).toBe(false);
    });
  });

  it("does not install when the checksum does not match", () => {
    withTempDirs((home, release) => {
      writeRelease(release, releaseAssetName(), versionScript, "b".repeat(64));
      fs.writeFileSync(path.join(home, ".bashrc"), "# existing\n");
      const result = runInstall(home, `file://${release}`);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/checksum mismatch/);
      expect(fs.existsSync(path.join(home, ".local", "bin", "ai-i18n-tools"))).toBe(false);
      expect(fs.readFileSync(path.join(home, ".bashrc"), "utf8")).toBe("# existing\n");
    });
  });

  it("does not install when SHA256SUMS.txt has no line for this executable", () => {
    withTempDirs((home, release) => {
      const asset = releaseAssetName();
      fs.writeFileSync(path.join(release, asset), versionScript);
      fs.writeFileSync(
        path.join(release, "SHA256SUMS.txt"),
        `${"c".repeat(64)}  ai-i18n-tools-other\n`
      );
      const result = runInstall(home, `file://${release}`);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/no checksum/);
      expect(fs.existsSync(path.join(home, ".local", "bin", "ai-i18n-tools"))).toBe(false);
    });
  });

  it("reports a failed download", () => {
    withTempDirs((home, release) => {
      const result = runInstall(home, `file://${release}`);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/download failed/);
      expect(fs.existsSync(path.join(home, ".local"))).toBe(false);
    });
  });
});
