// Prompt builders, JSON extraction and field coercion for AI generation.
// The actual HTTP request runs in the main process (window.api.aiChat).

import type { AIMessage } from '../../shared/types';

export const WHOLE_CARD_FIELDS = [
  'name',
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'system_prompt',
  'tags',
] as const;

const SYSTEM_AUTHOR =
  'You are an expert SillyTavern character card author. You write vivid, roleplay-ready character cards in ENGLISH. ' +
  'Quality rules:\n' +
  '- Fidelity first: never drop, contradict, or replace any fact, name, or detail the user provided; preserve all of it.\n' +
  '- Rewrite by EXPANDING and POLISHING, never by shrinking or summarizing away.\n' +
  '- Be concrete and specific; avoid vague filler and one-line placeholders.\n' +
  '- Prefer writing too much over too little.\n' +
  'Output valid JSON only, no markdown fences, no commentary.';

export function wholeCardMessages(brief: string): AIMessage[] {
  return [
    { role: 'system', content: SYSTEM_AUTHOR },
    {
      role: 'user',
      content:
        'Create a complete SillyTavern character card from this brief:\n"' +
        brief +
        '"\n\nHard requirements:\n' +
        '1. Fidelity first: EVERY detail in the brief MUST appear in the result — do not drop or change any name, trait, relationship, or plot point.\n' +
        '2. Expand generously: turn each brief detail into full, vivid English prose, adding plausible supporting detail the brief implies.\n' +
        '3. Return a single JSON object with exactly these keys (in English):\n' +
        '- "name": string\n' +
        '- "description": string (appearance + backstory, at least 3 paragraphs, about 150-250 words)\n' +
        '- "personality": string (traits, mannerisms, speech style, at least 2 paragraphs, about 80-120 words)\n' +
        '- "scenario": string (situation / world context, 2-3 paragraphs)\n' +
        '- "first_mes": string (opening message in character; use *actions* and quoted dialogue, address the user as {{user}})\n' +
        '- "mes_example": string (2-3 turns of example dialogue between {{char}} and {{user}})\n' +
        '- "system_prompt": string (optional instructions for the AI, may be empty)\n' +
        '- "tags": array of strings (5-10 relevant tags)\n' +
        'Write everything in English.',
    },
  ];
}

export function fieldRewriteMessages(
  fieldKey: string,
  current: string,
  context: { name?: string; brief?: string },
): AIMessage[] {
  const isArray = fieldKey === 'tags' || fieldKey === 'alternate_greetings' || fieldKey === 'group_only_greetings';
  const fidelitySource = current ? 'current content' : 'the brief and character name';
  return [
    { role: 'system', content: SYSTEM_AUTHOR },
    {
      role: 'user',
      content:
        `Rewrite the field "${fieldKey}" of the character card.\n` +
        `Character name: ${context.name || '(unnamed)'}.\n` +
        (context.brief ? `Brief: ${context.brief}\n` : '') +
        (current ? `Current content:\n"""\n${current}\n"""\n\n` : '') +
        `Rules:\n` +
        `1. Fidelity first: keep EVERY fact, name and detail from ${fidelitySource} — do not omit or replace any of it.\n` +
        `2. Expand and polish: improve wording and flow, add concrete sensory/behavioral detail, and lengthen any thin parts.\n` +
        `3. Return ONLY the ${isArray ? 'JSON array of strings' : 'plain text content'} for this field, in English, no explanations.`,
    },
  ];
}

export function lorebookEntryMessages(characterName: string, descriptionSnippet: string, topic: string): AIMessage[] {
  return [
    { role: 'system', content: SYSTEM_AUTHOR },
    {
      role: 'user',
      content:
        'Create one World Info (lorebook) entry for this SillyTavern character card.\n' +
        `Character: ${characterName || '(unnamed)'}.\n` +
        `Character description: ${descriptionSnippet.slice(0, 800) || '(none)'}.\n` +
        `Topic for the entry: "${topic}".\n\n` +
        'Requirements:\n' +
        '1. Fidelity first: keep the topic and every relevant character fact from the description — do not drop or contradict them.\n' +
        '2. Expand concisely: write clear factual lore, adding only what the topic implies.\n' +
        '3. Return a single JSON object:\n' +
        '- "keys": array of strings (trigger keywords, 2-6 lowercase)\n' +
        '- "content": string (concise factual lore, 1-3 sentences)\n' +
        '- "comment": string (short note about when it triggers)\n' +
        'Write in English.',
    },
  ];
}

export function recipeMessages(recipe: { field: string; prompt: string }, current: string, characterName: string): AIMessage[] {
  const fidelitySource = current ? 'current content' : 'the recipe';
  return [
    { role: 'system', content: SYSTEM_AUTHOR },
    {
      role: 'user',
      content:
        `Apply this recipe to the "${recipe.field}" field of the character card.\n` +
        `Recipe: ${recipe.prompt}\n` +
        `Character name: ${characterName || '(unnamed)'}.\n` +
        (current ? `Current content:\n"""\n${current}\n"""\n\n` : '') +
        `Rules:\n` +
        `1. Fidelity first: keep every fact, name and detail from ${fidelitySource} — apply the recipe on top of it without losing anything.\n` +
        `2. Expand and polish: improve wording and add concrete detail.\n` +
        `3. Return ONLY the new ${recipe.field} content in English, no explanations.`,
    },
  ];
}

export function extractJson(text: string): unknown {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    /* fall through */
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  const as = t.indexOf('[');
  const ae = t.lastIndexOf(']');
  if (as >= 0 && ae > as) {
    try {
      return JSON.parse(t.slice(as, ae + 1));
    } catch {
      /* fall through */
    }
  }
  throw new Error('无法从 AI 返回中解析 JSON。');
}

export function coerceGeneratedField(key: string, value: unknown): unknown {
  if (key === 'tags' || key === 'alternate_greetings' || key === 'group_only_greetings') {
    if (Array.isArray(value)) return value.map((v) => String(v));
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    return [];
  }
  if (value == null) return '';
  return String(value);
}
