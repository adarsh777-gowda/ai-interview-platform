"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  clarity: "Clarity",
  structure: "Structure",
  correctness: "Correctness",
  depth: "Depth",
};

const COLORS: Record<string, string> = {
  clarity: "from-blue-500 to-blue-600",
  structure: "from-purple-500 to-purple-600",
  correctness: "from-emerald-500 to-emerald-600",
  depth: "from-pink-500 to-pink-600",
};

export function RubricBars({ scores }: { scores: Record<string, number> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-2.5">
      {Object.entries(scores).map(([key, value], index) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{LABELS[key] ?? key}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{value.toFixed(1)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                COLORS[key] ?? "from-blue-500 to-blue-600"
              )}
              style={{
                width: mounted ? `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` : "0%",
                transitionDelay: `${index * 90}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
