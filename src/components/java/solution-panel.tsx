import { useState } from "react";
import { Eye, Loader2, Lock, HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Solution = { editorial: string; followUps: string[]; referenceCode: string | null };

export function SolutionPanel({
  problemId,
  onRevealed,
}: {
  problemId: string;
  onRevealed: () => void;
}) {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/java/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the solution");
      setSolution(data as Solution);
      onRevealed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the solution");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {solution ? <Eye className="h-4 w-4 text-purple-500" /> : <Lock className="h-4 w-4" />}
          Answer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!solution && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The answer (editorial, follow-ups and full reference code) stays hidden until you ask
              for it - nothing about it ships with the problem. Peeking marks this problem as
              used-solution, which blocks the <Badge variant="purple">No Peek</Badge> badge.
            </p>
            <Button type="button" variant="outline" onClick={reveal} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              {loading ? "Loading..." : "Show answer"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {solution && (
          <>
            <p className="text-sm leading-relaxed">{solution.editorial}</p>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HelpCircle className="h-3.5 w-3.5" /> Follow-up questions
              </p>
              <ul className="space-y-2">
                {solution.followUps.map((followUp, index) => (
                  <li key={index} className="flex gap-2 text-sm leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                    {followUp}
                  </li>
                ))}
              </ul>
            </div>

            {solution.referenceCode && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reference implementation
                </p>
                <pre className="max-h-96 overflow-auto rounded-md bg-black/85 p-3 font-mono text-xs leading-relaxed text-slate-100">
                  {solution.referenceCode}
                </pre>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
