// .charx import: a .charx file is a ZIP archive containing card.json plus
// optional asset files (images etc.).

import { unzipSync } from 'fflate';
import type { CharacterCard } from '../../shared/types';

export interface CharxResult {
  card: CharacterCard;
  assets: Record<string, Uint8Array>;
}

export function parseCharx(bytes: Uint8Array): CharxResult {
  const files = unzipSync(bytes);
  const cardEntry = files['card.json'];
  if (!cardEntry) throw new Error('.charx 中缺少 card.json');
  const text = new TextDecoder('utf8').decode(cardEntry);
  const card = JSON.parse(text) as CharacterCard;
  const assets: Record<string, Uint8Array> = {};
  for (const [name, data] of Object.entries(files)) {
    if (name === 'card.json') continue;
    assets[name] = data;
  }
  return { card, assets };
}

export function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length > 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}
