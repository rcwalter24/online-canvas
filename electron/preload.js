import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// sensitive APIs without exposing the entire Electron API
contextBridge.exposeInMainWorld('electronAPI', {
  // You can add IPC handlers here if needed in the future
});
