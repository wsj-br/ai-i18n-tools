# upgrade-dependencies.ps1
#
# Project-agnostic dependency upgrader. Mirrors scripts/upgrade-dependencies.sh:
#   1. Upgrades dev tools (Node/npm/PM/ncu) via upgrade-tools.ps1.
#   2. Build-safe upgrades: ncu --doctor per workspace package.
#   3. Security: audit + audit fix; force-apply safe versions for vulnerable
#      direct deps that doctor had to revert (and report build breakage).
#
# nvm-windows only affects the current PowerShell session. Dot-source so PATH
# changes apply:
#   . .\scripts\upgrade-dependencies.ps1
# Aborts if executed as .\scripts\upgrade-dependencies.ps1 unless CI=1 or
# UPGRADE_ALLOW_EXEC=1 / TRANSREWRT_UPGRADE_ALLOW_EXEC=1 (for automation).
#

$script:UpgradeScriptDir = $PSScriptRoot
$script:UpgradeRepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$script:UpgradeDependenciesDotSourced = ($MyInvocation.InvocationName -eq '.')
# Legacy alias used by older upgrade-tools.ps1 tip logic
$TransrewrtUpgradeDotSourced = $script:UpgradeDependenciesDotSourced

. (Join-Path $script:UpgradeScriptDir 'upgrade-common.ps1')

if (-not $script:UpgradeDependenciesDotSourced) {
    if (-not (Test-UpgradeAllowExec)) {
        Write-UpgradeErr 'Abort: dot-source this script so nvm applies to your current shell.'
        Write-Host "  . `"$PSCommandPath`"" -ForegroundColor Green
        Write-UpgradeWarn '(Automation: set CI=1 or UPGRADE_ALLOW_EXEC=1 to allow execution without dot-sourcing.)'
        exit 1
    }
}

function Invoke-UpgradeToolsPhase {
    $hadPrev = $false
    $prev = $null
    if ($null -ne (Get-Item Env:UPGRADE_TOOLS_SUPPRESS_DONE -ErrorAction SilentlyContinue) -or
        $null -ne (Get-Item Env:TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE -ErrorAction SilentlyContinue)) {
        $hadPrev = $true
        $prev = if ($env:UPGRADE_TOOLS_SUPPRESS_DONE) { $env:UPGRADE_TOOLS_SUPPRESS_DONE } else { $env:TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE }
    }
    $prevEmbedded = $env:UPGRADE_TOOLS_EMBEDDED
    $prevEmbeddedLegacy = $env:TRANSREWRT_UPGRADE_TOOLS_EMBEDDED
    $prevDefine = $env:UPGRADE_TOOLS_DEFINE_ONLY

    $env:UPGRADE_TOOLS_SUPPRESS_DONE = '1'
    $env:TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE = '1'
    $env:UPGRADE_TOOLS_DEFINE_ONLY = '1'
    $env:UPGRADE_TOOLS_EMBEDDED = '1'
    $env:TRANSREWRT_UPGRADE_TOOLS_EMBEDDED = '1'
    try {
        # Isolate dotsource so a nested `return` cannot exit this function.
        # Call Invoke-UpgradeTools inside the same block: the nested dotsource
        # defines it in this scriptblock scope, so it is gone after the block ends.
        & {
            . (Join-Path $script:UpgradeScriptDir 'upgrade-tools.ps1')
            Remove-Item Env:UPGRADE_TOOLS_DEFINE_ONLY -ErrorAction SilentlyContinue
            Invoke-UpgradeTools
        }
    }
    finally {
        if ($hadPrev) {
            $env:UPGRADE_TOOLS_SUPPRESS_DONE = $prev
            $env:TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE = $prev
        }
        else {
            Remove-Item Env:UPGRADE_TOOLS_SUPPRESS_DONE -ErrorAction SilentlyContinue
            Remove-Item Env:TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE -ErrorAction SilentlyContinue
        }
        if ($null -eq $prevEmbedded) {
            Remove-Item Env:UPGRADE_TOOLS_EMBEDDED -ErrorAction SilentlyContinue
        }
        else {
            $env:UPGRADE_TOOLS_EMBEDDED = $prevEmbedded
        }
        if ($null -eq $prevEmbeddedLegacy) {
            Remove-Item Env:TRANSREWRT_UPGRADE_TOOLS_EMBEDDED -ErrorAction SilentlyContinue
        }
        else {
            $env:TRANSREWRT_UPGRADE_TOOLS_EMBEDDED = $prevEmbeddedLegacy
        }
        if ($null -eq $prevDefine) {
            Remove-Item Env:UPGRADE_TOOLS_DEFINE_ONLY -ErrorAction SilentlyContinue
        }
        else {
            $env:UPGRADE_TOOLS_DEFINE_ONLY = $prevDefine
        }
    }
}

function New-UpgradeSnapshot {
    $dir = Join-Path ([IO.Path]::GetTempPath()) ("upgrade-deps-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $dir | Out-Null
    Write-UpgradeLog "🧷  Snapshotting manifests to $dir (restore manually if needed)..."
    $dirsFile = Join-Path $dir 'dirs.txt'
    New-Item -ItemType File -Path $dirsFile -Force | Out-Null
    $i = 0
    foreach ($d in $script:WorkspaceDirs) {
        $pkg = Join-Path $d 'package.json'
        if (Test-Path -LiteralPath $pkg) {
            Copy-Item -LiteralPath $pkg -Destination (Join-Path $dir "package.$i.json")
            Add-Content -LiteralPath $dirsFile -Value $d
            $i++
        }
    }
    foreach ($lf in @(
            'pnpm-lock.yaml', 'package-lock.json', 'npm-shrinkwrap.json',
            'yarn.lock', 'bun.lockb', 'bun.lock'
        )) {
        $src = Join-Path $script:UpgradeRepoRoot $lf
        if (Test-Path -LiteralPath $src) {
            Copy-Item -LiteralPath $src -Destination (Join-Path $dir $lf)
        }
    }
    return $dir
}

function Test-EslintPeerAllowsLatest {
    $env:PKG_MGR = $script:UpgradePkgMgr
    $out = node -e @'
'use strict';
const { execSync } = require('child_process');
const pm = process.env.PKG_MGR || 'pnpm';
let semver = null;
try { semver = require('semver'); } catch (e) {}
const PLUGINS = ['eslint-plugin-react', 'eslint-plugin-react-hooks'];
function jsonView(spec) {
  let raw;
  try { raw = execSync(`${pm} view ${JSON.stringify(spec)} --json`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { raw = execSync(`${pm} info ${JSON.stringify(spec)} --json`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  return JSON.parse(raw);
}
function latestEslintMajor() {
  const data = jsonView('eslint');
  const v = (data && (data['dist-tags']?.latest || data.version)) ||
    (data && Array.isArray(data.versions) ? data.versions[data.versions.length - 1] : null);
  if (!v) throw new Error('cannot resolve eslint latest version');
  return parseInt(String(v).split('.')[0], 10);
}
function peerEslintRange(pkg) {
  const data = jsonView(pkg);
  const peer = data && data.peerDependencies;
  return peer && peer.eslint;
}
try {
  const major = latestEslintMajor();
  const probe = `${major}.0.0`;
  let ok = true;
  for (const pkg of PLUGINS) {
    const range = peerEslintRange(pkg);
    if (!range || typeof range !== 'string') {
      console.error(`${pkg}: missing peerDependencies.eslint`);
      ok = false;
      continue;
    }
    let allowed;
    if (semver) {
      allowed = semver.satisfies(probe, range, { includePrerelease: true });
    } else {
      allowed = new RegExp(`(^|[^0-9])${major}([^0-9]|$)`).test(range) || /[*]|>=/.test(range);
    }
    console.error(`${pkg} peer eslint "${range}" -> ESLint ${probe} ${allowed ? 'ok' : 'no'}`);
    if (!allowed) ok = false;
  }
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('eslint-peer-check: ' + e.message);
  process.exit(2);
}
'@ 2>&1
    $code = $LASTEXITCODE
    return @{ Output = ($out | Out-String).TrimEnd(); ExitCode = $code }
}

function Test-WorkspaceUsesEslint {
    foreach ($d in $script:WorkspaceDirs) {
        $rc = node -e @'
const fs = require("fs");
try {
  const p = JSON.parse(fs.readFileSync(process.argv[1] + "/package.json", "utf8"));
  const all = Object.assign({}, p.dependencies, p.devDependencies);
  process.exit(all["eslint"] ? 0 : 1);
} catch (e) { process.exit(1); }
'@ $d
        if ($rc -eq 0) { return $true }
    }
    return $false
}

function Set-EslintReject {
    $script:EslintReject = ''
    if (-not (Test-WorkspaceUsesEslint)) { return }
    Write-UpgradeLog '📦  Checking registry: do the latest React ESLint plugins allow the latest ESLint major?'
    $result = Test-EslintPeerAllowsLatest
    foreach ($line in @($result.Output -split "`r?`n")) {
        if ($line) { Write-Host ("    {0}" -f $line) }
    }
    if ($result.ExitCode -eq 0) {
        Write-UpgradeOk 'Peer ranges include the latest ESLint major; upgrading the ESLint stack with everything else.'
        $script:EslintReject = ''
    }
    else {
        Write-UpgradeWarn 'Peer ranges exclude the latest ESLint major (or the check failed); excluding the ESLint stack from the bump.'
        $script:EslintReject = 'eslint,@eslint/js,eslint-plugin-react,eslint-plugin-react-hooks'
    }
}

function Invoke-DoctorUpgradeDir {
    param([Parameter(Mandatory = $true)][string] $Dir)

    $label = Get-UpgradeDirLabel $Dir
    $pkgPath = Join-Path $Dir 'package.json'
    if (-not (Test-Path -LiteralPath $pkgPath)) {
        Write-UpgradeWarn "Skipping ${label}: no package.json."
        return
    }

    $verify = Get-UpgradeVerifyCmd -Dir $Dir -PkgMgr $script:UpgradePkgMgr
    $ncuArgs = @('--upgrade', '--packageManager', $script:UpgradePkgMgr)
    if ($script:EslintReject) {
        $ncuArgs += @('-x', $script:EslintReject)
    }

    if (-not $verify) {
        Write-UpgradeWarn "📦  [${label}] No typecheck/lint/build script; upgrading without build verification."
        Push-Location $Dir
        try {
            [void](Invoke-UpgradeStep { & ncu @ncuArgs })
        }
        finally { Pop-Location }
        return
    }

    Write-UpgradeLog "📦  [${label}] ncu --doctor (verify: ${verify})"
    $safeLabel = ($label -replace '[/ .]', '_')
    $logf = Join-Path $script:SnapshotDir "doctor.$safeLabel.log"
    $verifyScript = Join-Path $script:SnapshotDir "verify.$safeLabel.cmd"
    $dirForCmd = $Dir
    @(
        '@echo off'
        "cd /d `"$dirForCmd`" || exit /b 1"
        $verify
    ) | Set-Content -LiteralPath $verifyScript -Encoding ascii

    $doctorArgs = @(
        '--doctor', '--upgrade',
        '--packageManager', $script:UpgradePkgMgr,
        '--doctorInstall', "$($script:UpgradePkgMgr) install",
        '--doctorTest', $verifyScript
    )
    if ($script:EslintReject) {
        $doctorArgs += @('-x', $script:EslintReject)
    }

    Push-Location $Dir
    try {
        $output = & ncu @doctorArgs 2>&1
        $rc = $LASTEXITCODE
        $text = ($output | Out-String)
        Set-Content -LiteralPath $logf -Value $text -Encoding utf8
        foreach ($line in @($text -split "`r?`n")) {
            if ($null -ne $line) { Write-Host ("    {0}" -f $line) }
        }
    }
    finally { Pop-Location }

    if ($rc -ne 0 -and $text -notmatch '[✓✗→]|Upgrading') {
        Write-UpgradeWarn "   ↳ [${label}] ncu doctor could not run - the verify command likely fails on the current tree. Fix the existing build, then re-run."
        $script:DoctorBlocked += @($label)
        return
    }

    $reverted = @()
    foreach ($line in @($text -split "`r?`n")) {
        if ($line -match '✗\s*(\S+)') {
            $reverted += $Matches[1]
        }
    }
    if ($reverted.Count -gt 0) {
        Write-UpgradeWarn ("   ↳ build-breaking upgrades reverted in {0}: {1}" -f $label, ($reverted -join ' '))
        $script:RevertedPkgs += $reverted
    }
}

function Invoke-PreflightVerify {
    Write-UpgradeLog '🔍  Preflight: verifying each package before doctor upgrades...'
    $failed = $false
    foreach ($d in $script:WorkspaceDirs) {
        $verify = Get-UpgradeVerifyCmd -Dir $d -PkgMgr $script:UpgradePkgMgr
        if (-not $verify) { continue }
        $label = Get-UpgradeDirLabel $d
        Write-UpgradeLog "   ↳ [${label}] ${verify}"
        Push-Location $d
        try {
            $code = Invoke-UpgradeStep { cmd /c $verify }
            if ($code -eq 0) {
                Write-UpgradeOk "      ✔ ${label}"
            }
            else {
                Write-UpgradeErr "      ✖ ${label} failed preflight verify"
                $failed = $true
            }
        }
        finally { Pop-Location }
    }
    if ($failed) {
        Write-UpgradeErr '❌  Preflight verify failed. Fix the current tree, then re-run the upgrade.'
        return $false
    }
    Write-UpgradeOk '✔  Preflight verify passed for all packages with a verify script.'
    return $true
}

function Invoke-PmAudit {
    Push-Location $script:UpgradeRepoRoot
    try {
        switch ($script:UpgradePkgMgr) {
            'pnpm' { pnpm audit }
            'npm' { npm audit }
            'yarn' {
                yarn npm audit 2>$null
                if ($LASTEXITCODE -ne 0) { yarn audit }
            }
            'bun' { try { bun audit } catch { } }
            default { }
        }
    }
    finally { Pop-Location }
}

function Get-PmAuditJson {
    Push-Location $script:UpgradeRepoRoot
    try {
        $json = switch ($script:UpgradePkgMgr) {
            'pnpm' { pnpm audit --json 2>$null }
            'npm' { npm audit --json 2>$null }
            'yarn' { yarn npm audit --json 2>$null }
            'bun' { bun audit --json 2>$null }
            default { '' }
        }
        return ($json | Out-String)
    }
    finally { Pop-Location }
}

function Invoke-PmAuditFix {
    Push-Location $script:UpgradeRepoRoot
    try {
        switch ($script:UpgradePkgMgr) {
            'pnpm' { pnpm audit --fix override }
            'npm' { npm audit fix }
            'yarn' { try { yarn npm audit --fix } catch { } }
            'bun' {
                Write-UpgradeWarn 'bun has no automatic audit fix; skipping.'
            }
            default { }
        }
    }
    finally { Pop-Location }
}

function Invoke-PmPeersCheck {
    Push-Location $script:UpgradeRepoRoot
    try {
        if ($script:UpgradePkgMgr -ne 'pnpm') {
            return @{ Output = ''; ExitCode = 2 }
        }
        $out = pnpm peers check 2>&1 | Out-String
        return @{ Output = $out; ExitCode = $LASTEXITCODE }
    }
    finally { Pop-Location }
}

function Invoke-DedupeMinReleaseAgeExclude {
    if ($script:UpgradePkgMgr -ne 'pnpm') { return }
    $wf = Join-Path $script:UpgradeRepoRoot 'pnpm-workspace.yaml'
    if (-not (Test-Path -LiteralPath $wf)) { return }
    $env:WF = $wf
    $changed = node -e @'
'use strict';
const fs = require('fs');
const file = process.env.WF;
let text;
try { text = fs.readFileSync(file, 'utf8'); } catch (e) { process.exit(0); }
const nl = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^minimumReleaseAgeExclude:\s*(#.*)?$/.test(lines[i])) { start = i; break; }
}
if (start === -1) process.exit(0);
const itemRe = /^(\s*)-\s+(.*\S)\s*$/;
let end = start + 1;
const items = [];
let indent = null;
while (end < lines.length && itemRe.test(lines[end])) {
  const m = lines[end].match(itemRe);
  if (indent === null) indent = m[1];
  items.push(m[2]);
  end++;
}
if (items.length === 0) process.exit(0);
function splitNameVer(entry) {
  let e = entry.trim();
  if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) {
    e = e.slice(1, -1);
  }
  const scoped = e.startsWith('@');
  const at = scoped ? e.indexOf('@', 1) : e.indexOf('@');
  if (at === -1) return { name: e, versions: null };
  const versions = e.slice(at + 1).split('||').map(s => s.trim()).filter(Boolean);
  return { name: e.slice(0, at), versions };
}
const order = [];
const byName = new Map();
for (const it of items) {
  const { name, versions } = splitNameVer(it);
  if (!byName.has(name)) { byName.set(name, { nameOnly: false, versions: [] }); order.push(name); }
  const rec = byName.get(name);
  if (versions === null) rec.nameOnly = true;
  else for (const v of versions) if (!rec.versions.includes(v)) rec.versions.push(v);
}
function yamlScalar(s) {
  const needsQuote =
    /^[\s@`>|*&!%#?:,'"\[\]{}-]/.test(s) || /:(\s|$)/.test(s) || /\s#/.test(s);
  return needsQuote ? JSON.stringify(s) : s;
}
const newItems = order.map((name) => {
  const rec = byName.get(name);
  const raw = rec.nameOnly ? name : `${name}@${rec.versions.join(' || ')}`;
  return yamlScalar(raw);
});
if (newItems.length === items.length && newItems.every((v, i) => v === items[i])) {
  process.exit(0);
}
const ind = indent === null ? '  ' : indent;
const rebuilt = newItems.map((v) => `${ind}- ${v}`);
const out = lines.slice(0, start + 1).concat(rebuilt, lines.slice(end));
fs.writeFileSync(file, out.join(nl));
process.stdout.write('changed');
'@ 2>$null
    if ($changed -eq 'changed') {
        Write-UpgradeLog '🧹  Merged duplicate minimumReleaseAgeExclude entries in pnpm-workspace.yaml (pnpm#12463 workaround).'
    }
}

function Get-AuditCount {
    param([string] $Json)
    if (-not $Json) { return '0' }
    $Json | node -e @'
let s = "";
process.stdin.on("data", d => (s += d));
process.stdin.on("end", () => {
  try {
    const a = JSON.parse(s);
    let t = 0;
    if (a.metadata && a.metadata.vulnerabilities) {
      const v = a.metadata.vulnerabilities;
      t = (v.total != null) ? v.total : Object.values(v).reduce((x, y) => x + (typeof y === "number" ? y : 0), 0);
    } else if (a.advisories) {
      t = Object.keys(a.advisories).length;
    } else if (a.vulnerabilities) {
      t = Object.keys(a.vulnerabilities).length;
    }
    process.stdout.write(String(t));
  } catch (e) { process.stdout.write("0"); }
});
'@
}

function Get-AuditModules {
    param([string] $Json)
    if (-not $Json) { return @() }
    $out = $Json | node -e @'
let s = "";
process.stdin.on("data", d => (s += d));
process.stdin.on("end", () => {
  try {
    const a = JSON.parse(s);
    const set = new Set();
    if (a.advisories) { for (const k in a.advisories) { const m = a.advisories[k].module_name; if (m) set.add(m); } }
    if (a.vulnerabilities) { for (const k in a.vulnerabilities) { set.add(k); } }
    process.stdout.write(Array.from(set).join("\n"));
  } catch (e) {}
});
'@
    return @($out -split "`r?`n" | Where-Object { $_ })
}

function Get-DirectDeps {
    $names = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    foreach ($d in $script:WorkspaceDirs) {
        $pkg = Join-Path $d 'package.json'
        if (-not (Test-Path -LiteralPath $pkg)) { continue }
        $out = node -e @'
const fs = require("fs");
try {
  const p = JSON.parse(fs.readFileSync(process.argv[1] + "/package.json", "utf8"));
  const all = Object.assign({}, p.dependencies, p.devDependencies, p.optionalDependencies);
  for (const k of Object.keys(all)) console.log(k);
} catch (e) {}
'@ $d
        foreach ($n in @($out -split "`r?`n")) {
            if ($n) { [void]$names.Add($n) }
        }
    }
    return @($names)
}

function Get-PkgDiff {
    param([string] $OldJson, [string] $NewPkgJson)
    $out = node -e @'
const fs = require("fs");
const read = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return {}; } };
const oldp = read(process.argv[1]), newp = read(process.argv[2]);
const fields = ["dependencies", "devDependencies", "optionalDependencies"];
const collect = p => { const o = {}; for (const f of fields) Object.assign(o, p[f] || {}); return o; };
const a = collect(oldp), b = collect(newp);
const out = [];
for (const k of Object.keys(b)) { if (a[k] !== b[k]) out.push(k + "\t" + (a[k] || "(absent)") + "\t" + b[k]); }
for (const k of Object.keys(a)) { if (!(k in b)) out.push(k + "\t" + a[k] + "\t(removed)"); }
process.stdout.write(out.join("\n"));
'@ $OldJson $NewPkgJson
    return @($out -split "`r?`n" | Where-Object { $_ })
}

function Test-IsDirectDep {
    param([string] $Dir, [string] $Name)
    $rc = node -e @'
const fs = require("fs");
try {
  const p = JSON.parse(fs.readFileSync(process.argv[1] + "/package.json", "utf8"));
  const all = Object.assign({}, p.dependencies, p.devDependencies, p.optionalDependencies);
  process.exit(all[process.argv[2]] ? 0 : 1);
} catch (e) { process.exit(1); }
'@ $Dir $Name
    return ($rc -eq 0)
}

function Invoke-SecurityPhase {
    Write-Host ''
    Write-UpgradeLog '🔍  Checking for vulnerabilities...'
    $beforeJson = Get-PmAuditJson
    $script:VulnBefore = Get-AuditCount $beforeJson
    [void](Invoke-UpgradeStep { Invoke-PmAudit })

    Write-UpgradeLog "🔧  Applying non-breaking security fixes ($($script:UpgradePkgMgr) audit fix)..."
    [void](Invoke-UpgradeStep { Invoke-PmAuditFix })
    Invoke-DedupeMinReleaseAgeExclude
    $installCode = Invoke-UpgradeStep { & $script:UpgradePkgMgr install }
    if ($installCode -ne 0) {
        Write-UpgradeWarn 'Install after audit fix returned non-zero.'
    }

    Write-UpgradeLog '🔍  Re-checking for vulnerabilities...'
    $afterJson = Get-PmAuditJson
    $script:VulnAfter = Get-AuditCount $afterJson
    [void](Invoke-UpgradeStep { Invoke-PmAudit })

    $vulnMods = Get-AuditModules $afterJson
    $script:SecRemaining = $vulnMods
    if ($vulnMods.Count -eq 0) { return }

    $revertedSorted = @($script:RevertedPkgs | Where-Object { $_ } | Sort-Object -Unique)
    $vulnSorted = @($vulnMods | Where-Object { $_ } | Sort-Object -Unique)
    $directSorted = @(Get-DirectDeps | Where-Object { $_ } | Sort-Object -Unique)

    if ($revertedSorted.Count -eq 0) {
        Write-UpgradeWarn 'Remaining vulnerabilities are not in any build-breaking direct dependency; not force-upgrading.'
        return
    }

    $force = @($vulnSorted | Where-Object { $revertedSorted -contains $_ } | Where-Object { $directSorted -contains $_ })
    if ($force.Count -eq 0) {
        Write-UpgradeWarn 'Remaining vulnerabilities are transitive or not in a build-breaking direct dependency; not force-upgrading.'
        return
    }

    Write-UpgradeWarn '⚠  Force-upgrading vulnerable direct dependencies that previously broke the build (code may need fixing):'
    foreach ($p in $force) { Write-Host "    - $p" }
    $script:ForcedPkgs = $force

    foreach ($pkg in $force) {
        foreach ($d in $script:WorkspaceDirs) {
            if (Test-IsDirectDep $d $pkg) {
                Write-UpgradeLog "   ↳ forcing $pkg to latest in $(Get-UpgradeDirLabel $d)"
                Push-Location $d
                try {
                    [void](Invoke-UpgradeStep {
                            & ncu --upgrade --packageManager $script:UpgradePkgMgr --filter $pkg
                        })
                }
                finally { Pop-Location }
            }
        }
    }
    $installCode = Invoke-UpgradeStep { & $script:UpgradePkgMgr install }
    if ($installCode -ne 0) {
        Write-UpgradeWarn 'Install after forced upgrades returned non-zero.'
    }

    Write-UpgradeLog '🔍  Verifying the build after forced security upgrades...'
    $script:SecVerifyFailed = $false
    $script:SecVerifyLog = Join-Path $script:SnapshotDir 'security-verify.log'
    Set-Content -LiteralPath $script:SecVerifyLog -Value '' -Encoding utf8
    foreach ($d in $script:WorkspaceDirs) {
        $v = Get-UpgradeVerifyCmd -Dir $d -PkgMgr $script:UpgradePkgMgr
        if (-not $v) { continue }
        $label = Get-UpgradeDirLabel $d
        Add-Content -LiteralPath $script:SecVerifyLog -Value "=== verify: ${label} (${v}) ==="
        Push-Location $d
        try {
            $output = cmd /c $v 2>&1 | Out-String
            Add-Content -LiteralPath $script:SecVerifyLog -Value $output
            if ($LASTEXITCODE -ne 0) { $script:SecVerifyFailed = $true }
        }
        finally { Pop-Location }
    }

    if ($script:SecVerifyFailed) {
        Write-UpgradeErr '❌  The build is broken after forced security upgrades. The fixed versions are LEFT IN PLACE so the code can be updated for compatibility.'
        Write-UpgradeErr ("    Forced packages: {0}" -f ($force -join ' '))
        Write-UpgradeErr "    Full verify output: $($script:SecVerifyLog)"
        Write-Host ''
        Get-Content -LiteralPath $script:SecVerifyLog -Tail 80 | ForEach-Object { Write-Host ("    {0}" -f $_) }
    }
    else {
        Write-UpgradeOk '✔  The build still passes after the forced security upgrades.'
    }
}

function Invoke-PeersPhase {
    $script:PeerIssues = ''
    Write-Host ''
    Write-UpgradeLog '🔍  Checking peer dependencies...'
    $result = Invoke-PmPeersCheck
    if ($result.ExitCode -eq 2 -and -not $result.Output) {
        Write-UpgradeWarn "   ↳ $($script:UpgradePkgMgr) has no peer-dependency checker; skipping."
        return
    }
    foreach ($line in @($result.Output -split "`r?`n")) {
        if ($null -ne $line) { Write-Host ("    {0}" -f $line) }
    }
    if ($result.ExitCode -ne 0) {
        $script:PeerIssues = $result.Output
        Write-UpgradeWarn '   ↳ Peer dependency issues found (non-fatal; review in the summary).'
    }
    else {
        Write-UpgradeOk '   ↳ No peer dependency issues.'
    }
}

function Write-UpgradeSummary {
    Write-Host ''
    Write-Host '================================'
    Write-Host '📋  Upgrade summary'
    Write-Host '================================'

    Write-UpgradeLog 'Packages upgraded (package.json changes):'
    $any = $false
    $idx = 0
    $dirsFile = Join-Path $script:SnapshotDir 'dirs.txt'
    if (Test-Path -LiteralPath $dirsFile) {
        foreach ($d in Get-Content -LiteralPath $dirsFile) {
            $snap = Join-Path $script:SnapshotDir "package.$idx.json"
            $idx++
            if (-not (Test-Path -LiteralPath $snap)) { continue }
            $pkg = Join-Path $d 'package.json'
            if (-not (Test-Path -LiteralPath $pkg)) { continue }
            $changes = Get-PkgDiff $snap $pkg
            if ($changes.Count -gt 0) {
                $any = $true
                Write-Host ("    [{0}]" -f (Get-UpgradeDirLabel $d))
                foreach ($c in $changes) {
                    $parts = $c -split "`t"
                    if ($parts.Count -ge 3) {
                        Write-Host ("      - {0}: {1} -> {2}" -f $parts[0], $parts[1], $parts[2])
                    }
                }
            }
        }
    }
    if (-not $any) {
        Write-UpgradeOk '    None - no package.json versions changed.'
    }

    Write-Host ''
    $reverted = @($script:RevertedPkgs | Where-Object { $_ } | Sort-Object -Unique)
    if ($reverted.Count -gt 0) {
        Write-UpgradeWarn 'Build-breaking upgrades skipped (kept at the highest version that passes verification):'
        foreach ($p in $reverted) { Write-Host "    - $p" }
    }
    else {
        Write-UpgradeOk 'No build-breaking upgrades: every available upgrade passed verification.'
    }

    Write-Host ''
    Write-UpgradeLog "Vulnerabilities: $($script:VulnBefore) before -> $($script:VulnAfter) after audit fix."
    if ($script:ForcedPkgs -and $script:ForcedPkgs.Count -gt 0) {
        Write-UpgradeWarn 'Security: force-upgraded these direct deps - review the code for compatibility:'
        foreach ($p in $script:ForcedPkgs) { Write-Host "    - $p" }
        if ($script:SecVerifyFailed) {
            Write-UpgradeErr "    Build currently FAILS - see $($script:SecVerifyLog)"
        }
    }
    $remaining = @($script:SecRemaining | Where-Object { $_ } | Sort-Object -Unique)
    if ($remaining.Count -gt 0) {
        Write-UpgradeWarn 'Vulnerabilities still present (transitive or unresolved):'
        foreach ($p in $remaining) { Write-Host "    - $p" }
    }

    Write-Host ''
    $blocked = @($script:DoctorBlocked | Where-Object { $_ } | Sort-Object -Unique)
    if ($blocked.Count -gt 0) {
        Write-UpgradeErr 'Doctor could not run (baseline verify failed) for:'
        foreach ($p in $blocked) { Write-Host "    - $p" }
    }

    Write-Host ''
    if ($script:PeerIssues) {
        Write-UpgradeWarn 'Peer dependency issues (not auto-fixed; review manually):'
        foreach ($line in @($script:PeerIssues -split "`r?`n")) {
            if ($null -ne $line) { Write-Host ("    {0}" -f $line) }
        }
    }
    else {
        Write-UpgradeOk 'Peer dependencies: no issues.'
    }

    Write-Host ''
    Write-UpgradeLog "Manifest snapshot (restore if needed): $($script:SnapshotDir)"
    Write-Host ''
}

function Invoke-UpgradeDependencies {
    $origPwd = Get-Location
    Set-Location -LiteralPath $script:UpgradeRepoRoot

    $script:UpgradePkgMgr = Get-UpgradePkgMgr
    $script:EslintReject = ''
    $script:RevertedPkgs = @()
    $script:ForcedPkgs = @()
    $script:SecRemaining = @()
    $script:SecVerifyLog = ''
    $script:VulnBefore = '?'
    $script:VulnAfter = '?'
    $script:SecVerifyFailed = $false
    $script:PeerIssues = ''
    $script:DoctorBlocked = @()

    Write-Host ''
    Write-Host '--------------------------------'
    Write-Host '🔄 Upgrading dependencies '
    Write-Host '--------------------------------'

    Write-UpgradeLog "📦  Detected package manager: $($script:UpgradePkgMgr)"

    Invoke-UpgradeToolsPhase
    Set-Location -LiteralPath $script:UpgradeRepoRoot

    $script:WorkspaceDirs = @(Get-UpgradeWorkspaceDirs)
    Write-UpgradeLog '📦  Workspace packages to upgrade:'
    foreach ($d in $script:WorkspaceDirs) { Write-Host "    - $d" }

    $script:SnapshotDir = New-UpgradeSnapshot
    Set-EslintReject

    if (-not $env:UPGRADE_SKIP_PREFLIGHT) {
        if (-not (Invoke-PreflightVerify)) {
            Write-UpgradeSummary
            Set-Location $origPwd
            return 1
        }
    }
    else {
        Write-UpgradeWarn '⏭  Skipping preflight verify (UPGRADE_SKIP_PREFLIGHT=1).'
    }

    foreach ($d in $script:WorkspaceDirs) {
        Invoke-DoctorUpgradeDir $d
    }

    Write-UpgradeLog "⬆️  Reconciling the workspace lockfile ($($script:UpgradePkgMgr) install)..."
    Invoke-DedupeMinReleaseAgeExclude
    $installCode = Invoke-UpgradeStep { & $script:UpgradePkgMgr install }
    if ($installCode -ne 0) {
        Write-UpgradeWarn 'Reconciling install returned non-zero.'
    }

    Write-UpgradeLog '🌐  Updating browserslist database...'
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        [void](Invoke-UpgradeStep { npx --yes update-browserslist-db@latest })
    }
    elseif (Get-Command npm -ErrorAction SilentlyContinue) {
        [void](Invoke-UpgradeStep { npm exec --yes -- update-browserslist-db@latest })
    }
    else {
        Write-UpgradeWarn 'npx/npm not found; skipping browserslist database update.'
    }

    Write-UpgradeOk '✅  Build-safe dependency upgrade completed'

    Invoke-SecurityPhase
    Invoke-PeersPhase
    Write-UpgradeSummary

    Set-Location $origPwd

    if ($script:SecVerifyFailed) { return 1 }
    if (@($script:DoctorBlocked | Where-Object { $_ }).Count -gt 0) { return 1 }
    if ($script:PeerIssues -and ($env:CI -or $env:UPGRADE_STRICT_PEERS)) {
        Write-UpgradeErr '❌  Peer dependency issues remain (CI/UPGRADE_STRICT_PEERS treats these as failure).'
        return 1
    }
    return 0
}

$exitCode = Invoke-UpgradeDependencies
if (-not $script:UpgradeDependenciesDotSourced) {
    exit $exitCode
}
