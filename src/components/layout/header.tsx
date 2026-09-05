import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, User } from "lucide-react";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <Sparkles className="relative w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-serif text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            InterviewAI
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link 
            href="/dashboard" 
            className="text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline underline-offset-4"
          >
            Dashboard
          </Link>
          <Link 
            href="/sessions/new" 
            className="text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline underline-offset-4"
          >
            New Session
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{session.user.name || session.user.email}</span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="submit"
                  className="border-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all duration-300 group"
                >
                  <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/sign-in">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
