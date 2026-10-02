import { CheckCircle2, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ClientJavaProblem, JavaCategorySummary } from "@/lib/java/problems";
import type { LabProgress } from "@/lib/java/progress";
import { problemXpCeiling } from "@/lib/java/progress";
import { DIFFICULTY_BADGE, DIFFICULTY_DOT, DIFFICULTY_LABEL } from "./shared";

export function ProblemList({
  categories,
  selectedId,
  progress,
  onSelect,
}: {
  categories: JavaCategorySummary[];
  selectedId: string;
  progress: LabProgress;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Problem set" className="space-y-5">
      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category.label}
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {category.problems.filter((p) => progress[p.id]?.solved).length}/
              {category.problems.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {category.problems.map((problem) => (
              <ProblemRow
                key={problem.id}
                problem={problem}
                solved={Boolean(progress[problem.id]?.solved)}
                selected={problem.id === selectedId}
                onSelect={() => onSelect(problem.id)}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ProblemRow({
  problem,
  solved,
  selected,
  onSelect,
}: {
  problem: ClientJavaProblem;
  solved: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={`w-full rounded-lg border px-3 py-2 text-left transition-all duration-200 ${
          selected
            ? "border-primary/60 bg-primary/5 shadow-sm"
            : "border-transparent hover:border-border hover:bg-accent"
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">
            {solved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/50" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium leading-tight">{problem.title}</span>
            <span className="mt-1 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${DIFFICULTY_DOT[problem.difficulty]}`} />
              <span className="text-[11px] text-muted-foreground">
                {DIFFICULTY_LABEL[problem.difficulty]}
              </span>
              <span className="text-[11px] text-muted-foreground">•</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                +{problemXpCeiling(problem)} XP
              </span>
            </span>
          </span>
          <Badge variant={DIFFICULTY_BADGE[problem.difficulty]} className="shrink-0 text-[10px]">
            {problem.difficulty[0]}
          </Badge>
        </div>
      </button>
    </li>
  );
}
