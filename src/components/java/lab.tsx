"use client";

import { useEffect, useMemo, useState } from "react";
import { Terminal } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { JavaCategorySummary } from "@/lib/java/problems";
import type { RunSummary } from "@/lib/java/runner";
import { emptyRecord, type LabProgress, type LabRecord } from "@/lib/java/progress";
import { mergeProgress } from "@/lib/java/persist";
import { LabHud } from "./lab-hud";
import { ProblemList } from "./problem-list";
import { ProblemDetail } from "./problem-detail";
import { CodeEditor } from "./code-editor";
import { ResultsPanel } from "./results-panel";
import { SolutionPanel } from "./solution-panel";

const PROGRESS_KEY = "java-lab-progress-v1";
const DRAFT_KEY = "java-lab-drafts-v1";
const START_KEY = "java-lab-starts-v1";
const SELECTED_KEY = "java-lab-selected-v1";

type RunResponse = {
  compileError: string | null;
  summary: RunSummary;
  solved: boolean;
  durationMs: number;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked - the lab still works in memory.
  }
}

export function JavaLab({ categories }: { categories: JavaCategorySummary[] }) {
  const flat = useMemo(() => categories.flatMap((c) => c.problems), [categories]);
  const badgeInputs = useMemo(
    () => flat.map((p) => ({ id: p.id, difficulty: p.difficulty, category: p.category })),
    [flat]
  );

  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<LabProgress>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [starts, setStarts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string>(flat[0]?.id ?? "");
  const [running, setRunning] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [durationMs, setDurationMs] = useState<number | undefined>(undefined);
  const [justSolved, setJustSolved] = useState(false);

  const problem = flat.find((p) => p.id === selectedId) ?? flat[0];

  // Load saved progress once, after mount, so SSR and first client paint match.
  // Then reconcile with the account's copy on the server: whichever side is
  // further along wins, so switching devices never loses progress and anything
  // saved locally before this feature is migrated up on first load.
  useEffect(() => {
    const storedSelected = readJson<string>(SELECTED_KEY, "");
    const local = readJson<LabProgress>(PROGRESS_KEY, {});
    setProgress(local);
    setDrafts(readJson<Record<string, string>>(DRAFT_KEY, {}));
    setStarts(readJson<Record<string, number>>(START_KEY, {}));
    if (storedSelected && flat.some((p) => p.id === storedSelected)) {
      setSelectedId(storedSelected);
    }
    setHydrated(true);

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/java/progress");
        if (!response.ok) return;
        const data = (await response.json()) as { progress?: LabProgress };
        const server = data.progress ?? {};
        // Merge into the *current* state so a run that landed while we were
        // fetching is never clobbered by a stale server snapshot.
        if (!cancelled) setProgress((current) => mergeProgress(current, server));

        if (Object.keys(local).length > 0) {
          await fetch("/api/java/progress", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ progress: local }),
          });
        }
      } catch {
        // Offline or API unavailable - the lab still works from localStorage.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flat]);

  // Remember which problem is open, and when it was first opened.
  useEffect(() => {
    if (!hydrated || !problem) return;
    writeJson(SELECTED_KEY, problem.id);
    setStarts((prev) => {
      if (prev[problem.id]) return prev;
      const next = { ...prev, [problem.id]: Date.now() };
      writeJson(START_KEY, next);
      return next;
    });
  }, [hydrated, problem]);

  useEffect(() => {
    if (hydrated) writeJson(PROGRESS_KEY, progress);
  }, [hydrated, progress]);

  useEffect(() => {
    if (hydrated) writeJson(DRAFT_KEY, drafts);
  }, [hydrated, drafts]);

  function recordRun(outcome: RunResponse) {
    if (!problem) return;
    const now = Date.now();
    const openedAt = starts[problem.id] ?? now;
    setProgress((prev) => {
      const record: LabRecord = prev[problem.id] ?? emptyRecord();
      const solved = record.solved || outcome.solved;
      let bestDuration = record.bestDurationMs;
      const elapsed = now - openedAt;
      if (solved && (bestDuration === undefined || elapsed < bestDuration)) {
        bestDuration = elapsed;
      }
      return {
        ...prev,
        [problem.id]: {
          ...record,
          attempts: record.attempts + 1,
          best: Math.max(record.best, outcome.summary.score),
          xp: Math.max(record.xp, outcome.summary.xp),
          solved,
          lastRunAt: now,
          bestDurationMs: bestDuration,
        },
      };
    });
    setJustSolved(outcome.solved);
  }

  async function run() {
    if (!problem || running) return;
    setRunning(true);
    setRequestError(null);
    setCompileError(null);
    setSummary(null);
    setDurationMs(undefined);
    setJustSolved(false);

    try {
      const openedAt = starts[problem.id];
      // Reported so the server can keep the "Speedrunner" badge across devices;
      // clamped server-side, so it is cosmetic only.
      const elapsedMs =
        typeof openedAt === "number" && openedAt > 0 ? Date.now() - openedAt : undefined;

      const response = await fetch("/api/java/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          code: code,
          ...(elapsedMs !== undefined ? { elapsedMs } : {}),
        }),
      });
      const data = (await response.json()) as RunResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Run failed");

      if (data.compileError) {
        setCompileError(data.compileError);
      } else {
        setSummary(data.summary);
        setDurationMs(data.durationMs);
      }
      recordRun(data);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  function resetCode() {
    if (!problem) return;
    setDrafts((prev) => ({ ...prev, [problem.id]: problem.starterCode }));
  }

  function markRevealed() {
    if (!problem) return;
    setProgress((prev) => {
      const record = prev[problem.id] ?? emptyRecord();
      return { ...prev, [problem.id]: { ...record, usedSolution: true } };
    });
  }

  if (!hydrated) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Terminal className="h-4 w-4 animate-pulse" />
          Warming up the Java lab...
        </CardContent>
      </Card>
    );
  }

  if (!problem) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No problems are available yet.
        </CardContent>
      </Card>
    );
  }

  const code = drafts[problem.id] ?? problem.starterCode;
  const solved = Boolean(progress[problem.id]?.solved);

  return (
    <div className="space-y-6 animate-fade-in">
      <LabHud progress={progress} problems={badgeInputs} totalProblems={flat.length} />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <ProblemList
            categories={categories}
            selectedId={problem.id}
            progress={progress}
            onSelect={(id) => {
              setSelectedId(id);
              setRequestError(null);
              setCompileError(null);
              setSummary(null);
              setDurationMs(undefined);
              setJustSolved(false);
            }}
          />
        </aside>

        <main className="min-w-0 space-y-4">
          {justSolved && solved && (
            <div className="animate-pop-in rounded-lg border-2 border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              🎉 Fully solved - every example and hidden test passed. XP banked.
            </div>
          )}

          <ProblemDetail key={`detail-${problem.id}`} problem={problem} />
          <CodeEditor
            value={code}
            onChange={(next) => setDrafts((prev) => ({ ...prev, [problem.id]: next }))}
            onRun={run}
            onReset={resetCode}
            running={running}
          />
          <ResultsPanel
            running={running}
            requestError={requestError}
            compileError={compileError}
            summary={summary}
            durationMs={durationMs}
          />
          <SolutionPanel
            key={`solution-${problem.id}`}
            problemId={problem.id}
            onRevealed={markRevealed}
          />
        </main>
      </div>
    </div>
  );
}

