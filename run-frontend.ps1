# Inicia o Frontend em modo Produção (sem bug do Turbopack)
Write-Host "=== LorcanaBR: Iniciando Frontend ===" -ForegroundColor Magenta
cd frontend

# Verifica se a build existe, se não, compila primeiro
if (!(Test-Path ".next")) {
    Write-Host "[!] Build de produção não encontrada. Compilando o jogo (isso pode levar um minuto)..." -ForegroundColor Yellow
    npm run build
}

Write-Host "[✓] Iniciando servidor de interface..." -ForegroundColor Green
npm start
