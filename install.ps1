# Pinax - Windows Installer Script
# PowerShell script analogous to install.sh for Linux

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Instalando Pinax 1.4.3..." -ForegroundColor Cyan
Write-Host ""

# ---------- Check Admin (for Visual Studio Build Tools if needed) ----------
function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ---------- Check Visual Studio Build Tools ----------
Write-Host "Verificando Visual Studio Build Tools..." -ForegroundColor Yellow
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$hasVS = $false
if (Test-Path $vsWhere) {
    $vsPath = & $vsWhere -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
    if ($vsPath) {
        $hasVS = $true
        Write-Host "  Visual Studio encontrado: $vsPath" -ForegroundColor Green
    }
}

if (-not $hasVS) {
    Write-Host "  Visual Studio Build Tools com C++ nao encontrado!" -ForegroundColor Red
    Write-Host "  Por favor, instale o Visual Studio Build Tools com o workload 'Desktop development with C++'." -ForegroundColor Yellow
    Write-Host "  Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host ""

# ---------- Install Rust ----------
Write-Host "Verificando Rust..." -ForegroundColor Yellow
$cargoPath = "$env:USERPROFILE\.cargo\bin"
$env:PATH = "$cargoPath;$env:PATH"

if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "  Rust nao encontrado. Instalando via rustup..." -ForegroundColor Yellow
    $rustupInit = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustupInit
    & $rustupInit -y --default-toolchain stable
    $env:PATH = "$cargoPath;$env:PATH"
    Write-Host "  Rust instalado!" -ForegroundColor Green
} else {
    $rustVersion = rustc --version
    Write-Host "  Rust ja esta instalado: $rustVersion" -ForegroundColor Green
}
Write-Host ""

# ---------- Check Node.js ----------
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "  Por favor, instale o Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
} else {
    $nodeVersion = node --version
    Write-Host "  Node.js ja esta instalado: $nodeVersion" -ForegroundColor Green
}
Write-Host ""

# ---------- Check pnpm ----------
Write-Host "Verificando pnpm..." -ForegroundColor Yellow
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "  pnpm nao encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "  pnpm instalado!" -ForegroundColor Green
} else {
    $pnpmVersion = pnpm --version
    Write-Host "  pnpm ja esta instalado: $pnpmVersion" -ForegroundColor Green
}
Write-Host ""

# ---------- Install Project Dependencies ----------
Write-Host "Instalando dependencias do projeto..." -ForegroundColor Yellow
pnpm install
Write-Host "  Dependencias instaladas!" -ForegroundColor Green
Write-Host ""

# ---------- Build ----------
Write-Host "Compilando o projeto (isso pode demorar na primeira vez)..." -ForegroundColor Yellow
pnpm tauri build
Write-Host "  Compilacao concluida!" -ForegroundColor Green
Write-Host ""

# ---------- Results ----------
$bundlePath = "src-tauri\target\release\bundle\nsis"
if (Test-Path $bundlePath) {
    $installer = Get-ChildItem -Path $bundlePath -Filter "*setup*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($installer) {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Pinax compilado com sucesso!" -ForegroundColor Green
        Write-Host "" 
        Write-Host "  Instalador gerado em:" -ForegroundColor White
        Write-Host "  $($installer.FullName)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Execute o instalador para instalar o Pinax no Windows." -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Cyan
    }
} else {
    Write-Host "  Build concluido, mas o instalador NSIS nao foi encontrado." -ForegroundColor Yellow
    Write-Host "  Verifique a pasta: src-tauri\target\release\bundle\" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para executar em modo de desenvolvimento:" -ForegroundColor White
Write-Host "  pnpm tauri dev" -ForegroundColor Yellow
Write-Host ""
