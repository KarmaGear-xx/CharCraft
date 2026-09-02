// Shared type definitions used by the main process, preload and renderer.

export interface WorldEntry {
  keys?: string[];
  secondary_keys?: string[];
  content?: string;
  enabled?: boolean;
  insertion_order?: number;
  case_sensitive?: boolean;
  selective?: boolean;
  constant?: boolean;
  position?: string;
  priority?: number;
  use_regex?: boolean;
  comment?: string;
  id?: number;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions?: Record<string, unknown>;
  entries?: WorldEntry[];
  [key: string]: unknown;
}

export interface CardData {
  name?: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  alternate_greetings?: string[];
  system_prompt?: string;
  post_history_instructions?: string;
  creator_notes?: string;
  tags?: string[];
  creator?: string;
  character_version?: string;
  avatar?: string;
  group_only_greetings?: string[];
  character_book?: CharacterBook;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CharacterCard {
  spec?: string;
  spec_version?: string;
  data?: CardData;
  [key: string]: unknown;
}

export interface AISettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  // 'json_object' sends OpenAI's response_format json_object (online providers);
  // 'off' omits response_format and relies on the prompt (local models e.g. LM Studio).
  responseFormat: 'json_object' | 'off';
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type Lang = 'zh' | 'en';

export interface Snippet {
  id: string;
  name: string;
  text: string;
}

export interface Recipe {
  id: string;
  name: string;
  field: string;
  prompt: string;
  builtin?: boolean;
}

export type Theme = 'light' | 'dark';

export interface Snapshot {
  timestamp: number;
  card: CharacterCard;
  enabled: Record<string, boolean>;
  subFields: Record<string, string>;
}

export interface AppConfig {
  lang: Lang;
  theme: Theme;
  aiSettings: AISettings;
  snippets: Snippet[];
  customRecipes: Recipe[];
  tokenBudget: number;
}

export interface DecodedImage {
  width: number;
  height: number;
  rgba: Uint8Array;
}

export interface Draft {
  card: CharacterCard;
  enabled: Record<string, boolean>;
  image: DecodedImage | null;
  subFields: Record<string, string>;
  snapshots: Snapshot[];
  sourceName: string;
  updatedAt: number;
}

export interface OpenCardResult {
  name: string;
  bytes: Uint8Array;
}

export interface SaveFilter {
  name: string;
  extensions: string[];
}

// The API surface exposed to the renderer via contextBridge (window.api).
export interface WindowApi {
  openCard: () => Promise<OpenCardResult | null>;
  openFile: (filters: SaveFilter[]) => Promise<OpenCardResult | null>;
  saveFile: (defaultName: string, filters: SaveFilter[], bytes: Uint8Array) => Promise<string | null>;
  aiChat: (settings: AISettings, messages: AIMessage[], opts: { json?: boolean }) => Promise<string>;
  listModels: (settings: AISettings) => Promise<string[]>;
  getConfig: () => Promise<AppConfig>;
  setConfig: (config: AppConfig) => Promise<void>;
  getDraft: () => Promise<Draft | null>;
  setDraft: (draft: Draft) => Promise<void>;
}
