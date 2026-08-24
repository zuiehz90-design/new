const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// Identite Windows pour les notifications natives (centre de notifications)
app.setAppUserModelId('com.nour.desktop');

let mainWindow = null;
let serverProcess = null;

const isDev = !app.isPackaged;
const SERVER_PORT = 3001;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

// ---- Gestion de la configuration (DATABASE_URL) ----
function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveConfig(data) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(data, null, 2), 'utf8');
}

function getDatabaseUrl() {
  const cfg = loadConfig();
  // Priorité : variable d'environnement > config locale
  return process.env.DATABASE_URL || cfg.databaseUrl || '';
}

async function promptForUrl() {
  return new Promise((resolve) => {
    // Écouter l'IPC AVANT d'ouvrir la fenêtre
    const handler = (_event, url) => {
      saveConfig({ databaseUrl: url || '' });
      resolve(url || '');
    };
    ipcMain.once('set-database-url', handler);
    // Fallback si la fenêtre est fermée sans saisie
    const fallback = () => {
      ipcMain.removeListener('set-database-url', handler);
      resolve('');
    };

    const promptWin = new BrowserWindow({
      width: 520,
      height: 320,
      resizable: false,
      frame: true,
      title: 'Nour — Configuration base de données',
      webPreferences: { nodeIntegration: true, contextIsolation: false },
    });

    promptWin.once('closed', fallback);

    const html = `
      <html>
      <head><meta charset="utf-8"><title>Configuration</title></head>
      <body style="font-family:system-ui;background:#0a1a14;color:#e2e8f0;padding:20px;display:flex;flex-direction:column;height:100vh;box-sizing:border-box;margin:0">
        <h2 style="color:#cfa14a;margin:0 0 4px">Base de données PostgreSQL</h2>
        <p style="font-size:12px;color:#9ca3af;margin:0 0 16px">Collez votre DATABASE_URL Neon pour synchroniser vos données.</p>
        <input id="url" type="text" placeholder="postgresql://user:pass@host/db" style="padding:8px;border:1px solid #334155;border-radius:8px;background:#0f1f1b;color:#e2e8f0;width:100%;box-sizing:border-box;font-size:12px;margin-bottom:8px" />
        <p style="font-size:10px;color:#9ca3af;margin:0 0 16px">Vous pouvez aussi passer en mode hors-ligne : fermez cette fenêtre.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:auto">
          <button id="skip" style="padding:6px 14px;border:1px solid #334155;border-radius:8px;background:transparent;color:#9ca3af;cursor:pointer">Hors-ligne</button>
          <button id="save" style="padding:6px 14px;border:none;border-radius:8px;background:#cfa14a;color:#0a1a14;cursor:pointer;font-weight:bold">Connecter</button>
        </div>
        <script>
          const { ipcRenderer } = require('electron');
          document.getElementById('save').onclick = () => {
            const url = document.getElementById('url').value.trim();
            if (url) ipcRenderer.send('set-database-url', url);
            window.close();
          };
          document.getElementById('skip').onclick = () => window.close();
          document.getElementById('url').onkeydown = (e) => {
            if (e.key === 'Enter') document.getElementById('save').click();
          };
          document.getElementById('url').focus();
        </script>
      </body>
      </html>
    `;

    promptWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
}

// ---- Fenêtre principale ----
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 420,
    minHeight: 600,
    title: 'Nour — Chat islamique avec IA',
    icon: path.join(__dirname, '..', 'client', 'public', 'icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(BASE_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- Menu natif Windows ----
function buildMenu() {
  const tpl = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'Ouvrir les DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.openDevTools() },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Base de données',
      submenu: [
        {
          label: 'Reconfigurer la connexion...',
          click: async () => {
            await promptForUrl();
            // Redémarrer le serveur avec la nouvelle config
            stopServer();
            startServer();
            try { await waitForServer(); } catch { /* ignore */ }
            mainWindow?.reload();
          },
        },
        {
          label: 'Mode hors-ligne (données locales)',
          click: () => {
            saveConfig({ databaseUrl: '' });
            stopServer();
            startServer();
            mainWindow?.reload();
          },
        },
        { type: 'separator' },
        {
          label: 'Dossier des données',
          click: () => shell.openPath(app.getPath('userData')),
        },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Ouvrir dans le navigateur',
          click: () => shell.openExternal(BASE_URL),
        },
        { type: 'separator' },
        { label: 'À propos', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Nour',
            message: 'Nour — Chat islamique avec IA',
            detail: `Application gratuite et open source.\n\nBase de données : ${getDatabaseUrl() ? 'PostgreSQL Neon (synchronisé)' : 'SQLite locale (hors-ligne)'}`,
          });
        }},
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(tpl);
  Menu.setApplicationMenu(menu);
}

// ---- Démarrage du serveur Express local ----
function startServer() {
  const databaseUrl = getDatabaseUrl();
  const serverEntry = path.join(__dirname, '..', 'server', 'dist', 'index.js');

  if (databaseUrl) {
    console.log('[nour] Mode connecté : PostgreSQL Neon');
  } else {
    console.log('[nour] Mode hors-ligne : SQLite locale');
  }

  if (!fs.existsSync(serverEntry)) {
    // Mode dev : utiliser tsx pour exécuter directement le .ts
    const tsEntry = path.join(__dirname, '..', 'server', 'src', 'index.ts');
    if (fs.existsSync(tsEntry)) {
      serverProcess = fork(
        require.resolve('tsx/dist/cli.mjs'),
        [tsEntry],
        {
          env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: databaseUrl, ENABLE_SYNC: databaseUrl ? 'true' : '' },
          stdio: 'pipe',
          silent: true,
        },
      );
      console.log('[nour] Serveur démarré en mode dev (tsx)');
    }
  } else {
    // Mode production : node direct
    serverProcess = fork(serverEntry, [], {
      env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: databaseUrl, ENABLE_SYNC: databaseUrl ? 'true' : '' },
      stdio: 'pipe',
      silent: true,
    });
    console.log('[nour] Serveur démarré en mode production');
  }

  if (serverProcess) {
    serverProcess.on('error', (err) => {
      console.error('[nour] Erreur serveur:', err.message);
    });
    serverProcess.stderr?.on('data', (chunk) => {
      console.error('[nour]', chunk.toString());
    });
  }
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function waitForServer(maxRetries = 40) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = () => {
      tries++;
      const http = require('http');
      const req = http.get(`${BASE_URL}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        if (tries < maxRetries) setTimeout(check, 500);
        else reject(new Error('Serveur injoignable'));
      });
      req.on('error', () => {
        if (tries < maxRetries) setTimeout(check, 500);
        else reject(new Error('Serveur injoignable'));
      });
      req.end();
    };
    check();
  });
}

// ---- App lifecycle ----
app.whenReady().then(async () => {
  buildMenu();


  startServer();
  try {
    await waitForServer();
    console.log('[nour] Serveur prêt');
  } catch {
    console.warn('[nour] Serveur lent, ouverture sans attendre');
  }
  createWindow();
});

app.on('window-all-closed', () => {
  stopServer();
  app.quit();
});

app.on('before-quit', () => {
  stopServer();
});

// ---- IPC handlers ----
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

ipcMain.handle('save-file', async (_, { defaultName, content }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'Tous les fichiers', extensions: ['*'] }],
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
});

ipcMain.handle('open-file', async (_, filePath) => {
  await shell.openPath(filePath);
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('get-database-url', () => getDatabaseUrl());

// Notification native Windows (apparait dans le centre de notifications)
ipcMain.handle('show-notification', (_, opts) => {
  const { Notification } = require('electron');
  const notif = new Notification({
    title: opts.title || 'Nour',
    body: opts.body || '',
    icon: path.join(__dirname, '..', 'client', 'public', 'icon.svg'),
    silent: false,
  });
  if (opts.clickUrl && mainWindow) {
    notif.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
      if (opts.clickUrl.startsWith('/')) {
        mainWindow.loadURL(BASE_URL + opts.clickUrl);
      }
    });
  }
  notif.show();
  return true;
});

ipcMain.on('set-database-url', (_event, url) => {
  saveConfig({ databaseUrl: url || '' });
  console.log('[nour] DATABASE_URL enregistrée');
});