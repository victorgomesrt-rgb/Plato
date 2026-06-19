import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Auto-translate a menu item EN → ES draft via the Claude API (architecture §28).
// Keeps dish proper names, casual menu tone. Always a DRAFT for human review — the
// editor fills the ES fields; nothing is auto-published.
export async function translateToEs(
  name: string,
  description: string
): Promise<{ nameEs: string; descriptionEs: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Auto-translate isn't configured (no ANTHROPIC_API_KEY).");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system:
      "You translate Aruban restaurant menu items from English to Spanish. Keep proper dish names unchanged (e.g. Keshi Yena, Pan Bati, Pastechi, Bolo di Coco). Use a warm, casual menu tone. Translate only what should change. If an input field is empty, return an empty string for it.",
    messages: [
      {
        role: "user",
        content: `Name (EN): ${name || "(empty)"}\nDescription (EN): ${description || "(empty)"}`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            name_es: { type: "string" },
            description_es: { type: "string" },
          },
          required: ["name_es", "description_es"],
          additionalProperties: false,
        },
      },
    },
  });

  const text = response.content.find((b) => b.type === "text");
  const parsed = JSON.parse(text && "text" in text ? text.text : "{}") as {
    name_es?: string;
    description_es?: string;
  };
  return { nameEs: parsed.name_es ?? "", descriptionEs: parsed.description_es ?? "" };
}
