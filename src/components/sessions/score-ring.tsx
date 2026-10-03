"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  max = 5,
  size = 132,
  className,
}: {
  score: number;
  max?: number;
  size?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / max));

  useEffect(() => {
    let frame = 0;
    let frameId = 0;
    const frames = 24;
    const tick = () => {
      frame += 1;
      const eased = 1 - Math.pow(1 - frame / frames, 3);
      setDisplay(score * eased);
      if (frame < frames) frameId = requestAnimationFrame(tick);
      else setDisplay(score);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const tone =
    score >= 4.5
      ? "text-emerald-500"
      : score >= 3.5
        ? "text-blue-500"
        : score >= 2.5
          ? "text-amber-500"
          : "text-rose-500";

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={10}
          className="stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          className={cn("transition-all duration-700 ease-out", tone)}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={cn("font-mono text-3xl font-bold tabular-nums", tone)}>
            {display.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">out of {max}</div>
        </div>
      </div>
    </div>
  );
}
