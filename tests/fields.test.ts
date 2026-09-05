import { describe, it, expect } from 'vitest';
import { CORE_FIELDS, ADVANCED_FIELDS, ALL_FIELDS } from '../src/renderer/core/fields';
import { WHOLE_CARD_FIELDS, wholeCardMessages } from '../src/renderer/core/ai';

describe('system_prompt classification', () => {
  it('is an advanced field (default-disabled), not a core field', () => {
    expect(CORE_FIELDS.some((f) => f.key === 'system_prompt')).toBe(false);
    const sp = ADVANCED_FIELDS.find((f) => f.key === 'system_prompt');
    expect(sp).toBeDefined();
    expect(sp?.advanced).toBe(true);
    expect(ALL_FIELDS.some((f) => f.key === 'system_prompt')).toBe(true);
  });

  it('is excluded from whole-card generation', () => {
    const fields = WHOLE_CARD_FIELDS as readonly string[];
    expect(fields.includes('system_prompt')).toBe(false);
    const msgs = wholeCardMessages('a brief');
    expect(msgs[1].content).not.toContain('system_prompt');
  });
});
