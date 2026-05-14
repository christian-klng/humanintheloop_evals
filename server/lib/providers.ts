export type ProviderType = "openrouter" | "cortecs";

export interface ProviderModel {
  id: string;
  name: string;
}

const BASE_URLS: Record<ProviderType, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  cortecs: "https://api.cortecs.ai/v1",
};

export function getProviderBaseUrl(provider: ProviderType): string {
  return BASE_URLS[provider];
}

export async function fetchModels(provider: ProviderType, apiKey: string): Promise<ProviderModel[]> {
  const baseUrl = getProviderBaseUrl(provider);
  const res = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Provider API error (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const data: unknown[] = json.data || [];

  return data
    .map((m: any) => ({
      id: m.id as string,
      name: (m.name || m.id) as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function testConnection(provider: ProviderType, apiKey: string): Promise<boolean> {
  try {
    await fetchModels(provider, apiKey);
    return true;
  } catch {
    return false;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChatCompletion(
  provider: ProviderType,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<Response> {
  const baseUrl = getProviderBaseUrl(provider);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Provider API error (${res.status}): ${body.slice(0, 200)}`);
  }

  return res;
}
