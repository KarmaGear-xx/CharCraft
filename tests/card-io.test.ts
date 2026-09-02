import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { importCardBytes, buildExportCard, buildPngBytes, CARD_V2, CARD_V3 } from '../src/renderer/core/card';

const DEMO = [
  'Story Master - Vampire.png',
  'Rikka.png',
  'Rikka1.png',
  'Veronica.png',
  'Nina.png',
  'main_alaric-valheirn-12d5d366_spec_v2.png',
  'main_meru-3733df6f_spec_v2.png',
];

describe('demo cards', () => {
  it('parses all 7 demo cards with a name and an image', async () => {
    for (const f of DEMO) {
      const buf = readFileSync(resolve('demo', f));
      const imported = await importCardBytes(new Uint8Array(buf), f);
      expect(imported.card.data).toBeTruthy();
      expect(typeof imported.card.data?.name).toBe('string');
      expect((imported.card.data?.name ?? '').length).toBeGreaterThan(0);
      expect(imported.image).toBeTruthy();
    }
  });

  it('detects spec v2 vs v3 correctly', async () => {
    const v2 = await importCardBytes(
      new Uint8Array(readFileSync(resolve('demo', 'main_alaric-valheirn-12d5d366_spec_v2.png'))),
      'a.png',
    );
    expect(v2.spec).toBe(CARD_V2);
    const v3 = await importCardBytes(new Uint8Array(readFileSync(resolve('demo', 'Nina.png'))), 'n.png');
    expect(v3.spec).toBe(CARD_V3);
  });

  it('exports PNG and re-imports with the same name and spec', async () => {
    const src = await importCardBytes(new Uint8Array(readFileSync(resolve('demo', 'Veronica.png'))), 'v.png');
    const enabled: Record<string, boolean> = {};
    for (const k of Object.keys(src.card.data ?? {})) enabled[k] = true;
    const bytes = await buildPngBytes(src.card, enabled, src.image);
    const re = await importCardBytes(bytes, 'roundtrip.png');
    expect(re.card.data?.name).toBe(src.card.data?.name);
    expect(re.spec).toBe(src.spec);
    expect(re.image?.width).toBe(src.image?.width);
    expect(re.image?.height).toBe(src.image?.height);
  });

  it('omits disabled fields and preserves unknown fields', () => {
    const card = {
      spec: CARD_V2,
      spec_version: '2.0',
      data: { name: 'X', description: 'd', personality: '', extensions: { chub: { foo: 1 } }, custom_field: 'keep-me' },
    } as any;
    const enabled: Record<string, boolean> = { name: false, description: true, personality: true };
    const out = buildExportCard(card, enabled) as any;
    expect(out.data.name).toBeUndefined();
    expect(out.data.description).toBe('d');
    expect(out.data.extensions.chub).toEqual({ foo: 1 });
    expect(out.data.custom_field).toBe('keep-me');
  });
});
