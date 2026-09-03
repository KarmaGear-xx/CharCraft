import type { AISettings, AIMessage } from '../shared/types';

// Runs in the main process (Node.js), so there is no browser CORS restriction.
export async function chat(
  settings: AISettings,
  messages: AIMessage[],
  opts: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const { baseUrl, apiKey, model } = settings;
  if (!baseUrl || !model) {
    throw new Error('AI 设置不完整:请填写接口地址和模型名(API Key 可留空)。');
  }

  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const body: Record<string, unknown> = { model, messages, temperature: 0.8 };
  if (opts.maxTokens && opts.maxTokens > 0) body.max_tokens = opts.maxTokens;
  // Some local servers (e.g. LM Studio with certain models) reject
  // `response_format: {type:'json_object'}` and require `json_schema` instead;
  // letting the user turn it off keeps those endpoints usable (the prompt already
  // instructs JSON output and the renderer parses it tolerantly).
  if (opts.json && settings.responseFormat !== 'off') {
    body.response_format = { type: 'json_object' };
  }

  // Local OpenAI-compatible servers (Ollama/LM Studio/etc.) do not require a
  // key, so omit the Authorization header when the key is blank.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;

  const res = await fetch(url, {
    method: 'POST',
    headers,
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
  if (!baseUrl) throw new Error('AI 设置不完整:请填写接口地址(API Key 可留空)。');
  const url = baseUrl.replace(/\/+$/, '') + '/models';
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('获取模型列表失败 (' + res.status + '): ' + text.slice(0, 200));
  }
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === 'string' && !!id);
  if (ids.length === 0) throw new Error('服务端未返回可用模型列表。');
  return ids;
}
