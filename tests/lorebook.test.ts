import { describe, it, expect } from 'vitest';
import { buildWorldJson, parseWorldJson, mergeBook } from '../src/renderer/core/lorebook';

describe('lorebook io', () => {
  it('round-trips a book through standalone JSON (object entries)', () => {
    const book = {
      name: 'My World',
      entries: [
        { keys: ['a'], content: 'A' },
        { keys: ['b'], content: 'B' },
      ],
    };
    const json = buildWorldJson(book);
    const parsed = parseWorldJson(json);
    expect(parsed.name).toBe('My World');
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries?.[0]?.keys).toEqual(['a']);
  });

  it('parses array entries too', () => {
    const json = JSON.stringify({ entries: [{ keys: ['x'], content: 'X' }] });
    const parsed = parseWorldJson(json);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries?.[0]?.content).toBe('X');
  });

  it('mergeBook appends incoming entries', () => {
    const a = { entries: [{ keys: ['a'], content: 'A' }] };
    const b = { entries: [{ keys: ['b'], content: 'B' }] };
    const merged = mergeBook(a, b);
    expect(merged.entries).toHaveLength(2);
  });
});
