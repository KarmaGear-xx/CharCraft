import { describe, it, expect } from 'vitest';
import { swapGenders, genderSwapCard } from '../src/renderer/core/gender';

describe('gender swap', () => {
  it('swaps he/she with case preservation', () => {
    expect(swapGenders('He said she was here.')).toBe('She said he was here.');
  });

  it('preserves ALL CAPS', () => {
    expect(swapGenders('HE is HIS own man.')).toBe('SHE is HER own woman.');
  });

  it('does not match inside other words', () => {
    expect(swapGenders('there the theme')).toBe('there the theme');
  });

  it('is reversible for he/him', () => {
    expect(swapGenders(swapGenders('He saw him'))).toBe('He saw him');
  });

  it('swaps across card fields and lorebook', () => {
    const card = {
      data: {
        name: 'He-man',
        description: 'He is a brave man.',
        character_book: { entries: [{ keys: ['his sword'], content: 'He loves his sword.' }] },
      },
    } as never;
    const out = genderSwapCard(card as never) as {
      data: { description: string; character_book: { entries: Array<{ keys: string[]; content: string }> } };
    };
    expect(out.data.description).toBe('She is a brave woman.');
    expect(out.data.character_book.entries[0].content).toBe('She loves her sword.');
  });
});
