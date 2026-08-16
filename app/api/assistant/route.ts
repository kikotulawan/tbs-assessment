import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { buildMeridianContext } from "@/lib/assistant/context";
import { SYSTEM_PROMPT } from "@/lib/assistant/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    const context = await buildMeridianContext(body.question);

    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelId = process.env.OPENROUTER_MODEL || "openai/gpt-5.6-luna";

    if (!apiKey) {
      return Response.json({ error: "OpenRouter server configuration is missing." }, { status: 500 });
    }

    const openrouter = createOpenAICompatible({
      name: "openrouter",
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });

    const result = streamText({
      model: openrouter(modelId),
      system: SYSTEM_PROMPT,
      prompt: `
User question:
${body.question}

Meridian context:
${JSON.stringify(context, null, 2)}
`,
      temperature: 0.1,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Assistant request failed:", error);

    const message =
      error instanceof z.ZodError
        ? "Please provide a valid staffing question."
        : error instanceof Error
          ? error.message
          : "Unable to process the request.";

    return Response.json({ error: message }, { status: 400 });
  }
}