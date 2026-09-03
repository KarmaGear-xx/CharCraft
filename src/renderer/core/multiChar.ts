// Compose multiple characters into a single standard SillyTavern card.
// The list is an editing abstraction; on export each character becomes a
// titled block inside description / personality (the common convention used
// by multi-character cards on SillyTavern-compatible frontends).

import type { CharacterCard, MultiChar, MultiGroup } from '../../shared/types';

export function defaultGroupName(characters: MultiChar[]): string {
  const names = characters.map((c) => c.name.trim()).filter(Boolean);
  if (names.length === 0) return 'Group';
  if (names.length === 1) return names[0];
  return names.slice(0, 2).join(' & ') + (names.length > 2 ? ` +${names.length - 2}` : '');
}

export function composeMultiCard(card: CharacterCard, characters: MultiChar[], group: MultiGroup): CharacterCard {
  const data = { ...(card.data ?? {}) };
  const chars = characters.filter((c) => c.name.trim() || c.description.trim() || c.personality.trim());
  if (chars.length === 0) return { ...card, data };

  data.name = group.name.trim() || defaultGroupName(chars);
  data.description = chars.map((c) => `### ${c.name.trim() || 'Unnamed'}\n${c.description.trim()}`).join('\n\n');
  data.personality = chars.map((c) => `### ${c.name.trim() || 'Unnamed'}\n${c.personality.trim()}`).join('\n\n');
  if (group.scenario.trim()) data.scenario = group.scenario.trim();
  if (group.firstMes.trim()) data.first_mes = group.firstMes.trim();

  const tags = new Set((Array.isArray(data.tags) ? data.tags : []).map(String).filter(Boolean));
  tags.add('multiple');
  data.tags = [...tags];

  return { ...card, data };
}
