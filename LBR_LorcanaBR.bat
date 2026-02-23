@echo off
title LBR_LorcanaBR - Iniciador do Jogo
color 0B

echo ===================================================
echo             LBR_LorcanaBR - Fase 10
echo ===================================================
echo.
echo Iniciando o Servidor Backend...
cd backend
start "LorcanaBR Backend" cmd /c "npm run dev"
cd ..

echo Iniciando o Servidor Frontend...
cd frontend
start "LorcanaBR Frontend" cmd /c "npm run dev"
cd ..

echo.
echo Aguardando os servidores iniciarem...
timeout /t 5 /nobreak > nul

echo.
echo Abrindo o jogo no navegador principal...
start http://localhost:3000

echo.
echo Servidores rodando em segundo plano.
echo Voce pode fechar esta janela verde quando quiser (os servidores continuarão nas janelas pretas).
echo ===================================================
timeout /t 3 > nul
exit
