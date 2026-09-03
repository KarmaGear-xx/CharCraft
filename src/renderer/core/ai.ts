// Prompt builders, JSON extraction and field coercion for AI generation.
// The actual HTTP request runs in the main process (window.api.aiChat).

import type { AIMessage, PromptTemplates } from '../../shared/types';

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

// Replace `{key}` placeholders in a user template with values. Unknown
// placeholders are left untouched so a mistyped variable is easy to spot.
export function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function systemContent(templates?: PromptTemplates): string {
  return templates?.system?.trim() ? templates.system : SYSTEM_AUTHOR;
}

export function wholeCardMessages(brief: string, templates?: PromptTemplates): AIMessage[] {
  const user = templates?.wholeCard?.trim()
    ? applyTemplate(templates.wholeCard, { brief })
    : 'Create a complete SillyTavern character card from this brief:\n"' +
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
      'Write everything in English.';
  return [
    { role: 'system', content: systemContent(templates) },
    { role: 'user', content: user },
  ];
}

export function fieldRewriteMessages(
  fieldKey: string,
  current: string,
  context: { name?: string; brief?: string },
  templates?: PromptTemplates,
): AIMessage[] {
  const isArray = fieldKey === 'tags' || fieldKey === 'alternate_greetings' || fieldKey === 'group_only_greetings';
  const user = templates?.fieldRewrite?.trim()
    ? applyTemplate(templates.fieldRewrite, {
        fieldKey,
        name: context.name || '(unnamed)',
        brief: context.brief ?? '',
        current,
        outputFormat: isArray ? 'JSON array of strings' : 'plain text content',
      })
    : (() => {
        const fidelitySource = current ? 'current content' : 'the brief and character name';
        return (
          `Rewrite the field "${fieldKey}" of the character card.\n` +
          `Character name: ${context.name || '(unnamed)'}.\n` +
          (context.brief ? `Brief: ${context.brief}\n` : '') +
          (current ? `Current content:\n"""\n${current}\n"""\n\n` : '') +
          `Rules:\n` +
          `1. Fidelity first: keep EVERY fact, name and detail from ${fidelitySource} — do not omit or replace any of it.\n` +
          `2. Expand and polish: improve wording and flow, add concrete sensory/behavioral detail, and lengthen any thin parts.\n` +
          `3. Return ONLY the ${isArray ? 'JSON array of strings' : 'plain text content'} for this field, in English, no explanations.`
        );
      })();
  return [
    { role: 'system', content: systemContent(templates) },
    { role: 'user', content: user },
  ];
}

export function lorebookEntryMessages(
  characterName: string,
  descriptionSnippet: string,
  topic: string,
  templates?: PromptTemplates,
): AIMessage[] {
  const user = templates?.lorebook?.trim()
    ? applyTemplate(templates.lorebook, {
        name: characterName || '(unnamed)',
        description: descriptionSnippet.slice(0, 800),
        topic,
      })
    : 'Create one World Info (lorebook) entry for this SillyTavern character card.\n' +
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
      'Write in English.';
  return [
    { role: 'system', content: systemContent(templates) },
    { role: 'user', content: user },
  ];
}

export function recipeMessages(
  recipe: { field: string; prompt: string },
  current: string,
  characterName: string,
  templates?: PromptTemplates,
): AIMessage[] {
  const user = templates?.recipe?.trim()
    ? applyTemplate(templates.recipe, {
        field: recipe.field,
        recipe: recipe.prompt,
        name: characterName || '(unnamed)',
        current,
      })
    : (() => {
        const fidelitySource = current ? 'current content' : 'the recipe';
        return (
          `Apply this recipe to the "${recipe.field}" field of the character card.\n` +
          `Recipe: ${recipe.prompt}\n` +
          `Character name: ${characterName || '(unnamed)'}.\n` +
          (current ? `Current content:\n"""\n${current}\n"""\n\n` : '') +
          `Rules:\n` +
          `1. Fidelity first: keep every fact, name and detail from ${fidelitySource} — apply the recipe on top of it without losing anything.\n` +
          `2. Expand and polish: improve wording and add concrete detail.\n` +
          `3. Return ONLY the new ${recipe.field} content in English, no explanations.`
        );
      })();
  return [
    { role: 'system', content: systemContent(templates) },
    { role: 'user', content: user },
  ];
}

// Generate (or rewrite) ONE character for a multi-character card.
export function multiCharMessages(
  brief: string,
  existing?: { name: string; description: string; personality: string; intro: string },
  templates?: PromptTemplates,
): AIMessage[] {
  const user = existing
    ? 'Rewrite this character for a SillyTavern multi-character card.\n' +
      'Current character:\n' +
      `Name: ${existing.name || '(unnamed)'}\n` +
      `Description: ${existing.description || '(none)'}\n` +
      `Personality: ${existing.personality || '(none)'}\n` +
      `Intro: ${existing.intro || '(none)'}\n\n` +
      'Rules:\n' +
      '1. Fidelity first: keep every fact, name and detail — do not omit or replace any of it.\n' +
      '2. Expand and polish: add concrete detail and lengthen thin parts.\n' +
      '3. Return a single JSON object: {"name": string, "description": string, "personality": string, "intro": string}, all in English.'
    : 'Create ONE character for a SillyTavern multi-character card from this brief:\n"' +
      brief +
      '"\n\nReturn a single JSON object (all in English):\n' +
      '- "name": string\n' +
      '- "description": string (appearance + backstory, 2-3 paragraphs)\n' +
      '- "personality": string (traits, mannerisms, 1-2 paragraphs)\n' +
      '- "intro": string (one opening line in character)\n' +
      'Write everything in English.';
  return [
    { role: 'system', content: systemContent(templates) },
    { role: 'user', content: user },
  ];
}

// Generate a whole multi-character group from a single brief.
export function multiGroupMessages(brief: string, templates?: PromptTemplates): AIMessage[] {
  const user =
    'Create a multi-character SillyTavern character card (a group) from this brief:\n"' +
    brief +
    '"\n\nReturn a single JSON object (all in English):\n' +
    '- "name": string (group name)\n' +
    '- "scenario": string (shared situation / world context, 2-3 paragraphs)\n' +
    '- "first_mes": string (group opening message in character, *actions* + quoted dialogue, address {{user}})\n' +
    '- "characters": array of objects, each: {"name": string, "description": string (2-3 paragraphs), "personality": string (1-2 paragraphs), "intro": string (one opening line)}\n' +
    'Include EVERY character implied by the brief; 2-4 characters unless the brief says otherwise.\n' +
    'Write everything in English.';
  return [
    { role: 'system', content: systemContent(templates) },
    { role: 'user', content: user },
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
