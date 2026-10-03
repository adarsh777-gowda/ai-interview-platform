"use client";

import { useEffect, useMemo, useState } from "react";
import { Headphones, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyseSpokenEnglish, type CommunicationReport } from "@/lib/voice/analysis";
import { CommunicationReportView } from "./communication-report";
import { useDictation } from "./use-dictation";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Voice answer capture: speaks the question, records the spoken answer, and
 * scores English communication locally.
 *
 * The transcript is pushed into the same `value` the typed textarea uses, so
 * switching between typing and speaking mid-session keeps one source of truth
 * and the user can always correct the recogniser by hand.
 */
export function VoiceAnswerPanel({
  prompt,
  value,
  onChange,
  disabled,
}: {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const dictation = useDictation();
  const [seconds, setSeconds] = useState(0);
  const [report, setReport] = useState<CommunicationReport | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const listening = dictation.status === "listening" || dictation.status === "starting";

  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [listening]);

  // Reset the clock and the report when a different question is shown.
  useEffect(() => {
    setSeconds(0);
    setReport(null);
    dictation.stopSpeaking();
    // `prompt` identifies the question. Re-running on every transcript change
    // would wipe the report while the user is still correcting words.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const unsupported = !dictation.supported;

  function handleStart() {
    setReport(null);
    setSeconds(0);
    dictation.reset();
    dictation.start();
  }

  function handleStop() {
    dictation.stop();
    const text = dictation.transcript.trim();
    if (text) {
      onChange(text);
      setReport(analyseSpokenEnglish({ text, durationMs: dictation.elapsedMs() }));
    }
  }

  function handleReplay() {
    if (!prompt) return;
    setSpeaking(true);
    dictation.say(prompt, { onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
  }

  const combined = useMemo(
    () =>
      dictation.interim
        ? `${dictation.transcript} ${dictation.interim}`.trim()
        : dictation.transcript,
    [dictation.transcript, dictation.interim]
  );
return (
    <div className="space-y-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Voice mode</p>
        </div>
        {dictation.synthesisSupported ? null : (
          <Badge variant="warning">No speech playback here</Badge>
        )}
        {dictation.supported ? null : <Badge variant="info">Dictation unavailable</Badge>}
      </div>

      <p className="text-xs text-muted-foreground">
        The question is read aloud and your answer is transcribed in the browser — no audio is
        stored and there is nothing to pay for.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !prompt}
          onClick={handleReplay}
          className="h-10 gap-2 border-2"
        >
          <Volume2 className={`h-4 w-4 ${speaking ? "animate-pulse" : ""}`} />
          {speaking ? "Reading…" : "Listen to question"}
        </Button>

        {listening ? (
          <Button type="button" size="sm" onClick={handleStop} className="h-10 gap-2">
            <MicOff className="h-4 w-4" /> Stop · {formatClock(seconds)}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={disabled || !dictation.supported}
            onClick={handleStart}
            className="btn-gradient h-10 gap-2"
          >
            <Mic className="h-4 w-4" /> Speak your answer
          </Button>
        )}

        {combined ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              dictation.reset();
              setReport(null);
              setSeconds(0);
            }}
            className="h-10 gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </Button>
        ) : null}
      </div>

      {dictation.error ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {dictation.error}
        </p>
      ) : null}

      {unsupported && !dictation.error ? (
        <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
          Chrome or Edge is needed for speech-to-text. You can still type your answer below.
        </p>
      ) : null}

      {combined ? (
        <div className="rounded-xl border bg-background/70 p-3 text-sm leading-relaxed">
          {dictation.transcript ? <span>{dictation.transcript} </span> : null}
          {dictation.interim ? (
            <span className="italic text-muted-foreground">{dictation.interim}</span>
          ) : null}
        </div>
      ) : null}

      {report ? <CommunicationReportView report={report} /> : null}
    </div>
  );
}