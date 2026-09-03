import { create } from 'zustand';
import type {
  CharacterCard,
  CharacterBook,
  WorldEntry,
  CardData,
  AISettings,
  Lang,
  DecodedImage,
  Snippet,
  Recipe,
  AppConfig,
  Theme,
  Snapshot,
  PromptTemplates,
  MultiChar,
  MultiGroup,
  ValidationIssue,
} from '../../shared/types';
import { EMPTY_PROMPT_TEMPLATES } from '../../shared/types';
import { CARD_V2, importCardBytes, buildJsonText, buildPngBytes, mergeDescription } from '../core/card';
import { ALL_FIELDS, ADVANCED_FIELDS, ARRAY_FIELDS } from '../core/fields';
import { cropSquare, resizeImage, decodeImageBytes } from '../core/image';
import { buildWorldJson, parseWorldJson, mergeBook } from '../core/lorebook';
import { findReplaceCard } from '../core/findReplace';
import { genderSwapCard } from '../core/gender';
import { validateCard } from '../core/validate';
import { composeMultiCard } from '../core/multiChar';
import {
  wholeCardMessages,
  fieldRewriteMessages,
  lorebookEntryMessages,
  recipeMessages,
  multiCharMessages,
  multiGroupMessages,
  extractJson,
  coerceGeneratedField,
  WHOLE_CARD_FIELDS,
} from '../core/ai';

export type OverwriteMode = 'clear' | 'fill_empty' | 'manual';

export const AI_PRESETS = [
  { id: 'openrouter', label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'custom', label: 'Custom', baseUrl: '', model: '' },
] as const;

export const DEFAULT_AI_SETTINGS: AISettings = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: '',
  model: 'openai/gpt-4o-mini',
  responseFormat: 'json_object',
  maxTokensWhole: 4096,
  maxTokensField: 2048,
};

export const DEFAULT_TOKEN_BUDGET = 4096;

const DEFAULT_GROUP: MultiGroup = { name: '', scenario: '', firstMes: '' };

function defaultEnabled(): Record<string, boolean> {
  const e: Record<string, boolean> = {};
  for (const f of ALL_FIELDS) e[f.key] = !f.advanced;
  return e;
}

function enabledForCard(card: CharacterCard): Record<string, boolean> {
  const e = defaultEnabled();
  for (const f of ADVANCED_FIELDS) {
    const v = card.data?.[f.key];
    const has = typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) && v.length > 0;
    if (has) e[f.key] = true;
  }
  return e;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface CardState {
  lang: Lang;
  aiSettings: AISettings;
  card: CharacterCard | null;
  enabled: Record<string, boolean>;
  image: DecodedImage | null;
  subFields: Record<string, string>;
  sourceName: string;
  brief: string;
  hydrated: boolean;
  error: string | null;
  success: string | null;
  costReminderShown: boolean;
  snippets: Snippet[];
  customRecipes: Recipe[];
  tokenBudget: number;
  theme: Theme;
  snapshots: Snapshot[];
  promptTemplates: PromptTemplates;
  characters: MultiChar[];
  group: MultiGroup;
  pendingExport: { kind: 'json' | 'png'; issues: ValidationIssue[] } | null;

  setLang: (l: Lang) => void;
  setAISettings: (s: AISettings) => Promise<void>;
  saveSettings: (ai: AISettings, tokenBudget: number, promptTemplates: PromptTemplates) => Promise<void>;
  setBrief: (b: string) => void;
  setSubField: (key: string, value: string) => void;
  setError: (e: string | null) => void;
  setSuccess: (s: string | null) => void;
  markCostReminderShown: () => void;

  addSnippet: (name: string, text: string) => void;
  removeSnippet: (id: string) => void;
  addCustomRecipe: (recipe: Recipe) => void;
  removeCustomRecipe: (id: string) => void;
  setTokenBudget: (n: number) => void;
  setTheme: (t: Theme) => void;
  genderSwap: () => void;
  saveSnapshot: () => void;
  restoreSnapshot: (index: number) => void;
  deleteSnapshot: (index: number) => void;
  setExtension: (key: string, value: unknown) => void;
  setPromptTemplates: (t: PromptTemplates) => void;

  setGroup: (patch: Partial<MultiGroup>) => void;
  addCharacter: () => void;
  updateCharacter: (id: string, patch: Partial<MultiChar>) => void;
  removeCharacter: (id: string) => void;
  moveCharacter: (id: string, dir: -1 | 1) => void;
  generateCharacterFromBrief: (brief: string) => Promise<void>;
  rewriteCharacter: (id: string) => Promise<void>;
  generateGroupFromBrief: (brief: string) => Promise<void>;

  hydrate: () => Promise<void>;
  newCard: () => void;
  importCard: () => Promise<void>;
  updateField: (key: string, value: unknown) => void;
  setEnabled: (key: string, value: boolean) => void;

  generateWholeCard: (brief: string, mode: OverwriteMode, targets: string[]) => Promise<void>;
  generateField: (key: string) => Promise<void>;
  generateLorebookEntry: (topic: string) => Promise<void>;
  applyRecipe: (recipe: Recipe) => Promise<void>;
  insertSnippet: (text: string, fieldKey: string) => void;
  findReplace: (find: string, replace: string) => void;

  addLorebookEntry: () => void;
  pushEntry: (entry: WorldEntry) => void;
  updateLorebookEntry: (index: number, patch: Partial<WorldEntry>) => void;
  removeLorebookEntry: (index: number) => void;
  updateBookMeta: (patch: Partial<CharacterBook>) => void;
  setEntriesEnabled: (indices: number[], enabled: boolean) => void;
  removeEntries: (indices: number[]) => void;
  moveEntry: (index: number, dir: -1 | 1) => void;

  exportJson: () => Promise<void>;
  exportPng: () => Promise<void>;
  requestExport: (kind: 'json' | 'png') => Promise<void>;
  confirmExport: () => Promise<void>;
  cancelExport: () => void;

  cropAvatar: () => void;
  resizeAvatar: (maxDim: number) => void;
  pickAvatar: () => Promise<void>;
  exportLorebook: () => Promise<void>;
  importLorebook: () => Promise<void>;
}

export const useCardStore = create<CardState>()((set, get) => ({
  lang: 'zh',
  aiSettings: { ...DEFAULT_AI_SETTINGS },
  card: null,
  enabled: defaultEnabled(),
  image: null,
  subFields: {},
  sourceName: 'untitled',
  brief: '',
  hydrated: false,
  error: null,
  success: null,
  costReminderShown: false,
  snippets: [],
  customRecipes: [],
  tokenBudget: DEFAULT_TOKEN_BUDGET,
  theme: 'light',
  snapshots: [],
  promptTemplates: { ...EMPTY_PROMPT_TEMPLATES },
  characters: [],
  group: { ...DEFAULT_GROUP },
  pendingExport: null,

  setLang: (l) => {
    set({ lang: l });
    persistConfig();
  },
  setAISettings: async (s) => {
    set({ aiSettings: s });
    await window.api.setConfig(currentConfig(get()));
  },
  saveSettings: async (ai, tokenBudget, promptTemplates) => {
    set({ aiSettings: ai, tokenBudget, promptTemplates });
    await window.api.setConfig(currentConfig(get()));
  },
  setBrief: (b) => set({ brief: b }),
  setSubField: (key, value) => set({ subFields: { ...get().subFields, [key]: value } }),
  setError: (e) => set({ error: e }),
  setSuccess: (s) => set({ success: s }),
  markCostReminderShown: () => set({ costReminderShown: true }),

  addSnippet: (name, text) => {
    set({ snippets: [...get().snippets, { id: genId(), name: name.trim() || 'Snippet', text }] });
    persistConfig();
  },
  removeSnippet: (id) => {
    set({ snippets: get().snippets.filter((s) => s.id !== id) });
    persistConfig();
  },
  addCustomRecipe: (recipe) => {
    set({ customRecipes: [...get().customRecipes, { ...recipe, id: genId(), builtin: false }] });
    persistConfig();
  },
  removeCustomRecipe: (id) => {
    set({ customRecipes: get().customRecipes.filter((r) => r.id !== id) });
    persistConfig();
  },
  setTokenBudget: (n) => {
    set({ tokenBudget: n });
    persistConfig();
  },
  setTheme: (t) => {
    set({ theme: t });
    persistConfig();
  },
  genderSwap: () => {
    const card = get().card;
    if (!card) return;
    set({ card: genderSwapCard(card) });
  },
  saveSnapshot: () => {
    const s = get();
    if (!s.card) return;
    set({
      snapshots: [...s.snapshots, { timestamp: Date.now(), card: s.card, enabled: s.enabled, subFields: s.subFields }],
    });
  },
  restoreSnapshot: (index) => {
    const snap = get().snapshots[index];
    if (!snap) return;
    set({ card: snap.card, enabled: snap.enabled, subFields: snap.subFields });
  },
  deleteSnapshot: (index) => {
    set({ snapshots: get().snapshots.filter((_, i) => i !== index) });
  },
  setExtension: (key, value) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const ext = { ...(data.extensions ?? {}) };
    ext[key] = value;
    data.extensions = ext;
    set({ card: { ...card, data } });
  },
  setPromptTemplates: (t) => {
    set({ promptTemplates: t });
    persistConfig();
  },

  setGroup: (patch) => set({ group: { ...get().group, ...patch } }),
  addCharacter: () => {
    set({ characters: [...get().characters, { id: genId(), name: '', description: '', personality: '', intro: '' }] });
  },
  updateCharacter: (id, patch) => {
    set({ characters: get().characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },
  removeCharacter: (id) => {
    set({ characters: get().characters.filter((c) => c.id !== id) });
  },
  moveCharacter: (id, dir) => {
    const chars = [...get().characters];
    const i = chars.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= chars.length) return;
    [chars[i], chars[j]] = [chars[j], chars[i]];
    set({ characters: chars });
  },
  generateCharacterFromBrief: async (brief) => {
    const state = get();
    const content = await window.api.aiChat(state.aiSettings, multiCharMessages(brief, undefined, state.promptTemplates), {
      json: true,
      maxTokens: state.aiSettings.maxTokensField,
    });
    const obj = extractJson(content) as Record<string, unknown>;
    const ch: MultiChar = {
      id: genId(),
      name: String(obj.name ?? '').trim(),
      description: String(obj.description ?? '').trim(),
      personality: String(obj.personality ?? '').trim(),
      intro: String(obj.intro ?? '').trim(),
    };
    set({ characters: [...get().characters, ch] });
  },
  rewriteCharacter: async (id) => {
    const state = get();
    const ch = state.characters.find((c) => c.id === id);
    if (!ch) throw new Error('角色不存在。');
    const content = await window.api.aiChat(
      state.aiSettings,
      multiCharMessages('', { name: ch.name, description: ch.description, personality: ch.personality, intro: ch.intro }, state.promptTemplates),
      { json: true, maxTokens: state.aiSettings.maxTokensField },
    );
    const obj = extractJson(content) as Record<string, unknown>;
    get().updateCharacter(id, {
      name: String(obj.name ?? ch.name).trim(),
      description: String(obj.description ?? ch.description).trim(),
      personality: String(obj.personality ?? ch.personality).trim(),
      intro: String(obj.intro ?? ch.intro).trim(),
    });
  },
  generateGroupFromBrief: async (brief) => {
    const state = get();
    const content = await window.api.aiChat(state.aiSettings, multiGroupMessages(brief, state.promptTemplates), {
      json: true,
      maxTokens: state.aiSettings.maxTokensWhole,
    });
    const obj = extractJson(content) as Record<string, unknown>;
    const arr = Array.isArray(obj.characters) ? obj.characters : [];
    const characters: MultiChar[] = arr.map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      return {
        id: genId(),
        name: String(o.name ?? '').trim(),
        description: String(o.description ?? '').trim(),
        personality: String(o.personality ?? '').trim(),
        intro: String(o.intro ?? '').trim(),
      };
    });
    set({
      group: {
        name: String(obj.name ?? '').trim(),
        scenario: String(obj.scenario ?? '').trim(),
        firstMes: String(obj.first_mes ?? '').trim(),
      },
      characters,
    });
  },

  hydrate: async () => {
    const config = await window.api.getConfig().catch(() => null);
    const draft = await window.api.getDraft().catch(() => null);
    set({
      lang: config?.lang ?? 'zh',
      aiSettings: config?.aiSettings ?? { ...DEFAULT_AI_SETTINGS },
      card: draft?.card ?? null,
      enabled: draft?.enabled ?? defaultEnabled(),
      image: draft?.image ?? null,
      subFields: draft?.subFields ?? {},
      sourceName: draft?.sourceName ?? 'untitled',
      snippets: config?.snippets ?? [],
      customRecipes: config?.customRecipes ?? [],
      tokenBudget: config?.tokenBudget ?? DEFAULT_TOKEN_BUDGET,
      theme: config?.theme ?? 'light',
      snapshots: draft?.snapshots ?? [],
      promptTemplates: config?.promptTemplates ?? { ...EMPTY_PROMPT_TEMPLATES },
      characters: draft?.characters ?? [],
      group: draft?.group ?? { ...DEFAULT_GROUP },
      hydrated: true,
    });
  },

  newCard: () => {
    const data: CardData = {};
    for (const f of ALL_FIELDS) data[f.key] = ARRAY_FIELDS.has(f.key) ? [] : '';
    const card: CharacterCard = { spec: CARD_V2, spec_version: '2.0', data };
    set({
      card,
      image: null,
      subFields: {},
      snapshots: [],
      sourceName: 'untitled',
      enabled: defaultEnabled(),
      brief: '',
      characters: [],
      group: { ...DEFAULT_GROUP },
    });
  },

  importCard: async () => {
    const res = await window.api.openCard();
    if (!res) return;
    const imported = await importCardBytes(res.bytes, res.name);
    set({
      card: imported.card,
      image: imported.image,
      sourceName: imported.sourceName,
      enabled: enabledForCard(imported.card),
      subFields: {},
      snapshots: [],
      brief: '',
      characters: [],
      group: { ...DEFAULT_GROUP },
    });
  },

  updateField: (key, value) => {
    const card = get().card;
    if (!card) return;
    set({ card: { ...card, data: { ...(card.data ?? {}), [key]: value } } });
  },

  setEnabled: (key, value) => set({ enabled: { ...get().enabled, [key]: value } }),

  generateWholeCard: async (brief, mode, targets) => {
    const state = get();
    if (!state.card) throw new Error('没有卡片可编辑。');
    const content = await window.api.aiChat(state.aiSettings, wholeCardMessages(brief, state.promptTemplates), {
      json: true,
      maxTokens: state.aiSettings.maxTokensWhole,
    });
    const obj = extractJson(content) as Record<string, unknown>;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('AI 未返回有效对象。');
    const data: CardData = { ...(state.card.data ?? {}) };
    const loose = data as unknown as Record<string, unknown>;
    if (mode === 'clear') {
      for (const f of WHOLE_CARD_FIELDS) loose[f] = f === 'tags' ? [] : '';
    }
    for (const f of WHOLE_CARD_FIELDS) {
      if (!(f in obj)) continue;
      const v = coerceGeneratedField(f, obj[f]);
      if (mode === 'fill_empty') {
        const cur = loose[f];
        const empty = cur == null || cur === '' || (Array.isArray(cur) && cur.length === 0);
        if (empty) loose[f] = v;
      } else if (mode === 'manual') {
        if (targets.includes(f)) loose[f] = v;
      } else {
        loose[f] = v;
      }
    }
    set({ card: { ...state.card, data } });
  },

  generateField: async (key) => {
    const state = get();
    if (!state.card) throw new Error('没有卡片可编辑。');
    const cur = state.card.data?.[key];
    const current = typeof cur === 'string' ? cur : Array.isArray(cur) ? cur.join('\n') : '';
    const isArray = ARRAY_FIELDS.has(key);
    const content = await window.api.aiChat(
      state.aiSettings,
      fieldRewriteMessages(key, current, { name: state.card.data?.name, brief: state.brief }, state.promptTemplates),
      { json: isArray, maxTokens: state.aiSettings.maxTokensField },
    );
    const value = isArray ? coerceGeneratedField(key, extractJson(content)) : content.trim();
    get().updateField(key, value);
  },

  generateLorebookEntry: async (topic) => {
    const state = get();
    if (!state.card) throw new Error('没有卡片可编辑。');
    const name = state.card.data?.name ?? '';
    const desc = state.card.data?.description ?? '';
    const content = await window.api.aiChat(state.aiSettings, lorebookEntryMessages(name, desc, topic, state.promptTemplates), {
      json: true,
      maxTokens: state.aiSettings.maxTokensField,
    });
    const obj = extractJson(content) as Record<string, unknown>;
    const entry: WorldEntry = {
      keys: coerceGeneratedField('tags', obj.keys) as string[],
      content: String(obj.content ?? ''),
      comment: String(obj.comment ?? ''),
      enabled: true,
      insertion_order: state.card.data?.character_book?.entries?.length ?? 0,
    };
    get().pushEntry(entry);
  },

  applyRecipe: async (recipe) => {
    const state = get();
    if (!state.card) throw new Error('没有卡片可编辑。');
    const current = typeof state.card.data?.[recipe.field] === 'string' ? (state.card.data[recipe.field] as string) : '';
    const content = await window.api.aiChat(
      state.aiSettings,
      recipeMessages(recipe, current, state.card.data?.name ?? '', state.promptTemplates),
      { json: false, maxTokens: state.aiSettings.maxTokensField },
    );
    const generated = content.trim();
    get().updateField(recipe.field, current ? current + '\n' + generated : generated);
  },

  insertSnippet: (text, fieldKey) => {
    const state = get();
    if (!state.card) return;
    const existing = typeof state.card.data?.[fieldKey] === 'string' ? (state.card.data[fieldKey] as string) : '';
    get().updateField(fieldKey, existing ? existing + '\n' + text : text);
  },

  findReplace: (find, replace) => {
    const card = get().card;
    if (!card) return;
    set({ card: findReplaceCard(card, find, replace) });
  },

  addLorebookEntry: () => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? {}) };
    const entries = [...(book.entries ?? [])];
    entries.push({ keys: [], content: '', enabled: true, comment: '', insertion_order: entries.length });
    book.entries = entries;
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  pushEntry: (entry: WorldEntry) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? {}) };
    const entries = [...(book.entries ?? [])];
    entries.push(entry);
    book.entries = entries;
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  updateLorebookEntry: (index, patch) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? { entries: [] }) };
    const entries = [...(book.entries ?? [])];
    if (entries[index]) entries[index] = { ...entries[index], ...patch };
    book.entries = entries;
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  removeLorebookEntry: (index) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? { entries: [] }) };
    const entries = [...(book.entries ?? [])];
    entries.splice(index, 1);
    book.entries = entries;
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  updateBookMeta: (patch) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? { entries: [] }), ...patch };
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  setEntriesEnabled: (indices, enabled) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? { entries: [] }) };
    const entries = [...(book.entries ?? [])];
    for (const i of indices) if (entries[i]) entries[i] = { ...entries[i], enabled };
    book.entries = entries;
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  removeEntries: (indices) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? { entries: [] }) };
    const entries = [...(book.entries ?? [])];
    const s = new Set(indices);
    book.entries = reorderEntries(entries.filter((_, i) => !s.has(i)));
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  moveEntry: (index, dir) => {
    const card = get().card;
    if (!card) return;
    const data = { ...(card.data ?? {}) };
    const book = { ...(data.character_book ?? { entries: [] }) };
    const entries = [...(book.entries ?? [])];
    const j = index + dir;
    if (index < 0 || j < 0 || j >= entries.length) return;
    [entries[index], entries[j]] = [entries[j], entries[index]];
    book.entries = reorderEntries(entries);
    data.character_book = book;
    set({ card: { ...card, data } });
  },

  exportJson: () => get().requestExport('json'),
  exportPng: () => get().requestExport('png'),

  requestExport: async (kind) => {
    const state = get();
    if (!state.card) throw new Error('没有卡片可导出。');
    const multi = state.characters.length > 0;
    const composed = multi ? composeMultiCard(state.card, state.characters, state.group) : state.card;
    const issues = validateCard(composed, effectiveEnabled(state.enabled, multi), state.tokenBudget, state.image);
    if (issues.length === 0) {
      await doExport(kind);
    } else {
      set({ pendingExport: { kind, issues } });
    }
  },

  confirmExport: async () => {
    const p = get().pendingExport;
    if (!p) return;
    set({ pendingExport: null });
    await doExport(p.kind);
  },

  cancelExport: () => set({ pendingExport: null }),

  cropAvatar: () => {
    const img = get().image;
    if (img) set({ image: cropSquare(img) });
  },

  resizeAvatar: (maxDim) => {
    const img = get().image;
    if (img) set({ image: resizeImage(img, maxDim) });
  },

  pickAvatar: async () => {
    const res = await window.api.openFile([
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
    ]);
    if (!res) return;
    set({ image: await decodeImageBytes(res.bytes) });
  },

  exportLorebook: async () => {
    const book = get().card?.data?.character_book;
    if (!book || !book.entries || book.entries.length === 0) throw new Error('没有世界书条目可导出。');
    const json = buildWorldJson(book);
    await window.api.saveFile('world.json', [{ name: 'World Info JSON', extensions: ['json'] }], new TextEncoder().encode(json));
  },

  importLorebook: async () => {
    const res = await window.api.openFile([{ name: 'World Info JSON', extensions: ['json'] }]);
    if (!res) return;
    const text = new TextDecoder().decode(res.bytes);
    const incoming = parseWorldJson(text);
    const card = get().card;
    if (!card) throw new Error('没有卡片可编辑。');
    const data = { ...(card.data ?? {}) };
    const existing = data.character_book ?? { entries: [] };
    data.character_book = mergeBook(existing, incoming);
    set({ card: { ...card, data } });
  },
}));

function currentConfig(s: CardState): AppConfig {
  return {
    lang: s.lang,
    theme: s.theme,
    aiSettings: s.aiSettings,
    snippets: s.snippets,
    customRecipes: s.customRecipes,
    tokenBudget: s.tokenBudget,
    promptTemplates: s.promptTemplates,
  };
}

function reorderEntries(entries: WorldEntry[]): WorldEntry[] {
  return entries.map((e, i) => ({ ...e, insertion_order: i }));
}

// In multi-character mode the composed fields are the point of the export, so
// they must never be trimmed away by a disabled field checkbox.
const MULTI_EXPORT_KEYS = ['name', 'description', 'personality', 'scenario', 'first_mes', 'tags'];
function effectiveEnabled(enabled: Record<string, boolean>, multi: boolean): Record<string, boolean> {
  if (!multi) return enabled;
  const e = { ...enabled };
  for (const k of MULTI_EXPORT_KEYS) e[k] = true;
  return e;
}

function withMergedDescription(card: CharacterCard, subFields: Record<string, string>): CharacterCard {
  const data = { ...(card.data ?? {}) };
  data.description = mergeDescription(String(data.description ?? ''), subFields);
  return { ...card, data };
}

async function doExport(kind: 'json' | 'png'): Promise<void> {
  const state = useCardStore.getState();
  if (!state.card) throw new Error('没有卡片可导出。');
  const multi = state.characters.length > 0;
  const composed = multi ? composeMultiCard(state.card, state.characters, state.group) : state.card;
  const merged = withMergedDescription(composed, state.subFields);
  const enabledEff = effectiveEnabled(state.enabled, multi);
  if (kind === 'json') {
    const text = buildJsonText(merged, enabledEff);
    await window.api.saveFile(
      (state.sourceName || 'card') + '.json',
      [{ name: 'JSON', extensions: ['json'] }],
      new TextEncoder().encode(text),
    );
  } else {
    const bytes = await buildPngBytes(merged, enabledEff, state.image);
    await window.api.saveFile((state.sourceName || 'card') + '.png', [{ name: 'PNG Image', extensions: ['png'] }], bytes);
  }
}

function persistConfig(): void {
  window.api.setConfig(currentConfig(useCardStore.getState())).catch(() => {});
}

// Debounced draft autosave via the main process (userData/draft.json).
let timer: ReturnType<typeof setTimeout> | undefined;
let lastSnapshot = '';
function scheduleSave(s: CardState): void {
  if (!s.card || !s.hydrated) return;
  const snapshot = JSON.stringify({
    c: s.card,
    e: s.enabled,
    s: s.subFields,
    p: s.snapshots.length,
    i: s.image ? s.image.width + ':' + s.image.height : null,
    m: s.characters,
    g: s.group,
  });
  if (snapshot === lastSnapshot) return;
  lastSnapshot = snapshot;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const st = useCardStore.getState();
    if (!st.card) return;
    window.api
      .setDraft({
        card: st.card,
        enabled: st.enabled,
        image: st.image,
        subFields: st.subFields,
        snapshots: st.snapshots,
        sourceName: st.sourceName,
        updatedAt: Date.now(),
        characters: st.characters,
        group: st.group,
      })
      .catch(() => {});
  }, 700);
}
useCardStore.subscribe((s) => scheduleSave(s));
