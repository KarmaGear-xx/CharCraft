import type { AISettings, AIMessage } from '../shared/types';

// Runs in the main process (Node.js), so there is no browser CORS restriction.
export async function chat(
  settings: AISettings,
  messages: AIMessage[],
  opts: { json?: boolean },
): Promise<string> {
  const { baseUrl, apiKey, model } = settings;
  if (!baseUrl || !apiKey || !model) {
    throw new Error('AI 设置不完整:请填写接口地址、API Key 和模型名。');
  }

  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const body: Record<string, unknown> = { model, messages, temperature: 0.8 };
  if (opts.json) body.response_format = { type: 'json_object' };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('AI 请求失败 (' + res.status + '): ' + text.slice(0, 300));
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI 返回内容为空。');
  return content;
}

// Fetch available model ids from an OpenAI-compatible /models endpoint
// (OpenRouter / DeepSeek / OpenAI all return { data: [{ id, ... }] }).
export async function listModels(settings: AISettings): Promise<string[]> {
  const { baseUrl, apiKey } = settings;
  if (!baseUrl || !apiKey) throw new Error('AI 设置不完整:请填写接口地址和 API Key。');
  const url = baseUrl.replace(/\/+$/, '') + '/models';
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + apiKey } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('获取模型列表失败 (' + res.status + '): ' + text.slice(0, 200));
  }
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string' && !!id);
  if (ids.length === 0) throw new Error('服务端未返回可用模型列表。');
  return ids;
}
