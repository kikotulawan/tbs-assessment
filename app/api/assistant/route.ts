import { z } from "zod";

import { buildMeridianContext } from "@/lib/assistant/context";
import { SYSTEM_PROMPT } from "@/lib/assistant/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
	question: z
		.string()
		.trim()
		.min(1, "Question is required.")
		.max(2000, "Question is too long."),
});

export async function POST(request: Request) {
	try {
		/*
		 * ---------------------------------------------------------
		 * Validate browser request
		 * ---------------------------------------------------------
		 */
		const body = requestSchema.parse(
			await request.json(),
		);

		/*
		 * ---------------------------------------------------------
		 * Server-only OpenRouter credentials
		 * ---------------------------------------------------------
		 */
		const apiKey = process.env.OPENROUTER_API_KEY;

		if (!apiKey) {
			console.error(
				"OPENROUTER_API_KEY is not configured.",
			);

			return Response.json(
				{
					error:
						"OpenRouter API key is not configured.",
				},
				{ status: 500 },
			);
		}

		const model =
			process.env.OPENROUTER_MODEL ||
			"openai/gpt-5.6-luna";

		/*
		 * ---------------------------------------------------------
		 * Retrieve Meridian data
		 * ---------------------------------------------------------
		 */
		const meridianContext =
			await buildMeridianContext(body.question);

		/*
		 * ---------------------------------------------------------
		 * OpenRouter request
		 *
		 * IMPORTANT:
		 * The API key NEVER reaches the browser.
		 * ---------------------------------------------------------
		 */
		const openRouterResponse = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",

				headers: {
					"Content-Type": "application/json",

					/*
					 * This is the critical authentication header.
					 */
					Authorization: `Bearer ${apiKey}`,

					/*
					 * Optional OpenRouter metadata.
					 */
					"HTTP-Referer":
						process.env.APP_URL ||
						"http://localhost:3000",

					"X-Title":
						process.env.NEXT_PUBLIC_APP_NAME ||
						"Meridian Staffing Assistant",
				},

				body: JSON.stringify({
					model,

					messages: [
						{
							role: "system",
							content: SYSTEM_PROMPT,
						},
						{
							role: "user",
							content: `
User question:

${body.question}

Meridian data:

${JSON.stringify(meridianContext, null, 2)}
`,
						},
					],

					temperature: 0.1,

					/*
					 * We want a streaming response.
					 */
					stream: true,
				}),
			},
		);

		/*
		 * ---------------------------------------------------------
		 * Handle OpenRouter errors
		 * ---------------------------------------------------------
		 */
		if (!openRouterResponse.ok) {
			const errorText =
				await openRouterResponse.text();

			console.error("OpenRouter error:", {
				status: openRouterResponse.status,
				body: errorText,
			});

			return Response.json(
				{
					error: `OpenRouter request failed (${openRouterResponse.status}).`,
					details:
						process.env.NODE_ENV === "development"
							? errorText
							: undefined,
				},
				{
					status: openRouterResponse.status,
				},
			);
		}

		/*
		 * ---------------------------------------------------------
		 * Return OpenRouter's streaming response
		 * ---------------------------------------------------------
		 */
		if (!openRouterResponse.body) {
			return Response.json(
				{
					error:
						"OpenRouter returned an empty response.",
				},
				{ status: 502 },
			);
		}

		/*
		 * OpenRouter returns Server-Sent Events.
		 *
		 * The browser's existing reader expects plain text,
		 * so transform:
		 *
		 * data: {"choices":[{"delta":{"content":"Hello"}}]}
		 *
		 * into:
		 *
		 * Hello
		 */
		const decoder = new TextDecoder();
		const encoder = new TextEncoder();

		const transformedStream = new ReadableStream({
			async start(controller) {
				const reader =
					openRouterResponse.body!.getReader();

				let buffer = "";

				try {
					while (true) {
						const { done, value } = await reader.read();

						if (done) {
							break;
						}

						buffer += decoder.decode(value, {
							stream: true,
						});

						const lines = buffer.split("\n");

						/*
						 * Keep the last incomplete line for the next chunk.
						 */
						buffer = lines.pop() || "";

						for (const line of lines) {
							const trimmed = line.trim();

							if (!trimmed) {
								continue;
							}

							if (trimmed === "data: [DONE]") {
								continue;
							}

							if (!trimmed.startsWith("data:")) {
								continue;
							}

							const jsonText = trimmed.slice(5).trim();

							if (!jsonText) {
								continue;
							}

							try {
								const chunk = JSON.parse(jsonText);

								const content =
									chunk?.choices?.[0]?.delta?.content;

								if (
									typeof content === "string" &&
									content
								) {
									controller.enqueue(
										encoder.encode(content),
									);
								}
							} catch (parseError) {
								/*
								 * Don't kill the entire stream because of
								 * an incomplete/malformed SSE chunk.
								 */
								console.warn(
									"Unable to parse OpenRouter stream chunk:",
									parseError,
								);
							}
						}
					}

					controller.close();
				} catch (error) {
					console.error(
						"OpenRouter streaming error:",
						error,
					);

					controller.error(error);
				} finally {
					reader.releaseLock();
				}
			},
		});

		return new Response(transformedStream, {
			status: 200,

			headers: {
				"Content-Type": "text/plain; charset=utf-8",

				"Cache-Control": "no-cache, no-transform",

				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Assistant API error:", error);

		if (error instanceof z.ZodError) {
			return Response.json(
				{
					error: "Please provide a valid question.",
				},
				{ status: 400 },
			);
		}

		return Response.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Unable to process the request.",
			},
			{ status: 500 },
		);
	}
}
