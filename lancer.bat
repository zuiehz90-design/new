@echo off
title Nour - Chat Islamique avec IA
chcp 65001 >nul 2>nul
cd /d "%~dp0"

echo.
echo   ============================================
echo      NOUR - Chat Islamique avec IA
echo   ============================================
echo.

:: Verification de Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo   [X] Node.js non detecte.
  echo   Telechargez-le sur : https://nodejs.org
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo   [OK] Node.js %NODE_VER%

:: Verification de npm
where npm >nul 2>nul
if errorlevel 1 (
  echo   [X] npm non disponible.
  echo.
  pause
  exit /b 1
)
echo   [OK] npm detecte

:: Verification si le serveur tourne deja
echo.
echo   Verification du serveur...
curl -s -o nul http://localhost:3001/api/health 2>nul
if %errorlevel% equ 0 (
  echo   [OK] Le serveur tourne deja sur le port 3001
  echo.
  echo   Ouverture du navigateur...
  start "" http://localhost:3001
  echo   [OK] Navigateur ouvert
  echo.
  pause
  exit /b 0
)
echo   [~] Serveur non detecte - demarrage en cours...

:: Installation des dependances
echo.
echo   --------------------------------------------
echo     Installation des dependances
echo   --------------------------------------------

if not exist "node_modules\package-lock.json" (
  echo   [1/3] Installation racine...
  call npm install --prefer-offline
  if errorlevel 1 (
    echo   [X] Echec installation racine
    pause
    exit /b 1
  )
) else (
  echo   [OK] Dependances racine deja installees
)

if not exist "client\node_modules\package-lock.json" (
  echo   [2/3] Installation client...
  cd client && call npm install --prefer-offline && cd ..
  if errorlevel 1 (
    echo   [X] Echec installation client
    pause
    exit /b 1
  )
) else (
  echo   [OK] Dependances client deja installees
)

if not exist "server\node_modules\package-lock.json" (
  echo   [3/3] Installation serveur...
  cd server && call npm install --prefer-offline && cd ..
  if errorlevel 1 (
    echo   [X] Echec installation serveur
    pause
    exit /b 1
  )
) else (
  echo   [OK] Dependances serveur deja installees
)

:: Compilation
echo.
echo   --------------------------------------------
echo     Compilation du projet
echo   --------------------------------------------

if not exist "server\dist\index.js" (
  echo   [~] Compilation du serveur...
  cd server && call npx tsc && cd ..
  if errorlevel 1 (
    echo   [X] Echec compilation serveur
    pause
    exit /b 1
  )
  echo   [OK] Serveur compile
) else (
  echo   [OK] Serveur deja compile
)

if not exist "client\dist\index.html" (
  echo   [~] Compilation du frontend...
  cd client && call npm run build && cd ..
  if errorlevel 1 (
    echo   [X] Echec compilation frontend
    pause
    exit /b 1
  )
  echo   [OK] Frontend compile
) else (
  echo   [OK] Frontend deja compile
)

:: Demarrage
echo.
echo   ============================================
echo     Demarrage sur http://localhost:3001
echo     Appuyez sur Ctrl+C pour arreter.
echo   ============================================
echo.

:: Ouverture automatique du navigateur apres 3 secondes
start /b cmd /c "timeout /t 3 /nobreak >nul && start "" http://localhost:3001"

:: Demarrage du serveur
call npm start
pause
