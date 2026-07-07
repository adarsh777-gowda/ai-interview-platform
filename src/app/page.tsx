import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Practice interviews with AI feedback
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Build confidence for real interviews. Answer questions, get rubric-based scores, and track
          your progress over time.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/sign-in">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              View dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Structured practice</CardTitle>
            <CardDescription>Behavioral, technical, coding, and system design questions.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI evaluation</CardTitle>
            <CardDescription>Scores on clarity, structure, correctness, and depth.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress tracking</CardTitle>
            <CardDescription>Review past sessions and improve weak areas.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Demo account</CardTitle>
          <CardDescription>Use these credentials after seeding the database.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Email: demo@interviewai.dev</p>
          <p>Password: password123</p>
        </CardContent>
      </Card>
    </div>
  );
}
