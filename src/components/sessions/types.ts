export type Question = {
  id: string;
  prompt: string;
  topic: string;
  type: string;
  difficulty?: string;
};

export type Turn = {
  id: string;
  questionId: string;
  userAnswer: string;
  aiFeedbackJson: unknown;
  scoresJson: Record<string, number> | null;
  question: { prompt: string; topic: string; type: string };
};
