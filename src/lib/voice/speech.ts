// Thin, typed wrappers over the browser Web Speech APIs.
//
// Both APIs are built into the browser, which is what keeps the voice interview
// free: no API key, no per-minute billing, no data leaving the page other than
// what Chrome's own recogniser already sends.
//
// `SpeechRecognition` is still vendor-prefixed and absent in Firefox, so every
// entry point here is null-safe and the UI is expected to feature-detect.

export type SpeechRecognitionAlternativeLike = { transcript: string; confidence: number };
export type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};
export type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};
export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};
export type SpeechRecognitionErrorLike = { error: string; message?: string };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
};

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Returns the recogniser constructor, or null when unsupported / server-side. */
export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function speechSupport() {
  const recognition = getSpeechRecognition() !== null;
  const synthesis = getSpeechSynthesis() !== null;
  return {
    recognition,
    synthesis,
    /** Dictation is the hard requirement; playback alone is a bonus. */
    voiceInterview: recognition && synthesis,
    any: recognition || synthesis,
  };
}

/** Human-readable text for the error codes browsers actually emit. */
export function describeSpeechError(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow the microphone for this site, then try again.";
    case "no-speech":
      return "No speech was detected. Speak a little closer to the microphone.";
    case "audio-capture":
      return "No microphone was found. Connect one, or type your answer instead.";
    case "network":
      return "Speech recognition needs a network connection in this browser. You can still type your answer.";
    case "aborted":
      return "";
    default:
      return `Voice input stopped unexpectedly (${error}). You can type your answer instead.`;
  }
}

export type SpeakOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: () => void;
};

/**
 * Speaks `text`, replacing anything already playing.
 *
 * Chrome has a long-standing bug where a cancelled utterance never fires
 * `onend`, which would otherwise leave the UI stuck in a "speaking" state. The
 * watchdog covers that case so the interview can never deadlock on playback.
 */
export function speak(text: string, options: SpeakOptions = {}): () => void {
  const synth = getSpeechSynthesis();
  if (!synth || !text.trim()) {
    options.onEnd?.();
    return () => {};
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang ?? "en-US";
  // Slightly under default rate: candidates are often nervous, and slow TTS
  // makes the questions far easier to write notes against.
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    options.onEnd?.();
  };

  utterance.onend = finish;
  utterance.onerror = () => {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    options.onError?.();
  };

  // Generous ceiling: a 400 character question should never take this long.
  const watchdog = setTimeout(finish, Math.max(8000, text.length * 90));
  synth.speak(utterance);

  return () => {
    clearTimeout(watchdog);
    synth.cancel();
  };
}