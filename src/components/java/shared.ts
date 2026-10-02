import type { BadgeProps } from "@/components/ui/badge";
import type { JavaDifficulty } from "@/lib/java/runner";

export const DIFFICULTY_BADGE: Record<JavaDifficulty, BadgeProps["variant"]> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "destructive",
};

export const DIFFICULTY_DOT: Record<JavaDifficulty, string> = {
  EASY: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HARD: "bg-red-500",
};

export const DIFFICULTY_LABEL: Record<JavaDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};
