import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-8 text-center animate-fade-in">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse-slow"></div>
              <Sparkles className="relative w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Master Your Interview Skills
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground font-light leading-relaxed">
            Practice with AI-powered feedback, detailed rubric scoring, and personalized progress tracking. 
            Transform your interview preparation into a structured, data-driven journey.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/sign-in">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
              Start Practicing
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300">
              View Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 animate-slide-up">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="font-serif text-xl">Structured Practice</CardTitle>
            <CardDescription className="text-base">
              Behavioral, technical, coding, and system design questions tailored to your role and experience level.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="font-serif text-xl">AI-Powered Evaluation</CardTitle>
            <CardDescription className="text-base">
              Get detailed scores on clarity, structure, correctness, and depth with actionable improvement suggestions.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="font-serif text-xl">Progress Tracking</CardTitle>
            <CardDescription className="text-base">
              Monitor your improvement over time with topic-level analytics and session history.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-8 animate-slide-up">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Quick Start</CardTitle>
            <CardDescription className="text-base">
              Enter the shared password to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="inline-block bg-white dark:bg-gray-800 rounded-lg px-6 py-4 shadow-md">
              <p className="font-mono text-sm text-muted-foreground mb-2">Access Password</p>
              <p className="font-mono text-lg font-semibold text-foreground">Use your configured password</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
