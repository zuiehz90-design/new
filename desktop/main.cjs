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

// ---- Gestion de la DATABASE_URL (hardcodée, non modifiable) ----
const HARDCODED_DATABASE_URL = 'postgresql://neondb_owner:npg_Jw3DfmL2BnWC@ep-patient-bread-ayvwsnsi-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function getDatabaseUrl() {
  return process.env.DATABASE_URL || HARDCODED_DATABASE_URL;
}

// ---- Fenêtre principale ----
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 420,
    minHeight: 600,
    title: 'Nour — Chat islamique avec IA',
    icon: path.join(__dirname, '..', 'client', 'dist', 'icon.svg'),
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
        { type: 'separator' },
        { label: 'À propos', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Nour',
            message: 'Nour — Chat islamique avec IA',
            detail: "Application gratuite. Base : PostgreSQL Neon (sync local+cloud)",
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

  console.log('[nour] SQLite local + sync Neon automatique');

  if (!fs.existsSync(serverEntry)) {
    // Mode dev : utiliser tsx pour exécuter directement le .ts
    const tsEntry = path.join(__dirname, '..', 'server', 'src', 'index.ts');
    if (fs.existsSync(tsEntry)) {
      serverProcess = fork(
        require.resolve('tsx/dist/cli.mjs'),
        [tsEntry],
        {
          env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: databaseUrl, ENABLE_SYNC: 'true' },
          stdio: 'pipe',
          silent: true,
        },
      );
      console.log('[nour] Serveur démarré en mode dev (tsx)');
    }
  } else {
    // Mode production : node direct
    serverProcess = fork(serverEntry, [], {
      env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: databaseUrl, ENABLE_SYNC: 'true' },
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
    icon: path.join(__dirname, '..', 'client', 'dist', 'icon.svg'),
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
