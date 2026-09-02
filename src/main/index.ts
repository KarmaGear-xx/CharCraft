import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { IPC } from '../shared/ipc';
import type { AISettings, AIMessage, AppConfig, Draft, SaveFilter } from '../shared/types';
import { openCardFile, openFile, saveFile } from './files';
import { getConfig, setConfig, getDraft, setDraft } from './storage';
import { chat, listModels } from './ai';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 920,
    minHeight: 620,
    title: 'CharCraft',
    backgroundColor: '#f4f5f7',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpc(): void {
  ipcMain.handle(IPC.openCard, (event) => openCardFile(BrowserWindow.fromWebContents(event.sender)));

  ipcMain.handle(IPC.openFile, (event, filters: SaveFilter[]) =>
    openFile(BrowserWindow.fromWebContents(event.sender), filters),
  );

  ipcMain.handle(
    IPC.saveFile,
    (event, defaultName: string, filters: SaveFilter[], bytes: Uint8Array) =>
      saveFile(BrowserWindow.fromWebContents(event.sender), defaultName, filters, bytes),
  );

  ipcMain.handle(IPC.aiChat, (_e, settings: AISettings, messages: AIMessage[], opts: { json?: boolean }) =>
    chat(settings, messages, opts),
  );

  ipcMain.handle(IPC.listModels, (_e, settings: AISettings) => listModels(settings));

  ipcMain.handle(IPC.getConfig, () => getConfig());
  ipcMain.handle(IPC.setConfig, (_e, config: AppConfig) => setConfig(config));
  ipcMain.handle(IPC.getDraft, () => getDraft());
  ipcMain.handle(IPC.setDraft, (_e, draft: Draft) => setDraft(draft));
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
