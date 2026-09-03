import { describe, it, expect } from 'vitest';
import { validateCard } from '../src/renderer/core/validate';
import type { CharacterCard } from '../src/shared/types';

const enabled = (o: Record<string, boolean> = {}) => ({
  name: true,
  description: true,
  personality: true,
  first_mes: true,
  tags: true,
  ...o,
});

describe('pre-export validation', () => {
  it('returns name error + empty warnings for an empty card', () => {
    const card: CharacterCard = { spec: 'chara_card_v2', data: {} };
    const keys = validateCard(card, enabled(), 4096, null).map((i) => i.key);
    expect(keys).toContain('validate.nameEmpty');
    expect(keys).toContain('validate.descriptionEmpty');
    expect(keys).toContain('validate.personalityEmpty');
    expect(keys).toContain('validate.firstMesEmpty');
    expect(keys).toContain('validate.tagsEmpty');
  });

  it('returns no issues for a complete card', () => {
    const card: CharacterCard = {
      spec: 'chara_card_v2',
      data: { name: 'A', description: 'd', personality: 'p', first_mes: 'f', tags: ['a', 'b'] },
    };
    expect(validateCard(card, enabled(), 4096, null)).toEqual([]);
  });

  it('flags lorebook entries missing keys or content', () => {
    const card: CharacterCard = {
      spec: 'chara_card_v2',
      data: {
        name: 'A',
        description: 'd',
        personality: 'p',
        first_mes: 'f',
        tags: ['a', 'b'],
        character_book: { entries: [{ keys: [], content: '' }] },
      },
    };
    expect(validateCard(card, enabled(), 4096, null).some((i) => i.key === 'validate.lorebookEntryMissing')).toBe(true);
  });

  it('flags unknown extensions', () => {
    const card: CharacterCard = {
      spec: 'chara_card_v2',
      data: { name: 'A', description: 'd', personality: 'p', first_mes: 'f', tags: ['a', 'b'], extensions: { foo: 1 } },
    };
    expect(validateCard(card, enabled(), 4096, null).some((i) => i.key === 'validate.unknownExtensions')).toBe(true);
  });
});
