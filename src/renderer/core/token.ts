// Token counting (tiktoken-based) for text fields and the whole card.

import { countTokens } from 'gpt-tokenizer';
import type { CharacterCard } from '../../shared/types';

export function tokenCount(text: string): number {
  if (!text) return 0;
  try {
    return countTokens(text);
  } catch {
    return Math.ceil(text.length / 4);
  }
}

const TEXT_FIELDS = [
  'name',
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'system_prompt',
  'post_history_instructions',
  'creator_notes',
];

const ARRAY_FIELDS = ['alternate_greetings', 'group_only_greetings', 'tags'];

export function countCardTokens(card: CharacterCard): number {
  const d = card.data ?? {};
  let total = 0;
  for (const k of TEXT_FIELDS) {
    const v = d[k];
    if (typeof v === 'string') total += tokenCount(v);
  }
  for (const k of ARRAY_FIELDS) {
    const v = d[k];
    if (Array.isArray(v)) total += tokenCount((v as string[]).join('\n'));
  }
  const entries = d.character_book?.entries ?? [];
  for (const e of entries) {
    total += tokenCount((e.keys ?? []).join(', ') + ' ' + (e.content ?? '') + ' ' + (e.comment ?? ''));
  }
  return total;
}
