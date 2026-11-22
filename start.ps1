<#
.SYNOPSIS
    Inicializa a Plataforma 3D de Geração e Distribuição de Energia Eólica e retorna o link de acesso.
.DESCRIPTION
    Verifica as dependências locais, encontra uma porta disponível (padrão 5173),
    inicia o servidor Vite e exibe claramente a URL local para abrir no navegador.
#>

param(
    [int]$Port = 5173,
    [switch]$Production,
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  PLATAFORMA 3D — CADEIA DE GERAÇÃO E DISTRIBUIÇÃO DE ENERGIA EÓLICA  " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica se o Node.js está instalado
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não encontrado no PATH. Instale o Node.js (v18+) para continuar." -ForegroundColor Red
    exit 1
}

# 2. Verifica se a pasta node_modules existe; se não, instala as dependências
if (-not (Test-Path -Path (Join-Path $PSScriptRoot "node_modules"))) {
    Write-Host "[1/3] Instalando dependências locais (three, gsap, katex, vite)..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[1/3] Dependências locais verificadas (node_modules OK)." -ForegroundColor Green
}

# 3. Encontra uma porta livre a partir da porta solicitada
function Test-PortInUse {
    param([int]$TestPort)
    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $TestPort)
        $listener.Start()
        return $false
    } catch {
        return $true
    } finally {
        if ($null -ne $listener) {
            $listener.Stop()
        }
    }
}

while (Test-PortInUse -TestPort $Port) {
    $Port++
}

$AppUrl = "http://localhost:$Port/"

# 4. Define o modo de execução (Desenvolvimento ou Preview Offline de Produção)
$ViteBin = Join-Path $PSScriptRoot "node_modules\vite\bin\vite.js"

if ($Production) {
    if (-not (Test-Path -Path (Join-Path $PSScriptRoot "dist\index.html"))) {
        Write-Host "[2/3] Compilando versão de produção offline (vite build)..." -ForegroundColor Yellow
        node $ViteBin build
    } else {
        Write-Host "[2/3] Build de produção offline localizado em ./dist." -ForegroundColor Green
    }
    $ViteArgs = @($ViteBin, "preview", "--port", "$Port", "--strictPort", "--host")
    $ModeLabel = "PRODUÇÃO OFFLINE (vite preview)"
} else {
    Write-Host "[2/3] Preparando servidor em modo de desenvolvimento rápido (Vite)..." -ForegroundColor Green
    $ViteArgs = @($ViteBin, "--port", "$Port", "--strictPort", "--host")
    $ModeLabel = "DESENVOLVIMENTO INTERATIVO (vite dev)"
}

Write-Host "[3/3] Iniciando servidor 3D ($ModeLabel)..." -ForegroundColor Green
Write-Host ""
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "  APLICAÇÃO PRONTA! ACESSE O LINK ABAIXO NO SEU NAVEGADOR:" -ForegroundColor White
Write-Host ""
Write-Host "  👉  $AppUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "  (Pressione Ctrl+C neste terminal quando quiser encerrar o servidor)" -ForegroundColor DarkGray
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host ""

if ($OpenBrowser) {
    Start-Process $AppUrl
}

# Executa o servidor Vite anexado ao terminal atual
& node @ViteArgs
