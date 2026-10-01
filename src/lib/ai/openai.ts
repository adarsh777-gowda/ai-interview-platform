import OpenAI, { APIError } from "openai";
import { buildEvaluationPrompt, PROMPT_VERSION } from "./evaluationPrompt";
import { evaluationFeedbackSchema, type EvaluationFeedback } from "./schemas";

type CreateChatCompletionParams = Parameters<OpenAI["chat"]["completions"]["create"]>[0];
type CreateChatCompletionResponse = Extract<
  Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>,
  { choices: unknown }
>;

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

export function extractJson(content: string): unknown {
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

async function createCompletion(
  model: string,
  messages: CreateChatCompletionParams["messages"]
): Promise<CreateChatCompletionResponse> {
  try {
    return await getOpenAIClient().chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages,
    });
  } catch (error) {
    if (isUnsupportedJsonModeError(error)) {
      // Free providers may reject `response_format`; retry without it.
      return await getOpenAIClient().chat.completions.create({
        model,
        temperature: 0.3,
        messages,
      });
    }
    throw toEvaluationError(error);
  }
}

export function repairFeedback(raw: unknown): EvaluationFeedback {
  // Salvage a mostly-good model response that fails strict Zod validation,
  // filling missing fields with safe defaults instead of failing the turn.
  const base =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const scoresRaw =
    typeof base.scores === "object" && base.scores !== null
      ? (base.scores as Record<string, unknown>)
      : {};

  const clampScore = (value: unknown, fallback: number) => {
    const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
    return Math.min(5, Math.max(0, Math.round(n)));
  };
  const str = (value: unknown) => (typeof value === "string" ? value : "").trim();
  const strArray = (value: unknown) =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

  const scores = {
    clarity: clampScore(scoresRaw.clarity, 0),
    structure: clampScore(scoresRaw.structure, 0),
    correctness: clampScore(scoresRaw.correctness, 0),
    depth: clampScore(scoresRaw.depth, 0),
  };

  const strengths = strArray(base.strengths);
  const gaps = strArray(base.gaps);
  const followUpQuestions = strArray(base.followUpQuestions);
  const suggestedAnswer = str(base.suggestedAnswer);
  const overallScore = clampScore(
    base.overallScore,
    Math.round((scores.clarity + scores.structure + scores.correctness + scores.depth) / 4)
  );
  const summary = str(base.summary);

  return {
    overallScore,
    scores,
    strengths:
      strengths.length > 0 ? strengths.slice(0, 5) : ["No specific strengths were noted."],
    gaps: gaps.length > 0 ? gaps.slice(0, 5) : ["No specific gaps were noted."],
    suggestedAnswer:
      suggestedAnswer.length > 0
        ? suggestedAnswer
        : "Review the strengths and gaps above and expand your answer with more structure and detail.",
    followUpQuestions: followUpQuestions.slice(0, 3),
    summary:
      summary.length > 0
        ? summary
        : `The answer scored ${overallScore}/5 overall. See the strengths and gaps above for improvement areas.`,
  };
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

  let response = await createCompletion(model, messages);
  const parseFeedback = (): { ok: true; data: EvaluationFeedback } | { ok: false; issues: string[] } => {
    const content = response.choices[0]?.message?.content;
    if (!content) return { ok: false, issues: ["Empty response from AI provider"] };
    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch {
      return { ok: false, issues: ["AI response was not valid JSON"] };
    }
    const result = evaluationFeedbackSchema.safeParse(parsed);
    if (result.success) return { ok: true, data: result.data };
    return { ok: false, issues: result.error.issues.map((issue) => issue.message) };
  };

  let feedbackResult = parseFeedback();

  if (!feedbackResult.ok) {
    // One corrective retry: tell the model exactly what was invalid.
    const assistantContent = response.choices[0]?.message?.content ?? "";
    const correctionMessages: CreateChatCompletionParams["messages"] = [
      ...messages,
      { role: "assistant", content: assistantContent },
      {
        role: "user",
        content: `Your previous response failed validation:\n${JSON.stringify(feedbackResult.issues)}\n\nReturn ONLY valid JSON matching the requested schema exactly.`,
      },
    ];
    const retryResponse = await createCompletion(model, correctionMessages);
    response = retryResponse;
    feedbackResult = parseFeedback();
  }

  let feedback: EvaluationFeedback;
  if (feedbackResult.ok) {
    feedback = feedbackResult.data;
  } else {
    // Last resort: salvage whatever the model returned rather than failing the turn.
    const content = response.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = extractJson(content);
    } catch {
      parsed = {};
    }
    feedback = repairFeedback(parsed);
  }

  const latencyMs = Date.now() - started;

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
