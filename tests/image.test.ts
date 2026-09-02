import { describe, it, expect } from 'vitest';
import { cropSquare, resizeImage } from '../src/renderer/core/image';

function makeImg(w: number, h: number) {
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = i % 256;
    rgba[i * 4 + 3] = 255;
  }
  return { width: w, height: h, rgba };
}

describe('image ops', () => {
  it('cropSquare crops a wide image to a center square', () => {
    const out = cropSquare(makeImg(8, 4));
    expect(out.width).toBe(4);
    expect(out.height).toBe(4);
    expect(out.rgba.length).toBe(4 * 4 * 4);
  });

  it('cropSquare returns the same image if already square', () => {
    const img = makeImg(4, 4);
    expect(cropSquare(img)).toBe(img);
  });

  it('resizeImage shrinks to fit maxDim', () => {
    const out = resizeImage(makeImg(8, 4), 4);
    expect(out.width).toBe(4);
    expect(out.height).toBe(2);
    expect(out.rgba.length).toBe(4 * 2 * 4);
  });

  it('resizeImage keeps small images unchanged', () => {
    const img = makeImg(3, 2);
    expect(resizeImage(img, 512)).toBe(img);
  });
});
