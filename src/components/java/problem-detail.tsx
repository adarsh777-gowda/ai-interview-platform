import { useState } from "react";
import { Building2, Lightbulb, Target, TriangleAlert, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isBulletLine, parseStatement } from "@/lib/java/statement";
import type { ClientJavaProblem } from "@/lib/java/problems";
import { problemXpCeiling } from "@/lib/java/progress";
import { DIFFICULTY_BADGE, DIFFICULTY_LABEL } from "./shared";

const TABS = [
  { id: "statement", label: "Statement", icon: Target },
  { id: "approach", label: "Approach", icon: Lightbulb },
  { id: "elements", label: "Key signals", icon: ListChecks },
  { id: "pitfalls", label: "Pitfalls", icon: TriangleAlert },
  { id: "examples", label: "Examples", icon: ListChecks },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProblemDetail({ problem }: { problem: ClientJavaProblem }) {
  const [tab, setTab] = useState<TabId>("statement");

  return (
    <Card className="border-2">
      <CardHeader className="space-y-3 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl">{problem.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={DIFFICULTY_BADGE[problem.difficulty]}>
                {DIFFICULTY_LABEL[problem.difficulty]}
              </Badge>
              <Badge variant="purple">+{problemXpCeiling(problem)} XP</Badge>
              <Badge variant="outline">{problem.hiddenTestCount} hidden tests</Badge>
              {problem.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex max-w-full flex-wrap justify-end gap-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Asked at
              </span>
            {problem.companies.map((company) => (
              <Badge key={company} variant="info" className="font-normal">
                {company}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {tab === "statement" && <Statement prompt={problem.prompt} />}
        {tab === "approach" && <BulletList items={problem.approach} accent="text-blue-500" />}
        {tab === "elements" && <BulletList items={problem.keyElements} accent="text-emerald-500" />}
        {tab === "pitfalls" && (
          <BulletList items={problem.pitfalls} accent="text-amber-500" danger />
        )}
        {tab === "examples" && <ExampleList problem={problem} />}
      </CardContent>
    </Card>
  );
}

/** Small caps label that sits above each statement section. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
      {children}
    </p>
  );
}

/**
 * Renders a problem statement as labelled Goal / Input / Output / Constraints
 * blocks. Falls back to the raw prose for any prompt that is not in the
 * structured format, so old content still displays correctly.
 */
function Statement({ prompt }: { prompt: string }) {
  const { sections, structured } = parseStatement(prompt);

  if (!structured) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed">{prompt}</p>;
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const bullets = section.lines.filter(isBulletLine);
        const prose = section.lines.filter((line) => !isBulletLine(line));

        return (
          <section key={section.name} className="space-y-2">
            <SectionLabel>{section.name}</SectionLabel>

            {prose.map((line, index) => (
              <p key={index} className="text-sm leading-relaxed text-foreground">
                {line}
              </p>
            ))}

            {bullets.length > 0 && (
              <ul className="space-y-1.5">
                {bullets.map((line, index) => (
                  <li key={index} className="flex gap-2.5 text-sm leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{line.slice(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function BulletList({
  items,
  accent,
  danger,
}: {
  items: string[];
  accent: string;
  danger?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-sm leading-relaxed">
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              danger ? "bg-amber-500" : accent.replace("text-", "bg-")
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ExampleList({ problem }: { problem: ClientJavaProblem }) {
  const all = problem.examples;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {problem.hiddenTestCount} additional hidden test
        {problem.hiddenTestCount === 1 ? "" : "s"} run when you submit - their inputs are never
        shown.
      </p>
      {all.map((test, index) => (
        <div key={index} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{test.label}</span>
            <Badge variant="outline">visible</Badge>
          </div>
          <div className="grid gap-2 font-mono text-xs sm:grid-cols-2">
            <div className="rounded bg-muted p-2">
              <div className="mb-1 font-sans text-[10px] uppercase text-muted-foreground">input</div>
              <pre className="whitespace-pre-wrap">{test.input}</pre>
            </div>
            <div className="rounded bg-muted p-2">
              <div className="mb-1 font-sans text-[10px] uppercase text-muted-foreground">
                expected output
              </div>
              <pre className="whitespace-pre-wrap">{test.expected}</pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
