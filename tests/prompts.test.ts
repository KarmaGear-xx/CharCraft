import { describe, it, expect } from 'vitest';
import { applyTemplate, wholeCardMessages } from '../src/renderer/core/ai';
import { EMPTY_PROMPT_TEMPLATES } from '../src/shared/types';

describe('prompt templates', () => {
  it('applyTemplate replaces known variables and keeps unknown ones', () => {
    expect(applyTemplate('Hi {name}, {brief} {unknown}', { name: 'A', brief: 'B' })).toBe('Hi A, B {unknown}');
  });

  it('wholeCardMessages uses the built-in prompt when template is empty', () => {
    const msgs = wholeCardMessages('a brief', { ...EMPTY_PROMPT_TEMPLATES });
    expect(msgs[1].content).toContain('a brief');
    expect(msgs[1].content).not.toContain('{brief}');
  });

  it('wholeCardMessages substitutes the custom template', () => {
    const msgs = wholeCardMessages('the brief', { ...EMPTY_PROMPT_TEMPLATES, wholeCard: 'Make: {brief}' });
    expect(msgs[1].content).toBe('Make: the brief');
  });

  it('a custom system template replaces the built-in system prompt', () => {
    const msgs = wholeCardMessages('b', { ...EMPTY_PROMPT_TEMPLATES, system: 'CUSTOM SYS' });
    expect(msgs[0].content).toBe('CUSTOM SYS');
  });
});
