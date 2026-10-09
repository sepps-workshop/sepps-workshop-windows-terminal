# Installs the Sepp's Workshop color scheme into Windows Terminal as a
# JSON Fragment Extension. Your settings.json is not touched.
# Run from a clone of this repository: .\install.ps1
# https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions
#
# Keep this file ASCII only: Windows PowerShell 5.1 reads a script without a
# byte order mark in the ANSI code page. The fragment is copied byte for byte
# and never parsed: it must stay UTF-8 without a byte order mark.

$ErrorActionPreference = "Stop"

$file = "sepps-workshop-windows-terminal.json"
$source = Join-Path $PSScriptRoot "dist\$file"
$targetDir = Join-Path $env:LOCALAPPDATA "Microsoft\Windows Terminal\Fragments\SeppsWorkshop"

if (-not (Test-Path -LiteralPath $source)) {
    Write-Error "Fragment not found at $source. Restore it with 'git restore dist' (or build it: 'npm install', then 'npm run build')."
    exit 1
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Force -LiteralPath $source -Destination (Join-Path $targetDir $file)

Write-Host "Installed the Sepp's Workshop color scheme to $targetDir"
Write-Host "Restart Windows Terminal, then pick it under Settings -> Color schemes"
Write-Host "(or per profile under Settings -> <profile> -> Appearance -> Color scheme)."
