"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  describeSpeechError,
  getSpeechRecognition,
  speak,
  speechSupport,
  type SpeakOptions,
  type SpeechRecognitionLike,
} from "@/lib/voice/speech";

export type RecorderStatus = "idle" | "starting" | "listening" | "processing";

export type RecorderState = {
  status: RecorderStatus;
  /** Finalised text so far. */
  transcript: string;
  /** In-progress guess, shown greyed out while the user is still talking. */
  interim: string;
  /** Populated when recognition fails; empty string when there is no problem. */
  error: string;
  /** True while the browser is still transcribing after the user stopped. */
  supported: boolean;
  synthesisSupported: boolean;
};

/**
 * Wraps `SpeechRecognition` with the behaviour a dictation UI needs.
 *
 * Two browser quirks drive the design:
 *  - Chrome ends a session on its own after a pause in speech, so we restart
 *    automatically while the user still intends to be recording.
 *  - Final and interim results arrive separately, so the caller needs both the
 *    settled transcript and the live guess.
 */
export function useDictation(lang = "en-US") {
  const [state, setState] = useState<RecorderState>({
    status: "idle",
    transcript: "",
    interim: "",
    error: "",
    supported: false,
    synthesisSupported: false,
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);

  // Browser APIs only exist client-side, so probe after mount.
  useEffect(() => {
    const support = speechSupport();
    setState((prev) => ({
      ...prev,
      supported: support.recognition,
      synthesisSupported: support.synthesis,
    }));
  }, []);

  // Always release the microphone when the component goes away.
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      // stop() flushes pending results; abort() would discard them.
      recognition.stop();
    }
    elapsedRef.current = Date.now() - startedAtRef.current;
    setState((prev) => ({ ...prev, status: "idle", interim: "" }));
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setState((prev) => ({ ...prev, error: "This browser does not support voice input. Type your answer instead." }));
      return;
    }
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      // Ask for the mic up front so the browser prompt is not a surprise.
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => stream.getTracks().forEach((track) => track.stop()))
        .catch(() => {
          setState((prev) => ({ ...prev, error: "Microphone permission was denied. Type your answer instead." }));
        });
    }

    wantListeningRef.current = true;
    startedAtRef.current = Date.now();

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += `${result[0].transcript.trim()} `;
        else interim += result[0].transcript;
      }
      setState((prev) => ({
        ...prev,
        transcript: finalText.trim(),
        interim: interim.trim(),
        status: "listening",
      }));
    };

    recognition.onerror = (event) => {
      const message = describeSpeechError(event.error);
      if (message) setState((prev) => ({ ...prev, error: message }));
      // "no-speech" and "aborted" are routine; keep listening where we can.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantListeningRef.current = false;
        setState((prev) => ({ ...prev, status: "idle" }));
      }
    };

    recognition.onend = () => {
      // Chrome fires onend after an internal timeout; resume if the user never
      // pressed stop, otherwise finalise.
      if (wantListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to idle if the browser refuses to restart.
        }
      }
      elapsedRef.current = Date.now() - startedAtRef.current;
      setState((prev) => ({ ...prev, status: "idle", interim: "" }));
    };

    recognitionRef.current = recognition;
    setState((prev) => ({ ...prev, status: "starting", error: "", transcript: "", interim: "" }));

    try {
      recognition.start();
    } catch {
      setState((prev) => ({ ...prev, status: "idle" }));
    }
  }, [lang]);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: "", interim: "", error: "" }));
    elapsedRef.current = 0;
  }, []);

  /** Milliseconds of speech recorded in the last take. */
  const elapsedMs = useCallback(() => elapsedRef.current, []);

  const say = useCallback((text: string, options?: SpeakOptions) => speak(text, options), []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  return {
    ...state,
    start,
    stop,
    reset,
    elapsedMs,
    say,
    stopSpeaking,
  };
}