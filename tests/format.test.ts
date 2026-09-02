import { describe, it, expect } from 'vitest';
import { formatDialogue } from '../src/renderer/core/format';

describe('formatDialogue', () => {
  it('converts plain text to standard (prefix + quotes)', () => {
    expect(formatDialogue('Hello there, how are you?', 'standard')).toBe(
      '{{char}}: "Hello there, how are you?"',
    );
  });

  it('keeps narration asterisks and quotes speech', () => {
    expect(formatDialogue('*smiles* Hello there', 'standard')).toBe(
      '{{char}}: *smiles* "Hello there"',
    );
  });

  it('strips prefix and quotes in plain mode', () => {
    expect(formatDialogue('{{char}}: *waves* "Hey you"', 'plain')).toBe('*waves* Hey you');
  });

  it('alternates {{char}}/{{user}} when adding prefixes to un-prefixed lines', () => {
    expect(formatDialogue('First line\nSecond line\nThird line', 'prefixed')).toBe(
      '{{char}}: First line\n{{user}}: Second line\n{{char}}: Third line',
    );
  });

  it('preserves an existing {{user}} prefix', () => {
    expect(formatDialogue('{{user}}: What do you mean?', 'standard')).toBe(
      '{{user}}: "What do you mean?"',
    );
  });

  it('recognizes a bare name prefix as char', () => {
    expect(formatDialogue('Alaric: "Welcome."', 'prefixed')).toBe('{{char}}: Welcome.');
  });
});
