export const PROMPT_VERSION = "v1.0.0";

export function buildEvaluationPrompt(params: {
  role: string;
  level: string;
  topic: string;
  questionType: string;
  question: string;
  userAnswer: string;
}) {
  return `You are an expert technical interviewer evaluating a candidate's answer.

Role: ${params.role}
Level: ${params.level}
Topic: ${params.topic}
Question type: ${params.questionType}

Question:
${params.question}

Candidate answer:
${params.userAnswer}

Evaluate using this rubric (0-5 each):
- clarity: how clear and easy to follow
- structure: logical flow (e.g. STAR for behavioral)
- correctness: factual/technical accuracy
- depth: demonstrates real understanding beyond surface level

Return ONLY valid JSON with this shape:
{
  "overallScore": number,
  "scores": { "clarity": number, "structure": number, "correctness": number, "depth": number },
  "strengths": string[],
  "gaps": string[],
  "suggestedAnswer": string,
  "followUpQuestions": string[],
  "summary": string
}

Be constructive, specific, and interview-realistic.`;
}
