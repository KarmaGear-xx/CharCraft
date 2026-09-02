import { dialog, type BrowserWindow } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { OpenCardResult, SaveFilter } from '../shared/types';

const CARD_FILTERS: SaveFilter[] = [
  { name: 'Character Cards', extensions: ['png', 'json', 'charx'] },
  { name: 'PNG Image', extensions: ['png'] },
  { name: 'JSON', extensions: ['json'] },
  { name: 'CharX', extensions: ['charx'] },
];

export async function openCardFile(win: BrowserWindow | null): Promise<OpenCardResult | null> {
  const res = win
    ? await dialog.showOpenDialog(win, {
        title: 'Open Character Card',
        properties: ['openFile'],
        filters: CARD_FILTERS,
      })
    : await dialog.showOpenDialog({
        title: 'Open Character Card',
        properties: ['openFile'],
        filters: CARD_FILTERS,
      });
  if (res.canceled || res.filePaths.length === 0) return null;
  const p = res.filePaths[0];
  const bytes = await readFile(p);
  return { name: basename(p), bytes };
}

export async function openFile(win: BrowserWindow | null, filters: SaveFilter[]): Promise<OpenCardResult | null> {
  const res = win
    ? await dialog.showOpenDialog(win, { title: 'Open File', properties: ['openFile'], filters })
    : await dialog.showOpenDialog({ title: 'Open File', properties: ['openFile'], filters });
  if (res.canceled || res.filePaths.length === 0) return null;
  const p = res.filePaths[0];
  const bytes = await readFile(p);
  return { name: basename(p), bytes };
}

export async function saveFile(
  win: BrowserWindow | null,
  defaultName: string,
  filters: SaveFilter[],
  bytes: Uint8Array,
): Promise<string | null> {
  const res = win
    ? await dialog.showSaveDialog(win, { title: 'Save', defaultPath: defaultName, filters })
    : await dialog.showSaveDialog({ title: 'Save', defaultPath: defaultName, filters });
  if (res.canceled || !res.filePath) return null;
  await writeFile(res.filePath, bytes);
  return res.filePath;
}
