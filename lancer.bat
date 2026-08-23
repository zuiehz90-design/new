@echo off
title Nour - Chat Islamique avec IA
chcp 65001 >nul 2>nul
cd /d "%~dp0"

echo.
echo   ==========================================
echo      Nour - Chat Islamique avec IA
echo   ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [X] Node.js non detecte.
  echo   Telechargez-le sur https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ("node -v") do set NODE_VER=%%v
echo   [OK] Node.js %NODE_VER%

where npm >nul 2>nul
if errorlevel 1 (
  echo   [X] npm non disponible.
  pause
  exit /b 1
)
echo   [OK] npm detecte

curl -s -o nul http://localhost:3001/api/health 2>nul
if %errorlevel% equ 0 (
  echo.
  echo   Le serveur tourne deja sur le port 3001.
  echo   Ouverture du navigateur...
  start "" http://localhost:3001
  exit /b 0
)
echo   [*] Serveur non detecte -- demarrage...

if not exist "node_modules\package-lock.json" (
  echo   [1/4] Installation racine...
  call npm install --prefer-offline
  if errorlevel 1 (echo   [X] Echec. pause & exit /b 1)
) else (echo   [OK] Dependencies racine)

if not exist "client\node_modules\package-lock.json" (
  echo   [2/4] Installation client...
  cd client && call npm install --prefer-offline && cd ..
  if errorlevel 1 (echo   [X] Echec client. pause & exit /b 1)
) else (echo   [OK] Dependencies client)

if not exist "server\node_modules\package-lock.json" (
  echo   [3/4] Installation serveur...
  cd server && call npm install --prefer-offline && cd ..
  if errorlevel 1 (echo   [X] Echec serveur. pause & exit /b 1)
) else (echo   [OK] Dependencies serveur)

if not exist "server\dist\index.js" (
  echo   [4/4] Compilation serveur...
  cd server && call npx tsc && cd ..
  echo   [OK] Serveur compile.
) else (echo   [OK] Serveur deja compile)

if not exist "client\dist\index.html" (
  echo   [4/4] Compilation frontend...
  cd client && call npm run build && cd ..
  echo   [OK] Frontend compile.
) else (echo   [OK] Frontend deja compile)

echo.
echo   ==========================================
echo     Demarrage sur http://localhost:3001
echo     Fermez cette fenetre pour arreter.
echo   ==========================================
echo.
start /b cmd /c "timeout /t 3 /nobreak >nul && start "" http://localhost:3001"

call npm start
pause