import { describe, it, expect } from 'vitest';
import { replaceAll, findReplaceCard } from '../src/renderer/core/findReplace';

describe('find & replace', () => {
  it('replaceAll replaces literal text (special chars are literal)', () => {
    expect(replaceAll('a.b', '.', 'X')).toBe('aXb');
  });

  it('findReplaceCard replaces across text fields, arrays and lorebook', () => {
    const card = {
      data: {
        name: 'Alice',
        description: 'Alice is brave.',
        personality: 'Alice is kind.',
        tags: ['Alice', 'hero'],
        character_book: { entries: [{ keys: ['Alice'], content: 'Alice the hero.' }] },
      },
    } as never;
    const out = findReplaceCard(card as never, 'Alice', 'Bob') as {
      data: {
        name: string;
        description: string;
        tags: string[];
        character_book: { entries: Array<{ keys: string[]; content: string }> };
      };
    };
    expect(out.data.name).toBe('Bob');
    expect(out.data.description).toBe('Bob is brave.');
    expect(out.data.tags).toEqual(['Bob', 'hero']);
    expect(out.data.character_book.entries[0].keys).toEqual(['Bob']);
    expect(out.data.character_book.entries[0].content).toBe('Bob the hero.');
  });
});
