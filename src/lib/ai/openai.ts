import OpenAI, { APIError } from "openai";
import { buildEvaluationPrompt, PROMPT_VERSION } from "./evaluationPrompt";
import { evaluationFeedbackSchema, type EvaluationFeedback } from "./schemas";

type CreateChatCompletionParams = Parameters<OpenAI["chat"]["completions"]["create"]>[0];
type CreateChatCompletionResponse = Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
    // Point at any OpenAI-compatible provider, e.g. Groq, OpenRouter, Together, Cerebras,
    // or Google's Gemini OpenAI-compatible endpoint.
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export class EvaluationError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = "EvaluationError";
    this.status = status;
  }
}

function toEvaluationError(error: unknown): EvaluationError {
  if (error instanceof EvaluationError) return error;

  if (error instanceof APIError) {
    const code = (error.error as { code?: string } | undefined)?.code;
    const message = error.message ?? "";

    // OpenAI returns 429 + code "insufficient_quota" when the account has no credits/billing balance.

    if (error.status === 429 && (code === "insufficient_quota" || /credit|quota|billing/i.test(message))) {
      return new EvaluationError(
        "AI provider quota/credits exceeded — add credits (or wait for the free tier limit to reset).",
        429
      );
    }

    if (error.status === 401 || error.status === 403) {
      return new EvaluationError(
        "AI provider API key is invalid or expired — check your OPENAI_API_KEY environment variable.",
        500
      );
    }

    if (error.status !== undefined && error.status >= 500) {
      return new EvaluationError(
        `AI provider error (status: ${error.status}) — please try again later.`,
        502
      );
    }

    return new EvaluationError(message || "OpenAI request failed", error.status ?? 500);
  }

  const message = error instanceof Error ? error.message : "Evaluation failed";
  return new EvaluationError(message);
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to extracting the first JSON object/array from prose or markdown fences.
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : trimmed;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("OpenAI returned invalid JSON");
  }
}

function isUnsupportedJsonModeError(error: unknown): boolean {
  // Some free providers/models reject the `response_format` parameter (400/422).
  // In that case we retry without it — the prompt already demands strict JSON.
  if (!(error instanceof APIError)) return false;
  const message = error.message ?? "";
  return (
    (error.status === 400 || error.status === 422) &&
    /response_format|response format|json_object|not supported|unsupported|invalid parameter/i.test(message)
  );
}

export async function evaluateAnswer(params: {
  role: string;
  level: string;
  topic: string;
  questionType: string;
  question: string;
  userAnswer: string;
}): Promise<{
  feedback: EvaluationFeedback;
  modelUsed: string;
  promptVersion: string;
  tokenUsage: { prompt: number; completion: number; total: number };
  latencyMs: number;
}> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = buildEvaluationPrompt(params);
  const started = Date.now();

  const messages: CreateChatCompletionParams["messages"] = [
    {
      role: "system",
      content:
        "You are a strict interview evaluator. Respond only with JSON matching the requested schema.",
    },
    { role: "user", content: prompt },
  ];

  let response: CreateChatCompletionResponse;
  try {
    response = await getOpenAIClient().chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages,
    });
  } catch (error) {
    // Free providers (e.g. some OpenRouter models) may reject `response_format`.
    // Retry without it — the system prompt still requires strict JSON.
    if (isUnsupportedJsonModeError(error)) {
      response = await getOpenAIClient().chat.completions.create({
        model,
        temperature: 0.3,
        messages,
      });
    } else {
      throw toEvaluationError(error);
    }
  }

  const latencyMs = Date.now() - started;
  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const feedback = evaluationFeedbackSchema.parse(parsed);

  return {
    feedback,
    modelUsed: model,
    promptVersion: PROMPT_VERSION,
    tokenUsage: {
      prompt: response.usage?.prompt_tokens ?? 0,
      completion: response.usage?.completion_tokens ?? 0,
      total: response.usage?.total_tokens ?? 0,
    },
    latencyMs,
  };
}
