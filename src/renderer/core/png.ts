// PNG codec for the renderer (Chromium runtime). Uses the native
// CompressionStream / DecompressionStream, so it has zero native deps and also
// runs in Node for the unit tests.

import type { DecodedImage } from '../../shared/types';

export interface PngTextChunk {
  keyword: string;
  text: string;
}

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface Chunk {
  type: string;
  data: Uint8Array;
}

function parseChunks(buf: Uint8Array): Chunk[] {
  if (buf.length < 8) throw new Error('Not a PNG (too small)');
  for (let i = 0; i < 8; i++) if (buf[i] !== SIGNATURE[i]) throw new Error('Not a PNG (bad signature)');
  const chunks: Chunk[] = [];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = new DataView(buf.buffer, buf.byteOffset + off, 4).getUint32(0, false);
    const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
    chunks.push({ type, data: buf.subarray(off + 8, off + 8 + len) });
    off += 12 + len;
  }
  return chunks;
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.byteLength);
  new Uint8Array(ab).set(u);
  return ab;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate');
  const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function sampleAt(row: Uint8Array, px: number, ch: number, channels: number, bps: number): number {
  return bps === 1 ? row[px * channels + ch] : row[(px * channels + ch) * 2];
}

function convertRow(
  row: Uint8Array,
  out: Uint8Array,
  start: number,
  width: number,
  colorType: number,
  bitDepth: number,
  channels: number,
  plte?: Uint8Array,
  trns?: Uint8Array,
): void {
  const bps = bitDepth === 16 ? 2 : 1;
  if (colorType === 3) {
    if (!plte) throw new Error('Palette PNG missing PLTE');
    for (let x = 0; x < width; x++) {
      const idx = row[x];
      const o = start + x * 4;
      out[o] = plte[idx * 3];
      out[o + 1] = plte[idx * 3 + 1];
      out[o + 2] = plte[idx * 3 + 2];
      out[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
    }
    return;
  }
  for (let x = 0; x < width; x++) {
    const o = start + x * 4;
    if (colorType === 0) {
      const g = sampleAt(row, x, 0, channels, bps);
      out[o] = out[o + 1] = out[o + 2] = g;
      out[o + 3] = 255;
    } else if (colorType === 2) {
      out[o] = sampleAt(row, x, 0, channels, bps);
      out[o + 1] = sampleAt(row, x, 1, channels, bps);
      out[o + 2] = sampleAt(row, x, 2, channels, bps);
      out[o + 3] = 255;
    } else if (colorType === 4) {
      const g = sampleAt(row, x, 0, channels, bps);
      out[o] = out[o + 1] = out[o + 2] = g;
      out[o + 3] = sampleAt(row, x, 1, channels, bps);
    } else {
      out[o] = sampleAt(row, x, 0, channels, bps);
      out[o + 1] = sampleAt(row, x, 1, channels, bps);
      out[o + 2] = sampleAt(row, x, 2, channels, bps);
      out[o + 3] = sampleAt(row, x, 3, channels, bps);
    }
  }
}

export async function decodePng(buf: Uint8Array): Promise<DecodedImage> {
  const chunks = parseChunks(buf);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr || ihdr.data.length < 13) throw new Error('PNG missing IHDR');
  const dv = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength);
  const width = dv.getUint32(0, false);
  const height = dv.getUint32(4, false);
  const bitDepth = dv.getUint8(8);
  const colorType = dv.getUint8(9);
  const interlace = dv.getUint8(12);
  if (interlace !== 0) throw new Error('Interlaced PNG is not supported');
  if (bitDepth !== 8 && bitDepth !== 16) throw new Error(`Unsupported bit depth ${bitDepth}`);
  if (colorType < 0 || colorType > 6 || colorType === 1 || colorType === 5) throw new Error(`Unsupported color type ${colorType}`);

  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : 4;
  const bpp = channels * (bitDepth === 16 ? 2 : 1);
  const plte = chunks.find((c) => c.type === 'PLTE')?.data;
  const trns = chunks.find((c) => c.type === 'tRNS')?.data;

  let idatLen = 0;
  for (const c of chunks) if (c.type === 'IDAT') idatLen += c.data.length;
  const idat = new Uint8Array(idatLen);
  let pos = 0;
  for (const c of chunks) if (c.type === 'IDAT') {
    idat.set(c.data, pos);
    pos += c.data.length;
  }

  const raw = await inflate(idat);
  const stride = width * bpp;
  const out = new Uint8Array(width * height * 4);
  const row = new Uint8Array(stride);
  const prev = new Uint8Array(stride);

  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    for (let i = 0; i < stride; i++) {
      const x = raw[rp++];
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v: number;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: v = x + paeth(a, b, c); break;
        default: throw new Error(`Unknown filter ${filter}`);
      }
      row[i] = v & 0xff;
    }
    convertRow(row, out, y * width * 4, width, colorType, bitDepth, channels, plte, trns);
    prev.set(row);
  }
  return { width, height, rgba: out };
}

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length, false);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)), false);
  return out;
}

function buildTextChunk(keyword: string, text: string): Uint8Array {
  const kb = new TextEncoder().encode(keyword);
  const tb = new TextEncoder().encode(text);
  const data = new Uint8Array(kb.length + 1 + tb.length);
  data.set(kb, 0);
  data[kb.length] = 0;
  data.set(tb, kb.length + 1);
  return buildChunk('tEXt', data);
}

export async function encodePng(
  width: number,
  height: number,
  rgba: Uint8Array,
  textChunks: PngTextChunk[] = [],
): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width, false);
  dv.setUint32(4, height, false);
  dv.setUint8(8, 8);
  dv.setUint8(9, 6);
  dv.setUint8(10, 0);
  dv.setUint8(11, 0);
  dv.setUint8(12, 0);

  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const idatData = await deflate(raw);

  const parts: Uint8Array[] = [Uint8Array.from(SIGNATURE), buildChunk('IHDR', ihdr)];
  for (const t of textChunks) parts.push(buildTextChunk(t.keyword, t.text));
  parts.push(buildChunk('IDAT', idatData));
  parts.push(buildChunk('IEND', new Uint8Array(0)));

  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function readTextChunks(buf: Uint8Array): PngTextChunk[] {
  const out: PngTextChunk[] = [];
  for (const c of parseChunks(buf)) {
    if (c.type !== 'tEXt') continue;
    let i = 0;
    while (i < c.data.length && c.data[i] !== 0) i++;
    if (i >= c.data.length) continue;
    let keyword = '';
    for (let j = 0; j < i; j++) keyword += String.fromCharCode(c.data[j]);
    const text = new TextDecoder('utf8').decode(c.data.subarray(i + 1));
    out.push({ keyword, text });
  }
  return out;
}
