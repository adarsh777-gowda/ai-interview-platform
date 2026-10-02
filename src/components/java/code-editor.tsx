import { useRef } from "react";
import { Loader2, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CodeEditor({
  value,
  onChange,
  onRun,
  onReset,
  running,
}: {
  value: string;
  onChange: (next: string) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const lineCount = value.split("\n").length;

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/40 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="font-mono">Main.java</span>
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {lineCount} lines
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onReset} disabled={running}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={onRun}
            disabled={running}
            className="btn-gradient"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "Running..." : "Run tests"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          <div
            aria-hidden
            className="select-none border-r bg-muted/30 px-2 py-3 text-right font-mono text-xs leading-6 text-muted-foreground"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={ref}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Tab") {
                event.preventDefault();
                const target = event.currentTarget;
                const { selectionStart, selectionEnd } = target;
                const next = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;
                onChange(next);
                requestAnimationFrame(() => {
                  target.selectionStart = target.selectionEnd = selectionStart + 4;
                });
              }
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                onRun();
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Java source code"
            className="min-h-[420px] w-full resize-y bg-transparent px-3 py-3 font-mono text-sm leading-6 outline-none"
          />
        </div>
        <p className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Runs locally with <span className="font-mono">javac</span> +{" "}
          <span className="font-mono">java</span>. Press{" "}
          <kbd className="rounded border bg-background px-1 font-mono">Ctrl</kbd> +{" "}
          <kbd className="rounded border bg-background px-1 font-mono">Enter</kbd> to run.
        </p>
      </CardContent>
    </Card>
  );
}
