# upgrade-common.ps1
#
# Shared, project-agnostic helpers for upgrade-tools.ps1 and upgrade-dependencies.ps1.
# Mirrors scripts/upgrade-common.sh: package manager, workspace dirs, and verify
# commands are auto-detected from the lockfile / workspace manifests.
#
# Callers must set $script:UpgradeRepoRoot before using detection helpers.

function Write-UpgradeLog {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string] $Message)
    Write-Host $Message -ForegroundColor Blue
}

function Write-UpgradeOk {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string] $Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-UpgradeWarn {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string] $Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-UpgradeErr {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string] $Message)
    Write-Host $Message -ForegroundColor Red
}

# Run a command, indent its combined output, and return the real exit status.
function Invoke-UpgradeStep {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock] $Command
    )
    $output = & $Command 2>&1
    $code = $LASTEXITCODE
    foreach ($line in @($output)) {
        Write-Host ("    {0}" -f $line)
    }
    return $code
}

function Test-UpgradeAllowExec {
    return (
        $env:CI -or
        $env:UPGRADE_ALLOW_EXEC -or
        $env:TRANSREWRT_UPGRADE_ALLOW_EXEC
    )
}

function Test-UpgradeToolsSuppressDone {
    return (
        $env:UPGRADE_TOOLS_SUPPRESS_DONE -or
        $env:TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE
    )
}

function Get-UpgradePkgMgr {
    $root = $script:UpgradeRepoRoot
    if (Test-Path -LiteralPath (Join-Path $root 'pnpm-lock.yaml')) { return 'pnpm' }
    if (
        (Test-Path -LiteralPath (Join-Path $root 'package-lock.json')) -or
        (Test-Path -LiteralPath (Join-Path $root 'npm-shrinkwrap.json'))
    ) { return 'npm' }
    if (Test-Path -LiteralPath (Join-Path $root 'yarn.lock')) { return 'yarn' }
    if (
        (Test-Path -LiteralPath (Join-Path $root 'bun.lockb')) -or
        (Test-Path -LiteralPath (Join-Path $root 'bun.lock'))
    ) { return 'bun' }
    return 'pnpm'
}

function Get-UpgradeWorkspaceDirs {
    $root = $script:UpgradeRepoRoot
    $pkgMgr = if ($script:UpgradePkgMgr) { $script:UpgradePkgMgr } else { Get-UpgradePkgMgr }
    $paths = @()

    if ($pkgMgr -eq 'pnpm' -and (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        try {
            $json = & pnpm ls -r --depth -1 --json 2>$null | Out-String
            if ($json) {
                $parsed = $json | ConvertFrom-Json
                $items = if ($parsed -is [System.Array]) { $parsed } else { @($parsed) }
                foreach ($p in $items) {
                    if ($p.path) { $paths += [string]$p.path }
                }
            }
        }
        catch {
            $paths = @()
        }
    }

    if ($paths.Count -eq 0) {
        $env:REPO_ROOT = $root
        $nodeOut = node -e @'
const fs = require("fs");
const path = require("path");
const root = process.env.REPO_ROOT;
const dirs = new Set();
const hasPkg = d => { try { return fs.existsSync(path.join(d, "package.json")); } catch (e) { return false; } };
if (hasPkg(root)) dirs.add(root);
let globs = [];
try {
  const pj = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  if (Array.isArray(pj.workspaces)) globs = pj.workspaces;
  else if (pj.workspaces && Array.isArray(pj.workspaces.packages)) globs = pj.workspaces.packages;
} catch (e) {}
const add = d => { if (hasPkg(d)) dirs.add(d); };
for (const g of globs) {
  if (g.endsWith("/*")) {
    const base = path.join(root, g.slice(0, -2));
    try {
      for (const e of fs.readdirSync(base, { withFileTypes: true })) {
        if (e.isDirectory()) add(path.join(base, e.name));
      }
    } catch (e) {}
  } else {
    add(path.join(root, g));
  }
}
process.stdout.write(Array.from(dirs).join("\n"));
'@ 2>$null
        if ($nodeOut) {
            $paths = @($nodeOut -split "`r?`n" | Where-Object { $_ })
        }
    }

    if ($paths.Count -eq 0) {
        $paths = @($root)
    }

    $seen = @{}
    $rest = [System.Collections.Generic.List[string]]::new()
    $rootLine = $null
    foreach ($p in $paths) {
        if (-not $p -or $seen.ContainsKey($p)) { continue }
        $seen[$p] = $true
        if ($p -eq $root) { $rootLine = $p }
        else { [void]$rest.Add($p) }
    }
    $out = [System.Collections.Generic.List[string]]::new()
    if ($rootLine) { [void]$out.Add($rootLine) }
    foreach ($p in $rest) { [void]$out.Add($p) }
    # Emit paths as pipeline objects (no unary comma). Callers use
    # @(Get-UpgradeWorkspaceDirs); a comma-wrapped array would nest under @().
    return @($out)
}

function Get-UpgradeVerifyCmd {
    param(
        [Parameter(Mandatory = $true)][string] $Dir,
        [string] $PkgMgr = 'pnpm'
    )
    $scripts = node -e @'
const fs = require("fs");
try {
  const p = JSON.parse(fs.readFileSync(process.argv[1] + "/package.json", "utf8"));
  const s = p.scripts || {};
  const isScript = (x) => typeof s[x] === "string" && s[x].length;
  const fast = ["typecheck", "lint"].filter(isScript);
  let chosen = "";
  if (fast.length) chosen = fast.join(",");
  else if (isScript("build")) chosen = "build";
  else if (isScript("docs:build")) chosen = "docs:build";
  process.stdout.write(chosen);
} catch (e) {}
'@ $Dir 2>$null
    if (-not $scripts) { return '' }

    $parts = @()
    foreach ($s in ($scripts -split ',')) {
        if ($s) { $parts += "$PkgMgr run $s" }
    }
    return ($parts -join ' && ')
}

function Get-UpgradeDirLabel {
    param([Parameter(Mandatory = $true)][string] $Dir)
    $root = $script:UpgradeRepoRoot
    if ($Dir -eq $root) { return 'repo root' }
    $prefix = $root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    if ($Dir.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
        return $Dir.Substring($prefix.Length) -replace '\\', '/'
    }
    return $Dir
}
