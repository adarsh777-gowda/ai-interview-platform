"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { averageScore } from "@/lib/utils";
import type { EvaluationFeedback } from "@/lib/ai/schemas";

type Question = {
  id: string;
  prompt: string;
  topic: string;
  type: string;
};

type Turn = {
  id: string;
  questionId: string;
  userAnswer: string;
  aiFeedbackJson: unknown;
  scoresJson: Record<string, number> | null;
  question: { prompt: string; topic: string; type: string };
};

export function SessionInterview({
  sessionId,
  questions,
  turns,
}: {
  sessionId: string;
  questions: Question[];
  turns: Turn[];
}) {
  const answeredIds = useMemo(() => new Set(turns.map((t) => t.questionId)), [turns]);
  const nextQuestion = questions.find((q) => !answeredIds.has(q.id)) ?? questions[0];

  const [selectedQuestionId, setSelectedQuestionId] = useState(nextQuestion?.id ?? "");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTurns, setLocalTurns] = useState(turns);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  function formatError(error: unknown): string {
    if (typeof error === "string") return error;
    if (Array.isArray(error)) return error.map(formatError).join(", ");
    if (typeof error === "object" && error) {
      const o = error as { formErrors?: unknown; fieldErrors?: unknown; message?: unknown };
      if (Array.isArray(o.formErrors)) return o.formErrors.map(String).join(", ");
      if (o.message) return String(o.message);
    }
    return "Failed to submit answer";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuestionId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedQuestionId, userAnswer: answer }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(formatError(data.error) || "Failed to submit answer");
      }

      setLocalTurns((prev) => [
        ...prev,
        {
          id: data.id,
          questionId: data.questionId,
          userAnswer: data.userAnswer,
          aiFeedbackJson: data.aiFeedbackJson,
          scoresJson: data.scoresJson,
          question: {
            prompt: data.question.prompt,
            topic: data.question.topic,
            type: data.question.type,
          },
        },
      ]);
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Answer a question</CardTitle>
          <CardDescription>Write at least 20 characters. AI feedback appears after submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  [{q.type}] {q.topic} - {q.prompt.slice(0, 60)}...
                </option>
              ))}
            </select>
          </div>

          {selectedQuestion && (
            <div className="rounded-md bg-muted p-4 text-sm">{selectedQuestion.prompt}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answer">Your answer</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Structure behavioral answers with STAR: Situation, Task, Action, Result."
                required
                minLength={20}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || answer.length < 20}>
              {loading ? "Evaluating with AI..." : "Submit for evaluation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Session feedback</h2>
        {localTurns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No answers yet. Submit your first response to see AI feedback.
            </CardContent>
          </Card>
        ) : (
          localTurns.map((turn) => {
            const feedback = turn.aiFeedbackJson as EvaluationFeedback | null;
            const avg = averageScore(turn.scoresJson);

            return (
              <Card key={turn.id}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">{turn.question.topic}</CardTitle>
                  <CardDescription>
                    {turn.question.type}
                    {avg !== null ? ` - Score: ${avg.toFixed(1)} / 5` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Your answer</p>
                    <p className="text-muted-foreground">{turn.userAnswer}</p>
                  </div>

                  {feedback && (
                    <>
                      <div>
                        <p className="font-medium">Summary</p>
                        <p className="text-muted-foreground">{feedback.summary}</p>
                      </div>
                      <div>
                        <p className="font-medium">Strengths</p>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          {feedback.strengths.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Gaps</p>
                        <ul className="list-disc pl-5 text-muted-foreground">
                          {feedback.gaps.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Suggested answer</p>
                        <p className="text-muted-foreground">{feedback.suggestedAnswer}</p>
                      </div>
                      {feedback.followUpQuestions?.length > 0 && (
                        <div>
                          <p className="font-medium">Follow-up questions</p>
                          <ul className="list-disc pl-5 text-muted-foreground">
                            {feedback.followUpQuestions.map((q) => (
                              <li key={q}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

