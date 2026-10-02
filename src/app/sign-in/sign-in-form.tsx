"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

function safeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid password");
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <div className="mb-8 text-center">
        <div className="mb-5 flex justify-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/30">
            <Sparkles className="h-9 w-9" />
          </div>
        </div>
        <h1 className="text-gradient-animated mb-2 font-serif text-3xl font-bold">
          Welcome Back
        </h1>
        <p className="text-muted-foreground">Enter the access password to continue</p>
      </div>
      
      <Card className="relative overflow-hidden border-2 bg-card/70 shadow-2xl shadow-purple-500/10 backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="font-serif text-2xl flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Sign In
          </CardTitle>
          <CardDescription>Use the shared password to access the interview platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCredentials} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 text-lg border-2 focus:border-primary transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="group h-12 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-lg text-white shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? (
                "Checking..."
              ) : (
                <>
                  Enter Platform
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
