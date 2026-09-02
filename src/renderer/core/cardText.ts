// Shared helper: apply a text transform across a card's editable text fields
// (strings, string arrays, and lorebook entry keys/content/comment).

import type { CharacterCard, WorldEntry } from '../../shared/types';

const TEXT_KEYS = [
  'name',
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'system_prompt',
  'post_history_instructions',
  'creator_notes',
  'character_version',
];

const ARRAY_KEYS = ['alternate_greetings', 'group_only_greetings', 'tags'];

export function mapCardText(card: CharacterCard, transform: (text: string) => string): CharacterCard {
  const data = { ...(card.data ?? {}) };
  for (const k of TEXT_KEYS) {
    const v = data[k];
    if (typeof v === 'string') data[k] = transform(v);
  }
  for (const k of ARRAY_KEYS) {
    const v = data[k];
    if (Array.isArray(v)) data[k] = (v as string[]).map((s) => transform(s));
  }
  const book = data.character_book;
  if (book && Array.isArray(book.entries)) {
    const entries = book.entries.map((e) => {
      const ne: WorldEntry = { ...e };
      if (typeof e.content === 'string') ne.content = transform(e.content);
      if (typeof e.comment === 'string') ne.comment = transform(e.comment);
      if (Array.isArray(e.keys)) ne.keys = e.keys.map((s) => transform(s));
      return ne;
    });
    data.character_book = { ...book, entries };
  }
  return { ...card, data };
}
