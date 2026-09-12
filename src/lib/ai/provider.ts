// AI Provider abstraction — LifeOS never hard-codes a specific AI vendor.
//
// Configure via environment variables:
//   AI_API_KEY   - API key for your provider (OpenAI-compatible chat completions API)
//   AI_MODEL     - model name, e.g. "gpt-4o-mini", "claude-3-5-sonnet-latest"
//   AI_BASE_URL  - API base URL, e.g. "https://api.openai.com/v1"
//
// When these are not set, LifeOS falls back to a deterministic, fully
// functional rule-based engine (see src/lib/ai/*.ts) so every AI feature in
// the product works out of the box with no external calls. This keeps the
// provider swappable and the frontend/backend contract identical either way.

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export function getAIConfig(): AIProviderConfig {
  return {
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  };
}

export function isAIProviderConfigured(): boolean {
  return !!getAIConfig().apiKey;
}

/**
 * Calls an OpenAI-compatible chat completion endpoint. Returns the raw text
 * response. Throws on network/HTTP failure so callers can fall back to the
 * rule-based engine.
 */
export async function callAIProvider(messages: AIChatMessage[], opts: { jsonMode?: boolean; temperature?: number } = {}): Promise<string> {
  const config = getAIConfig();
  if (!config.apiKey) {
    throw new Error("AI provider not configured");
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: opts.temperature ?? 0.4,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`AI provider error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
