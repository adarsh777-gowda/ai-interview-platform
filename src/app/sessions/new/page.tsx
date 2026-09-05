"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Target, Tag, Play, Sparkles, Check } from "lucide-react";

const TOPIC_OPTIONS = [
  "leadership",
  "conflict",
  "javascript",
  "arrays",
  "scalability",
  "databases",
  "failure",
  "trees",
];

export default function NewSessionPage() {
  const router = useRouter();
  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState("MID");
  const [topics, setTopics] = useState<string[]>(["javascript"]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleTopic(topic: string) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, level, topics }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.formErrors?.join(", ") || "Failed to create session");
      }

      const session = await res.json();
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse-slow"></div>
            <Sparkles className="relative w-16 h-16 text-primary" />
          </div>
        </div>
        <h1 className="font-serif text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          New Interview Session
        </h1>
        <p className="text-muted-foreground">Configure your practice run. Questions are matched to your topics.</p>
      </div>

      <Card className="border-2 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="font-serif text-2xl flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Session Configuration
          </CardTitle>
          <CardDescription>Customize your interview practice experience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Target Role
              </Label>
              <Input 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                required 
                className="h-12 border-2 focus:border-primary transition-colors"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Experience Level
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-12 border-2 focus:border-primary transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="MID">Mid-level</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Topics <span className="text-muted-foreground font-normal">(select at least one)</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {TOPIC_OPTIONS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`group relative rounded-full border-2 px-4 py-2 text-sm capitalize transition-all duration-300 ${
                      topics.includes(topic)
                        ? "border-primary bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                        : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    {topics.includes(topic) && (
                      <Check className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full p-0.5" />
                    )}
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading || topics.length === 0}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
