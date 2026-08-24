const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let serverProcess = null;

const isDev = !app.isPackaged;
const SERVER_PORT = 3001;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

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
      label: 'Aide',
      submenu: [
        {
          label: 'Ouvrir dans le navigateur',
          click: () => shell.openExternal(BASE_URL),
        },
        {
          label: 'Dossier des données',
          click: () => shell.openPath(app.getPath('userData')),
        },
        { type: 'separator' },
        { label: 'À propos', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Nour',
            message: 'Nour — Chat islamique avec IA',
            detail: 'Application gratuite et open source.\nDonnées stockées localement sur votre PC.',
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
  const serverEntry = path.join(__dirname, '..', 'server', 'dist', 'index.js');
  if (!fs.existsSync(serverEntry)) {
    // Mode dev : utiliser tsx pour exécuter directement le .ts
    const tsEntry = path.join(__dirname, '..', 'server', 'src', 'index.ts');
    if (fs.existsSync(tsEntry)) {
      serverProcess = fork(
        require.resolve('tsx/dist/cli.mjs'),
        [tsEntry],
        {
          env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: '' },
          stdio: 'pipe',
          silent: true,
        },
      );
      console.log('[nour] Serveur démarré en mode dev (tsx)');
    }
  } else {
    // Mode production : node direct
    serverProcess = fork(serverEntry, [], {
      env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: '' },
      stdio: 'pipe',
      silent: true,
    });
    console.log('[nour] Serveur démarré en mode production');
  }

  serverProcess.on('error', (err) => {
    console.error('[nour] Erreur serveur:', err.message);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function waitForServer(maxRetries = 30) {
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

// ---- IPC handlers - exposer les APIs locales au renderer ----
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