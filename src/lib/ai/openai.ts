import OpenAI, { APIError } from "openai";
import { buildEvaluationPrompt, PROMPT_VERSION } from "./evaluationPrompt";
import { evaluationFeedbackSchema, type EvaluationFeedback } from "./schemas";

type CreateChatCompletionResponse = Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
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
        "OpenAI API credits exhausted — add credits at https://platform.openai.com/settings/organization/billing/.",
        429
      );
    }

    if (error.status === 401 || error.status === 403) {
      return new EvaluationError(
        "OpenAI API key is invalid or expired — check your OPENAI_API_KEY environment variable.",
        500
      );
    }

    if (error.status !== undefined && error.status >= 500) {
      return new EvaluationError(
        `OpenAI API error (status: ${error.status}) — please try again later.`,
        502
      );
    }

    return new EvaluationError(message || "OpenAI request failed", error.status ?? 500);
  }

  const message = error instanceof Error ? error.message : "Evaluation failed";
  return new EvaluationError(message);
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

  let response: CreateChatCompletionResponse;
  try {
    response = await getOpenAIClient().chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a strict interview evaluator. Respond only with JSON matching the requested schema.",
      },
        { role: "user", content: prompt },
      ],
    });
  } catch (error) {
    throw toEvaluationError(error);
  }

  const latencyMs = Date.now() - started;
  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
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
