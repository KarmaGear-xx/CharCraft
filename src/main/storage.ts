import { app } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppConfig, Draft } from '../shared/types';

const DEFAULT_CONFIG: AppConfig = {
  lang: 'zh',
  theme: 'light',
  aiSettings: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'openai/gpt-4o-mini',
  },
  snippets: [],
  customRecipes: [],
  tokenBudget: 4096,
};

function configPath(): string {
  return join(app.getPath('userData'), 'config.json');
}

function draftPath(): string {
  return join(app.getPath('userData'), 'draft.json');
}

export async function getConfig(): Promise<AppConfig> {
  try {
    const raw = await readFile(configPath(), 'utf8');
    const c = JSON.parse(raw) as Partial<AppConfig>;
    return {
      lang: c.lang === 'en' ? 'en' : 'zh',
      theme: c.theme === 'dark' ? 'dark' : 'light',
      aiSettings: { ...DEFAULT_CONFIG.aiSettings, ...(c.aiSettings ?? {}) },
      snippets: Array.isArray(c.snippets) ? c.snippets : [],
      customRecipes: Array.isArray(c.customRecipes) ? c.customRecipes : [],
      tokenBudget: typeof c.tokenBudget === 'number' ? c.tokenBudget : 4096,
    };
  } catch {
    return {
      lang: 'zh',
      theme: 'light',
      aiSettings: { ...DEFAULT_CONFIG.aiSettings },
      snippets: [],
      customRecipes: [],
      tokenBudget: 4096,
    };
  }
}

export async function setConfig(config: AppConfig): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(configPath(), JSON.stringify(config, null, 2), 'utf8');
}

// The draft stores the avatar image (a Uint8Array) as base64 so it survives
// JSON round-tripping.
function serializeDraft(draft: Draft): string {
  const d = { card: draft.card, enabled: draft.enabled, subFields: draft.subFields, snapshots: draft.snapshots, sourceName: draft.sourceName, updatedAt: draft.updatedAt, image: null as unknown };
  if (draft.image) {
    d.image = {
      width: draft.image.width,
      height: draft.image.height,
      rgbaB64: Buffer.from(draft.image.rgba).toString('base64'),
    };
  }
  return JSON.stringify(d);
}

function deserializeDraft(raw: string): Draft {
  const d = JSON.parse(raw) as {
    card: Draft['card'];
    enabled: Draft['enabled'];
    subFields: Draft['subFields'];
    snapshots: Draft['snapshots'];
    sourceName: string;
    updatedAt: number;
    image: { width: number; height: number; rgbaB64?: string } | null;
  };
  let image: Draft['image'] = null;
  if (d.image && typeof d.image.rgbaB64 === 'string') {
    image = { width: d.image.width, height: d.image.height, rgba: new Uint8Array(Buffer.from(d.image.rgbaB64, 'base64')) };
  }
  return { card: d.card, enabled: d.enabled, subFields: d.subFields ?? {}, snapshots: d.snapshots ?? [], sourceName: d.sourceName, updatedAt: d.updatedAt, image };
}

export async function getDraft(): Promise<Draft | null> {
  try {
    const raw = await readFile(draftPath(), 'utf8');
    return deserializeDraft(raw);
  } catch {
    return null;
  }
}

export async function setDraft(draft: Draft): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(draftPath(), serializeDraft(draft), 'utf8');
}
