"use client";

import { Clock, Loader2, Send, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StructureCoach } from "./structure-coach";
import type { Question } from "./types";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuestionPanel({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  selectedQuestion,
  answer,
  onAnswerChange,
  onSubmit,
  loading,
  error,
  elapsed,
  showHints,
  onToggleHints,
  answeredIds,
}: {
  questions: Question[];
  selectedQuestionId: string;
  onSelectQuestion: (id: string) => void;
  selectedQuestion?: Question;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  elapsed: number;
  showHints: boolean;
  onToggleHints: () => void;
  answeredIds: Set<string>;
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Answer a question
        </CardTitle>
        <CardDescription>
          Pick a question, structure your answer, and submit for instant AI feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => {
            const done = answeredIds.has(q.id);
            const active = q.id === selectedQuestionId;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuestion(q.id)}
                className={`grid h-9 w-9 place-items-center rounded-lg border-2 text-sm font-semibold transition-all ${
                  active
                    ? "scale-110 border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                title={q.prompt}
              >
                {done && !active ? "✓" : index + 1}
              </button>
            );
          })}
        </div>

        {selectedQuestion && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{selectedQuestion.type}</Badge>
              <Badge variant="secondary" className="capitalize">
                {selectedQuestion.topic}
              </Badge>
              {selectedQuestion.difficulty && <Badge variant="purple">{selectedQuestion.difficulty}</Badge>}
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {formatClock(elapsed)}
              </span>
            </div>
            <p className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 text-sm font-medium dark:from-blue-950/20 dark:to-purple-950/20">
              {selectedQuestion.prompt}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="answer">Your answer</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Structure behavioral answers with STAR: Situation, Task, Action, Result."
              required
              minLength={20}
              className="min-h-[160px]"
            />
          </div>

          {selectedQuestion && (
            <StructureCoach
              questionType={selectedQuestion.type}
              answer={answer}
              showHints={showHints}
              onToggleHints={onToggleHints}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={loading || answer.length < 20}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Evaluating with AI...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit for evaluation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
