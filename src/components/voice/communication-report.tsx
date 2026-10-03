"use client";

import { Gauge, MessageSquareText, Sparkles, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CommunicationBand, CommunicationReport } from "@/lib/voice/analysis";

const BAND_VARIANT: Record<
  CommunicationBand,
  "destructive" | "warning" | "info" | "success"
> = {
  "needs-work": "destructive",
  developing: "warning",
  solid: "info",
  confident: "success",
};

const BAND_LABEL: Record<CommunicationBand, string> = {
  "needs-work": "Needs work",
  developing: "Developing",
  solid: "Solid",
  confident: "Confident",
};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PartRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {value === null ? "n/a" : `${value}`}
        </span>
      </div>
      {/* An unknown measurement shows an empty track rather than a false zero. */}
      <Progress value={value ?? 0} className={value === null ? "opacity-40" : undefined} />
    </div>
  );
}

/**
 * Renders the browser-side English communication analysis.
 *
 * No model is involved: every number here comes from the deterministic scorer,
 * so this panel is instant and free.
 */
export function CommunicationReportView({ report }: { report: CommunicationReport }) {
  if (report.tooShort) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/30 p-4">
        <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Answer too short to analyse</p>
          <p className="text-xs text-muted-foreground">
            Speak for at least 25 words (roughly 10 seconds) to get feedback on pace,
            filler words and structure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg font-bold">English communication</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xl font-bold tabular-nums">
            {report.score}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
          <Badge variant={BAND_VARIANT[report.band]}>{BAND_LABEL[report.band]}</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Pace"
          value={report.wordsPerMinute === null ? "n/a" : `${report.wordsPerMinute}`}
          hint="words / min"
        />
        <Metric
          label="Fillers"
          value={`${report.fillersPer100Words}`}
          hint={`${report.fillerCount} total`}
        />
        <Metric
          label="STAR"
          value={`${report.starScore}/4`}
          hint="story elements covered"
        />
        <Metric
          label="Words"
          value={`${report.wordCount}`}
          hint={`${report.sentenceCount} sentences`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PartRow label="Pace" value={report.parts.pace} />
        <PartRow label="Fluency" value={report.parts.fluency} />
        <PartRow label="Structure" value={report.parts.structure} />
        <PartRow label="Language" value={report.parts.language} />
      </div>

      {report.strengths.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
            <Gauge className="h-3.5 w-3.5" /> What worked
          </p>
          <ul className="space-y-1">
            {report.strengths.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.improvements.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
            <TriangleAlert className="h-3.5 w-3.5" /> Work on next
          </p>
          <ul className="space-y-1">
            {report.improvements.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}