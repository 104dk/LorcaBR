# LorcanaBR GitHub Sync Script
# Usage: .\sync-github.ps1 "Your commit message"

param (
    [string]$commitMessage = "Update LorcanaBR: Bug fixes and features"
)

Write-Host "--- Iniciando Sincronização com GitHub ---" -ForegroundColor Cyan

# Verificando se o Git está inicializado
if (!(Test-Path .git)) {
    Write-Host "Inicializando repositório Git..."
    git init
    git remote add origin https://github.com/104dk/LorcBR.git
    git branch -M main
}

# Verificando Status
Write-Host "Adicionando arquivos..."
git add .

# Commit
Write-Host "Executando commit: $commitMessage"
git commit -m "$commitMessage"

# Push
Write-Host "Enviando para o GitHub (main)..."
$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERRO] O push falhou!" -ForegroundColor Red
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "1. O repositório 'https://github.com/104dk/LorcBR.git' não existe ou é privado."
    Write-Host "2. Você não tem permissão de escrita (precisa configurar SSH ou Token)."
    Write-Host "3. O nome do repositório mudou."
    
    $newUrl = Read-Host "`nDeseja atualizar a URL do repositório? (Cole a URL nova ou pressione Enter para cancelar)"
    if ($newUrl) {
        git remote set-url origin $newUrl
        Write-Host "URL atualizada para $newUrl. Tente rodar o script novamente." -ForegroundColor Green
    }
} else {
    Write-Host "`n[SUCESSO] Projeto sincronizado com sucesso!" -ForegroundColor Green
}

Write-Host "`nPressione qualquer tecla para sair..."
$null = [System.Console]::ReadKey($true)
