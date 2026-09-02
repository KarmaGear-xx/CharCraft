import { describe, it, expect } from 'vitest';
import { mergeDescription } from '../src/renderer/core/card';

describe('mergeDescription', () => {
  it('prepends sub-fields before the original description', () => {
    const subFields = { full_name: 'John Smith', gender: 'Male', age: '28' };
    expect(mergeDescription('A brave knight.', subFields)).toBe(
      'Full Name: John Smith\nGender: Male\nAge: 28\nA brave knight.',
    );
  });

  it('skips empty sub-fields', () => {
    expect(mergeDescription('Body text', { full_name: '', gender: 'Female' })).toBe(
      'Gender: Female\nBody text',
    );
  });

  it('returns empty string when nothing is present', () => {
    expect(mergeDescription('', {})).toBe('');
  });
});
