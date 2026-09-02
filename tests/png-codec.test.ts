import { describe, it, expect } from 'vitest';
import { encodePng, decodePng, readTextChunks, crc32 } from '../src/renderer/core/png';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('png codec', () => {
  it('round-trips an RGBA image exactly', async () => {
    const w = 8;
    const h = 6;
    const rgba = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = i % 256;
      rgba[i * 4 + 1] = (i * 2) % 256;
      rgba[i * 4 + 2] = (i * 3) % 256;
      rgba[i * 4 + 3] = 255;
    }
    const bytes = await encodePng(w, h, rgba, [{ keyword: 'chara', text: 'aGVsbG8=' }]);
    const decoded = await decodePng(bytes);
    expect(decoded.width).toBe(w);
    expect(decoded.height).toBe(h);
    expect(Array.from(decoded.rgba)).toEqual(Array.from(rgba));
    expect(readTextChunks(bytes).find((t) => t.keyword === 'chara')?.text).toBe('aGVsbG8=');
  });

  it('decodes a demo card PNG', async () => {
    const buf = readFileSync(resolve('demo', 'Rikka.png'));
    const decoded = await decodePng(buf);
    expect(decoded.width).toBeGreaterThan(0);
    expect(decoded.height).toBeGreaterThan(0);
    expect(decoded.rgba.length).toBe(decoded.width * decoded.height * 4);
  });

  it('computes a stable crc32', () => {
    expect(crc32(new TextEncoder().encode('IEND'))).toBeGreaterThan(0);
  });
});
