// Cross-field find & replace for character cards (including lorebook entries).

import type { CharacterCard } from '../../shared/types';
import { mapCardText } from './cardText';

export function replaceAll(text: string, find: string, replace: string): string {
  if (!find) return text;
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(escaped, 'g')).join(replace);
}

export function findReplaceCard(card: CharacterCard, find: string, replace: string): CharacterCard {
  if (!find) return card;
  return mapCardText(card, (text) => replaceAll(text, find, replace));
}
