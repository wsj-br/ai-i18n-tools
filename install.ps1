# Install the ai-i18n-tools standalone executable on Windows.
#
#   irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
#
# Windows PowerShell 5.1 and PowerShell 7+. The script block keeps preference
# variables and helper functions out of the caller when this file is invoked
# with iex.
#
# Environment:
#   AI_I18N_VERSION      Release tag to install, such as v1.11.0.
#                        Default: the latest GitHub release.
#   AI_I18N_INSTALL_DIR  Directory for ai-i18n-tools.exe.
#                        Default: $HOME\.local\bin
#   AI_I18N_BASE_URL     Download directory URL, without a file name.
#                        Default: the GitHub release download URL.

& {
    $ErrorActionPreference = "Stop"
    $ProgressPreference = "SilentlyContinue"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    } catch {
        # PowerShell 7 on some hosts does not expose ServicePointManager. TLS
        # defaults on those hosts already allow the GitHub download.
    }

    function Split-PathList([string]$PathValue) {
        if ([string]::IsNullOrEmpty($PathValue)) {
            return @()
        }
        return @($PathValue -split ";" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    }

    function Test-DirOnPath([string]$PathValue, [string]$Dir) {
        $target = $Dir.TrimEnd("\", "/")
        # @(...) keeps a single PATH entry a one-element array. foreach would
        # otherwise walk the characters of that string.
        foreach ($entry in @(Split-PathList $PathValue)) {
            if ($entry.TrimEnd("\", "/") -ieq $target) {
                return $true
            }
        }
        return $false
    }

    function Save-Url([string]$Url, [string]$OutFile) {
        try {
            Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        } catch {
            throw "Download failed: $Url. $($_.Exception.Message)"
        }
    }

    function Get-ExpectedHash([string]$SumsPath, [string]$AssetName) {
        foreach ($raw in @(Get-Content -LiteralPath $SumsPath)) {
            $line = $raw.Trim()
            if ($line -match "^([0-9A-Fa-f]{64})\s+\*?(\S+)\s*$") {
                if ($Matches[2] -eq $AssetName) {
                    return $Matches[1].ToLowerInvariant()
                }
            }
        }
        throw "SHA256SUMS.txt has no checksum for $AssetName"
    }

    $arch = $env:PROCESSOR_ARCHITECTURE
    if ($env:PROCESSOR_ARCHITEW6432) {
        $arch = $env:PROCESSOR_ARCHITEW6432
    }
    if ($arch -eq "AMD64" -or $arch -eq "x64") {
        $asset = "ai-i18n-tools-win-x64.exe"
    } elseif ($arch -eq "ARM64") {
        Write-Host "ai-i18n-tools: Windows on ARM uses the x64 executable under emulation"
        $asset = "ai-i18n-tools-win-x64.exe"
    } else {
        throw "ai-i18n-tools publishes a 64-bit Windows executable. This system reports '$arch'."
    }

    if ($env:AI_I18N_BASE_URL) {
        $base = $env:AI_I18N_BASE_URL.TrimEnd("/")
    } elseif ($env:AI_I18N_VERSION) {
        $base = "https://github.com/wsj-br/ai-i18n-tools/releases/download/$($env:AI_I18N_VERSION)"
    } else {
        $base = "https://github.com/wsj-br/ai-i18n-tools/releases/latest/download"
    }

    if ($env:AI_I18N_INSTALL_DIR) {
        $installDir = $env:AI_I18N_INSTALL_DIR.TrimEnd("\", "/")
    } else {
        $installDir = Join-Path $HOME ".local\bin"
    }
    if ([string]::IsNullOrWhiteSpace($installDir)) {
        throw "AI_I18N_INSTALL_DIR is empty"
    }

    $work = Join-Path ([System.IO.Path]::GetTempPath()) ("ai-i18n-tools-install-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $work | Out-Null
    try {
        $downloaded = Join-Path $work $asset
        $sumsPath = Join-Path $work "SHA256SUMS.txt"
        Write-Host "ai-i18n-tools: downloading $asset from $base"
        Save-Url "$base/$asset" $downloaded
        Save-Url "$base/SHA256SUMS.txt" $sumsPath

        if ((Get-Item -LiteralPath $downloaded).Length -lt 1) {
            throw "Download was empty: $asset"
        }

        $expected = Get-ExpectedHash $sumsPath $asset
        $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $downloaded).Hash.ToLowerInvariant()
        if ($actual -ne $expected) {
            throw "Checksum mismatch for $asset"
        }
        Write-Host "ai-i18n-tools: checksum verified"

        New-Item -ItemType Directory -Force -Path $installDir | Out-Null
        $dest = Join-Path $installDir "ai-i18n-tools.exe"
        try {
            Copy-Item -LiteralPath $downloaded -Destination $dest -Force
        } catch {
            throw "Could not write $dest. Close any running ai-i18n-tools process and run the installer again. $($_.Exception.Message)"
        }
        Unblock-File -LiteralPath $dest

        $versionOutput = & $dest --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "The installed executable failed to run: $dest"
        }
        $versionLine = @($versionOutput) | Select-Object -First 1
        Write-Host "ai-i18n-tools: installed $dest ($versionLine)"

        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if (-not (Test-DirOnPath $userPath $installDir)) {
            if ([string]::IsNullOrEmpty($userPath)) {
                $newUserPath = $installDir
            } else {
                $newUserPath = "$installDir;$userPath"
            }
            [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
            Write-Host "ai-i18n-tools: added $installDir to the user Path"
        } else {
            Write-Host "ai-i18n-tools: user Path already includes $installDir"
        }

        if (-not (Test-DirOnPath $env:Path $installDir)) {
            $env:Path = "$installDir;$env:Path"
            Write-Host "ai-i18n-tools: open a new terminal so Path includes $installDir"
            Write-Host "ai-i18n-tools: this session can already run ai-i18n-tools"
        } else {
            Write-Host "ai-i18n-tools: command is available in this session"
        }
    } finally {
        if (Test-Path -LiteralPath $work) {
            Remove-Item -LiteralPath $work -Recurse -Force
        }
    }
}
