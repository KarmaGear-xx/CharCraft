import { describe, it, expect, vi, afterEach } from 'vitest';
import { chat, listModels } from '../src/main/ai';

function settings(overrides: Partial<{ baseUrl: string; apiKey: string; model: string }> = {}) {
  return {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    model: 'qwen2.5:14b',
    ...overrides,
  };
}

describe('AI client (main process)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('omits the Authorization header when apiKey is empty (local server)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hi' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const content = await chat(settings(), [{ role: 'user', content: 'hello' }], {});

    expect(content).toBe('hi');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:11434/v1/chat/completions');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('sends the Authorization header when apiKey is present', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hi' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await chat(settings({ apiKey: 'sk-test' }), [{ role: 'user', content: 'hello' }], {});

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer sk-test');
  });

  it('requires baseUrl and model but not apiKey', async () => {
    await expect(chat(settings({ model: '' }), [], {})).rejects.toThrow(/模型名/);
    await expect(chat(settings({ baseUrl: '' }), [], {})).rejects.toThrow(/接口地址/);
  });

  it('listModels omits the Authorization header when apiKey is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'qwen2.5:14b' }, { id: 'llama3.1' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const models = await listModels(settings());

    expect(models).toEqual(['qwen2.5:14b', 'llama3.1']);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:11434/v1/models');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('listModels requires baseUrl only', async () => {
    await expect(listModels(settings({ baseUrl: '' }))).rejects.toThrow(/接口地址/);
  });
});
