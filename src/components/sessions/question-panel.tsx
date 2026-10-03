"use client";

import { useState } from "react";
import { AlertCircle, Clock, Keyboard, Loader2, Mic, Send, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceAnswerPanel } from "@/components/voice/voice-answer-panel";
import { StructureCoach } from "./structure-coach";
import type { Question } from "./types";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type AnswerMode = "type" | "voice";

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
  const [mode, setMode] = useState<AnswerMode>("type");

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
        {questions.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold">No questions available</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This session has no question bank loaded for its topics. Run
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                npm run db:seed
              </code>
              to load the practice bank, then start a new session.
            </p>
          </div>
        ) : (
          <>
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

            {selectedQuestion ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{selectedQuestion.type}</Badge>
                  <Badge variant="secondary" className="capitalize">
                    {selectedQuestion.topic}
                  </Badge>
                  {selectedQuestion.difficulty && (
                    <Badge variant="purple">{selectedQuestion.difficulty}</Badge>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {formatClock(elapsed)}
                  </span>
                </div>
                <p className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 text-sm font-medium dark:from-blue-950/20 dark:to-purple-950/20">
                  {selectedQuestion.prompt}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pick one of the numbered questions above to start answering.
              </p>
            )}
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("type")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === "type"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Keyboard className="h-3.5 w-3.5" /> Type
              </button>
              <button
                type="button"
                onClick={() => setMode("voice")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === "voice"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mic className="h-3.5 w-3.5" /> Voice
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              {mode === "voice"
                ? "Speak your answer and get instant English feedback."
                : "Or switch to voice for live English feedback."}
            </span>
          </div>

          {mode === "voice" && selectedQuestion ? (
            <VoiceAnswerPanel
              prompt={selectedQuestion.prompt}
              value={answer}
              onChange={onAnswerChange}
              disabled={loading}
            />
          ) : null}

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
              disabled={questions.length === 0}
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
            disabled={loading || answer.length < 20 || !selectedQuestionId}
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
