import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sessions/new", label: "New Session" },
  { href: "/java", label: "Java Lab" },
];

export async function Header() {
  const session = await auth();
  const identity = session?.user?.name || session?.user?.email || "";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-gradient font-serif text-xl font-bold">
            InterviewAI
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {session?.user ? (
            <div className="flex items-center gap-2.5 pl-2">
              <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50 py-1 pl-1 pr-3 dark:from-blue-950/30 dark:to-purple-950/30">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-[10px] font-bold uppercase text-white">
                  {identity.charAt(0)}
                </span>
                <span className="max-w-[10rem] truncate text-sm font-medium">
                  {identity}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="gap-2 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <Button
              asChild
              size="sm"
              className="btn-gradient shine shadow-lg shadow-purple-500/25 hover:shadow-xl"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
