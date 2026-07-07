import OpenAI from "openai";
import { buildEvaluationPrompt, PROMPT_VERSION } from "./evaluationPrompt";
import { evaluationFeedbackSchema, type EvaluationFeedback } from "./schemas";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
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

  const response = await getOpenAIClient().chat.completions.create({
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
