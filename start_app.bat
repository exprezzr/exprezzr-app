@echo off
title Lanzador Exprezzr LLC - CAPI
echo ----------------------------------------------
echo 1. Limpiando procesos de Node y liberando puertos...
taskkill /F /IM node.exe /T 2>nul
echo ----------------------------------------------
echo 2. Iniciando Servidor...
echo ----------------------------------------------
:: Esto asegura que se lean las variables del .env y arranque el servidor
node -r dotenv/config server.js
pause