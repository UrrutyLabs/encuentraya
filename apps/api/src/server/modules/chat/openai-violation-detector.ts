import OpenAI from "openai";
import { logger } from "@infra/utils/logger";
import { containsContactInfo } from "./contact-info-detector";

const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 5_000;

const SYSTEM_PROMPT = `You are a moderator for a marketplace chat. Determine if the user message contains or attempts to share:
- Phone numbers (any format: local, international, with or without spaces/dashes)
- Email addresses
- Physical addresses or links to share contact details (e.g. wa.me, t.me)
- Phrases that clearly suggest exchanging contact info off-platform (e.g. "llamame al", "mi número", "escribime al")

Reply ONLY with a JSON object, no other text: {"containsViolation": true or false, "reason": "brief reason or empty string"}
- containsViolation: true only if the message clearly contains or solicits contact info as above.
- reason: one short phrase if violation, else "".
Do not flag general words like "teléfono" or "contacto" when used in a neutral context (e.g. "prefiero contacto por la app").`;

/**
 * Calls OpenAI Chat Completions to classify the message. Returns true if the model
 * says the message contains a violation. On any API/timeout/parse error, returns false
 * and falls back to regex (caller will use regex result).
 */
async function checkWithOpenAI(text: string): Promise<boolean | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const openai = new OpenAI({
    apiKey,
    timeout: OPENAI_TIMEOUT_MS,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, 4000) },
      ],
      max_tokens: 100,
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      containsViolation?: boolean;
      reason?: string;
    };
    return parsed.containsViolation === true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(
      { err: message, textPreview: text.slice(0, 80) },
      "OpenAI chat violation check failed, using regex fallback"
    );
    return null;
  }
}

/**
 * Returns true if the message appears to contain contact info or solicit off-platform contact.
 * When OPENAI_API_KEY is set, uses GPT to classify; on API failure, timeout, or invalid response
 * falls back to regex. When OPENAI_API_KEY is not set, uses regex only.
 */
export async function containsContactInfoAsync(text: string): Promise<boolean> {
  if (!text || typeof text !== "string") return false;

  const openaiResult = await checkWithOpenAI(text);
  if (openaiResult !== null) return openaiResult;

  // Fallback to regex when OpenAI is unavailable, failed, or returned no usable result
  return containsContactInfo(text);
}
