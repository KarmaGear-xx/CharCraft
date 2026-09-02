// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

function makeMockApi() {
  return {
    openCard: async () => null,
    saveFile: async () => null,
    aiChat: async () => '',
    getConfig: async () => ({ lang: 'zh', aiSettings: { baseUrl: '', apiKey: '', model: '' } }),
    setConfig: async () => {},
    getDraft: async () => null,
    setDraft: async () => {},
  };
}

describe('app render', () => {
  it('mounts without throwing and shows title + empty state', async () => {
    (window as unknown as { api: unknown }).api = makeMockApi();

    const { default: App } = await import('../src/renderer/App');
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);

    let root: Root;
    await act(async () => {
      root = createRoot(container);
      root.render(<App />);
    });

    const text = container.textContent ?? '';
    expect(text).toContain('CharCraft');
    expect(text).toContain('尚未载入卡片');

    await act(async () => {
      root!.unmount();
    });
  });
});
