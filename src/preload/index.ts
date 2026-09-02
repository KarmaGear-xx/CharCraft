import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc';
import type { WindowApi } from '../shared/types';

const api: WindowApi = {
  openCard: () => ipcRenderer.invoke(IPC.openCard),
  openFile: (filters) => ipcRenderer.invoke(IPC.openFile, filters),
  saveFile: (defaultName, filters, bytes) => ipcRenderer.invoke(IPC.saveFile, defaultName, filters, bytes),
  aiChat: (settings, messages, opts) => ipcRenderer.invoke(IPC.aiChat, settings, messages, opts),
  listModels: (settings) => ipcRenderer.invoke(IPC.listModels, settings),
  getConfig: () => ipcRenderer.invoke(IPC.getConfig),
  setConfig: (config) => ipcRenderer.invoke(IPC.setConfig, config),
  getDraft: () => ipcRenderer.invoke(IPC.getDraft),
  setDraft: (draft) => ipcRenderer.invoke(IPC.setDraft, draft),
};

contextBridge.exposeInMainWorld('api', api);
