@echo off
title LorcanaBR - Inicializador Profissional
color 0B

echo =======================================================
echo          LorcanaBR - Inicializador do Jogo
echo =======================================================
echo.
echo Preparando o ambiente de desenvolvimento local...
echo.

echo [1/2] Iniciando o Backend em uma nova janela...
start "LorcanaBR - Backend" powershell.exe -ExecutionPolicy Bypass -File .\run-backend.ps1

echo [2/2] Iniciando o Frontend em uma nova janela...
start "LorcanaBR - Frontend" powershell.exe -ExecutionPolicy Bypass -File .\run-frontend.ps1

echo.
echo =======================================================
echo Tudo pronto! Os servidores estao iniciando.
echo O jogo estara disponivel no seu navegador em:
echo http://localhost:3000
echo =======================================================
echo.
pause
