import { describe, it, expect } from 'vitest';
import { tokenCount, countCardTokens } from '../src/renderer/core/token';

describe('token counting', () => {
  it('returns 0 for empty text', () => {
    expect(tokenCount('')).toBe(0);
  });

  it('counts tokens for text', () => {
    expect(tokenCount('Hello, world!')).toBeGreaterThan(0);
  });

  it('counts card tokens across fields and lorebook', () => {
    const card = {
      data: {
        name: 'Alaric',
        description: 'A brave knight.',
        personality: 'Bold and loyal.',
        character_book: { entries: [{ keys: ['sword'], content: 'Uses a sword.' }] },
      },
    } as never;
    expect(countCardTokens(card)).toBeGreaterThan(0);
  });
});
