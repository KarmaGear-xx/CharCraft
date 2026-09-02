// Avatar image processing: center square crop and bilinear resize, operating
// directly on RGBA buffers (no canvas required, testable in Node).

import type { DecodedImage } from '../../shared/types';
import { decodePng } from './png';

export function cropSquare(img: DecodedImage): DecodedImage {
  const size = Math.min(img.width, img.height);
  if (size === img.width && size === img.height) return img;
  const x0 = Math.floor((img.width - size) / 2);
  const y0 = Math.floor((img.height - size) / 2);
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const srcRow = (y0 + y) * img.width;
    const dstRow = y * size;
    for (let x = 0; x < size; x++) {
      const s = (srcRow + x0 + x) * 4;
      const d = (dstRow + x) * 4;
      rgba[d] = img.rgba[s];
      rgba[d + 1] = img.rgba[s + 1];
      rgba[d + 2] = img.rgba[s + 2];
      rgba[d + 3] = img.rgba[s + 3];
    }
  }
  return { width: size, height: size, rgba };
}

export function resizeImage(img: DecodedImage, maxDim: number): DecodedImage {
  if (img.width <= maxDim && img.height <= maxDim) return img;
  const scale = Math.min(maxDim / img.width, maxDim / img.height);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const rgba = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = (x + 0.5) / scale - 0.5;
      const sy = (y + 0.5) / scale - 0.5;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const cx0 = Math.max(0, Math.min(x0, img.width - 1));
      const cy0 = Math.max(0, Math.min(y0, img.height - 1));
      const cx1 = Math.max(0, Math.min(x0 + 1, img.width - 1));
      const cy1 = Math.max(0, Math.min(y0 + 1, img.height - 1));
      for (let c = 0; c < 4; c++) {
        const p00 = img.rgba[(cy0 * img.width + cx0) * 4 + c];
        const p10 = img.rgba[(cy0 * img.width + cx1) * 4 + c];
        const p01 = img.rgba[(cy1 * img.width + cx0) * 4 + c];
        const p11 = img.rgba[(cy1 * img.width + cx1) * 4 + c];
        const top = p00 * (1 - fx) + p10 * fx;
        const bot = p01 * (1 - fx) + p11 * fx;
        rgba[(y * w + x) * 4 + c] = Math.round(top * (1 - fy) + bot * fy);
      }
    }
  }
  return { width: w, height: h, rgba };
}

// Decode an arbitrary image byte buffer to RGBA. PNG is decoded with our own
// codec; other formats (jpg/webp/gif) go through the browser's image decoder
// and canvas (renderer only).
export async function decodeImageBytes(bytes: Uint8Array): Promise<DecodedImage> {
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (isPng) return decodePng(bytes);

  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const url = URL.createObjectURL(new Blob([ab]));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('无法解码该图片格式'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, rgba: new Uint8Array(imageData.data) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
