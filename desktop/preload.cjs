const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

/**
 * API exposée au renderer via window.nourDesktop.
 * Le frontend détecte ce flag pour savoir qu'il tourne en mode desktop.
 */
contextBridge.exposeInMainWorld('nourDesktop', {
  /** true si l'app tourne dans Electron (desktop) */
  isDesktop: true,

  /** Renvoie le chemin du dossier de données utilisateur (APPDATA/Nour) */
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  /** Sauvegarde un fichier local avec le dialogue système */
  saveFile: (defaultName, content) =>
    ipcRenderer.invoke('save-file', { defaultName, content }),

  /** Ouvre un fichier avec l'application par défaut */
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),

  /** Obtient le chemin de la base SQLite locale */
  getDbPath: () => ipcRenderer.invoke('get-user-data-path').then(p => path.join(p, 'nour.db')),

  /** Version de l'app */
  getVersion: () => ipcRenderer.invoke('get-version'),

  /** DATABASE_URL configurée (vide = mode hors-ligne SQLite) */
  getDatabaseUrl: () => ipcRenderer.invoke('get-database-url'),
  /** Notification native Windows (apparait dans le centre de notifications) */
  showNotification: (opts) => ipcRenderer.invoke('show-notification', opts),


});