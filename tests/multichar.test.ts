import { describe, it, expect } from 'vitest';
import { composeMultiCard, defaultGroupName } from '../src/renderer/core/multiChar';
import type { CharacterCard, MultiChar, MultiGroup } from '../src/shared/types';

const chars: MultiChar[] = [
  { id: '1', name: 'Alice', description: 'A knight.', personality: 'Brave.', intro: 'Hi' },
  { id: '2', name: 'Bob', description: 'A mage.', personality: 'Wise.', intro: 'Hello' },
];
const group: MultiGroup = { name: 'Duo', scenario: 'A quest.', firstMes: 'Both stand ready.' };

describe('multi-character compose', () => {
  it('composes name, description, personality, scenario, first_mes and adds a multiple tag', () => {
    const card: CharacterCard = { spec: 'chara_card_v2', data: {} };
    const out = composeMultiCard(card, chars, group);
    expect(out.data?.name).toBe('Duo');
    expect(out.data?.description).toContain('### Alice');
    expect(out.data?.description).toContain('A knight.');
    expect(out.data?.personality).toContain('### Bob');
    expect(out.data?.scenario).toBe('A quest.');
    expect(out.data?.first_mes).toBe('Both stand ready.');
    expect(out.data?.tags).toContain('multiple');
  });

  it('defaultGroupName falls back from character names', () => {
    expect(defaultGroupName([])).toBe('Group');
    expect(defaultGroupName(chars)).toBe('Alice & Bob');
  });

  it('leaves the card untouched when there are no meaningful characters', () => {
    const card: CharacterCard = { spec: 'chara_card_v2', data: { name: 'X' } };
    const out = composeMultiCard(card, [], group);
    expect(out.data?.name).toBe('X');
  });
});
