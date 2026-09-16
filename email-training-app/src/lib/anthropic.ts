import "server-only";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_MAX_TOKENS = 1024;

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface CallOptions {
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}

export class AnthropicApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "AnthropicApiError";
  }
}

/**
 * Ruft die Anthropic Messages API serverseitig auf. Der API-Key wird
 * ausschliesslich aus einer Server-Umgebungsvariable gelesen und verlaesst
 * diesen Prozess nie in Richtung Browser.
 */
export async function callClaude({
  system,
  messages,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = 0.7,
}: CallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicApiError("ANTHROPIC_API_KEY ist nicht konfiguriert.");
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error("Anthropic API error", response.status, bodyText);
    throw new AnthropicApiError(
      "Die Anfrage an die KI ist fehlgeschlagen.",
      response.status
    );
  }

  const data = await response.json();

  const text = (data.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new AnthropicApiError("Die KI hat keine Antwort geliefert.");
  }

  return text;
}
