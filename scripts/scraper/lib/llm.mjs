/**
 * Minimal OpenAI-compatible chat-completions caller (native fetch, no SDK).
 *
 * Works with OpenAI, OpenRouter, or any OpenAI-compatible endpoint via
 * LLM_BASE_URL. Credentials come from env (see loadLLMEnv in config.mjs).
 * Temperature is fixed at 0 for deterministic extraction.
 */

export async function callLLM({ baseUrl, apiKey, model, maxTokens = 2000 }, prompt, { timeoutMs = 120000 } = {}) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[llm] HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("[llm] empty response content");
  }
  return text;
}

/** Strip markdown fences the model may add despite instructions. */
export function cleanJsonResponse(text) {
  let t = String(text ?? "").trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) t = fence[1].trim();
  return t;
}
