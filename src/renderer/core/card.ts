// Card import / normalization / serialization / export.

import { decodePng, encodePng, readTextChunks } from './png';
import { parseCharx, looksLikeZip } from './charx';
import type { CharacterCard, CardData, DecodedImage } from '../../shared/types';
import { CONTENT_FIELD_KEYS, DESCRIPTION_SUB_FIELDS } from './fields';

export const CARD_V2 = 'chara_card_v2';
export const CARD_V3 = 'chara_card_v3';
export const KEY_V2 = 'chara';
export const KEY_V3 = 'ccv3';

export interface ImportedCard {
  card: CharacterCard;
  image: DecodedImage | null;
  sourceName: string;
  spec: string;
}

const DATA_KEYS = [
  'name',
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'alternate_greetings',
  'system_prompt',
  'post_history_instructions',
  'creator_notes',
  'tags',
  'creator',
  'character_version',
  'avatar',
  'group_only_greetings',
  'character_book',
  'extensions',
];

function ensureData(card: CharacterCard): void {
  if (!card.data || typeof card.data !== 'object' || Array.isArray(card.data)) {
    const data: CardData = {};
    for (const k of DATA_KEYS) {
      const v = card[k];
      if (v !== undefined) data[k] = v;
    }
    card.data = data;
  }
}

function base64Encode(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64Decode<T>(text: string): T {
  const bin = atob(text.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder('utf8').decode(bytes)) as T;
}

function looksLikePng(buf: Uint8Array): boolean {
  return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

// Import a card from a byte buffer (PNG or JSON) plus its file name.
export async function importCardBytes(bytes: Uint8Array, name: string): Promise<ImportedCard> {
  const lower = name.toLowerCase();
  const isCharx = lower.endsWith('.charx') || looksLikeZip(bytes);
  if (isCharx) return importFromCharx(bytes, name);
  const isPng = lower.endsWith('.png') || looksLikePng(bytes);
  if (isPng) return importFromPng(bytes, name);
  const text = new TextDecoder('utf8').decode(bytes);
  const card = JSON.parse(text) as CharacterCard;
  ensureData(card);
  return {
    card,
    image: null,
    sourceName: name.replace(/\.json$/i, ''),
    spec: card.spec === CARD_V3 ? CARD_V3 : CARD_V2,
  };
}

async function importFromCharx(bytes: Uint8Array, name: string): Promise<ImportedCard> {
  const { card, assets } = parseCharx(bytes);
  ensureData(card);
  let image: DecodedImage | null = null;
  for (const [assetName, data] of Object.entries(assets)) {
    if (assetName.toLowerCase().endsWith('.png')) {
      try {
        image = await decodePng(data);
        break;
      } catch {
        /* try the next PNG asset */
      }
    }
  }
  return {
    card,
    image,
    sourceName: name.replace(/\.charx$/i, ''),
    spec: card.spec === CARD_V3 ? CARD_V3 : CARD_V2,
  };
}

async function importFromPng(buf: Uint8Array, name: string): Promise<ImportedCard> {
  const image = await decodePng(buf);
  const texts = readTextChunks(buf);
  const ccv3 = texts.find((t) => t.keyword === KEY_V3);
  const chara = texts.find((t) => t.keyword === KEY_V2);
  const chosen = ccv3 ?? chara;
  if (!chosen) throw new Error('PNG 中未找到角色卡数据(缺少 chara/ccv3 文本块)。');
  const card = base64Decode<CharacterCard>(chosen.text);
  ensureData(card);
  return {
    card,
    image,
    sourceName: name.replace(/\.png$/i, ''),
    spec: card.spec === CARD_V3 ? CARD_V3 : CARD_V2,
  };
}

const MIRROR_KEYS = [...CONTENT_FIELD_KEYS, 'avatar'];

export function buildExportCard(card: CharacterCard, enabled: Record<string, boolean>): CharacterCard {
  const spec = card.spec === CARD_V3 ? CARD_V3 : CARD_V2;
  const data: CardData = { ...(card.data ?? {}) };
  for (const key of CONTENT_FIELD_KEYS) {
    if (enabled[key] === false) delete data[key];
  }

  const out: CharacterCard = {
    spec,
    spec_version: spec === CARD_V3 ? '3.0' : '2.0',
    data,
  };

  if (spec === CARD_V3) {
    for (const k of Object.keys(card)) {
      if (k === 'spec' || k === 'spec_version' || k === 'data') continue;
      out[k] = card[k];
    }
    for (const key of MIRROR_KEYS) {
      if (key in data) out[key] = data[key];
      else delete out[key];
    }
  }

  return out;
}

export function buildJsonText(card: CharacterCard, enabled: Record<string, boolean>): string {
  return JSON.stringify(buildExportCard(card, enabled), null, 2);
}

// Merge the auxiliary description sub-fields into the front of `description`,
// one "Label: value" line per non-empty sub-field, then the original text.
export function mergeDescription(description: string, subFields: Record<string, string>): string {
  const lines: string[] = [];
  for (const f of DESCRIPTION_SUB_FIELDS) {
    const v = (subFields[f.key] ?? '').trim();
    if (v) lines.push(`${f.label}: ${v}`);
  }
  if (description.trim()) lines.push(description.trim());
  return lines.join('\n');
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [Math.round(l * 255), Math.round(l * 255), Math.round(l * 255)];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [Math.round(f(p, q, h + 1 / 3) * 255), Math.round(f(p, q, h) * 255), Math.round(f(p, q, h - 1 / 3) * 255)];
}

function placeholderImage(name: string): DecodedImage {
  const size = 512;
  const rgba = new Uint8Array(size * size * 4);
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [r, g, b] = hslToRgb((h % 360) / 360, 0.4, 0.55);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = 255;
  }
  return { width: size, height: size, rgba };
}

export async function buildPngBytes(
  card: CharacterCard,
  enabled: Record<string, boolean>,
  image: DecodedImage | null,
): Promise<Uint8Array> {
  const spec = card.spec === CARD_V3 ? CARD_V3 : CARD_V2;
  const keyword = spec === CARD_V3 ? KEY_V3 : KEY_V2;
  const text = base64Encode(buildExportCard(card, enabled));
  const img = image ?? placeholderImage(String(card.data?.name ?? ''));
  return encodePng(img.width, img.height, img.rgba, [{ keyword, text }]);
}
