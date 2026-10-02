import { AlertTriangle, CheckCircle2, Loader2, Terminal, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunSummary, TestResult } from "@/lib/java/runner";

export function ResultsPanel({
  running,
  requestError,
  compileError,
  summary,
  durationMs,
}: {
  running: boolean;
  requestError?: string | null;
  compileError?: string | null;
  summary?: RunSummary | null;
  durationMs?: number;
}) {
  if (running) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Compiling with javac and running every test case...
        </CardContent>
      </Card>
    );
  }

  if (requestError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="whitespace-pre-wrap">{requestError}</span>
        </CardContent>
      </Card>
    );
  }

  if (compileError) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-700 dark:text-amber-400">
            <Terminal className="h-4 w-4" /> Compile error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-black/80 p-3 font-mono text-xs leading-relaxed text-red-300">
            {compileError}
          </pre>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const perfect = summary.passed === summary.total && summary.total > 0;

  return (
    <Card className={`border-2 ${perfect ? "border-emerald-500/50" : "border-border"}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {perfect ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            {perfect ? "All tests passed" : "Some tests failed"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={perfect ? "success" : "warning"}>{summary.score}%</Badge>
            <Badge variant="purple">+{summary.xp} XP</Badge>
            {typeof durationMs === "number" && (
              <span className="font-mono text-xs text-muted-foreground">{durationMs} ms</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {summary.passed} of {summary.total} test cases passed
          {summary.results.some((r) => r.hidden) &&
            ` (${summary.results.filter((r) => r.hidden).length} hidden)`}
          .
        </p>
        <ul className="space-y-2">
          {summary.results.map((result, index) => (
            <TestRow key={`${result.label}-${index}`} result={result} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TestRow({ result }: { result: TestResult }) {
  return (
    <li className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          {result.passed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          {result.label}
        </span>
        <Badge variant={result.hidden ? "purple" : "outline"}>
          {result.hidden ? "hidden" : "example"}
        </Badge>
      </div>

      {!result.passed && (
        <div className="mt-2 space-y-1.5 font-mono text-xs">
          <Detail label="input" value={result.input} />
          <Detail label="expected" value={result.expected} />
          <Detail label="actual" value={result.actual} />
          {result.error && (
            <div className="rounded bg-destructive/10 p-2 text-destructive">
              <span className="font-sans font-semibold">error: </span>
              <span className="whitespace-pre-wrap">{result.error}</span>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">{value || "(empty)"}</span>
    </div>
  );
}
