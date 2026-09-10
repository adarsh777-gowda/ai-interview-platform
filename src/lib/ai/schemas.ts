import { z } from "zod";

export const evaluationScoresSchema = z.object({
  clarity: z.number().min(0).max(5),
  structure: z.number().min(0).max(5),
  correctness: z.number().min(0).max(5),
  depth: z.number().min(0).max(5),
});

export const evaluationFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(5),
  scores: evaluationScoresSchema,
  strengths: z.array(z.string()).min(1),
  gaps: z.array(z.string()).min(1),
  suggestedAnswer: z.string().min(1),
  followUpQuestions: z.array(z.string()),
  summary: z.string().min(1),
});

export type EvaluationFeedback = z.infer<typeof evaluationFeedbackSchema>;

export const createSessionSchema = z.object({
  role: z.string().min(2).max(100),
  level: z.enum(["JUNIOR", "MID", "SENIOR"]),
  topics: z.array(z.string().min(1)).min(1).max(5),
});

export const submitTurnSchema = z.object({
  // Question IDs may be Prisma cuids OR deterministic seed IDs (e.g. `seed-javascript-TECHNICAL`),
  // so don't enforce the cuid format here. Existence is verified against the DB in the route.
  questionId: z.string().min(1).max(100),
  userAnswer: z.string().min(20).max(5000),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
