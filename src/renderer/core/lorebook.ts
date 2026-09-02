// Standalone world info (lorebook) import / export.
// SillyTavern standalone world info files store `entries` as an object keyed by
// string index, while the embedded character_book uses an array.

import type { CharacterBook, WorldEntry } from '../../shared/types';

export function buildWorldJson(book: CharacterBook): string {
  const entriesObj: Record<string, WorldEntry> = {};
  (book.entries ?? []).forEach((e, i) => {
    entriesObj[String(i)] = e;
  });
  const { entries: _entries, ...rest } = book;
  return JSON.stringify({ ...rest, entries: entriesObj }, null, 2);
}

export function parseWorldJson(text: string): CharacterBook {
  const o = (JSON.parse(text) ?? {}) as Record<string, unknown>;
  const raw = o.entries;
  let entries: WorldEntry[] = [];
  if (Array.isArray(raw)) {
    entries = raw.filter((e): e is WorldEntry => !!e && typeof e === 'object');
  } else if (raw && typeof raw === 'object') {
    entries = Object.values(raw).filter((e): e is WorldEntry => !!e && typeof e === 'object');
  }
  const { entries: _drop, ...rest } = o;
  return { ...rest, entries };
}

// Merge an imported book into the existing one: append its entries.
export function mergeBook(target: CharacterBook, incoming: CharacterBook): CharacterBook {
  const merged = [...(target.entries ?? []), ...(incoming.entries ?? [])];
  return { ...target, ...incoming, entries: merged };
}
