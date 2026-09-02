import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { parseCharx, looksLikeZip } from '../src/renderer/core/charx';

describe('charx', () => {
  it('parses card.json from a zip', () => {
    const card = { spec: 'chara_card_v2', spec_version: '2.0', data: { name: 'Test' } };
    const zip = zipSync({ 'card.json': strToU8(JSON.stringify(card)) });
    const { card: parsed, assets } = parseCharx(zip);
    expect(parsed.data?.name).toBe('Test');
    expect(Object.keys(assets).length).toBe(0);
  });

  it('extracts assets', () => {
    const zip = zipSync({
      'card.json': strToU8('{"data":{"name":"X"}}'),
      'avatar.png': new Uint8Array([1, 2, 3]),
    });
    const { assets } = parseCharx(zip);
    expect(assets['avatar.png']).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('detects zip magic bytes', () => {
    expect(looksLikeZip(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(looksLikeZip(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
  });
});
