# upgrade-tools.ps1
#
# Upgrades development tools (Node.js via nvm-windows, npm, the project's package
# manager, npm-check-updates, and doctoc) to their latest versions. Project
# agnostic: the package manager is auto-detected from the root lockfile.
#
# nvm-windows only affects the current PowerShell session. Dot-source so PATH
# changes apply:
#   . .\scripts\upgrade-tools.ps1
# Aborts if executed as .\scripts\upgrade-tools.ps1 unless CI=1 or
# UPGRADE_ALLOW_EXEC=1 / TRANSREWRT_UPGRADE_ALLOW_EXEC=1 (for automation).
#
# Env vars (used when sourced from upgrade-dependencies.ps1):
#   UPGRADE_TOOLS_DEFINE_ONLY=1    Define Invoke-UpgradeTools but do not run it.
#   UPGRADE_TOOLS_SUPPRESS_DONE=1  Suppress the trailing "Done." line.
#   TRANSREWRT_UPGRADE_TOOLS_*     Accepted aliases for the above.
#

$script:UpgradeScriptDir = $PSScriptRoot
$script:UpgradeRepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

. (Join-Path $script:UpgradeScriptDir 'upgrade-common.ps1')

$script:UpgradeToolsDotSourced = ($MyInvocation.InvocationName -eq '.')

if (-not $script:UpgradeToolsDotSourced) {
    if (-not (Test-UpgradeAllowExec)) {
        Write-UpgradeErr 'Abort: dot-source this script so nvm applies to your current shell.'
        Write-Host "  . `"$PSCommandPath`"" -ForegroundColor Green
        Write-UpgradeWarn '(Automation: set CI=1 or UPGRADE_ALLOW_EXEC=1 to allow execution without dot-sourcing.)'
        exit 1
    }
}

function Resolve-NvmLtsNodeVersion {
    param([string] $InstallOut)

    if ($InstallOut -match 'nvm use (\d+\.\d+\.\d+)') {
        return $Matches[1]
    }
    if ($InstallOut -match 'Now using node v(\d+\.\d+\.\d+)') {
        return $Matches[1]
    }

    $nvmList = (nvm list 2>&1 | Out-String)

    if ($nvmList -match 'default ->') {
        if ($nvmList -match '\(-> v(\d+\.\d+\.\d+)\)') {
            return $Matches[1]
        }
    }
    if ($nvmList -match '(?m)^\s*->\s+v(\d+\.\d+\.\d+)') {
        return $Matches[1]
    }
    if ($nvmList -match '\*\s*(\d+\.\d+\.\d+)') {
        return $Matches[1]
    }

    $cur = (nvm current 2>&1 | Out-String).Trim()
    if ($cur -and $cur -ne 'system' -and $cur -ne 'none') {
        return ($cur -replace '^v', '')
    }

    return $null
}

function Write-UpgradeVerLine {
    param(
        [string] $Label,
        [string] $Before,
        [string] $After
    )
    $pad = $Label.PadRight(6)
    if ($Before -eq $After) {
        Write-Host ("  {0} : {1} (unchanged)" -f $pad, $After)
    }
    else {
        Write-Host ("  {0} : {1} -> {2}" -f $pad, $Before, $After) -ForegroundColor Yellow
    }
}

function Invoke-UpgradeTools {
    $__trPrevEap = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Stop'

        Write-Host ''
        Write-Host '--------------------------------'
        Write-Host '🔄 Upgrading tools '
        Write-Host '--------------------------------'

        $pkgMgr = Get-UpgradePkgMgr
        $script:UpgradePkgMgr = $pkgMgr

        $nodeBefore = try { (node --version 2>$null) } catch { 'n/a' }
        if (-not $nodeBefore) { $nodeBefore = 'n/a' }
        $npmBefore = try { (npm --version 2>$null) } catch { 'n/a' }
        if (-not $npmBefore) { $npmBefore = 'n/a' }
        $pmBefore = try { (& $pkgMgr --version 2>$null) } catch { 'n/a' }
        if (-not $pmBefore) { $pmBefore = 'n/a' }

        $nvmDir = if ($env:NVM_DIR) { $env:NVM_DIR } else { Join-Path $HOME '.nvm' }
        if (Test-Path -LiteralPath (Join-Path $nvmDir '.git') -PathType Container) {
            Write-UpgradeLog 'Upgrading nvm to the latest release...'
            Push-Location $nvmDir
            try {
                git fetch -q --tags origin
                $tag = git describe --abbrev=0 --tags --match 'v[0-9]*' "$(git rev-list --tags --max-count=1)"
                if ($LASTEXITCODE -eq 0 -and $tag) {
                    git checkout -q $tag
                }
            }
            finally {
                Pop-Location
            }
        }

        if (Get-Command nvm -ErrorAction SilentlyContinue) {
            Write-UpgradeLog 'Upgrading Node.js to the latest LTS version...'
            $installOut = (nvm install lts 2>&1 | Out-String).Trim()
            Write-Host $installOut
            $nodeVer = Resolve-NvmLtsNodeVersion -InstallOut $installOut
            if ($nodeVer) {
                Write-UpgradeOk "Using Node.js version $nodeVer"
                nvm use $nodeVer
            }
            else {
                Write-UpgradeWarn 'Could not parse installed LTS version; using nvm use lts'
                nvm use lts
            }
            $resolvedNodeVer = ((nvm current 2>&1 | Out-String).Trim() -replace '^v', '')
            if (-not $resolvedNodeVer -or $resolvedNodeVer -eq 'system') {
                $resolvedNodeVer = $nodeVer
            }

            $showNvmTip = $false
            if ($env:UPGRADE_TOOLS_EMBEDDED -eq '1' -or $env:TRANSREWRT_UPGRADE_TOOLS_EMBEDDED -eq '1') {
                $parentDotSourced = $false
                $ts = Get-Variable -Name UpgradeDependenciesDotSourced -Scope Script -ErrorAction SilentlyContinue
                if ($null -eq $ts) {
                    $ts = Get-Variable -Name TransrewrtUpgradeDotSourced -ErrorAction SilentlyContinue
                }
                if ($null -ne $ts) {
                    $parentDotSourced = [bool]$ts.Value
                }
                $showNvmTip = -not $parentDotSourced
            }
            else {
                $showNvmTip = -not $script:UpgradeToolsDotSourced
            }

            if ($showNvmTip -and $resolvedNodeVer -and $resolvedNodeVer -ne 'system') {
                $tipName = if ($env:UPGRADE_TOOLS_EMBEDDED -eq '1' -or $env:TRANSREWRT_UPGRADE_TOOLS_EMBEDDED -eq '1') {
                    'upgrade-dependencies.ps1'
                }
                else {
                    'upgrade-tools.ps1'
                }
                $tipScript = Join-Path $script:UpgradeScriptDir $tipName
                Write-Host ''
                Write-UpgradeWarn 'Tip: This run was a separate process; use dot-source so nvm applies to this shell:'
                Write-Host "  . `"$tipScript`"" -ForegroundColor Green
            }
        }
        else {
            Write-UpgradeWarn 'nvm not found. Install nvm-windows (https://github.com/coreybutler/nvm-windows) to upgrade Node.js, or skip this step.'
        }

        Write-UpgradeLog '📦  Upgrading npm to the latest version...'
        npm install -g npm@latest

        Write-UpgradeLog "📦  Upgrading ${pkgMgr}, npm-check-updates and doctoc..."
        if ($pkgMgr -eq 'npm') {
            npm install -g npm-check-updates doctoc
        }
        else {
            npm install -g $pkgMgr npm-check-updates doctoc
        }

        $pmNewVer = $null
        try {
            $lsJson = npm ls -g $pkgMgr --depth=0 --json 2>$null | Out-String
            if ($lsJson) {
                $pmNewVer = ($lsJson | ConvertFrom-Json).dependencies.$pkgMgr.version
            }
        }
        catch {
            $pmNewVer = $null
        }

        if ($pmNewVer) {
            Write-UpgradeLog "✏️  Updating packageManager field to ${pkgMgr}@${pmNewVer}..."
            $pkgPath = (Join-Path $script:UpgradeRepoRoot 'package.json') -replace '\\', '/'
            $env:PKG_FILE = $pkgPath
            $env:PKG_MGR = $pkgMgr
            $env:PM_VER = $pmNewVer
            node -e @"
const fs = require('fs');
const f = process.env.PKG_FILE;
const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
pkg.packageManager = process.env.PKG_MGR + '@' + process.env.PM_VER;
fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n');
"@
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to update packageManager in package.json (node exit code $LASTEXITCODE)"
            }
            Write-UpgradeOk "✔  packageManager updated to ${pkgMgr}@${pmNewVer}"

            if (Get-Command corepack -ErrorAction SilentlyContinue) {
                if ($pkgMgr -in @('pnpm', 'yarn', 'npm')) {
                    Write-UpgradeLog "📦  Activating ${pkgMgr}@${pmNewVer} via corepack..."
                    try { corepack prepare "${pkgMgr}@${pmNewVer}" --activate } catch { }
                }
            }
        }
        else {
            Write-UpgradeWarn "⚠  Could not determine installed ${pkgMgr} version; skipping packageManager update"
        }

        $nodeAfter = try { (node --version 2>$null) } catch { 'n/a' }
        if (-not $nodeAfter) { $nodeAfter = 'n/a' }
        $npmAfter = try { (npm --version 2>$null) } catch { 'n/a' }
        if (-not $npmAfter) { $npmAfter = 'n/a' }
        $pmAfter = try { (& $pkgMgr --version 2>$null) } catch { 'n/a' }
        if (-not $pmAfter) { $pmAfter = 'n/a' }

        Write-Host ''
        Write-Host '--------------------------------'
        Write-Host '🔧 Tool versions (before -> after)'
        Write-Host '--------------------------------'
        Write-UpgradeVerLine 'node' $nodeBefore $nodeAfter
        Write-UpgradeVerLine 'npm' $npmBefore $npmAfter
        if ($pkgMgr -ne 'npm') {
            Write-UpgradeVerLine $pkgMgr $pmBefore $pmAfter
        }
        Write-Host '--------------------------------'
        Write-Host ''

        if (-not (Test-UpgradeToolsSuppressDone)) {
            Write-Host 'Done.'
        }
    }
    finally {
        $ErrorActionPreference = $__trPrevEap
    }
}

$runUpgradeTools = $true
if (
    ($env:UPGRADE_TOOLS_DEFINE_ONLY -eq '1' -or $env:TRANSREWRT_UPGRADE_TOOLS_DEFINE_ONLY -eq '1') -and
    $script:UpgradeToolsDotSourced
) {
    $runUpgradeTools = $false
}

if ($runUpgradeTools) {
    Invoke-UpgradeTools
}
