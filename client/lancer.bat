@echo off
title Nour - Chat Islamique avec IA
chcp 65001 >/dev/null 2>/dev/null
cd /d "%~dp0"

echo.
echo   ========================================
echo      Nour - Chat Islamique avec IA
echo   ========================================
echo.

rem -- 1) Verifier Node.js --------------------------------
where node >/dev/null 2>/dev/null
if errorlevel 1 (
  echo   [X] Node.js n'est pas installe.
  echo.
  echo   Telechargez-le sur https://nodejs.org
  echo   puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo   [OK] Node.js %NODE_VER%

rem -- 2) Verifier npm ------------------------------------
where npm >/dev/null 2>/dev/null
if errorlevel 1 (
  echo   [X] npm non disponible. Reinstallez Node.js.
  pause
  exit /b 1
)
echo   [OK] npm detecte

rem -- 3) Serveur deja en cours ? -------------------------
curl -s -o nul http://localhost:3001/api/health 2>/dev/null
if %errorlevel% equ 0 (
  echo.
  echo   Le serveur tourne deja sur le port 3001.
  echo   Ouverture du navigateur...
  start "" http://localhost:3001
  exit /b 0
)
echo   [*] Serveur non detecte -- demarrage...

rem -- 4) Dependencies racine -----------------------------
if not exist "node_modulespackage-lock.json" (
  echo.
  echo   [1/4] Installation des dependances racine...
  call npm install --prefer-offline
  if errorlevel 1 (
    echo   [X] Echec -- verifiez votre connexion internet.
    pause
    exit /b 1
  )
) else (
  echo   [OK] Dependencies racine
)

rem -- 5) Dependencies client -----------------------------
if not exist "client
ode_modulespackage-lock.json" (
  echo   [2/4] Installation des dependances client...
  cd client && call npm install --prefer-offline && cd ..
  if errorlevel 1 (
    echo   [X] Echec installation client.
    pause
    exit /b 1
  )
) else (
  echo   [OK] Dependencies client
)

rem -- 6) Dependencies serveur ----------------------------
if not exist "server
ode_modulespackage-lock.json" (
  echo   [3/4] Installation des dependances serveur...
  cd server && call npm install --prefer-offline && cd ..
  if errorlevel 1 (
    echo   [X] Echec installation serveur.
    pause
    exit /b 1
  )
) else (
  echo   [OK] Dependencies serveur
)

rem -- 7) Compiler le serveur -----------------------------
if not exist "serverdistindex.js" (
  echo   [4/4] Compilation du serveur...
  cd server && call npx tsc && cd ..
  echo   [OK] Serveur compile.
) else (
  echo   [OK] Serveur deja compile
)

rem -- 8) Compiler le client ------------------------------
if not exist "clientdistindex.html" (
  echo   [4/4] Compilation du frontend...
  cd client && call npm run build && cd ..
  echo   [OK] Frontend compile.
) else (
  echo   [OK] Frontend deja compile
)

echo.
echo   ========================================
echo     Demarrage sur http://localhost:3001
echo     Fermez cette fenetre pour arreter.
echo   ========================================
echo.

rem Ouvrir le navigateur apres 3 secondes
start /b cmd /c "timeout /t 3 /nobreak >/dev/null && start "" http://localhost:3001"

rem Lancer le serveur
call npm start
pause
