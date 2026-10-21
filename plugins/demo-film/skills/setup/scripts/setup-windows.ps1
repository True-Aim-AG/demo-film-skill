# Check and install the tools that demo films need, on Windows.
#
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File setup-windows.ps1            check only
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File setup-windows.ps1 -Install   install what is missing
#   ... -Install -DryRun                                                                 print the install commands only
#
# Tools: Git, Node.js 20 or later, pnpm, ffmpeg, Google Chrome. Installs with winget, then pnpm with npm.
# Safe to run again: it installs only what is missing. Runs under Windows PowerShell 5.1 and 7.
# Output: one line per tool (OK, MISSING, BLOCKED), then READY, NOT READY or BLOCKED.
# Exit code: 0 ready, 1 something missing (check mode), 2 blocked (ask IT).
#   ... -Pretend node,chrome                                                             test only: treat these tools as missing
param([switch]$Install, [switch]$DryRun, [string[]]$Pretend = @())

$ErrorActionPreference = "Continue"
if ($Pretend.Count -and $Install -and -not $DryRun) { Write-Output "-Pretend works only with -DryRun or without -Install"; exit 1 }

# The PATH of this process can be older than the registry (a terminal opened before an install).
# Rebuild it from the registry, and add the folders that installers use but do not always list.
function Update-SessionPath {
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $extra = @(
    (Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps"),
    (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links"),
    (Join-Path $env:APPDATA "npm"),
    (Join-Path $env:ProgramFiles "nodejs"),
    (Join-Path $env:ProgramFiles "Git\cmd")
  )
  $env:Path = (@($machine, $user) + $extra | Where-Object { $_ }) -join ";"
}

function Get-Version($cmd, $arg) {
  $c = Get-Command $cmd -ErrorAction SilentlyContinue
  if (-not $c) { return $null }
  try { $out = & $c.Source $arg 2>&1 | Select-Object -First 1 } catch { return $null }
  if ($LASTEXITCODE -ne 0 -and -not $out) { return $null }
  return [string]$out
}

function Find-Chrome {
  $paths = @(
    (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
    (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe")
  )
  foreach ($p in $paths) { if ($p -and (Test-Path $p)) { return $p } }
  $reg = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
  if (Test-Path $reg) { $v = (Get-ItemProperty $reg)."(default)"; if ($v -and (Test-Path $v)) { return $v } }
  return $null
}

function Test-Tools {
  $r = [ordered]@{}
  $git = Get-Version "git" "--version"
  if ($git) { $r.git = "OK git " + ($git -replace "^git version ", "") } else { $r.git = "MISSING git" }
  $node = Get-Version "node" "-v"
  if ($node -and $node -match "^v(\d+)\.") {
    if ([int]$Matches[1] -ge 20) { $r.node = "OK node $node" } else { $r.node = "MISSING node (found $node, need 20 or later)" }
  } else { $r.node = "MISSING node" }
  $pnpm = Get-Version "pnpm" "-v"
  if ($pnpm) { $r.pnpm = "OK pnpm $pnpm" } else { $r.pnpm = "MISSING pnpm" }
  $ff = Get-Version "ffmpeg" "-version"
  if ($ff) { $r.ffmpeg = "OK ffmpeg " + ($ff -replace "^ffmpeg version (\S+).*", '$1') } else { $r.ffmpeg = "MISSING ffmpeg" }
  $chrome = Find-Chrome
  if ($chrome) { $r.chrome = "OK chrome $chrome" } else { $r.chrome = "MISSING chrome" }
  # -File passes "node,chrome" as one string, so split it here.
  foreach ($k in (($Pretend -join ",") -split ",")) { if ($r.Contains($k)) { $r[$k] = "MISSING $k (pretend)" } }
  return $r
}

function Show-Tools($r) { foreach ($k in $r.Keys) { Write-Output $r[$k] } }

# What each tool is, in one plain line, and how to install it.
$plan = [ordered]@{
  git    = @{ why = "Git downloads the demo-film skill and its updates. Windows can ask for permission: click Yes."; id = "Git.Git"; name = "Git" }
  node   = @{ why = "Node.js runs the film tools. Windows can ask for permission: click Yes."; id = "OpenJS.NodeJS.LTS"; name = "Node.js" }
  ffmpeg = @{ why = "ffmpeg turns the recorded frames into a video file."; id = "Gyan.FFmpeg"; name = "ffmpeg" }
  chrome = @{ why = "Google Chrome is the browser that records your app. Windows can ask for permission: click Yes."; id = "Google.Chrome"; name = "Google Chrome" }
}

function Stop-Blocked($what) {
  Write-Output "BLOCKED $what"
  Write-Output "Ask IT to allow $what on this computer, then run the setup again."
  exit 2
}

Update-SessionPath
$state = Test-Tools
Show-Tools $state
$missing = @($state.Keys | Where-Object { $state[$_] -like "MISSING*" })
if (-not $missing.Count) { Write-Output "READY"; exit 0 }
if (-not $Install) { Write-Output "NOT READY: missing $($missing -join ', ')"; exit 1 }

$winget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $winget -and ($missing | Where-Object { $_ -ne "pnpm" })) {
  Stop-Blocked "winget (App Installer from the Microsoft Store)"
}

foreach ($k in @("git", "node", "ffmpeg", "chrome")) {
  if ($missing -notcontains $k) { continue }
  $p = $plan[$k]
  Write-Output "STEP $($p.why)"
  $wargs = @("install", "--id", $p.id, "--exact", "--source", "winget", "--silent", "--accept-source-agreements", "--accept-package-agreements")
  Write-Output "RUN winget $($wargs -join ' ')"
  if ($DryRun) { continue }
  & $winget.Source @wargs
  $code = $LASTEXITCODE
  Update-SessionPath
  # winget returns a non-zero code when the package is already there; the version check decides.
  $after = Test-Tools
  if ($after[$k] -like "MISSING*") {
    if ($code -ne 0) { Write-Output "winget exit code: $code" }
    Stop-Blocked "$($p.name) (winget package $($p.id))"
  }
  Write-Output $after[$k]
}

if ($missing -contains "pnpm") {
  Write-Output "STEP pnpm installs the parts of the film engine."
  Write-Output "RUN npm install -g pnpm"
  if (-not $DryRun) {
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npm) { Stop-Blocked "Node.js (npm is missing)" }
    & $npm.Source install -g pnpm
    Update-SessionPath
    $after = Test-Tools
    if ($after.pnpm -like "MISSING*") { Stop-Blocked "npm to install pnpm (npm install -g pnpm)" }
    Write-Output $after.pnpm
  }
}

if ($DryRun) { Write-Output "DRY RUN: nothing was installed"; exit 1 }
$final = Test-Tools
Show-Tools $final
if (@($final.Keys | Where-Object { $final[$_] -like "MISSING*" }).Count) { Write-Output "NOT READY"; exit 1 }
Write-Output "READY"
exit 0
